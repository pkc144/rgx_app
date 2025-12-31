import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Animated,
  PanResponder,
  Dimensions,
  Modal,
  TouchableWithoutFeedback,
  LayoutAnimation,
  SafeAreaView,
} from 'react-native';
import axios from 'axios';
import server from '../../utils/serverConfig';
import { useCart } from '../CartContext';
import LottieView from 'lottie-react-native';
import RecommendationSuccessModal from '../ModelPortfolioComponents/RecommendationSuccessModal';
import IgnoreAdviceModal from '../IgnoreAdviceModal';
import StockAdviceContent from '../AdviceScreenComponents/StockAdviceContent';
import useSymbolSubscription from './DynamicText/useSymbolSubscription';
import Toast from 'react-native-toast-message';
import { getAuth } from '@react-native-firebase/auth';
import { createPlaceOrderFunction } from '../../FunctionCall/createPlaceOrderFunction';
import ZerodhaReviewModal from '../ReviewZerodhaTradeModal';
import CryptoJS from 'react-native-crypto-js';
import IIFLReviewTradeModal from '../IIFLReviewTradeModal';
import WebSocketManager from './DynamicText/WebSocketManager';
import { getLastKnownPrice } from './DynamicText/websocketPrice';

import moment from 'moment';
import AsyncStorage from '@react-native-async-storage/async-storage';

import ReviewTradeModal from '../ReviewTradeModal';
import { useModal } from '../../components/ModalContext';
import eventEmitter from '../EventEmitter';
import BrokerSelectionModal from '../BrokerSelectionModal';

import { OtherBrokerModel } from '../DdpiModal';
import { useTrade } from '../../screens/TradeContext';

import { ActivateNowModel } from '../DdpiModal';
import DdpiModal from '../DdpiModal';
import { DhanTpinModal } from '../DdpiModal';
import { AngleOneTpinModal } from '../DdpiModal';
import { FyersTpinModal } from '../DdpiModal';
import ICICIUPModal from '../BrokerConnectionModal/icicimodal';
import UpstoxModal from '../BrokerConnectionModal/upstoxModal';
import AngleOneBookingModal from '../BrokerConnectionModal/AngleoneBookingModal';
import ZerodhaConnectModal from '../BrokerConnectionModal/ZerodhaConnectModal';
import HDFCconnectModal from '../BrokerConnectionModal/HDFCconnectModal';
import DhanConnectModal from '../BrokerConnectionModal/DhanConnectModal';
import KotakModal from '../BrokerConnectionModal/KotakModal';
import IIFLModal from '../iiflmodal';
import Config from 'react-native-config';
import AliceBlueConnect from '../BrokerConnectionModal/AliceBlueConnect';
import FyersConnect from '../BrokerConnectionModal/FyersConnect';
import notifee, { EventType } from '@notifee/react-native';

import { generateToken } from '../../utils/SecurityTokenManager';
import MotilalModal from '../BrokerConnectionModal/MotilalModal';
import { getAdvisorSubdomain } from '../utils/variantHelper';

