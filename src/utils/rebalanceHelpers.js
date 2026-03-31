/**
 * rebalanceHelpers.js
 *
 * Pure helper functions for rebalancing logic, error detection, and
 * broker-specific payload construction.
 * Ported from prod-alphaquark-github web app for consistency.
 */

import CryptoJS from 'react-native-crypto-js';

/**
 * Check if funds data indicates an error or is missing.
 * @param {object} currentFunds - { status: 0|1|2, data: { availablecash } }
 * @param {string} brokerStatus - "connected" | "expired" | etc.
 * @returns {{ isError: boolean, reason: string|null }}
 */
export function isFundsErrorOrMissing(currentFunds, brokerStatus) {
  if (!currentFunds) {
    if (brokerStatus === 'connected') {
      return {isError: true, reason: 'funds_fetch_failed'};
    }
    return {isError: true, reason: 'not_connected'};
  }
  if (currentFunds.status === 1) {
    return {isError: true, reason: 'token_expired'};
  }
  if (currentFunds.status === 2) {
    return {isError: true, reason: 'backend_error'};
  }
  return {isError: false, reason: null};
}

/**
 * Check if rebalance API response is an error.
 */
export function isRebalanceErrorResponse(responseData) {
  if (!responseData) return false;
  return responseData.status === 1 || responseData.status === 2;
}

/**
 * Check if error is related to subscription amount.
 */
export function isSubscriptionAmountError(message) {
  if (!message || typeof message !== 'string') return false;
  const lower = message.toLowerCase();
  return (
    lower.includes('subscription amount') ||
    lower.includes('minimum investment') ||
    lower.includes('subscription_amount')
  );
}

/**
 * Check if error indicates insufficient balance.
 */
export function isLowAllowedBalanceError(message) {
  if (!message || typeof message !== 'string') return false;
  const lower = message.toLowerCase();
  return (
    lower.includes('low allowed balance') ||
    lower.includes('insufficient') ||
    lower.includes('not enough funds')
  );
}

/**
 * Detect portfolio shortfall from rebalance response.
 */
export function checkPortfolioShortfall(responseData) {
  if (!responseData) {
    return {isShortfall: false, hasTrades: false};
  }

  const hasBuy = Array.isArray(responseData.buy) && responseData.buy.length > 0;
  const hasSell =
    Array.isArray(responseData.sell) && responseData.sell.length > 0;
  const hasTrades = hasBuy || hasSell;

  const isShortfall =
    responseData.totalValue &&
    responseData.minInvestmentValue &&
    responseData.totalValue < responseData.minInvestmentValue;

  return {
    isShortfall: !!isShortfall,
    hasTrades,
    currentValue: responseData.totalValue || 0,
    requiredAmount: responseData.minInvestmentValue || 0,
  };
}

/**
 * Detect broker authentication errors in response messages.
 */
export function isBrokerAuthError(message) {
  if (!message || typeof message !== 'string') return false;
  const lower = message.toLowerCase();
  const authKeywords = [
    'invalid api key',
    'token expired',
    'session expired',
    'access token',
    'invalid token',
    'unauthorized',
    'authentication failed',
    'login required',
    'invalid credentials',
    'api key not found',
  ];
  return authKeywords.some(keyword => lower.includes(keyword));
}

/**
 * Build broker-specific payload fields for rebalance API calls.
 * Maps each broker's credentials to the format expected by the Python backend.
 *
 * @param {string} broker - Broker name
 * @param {object} credentials - User's broker credentials
 * @param {function} decryptFn - AES decryption function (optional)
 * @param {string} angelOneApiKey - Angel One API key from config
 * @returns {object} Broker-specific fields for API payload
 */
export function buildBrokerPayloadFields(
  broker,
  credentials,
  decryptFn,
  angelOneApiKey,
) {
  const decrypt = decryptFn || defaultDecrypt;

  switch (broker) {
    case 'Zerodha':
      return {
        accessToken: credentials.jwtToken,
      };

    case 'Angel One':
      return {
        apiKey: angelOneApiKey || credentials.apiKey,
        jwtToken: credentials.jwtToken,
      };

    case 'Upstox':
      return {
        apiKey: decrypt(credentials.apiKey),
        apiSecret: decrypt(credentials.secretKey),
        accessToken: credentials.jwtToken,
      };

    case 'ICICI Direct':
      return {
        apiKey: decrypt(credentials.apiKey),
        secretKey: decrypt(credentials.secretKey),
        accessToken: credentials.jwtToken,
      };

    case 'Dhan':
      return {
        clientId: credentials.clientCode,
        accessToken: credentials.jwtToken,
      };

    case 'Groww':
      return {
        accessToken: credentials.jwtToken,
      };

    case 'IIFL Securities':
      return {
        clientCode: credentials.clientCode,
      };

    case 'Kotak':
      return {
        consumerKey: decrypt(credentials.apiKey),
        consumerSecret: decrypt(credentials.secretKey),
        accessToken: credentials.jwtToken,
        sid: credentials.sid,
        serverId: credentials.serverId,
        viewToken: credentials.viewToken,
      };

    case 'Hdfc Securities':
      return {
        apiKey: decrypt(credentials.apiKey),
        accessToken: credentials.jwtToken,
      };

    case 'AliceBlue':
      return {
        clientId: credentials.clientCode,
        accessToken: credentials.jwtToken,
        apiKey: credentials.apiKey,
      };

    case 'Fyers':
      return {
        clientId: credentials.clientCode,
        accessToken: credentials.jwtToken,
      };

    case 'Motilal Oswal':
      return {
        clientCode: credentials.clientCode,
        accessToken: credentials.jwtToken,
        apiKey: decrypt(credentials.apiKey),
      };

    case 'Axis Securities':
      return {
        accessToken: credentials.jwtToken,
      };

    case 'DummyBroker':
      return {};

    default:
      console.warn(
        `[rebalanceHelpers] Unknown broker: ${broker}, sending minimal payload`,
      );
      return {
        accessToken: credentials.jwtToken,
      };
  }
}

// --- Internal helpers ---

export function defaultDecrypt(value) {
  if (!value) return value;
  try {
    const bytes = CryptoJS.AES.decrypt(value, 'ApiKeySecret');
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    return decrypted || value;
  } catch {
    return value;
  }
}
