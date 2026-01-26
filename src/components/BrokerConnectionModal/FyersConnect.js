import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, Dimensions } from 'react-native';

import { getAuth } from '@react-native-firebase/auth';
import server from '../../utils/serverConfig';
import CryptoJS from 'react-native-crypto-js';
import axios from 'axios';
import Config from 'react-native-config';
import { generateToken } from '../../utils/SecurityTokenManager';
import { getAdvisorSubdomain } from '../../utils/variantHelper';
import FyersConnectUI from '../../UIComponents/BrokerConnectionUI/FyersConnectUI';
import { useTrade } from '../../screens/TradeContext';
import eventEmitter from '../EventEmitter';
import useModalStore from '../../GlobalUIModals/modalStore';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const commonHeight = screenHeight * 0.06;

const FyersConnect = ({
  isVisible,
  setShowFyersModal,
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

  const [loading, setLoading] = useState(false);
  const [sessionToken, setSessionToken] = useState(null);
  //

  const brokerConnectRedirectURL =
    configData?.config?.REACT_APP_BROKER_CONNECT_REDIRECT_URL;

  const [apiSession, setApiSession] = useState(null);
  const [fyersAuthCode, setFyersAuthCode] = useState(null);

  //
  const auth = getAuth();
  const user = auth.currentUser;
  const userEmail = user?.email;
  const [helpVisible, setHelpVisible] = useState(false);

  const sheet = useRef(null);
  const scrollViewRef = useRef(null);
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

  const handleWebViewNavigationStateChange = newNavState => {
    const { url } = newNavState;
    console.log('here1-----', url);
    if (url.includes('auth_code=')) {
      const queryParams = parseQueryString(url.split('?')[1]);
      const authcode = queryParams.auth_code;
      if (authcode) {
        setFyersAuthCode(authcode);
        console.log('here2 authcode', authcode);
        setShowWebView(false);
      }
    }
  };

  const [fyersAccessToken, setFyersAccessToken] = useState(null);
  const hasConnectedFyers = useRef(false);
  const connectFyers = () => {
    console.log('ConnectFyers called', apiKey, secretKey);
    if (fyersAuthCode !== null && apiKey && secretKey) {
      let data = JSON.stringify({
        clientId: secretKey,
        clientSecret: apiKey,
        authCode: fyersAuthCode,
      });
      console.log('data:', data);
      let config = {
        method: 'post',
        url: `${server.ccxtServer.baseUrl}fyers/gen-access-token`,

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
            const session_token = response.data.accessToken;
            console.log('sesss', session_token, response.data);
            setFyersAccessToken(session_token);
          }
        })
        .catch(error => {
          console.error(error);
          showAlert('error', 'Connection Error', 'Failed to connect to Fyers. Please try again.');
        });
      hasConnectedFyers.current = true;
    }
  };

  useEffect(() => {
    if (fyersAuthCode !== null && apiKey && secretKey) {
      connectFyers();
    }
  }, [fyersAuthCode, userDetails]);

  const isToastShown = useRef(false);
  const connectBrokerDbUpadte = () => {
    if (fyersAccessToken) {
      console.log('Get Here Fyers AccessTOken:', fyersAccessToken);
      if (true) {
        console.log('heref');
        isToastShown.current = true; // Prevent further execution
        let brokerData = {
          uid: userId,
          user_broker: 'Fyers',
          jwtToken: fyersAccessToken,
          clientCode: secretKey,
          secretKey: checkValidApiAnSecret(apiKey),
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
            eventEmitter.emit('refreshEvent', { source: 'Fyers broker connection' });
            showAlert('success', 'Connected Successfully', 'Your Fyers broker has been connected successfully!');
            onClose();
            setShowBrokerModal(false);
          })
          .catch(error => {
            console.log(error);
            showAlert('error', 'Connection Error', 'Failed to connect to Fyers. Please try again.');
          });
      }
    }
  };

  useEffect(() => {
    if (userId !== undefined && fyersAccessToken) {
      connectBrokerDbUpadte();
    }
  }, [userId, fyersAccessToken]);

  const handleClose = () => {
    setShowWebView(false); // Update the state to reflect the sheet is closed
    // Call the parent onClose function
  };

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

  const updateSecretKey = () => {
    setLoading(true);
    let data = JSON.stringify({
      uid: userId,
      redirect_url: brokerConnectRedirectURL,
      clientCode: secretKey,
      secretKey: checkValidApiAnSecret(apiKey),
    });
    let config = {
      method: 'post',
      url: `${server.server.baseUrl}api/fyers/update-key`,

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
      let data = JSON.stringify({
        uid: userId,
        redirect_url: brokerConnectRedirectURL,
        clientCode: secretKey,
        secretKey: apiKey,
      });
      let config = {
        method: 'post',
        url: `${server.server.baseUrl}api/fyers/update-key`,

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
          // showToast('Incorrect credential.Please try again','error','');
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

  const [isPasswordVisibleup, setIsPasswordVisibleup] = useState(false);

  const OpenHelpModal = () => {
    // console.log('modal:',helpVisible)
    setHelpVisible(true);
  };

  return (
    <FyersConnectUI
      isVisible={isVisible}
      onClose={onClose}
      showWebView={showWebView}
      screenHeight={screenHeight}
      scrollViewRef={scrollViewRef}
      handleClose={handleClose}
      setShowFyersModal={setShowBrokerModal}
      secretKey={secretKey}
      isPasswordVisibleup={isPasswordVisibleup}
      setIsPasswordVisibleup={setIsPasswordVisibleup}
      OpenHelpModal={OpenHelpModal}
      setSecretKey={setSecretKey}
      apiKey={apiKey}
      isPasswordVisible={isPasswordVisible}
      setIsPasswordVisible={setIsPasswordVisible}
      setApiKey={setApiKey}
      updateSecretKey={updateSecretKey}
      loading={loading}
      authUrl={authUrl}
      handleWebViewNavigationStateChange={handleWebViewNavigationStateChange}
      helpVisible={helpVisible}
      setHelpVisible={setHelpVisible}
      styles={styles}
    />
  );
};

const styles = StyleSheet.create({
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    flex: 1,
  },
  modal: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 10,
    height: 'auto',
  },
  content: {
    padding: 0,
  },
  content1: {
    justifyContent: 'center',
  },
  closeButton: { position: 'absolute', top: 10, right: 10 },

  title: {
    fontSize: 20,
    marginHorizontal: 10,
    fontWeight: 'Poppins-SemiBold',
    color: 'black',
  },
  playerWrapper: {
    overflow: 'hidden',
    marginTop: 20,
    alignSelf: 'center',
    borderRadius: 20,
    marginBottom: 20,
  },
  instruction: {
    fontSize: 15,
    color: 'black',
    marginVertical: 3,
    fontFamily: 'Poppins-Regular',
  },
  link: {
    color: 'blue',
    textDecorationLine: 'underline',
  },
  stepGuide: {
    fontSize: 16,
    color: 'black',
    marginRight: 10,
    marginLeft: 10,
    fontFamily: 'Poppins-SemiBold',
  },
  label: {
    fontSize: 17,
    fontWeight: 'bold',
    color: 'black',
    marginHorizontal: 10,
    marginBottom: 5,
  },
  inputContainer: {
    borderColor: '#d5d4d4',
    alignSelf: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    width: '100%',
    height: commonHeight + 5,
  },
  proceedButton: {
    backgroundColor: 'black',
    padding: 10,
    borderRadius: 8,
    marginHorizontal: 10,
    height: commonHeight,
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
    justifyContent: 'center',
  },
  proceedButtonText: {
    fontSize: screenWidth * 0.045,
    fontWeight: '600',
    color: 'white',
  },
  webViewContainer: {
    backgroundColor: '#fff',
    marginTop: 20,
    height: screenHeight / 1.7,
    borderTopLeftRadius: 100,
    borderTopRightRadius: 100,
  },
  webView: {
    flex: 1,
  },
});

export default FyersConnect;
