import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  PanResponder,
} from 'react-native';
import server from '../../utils/serverConfig';
import {getAuth} from '@react-native-firebase/auth';
import axios from 'axios';
import ZerodhaReviewModal from '../ReviewZerodhaTradeModal';
import IIFLReviewTradeModal from '../IIFLReviewTradeModal';
import {
  AlignCenterVertical,
  AlignJustifyIcon,
  ArrowRight,
  ShoppingBag,
} from 'lucide-react-native';
import ReviewTradeModal from '../ReviewTradeModal';
import moment from 'moment';
import Toast from 'react-native-toast-message';
import IsMarketHours from '../../utils/isMarketHours';
import {useCart} from '../CartContext';
import {getLTPForSymbol} from './DynamicText/websocketPrice';
import {getLastKnownPrice} from './DynamicText/websocketPrice';
import eventEmitter from '../EventEmitter';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RecommendationSuccessModal from '../../components/ModelPortfolioComponents/RecommendationSuccessModal';
const {height: screenHeight} = Dimensions.get('window');
import {useTrade} from '../../screens/TradeContext';
import {fetchFunds} from '../../FunctionCall/fetchFunds';
import DdpiModal from '../DdpiModal';
import {DhanTpinModal} from '../DdpiModal';
import {AngleOneTpinModal} from '../DdpiModal';
import {ActivateNowModel} from '../DdpiModal';
import {FyersTpinModal} from '../DdpiModal';
import {OtherBrokerModel} from '../DdpiModal';
import CryptoJS from 'react-native-crypto-js';
import Config from 'react-native-config';
import { useConfig } from '../../context/ConfigContext';
import ICICIUPModal from '../BrokerConnectionModal/icicimodal';
import UpstoxModal from '../BrokerConnectionModal/upstoxModal';
import AngleOneBookingModal from '../BrokerConnectionModal/AngleoneBookingModal';
import ZerodhaConnectModal from '../BrokerConnectionModal/ZerodhaConnectModal';
import HDFCconnectModal from '../BrokerConnectionModal/HDFCconnectModal';
import DhanConnectModal from '../BrokerConnectionModal/DhanConnectModal';
import KotakModal from '../BrokerConnectionModal/KotakModal';
import IIFLModal from '../iiflmodal';
import AliceBlueConnect from '../BrokerConnectionModal/AliceBlueConnect';
import FyersConnect from '../BrokerConnectionModal/FyersConnect';
import {generateToken} from '../../utils/SecurityTokenManager';
import {useModal} from '../ModalContext';
import MotilalModal from '../BrokerConnectionModal/MotilalModal';
import {getAdvisorSubdomain} from '../utils/variantHelper';
import BrokerSelectionModal from '../BrokerSelectionModal';
import TotalAmountTextRebalance from './DynamicText/totalAmountRebalance';
import CartFullAmountText from './DynamicText/CartFullAmountText';
import TotalAmountText from './DynamicText/totalAmount';
const AddToCartModal = ({
  isVisible,
  onClose,
  setsuccessmodel,
  successmodel,
}) => {
  const {hideAddToCartModal, successclosemodel, setsuccessclosemodel} =
    useModal();
  const {
    stockRecoNotExecutedfinal,
    recommendationStockfinal,
    isDatafetching,
    broker,
    getAllTrades,
    funds,
    getAllFunds,
    userDetails,
    getUserDeatils,
    brokerStatus,
    configData,
  } = useTrade();

  // Get dynamic config from API
  const config = useConfig();
  const themeColor = config?.themeColor || '#0056B7';
  const mainColor = config?.mainColor || '#4CAAA0';
  const secondaryColor = config?.secondaryColor || '#F0F0F0';

  const [openReviewTrade, setOpenReviewTrade] = useState(false);
  const [openZerodhaReviewModal, setOpenZerodhaModel] = useState(false);
  const [openSuccessModal, setOpenSucessModal] = useState(false);
  const {setCartCount} = useCart();
  const auth = getAuth();
  const user = auth.currentUser;
  const userEmail = user?.email;
  const [cartItemCount, setCartItemCount] = useState();
  //const [brokerStatus, setBrokerStatus] = useState();

  const [cartItems, setCartItems] = useState([]);
  const [cartCount, setCartCount1] = useState(0);

  const [showIIFLModal, setShowIIFLModal] = useState(false);
  const [showICICIUPModal, setShowICICIUPModal] = useState(false);
  const [showupstoxModal, setShowupstoxModal] = useState(false);
  const [showangleoneModal, setShowangleoneModal] = useState(false);
  const [showzerodhamodal, setShowzerodhaModal] = useState(false);
  const [showhdfcModal, setShowhdfcModal] = useState(false);
  const [showDhanModal, setShowDhanModal] = useState(false);
  const [showKotakModal, setShowKotakModal] = useState(false);
  const [showFyersModal, setShowFyersModal] = useState(false);
  const [showAliceblueModal, setShowAliceblueModal] = useState(false);
  const [showMotilalModal, setShowMotilalModal] = useState(false);

  // console.log('cartOpentdd');
  // Load cart items and count from AsyncStorage when the modal is opened

  const fetchBrokerStatusModal = async () => {
    //setLoading(true);
    if (userEmail) {
      try {
        const response = await axios.get(
          `${server.server.baseUrl}api/user/getUser/${userEmail}`,
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
        const userData = response.data.User;
        getUserDeatils();
        getAllFunds();
        // console.log('corrected');
      } catch (error) {
        //   console.error('Error fetching broker status:', error.response?.data || error.message);
        // setIsBrokerConnected(false); // Handle error by setting default status
      } finally {
        setLoading(false);
      }
    }
  };

  const checkValidApiAnSecret = data => {
    const bytesKey = CryptoJS.AES.decrypt(data, 'ApiKeySecret');
    const Key = bytesKey.toString(CryptoJS.enc.Utf8);
    if (Key) {
      return Key;
    }
  };

  const [translateY] = useState(new Animated.Value(0));
  const handleCartUpdate = async () => {
    const cartData = await AsyncStorage.getItem('cartItems');
    const items = cartData ? JSON.parse(cartData) : [];
    setCartItems(items); // Update cart items state
    setCartCount1(items.length); // Update cart count
  };
  // Handling swipe down to close the modal
  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (event, gestureState) => {
      return gestureState.dy > 50; // Swipe down to close
    },
    onPanResponderMove: (event, gestureState) => {
      if (gestureState.dy > 0) {
        translateY.setValue(gestureState.dy);
      }
    },
    onPanResponderRelease: (event, gestureState) => {
      if (gestureState.dy > 100) {
        onClose(); // Close the modal when swiped down
      } else {
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      }
    },
  });

  const [loading, setLoading] = useState(false);
  const [stockRecoNotExecuted, setStockRecoNotExecuted] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [stockIgnoreId, setStockIgnoreId] = useState(null);
  const [orderPlacementResponse, setOrderPlacementResponse] = useState();
  const [brokerModel, setBrokerModel] = useState(null);

  const zerodhaApiKey = configData?.config?.REACT_APP_ZERODHA_API_KEY;

  const animationRef = useRef(null);

  const [openIIFLReviewModal, setOpenIIFLReviewModel] = useState(false); // Ensure initial value is false
  const [stockDetails, setStockDetails] = useState([]);
  const [recommendationStock, setrecommendationStock] = useState([]);

  // Format the moment object as desired

  const today = new Date();
  const todayDate = moment(today).format('YYYY-MM-DD HH:mm:ss');

  // User Details-

  const dateString = userDetails?.token_expire;
  const expireTokenDate = dateString
    ? moment(dateString).format('YYYY-MM-DD HH:mm:ss')
    : null;
  const clientCode = userDetails && userDetails.clientCode;
  const apiKey = userDetails && userDetails.apiKey;
  const jwtToken = userDetails && userDetails.jwtToken;
  const my2pin = userDetails && userDetails.my2Pin;
  const secretKey = userDetails && userDetails.secretKey;
  const viewToken = userDetails && userDetails?.viewToken;
  const sid = userDetails && userDetails?.sid;
  const serverId = userDetails && userDetails?.serverId;
  const mobileNumber = userDetails && userDetails?.phone_number;
  const panNumber = userDetails && userDetails?.panNumber;
  const userId = userDetails && userDetails._id;
  const [stockloading, setstockloading] = useState(false);
  const [OpenTokenExpireModel, setOpenTokenExpireModel] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  if (!isVisible) return null;

  const fetchCartItems = async () => {
    // console.log('This time  ---------------1');
    try {
      const cartData = await AsyncStorage.getItem('cartItems');
      const items = cartData ? JSON.parse(cartData) : [];
      setCartItems(items);
      setStockDetails(items);
      setCartCount1(items.length);
      console.log('items i get in cart noww-----', items, items.length);
      //setCartCount(items.length);
    } catch (error) {
      console.error(
        'Error fetching cart items:',
        error.response?.data || error.message,
      );
    }
  };

  ///

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

  const angelOneApiKey = configData?.config?.REACT_APP_ANGEL_ONE_API_KEY;
  //fetching edis status for AngleOne

  const verifyEdis = async () => {
    try {
      const response = await axios.post(
        'https://ccxtprod.alphaquark.in/angelone/verify-edis',
        {
          apiKey: angelOneApiKey,
          jwtToken: userDetails.jwtToken,
          userEmail: userDetails?.email,
        },
      );
      setEdisStatus(response.data);
      console.log('AngleOne response', response.data);
    } catch (error) {
      console.error('Error verifying eDIS status:', error);
    }
  };

  const verifyDhanEdis = async () => {
    try {
      const response = await axios.post(
        'https://ccxtprod.alphaquark.in/dhan/edis-status',
        {
          clientId: clientCode,
          accessToken: userDetails.jwtToken,
        },
      );
      console.log('Dhan Reponse', response.data);
      setDhanEdisStatus(response.data);
    } catch (error) {
      console.error('Error verifying eDIS status:', error);
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

  // console.log("broker",broker)

  //

  const getRejectedCount = async () => {
    const rejectedKey = `rejectedCount${broker?.replace(/ /g, '')}`;

    let rejectedCountFromStorage = await AsyncStorage.getItem(rejectedKey);

    // Handle null, undefined, or invalid values (like empty string)
    if (
      !rejectedCountFromStorage ||
      isNaN(parseInt(rejectedCountFromStorage, 10))
    ) {
      console.log('Initializing rejected count to 0...');
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

  //console.log('TYPEEE ITEMSSSS:',types);
  const hasBuy = types.every(type => type === 'BUY');
  const hasSell = types.every(type => type === 'SELL');
  const allSell = hasSell && !hasBuy;
  const allBuy = hasBuy && !hasSell;
  const isMixed = hasSell && hasBuy;
  const handleActivateDDPI = () => {
    setActivateNowModel(false);
  };
  const handleTrade = async () => {
    setTradeClickCount(prevCount => prevCount + 1);

    const isFundsEmpty = funds?.status === 1 || funds?.status === 2 || funds === null;

    const currentBrokerRejectedCount = await getRejectedCount();
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
        setOpenReviewTrade(true);
      } else if (tradeType?.allSell || tradeType?.isMixed) {
        // Handle DDPI modal logic for SELL or mixed trades
        if (
          !userDetails?.ddpi_status ||
          userDetails?.ddpi_status === 'empty' ||
          (!['consent', 'physical'].includes(userDetails?.ddpi_status) &&
            currentBrokerRejectedCount > 0)
        ) {
          setShowDdpiModal(false); // Show DDPI Modal for invalid or missing status
          setOpenReviewTrade(false); // Ensure Zerodha modal is closed
        } else {
          setShowDdpiModal(false); // Hide DDPI Modal
          setOpenReviewTrade(true); // Proceed with Zerodha modal
        }
      } else {
        setOpenReviewTrade(true);
      }
    } else if (broker === 'Angel One') {
      if (edisStatus && edisStatus.edis === true) {
        setOpenReviewTrade(true); // Open review trade modal for all cases
      } else if (
        edisStatus &&
        edisStatus.edis === false &&
        (allSell || isMixed) &&
        currentBrokerRejectedCount > 0
      ) {
        setShowAngleOneTpinModel(true); // Show TPIN modal for invalid edis
      } else {
        setOpenReviewTrade(true);
      }
    } else if (broker === 'Dhan') {
      if (
        Array.isArray(dhanEdisStatus?.data) &&
        dhanEdisStatus?.data.length > 0 &&
        dhanEdisStatus?.data[0].edis === true
      ) {
        setOpenReviewTrade(true); // Open review trade modal for all cases
      } else if (
        Array.isArray(dhanEdisStatus?.data) &&
        dhanEdisStatus?.data.length > 0 &&
        dhanEdisStatus?.data[0].edis === false &&
        (allSell || isMixed) &&
        currentBrokerRejectedCount > 0
      ) {
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
      if (isFundsEmpty) {
        setOpenTokenExpireModel(true);
        return; // Exit as funds are empty
      } else if (brokerStatus === null) {
        setBrokerModel(true);
        return;
      } else {
        setOpenReviewTrade(true);
      }
    }
  };

  const clearCart = async () => {
    try {
      eventEmitter.emit('GetAllTradeReferesh', cartItems);
      //  await AsyncStorage.removeItem('cartItems');
      setCartItems([]); // Clear state
      setStockDetails([]); // Clear stock details
      setCartCount1(0);
      setCartCount(0);
      console.log('Cart cleared successfully!');
    } catch (error) {
      console.error('Failed to clear the cart:', error);
    }
  };

  const [stockTypeAndSymbol, setStockTypeAndSymbol] = useState([]);

  const filterCartAfterOrder = async () => {
    try {
      // Retrieve cartItems from AsyncStorage
      const cartItemsString = await AsyncStorage.getItem('cartItems');

      if (cartItemsString) {
        let cartItems1 = JSON.parse(cartItemsString);

        // Filter out items in stockDetails from cartItems
        const updatedCartItems = cartItems1.filter(
          cartItem =>
            !cartItems.some(
              stockDetail =>
                stockDetail.tradingSymbol === cartItem.tradingSymbol &&
                stockDetail.tradeId === cartItem.tradeId,
            ),
        );

        // Save updated cartItems back to AsyncStorage
        await AsyncStorage.setItem(
          'cartItems',
          JSON.stringify(updatedCartItems),
        );
        setCartItems(updatedCartItems);
        // console.log('Cart items updated after filtering stockDetails');
      } else {
        console.log('No cartItems found in AsyncStorage');
      }
    } catch (error) {
      console.error('Error filtering cart items after order placement:', error);
    }
  };

  const getCartAllStocks = async () => {
    // Start timer before the computation block

    const cartData = await AsyncStorage.getItem('cartItems');
    if (cartData) {
      const parsedCartData = JSON.parse(cartData);
      console.log('Parredeeddddddddddddddddd:', parsedCartData);

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
      console.log('Parsed Cart:', typeAndSymbol);
      // Set stock type and symbol state
      setStockTypeAndSymbol(typeAndSymbol);
    } else {
      // Handle case where cartData is null or empty
      setTypes([]);
      setTradeType({});
      setStockTypeAndSymbol([]);
    }
    return cartData ? JSON.parse(cartData) : [];
  };

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
      console.log('Update portfolio Endpoint---', endpoint);
      const config = {
        method: 'post',
        url: `${server.ccxtServer.baseUrl}${endpoint}/user-portfolio`,

        headers: {
          'Content-Type': 'application/json',
          'X-Advisor-Subdomain': configData?.Config?.REACT_APP_HEADER_NAME,
          'aq-encrypted-key': generateToken(
            Config.REACT_APP_AQ_KEYS,
            Config.REACT_APP_AQ_SECRET,
          ),
        },

        data: JSON.stringify({user_email: userEmail}),
      };

      return await axios.request(config);
    } catch (error) {
      console.error(`Error updating portfolio for ${brokerName}:`, error);
    }
  };

  const showToast = (message1, type, message2) => {
    Toast.show({
      type: type,
      text2: message2 + ' ' + message1,
      position: 'top',
      visibilityTime: 4000, // Duration the toast is visible
      autoHide: true,
      topOffset: 60, // Adjust this value to position the toast
      bottomOffset: 80,
      text1Style: {
        color: 'black',
        fontSize: 12,
        fontWeight: 0,
        fontFamily: 'Poppins-Medium', // Customize your font
      },
      text2Style: {
        color: 'black',
        fontSize: 12,
        fontFamily: 'Poppins-Regular', // Customize your font
      },
    });
  };

  const [basketData, setBasketData] = useState([]);

  const [isReturningFromOtherBrokerModal, setIsReturningFromOtherBrokerModal] =
    useState(false);
  const placeOrder = async cartItems => {
    setLoading(true);

    const getOrderPayload = () => {
      const basePayload = {
        trades: cartItems,
        user_broker: broker, // Add user_broker to identify the broker
      };

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
        case 'Groww':
          return {...basePayload, jwtToken};
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
          return {...basePayload, apiKey, secretKey, jwtToken};

        default:
          return {
            ...basePayload,
            apiKey,
            jwtToken,
          };
      }
    };
    const allBuy = cartItems.every(stock => stock.transactionType === 'BUY');
    const allSell = cartItems.every(stock => stock.transactionType === 'SELL');
    const isMixed = !allBuy && !allSell;
    const specialBrokers = [
      // "Dhan",
      'IIFL Securities',
      'ICICI Direct',
      'Upstox',
      'Kotak',
      'Hdfc Securities',
      'AliceBlue',
          "Motilal Oswal",
      "Groww",
    ];

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

    const allFNO = cartItems.every(
      item => item.exchange === 'NFO' || item.exchange === 'BFO',
    );
    console.log('i am here broooo---', allFNO);
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
        url: `${server.server.baseUrl}api/process-trades/order-place`, //`${server.server.baseUrl}api/process-trades/order-place`,

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

      // setOpenSucessModal(true);
      console.log('respoiiinsi:', response.data.response);
      setOrderPlacementResponse(response.data.response);
      // setShowAfterPlaceOrderDdpiModal(true)
      // Calculate the rejected sell count from the response

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
        await AsyncStorage.setItem('cartItems', JSON.stringify([])),
        await clearCart(),
        //  handleCartUpdate(),

        //setStockDetails([]),
        // setCartItems([]),
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
      Toast.show({
        type: 'error',
        text1: 'Failed',
        text2:
          'There was an issue in placing the trade, please try again after sometime or contact your advisor',
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

  const [mbasket, setmbasket] = useState(null);

  const appURL = 'test';
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
      await axios.put(
        `${server.server.baseUrl}api/zerodha/update-trade-reco`,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Advisor-Subdomain': Config.REACT_APP_HEADER_NAME,
            'aq-encrypted-key': generateToken(
              Config.REACT_APP_AQ_KEYS,
              Config.REACT_APP_AQ_SECRET,
            ),
          },
        },
        {
          stockDetails: stockDetails,
          leaving_datetime: currentISTDateTime,
        },
      );

      // Generate HTML form content
      const htmlContent = generateHtmlForm(basket, apiKey);
      setHtmlContent(htmlContent);
      // Inject the HTML form into WebView
    } catch (error) {
      console.error('Failed to update trade recommendation:', error);
    }
  };

  const [zerodhaRequestType, setZerodhaRequestType] = useState(null);
  const [zerodhaStatus, setZerodhaStatus] = useState(null);

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
          'X-Advisor-Subdomain': Config.REACT_APP_HEADER_NAME,
          'aq-encrypted-key': generateToken(
            Config.REACT_APP_AQ_KEYS,
            Config.REACT_APP_AQ_SECRET,
          ),
        },

        data: data,
      };

      try {
        const response = await axios.request(config);
        setOpenSucessModal(true);
        setOrderPlacementResponse(response.data.response);
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

  const totalAmount = 0;

  const [openRebalanceModal, setOpenRebalanceModal] = useState(false);
  const [calculatedPortfolioData, setCaluculatedPortfolioData] = useState(null);
  const [modelPortfolioModelId, setModelPortfolioModelId] = useState('');
  const [storeModalName, setStoreModalName] = useState('');
  // Function to handle closing
  const handleCloseDdpiModal = () => {
    setShowDdpiModal(false); // Or toggle the state as per your logic
  };
  const openReviewModal = () => {
    setOpenReviewTrade(true); // Or toggle the state as per your logic
  };

  const handleConnectAndPlaceOrder = async cartItems => {
    if (
      brokerStatus === undefined ||
      brokerStatus !== 'connected' ||
      brokerStatus === 'Disconnected'
    ) {
      setModalVisible(true);
      return;
    } else if (funds.status === false || funds.status === 1) {
      setOpenReviewTrade(false);
      setOpenZerodhaModel(false);
      setOpenTokenExpireModel(true);
    } else {
      // If status is not false or 1, you can directly place the order or show some message
      placeOrder(cartItems);
    }
  };

  ////////

  useEffect(() => {
    // Function to reload the cart when the 'cartUpdated' eventcartUpdated is emitted
    const handleCartUpdate = async () => {
      const cartData = await AsyncStorage.getItem('cartItems');
      const items = cartData ? JSON.parse(cartData) : [];
      setCartItems(items); // Update cart items state
      setCartCount1(items.length); // Update cart count
    };

    // Add event listener for 'cartUpdated' event
    eventEmitter.on('cartUpdated', handleCartUpdate);
    // Cleanup the event listener when the component unmounts
    return () => {
      eventEmitter.off('cartUpdated', handleCartUpdate);
    };
  }, []);

  useEffect(() => {
    fetchCartItems();
  }, []); // Corrected to use an empty dependency array

  useEffect(() => {
    if (userDetails && userDetails.user_broker === 'Angel One') {
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
            'https://ccxtprod.alphaquark.in/zerodha/save-ddpi-status',
            {
              apiKey: zerodhaApiKey,
              accessToken: userDetails.jwtToken,
              userEmail: userDetails.email,
            },
          );
          setZerodhaDdpiStatus(response.data);
        } catch (error) {
          console.error('Error verifying eDIS status:', error);
        }
      };

      verifyZerodhaDdpi();
    }
  }, [userDetails]);

  useEffect(() => {
    if (userDetails && userDetails.user_broker === 'Zerodha') {
      const verifyZerodhaEdis = async () => {
        try {
          const response = await axios.post(
            'https://ccxtprod.alphaquark.in/zerodha/save-edis-status',
            {
              userEmail: userDetails.email,
              edis: userDetails.edis,
            },
          );
          setZerodhaDdpiStatus(response.data);
        } catch (error) {
          console.error('Error verifying eDIS status:', error);
        }
      };

      verifyZerodhaEdis();
    }
  }, [userDetails]);

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
    getCartAllStocks();
  }, []);

  useEffect(() => {
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
    if (
      zerodhaStatus !== null &&
      zerodhaRequestType === 'basket' &&
      jwtToken !== undefined
    ) {
      checkZerodhaStatus();
    }
  }, [zerodhaStatus, zerodhaRequestType, userEmail, jwtToken]);
 

  return (
    <View style={styles.container}>
      <View style={styles.divider} />
      <View style={styles.middleSection}>
        <View style={styles.itemInfo}>
          <Text>
            <Text
              style={{fontFamily: 'Satoshi-Bold', fontSize: 16, color: '#000'}}>
              {cartCount}
            </Text>
            <Text style={styles.itemText}> Stocks | </Text>
              <TotalAmountText
                  stockDetails={cartItems}
                  type={'reviewTrade'}
                />
          </Text>
        </View>
        <TouchableOpacity onPress={handleTrade} style={styles.cartButton}>
          <Text style={styles.cartButtonText}>View Cart</Text>
        </TouchableOpacity>
      </View>

      {openZerodhaReviewModal && (
        <ZerodhaReviewModal
          isVisible={openZerodhaReviewModal}
          onClose={() => setOpenZerodhaModel(false)}
          stockDetails={cartItems}
          setOpenZerodhaModel={setOpenZerodhaModel}
          mbasket={mbasket}
          htmlContent={htmlContentfinal}
          appURL={appURL}
          loading={loading}
          getAllTrades={getAllTrades}
          zerodhaApiKey={zerodhaApiKey}
          userEmail={userEmail}
          userDetails={userDetails}
          filterCartAfterOrder={filterCartAfterOrder}
          getCartAllStocks={getCartAllStocks}
          updatePortfolioData={updatePortfolioData}
          broker={broker}
          setCartCount={setCartCount}
          setOpenSucessModal={setOpenSucessModal}
          setOrderPlacementResponse={setOrderPlacementResponse}
          setStockDetails={setCartItems}
          clearCart={clearCart}
        />
      )}

      {openReviewTrade && (
        <ReviewTradeModal
          isVisible={openReviewTrade}
          onClose={() => setOpenReviewTrade(false)}
          stockDetails={cartItems}
          basketData={basketData}
          setBasketData={setBasketData}
          placeOrder={handleConnectAndPlaceOrder}
          loading={loading}
          getCartAllStocks={getCartAllStocks}
          cartCount={cartCount}
          setStockDetails={setCartItems}
        />
      )}

      {openSuccessModal && (
        <RecommendationSuccessModal
          openSuccessModal={openSuccessModal}
          setOpenSucessModal={setOpenSucessModal}
          orderPlacementResponse={orderPlacementResponse}
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

      {showActivateNowModel && (
        <ActivateNowModel
          isOpen={showActivateNowModel}
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
          openReviewModal={openReviewModal}
          setOpenReviewTrade={setOpenReviewTrade}
          setActivateNowModel={setActivateNowModel}
          userEmail={userEmail}
          apiKey={apiKey}
          jwtToken={jwtToken}
          secretKey={secretKey}
          clientCode={clientCode}
          broker={broker}
          sid={sid}
          viewToken={viewToken}
          serverId={serverId}
          setOpenRebalanceModal={setOpenRebalanceModal}
          setCaluculatedPortfolioData={setCaluculatedPortfolioData}
          setModelPortfolioModelId={setModelPortfolioModelId}
          modelPortfolioModelId={modelPortfolioModelId}
          setStoreModalName={setStoreModalName}
          storeModalName={storeModalName}
          funds={funds}
        />
      )}

      {(modalVisible || OpenTokenExpireModel) && (
        <BrokerSelectionModal
          showBrokerModal={modalVisible}
          OpenTokenExpireModel={OpenTokenExpireModel}
          setShowBrokerModal={setModalVisible}
          setOpenTokenExpireModel={setOpenTokenExpireModel}
          fetchBrokerStatusModal={fetchBrokerStatusModal}
        />
      )}
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    justifyContent: 'flex-end',
    backgroundColor: '#fff',
    borderTopRightRadius: 20,
    borderTopLeftRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginTop: 10,
    //  elevation:10,
    //  shadowColor:'black'
  },
  topSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  horizontal: {
    marginBottom: 20,
    borderRadius: 250,
    alignSelf: 'center',
  },
  deliveryText: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: '#000',
  },
  divider: {
    borderRadius: 20,
    marginVertical: 0,
    position: 'absolute',
    //  top: screenHeight*0.84, // Adjust as needed
    //  left: 0,
    // right: 0,
    justifyContent: 'center',
    zIndex: 0,
  },
  middleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    //marginTop:5,
    // borderWidth:1,
    alignContent: 'center',
    alignSelf: 'center',
    //  marginVertical:0,
  },
  itemInfo: {
    flex: 1,
  },
  itemText: {
    fontSize: 16,
    color: '#000',
    fontFamily: 'Satoshi-Medium',
  },
  cartButton: {
    backgroundColor: '#fff',
    paddingVertical: 4,
    alignItems: 'center',

    // paddingHorizontal: 10,
    flexDirection: 'row',
    paddingHorizontal: 15,
    justifyContent: 'space-between',
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#000',
  },
  cartButtonText: {
    color: '#000',
    fontSize: 14,
    marginRight: 15,
    fontFamily: 'Satoshi-Bold',
  },
});

export default AddToCartModal;
