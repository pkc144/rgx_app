/**
 * ProcessTrades.js
 *
 * Centralized trade processing utility.
 * Aligned with prod-alphaquark-github web app
 * (`src/Home/ProcessTrades/ProcessTrades.js`) for flow parity.
 *
 * Provides a unified pipeline for:
 * - Building broker-specific order payloads (incl. web-parity GTT leg shape)
 * - Separating GTT vs regular orders
 * - Routing to correct API endpoints
 * - Triggering TPIN/DDPI/EDIS modal callbacks on rejected SELL orders
 *   (no keyword filter — matches web which explicitly avoids that)
 * - Post-order refresh logic
 */

import CryptoJS from 'react-native-crypto-js';
import RNConfig from 'react-native-config';
import {server, ccxtServer} from './serverConfig';
import {generateToken} from './SecurityTokenManager';
import {getAdvisorSubdomain} from './variantHelper';

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
 * Rejection / cancellation / failure statuses from broker order responses.
 * Case-insensitive set matching web (ProcessTrades.js:363-373) — previously
 * mobile only caught `REJECTED` / `FAILURE` (uppercase exact), so responses
 * with `Rejected` / `cancelled` / `Failure` mixed case silently fell through.
 */
const REJECTED_ORDER_STATUSES = new Set([
  'REJECTED', 'Rejected', 'rejected',
  'CANCELLED', 'Cancelled', 'cancelled',
  'FAILURE', 'Failure', 'failure',
]);

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
      const gttBrokers = ['upstox', 'zerodha'];
      const gttOrders = stockDetails.filter(
        s => s.gttCheck === true && gttBrokers.includes(broker.toLowerCase()),
      );
      const regularOrders = stockDetails.filter(
        s => !(s.gttCheck === true && gttBrokers.includes(broker.toLowerCase())),
      );

      let allResults = [];

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
          configData,
        );

        if (Array.isArray(gttResponse)) {
          allResults = [...allResults, ...gttResponse];
        } else if (gttResponse?.response) {
          allResults = [...allResults, ...gttResponse.response];
        }
      }

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
          configData,
        );

        if (regularResponse?.response) {
          allResults = [...allResults, ...regularResponse.response];
        }

        if (regularResponse?.response && onTpinRequired) {
          const edisFailures = detectEdisFailures(
            regularResponse.response,
            stockDetails,
          );
          if (edisFailures.length > 0) {
            onTpinRequired(broker, edisFailures);
          }
        }

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
      if (err?.sessionExpired && onSessionExpired) {
        onSessionExpired();
        return {success: false, results: [], sessionExpired: true};
      }
      const message = err.message || 'Order placement failed';
      if (onError) {
        onError(message);
      }
      return {success: false, error: message, results: []};
    }
  };
}

function buildOrderPayload(
  broker,
  credentials,
  trades,
  userEmail,
  tradeGivenBy,
  configData,
  isGtt,
) {
  // GTT orders use web's per-trade leg structure (web ProcessTrades.js:93-144):
  //  - legs live INSIDE each trade object, not at the payload top level
  //  - field names: Symbol → tradingSymbol, Exchange → exchange, Type → transactionType
  //  - numeric fields (triggerPrice, ltp) are parseFloat-cast
  //  - quantity comes from stock.quantity, not from the leg
  if (isGtt) {
    const buildLeg = leg =>
      leg
        ? {
            tradingSymbol: leg.Symbol,
            exchange: leg.Exchange,
            transactionType: leg.Type,
            quantity: undefined,
            orderType: leg.OrderType,
            productType: leg.ProductType,
            price: parseFloat(leg.triggerPrice),
            triggerPrice: parseFloat(leg.triggerPrice),
            ltp: parseFloat(leg.ltp),
          }
        : undefined;

    const gttTrades = trades.map(stock => {
      const base = {
        trade_given_by: stock.trade_given_by || tradeGivenBy,
        user_broker: broker,
        user_email: userEmail,
        zerodhaTradeId: stock.zerodhaTradeId,
      };
      if (stock.entryLeg) {
        base.entryLeg = {...buildLeg(stock.entryLeg), quantity: stock.quantity};
      }
      if (stock.leg1) {
        base.leg1 = {...buildLeg(stock.leg1), quantity: stock.quantity};
      }
      if (stock.leg2) {
        base.leg2 = {...buildLeg(stock.leg2), quantity: stock.quantity};
      }
      return base;
    });

    return {
      trades: gttTrades,
      user_email: userEmail,
      user_broker: broker,
      gtt: true,
      ...getBrokerCredentials(broker, credentials, configData),
    };
  }

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

  return {
    trades: formattedTrades,
    user_email: userEmail,
    user_broker: broker,
    ...getBrokerCredentials(broker, credentials, configData),
  };
}

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
      return {accessToken: credentials.jwtToken};

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
        consumerKey: decrypt(credentials.apiKey),
        consumerSecret: decrypt(credentials.secretKey),
        accessToken: credentials.jwtToken,
        sid: credentials.sid,
        serverId: credentials.serverId || '',
        viewToken: credentials.viewToken,
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
        apiKey: decrypt(credentials.apiKey),
        clientCode: credentials.clientCode,
        accessToken: credentials.jwtToken,
      };

    case 'AliceBlue':
      return {
        clientCode: credentials.clientCode,
        apiKey: decrypt(credentials.apiKey),
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

async function executeOrder(url, payload, configData) {
  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Advisor-Subdomain':
          configData?.config?.REACT_APP_HEADER_NAME ||
          configData?.subdomain ||
          getAdvisorSubdomain(),
        'aq-encrypted-key': generateToken(
          RNConfig.REACT_APP_AQ_KEYS,
          RNConfig.REACT_APP_AQ_SECRET,
        ),
      },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    const networkErr = new Error(err?.message || 'Network error');
    networkErr.sessionExpired = true;
    networkErr.cause = err;
    throw networkErr;
  }

  if (response.status === 401 || response.status === 403) {
    const authErr = new Error(`Order API unauthorized: ${response.status}`);
    authErr.sessionExpired = true;
    authErr.status = response.status;
    throw authErr;
  }

  if (!response.ok) {
    throw new Error(`Order API error: ${response.status}`);
  }

  return await response.json();
}

/**
 * Return every rejected SELL from a response, without inspecting the error
 * message. Matches web (ProcessTrades.js:382-383 comment:
 * "Don't rely on CDSL keyword detection — error message formats can change").
 *
 * The previous mobile implementation required a substring match against a
 * fixed EDIS/CDSL keyword list, which silently failed when brokers tweaked
 * their rejection text. Dropping the keyword filter means the TPIN modal now
 * triggers on every rejected SELL, including genuine fund / market-hours
 * failures — accepted trade-off for reliability, matching web.
 */
function detectEdisFailures(orderResults, originalTrades) {
  return orderResults.filter(result => {
    if (!REJECTED_ORDER_STATUSES.has(result.orderStatus)) return false;
    const original = originalTrades.find(
      t =>
        t.tradingSymbol === result.tradingSymbol ||
        t.tradingSymbol === result.symbol,
    );
    return original?.transactionType === 'SELL';
  });
}

export function getBrokerUrlSlug(broker) {
  return BROKER_URL_MAP[broker] || broker.toLowerCase();
}

export default createPlaceOrderFunction;
