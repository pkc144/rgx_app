/**
 * Order Service - Unified API for order placement (React Native)
 *
 * This service provides a clean interface for placing strategy orders
 * that include entry + exit (SL/PT) in a single request.
 *
 * The backend automatically handles:
 * - Broker capability detection
 * - GTT/OCO fallbacks for unsupported brokers
 * - Sequential order placement when needed
 */

import Config from 'react-native-config';
import server from '../utils/serverConfig';
import {generateToken} from '../utils/SecurityTokenManager';
import {getAdvisorSubdomain} from '../utils/variantHelper';

const CCXT_BASE_URL = server.ccxtServer.baseUrl;

/**
 * Get headers for API requests
 */
const getHeaders = () => {
  return {
    'Content-Type': 'application/json',
    'X-Advisor-Subdomain': getAdvisorSubdomain(),
    'aq-encrypted-key': generateToken(
      Config.REACT_APP_AQ_KEYS,
      Config.REACT_APP_AQ_SECRET,
    ),
  };
};

/**
 * Fetch broker capabilities from backend
 *
 * @param {string} brokerName - Broker name
 * @returns {Promise<Object>} Broker capabilities
 */
export const fetchBrokerCapabilities = async (brokerName) => {
  try {
    const response = await fetch(
      `${CCXT_BASE_URL}order/broker-capabilities/${brokerName}`,
      {
        method: 'GET',
        headers: getHeaders(),
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch capabilities: ${response.statusText}`);
    }

    const data = await response.json();
    return data.success ? data.data : null;
  } catch (error) {
    console.error('Error fetching broker capabilities:', error);
    return null;
  }
};

/**
 * Fetch all broker capabilities
 *
 * @returns {Promise<Object>} All broker capabilities
 */
export const fetchAllBrokerCapabilities = async () => {
  try {
    const response = await fetch(`${CCXT_BASE_URL}order/broker-capabilities`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch capabilities: ${response.statusText}`);
    }

    const data = await response.json();
    return data.success ? data.data : null;
  } catch (error) {
    console.error('Error fetching all broker capabilities:', error);
    return null;
  }
};

/**
 * Place a strategy order (entry + exit orders)
 *
 * This is the main function for placing complex orders that include
 * entry order plus stop loss and/or profit target.
 *
 * @param {Object} orderConfig - Order configuration
 * @param {number} orderConfig.userId - User ID
 * @param {string} orderConfig.advisorDb - Advisor database name
 * @param {string} orderConfig.brokerName - Broker name
 * @param {Object} orderConfig.entry - Entry order details
 * @param {string} orderConfig.entry.symbol - Trading symbol
 * @param {string} orderConfig.entry.exchange - Exchange (NSE, BSE)
 * @param {string} orderConfig.entry.transactionType - BUY or SELL
 * @param {string} orderConfig.entry.orderType - MARKET, LIMIT, SL, SL_M
 * @param {number} orderConfig.entry.quantity - Quantity
 * @param {number} [orderConfig.entry.price] - Price (for LIMIT orders)
 * @param {number} [orderConfig.entry.triggerPrice] - Trigger price (for SL orders)
 * @param {string} [orderConfig.entry.productType] - CNC, MIS, NRML
 * @param {Object} [orderConfig.exitStrategy] - Exit strategy configuration
 * @param {Object} [orderConfig.exitStrategy.stopLoss] - Stop loss config
 * @param {number} [orderConfig.exitStrategy.stopLoss.price] - Stop loss price
 * @param {string} [orderConfig.exitStrategy.stopLoss.type] - GTT or DAY
 * @param {Object} [orderConfig.exitStrategy.profitTarget] - Profit target config
 * @param {number} [orderConfig.exitStrategy.profitTarget.price] - Target price
 * @param {string} [orderConfig.exitStrategy.profitTarget.type] - GTT or DAY
 * @param {boolean} [orderConfig.exitStrategy.ocoEnabled] - Enable OCO if both exits
 * @param {string} [orderConfig.fallbackPreference] - AUTO, REJECT, DAY_SL
 * @returns {Promise<Object>} Order result
 */