const { height: screenHeight } = Dimensions.get('window');
const StockAdvices = React.memo(({ userEmail, orderscreen, type }) => {
  const {
    stockRecoNotExecutedfinal,
    planList,
    recommendationStockfinal,
    isDatafetching,
    getAllTrades,
    rejectedTrades,
    ignoredTrades,
    userDetails,
    broker,
    brokerStatus,
    getUserDeatils,
    funds,
    getAllFunds,
    configData,
  } = useTrade();
  const [stockRecoNotExecuted, setStockRecoNotExecuted] = useState([]);
  const [recommendationStock, setrecommendationStock] = useState([]);
  const { showAddToCartModal } = useModal();
  const { setCartCount } = useCart();
  const [isToggleOn, setIsToggleOn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isModalVisibleignore, setModalVisible] = useState(false);
  const [stockIgnoreId, setStockIgnoreId] = useState(null);

  const [brokerModel, setBrokerModel] = useState(null);

  const [basketId, setbasketId] = useState(null);
  const [basketName, setbasketName] = useState(null);

  const [OpenRebalanceModal, setOpenRebalanceModal] = useState(false);
  const [showIIFLModal, setShowIIFLModal] = useState(false);
  const [showICICIUPModal, setShowICICIUPModal] = useState(false);
  const [showupstoxModal, setShowupstoxModal] = useState(false);
  const [showangleoneModal, setShowangleoneModal] = useState(false);
  const [showzerodhamodal, setShowzerodhaModal] = useState(false);
  const [showhdfcModal, setShowhdfcModal] = useState(false);
  const [showDhanModal, setShowDhanModal] = useState(false);
  const [showKotakModal, setShowKotakModal] = useState(false);

  const animationRef = useRef(null);
  const [openReviewTrade, setOpenReviewTrade] = useState(false);
  const [openZerodhaReviewModal, setOpenZerodhaModel] = useState(false);
  const [openIIFLReviewModal, setOpenIIFLReviewModel] = useState(false); // Ensure initial value is false
  const auth = getAuth(); // Get the Firebase auth instance
  const user = auth.currentUser; // Get the currently signed-in user
  const [stockDetails, setStockDetails] = useState([]);

  const [OpenBasketReview, setOpenBasketReview] = useState(false);

  const [isBasket, setisBasket] = useState(false);
  const [basketData, setBasketData] = useState([]);
  const [fullbasketData, fullsetBasketData] = useState([]);
  const angelOneApiKey = configData?.config?.REACT_APP_ANGEL_ONE_API_KEY;
  const [showDdpiModal, setShowDdpiModal] = useState(false);
  const [showActivateNowModel, setActivateNowModel] = useState(false);
  const [showAngleOneTpinModel, setShowAngleOneTpinModel] = useState(false);
  const [showFyersTpinModal, setShowFyersTpinModal] = useState(false);
  const [showDhanTpinModel, setShowDhanTpinModel] = useState(false);
  const [showOtherBrokerModel, setShowOtherBrokerModel] = useState(false);
  const [showActivateTopModel, setActivateTopModel] = useState(false);

  const [singleStockTypeAndSymbol, setSingleStockTypeAndSymbol] =
    useState(null);
  const [edisStatus, setEdisStatus] = useState(null);
  const [dhanEdisStatus, setDhanEdisStatus] = useState(null);
  const [zerodhaDdpiStatus, setZerodhaDdpiStatus] = useState(null);
  const [types, setTypes] = useState([]);

  const handleActivateDDPI = () => {
    setActivateNowModel(false);
  };

  const verifyEdis = async () => {
    try {
      const response = await axios.post(
        `${server.ccxtServer.baseUrl}angelone/verify-edis`,
        {
          apiKey: angelOneApiKey,
          jwtToken: userDetails.jwtToken,
          userEmail: userDetails?.email,
        },
      );
      setEdisStatus(response.data);
      console.log('AngleOne response', response.data);
    } catch (error) {
      //  console.error("Error verifying eDIS status:", error);
    }
  };

  const verifyDhanEdis = async () => {
    try {
      const response = await axios.post(
        `${server.ccxtServer.baseUrl}dhan/edis-status`,
        {
          clientId: clientCode,
          accessToken: userDetails.jwtToken,
        },
      );
      console.log('Dhan Reponse', response.data);
      setDhanEdisStatus(response.data);
    } catch (error) {
      //  console.error("Error verifying eDIS status:", error);
    }
  };

  const [storedTradeType, setStoredTradeType] = useState({
    allSell: false,
    allBuy: false,
    isMixed: false,
  });

  const updateTradeType = newTradeType => {
    setTradeType(newTradeType);
    setStoredTradeType(newTradeType);
    AsyncStorage.setItem('storedTradeType', JSON.stringify(newTradeType));
  };

  const [tradeType, setTradeType] = useState({
    allSell: false,
    allBuy: false,
    isMixed: false,
  });

  const [tradeClickCount, setTradeClickCount] = useState(0);

  const today = new Date();
  const todayDate = moment(today).format('YYYY-MM-DD HH:mm:ss');

  const dateString = userDetails?.token_expire;

  const clientCode = userDetails && userDetails?.clientCode;
  const apiKey = userDetails && userDetails?.apiKey;
  const jwtToken = userDetails && userDetails?.jwtToken;
  const my2pin = userDetails && userDetails?.my2Pin;
  const secretKey = userDetails && userDetails?.secretKey;
  const viewToken = userDetails && userDetails?.viewToken;
  const sid = userDetails && userDetails?.sid;
  const serverId = userDetails && userDetails?.serverId;
  const mobileNumber = userDetails && userDetails?.phone_number;
  const panNumber = userDetails && userDetails?.panNumber;
  const userId = userDetails && userDetails?._id;
  const [stockloading, setstockloading] = useState(false);
  const [OpenTokenExpireModel, setOpenTokenExpireModel] = useState(false);

  const [authToken, setAuthToken] = useState(null);
  // const zerodha Login
  const [zerodhaRequestToken, setZerodhaRequestToken] = useState(null);
  const [zerodhaRequestType, setZerodhaRequestType] = useState(null);
  const [zerodhaStatus, setZerodhaStatus] = useState(null);

  const [showFyersModal, setShowFyersModal] = useState(false);

  const [showMotilalModal, setShowMotilalModal] = useState(false);

  const [showAliceblueModal, setShowAliceblueModal] = useState(false);

  const zerodhaApiKey = configData?.config?.REACT_APP_ZERODHA_API_KEY;

  const checkValidApiAnSecret = data => {
    const bytesKey = CryptoJS.AES.decrypt(data, 'ApiKeySecret');
    const Key = bytesKey.toString(CryptoJS.enc.Utf8);
    if (Key) {
      return Key;
    }
  };

  // zerodha start
  const [zerodhaAccessToken, setZerodhaAccessToken] = useState(null);
  const hasConnectedZerodha = useRef(false);
  const connectZerodha = () => {
    if (zerodhaRequestToken !== null && !hasConnectedZerodha.current) {
      let data = JSON.stringify({
        apiKey: checkValidApiAnSecret(apiKey),
        apiSecret: checkValidApiAnSecret(secretKey),
        requestToken: zerodhaRequestToken,
      });

      let config = {
        method: 'post',
        url: `${server.ccxtServer.baseUrl}zerodha/gen-access-token`,

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
      axios
        .request(config)
        .then(response => {
          if (response.data) {
            const session_token = response.data.access_token;
            setZerodhaAccessToken(session_token);
          }
        })
        .catch(error => {
          console.error(error);
          Toast.show({
            type: 'error',
            text1: 'Failed',
            text2: 'Something went wrong.',
            visibilityTime: 5000,
            position: 'bottom',
            bottomOffset: 40,
            style: {
              backgroundColor: 'white',
              borderLeftColor: 'green',
              borderLeftWidth: 5,
              padding: 10,
            },
            textStyle: {
              color: 'green',
              fontWeight: 'bold',
              fontSize: 16,
            },
          });
        });
      hasConnectedZerodha.current = true;
    }
  };

  const isToastShown = useRef(false);
  const [sessionToken, setSessionToken] = useState(null);
  const [upstoxSessionToken, setUpstoxSessionToken] = useState(null);
  const connectBrokerDbUpadte = () => {
    if (
      sessionToken ||
      upstoxSessionToken ||
      authToken ||
      (zerodhaAccessToken && zerodhaRequestType === 'login')
    ) {
      if (!isToastShown.current) {
        isToastShown.current = true; // Prevent further execution
        let brokerData = {
          uid: userId,
          user_broker: sessionToken
            ? 'ICICI Direct'
            : upstoxSessionToken
              ? 'Upstox'
              : authToken
                ? 'Angel One'
                : 'Zerodha',
          jwtToken:
            sessionToken ||
            upstoxSessionToken ||
            zerodhaAccessToken ||
            authToken,
        };

        if (authToken) {
          brokerData = {
            ...brokerData,
            apiKey: 'EfkDdJMH',
          };
        }

        let config = {
          method: 'put',
          url: `${server.server.baseUrl}api/user/connect-broker`,

          headers: {
            'Content-Type': 'application/json',
            'X-Advisor-Subdomain': configData?.config?.REACT_APP_HEADER_NAME,
            'aq-encrypted-key': generateToken(
              Config.REACT_APP_AQ_KEYS,
              Config.REACT_APP_AQ_SECRET,
            ),
          },

          data: JSON.stringify(brokerData),
        };

        axios
          .request(config)
          .then(response => {
            setLoading(false);
            setIciciSuccessMsg(true);
            setOpenTokenExpireModel(false);
            setBrokerModel(false);
            Toast.show({
              type: 'success',
              text1: 'Success',
              text2: 'You have successfully ignored your trade.',
              visibilityTime: 5000,
              position: 'bottom',
              bottomOffset: 40,
              style: {
                backgroundColor: 'white',
                borderLeftColor: 'green',
                borderLeftWidth: 5,
                padding: 10,
              },
              textStyle: {
                color: 'green',
                fontWeight: 'bold',
                fontSize: 16,
              },
            });
          })
          .catch(error => {
            setLoading(false);
            Toast.show({
              type: 'error',
              text1: 'Failed',
              text2: 'Incorrect Credentials.',
              visibilityTime: 5000,
              position: 'bottom',
              bottomOffset: 40,
              style: {
                backgroundColor: 'white',
                borderLeftColor: 'green',
                borderLeftWidth: 5,
                padding: 10,
              },
              textStyle: {
                color: 'green',
                fontWeight: 'bold',
                fontSize: 16,
              },
            });
          });
      }
    }
  };

  const [orderPlacementResponse, setOrderPlacementResponse] = useState();
  const [openSuccessModal, setOpenSucessModal] = useState(false);
  const BROKER_ENDPOINTS = {
    'IIFL Securities': 'iifl',
    Kotak: 'kotak',
    Upstox: 'upstox',
    'ICICI Direct': 'icici',
    'Angel One': 'angelone',
    Zerodha: 'zerodha',
    Fyers: 'fyers',
    AliceBlue: 'aliceblue',
    Dhan: 'dhan',
    Groww: 'groww',
    'Motilal Oswal': 'motilal-oswal',
  };

  const updatePortfolioData = async (brokerName, userEmail) => {
    try {
      const endpoint = BROKER_ENDPOINTS[brokerName];
      if (!endpoint) {
        console.error(`Unsupported broker: ${brokerName}`);
        return;
      }

      const config = {
        method: 'post',
        url: `${server.ccxtServer.baseUrl}${endpoint}/user-portfolio`,
        headers: {
          'Content-Type': 'application/json',
          'X-Advisor-Subdomain': configData?.config?.REACT_APP_HEADER_NAME,
          'aq-encrypted-key': generateToken(
            Config.REACT_APP_AQ_KEYS,
            Config.REACT_APP_AQ_SECRET,
          ),
        },
        data: JSON.stringify({ user_email: userEmail }),
      };

      console.log(
        'config i get here----------------------------------------------',
        config,
      );

      const response = await axios.request(config);

      if (response?.status === 200) {
        console.log('✅ Portfolio updated successfully');
      } else {
        console.log(
          '⚠️ Portfolio update failed with status:',
          response?.status,
        );
      }

      return response;
    } catch (error) {
      console.error(`Error updating portfolio for ${brokerName}:`, error);
    }
  };

  const getRejectedCount = async () => {
    const rejectedKey = `rejectedCount${broker?.replace(/ /g, '')}`;

    let rejectedCountFromStorage = await AsyncStorage.getItem(rejectedKey);

    if (
      !rejectedCountFromStorage ||
      isNaN(parseInt(rejectedCountFromStorage, 10))
    ) {
      await AsyncStorage.setItem(rejectedKey, '0');
      rejectedCountFromStorage = '0';
    }

    console.log(
      'Value of rejectedKey in AsyncStorage:',
      rejectedCountFromStorage,
    );

    const currentRejectedCount = parseInt(rejectedCountFromStorage, 10);
    console.log('Parsed currentRejectedCount:', currentRejectedCount);

    return currentRejectedCount;
  };
  // getRejectedCount();
  const [isReturningFromOtherBrokerModal, setIsReturningFromOtherBrokerModal] =
    useState(false);

  const [failedSellAttempts, setFailedSellAttempts] = useState(0);
  const getAllTradesUpdate = async () => { };

  const placeOrder = async stockDetails => {
    setLoading(true);
    //console.log('consolehereeeeee;:',funds);
    if (funds.status === false || funds.status === 1) {
      setOpenTokenExpireModel(true);
      setOpenReviewTrade(false);
      setLoading(false);
      return;
    }
    const getOrderPayload = () => {
      let basePayload = {
        trades: stockDetails,
        user_broker: broker, // Common fields
      };

      // Add basket info if available
      if (allFNO && basketId && basketName) {
        basePayload.basketId = basketId;
        basePayload.basketName = basketName;
      }

      switch (broker) {
        case 'IIFL Securities':
          return {
            ...basePayload,
            clientCode,
          };
        case 'ICICI Direct':
          return {
            ...basePayload,
            apiKey,
            secretKey,
            jwtToken,
          };
        case 'Upstox':
          return {
            ...basePayload,
            apiKey,
            jwtToken,
            secretKey,
          };
        case 'Kotak':
          return {
            ...basePayload,
            apiKey,
            secretKey,
            jwtToken,
            viewToken,
            sid,
            serverId,
          };
        case 'Hdfc Securities':
          return {
            ...basePayload,
            apiKey,
            jwtToken,
          };
        case 'Groww':
          return { ...basePayload, jwtToken };
        case 'Dhan':
          return {
            ...basePayload,
            clientCode,
            jwtToken,
          };
        case 'AliceBlue':
          return {
            ...basePayload,
            clientCode,
            jwtToken,
            apiKey,
          };
        case 'Fyers':
          return {
            ...basePayload,
            clientCode,
            jwtToken,
          };

        case 'Angel One':
          return {
            ...basePayload,
            apiKey: angelOneApiKey,
            secretKey,
            jwtToken,
          };
        case 'Motilal Oswal':
          return {
            ...basePayload,
            apiKey: apiKey,
            clientCode: clientCode,
            jwtToken: jwtToken,
          };
        case 'Zerodha':
          return { ...basePayload, apiKey, secretKey, jwtToken };
        default:
          return {
            ...basePayload,
            apiKey,
            jwtToken,
          };
      }
    };
    const allBuy = stockDetails.every(stock => stock.transactionType === 'BUY');
    const allSell = stockDetails.every(
      stock => stock.transactionType === 'SELL',
    );
    const isMixed = !allBuy && !allSell;
    const specialBrokers = [
      'IIFL Securities',
      'ICICI Direct',
      'Upstox',
      'Kotak',
      'Hdfc Securities',
      'AliceBlue',
      "Motilal Oswal",
      "Groww",
    ];
    console.log('all buy or sell--', allBuy, allSell);
    function checkAndResetRejectedCount() {
      const resetTime = AsyncStorage.getItem('rejectedOrdersResetTime');
      const currentTime = new Date().getTime();

      // If there's no resetTime or it's past the reset time, reset the count

      if (!resetTime || currentTime >= parseInt(resetTime)) {
        console.log('Resetting all broker rejected counts');
        [
          'Dhan',
          'IIFL Securities',
          'ICICI Direct',
          'Upstox',
          'Kotak',
          'Hdfc Securities',
          'AliceBlue',
          'Fyers',
          'Angel One',
        ].forEach(broker => {
          AsyncStorage.setItem(
            `rejectedCount${broker?.replace(/ /g, '')}`,
            '0',
          );
        });

        // Set the next reset time to 12:00 AM of the next day
        const nextResetTime = new Date();
        nextResetTime.setDate(nextResetTime.getDate() + 1); // Move to the next day
        nextResetTime.setHours(0, 0, 0, 0); // Set to midnight (12:00 AM)
        AsyncStorage.setItem(
          'rejectedOrdersResetTime',
          nextResetTime.getTime().toString(),
        );
        console.log('Next reset time set to:', nextResetTime.toLocaleString());
      }
    }

    // Call the function at the start
    checkAndResetRejectedCount();

    // Retrieve the rejected count from localStorage
    // const rejectedSellCount = parseInt(localStorage.getItem("rejectedOrdersCount") || "0");

    const rejectedKey = `rejectedCount${broker?.replace(/ /g, '')}`;
    const rejectedSellCount = parseInt(
      (await AsyncStorage.getItem(rejectedKey)) || '0',
    );
    const allFNO = stockDetails.every(
      item => item.exchange === 'NFO' || item.exchange === 'BFO',
    );

    if (!allFNO) {
      if (!isReturningFromOtherBrokerModal && specialBrokers.includes(broker)) {
        if (allBuy) {
          console.log('All trades are BUY for broker:', broker);
          // Proceed with order placement for BUY
        } else if ((allSell || isMixed) && rejectedSellCount === 1) {
          console.log(
            allSell ? 'All trades are SELL' : 'Trades are Mixed',
            'for broker:',
            broker,
          );
          setShowOtherBrokerModel(true);
          console.log('Show log:', showOtherBrokerModel);
          setOpenReviewTrade(false);
          setLoading(false);
          return; // Exit the function early
        }
      }
    }

    try {
      const response = await axios.request({
        method: 'post',
        url: `${server.server.baseUrl}api/process-trades/order-place`,
        headers: {
          'Content-Type': 'application/json',
          'X-Advisor-Subdomain': configData?.config?.REACT_APP_HEADER_NAME,
          'aq-encrypted-key': generateToken(
            Config.REACT_APP_AQ_KEYS,
            Config.REACT_APP_AQ_SECRET,
          ),
        },
        data: JSON.stringify(getOrderPayload()),
      });

      setLoading(false);
      console.log('the pay load we are sending ::::', getOrderPayload());
      // setOpenSucessModal(true);
      console.log('respoiiinsi:', response.data.response);
      setOrderPlacementResponse(response.data.response);

      console.log('stock details here ', stockDetails, allFNO);
      if (allFNO) {
        console.log('All items are FNO. Skipping re-sell logic.');
        setOpenSucessModal(true);
        setOpenReviewTrade(false);
        setBasketData([]);
        //  console.log('basket data now--',basketData);
        await Promise.all([
          updatePortfolioData(broker, userEmail),
          getAllTrades(),
          filterCartAfterOrder(),
          getCartAllStocks(),
        ]);

        eventEmitter.emit('OrderPlacedReferesh');
        eventEmitter.emit('cartUpdated');

        return;
      }

      const rejectedSellCount = response.data.response.reduce(
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

      const successCount = response.data.response.reduce((count, order) => {
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
          (order.transactionType === 'SELL' || tradeType.isMixed)
          ? count + 1
          : count;
      }, 0);

      const successKey = `successCount${broker?.replace(/ /g, '')}`;

      const currentRejectedCount = await getRejectedCount();
      console.log('New Log data:', currentRejectedCount);
      const newRejectedCount = currentRejectedCount + rejectedSellCount;
      AsyncStorage.setItem(rejectedKey, newRejectedCount.toString());

      // UPDATED: Save success count only if rejected count is 1 and there are successful SELL or mixed trades
      if (
        newRejectedCount === 1 &&
        successCount > 0 &&
        (tradeType.allSell || tradeType.isMixed)
      ) {
        const currentSuccessCount = parseInt(
          (await AsyncStorage.getItem(successKey)) || '0',
        );
        const newSuccessCount = currentSuccessCount + successCount;
        await AsyncStorage.setItem(successKey, newSuccessCount.toString());
      }
      console.log(`${broker} Rejected Sell Count:`, newRejectedCount);
      if (newRejectedCount !== 1) {
        console.log('Setting openSuccessModal to true');
        setOpenSucessModal(true);
      } else {
        console.log('Setting AfterPlaceOrderDdpiModal to true');

        if (
          !isReturningFromOtherBrokerModal &&
          specialBrokers.includes(broker)
        ) {
          if (allBuy) {
            console.log('All trades are BUY for broker:', broker);
            // Proceed with order placement for BUY
          } else if ((allSell || isMixed) && rejectedSellCount === 1) {
            console.log(
              allSell ? 'All trades are SELL' : 'Trades are Mixed',
              'for broker:',
              broker,
            );
            setShowOtherBrokerModel(true);
            setOpenReviewTrade(false);
            setLoading(false);
            return; // Exit the function early
          }
        }
        if (
          broker === 'Angel One' &&
          edisStatus &&
          edisStatus.edis === false &&
          (allSell || isMixed) &&
          newRejectedCount === 1
        ) {
          console.log('Setting AfterPlaceOrderDdpiModal to true for', broker);
          setOpenSucessModal(false);
          setShowAngleOneTpinModel(true);
          setOpenReviewTrade(false);
          return;
        } else if (
          broker === 'Dhan' &&
          dhanEdisStatus &&
          dhanEdisStatus?.data?.[0]?.edis === false &&
          (allSell || isMixed) &&
          newRejectedCount === 1
        ) {
          console.log('Setting AfterPlaceOrderDdpiModal to true for', broker);
          setShowDhanTpinModel(true);
          setOpenSucessModal(false);
          setOpenReviewTrade(false);
          return;
        } else {
          console.log('Setting openSuccessModal to true');
        }
        setOrderPlacementResponse(response.data.response);
        setOpenSucessModal(true);
      }
      setOpenReviewTrade(false);
      await Promise.all([
        updatePortfolioData(broker, userEmail),
        getAllTrades(),
        // await clearCart(),
        //  handleCartUpdate(),
        await filterCartAfterOrder(),
        //setStockDetails([]),
        // setCartItems([]),
        setBasketData([]),
        eventEmitter.emit('OrderPlacedReferesh'),
        eventEmitter.emit('cartUpdated'),
        getCartAllStocks(),
      ]);

      //capture fail attempts

      //  if (tradeType.allSell || tradeType.isMixed ) {
      //   setFailedSellAttempts((prev) => {
      //     const newValue = prev + 1;
      //     console.log(`Incrementing failedSellAttempts. New value: ${newValue}`);
      //     return newValue;
      //   });
      // }
    } catch (error) {
      console.error('Error placing order:', error);
      setLoading(false);
      const edisMessage =
        error.response?.data?.details?.[0]?.message_aq ||
        error.response?.data?.details?.[0]?.message ||
        "There was an issue in placing the trade, please try again later.";

      Toast.show({
        type: 'error',
        text1: 'Failed',
        text2: edisMessage, // show exact broker error like "Edis is not validated"
        visibilityTime: 5000,
        position: 'top',
        bottomOffset: 40,
        style: {
          backgroundColor: 'white',
          borderLeftColor: 'green',
          borderLeftWidth: 5,
          padding: 10,
        },
        textStyle: {
          color: 'green',
          fontWeight: 'bold',
          fontSize: 16,
        },
      });
    }
    setIsReturningFromOtherBrokerModal(false);
  };

  const processOrderCounts = async response => {
    // Function to cleanly check order status for "rejected" or "cancelled"
    const isRejectedOrder = orderStatus => {
      return ['Rejected', 'Cancelled', 'rejected', 'cancelled'].includes(
        orderStatus?.toLowerCase(),
      );
    };

    const isSuccessfulOrder = orderStatus => {
      return [
        'complete',
        'placed',
        'executed',
        'ordered',
        'open',
        'traded',
        'transit',
      ].includes(orderStatus?.toLowerCase());
    };

    // Count rejected and successful SELL orders
    let rejectedSellCount = 0;
    let successCount = 0;

    response?.data?.response?.forEach(order => {
      const orderStatus = order?.orderStatus || '';
      const transactionType = order?.transactionType || '';

      if (isRejectedOrder(orderStatus) && transactionType === 'SELL') {
        rejectedSellCount++;
      }

      if (isSuccessfulOrder(orderStatus) && transactionType === 'SELL') {
        successCount++;
      }
    });

    return { rejectedSellCount, successCount };
  };

  const appURL = configData?.config?.REACT_APP_HEADER_NAME;
  // zerodha start
  const [webViewVisible, setWebViewVisible] = useState(false); // Track success status
  const [mbasket, setmbasket] = useState(null);
  const webViewRef = useRef(null);
  const [htmlContentfinal, setHtmlContent] = useState('');
  const handleZerodhaRedirect = async () => {
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
        zerodhaTradeId: stock.zerodhaTradeId,
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
      // Update the database with the current IST date-time
      await axios.put(`${server.server.baseUrl}api/zerodha/update-trade-reco`, {
        stockDetails: stockDetails,
        leaving_datetime: currentISTDateTime,
      });

      // Generate HTML form content
      const htmlContent = generateHtmlForm(basket, apiKey);
      setHtmlContent(htmlContent);
      // Inject the HTML form into WebView
    } catch (error) {
      console.error('Failed to update trade recommendation:', error);
    }
  };

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

  const checkZerodhaStatus = async () => {
    const currentISTDateTime = new Date();
    const istDatetime = moment(currentISTDateTime).format();

    if (zerodhaStatus !== null && zerodhaRequestType === 'basket') {
      const data = JSON.stringify({
        apiKey: zerodhaApiKey,
        jwtToken: jwtToken,
        userEmail: userEmail,
        returnDateTime: istDatetime,
        trades: zerodhaStockDetails,
      });

      const config = {
        method: 'post',
        url: `${server.server.baseUrl}api/zerodha/order-place`,

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

      try {
        const response = await axios.request(config);
        // console.log('Status Call here:1,',response.data.response);
        setOrderPlacementResponse(response.data.response);
        setOpenSucessModal(true);
        setOpenReviewTrade(false);
        getAllTrades();
        updatePortfolioData();

        // Await AsyncStorage removal for confirmation
        await AsyncStorage.removeItem('stockDetailsZerodhaOrder');
      } catch (error) {
        console.error('Order placement failed:', error);
        showToast('Orders cannot be placed.', 'error', '');
      }
    }
  };

  const fetchBrokerStatusModal = async () => {
    getAllFunds();
    getUserDeatils();
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
        setcreateDate(userData.created_at);
        //setIsBrokerConnected(!!userData?.user_broker);
        // console.log('corrected');
      } catch (error) {
        //   console.error('Error fetching broker status:', error.response?.data || error.message);
        // setIsBrokerConnected(false); // Handle error by setting default status
      } finally {
        setLoading(false);
      }
    }
  };

  const handleIgnoredTrades = (id, ignoreText) => {
    setLoading(true);
    let data = JSON.stringify({
      uid: id,
      trade_place_status: 'ignored',
      reason: ignoreText,
    });
    let config = {
      method: 'put',
      url: `${server.server.baseUrl}api/recommendation`,

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
    axios
      .request(config)
      .then(response => {
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'You have successfully ignored your trade.',
          visibilityTime: 5000,
          position: 'bottom',
          bottomOffset: 40,
          style: {
            backgroundColor: 'white',
            borderLeftColor: 'green',
            borderLeftWidth: 5,
            padding: 10,
          },
          textStyle: {
            color: 'green',
            fontWeight: 'bold',
            fontSize: 16,
          },
        });
        //  console.log("After Toast");
        setLoading(false);
        setModalVisible(false);
        getAllTrades();
      })
      .catch(error => {
        console.error(`Error ignoring the trade:`, error.response.data);
        setLoading(false);
      });
  };

  const handleQuantityInputChange = (symbol, value, tradeId) => {
    if (!value || value === '') {
      const newData = stockRecoNotExecuted.map(stock =>
        stock.Symbol === symbol && stock.tradeId === tradeId
          ? { ...stock, Quantity: '' }
          : stock,
      );
      setStockRecoNotExecuted(newData);
      setrecommendationStock(newData);
    } else {
      const newData = stockRecoNotExecuted.map(stock =>
        stock.Symbol === symbol && stock.tradeId === tradeId
          ? { ...stock, Quantity: parseInt(value) }
          : stock,
      );
      setStockRecoNotExecuted(newData);
      setrecommendationStock(newData);
    }
  };

  const handleLimitOrderInputChange = (symbol, value, tradeId) => {
    if (!value || value === '') {
      const newData = stockRecoNotExecuted.map(stock =>
        stock.Symbol === symbol && stock.tradeId === tradeId
          ? { ...stock, Price: '' }
          : stock,
      );
      // console.log('newdata:',newData);
      setStockRecoNotExecuted(newData);
      setrecommendationStock(newData);
    } else {
      // console.log('OP:',value);
      const newData = stockRecoNotExecuted.map(stock =>
        stock.Symbol === symbol && stock.tradeId === tradeId
          ? { ...stock, Price: parseInt(value) }
          : stock,
      );
      //  console.log('newdata:',newData);
      setStockRecoNotExecuted(newData);
      setrecommendationStock(newData);
    }
  };

  const handleSelectAllStocks = async () => {
    const newStockDetails = stockRecoNotExecuted.reduce((acc, stock) => {
      const isSelected = stockDetails.some(
        selectedStock =>
          selectedStock.tradingSymbol === stock.Symbol &&
          selectedStock.tradeId === stock.tradeId,
      );

      if (!isSelected) {
        const ltp = 0; //getLTPForSymbol(stock.Symbol);
        const advisedRangeLower = stock.Advised_Range_Lower;
        const advisedRangeHigher = stock.Advised_Range_Higher;

        const shouldDisableTrade =
          (advisedRangeHigher === 0 && advisedRangeLower === 0) ||
          (advisedRangeHigher === null && advisedRangeLower === null) ||
          (advisedRangeHigher > 0 &&
            advisedRangeLower > 0 &&
            parseFloat(advisedRangeHigher) >= parseFloat(ltp) &&
            parseFloat(ltp) >= parseFloat(advisedRangeLower)) ||
          (advisedRangeHigher > 0 &&
            advisedRangeLower === 0 &&
            advisedRangeLower === null &&
            parseFloat(advisedRangeHigher) >= parseFloat(ltp)) ||
          (advisedRangeLower > 0 &&
            advisedRangeHigher === 0 &&
            advisedRangeHigher === null &&
            parseFloat(advisedRangeLower) <= parseFloat(ltp));

        if (shouldDisableTrade) {
          const newStock = {
            user_email: stock.user_email,
            trade_given_by: stock.trade_given_by,
            tradingSymbol: stock.Symbol,
            transactionType: stock.Type,
            exchange: stock.Exchange,
            segment: stock.Segment,
            productType:
              stock.Exchange === 'NFO' || stock.Exchange === 'BFO'
                ? 'CARRYFORWARD'
                : stock.ProductType, //
            orderType: stock.OrderType,
            price: stock.Price,
            quantity: stock.Quantity,
            priority: stock.Priority,
            tradeId: stock.tradeId,
            user_broker: broker,
            zerodhaTradeId: stock.zerodhaTradeId,
          };
          acc.push(newStock);
        }
      }

      return acc;
    }, []);

    if (newStockDetails.length > 0) {
      try {
        await axios.post(
          `${server.server.baseUrl}api/cart/add/add-multiple-to-cart`,
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
            stocks: newStockDetails,
          },
        );
        getCartAllStocks();
      } catch (error) {
        console.error('Error adding stocks to cart', error);
      }
    }
  };

  const handleRemoveAllSelectedStocks = async () => {
    try {
      // Use all stock details in the cart for removal
      const stocksToRemove = [...stockDetails];

      if (stocksToRemove.length > 0) {
        await axios.post(
          `${server.server.baseUrl}api/cart/cart-items/remove/multiple/remove-multiple-from-cart`,
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
            stocks: stocksToRemove,
          },
        );
        // Clear stockDetails since all stocks are removed
        setStockDetails([]);
        getCartAllStocks(); // Refresh the cart
      }
    } catch (error) {
      console.error('Error removing stocks from cart', error);
    }
  };

  const handleIncreaseStockQty = (symbol, tradeId) => {
    const newData = stockRecoNotExecuted.map(stock =>
      stock.Symbol === symbol && stock.tradeId === tradeId
        ? { ...stock, Quantity: stock.Quantity + 1 }
        : stock,
    );
    setStockRecoNotExecuted(newData);
    setrecommendationStock(newData);
  };

  const handleDecreaseStockQty = (symbol, tradeId) => {
    const newData = stockRecoNotExecuted.map(stock =>
      stock.Symbol === symbol && stock.tradeId === tradeId
        ? { ...stock, Quantity: Math.max(stock.Quantity - 1, 0) }
        : stock,
    );
    setStockRecoNotExecuted(newData);
    setrecommendationStock(newData);
  };

  const handleTradeNow = () => {
    console.log('trades presssss');
    setOpenReviewTrade(true); // Set the state to open the modal
  };

  //console.log('TYPEEE ITEMSSSS:',types);
  const hasBuy = types.every(type => type === 'BUY');
  const hasSell = types.every(type => type === 'SELL');
  const allSell = hasSell && !hasBuy;
  const allBuy = hasBuy && !hasSell;
  const isMixed = hasSell && hasBuy;

  const handleTrade = async () => {
    // await getCartAllStocks();
    // console.log('HIIiiiiiiiiiiiiii', broker);
    // eventEmitter.emit('OpenTradeModel');
    setTradeClickCount(prevCount => prevCount + 1);
    fetchCart();
    const isFundsEmpty = funds.status === false;
    const isMarketHours = IsMarketHours();

    const currentBroker = userDetails?.user_broker;
    const currentBrokerRejectedCount = await getRejectedCount();
    if (isFundsEmpty) {
      setOpenTokenExpireModel(true);
      return; // Exit as funds are empty
    } else if (brokerStatus === null || brokerStatus === undefined) {
      setBrokerModel(true);
      return;
    }

    if (broker === 'Zerodha') {
      if (isFundsEmpty) {
        setOpenTokenExpireModel(true);
        return; // Exit as funds are empty
      } else if (brokerStatus === null) {
        setBrokerModel(true);
        return;
      }
      // If not funds empty, proceed with Zerodha-specific logic
      if (allBuy) {
        console.log('hrere');
        setOpenReviewTrade(true);
      } else if (tradeType?.allSell || tradeType?.isMixed) {
        console.log('All sells got');

        // Handle DDPI modal logic for SELL or mixed trades
        if (
          !userDetails?.ddpi_status ||
          userDetails?.ddpi_status === 'empty' ||
          (!['consent', 'physical'].includes(userDetails?.ddpi_status) &&
            currentBrokerRejectedCount > 0)
        ) {
          console.log('Show DDPI modal');
          setShowDdpiModal(false); // Show DDPI Modal for invalid or missing status
          setOpenReviewTrade(false); // Ensure Zerodha modal is closed
        } else {
          console.log('Valid DDPI status, no modal needed');
          setShowDdpiModal(false); // Hide DDPI Modal
          setOpenReviewTrade(true); // Proceed with Zerodha modal
        }
      } else {
        setOpenReviewTrade(true);
      }
    } else if (broker === 'Angel One') {
      if (edisStatus && edisStatus.edis === true) {
        console.log(
          `All trades for Angel One: ${allBuy ? 'BUY' : allSell ? 'SELL' : 'Mixed'
          }`,
        );
        setOpenReviewTrade(true); // Open review trade modal for all cases
      } else if (
        edisStatus &&
        edisStatus.edis === false &&
        (allSell || isMixed) &&
        currentBrokerRejectedCount > 0
      ) {
        console.log('edisStatus is missing or not valid for Angel One.');
        setShowAngleOneTpinModel(true); // Show TPIN modal for invalid edis
      } else {
        setOpenReviewTrade(true);
      }
    } else if (broker === 'Dhan') {
      // Check if DDPI status is null or not present
      // console.log('here to test status :', dhanEdisStatus && dhanEdisStatus.data[0].edis === false &&
      //   (allSell || isMixed) &&  currentBrokerRejectedCount > 0 ,currentBrokerRejectedCount);

      if (dhanEdisStatus && dhanEdisStatus?.data[0]?.edis === true) {
        console.log(
          `All trades for Dhan: ${allBuy ? 'BUY' : allSell ? 'SELL' : 'Mixed'}`,
        );
        setOpenReviewTrade(true); // Open review trade modal for all cases
      } else if (
        dhanEdisStatus &&
        dhanEdisStatus?.data[0]?.edis === false &&
        (allSell || isMixed) &&
        currentBrokerRejectedCount > 0
      ) {
        //setOpenReviewTrade(true);
        console.log(
          'edisStatus is missing or not valid for Dhan.',
          allSell,
          isMixed,
        );
        setShowDhanTpinModel(true);
      } else {
        setOpenReviewTrade(true);
      }
    } else if (broker === 'Fyers') {
      if (isFundsEmpty) {
        setOpenTokenExpireModel(true);
        return; // Exit as funds are empty
      } else if (brokerStatus === null) {
        setBrokerModel(true);
        return;
      } else {
        setOpenReviewTrade(true);
      }
    } else {
      // Fallback for brokers not mentioned above
      console.log(
        'Fallback: Broker not explicitly handled. Opening review modal.',
      );
      setOpenReviewTrade(true);
    }
  };

  const handleTradeBasket = async () => {
    // await getCartAllStocks();
    console.log('HIIiiiiiiiiiiiiii', broker);
    // eventEmitter.emit('OpenTradeModel');

    const isFundsEmpty = funds?.status === false;
    const isMarketHours = IsMarketHours();
    if (isFundsEmpty) {
      setOpenTokenExpireModel(true);
      return; // Exit as funds are empty
    } else if (brokerStatus === null) {
      setBrokerModel(true);
      return;
    }

    if (broker === 'Zerodha') {
      if (isFundsEmpty) {
        setOpenTokenExpireModel(true);
        return; // Exit as funds are empty
      } else if (brokerStatus === null) {
        setBrokerModel(true);
        return;
      }
      setOpenReviewTrade(true);
    } else {
      setOpenReviewTrade(true);
    }
  };

  const closeModal = () => {
    setModalVisible(false);
  };

  const showToast = (message1, type, message2) => {
    Toast.show({
      type: type,
      text2: message2 + ' ' + message1,
      //position:'bottom',
      position: 'top', // Duration the toast is visible
      text1Style: {
        color: 'black',
        fontSize: 11,
        fontWeight: 0,
        fontFamily: 'Satoshi-Medium', // Customize your font
      },
      text2Style: {
        color: 'black',
        fontSize: 12,
        fontFamily: 'Satoshi-Regular', // Customize your font
      },
    });
  };

  const IsMarketHours = () => {
    // Get the current time in IST and format it
    const currentTimeIST = moment()
      .utcOffset('+05:30')
      .format('DD-MM-YYYY HH:mm:ss');

    // Define the cutoff time of 3:15 PM in IST and format it
    const endTimeIST = moment()
      .utcOffset('+05:30')
      .set({ hour: 15, minute: 30, second: 0, millisecond: 0 })
      .format('DD-MM-YYYY HH:mm:ss');

    // Define the cutoff time of 3:15 PM in IST and format it
    const startTimeIST = moment()
      .utcOffset('+05:30')
      .set({ hour: 9, minute: 15, second: 0, millisecond: 0 })
      .format('DD-MM-YYYY HH:mm:ss');

    // Compare current time with the cutoff time
    if (
      moment(currentTimeIST, 'DD-MM-YYYY HH:mm:ss').isAfter(
        moment(startTimeIST, 'DD-MM-YYYY HH:mm:ss'),
      ) &&
      moment(currentTimeIST, 'DD-MM-YYYY HH:mm:ss').isBefore(
        moment(endTimeIST, 'DD-MM-YYYY HH:mm:ss'),
      )
    ) {
      return true;
    }

    return false;
  };

  const [cartContainer, setCartContainer] = useState([]);

  const fetchCartItems = async () => {
    try {
      const cartItemsKey = 'cartItems';

      // Load cart items from AsyncStorage
      const cartData = await AsyncStorage.getItem(cartItemsKey);
      const cartItems = cartData ? JSON.parse(cartData) : [];

      // Set cart items into the state
      setCartContainer(cartItems);
     // console.log('Cart items loaded:', cartItems);
    } catch (error) {
      console.error('Error loading cart items:', error);
    }
    //  console.timeEnd('computationTime1');
  };
  useEffect(() => {
    // Listen for the event and call clearCart when triggered
    const handleEvent = cartItems => {
      console.log('Event received, clearing cart...');
      fetchCartItems();
    };

    eventEmitter.on('GetAllTradeReferesh', handleEvent);

    // Cleanup function
    return () => {
      eventEmitter.off('GetAllTradeReferesh', handleEvent);
    };
  }, []);

  const cartItemsKey = 'cartItems'; // Key for local storage
  const loadCartFromLocalStorage = async () => {
    try {
      const cartData = await AsyncStorage.getItem(cartItemsKey);
      return cartData ? JSON.parse(cartData) : [];
    } catch (error) {
      console.error('Error loading cart items from local storage', error);
      return [];
    }
  };
  const [stocksWithoutSource, setStocksWithoutSource] = useState(stockDetails); // Initialize with stockDetails
  const fetchCart = async () => {
    const filteredStocks = await loadCartFromLocalStorage();
    setStocksWithoutSource(filteredStocks);
  };

  //console.log('typeeeeeee=------ i get:---',type);
  useEffect(() => {
    const syncCartWithStockDetails = async () => {
      const localCart = await loadCartFromLocalStorage();
      //  console.log('kkkk',localCart);
      // If you want to merge latest fields from `stockDetails` into `localCart`, you can do:
      const mergedCart = localCart.map(cartItem => {
        const updatedStock = stockDetails.find(
          stock =>
            stock.tradeId === cartItem.tradeId &&
            stock.symbol === cartItem.symbol,
        );

        return updatedStock ? { ...cartItem, ...updatedStock } : cartItem;
      });

      setStockDetails(mergedCart);
      setStocksWithoutSource(mergedCart);
    };

    syncCartWithStockDetails();
  }, [type]);

  const updateCartStates = useCallback(items => {
    const startTime = Date.now();
    console.log('items we get in container----', items);
    // Measure time for setCartContainer
    const cartContainerStart = Date.now();
    setCartContainer(items);
    const cartContainerEnd = Date.now();
    console.log(
      `setCartContainer took ${cartContainerEnd - cartContainerStart} ms`,
    );

    // Measure time for setStockDetails
    const stockDetailsStart = Date.now();
    setStockDetails(items);
    const stockDetailsEnd = Date.now();
    console.log(
      `setStockDetails took ${stockDetailsEnd - stockDetailsStart} ms`,
    );

    // Measure time for setCartCount

    const endTime = Date.now();
    console.log(`updateCartStates took ${endTime - startTime} ms in total`);
  }, []);

  //const cartItemsCallback = useCallback((items) => items, []);

  const handleSelectStock = async (symbol, tradeId, action, screen) => {
    // await fetchCartItems();
    const startTotal = performance.now();
    const timings = {};
    try {
      console.log('Starting handleSelectStock:', {
        symbol,
        tradeId,
        action,
        screen,
      });

      // Timing: Initial setup
      const startSetup = performance.now();
      // const cartItemsKey = 'cartItems';
      const cartItemsString = await AsyncStorage.getItem('cartItems');
      let cartItems = cartItemsString ? JSON.parse(cartItemsString) : [];

      console.log('CART CONTAINER I HAVE-----', cartItems);
      const itemKey = `${symbol}-${tradeId}`;
      timings.setup = performance.now() - startSetup;

      // Timing: Map creation
      const startMapCreation = performance.now();
      const cartItemMap = new Map(
        cartItems.map(item => [`${item.tradingSymbol}-${item.tradeId}`, item]),
      );
      timings.mapCreation = performance.now() - startMapCreation;

      // Timing: Action processing
      const startAction = performance.now();
      if (action === 'remove') {
        console.log('Removing item:', itemKey);
        cartItemMap.delete(itemKey);
      } else if (action === 'add') {
        if (!cartItemMap.has(itemKey)) {
          console.log('Finding stock in recommendations...');
          const startFindStock = performance.now();
          const updatedStock = recommendationStock.find(
            item => item.Symbol === symbol && item.tradeId === tradeId,
          );
          timings.findStock = performance.now() - startFindStock;

          if (updatedStock) {
            console.log('Creating new stock object...');
            const startCreateStock = performance.now();
            const newStock = {
              user_email: updatedStock.user_email,
              trade_given_by: updatedStock.trade_given_by,
              tradingSymbol: updatedStock.Symbol,
              transactionType: updatedStock.Type,
              exchange: updatedStock.Exchange,
              segment: updatedStock.Segment,
              productType:
                updatedStock.Exchange === 'NFO' ||
                  updatedStock.Exchange === 'BFO'
                  ? 'CARRYFORWARD'
                  : updatedStock.ProductType,
              orderType: updatedStock.OrderType,
              price: updatedStock.Price,
              quantity: updatedStock.Quantity,
              priority: updatedStock.Priority || 1,
              tradeId: updatedStock.tradeId,
              user_broker: broker,
              zerodhaTradeId: updatedStock.zerodhaTradeId,
            };
            cartItemMap.set(itemKey, newStock);
            timings.createStock = performance.now() - startCreateStock;
          }
        }
      }
      timings.actionProcessing = performance.now() - startAction;

      // Timing: Map to array conversion
      const startConversion = performance.now();
      cartItems = Array.from(cartItemMap.values());
      timings.mapToArray = performance.now() - startConversion;
      console.log('CART BEFORE SETTING---', cartItems);
      // Timing: AsyncStorage operation
      const startStorage = performance.now();
      await AsyncStorage.setItem(cartItemsKey, JSON.stringify(cartItems));

      const storedCartItems = await AsyncStorage.getItem(cartItemsKey);
      //console.log('Stored Cart Items in AsyncStorage:', storedCartItems);
      fetchCart();
      console.log('cart items i get::', storedCartItems);
      timings.asyncStorage = performance.now() - startStorage;

      // Timing: State updates
      const startStateUpdates = performance.now();
      updateCartStates(cartItems);
      timings.stateUpdates = performance.now() - startStateUpdates;
      const cartLength = cartItems.length;
      // Timing: Event emission
      const startEvent = performance.now();
      eventEmitter.emit('cartUpdated');
      timings.eventEmission = performance.now() - startEvent;

      const startModal = performance.now();
      //  console.log('Updated cartContainer state:', cartContainer);
      if (type === 'home' && screen !== 'handlesingle') {
        console.log(
          'Action we get:;;;;;;;;;;;;;;;;;;:::::::::::::::::::::::::::;',
          action,
        );
        showAddToCartModal(() => cartItems);
      }
      timings.modalHandling = performance.now() - startModal;

      // Calculate total time
      const totalTime = performance.now() - startTotal;

      // Log all timings
      console.log('Performance Breakdown (in milliseconds):', {
        totalTime: totalTime.toFixed(2),
        setup: timings.setup.toFixed(2),
        mapCreation: timings.mapCreation.toFixed(2),
        actionProcessing: timings.actionProcessing.toFixed(2),
        findStock: timings.findStock?.toFixed(2) || 'N/A',
        createStock: timings.createStock?.toFixed(2) || 'N/A',
        mapToArray: timings.mapToArray.toFixed(2),
        asyncStorage: timings.asyncStorage.toFixed(2),
        stateUpdates: timings.stateUpdates.toFixed(2),
        eventEmission: timings.eventEmission.toFixed(2),
        modalHandling: timings.modalHandling.toFixed(2),
      });

      // Identify slow operations (more than 100ms)
      const slowOperations = Object.entries(timings)
        .filter(([_, time]) => time > 100)
        .map(([operation, time]) => `${operation}: ${time.toFixed(2)}ms`);

      if (slowOperations.length > 0) {
        console.warn('Slow operations detected:', slowOperations);
      }
    } catch (error) {
      console.error('Error in handleSelectStock:', error);
      const errorTime = performance.now() - startTotal;
      console.log(`Function failed after ${errorTime.toFixed(2)}ms`);
      throw error;
    }
  };

  const filterCartAfterOrder = async () => {
    try {
      const cartItemsString = await AsyncStorage.getItem('cartItems');

      if (cartItemsString) {
        let cartItems = JSON.parse(cartItemsString);
        //  console.log('cart items in -----',cartItemsString);
        //  console.log('cart items in -----stock',stockDetails);
        // Filter out items in stockDetails that are also in cartItems
        const updatedCartItems = cartItems.filter(
          cartItem =>
            !stockDetails.some(
              stockDetail =>
                stockDetail.tradingSymbol === cartItem.tradingSymbol &&
                stockDetail.tradeId === cartItem.tradeId,
            ),
        );

        // Save updated cart to AsyncStorage
        await AsyncStorage.setItem(
          'cartItems',
          JSON.stringify(updatedCartItems),
        );

        // Now update stockDetails too by removing the items that are not in updatedCartItems
        const updatedStockDetails = stockDetails.filter(stockDetail =>
          updatedCartItems.some(
            item =>
              item.tradingSymbol === stockDetail.tradingSymbol &&
              item.tradeId === stockDetail.tradeId,
          ),
        );
        console.log('updated cart items---->>>>>>>>>>>', updatedCartItems);
        console.log('updated stock details---->>>>>', updatedStockDetails);
        // Update the state to reflect changes in UI
        setStockDetails(updatedStockDetails);
      } else {
        console.log('No cartItems found in AsyncStorage');
      }
    } catch (error) {
      console.error('Error filtering cart items after order placement:', error);
    }
  };

  // Helper function to get the cart items from AsyncStorage
  const getCartAllStocks = async () => {
    // Start timer before the computation block
    console.log('this get called------------>>>>>>>>>>>>>>>>.');
    const cartData = await AsyncStorage.getItem('cartItems');
    if (cartData) {
      const parsedCartData = JSON.parse(cartData);
      // console.log('Parredeeddddddddddddddddd:',parsedCartData);

      // Extract types from cart data
      const extractedTypes = parsedCartData.map(stock => stock.transactionType);
      setTypes(extractedTypes);

      // Determine if SELL or BUY types exist
      const hasSell = extractedTypes.some(type => type === 'SELL');
      const hasBuy = extractedTypes.some(type => type === 'BUY');
      const allSell = hasSell && !hasBuy;
      const allBuy = hasBuy && !hasSell;
      const isMixed = hasSell && hasBuy;

      const newTradeType = {
        allSell: allSell,
        allBuy: allBuy,
        isMixed: isMixed,
      };

      // Set the new trade type and store it in localStorage
      setTradeType(newTradeType);
      AsyncStorage.setItem('storedTradeType', JSON.stringify(newTradeType));

      // Create an array of type and symbol for each stock
      const typeAndSymbol = parsedCartData.map(stock => ({
        Symbol: stock.tradingSymbol,
        Type: stock.transactionType,
        Exchange: stock.exchange,
      }));

      setStockTypeAndSymbol(typeAndSymbol);
    } else {
      // Handle case where cartData is null or empty
      setTypes([]);
      setTradeType({});
      setStockTypeAndSymbol([]);
    }
    return cartData ? JSON.parse(cartData) : [];
  };

  const handleexpire = () => {
    setOpenTokenExpireModel(true);
  };
  const openBrokerSelectionModal = () => {
    setModalVisible1(true);
  };

  const [stockTypeAndSymbol, setStockTypeAndSymbol] = useState([]);

  const handleCloseDdpiModal = () => {
    setShowDdpiModal(false);
  };

  const handleProceedWithTpin = () => {
    setShowDdpiModal(false);

    setOpenReviewTrade(true);
  };

  const subscribeToSymbols = async () => {
    const wsManager = WebSocketManager.getInstance();

    // Flatten the symbols from both non-basket and basket trades
    const allTrades = stockRecoNotExecuted.flatMap(item => {
      if (item?.type === 'basket') {
        // Handle trades inside a basket

        return item?.trades;
      } else {
        //  console.log('here i get---',item);
        // Non-basket trade
        return [item];
      }
    });

    // Optional: filter unique symbols if needed
    const uniqueTrades = [];
    const seenSymbols = new Set();

    // console.log('Subscribing to symbols:', uniqueTrades.map(t => t.Symbol));

    // Now subscribe to all trades (flattened and unique)
    await wsManager.subscribeToAllSymbols(allTrades);
  };

  useEffect(() => {
    subscribeToSymbols();
  }, [stockRecoNotExecuted]);

  const handleSingleSelectStock = async (symbol, tradeId, action) => {
    await getUserDeatils();
    await getRejectedCount();

    const rejectedKey = `rejectedCount${broker}`;
    //const rejectedCountFromStorage = await AsyncStorage.getItem(rejectedKey);
    const currentBrokerRejectedCount = await getRejectedCount();
    console.log('this hit---1');
    getAllFunds();
    console.log('this not----2');
    const isMarketHours = IsMarketHours();
    const isFundsEmpty = funds?.status === false || funds?.status === 1;
    console.log("thos called ------jjjjjjjjjjj2", isFundsEmpty, funds, brokerStatus);
    if (isFundsEmpty) {
      console.log("thos called ------jjjjjjjjjjj1");
      setOpenTokenExpireModel(true);
      return;
    } else if (brokerStatus === null || brokerStatus === undefined || brokerStatus !== 'connected' || brokerStatus === "Disconnected") {
      console.log('here-----', brokerStatus);
      setBrokerModel(true);
    } else {
      console.log('broker status--', brokerStatus);
      if (!isMarketHours) {
        showToast('Orders cannot be placed after Market hours.', 'error', '');
        return;
      }
      const isStockSelected = stockDetails.some(
        selectedStock =>
          selectedStock.tradingSymbol === symbol &&
          selectedStock.tradeId === tradeId,
      );

      const updatedStock = recommendationStock.find(
        item => item.Symbol === symbol && item.tradeId === tradeId,
      );

      if (!updatedStock) {
        console.error('Stock not found in recommendationStock.');
        return;
      }
      // console.log('UpdatedStock:', updatedStock.Exchange);
      const newStock = {
        user_email: updatedStock.user_email,
        trade_given_by: updatedStock.trade_given_by,
        tradingSymbol: updatedStock.Symbol,
        transactionType: updatedStock.Type,
        exchange: updatedStock.Exchange,
        segment: updatedStock.Segment,
        productType:
          updatedStock.Exchange === 'NFO' || updatedStock.Exchange === 'BFO'
            ? 'CARRYFORWARD'
            : updatedStock.ProductType,
        orderType: updatedStock.OrderType,
        price: updatedStock.Price,
        quantity: updatedStock.Quantity,
        priority: updatedStock.Priority || 1,
        tradeId: updatedStock.tradeId,
        user_broker: broker,
        zerodhaTradeId: updatedStock.zerodhaTradeId,
      };

      // If stock is already selected
      if (isStockSelected) {
        const isBuyOrder = action.toUpperCase() === 'BUY';
        const isSellOrder = action.toUpperCase() === 'SELL';
        // console.log('here i am');
        if (broker === 'Angel One') {
          if (isBuyOrder) {
            setStockDetails([newStock]);
            setOpenReviewTrade(true); // Open review trade modal for BUY or SELL
          } else if (isSellOrder) {
            // console.log('ediss Angel:', edisStatus.edis);
            if (edisStatus && edisStatus?.edis === true) {
              setStockDetails([newStock]);
              setOpenReviewTrade(true); // Open review trade modal for SELL
            } else if (
              edisStatus?.edis === false &&
              currentBrokerRejectedCount > 0
            ) {
              console.log('Finaly maine:');
              setShowAngleOneTpinModel(true); // Show TPIN modal
            } else {
              console.log('here o wot');
              setStockDetails([newStock]);
              setOpenReviewTrade(true);
            }
            // Show TPIN modal
          } else {
            setStockDetails([newStock]);
            setOpenReviewTrade(true); // Open review trade modal
          }
        } else if (broker === 'Dhan') {
          if (isBuyOrder) {
            setStockDetails([newStock]);
            setOpenReviewTrade(true); // Open review trade modal for BUY
          } else if (isSellOrder) {
            if (dhanEdisStatus?.data?.[0]?.edis === true) {
              setStockDetails([newStock]);
              setOpenReviewTrade(true); // Open review trade modal for SELL
            } else if (
              dhanEdisStatus?.data?.[0]?.edis === false &&
              currentBrokerRejectedCount > 0
            ) {
              setShowDhanTpinModel(true); // Show TPIN modal
            } else {
              console.log('here o wot');
              setStockDetails([newStock]);
              setOpenReviewTrade(true);
            }
          }
        } else if (broker === 'Zerodha') {
          const allFNO = stockDetails.every(
            item => item.exchange === 'NFO' || item.exchange === 'BFO',
          );
          if (isBuyOrder) {
            setStockDetails([newStock]);
            setOpenReviewTrade(true); // Open review trade modal for BUY or SELL
          } else if (isSellOrder && !allFNO) {
            console.log(
              'ediss Zeroaccc:',
              edisStatus?.edis,
              userDetails?.ddpi_status,
            );
            if (
              userDetails?.ddpi_status === 'consent' ||
              userDetails?.ddpi_status === 'physical'
            ) {
              setShowDdpiModal(false);
              setStockDetails([newStock]);
              setOpenReviewTrade(true); // Open review trade modal for SELL
            } else if (
              !userDetails?.ddpi_status ||
              userDetails?.ddpi_status === 'empty' ||
              (!['consent', 'physical'].includes(userDetails?.ddpi_status) &&
                currentBrokerRejectedCount > 0)
            ) {
              console.log('Finaly maine:');
              setShowDdpiModal(true); // Show TPIN modal
            } else {
              console.log('here o wot');
              setStockDetails([newStock]);
              setOpenReviewTrade(true);
            }
          } else {
            setStockDetails([newStock]);
            setOpenReviewTrade(true); // Open review trade modal
          }
        } else {
          console.log('Here upstox:');
          setStockDetails([newStock]);
          setOpenReviewTrade(true); // Open review trade modal
        }
        return;
      }

      const isBuyOrder = action.toUpperCase() === 'BUY';
      const isSellOrder = action.toUpperCase() === 'SELL';
      await handleSelectStock(symbol, tradeId, 'add', 'handlesingle');
      // Handling broker-specific logic
      if (broker === 'Zerodha') {
        setStockDetails([newStock]);
        setOpenReviewTrade(true); // Show Zerodha model
      } else if (broker === 'Angel One') {
        // await verifyEdis();
        if (isBuyOrder) {
          setStockDetails([newStock]);
          setOpenReviewTrade(true); // Open review trade modal for BUY or SELL
        } else if (isSellOrder) {
          console.log('ediss Angel:', edisStatus?.edis);
          if (edisStatus && edisStatus?.edis === true) {
            setStockDetails([newStock]);
            setOpenReviewTrade(true); // Open review trade modal for SELL
          } else if (
            edisStatus?.edis === false &&
            currentBrokerRejectedCount > 0
          ) {
            console.log('Finaly maine:');
            setShowAngleOneTpinModel(true); // Show TPIN modal
          } else {
            console.log('here o wot');
            setStockDetails([newStock]);
            setOpenReviewTrade(true);
          }
        }
      } else if (broker === 'Dhan') {
        if (isBuyOrder) {
          setStockDetails([newStock]);
          setOpenReviewTrade(true); // Open review trade modal for BUY
        } else if (isSellOrder) {
          if (dhanEdisStatus?.data?.[0]?.edis === true) {
            setStockDetails([newStock]);
            setOpenReviewTrade(true); // Open review trade modal for SELL
          } else if (
            dhanEdisStatus?.data?.[0]?.edis === false &&
            currentBrokerRejectedCount > 0
          ) {
            setShowDhanTpinModel(true); // Show TPIN modal
          } else {
            setStockDetails([newStock]);
            setOpenReviewTrade(true);
          }
        }
      } else {
        setStockDetails([newStock]);
        setOpenReviewTrade(true); // Open review trade modal
      }
    }
  };

  const [modalVisible, setModalVisible1] = useState(false);

  // Trades---

