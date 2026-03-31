/**
 * ProcessTrades.js
 *
 * Centralized trade processing utility.
 * Ported from prod-alphaquark-github web app for consistency.
 *
 * Provides a unified pipeline for:
 * - Building broker-specific order payloads
 * - Separating GTT vs regular orders
 * - Routing to correct API endpoints
 * - Handling EDIS/TPIN/DDPI modal triggers on sell failures
 * - Post-order refresh logic
 */

import CryptoJS from 'react-native-crypto-js';
import {server, ccxtServer} from './serverConfig';
import {generateToken} from './SecurityTokenManager';
import Config from './Config';

/**
 * Broker URL slug mapping for GTT/process-trades endpoints.
 */
const BROKER_URL_MAP = {
  Zerodha: 'zerodha/api',
  'Angel One': 'angelone',
  Upstox: 'upstox',
  'ICICI Direct': 'icici',
  Kotak: 'kotak',
  Dhan: 'dhan',
  Fyers: 'fyers',
  'IIFL Securities': 'iifl',
  AliceBlue: 'aliceblue',
  'Hdfc Securities': 'hdfc',
  Groww: 'groww',
  'Motilal Oswal': 'motilal-oswal',
  'Axis Securities': 'axis',
};

/**
 * EDIS/TPIN error keywords indicating sell authorization needed.
 */
const EDIS_ERROR_KEYWORDS = [
  'cdsl',
  'edis',
  'tpin',
  'ddpi',
  'demat',
  'authorization required',
  'not authorized for sell',
  'poa',
  'mandate',
];

/**
 * Create a reusable order placement function with broker-specific configuration.
 *
 * @param {object} config
 * @param {string} config.broker - Broker name
 * @param {object} config.credentials - User's broker credentials
 * @param {string} config.userEmail - User email
 * @param {string} config.tradeGivenBy - Advisor email
 * @param {object} config.configData - App config data
 * @param {function} [config.onTpinRequired] - Callback when TPIN/EDIS modal needed (broker, failedOrders)
 * @param {function} [config.onSessionExpired] - Callback when token expired
 * @param {function} [config.onComplete] - Callback on success (results)
 * @param {function} [config.onError] - Callback on error (message)
 * @returns {function} Async function that places orders: (stockDetails) => Promise<response>
 */
export function createPlaceOrderFunction({
  broker,
  credentials,
  userEmail,
  tradeGivenBy,
  configData,
  onTpinRequired,
  onSessionExpired,
  onComplete,
  onError,
}) {
  return async function placeOrders(stockDetails) {
    try {
      // Separate GTT and regular orders — only Upstox and Zerodha support GTT via dedicated endpoint
      const gttBrokers = ['upstox', 'zerodha'];
      const gttOrders = stockDetails.filter(
        s => s.gttCheck === true && gttBrokers.includes(broker.toLowerCase()),
      );
      const regularOrders = stockDetails.filter(
        s => !(s.gttCheck === true && gttBrokers.includes(broker.toLowerCase())),
      );

      let allResults = [];

      // Place GTT orders via broker-specific endpoint
      if (gttOrders.length > 0) {
        const gttPayload = buildOrderPayload(
          broker,
          credentials,
          gttOrders,
          userEmail,
          tradeGivenBy,
          configData,
          true,
        );

        const brokerUrl = BROKER_URL_MAP[broker] || broker.toLowerCase();
        const gttResponse = await executeOrder(
          `${ccxtServer}${brokerUrl}/process-trades`,
          gttPayload,
        );

        if (gttResponse?.response) {
          allResults = [...allResults, ...gttResponse.response];
        }
      }

      // Place regular orders via unified endpoint
      if (regularOrders.length > 0) {
        const regularPayload = buildOrderPayload(
          broker,
          credentials,
          regularOrders,
          userEmail,
          tradeGivenBy,
          configData,
          false,
        );

        const regularResponse = await executeOrder(
          `${server}api/process-trades/order-place`,
          regularPayload,
        );

        if (regularResponse?.response) {
          allResults = [...allResults, ...regularResponse.response];
        }

        // Check for EDIS/TPIN failures on SELL orders
        if (regularResponse?.response && onTpinRequired) {
          const edisFailures = detectEdisFailures(
            regularResponse.response,
            stockDetails,
          );
          if (edisFailures.length > 0) {
            onTpinRequired(broker, edisFailures);
          }
        }

        // Check for session expiry
        if (regularResponse?.sessionExpired && onSessionExpired) {
          onSessionExpired();
          return {success: false, results: allResults, sessionExpired: true};
        }
      }

      if (onComplete) {
        onComplete(allResults);
      }

      return {success: true, results: allResults};
    } catch (err) {
      const message = err.message || 'Order placement failed';
      if (onError) {
        onError(message);
      }
      return {success: false, error: message, results: []};
    }
  };
}

