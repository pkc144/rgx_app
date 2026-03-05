import React, { useState, useRef, useEffect } from 'react';
import { Dimensions } from 'react-native';

import server from '../../utils/serverConfig';
import CryptoJS from 'react-native-crypto-js';

import { getAuth } from '@react-native-firebase/auth';
import axios from 'axios';

import { generateToken } from '../../utils/SecurityTokenManager';
import Config from 'react-native-config';
import UpstoxConnectUI from '../../UIComponents/BrokerConnectionUI/UpstoxConnectUI';
import { useTrade } from '../../screens/TradeContext';
import { useConfig } from '../../context/ConfigContext';
import { getAdvisorSubdomain } from '../../utils/variantHelper';
import eventEmitter from '../EventEmitter';
import useModalStore from '../../GlobalUIModals/modalStore';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const UpstoxModal = ({
  isVisible,
  setShowupstoxModal,
  onClose,
  setShowBrokerModal,
  fetchBrokerStatusModal,
}) => {
  const { configData } = useTrade();
  const freshConfig = useConfig();
  const showAlert = useModalStore((state) => state.showAlert);
  const [apiKey, setApiKey] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [ispasswordVisibleup, setIsPasswordVisibleup] = useState(false);
  const [showWebView, setShowWebView] = useState(false);
  const [authUrl, setAuthUrl] = useState('');
  const auth = getAuth();
  const user = auth.currentUser;
  const userEmail = user?.email;
  const sheet = useRef(null);
  const scrollViewRef = useRef(null);

  // Prefer fresh config from ConfigContext (fetches from API on app start),
  // fallback to TradeContext (cached in AsyncStorage from login), then .env
  const brokerConnectRedirectURL =
    freshConfig?.REACT_APP_BROKER_CONNECT_REDIRECT_URL ||
    configData?.config?.REACT_APP_BROKER_CONNECT_REDIRECT_URL ||
    Config.REACT_APP_BROKER_CONNECT_REDIRECT_URL;

  const [loading, setLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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
    setHelpVisible(true);
  };

  const updateSecretKey = () => {
    // Validate redirect URL before proceeding
    if (!brokerConnectRedirectURL) {
      showAlert('error', 'Configuration Error', 'Broker redirect URL is not configured. Please contact support.');
      return;
    }

    setIsLoading(true);
    let data = JSON.stringify({
      uid: userId,
      apiKey: checkValidApiAnSecret(apiKey),
      secretKey: checkValidApiAnSecret(secretKey),
      redirect_uri: brokerConnectRedirectURL,
    });
    let config = {
      method: 'post',
      url: `${server.server.baseUrl}api/upstox/update-key`,

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
    console.log('[Upstox] updateSecretKey params:', userId, apiKey, secretKey, brokerConnectRedirectURL);
    axios
      .request(config)
      .then(response => {
        if (response) {
          console.log('[Upstox] Backend response:', JSON.stringify(response.data));
          const authUrlResponse = response.data.response || '';

          // Check if Upstox returned an error in the redirect URL
          if (authUrlResponse.includes('error_code') || authUrlResponse.includes('error_message')) {
            setIsLoading(false);
            try {
              const urlObj = new URL(authUrlResponse);
              const errorMsg = decodeURIComponent(urlObj.searchParams.get('error_message') || '');
              console.log('[Upstox] OAuth error:', errorMsg);
              showAlert(
                'error',
                'Upstox Connection Failed',
                errorMsg || 'Please check your API Key, Secret Key and Redirect URI in your Upstox app settings and try again.',
              );
            } catch (e) {
              showAlert(
                'error',
                'Upstox Connection Failed',
                'Please check your API Key, Secret Key and Redirect URI in your Upstox app settings and try again.',
              );
            }
            return;
          }

          setAuthUrl(authUrlResponse);
          setShowWebView(true);
        }
      })
      .catch(error => {
        console.log('[Upstox] Error:', error?.response?.data || error?.message || error);
        setIsLoading(false);
        showAlert('error', 'Incorrect Credentials', 'Please check your API Key and Secret Key and try again.');
      });
  };

  const handleWebViewNavigationStateChange = newNavState => {
    const { url } = newNavState;
    const callbackUrl = configData?.config?.REACT_APP_BROKER_CONNECT_REDIRECT_URL || '';

    if (url.includes(callbackUrl) || url.includes('/callback')) {
      setShowWebView(false);
      setIsLoading(false);
      fetchBrokerStatusModal();
      eventEmitter.emit('refreshEvent', { source: 'Upstox broker connection' });
      showAlert('success', 'Connected Successfully', 'Your Upstox broker has been connected successfully!');
      onClose();
      setShowBrokerModal(false);
    }
  };

  const [shouldRenderContent, setShouldRenderContent] = React.useState(true);

  useEffect(() => {
    if (isVisible) {
      setShouldRenderContent(true);
      sheet.current?.present();
    } else {
      sheet.current?.dismiss();
    }
  }, [isVisible]);

  const handleWebViewClose = () => {
    setShowWebView(false);
  };

  return (
    <UpstoxConnectUI
      isVisible={isVisible}
      onClose={onClose}
      shouldRenderContent={true}
      showWebView={showWebView}
      apiKey={apiKey}
      secretKey={secretKey}
      isPasswordVisible={isPasswordVisible}
      isPasswordVisibleUp={ispasswordVisibleup}
      setApiKey={setApiKey}
      setSecretKey={setSecretKey}
      setIsPasswordVisible={setIsPasswordVisible}
      setIsPasswordVisibleUp={setIsPasswordVisibleup}
      updateSecretKey={updateSecretKey}
      isLoading={isLoading}
      OpenHelpModal={OpenHelpModal}
      handleWebViewClose={handleWebViewClose}
      authUrl={authUrl}
      handleWebViewNavigationStateChange={handleWebViewNavigationStateChange}
      helpVisible={helpVisible}
      setHelpVisible={setHelpVisible}
      scrollViewRef={null}
      screenHeight={screenHeight}
    />
  );
};
export default UpstoxModal;
