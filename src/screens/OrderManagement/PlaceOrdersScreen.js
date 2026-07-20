import React, {useState, useMemo, useCallback} from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  ScrollView,
  Alert,
  Dimensions,
  RefreshControl,
} from 'react-native';
import axios from 'axios';
import Config from 'react-native-config';
import Icon from 'react-native-vector-icons/AntDesign';
import MaterialIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  ChevronDown,
  ChevronUp,
  RefreshCw,
  ShoppingBasket,
  TrendingUp,
  X as XIcon,
  Edit3,
  XCircle,
} from 'lucide-react-native';

import server from '../../utils/serverConfig';
import {generateToken} from '../../utils/SecurityTokenManager';
import {getAdvisorSubdomain} from '../../utils/variantHelper';
import {
  isOrderSuccess,
  isOrderRejected,
  isOrderPending,
  normalizeOrderStatus,
  getOrderStatusDisplay,
} from '../../utils/orderStatusUtils';
import {getAccountEmail} from '../../utils/accountEmail';

const {width} = Dimensions.get('window');

// Broker endpoint mapping
const BROKER_ENDPOINTS = {
  'Angel One': 'angelone',
  Zerodha: 'zerodha',
  Upstox: 'upstox',
  Dhan: 'dhan',
  Fyers: 'fyers',
  'ICICI Direct': 'icici',
  Kotak: 'kotak',
  Groww: 'groww',
  'HDFC Securities': 'hdfc',
  IIFL: 'iifl',
  AliceBlue: 'aliceblue',
  'Motilal Oswal': 'motilal-oswal',
};

// Format date/time for display
const FormatDateTime = dateString => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '-';
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

// Check if order is open/pending (eligible for cancel/modify)
const isOrderOpen = status => {
  const statusLower = status?.toLowerCase();
  return (
    statusLower === 'open' ||
    statusLower === 'requested' ||
    statusLower === 'ordered' ||
    statusLower === 'pending'
  );
};

