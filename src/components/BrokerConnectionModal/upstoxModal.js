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
  const showAlert = useModalStore((state) => state.showAlert);
  const [apiKey, setApiKey] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [ispasswordVisibleup, setIsPasswordVisibleup] = useState(false);
  const [showWebView, setShowWebView] = useState(false); // Flag to toggle WebView display
  const [authUrl, setAuthUrl] = useState('');
  const auth = getAuth();
  const user = auth.currentUser;
  const userEmail = user?.email;
  const sheet = useRef(null);
  const scrollViewRef = useRef(null);

  const brokerConnectRedirectURL =
    configData?.config?.REACT_APP_BROKER_CONNECT_REDIRECT_URL;

  const [loading, setLoading] = useState(false);

  const checkValidApiAnSecret = details => {
    const bytesKey = CryptoJS.AES.encrypt(details, 'ApiKeySecret');
    const Key = bytesKey.toString();
    if (Key) {
      return Key;
    }
  };

  const checkValidApiAnSecretdecrypt = details => {
    const bytesKey = CryptoJS.AES.decrypt(details, 'ApiKeySecret');
    const Key = bytesKey.toString(CryptoJS.enc.Utf8);
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

  const parseQueryString = queryString => {
    const params = {};
    const query = queryString.startsWith('?')
      ? queryString.substring(1)
      : queryString;
    const pairs = query.split('&');
    pairs.forEach(pair => {
      const [key, value] = pair.split('=');
      params[decodeURIComponent(key)] = decodeURIComponent(value);
    });
    return params;
  };

  const [helpVisible, setHelpVisible] = useState(false);
  const OpenHelpModal = () => {
    // console.log('modal:',helpVisible)
    setHelpVisible(true);
  };

  const updateSecretKey = () => {
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
    console.log(userId, apiKey, secretKey, brokerConnectRedirectURL);
    axios
      .request(config)
      .then(response => {
        if (response) {
          console.log('here upstox:', response.data);
          setAuthUrl(response.data.response);
          setShowWebView(true);
        }
      })
      .catch(error => {
        console.log(error);
        showAlert('error', 'Incorrect Credentials', 'Please check your API Key and Secret Key and try again.');
      });
  };

  useEffect(() => {
    console.log(
      'POP:',
      userDetails?.apiKey,
      userDetails?.secretKey,
      userDetails,
    );
    if (userDetails?.apiKey && userDetails?.secretKey) {
      setApiKey(checkValidApiAnSecretdecrypt(userDetails?.apiKey));
      setSecretKey(checkValidApiAnSecretdecrypt(userDetails?.secretKey));
      console.log('POP:111');
      let data = JSON.stringify({
        uid: userId,
        apiKey: userDetails?.apiKey,
        secretKey: userDetails?.secretKey,
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
      console.log(userId, apiKey, secretKey, brokerConnectRedirectURL);
      axios
        .request(config)
        .then(response => {
          if (response) {
            console.log('here upstox:', response.data);
            setAuthUrl(response.data.response);
            setShowWebView(true);
          }
        })
        .catch(error => {
          console.log(error);
          showAlert('error', 'Incorrect Credentials', 'Please check your API Key and Secret Key and try again.');
        });
    }
  }, [isVisible]);

  const [isLoading, setIsLoading] = useState(false);

  const handleWebViewNavigationStateChange = newNavState => {
    const { url } = newNavState;
    console.log('here1', url);
    if (url.includes('code=')) {
      console.log('here2', url);
      const queryParams = parseQueryString(url.split('?')[1]);
      const sessionToken1 = queryParams.code;
      if (sessionToken1) {
        setUpstoxCode(sessionToken1);
        console.log('here3', sessionToken1);
        setShowWebView(false);
      }
    }
  };

  const [upstoxCode, setUpstoxCode] = useState(null);
  const [upstoxSessionToken, setUpstoxSessionToken] = useState(null);
  const hasConnectedUpstox = useRef(false);

  const connectUpstox = () => {
    setUpstoxSessionToken(null);
    // console.log('this get called',upstoxCode,apiKey,secretKey);
    if (upstoxCode !== null && apiKey && secretKey) {
      let data = JSON.stringify({
        apiKey: apiKey,
        apiSecret: secretKey,
        code: upstoxCode,
        redirectUri: brokerConnectRedirectURL,
      });
      console.log(
        'apikk',
        apiKey,
        secretKey,
        upstoxCode,
        brokerConnectRedirectURL,
      );
      let config = {
        method: 'post',
        url: `${server.ccxtServer.baseUrl}upstox/gen-access-token`,

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
            console.log('response data:', response.data);
            const session_token = response.data.access_token;
            setUpstoxSessionToken(session_token);
          }
        })
        .catch(error => {
          console.error(error);
          setIsLoading(false);
          showAlert('error', 'Connection Error', 'Failed to connect to Upstox. Please try again.');
        });
      hasConnectedUpstox.current = true;
    } else if (hasConnectedUpstox.current) {
      showAlert('info', 'Already Connected', 'Your broker is already connected.');
    }
  };

  useEffect(() => {
    if (upstoxCode) {
      connectUpstox();
    }
  }, [upstoxCode, userDetails]);


  const isToastShown = useRef(false);
  const connectBrokerDbUpadte = () => {
    // console.log('this get called 123;');
    setIsLoading(false);
    if (upstoxSessionToken) {
      console.log('heref');
      isToastShown.current = true; // Prevent further execution
      let brokerData = {
        uid: userId,
        user_broker: 'Upstox',
        jwtToken: upstoxSessionToken,
        apiKey: checkValidApiAnSecret(apiKey),
        secretKey: checkValidApiAnSecret(secretKey),
      };
      let config = {
        method: 'put',
        url: `${server.server.baseUrl}api/user/connect-broker`,

        headers: {
          'Content-Type': 'application/json',
          'X-Advisor-Subdomain': configData?.config?.REACT_APP_HEADER_NAME || getAdvisorSubdomain(),
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
          console.log('success brooooohh');
          setIsLoading(false);
          fetchBrokerStatusModal();
          eventEmitter.emit('refreshEvent', { source: 'Upstox broker connection' });
          showAlert('success', 'Connected Successfully', 'Your Upstox broker has been connected successfully!');
          //  setShowupstoxModal(false);
          onClose();
          setShowBrokerModal(false);
        })
        .catch(error => {
          console.log(error);
          showAlert('error', 'Connection Error', 'Failed to connect to Upstox. Please try again.');
        });
    }
  };

  useEffect(() => {
    if (userId !== undefined && upstoxSessionToken) {
      connectBrokerDbUpadte();
    }
  }, [userId, upstoxSessionToken]);

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
    setShowWebView(false); // Close WebView and return to the form
  };

  useEffect(() => {
    if (
      userDetails?.apiKey &&
      userDetails?.secretKey &&
      userDetails?.user_broker === 'Upstox'
    ) {
      setApiKey(checkValidApiAnSecretdecrypt(userDetails?.apiKey));
      setSecretKey(checkValidApiAnSecretdecrypt(userDetails?.secretKey));
      let data = JSON.stringify({
        uid: userId,
        apiKey: userDetails?.apiKey,
        secretKey: userDetails?.secretKey,
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
      console.log(userId, apiKey, secretKey, brokerConnectRedirectURL);
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
          showAlert('error', 'Incorrect Credentials', 'Please check your API Key and Secret Key and try again.');
        });
    }
  }, [isVisible, userDetails]);

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
      scrollViewRef={null} // Adjust if you use a ref
      screenHeight={screenHeight}
    />
  );
};
export default UpstoxModal;
