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
import { XIcon, CandlestickChartIcon, AlertOctagon, CheckIcon } from 'lucide-react-native';
import server from '../../utils/serverConfig';
import IsMarketHours from '../../utils/isMarketHours';
import axios from 'axios';
import DummyBrokerHoldingConfirmation from './DummyBrokerHoldingConfirmation';
import CryptoJS from 'react-native-crypto-js';
import Config from 'react-native-config';
import { generateToken } from '../../utils/SecurityTokenManager';
import WebView from 'react-native-webview';
import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment';
import eventEmitter from '../../components/EventEmitter';
const { height: screenHeight } = Dimensions.get('window');
import StepProgressBar from '../../UIComponents/RebalanceAdvicesUI/StepProgressBar';
import TotalAmountTextRebalance from './DynamicText/totalAmountRebalance';
import { useTrade } from '../../screens/TradeContext';
import Toast from 'react-native-toast-message';
import debounce from 'lodash.debounce';
import { isOrderSuccess, isOrderRejected } from '../../utils/orderStatusUtils';
import { validateBrokerSession } from '../../utils/brokerSessionUtils';
import { convertResponse } from '../../utils/tradeUtils';

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
  edisStatus,
  dhanEdisStatus,
  setShowDdpiModal,
}) => {
  const { brokerStatus, configData } = useTrade();
  const advisorTag = configData?.config?.REACT_APP_ADVISOR_SPECIFIC_TAG;
  // Add fallback for API key
  let zerodhaApiKey = configData?.config?.REACT_APP_ZERODHA_API_KEY || Config?.REACT_APP_ZERODHA_API_KEY;
  if (!zerodhaApiKey) {
    console.log('[RebalanceModal] WARNING: API key not found!');
  } else {
    console.log('[RebalanceModal] Using API key:', zerodhaApiKey.substring(0, 4) + '...');
  }
  const angelOneApiKey = configData?.config?.REACT_APP_ANGEL_ONE_API_KEY;

  // Helper functions for Kite basket
  const mapKiteProductType = (productType) => {
    if (!productType) return "CNC";
    const upper = productType.toUpperCase();
    if (upper === "DELIVERY" || upper === "CNC") return "CNC";
    if (upper === "INTRADAY" || upper === "MIS") return "MIS";
    if (upper === "BO") return "BO";
    if (upper === "CO") return "CO";
    return "CNC";
  };

  const mapKiteOrderType = (orderType) => {
    if (!orderType) return "MARKET";
    const upper = orderType.toUpperCase();
    if (upper === "MARKET") return "MARKET";
    if (upper === "LIMIT") return "LIMIT";
    if (upper === "SL" || upper === "SL_M" || upper === "STOP") return "SL";
    return "MARKET";
  };

  // Zerodha WebView state
  const webViewRef = useRef(null);
  const [webView, setWebView] = useState(false);
  const [htmlContent, setHtmlContent] = useState('');
  const [zerodhaStatus, setZerodhaStatus] = useState(null);
  const [zerodhaRequestType, setZerodhaRequestType] = useState(null);
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
    if (!apiKey) return null;
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
  if (repairStatus && rebalanceExecutionStatus && rebalanceExecutionStatus !== "toExecute") {
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
              rebalancePrice: item.rebalance_price,
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
              rebalancePrice: item.rebalance_price,
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
          'X-Advisor-Subdomain': configData?.config?.REACT_APP_HEADER_NAME || configData?.subdomain,
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
      dataArray.length > 0
    ) {
      // Initialize as soon as market prices are available, or fallback to rebalance prices
      if (Object.keys(marketPrices).length > 0) {
        initializeEditableData();
      } else if (dataArray.some(item => item.rebalancePrice)) {
        // Use rebalance prices from API response as fallback
        initializeEditableData();
      }
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

    const initialData = dataArray.map(item => ({
      ...item,
      editablePrice: getLTPForSymbol(item.symbol) || item.rebalancePrice || 0,
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

  const stockDetails = convertResponse(dataArray, broker);

  // --- Zerodha Publisher Flow Functions ---

  const generateHtmlForm = (basket, apiKey) => {
    return `<html>
      <body>
        <form id="zerodhaForm" method="POST" action="https://kite.zerodha.com/connect/basket">
          <input type="hidden" name="api_key" value="${apiKey}" />
          <input type="hidden" name="data" value='${JSON.stringify(basket)}' />
          <input type="hidden" name="redirect_params" value="test=true" />
        </form>
        <script>
          document.getElementById('zerodhaForm').submit();
        </script>
      </body>
    </html>`;
  };

  const getAdditionalPayload = () => {
    const matchingRepairTrade =
      modelPortfolioRepairTrades &&
      modelPortfolioRepairTrades?.find(
        trade => trade.modelId === modelPortfolioModelId,
      );
    if (matchingRepairTrade) {
      return {
        modelName: matchingRepairTrade.modelName,
        advisor: advisorTag,
        unique_id: matchingRepairTrade?.uniqueId,
        model_id: modelPortfolioModelId,
        broker: broker,
      };
    } else {
      return {
        modelName: filteredData[0]['model_name'],
        advisor: advisorTag,
        unique_id: calculatedPortfolioData?.uniqueId,
        model_id: modelPortfolioModelId,
        broker: broker,
      };
    }
  };

  const additionalPayload = getAdditionalPayload();

  const handleWebViewNavigationStateChange = newNavState => {
    const { url } = newNavState;
    console.log('Rebalance WebView URL:', url);
    if (url.includes('success') || url.includes('completed')) {
      console.log('Zerodha success redirect detected:', url);
      setZerodhaStatus('success');
      setZerodhaRequestType('rebalance');
    }
  };

  const handleZerodhaRedirect = async () => {
    setLoading(true);
    try {
      await AsyncStorage.removeItem('stockDetailsZerodhaOrder');
      await AsyncStorage.removeItem('zerodhaAdditionalPayload');
      await AsyncStorage.setItem(
        'zerodhaAdditionalPayload',
        JSON.stringify(additionalPayload),
      );

      const basket = stockDetails.map(stock => {
        // Calculate price
        const ltp = getLTPForSymbol(stock.tradingSymbol);
        let orderPrice = 0;

        if (stock.orderType === 'LIMIT') {
          orderPrice = parseFloat(stock.price || 0);
        } else if (stock.orderType === 'MARKET' || stock.orderType === 'SL') {
          orderPrice = ltp && ltp !== '-' ? parseFloat(ltp) : 0;
        }

        let baseOrder = {
          variety: 'regular',
          tradingsymbol: stock.tradingSymbol,
          exchange: stock.exchange || 'NSE',
          transaction_type: (stock.transactionType || 'BUY').toUpperCase(),
          order_type: mapKiteOrderType(stock.orderType),
          quantity: parseInt(stock.quantity, 10) || 1,
          product: mapKiteProductType(stock.productType),
          readonly: false,
          price: orderPrice,
        };

        if (stock.quantity > 100) {
          baseOrder.readonly = true;
        }

        console.log('[RebalanceModal] Basket item:', JSON.stringify(baseOrder));
        return baseOrder;
      });

      const currentISTDateTime = new Date();

      await axios
        .post(
          `${server.server.baseUrl}api/zerodha/model-portfolio/update-reco-with-zerodha-model-pf`,
          {
            stockDetails: stockDetails,
            leaving_datetime: currentISTDateTime,
            email: userEmail,
            trade_given_by: advisorTag,
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'X-Advisor-Subdomain': configData?.config?.REACT_APP_HEADER_NAME || configData?.subdomain || 'common',
              'aq-encrypted-key': generateToken(
                Config.REACT_APP_AQ_KEYS,
                Config.REACT_APP_AQ_SECRET,
              ),
            },
          },
        )
        .then(res => {
          const allStockDetails = res?.data?.data;
          const filteredStockDetails = allStockDetails.map(detail => ({
            user_email: detail.user_email,
            trade_given_by: detail.trade_given_by,
            tradingSymbol: detail.Symbol,
            transactionType: detail.Type,
            exchange: detail.Exchange,
            segment: detail.Segment,
            productType: detail.ProductType,
            orderType: detail.OrderType,
            price: detail.Price,
            quantity: detail.Quantity,
            priority: detail.Priority,
            tradeId: detail.tradeId,
            user_broker: 'Zerodha',
          }));

          setLoading(false);
          AsyncStorage.setItem(
            'stockDetailsZerodhaOrder',
            JSON.stringify(filteredStockDetails),
          );
        })
        .catch(err => {
          console.log('Error updating Zerodha reco:', err);
          setLoading(false);
        });

      const htmlForm = generateHtmlForm(basket, zerodhaApiKey);
      setHtmlContent(htmlForm);
      setWebView(true);
    } catch (error) {
      console.error('Failed to handle Zerodha redirect:', error);
      setLoading(false);
    }
  };

  const fetchZerodhaData = async () => {
    try {
      const pendingOrderData = await AsyncStorage.getItem(
        'stockDetailsZerodhaOrder',
      );
      const payloadData = await AsyncStorage.getItem(
        'zerodhaAdditionalPayload',
      );
      const zerodhaStockDetails = pendingOrderData
        ? JSON.parse(pendingOrderData)
        : null;
      const zerodhaAdditionalPayload = payloadData
        ? JSON.parse(payloadData)
        : null;
      return { zerodhaStockDetails, zerodhaAdditionalPayload };
    } catch (error) {
      console.error('Error fetching Zerodha data from AsyncStorage:', error);
      return { zerodhaStockDetails: null, zerodhaAdditionalPayload: null };
    }
  };

  const checkZerodhaStatus = async () => {
    const { zerodhaStockDetails, zerodhaAdditionalPayload } =
      await fetchZerodhaData();

    if (
      zerodhaStatus !== null &&
      zerodhaAdditionalPayload !== null &&
      zerodhaStockDetails !== null &&
      zerodhaRequestType === 'rebalance'
    ) {
      try {
        // Use publisher/record-orders endpoint - this fetches order book from Zerodha
        // and matches orders with our trade list
        const requestHeaders = {
          'Content-Type': 'application/json',
          'X-Advisor-Subdomain': configData?.config?.REACT_APP_HEADER_NAME || configData?.subdomain || 'common',
          'aq-encrypted-key': generateToken(
            Config.REACT_APP_AQ_KEYS,
            Config.REACT_APP_AQ_SECRET,
          ),
        };

        console.log('[RebalanceModal] Recording publisher orders...');

        const recordResponse = await axios.post(
          `${server.server.baseUrl}api/zerodha/publisher/record-orders`,
          {
            stockDetails: zerodhaStockDetails,
            publisherResults: [{ status: 'success', batchIndex: 0 }],
            userEmail: userEmail,
            broker: 'Zerodha',
            model_id: zerodhaAdditionalPayload.model_id,
            modelName: zerodhaAdditionalPayload.modelName,
            advisor: zerodhaAdditionalPayload.advisor,
            unique_id: zerodhaAdditionalPayload.unique_id,
          },
          { headers: requestHeaders }
        );

        console.log('[RebalanceModal] Record orders response:', recordResponse.data);

        const orderResults = recordResponse.data.response || recordResponse.data.results || [];

        setOrderPlacementResponse(orderResults);
        setOpenSucessModal(true);
        setOpenRebalanceModal(false);
        eventEmitter.emit('OrderPlacedReferesh');

        try {
          await axios.post(
            `${server.ccxtServer.baseUrl}zerodha/user-portfolio`,
            { user_email: userEmail },
            { headers: requestHeaders }
          );

          const statusCheckData = {
            userEmail: userEmail,
            modelName: zerodhaAdditionalPayload.modelName,
            advisor: configData?.config?.REACT_APP_ADVISOR_SPECIFIC_TAG,
            broker: 'Zerodha',
          };
          await axios.post(
            `${server.ccxtServer.baseUrl}rebalance/add-user/status-check-queue`,
            statusCheckData,
            { headers: requestHeaders }
          );
        } catch (error) {
          console.error('Error updating Zerodha portfolio:', error);
        }

        AsyncStorage.removeItem('stockDetailsZerodhaOrder');
        AsyncStorage.removeItem('zerodhaAdditionalPayload');
        getRebalanceRepair();
        getModelPortfolioStrategyDetails();
      } catch (error) {
        console.log('Error in checkZerodhaStatus:', error);
        console.log('Error response:', error.response?.data);
      }
    }
  };

  // Watch zerodhaStatus changes
  useEffect(() => {
    const fetchAndProcessData = async () => {
      try {
        const { zerodhaStockDetails, zerodhaAdditionalPayload } =
          await fetchZerodhaData();
        if (
          zerodhaStatus !== null &&
          zerodhaAdditionalPayload !== null &&
          zerodhaStockDetails !== null &&
          zerodhaRequestType === 'rebalance' &&
          jwtToken !== undefined
        ) {
          checkZerodhaStatus();
        }
      } catch (error) {
        console.error('Error in fetchAndProcessData:', error);
      }
    };
    fetchAndProcessData();
  }, [zerodhaStatus, zerodhaRequestType, userEmail, jwtToken]);

  // --- End Zerodha Publisher Flow Functions ---

  // --- Fyers Publisher Flow Functions ---

  const handleFyersRedirect = async () => {
    const sessionValid = await validateBrokerSession(broker, jwtToken, { checkFreshness: true });
    if (!sessionValid) return;

    setLoading(true);
    try {
      const currentISTDateTime = new Date();
      const istDatetime = moment(currentISTDateTime).format();

      const requestHeaders = {
        'Content-Type': 'application/json',
        'X-Advisor-Subdomain': configData?.config?.REACT_APP_HEADER_NAME || configData?.subdomain || 'common',
        'aq-encrypted-key': generateToken(
          Config.REACT_APP_AQ_KEYS,
          Config.REACT_APP_AQ_SECRET,
        ),
      };

      // Store stock details for post-processing
      await AsyncStorage.removeItem('stockDetailsFyersOrder');
      await AsyncStorage.setItem(
        'stockDetailsFyersOrder',
        JSON.stringify(stockDetails),
      );

      // Record trade intent
      await axios.post(
        `${server.server.baseUrl}api/zerodha/model-portfolio/update-reco-with-zerodha-model-pf`,
        {
          stockDetails: stockDetails,
          leaving_datetime: currentISTDateTime,
          email: userEmail,
          trade_given_by: advisorTag,
        },
        { headers: requestHeaders },
      );

      // Place orders via Fyers API through process-trade
      const payload = {
        clientId: clientCode,
        accessToken: jwtToken,
        user_email: userEmail,
        user_broker: 'Fyers',
        modelName: additionalPayload.modelName,
        advisor: additionalPayload.advisor,
        model_id: additionalPayload.model_id || modelPortfolioModelId,
        unique_id: additionalPayload.unique_id,
        returnDateTime: istDatetime,
        trades: stockDetails,
      };

      const response = await axios.post(
        `${server.ccxtServer.baseUrl}rebalance/process-trade`,
        payload,
        { headers: requestHeaders, timeout: 120000 },
      );

      const checkData = response?.data?.results;
      setOrderPlacementResponse(checkData);

      // Handle TPIN rejection for Fyers sell orders
      if (checkData && checkData.length > 0) {
        const allSell = checkData.every(s => s.transactionType === 'SELL');
        const isMixed =
          checkData.some(s => s.transactionType === 'BUY') &&
          checkData.some(s => s.transactionType === 'SELL');
        const rejectedSellCount = checkData.reduce((count, order) => {
          return isOrderRejected(order?.orderStatus) &&
            order.transactionType === 'SELL'
            ? count + 1
            : count;
        }, 0);
        const successCount = checkData.reduce((count, order) => {
          return isOrderSuccess(order?.orderStatus) &&
            (order.transactionType === 'SELL' || isMixed)
            ? count + 1
            : count;
        }, 0);

        if (
          (allSell || isMixed) &&
          rejectedSellCount >= 1 &&
          successCount === 0
        ) {
          setShowFyersTpinModal(true);
          setOpenRebalanceModal(false);
          setLoading(false);
          return;
        }
      }

      setOpenSucessModal(true);
      setOpenRebalanceModal(false);
      eventEmitter.emit('OrderPlacedReferesh');

      // Update model portfolio DB
      const updateData = {
        modelId: modelPortfolioModelId,
        orderResults: checkData,
        userEmail: userEmail,
        modelName: filteredData[0]['model_name'],
      };
      await axios.post(
        `${server.server.baseUrl}api/model-portfolio-db-update`,
        updateData,
        { headers: requestHeaders },
      );

      // Update subscriber execution status
      if (checkData && checkData.length > 0) {
        const successStatuses = ['complete', 'executed', 'traded'];
        const pubSuccessCount = checkData.filter(r =>
          successStatuses.includes((r.orderStatus || '').toLowerCase()),
        ).length;
        let executionStatus;
        if (pubSuccessCount === checkData.length) {
          executionStatus = 'executed';
        } else if (pubSuccessCount > 0) {
          executionStatus = 'partial';
        } else {
          executionStatus = 'pending';
        }

        try {
          await axios.put(
            `${server.ccxtServer.baseUrl}rebalance/update/subscriber-execution`,
            {
              userEmail: userEmail,
              modelName: filteredData[0]['model_name'],
              executionStatus: executionStatus,
              user_broker: 'Fyers',
            },
            { headers: requestHeaders },
          );
        } catch (err) {
          console.warn('[FyersPublisher] subscriber-execution update failed:', err);
        }

        // Record publisher results
        try {
          await axios.post(
            `${server.ccxtServer.baseUrl}rebalance/record-publisher-results`,
            {
              modelName: filteredData[0]['model_name'],
              model_id: modelPortfolioModelId,
              unique_id: additionalPayload.unique_id,
              advisor: advisorTag,
              order_results: checkData,
              user_email: userEmail,
              user_broker: 'Fyers',
            },
            { headers: requestHeaders },
          );
          console.log('[FyersPublisher] Successfully recorded publisher results');
        } catch (err) {
          console.warn('[FyersPublisher] record-publisher-results failed:', err);
        }
      }

      // Enroll in status-check-queue
      await axios.post(
        `${server.ccxtServer.baseUrl}rebalance/add-user/status-check-queue`,
        {
          userEmail: userEmail,
          modelName: filteredData[0]['model_name'],
          advisor: advisorTag,
          broker: 'Fyers',
        },
        { headers: requestHeaders },
      );

      await AsyncStorage.removeItem('stockDetailsFyersOrder');
      getRebalanceRepair();
      getModelPortfolioStrategyDetails();
      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.error('[FyersPublisher] Error:', error);

      let errorMessage;
      if (error?.code === 'ERR_NETWORK' || error?.code === 'ECONNABORTED') {
        errorMessage =
          'Unable to connect to Fyers trading server. Please reconnect your broker and try again.';
      } else if (
        error?.response?.status === 401 ||
        error?.response?.status === 403
      ) {
        errorMessage =
          'Fyers session has expired. Please reconnect your broker and try again.';
      } else {
        errorMessage =
          error?.response?.data?.error ||
          error?.response?.data?.message ||
          error?.message ||
          'Order placement failed';
      }

      Toast.show({
        type: 'error',
        text1: 'Order Failed',
        text2: errorMessage,
      });
      getModelPortfolioStrategyDetails();
    }
  };

  // --- End Fyers Publisher Flow Functions ---

  const placeOrder = async () => {
    console.log('[RebalanceModal] placeOrder called');
    console.log('[RebalanceModal] dataArray:', JSON.stringify(dataArray));
    console.log('[RebalanceModal] stockDetails:', JSON.stringify(stockDetails));
    console.log('[RebalanceModal] calculatedPortfolioData keys:', calculatedPortfolioData ? Object.keys(calculatedPortfolioData) : 'null');
    console.log('[RebalanceModal] calculatedPortfolioData buy:', JSON.stringify(calculatedPortfolioData?.buy));
    console.log('[RebalanceModal] calculatedPortfolioData sell:', JSON.stringify(calculatedPortfolioData?.sell));

    const sessionValid = await validateBrokerSession(broker, jwtToken, { checkFreshness: true });
    if (!sessionValid) return;

    setLoading(true);

    // Pre-order EDIS checks
    const allSellPre = stockDetails?.every(s => s.transactionType === 'SELL');
    const isMixedPre = stockDetails?.some(s => s.transactionType === 'BUY') &&
      stockDetails?.some(s => s.transactionType === 'SELL');

    if (broker === 'Dhan' && (allSellPre || isMixedPre) &&
      dhanEdisStatus?.data?.some((h) => h.edis === false)) {
      setShowDhanTpinModel(true);
      setOpenRebalanceModal(false);
      setLoading(false);
      return;
    }

    // If user has completed TPIN authorization or has active DDPI, proceed
    const canSellZerodha = userDetails?.is_authorized_for_sell ||
      ['physical', 'ddpi'].includes(userDetails?.ddpi_status);
    if (broker === 'Zerodha' && (allSellPre || isMixedPre) && !canSellZerodha) {
      setShowDdpiModal && setShowDdpiModal(true);
      setOpenRebalanceModal(false);
      setLoading(false);
      return;
    }

    if (broker === 'Angel One' && (allSellPre || isMixedPre) &&
      edisStatus && edisStatus.edis === false) {
      setShowAngleOneTpinModel(true);
      setOpenRebalanceModal(false);
      setLoading(false);
      return;
    }

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
      if (broker === 'AliceBlue') {
        return { clientId: clientCode, accessToken: jwtToken, apiKey: apiKey };
      } else if (broker === 'Upstox') {
        return { apiKey: checkValidApiAnSecret(apiKey), apiSecret: checkValidApiAnSecret(secretKey), accessToken: jwtToken };
      } else if (broker === 'Dhan') {
        return { clientId: clientCode, accessToken: jwtToken };
      } else if (broker === 'Angel One') {
        return { apiKey: angelOneApiKey, jwtToken: jwtToken };
      } else if (broker === 'IIFL Securities') {
        return { clientCode: clientCode };
      } else if (broker === 'ICICI Direct') {
        return { apiKey: checkValidApiAnSecret(apiKey), secretKey: checkValidApiAnSecret(secretKey), accessToken: jwtToken };
      } else if (broker === 'Hdfc Securities') {
        return { apiKey: checkValidApiAnSecret(apiKey), accessToken: jwtToken };
      } else if (broker === 'Kotak') {
        return { consumerKey: checkValidApiAnSecret(apiKey), consumerSecret: checkValidApiAnSecret(secretKey), accessToken: jwtToken, viewToken, sid, serverId };
      } else if (broker === 'Fyers') {
        return { clientId: clientCode, accessToken: jwtToken };
      } else if (broker === 'Motilal Oswal') {
        return { clientCode: clientCode, accessToken: jwtToken, apiKey: checkValidApiAnSecret(apiKey) };
      } else if (broker === 'Groww') {
        return { accessToken: jwtToken };
      } else {
        return { accessToken: jwtToken };
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

    console.log('[RebalanceModal] Final payload trades count:', payload.trades?.length);
    console.log('[RebalanceModal] Final payload:', JSON.stringify({
      user_broker: payload.user_broker,
      user_email: payload.user_email,
      model_id: payload.model_id,
      modelName: payload.modelName,
      unique_id: payload.unique_id,
      tradesCount: payload.trades?.length,
      trades: payload.trades,
    }));

    // Guard: Don't send empty trades to broker
    if (!payload.trades || payload.trades.length === 0) {
      console.warn('[RebalanceModal] ERROR: trades array is empty! Aborting order placement.');
      Toast.show({
        type: 'error',
        text1: 'No Trades to Execute',
        text2: 'The trade list is empty. Please go back and try again.',
      });
      setLoading(false);
      return;
    }

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
      timeout: 120000,

      headers: {
        'Content-Type': 'application/json',
        'X-Advisor-Subdomain': configData?.config?.REACT_APP_HEADER_NAME || configData?.subdomain || 'common',
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
        console.log('[RebalanceModal] process-trade response:', JSON.stringify({
          resultsCount: checkData?.length,
          status: response?.data?.status,
          message: response?.data?.message,
          error: response?.data?.error,
        }));
        setOrderPlacementResponse(response?.data?.results);

        // Guard: If backend returned empty results, check for cautionary listing or show error
        if (!checkData || checkData.length === 0) {
          const errorMsg = response?.data?.message || response?.data?.error || '';
          const isCautionaryError = errorMsg.toLowerCase().includes('cautionary') && errorMsg.toLowerCase().includes('listing');
          console.warn('[RebalanceModal] Empty results from process-trade:', errorMsg, 'isCautionary:', isCautionaryError);

          if (isCautionaryError) {
            // Build synthetic rejected order responses from payload trades so the
            // success modal can display the cautionary listing alert properly
            const syntheticResults = (payload.trades || []).map(trade => ({
              symbol: trade.tradingSymbol || trade.symbol || trade.Trading_Symbol || '',
              searchSymbol: trade.tradingSymbol || trade.symbol || '',
              transactionType: trade.transactionType || trade.transaction_type || 'BUY',
              quantity: trade.quantity || trade.qty || 0,
              orderType: trade.orderType || trade.order_type || 'MARKET',
              exchange: trade.exchange || 'NSE',
              orderStatus: 'REJECTED',
              orderStatusMessage: errorMsg,
              message_aq: errorMsg,
            }));
            setOrderPlacementResponse(syntheticResults);
            setOpenRebalanceModal(false);
            setLoading(false);
            setOpenSucessModal(true);
            getModelPortfolioStrategyDetails();
            return;
          }

          // Non-cautionary empty results: show error toast
          Toast.show({
            type: 'error',
            text1: 'Order Processing Failed',
            text2: errorMsg || 'No orders were processed by the broker. Please try again.',
            visibilityTime: 5000,
          });
          setOpenRebalanceModal(false);
          setLoading(false);
          getModelPortfolioStrategyDetails();
          return;
        }

        // Note: Even if all orders failed (e.g. cautionary listing rejections),
        // we let the success modal open so users can see per-order details and explanations.

        // Empty results CDSL check - detect EDIS/TPIN errors from response message
        if (!checkData || !Array.isArray(checkData) || checkData.length === 0) {
          const responseMsg = (response?.data?.message || '').toLowerCase();
          if (
            broker === 'Dhan' &&
            (responseMsg.includes('cdsl') ||
              responseMsg.includes('edis') ||
              responseMsg.includes('tpin') ||
              responseMsg.includes('validate qty'))
          ) {
            setShowDhanTpinModel(true);
            setOpenRebalanceModal(false);
            setLoading(false);
            return;
          }
        }

        const isMixed =
          checkData?.some(stock => stock.transactionType === 'BUY') &&
          checkData?.some(stock => stock.transactionType === 'SELL');
        const allBuy = checkData?.every(
          stock => stock.transactionType === 'BUY',
        );
        const allSell = checkData?.every(
          stock => stock.transactionType === 'SELL',
        );

        const rejectedSellCount = (checkData || []).reduce(
          (count, order) => {
            return isOrderRejected(order?.orderStatus) &&
              order.transactionType === 'SELL'
              ? count + 1
              : count;
          },
          0,
        );

        const successCount = (checkData || []).reduce((count, order) => {
          return isOrderSuccess(order?.orderStatus) &&
            (order.transactionType === 'SELL' || isMixed)
            ? count + 1
            : count;
        }, 0);

        // Check for CDSL/EDIS/TPIN error messages in rejected orders
        const hasCdslError = (checkData || []).some((order) => {
          const msg = (order?.orderStatusMessage || order?.message_aq || order?.message || "").toLowerCase();
          return msg.includes("cdsl") || msg.includes("edis") || msg.includes("tpin") || msg.includes("validate qty");
        });

        // Check for cautionary listing rejections - these should bypass TPIN/EDIS modals
        const hasCautionaryRejection = (checkData || []).some((order) => {
          const msg = (order?.orderStatusMessage || order?.message_aq || order?.message || "").toLowerCase();
          return msg.includes("cautionary") && msg.includes("listing");
        });

        // If cautionary listing rejection, go directly to success modal to show the alert
        if (hasCautionaryRejection) {
          setOpenSucessModal(true);
          setOpenRebalanceModal(false);
          setLoading(false);
          // Still do db update and status check
          try {
            await axios.post(
              `${server.server.baseUrl}api/model-portfolio-db-update`,
              {
                modelId: modelPortfolioModelId,
                orderResults: checkData,
                userEmail: userEmail,
                modelName: filteredData[0]['model_name'],
              },
              {
                headers: {
                  'Content-Type': 'application/json',
                  'X-Advisor-Subdomain': configData?.config?.REACT_APP_HEADER_NAME || configData?.subdomain || 'common',
                  'aq-encrypted-key': generateToken(
                    Config.REACT_APP_AQ_KEYS,
                    Config.REACT_APP_AQ_SECRET,
                  ),
                },
              },
            );
          } catch (dbErr) {
            console.warn('Error updating db after cautionary rejection:', dbErr);
          }
          getRebalanceRepair();
          getModelPortfolioStrategyDetails();
          return;
        }

        // Dhan: Check CDSL error messages first
        if (
          broker === 'Dhan' &&
          (allSell || isMixed) &&
          rejectedSellCount >= 1 &&
          hasCdslError
        ) {
          setShowDhanTpinModel(true);
          setOpenRebalanceModal(false);
          setLoading(false);
          return;
        }

        if (
          !isReturningFromOtherBrokerModal &&
          specialBrokers.includes(broker)
        ) {
          if (allBuy) {
            setOpenSucessModal(true);
            setOpenRebalanceModal(false);
          } else if (
            (allSell || isMixed) &&
            rejectedSellCount >= 1 &&
            successCount === 0
          ) {
            setShowOtherBrokerModel(true);
            setOpenRebalanceModal(false);
            setLoading(false);
            return;
          } else {
            setOpenSucessModal(true);
            setOpenRebalanceModal(false);
          }
        } else if (
          broker === 'Angel One' &&
          (allSell || isMixed) &&
          edisStatus &&
          edisStatus.edis === false &&
          rejectedSellCount >= 1 &&
          successCount === 0
        ) {
          setOpenSucessModal(false);
          setShowAngleOneTpinModel(true);
          return;
        } else if (
          broker === 'Dhan' &&
          (allSell || isMixed) &&
          dhanEdisStatus?.data?.some((h) => h.edis === false) &&
          rejectedSellCount >= 1 &&
          successCount === 0
        ) {
          setShowDhanTpinModel(true);
          setOpenSucessModal(false);
          return;
        } else if (
          broker === 'Fyers' &&
          (allSell || isMixed) &&
          rejectedSellCount >= 1 &&
          successCount === 0
        ) {
          setOpenSucessModal(false);
          setShowFyersTpinModal(true);
          return;
        } else {
          setOpenSucessModal(true);
          setOpenRebalanceModal(false);
        }

        getRebalanceRepair();
        const updateData = {
          modelId: modelPortfolioModelId,
          orderResults: checkData,
          userEmail: userEmail,
          modelName: filteredData[0]['model_name'],
        };

        return axios.post(
          `${server.server.baseUrl}api/model-portfolio-db-update`,
          updateData,
          {
            headers: {
              'Content-Type': 'application/json',
              'X-Advisor-Subdomain': configData?.config?.REACT_APP_HEADER_NAME || configData?.subdomain || 'common',
              'aq-encrypted-key': generateToken(
                Config.REACT_APP_AQ_KEYS,
                Config.REACT_APP_AQ_SECRET,
              ),
            },
          },
        );
      })
      .then(() => {
        // Add user to status check queue for async order status polling (matching web frontend)
        const statusCheckData = {
          userEmail: userEmail,
          modelName: filteredData[0]['model_name'],
          advisor: configData?.config?.REACT_APP_ADVISOR_SPECIFIC_TAG,
          broker: broker,
        };
        return axios.post(
          `${server.ccxtServer.baseUrl}rebalance/add-user/status-check-queue`,
          statusCheckData,
          {
            headers: {
              'Content-Type': 'application/json',
              'X-Advisor-Subdomain': configData?.config?.REACT_APP_HEADER_NAME || configData?.subdomain || 'common',
              'aq-encrypted-key': generateToken(
                Config.REACT_APP_AQ_KEYS,
                Config.REACT_APP_AQ_SECRET,
              ),
            },
          },
        );
      })
      .then(() => {
        setLoading(false);
        setOpenRebalanceModal(false);
        getModelPortfolioStrategyDetails();
      })
      .catch(error => {
        setLoading(false);

        // Determine a user-friendly error message
        let errorMessage;
        if (error?.code === 'ERR_NETWORK' || error?.code === 'ECONNABORTED') {
          errorMessage = `Unable to connect to ${broker} trading server. This could be due to broker session expiry or a temporary server issue. Please reconnect your broker and try again.`;
        } else if (error?.response?.status === 401 || error?.response?.status === 403) {
          errorMessage = `${broker} session has expired. Please reconnect your broker and try again.`;
        } else {
          errorMessage = error?.response?.data?.error || error?.response?.data?.message || error?.message || 'Order placement failed';
        }

        // Check for CDSL/EDIS errors in catch handler for Dhan
        const errMsg = (
          error?.response?.data?.details?.[0]?.message_aq ||
          error?.response?.data?.details?.[0]?.message ||
          error?.message ||
          ""
        ).toLowerCase();
        if (
          broker === 'Dhan' &&
          (errMsg.includes("cdsl") || errMsg.includes("edis") || errMsg.includes("tpin"))
        ) {
          setShowDhanTpinModel(true);
          setOpenRebalanceModal(false);
          return;
        }

        Toast.show({
          type: 'error',
          text1: 'Order Failed',
          text2: errorMessage,
        });
        getModelPortfolioStrategyDetails();
      });
    setIsReturningFromOtherBrokerModal(false);
  };

  const handleClose = () => {
    setWebView(false);
    setOpenRebalanceModal(false);
  };

  const onSlideComplete = () => {
    if (broker === 'Zerodha') {
      handleZerodhaRedirect();
    } else if (broker === 'Fyers') {
      handleFyersRedirect();
    } else {
      placeOrder();
    }
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
          {webView ? (
            <View style={{ flex: 1, backgroundColor: 'white', padding: 10 }}>
              <View style={{ alignContent: 'flex-end', alignItems: 'flex-end' }}>
                <TouchableOpacity
                  onPress={() => setWebView(false)}
                  style={styles.closeButton}>
                  <XIcon size={24} color="#000" />
                </TouchableOpacity>
              </View>
              <WebView
                ref={webViewRef}
                style={{ flex: 1 }}
                source={{ html: htmlContent }}
                onNavigationStateChange={handleWebViewNavigationStateChange}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                onError={e => console.error('WebView error:', e.nativeEvent)}
              />
            </View>
          ) : (
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
              // Empty state — Portfolio Already Aligned or API error message
              ListEmptyComponent={
                <View
                  style={{
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: 40,
                    paddingHorizontal: 24,
                  }}>
                  {calculatedPortfolioData?.status === 1 && calculatedPortfolioData?.message ? (
                    <>
                      {/* Error/warning icon */}
                      <View
                        style={{
                          width: 72,
                          height: 72,
                          borderRadius: 36,
                          backgroundColor: '#FEF3C7',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginBottom: 20,
                        }}>
                        <AlertOctagon size={36} color="#D97706" />
                      </View>
                      <Text
                        style={{
                          fontFamily: 'Poppins-SemiBold',
                          color: '#D97706',
                          fontSize: 18,
                          textAlign: 'center',
                          marginBottom: 12,
                        }}>
                        Unable to Rebalance
                      </Text>
                      <Text
                        style={{
                          fontFamily: 'Poppins-Regular',
                          color: 'rgba(0,0,0,0.6)',
                          textAlign: 'center',
                          marginBottom: 24,
                          fontSize: 14,
                          lineHeight: 22,
                          paddingHorizontal: 10,
                        }}>
                        {calculatedPortfolioData.message}
                      </Text>
                      <TouchableOpacity
                        onPress={handleClose}
                        style={{
                          backgroundColor: '#000',
                          paddingHorizontal: 24,
                          paddingVertical: 12,
                          borderRadius: 8,
                        }}>
                        <Text
                          style={{
                            color: '#fff',
                            fontFamily: 'Poppins-Medium',
                            fontSize: 14,
                          }}>
                          Go Back
                        </Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <>
                      {/* Green checkmark circle */}
                      <View
                        style={{
                          width: 72,
                          height: 72,
                          borderRadius: 36,
                          backgroundColor: '#DEF7EC',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginBottom: 20,
                        }}>
                        <CheckIcon size={36} color="#15803D" />
                      </View>
                      <Text
                        style={{
                          fontFamily: 'Poppins-SemiBold',
                          color: '#15803D',
                          fontSize: 20,
                          textAlign: 'center',
                          marginBottom: 12,
                        }}>
                        Your Portfolio is Already Aligned!
                      </Text>
                      <Text
                        style={{
                          fontFamily: 'Poppins-Regular',
                          color: 'rgba(0,0,0,0.6)',
                          textAlign: 'center',
                          marginBottom: 10,
                          fontSize: 14,
                          lineHeight: 22,
                          paddingHorizontal: 10,
                        }}>
                        Great news! Based on your current holdings and the latest model
                        portfolio recommendations, no trades are needed right now. Your
                        investments are already in sync with your advisor's strategy.
                      </Text>
                      <Text
                        style={{
                          fontFamily: 'Poppins-Regular',
                          color: 'rgba(0,0,0,0.4)',
                          textAlign: 'center',
                          marginBottom: 24,
                          fontSize: 13,
                          lineHeight: 20,
                        }}>
                        Want to increase your investment or make changes? Go back and
                        modify your investment amount.
                      </Text>
                      <TouchableOpacity
                        onPress={handleClose}
                        style={{
                          backgroundColor: '#000',
                          paddingHorizontal: 24,
                          paddingVertical: 12,
                          borderRadius: 8,
                        }}>
                        <Text
                          style={{
                            color: '#fff',
                            fontFamily: 'Poppins-Medium',
                            fontSize: 14,
                          }}>
                          Go Back
                        </Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              }
            />
            {dataArray.length > 0 && (
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
            )}

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
          )}
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
