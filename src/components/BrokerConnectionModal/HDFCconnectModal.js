import React, { useState, useRef, useEffect, useDebugValue } from 'react';

import server from '../../utils/serverConfig';
import CryptoJS from 'react-native-crypto-js';
import { getAuth } from '@react-native-firebase/auth';
import Config from 'react-native-config';
import { generateToken } from '../../utils/SecurityTokenManager';

import Toast from 'react-native-toast-message';
import axios from 'axios';
import HDFCConnectUI from '../../UIComponents/BrokerConnectionUI/HDFCConnectUI';
import { useTrade } from '../../screens/TradeContext';
import { getAdvisorSubdomain } from '../../utils/variantHelper';
import eventEmitter from '../EventEmitter';

const HDFCconnectModal = ({
  isVisible,
  setShowhdfcModal,
  onClose,
  setShowBrokerModal,
  fetchBrokerStatusModal,
}) => {
  const { configData } = useTrade();
  const [apiKey, setApiKey] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [showWebView, setShowWebView] = useState(false); // Flag to toggle WebView display
  const [authUrl, setAuthUrl] = useState('');
  const auth = getAuth();
  const user = auth.currentUser;
  const userEmail = user?.email;
  const [isPasswordVisibleup, setIsPasswordVisibleup] = useState(false);
  const sheet = useRef(null);
  const scrollViewRef = useRef(null);
  const [activeSections, setActiveSections] = useState([]);
  const checkValidApiAnSecret = details => {
    const bytesKey = CryptoJS.AES.encrypt(details, 'ApiKeySecret');
    const Key = bytesKey.toString();
    if (Key) {
      return Key;
    }
  };

  const [helpVisible, setHelpVisible] = useState(false);
  const OpenHelpModal = () => {
    // console.log('modal:',helpVisible)
    setHelpVisible(true);
  };

  const handleWebViewClose = () => {
    setShowWebView(false); // Close WebView and return to the form
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
  console.log('NEw Data---', userDetails);
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
  const [sessionToken, setSessionToken] = useState(null);
  const [apiSession, setApiSession] = useState(null);
  const [iciciSuccessMsg, setIciciSuccessMsg] = useState(false);
  const [hdfcRequestToken, setHdfcRequestToken] = useState(null);

  const checkValidApiAnSecretdecrypt = details => {
    const bytesKey = CryptoJS.AES.decrypt(details, 'ApiKeySecret');
    const Key = bytesKey.toString(CryptoJS.enc.Utf8);
    if (Key) {
      return Key;
    }
  };

  const handleWebViewNavigationStateChange = newNavState => {
    const { url } = newNavState;
    console.log('here1', url);
    if (url.includes('requestToken=')) {
      console.log('here2', url);
      const queryParams = parseQueryString(url.split('?')[1]);
      const sessionToken1 = queryParams.requestToken;
      if (sessionToken1) {
        console.log('here2', sessionToken1);
        setHdfcRequestToken(sessionToken1);
        setShowWebView(false);
      }
    }
  };

  const [hdfcSessionToken, setHdfcSessionToken] = useState(null);
  const hasConnectedHdfc = useRef(false);

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
        fontSize: 13,
        fontFamily: 'Poppins-Regular', // Customize your font
      },
    });
  };

  const connectHdfc = () => {
    if (
      hdfcRequestToken !== null &&
      apiKey &&
      secretKey &&
      !hasConnectedHdfc.current
    ) {
      let data = JSON.stringify({
        apiKey: apiKey,
        apiSecret: secretKey,
        requestToken: hdfcRequestToken,
      });

      let config = {
        method: 'post',
        url: `${server.ccxtServer.baseUrl}hdfc/access-token`,

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
          if (response.data) {
            console.log(
              'response Data:',
              response.data,
              response,
              response.data.accessToken,
            );
            const session_token = response.data.accessToken;
            setHdfcSessionToken(session_token);
            console.log('hdfc session Token:', sessionToken);
          }
        })
        .catch(error => {
          console.error(error);
          showToast('Invalid Credential.', 'error', '');
        });
      hasConnectedHdfc.current = true;
    }
  };

  useEffect(() => {
    if (hdfcRequestToken !== null && apiKey && secretKey) {
      connectHdfc();
    }
  }, [hdfcRequestToken, userDetails]);

  useEffect(() => {
    if (userId !== undefined && hdfcRequestToken) {
      connectBrokerDbUpadte();
    }
  }, [userId, hdfcRequestToken]);

  useEffect(() => {
    console.log(
      'POP:',
      userDetails?.apiKey,
      userDetails?.secretKey,
      userDetails,
    );
    if (userDetails?.apiKey && userDetails?.secretKey) {
      let data = JSON.stringify({
        uid: userId,
        apiKey: apiKey,
        secretKey: secretKey,
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
    }
  }, [isVisible]);

  const [shouldRenderContent, setShouldRenderContent] = React.useState(false);
  useEffect(() => {
    if (isVisible) {
      setShouldRenderContent(true);
      sheet.current?.present();
    } else {
      sheet.current?.dismiss();
    }
  }, [isVisible]);

  console.log('isvisilll hdfc--', isVisible);

  const isToastShown = useRef(false);
  const connectBrokerDbUpadte = () => {
    if (hdfcSessionToken) {
      if (!isToastShown.current) {
        console.log('heref');
        isToastShown.current = true; // Prevent further execution
        let brokerData = {
          uid: userId,
          user_broker: 'Hdfc Securities',
          jwtToken: hdfcSessionToken,
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
            fetchBrokerStatusModal();
            eventEmitter.emit('refreshEvent', { source: 'HDFC Securities broker connection' });
            showToast('Your Broker Connected Successfully!.', 'success', '');
            // setShowhdfcModal(false);
            onClose();
            setShowBrokerModal(false);
          })
          .catch(error => {
            console.log(error);
            showToast('Error to connect.', 'error', '');
          });
      }
    }
  };

  useEffect(() => {
    if (userId !== undefined && hdfcSessionToken) {
      connectBrokerDbUpadte();
    }
  }, [userId, hdfcSessionToken]);

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
    // const url = `https://developer.hdfcsec.com/oapi/v1/login?api_key=${encodeURIComponent(apiKey)}`;
    // Show WebView after initiating auth
  };

  useEffect(() => {
    console.log('POP:', userDetails?.user_broker);
    if (
      userId &&
      userDetails?.apiKey &&
      userDetails?.secretKey &&
      userDetails?.user_broker === 'Hdfc Securities'
    ) {
      setApiKey(checkValidApiAnSecretdecrypt(userDetails?.apiKey));
      setSecretKey(checkValidApiAnSecretdecrypt(userDetails?.secretKey));

      let data = JSON.stringify({
        uid: userId,
        apiKey: userDetails?.apiKey,
        secretKey: userDetails?.secretKey,
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
    }
  }, [isVisible, userDetails]);

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
