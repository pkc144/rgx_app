import React, {useRef, useState, useEffect} from 'react';
import {getAuth} from '@react-native-firebase/auth';
import server from '../../utils/serverConfig';
import axios from 'axios';
import Config from 'react-native-config';
import {generateToken} from '../../utils/SecurityTokenManager';
import AliceBlueConnectUI from '../../UIComponents/BrokerConnectionUI/AliceBlueConnectUI';
import {useTrade} from '../../screens/TradeContext';
import {getAdvisorSubdomain} from '../../utils/variantHelper';
import eventEmitter from '../EventEmitter';
import useModalStore from '../../GlobalUIModals/modalStore';

// Route through CCXT backend (matching web's handleAliceBlueConnect) so origin
// is stored in MongoDB for multi-site callback routing. The CCXT server
// redirects to AliceBlue and then back to `${origin}${returnPath}` with the
// OAuth result params, which the WebView nav handler below intercepts.
const buildAliceBlueAuthUrl = () => {
  const raw =
    Config?.REACT_APP_BROKER_CONNECT_REDIRECT_URL ||
    `https://${getAdvisorSubdomain()}.alphaquark.in/stock-recommendation`;
  let origin = raw;
  let returnPath = '/stock-recommendation';
  try {
    const parsed = new URL(raw);
    origin = parsed.origin;
    returnPath = parsed.pathname || '/stock-recommendation';
  } catch (e) {
    // Fall through to defaults if REACT_APP_BROKER_CONNECT_REDIRECT_URL
    // isn't a valid absolute URL on this build.
  }
  return `${server.ccxtServer.baseUrl}aliceblue/login?origin=${encodeURIComponent(
    origin,
  )}&returnPath=${encodeURIComponent(returnPath)}`;
};

const AliceBlueConnect = ({
  isVisible,
  setShowAliceblueModal,
  onClose,
  setShowBrokerModal,
  fetchBrokerStatusModal,
}) => {
  const {configData} = useTrade();
  const showAlert = useModalStore(state => state.showAlert);
  const hasProcessedCallback = useRef(false);

  const [loading, setLoading] = useState(false);

  const auth = getAuth();
  const user = auth.currentUser;
  const userEmail = user?.email;

  const [userDetails, setUserDetails] = useState();
  const getUserDeatils = () => {
    axios
      .get(`${server.server.baseUrl}api/user/getUser/${userEmail}`, {
        headers: {
          'Content-Type': 'application/json',
          'X-Advisor-Subdomain':
            configData?.config?.REACT_APP_HEADER_NAME || getAdvisorSubdomain(),
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

  // Get common headers for API calls
  const getHeaders = () => ({
    'Content-Type': 'application/json',
    'X-Advisor-Subdomain':
      configData?.config?.REACT_APP_HEADER_NAME || getAdvisorSubdomain(),
    'aq-encrypted-key': generateToken(
      Config.REACT_APP_AQ_KEYS,
      Config.REACT_APP_AQ_SECRET,
    ),
  });

  // Parse query string from URL
  const parseQueryString = queryString => {
    const params = {};
    if (!queryString) return params;
    const query = queryString.startsWith('?')
      ? queryString.substring(1)
      : queryString;
    const pairs = query.split('&');
    pairs.forEach(pair => {
      const [key, value] = pair.split('=');
      if (key && value) {
        params[decodeURIComponent(key)] = decodeURIComponent(value);
      }
    });
    return params;
  };

  // Handle WebView navigation - detect OAuth callback params
  // Prod callback returns: user_broker=AliceBlue&status=0&access_token=xxx&client_id=yyy
  const handleWebViewNavigationStateChange = navState => {
    const {url} = navState;
    console.log('[AliceBlue] WebView URL:', url);

    if (hasProcessedCallback.current) return;

    // Detect callback URL with AliceBlue OAuth params
    if (
      url.includes('user_broker=AliceBlue') ||
      (url.includes('access_token=') && url.includes('client_id='))
    ) {
      const queryString = url.split('?')[1];
      if (!queryString) return;

      const queryParams = parseQueryString(queryString);
      const status = queryParams.status;
      const accessToken = queryParams.access_token;
      const clientId = queryParams.client_id;

      if (status === '1') {
        // AliceBlue connection failed
        const errorMsg = queryParams.error || 'Connection failed';
        console.error('[AliceBlue] OAuth failed:', errorMsg);
        hasProcessedCallback.current = true;
        showAlert(
          'error',
          'Connection Failed',
          `AliceBlue connection failed: ${errorMsg}`,
        );
        onClose();
        return;
      }

      if (status === '0' && accessToken && clientId) {
        hasProcessedCallback.current = true;
        saveBrokerConnection(accessToken, clientId);
      }
    }
  };

  // Save broker connection (same as prod connectBroker.js AliceBlue callback)
  const saveBrokerConnection = async (accessToken, clientId) => {
    if (!userId) {
      showAlert('error', 'Error', 'User not found. Please try again.');
      return;
    }

    setLoading(true);
    try {
      const brokerData = {
        uid: userId,
        user_broker: 'AliceBlue',
        jwtToken: accessToken,
        clientCode: clientId,
      };

      await axios.request({
        method: 'put',
        url: `${server.server.baseUrl}api/user/connect-broker`,
        headers: getHeaders(),
        data: JSON.stringify(brokerData),
      });

      console.log(
        '[AliceBlue] Broker connected successfully, updating model portfolio...',
      );

      // Update model portfolio (non-critical)
      try {
        await axios.request({
          method: 'post',
          url: `${server.ccxtServer.baseUrl}rebalance/change_broker_model_pf`,
          data: JSON.stringify({
            user_email: userEmail,
            user_broker: 'AliceBlue',
          }),
          headers: getHeaders(),
        });
        console.log('[AliceBlue] Model portfolio updated successfully');
      } catch (err) {
        console.warn(
          '[AliceBlue] Model portfolio update failed (non-critical):',
          err,
        );
      }

      setLoading(false);
      fetchBrokerStatusModal();
      eventEmitter.emit('refreshEvent', {
        source: 'AliceBlue broker connection',
      });
      showAlert(
        'success',
        'Connected Successfully',
        'Your AliceBlue broker has been connected successfully!',
      );
      onClose();
      setShowBrokerModal(false);
    } catch (error) {
      console.error('[AliceBlue] Connection error:', error);
      setLoading(false);
      showAlert(
        'error',
        'Connection Error',
        'Failed to connect AliceBlue. Please try again.',
      );
    }
  };

  // Reset callback flag when modal opens
  useEffect(() => {
    if (isVisible) {
      hasProcessedCallback.current = false;
    }
  }, [isVisible]);

  return (
    <AliceBlueConnectUI
      isVisible={isVisible}
      onClose={onClose}
      authUrl={buildAliceBlueAuthUrl()}
      handleWebViewNavigationStateChange={handleWebViewNavigationStateChange}
      loading={loading}
    />
  );
};

export default AliceBlueConnect;
