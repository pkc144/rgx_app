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

  const userId = userDetails && userDetails._id;

  const [helpVisible, setHelpVisible] = useState(false);
  const OpenHelpModal = () => {
    // console.log('modal:',helpVisible)
    setHelpVisible(true);
  };

  const updateKotakSecretKey = () => {
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
    />
  );
};

export default KotakModal;
