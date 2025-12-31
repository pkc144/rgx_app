import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import server from '../../utils/serverConfig';
import CryptoJS from 'react-native-crypto-js';
import { getAuth } from '@react-native-firebase/auth';
import axios from 'axios';
import Toast from 'react-native-toast-message';

import { generateToken } from '../../utils/SecurityTokenManager';
import Config from 'react-native-config';
import MotilalConnectUI from '../../UIComponents/BrokerConnectionUI/MotilalConnectUI';
import { useTrade } from '../../screens/TradeContext';
import { getAdvisorSubdomain } from '../../utils/variantHelper';
import eventEmitter from '../EventEmitter';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const commonHeight = screenHeight * 0.06;

const MotilalModal = ({
  isVisible,
  setMotilalModal,
  onClose,
  setShowBrokerModal,
  fetchBrokerStatusModal,
}) => {
  const { configData } = useTrade();
  const [apiKey, setApiKey] = useState('');
  const [clientCode, setClientCode] = useState('');
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

  const initiateAuth = () => {
    console.log('I am here--', apiKey, clientCode, userDetails?._id);
    if (!userDetails?._id || !apiKey || !clientCode) {
      showToast('Please fill in all required fields', 'error', '');
      return;
    }
    const data = {
      user_broker: 'Motilal Oswal',
      uid: userDetails?._id,
      apiKey: checkValidApiAnSecret(apiKey),
      clientCode: clientCode,
      redirect_url: `${configData?.config?.REACT_APP_BROKER_CONNECT_REDIRECT_URL.replace(
        'https://',
        '',
      )}`,
    };
    console.log('data---', data);
    axios
      .put(`${server.server.baseUrl}api/motilal-oswal/update-key`, data, {
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
        console.log('Finallll');
        if (response && response.data && response.data.response) {
          // Get the URL from API response
          console.log('resppp===', response.data);
          setAuthUrl(response.data.response);
          setShowWebView(true);
        } else {
          console.error('Unexpected response format', response);
        }
      })
      .catch(error => {
        console.log('errorrr--', error.response);
        console.error('Error during Motilal update key request:', error);
      });
  };

  const updateSecretKey = () => {
    const cleanRedirectUrl = brokerConnectRedirectURL.replace(
      /^https?:\/\//,
      '',
    );
    const motilalUrl = `https://invest.motilaloswal.com/OpenAPI/Login.aspx?apikey=${apiKey}&state=${cleanRedirectUrl}`;
    setAuthUrl(motilalUrl);
    setShowWebView(true);
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
        user_broker: 'Motilal Oswal',
        uid: '67c7072ee3aa47762a22ef3d',
        apiKey: userDetails?.apiKey,
        clientCode: userDetails?.clientCode,
      });
      let config = {
        method: 'put',
        url: `${server.server.baseUrl}api/motilal-oswal/update-key`,

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
            const motilalUrl = `https://invest.motilaloswal.com/OpenAPI/Login.aspx?apikey=${apiKey}&state=${cleanRedirectUrl}`;
            console.log('here upstox:', response.data);
            setAuthUrl(motilalUrl);
            setShowWebView(true);
          }
        })
        .catch(error => {
          console.log(error);
          showToast('Incorrect credential.Please try again', 'error', '');
        });
    }
  }, [isVisible]);

  const [isLoading, setIsLoading] = useState(false);

  const handleWebViewNavigationStateChange = newNavState => {
    const { url } = newNavState;
    console.log('here1', url);
    if (url.includes('accessToken=')) {
      console.log('here2', url);
      const queryParams = parseQueryString(url.split('?')[1]);
      const sessionToken1 = queryParams.accessToken;
      if (sessionToken1) {
        setjwtToken(sessionToken1);
        console.log('here3', sessionToken1);
        setShowWebView(false);
      }
    }
  };

  const [jwtToken, setjwtToken] = useState(null);
  const [upstoxSessionToken, setUpstoxSessionToken] = useState(null);
  const hasConnectedUpstox = useRef(false);

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

  const isToastShown = useRef(false);
  const connectBrokerDbUpadte = () => {
    setIsLoading(false);
    if (jwtToken) {
      console.log('heref');
      console.log('Motilal oswal jwt token----', jwtToken);
      isToastShown.current = true; // Prevent further execution
      let brokerData = {
        uid: userId,
        jwtToken: jwtToken,
        apiKey: checkValidApiAnSecret(apiKey),
        user_broker: 'Motilal Oswal',
        clientCode: clientCode,
        redirectUrl: configData?.config?.REACT_APP_BROKER_CONNECT_REDIRECT_URL,
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
          eventEmitter.emit('refreshEvent', { source: 'Motilal Oswal broker connection' });
          showToast('Your Broker Connected Successfully!.', 'success', '');
          onClose();
          setShowBrokerModal(false);
        })
        .catch(error => {
          console.error('got the error here----------', error);
          showToast('Error to connect.', 'error', '');
        });
    }
  };

  useEffect(() => {
    if (userId !== undefined && jwtToken) {
      connectBrokerDbUpadte();
    }
  }, [userId, jwtToken]);

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

  return (
    <View>
      <MotilalConnectUI
        isVisible={isVisible}
        onClose={onClose}
        apiKey={apiKey}
        setApiKey={setApiKey}
        clientCode={clientCode}
        setClientCode={setClientCode}
        isPasswordVisible={isPasswordVisible}
        setIsPasswordVisible={setIsPasswordVisible}
        isPasswordVisibleup={ispasswordVisibleup}
        setIsPasswordVisibleup={setIsPasswordVisibleup}
        handleConnect={initiateAuth}
        loading={loading}
        helpVisible={helpVisible}
        setHelpVisible={setHelpVisible}
        showWebView={showWebView}
        authUrl={authUrl}
        handleWebViewNavigationStateChange={handleWebViewNavigationStateChange}
        handleWebViewClose={handleWebViewClose}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  modal: {
    justifyContent: 'flex-end',
    alignContent: 'center',
    margin: 0,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 10,
    height: '100%', // Adjust modal height for proper scrolling
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    flex: 1,
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
  content: {
    padding: 10,
  },
  content1: {
    padding: 10,
    flex: 1,
  },
  closeButton: {
    alignSelf: 'flex-end',
  },
  playerWrapper: {
    overflow: 'hidden',
    marginTop: 20,
    alignSelf: 'center',
    borderRadius: 20,
    marginBottom: 20,
  },

  title: {
    fontSize: 20,
    marginHorizontal: 10,
    fontFamily: 'Poppins-SemiBold',
    color: 'black',
    marginVertical: 15,
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
    height: commonHeight,
  },
  proceedButton: {
    backgroundColor: 'black',
    padding: 10,
    marginBottom: 10,
    marginTop: 5,
    borderRadius: 8,
    height: commonHeight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  proceedButtonText: {
    fontSize: screenWidth * 0.045,
    fontWeight: '600',
    color: 'white',
  },
  webViewContainer: {
    flex: 1,
  },
  webView: {},
});

export default MotilalModal;