// Determine trade type for filtering
const getTradeType = trade => {
  if (trade.basketId && trade.basket_advice) return 'basket';

  const exchange = (trade?.Exchange || trade?.exchange || '').toUpperCase();
  if (exchange === 'NFO' || exchange === 'BFO') return 'fno';

  const symbol = trade?.Symbol || trade?.tradingSymbol || '';
  if (
    /(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\d+.*?(CE|PE|FUT)$/i.test(
      symbol,
    )
  ) {
    return 'fno';
  }

  return 'equity';
};

// Get effective broker for a trade (handles basket trades)
const getEffectiveBroker = trade => {
  if (trade.user_broker) return trade.user_broker;
  if (trade.basket_advice && trade.basket_advice.length > 0) {
    const itemWithBroker = trade.basket_advice.find(item => item.user_broker);
    if (itemWithBroker) return itemWithBroker.user_broker;
  }
  return null;
};

// Build auth headers for API calls
const getAuthHeaders = () => ({
  'Content-Type': 'application/json',
  'X-Advisor-Subdomain': getAdvisorSubdomain(),
  'aq-encrypted-key': generateToken(
    Config.REACT_APP_AQ_KEYS,
    Config.REACT_APP_AQ_SECRET,
  ),
});

// Check if a response indicates token expiry
const isTokenExpired = responseData => {
  return (
    responseData?.warning?.type === 'TOKEN_EXPIRED' ||
    responseData?.data?.tokenExpired ||
    responseData?.tokenExpired ||
    responseData?.data?.brokerConnected === false
  );
};

// Check if an error response indicates token expiry
const isTokenExpiredError = error => {
  return (
    error.response?.status === 401 ||
    error.response?.data?.tokenExpired ||
    error.response?.data?.warning?.type === 'TOKEN_EXPIRED' ||
    error.response?.data?.data?.tokenExpired ||
    error.response?.data?.data?.brokerConnected === false ||
    error.response?.data?.message?.toLowerCase()?.includes('token') ||
    error.response?.data?.message?.toLowerCase()?.includes('session')
  );
};

const PlaceOrdersScreen = ({
  orders = [],
  userDetails,
  broker,
  configData,
  onRefreshComplete,
  navigation,
}) => {
  const userEmail = getAccountEmail();

  // State
  const [expandedBaskets, setExpandedBaskets] = useState(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshingOrderIds, setRefreshingOrderIds] = useState(new Set());
  const [cancellingOrderIds, setCancellingOrderIds] = useState(new Set());

  // Modify order modal state
  const [showModifyModal, setShowModifyModal] = useState(false);
  const [modifyingTrade, setModifyingTrade] = useState(null);
  const [newPrice, setNewPrice] = useState('');
  const [isModifying, setIsModifying] = useState(false);

  // Filter state
  const [selectedBroker, setSelectedBroker] = useState('all');
  const [selectedType, setSelectedType] = useState('all');

  // Pull-to-refresh
  const [pullRefreshing, setPullRefreshing] = useState(false);

  // Helper to get clientCode for a broker from userDetails
  const getClientCodeForBroker = useCallback(
    brokerName => {
      if (!brokerName || !userDetails) return null;

      if (userDetails.user_broker === brokerName && userDetails.clientCode) {
        return userDetails.clientCode;
      }

      if (
        userDetails.connected_brokers &&
        Array.isArray(userDetails.connected_brokers)
      ) {
        const found = userDetails.connected_brokers.find(
          cb => cb.broker === brokerName,
        );
        if (found) return found.clientCode;
      }

      return null;
    },
    [userDetails],
  );

  // Toggle basket expansion
  const toggleBasket = useCallback(basketId => {
    setExpandedBaskets(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(basketId)) {
        newExpanded.delete(basketId);
      } else {
        newExpanded.add(basketId);
      }
      return newExpanded;
    });
  }, []);

  // ==================== API Actions ====================

  // Refresh all orders
  const handleRefreshAll = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);

    try {
      const apiKeyToUse =
        broker === 'Angel One'
          ? Config.REACT_APP_ANGEL_ONE_API_KEY
          : userDetails?.apiKey;

      const statusResponse = await axios.post(
        `${server.server.baseUrl}api/process-trades/orders/refresh-status`,
        {
          user_email: userEmail,
          user_broker: broker,
          jwtToken: userDetails?.jwtToken,
          apiKey: apiKeyToUse,
          secretKey: userDetails?.secretKey,
          clientCode: userDetails?.clientCode,
        },
        {headers: getAuthHeaders()},
      );

      if (isTokenExpired(statusResponse.data)) {
        Alert.alert(
          'Session Expired',
          `${broker} session expired. Please reconnect your broker.`,
          [{text: 'OK'}],
        );
        setIsRefreshing(false);
        return;
      }

      if (onRefreshComplete) {
        await onRefreshComplete();
      }
      Alert.alert('Success', 'Orders refreshed successfully');
    } catch (error) {
      if (isTokenExpiredError(error)) {
        Alert.alert(
          'Session Expired',
          `${broker} session expired. Please reconnect your broker.`,
          [{text: 'OK'}],
        );
      } else {
        Alert.alert('Error', 'Failed to refresh orders');
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  // Refresh single order status
  const handleRefreshOrder = async trade => {
    const orderId = trade?.orderId || trade?.uniqueorderid;
    const tradeBroker = trade?.user_broker || broker;
    if (!orderId || !tradeBroker) return;

    const brokerEndpoint = BROKER_ENDPOINTS[tradeBroker];
    if (!brokerEndpoint) {
      Alert.alert('Error', `Broker ${tradeBroker} not supported for status check`);
      return;
    }

    setRefreshingOrderIds(prev => new Set([...prev, orderId]));

    try {
      const response = await axios.post(
        `${server.ccxtServer.baseUrl}${brokerEndpoint}/v2/single-order-status`,
        {
          user_email: userEmail,
          orderId: orderId,
        },
        {headers: getAuthHeaders()},
      );

      if (isTokenExpired(response.data)) {
        Alert.alert(
          'Session Expired',
          `${tradeBroker} session expired. Please reconnect your broker.`,
        );
        return;
      }

      if (response.data?.status === 1 || response.data?.errorCode) {
        Alert.alert(
          'Error',
          response.data?.message || 'Failed to refresh order status',
        );
        return;
      }

      if (response.data && onRefreshComplete) {
        await onRefreshComplete();
        Alert.alert('Success', 'Order status updated');
      }
    } catch (error) {
      if (isTokenExpiredError(error)) {
        Alert.alert(
          'Session Expired',
          `${tradeBroker} session expired. Please reconnect your broker.`,
        );
      } else {
        Alert.alert(
          'Error',
          error.response?.data?.message || 'Failed to refresh order status',
        );
      }
    } finally {
      setRefreshingOrderIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(orderId);
        return newSet;
      });
    }
  };

  // Cancel order
  const handleCancelOrder = async trade => {
    const orderId = trade?.orderId || trade?.uniqueorderid;
    const tradeBroker = trade?.user_broker || broker;
    if (!orderId || !tradeBroker) return;

    const brokerEndpoint = BROKER_ENDPOINTS[tradeBroker];
    if (!brokerEndpoint) {
      Alert.alert(
        'Error',
        `Broker ${tradeBroker} not supported for order cancellation`,
      );
      return;
    }

    // Confirm cancellation
    Alert.alert('Cancel Order', 'Are you sure you want to cancel this order?', [
      {text: 'No', style: 'cancel'},
      {
        text: 'Yes, Cancel',
        style: 'destructive',
        onPress: async () => {
          setCancellingOrderIds(prev => new Set([...prev, orderId]));

          try {
            const response = await axios.post(
              `${server.ccxtServer.baseUrl}${brokerEndpoint}/v2/cancel-order`,
              {
                user_email: userEmail,
                orderId: orderId,
                uniqueOrderId: orderId,
              },
              {headers: getAuthHeaders()},
            );

            if (
              response.data?.tokenExpired ||
              response.data?.warning?.type === 'TOKEN_EXPIRED'
            ) {
              Alert.alert(
                'Session Expired',
                `${tradeBroker} session expired. Please reconnect your broker.`,
              );
              return;
            }

            if (response.data?.status === 0 || response.data?.success) {
              if (onRefreshComplete) await onRefreshComplete();
              Alert.alert('Success', 'Order cancelled successfully');
            } else {
              Alert.alert(
                'Error',
                response.data?.message || 'Failed to cancel order',
              );
            }
          } catch (error) {
            if (isTokenExpiredError(error)) {
              Alert.alert(
                'Session Expired',
                `${tradeBroker} session expired. Please reconnect your broker.`,
              );
            } else {
              Alert.alert(
                'Error',
                error.response?.data?.message || 'Failed to cancel order',
              );
            }
          } finally {
            setCancellingOrderIds(prev => {
              const newSet = new Set(prev);
              newSet.delete(orderId);
              return newSet;
            });
          }
        },
      },
    ]);
  };

  // Open modify modal
  const openModifyModal = trade => {
    setModifyingTrade(trade);
    setNewPrice(String(trade?.Price || trade?.tradedPrice || ''));
    setShowModifyModal(true);
  };

  // Modify order
  const handleModifyOrder = async () => {
    const tradeBroker = modifyingTrade?.user_broker || broker;
    if (!modifyingTrade || !newPrice || !tradeBroker) return;

    const orderId = modifyingTrade?.orderId || modifyingTrade?.uniqueorderid;
    const brokerEndpoint = BROKER_ENDPOINTS[tradeBroker];

    if (!brokerEndpoint) {
      Alert.alert(
        'Error',
        `Broker ${tradeBroker} not supported for order modification`,
      );
      return;
    }

    setIsModifying(true);

    try {
      const isClosure =
        modifyingTrade?.closurestatus === 'fullClose' ||
        modifyingTrade?.closurestatus === 'partialClose';
      let quantity =
        isClosure && modifyingTrade?.toTradeQty
          ? Math.abs(modifyingTrade.toTradeQty)
          : modifyingTrade?.tradedQty || modifyingTrade?.Quantity;
      const exchange = (modifyingTrade?.Exchange || '').toUpperCase();
      const symbol = modifyingTrade?.Symbol;
      let tradingSymbol = modifyingTrade?.Symbol;

      // For F&O orders, fetch lot size and multiply quantity
      if ((exchange === 'NFO' || exchange === 'BFO') && symbol) {
        try {
          const lotSizeResponse = await axios.post(
            `${server.ccxtServer.baseUrl}zerodha/fno/symbol-lotsize`,
            {
              symbols: [{symbol: symbol, exchange: exchange}],
            },
            {headers: getAuthHeaders()},
          );

          if (lotSizeResponse.data?.results) {
            const lotSizeData = lotSizeResponse.data.results.find(
              item => item.previous_symbol === symbol,
            );
            if (lotSizeData) {
              tradingSymbol = lotSizeData.new_symbol || symbol;
              quantity = lotSizeData.lotsize * quantity;
            }
          }
        } catch (lotSizeError) {
          // Continue with original quantity if lot size fetch fails
        }
      }

      const response = await axios.post(
        `${server.ccxtServer.baseUrl}${brokerEndpoint}/v2/modify-order`,
        {
          user_email: userEmail,
          orderId: orderId,
          uniqueOrderId: orderId,
          price: parseFloat(newPrice),
          quantity: quantity,
          orderType: 'LIMIT',
          symbol: symbol,
          tradingSymbol: tradingSymbol,
          exchange: exchange || 'NSE',
          transactionType: modifyingTrade?.Type,
          productType: modifyingTrade?.ProductType || 'DELIVERY',
        },
        {headers: getAuthHeaders()},
      );

      if (
        response.data?.tokenExpired ||
        response.data?.warning?.type === 'TOKEN_EXPIRED'
      ) {
        Alert.alert(
          'Session Expired',
          `${tradeBroker} session expired. Please reconnect your broker.`,
        );
        setShowModifyModal(false);
        setModifyingTrade(null);
        return;
      }

      if (response.data?.status === 0 || response.data?.success) {
        if (onRefreshComplete) await onRefreshComplete();
        Alert.alert('Success', 'Order modified successfully');
        setShowModifyModal(false);
        setModifyingTrade(null);
      } else {
        Alert.alert(
          'Error',
          response.data?.message || 'Failed to modify order',
        );
      }
    } catch (error) {
      if (isTokenExpiredError(error)) {
        Alert.alert(
          'Session Expired',
          `${tradeBroker} session expired. Please reconnect your broker.`,
        );
        setShowModifyModal(false);
        setModifyingTrade(null);
      } else {
        Alert.alert(
          'Error',
          error.response?.data?.message || 'Failed to modify order',
        );
      }
    } finally {
      setIsModifying(false);
    }
  };

  // Pull-to-refresh handler
  const onPullRefresh = useCallback(async () => {
    setPullRefreshing(true);
    await handleRefreshAll();
    setPullRefreshing(false);
  }, [handleRefreshAll]);

  // ==================== Processed & Filtered Data ====================

  const {
    allTrades,
    uniqueBrokers,
    orderCounts,
    brokerCounts,
    totalUnfilteredCount,
  } = useMemo(() => {
    const basketTrades = new Map();
    const individualTrades = [];

    orders.forEach(trade => {
      if (trade.basketId && trade.basket_advice) {
        const filteredBasketAdvice = trade.basket_advice.filter(
          advice => advice.trade_place_status !== 'recommend',
        );
        if (filteredBasketAdvice.length > 0) {
          if (!basketTrades.has(trade.basketId)) {
            basketTrades.set(trade.basketId, {
              ...trade,
              basket_advice: filteredBasketAdvice,
            });
          }
        }
      } else {
        if (trade.trade_place_status !== 'recommend') {
          individualTrades.push(trade);
        }
      }
    });

    const allProcessedTrades = [
      ...Array.from(basketTrades.values()),
      ...individualTrades,
    ];

    // Unique brokers
    const brokers = new Set();
    allProcessedTrades.forEach(trade => {
      const tradeBroker = getEffectiveBroker(trade);
      if (tradeBroker) brokers.add(tradeBroker);
    });
    const sortedBrokers = Array.from(brokers).sort();

    // Broker counts
    const bCounts = {};
    allProcessedTrades.forEach(trade => {
      const tradeBroker = getEffectiveBroker(trade);
      if (tradeBroker) {
        bCounts[tradeBroker] = (bCounts[tradeBroker] || 0) + 1;
      }
    });

    // Apply broker filter
    const brokerFilteredTrades = allProcessedTrades.filter(trade => {
      if (selectedBroker === 'all') return true;
      return getEffectiveBroker(trade) === selectedBroker;
    });

    // Type counts (respecting broker filter)
    const typeCounts = {
      all: brokerFilteredTrades.length,
      basket: 0,
      fno: 0,
      equity: 0,
    };
    brokerFilteredTrades.forEach(trade => {
      const tradeType = getTradeType(trade);
      typeCounts[tradeType]++;
    });

    // Apply type filter
    const typeFilteredTrades = brokerFilteredTrades.filter(trade => {
      if (selectedType === 'all') return true;
      return getTradeType(trade) === selectedType;
    });

    // Sort by date (newest first)
    const sortedTrades = [...typeFilteredTrades].sort((a, b) => {
      const dateA = new Date(a.exitDate || a.purchaseDate || a.date);
      const dateB = new Date(b.exitDate || b.purchaseDate || b.date);
      if (isNaN(dateA.getTime()) && isNaN(dateB.getTime())) return 0;
      if (isNaN(dateA.getTime())) return 1;
      if (isNaN(dateB.getTime())) return -1;
      return dateB - dateA;
    });

    return {
      allTrades: sortedTrades,
      uniqueBrokers: sortedBrokers,
      orderCounts: typeCounts,
      brokerCounts: bCounts,
      totalUnfilteredCount: allProcessedTrades.length,
    };
  }, [orders, selectedBroker, selectedType]);

  // ==================== Status Helpers ====================

  const getStatusColors = status => {
    const normalized = normalizeOrderStatus(status);
    switch (normalized) {
      case 'complete':
        return {bg: '#ECFDF5', text: '#059669', icon: 'check'};
      case 'pending':
        return {bg: '#FEF3C7', text: '#D97706', icon: 'clockcircleo'};
      case 'rejected':
        return {bg: '#FEE2E2', text: '#DC2626', icon: 'closecircleo'};
      case 'cancelled':
        return {bg: '#F3F4F6', text: '#6B7280', icon: 'minuscircleo'};
      case 'partial':
        return {bg: '#FEF3C7', text: '#D97706', icon: 'warning'};
      default:
        return {bg: '#F3F4F6', text: '#6B7280', icon: 'questioncircleo'};
    }
  };

  const getPrice = trade => {
    if (trade?.Type === 'SELL') {
      const ep = trade?.exitPrice;
      return ep !== undefined && ep !== null && ep !== 0
        ? Number(ep).toFixed(2)
        : '-';
    }
    if (trade?.Type === 'BUY') {
      const tp = trade?.tradedPrice;
      return tp !== undefined && tp !== null && tp !== 0
        ? Number(tp).toFixed(2)
        : '-';
    }
    return '-';
  };

  // ==================== Render Helpers ====================

  // Individual trade row
  const renderTradeItem = (trade, isBasketItem = false) => {
    const tradeDate =
      trade?.Type === 'BUY'
        ? trade?.purchaseDate
        : trade?.exitDate || trade?.purchaseDate;
    const orderId = trade?.orderId || trade?.uniqueorderid;
    const isOpen = isOrderOpen(trade?.trade_place_status);
    const isRefreshingThis = refreshingOrderIds.has(orderId);
    const isCancellingThis = cancellingOrderIds.has(orderId);
    const statusColors = getStatusColors(trade?.trade_place_status);
    const isClosure =
      trade?.closurestatus === 'fullClose' ||
      trade?.closurestatus === 'partialClose';
    const totalQty =
      isClosure && trade?.toTradeQty
        ? Math.abs(trade.toTradeQty)
        : trade?.tradedQty || trade?.Quantity || 0;

    // Build symbol display
    let symbolDisplay = trade?.Symbol || '-';
    if (
      (trade?.Exchange === 'NFO' || trade?.Exchange === 'BFO') &&
      trade?.OptionType !== 'FUT'
    ) {
      symbolDisplay = trade?.searchSymbol || trade?.Symbol || '-';
      if (trade?.Strike || trade?.OptionType) {
        symbolDisplay += ` | ${trade?.Strike || ''} | ${trade?.OptionType || ''}`;
      }
    }

    return (
      <View
        style={[
          styles.tradeCard,
          isBasketItem && styles.basketItemCard,
          isClosure && styles.closureCard,
        ]}>
        {/* Top Row: Symbol + Buy/Sell badge */}
        <View style={styles.tradeTopRow}>
          <View style={{flex: 1}}>
            <Text style={styles.tradeSymbol} numberOfLines={1}>
              {symbolDisplay}
            </Text>
            {trade?.user_broker && (
              <Text style={styles.tradeBrokerLabel}>
                {trade.user_broker}
                {getClientCodeForBroker(trade.user_broker)
                  ? ` - ${getClientCodeForBroker(trade.user_broker)}`
                  : ''}
              </Text>
            )}
          </View>
          <View
            style={[
              styles.typeBadge,
              trade?.Type === 'BUY' ? styles.buyBadge : styles.sellBadge,
            ]}>
            <Text style={styles.typeBadgeText}>
              {trade?.Type === 'BUY' ? 'Buy' : 'Sell'}
            </Text>
          </View>
        </View>

        {/* Details Row: Qty, Price, Exchange */}
        <View style={styles.tradeDetailsRow}>
          <Text style={styles.tradeDetailText}>
            Qty: {totalQty}
            {'  |  '}
            Price: {getPrice(trade)}
            {'  |  '}
            {trade?.Exchange || 'NSE'}
          </Text>
        </View>

        {/* Bottom Row: Status + Date + Actions */}
        <View style={styles.tradeBottomRow}>
          {/* Status pill */}
          <View
            style={[styles.statusBadge, {backgroundColor: statusColors.bg}]}>
            <Icon name={statusColors.icon} size={12} color={statusColors.text} />
            <Text style={[styles.statusText, {color: statusColors.text}]}>
              {getOrderStatusDisplay(trade?.trade_place_status)}
            </Text>
          </View>

          {/* Date */}
          <Text style={styles.tradeDateText}>{FormatDateTime(tradeDate)}</Text>
        </View>

        {/* Rejection reason */}
        {(normalizeOrderStatus(trade?.trade_place_status) === 'rejected' ||
          normalizeOrderStatus(trade?.trade_place_status) === 'cancelled') &&
          (trade?.message_aq || trade?.orderStatusMessage) && (
            <Text style={styles.rejectionReason} numberOfLines={2}>
              {trade?.message_aq || trade?.orderStatusMessage}
            </Text>
          )}

        {/* Action buttons */}
        <View style={styles.actionRow}>
          {/* Refresh status */}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleRefreshOrder(trade)}
            disabled={isRefreshingThis || !orderId}>
            {isRefreshingThis ? (
              <ActivityIndicator size={14} color="#3B82F6" />
            ) : (
              <RefreshCw size={16} color="#6B7280" />
            )}
            <Text style={styles.actionText}>Refresh</Text>
          </TouchableOpacity>

          {/* Show Modify and Cancel only for open orders */}
          {isOpen && (
            <>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => openModifyModal(trade)}>
                <Edit3 size={16} color="#D97706" />
                <Text style={[styles.actionText, {color: '#D97706'}]}>
                  Modify
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleCancelOrder(trade)}
                disabled={isCancellingThis}>
                {isCancellingThis ? (
                  <ActivityIndicator size={14} color="#DC2626" />
                ) : (
                  <XCircle size={16} color="#DC2626" />
                )}
                <Text style={[styles.actionText, {color: '#DC2626'}]}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    );
  };

  // Basket group
  const renderBasketItem = basketTrade => {
    const isExpanded = expandedBaskets.has(basketTrade.basketId);
    const adviceCount = basketTrade.basket_advice?.length || 0;

    return (
      <View style={styles.basketContainer}>
        {/* Basket header */}
        <TouchableOpacity
          style={styles.basketHeader}
          onPress={() => toggleBasket(basketTrade.basketId)}
          activeOpacity={0.7}>
          <View style={styles.basketHeaderLeft}>
            <ShoppingBasket size={20} color="#3B82F6" />
            <View style={{marginLeft: 10}}>
              <Text style={styles.basketTitle}>
                {basketTrade.basketName || 'Basket Order'}
              </Text>
              <Text style={styles.basketCount}>{adviceCount} Orders</Text>
            </View>
          </View>
          {isExpanded ? (
            <ChevronUp size={24} color="#333" />
          ) : (
            <ChevronDown size={24} color="#333" />
          )}
        </TouchableOpacity>

        {/* Expanded basket items */}
        {isExpanded &&
          basketTrade.basket_advice &&
          basketTrade.basket_advice.map(advice => (
            <View key={advice._id || Math.random().toString()}>
              {renderTradeItem(advice, true)}
            </View>
          ))}
      </View>
    );
  };

  // Main list item renderer
  const renderItem = useCallback(
    ({item}) => {
      if (item.basketId && item.basket_advice) {
        return renderBasketItem(item);
      }
      return renderTradeItem(item);
    },
    [
      expandedBaskets,
      refreshingOrderIds,
      cancellingOrderIds,
      broker,
      userDetails,
    ],
  );

  const keyExtractor = useCallback(
    (item, index) => item._id || item.basketId || `trade-${index}`,
    [],
  );

  // ==================== Filter Chips ====================

  const renderBrokerFilters = () => {
    if (uniqueBrokers.length <= 1) return null;

    return (
      <View style={styles.filterSection}>
        <Text style={styles.filterLabel}>Broker:</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipScrollContainer}>
          <TouchableOpacity
            style={[
              styles.filterChip,
              selectedBroker === 'all' && styles.filterChipActive,
            ]}
            onPress={() => setSelectedBroker('all')}>
            <Text
              style={[
                styles.filterChipText,
                selectedBroker === 'all' && styles.filterChipTextActive,
              ]}>
              All ({totalUnfilteredCount})
            </Text>
          </TouchableOpacity>
          {uniqueBrokers.map(brokerName => (
            <TouchableOpacity
              key={brokerName}
              style={[
                styles.filterChip,
                selectedBroker === brokerName && styles.filterChipActive,
              ]}
              onPress={() => setSelectedBroker(brokerName)}>
              <Text
                style={[
                  styles.filterChipText,
                  selectedBroker === brokerName && styles.filterChipTextActive,
                ]}>
                {brokerName} ({brokerCounts[brokerName] || 0})
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderTypeFilters = () => {
    const typeOptions = [
      {value: 'all', label: 'All'},
      {value: 'basket', label: 'Basket'},
      {value: 'fno', label: 'F&O'},
      {value: 'equity', label: 'Equity'},
    ];

    return (
      <View style={styles.filterSection}>
        <Text style={styles.filterLabel}>Type:</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipScrollContainer}>
          {typeOptions.map(option => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.filterChip,
                selectedType === option.value && styles.filterChipActive,
              ]}
              onPress={() => setSelectedType(option.value)}>
              <Text
                style={[
                  styles.filterChipText,
                  selectedType === option.value && styles.filterChipTextActive,
                ]}>
                {option.label} ({orderCounts[option.value] || 0})
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  // ==================== Empty State ====================

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconCircle}>
        <TrendingUp size={32} color="#9CA3AF" />
      </View>
      <Text style={styles.emptyTitle}>
        {totalUnfilteredCount === 0 ? 'No Orders' : 'No Matching Orders'}
      </Text>
      <Text style={styles.emptySubtitle}>
        {totalUnfilteredCount === 0
          ? 'Orders that are placed will appear here'
          : 'Try adjusting your filters to see more orders'}
      </Text>
      {totalUnfilteredCount > 0 && (
        <TouchableOpacity
          style={styles.clearFiltersButton}
          onPress={() => {
            setSelectedBroker('all');
            setSelectedType('all');
          }}>
          <Text style={styles.clearFiltersText}>Clear all filters</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // ==================== Modify Modal ====================

  const renderModifyModal = () => {
    if (!modifyingTrade) return null;

    const isClosure =
      modifyingTrade?.closurestatus === 'fullClose' ||
      modifyingTrade?.closurestatus === 'partialClose';
    const displayQty =
      isClosure && modifyingTrade?.toTradeQty
        ? Math.abs(modifyingTrade.toTradeQty)
        : modifyingTrade?.tradedQty || modifyingTrade?.Quantity;

    return (
      <Modal
        visible={showModifyModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowModifyModal(false);
          setModifyingTrade(null);
        }}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Modify Order</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowModifyModal(false);
                  setModifyingTrade(null);
                }}
                style={styles.modalCloseBtn}>
                <XIcon size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {/* Closure indicator */}
            {isClosure && (
              <View style={styles.closureIndicator}>
                <Text style={styles.closureIndicatorText}>Closure Order</Text>
              </View>
            )}

            {/* Order details */}
            <View style={styles.modalDetailsCard}>
              <View style={styles.modalDetailRow}>
                <Text style={styles.modalDetailLabel}>Symbol</Text>
                <Text style={styles.modalDetailValue}>
                  {modifyingTrade?.Symbol}
                </Text>
              </View>
              <View style={styles.modalDetailRow}>
                <Text style={styles.modalDetailLabel}>Quantity</Text>
                <Text style={styles.modalDetailValue}>{displayQty}</Text>
              </View>
              <View style={styles.modalDetailRow}>
                <Text style={styles.modalDetailLabel}>Type</Text>
                <Text
                  style={[
                    styles.modalDetailValue,
                    {
                      color:
                        modifyingTrade?.Type === 'BUY' ? '#059669' : '#DC2626',
                    },
                  ]}>
                  {modifyingTrade?.Type}
                </Text>
              </View>
              <View style={styles.modalDetailRow}>
                <Text style={styles.modalDetailLabel}>Current Price</Text>
                <Text style={styles.modalDetailValue}>
                  {modifyingTrade?.tradedPrice ||
                    modifyingTrade?.Price ||
                    '-'}
                </Text>
              </View>
            </View>

            {/* New price input */}
            <Text style={styles.inputLabel}>New Price</Text>
            <View style={styles.priceInputContainer}>
              <Text style={styles.rupeeSymbol}>&#8377;</Text>
              <TextInput
                style={styles.priceInput}
                value={newPrice}
                onChangeText={setNewPrice}
                keyboardType="decimal-pad"
                placeholder="Enter new price"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            {/* Buttons */}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelModalBtn}
                onPress={() => {
                  setShowModifyModal(false);
                  setModifyingTrade(null);
                }}>
                <Text style={styles.cancelModalBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modifyModalBtn,
                  (isModifying || !newPrice) && styles.disabledBtn,
                ]}
                onPress={handleModifyOrder}
                disabled={isModifying || !newPrice}>
                {isModifying ? (
                  <ActivityIndicator size={16} color="#FFFFFF" />
                ) : (
                  <Text style={styles.modifyModalBtnText}>Modify Order</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  // ==================== Main Render ====================

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {navigation && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}>
              <Icon name="arrowleft" size={22} color="#111827" />
            </TouchableOpacity>
          )}
          <View>
            <Text style={styles.headerTitle}>Order Management</Text>
            <Text style={styles.headerSubtitle}>
              {allTrades.length} order{allTrades.length !== 1 ? 's' : ''}
              {(selectedBroker !== 'all' || selectedType !== 'all') &&
                ` (filtered from ${totalUnfilteredCount})`}
            </Text>
          </View>
        </View>

        {/* Refresh All button */}
        <TouchableOpacity
          style={[styles.refreshAllBtn, isRefreshing && styles.disabledBtn]}
          onPress={handleRefreshAll}
          disabled={isRefreshing}>
          {isRefreshing ? (
            <ActivityIndicator size={16} color="#3B82F6" />
          ) : (
            <RefreshCw size={16} color="#3B82F6" />
          )}
          <Text style={styles.refreshAllText}>
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Broker filter tabs */}
      {renderBrokerFilters()}

      {/* Type filter chips */}
      {renderTypeFilters()}

      {/* Orders List */}
      <FlatList
        data={allTrades}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={pullRefreshing}
            onRefresh={onPullRefresh}
            colors={['#3B82F6']}
            tintColor="#3B82F6"
          />
        }
      />

      {/* Modify Order Modal */}
      {renderModifyModal()}
    </View>
  );
};

