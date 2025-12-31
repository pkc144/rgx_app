import React, {useState, useEffect, useRef} from 'react';
import {View, Text, StyleSheet, ActivityIndicator} from 'react-native';
import axios from 'axios';
import server from '../../utils/serverConfig';

import RebalanceAdviceContent from '../AdviceScreenComponents/RebalanceAdviceContent';

import {getAuth} from '@react-native-firebase/auth';

import CryptoJS from 'react-native-crypto-js';
import IIFLReviewTradeModal from '../IIFLReviewTradeModal';

import moment from 'moment';
import Config from 'react-native-config';
import {generateToken} from '../../utils/SecurityTokenManager';

import eventEmitter from '../EventEmitter';
import BrokerSelectionModal from '../BrokerSelectionModal';

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
import {useTrade} from '../../screens/TradeContext';
import RebalanceModal from './RebalanceModal';
import RecommendationSuccessModal from '../ModelPortfolioComponents/RecommendationSuccessModal';
import MPStatusModal from './MPStatusModal';
import {getAdvisorSubdomain} from '../../utils/variantHelper';
import CommonInformationModal from './RepairConfimationModal';

const RebalanceAdvices = React.memo(({userEmail, orderscreen, type}) => {
  const [loading, setLoading] = useState(false);
  const [isDatafetching, setisDatafetching] = useState(true);
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
  const {
    modelPortfolioStrategyfinal,
    getModelPortfolioStrategyDetails,
    isDatafetchinMP,
    funds,
    getAllFunds,
    broker,
    brokerStatus,
    userDetails,
    getUserDeatils,
    configData,
  } = useTrade();

  const clientCode = userDetails && userDetails.clientCode;
  const apiKey = userDetails && userDetails.apiKey;
  const jwtToken = userDetails && userDetails.jwtToken;
  const secretKey = userDetails && userDetails.secretKey;
  const viewToken = userDetails && userDetails?.viewToken;
  const sid = userDetails && userDetails?.sid;
  const serverId = userDetails && userDetails?.serverId;

  const [showDdpiModal, setShowDdpiModal] = useState(false);
  const [showActivateNowModel, setActivateNowModel] = useState(false);
  const [showAngleOneTpinModel, setShowAngleOneTpinModel] = useState(false);

  const [edisStatus, setEdisStatus] = useState(null);
  const [dhanEdisStatus, setDhanEdisStatus] = useState(null);

  const [showDhanTpinModel, setShowDhanTpinModel] = useState(false);
  const [showOtherBrokerModel, setShowOtherBrokerModel] = useState(false);

  const [showFyersTpinModal, setShowFyersTpinModal] = useState(false);
  const [OpenTokenExpireModel, setOpenTokenExpireModel] = useState(false);
  const [modelPortfolioStrategy, setModelPortfolioStrategy] = useState([]);
  const [openSuccessModal, setOpenSucessModal] = useState(null);
  const [repairMessageModal, setRepairmessageModal] = useState(false);
  const [selectNonBroker, setSelectNonBroker] = useState(false);
  useEffect(() => {
    if (modelPortfolioStrategyfinal) {
      setModelPortfolioStrategy(modelPortfolioStrategyfinal);
    }
  }, [modelPortfolioStrategyfinal]);

  useEffect(() => {
    // Function to handle refresh
    const handleRefresh = data => {
      getModelPortfolioStrategyDetails();
    };

    // Subscribe to the refresh event
    eventEmitter.on('refreshEvent', handleRefresh);
    // Cleanup subscription on unmount
    return () => {
      eventEmitter.removeListener('refreshEvent', handleRefresh);
    };
  }, []);

  const [isReturningFromOtherBrokerModal, setIsReturningFromOtherBrokerModal] =
    useState(false);
  const [calculatedPortfolioData, setCalculatedPortfolioData] = useState([]);
  const [openRebalanceModal, setOpenRebalanceModal] = useState(false);
  const [modelPortfolioModelId, setModelPortfolioModelId] = useState();
  const [storeModalName, setStoreModalName] = useState();
  const modelNames = modelPortfolioStrategy?.map(item => item?.model_name);

  const [OrderPlacementResponse, setOrderPlacementResponse] = useState(null);

  const [tradeType, setTradeType] = useState({
    allSell: false,
    allBuy: false,
    isMixed: false,
  });

  const [modelPortfolioRepairTrades, setModelPortfolioRepairTrades] = useState(
    [],
  );
  const getRebalanceRepair = () => {
    let repairData = JSON.stringify({
      modelName: modelNames,
      advisor: modelPortfolioStrategy[0]['advisor'],
      userEmail: userEmail,
      userBroker: broker,
    });
    let config2 = {
      method: 'post',
      url: `${server.ccxtServer.baseUrl}rebalance/get-repair`,

      headers: {
        'Content-Type': 'application/json',
        'X-Advisor-Subdomain': configData?.config?.REACT_APP_HEADER_NAME,
        'aq-encrypted-key': generateToken(
          Config.REACT_APP_AQ_KEYS,
          Config.REACT_APP_AQ_SECRET,
        ),
      },

      data: repairData,
    };
    axios
      .request(config2)
      .then(response => {
        setModelPortfolioRepairTrades(response.data.models);
      })
      .catch(error => {
        console.log(error);
      });
  };
  // console.log("Broker value being sent:", broker);
  useEffect(() => {
    if (modelPortfolioStrategy.length !== 0) {
      getRebalanceRepair();
    }
  }, [modelPortfolioStrategy]);

  const checkValidApiAnSecret = data => {
    const bytesKey = CryptoJS.AES.decrypt(data, 'ApiKeySecret');
    const Key = bytesKey.toString(CryptoJS.enc.Utf8);
    if (Key) {
      return Key;
    }
  };

  // zerodha start
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
        getUserDeatils();
        eventEmitter.emit('triggerGetAllFunds');
      } catch (error) {
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    getModelPortfolioStrategyDetails();
  }, []);
  const [modalVisible, setModalVisible1] = useState(false);
  const [isRebalModalVisible, setRebalModalVisible] = useState(false);
  const [brokerModel, setBrokerModel] = useState(null);

  const openRebalModal = () => {
    setRebalModalVisible(true);
  };

  // Add this function inside your component
  // Modified getUserExecution function
  const getUserExecution = (portfolioArray, userEmail, modalName) => {
    // Find the specific portfolio item that matches the modal name
    const matchingPortfolioItem = portfolioArray?.find(
      item => item?.model_name === modalName,
    );

    if (!matchingPortfolioItem) {
      return null;
    }

    const allRebalances = matchingPortfolioItem?.model?.rebalanceHistory || [];

    const sortedRebalances = allRebalances?.sort(
      (a, b) => new Date(b.rebalanceDate) - new Date(a.rebalanceDate),
    );
    const latest = sortedRebalances[0];

    if (!latest) return null;

    const userExecution = latest?.subscriberExecutions?.find(
      execution => execution?.user_email === userEmail,
    );

    return {userExecution, latest, matchingPortfolioItem};
  };
  const [matchfailed, setmatchfailed] = useState(null);
  const [showstatusModal, setShowstatusModal] = useState(false);
  const [stockDataForModal, setStockDataForModal] = useState([]);
  // console.log('store Modal Name-------------', storeModalName);
  const handleAcceptRebalanceWithoutBroker = async () => {
    console.log('\n🚀 ============ CONTINUE WITHOUT BROKER ============');
    console.log('📧 User Email:', userEmail);
    console.log('📊 Model Name:', storeModalName);

    setStoreModalName(storeModalName);

    try {
      const apiUrl = `${server.ccxtServer.baseUrl}rebalance/user-portfolio/latest/${userEmail}/${storeModalName}`;
      console.log('🌐 API URL:', apiUrl);
      console.log('⏳ Making API call...');

      const response = await axios.get(
        apiUrl,
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

      console.log('✅ API Response received');
      console.log('📦 Response Status:', response.status);
      console.log('📦 Response Data:', JSON.stringify(response.data, null, 2));

      const orderResults =
        response.data?.data?.user_net_pf_model?.order_results || [];

      console.log('📊 Order Results Count:', orderResults.length);
      console.log('📊 Order Results:', orderResults);

      // setApiResponseData(response.data);
      setStoreModalName(storeModalName);
      setStockDataForModal(orderResults);

      console.log('✅ Closing broker modal...');
      setBrokerModel(false);

      console.log('✅ Opening status modal...');
      setShowstatusModal(true);

      console.log('============================================\n');
    } catch (error) {
      console.error('\n❌ ============ CONTINUE WITHOUT BROKER ERROR ============');
      console.error('Error Type:', error.name);
      console.error('Error Message:', error.message);

      if (error.response) {
        console.error('📦 Response Status:', error.response.status);
        console.error('📦 Response Data:', error.response.data);
        console.error('📦 Response Headers:', error.response.headers);
      } else if (error.request) {
        console.error('📦 No response received');
        console.error('Request:', error.request);
      } else {
        console.error('📦 Request setup error');
      }

      console.error('Error Stack:', error.stack);
      console.error('============================================\n');
    }
  };

  const handleCheckStatus = async () => {
    try {
      const response = await axios.get(
        `${server.ccxtServer.baseUrl}rebalance/user-portfolio/latest/${userEmail}/${modelName}`,
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
      const orderResults =
        response.data?.data?.user_net_pf_model?.order_results || [];
      setApiResponseData(response.data);
      setStockDataForModal(orderResults);
    } catch (error) {
      setShowstatusModal(true);
      console.error('Error fetching stock data:', error);
    }
    setShowstatusModal(true);
  };

  const handleSendUpdatedResponse = () => {
    if (latestUpdatedResponse) {
      sendUpdatedOrderResultsToAPI(latestUpdatedResponse);
    } else {
      console.warn('No updated response data available to send.');
    }
  };

  const sendUpdatedOrderResultsToAPI = async data => {
    try {
      const response = await axios.put(
        `${server.ccxtServer.baseUrl}rebalance/update/user-portfolio/latest`,
        data,
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
      handleAcceptRebalance();
    } catch (error) {
      console.error(
        'API update failed:',
        error.response?.data || error.message,
      );
    }
  };

  const [apiResponseData, setApiResponseData] = useState(null);
  const [latestUpdatedResponse, setLatestUpdatedResponse] = useState(null);

  const handleStockListUpdate = updatedOrderResultsList => {
    setApiResponseData(currentApiResponse => {
      if (!currentApiResponse?.data?.user_net_pf_model) {
        console.error(
          'Cannot update state: Current API response data is missing or incomplete.',
        );
        return currentApiResponse;
      }
      const updatedResponse = JSON.parse(JSON.stringify(currentApiResponse));
      updatedResponse.data.user_net_pf_model.order_results =
        updatedOrderResultsList;
      updatedResponse.data.user_email = userEmail;
      setLatestUpdatedResponse(updatedResponse);
      return updatedResponse;
    });
  };

    const [userExecution, setuserExecution] = useState();
    const [matchingFailedTrades, setmatchingFailedTrades] = useState();
  const [RebalanceExecutionStatus,setRebalanceExecutionStatus]=useState();
  const [latestRebalanceData, setLatestRebalanceData] = useState();
  const [StockTypeAndSymbol,setStockTypeAndSymbol]=useState();
  const [modelObjectId,setModelObjectId]=useState();
const angelOneApiKey = configData?.config?.REACT_APP_ANGEL_ONE_API_KEY;

  const handleAcceptRebalance = () => {
    setStoreModalName(storeModalName);
    setRebalanceExecutionStatus(userExecution?.status);
    setLoading(true);
    if (
      (funds?.status === 1 || funds?.status === 2 || funds === null) &&
      brokerStatus === "connected"
    ) {
      setOpenTokenExpireModel(true);
      setLoading(false);
    } else if ((matchingFailedTrades ? "repair" : null) && userExecution?.status !== "toExecute") {
      if (matchingFailedTrades !== undefined) {
        const { failedTrades } = matchingFailedTrades;
        const updatedStockTypeAndSymbol = failedTrades?.map((trade) => ({
          Symbol: trade.advSymbol,
          Type: trade.transactionType, // Already either 'BUY' or 'SELL'
          Exchange: trade.advExchange,
          Quantity: trade.advQTY,
        }));

        // Update the state
        setStockTypeAndSymbol(updatedStockTypeAndSymbol);
      }

      setOpenRebalanceModal(true);
      setStoreModalName(storeModalName);
      setModelObjectId(modelPortfolioModelId);
      setLoading(false);
    } else {

      let payload = {
        userEmail: userEmail,
        userBroker: broker ? broker : "DummyBroker",
        modelName: storeModalName,
        advisor: configData?.config?.REACT_APP_ADVISOR_TAG,
        model_id: modelPortfolioModelId,
        userFund: funds?.data?.availablecash ? funds?.data?.availablecash : "0",
        flag: selectedOption === "option1" ? 1 : 0,
      };
      if (broker === "IIFL Securities") {
        payload = {
          ...payload,
          clientCode: clientCode,
        };
      } else if (broker === "ICICI Direct") {
        payload = {
          ...payload,
          apiKey: checkValidApiAnSecret(apiKey),
          secretKey: checkValidApiAnSecret(secretKey),
          accessToken: jwtToken,
        };
      } else if (broker === "Upstox") {
        payload = {
          ...payload,
          apiKey: checkValidApiAnSecret(apiKey),
          apiSecret: checkValidApiAnSecret(secretKey),
          accessToken: jwtToken,
        };
      } else if (broker === "Angel One") {
        payload = {
          ...payload,
          apiKey: angelOneApiKey,
          jwtToken: jwtToken,
        };
      } else if (broker === "Zerodha") {
        payload = {
          ...payload,
          apiKey: checkValidApiAnSecret(apiKey),
          SecretKey: checkValidApiAnSecret(secretKey),
          accessToken: jwtToken,
        };
      } else if (broker === "Dhan") {
        payload = {
          ...payload,
          clientId: clientCode,
          accessToken: jwtToken,
        };
      } else if (broker === "Groww") {
        payload = {
          ...payload,
          accessToken: jwtToken,
        };
      } else if (broker === "Hdfc Securities") {
        payload = {
          ...payload,
          apiKey: checkValidApiAnSecret(apiKey),
          accessToken: jwtToken,
        };
      } else if (broker === "Kotak") {
        payload = {
          ...payload,
          consumerKey: checkValidApiAnSecret(apiKey),
          consumerSecret: checkValidApiAnSecret(secretKey),
          accessToken: jwtToken,
          viewToken: viewToken,
          sid: sid,
          serverId: serverId,
        };
      } else if (broker === "AliceBlue") {
        payload = {
          ...payload,
          clientId: clientCode,
          accessToken: jwtToken,
          apiKey: apiKey,
        };
      } else if (broker === "Fyers") {
        payload = {
          ...payload,
          clientId: clientCode,
          accessToken: jwtToken,
        };
      } else if (broker === "Motilal Oswal") {
        payload = {
          ...payload,
          clientCode: clientCode,
          accessToken: jwtToken,
          apiKey: checkValidApiAnSecret(apiKey),
        };
      }
      let config = {
        method: "post",
        url: `${server.ccxtServer.baseUrl}rebalance/calculate`,
        data: JSON.stringify(payload),
        headers: {
          "Content-Type": "application/json",
          "X-Advisor-Subdomain": configData?.config?.REACT_APP_HEADER_NAME,
          "aq-encrypted-key": generateToken(
            Config.REACT_APP_AQ_KEYS,
            Config.REACT_APP_AQ_SECRET
          ),
        },
      };
      axios
        .request(config)
        .then((response) => {
          const { buy, sell } = response.data;

          const updatedStockTypeAndSymbol = [
            ...buy.map((item) => ({
              Symbol: item.symbol,
              Type: "BUY",
              Exchange: item.exchange,
              Quantity: item.quantity,
            })),
            ...sell.map((item) => ({
              Symbol: item.symbol,
              Type: "SELL",
              Exchange: item.exchange,
              Quantity: item.quantity,
            })),
          ];

          setStockTypeAndSymbol(updatedStockTypeAndSymbol);
          setLoading(false);
          setCalculatedPortfolioData(response.data);
          console.log("Here response data",response.data);
          setOpenRebalanceModal(true);
          setStoreModalName(storeModalName);
          setModelObjectId(modelId);
        })
        .catch((error) => {
          console.log(error);
          console.log("Here error",error.response);
          setLoading(false);
        });
    }
  };

  const stepsData = [
    {label: 'Rebalance Preference'},
    {label: 'Current holdings'},
    {label: 'Final Rebalance'},
  ];
  const [selectedOption, setSelectedOption] = useState('option1');
  const [currentStep, setCurrentStep] = useState(1);

  return (
    <View style={styles.container}>
      <RebalanceAdviceContent
        type={type}
        isDatafetching={isDatafetching}
        onOpenRebalModal={openRebalModal}
        orderscreen={orderscreen}
        loading={loading}
        userEmail={userEmail}
        setmatchfailed={setmatchfailed}
        setBrokerModel={setBrokerModel}
        brokerModel={brokerModel}
        setOpenTokenExpireModel={setOpenTokenExpireModel}
        calculatedPortfolioData={calculatedPortfolioData}
        setCalculatedPortfolioData={setCalculatedPortfolioData}
        openRebalanceModal={openRebalanceModal}
        setOpenRebalanceModal={setOpenRebalanceModal}
        modelPortfolioStrategy={modelPortfolioStrategy}
        setModelPortfolioStrategy={setModelPortfolioStrategy}
        modelPortfolioModelId={modelPortfolioModelId}
        setModelPortfolioModelId={setModelPortfolioModelId}
        modelPortfolioRepairTrades={modelPortfolioRepairTrades}
        setModelPortfolioRepairTrades={setModelPortfolioRepairTrades}
        storeModalName={storeModalName}
        setStoreModalName={setStoreModalName}
        getRebalanceRepair={getRebalanceRepair}
        isReturningFromOtherBrokerModal={isReturningFromOtherBrokerModal}
        setIsReturningFromOtherBrokerModal={setIsReturningFromOtherBrokerModal}
        OrderPlacementResponse={OrderPlacementResponse}
        setOrderPlacementResponse={setOrderPlacementResponse}
        showFyersTpinModal={showFyersTpinModal}
        setShowFyersTpinModal={setShowFyersTpinModal}
        openSuccessModal={openSuccessModal}
        setOpenSucessModal={setOpenSucessModal}
        showDdpiModal={showDdpiModal}
        setShowDdpiModal={setShowDdpiModal}
        showActivateNowModel={showActivateNowModel}
        setActivateNowModel={setActivateNowModel}
        showAngleOneTpinModel={showAngleOneTpinModel}
        setShowAngleOneTpinModel={setShowAngleOneTpinModel}
        showDhanTpinModel={showDhanTpinModel}
        setShowDhanTpinModel={setShowDhanTpinModel}
        showOtherBrokerModel={showOtherBrokerModel}
        setShowOtherBrokerModel={setShowOtherBrokerModel}
        tradeType={tradeType}
        setTradeType={setTradeType}
        edisStatus={edisStatus}
        setEdisStatus={setEdisStatus}
        dhanEdisStatus={dhanEdisStatus}
        setDhanEdisStatus={setDhanEdisStatus}
        selectNonBroker={selectNonBroker}
        setSelectNonBroker={setSelectNonBroker}
        showstatusModal={showstatusModal}
        setShowstatusModal={setShowstatusModal}
        stockDataForModal={stockDataForModal}
        setStockDataForModal={setStockDataForModal}
        setLatestRebalanceData={setLatestRebalanceData}
        setuserExecution={setuserExecution}
        setmatchingFailedTrades={setmatchingFailedTrades}
        setRepairmessageModal={setRepairmessageModal}
      />

      {(brokerModel || OpenTokenExpireModel) && (
        <BrokerSelectionModal
          showBrokerModal={brokerModel}
          OpenTokenExpireModel={OpenTokenExpireModel}
          setShowBrokerModal={setBrokerModel}
          setOpenTokenExpireModel={setOpenTokenExpireModel}
          fetchBrokerStatusModal={fetchBrokerStatusModal}
          withoutBroker={false}
          handleAcceptRebalance={() => console.log('...')}
          handleAcceptRebalanceWithoutBroker={
            handleAcceptRebalanceWithoutBroker
          }
        />
      )}

      {openRebalanceModal ? (
        //   console.log('kokkk'),
        <RebalanceModal
          userEmail={userEmail}
          visible={openRebalanceModal}
          setOpenRebalanceModal={setOpenRebalanceModal}
          data={modelPortfolioStrategy}
          calculatedPortfolioData={calculatedPortfolioData}
          broker={broker}
          apiKey={apiKey}
          userDetails={userDetails}
          jwtToken={jwtToken}
          secretKey={secretKey}
          clientCode={clientCode}
          sid={sid}
          setShowFyersTpinModal={setShowFyersTpinModal}
          viewToken={viewToken}
          serverId={serverId}
          setBrokerModel={setBrokerModel}
          setOpenSucessModal={setOpenSucessModal}
          setOrderPlacementResponse={setOrderPlacementResponse}
          modelPortfolioModelId={modelPortfolioModelId}
          setOpenTokenExpireModel={setOpenTokenExpireModel}
          modelPortfolioRepairTrades={modelPortfolioRepairTrades}
          getRebalanceRepair={getRebalanceRepair}
          storeModalName={storeModalName}
          setIsReturningFromOtherBrokerModal={
            setIsReturningFromOtherBrokerModal
          }
          isReturningFromOtherBrokerModal={isReturningFromOtherBrokerModal}
          funds={funds}
          getModelPortfolioStrategyDetails={getModelPortfolioStrategyDetails}
          setShowOtherBrokerModel={setShowOtherBrokerModel}
          setShowDhanTpinModel={setShowDhanTpinModel}
          setShowAngleOneTpinModel={setShowAngleOneTpinModel}
          tradeType={tradeType}
          edisStatus={edisStatus}
          dhanEdisStatus={dhanEdisStatus}
          selectNonBroker={selectNonBroker}
          setShowDdpiModal={setShowDdpiModal}
          rebalanceExecutionStatus={RebalanceExecutionStatus}
          setModelPortfolioModelId={setModelPortfolioModelId}
        />
      ) : null}

      {openSuccessModal && (
        <RecommendationSuccessModal
          openSuccessModal={openSuccessModal}
          setOpenSucessModal={setOpenSucessModal}
          orderPlacementResponse={OrderPlacementResponse}
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

      {showstatusModal ? (
        <MPStatusModal
          isOpen={showstatusModal}
          onClose={() => setShowstatusModal(false)}
          stockData={stockDataForModal}
          onModeSelect={handleCheckStatus}
          onUpdateStockList={handleStockListUpdate}
          handleSendUpdatedResponse={handleSendUpdatedResponse}
          userbroker={broker}
          handleAcceptRebalance={handleAcceptRebalance}
          userEmail={userEmail}
          modelName={storeModalName}
          currentStep={currentStep}
          stepsData={stepsData}
          setCurrentStep={setCurrentStep}
          brokerStatus={brokerStatus}
        />
      ) : null}


         <CommonInformationModal
        openModal={repairMessageModal}
        setCloseModal={setRepairmessageModal}
      />
    </View>
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

export default RebalanceAdvices;
