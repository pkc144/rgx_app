/**
 * BrokerOrderBookAPI.js
 * Unified API for fetching order book and cancelling orders across all brokers
 */

import axios from 'axios';
import CryptoJS from 'react-native-crypto-js';
import server from '../utils/serverConfig';
import Config from 'react-native-config';
import {generateToken} from '../utils/SecurityTokenManager';

/**
 * Decrypt API key/secret from stored encrypted value
 */
const decryptCredential = (encryptedValue) => {
  try {
    if (!encryptedValue) return null;
    const bytes = CryptoJS.AES.decrypt(encryptedValue, 'ApiKeySecret');
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    return decrypted || null;
  } catch (error) {
    console.error('[BrokerOrderBookAPI] Decryption error:', error.message);
    return null;
  }
};

/**
 * Normalize order status across different brokers to standard values
 */
export const normalizeOrderStatus = (status, broker) => {
  if (!status) return 'unknown';

  const statusLower = status.toLowerCase();

  // Completed/Executed statuses
  if (['complete', 'completed', 'traded', 'filled', 'executed'].includes(statusLower)) {
    return 'complete';
  }

  // Pending/Open statuses
  if (['open', 'pending', 'trigger pending', 'trigger_pending', 'requested', 'ordered', 'transit', 'am', 'after market'].includes(statusLower)) {
    return 'pending';
  }

  // Rejected statuses
  if (['rejected', 'failed', 'failure', 'error'].includes(statusLower)) {
    return 'rejected';
  }

  // Cancelled statuses
  if (['cancelled', 'canceled', 'cancelled by user', 'cancelled by system'].includes(statusLower)) {
    return 'cancelled';
  }

  // Partial fill
  if (['partially filled', 'partial', 'partially_filled'].includes(statusLower)) {
    return 'partial';
  }

  return statusLower;
};

/**
 * Build request payload based on broker type
 */
const buildOrderBookPayload = (broker, credentials) => {
  const {
    clientCode,
    apiKey,
    jwtToken,
    secretKey,
    sid,
    viewToken,
    serverId,
  } = credentials;

  const zerodhaApiKey = Config.REACT_APP_ZERODHA_API_KEY;
  const angelApi = Config.REACT_APP_ANGEL_ONE_API_KEY;

  switch (broker) {
    case 'IIFL Securities':
      return {
        url: `${server.ccxtServer.baseUrl}iifl/order-book`,
        data: {clientCode},
      };

    case 'ICICI Direct':
      if (!apiKey || !jwtToken || !secretKey) {
        throw new Error('ICICI Direct: Missing required credentials');
      }
      return {
        url: `${server.ccxtServer.baseUrl}icici/order-book`,
        data: {
          apiKey: decryptCredential(apiKey),
          accessToken: jwtToken,
          secretKey: decryptCredential(secretKey),
        },
      };

    case 'Upstox':
      if (!apiKey || !jwtToken || !secretKey) {
        throw new Error('Upstox: Missing required credentials');
      }
      return {
        url: `${server.ccxtServer.baseUrl}upstox/order-book`,
        data: {
          apiKey: decryptCredential(apiKey),
          accessToken: jwtToken,
          apiSecret: decryptCredential(secretKey),
        },
      };

    case 'Angel One':
      if (!jwtToken) {
        throw new Error('Angel One: Missing jwtToken');
      }
      return {
        url: `${server.ccxtServer.baseUrl}angelone/order-book`,
        data: {
          apiKey: angelApi,
          accessToken: jwtToken,
        },
      };

    case 'Zerodha':
      if (!jwtToken) {
        throw new Error('Zerodha: Missing jwtToken');
      }
      return {
        url: `${server.ccxtServer.baseUrl}zerodha/order-book`,
        data: {
          apiKey: decryptCredential(apiKey) || zerodhaApiKey,
          secretkey: decryptCredential(secretKey),
          accessToken: jwtToken,
        },
      };

    case 'Hdfc Securities':
      if (!apiKey || !jwtToken) {
        throw new Error('HDFC Securities: Missing required credentials');
      }
      return {
        url: `${server.ccxtServer.baseUrl}hdfc/order-book`,
        data: {
          apiKey: decryptCredential(apiKey),
          accessToken: jwtToken,
        },
      };

    case 'Kotak':
      if (!jwtToken || !apiKey || !secretKey || !sid) {
        throw new Error('Kotak: Missing required credentials');
      }
      return {
        url: `${server.ccxtServer.baseUrl}kotak/order-book`,
        data: {
          consumerKey: decryptCredential(apiKey),
          consumerSecret: decryptCredential(secretKey),
          accessToken: jwtToken,
          sid,
          serverId: serverId || '',
        },
      };

    case 'Dhan':
      if (!clientCode || !jwtToken) {
        throw new Error('Dhan: Missing required credentials');
      }
      return {
        url: `${server.ccxtServer.baseUrl}dhan/order-book`,
        data: {
          clientId: clientCode,
          accessToken: jwtToken,
        },
      };

    case 'AliceBlue':
      if (!clientCode || !jwtToken || !apiKey) {
        throw new Error('AliceBlue: Missing required credentials');
      }
      return {
        url: `${server.ccxtServer.baseUrl}aliceblue/order-book`,
        data: {
          clientId: clientCode,
          apiKey: apiKey,
          accessToken: jwtToken,
        },
      };

    case 'Fyers':
      if (!jwtToken) {
        throw new Error('Fyers: Missing jwtToken');
      }
      return {
        url: `${server.ccxtServer.baseUrl}fyers/order-book`,
        data: {
          clientId: clientCode,
          accessToken: jwtToken,
        },
      };

    case 'Motilal Oswal':
      if (!jwtToken) {
        throw new Error('Motilal Oswal: Missing jwtToken');
      }
      const cleanToken = jwtToken.replace(/^Bearer\s+/i, '');
      return {
        url: `${server.ccxtServer.baseUrl}motilal-oswal/order-book`,
        data: {
          apiKey: decryptCredential(apiKey),
          clientCode: clientCode,
          accessToken: cleanToken,
        },
      };

    default:
      throw new Error(`Unsupported broker: ${broker}`);
  }
};