//  console.log("BROKER MODAL OPEN---", brokerModel);
  const [isRebalModalVisible, setRebalModalVisible] = useState(false);
  const [calculatedPortfolioData, setCalculatedPortfolioData] = useState([]);
  const [modelPortfolioModelId, setModelPortfolioModelId] = useState();
  const [storeModalName, setStoreModalName] = useState();

  const openRebalModal = () => {
    setRebalModalVisible(true);
  };

  const handleTradeNow1 = () => {
    if (broker === 'Zerodha') {
      console.log('broker:', broker);
      setOpenReviewTrade(true); // Open the Zerodha modal only when broker is Zerodha and trade button is pressed
    } else {
      if (brokerStatus === null) {
        setBrokerModel(true);
      } else {
        console.log('broker:', broker);
        setOpenReviewTrade(true);
      }
    } // Set the state to open the modal
  };

  const openReviewModal = () => {
    setOpenReviewTrade(true);
  };

  const [ignoreTradesLoading, setIgnoreTradesLoading] = useState(false);
  const handleRevertTrades = async id => {
    console.log('id of ignore:', id);
    setIgnoreTradesLoading(true);
    let data = JSON.stringify({
      uid: id,
      trade_place_status: 'recommend',
    });

    let orderConfig = {
      method: 'put',
      url: `${server.server.baseUrl}api/recommendation`,
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

    axios
      .request(orderConfig)
      .then(response => {
        setIgnoreTradesLoading(false);
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'You have successfully reverted your trade.',
          text2Style: { fontFamily: 'Poppins-Medium', fontSize: 12 },
          visibilityTime: 5000,
          position: 'bottom',
          bottomOffset: 40,
          style: {
            backgroundColor: 'white',
            borderLeftColor: 'green',
            borderLeftWidth: 5,
            padding: 10,
          },
          textStyle: {
            color: 'green',
            fontFamily: 'Poppins-Medium',
            fontSize: 20,
          },
        });
        getAllTrades();
      })
      .catch(error => {
        setIgnoreTradesLoading(false);
        console.error('Error reverting trade:', error);
      });
  };

  //////////////////////////

  useEffect(() => {
    if (userDetails && userDetails.user_broker === 'Angel One') {
      // console.log('Verify edis called:');
      verifyEdis();
    }
  }, [userDetails, broker]);

  useEffect(() => {
    // console.log('This Called, user',userDetails);
    if (userDetails && userDetails.user_broker === 'Dhan') {
      verifyDhanEdis();
    }
  }, [userDetails, broker]);

  useEffect(() => {
    if (userDetails && userDetails.user_broker === 'Zerodha') {
      const verifyZerodhaDdpi = async () => {
        try {
          const response = await axios.post(
            `${server.ccxtServer.baseUrl}zerodha/save-ddpi-status`,
            {
              apiKey: zerodhaApiKey,
              accessToken: userDetails.jwtToken,
              userEmail: userDetails.email,
            },
          );
          setZerodhaDdpiStatus(response.data);
        } catch (error) {
          //    console.error("Error verifying eDIS status:", error);
        }
      };

      verifyZerodhaDdpi();
    }
  }, [userDetails, broker]);

  useEffect(() => {
    if (userDetails && userDetails.user_broker === 'Zerodha') {
      const verifyZerodhaEdis = async () => {
        try {
          const response = await axios.post(
            `${server.ccxtServer.baseUrl}zerodha/save-edis-status`,
            {
              userEmail: userDetails.email,
              edis: userDetails.edis,
            },
          );
          console.log('response edit::', response.data);
          setZerodhaDdpiStatus(response.data);
        } catch (error) {
          //   console.error("Error verifying eDIS status:", error);
        }
      };

      verifyZerodhaEdis();
    }
  }, [userDetails, broker]);

  useEffect(() => {
    const loadTradeType = async () => {
      try {
        const savedTradeType = await AsyncStorage.getItem('storedTradeType');
        if (savedTradeType) {
          setStoredTradeType(JSON.parse(savedTradeType));
        }
      } catch (error) {
        console.error('Failed to load trade type from storage', error);
      }
    };

    loadTradeType();
  }, []);

  useEffect(() => {
    if (types.length > 0) {
      const hasSell = types.some(type => type === 'SELL');
      const hasBuy = types.some(type => type === 'BUY');
      const allSell = hasSell && !hasBuy;
      const allBuy = hasBuy && !hasSell;
      const isMixed = hasSell && hasBuy;

      const newTradeType = {
        allSell: allSell,
        allBuy: allBuy,
        isMixed: isMixed,
      };

      updateTradeType(newTradeType);
    } else {
      updateTradeType(storedTradeType);
    }
  }, [types]);