/**
 * Build broker-specific order payload.
 */
function buildOrderPayload(
  broker,
  credentials,
  trades,
  userEmail,
  tradeGivenBy,
  configData,
  isGtt,
) {
  const formattedTrades = trades.map(stock => ({
    user_email: userEmail,
    trade_given_by: tradeGivenBy,
    tradingSymbol: stock.tradingSymbol,
    transactionType: stock.transactionType,
    exchange: stock.exchange,
    segment: stock.segment || 'EQUITY',
    productType: stock.productType || 'DELIVERY',
    orderType: stock.orderType || 'MARKET',
    price: stock.price || 0,
    quantity: stock.quantity,
    priority: stock.priority || 0,
    tradeId: stock.tradeId,
    zerodhaTradeId: stock.zerodhaTradeId,
    token: stock.token || stock.symbolToken,
    user_broker: broker,
  }));

  const payload = {
    trades: formattedTrades,
    user_email: userEmail,
    user_broker: broker,
    ...getBrokerCredentials(broker, credentials, configData),
  };

  if (isGtt) {
    payload.gtt = true;
    // Add GTT leg details if present
    if (trades[0]?.entryLeg) payload.entryLeg = trades[0].entryLeg;
    if (trades[0]?.leg1) payload.leg1 = trades[0].leg1;
    if (trades[0]?.leg2) payload.leg2 = trades[0].leg2;
  }

  return payload;
}

/**
 * Get broker-specific credentials for order payload.
 */
function getBrokerCredentials(broker, credentials, configData) {
  const decrypt = val => {
    if (!val) return val;
    try {
      const bytes = CryptoJS.AES.decrypt(val, 'ApiKeySecret');
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);
      return decrypted || val;
    } catch {
      return val;
    }
  };

  const angelOneApiKey =
    configData?.apiKeys?.angelOneApiKey ||
    configData?.REACT_APP_ANGEL_ONE_API_KEY ||
    '';

  switch (broker) {
    case 'Zerodha':
      return {jwtToken: credentials.jwtToken};

    case 'Angel One':
      return {
        apiKey: angelOneApiKey,
        accessToken: credentials.jwtToken,
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

    case 'Kotak':
      return {
        apiKey: credentials.apiKey,
        secretKey: credentials.secretKey,
        jwtToken: credentials.jwtToken,
        sid: credentials.sid,
        serverId: credentials.serverId,
      };

    case 'IIFL Securities':
      return {clientCode: credentials.clientCode, jwtToken: credentials.jwtToken};

    case 'Dhan':
      return {
        clientCode: credentials.clientCode,
        accessToken: credentials.jwtToken,
      };

    case 'Fyers':
      return {
        clientCode: credentials.clientCode,
        accessToken: credentials.jwtToken,
      };

    case 'Motilal Oswal':
      return {
        apiKey: credentials.apiKey,
        clientCode: credentials.clientCode,
        jwtToken: credentials.jwtToken,
      };

    case 'AliceBlue':
      return {
        clientCode: credentials.clientCode,
        apiKey: credentials.apiKey,
        accessToken: credentials.jwtToken,
      };

    case 'Hdfc Securities':
      return {
        apiKey: decrypt(credentials.apiKey),
        accessToken: credentials.jwtToken,
      };

    case 'Groww':
      return {accessToken: credentials.jwtToken};

    case 'Axis Securities':
      return {
        authToken: credentials.jwtToken,
        subAccountId: credentials.clientCode,
      };

    default:
      return {accessToken: credentials.jwtToken};
  }
}

/**
 * Execute an order API call.
 */
async function executeOrder(url, payload) {
  const token = generateToken(Config.AQ_KEY, Config.AQ_SECRET);
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Order API error: ${response.status}`);
  }

  return await response.json();
}

/**
 * Detect EDIS/TPIN failures from order results.
 */
function detectEdisFailures(orderResults, originalTrades) {
  return orderResults.filter(result => {
    if (result.orderStatus === 'REJECTED' || result.orderStatus === 'FAILURE') {
      const message = (result.message || '').toLowerCase();
      const isEdisError = EDIS_ERROR_KEYWORDS.some(kw => message.includes(kw));
      if (isEdisError) {
        const original = originalTrades.find(
          t =>
            t.tradingSymbol === result.tradingSymbol ||
            t.tradingSymbol === result.symbol,
        );
        return original?.transactionType === 'SELL';
      }
    }
    return false;
  });
}

/**
 * Get the broker URL slug for API endpoints.
 */
export function getBrokerUrlSlug(broker) {
  return BROKER_URL_MAP[broker] || broker.toLowerCase();
}

export default createPlaceOrderFunction;
