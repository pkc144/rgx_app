import React, { useState, useRef, useEffect } from 'react';

import { getAuth } from '@react-native-firebase/auth';
import server from '../../utils/serverConfig';
import axios from 'axios';
import CryptoJS from 'react-native-crypto-js';

import Config from 'react-native-config';
import { generateToken } from '../../utils/SecurityTokenManager';
import ICICIConnectUI from '../../UIComponents/BrokerConnectionUI/ICICIConnectUI';
import { useTrade } from '../../screens/TradeContext';
import { getAdvisorSubdomain } from '../../utils/variantHelper';
import eventEmitter from '../EventEmitter';
import useModalStore from '../../GlobalUIModals/modalStore';

const ICICIUPModal = ({
  isVisible,
  setShowICICIUPModal,
  onClose,
  setShowBrokerModal,
  fetchBrokerStatusModal,
}) => {
  const { configData } = useTrade();
  const showAlert = useModalStore((state) => state.showAlert);
  const [apiKey, setApiKey] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isPasswordVisibleup, setIsPasswordVisibleup] = useState(false);
  const [showWebView, setShowWebView] = useState(false);
  const [authUrl, setAuthUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [userDetails, setUserDetails] = useState(null);
  const [helpVisible, setHelpVisible] = useState(false);

  const sheet = useRef(null);
  const scrollViewRef = useRef(null);

  const auth = getAuth();
  const user = auth.currentUser;
  const userEmail = user?.email;

  const checkValidApiAnSecretdecrypt = details => {
    const bytesKey = CryptoJS.AES.decrypt(details, 'ApiKeySecret');
    const Key = bytesKey.toString(CryptoJS.enc.Utf8);
    if (Key) {
      return Key;
    }
  };

  // Fetch user details
  useEffect(() => {
    if (userEmail) {
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
        .catch(err => console.log('Error fetching user details:', err));
    }
  }, [userEmail]);

  const [apiSession, setApiSession] = useState(null);
  const [sessionToken, setSessionToken] = useState(null);
  const isToastShown = useRef(false);

  const parseQueryString = queryString => {
    const params = {};
    const query = queryString?.startsWith('?') ? queryString.substring(1) : queryString;
    const pairs = query?.split('&') || [];
    pairs.forEach(pair => {
      const [key, value] = pair.split('=');
      if (key && value) {
        params[decodeURIComponent(key)] = decodeURIComponent(value);
      }
    });
    return params;
  };

  // Handle modal visibility
  useEffect(() => {
    if (isVisible) {
      sheet.current?.present();
    } else {
      sheet.current?.dismiss();
      setShowWebView(false);
      setAuthUrl('');
      setApiSession(null);
    }
  }, [isVisible]);

  // Step 1: Extract apisession from callback URL
  const handleWebViewNavigationStateChange = newNavState => {
    const { url } = newNavState;
    console.log('[ICICI] WebView URL:', url);

    if (url.includes('apisession=')) {
      const queryString = url.split('?')[1];
      if (queryString) {
        const queryParams = parseQueryString(queryString);
        const apisession = queryParams.apisession;
        if (apisession) {
          console.log('[ICICI] API session received');
          setApiSession(apisession);
          setShowWebView(false);
        }
      }
    }
  };

  // Step 2: Exchange apisession for session token via ICICI customer-details
  useEffect(() => {
    if (apiSession && apiKey) {
      const data = {
        apiKey: apiKey,
        accessToken: apiSession,
      };

      axios
        .post(`${server.ccxtServer.baseUrl}icici/customer-details`, data, {
          headers: {
            'Content-Type': 'application/json',
            'X-Advisor-Subdomain': configData?.config?.REACT_APP_HEADER_NAME || getAdvisorSubdomain(),
            'aq-encrypted-key': generateToken(
              Config.REACT_APP_AQ_KEYS,
              Config.REACT_APP_AQ_SECRET,
            ),
          },
        })
        .then(response => {
          if (response.data.Status === 200) {
            console.log('[ICICI] Session token received');
            setSessionToken(response.data.Success.session_token);
          }
        })
        .catch(error => {
          console.error('[ICICI] customer-details error:', error);
          showAlert('error', 'Connection Error', 'Failed to connect to ICICI Direct. Please try again.');
        });
    }
  }, [apiSession, apiKey]);

  // Step 3: Save broker connection to DB
  useEffect(() => {
    if (sessionToken && userDetails?._id && !isToastShown.current) {
      const brokerData = {
        uid: userDetails._id,
        user_broker: 'ICICI Direct',
        jwtToken: sessionToken,
        apiKey: checkValidApiAnSecret(apiKey),
        secretKey: checkValidApiAnSecret(secretKey),
      };

      axios
        .put(`${server.server.baseUrl}api/user/connect-broker`, brokerData, {
          headers: {
            'Content-Type': 'application/json',
            'X-Advisor-Subdomain': configData?.config?.REACT_APP_HEADER_NAME || getAdvisorSubdomain(),
            'aq-encrypted-key': generateToken(
              Config.REACT_APP_AQ_KEYS,
              Config.REACT_APP_AQ_SECRET,
            ),
          },
        })
        .then(() => {
          isToastShown.current = true;

          // Update model portfolio (non-critical)
          try {
            axios.request({
              method: 'post',
              url: `${server.ccxtServer.baseUrl}rebalance/change_broker_model_pf`,
              data: JSON.stringify({ user_email: userEmail, user_broker: 'ICICI Direct' }),
              headers: {
                'Content-Type': 'application/json',
                'X-Advisor-Subdomain': configData?.config?.REACT_APP_HEADER_NAME || getAdvisorSubdomain(),
                'aq-encrypted-key': generateToken(Config.REACT_APP_AQ_KEYS, Config.REACT_APP_AQ_SECRET),
              },
            });
          } catch (err) {
            console.warn('[ICICI] Model portfolio update failed (non-critical):', err);
          }

          fetchBrokerStatusModal();
          eventEmitter.emit('refreshEvent', { source: 'ICICI Direct broker connection' });
          showAlert('success', 'Connected Successfully', 'Your ICICI Direct broker has been connected successfully!');
          onClose();
          setShowBrokerModal(false);
        })
        .catch(error => {
          console.error('[ICICI] connect-broker error:', error);
          showAlert('error', 'Connection Error', 'Failed to connect broker. Please try again.');
        });
    }
  }, [sessionToken, userDetails]);

  const checkValidApiAnSecret = details => {
    const bytesKey = CryptoJS.AES.encrypt(details, 'ApiKeySecret');
    return bytesKey.toString();
  };

  const initiateAuth = () => {
    if (!userDetails?._id || !apiKey || !secretKey) {
      showAlert('error', 'Missing Fields', 'Please fill in all required fields.');
      return;
    }

    const data = {
      uid: userDetails._id,
      apiKey: checkValidApiAnSecret(apiKey),
      secretKey: checkValidApiAnSecret(secretKey),
    };

    axios
      .put(`${server.server.baseUrl}api/icici/update-key`, data, {
        headers: {
          'Content-Type': 'application/json',
          'X-Advisor-Subdomain': configData?.config?.REACT_APP_HEADER_NAME || getAdvisorSubdomain(),
          'aq-encrypted-key': generateToken(
            Config.REACT_APP_AQ_KEYS,
            Config.REACT_APP_AQ_SECRET,
          ),
        },
      })
      .then(() => {
        const url = `https://api.icicidirect.com/apiuser/login?api_key=${encodeURIComponent(
          apiKey,
        )}`;
        setAuthUrl(url);
        setShowWebView(true);
      })
      .catch(error => {
        console.error('Error initiating auth:', error);
        showAlert('error', 'Authentication Failed', 'Failed to authenticate. Please check your credentials.');
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

  const OpenHelpModal = () => {
    setHelpVisible(true);
  };
  const handleClose = () => {
    onClose();
    setShowBrokerModal(false);
  };

  return (
    <ICICIConnectUI
      isVisible={isVisible}
      onClose={onClose}
      apiKey={apiKey}
      secretKey={secretKey}
      isPasswordVisible={isPasswordVisible}
      isPasswordVisibleup={isPasswordVisibleup}
      showWebView={showWebView}
      authUrl={authUrl}
      helpVisible={helpVisible}
      loading={loading}
      setHelpVisible={setHelpVisible}
      setApiKey={setApiKey}
      setSecretKey={setSecretKey}
      setIsPasswordVisible={setIsPasswordVisible}
      setIsPasswordVisibleup={setIsPasswordVisibleup}
      setShowICICIUPModal={setShowBrokerModal}
      OpenHelpModal={OpenHelpModal}
      handleClose={handleClose}
      initiateAuth={initiateAuth}
      handleWebViewNavigationStateChange={handleWebViewNavigationStateChange}
      shouldRenderContent={true}
    />
  );
};

export default ICICIUPModal;