// ==================== Styles ====================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Satoshi-Bold',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: 'Satoshi-Regular',
    color: '#6B7280',
    marginTop: 2,
  },
  refreshAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  refreshAllText: {
    fontSize: 13,
    fontFamily: 'Satoshi-Medium',
    color: '#3B82F6',
    marginLeft: 6,
  },

  // Filters
  filterSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterLabel: {
    fontSize: 13,
    fontFamily: 'Satoshi-Medium',
    color: '#6B7280',
    marginRight: 10,
  },
  chipScrollContainer: {
    paddingRight: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#3B82F6',
  },
  filterChipText: {
    fontSize: 13,
    fontFamily: 'Satoshi-Medium',
    color: '#374151',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },

  // List
  listContent: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 40,
  },

  // Trade Card
  tradeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 14,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  basketItemCard: {
    marginLeft: 16,
    backgroundColor: '#F0F9FF',
    borderColor: '#BFDBFE',
  },
  closureCard: {
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
  },
  tradeTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  tradeSymbol: {
    fontSize: 15,
    fontFamily: 'Satoshi-Bold',
    color: '#111827',
    flex: 1,
  },
  tradeBrokerLabel: {
    fontSize: 11,
    fontFamily: 'Satoshi-Regular',
    color: '#9CA3AF',
    marginTop: 2,
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 4,
    marginLeft: 8,
  },
  buyBadge: {
    backgroundColor: '#23bb3e',
  },
  sellBadge: {
    backgroundColor: '#ef344a',
  },
  typeBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: 'Satoshi-Medium',
  },
  tradeDetailsRow: {
    marginTop: 8,
  },
  tradeDetailText: {
    fontSize: 12,
    fontFamily: 'Satoshi-Regular',
    color: '#6B7280',
  },
  tradeBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Satoshi-Medium',
    marginLeft: 4,
  },
  tradeDateText: {
    fontSize: 11,
    fontFamily: 'Satoshi-Regular',
    color: '#9CA3AF',
  },
  rejectionReason: {
    fontSize: 11,
    fontFamily: 'Satoshi-Regular',
    color: '#DC2626',
    marginTop: 6,
    paddingHorizontal: 4,
  },

  // Action buttons
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 14,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  actionText: {
    fontSize: 12,
    fontFamily: 'Satoshi-Medium',
    color: '#6B7280',
    marginLeft: 4,
  },

  // Basket
  basketContainer: {
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    overflow: 'hidden',
  },
  basketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  basketHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  basketTitle: {
    fontSize: 15,
    fontFamily: 'Satoshi-Bold',
    color: '#1E3A5F',
  },
  basketCount: {
    fontSize: 12,
    fontFamily: 'Satoshi-Regular',
    color: '#6B7280',
    marginTop: 2,
  },

  // Empty state
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 24,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontFamily: 'Satoshi-Bold',
    color: '#374151',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: 'Satoshi-Regular',
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },
  clearFiltersButton: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  clearFiltersText: {
    fontSize: 14,
    fontFamily: 'Satoshi-Medium',
    color: '#3B82F6',
  },

  // Modify Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: width - 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Satoshi-Bold',
    color: '#111827',
  },
  modalCloseBtn: {
    padding: 4,
  },
  closureIndicator: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 12,
  },
  closureIndicatorText: {
    fontSize: 13,
    fontFamily: 'Satoshi-Medium',
    color: '#92400E',
  },
  modalDetailsCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
  },
  modalDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
  },
  modalDetailLabel: {
    fontSize: 13,
    fontFamily: 'Satoshi-Regular',
    color: '#6B7280',
  },
  modalDetailValue: {
    fontSize: 14,
    fontFamily: 'Satoshi-Medium',
    color: '#111827',
  },
  inputLabel: {
    fontSize: 13,
    fontFamily: 'Satoshi-Medium',
    color: '#374151',
    marginBottom: 8,
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    marginBottom: 20,
  },
  rupeeSymbol: {
    fontSize: 16,
    color: '#6B7280',
    marginRight: 6,
  },
  priceInput: {
    flex: 1,
    height: 46,
    fontSize: 16,
    fontFamily: 'Satoshi-Regular',
    color: '#111827',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelModalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelModalBtnText: {
    fontSize: 14,
    fontFamily: 'Satoshi-Medium',
    color: '#374151',
  },
  modifyModalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modifyModalBtnText: {
    fontSize: 14,
    fontFamily: 'Satoshi-Medium',
    color: '#FFFFFF',
  },
  disabledBtn: {
    opacity: 0.5,
  },
});

export default PlaceOrdersScreen;
