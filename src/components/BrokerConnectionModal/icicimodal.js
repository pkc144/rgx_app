import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  SafeAreaView,
  Pressable,
} from 'react-native';
import WebView from 'react-native-webview';

import { getAuth } from '@react-native-firebase/auth';
import Toast from 'react-native-toast-message';
import server from '../../utils/serverConfig';
import axios from 'axios';
import { FloatingLabelInput } from 'react-native-floating-label-input';
import CryptoJS from 'react-native-crypto-js';

import HelpModal from './HelpModal';
import Modal from 'react-native-modal';
import Config from 'react-native-config';
import { generateToken } from '../../utils/SecurityTokenManager';
import {
  XIcon,
  EyeIcon,
  EyeOffIcon,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  ChevronRight,
} from 'lucide-react-native';
import ICICIConnectUI from '../../UIComponents/BrokerConnectionUI/ICICIConnectUI';
import { useTrade } from '../../screens/TradeContext';
import { getAdvisorSubdomain } from '../../utils/variantHelper';
import eventEmitter from '../EventEmitter';

const ICICIUPModal = ({
  isVisible,
  setShowICICIUPModal,
  onClose,
  setShowBrokerModal,
  fetchBrokerStatusModal,
}) => {
  const { configData } = useTrade();
  const [apiKey, setApiKey] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isPasswordVisibleup, setIsPasswordVisibleup] = useState(false);
  const [showWebView, setShowWebView] = useState(false);
  const [authUrl, setAuthUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionToken, setSessionToken] = useState(null);
  const [apiSession, setApiSession] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [helpVisible, setHelpVisible] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeSections, setActiveSections] = useState([]);

  const sheet = useRef(null);
  const scrollViewRef = useRef(null);
  const isToastShown = useRef(false);
  const hasConnectedIcici = useRef(false);

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

  // Parse query string utility
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

  // Handle modal visibility
  useEffect(() => {
    if (isVisible) {
      sheet.current?.present();
    } else {
      sheet.current?.dismiss();
      // Reset states when modal closes
      setShowWebView(false);
      setAuthUrl('');
      setApiSession(null);
    }
  }, [isVisible]);

  // Connect ICICI Direct when apiSession is available
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
            setSessionToken(response.data.Success.session_token);
          }
        })
        .catch(error => {
          console.error('Error connecting to ICICI:', error.response);
          showToast('Failed to connect to ICICI Direct', 'error', '');
        });
    }
  }, [apiSession, apiKey]);

  // Update broker connection in database
  useEffect(() => {
    if (sessionToken && userDetails?._id && !isToastShown.current) {
      const brokerData = {
        uid: userDetails._id,
        user_broker: 'ICICI Direct',
        jwtToken: sessionToken,
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
          fetchBrokerStatusModal();
          eventEmitter.emit('refreshEvent', { source: 'ICICI Direct broker connection' });
          showToast('Your Broker Connected Successfully!', 'success', '');
          onClose();
          //setShowBrokerModal(false);
        })
        .catch(error => {
          console.error('Error updating broker connection:', error);
          showToast('Error connecting broker', 'error', '');
        });
    }
  }, [sessionToken, userDetails, fetchBrokerStatusModal, setShowBrokerModal]);

  const handleWebViewNavigationStateChange = newNavState => {
    const { url } = newNavState;
    if (url.includes('apisession=')) {
      const queryParams = parseQueryString(url.split('?')[1]);
      const sessionToken1 = queryParams.apisession;
      if (sessionToken1) {
        setApiSession(sessionToken1);
        setShowWebView(false);
      }
    }
  };

  const checkValidApiAnSecret = details => {
    const bytesKey = CryptoJS.AES.encrypt(details, 'ApiKeySecret');
    return bytesKey.toString();
  };

  const initiateAuth = () => {
    if (!userDetails?._id || !apiKey || !secretKey) {
      showToast('Please fill in all required fields', 'error', '');
      return;
    }

    const data = {
      uid: userDetails._id,
      user_broker: 'ICICI Direct',
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
        showToast('Authentication failed', 'error', '');
      });
  };

  const showToast = (message1, type, message2) => {
    Toast.show({
      type: type,
      text2: message2 + ' ' + message1,
      position: 'top',
      visibilityTime: 4000,
      autoHide: true,
      topOffset: 60,
      bottomOffset: 80,
      text1Style: {
        color: 'black',
        fontSize: 12,
        fontWeight: 0,
        fontFamily: 'Poppins-Medium',
      },
      text2Style: {
        color: 'black',
        fontSize: 13,
        fontFamily: 'Poppins-Regular',
      },
    });
  };

  const renderHeader = section => (
    <View
      style={{
        backgroundColor: '#F9FAFB',
        borderRadius: 10,
        flexDirection: 'row',
        alignContent: 'center',
        alignItems: 'center',
        alignSelf: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 10,
      }}>
      <Text style={styles.stepGuide}>
        Steps to Obtain API and Secret Key for HDFC:
      </Text>
      {isCollapsed ? (
        <ChevronUp size={24} color={'black'} />
      ) : (
        <ChevronDown size={24} color={'black'} />
      )}
    </View>
  );

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
    // console.log('modal:',helpVisible)
    setHelpVisible(true);
  };
  const handleClose = () => {
    onClose();
    // console.log('modal:',helpVisible)
    setShowBrokerModal(false);
  };

  useEffect(() => {
    if (
      userDetails?._id &&
      userDetails?.apiKey &&
      userDetails?.secretKey &&
      userDetails?.user_broker === 'ICICI Direct'
    ) {
      setApiKey(checkValidApiAnSecretdecrypt(userDetails?.apiKey));
      setSecretKey(checkValidApiAnSecretdecrypt(userDetails?.secretKey));
      let data = JSON.stringify({
        uid: userDetails?._id,
        user_broker: 'ICICI Direct',
        apiKey: userDetails?.apiKey,
        secretKey: userDetails?.secretKey,
      });

      let config = {
        method: 'put',
        url: `${server.server.baseUrl}api/icici/update-key`,

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
            const url = `https://api.icicidirect.com/apiuser/login?api_key=${encodeURIComponent(
              checkValidApiAnSecretdecrypt(userDetails?.apiKey),
            )}`;
            setAuthUrl(url);
            setShowWebView(true);
          }
        })
        .catch(error => {
          console.log(error.response);
        });
    }
  }, [isVisible, userDetails]);
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
