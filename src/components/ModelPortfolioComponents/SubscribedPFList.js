import React, {useState, useMemo, useEffect, useRef} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Dimensions,
} from 'react-native';
import axios from 'axios';
import Config from 'react-native-config';
import server from '../../utils/serverConfig';
import {generateToken} from '../../utils/SecurityTokenManager';
import {getAdvisorSubdomain} from '../../utils/variantHelper';
import SubscribedPFCard from './SubscribedPFCard';

const {width: screenWidth} = Dimensions.get('window');

const BROKER_STATUS = {
  CONNECTED: 'connected',
  EXPIRED: 'expired',
};

const SubscribedPFList = ({
  modelPortfolioStrategy,
  repairTrades,
  userEmail,
  broker,
  userDetails,
  navigation,
}) => {
  const [selectedBroker, setSelectedBroker] = useState('ALL');

  // Convert single broker to array format for multi-broker support
  const connectedBrokers = useMemo(() => {
    if (!userDetails || !broker) return [];

    // When backend provides connected_brokers array, use it directly
    if (
      userDetails.connected_brokers &&
      userDetails.connected_brokers.length > 0
    ) {
      return userDetails.connected_brokers;
    }

    // Fallback to single broker from userDetails
    return [
      {
        broker: broker,
        clientCode: userDetails.clientCode,
        apiKey: userDetails.apiKey,
        jwtToken: userDetails.jwtToken,
        secretKey: userDetails.secretKey,
        viewToken: userDetails.viewToken,
        sid: userDetails.sid,
        serverId: userDetails.serverId,
        status:
          userDetails.connect_broker_status === 'connected'
            ? BROKER_STATUS.CONNECTED
            : BROKER_STATUS.EXPIRED,
      },
    ];
  }, [userDetails, broker]);

  // State for aggregated holdings from user_net_pf_model
  const [portfolioHoldings, setPortfolioHoldings] = useState([]);
  const [holdingsLoading, setHoldingsLoading] = useState(false);
  const hasFetchedHoldings = useRef(false);

  // Aggregate holdings summary per model
  const [holdingsSummary, setHoldingsSummary] = useState({});

  // Fetch user_net_pf_model data for all portfolio models
  useEffect(() => {
    const fetchAllHoldings = async () => {
      if (
        !userEmail ||
        !modelPortfolioStrategy?.length ||
        hasFetchedHoldings.current
      ) {
        return;
      }

      setHoldingsLoading(true);
      hasFetchedHoldings.current = true;

      try {
        const allHoldings = [];
        const summaryByModel = {};

        for (const portfolio of modelPortfolioStrategy) {
          const modelName = portfolio?.model_name;
          if (!modelName) continue;

          try {
            const response = await axios.get(
              `${server.server.baseUrl}api/model-portfolio-db-update/subscription-raw-amount?email=${encodeURIComponent(
                userEmail,
              )}&modelName=${encodeURIComponent(
                modelName,
              )}&user_broker=${encodeURIComponent(broker || '')}`,
              {
                headers: {
                  'Content-Type': 'application/json',
                  'X-Advisor-Subdomain': getAdvisorSubdomain(),
                  'aq-encrypted-key': generateToken(
                    Config.REACT_APP_AQ_KEYS,
                    Config.REACT_APP_AQ_SECRET,
                  ),
                },
              },
            );

            const data = response.data?.data;
            if (data?.user_net_pf_model?.length > 0) {
              // Get the latest entry sorted by execDate
              const sortedPortfolio = data.user_net_pf_model.sort(
                (a, b) => new Date(b.execDate) - new Date(a.execDate),
              );
              const latestEntry = sortedPortfolio[0];

              // Filter out rejected/failed orders
              const rejectedStatuses = [
                'rejected',
                'failure',
                'cancelled',
                'failed',
                'unplaced',
              ];
              const validOrders = latestEntry?.order_results?.filter(order => {
                const status = (order.orderStatus || '').toLowerCase();
                return (
                  !rejectedStatuses.includes(status) &&
                  Number(order.quantity || 0) > 0
                );
              });

              if (validOrders?.length > 0) {
                const totalInvested = validOrders.reduce((total, stock) => {
                  return (
                    total +
                    (parseFloat(stock?.averagePrice) || 0) *
                      (stock?.quantity || 0)
                  );
                }, 0);

                summaryByModel[modelName] = {
                  totalInvested,
                  orderResults: validOrders,
                  latestEntry,
                };

                const transformedHoldings = validOrders.map(order => ({
                  symbol: order.symbol || order.tradingsymbol || '',
                  exchange: order.exchange || 'NSE',
                  quantity: Number(order.quantity || 0),
                  avgPrice: Number(
                    order.averagePrice || order.avgPrice || 0,
                  ),
                  ltp: 0,
                  pnl: 0,
                  pnlPercent: 0,
                  broker:
                    order.user_broker ||
                    latestEntry.user_broker ||
                    data.user_broker ||
                    broker ||
                    'Unknown',
                  modelName: modelName,
                }));
                allHoldings.push(...transformedHoldings);
              }
            }
          } catch (err) {
            console.error(
              `Error fetching holdings for model ${modelName}:`,
              err,
            );
          }
        }

        setPortfolioHoldings(allHoldings);
        setHoldingsSummary(summaryByModel);
      } catch (error) {
        console.error('Error fetching portfolio holdings:', error);
      } finally {
        setHoldingsLoading(false);
      }
    };

    fetchAllHoldings();
  }, [userEmail, modelPortfolioStrategy, broker]);

  // Broker filter tabs for multi-broker support
  const brokerTabs = useMemo(() => {
    if (connectedBrokers.length <= 1) return [];
    const tabs = [{label: 'All', value: 'ALL'}];
    connectedBrokers.forEach(b => {
      tabs.push({
        label: b.broker,
        value: b.broker,
      });
    });
    return tabs;
  }, [connectedBrokers]);

  // Filter portfolios based on selected broker
  const filteredHoldings = useMemo(() => {
    if (selectedBroker === 'ALL') return portfolioHoldings;
    return portfolioHoldings.filter(h => h.broker === selectedBroker);
  }, [portfolioHoldings, selectedBroker]);

  // Compute aggregated totals for the summary header
  const aggregatedTotals = useMemo(() => {
    const holdingsToUse =
      selectedBroker === 'ALL'
        ? portfolioHoldings
        : portfolioHoldings.filter(h => h.broker === selectedBroker);

    const totalInvested = holdingsToUse.reduce((sum, h) => {
      return sum + h.avgPrice * h.quantity;
    }, 0);

    return {totalInvested, count: holdingsToUse.length};
  }, [portfolioHoldings, selectedBroker]);

  const handleCardPress = modelName => {
    navigation.navigate('AfterSubscriptionScreen', {
      fileName: modelName,
    });
  };

  const renderPortfolioItem = ({item, index}) => {
    const allRebalances = item?.model?.rebalanceHistory || [];
    const sortedRebalances = allRebalances.sort(
      (a, b) => new Date(b.rebalanceDate) - new Date(a.rebalanceDate),
    );
    const latest = sortedRebalances[0];

    const matchingFailedTrades = repairTrades?.find(
      trade =>
        trade.modelId === latest?.model_Id &&
        trade.failedTrades.length !== 0,
    );

    const modelName = item?.model_name;
    const summary = holdingsSummary[modelName] || null;

    return (
      <SubscribedPFCard
        key={index}
        modelName={modelName}
        userEmail={userEmail}
        broker={broker}
        userBroker={broker}
        repairTrades={matchingFailedTrades ? true : false}
        onPress={() => handleCardPress(modelName)}
      />
    );
  };

  // "Coming Soon" state
  const advisorSubdomain = getAdvisorSubdomain();
  if (advisorSubdomain === 'profitx') {
    return (
      <View style={styles.emptyStateContainer}>
        <View style={styles.emptyIconWrapper}>
          <Text style={styles.emptyIcon}>📊</Text>
        </View>
        <Text style={styles.emptyTitle}>Coming Soon</Text>
        <Text style={styles.emptyDescription}>
          Portfolio models are being prepared. Check back soon for curated
          investment strategies.
        </Text>
      </View>
    );
  }

  // Empty state - no subscribed portfolios
  if (!modelPortfolioStrategy?.length) {
    return (
      <View style={styles.emptyStateContainer}>
        <View style={styles.emptyIconWrapperGray}>
          <Text style={styles.emptyIcon}>📋</Text>
        </View>
        <Text style={styles.emptyTitle}>No Active Portfolios</Text>
        <Text style={styles.emptyDescription}>
          You haven't subscribed to any portfolio models yet. Browse available
          portfolios to get started with your investment journey.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Broker Filter Tabs (multi-broker) */}
      {brokerTabs.length > 0 && (
        <View style={styles.brokerTabsContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.brokerTabsScroll}>
            {brokerTabs.map(tab => (
              <TouchableOpacity
                key={tab.value}
                style={[
                  styles.brokerTab,
                  selectedBroker === tab.value && styles.brokerTabActive,
                ]}
                onPress={() => setSelectedBroker(tab.value)}>
                <Text
                  style={[
                    styles.brokerTabText,
                    selectedBroker === tab.value &&
                      styles.brokerTabTextActive,
                  ]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Portfolio Header */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Portfolio Models</Text>
        {holdingsLoading && (
          <ActivityIndicator size="small" color="#0076FB" />
        )}
      </View>

      {/* Column Headers */}
      <View style={styles.columnHeaderRow}>
        <Text style={[styles.columnHeader, styles.columnNameHeader]}>
          Model Name
        </Text>
        <Text style={[styles.columnHeader, styles.columnValueHeader]}>
          Invested
        </Text>
        <Text style={[styles.columnHeader, styles.columnValueHeader]}>
          Returns
        </Text>
      </View>

      {/* Loading State */}
      {holdingsLoading && !portfolioHoldings.length ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0076FB" />
          <Text style={styles.loadingText}>Loading portfolios...</Text>
        </View>
      ) : (
        <FlatList
          data={modelPortfolioStrategy}
          renderItem={renderPortfolioItem}
          keyExtractor={(item, index) =>
            item?.model_name || index.toString()
          }
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={styles.listContent}
          scrollEnabled={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    overflow: 'hidden',
  },
  // Broker tabs
  brokerTabsContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  brokerTabsScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brokerTab: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    marginRight: 8,
  },
  brokerTabActive: {
    backgroundColor: '#0076FB',
  },
  brokerTabText: {
    fontSize: 12,
    fontFamily: 'Satoshi-Medium',
    color: '#666666',
  },
  brokerTabTextActive: {
    color: '#FFFFFF',
  },
  // Section header
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Satoshi-Bold',
    color: '#1A1A2E',
  },
  // Column headers
  columnHeaderRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F8F9FA',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F0F0F0',
  },
  columnHeader: {
    fontSize: 11,
    fontFamily: 'Satoshi-Medium',
    color: '#888888',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  columnNameHeader: {
    flex: 2,
  },
  columnValueHeader: {
    flex: 1,
    textAlign: 'right',
  },
  // Loading
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    fontFamily: 'Satoshi-Regular',
    color: '#888888',
  },
  // List
  listContent: {
    paddingBottom: 8,
  },
  separator: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginHorizontal: 16,
  },
  // Empty states
  emptyStateContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    paddingVertical: 48,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconWrapper: {
    width: 72,
    height: 72,
    borderRadius: 16,
    backgroundColor: '#E8F0FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyIconWrapperGray: {
    width: 72,
    height: 72,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyIcon: {
    fontSize: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Satoshi-Bold',
    color: '#1A1A2E',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 13,
    fontFamily: 'Satoshi-Regular',
    color: '#888888',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 300,
  },
});

export default SubscribedPFList;