/**
 * Build cancel order payload based on broker type
 */
const buildCancelOrderPayload = (broker, credentials, orderId, orderDetails = {}) => {
  const {
    clientCode,
    apiKey,
    jwtToken,
    secretKey,
    sid,
    viewToken,
    serverId,
  } = credentials;

  const zerodhaApiKey = Config.REACT_APP_ZERODHA_API_KEY;
  const angelApi = Config.REACT_APP_ANGEL_ONE_API_KEY;

  switch (broker) {
    case 'IIFL Securities':
      return {
        url: `${server.ccxtServer.baseUrl}iifl/cancel-order`,
        data: {
          clientCode,
          orderId,
        },
      };

    case 'ICICI Direct':
      return {
        url: `${server.ccxtServer.baseUrl}icici/order-cancel`,
        data: {
          apiKey: decryptCredential(apiKey),
          accessToken: jwtToken,
          secretKey: decryptCredential(secretKey),
          orderId,
        },
      };

    case 'Upstox':
      return {
        url: `${server.ccxtServer.baseUrl}upstox/cancel-order`,
        data: {
          apiKey: decryptCredential(apiKey),
          accessToken: jwtToken,
          apiSecret: decryptCredential(secretKey),
          orderId,
        },
      };

    case 'Angel One':
      return {
        url: `${server.ccxtServer.baseUrl}angelone/cancel-order`,
        data: {
          apiKey: angelApi,
          accessToken: jwtToken,
          variety: orderDetails.variety || 'NORMAL',
          orderId,
        },
      };

    case 'Zerodha':
      return {
        url: `${server.ccxtServer.baseUrl}zerodha/cancel-order`,
        data: {
          apiKey: decryptCredential(apiKey) || zerodhaApiKey,
          accessToken: jwtToken,
          orderId,
          order: orderDetails,
        },
      };

    case 'Hdfc Securities':
      return {
        url: `${server.ccxtServer.baseUrl}hdfc/order-cancel`,
        data: {
          apiKey: decryptCredential(apiKey),
          accessToken: jwtToken,
          orderId,
        },
      };

    case 'Kotak':
      return {
        url: `${server.ccxtServer.baseUrl}kotak/order-cancel`,
        data: {
          consumerKey: decryptCredential(apiKey),
          consumerSecret: decryptCredential(secretKey),
          accessToken: jwtToken,
          sid,
          serverId: serverId || '',
          orderId,
        },
      };

    case 'Dhan':
      return {
        url: `${server.ccxtServer.baseUrl}dhan/cancel-order`,
        data: {
          clientId: clientCode,
          accessToken: jwtToken,
          orderId,
        },
      };

    case 'AliceBlue':
      return {
        url: `${server.ccxtServer.baseUrl}aliceblue/cancel-order`,
        data: {
          clientId: clientCode,
          apiKey: apiKey,
          accessToken: jwtToken,
          orderId,
        },
      };

    case 'Fyers':
      return {
        url: `${server.ccxtServer.baseUrl}fyers/cancel-order`,
        data: {
          clientId: clientCode,
          accessToken: jwtToken,
          orderId,
        },
      };

    case 'Motilal Oswal':
      const cleanToken = jwtToken.replace(/^Bearer\s+/i, '');
      return {
        url: `${server.ccxtServer.baseUrl}motilal-oswal/cancel-order`,
        data: {
          apiKey: decryptCredential(apiKey),
          clientCode: clientCode,
          accessToken: cleanToken,
          orderId,
        },
      };

    default:
      throw new Error(`Unsupported broker: ${broker}`);
  }
};

