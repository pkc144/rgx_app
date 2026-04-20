/**
 * brokerPublisher.js
 *
 * Broker Publisher SDK utilities for React Native.
 * Adapted from prod-alphaquark-github web app.
 *
 * In React Native, the publisher SDK is loaded inside a WebView
 * (see KitePublisherModal). These utilities handle the data
 * preparation layer outside the WebView.
 */

import {ccxtServer} from './serverConfig';
import {generateToken} from './SecurityTokenManager';
import Config from './Config';

export const PUBLISHER_SUPPORTED_BROKERS = ['Zerodha', 'Fyers'];

export const BROKER_PUBLISHER_CONFIG = {
  Zerodha: {
    scriptUrl: 'https://kite.trade/publisher.js?v=3',
    globalVar: 'KiteConnect',
    maxBasketSize: 60,
    appName: 'Kite',
  },
  Fyers: {
    scriptUrl: 'https://api-connect-docs.fyers.in/fyers-lib.js',
    globalVar: 'Fyers',
    maxBasketSize: 10,
    appName: 'FYERS',
  },
};

/**
 * Check if a broker supports publisher SDK flow.
 */
export function isPublisherSupported(broker) {
  return PUBLISHER_SUPPORTED_BROKERS.includes(broker);
}

/**
 * Get publisher API key for a broker.
 */
export function getPublisherApiKey(broker, userBrokerClientCode) {
  if (broker === 'Zerodha') {
    return Config.REACT_APP_ZERODHA_API_KEY || '';
  }
  if (broker === 'Fyers') {
    return userBrokerClientCode || '';
  }
  return '';
}

/**
 * Get user-facing broker app name.
 */
export function getBrokerAppName(broker) {
  return BROKER_PUBLISHER_CONFIG[broker]?.appName || broker;
}

/**
 * Convert symbols to Zerodha trading format via CCXT API.
 * @param {string[]} symbols - Array of symbols to convert
 * @returns {Promise<object>} Symbol map: { "SBIN-EQ": { zerodha_symbol, exchange, lot_size } }
 */
export async function convertSymbolsToZerodha(symbols) {
  try {
    const token = generateToken(Config.AQ_KEY, Config.AQ_SECRET);
    const response = await fetch(`${ccxtServer}zerodha/convert-symbol`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({symbols}),
    });

    if (!response.ok) {
      throw new Error(`Symbol conversion failed: ${response.status}`);
    }

    return await response.json();
  } catch (err) {
    console.error('[brokerPublisher] convertSymbolsToZerodha error:', err);
    return {};
  }
}

/**
 * Create order batches based on broker's max basket size.
 */
export function createBatches(stockDetails, broker) {
  const config = BROKER_PUBLISHER_CONFIG[broker];
  if (!config) return [stockDetails];

  const maxSize = config.maxBasketSize;
  const batches = [];
  for (let i = 0; i < stockDetails.length; i += maxSize) {
    batches.push(stockDetails.slice(i, i + maxSize));
  }
  return batches;
}

/**
 * Separate GTT orders from regular orders.
 * Publisher SDKs don't support GTT, so these must go through regular API.
 */
export function separateGttOrders(stockDetails) {
  const gtt = stockDetails.filter(s => s.gttCheck === true);
  const regular = stockDetails.filter(s => !s.gttCheck);
  return {regular, gtt};
}

/**
 * Map order type to Kite SDK format.
 */
function mapKiteOrderType(orderType) {
  if (!orderType) return 'MARKET';
  const upper = orderType.toUpperCase();
  if (upper === 'MARKET') return 'MARKET';
  if (upper === 'LIMIT') return 'LIMIT';
  if (upper === 'SL' || upper === 'SL_M' || upper === 'STOP') return 'SL';
  return 'MARKET';
}

/**
 * Map order type to Fyers SDK format.
 */
function mapFyersOrderType(orderType) {
  if (!orderType) return 'MARKET';
  const upper = orderType.toUpperCase();
  if (upper === 'MARKET') return 'MARKET';
  if (upper === 'LIMIT') return 'LIMIT';
  if (upper === 'SL' || upper === 'STOP') return 'STOP';
  if (upper === 'SL_M' || upper === 'STOPLIMIT') return 'STOPLIMIT';
  return 'MARKET';
}