export const placeStrategyOrder = async (orderConfig) => {
  try {
    const payload = {
      userId: orderConfig.userId,
      advisorDb: orderConfig.advisorDb,
      brokerName: orderConfig.brokerName,
      strategy: {
        entry: {
          symbol: orderConfig.entry.symbol,
          exchange: orderConfig.entry.exchange || 'NSE',
          transactionType: orderConfig.entry.transactionType || 'BUY',
          orderType: orderConfig.entry.orderType || 'MARKET',
          quantity: orderConfig.entry.quantity,
          price: orderConfig.entry.price || 0,
          triggerPrice: orderConfig.entry.triggerPrice || 0,
          productType: orderConfig.entry.productType || 'CNC',
          segment: orderConfig.entry.segment || 'EQUITY',
          lastPrice: orderConfig.entry.lastPrice || 0,
          tradeId: orderConfig.entry.tradeId,
        },
        exitStrategy: orderConfig.exitStrategy
          ? {
              stopLoss: orderConfig.exitStrategy.stopLoss
                ? {
                    price: orderConfig.exitStrategy.stopLoss.price,
                    type: orderConfig.exitStrategy.stopLoss.type || 'GTT',
                  }
                : null,
              profitTarget: orderConfig.exitStrategy.profitTarget
                ? {
                    price: orderConfig.exitStrategy.profitTarget.price,
                    type: orderConfig.exitStrategy.profitTarget.type || 'GTT',
                  }
                : null,
              ocoEnabled:
                orderConfig.exitStrategy.ocoEnabled !== false ? true : false,
            }
          : null,
      },
      fallbackPreference: orderConfig.fallbackPreference || 'AUTO',
    };

    const response = await fetch(`${CCXT_BASE_URL}order/place-strategy`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    return {
      success: data.success,
      status: data.status,
      message: data.message,
      entryOrder: data.entry_order,
      entrySuccess: data.entry_success,
      exitOrders: data.exit_orders,
      exitSuccess: data.exit_success,
      warnings: data.warnings || [],
      fallbacksApplied: data.fallbacks_applied || [],
      brokerName: data.broker_name,
    };
  } catch (error) {
    console.error('Error placing strategy order:', error);
    return {
      success: false,
      status: 2,
      message: error.message || 'Failed to place strategy order',
      warnings: [],
      fallbacksApplied: [],
    };
  }
};

/**
 * Build strategy order config from trade object
 *
 * Converts the existing trade format to the new strategy format.
 *
 * @param {Object} trade - Trade object from existing code
 * @param {Object} userInfo - User information
 * @returns {Object} Strategy order config
 */
export const buildStrategyOrderFromTrade = (trade, userInfo) => {
  const hasStopLoss = trade.stopLoss && parseFloat(trade.stopLoss) > 0;
  const hasProfitTarget =
    trade.profitTarget && parseFloat(trade.profitTarget) > 0;
  const useGtt =
    trade.stopLossGttEnabled || trade.gttCheck || trade.orderType === 'GTT';

  return {
    userId: userInfo.userId,
    advisorDb: userInfo.advisorDb,
    brokerName: userInfo.brokerName || trade.user_broker,
    entry: {
      symbol: trade.Symbol || trade.tradingSymbol || trade.symbol,
      exchange: trade.Exchange || trade.exchange || 'NSE',
      transactionType: trade.Type || trade.transactionType || 'BUY',
      orderType: trade.OrderType || trade.orderType || 'MARKET',
      quantity: parseInt(trade.Quantity || trade.quantity || 0),
      price: parseFloat(trade.Price || trade.price || 0),
      triggerPrice: parseFloat(trade.triggerPrice || 0),
      productType: trade.ProductType || trade.productType || 'CNC',
      lastPrice: parseFloat(trade.ltp || trade.price_when_send_advice || 0),
      tradeId: trade.tradeId,
    },
    exitStrategy:
      hasStopLoss || hasProfitTarget
        ? {
            stopLoss: hasStopLoss
              ? {
                  price: parseFloat(trade.stopLoss),
                  type: useGtt ? 'GTT' : 'DAY',
                }
              : null,
            profitTarget: hasProfitTarget
              ? {
                  price: parseFloat(trade.profitTarget),
                  type: useGtt ? 'GTT' : 'DAY',
                }
              : null,
            ocoEnabled:
              trade.stopLossGttType === 'GTT_OCO' ||
              (hasStopLoss && hasProfitTarget && useGtt),
          }
        : null,
    fallbackPreference: 'AUTO',
  };
};

/**
 * Validate order configuration before placement
 *
 * @param {Object} orderConfig - Order configuration
 * @returns {Object} Validation result with errors and warnings
 */
export const validateStrategyOrder = (orderConfig) => {
  const errors = [];
  const warnings = [];

  // Required fields
  if (!orderConfig.userId) errors.push('User ID is required');
  if (!orderConfig.advisorDb) errors.push('Advisor DB is required');
  if (!orderConfig.brokerName) errors.push('Broker name is required');
  if (!orderConfig.entry) errors.push('Entry order is required');

  if (orderConfig.entry) {
    if (!orderConfig.entry.symbol) errors.push('Symbol is required');
    if (!orderConfig.entry.quantity || orderConfig.entry.quantity <= 0) {
      errors.push('Quantity must be greater than 0');
    }

    // Price validation
    const orderType = (orderConfig.entry.orderType || '').toUpperCase();
    if (orderType === 'LIMIT' && !orderConfig.entry.price) {
      errors.push('Price is required for LIMIT orders');
    }
    if (
      (orderType === 'SL' || orderType === 'SL_M') &&
      !orderConfig.entry.triggerPrice
    ) {
      errors.push('Trigger price is required for SL orders');
    }
  }

  // Exit strategy validation
  if (orderConfig.exitStrategy) {
    const {stopLoss, profitTarget} = orderConfig.exitStrategy;

    if (stopLoss && (!stopLoss.price || stopLoss.price <= 0)) {
      errors.push('Stop loss price must be greater than 0');
    }
    if (profitTarget && (!profitTarget.price || profitTarget.price <= 0)) {
      errors.push('Profit target price must be greater than 0');
    }

    // Logical validation for BUY orders
    if (orderConfig.entry?.transactionType?.toUpperCase() === 'BUY') {
      if (
        stopLoss?.price &&
        orderConfig.entry.price &&
        stopLoss.price >= orderConfig.entry.price
      ) {
        warnings.push('Stop loss should be below entry price for BUY orders');
      }
      if (
        profitTarget?.price &&
        orderConfig.entry.price &&
        profitTarget.price <= orderConfig.entry.price
      ) {
        warnings.push(
          'Profit target should be above entry price for BUY orders',
        );
      }
    }

    // Logical validation for SELL orders
    if (orderConfig.entry?.transactionType?.toUpperCase() === 'SELL') {
      if (
        stopLoss?.price &&
        orderConfig.entry.price &&
        stopLoss.price <= orderConfig.entry.price
      ) {
        warnings.push('Stop loss should be above entry price for SELL orders');
      }
      if (
        profitTarget?.price &&
        orderConfig.entry.price &&
        profitTarget.price >= orderConfig.entry.price
      ) {
        warnings.push(
          'Profit target should be below entry price for SELL orders',
        );
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
};

/**
 * Get human-readable order status
 *
 * @param {Object} orderResult - Result from placeStrategyOrder
 * @returns {Object} Status summary
 */
export const getOrderStatusSummary = (orderResult) => {
  if (!orderResult) {
    return {type: 'error', message: 'No order result'};
  }

  const {success, status, entrySuccess, exitSuccess, warnings} = orderResult;

  if (success) {
    return {
      type: 'success',
      message: 'Strategy order placed successfully',
      details: {
        entry: entrySuccess ? 'Placed' : 'Failed',
        exits: exitSuccess ? 'Placed' : 'Partial/Failed',
      },
    };
  }

  if (status === 1) {
    // Partial success
    return {
      type: 'warning',
      message: 'Order partially completed',
      details: {
        entry: entrySuccess ? 'Placed' : 'Failed',
        exits: exitSuccess ? 'Placed' : 'Failed',
        warnings,
      },
    };
  }

  return {
    type: 'error',
    message: orderResult.message || 'Order placement failed',
  };
};

/**
 * Preview a strategy order BEFORE placing it
 *
 * This shows the user exactly what will happen based on their broker's
 * capabilities. Call this before the confirmation dialog.
 *
 * @param {Object} orderConfig - Same as placeStrategyOrder
 * @returns {Promise<Object>} Preview with warnings and expected behavior
 */
export const previewStrategyOrder = async (orderConfig) => {
  try {
    const payload = {
      userId: orderConfig.userId,
      advisorDb: orderConfig.advisorDb,
      brokerName: orderConfig.brokerName,
      strategy: {
        entry: {
          symbol: orderConfig.entry.symbol,
          exchange: orderConfig.entry.exchange || 'NSE',
          transactionType: orderConfig.entry.transactionType || 'BUY',
          orderType: orderConfig.entry.orderType || 'MARKET',
          quantity: orderConfig.entry.quantity,
          price: orderConfig.entry.price || 0,
          triggerPrice: orderConfig.entry.triggerPrice || 0,
          productType: orderConfig.entry.productType || 'CNC',
        },
        exitStrategy: orderConfig.exitStrategy
          ? {
              stopLoss: orderConfig.exitStrategy.stopLoss
                ? {
                    price: orderConfig.exitStrategy.stopLoss.price,
                    type: orderConfig.exitStrategy.stopLoss.type || 'GTT',
                  }
                : null,
              profitTarget: orderConfig.exitStrategy.profitTarget
                ? {
                    price: orderConfig.exitStrategy.profitTarget.price,
                    type: orderConfig.exitStrategy.profitTarget.type || 'GTT',
                  }
                : null,
              ocoEnabled:
                orderConfig.exitStrategy.ocoEnabled !== false ? true : false,
            }
          : null,
      },
    };

    const response = await fetch(`${CCXT_BASE_URL}order/preview-strategy`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    return {
      success: data.success,
      preview: data.preview,
      canProceed: data.canProceed,
      confirmationRequired: data.confirmationRequired,
      confirmationMessage: data.confirmationMessage,
      validationErrors: data.validationErrors || [],
    };
  } catch (error) {
    console.error('Error previewing strategy order:', error);
    return {
      success: false,
      canProceed: false,
      confirmationRequired: false,
      validationErrors: [error.message || 'Failed to preview order'],
    };
  }
};

/**
 * Build preview from trade object (for use with existing trade format)
 *
 * @param {Object} trade - Trade object from existing code
 * @param {Object} userInfo - User information
 * @returns {Promise<Object>} Preview result
 */
export const previewTradeOrder = async (trade, userInfo) => {
  const orderConfig = buildStrategyOrderFromTrade(trade, userInfo);
  return previewStrategyOrder(orderConfig);
};

/**
 * Format preview for display in UI
 *
 * @param {Object} preview - Preview object from previewStrategyOrder
 * @returns {Object} Formatted data for UI display
 */
export const formatPreviewForDisplay = (preview) => {
  if (!preview || !preview.preview) {
    return null;
  }

  const {preview: p} = preview;

  return {
    // Broker info
    broker: {
      name: p.broker?.name || 'Unknown',
      supportsGTT: p.broker?.gttSupported || false,
      supportsOCO: p.broker?.ocoSupported || false,
    },

    // Entry order summary
    entry: {
      description: p.entry?.description || '',
      symbol: p.entry?.symbol,
      action: p.entry?.action,
      quantity: p.entry?.quantity,
      price: p.entry?.price,
      orderType: p.entry?.orderType,
    },

    // Exit strategy summary
    exit: p.exitStrategy
      ? {
          type: p.exitStrategy.type,
          behavior: p.exitStrategy.behavior,
          behaviorColor: p.exitStrategy.behaviorColor || 'gray',
          behaviorIcon: p.exitStrategy.behaviorIcon || 'info',
          stopLoss: p.exitStrategy.stopLoss,
          profitTarget: p.exitStrategy.profitTarget,
        }
      : null,

    // Step-by-step sequence
    orderSequence: p.orderSequence || [],

    // Warnings
    warnings: p.warnings || [],
    hasWarnings: (p.warnings || []).length > 0,
    hasErrors: (p.warnings || []).some((w) => w.type === 'error'),

    // Broker notes
    brokerNotes: p.brokerNotes,

    // Confirmation
    confirmationRequired: preview.confirmationRequired,
    confirmationMessage: preview.confirmationMessage,
    canProceed: preview.canProceed,
    validationErrors: preview.validationErrors || [],
  };
};

const orderService = {
  fetchBrokerCapabilities,
  fetchAllBrokerCapabilities,
  placeStrategyOrder,
  buildStrategyOrderFromTrade,
  validateStrategyOrder,
  getOrderStatusSummary,
  previewStrategyOrder,
  previewTradeOrder,
  formatPreviewForDisplay,
};

export default orderService;