/**
 * Standard headers for all API calls
 */
const getHeaders = (configData) => ({
  'Content-Type': 'application/json',
  'X-Advisor-Subdomain': configData?.config?.REACT_APP_HEADER_NAME || Config.REACT_APP_HEADER_NAME,
  'aq-encrypted-key': generateToken(
    Config.REACT_APP_AQ_KEYS,
    Config.REACT_APP_AQ_SECRET,
  ),
});

/**
 * Normalize order data from different broker formats
 */
const normalizeOrder = (order, broker) => {
  // Different brokers return orders in different formats
  // This function normalizes them to a common structure

  // Common field mappings
  const orderId = order.orderId || order.order_id || order.uniqueOrderId || order.uniqueorderid || order.oms_order_id;
  const symbol = order.tradingSymbol || order.tradingsymbol || order.trading_symbol || order.symbol || order.Symbol;
  const exchange = order.exchange || order.Exchange || order.exch;
  const transactionType = order.transactionType || order.transaction_type || order.trantype || order.type || order.Type;
  const quantity = order.quantity || order.Quantity || order.qty || order.totalQty;
  const filledQuantity = order.filledQuantity || order.filledQty || order.filled_quantity || order.tradedQty || 0;
  const price = order.price || order.Price || order.averagePrice || order.avgPrice || 0;
  const orderType = order.orderType || order.order_type || order.priceType || 'MARKET';
  const status = order.status || order.orderStatus || order.order_status || 'unknown';
  const placedAt = order.orderTimestamp || order.order_timestamp || order.exchOrderTime || order.updateTime || new Date().toISOString();
  const variety = order.variety || order.productType || order.product_type || 'NORMAL';

  return {
    orderId,
    symbol,
    exchange,
    transactionType: transactionType?.toUpperCase(),
    quantity: parseInt(quantity) || 0,
    filledQuantity: parseInt(filledQuantity) || 0,
    pendingQuantity: (parseInt(quantity) || 0) - (parseInt(filledQuantity) || 0),
    price: parseFloat(price) || 0,
    orderType,
    status,
    normalizedStatus: normalizeOrderStatus(status, broker),
    placedAt,
    variety,
    rawOrder: order, // Keep original for debugging
  };
};

/**
 * Fetch order book from broker
 * @param {string} broker - Broker name
 * @param {object} credentials - Broker credentials
 * @param {object} configData - Config data for headers
 * @returns {Promise<Array>} - Array of normalized orders
 */
