import React, {useState, useEffect, useRef, useCallback} from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import axios from 'axios';
import Config from 'react-native-config';
import {ChevronRightIcon} from 'lucide-react-native';
import server from '../../utils/serverConfig';
import {generateToken} from '../../utils/SecurityTokenManager';
import {getAdvisorSubdomain} from '../../utils/variantHelper';
import useWebSocketCurrentPrice from '../../FunctionCall/useWebSocketCurrentPrice';
import formatCurrency from '../../utils/formatcurrency';
import {useTrade} from '../../screens/TradeContext';

const MPF_1 = require('../../assets/Mpholder1.png');

const {width: screenWidth} = Dimensions.get('window');

// Statuses to filter out from order_results
const REJECTED_STATUSES = [
  'rejected',
  'failure',
  'cancelled',
  'failed',
  'unplaced',
];

const SubscribedPFCard = ({
  modelName,
  userEmail,
  broker,
  onPress,
  repairTrades,
  userBroker,
  hasPendingRebalance,
}) => {
  const {configData} = useTrade();

  // ------------------------------------------------------------------
  // API request headers (reused across calls)
  // ------------------------------------------------------------------
  const getHeaders = useCallback(() => {
    return {
      'Content-Type': 'application/json',
      'X-Advisor-Subdomain':
        configData?.config?.REACT_APP_HEADER_NAME || getAdvisorSubdomain(),
      'aq-encrypted-key': generateToken(
        Config.REACT_APP_AQ_KEYS,
        Config.REACT_APP_AQ_SECRET,
      ),
    };
  }, [configData]);

  // ------------------------------------------------------------------
  // 1. Fetch strategy details
  // ------------------------------------------------------------------
  const [strategyDetails, setStrategyDetails] = useState(null);
  const hasFetchedStrategy = useRef(false);

  useEffect(() => {
    if (!modelName || hasFetchedStrategy.current) {
      return;
    }
    const fetchStrategy = async () => {
      try {
        const res = await axios.get(
          `${
            server.server.baseUrl
          }api/model-portfolio/portfolios/strategy/${modelName?.replace(
            /_/g,
            ' ',
          )}`,
          {headers: getHeaders()},
        );
        const portfolioData = res.data?.[0]?.originalData;
        setStrategyDetails(portfolioData);
        hasFetchedStrategy.current = true;
      } catch (err) {
        console.log('SubscribedPFCard: strategy fetch error', err);
      }
    };
    fetchStrategy();
  }, [modelName, getHeaders]);

  // ------------------------------------------------------------------
  // 2. Fetch holdings / subscription raw amount
  // ------------------------------------------------------------------
  const [subscriptionAmount, setSubscriptionAmount] = useState(null);
  const hasFetchedSubscription = useRef(false);

  useEffect(() => {
    if (!userEmail || !strategyDetails || hasFetchedSubscription.current) {
      return;
    }
    const fetchSubscription = async () => {
      try {
        const res = await axios.get(
          `${
            server.server.baseUrl
          }api/model-portfolio-db-update/subscription-raw-amount?email=${encodeURIComponent(
            userEmail,
          )}&modelName=${encodeURIComponent(
            modelName,
          )}&user_broker=${encodeURIComponent(userBroker || '')}`,
          {headers: getHeaders()},
        );
        setSubscriptionAmount(res.data?.data);
        hasFetchedSubscription.current = true;
      } catch (err) {
        console.log('SubscribedPFCard: subscription fetch error', err);
      }
    };
    fetchSubscription();
  }, [userEmail, strategyDetails, modelName, userBroker, getHeaders]);

  // ------------------------------------------------------------------
  // 3. Derive latest portfolio snapshot & filter invalid orders
  // ------------------------------------------------------------------
  const netPortfolioUpdated = subscriptionAmount?.user_net_pf_model?.sort(
    (a, b) => new Date(b.execDate) - new Date(a.execDate),
  )?.[0];

  const validOrderResults = netPortfolioUpdated?.order_results?.filter(
    order => {
      const status = (order.orderStatus || '').toLowerCase();
      return (
        !REJECTED_STATUSES.includes(status) &&
        Number(order.quantity || 0) > 0
      );
    },
  );

  // ------------------------------------------------------------------
  // 4. Transform order_results into holdings format for WebSocket
  //    Each item: { symbol, quantity, avgPrice, LTP }
  // ------------------------------------------------------------------
  const holdings = (validOrderResults || []).map(order => ({
    symbol: order.symbol,
    quantity: Number(order.quantity || 0),
    avgPrice: parseFloat(order.averagePrice || 0),
  }));

  // ------------------------------------------------------------------
  // 5. WebSocket live price updates
  // ------------------------------------------------------------------
  const {getLTPForSymbol} = useWebSocketCurrentPrice(validOrderResults);

  // ------------------------------------------------------------------
  // 6. Calculate financial metrics
  // ------------------------------------------------------------------
  const totalInvested = holdings.reduce(
    (sum, h) => sum + h.avgPrice * h.quantity,
    0,
  );

  const totalCurrent = holdings.reduce((sum, h) => {
    const ltp = parseFloat(getLTPForSymbol(h.symbol));
    return sum + (isNaN(ltp) ? 0 : ltp * h.quantity);
  }, 0);

  const totalNetReturns = holdings.reduce((sum, h) => {
    const ltp = parseFloat(getLTPForSymbol(h.symbol));
    if (isNaN(ltp)) {
      return sum;
    }
    return sum + (ltp - h.avgPrice) * h.quantity;
  }, 0);

  const percentageReturns =
    totalInvested > 0
      ? ((totalNetReturns / totalInvested) * 100).toFixed(2)
      : '0.00';

  // Strategy-level metrics
  const cagr = strategyDetails?.performance_data?.returns?.cagr;
  const sharpeRatio =
    strategyDetails?.performance_data?.ratios?.sharpe ||
    strategyDetails?.performance_data?.risk_metrics?.sharpe_ratio;
  const volatility = strategyDetails?.volatility;

  // ------------------------------------------------------------------
  // 7. Formatted display values
  // ------------------------------------------------------------------
  const isLtpLoaded = totalCurrent > 0;

  const formattedInvested =
    totalInvested === 0
      ? 'Fetching...'
      : `\u20B9${formatCurrency(parseFloat(totalInvested.toFixed(2)))}`;

  const formattedCurrent =
    !isLtpLoaded
      ? 'Fetching...'
      : `\u20B9${formatCurrency(parseFloat(totalCurrent.toFixed(2)))}`;

  const formattedNetReturns = !isLtpLoaded
    ? 'Fetching...'
    : totalNetReturns >= 0
    ? `+\u20B9${formatCurrency(Math.abs(totalNetReturns).toFixed(2))}`
    : `-\u20B9${formatCurrency(Math.abs(totalNetReturns).toFixed(2))}`;

  const returnsColor =
    totalNetReturns === 0
      ? '#6B7280'
      : totalNetReturns > 0
      ? '#16A34A'
      : '#DC2626';

  const volatilityColor =
    volatility === 'High'
      ? '#DC2626'
      : volatility === 'Medium'
      ? '#D97706'
      : volatility === 'Low'
      ? '#16A34A'
      : '#6B7280';

  // ------------------------------------------------------------------
  // 8. Press handler
  // ------------------------------------------------------------------
  const handlePress = () => {
    if (onPress) {
      onPress(modelName);
    }
  };

  // ------------------------------------------------------------------
  // 9. Render
  // ------------------------------------------------------------------
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={handlePress}
      style={styles.cardContainer}>
      {/* Left accent bar */}
      <View style={styles.accentBar} />

      <View style={styles.cardBody}>
        {/* ---- Top Row: Image + Name + Current Value ---- */}
        <View style={styles.topRow}>
          <View style={styles.nameRow}>
            <Image
              source={
                strategyDetails?.image
                  ? {uri: `${server.server.baseUrl}${strategyDetails.image}`}
                  : MPF_1
              }
              style={styles.image}
            />
            <View style={styles.nameContainer}>
              <Text style={styles.modelName} numberOfLines={1}>
                {modelName}
              </Text>
              {repairTrades && (
                <View style={styles.repairBadge}>
                  <Text style={styles.repairText}>Repair</Text>
                  <ChevronRightIcon size={10} color="#92400E" />
                </View>
              )}
              {hasPendingRebalance && (
                <View style={styles.rebalanceBadge}>
                  <Text style={styles.rebalanceText}>Rebalance</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.currentValueBlock}>
            <Text
              style={[styles.currentValueText, {color: returnsColor}]}
              numberOfLines={1}>
              {formattedCurrent}
            </Text>
            {isLtpLoaded && totalNetReturns !== 0 && (
              <Text style={[styles.percentageText, {color: returnsColor}]}>
                ({totalNetReturns > 0 ? '+' : ''}
                {percentageReturns}%)
              </Text>
            )}
          </View>
        </View>

        {/* ---- Metrics Row ---- */}
        <View style={styles.metricsRow}>
          {/* Total Invested */}
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Invested</Text>
            <Text style={styles.metricValue}>{formattedInvested}</Text>
          </View>

          <View style={styles.metricDivider} />

          {/* Net Returns */}
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Returns</Text>
            <Text style={[styles.metricValue, {color: returnsColor}]}>
              {formattedNetReturns}
            </Text>
          </View>

          <View style={styles.metricDivider} />

          {/* CAGR */}
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>CAGR</Text>
            <Text style={styles.metricValue}>
              {strategyDetails === null
                ? 'Fetching...'
                : cagr != null
                ? `${cagr.toFixed(2)}%`
                : 'N/A'}
            </Text>
          </View>
        </View>

        {/* ---- Bottom Row: Sharpe + Volatility ---- */}
        <View style={styles.bottomRow}>
          <Text style={styles.bottomMetricText}>
            Sharpe:{' '}
            <Text style={styles.bottomMetricValue}>
              {strategyDetails === null
                ? '-'
                : sharpeRatio != null
                ? sharpeRatio.toFixed(2)
                : 'N/A'}
            </Text>
          </Text>

          <View style={styles.bottomDot} />

          <Text style={styles.bottomMetricText}>
            Volatility:{' '}
            <Text style={[styles.bottomMetricValue, {color: volatilityColor}]}>
              {strategyDetails === null ? '-' : volatility || 'N/A'}
            </Text>
            <Text style={styles.raTag}> (RA)</Text>
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ------------------------------------------------------------------
// Styles
// ------------------------------------------------------------------
const styles = StyleSheet.create({
  cardContainer: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    marginHorizontal: 12,
    marginVertical: 6,
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  accentBar: {
    width: 4,
    backgroundColor: '#3B82F6',
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
  },
  cardBody: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },

  // Top row
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  image: {
    width: 36,
    height: 36,
    borderRadius: 8,
    marginRight: 10,
  },
  nameContainer: {
    flex: 1,
  },
  modelName: {
    fontSize: 14,
    fontFamily: 'Satoshi-Bold',
    color: '#111827',
    textTransform: 'capitalize',
  },
  repairBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    marginTop: 3,
  },
  repairText: {
    fontSize: 10,
    fontFamily: 'Satoshi-Medium',
    color: '#92400E',
    marginRight: 2,
  },
  rebalanceBadge: {
    backgroundColor: '#DBEAFE',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    marginTop: 3,
  },
  rebalanceText: {
    fontSize: 10,
    fontFamily: 'Satoshi-Medium',
    color: '#1E40AF',
  },
  currentValueBlock: {
    alignItems: 'flex-end',
  },
  currentValueText: {
    fontSize: 14,
    fontFamily: 'Satoshi-Bold',
    color: '#111827',
  },
  percentageText: {
    fontSize: 11,
    fontFamily: 'Satoshi-Medium',
    marginTop: 1,
  },

  // Metrics row
  metricsRow: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 6,
    marginBottom: 8,
    alignItems: 'center',
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 10,
    fontFamily: 'Satoshi-Regular',
    color: '#9CA3AF',
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 12,
    fontFamily: 'Satoshi-Bold',
    color: '#374151',
  },
  metricDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#D1D5DB',
    marginHorizontal: 4,
  },

  // Bottom row
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bottomMetricText: {
    fontSize: 11,
    fontFamily: 'Satoshi-Regular',
    color: '#9CA3AF',
  },
  bottomMetricValue: {
    fontSize: 11,
    fontFamily: 'Satoshi-Medium',
    color: '#6B7280',
  },
  bottomDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#D1D5DB',
    marginHorizontal: 8,
  },
  raTag: {
    fontSize: 9,
    fontFamily: 'Satoshi-Regular',
    color: '#D1D5DB',
  },
});

export default SubscribedPFCard;
