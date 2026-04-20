import React, { useState, useRef, useEffect } from 'react';

import { getAuth } from '@react-native-firebase/auth';
import axios from 'axios';
import server from '../../utils/serverConfig';
import CryptoJS from 'react-native-crypto-js';
import Config from 'react-native-config';
import { generateToken } from '../../utils/SecurityTokenManager';
import KotakConnectUI from '../../UIComponents/BrokerConnectionUI/KotakConnectUI';
import { useTrade } from '../../screens/TradeContext';
import { getAdvisorSubdomain } from '../../utils/variantHelper';
import eventEmitter from '../EventEmitter';
import useModalStore from '../../GlobalUIModals/modalStore';

const KotakModal = ({
  isVisible,
  onClose,
  onBack,
  fetchBrokerStatusModal,
  setShowBrokerModal,
  setShowKotakModal,
}) => {
  const { configData } = useTrade();
  const showAlert = useModalStore((state) => state.showAlert);
  const [clientCode, setClientCode] = useState('');
  const [showProceedModal, setShowProceedModal] = useState(false);
  const sheet = useRef(null);
  const scrollViewRef = useRef(null);
  const auth = getAuth();
  const user = auth.currentUser;
  const userEmail = user?.email;
  const [selectedOption, setSelectedOption] = useState('Mobile');
  const [consumerKey, setConsumerKey] = useState('');
  const [consumerSecret, setConsumerSecret] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [ucc, setucc] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [password, setPassword] = useState('');
  const [storeResponse, setStoreResponse] = useState(null);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [iskeyVisible, setIskeyVisible] = useState(false);
  const [issecretVisible, setIssecretVisible] = useState(false);
  const [ismpinVisible, setIsmpinVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [openOtpBox, setOpenotpBox] = useState(false);
  const [mpin, setMpin] = useState('');
  const [totp, settotp] = useState('');

  const checkValidApiAnSecret = details => {
    const bytesKey = CryptoJS.AES.encrypt(details, 'ApiKeySecret');
    const Key = bytesKey.toString();
    if (Key) {
      return Key;
    }
  };

  const [userDetails, setUserDetails] = useState();
  const getUserDeatils = () => {
    axios
      .get(`${server.server.baseUrl}api/user/getUser/${userEmail}`, {
        headers: {
          'Content-Type': 'application/json',
          'X-Advisor-Subdomain': configData?.config?.REACT_APP_HEADER_NAME || getAdvisorSubdomain(),
          'aq-encrypted-key': generateToken(
            Config.REACT_APP_AQ_KEYS,
            Config.REACT_APP_AQ_SECRET,
          ),
        },
      })
      .then(res => {
        setUserDetails(res.data.User);
      })
      .catch(err => console.log(err));
  };
  useEffect(() => {
    getUserDeatils();
  }, [userEmail, server.server.baseUrl]);

  // Pre-fill mobile number on reconnect — matches web 933e9a4.
  // Reads from connected_brokers[broker=Kotak].mobileNumber (primary)
  // with fallback to the legacy top-level phone_number field.
  // Strips the '+91' prefix so the <TextInput> only holds 10 digits
  // (updateKotakSecretKey re-adds '+91' before sending to the backend).
  useEffect(() => {
    if (!userDetails) return;
    const kotakSlot = Array.isArray(userDetails.connected_brokers)
      ? userDetails.connected_brokers.find(b => b.broker === 'Kotak')
      : null;
    const saved = kotakSlot?.mobileNumber || userDetails.phone_number || '';
    const digits = String(saved).replace(/^\+91/, '').replace(/\D/g, '');
    if (/^\d{10}$/.test(digits) && !mobileNumber) {
      setMobileNumber(digits);
    }
    // Intentionally depend on userDetails only — don't overwrite user
    // edits in-progress.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userDetails]);

  const userId = userDetails && userDetails._id;

  const [helpVisible, setHelpVisible] = useState(false);
  const OpenHelpModal = () => {
    // console.log('modal:',helpVisible)
    setHelpVisible(true);
  };

  // Egress-IP gate state. `egressReady` is set true by <EgressIpCallout />
  // only when the user has claimed a dedicated IP AND ticked the
  // acknowledgment. `unmetAck` flashes the checkbox red for 2.5s if the
  // user taps Connect without ticking. Matches web behaviour
  // (prod-alphaquark-github/src/Home/BrokerConnection/Kotak/KotakConnection.js).
  const [egressReady, setEgressReady] = useState(false);
  const [unmetAck, setUnmetAck] = useState(false);

  const updateKotakSecretKey = () => {
    if (!egressReady) {
      setUnmetAck(true);
      return;
    }
    setIsLoading(true);

    // Input validation
    if (!/^\d{10}$/.test(mobileNumber)) {
      setIsLoading(false);
      showAlert('error', 'Invalid Mobile Number', 'Please enter a valid 10-digit mobile number.');
      return;
    }

    if (!/^\d{6}$/.test(mpin)) {
      setIsLoading(false);
      showAlert('error', 'Invalid MPIN', 'MPIN should be a 6-digit number.');
      return;
    }

    if (!/^\d{6}$/.test(totp)) {
      setIsLoading(false);
      showAlert('error', 'Invalid TOTP', 'TOTP should be a 6-digit number.');
      return;
    }

    let data = {
      uid: userId,
      apiKey: checkValidApiAnSecret(consumerKey),
      secretKey: checkValidApiAnSecret(consumerSecret),
      mobileNumber: '+91' + mobileNumber,
      mpin: mpin,
      ucc: ucc,
      totp: totp,
    };

    let config = {
      method: 'put',
      url: `${server.server.baseUrl}api/kotak/connect-broker`,
      headers: {
        'Content-Type': 'application/json',
        'X-Advisor-Subdomain': configData?.config?.REACT_APP_HEADER_NAME || getAdvisorSubdomain(),
        'aq-encrypted-key': generateToken(
          Config.REACT_APP_AQ_KEYS,
          Config.REACT_APP_AQ_SECRET,
        ),
      },
      data: JSON.stringify(data),
    };

    axios
      .request(config)
      .then(response => {
        console.log('[Kotak Neo] Broker connected successfully, updating model portfolio...');

        // Update model portfolio with broker information (non-critical)
        let newBrokerData = {
          user_email: userEmail,
          user_broker: 'Kotak Neo',
        };
        let A1_broker = {
          method: 'post',
          url: `${server.ccxtServer.baseUrl}rebalance/change_broker_model_pf`,
          data: JSON.stringify(newBrokerData),
          headers: {
            'Content-Type': 'application/json',
            'X-Advisor-Subdomain': configData?.config?.REACT_APP_HEADER_NAME || getAdvisorSubdomain(),
            'aq-encrypted-key': generateToken(
              Config.REACT_APP_AQ_KEYS,
              Config.REACT_APP_AQ_SECRET,
            ),
          },
        };

        // Execute the model portfolio broker update - catch separately so connection success isn't affected
        return axios.request(A1_broker).catch(err => {
          console.warn('[Kotak Neo] Model portfolio update failed (non-critical):', err);
          return null;
        });
      })
      .then(response => {
        if (response) {
          console.log('[Kotak Neo] Model portfolio updated successfully');
        }
        setIsLoading(false);
        showAlert('success', 'Connected Successfully', 'Your Kotak broker has been connected successfully!');

        fetchBrokerStatusModal();
        eventEmitter.emit('refreshEvent', { source: 'Kotak broker connection' });
        setShowKotakModal(false);
        setShowBrokerModal(false);
      })
      .catch(error => {
        console.log('Connection error:', error);

        const errorMessage =
          error.response?.data?.message ||
          error.response?.data?.details ||
          'Incorrect credentials. Please try again';

        setIsLoading(false);
        showAlert('error', 'Connection Error', errorMessage);
      });
  };

  const submitOtp = () => {
    if (!egressReady) {
      setUnmetAck(true);
      return;
    }
    setIsLoading(true);
    let data = {
      uid: userId,
      apiKey: checkValidApiAnSecret(consumerKey),
      secretKey: checkValidApiAnSecret(consumerSecret),
      jwtToken: storeResponse.access_token,
      password: password,
      sid: storeResponse.sid,
      viewToken: storeResponse.view_token,
    };

    let config = {
      method: 'put',
      url: `${server.server.baseUrl}api/kotak/connect-broker`,

      headers: {
        'Content-Type': 'application/json',
        'X-Advisor-Subdomain': configData?.config?.REACT_APP_HEADER_NAME || getAdvisorSubdomain(),
        'aq-encrypted-key': generateToken(
          Config.REACT_APP_AQ_KEYS,
          Config.REACT_APP_AQ_SECRET,
        ),
      },

      data: JSON.stringify(data),
    };
    console.log('Kotak Data:', JSON.stringify(data));
    axios
      .request(config)
      .then(response => {
        console.log('[Kotak Neo] Broker connected successfully, updating model portfolio...');

        // Update model portfolio with broker information (non-critical)
        let newBrokerData = {
          user_email: userEmail,
          user_broker: 'Kotak Neo',
        };
        let A1_broker = {
          method: 'post',
          url: `${server.ccxtServer.baseUrl}rebalance/change_broker_model_pf`,
          data: JSON.stringify(newBrokerData),
          headers: {
            'Content-Type': 'application/json',
            'X-Advisor-Subdomain': configData?.config?.REACT_APP_HEADER_NAME || getAdvisorSubdomain(),
            'aq-encrypted-key': generateToken(
              Config.REACT_APP_AQ_KEYS,
              Config.REACT_APP_AQ_SECRET,
            ),
          },
        };

        // Execute the model portfolio broker update - catch separately so connection success isn't affected
        return axios.request(A1_broker).catch(err => {
          console.warn('[Kotak Neo] Model portfolio update failed (non-critical):', err);
          return null;
        });
      })
      .then(response => {
        if (response) {
          console.log('[Kotak Neo] Model portfolio updated successfully');
        }
        setIsLoading(false);
        fetchBrokerStatusModal();
        eventEmitter.emit('refreshEvent', { source: 'Kotak broker connection' });
        showAlert('success', 'Connected Successfully', 'Your Kotak broker has been connected successfully!');
        setShowKotakModal(false);
        setShowBrokerModal(false);
      })
      .catch(error => {
        console.log(error);
        setIsLoading(false);
        showAlert('error', 'Incorrect Credentials', 'Please check your credentials and try again.');
      });
  };

  const [shouldRenderContent, setShouldRenderContent] = React.useState(false);
  useEffect(() => {
    if (isVisible) {
      setShouldRenderContent(true);
      sheet.current?.present();
    } else {
      sheet.current?.dismiss();
    }
  }, [isVisible]);

  // Render content for each accordion section

  return (
    <KotakConnectUI
      isVisible={isVisible}
      onClose={onClose}
      helpVisible={helpVisible}
      setHelpVisible={setHelpVisible}
      scrollViewRef={scrollViewRef}
      shouldRenderContent={shouldRenderContent}
      openOtpBox={openOtpBox}
      mpin={mpin}
      setMpin={setMpin}
      totp={totp}
      settotp={settotp}
      mobileNumber={mobileNumber}
      setMobileNumber={setMobileNumber}
      consumerKey={consumerKey}
      setConsumerKey={setConsumerKey}
      consumerSecret={consumerSecret}
      setConsumerSecret={setConsumerSecret}
      ucc={ucc}
      setucc={setucc}
      isPasswordVisible={isPasswordVisible}
      iskeyVisible={iskeyVisible}
      setIskeyVisible={setIskeyVisible}
      issecretVisible={issecretVisible}
      setIssecretVisible={setIssecretVisible}
      ismpinVisible={ismpinVisible}
      setIsmpinVisible={setIsmpinVisible}
      updateKotakSecretKey={updateKotakSecretKey}
      submitOtp={submitOtp}
      OpenHelpModal={OpenHelpModal}
      isLoading={isLoading}
      egressUserId={userId}
      egressUserEmail={userEmail}
      egressReady={egressReady}
      setEgressReady={setEgressReady}
      unmetAck={unmetAck}
      setUnmetAck={setUnmetAck}
      configData={configData}
    />
  );
};

export default KotakModal;