export const fetchOrderBook = async (broker, credentials, configData = null) => {
  try {
    console.log('[BrokerOrderBookAPI] Fetching order book for:', broker);

    const {url, data} = buildOrderBookPayload(broker, credentials);

    const response = await axios.post(url, JSON.stringify(data), {
      headers: getHeaders(configData),
      timeout: 30000, // 30 second timeout
    });

    console.log('[BrokerOrderBookAPI] Response received for:', broker);

    // Handle different response structures
    let orders = [];
    if (response.data) {
      if (Array.isArray(response.data)) {
        orders = response.data;
      } else if (response.data.orders) {
        orders = response.data.orders;
      } else if (response.data.data) {
        orders = Array.isArray(response.data.data) ? response.data.data : [];
      } else if (response.data.orderBook) {
        orders = response.data.orderBook;
      }
    }

    // Normalize all orders
    const normalizedOrders = orders.map(order => normalizeOrder(order, broker));

    console.log(`[BrokerOrderBookAPI] Found ${normalizedOrders.length} orders for ${broker}`);

    return normalizedOrders;
  } catch (error) {
    console.error('[BrokerOrderBookAPI] Error fetching order book:', broker);
    console.error('[BrokerOrderBookAPI] Error:', error.message);
    if (error.response) {
      console.error('[BrokerOrderBookAPI] Response status:', error.response.status);
      console.error('[BrokerOrderBookAPI] Response data:', error.response.data);
    }
    throw error;
  }
};

/**
 * Get pending orders only
 * @param {string} broker - Broker name
 * @param {object} credentials - Broker credentials
 * @param {object} configData - Config data for headers
 * @returns {Promise<Array>} - Array of pending orders
 */
export const fetchPendingOrders = async (broker, credentials, configData = null) => {
  const allOrders = await fetchOrderBook(broker, credentials, configData);
  return allOrders.filter(order => order.normalizedStatus === 'pending');
};

/**
 * Cancel an order
 * @param {string} broker - Broker name
 * @param {object} credentials - Broker credentials
 * @param {string} orderId - Order ID to cancel
 * @param {object} orderDetails - Additional order details (variety, etc.)
 * @param {object} configData - Config data for headers
 * @returns {Promise<object>} - Cancel response
 */
export const cancelOrder = async (broker, credentials, orderId, orderDetails = {}, configData = null) => {
  try {
    console.log('[BrokerOrderBookAPI] Cancelling order:', orderId, 'for broker:', broker);

    const {url, data} = buildCancelOrderPayload(broker, credentials, orderId, orderDetails);

    const response = await axios.post(url, JSON.stringify(data), {
      headers: getHeaders(configData),
      timeout: 30000,
    });

    console.log('[BrokerOrderBookAPI] Cancel response:', response.data);

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error('[BrokerOrderBookAPI] Error cancelling order:', orderId);
    console.error('[BrokerOrderBookAPI] Error:', error.message);
    return {
      success: false,
      error: error.message,
      response: error.response?.data,
    };
  }
};

/**
 * Get order status for a specific order
 * @param {string} broker - Broker name
 * @param {object} credentials - Broker credentials
 * @param {string} orderId - Order ID
 * @param {object} configData - Config data for headers
 * @returns {Promise<object>} - Order with current status
 */
export const getOrderStatus = async (broker, credentials, orderId, configData = null) => {
  try {
    // First try to get from order book (more reliable)
    const allOrders = await fetchOrderBook(broker, credentials, configData);
    const order = allOrders.find(o => o.orderId === orderId);

    if (order) {
      return order;
    }

    // Order not found in order book
    return null;
  } catch (error) {
    console.error('[BrokerOrderBookAPI] Error getting order status:', error.message);
    throw error;
  }
};

/**
 * Find pending orders for a specific symbol
 * @param {Array} orders - Array of orders
 * @param {string} symbol - Trading symbol
 * @param {string} transactionType - BUY or SELL
 * @returns {Array} - Matching pending orders
 */
export const findPendingOrdersForSymbol = (orders, symbol, transactionType = null) => {
  return orders.filter(order => {
    const symbolMatch = order.symbol?.toUpperCase() === symbol?.toUpperCase();
    const isPending = order.normalizedStatus === 'pending';
    const typeMatch = transactionType
      ? order.transactionType?.toUpperCase() === transactionType.toUpperCase()
      : true;

    return symbolMatch && isPending && typeMatch;
  });
};

export default {
  fetchOrderBook,
  fetchPendingOrders,
  cancelOrder,
  getOrderStatus,
  normalizeOrderStatus,
  findPendingOrdersForSymbol,
};