/**
 * Map product type to Kite SDK format.
 */
function mapKiteProductType(productType) {
  if (!productType) return 'CNC';
  const upper = productType.toUpperCase();
  if (upper === 'DELIVERY' || upper === 'CNC') return 'CNC';
  if (upper === 'INTRADAY' || upper === 'MIS') return 'MIS';
  if (upper === 'BO') return 'BO';
  if (upper === 'CO') return 'CO';
  return 'CNC';
}

/**
 * Map product type to Fyers SDK format.
 */
function mapFyersProductType(productType) {
  if (!productType) return 'CNC';
  const upper = productType.toUpperCase();
  if (upper === 'DELIVERY' || upper === 'CNC') return 'CNC';
  if (upper === 'INTRADAY' || upper === 'MIS') return 'INTRADAY';
  if (upper === 'BO') return 'BO';
  if (upper === 'CO') return 'CO';
  if (upper === 'MARGIN') return 'MARGIN';
  return 'CNC';
}

/**
 * Convert a stock to Kite/Fyers basket item format.
 */
export function convertToBasketItem(broker, stock, symbolMap) {
  if (broker === 'Zerodha') {
    const symbolInfo = symbolMap?.[stock.tradingSymbol] || {};
    // Strip -EQ suffix if present for Zerodha symbol
    let tradingsymbol = symbolInfo.zerodha_symbol || stock.tradingSymbol;
    if (tradingsymbol.endsWith('-EQ')) {
      tradingsymbol = tradingsymbol.replace(/-EQ$/, '');
    }
    return {
      tradingsymbol,
      exchange: stock.exchange || 'NSE',
      transaction_type: stock.transactionType,
      quantity: stock.quantity,
      order_type: mapKiteOrderType(stock.orderType),
      product: mapKiteProductType(stock.productType),
      price: stock.price || 0,
      trigger_price: stock.triggerPrice || 0,
      variety: 'regular',
      readonly: false,
      tag: stock.zerodhaTradeId || stock.tradeId || '',
    };
  }

  if (broker === 'Fyers') {
    const tradingSymbol = stock.tradingSymbol.endsWith('-EQ')
      ? stock.tradingSymbol
      : `${stock.tradingSymbol}-EQ`;
    const orderType = mapFyersOrderType(stock.orderType);
    const item = {
      symbol: `${stock.exchange || 'NSE'}:${tradingSymbol}`,
      quantity: parseInt(stock.quantity || stock.qty, 10) || 1,
      transaction_type: (stock.transactionType || 'BUY').toUpperCase(),
      order_type: orderType,
      product: mapFyersProductType(stock.productType),
      disclosed_quantity: 0,
    };
    // Only set price fields for relevant order types
    if (orderType === 'LIMIT' || orderType === 'STOPLIMIT') {
      item.price = stock.price || 0;
    }
    if (orderType === 'STOP' || orderType === 'STOPLIMIT') {
      item.stop_price = stock.triggerPrice || 0;
    }
    return item;
  }

  return stock;
}

/**
 * Get the endpoint for recording publisher-placed orders.
 */
export function getPublisherRecordEndpoint(broker, baseUrl) {
  const base = baseUrl || ccxtServer;
  if (broker === 'Zerodha') {
    return `${base}api/zerodha/publisher/record-orders`;
  }
  if (broker === 'Fyers') {
    return `${base}api/fyers/publisher/record-orders`;
  }
  return `${base}api/publisher/record-orders`;
}

/**
 * Map publisher callback order statuses to normalized statuses.
 */
export const SUCCESS_ORDER_MAPPING = {
  success: 'COMPLETE',
  COMPLETE: 'COMPLETE',
  TRADED: 'COMPLETE',
  FILLED: 'COMPLETE',
  failed: 'REJECTED',
  REJECTED: 'REJECTED',
  cancelled: 'CANCELLED',
  CANCELLED: 'CANCELLED',
};

/**
 * Poll constants for publisher fallback.
 */
export const PUBLISHER_POLL_CONFIG = {
  POLL_INTERVAL_MS: 5000,
  POLL_TIMEOUT_MS: 90000,
};