useEffect(() => {
  if (!isDatafetching) {
    let transformedData = []; // To hold the transformed data

    // Function to group trades by basketId
    const groupTrades = (trades) => {
      const basketGroups = {};
      const stockCards = [];

      trades.forEach(item => {
        // Check if this is a basket trade
        // Basket trades have: basketId AND toTradeQty property (even if it's 0)
       const isBasketTrade =
  item.Basket === true ||
  (item.basketId && item.basketName);


        // ============================
        // BASKET TRADE (from flattened basket_advice)
        // ============================
        if (isBasketTrade) {
          // Initialize basket group if it doesn't exist
          if (!basketGroups[item.basketId]) {
            basketGroups[item.basketId] = {
              type: "basket",
              basketId: item.basketId,
              basketName: item.basketName,
              advisor_name: item.advisor_name,
              date: item.date,
              lastUpdated: item.lastUpdated,
              description: item.description,
              trades: []
            };
          }

          // Ensure trade has all required fields for BasketCard
          const trade = {
            ...item,
            // Ensure these fields exist for BasketCard compatibility
            searchSymbol: item.searchSymbol || item.Symbol?.split(/\d/)[0] || '',
            Strike: item.Strike || '',
            OptionType: item.OptionType || '',
            stopLoss: item.stopLoss || item.sl || item.SL || null,
            profitTarget: item.profitTarget || item.Target || item.PT || null,
            LimitPrice: item.Price || item.LimitPrice || null,
          };

          // Add trade to basket group
          basketGroups[item.basketId].trades.push(trade);

          return;
        }

        // ============================
        // INDIVIDUAL STOCK TRADE
        // ============================
        stockCards.push({
          ...item,
          type: "stock"
        });
      });

      // Convert basket groups to array and combine with stocks
      const basketArray = Object.values(basketGroups);
      
      console.log('📊 Grouping Summary:', {
        totalBaskets: basketArray.length,
        totalStocks: stockCards.length,
        baskets: basketArray.map(b => ({
          name: b.basketName,
          tradeCount: b.trades.length,
          sampleTrade: b.trades[0] ? {
            symbol: b.trades[0].searchSymbol,
            strike: b.trades[0].Strike,
            optionType: b.trades[0].OptionType
          } : null
        }))
      });

      return [
        ...basketArray,
        ...stockCards,
      ];
    };

    // Depending on the `type`, fetch the respective data and transform it
    if (type === 'OSrejected' && rejectedTrades) {
      transformedData = groupTrades(rejectedTrades);
    }
    if (type === 'Ignore' && ignoredTrades) {
      transformedData = groupTrades(ignoredTrades);
    }
    if ((type === 'All' || type === 'home') && stockRecoNotExecutedfinal) {
      transformedData = groupTrades(stockRecoNotExecutedfinal);
    }

    // Set the transformed data to the state
    setStockRecoNotExecuted(transformedData);
    setrecommendationStock(transformedData);
  }
}, [
  type,
  stockRecoNotExecutedfinal,
  rejectedTrades,
  ignoredTrades,
  isDatafetching,
]);

  useEffect(() => {
    if (!userDetails) {
      getUserDeatils();
    }

    if (broker === 'Angel One') {
      verifyEdis();
    } else if (broker === 'Dhan') {
      verifyDhanEdis();
    }
  }, [broker, userDetails]);

  useEffect(() => {
    //  console.log('Counnnnnnnnnnnnnnnnnnnt----------------------3');
    if (zerodhaRequestToken && zerodhaRequestType === 'login') {
      connectZerodha();
    }
  }, [zerodhaRequestToken, zerodhaRequestType]);

  useEffect(() => {
    // console.log('Counnnnnnnnnnnnnnnnnnnt----------------------4');
    if (
      userId !== undefined &&
      (sessionToken ||
        upstoxSessionToken ||
        authToken ||
        (zerodhaAccessToken && zerodhaRequestType === 'login'))
    ) {
      connectBrokerDbUpadte();
    }
  }, [userId, sessionToken, upstoxSessionToken, zerodhaAccessToken, authToken]);

  useEffect(() => {
    //console.log('Counnnnnnnnnnnnnnnnnnnt----------------------5');
    const fetchData = async () => {
      try {
        // Fetch and parse the pending order data
        const pendingOrderData = await AsyncStorage.getItem(
          'stockDetailsZerodhaOrder',
        );
        if (pendingOrderData) {
          setZerodhaStockDetails(JSON.parse(pendingOrderData));
        }

        // Fetch and parse the additional payload data
        const payloadData = await AsyncStorage.getItem('additionalPayload');
        if (payloadData) {
          setZerodhaAdditionalPayload(JSON.parse(payloadData));
        }
      } catch (error) {
        console.error('Error loading data from AsyncStorage:', error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    // console.log('Counnnnnnnnnnnnnnnnnnnt----------------------6');
    if (
      zerodhaStatus !== null &&
      zerodhaRequestType === 'basket' &&
      jwtToken !== undefined
    ) {
      checkZerodhaStatus();
    }
  }, [zerodhaStatus, zerodhaRequestType, userEmail, jwtToken]);

  useEffect(() => {
    //   console.log('Counnnnnnnnnnnnnnnnnnnt----------------------8');
    //   console.time('computationTime1');

    const fetchCartItems = async () => {
      try {
        const cartItemsKey = 'cartItems';

        // Load cart items from AsyncStorage
        const cartData = await AsyncStorage.getItem(cartItemsKey);
        const cartItems = cartData ? JSON.parse(cartData) : [];

        // Set cart items into the state
        setCartContainer(cartItems);
        //  console.log('Cart items loaded:', cartItems);
      } catch (error) {
        console.error('Error loading cart items:', error);
      }
      //  console.timeEnd('computationTime1');
    };

    fetchCartItems();
  }, []);

  const stockRemovedListenerRef = useRef(null);
  useEffect(() => {
    const stockRemovedListener = async ({ symbol, tradeId }) => {
      const cartItemsKey = 'cartItems';

      // Log the initial cartContainer
      //   console.log('Initial cartContainer:', cartContainer);

      // Clone the current cart items
      let cartItems = [...cartContainer];

      // Generate the key for the item to be removed
      const itemKey = `${symbol}-${tradeId}`;

      // Convert the cart items to a Map for efficient key-based deletion
      const cartItemMap = new Map(
        cartItems.map(item => [`${item.tradingSymbol}-${item.tradeId}`, item]),
      );

      // Log the generated keys and the item key
      console.log(
        'Generated Map Keys:',
        cartItems.map(item => `${item.tradingSymbol}-${item.tradeId}`),
      );
      console.log('Item Key to Remove:', itemKey);

      // Log the Map before deletion
      console.log('Map before deletion:', cartItemMap);

      // Remove the specified item
      cartItemMap.delete(itemKey);

      // Convert the updated Map back to an array
      cartItems = Array.from(cartItemMap.values());

      // Log the updated cartItems
      console.log('Updated cart items:', cartItems);

      try {
        // Use Promise.all to wait for both operations to complete
        await Promise.all([
          AsyncStorage.setItem(cartItemsKey, JSON.stringify(cartItems)),
          new Promise(resolve => {
            updateCartStates(cartItems);
            resolve();
          }),
        ]);

        // Emit the event only after both operations are complete
        eventEmitter.emit('cartUpdated');
      } catch (error) {
        console.error('Error updating cart:', error);
      }
    };

    eventEmitter.on('stockRemoved', stockRemovedListener);
    return () => {
      eventEmitter.off('stockRemoved', stockRemovedListener);
    };
  }, [stockDetails]);

  useEffect(() => {
    const unsubscribe = notifee.onForegroundEvent(({ event }) => {
      //   console.log('details i get---------------->>>>>>>>:',event);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    const handleStockAction = ({ symbol, tradeId }) => {
      console.log('Received data in StockAdvices:', { symbol, tradeId });
      // Perform your desired action with symbol and tradeId here
      handleSingleSelectStock(symbol, tradeId, 'add');
    };

    eventEmitter.on('stockAction', handleStockAction);

    return () => {
      eventEmitter.off('stockAction', handleStockAction); // Cleanup on unmount
    };
  }, []);

  useEffect(() => {
    eventEmitter.on('OpenTradeModel', handleTradeNow1);
    return () => {
      eventEmitter.off('OpenTradeModel', handleTradeNow1);
    };
  }, []);

  //////////////////////////////

  const closeReviewTradeModal = () => {
    //  console.log('stockDetials))))))---->',stockDetails);

    setBasketData([]);
    setOpenReviewTrade(false);
  };

  const closeZerodhaTradeModal = () => {
    console.log('stockDetials))))))---->', stockDetails);

    setBasketData([]);
    setOpenReviewTrade(false);
  };
  const animatedHeight = useRef(new Animated.Value(10)).current;
  const [expandedCardIndex, setExpandedCardIndex] = useState(null);

  const toggleExpand = useCallback(index => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedCardIndex(prev => (prev === index ? null : index));
  }, []);
  const handleConnectAndPlaceOrder = async () => {
    if (funds.status === false || funds.status === 1) {
      setOpenTokenExpireModel(true);
    } else {
      placeOrder();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StockAdviceContent
        type={type}
        broker={broker}
        stocksWithoutSource={stocksWithoutSource}
        getUserDeatils={getUserDeatils}
        userDetails={userDetails}
        setbasketId={setbasketId}
        setbasketName={setbasketName}
        isBasket={isBasket}
        basketData={basketData}
        planList={planList}
        fullsetBasketData={fullsetBasketData}
        setBasketData={setBasketData}
        setisBasket={setisBasket}
        isDatafetching={isDatafetching}
        onOpenRebalModal={openRebalModal}
        orderscreen={orderscreen}
        stockRecoNotExecuted={stockRecoNotExecuted}
        handleIgnoreTradePress={id => {
          setStockIgnoreId(id);
          setModalVisible(true);
        }}
        recommendationStock={stockRecoNotExecuted && stockRecoNotExecuted}
        isSelected={cartContainer.some(
          stock => stock.tradingSymbol === Symbol && stock.tradeId === tradeId,
        )}
        setRecommendationStock={setStockRecoNotExecuted}
        setStockDetails={setStockDetails}
        stockDetails={stockDetails}
        cartContainer={cartContainer}
        setCartContainer={setCartContainer}
        setStockRecoNotExecuted
        loading={loading}
        userEmail={userEmail}
        handleTradeBasket={handleTradeBasket}
        getAllTrades={getAllTrades}
        handleSelectAllStocks={handleSelectAllStocks}
        handleRemoveAllSelectedStocks={handleRemoveAllSelectedStocks}
        handleSelectStock={handleSelectStock}
        handleSingleSelectStock={handleSingleSelectStock}
        handleTradeNow={handleTrade}
        handleRevertTrades={handleRevertTrades}
        handleDecreaseStockQty={handleDecreaseStockQty}
        handleIncreaseStockQty={handleIncreaseStockQty}
        handleLimitOrderInputChange={handleLimitOrderInputChange}
        handleQuantityInputChange={handleQuantityInputChange}
        handleTradePress={handleSingleSelectStock} // Call handleTrade when trade button is pressed
        expandedCardIndex={expandedCardIndex}
        toggleExpand={toggleExpand}
        animatedHeight={animatedHeight}
      />

      {isModalVisibleignore && (
        <IgnoreAdviceModal
          handleIgnore={handleIgnoredTrades}
          stockIgnoreId={stockIgnoreId}
          isVisible={isModalVisibleignore}
          onClose={closeModal}
        />
      )}

      {openZerodhaReviewModal && (
        <ZerodhaReviewModal
          isVisible={openZerodhaReviewModal}
          onClose={closeZerodhaTradeModal}
          setOpenZerodhaModel={setOpenZerodhaModel}
          stockDetails={stockDetails}
          isBasket={isBasket}
          basketData={basketData}
          setBasketData={setBasketData}
          mbasket={mbasket}
          htmlContent={htmlContentfinal}
          appURL={appURL}
          userEmail={userEmail}
          fullbasketData={fullbasketData}
          setOpenSucessModal={setOpenSucessModal}
          setOrderPlacementResponse={setOrderPlacementResponse} //setOrderPlacementResponse
          getAllTrades={getAllTrades}
          userDetails={userDetails}
          zerodhaApiKey={zerodhaApiKey}
          filterCartAfterOrder={filterCartAfterOrder}
          getCartAllStocks={getCartAllStocks}
          webViewVisible={webViewVisible}
          updatePortfolioData={updatePortfolioData}
          setCartContainer={setCartContainer}
          setWebViewVisible={setWebViewVisible}
          handleZerodhaRedirect={handleZerodhaRedirect}
          openZerodhaReviewModal={openZerodhaReviewModal}
          setStockDetails={setStockDetails}
          broker={broker}
        />
      )}

      {openReviewTrade && (
        <ReviewTradeModal
          isVisible={openReviewTrade}
          onClose={closeReviewTradeModal}
          stockDetails={stockDetails}
          setStockDetails={setStockDetails}
          loading={loading}
          isBasket={isBasket}
          fullbasketData={fullbasketData}
          basketData={basketData}
          setBasketData={setBasketData}
          setisBasket={setisBasket}
          placeOrder={placeOrder}
          getCartAllStocks={getCartAllStocks}
          handleSelectStock={handleSelectStock}
          funds={funds}
          broker={broker}
        />
      )}

      {openSuccessModal && (
        <RecommendationSuccessModal
          openSuccessModal={openSuccessModal}
          setOpenSucessModal={setOpenSucessModal}
          orderPlacementResponse={orderPlacementResponse}
        />
      )}

      {OpenTokenExpireModel && (
        <IIFLReviewTradeModal
          isVisible={OpenTokenExpireModel}
          onClose={() => setOpenTokenExpireModel(false)}
          openIIFLReviewModal={openIIFLReviewModal}
          fetchBrokerStatusModal={fetchBrokerStatusModal}
          setOpenIIFLReviewModel={setOpenReviewTrade}
          setOpenTokenExpireModel={setOpenTokenExpireModel}
          stockDetails={stockDetails}
          setStockDetails={setStockDetails}
          userId={userId}
          apiKey={apiKey}
          secretKey={secretKey}
          checkValidApiAnSecret={checkValidApiAnSecret}
          clientCode={clientCode}
          my2pin={my2pin}
          panNumber={panNumber}
          mobileNumber={mobileNumber}
          broker={broker}
          getUserDeatils={getUserDeatils}
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
          showAliceblueModal={showAliceblueModal}
          setShowAliceblueModal={setShowAliceblueModal}
          showFyersModal={showFyersModal}
          setShowFyersModal={setShowFyersModal}
          showMotilalModal={showMotilalModal}
          setShowMotilalModal={setShowMotilalModal}
        />
      )}

      {(brokerModel || OpenTokenExpireModel) && (
        <BrokerSelectionModal
          showBrokerModal={brokerModel}
          OpenTokenExpireModel={OpenTokenExpireModel}
          setShowBrokerModal={setBrokerModel}
          setOpenTokenExpireModel={setOpenTokenExpireModel}
          fetchBrokerStatusModal={fetchBrokerStatusModal}
        />
      )}

      {showDdpiModal && (
        <DdpiModal
          isOpen={showDdpiModal}
          setIsOpen={handleCloseDdpiModal}
          proceedWithTpin={handleProceedWithTpin}
          userDetails={userDetails && userDetails}
          setOpenReviewTrade={setOpenReviewTrade}
        />
      )}

      {false && (
        <ActivateNowModel
          isOpen={false}
          setIsOpen={setActivateNowModel}
          onActivate={handleActivateDDPI}
          userDetails={userDetails}
        />
      )}

      {showAngleOneTpinModel && (
        <AngleOneTpinModal
          isOpen={showAngleOneTpinModel}
          setIsOpen={setShowAngleOneTpinModel}
          userDetails={userDetails}
          edisStatus={edisStatus}
          tradingSymbol={stockDetails.map(stock => stock.tradingSymbol)}
        />
      )}

      {showFyersTpinModal && (
        <FyersTpinModal
          isOpen={showFyersTpinModal}
          setIsOpen={setShowFyersTpinModal}
          userDetails={userDetails}
        />
      )}

      {showDhanTpinModel && (
        <DhanTpinModal
          isOpen={showDhanTpinModel}
          setIsOpen={setShowDhanTpinModel}
          userDetails={userDetails}
          dhanEdisStatus={dhanEdisStatus}
          stockTypeAndSymbol={stockTypeAndSymbol}
          singleStockTypeAndSymbol={singleStockTypeAndSymbol}
        />
      )}

      {showOtherBrokerModel && (
        <OtherBrokerModel
          userDetails={userDetails}
          onContinue={() => {
            setIsReturningFromOtherBrokerModal(true);
            setShowOtherBrokerModel(false);
          }}
          setShowOtherBrokerModel={setShowOtherBrokerModel}
          showActivateNowModel={showActivateNowModel}
          openReviewModal={openReviewModal}
          setActivateNowModel={setActivateNowModel}
          setOpenReviewTrade={setOpenReviewTrade}
          setOpenRebalanceModal={setOpenRebalanceModal}
          userEmail={userEmail}
          apiKey={apiKey}
          jwtToken={jwtToken}
          secretKey={secretKey}
          clientCode={clientCode}
          broker={broker}
          sid={sid}
          viewToken={viewToken}
          serverId={serverId}
          visible={showOtherBrokerModel}
          setCaluculatedPortfolioData={setCalculatedPortfolioData}
          setModelPortfolioModelId={setModelPortfolioModelId}
          modelPortfolioModelId={modelPortfolioModelId}
          setStoreModalName={setStoreModalName}
          storeModalName={storeModalName}
          funds={funds}
        />
      )}

      {showIIFLModal && (
        <IIFLModal
          isVisible={showIIFLModal}
          onClose={() => setShowIIFLModal(false)}
          setShowBrokerModal={setOpenTokenExpireModel}
          fetchBrokerStatusModal={fetchBrokerStatusModal}
        />
      )}

      {showICICIUPModal && (
        <ICICIUPModal
          isVisible={showICICIUPModal}
          showICICIUPModal={showICICIUPModal}
          setShowICICIUPModal={setShowICICIUPModal}
          onClose={() => setShowICICIUPModal(false)}
          setShowBrokerModal={setOpenTokenExpireModel}
          fetchBrokerStatusModal={fetchBrokerStatusModal}
        />
      )}

      {showupstoxModal && (
        <UpstoxModal
          isVisible={showupstoxModal}
          onClose={() => setShowupstoxModal(false)}
          setShowupstoxModal={setShowupstoxModal}
          setShowBrokerModal={setOpenTokenExpireModel}
          fetchBrokerStatusModal={fetchBrokerStatusModal}
        />
      )}

      {showangleoneModal && (
        <AngleOneBookingModal
          isVisible={showangleoneModal}
          onClose={() => setShowangleoneModal(false)}
          setShowangleoneModal={setShowangleoneModal}
          setShowBrokerModal={setOpenTokenExpireModel}
          fetchBrokerStatusModal={fetchBrokerStatusModal}
        />
      )}

      {showzerodhamodal && (
        <ZerodhaConnectModal
          isVisible={showzerodhamodal}
          onClose={() => setShowzerodhaModal(false)}
          setShowzerodhaModal={setShowzerodhaModal}
          setShowBrokerModal={setOpenTokenExpireModel}
          fetchBrokerStatusModal={fetchBrokerStatusModal}
        />
      )}

      {showhdfcModal && (
        <HDFCconnectModal
          isVisible={showhdfcModal}
          onClose={() => setShowhdfcModal(false)}
          setShowhdfcModal={setShowhdfcModal}
          setShowBrokerModal={setOpenTokenExpireModel}
          fetchBrokerStatusModal={fetchBrokerStatusModal}
        />
      )}

      {showDhanModal && (
        <DhanConnectModal
          isVisible={showDhanModal}
          onClose={() => setShowDhanModal(false)}
          setShowDhanModal={setShowDhanModal}
          setShowBrokerModal={setOpenTokenExpireModel}
          fetchBrokerStatusModal={fetchBrokerStatusModal}
        />
      )}

      {showAliceblueModal && (
        <AliceBlueConnect
          isVisible={showAliceblueModal}
          showAliceblueModal={showAliceblueModal}
          setShowAliceblueModal={setShowAliceblueModal}
          onClose={() => setShowAliceblueModal(false)}
          setShowBrokerModal={setOpenTokenExpireModel}
          fetchBrokerStatusModal={fetchBrokerStatusModal}
        />
      )}

      {showFyersModal && (
        <FyersConnect
          isVisible={showFyersModal}
          showFyersModal={showFyersModal}
          setShowFyersModal={setShowFyersModal}
          onClose={() => setShowFyersModal(false)}
          setShowBrokerModal={setOpenTokenExpireModel}
          fetchBrokerStatusModal={fetchBrokerStatusModal}
        />
      )}

      {showKotakModal && (
        <KotakModal
          isVisible={showKotakModal}
          onClose={() => setShowKotakModal(false)}
          setShowKotakModal={setShowKotakModal}
          setShowBrokerModal={setOpenTokenExpireModel}
          fetchBrokerStatusModal={fetchBrokerStatusModal}
        />
      )}

      {showMotilalModal && (
        <MotilalModal
          isVisible={showMotilalModal}
          onClose={() => setShowMotilalModal(false)}
          setMotilalModal={setShowMotilalModal}
          setShowBrokerModal={setModalVisible}
          fetchBrokerStatusModal={fetchBrokerStatusModal}
        />
      )}
    </SafeAreaView>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  StockTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
    color: 'black',
  },
  lottie: {
    width: 250,
    height: 250,
    alignSelf: 'center',
    marginTop: 20,
  },
});

export default StockAdvices;
