import React, {
  useState,
  useEffect,
  forwardRef,
  useRef,
  useCallback,
} from 'react';
import {XIcon, Calendar} from 'lucide-react-native';
import axios from 'axios';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
  StyleSheet,
  Image,
  ScrollView,
  Dimensions,
  Pressable,
  ActivityIndicator,
  FlatList,
  Alert,
} from 'react-native';
import CryptoJS from 'react-native-crypto-js';
import WebView from 'react-native-webview';
import BrokerSelectionModal from '../BrokerSelectionModal';
import server from '../../utils/serverConfig';
import LoadingSpinner from '../LoadingSpinner';
import IsMarketHours from '../../utils/isMarketHours';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import useWebSocketCurrentPrice from '../../FunctionCall/useWebSocketCurrentPrice';
import {fetchFunds} from '../../FunctionCall/fetchFunds';
import MissedGainText from '../AdviceScreenComponents/DynamicText/BestPerformerGainText';
import WebsocketSubText from '../AdviceScreenComponents/DynamicText/WebsocketSubText';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SliderButton from '../SliderButton';
import {generateToken} from '../../utils/SecurityTokenManager';
import {useTotalAmount} from '../AdviceScreenComponents/DynamicText/websocketPrice';
import Config from 'react-native-config';
import Toast from 'react-native-toast-message';
import {getAdvisorSubdomain} from '../../utils/variantHelper';
import {useTrade} from '../../screens/TradeContext';
const {height: screenHeight} = Dimensions.get('window');

