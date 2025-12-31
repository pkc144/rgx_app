import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  TextInput,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useWindowDimensions } from 'react-native';
import { XIcon, CandlestickChartIcon, AlertOctagon } from 'lucide-react-native';
import server from '../../utils/serverConfig';
import IsMarketHours from '../../utils/isMarketHours';
import axios from 'axios';
import DummyBrokerHoldingConfirmation from './DummyBrokerHoldingConfirmation';
import CryptoJS from 'react-native-crypto-js';
import Config from 'react-native-config';
import { generateToken } from '../../utils/SecurityTokenManager';
const { height: screenHeight } = Dimensions.get('window');
import StepProgressBar from '../../UIComponents/RebalanceAdvicesUI/StepProgressBar';
import TotalAmountTextRebalance from './DynamicText/totalAmountRebalance';
import { useTrade } from '../../screens/TradeContext';
import debounce from 'lodash.debounce';

const RebalanceModal = ({
  userEmail,
  visible,
  setOpenRebalanceModal,
  data,
  calculatedPortfolioData,
  broker,
  apiKey,
  userDetails,
  jwtToken,
  secretKey,
  clientCode,
  sid,
  serverId,
  viewToken,
  setOpenSucessModal,
  setOrderPlacementResponse,
  modelPortfolioModelId,
  modelPortfolioRepairTrades,
  getRebalanceRepair,
  storeModalName,
  getModelPortfolioStrategyDetails,
  setShowAngleOneTpinModel,
  setShowFyersTpinModal,
  setShowDhanTpinModel,
  setShowOtherBrokerModel,
  setIsReturningFromOtherBrokerModal,
  isReturningFromOtherBrokerModal,
  rebalanceExecutionStatus,
}) => {
  const { brokerStatus, configData } = useTrade();
  const advisorTag = configData?.config?.REACT_APP_ADVISOR_SPECIFIC_TAG;
  console.log("Calculated Portfolio Data---", calculatedPortfolioData);

  // Parse skipped stocks message
  const skippedStocksMessage = calculatedPortfolioData?.message;
  const hasSkippedStocks =
    skippedStocksMessage &&
    skippedStocksMessage.includes('Stocks not bought due to low allowed balance');

  const skippedStocksList = hasSkippedStocks
    ? skippedStocksMessage
      .split('Stocks not bought due to low allowed balance:')[1]
      ?.split(',')
      .map(s => s.trim())
      .filter(s => s)
    : [];

  // Get minimum investment from model portfolio data
  const minInvestment = calculatedPortfolioData?.minInvestmentValue;
  console.log("min investment", minInvestment)
  const [currentStep, setCurrentStep] = useState(3);
  const stepsData = [1, 2, 3];

  // NEW: Check if broker is disconnected
  const isBrokerDisconnected =
    brokerStatus === 'Disconnected' || brokerStatus === undefined;

  const [editableData, setEditableData] = useState([]);

  // Calculate required fund from editableData
  const calculateRequiredFund = () => {
    let total = 0;
    editableData.forEach(item => {
      const price = parseFloat(item.editablePrice) || 0;
      const qty = parseInt(item.editableQty) || 0;
      if (item.orderType === 'BUY') {
        total += price * qty;
      } else if (item.orderType === 'SELL') {
        total -= price * qty;
      }
    });
    return total < 0 ? 0 : total;
  };

  // NEW: State for DummyBroker modal
  const [showDummyBrokerModal, setShowDummyBrokerModal] = useState(false);

  const { width } = useWindowDimensions();
  const [loading, setLoading] = useState();

  const checkValidApiAnSecret = apiKey => {
    const bytesKey = CryptoJS.AES.decrypt(apiKey, 'ApiKeySecret');
    const Key = bytesKey.toString(CryptoJS.enc.Utf8);
    if (Key) {
      return Key;
    }
  };

  const filteredData = data.filter(item => item.model_name === storeModalName);

  // Now, let's find the matching repair trade
  const matchingRepairTrade =
    modelPortfolioRepairTrades &&
    modelPortfolioRepairTrades?.find(
      trade => trade.modelId === modelPortfolioModelId,
    );

  const repairStatus =
    matchingRepairTrade &&
    matchingRepairTrade.failedTrades &&
    matchingRepairTrade.failedTrades.length > 0;

  // Check if modelPortfolioRepairTrades exists and has trades
  let dataArray = [];
  if (repairStatus && rebalanceExecutionStatus !== "toExecute") {
    dataArray =
      matchingRepairTrade?.failedTrades
        ?.filter((trade) => !trade?.advSymbol?.includes("CASH-EQ"))
        ?.map((trade) => ({
          symbol: trade?.advSymbol,
          qty: parseInt(trade?.advQTY, 10),
          orderType: trade?.transactionType.toUpperCase(),
          exchange: trade?.advExchange,
          zerodhaTradeId: trade?.zerodhaTradeId,
          token: trade?.token ? trade?.token : "",
        })) || [];
  } else if (calculatedPortfolioData && calculatedPortfolioData?.length !== 0) {
    dataArray =
      calculatedPortfolioData?.length !== 0
        ? [
          ...(calculatedPortfolioData?.buy
            ?.filter((item) => !item?.symbol?.includes("CASH-EQ"))
            ?.map((item) => ({
              symbol: item.symbol,
              token: item?.token ? item?.token : "",
              qty: item.quantity,
              orderType: "BUY",
              exchange: item.exchange,
              zerodhaTradeId: item.zerodhaTradeId,
            })) || []),
          ...(calculatedPortfolioData?.sell
            ?.filter((item) => !item?.symbol?.includes("CASH-EQ"))
            ?.map((item) => ({
              symbol: item.symbol,
              token: item?.token ? item?.token : "",
              qty: item.quantity,
              orderType: "SELL",
              exchange: item.exchange,
              zerodhaTradeId: item.zerodhaTradeId,
            })) || []),
        ]
        : [];
  }

  const [marketPrices, setMarketPrices] = useState({});

  const fetchMarketPrices = async symbolsData => {
    try {
      const data = JSON.stringify({
        Orders: symbolsData.map(item => ({
          exchange: item.exchange || 'NSE', // Use the exchange from the item
          segment: '',
          tradingSymbol: item.symbol,
        })),
      });

      console.log('data', data);
      const config = {
        method: 'post',
        url: `${server.ccxtServer.baseUrl}angelone/market-data`,
        headers: {
          'Content-Type': 'application/json',
          'X-Advisor-Subdomain': configData?.config?.REACT_APP_HEADER_NAME,
          'aq-encrypted-key': generateToken(
            Config.REACT_APP_AQ_KEYS,
            Config.REACT_APP_AQ_SECRET,
          ),
        },
        data,
      };

      const response = await axios.request(config);
      const pricesMap = {};
      response?.data?.data?.fetched?.forEach(item => {
        pricesMap[item.tradingSymbol] = item.ltp;
      });

      setMarketPrices(pricesMap);
    } catch (error) {
      console.error('Error fetching market prices:', error);
    }
  };
  useEffect(() => {
    if (visible && dataArray.length > 0) {
      // Pass the full dataArray items with exchange info
      fetchMarketPrices(dataArray);
    }
  }, [visible]);

  // Utility to get the last traded price for a symbol
  const getLTPForSymbol = useCallback(
    symbol => {
      return marketPrices[symbol] ?? null;
    },
    [marketPrices],
  );

  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;

    if (
      visible &&
      isBrokerDisconnected &&
      dataArray.length > 0 &&
      Object.keys(marketPrices).length > 0
    ) {
      initializeEditableData();
    }
  }, [visible, marketPrices, isBrokerDisconnected, dataArray]);

  // Clear on modal close
  useEffect(() => {
    if (!visible) {
      setEditableData([]);
      initializedRef.current = false;
    }
  }, [visible]);

  const initializeEditableData = useCallback(() => {
    if (initializedRef.current) return;

    // console.log('Initializing editable data with marketPrices:', marketPrices);

    const initialData = dataArray.map(item => ({
      ...item,
      editablePrice: getLTPForSymbol(item.symbol) || 0,
      editableQty: item.qty,
      id: item.symbol,
    }));

    setEditableData(initialData);
    initializedRef.current = true;
  }, [dataArray, getLTPForSymbol, marketPrices]);

  // NEW: Function to open DummyBroker confirmation modal

  const [showPriceErrorModal, setShowPriceErrorModal] = useState(false);

  const validatePriceBeforeConfirm = () => {
    const anyZeroPrice = editableData.some(
      item => parseFloat(item.editablePrice) === 0,
    );
    if (anyZeroPrice) {
      setShowPriceErrorModal(true);
      return false;
    }
    return true;
  };

  const openDummyBrokerConfirmation = () => {
    if (validatePriceBeforeConfirm()) {
      setShowDummyBrokerModal(true);
    }
  };

  // NEW: Function to close DummyBroker confirmation modal
  const closeDummyBrokerConfirmation = () => {
    setShowDummyBrokerModal(false);
  };

  const convertResponse = dataArray => {
    return dataArray.map(item => {
      return {
        transactionType: item.orderType,
        exchange: item.exchange,
        segment: 'EQUITY',
        productType: 'DELIVERY',
        orderType: 'MARKET',
        price: 0,
        tradingSymbol: item.symbol,
        quantity: item.qty,
        priority: 0,
        user_broker: broker,
      };
    });
  };

  const stockDetails = convertResponse(dataArray);

  const placeOrder = async () => {
    setLoading(true);
    const matchingRepairTrade =
      modelPortfolioRepairTrades &&
      modelPortfolioRepairTrades?.find(
        trade => trade.modelId === modelPortfolioModelId,
      );

    const getBasePayload = () => ({
      user_broker: broker,
      user_email: userEmail,
      trades: stockDetails,
      model_id: modelPortfolioModelId,
    });

    const getBrokerSpecificPayload = () => {
      console.log('Broker Clientcode:', clientCode);
      switch (broker) {
        case 'IIFL Securities':
          return { clientCode };
        case 'ICICI Direct':
        case 'Upstox':
          return {
            apiKey: checkValidApiAnSecret(apiKey),
            secretKey: checkValidApiAnSecret(secretKey),
            [broker === 'Upstox' ? 'accessToken' : 'sessionToken']: jwtToken,
          };
        case 'Zerodha':
          return {
            apiKey: checkValidApiAnSecret(apiKey),
            secretKey: checkValidApiAnSecret(secretKey),
            accessToken: jwtToken,
          };
        case 'Angel One':
          return { apiKey, jwtToken };
        case 'Hdfc Securities':
          return {
            apiKey: checkValidApiAnSecret(apiKey),
            accessToken: jwtToken,
          };
        case 'Dhan':
          return {
            clientId: clientCode,
            accessToken: jwtToken,
          };
        case 'Kotak':
          return {
            consumerKey: checkValidApiAnSecret(apiKey),
            consumerSecret: checkValidApiAnSecret(secretKey),
            accessToken: jwtToken,
            viewToken: viewToken,
            sid: sid,
            serverId: serverId ? serverId : "",
          };
        case 'AliceBlue':
          return {
            clientId: clientCode,
            accessToken: jwtToken,
            apiKey: apiKey,
          };
        case 'Fyers':
          return {
            clientId: clientCode,
            accessToken: jwtToken,
          };
        case "Groww":
          return {
            accessToken: jwtToken,
          };
        case "Motilal Oswal":
          return {
            clientCode: clientCode,
            accessToken: jwtToken,
            apiKey: checkValidApiAnSecret(apiKey),
          };
        default:
          return {};
      }
    };

    const getAdditionalPayload = () => {
      if (matchingRepairTrade) {
        return {
          modelName: matchingRepairTrade.modelName,
          advisor: advisorTag,
          unique_id: matchingRepairTrade?.uniqueId,
        };
      } else {
        return {
          modelName: filteredData[0]['model_name'],
          advisor: advisorTag,
          unique_id: calculatedPortfolioData?.uniqueId,
        };
      }
    };

    const payload = {
      ...getBasePayload(),
      ...getBrokerSpecificPayload(),
      ...getAdditionalPayload(),
    };

    const specialBrokers = [
      'IIFL Securities',
      'ICICI Direct',
      'Upstox',
      'Kotak',
      'Hdfc Securities',
      'AliceBlue',
      'Motilal Oswal',
      'Groww',
    ];

    const config = {
      method: 'post',
      url: `${server.ccxtServer.baseUrl}rebalance/process-trade`,

      headers: {
        'Content-Type': 'application/json',
        'X-Advisor-Subdomain': configData?.config?.REACT_APP_HEADER_NAME,
        'aq-encrypted-key': generateToken(
          Config.REACT_APP_AQ_KEYS,
          Config.REACT_APP_AQ_SECRET,
        ),
      },

      data: JSON.stringify(payload),
    };

    await axios
      .request(config)
      .then(async response => {
        const checkData = response?.data?.results;
        setOrderPlacementResponse(response?.data?.results);

        const isMixed =
          checkData?.some(stock => stock.transactionType === 'BUY') &&
          checkData?.some(stock => stock.transactionType === 'SELL');
        const allBuy = checkData?.every(
          stock => stock.transactionType === 'BUY',
        );
        const allSell = checkData?.every(
          stock => stock.transactionType === 'SELL',
        );

        const rejectedSellCount = response.data.results.reduce(
          (count, order) => {
            return (order?.orderStatus === 'Rejected' ||
              order?.orderStatus === 'rejected' ||
              order?.orderStatus === 'Rejected' ||
              order?.orderStatus === 'cancelled' ||
              order?.orderStatus === 'CANCELLED' ||
              order?.orderStatus === 'Cancelled') &&
              order.transactionType === 'SELL'
              ? count + 1
              : count;
          },
          0,
        );

        const successCount = response.data.results.reduce((count, order) => {
          return (order?.orderStatus === 'COMPLETE' ||
            order?.orderStatus === 'Complete' ||
            order?.orderStatus === 'complete' ||
            order?.orderStatus === 'COMPLETE' ||
            order?.orderStatus === 'Placed' ||
            order?.orderStatus === 'PLACED' ||
            order?.orderStatus === 'Executed' ||
            order?.orderStatus === 'Ordered' ||
            order?.orderStatus === 'open' ||
            order?.orderStatus === 'OPEN' ||
            order?.orderStatus === 'Traded' ||
            order?.orderStatus === 'TRADED' ||
            order?.orderStatus === 'Transit' ||
            order?.orderStatus === 'TRANSIT') &&
            (order.transactionType === 'SELL' || isMixed)
            ? count + 1
            : count;
        }, 0);

        if (
          !isReturningFromOtherBrokerModal &&
          specialBrokers.includes(broker)
        ) {
          if (allBuy) {
            // Proceed with order placement for BUY
            setOpenSucessModal(true);
            setOpenRebalanceModal(false);
          } else if (
            (allSell || isMixed) &&
            !userDetails?.is_authorized_for_sell &&
            rejectedSellCount >= 1
          ) {
            setShowOtherBrokerModel(true);
            setOpenRebalanceModal(false);
            setLoading(false);
            return; // Exit the function early
          } else {
            setOpenSucessModal(true);
            setOpenRebalanceModal(false);
          }
        } else {
          if (
            broker === 'Angel One' &&
            (allSell || isMixed) &&
            !userDetails?.is_authorized_for_sell &&
            rejectedSellCount >= 1
          ) {
            setOpenSucessModal(false);
            setShowAngleOneTpinModel(true);
            return;
          } else if (
            broker === 'Dhan' &&
            (allSell || isMixed) &&
            !userDetails?.is_authorized_for_sell &&
            rejectedSellCount >= 1
          ) {
            setShowDhanTpinModel(true);
            setOpenSucessModal(false);
            return;
          } else if (
            broker === 'Fyers' &&
            (allSell || isMixed) &&
            !userDetails?.is_authorized_for_sell &&
            rejectedSellCount >= 1
          ) {
            setOpenSucessModal(false);
            setShowFyersTpinModal(true);
          } else {
            setOpenSucessModal(true);
            setOpenRebalanceModal(false);
          }
        }

        getRebalanceRepair();
        const updateData = {
          modelId: modelPortfolioModelId,
          orderResults: response.data.results,
          userEmail: userEmail,
          modelName: filteredData[0]['model_name'],
        };

        return axios.post(
          `${server.server.baseUrl}api/model-portfolio-db-update`,
          {
            headers: {
              'Content-Type': 'application/json',
              'X-Advisor-Subdomain': configData?.config?.REACT_APP_HEADER_NAME,
              'aq-encrypted-key': generateToken(
                Config.REACT_APP_AQ_KEYS,
                Config.REACT_APP_AQ_SECRET,
              ),
            },
          },
          updateData,
        );
      })
      .then(() => {
        setLoading(false);
        setOpenRebalanceModal(false);
        getModelPortfolioStrategyDetails();
      })
      .catch(error => {
        setLoading(false);
        getModelPortfolioStrategyDetails();
      });
    setIsReturningFromOtherBrokerModal(false);
  };

  const handleClose = () => {
    setOpenRebalanceModal(false);
  };

  const onSlideComplete = () => {
    placeOrder();
  };

  const isMarketHours = IsMarketHours();

  const ListItem = React.memo(
    ({
      item,
      index,
      isBrokerDisconnected,
      handlePriceSave,
      handleQtySave,
      getLTPForSymbol,
    }) => {
      // 🧠 Local state for TextInput values
      const [localPrice, setLocalPrice] = React.useState(
        item.editablePrice?.toString() ?? '',
      );
      const [localQty, setLocalQty] = React.useState(
        item.editableQty?.toString() ?? '',
      );

      const displayPrice = isBrokerDisconnected
        ? localPrice
        : getLTPForSymbol(item.symbol)?.toString() ?? '0';

      const displayQuantity = isBrokerDisconnected
        ? localQty
        : item.qty?.toString() ?? '0';

      return (
        <View style={styles.rowContainer}>
          <View style={styles.leftContainer}>
            <Text style={styles.symbol}>{item.symbol}</Text>
            <Text
              style={[
                styles.cellText,
                item.orderType === 'BUY' ? styles.buyOrder : styles.sellOrder,
              ]}>
              {item.orderType}
            </Text>
          </View>

          <View style={styles.rightContainer}>
            {isBrokerDisconnected ? (
              <TextInput
                style={styles.quantityInput}
                value={displayPrice}
                onChangeText={setLocalPrice} // only local change
                onEndEditing={() => handlePriceSave(index, localPrice)} // save to parent once done
                keyboardType="numeric"
                placeholder="Price"
                returnKeyType="done"
                blurOnSubmit={false}
              />
            ) : (
              <Text style={styles.qty}>{displayPrice}</Text>
            )}
          </View>

          <View style={styles.rightContainer}>
            {isBrokerDisconnected ? (
              <TextInput
                style={styles.quantityInput}
                value={displayQuantity}
                onChangeText={setLocalQty}
                onEndEditing={() => handleQtySave(index, localQty)}
                keyboardType="numeric"
                placeholder="Qty"
                returnKeyType="done"
                blurOnSubmit={false}
              />
            ) : (
              <Text style={styles.qty}>{item.qty}</Text>
            )}
          </View>
        </View>
      );
    },
  );

  const renderListItem = useCallback(
    ({ item, index }) => (
      <ListItem
        item={item}
        index={index}
        isBrokerDisconnected={isBrokerDisconnected}
        handlePriceSave={handlePriceSave}
        handleQtySave={handleQtySave}
        getLTPForSymbol={getLTPForSymbol}
      />
    ),
    [isBrokerDisconnected, handlePriceSave, handleQtySave, getLTPForSymbol],
  );

  const debouncedHandlePriceSave = useCallback(
    debounce((index, price) => {
      setEditableData(prev =>
        prev.map((item, i) =>
          i === index ? { ...item, editablePrice: price } : item,
        ),
      );
    }, 300),
    [],
  );

  const debouncedHandleQtySave = useCallback(
    debounce((index, qty) => {
      setEditableData(prev =>
        prev.map((item, i) =>
          i === index ? { ...item, editableQty: qty } : item,
        ),
      );
    }, 300),
    [],
  );

  const handlePriceSave = (index, price) => {
    debouncedHandlePriceSave(index, parseFloat(price) || 0);
  };

  const handleQtySave = (index, qty) => {
    debouncedHandleQtySave(index, parseInt(qty) || 0);
  };

  return (
    <Modal transparent={true} visible={visible} onRequestClose={handleClose}>
      <SafeAreaView style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { width: width * 1 }]}>
          <View style={{ flex: 1 }}>
            <FlatList
              data={isBrokerDisconnected ? editableData : dataArray}
              keyExtractor={item => item.symbol}
              renderItem={renderListItem}
              // ✅ This is CRUCIAL — prevents full re-render on typing
              extraData={editableData}
              keyboardShouldPersistTaps="handled"
              removeClippedSubviews={false}
              showsVerticalScrollIndicator={true}
              persistentScrollbar={true}
              contentContainerStyle={{
                paddingBottom: 90,
              }}
              // ✅ HEADER COMPONENT (all top section)
              ListHeaderComponent={
                <>
                  {/* Header bar */}
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingHorizontal: 20,
                      paddingTop: 20,
                      justifyContent: 'space-between',
                    }}>
                    <Text></Text>
                    <TouchableOpacity
                      onPress={handleClose}
                      style={styles.closeButton}>
                      <XIcon size={24} color="#000" />
                    </TouchableOpacity>
                  </View>

                  {/* Step progress bar */}
                  {currentStep === 3 && (
                    <View style={styles.progressBarContainer}>
                      <StepProgressBar
                        steps={stepsData}
                        currentStep={currentStep}
                      />
                    </View>
                  )}

                  <View style={{ borderColor: '#E8E8E8', marginTop: 5 }} />

                  {/* Skipped Stocks Warning */}
                  {hasSkippedStocks && (
                    <View style={styles.warningContainer}>
                      <View style={styles.warningHeader}>
                        <AlertOctagon size={20} color="#D97706" />
                        <Text style={styles.warningTitle}>
                          Stocks Skipped Due to Low Balance
                        </Text>
                      </View>
                      <Text style={styles.warningText}>
                        Following stocks could not be considered in the allocation
                        as balance allocated to the portfolio is close to or lower than minimum investment required:
                      </Text>
                      <View style={styles.skippedStocksList}>
                        {skippedStocksList?.map((stock, idx) => (
                          <Text key={idx} style={styles.skippedStockItem}>
                            • {stock}
                          </Text>
                        ))}
                      </View>
                      {minInvestment && (
                        <Text style={styles.minInvestmentText}>
                          Recommended Minimum Investment: ₹
                          {parseFloat(minInvestment).toLocaleString('en-IN')}
                        </Text>
                      )}
                    </View>
                  )}

                  {/* Header row */}
                  {!(dataArray.length === 0) && (
                    <View
                      style={[
                        styles.rowContainerhead,
                        {
                          backgroundColor: '#fff',
                          paddingVertical: 8,
                          borderRadius: 8,
                          marginHorizontal: 20,
                          marginBottom: 10,
                        },
                      ]}>
                      <View style={styles.leftContainerhead}>
                        <Text style={styles.headerTexthead}>Stocks</Text>
                      </View>
                      <View style={styles.rightContainerhead}>
                        <Text style={styles.headerTexthead}>
                          {isBrokerDisconnected ? 'Price' : 'Current Price'}
                        </Text>
                      </View>
                      <View style={styles.quantityContainerhead}>
                        <Text style={styles.headerTexthead}>Quantity</Text>
                      </View>
                    </View>
                  )}
                </>
              }
              // Empty state
              ListEmptyComponent={
                <View
                  style={{
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: 20,
                    paddingHorizontal: 20,
                  }}>
                  <Text
                    style={{
                      fontFamily: 'Poppins-SemiBold',
                      color: 'black',
                      fontSize: 18,
                      textAlign: 'center',
                      marginVertical: 10,
                    }}>
                    No Action Required at This Time
                  </Text>
                  <Text
                    style={{
                      fontFamily: 'Poppins-Regular',
                      color: 'grey',
                      textAlign: 'center',
                      marginBottom: 10,
                      fontSize: 14,
                      lineHeight: 20,
                    }}>
                    Based on the latest rebalance shared by your advisor and your
                    current model portfolio position, no trades need to be
                    executed at this moment considering your existing investment
                    amount.
                  </Text>
                  <Text
                    style={{
                      fontFamily: 'Poppins-Regular',
                      color: 'grey',
                      textAlign: 'center',
                      marginBottom: 20,
                      fontSize: 14,
                      lineHeight: 20,
                    }}>
                  </Text>
                </View>
              }
            />
            <View
              style={[
                styles.notecontainer,
                { marginHorizontal: 20, marginTop: 10 },
              ]}>
              <Text style={styles.noteTitle}>Note:</Text>
              <Text style={styles.noteText}>
                You will require a balance of{' '}
                {isBrokerDisconnected ? (
                  `₹${calculateRequiredFund().toFixed(2)}`
                ) : (
                  <TotalAmountTextRebalance
                    stockDetails={dataArray}
                    type={'reviewTrade'}
                    textStyle={{
                      fontFamily: 'Poppins-Regular',
                      fontSize: 12,
                      color: '#333',
                    }}
                  />
                )}{' '}
                in your broker. Please execute these transactions. If you confirm,
                we will record these transactions as EXECUTED.
              </Text>
            </View>

            {/* Action buttons */}
            {dataArray.length > 0 && (
              <>
                {isBrokerDisconnected ? (
                  <View
                    style={[
                      styles.brokerDisconnectedFooter,
                      { marginHorizontal: 20 },
                    ]}>
                    <View style={styles.fundsContainer}>
                      <View style={styles.fundItem}>
                        <Text style={styles.fundLabel}>Required Fund</Text>
                        <Text style={styles.fundValue}>
                          ₹{calculateRequiredFund().toFixed(2)}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={openDummyBrokerConfirmation}
                      style={styles.confirmButton}>
                      <Text style={styles.confirmButtonText}>Confirm</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={onSlideComplete}
                    style={[
                      styles.nextStepButton,
                      (!isMarketHours || loading) && styles.buttonDisabled,
                      loading && styles.buttonLoading,
                    ]}
                    disabled={!isMarketHours || loading}>
                    {loading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.nextStepButtonText}>
                        {!isMarketHours ? 'Market is Closed' : 'Place Order'}
                      </Text>
                    )}
                  </TouchableOpacity>
                )}
              </>
            )}

            {/* Loading overlay */}
            {loading && (
              <ActivityIndicator
                size="small"
                color="#ffffff"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              />
            )}
          </View>
        </View>
      </SafeAreaView>

      {/* NEW: DummyBroker Confirmation Modal */}
      <DummyBrokerHoldingConfirmation
        userEmail={userEmail}
        isOpen={showDummyBrokerModal}
        onClose={closeDummyBrokerConfirmation}
        dummyBrokerConfirmationStockDetails={editableData}
        storeModalName={storeModalName}
        modelObjectId={modelPortfolioModelId}
        modelPortfolioModelId={modelPortfolioModelId}
        getModelPortfolioStrategyDetails={getModelPortfolioStrategyDetails}
        setOpenRebalanceModal={setOpenRebalanceModal}
        getRebalanceRepair={getRebalanceRepair}
        modelPortfolioRepairTrades={modelPortfolioRepairTrades}
        dummyBrokerCalculatedUniqueId={
          matchingRepairTrade?.uniqueId || calculatedPortfolioData?.uniqueId
        }
      />
      <Modal transparent visible={showPriceErrorModal} animationType="fade">
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(0,0,0,0.5)',
            paddingHorizontal: 20,
          }}>
          <View
            style={{
              backgroundColor: 'white',
              padding: 20,
              borderRadius: 8,
              width: '100%',
              maxWidth: 300,
              alignItems: 'center',
            }}>
            <Text
              style={{
                fontSize: 14,
                marginBottom: 12,
                textAlign: 'center',
                color: '#000000',
              }}>
              Buying Price cannot be "Zero" Kindly enter your correct Buying
              Price to confirm
            </Text>
            <TouchableOpacity
              onPress={() => setShowPriceErrorModal(false)}
              style={{
                backgroundColor: '#0056B7',
                paddingVertical: 10,
                paddingHorizontal: 20,
                borderRadius: 5,
              }}>
              <Text style={{ color: 'white', fontWeight: '600' }}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },

  notecontainer: {
    borderWidth: 1,
    borderColor: '#F9A825',
    borderRadius: 8,
    padding: 12,
    margin: 16,
    backgroundColor: '#fff',
  },
  buttonDisabled: {
    backgroundColor: '#7f9cbf',
  },
  noteTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F9A825',
    marginBottom: 4,
  },
  noteText: {
    fontSize: 11,
    color: '#333',
    fontFamily: 'Poppins-Regular',
    lineHeight: 20,
  },
  noteAmountText: {
    fontWeight: '600',
    color: '#0056B7',
  },

  // NEW: Broker disconnected styles

  brokerDisconnectedFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  fundsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  fundItem: {
    flexDirection: 'column',
  },
  fundLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  fundValue: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '600',
  },

  confirmButton: {
    backgroundColor: '#0056B7',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },

  rowContainerhead: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 10,
    alignItems: 'center',
  },
  nextStepButton: {
    backgroundColor: '#0056B7',
    marginHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextStepButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  leftContainerhead: {
    flex: 1,
    justifyContent: 'flex-start',
    alignContent: 'flex-start',
    alignItems: 'flex-start',
  },
  rightContainerhead: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityContainerhead: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTexthead: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 12,
    color: '#333',
    textAlign: 'center',
  },
  // NEW: Styles for warning message and skipped stocks
  warningContainer: {
    marginHorizontal: 20,
    marginTop: 15,
    marginBottom: 5,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FCD34D',
    borderRadius: 8,
    padding: 12,
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  warningTitle: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 14,
    color: '#D97706',
    marginLeft: 8,
  },
  warningText: {
    fontFamily: 'Satoshi-Regular',
    fontSize: 13,
    color: '#92400E',
    marginBottom: 8,
  },
  skippedStocksList: {
    marginLeft: 4,
    marginBottom: 8,
  },
  skippedStockItem: {
    fontFamily: 'Satoshi-Medium',
    fontSize: 13,
    color: '#B45309',
    marginBottom: 2,
  },
  minInvestmentText: {
    fontFamily: 'Satoshi-Bold',
    fontSize: 13,
    color: '#D97706',
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#FDE68A',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'transparent',
    marginLeft: 0,
    flex: 1,
  },

  buyOrder: {
    color: '#0056B7',
    alignSelf: 'flex-start',
  },
  sellOrder: {
    color: 'red',
  },
  cell: {
    borderWidth: 1,
    borderColor: 'grey',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  symbol: {
    alignSelf: 'flex-start',
    color: 'black',
    flexDirection: 'column',
    fontFamily: 'Poppins-Medium',
  },
  qty: {
    alignSelf: 'center',
    color: 'black',
    flexDirection: 'column',
    fontFamily: 'Poppins-Regular',
  },
  cellText: {
    alignSelf: 'flex-start',
    color: 'black',
    fontFamily: 'Poppins-SemiBold',
    fontSize: 12,
  },

  quantityInput: {
    width: 50,
    height: 30,
    padding: 2,
    marginHorizontal: 4,
    color: '#0d0c22',
    fontSize: 12,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#e9e8e8',
    borderRadius: 7,
  },

  modalContainer: {
    backgroundColor: '#fff',
    maxHeight: screenHeight,
    elevation: 5,
    flex: 1,
  },

  orderButton: {
    backgroundColor: '#000',
    paddingVertical: 15,
    marginHorizontal: 0,
    borderRadius: 10,
    alignItems: 'center',
  },
  orderButtonText: {
    color: '#fff',
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
  },
  leftContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    marginRight: 5,
    alignItems: 'flex-start',
  },
  rightContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    alignContent: 'center',
    alignSelf: 'center',
  },
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 10,
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#E8E8E8',
    paddingHorizontal: 16,
  },
});

export default RebalanceModal;
