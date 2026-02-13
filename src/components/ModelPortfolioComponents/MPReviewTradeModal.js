import React, {useState, useRef, useEffect, useCallback} from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  TextInput,
  ScrollView,
  Pressable,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import {useWindowDimensions} from 'react-native';
import {XIcon, Trash2Icon, CandlestickChartIcon, AlertTriangleIcon} from 'lucide-react-native';
import Icon1 from 'react-native-vector-icons/Feather';
import server from '../../utils/serverConfig';
import axios from 'axios';
import {WebView} from 'react-native-webview';
import CryptoJS from 'react-native-crypto-js';
import useWebSocketCurrentPrice from '../../FunctionCall/useWebSocketCurrentPrice';
import {io} from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Config from 'react-native-config';
const {height: screenHeight} = Dimensions.get('window');
import {generateToken} from '../../utils/SecurityTokenManager';
import {useTrade} from '../../screens/TradeContext';
import Toast from 'react-native-toast-message';
import { isOrderSuccess, isOrderRejected } from '../../utils/orderStatusUtils';
import { validateBrokerSession } from '../../utils/brokerSessionUtils';
import { convertResponse } from '../../utils/tradeUtils';
import moment from 'moment';
const MPReviewTradeModal = ({
  visible,
  onCloseReviewTrade,
  dataArray,
  confirmOrder,
  setconfirmOrder,
  fileName,
  totalArray,
  setOpenSucessModal,
  openSuccessModal,
  setOpenSubscribeModel,
  calculatedLoading,
  latestRebalance,
  setOrderPlacementResponse,
  userEmail,
  userDetails,
  strategyDetails,
  calculatedPortfolioData,
  calculateRebalance,
  broker,
  edisStatus,
  dhanEdisStatus,
  setShowDdpiModal,
  setShowAngleOneTpinModel,
  setShowDhanTpinModel,
  setShowFyersTpinModal,
  setShowOtherBrokerModel,
  isReturningFromOtherBrokerModal,
  setIsReturningFromOtherBrokerModal,
}) => {
  const {configData} = useTrade();
  console.log('MPBROKER:', broker);
  const {width} = useWindowDimensions();

  // Surveillance state for Angel One
  const [surveillanceData, setSurveillanceData] = useState(null);
  const [surveillanceLoading, setSurveillanceLoading] = useState(false);
  const [surveillanceChecked, setSurveillanceChecked] = useState(false);

  // Function to check surveillance for AngelOne
  const checkAngelOneSurveillance = async (stocks) => {
    if (broker !== 'Angel One') return null;
    if (surveillanceLoading || surveillanceChecked) return surveillanceData;
    if (!stocks || stocks.length === 0) return null;

    const symbols = stocks.map((stock) => ({
      symbol: stock.symbol,
      exchange: stock.exchange,
    }));

    setSurveillanceLoading(true);
    try {
      const config = {
        method: 'post',
        url: `${server.ccxtServer.baseUrl}angelone/equity/surveillance`,
        data: symbols,
        headers: {
          'Content-Type': 'application/json',
          'X-Advisor-Subdomain': configData?.config?.REACT_APP_HEADER_NAME,
          'aq-encrypted-key': generateToken(
            Config.REACT_APP_AQ_KEYS,
            Config.REACT_APP_AQ_SECRET,
          ),
        },
      };

      const response = await axios.request(config);
      setSurveillanceData(response.data);
      setSurveillanceChecked(true);
      return response.data;
    } catch (error) {
      console.error('Error checking surveillance:', error);
      setSurveillanceChecked(true);
      return null;
    } finally {
      setSurveillanceLoading(false);
    }
  };

  // Check surveillance when modal opens and broker is AngelOne
  useEffect(() => {
    const stocksToCheck = totalArray.length > 0 ? totalArray : dataArray;
    if (
      visible &&
      broker === 'Angel One' &&
      stocksToCheck.length > 0 &&
      !surveillanceChecked &&
      !surveillanceLoading
    ) {
      checkAngelOneSurveillance(stocksToCheck);
    }
  }, [visible, broker, totalArray.length, dataArray.length, surveillanceChecked, surveillanceLoading]);

  // Reset surveillance check when modal closes or broker changes
  useEffect(() => {
    if (!visible || broker !== 'Angel One') {
      setSurveillanceChecked(false);
      setSurveillanceData(null);
    }
  }, [visible, broker]);

  const [ltp, setLtp] = useState([]);
  const socketRef = useRef(null);
  const subscribedSymbolsRef = useRef(new Set());
  const failedSubscriptionsRef = useRef({});

  // WebSocket connection for market data
  useEffect(() => {
    socketRef.current = io('wss://ccxtprod.alphaquark.in', {
      transports: ['websocket'],
      query: {EIO: '4'},
    });

    const handleMarketData = data => {
      setLtp(prev => {
        const index = prev.findIndex(
          item => item.tradingSymbol === data.stockSymbol,
        );

        if (index !== -1) {
          const existingItem = prev[index];

          // Update state only if the price has changed
          if (existingItem.lastPrice !== data.last_traded_price) {
            const newLtp = [...prev];
            newLtp[index] = {
              ...existingItem,
              lastPrice: data.last_traded_price,
            };
            return newLtp;
          } else {
            return prev; // No change, return previous state
          }
        } else {
          // Add new stock price if not present in the state
          return [
            ...prev,
            {
              tradingSymbol: data.stockSymbol,
              lastPrice: data.last_traded_price,
            },
          ];
        }
      });
    };

    socketRef.current.on('market_data', handleMarketData);

    return () => {
      if (socketRef.current) {
        socketRef.current.off('market_data', handleMarketData);
        socketRef.current.disconnect();
      }
    };
  }, []);

  // Subscribe to symbols via API
  const getCurrentPrice = useCallback(() => {
    if (!totalArray || totalArray.length === 0) return;

    const symbolsToSubscribe = totalArray.filter(
      trade =>
        !subscribedSymbolsRef.current.has(trade.symbol) &&
        (!failedSubscriptionsRef.current[trade.symbol] ||
          failedSubscriptionsRef.current[trade.symbol] < 3),
    );

    symbolsToSubscribe.forEach(trade => {
      const data = {symbol: trade.symbol, exchange: trade.exchange};

      axios
        .post('https://ccxtprod.alphaquark.in/websocket/subscribe', data)
        .then(() => {
          subscribedSymbolsRef.current.add(trade.symbol);
          delete failedSubscriptionsRef.current[trade.symbol];
        })
        .catch(error => {
          console.error(`Error subscribing to ${trade.symbol}:`, error);
          failedSubscriptionsRef.current[trade.symbol] =
            (failedSubscriptionsRef.current[trade.symbol] || 0) + 1;
        });
    });
  }, [totalArray]);

  // Fetch current price when dataArray changes

  // Utility to get the last traded price for a symbol
  const getLTPForSymbol = useCallback(
    symbol => {
      // console.log('Tt',ltp);
      const ltpItem = ltp.find(item => item.tradingSymbol === symbol);
      //console.log("ltp ",ltpItem);
      return ltpItem ? ltpItem.lastPrice : null;
    },
    [ltp],
  );

  const totalInvestmentValue = totalArray
    .filter(item => item.orderType === 'BUY')
    .reduce((total, item) => {
      const currentPrice = getLTPForSymbol(item.symbol);
      const investment = item.qty * currentPrice;
      return total + investment;
    }, 0);
  // const handleRemoveStock = (symbol, tradeId) => {
  //   console.log('tra',symbol,tradeId);
  //   setStockDetails(
  //     stockDetails.filter(
  //       (stock) => stock.tradingSymbol !== symbol || stock.tradeId !== tradeId
  //     )
  //   );
  //   cartCount-=1;
  //   handleSelectStock(symbol,tradeId);
  // };

  //////////////////////////////////////////////////////////////////

  const openSucess = () => {
    // console.log('inside success');
    onCloseReviewTrade();
    setOpenSucessModal(true);
  };
  const onCloseReview = () => {
    // console.log('inside success');
    setOpenSucessModal(false);
  };

  const stockDetails = convertResponse(totalArray, broker);
  const [loading, setLoading] = useState(false);
  const clientCode = userDetails && userDetails?.clientCode;
  const apiKey = userDetails && userDetails?.apiKey;
  const jwtToken = userDetails && userDetails?.jwtToken;
  const my2pin = userDetails && userDetails?.my2Pin;
  const secretKey = userDetails && userDetails?.secretKey;
  const userId = userDetails && userDetails?._id;
  const mobileNumber = userDetails && userDetails?.phone_number;
  const panNumber = userDetails && userDetails?.panNumber;
  const serverId = userDetails && userDetails?.serverId;
  const viewToken = userDetails && userDetails?.viewToken;
  const sid = userDetails && userDetails?.sid;
  const dateString = userDetails && userDetails.token_expire;
  ///////////////////////////////////////////////
  //console.log('details--->',strategyDetails?.model_name,strategyDetails?.advisor,latestRebalance.model_Id,calculatedPortfolioData?.uniqueId,broker,userEmail,stockDetails)
  const checkValidApiAnSecret = data => {
    if (!data) return null;
    const bytesKey = CryptoJS.AES.decrypt(data, 'ApiKeySecret');
    const Key = bytesKey.toString(CryptoJS.enc.Utf8);
    if (Key) {
      return Key;
    }
  };
  const placeOrder = async () => {
    const sessionValid = await validateBrokerSession(broker, jwtToken, { checkFreshness: true });
    if (!sessionValid) return;

    setLoading(true);
    const getBasePayload = () => ({
      modelName: strategyDetails?.model_name,
      advisor: strategyDetails?.advisor,
      model_id: latestRebalance.model_Id,
      unique_id: calculatedPortfolioData?.uniqueId,
      user_broker: broker,
      user_email: userEmail,
      trades: stockDetails,
    });

    const getBrokerSpecificPayload = () => {
      return {
        accessToken: jwtToken,
      };
    };

    const payload = {
      ...getBasePayload(),
      ...getBrokerSpecificPayload(),
    };

    const config = {
      method: 'post',
      url: `${server.ccxtServer.baseUrl}rebalance/process-trade`,
      timeout: 120000,

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

    axios
      .request(config)
      .then(response => {
        setOrderPlacementResponse(response.data.results);

        // Post-order EDIS rejection handling
        const checkData = response?.data?.results;
        if (checkData && checkData.length > 0) {
          const isMixed =
            checkData.some(s => s.transactionType === 'BUY') &&
            checkData.some(s => s.transactionType === 'SELL');
          const allBuy = checkData.every(s => s.transactionType === 'BUY');
          const allSell = checkData.every(s => s.transactionType === 'SELL');

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

          const hasCdslError = checkData.some((order) => {
            const msg = (order?.orderStatusMessage || order?.message_aq || order?.message || "").toLowerCase();
            return msg.includes("cdsl") || msg.includes("edis") || msg.includes("tpin") || msg.includes("validate qty");
          });

          // Dhan CDSL error check
          if (
            broker === 'Dhan' &&
            (allSell || isMixed) &&
            rejectedSellCount >= 1 &&
            hasCdslError &&
            setShowDhanTpinModel
          ) {
            setShowDhanTpinModel(true);
            onCloseReviewTrade();
            setLoading(false);
            return;
          }

          // Special brokers
          if (
            !isReturningFromOtherBrokerModal &&
            specialBrokers.includes(broker)
          ) {
            if ((allSell || isMixed) && rejectedSellCount >= 1 && successCount === 0 && setShowOtherBrokerModel) {
              setShowOtherBrokerModel(true);
              onCloseReviewTrade();
              setLoading(false);
              setIsReturningFromOtherBrokerModal && setIsReturningFromOtherBrokerModal(false);
              return;
            }
          }

          // Angel One
          if (
            broker === 'Angel One' &&
            edisStatus &&
            edisStatus.edis === false &&
            (allSell || isMixed) &&
            rejectedSellCount >= 1 &&
            successCount === 0 &&
            setShowAngleOneTpinModel
          ) {
            setShowAngleOneTpinModel(true);
            onCloseReviewTrade();
            setLoading(false);
            setIsReturningFromOtherBrokerModal && setIsReturningFromOtherBrokerModal(false);
            return;
          }

          // Dhan live status fallback
          if (
            broker === 'Dhan' &&
            (allSell || isMixed) &&
            dhanEdisStatus?.data?.some((h) => h.edis === false) &&
            rejectedSellCount >= 1 &&
            successCount === 0 &&
            setShowDhanTpinModel
          ) {
            setShowDhanTpinModel(true);
            onCloseReviewTrade();
            setLoading(false);
            setIsReturningFromOtherBrokerModal && setIsReturningFromOtherBrokerModal(false);
            return;
          }

          // Fyers
          if (
            broker === 'Fyers' &&
            (allSell || isMixed) &&
            rejectedSellCount >= 1 &&
            successCount === 0 &&
            setShowFyersTpinModal
          ) {
            setShowFyersTpinModal(true);
            onCloseReviewTrade();
            setLoading(false);
            setIsReturningFromOtherBrokerModal && setIsReturningFromOtherBrokerModal(false);
            return;
          }

          // Zerodha DDPI
          if (
            broker === 'Zerodha' &&
            (allSell || isMixed) &&
            !['consent', 'physical', 'ddpi'].includes(userDetails?.ddpi_status) &&
            rejectedSellCount >= 1 &&
            successCount === 0 &&
            setShowDdpiModal
          ) {
            setShowDdpiModal(true);
            onCloseReviewTrade();
            setLoading(false);
            return;
          }
        }

        const updateData = {
          modelId: latestRebalance.model_Id,
          orderResults: response.data.results,
          modelName: strategyDetails?.model_name,
          userEmail: userEmail,
        };
        return axios.post(
          `${server.server.baseUrl}api/model-portfolio-db-update`,
          updateData,
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
        );
      })
      .then(() => {
        // Add user to status check queue for async order status polling (matching web frontend)
        const statusCheckData = {
          userEmail: userEmail,
          modelName: strategyDetails?.model_name,
          advisor: configData?.config?.REACT_APP_ADVISOR_SPECIFIC_TAG,
          broker: broker,
        };
        return axios.post(
          `${server.ccxtServer.baseUrl}rebalance/add-user/status-check-queue`,
          statusCheckData,
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
        );
      })
      .then(() => {
        setLoading(false);
        console.log('won');
        openSucess();
        console.log('open::');
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
          (errMsg.includes("cdsl") || errMsg.includes("edis") || errMsg.includes("tpin")) &&
          setShowDhanTpinModel
        ) {
          setShowDhanTpinModel(true);
          onCloseReviewTrade();
          return;
        }

        Toast.show({
          type: 'error',
          text1: 'Order Failed',
          text2: errorMessage,
        });
      });
    //  console.log('yahan6');
  };

  const getBasePayload = () => ({
    modelName: strategyDetails?.model_name,
    advisor: strategyDetails?.advisor,
    model_id: latestRebalance.model_Id,
    unique_id: calculatedPortfolioData?.uniqueId,
    broker: broker,
  });

  const additionalPayload = getBasePayload();

  const [isWebView, setWebView] = useState(false);
  const webViewRef = useRef(null);
  const [htmlContentfinal, setHtmlContent] = useState('');

  const [zerodhaStatus, setZerodhaStatus] = useState(null);
  const [zerodhaRequestToken, setZerodhaRequestToken] = useState(null);
  const [zerodhaRequestType, setZerodhaRequestType] = useState(null);
  const handleWebViewNavigationStateChange = newNavState => {
    // Handle navigation state changes, e.g., success/failure redirects
    const {url} = newNavState;
    console.log('[ZerodhaPublisher] Navigation URL:', url);

    // Check for Kite redirect patterns after successful order placement
    if (url.includes('success') || url.includes('completed') || url.includes('basket/success')) {
      console.log('[ZerodhaPublisher] Success redirect detected - orders placed in Kite');
      setZerodhaStatus('success');
      setZerodhaRequestType('basket');
      setWebView(false); // Close WebView
      // checkZerodhaStatus will be called via useEffect when zerodhaStatus changes
      return false; // Prevent navigation
    }

    // Check for cancel
    if (url.includes('cancelled') || url.includes('cancel')) {
      console.log('[ZerodhaPublisher] User cancelled basket order');
      setZerodhaStatus('cancelled');
      setWebView(false);
      setLoading(false);
      return false;
    }

    return true; // Allow navigation
  };
  const zerodhaApiKey = configData?.config?.REACT_APP_ZERODHA_API_KEY;

  // Helper function to get last known price
  const getLastKnownPrice = (symbol) => {
    const price = getLTPForSymbol(symbol);
    return price !== null ? price : '-';
  };

  const handleZerodhaRedirect = async () => {
    setLoading(true);
    const storageKey = 'stockDetailsZerodhaOrder';
    try {
      // Clear the existing value
      await AsyncStorage.removeItem(storageKey);

      // Set the new value
      await AsyncStorage.setItem(storageKey, JSON.stringify(stockDetails));

      console.log('[ZerodhaPublisher] Stored stock details:', stockDetails);
    } catch (error) {
      console.error('[ZerodhaPublisher] Error storing stock details:', error);
    }
    const apiKey = zerodhaApiKey;
    const basket = stockDetails.map(stock => {
      let baseOrder = {
        variety: 'regular',
        tradingsymbol: stock.tradingSymbol,
        exchange: stock.exchange,
        transaction_type: stock.transactionType,
        order_type: stock.orderType,
        quantity: stock.quantity,
        readonly: false,
        price: stock.price,
      };

      // Get the LTP for the current stock
      const ltp = getLastKnownPrice(stock.tradingSymbol);

      // If LTP is available and not '-', use it as the price
      if (ltp !== '-') {
        baseOrder.price = parseFloat(ltp);
      }

      // If it's a LIMIT order, use the LTP as the price
      if (stock.orderType === 'LIMIT') {
        baseOrder.price = parseFloat(stock.price || 0);
      } else if (stock.orderType === 'MARKET') {
        const ltp = getLastKnownPrice(stock.tradingSymbol);
        if (ltp !== '-') {
          baseOrder.price = parseFloat(ltp);
        } else {
          baseOrder.price = 0;
        }
      }

      if (stock.quantity > 100) {
        baseOrder.readonly = true;
      }

      return baseOrder;
    });

    const currentISTDateTime = new Date();

    try {
      // Step 1: Update the database with the current IST date-time (mark as placed)
      console.log('[ZerodhaPublisher] Updating trade recommendations...');
      const res = await axios.post(
        `${server.server.baseUrl}api/zerodha/model-portfolio/update-reco-with-zerodha-model-pf`,
        {
          stockDetails: stockDetails,
          leaving_datetime: currentISTDateTime,
          email: userEmail,
          trade_given_by: strategyDetails?.advisor || configData?.config?.REACT_APP_ADVISOR_SPECIFIC_TAG,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Advisor-Subdomain': configData?.config?.REACT_APP_HEADER_NAME,
            'aq-encrypted-key': generateToken(
              Config.REACT_APP_AQ_KEYS,
              Config.REACT_APP_AQ_SECRET,
            ),
          },
        }
      );

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

      // Store updated stock details for post-order processing
      await AsyncStorage.setItem(
        'stockDetailsZerodhaOrder',
        JSON.stringify(filteredStockDetails),
      );

      console.log('[ZerodhaPublisher] Opening Kite basket WebView...');

      // Step 2: Generate HTML form content and open WebView
      const htmlContent = generateHtmlForm(basket, apiKey);
      setHtmlContent(htmlContent);
      setWebView(true);
      setLoading(false); // Stop loading, WebView will show
    } catch (error) {
      console.error('[ZerodhaPublisher] Failed to update trade recommendation:', error);
      setLoading(false);
      alert('Failed to prepare basket order. Please try again.');
    }
  };

  // Redirect URL for Kite to return after order placement
  const appURL = 'success';
  const generateHtmlForm = (basket, apiKey) => {
    return `<html>
        <body>
          <form id="zerodhaForm" method="POST" action="https://kite.zerodha.com/connect/basket">
            <input type="hidden" name="api_key" value="${apiKey}" />
            <input type="hidden" name="data" value='${JSON.stringify(
              basket,
            )}' />
            <input type="hidden" name="redirect_params" value="${appURL}=true" />
          </form>
          <script>
            document.getElementById('zerodhaForm').submit();
          </script>
        </body>
      </html>
    `;
  };

  const [zerodhaStockDetails, setZerodhaStockDetails] = useState(null);
  const [zerodhaAdditionalPayload, setZerodhaAdditionalPayload] =
    useState(null);

  const fetchData = async () => {
    try {
      // Fetch pending order data
      const pendingOrderData = await AsyncStorage.getItem(
        'stockDetailsZerodhaOrder',
      );
      if (pendingOrderData) {
        console.log('Pending Order Zerodha:', JSON.parse(pendingOrderData));
        setZerodhaStockDetails(JSON.parse(pendingOrderData));
      }

      // Fetch additional payload data
      const payloadData = await AsyncStorage.getItem('additionalPayload');
      if (payloadData) {
        setZerodhaAdditionalPayload(JSON.parse(payloadData));
      }
    } catch (error) {
      console.error('Error fetching data from AsyncStorage:', error);
    }
  };

  const checkZerodhaStatus = async () => {
    await fetchData();

    console.log('[ZerodhaPublisher] checkZerodhaStatus - Status:', zerodhaStatus, 'Type:', zerodhaRequestType);
    console.log('[ZerodhaPublisher] Stock Details:', zerodhaStockDetails);

    if (zerodhaStatus === 'success' && zerodhaRequestType === 'basket') {
      setLoading(true);

      const requestHeaders = {
        'Content-Type': 'application/json',
        'X-Advisor-Subdomain': configData?.config?.REACT_APP_HEADER_NAME,
        'aq-encrypted-key': generateToken(
          Config.REACT_APP_AQ_KEYS,
          Config.REACT_APP_AQ_SECRET,
        ),
      };

      try {
        // Step 1: Record orders and fetch actual statuses from Zerodha
        // This endpoint matches Zerodha order book with our trade list and returns actual order statuses
        console.log('[ZerodhaPublisher] Step 1: Recording publisher orders...');
        const recordResponse = await axios.post(
          `${server.server.baseUrl}api/zerodha/publisher/record-orders`,
          {
            stockDetails: zerodhaStockDetails,
            publisherResults: [{ status: 'success', batchIndex: 0 }],
            userEmail: userEmail,
            broker: 'Zerodha',
          },
          { headers: requestHeaders }
        );

        console.log('[ZerodhaPublisher] Record orders response:', recordResponse.data);

        const orderResults = recordResponse.data.response || recordResponse.data.results || [];

        // Step 2: Update model portfolio database with order results
        console.log('[ZerodhaPublisher] Step 2: Updating model portfolio DB...');
        await axios.post(
          `${server.server.baseUrl}api/model-portfolio-db-update`,
          {
            modelId: latestRebalance?.model_Id,
            orderResults: orderResults,
            modelName: strategyDetails?.model_name,
            userEmail: userEmail,
          },
          { headers: requestHeaders }
        );

        // Step 3: Update portfolio holdings from Zerodha
        console.log('[ZerodhaPublisher] Step 3: Updating portfolio holdings...');
        await axios.post(
          `${server.ccxtServer.baseUrl}zerodha/user-portfolio`,
          { user_email: userEmail },
          { headers: requestHeaders }
        );

        // Success - show results to user
        console.log('[ZerodhaPublisher] ✅ All post-order steps completed successfully');
        setOrderPlacementResponse(orderResults);
        setOpenSucessModal(true);
        onCloseReviewTrade(); // Close review modal
        setLoading(false);

        // Clean up AsyncStorage
        await AsyncStorage.removeItem('stockDetailsZerodhaOrder');
        await AsyncStorage.removeItem('additionalPayload');

        // Reset state
        setZerodhaStatus(null);
        setZerodhaRequestType(null);

      } catch (error) {
        console.error('[ZerodhaPublisher] ❌ Error in post-order processing:', error);
        console.error('[ZerodhaPublisher] Error details:', error.response?.data);
        setLoading(false);

        // Mark as pending so the async poller knows to check broker order book
        try {
          await axios.put(
            `${server.ccxtServer.baseUrl}rebalance/update/subscriber-execution`,
            {
              userEmail: userEmail,
              modelName: strategyDetails?.model_name,
              executionStatus: 'pending',
            },
            { headers: requestHeaders }
          );
        } catch (statusErr) {
          console.error('[ZerodhaPublisher] Error updating subscriber execution status:', statusErr);
        }

        // Show error to user
        Toast.show({
          type: 'error',
          text1: 'Order Status Unknown',
          text2: 'Orders may have been placed in Kite, but failed to record status. Please check your Kite app.',
        });

        // Still close the modal
        onCloseReviewTrade();
        setZerodhaStatus(null);
        setZerodhaRequestType(null);
      }

      // Always enroll in status-check-queue regardless of record-orders success/failure.
      // This ensures the async poller can reconcile orders from the broker's order book
      // even if the initial record-orders call failed.
      try {
        console.log('[ZerodhaPublisher] Adding to status check queue...');
        await axios.post(
          `${server.ccxtServer.baseUrl}rebalance/add-user/status-check-queue`,
          {
            userEmail: userEmail,
            modelName: strategyDetails?.model_name,
            advisor: configData?.config?.REACT_APP_ADVISOR_SPECIFIC_TAG,
            broker: 'Zerodha',
          },
          { headers: requestHeaders }
        );
      } catch (queueErr) {
        console.error('[ZerodhaPublisher] Error adding to status-check-queue:', queueErr);
      }
    }
  };

  useEffect(() => {
    if (
      zerodhaStatus === 'success' &&
      zerodhaRequestType === 'basket' &&
      jwtToken !== undefined
    ) {
      checkZerodhaStatus();
    }
  }, [zerodhaStatus, zerodhaRequestType, userEmail, jwtToken]);

  const [isLoading, setIsLoading] = useState(false);
  const hasZeroQuantity = stockDetails.some(stock => stock.quantity === 0);
  const [InputFixSizeValue, setInputFixSizeValue] = useState(0);

  const sheet = useRef(null);
  const scrollViewRef = useRef(null);
  /////////////////////////////////////////////////////////////////

  const renderItem = ({item}) => {
    //console.log('main Item,',item);
    if (!item) {
      return null; // or a fallback UI element if desired
    }
    return (
      <View style={styles.rowContainer}>
        <View style={styles.leftContainer}>
          <Text style={styles.symbol}>{item.symbol}</Text>
          <Text style={styles.buyOrder}>BUY</Text>
        </View>
        <View style={styles.quantityContainer}>
          <Text
            style={{
              color: 'black',
              fontFamily: 'Poppins-Regular',
              alignContent: 'center',
              alignItems: 'center',
              alignSelf: 'center',
            }}>
            {getLTPForSymbol(item.symbol)
              ? `₹${getLTPForSymbol(item.symbol)}`
              : '₹--'}
          </Text>
        </View>
        <View style={styles.rightContainer}>
          {!confirmOrder ? (
            <Text style={styles.cellTextmktprice}>
              {parseFloat(item.value * 100).toFixed(2)}%
            </Text>
          ) : (
            <Text style={styles.cellTextmktprice}>Qty-{item.qty}</Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <Modal
      transparent={true}
      visible={visible}
      onRequestClose={onCloseReviewTrade}
      animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, {width: width * 1}]}>
          {isWebView ? (
            <View
              style={{
                flex: 0,
                height: 600,
                borderTopRightRadius: 10,
                borderTopLeftRadius: 10,
                backgroundColor: 'white',
                padding: 10,
              }}>
              <View style={{alignContent: 'flex-end', alignItems: 'flex-end'}}>
                <TouchableOpacity onPress={() => {
                  setWebView(false);
                  setLoading(false);
                  setZerodhaStatus(null);
                  setZerodhaRequestType(null);
                }}>
                  <XIcon size={16} color={'black'} />
                </TouchableOpacity>
              </View>
              <WebView
                ref={webViewRef}
                style={{
                  flex: 1,
                  borderTopRightRadius: 10,
                  borderTopLeftRadius: 10,
                }}
                source={{uri: htmlContentfinal}} // Corrected 'url' to 'uri'
                onLoadStart={() => setIsLoading(true)}
                onLoadEnd={() => setIsLoading(false)}
                onNavigationStateChange={handleWebViewNavigationStateChange}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                onError={e => console.error('WebView error:', e.nativeEvent)}
              />
            </View>
          ) : (
            <>
              <View style={styles.horizontal} />
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                <Text style={styles.modalHeader1}>
                  Review Trade Details {fileName}
                </Text>
                <TouchableOpacity
                  style={{marginRight: 20}}
                  onPress={onCloseReviewTrade}>
                  <XIcon size={24} color="#000" />
                </TouchableOpacity>
              </View>

              <View style={{backgroundColor: '#f8f8f8'}}></View>
              <View
                style={{
                  borderWidth: 0.5,
                  borderColor: 'grey',
                  marginTop: 5,
                }}></View>

              {/* Surveillance Warning for Angel One */}
              {broker === 'Angel One' &&
                surveillanceData?.surveillance &&
                (() => {
                  const surveillanceStocks = surveillanceData.surveillance.filter(
                    (stock) =>
                      stock.found === true &&
                      stock.surveillance &&
                      stock.surveillance !== '' &&
                      stock.surveillance !== 'N',
                  );

                  if (surveillanceStocks.length > 0) {
                    return (
                      <View style={styles.surveillanceWarning}>
                        <View style={styles.surveillanceHeader}>
                          <AlertTriangleIcon size={18} color="#DC2626" />
                          <Text style={styles.surveillanceTitle}>
                            Surveillance Alert
                          </Text>
                        </View>
                        <Text style={styles.surveillanceText}>
                          The following stocks are under Angel One surveillance measures
                          and may be rejected via API:
                        </Text>
                        {surveillanceStocks.map((stock, index) => (
                          <Text key={index} style={styles.surveillanceStock}>
                            • <Text style={{fontFamily: 'Poppins-Bold'}}>{stock.symbol}</Text>{' '}
                            (Surveillance: {stock.surveillance})
                          </Text>
                        ))}
                        <Text style={styles.surveillanceNote}>
                          Please trade these stocks manually through the Angel One mobile
                          app or web platform.
                        </Text>
                      </View>
                    );
                  }
                  return null;
                })()}

              <FlatList
                data={totalArray.length > 0 ? totalArray : dataArray}
                renderItem={renderItem}
                keyExtractor={item => item.symbol}
                ListEmptyComponent={
                  <View
                    style={{
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginTop: 20,
                    }}>
                    <View
                      style={{
                        borderRadius: 50,
                        backgroundColor: '#EBECEF',
                        padding: 20,
                      }}>
                      <CandlestickChartIcon size={40} color={'black'} />
                    </View>
                    <Text
                      style={{
                        fontFamily: 'Poppins-SemiBold',
                        color: 'black',
                        fontSize: 18,
                        marginVertical: 10,
                      }}>
                      No Orders to Place
                    </Text>
                    <Text style={{fontFamily: 'Poppins-Medium', color: 'grey'}}>
                      Add item to cart to place order.
                    </Text>
                  </View>
                }
                contentContainerStyle={{
                  paddingHorizontal: 10,
                  marginBottom: 10,
                }}
              />

              {confirmOrder ? (
                <TouchableOpacity
                  disabled={calculatedLoading || loading}
                  onPress={() => {
                    // Pre-order EDIS checks
                    const hasSellOrders = stockDetails?.some(s => s.transactionType === 'SELL');
                    if (hasSellOrders) {
                      // Zerodha DDPI check (before Kite redirect or server-side)
                      if (broker === 'Zerodha' &&
                        !['consent', 'physical', 'ddpi'].includes(userDetails?.ddpi_status) &&
                        setShowDdpiModal) {
                        setShowDdpiModal(true);
                        onCloseReviewTrade();
                        return;
                      }
                      // Angel One EDIS check
                      if (broker === 'Angel One' && edisStatus && edisStatus.edis === false && setShowAngleOneTpinModel) {
                        setShowAngleOneTpinModel(true);
                        onCloseReviewTrade();
                        return;
                      }
                      // Dhan EDIS check
                      if (broker === 'Dhan' && dhanEdisStatus?.data?.some((h) => h.edis === false) && setShowDhanTpinModel) {
                        setShowDhanTpinModel(true);
                        onCloseReviewTrade();
                        return;
                      }
                    }

                    // Use Kite Publisher for Zerodha (compliant method)
                    // Use server-side API for other brokers
                    if (broker === 'Zerodha') {
                      console.log('[PlaceOrder] Using Kite Publisher for Zerodha');
                      handleZerodhaRedirect();
                    } else {
                      console.log('[PlaceOrder] Using server-side API for', broker);
                      placeOrder();
                    }
                  }}
                  style={styles.orderButton}>
                  {0 > 1 ? (
                    <View>
                      <Text>
                        Note : Orders may be rejected due to insufficient broker
                        balance of {parseFloat(funds?.availablecash).toFixed(2)}
                        .
                      </Text>
                    </View>
                  ) : null}

                  {loading ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="small" color="white" />
                    </View>
                  ) : (
                    <Text style={styles.orderButtonText}>
                      {broker === 'Zerodha' ? 'Open Kite Basket' : 'Place Order'} (₹{' '}
                      {parseFloat(totalInvestmentValue).toFixed(2)})
                    </Text>
                  )}
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  disabled={calculatedLoading}
                  onPress={() => {
                    calculateRebalance();
                  }}
                  style={styles.orderButton}>
                  {0 > 1 ? (
                    <View>
                      <Text>
                        Note : Orders may be rejected due to insufficient broker
                        balance of {parseFloat(funds?.availablecash).toFixed(2)}
                        .
                      </Text>
                    </View>
                  ) : null}

                  {calculatedLoading ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="small" color="white" />
                    </View>
                  ) : (
                    <Text style={styles.orderButtonText}>Confirm Details</Text>
                  )}
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </View>
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
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    marginLeft: 40,
    // borderWidth:1,
    // flex: 1, // Center alignment
  },
  buyOrder: {
    color: 'green',
    alignSelf: 'flex-start',
  },
  quantityContainer1: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 5,
    marginHorizontal: 25,
  },

  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  buyOrder: {
    color: 'green',
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
    fontFamily: 'Poppins-SemiBold',
  },
  cellText: {
    alignSelf: 'flex-start',
    color: 'black',
    fontFamily: 'Poppins-Regular',
  },
  cellTextmktprice: {
    alignSelf: 'flex-end',
    color: 'black',
    fontFamily: 'Poppins-Regular',
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
  quantityInputup: {
    width: 80,
    height: 35,
    padding: 2,
    alignSelf: 'center',
    marginHorizontal: 4,
    color: '#0d0c22',
    fontSize: 14,
    fontFamily: 'Poppins-Bold',
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#e9e8e8',
    borderRadius: 7,
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    height: screenHeight / 1.8,
    elevation: 5,
  },
  horizontal: {
    width: 110,
    height: 6,
    marginBottom: 20,
    borderRadius: 250,
    alignSelf: 'center',
    backgroundColor: '#f1f4f8',
  },
  modalHeader: {
    fontSize: 18,
    marginTop: 3,
    fontWeight: 'bold',
    alignSelf: 'flex-start',
    color: 'black',
  },
  modalHeader1: {
    fontSize: 17,
    fontFamily: 'Poppins-Bold',
    alignSelf: 'flex-start',
    marginHorizontal: 20,
    color: 'black',
    marginBottom: 10,
  },
  orderButton: {
    backgroundColor: '#002a5c',
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
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    alignContent: 'flex-end',
  },
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 10,
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#E8E8E8',
  },
  // Surveillance Warning Styles
  surveillanceWarning: {
    marginHorizontal: 10,
    marginVertical: 8,
    padding: 12,
    backgroundColor: '#FEF2F2',
    borderLeftWidth: 4,
    borderLeftColor: '#DC2626',
    borderRadius: 4,
  },
  surveillanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  surveillanceTitle: {
    fontSize: 14,
    fontFamily: 'Poppins-Bold',
    color: '#DC2626',
    marginLeft: 8,
  },
  surveillanceText: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#991B1B',
    marginBottom: 6,
  },
  surveillanceStock: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#B91C1C',
    marginLeft: 8,
    marginBottom: 2,
  },
  surveillanceNote: {
    fontSize: 11,
    fontFamily: 'Poppins-Regular',
    color: '#DC2626',
    marginTop: 6,
    fontStyle: 'italic',
  },
});

export default MPReviewTradeModal;