const UserStrategySubscribeModal = ({
  visible,
  onClose,
  fileName,
  userEmail,
  clientCode,
  apiKey,
  secretKey,
  jwtToken,
  viewToken,
  sid,
  serverId,
  broker,
  strategyDetails,
  setOpenSubscribeModel,
  latestRebalance,
  setOpenSucessModal,
  setOrderPlacementResponse,
  setBrokerModel,
  BrokerModel,
  setBroker,

  setOpenTokenExpireModel,
}) => {
  const {configData} = useTrade();
  const [loading, setLoading] = useState(false);
  const [confirmOrder, setConfirmOrder] = useState(false);

  console.log(strategyDetails);

  console.log(
    'strategyDetailsooooooooo',
    strategyDetails,
    'mooo',
    latestRebalance,
  );
  console.log('mooo', latestRebalance.totalInvestmentValue);
  const {getLTPForSymbol} = useWebSocketCurrentPrice(
    latestRebalance.adviceEntries,
  );

  const onCloseModal = () => {
    console.log('Clossse');
    setOpenSubscribeModel(false);
  };

  const [isBrokerConnected, setIsBrokerConnected] = useState(false);
  const [brokername, setBrokerName] = useState('');
  const [createdDate, setcreateDate] = useState('');

  const [modalVisible, setModalVisible] = useState(false);
  const [showIIFLModal, setShowIIFLModal] = useState(false);
  const [showICICIUPModal, setShowICICIUPModal] = useState(false);
  const [showupstoxModal, setShowupstoxModal] = useState(false);
  const [showangleoneModal, setShowangleoneModal] = useState(false);
  const [showzerodhamodal, setShowzerodhaModal] = useState(false);
  const [showhdfcModal, setShowhdfcModal] = useState(false);
  const [showDhanModal, setShowDhanModal] = useState(false);
  const [showKotakModal, setShowKotakModal] = useState(false);

  const showToast = () => {
    Toast.show({
      type: 'error',
      text1: '',
      text2: 'Orders cannot be placed after Market hours.',
    });
  };

  const fetchBrokerStatusModal = async () => {
    if (userEmail) {
      try {
        const response = await axios.get(
          `${server.server.baseUrl}api/user/getUser/${userEmail}`,
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
        const userData = response.data.User;
        setBroker(userData.user_broker);
        console.log('Here Broker COnnected:', broker, userData.user_broker);
        setcreateDate(userData.created_at);
        setIsBrokerConnected(!!userData?.user_broker);
        // console.log('corrected');
      } catch (error) {
        //   console.error('Error fetching broker status:', error.response?.data || error.message);
        setIsBrokerConnected(false); // Handle error by setting default status
      } finally {
        setLoading(false);
      }
    }
  };

  const handleBrokerConnect = broker => {
    setIsBrokerConnected(true); // Assuming successful connection
    setModalVisible(false); // Hide modal after selection
    setShowIIFLModal(true); // Show IIFL modal
  };

  const checkValidApiAnSecret = data => {
    console.log('data erty:', data);
    const bytesKey = CryptoJS.AES.decrypt(data, 'ApiKeySecret');
    const Key = bytesKey.toString(CryptoJS.enc.Utf8);
    if (Key) {
      return Key;
    }
  };

  const [funds, setFunds] = useState(null);

  useEffect(() => {
    const getFunds = async () => {
      console.log('logg funds:', broker, jwtToken, clientCode);
      const fetchedFunds = await fetchFunds(
        broker,
        clientCode,
        apiKey,
        jwtToken,
        secretKey,
      );
      if (fetchedFunds) {
        console.log('funds get fetch', fetchedFunds);
        setFunds(fetchedFunds);
      } else {
        console.error('Failed to fetch funds.');
      }
    };

    // Call the function when the component mounts or when relevant props change
    if (broker && (clientCode || jwtToken)) {
      getFunds();
    }
  }, [broker, clientCode, apiKey, jwtToken, secretKey]);

  const [calculatedPortfolioData, setCaluculatedPortfolioData] = useState([]);
  const [calculatedLoading, setCalculateLoading] = useState(false);

  const calculateRebalance = () => {
    console.log('hereeeeee', broker, funds?.status);
    const isMarketHours = IsMarketHours();
    setCalculateLoading(true);
    if (broker === undefined) {
      setBrokerModel(true);
      fetchBrokerStatusModal();
      setCalculateLoading(false);
    } else if (funds?.status === 1 || funds?.status === 2 || funds === null) {
      // Funds check matching web frontend: status 1/2 = token issue, null = error
      console.log('Funds status check failed:', funds?.status);
      setOpenTokenExpireModel(true);
      setCalculateLoading(false);
    } else if (!isMarketHours) {
      // Block orders outside market hours (matching web frontend logic)
      setCalculateLoading(false);
      showToast();
      return;
    } else {
      console.log('ModelName:', strategyDetails);
      let payload = {
        userEmail: userEmail,
        userBroker: broker,
        modelName: strategyDetails?.model_name,
        advisor: strategyDetails?.advisor,
        model_id: latestRebalance?.model_Id,
        userFund: funds?.data?.availablecash,
      };
      if (broker === 'IIFL Securities') {
        payload = {
          ...payload,
          clientCode: clientCode,
        };
      } else if (broker === 'ICICI Direct') {
        payload = {
          ...payload,
          apiKey: checkValidApiAnSecret(apiKey),
          secretKey: checkValidApiAnSecret(secretKey),
          sessionToken: jwtToken,
        };
      } else if (broker === 'Upstox') {
        console.log('Data to pay:');
        payload = {
          ...payload,
          clientCode: clientCode,
          apiKey: checkValidApiAnSecret(apiKey),
          apiSecret: checkValidApiAnSecret(secretKey),
          accessToken: jwtToken,
        };
        console.log(
          'Data to pay2:',
          payload,
          clientCode,
          checkValidApiAnSecret(apiKey),
          checkValidApiAnSecret(secretKey),
          jwtToken,
        );
      } else if (broker === 'Angel One') {
        payload = {
          ...payload,
          apiKey: configData?.config?.REACT_APP_ANGEL_ONE_API_KEY,
          jwtToken: jwtToken,
        };
      } else if (broker === 'Kotak') {
        payload = {
          ...payload,
          consumerKey: checkValidApiAnSecret(apiKey),
          consumerSecret: checkValidApiAnSecret(secretKey),
          accessToken: jwtToken,
          viewToken: viewToken,
          sid: sid,
          serverId: serverId,
        };
      } else if (broker === 'Hdfc Securities') {
        payload = {
          ...payload,
          apiKey: checkValidApiAnSecret(apiKey),
          accessToken: jwtToken,
        };
      } else if (broker === 'Zerodha') {
        payload = {
          ...payload,
          apiKey: checkValidApiAnSecret(apiKey),
          SecretKey: checkValidApiAnSecret(secretKey),
          accessToken: jwtToken,
        };
      } else if (broker === 'Fyers') {
        payload = {
          ...payload,
          clientId: clientCode,
          accessToken: jwtToken,
        };
      } else if (broker === 'AliceBlue') {
        payload = {
          ...payload,
          clientId: clientCode,
          accessToken: jwtToken,
          apiKey: checkValidApiAnSecret(apiKey),
        };
      } else if (broker === 'Dhan') {
        payload = {
          ...payload,
          clientId: clientCode,
          accessToken: jwtToken,
        };
      } else if (broker === 'Groww') {
        payload = {
          ...payload,
          accessToken: jwtToken,
        };
      } else if (broker === 'Motilal Oswal') {
        payload = {
          ...payload,
          clientCode: clientCode,
          accessToken: jwtToken,
          apiKey: checkValidApiAnSecret(apiKey),
        };
      }
      let config = {
        method: 'post',
        url: `${server.ccxtServer.baseUrl}rebalance/calculate`,
        data: JSON.stringify(payload),
        headers: {
          'Content-Type': 'application/json',
          'X-Advisor-Subdomain': configData?.config?.REACT_APP_HEADER_NAME,
          'aq-encrypted-key': generateToken(
            Config.REACT_APP_AQ_KEYS,
            Config.REACT_APP_AQ_SECRET,
          ),
        },
      };
      console.log('final Payload we get1:', payload);
      console.log(
        'final URL:',
        `${server.ccxtServer.baseUrl}rebalance/calculate`,
      );
      axios
        .request(config)
        .then(response => {
          if (response.data) {
            console.log('resposidi:', response.data);
            setCaluculatedPortfolioData(response.data);
            setCalculateLoading(false);
            setConfirmOrder(true);
          } else {
            setCaluculatedPortfolioData([]);
            setCalculateLoading(false);
            setConfirmOrder(false);
          }
        })
        .catch(error => {
          setCalculateLoading(false);
          console.log(error);
        });
    }
  };

  const dataArray =
    calculatedPortfolioData?.length !== 0
      ? [
          ...calculatedPortfolioData?.buy.map(item => ({
            symbol: item.symbol,
            token: item?.token ? item?.token : '',
            qty: item.quantity,
            orderType: 'BUY',
            exchange: item.exchange,
          })),
          ...calculatedPortfolioData?.sell.map(item => ({
            symbol: item.symbol,
            token: item?.token ? item?.token : '',
            qty: item.quantity,
            orderType: 'SELL',
            exchange: item.exchange,
          })),
        ]
      : [];
  console.log('Data:', dataArray);
  const totalInvestmentValue = dataArray
    .filter(item => item.orderType === 'BUY')
    .reduce((total, item) => {
      const currentPrice = getLTPForSymbol(item.symbol);
      const investment = item.qty * currentPrice;
      return total + investment;
    }, 0);

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
        token: item?.token ? item?.token : '',
        quantity: item.qty,
        priority: 0,
        user_broker: broker,
      };
    });
  };

  const stockDetails = convertResponse(dataArray);

  const totalAmount = useTotalAmount(stockDetails);
  console.log('totalAmount:::', totalAmount);

  const onSlideComplete = () => {
    if (broker === 'Zerodha') {
      handleZerodhaRedirect();
    } else {
      placeOrder();
    }
  };

  const placeOrder = () => {
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
      switch (broker) {
        case 'IIFL Securities':
          return {
            clientCode,
            user_broker: 'IIFL Securities',
            accessToken: jwtToken,
          };
        case 'ICICI Direct':
        case 'Upstox':
          return {
            apiKey: checkValidApiAnSecret(apiKey),
            secretKey: checkValidApiAnSecret(secretKey),
            [broker === 'Upstox' ? 'accessToken' : 'sessionToken']: jwtToken,
          };
        case 'Angel One':
          return {apiKey, jwtToken};
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
            serverId: serverId,
          };
        case 'Fyers':
          return {
            clientId: clientCode,
            accessToken: jwtToken,
          };
        case 'AliceBlue':
          return {
            clientId: clientCode,
            accessToken: jwtToken,
            apiKey: checkValidApiAnSecret(apiKey),
          };
        case 'Groww':
          return {
            accessToken: jwtToken,
          };
        case 'Motilal Oswal':
          return {
            clientCode: clientCode,
            accessToken: jwtToken,
            apiKey: checkValidApiAnSecret(apiKey),
          };
        default:
          return {};
      }
    };

    const payload = {
      ...getBasePayload(),
      ...getBrokerSpecificPayload(),
    };
    console.log('Payload:', payload);
    const config = {
      method: 'post',
      url: `${server.ccxtServer.baseUrl}rebalance/process-trade`,
      data: JSON.stringify(payload),
      headers: {
        'Content-Type': 'application/json',
        'X-Advisor-Subdomain': configData?.config?.REACT_APP_HEADER_NAME,
        'aq-encrypted-key': generateToken(
          Config.REACT_APP_AQ_KEYS,
          Config.REACT_APP_AQ_SECRET,
        ),
      },
    };

    axios
      .request(config)
      .then(response => {
        console.log('responsi:', response.data.results);
        setOrderPlacementResponse(response.data.results);
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
        setOpenSucessModal(true);
        setOpenSubscribeModel(false);
      })
      .catch(error => {
        console.error('Error in placeOrder:', error);
        setLoading(false);
        // Consider adding error handling here, e.g., showing an error modal
      });
  };

  const getBasePayload = () => ({
    modelName: strategyDetails?.model_name,
    advisor: strategyDetails?.advisor,
    model_id: latestRebalance.model_Id,
    unique_id: calculatedPortfolioData?.uniqueId,
    broker: broker,
  });

  const additionalPayload = getBasePayload();
  //////Zerodha Start
  const [isWebView, setWebView] = useState(false);
  const webViewRef = useRef(null);
  const [htmlContentfinal, setHtmlContent] = useState('');

  const uro = `https://test.alphaquark.in/stock-recommendation/?request_token=Dmm9bMG9fitX4Ba4XuaF0Z5gvstgFTAZ&type=basket&status=success`;

  const getAdditionalPayload = () => {
    if (matchingRepairTrade) {
      return {
        modelName: matchingRepairTrade.modelName,
        advisor: matchingRepairTrade.advisorName,
        unique_id: matchingRepairTrade?.uniqueId,
        model_id: modelPortfolioModelId,
        broker: broker,
      };
    } else {
      return {
        modelName: filteredData[0]['model_name'],
        advisor: filteredData[0]['advisor'],
        unique_id: calculatedPortfolioData?.uniqueId,
        model_id: modelPortfolioModelId,
        broker: broker,
      };
    }
  };
  //const additionalPayload = getAdditionalPayload();
  const [zerodhaStatus, setZerodhaStatus] = useState(null);
  const [zerodhaRequestToken, setZerodhaRequestToken] = useState(null);
  const [zerodhaRequestType, setZerodhaRequestType] = useState(null);
  const handleWebViewNavigationStateChange = newNavState => {
    // Handle navigation state changes, e.g., success/failure redirects

    const {url} = newNavState;
    console.log('url at Review Modal :', url);
    if (url.includes('success') || url.includes('completed')) {
      console.log('success url at Review Modal :', url);
      setZerodhaStatus('success');
      setZerodhaRequestType('rebalance');
      console.log('Status of Placement:', zerodhaStatus, zerodhaRequestType);
    }
  };
  const zerodhaApiKey = configData?.config?.REACT_APP_ZERODHA_API_KEY;
  const handleZerodhaRedirect = async () => {
    console.log('THos caalled', stockDetails);
    try {
      console.log('This is called', stockDetails);
      await AsyncStorage.removeItem('stockDetailsZerodhaOrder');
      await AsyncStorage.removeItem('zerodhaAdditionalPayload');
      AsyncStorage.setItem(
        'zerodhaAdditionalPayload',
        JSON.stringify(additionalPayload),
      );

      //  console.log('Stock details updated in AsyncStorage.');
    } catch (error) {
      console.error('Error handling Zerodha redirect:', error);
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
      };

      // Get the LTP for the current stock
      console.log('Baseee:', baseOrder);
      const ltp = getLTPForSymbol(stock.tradingSymbol);
      console.log('ltp of sym:', ltp, stock.tradingSymbol);
      // If LTP is available and not '-', use it as the price
      if (ltp !== '-') {
        baseOrder.price = parseFloat(ltp);
      }

      // If it's a LIMIT order, use the LTP as the price
      if (stock.orderType === 'LIMIT') {
        baseOrder.price = parseFloat(stock.price || 0);
      } else if (stock.orderType === 'MARKET') {
        const ltp = getLTPForSymbol(stock.tradingSymbol);
        if (ltp !== '-') {
          baseOrder.price = parseFloat(ltp);
        } else {
          baseOrder.price = 0;
        }
      }

      if (stock.quantity > 100) {
        baseOrder.readonly = true;
      }
      console.log('BaseOrder:', baseOrder);
      return baseOrder;
    });

    console.log('Basket:', basket);

    const currentISTDateTime = new Date();

    try {
      console.log('now here:');
      // Update the database with the current IST date-time
      await axios
        .post(
          `${server.server.baseUrl}api/zerodha/model-portfolio/update-reco-with-zerodha-model-pf`,
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
          {
            stockDetails: stockDetails,
            leaving_datetime: currentISTDateTime,
            email: userEmail,
            trade_given_by: 'demoadvisor@alphaquark.in',
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
            user_broker: 'Zerodha', // Manually adding this field
          }));

          setLoading(false);
          AsyncStorage.setItem(
            'stockDetailsZerodhaOrder',
            JSON.stringify(filteredStockDetails),
          );
        })
        .catch(err => {
          console.log('error', err);
          setLoading(false);
        });

      // Generate HTML form content
      const htmlContent = generateHtmlForm(basket, apiKey);
      // Inject the HTML form into WebView
      setHtmlContent(htmlContent);
      setWebView(true);
      webViewRef.current.injectJavaScript(`
       document.open();
       document.write(\`${htmlContent}\`);
       document.close();
     `);
    } catch (error) {
      console.error('Failed to update trade recommendation:', error);
    }
  };

  const appURL = 'test';
  const generateHtmlForm = (basket, apiKey) => {
    return `<html>
       <body>
         <form id="zerodhaForm" method="POST" action="https://kite.zerodha.com/connect/basket">
           <input type="hidden" name="api_key" value="${apiKey}" />
           <input type="hidden" name="data" value='${JSON.stringify(basket)}' />
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
      console.log(
        'fetch items zero:',
        zerodhaStockDetails,
        zerodhaAdditionalPayload,
      );
      return {zerodhaStockDetails, zerodhaAdditionalPayload};
    } catch (error) {
      console.error('Error fetching data from AsyncStorage:', error);
      return {zerodhaStockDetails: null, zerodhaAdditionalPayload: null};
    }
  };

  const checkZerodhaStatus = async () => {
    const {zerodhaStockDetails, zerodhaAdditionalPayload} = await fetchData();
    console.log('Got it');
    const currentISTDateTime = new Date();
    const istDatetime = moment(currentISTDateTime).format();
    console.log(
      'Zerodha Stock CheckzerodhaStatus:',
      zerodhaStockDetails,
      'and ',
      zerodhaAdditionalPayload,
      'jwtToken:',
      jwtToken,
    );
    if (
      zerodhaStatus !== null &&
      zerodhaAdditionalPayload !== null &&
      zerodhaStockDetails !== null &&
      zerodhaRequestType === 'rebalance'
    ) {
      console.log(
        'Zerodha Stock CheckzerodhaStatus:',
        zerodhaStockDetails,
        'and ',
        zerodhaAdditionalPayload,
        'jwtToken:',
        jwtToken,
      );
      console.log('isDatetime:', istDatetime, 'Zerodha Api:', zerodhaApiKey);
      try {
        let data = JSON.stringify({
          apiKey: zerodhaApiKey,
          accessToken: jwtToken,
          user_email: userEmail,
          user_broker: zerodhaAdditionalPayload.broker,
          modelName: zerodhaAdditionalPayload.modelName,
          advisor: zerodhaAdditionalPayload.advisor,
          model_id: zerodhaAdditionalPayload.model_id,
          unique_id: zerodhaAdditionalPayload.unique_id,
          returnDateTime: istDatetime,
          trades: zerodhaStockDetails,
        });

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

          data: data,
        };
        // Use await instead of .then()
        console.log('Data that we send:', data);
        const response = await axios.request(config);
        console.log('Status Call here:2,', response.data.results);
        setOrderPlacementResponse(response.data.results);
        setOpenSucessModal(true);
        setOpenRebalanceModal(false);
        eventEmitter.emit('OrderPlacedReferesh');

        try {
          const config = {
            method: 'post',
            url: `${server.ccxtServer.baseUrl}zerodha/user-portfolio`,

            headers: {
              'Content-Type': 'application/json',
              'X-Advisor-Subdomain': configData?.config?.REACT_APP_HEADER_NAME,
              'aq-encrypted-key': generateToken(
                Config.REACT_APP_AQ_KEYS,
                Config.REACT_APP_AQ_SECRET,
              ),
            },

            data: JSON.stringify({user_email: userEmail}),
          };
          await axios.request(config);

          // Add user to status check queue for async order status polling (matching web frontend)
          const statusCheckData = {
            userEmail: userEmail,
            modelName: zerodhaAdditionalPayload.modelName,
            advisor: configData?.config?.REACT_APP_ADVISOR_SPECIFIC_TAG,
            broker: 'Zerodha',
          };
          await axios.post(
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
        } catch (error) {
          console.error(`Error updating portfolio for`, error);
        }
        AsyncStorage.removeItem('stockDetailsZerodhaOrder');
        AsyncStorage.removeItem('zerodhaAdditionalPayload');
        setflag(false);
      } catch (error) {
        console.log('Something went wrong');
      }
    }
  };

  useEffect(() => {
    const fetchAndProcessData = async () => {
      try {
        // Fetch data and wait until it resolves
        const {zerodhaStockDetails, zerodhaAdditionalPayload} =
          await fetchData();

        console.log(
          'ZerodhaOP:',
          zerodhaStatus,
          zerodhaRequestType,
          jwtToken,
          zerodhaAdditionalPayload,
          zerodhaStockDetails,
        );

        // Continue processing only after data is fetched
        if (
          zerodhaStatus !== null &&
          zerodhaAdditionalPayload !== null &&
          zerodhaStockDetails !== null &&
          zerodhaRequestType === 'rebalance' &&
          jwtToken !== undefined
        ) {
          console.log('Hereee:');
          checkZerodhaStatus(); // Only called after fetchData completes
        }
      } catch (error) {
        console.error('Error in fetchAndProcessData:', error);
      }
    };

    fetchAndProcessData(); // Trigger the async function
  }, [zerodhaStatus, zerodhaRequestType, userEmail, jwtToken]);

  console.log('Data array:', dataArray);
  const renderTableHeader = headers => (
    <View style={[styles.row, styles.header]}>
      {headers.map((header, index) => (
        <Text key={index} style={styles.headerText}>
          {header}
        </Text>
      ))}
    </View>
  );

  const [isLoading, setIsLoading] = useState(false);

  const handleClose = () => {
    setWebView(false);
  };

  const renderRow = (ele, isRebalance = false) => {
    console.log('Ele:', ele);
    const symbol = ele.symbol;
    const iniprice = 0;
    const exe = ele.exchange;
    return (
      <View key={ele.symbol} style={styles.row}>
        <Text style={styles.cellText}>{ele.symbol}</Text>

        <View style={{flex: 1}}>
          <MissedGainText
            advisedRangeCondition={0}
            symbol={symbol || ''}
            exchange={exe}
            advisedPrice={iniprice || 0}
            type={'aftersub'}
          />
        </View>

        <Text style={styles.cellText}>
          {isRebalance ? `${parseFloat(ele.value * 100).toFixed(2)}%` : ele.qty}
        </Text>
        <Text
          style={[
            styles.cellText,
            ele?.orderType?.toLowerCase() === 'buy'
              ? styles.buyText
              : ele?.orderType?.toLowerCase() === 'sell'
              ? styles.sellText
              : styles.defaultText,
          ]}>
          {ele?.orderType?.toUpperCase() || 'BUY'}
        </Text>
      </View>
    );
  };

  const [selectedYear, setSelectedYear] = useState(null);
  const [sipType, setSipType] = useState(null);
  const [startDate, setStartDate] = useState(null);

  const yearOptions = ['1Y', '3Y', '5Y', '10Y'];

  const CustomInput = forwardRef(({value, onClick}, ref) => (
    <View style={styles.inputContainer}>
      <TextInput
        value={value}
        onPressIn={onClick}
        ref={ref}
        placeholder="dd/mm/yy"
        editable={false}
        style={styles.input}
      />
      <CalendarIcon style={styles.calendarIcon} />
    </View>
  ));

  return (
    <Modal
      visible={visible}
      backdropOpacity={0.5}
      useNativeDriver
      hideModalContentWhileAnimating
      animationIn="slideInUp"
      animationOut="slideOutDown"
      swipeDirection={['down']}
      transparent
      animationType="fade">
      <View style={styles.modalContainer}>
        {isWebView ? (
          <View
            style={{
              flex: 1,
              height: 600,
              borderTopRightRadius: 10,
              borderTopLeftRadius: 10,
              backgroundColor: 'white',
              padding: 10,
            }}>
            <View style={{alignContent: 'flex-end', alignItems: 'flex-end'}}>
              <XIcon onPress={handleClose} size={16} color={'black'} />
            </View>
            <WebView
              ref={webViewRef}
              style={{
                flex: 1,
                borderTopRightRadius: 10,
                borderTopLeftRadius: 10,
              }}
              source={{html: htmlContentfinal}}
              onLoadStart={() => setIsLoading(true)}
              onLoadEnd={() => setIsLoading(false)}
              onNavigationStateChange={handleWebViewNavigationStateChange}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              onError={e => console.error('WebView error:', e.nativeEvent)}
            />
          </View>
        ) : (
          <View>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {confirmOrder
                    ? `Invest in ${fileName} `
                    : 'Review Trade Details of'}
                </Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={onCloseModal}>
                  <XIcon size={24} color="grey" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.container}>
                {confirmOrder ? (
                  <>
                    {dataArray?.length ? (
                      <View>
                        {renderTableHeader([
                          'Constituents',
                          'Current Price (₹)',
                          'Quantity',
                          'Order Type',
                        ])}
                        {dataArray.map(ele => renderRow(ele))}
                      </View>
                    ) : (
                      <View style={styles.errorContainer}>
                        <Text style={styles.errorTitle}>
                          Something Went Wrong
                        </Text>
                        <Text style={styles.errorSubtitle}>
                          We ran into an issue with your broker. Please try
                          again later.
                        </Text>
                      </View>
                    )}
                  </>
                ) : (
                  <View>
                    {renderTableHeader([
                      'Constituents',
                      'Current Price(₹)',
                      'Weights(%)',
                      'Order Type',
                    ])}
                    {latestRebalance?.adviceEntries.map(ele =>
                      renderRow(ele, true),
                    )}
                  </View>
                )}
              </ScrollView>
            </View>

            <View style={styles.footer}>
              {!confirmOrder && (
                <View style={{marginLeft: 15}}>
                  <Text style={styles.footerText1}>₹ {totalAmount}</Text>
                  <Text style={styles.footerText}>Total Amount Required</Text>
                </View>
              )}

              {confirmOrder ? (
                // Show the SliderButton when 'confirmOrder' is true
                <GestureHandlerRootView style={{flex: 1}}>
                  <View
                    style={{
                      paddingHorizontal: 10,
                      backgroundColor: '#fff',
                    }}>
                    <SliderButton
                      loading={loading}
                      text={`Slide to Place Order || ₹ ${
                        totalAmount || '0.00'
                      }`}
                      onSlideComplete={onSlideComplete}
                      disabled={calculatedPortfolioData}
                    />
                  </View>
                </GestureHandlerRootView>
              ) : (
                // Show the TouchableOpacity button for other cases
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={calculateRebalance}
                  disabled={loading || calculatedLoading}>
                  {loading || calculatedLoading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.buttonText}>Confirm Details</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </View>
      <BrokerSelectionModal
        showBrokerModal={BrokerModel}
        setShowBrokerModal={setBrokerModel}
        handleBrokerConnect={handleBrokerConnect}
        fetchBrokerStatusModal={fetchBrokerStatusModal}
        showIIFLModal={showIIFLModal}
        setShowIIFLModal={setShowIIFLModal}
        showICICIUPModal={showICICIUPModal}
        setShowICICIUPModal={setShowICICIUPModal}
        showupstoxModal={showupstoxModal}
        setShowupstoxModal={setShowupstoxModal}
        showangleoneModal={showangleoneModal}
        setShowangleoneModal={setShowangleoneModal}
        showzerodhamodal={showzerodhamodal}
        setShowzerodhaModal={setShowzerodhaModal}
        showhdfcModal={showhdfcModal}
        setShowhdfcModal={setShowhdfcModal}
        showDhanModal={showDhanModal}
        setShowDhanModal={setShowDhanModal}
        showKotakModal={showKotakModal}
        setShowKotakModal={setShowKotakModal}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    position: 'relative',
    width: '100%',
  },
  input: {
    width: '100%',
    height: 48,
    paddingHorizontal: 12,
    paddingRight: 40,
    borderColor: '#D1D5DB',
    borderWidth: 1,
    borderRadius: 8,
    fontSize: 14,
  },
  calendarIcon: {
    position: 'absolute',
    right: 10,
    top: '50%',
    transform: [{translateY: -12}],
    color: '#9CA3AF',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: screenHeight / 2.1,
    padding: 15,
  },
  closeButton: {
    position: 'absolute',
    right: 16,
  },
  modalHeader: {
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Satoshi-Bold',
    marginLeft: 5,
    color: 'black',
  },
  scrollContainer: {
    maxHeight: 400,
    alignContent: 'center',

    alignSelf: 'center',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: '#D1D5DB',
  },
  tableHeaderText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '500',
    color: '#4B5563',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: '#D1D5DB',
  },
  tableRowText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    color: '#4B5563',
  },
  errorContainer: {
    paddingTop: 50,
    alignContent: 'center',
    alignSelf: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    fontFamily: 'Satoshi-Bold',
    color: 'black',
    textAlign: 'center',
  },
  subErrorText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontFamily: 'Satoshi-Bold',
    textAlign: 'center',
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#e4e4e4',
    flexDirection: 'row',
    backgroundColor: 'white',

    alignItems: 'center',
    paddingVertical: 16,
  },
  footerText: {
    fontSize: 12,
    fontFamily: 'Satoshi-Bold',
    color: 'grey',
  },
  footerText1: {
    fontSize: 14,
    fontFamily: 'Satoshi-Bold',
    color: 'black',
  },
  actionButton: {
    backgroundColor: 'black',
    paddingVertical: 10,
    flex: 1,
    marginHorizontal: 40,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Satoshi-Bold',
    marginBottom: 2,
    textAlign: 'center',
  },
  header: {
    backgroundColor: '#f5f5f5',
    borderTopWidth: 1,
    borderBottomWidth: 1,

    borderColor: '#00000010',
    zIndex: 20,
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#00000010',
    paddingVertical: 10,
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
    fontSize: 12,

    fontFamily: 'Satoshi-Bold',
    color: '#000',
    textAlign: 'center',
  },
  cellText: {
    flex: 1,
    fontSize: 14,
    color: '#000',
    fontFamily: 'Satoshi-Regular',
    textAlign: 'center',
  },
  buyText: {
    fontFamily: 'Satoshi-Bold',
    color: '#338D72',
    fontSize: 14,
  },
  sellText: {
    fontFamily: 'Satoshi-Regular',
    color: '#E43D3D',
  },
  defaultText: {
    fontFamily: 'Satoshi-Regular',
    color: '#16A085',
  },
});
export default UserStrategySubscribeModal;
