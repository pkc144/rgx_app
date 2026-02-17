import React, { useRef, useState, useEffect } from 'react';

import { View, StyleSheet, Dimensions } from 'react-native';
import { getAuth } from '@react-native-firebase/auth';
import server from '../../utils/serverConfig';
import axios from 'axios';
const { height: screenHeight } = Dimensions.get('window');
import Config from 'react-native-config';
import { generateToken } from '../../utils/SecurityTokenManager';
import { getAdvisorSubdomain } from '../../utils/variantHelper';
import GrowwConnectUI from '../../UIComponents/BrokerConnectionUI/GrowwConnectUI';
import { useTrade } from '../../screens/TradeContext';
import eventEmitter from '../EventEmitter';
import useModalStore from '../../GlobalUIModals/modalStore';

const GrowwConnectModal = ({
  isVisible,
  setShowangleoneModal,
  onClose,
  setShowBrokerModal,
  fetchBrokerStatusModal,
}) => {
  const { configData } = useTrade();
  const showAlert = useModalStore((state) => state.showAlert);
  const sheet = useRef(null);
  const scrollViewRef = useRef(null); // ScrollView ref for nested scrolling
  const [authUrl, setauthurl] = useState('https://prod.alphaquark.in/');
  const [authtoken, setAuthToken] = useState(null);
  const auth = getAuth();
  const user = auth.currentUser;
  const userEmail = user?.email;
  const finalUrl =
    'intent://groww.in/oauth/authorize?response_type=code&client_id=4d3e71cd681041ba84e8cb521644aa62&redirect_uri=https%3A%2F%2Fccxtprod.alphaquark.in%2Fgroww%2Foauth%2Fcallback&scope=openid+profile+holdings%3Aread&state=cHJvZC5hbHBoYXF1YXJrLmluL3N0b2NrLXJlY29tbWVuZGF0aW9ufG1QVkdvRk56eFNZXzMzaE1STlk4Uk1QdndfSEZLZjhfOTFBVnBEOE5jX00%3D&code_challenge=LZlRCVivV96ttQM90rDkbN0ORQp7E80G0cP9QtgIwzs&code_challenge_method=S256&handledOnceGrowwParam=true#Intent;scheme=https;package=com.nextbillion.groww;end';
  const webViewRef = useRef(null);

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
    const query = queryString?.startsWith('?')
      ? queryString?.substring(1)
      : queryString;
    const pairs = query?.split('&');

    pairs?.forEach(pair => {
      const [key, value] = pair?.split('=');
      if (key && value) {
        params[decodeURIComponent(key)] = decodeURIComponent(value);
      }
    });

    return params;
  };

  const handleWebViewNavigationStateChange = newNavState => {
    const { url, loading, title } = newNavState;
    console.log('🔍 [Groww] Navigation State Change:', { url, loading, title });

    // 🚫 Block intent:// before it crashes WebView
    if (url && url.startsWith('intent://')) {
      console.log('⚠️ [Groww] Blocking intent:// URL:', url);
      if (webViewRef.current) {
        webViewRef.current.stopLoading(); // hard stop navigation
      }
      return; // exit early
    }

    // ✅ Check if this is a callback URL (redirected back to our app)
    // The backend OAuth callback endpoint processes the Groww response and redirects
    // to the app with query parameters
    const isCallbackUrl = url && (
      url.includes('equitypro.co.in') ||
      url.includes('alphaquark.in') ||
      url.includes('oauth/callback') ||
      url.includes('access_token') ||
      url.includes('user_broker')
    );

    if (isCallbackUrl) {
      console.log('✅ [Groww] Detected callback URL:', url);

      // Parse query parameters from URL (handle both ? and # fragments)
      const urlParts = url.split(/[?#]/);
      const queryString = urlParts.length > 1 ? urlParts.slice(1).join('&') : '';
      const queryParams = parseQueryString(queryString);
      console.log('📋 [Groww] Query params:', queryParams);

      const growwBroker = queryParams.user_broker;
      const growwStatus = queryParams.status;
      const growwToken = queryParams.access_token;

      // Check for successful authentication
      if (growwBroker === 'Groww' && growwStatus === '0' && growwToken) {
        console.log('🎉 [Groww] Authentication successful, token received');
        setAuthToken(growwToken);
        showAlert('success', 'Connected Successfully', 'Your Groww broker has been connected successfully!');
        onClose(); // Close modal
      } else if (queryParams.error) {
        console.log('❌ [Groww] Authentication error:', queryParams.error);
        showAlert('error', 'Connection Failed', queryParams.error_description || 'Failed to connect to Groww');
        onClose();
      } else if (queryParams.user_broker === 'Groww' || queryParams.status) {
        // Partial match - log for debugging
        console.log('⚠️ [Groww] Partial match - missing some params:', {
          has_broker: !!growwBroker,
          has_status: !!growwStatus,
          has_token: !!growwToken,
          all_params: queryParams
        });
      }
    }

    // Detect blank/failed page loads
    if (!loading && url && !url.startsWith('intent://')) {
      console.log('📄 [Groww] Page finished loading:', url);
      // Check if we're stuck on a blank page
      if (title === '' || title === 'about:blank') {
        console.log('⚠️ [Groww] Detected blank page - possible issue');
      }
    }
  };

  const angelApi = configData?.config?.REACT_APP_ANGEL_ONE_API_KEY;

  const isToastShown = useRef(false);
  const connectBrokerDbUpadte = () => {
    console.log('here i am---11');
    if (authtoken) {
      if (true) {
        console.log('heref');
        isToastShown.current = true; // Prevent further execution
        let brokerData = {
          uid: userId,
          user_broker: 'Groww',
          jwtToken: authtoken,
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
        console.log('Broker Data:', brokerData);
        axios
          .request(config)
          .then(response => {
            console.log('success brooooohh');
            fetchBrokerStatusModal();
            eventEmitter.emit('refreshEvent', { source: 'Groww broker connection' });
            showAlert('success', 'Connected Successfully', 'Your Groww broker has been connected successfully!');
            setShowBrokerModal(false);
            onClose();
          })
          .catch(error => {
            console.log(error);
            showAlert('error', 'Connection Error', 'Failed to connect to Groww. Please try again.');
          });
      }
    }
  };

  useEffect(() => {
    if (userId !== undefined && authtoken) {
      connectBrokerDbUpadte();
    }
  }, [userId, authtoken]);

  const connectGrow = () => {
    let config = {
      method: 'get',
      url: `${server.ccxtServer.baseUrl
        }groww/login/oauth?redirectUri=${configData?.config?.REACT_APP_BROKER_CONNECT_REDIRECT_URL.replace(
          'https://',
          '',
        )}`,
      headers: {
        'Content-Type': 'application/json',
        'X-Advisor-Subdomain': configData?.config?.REACT_APP_HEADER_NAME || getAdvisorSubdomain(),
        'aq-encrypted-key': generateToken(
          Config.REACT_APP_AQ_KEYS,
          Config.REACT_APP_AQ_SECRET,
        ),
      },
    };

    axios
      .request(config)
      .then(response => {
        console.log('Groww Details--', response.data);
        if (response?.data?.status === 0) {
          setauthurl(response?.data?.redirectUrl);
        }
      })
      .catch(error => {
        console.log(error);
      });
  };

  useEffect(() => {
    if (isVisible) {
      connectGrow();
      sheet.current?.present(); // Show the TrueSheet if visible
    } else {
      sheet.current?.dismiss(); // Hide the TrueSheet if not visible
    }
  }, [isVisible]);

  const handleClose = () => {
    // setShowangleoneModal(false);
    // Update the state to reflect the sheet is closed
    onClose(); // Call the parent onClose function
  };

  return (
    <GrowwConnectUI
      isVisible={isVisible}
      onClose={onClose}
      handleClose={handleClose}
      authUrl={authUrl}
      handleWebViewNavigationStateChange={handleWebViewNavigationStateChange}
      webViewRef={webViewRef}
    />
  );
};

const styles = StyleSheet.create({
  content: {
    padding: 10,
  },
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 10,
  },
  handleIndicator: {
    width: 110,
    height: 6,
    borderRadius: 250,
    alignSelf: 'center',
    backgroundColor: '#f1f4f8',
    marginBottom: 5,
    marginTop: 20,
  },
  sheetContent: {
    flex: 1,
  },
  webView: {
    flex: 1,
    minHeight: screenHeight, // Ensure WebView has enough space for internal scrolling
  },
});

export default GrowwConnectModal;
