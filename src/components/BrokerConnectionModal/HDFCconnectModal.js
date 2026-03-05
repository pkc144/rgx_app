import React, { useState, useRef, useEffect } from 'react';

import server from '../../utils/serverConfig';
import CryptoJS from 'react-native-crypto-js';
import { getAuth } from '@react-native-firebase/auth';
import Config from 'react-native-config';
import { generateToken } from '../../utils/SecurityTokenManager';

import axios from 'axios';
import HDFCConnectUI from '../../UIComponents/BrokerConnectionUI/HDFCConnectUI';
import { useTrade } from '../../screens/TradeContext';
import { getAdvisorSubdomain } from '../../utils/variantHelper';
import eventEmitter from '../EventEmitter';
import useModalStore from '../../GlobalUIModals/modalStore';

const HDFCconnectModal = ({
  isVisible,
  setShowhdfcModal,
  onClose,
  setShowBrokerModal,
  fetchBrokerStatusModal,
}) => {
  const { configData } = useTrade();
  const showAlert = useModalStore((state) => state.showAlert);
  const [apiKey, setApiKey] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [showWebView, setShowWebView] = useState(false);
  const [authUrl, setAuthUrl] = useState('');
  const auth = getAuth();
  const user = auth.currentUser;
  const userEmail = user?.email;
  const [isPasswordVisibleup, setIsPasswordVisibleup] = useState(false);
  const sheet = useRef(null);
  const scrollViewRef = useRef(null);

  const checkValidApiAnSecret = details => {
    const bytesKey = CryptoJS.AES.encrypt(details, 'ApiKeySecret');
    const Key = bytesKey.toString();
    if (Key) {
      return Key;
    }
  };

  const [helpVisible, setHelpVisible] = useState(false);
  const OpenHelpModal = () => {
    setHelpVisible(true);
  };

  const handleWebViewClose = () => {
    setShowWebView(false);
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
      .catch(err => console.log('errorrrrrrrr====', err));
  };
  useEffect(() => {
    getUserDeatils();
  }, [userEmail, server.server.baseUrl]);

  const userId = userDetails && userDetails._id;

  const handleWebViewNavigationStateChange = newNavState => {
    const { url } = newNavState;
    const callbackUrl = configData?.config?.REACT_APP_BROKER_CONNECT_REDIRECT_URL || '';

    if (url.includes(callbackUrl) || url.includes('/callback')) {
      setShowWebView(false);
      fetchBrokerStatusModal();
      eventEmitter.emit('refreshEvent', { source: 'HDFC Securities broker connection' });
      showAlert('success', 'Connected Successfully', 'Your HDFC broker has been connected successfully!');
      onClose();
      setShowBrokerModal(false);
    }
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

  const initiateAuth = () => {
    let data = JSON.stringify({
      uid: userId,
      apiKey: checkValidApiAnSecret(apiKey),
      secretKey: checkValidApiAnSecret(secretKey),
    });
    let config = {
      method: 'post',
      url: `${server.server.baseUrl}api/hdfc/update-key`,

      headers: {
        'Content-Type': 'application/json',
        'X-Advisor-Subdomain': configData?.config?.REACT_APP_HEADER_NAME || getAdvisorSubdomain(),
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
        if (response) {
          setAuthUrl(response.data.response);
          setShowWebView(true);
        }
      })
      .catch(error => {
        console.log(error);
      });
  };

  return (
    <HDFCConnectUI
      isVisible={isVisible}
      onClose={onClose}
      handleClose={onClose}
      shouldRenderContent={true}
      showWebView={showWebView}
      scrollViewRef={scrollViewRef}
      apiKey={apiKey}
      setApiKey={setApiKey}
      secretKey={secretKey}
      setSecretKey={setSecretKey}
      isPasswordVisible={isPasswordVisible}
      handleWebViewClose={handleWebViewClose}
      setIsPasswordVisible={setIsPasswordVisible}
      isPasswordVisibleup={isPasswordVisibleup}
      setIsPasswordVisibleup={setIsPasswordVisibleup}
      OpenHelpModal={OpenHelpModal}
      initiateAuth={initiateAuth}
      authUrl={authUrl}
      handleWebViewNavigationStateChange={handleWebViewNavigationStateChange}
      helpVisible={helpVisible}
      setHelpVisible={setHelpVisible}
    />
  );
};

export default HDFCconnectModal;
