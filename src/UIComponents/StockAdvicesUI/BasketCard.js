import {
  ArrowRight,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  TrendingDown,
  Target,
  Edit3,
  AlertCircle,
  XCircle,
} from 'lucide-react-native';
import React, { useState } from 'react';
import LinearGradient from 'react-native-linear-gradient';
import moment from 'moment';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, Image } from 'react-native';
import logo from '../../assets/fadedlogo.png';
import BasketRunningProfit from '../../components/AdviceScreenComponents/DynamicText/BasketRunningProfit';

const BasketCard = ({
  basket,
  setStockDetails,
  handleTradeNow,
  setisBasket,
  setbasketId,
  setbasketName,
  fullsetBasketData,
  handleTradeBasket,
  setOpenTokenExpireModel,
  setOpenBrokerModel,
}) => {
  console.log("Basket i Have ------",basket);
  const [showMore, setShowMore] = useState(false);
  const [expandedTrades, setExpandedTrades] = useState({});

  // Determine basket status
  const isEdited = basket?.trades?.some(t => t.isEdited === true) || false;
  const isClosureBasket = basket?.trades?.some(t => t.isClosure === true) || false;

  // Check if basket is expired (any trade has expired derivative symbol)
  const isExpired = basket?.trades?.some(trade => {
    if (trade.Exchange !== 'NFO' && trade.Exchange !== 'BFO') return false;
    // Check expiry using symbol pattern
    const expiryRegex = /(\d{1,2})(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)(\d{2})/i;
    const match = trade.Symbol?.match(expiryRegex);
    if (!match) return false;

    const day = parseInt(match[1], 10);
    const monthStr = match[2].toUpperCase();
    const yearStr = match[3];
    const monthMap = { JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5, JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11 };
    const monthIndex = monthMap[monthStr];
    const currentYear = new Date().getFullYear();
    const currentCentury = Math.floor(currentYear / 100) * 100;
    let year = currentCentury + parseInt(yearStr, 10);
    if (year < currentYear - 10) year += 100;

    const expiryDate = new Date(year, monthIndex, day, 23, 59, 59, 999);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return expiryDate < today;
  }) || false;

  const toggleShowMore = () => {
    setShowMore(!showMore);
    // Reset all expansions when toggling show more
    setExpandedTrades({});
  };

  const toggleTradeExpansion = (index) => {
    setExpandedTrades(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const basketName = basket?.trades?.length > 0 ? basket.trades[0].basketName : null;
  const basketId = basket?.trades?.length > 0 ? basket.trades[0].basketId : null;

  const firstThreeTrades = showMore ? basket?.trades || [] : (basket?.trades || []).slice(0, 3);
  const remainingCount = basket?.trades?.length > 3 ? basket.trades.length - 3 : 0;

  const mapBasketToStockDetails = (basket) => ({
    exchange: basket.Exchange || 'NFO',
    orderType: basket.OrderType || 'MARKET',
    productType: basket.ProductType || 'CARRYFORWARD',
    quantity: basket.Quantity || 1,
    segment: basket.Segment || 'OPTIONS',
    tradeId: basket.tradeId || '',
    priority: basket.Priority || 0,
    trade_given_by: basket.trade_given_by || '',
    tradingSymbol: basket.Symbol || '',
    transactionType: basket.Type || 'BUY',
    user_broker: basket.user_broker || '',
    user_email: basket.user_email || '',
    zerodhaTradeId: basket.zerodhaTradeId || 'NA',
    price: basket.Price || basket.LimitPrice || null,
    stopLoss: basket.stopLoss || basket.sl || null,
    target: basket.profitTarget || basket.Target || null,
  });

  const handleTradeNowBasket = () => {
    setbasketId(basketId);
    setbasketName(basketName);
    setisBasket(true);
    fullsetBasketData(basket?.trades);

    const stockDetails = basket?.trades?.map((item) => ({
      ...mapBasketToStockDetails(item),
    })) || [];
    setStockDetails(stockDetails);

    handleTradeBasket();
  };

  const date = basket?.trades?.[0]?.date || new Date();

  // Component to render trade details
  const TradeItem = ({ item, index, isInGrid }) => {
    if (!item) return null;

    const isExpanded = expandedTrades[index];
    const isLimitOrder = item?.OrderType === 'LIMIT';

    // Get values with proper type conversion
    const stopLossValue = item?.stopLoss || item?.SL || item?.sl;
    const targetValue = item?.Target || item?.profitTarget || item?.PT;
    const limitPrice = item?.Price || item?.LimitPrice;

    const hasStopLoss = stopLossValue != null && stopLossValue !== '';
    const hasTarget = targetValue != null && targetValue !== '';
    const hasExpandableContent = isLimitOrder || hasStopLoss || hasTarget;

    // Create display text for symbol
    const symbolParts = [
      item?.searchSymbol || '',
      item?.Strike ? String(item.Strike) : '',
      item?.OptionType || ''
    ].filter(part => part).join(' ');

    return (
      <View style={isInGrid ? styles.tradeItemGrid : styles.tradeItemList}>
        <TouchableOpacity
          onPress={() => hasExpandableContent && toggleTradeExpansion(index)}
          activeOpacity={hasExpandableContent ? 0.7 : 1}
          disabled={!hasExpandableContent}
          style={styles.tradeButton}
        >
          <View style={styles.tradeHeader}>
            <View style={styles.tradeMainInfo}>
              <Text style={styles.tradeText} numberOfLines={isExpanded ? undefined : 1}>
                {symbolParts || 'N/A'}
              </Text>
              {isLimitOrder && (
                <View style={styles.orderTypeBadge}>
                  <Text style={styles.orderTypeText}>LIMIT</Text>
                </View>
              )}
            </View>
            {hasExpandableContent && (
              <ChevronDown
                size={12}
                color={'#fff'}
                style={{
                  transform: [{ rotate: isExpanded ? '180deg' : '0deg' }],
                  marginLeft: 4,
                }}
              />
            )}
          </View>

          {isExpanded && (
            <View style={styles.expandedContent}>
              {isLimitOrder && limitPrice != null && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Limit Price</Text>
                  <Text style={styles.detailValue}>₹{String(limitPrice)}</Text>
                </View>
              )}

              {hasStopLoss && (
                <View style={styles.detailRow}>
                  <View style={styles.detailLabelWithIcon}>
                    <TrendingDown size={10} color={'#ff6b6b'} />
                    <Text style={[styles.detailLabel, {color: '#ff6b6b'}]}>Stop Loss</Text>
                  </View>
                  <Text style={[styles.detailValue, {color: '#ff6b6b'}]}>
                    ₹{String(stopLossValue)}
                  </Text>
                </View>
              )}

              {hasTarget && (
                <View style={styles.detailRow}>
                  <View style={styles.detailLabelWithIcon}>
                    <Target size={10} color={'#51cf66'} />
                    <Text style={[styles.detailLabel, {color: '#51cf66'}]}>Target</Text>
                  </View>
                  <Text style={[styles.detailValue, {color: '#51cf66'}]}>
                    ₹{String(targetValue)}
                  </Text>
                </View>
              )}

              {item?.Quantity != null && item.Quantity > 0 && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Quantity</Text>
                    <Text style={styles.detailValue}>{String(item.Quantity)} lot(s)</Text>
                  </View>
                )}
            </View>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  // Badge component
  const StatusBadge = ({ type }) => {
    const badgeConfig = {
      edited: { bg: 'rgba(255, 193, 7, 0.9)', text: 'Edited', icon: Edit3 },
      expired: { bg: 'rgba(220, 53, 69, 0.9)', text: 'Expired', icon: AlertCircle },
      closure: { bg: 'rgba(108, 117, 125, 0.9)', text: 'Close Position', icon: XCircle },
    };
    const config = badgeConfig[type];
    if (!config) return null;
    const IconComponent = config.icon;

    return (
      <View style={[styles.badge, { backgroundColor: config.bg }]}>
        <IconComponent size={10} color="#fff" />
        <Text style={styles.badgeText}>{config.text}</Text>
      </View>
    );
  };

  // Determine gradient colors based on basket type
  const getGradientColors = () => {
    if (isExpired) return ['rgba(100, 100, 100, 1)', 'rgba(150, 150, 150, 1)']; // Gray for expired
    if (isClosureBasket) return ['rgba(139, 0, 0, 1)', 'rgba(200, 50, 50, 1)']; // Red for closure
    return ['rgba(15, 62, 0, 1)', 'rgba(41, 164, 0, 1)']; // Green for regular
  };

  return (
    <LinearGradient
      colors={getGradientColors()}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <View style={styles.contentContainer}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
              <Text style={styles.basketTitle}>{basketName || 'Basket'}</Text>
              {isExpired && <StatusBadge type="expired" />}
              {isEdited && !isExpired && <StatusBadge type="edited" />}
              {isClosureBasket && !isExpired && <StatusBadge type="closure" />}
            </View>
          </View>
          <BasketRunningProfit basket={basket} />
        </View>

        <View style={styles.logoContainer} pointerEvents="none">
          <Image
            source={logo}
            style={[styles.logo, { tintColor: '#FFFFFF' }]}
            resizeMode="contain"
          />
        </View>

        {/* Custom two-column stock names */}
        <View style={styles.stocksContainer}>
          {!showMore ? (
            <View style={styles.gridContainer}>
              {/* First Row */}
              <View style={styles.stockRow}>
                {firstThreeTrades[0] && (
                  <TradeItem item={firstThreeTrades[0]} index={0} isInGrid={true} />
                )}
                {firstThreeTrades[1] && (
                  <TradeItem item={firstThreeTrades[1]} index={1} isInGrid={true} />
                )}
              </View>

              {/* Second Row */}
              <View style={styles.stockRow}>
                {firstThreeTrades[2] && (
                  <TradeItem item={firstThreeTrades[2]} index={2} isInGrid={true} />
                )}
                {remainingCount > 0 && (
                  <View style={styles.tradeItemGrid}>
                    <Text style={[styles.tradeText, styles.boldText]}>
                      {String(remainingCount)}+ stocks
                    </Text>
                  </View>
                )}
              </View>
            </View>
          ) : (
            <FlatList
              data={firstThreeTrades}
              renderItem={({item, index}) => (
                <TradeItem item={item} index={index} isInGrid={false} />
              )}
              keyExtractor={(item, index) => index.toString()}
              scrollEnabled={false}
            />
          )}
        </View>

        {basket?.trades?.length > 3 && (
          <TouchableOpacity
            onPress={toggleShowMore}
            style={styles.showMoreButton}
          >
            <View style={styles.showMoreContent}>
              {showMore ? (
                <>
                  <ChevronUp size={12} color={'#fff'} />
                  <Text style={styles.clickAcceptText}>Show Less</Text>
                </>
              ) : (
                <>
                  <Text style={styles.clickAcceptText}>*Click to see all</Text>
                  <ChevronDown size={12} color={'#fff'} />
                </>
              )}
            </View>
          </TouchableOpacity>
        )}

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, marginTop: 8 }}>
          <View style={{ flex: 1 }} />

          <View style={styles.dateRow}>
            <CalendarDays size={12} color="#fff" />
            <Text style={styles.dateText}>
              {moment(date).format('Do MMM, YYYY')} | {moment(date).format('h:mm A')}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.acceptButton,
            isExpired && styles.acceptButtonDisabled
          ]}
          onPress={handleTradeNowBasket}
          disabled={isExpired}
        >
          <Text style={[
            styles.acceptButtonText,
            isExpired && styles.acceptButtonTextDisabled
          ]}>
            {isExpired ? 'Basket Expired' : (isClosureBasket ? 'Close Positions' : 'View More Detail/Trade')}
          </Text>
          {!isExpired && <ArrowRight size={12} color={isClosureBasket ? 'rgba(139, 0, 0, 1)' : 'rgba(41, 164, 0, 1)'} />}
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 8,
    marginHorizontal: 8,
    marginVertical: 6,
    padding: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  contentContainer: {
    zIndex: 10,
  },
  basketTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  stocksContainer: {
    marginBottom: 12,
  },
  gridContainer: {
    gap: 8,
  },
  stockRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  tradeItemGrid: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 6,
    padding: 8,
    minHeight: 40,
    justifyContent: 'center',
  },
  tradeItemList: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 6,
    padding: 10,
    marginBottom: 8,
  },
  tradeButton: {
    flex: 1,
  },
  tradeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  tradeMainInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    flexWrap: 'wrap',
    marginRight: 4,
  },
  tradeText: {
    fontSize: 11,
    fontFamily: 'Poppins-Small',
    color: '#fff',
  },
  orderTypeBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 6,
  },
  orderTypeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },
  expandedContent: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailLabelWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailLabel: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 10,
    fontWeight: '600',
  },
  detailValue: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  boldText: {
    fontWeight: '700',
    fontSize: 12,
  },
  showMoreButton: {
    alignItems: 'flex-start',
    marginTop: 4,
  },
  showMoreContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  clickAcceptText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#fff',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 6,
    fontSize: 9,
  },
  acceptButton: {
    borderWidth: 1,
    borderColor: '#fff',
    backgroundColor: '#fff',
    borderRadius: 4,
    paddingVertical: 7,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    alignContent: 'center',
  },
  acceptButtonText: {
    color: 'rgba(41, 164, 0, 1)',
    fontFamily: 'Poppins-Medium',
    paddingTop: 2,
    fontSize: 12,
    marginRight: 6,
  },
  acceptButtonDisabled: {
    backgroundColor: 'rgba(200, 200, 200, 0.8)',
    borderColor: 'rgba(150, 150, 150, 0.5)',
  },
  acceptButtonTextDisabled: {
    color: '#666',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '600',
  },
  logoContainer: {
    position: 'absolute',
    top: '40%',
    left: '60%',
    transform: [{ translateX: -50 }, { translateY: -50 }],
    zIndex: 0,
    opacity: 1,
  },
  logo: {
    width: 110,
    height: 110,
    resizeMode: 'contain',
  },
});

export default BasketCard;