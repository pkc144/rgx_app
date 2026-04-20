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

  const isToastShown = useRef(false);
  const hasProcessedCallback = useRef(false);

  // Handle modal visibility
  useEffect(() => {
    if (isVisible) {
      sheet.current?.present();
    } else {
      sheet.current?.dismiss();
      setShowWebView(false);
      setAuthUrl('');
      isToastShown.current = false;
      hasProcessedCallback.current = false;
    }
  }, [isVisible]);

  // Called after the CCXT server-side callback has finished the apisession →
  // session_token exchange and saved to the user record. No client-side
  // credential exchange happens here — this just closes the WebView, updates
  // model portfolio, and refreshes state (matches web's post-redirect flow).
  const finalizeConnection = () => {
    if (isToastShown.current) return;
    isToastShown.current = true;
    setShowWebView(false);

    // Non-critical: sync model portfolio with the newly connected broker.
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

    fetchBrokerStatusModal?.();
    eventEmitter.emit('refreshEvent', { source: 'ICICI Direct broker connection' });
    showAlert('success', 'Connected Successfully', 'Your ICICI Direct broker has been connected successfully!');
    onClose();
    setShowBrokerModal?.(false);
  };

  // Option B (web-parity) WebView interception.
  //
  // Expected flow after user authenticates at api.icicidirect.com:
  //   1. ICICI redirects to the URL registered in the user's ICICI dev
  //      dashboard. For web-parity, that URL MUST be
  //      `${ccxtServer}icici/auth-callback/${advisorSubdomain}` (see
  //      ICICIHelpContent.js).
  //   2. CCXT processes `apisession`, exchanges for `session_token`, saves
  //      everything server-side, then redirects the browser to the advisor's
  //      front-end URL (which on mobile matches REACT_APP_BROKER_CONNECT_REDIRECT_URL).
  //   3. We detect that final redirect here → close WebView → refresh state.
  //
  // If the user is still on the legacy mobile-direct callback URL, the
  // WebView will see `apisession=` on a URL that isn't the CCXT auth-callback.
  // We surface a guided error telling them to update the dashboard URL,
  // because the legacy client-side `customer-details` + `connect-broker`
  // handshake has been removed.
  const handleWebViewNavigationStateChange = newNavState => {
    const { url } = newNavState;
    console.log('[ICICI] WebView URL:', url);
    if (!url || hasProcessedCallback.current) return;

    const redirectBase =
      configData?.config?.REACT_APP_BROKER_CONNECT_REDIRECT_URL ||
      Config.REACT_APP_BROKER_CONNECT_REDIRECT_URL;
    const ccxtAuthCallbackPrefix = `${server.ccxtServer.baseUrl}icici/auth-callback/`;

    // Final redirect: CCXT finished → front-end app URL. Success.
    if (redirectBase && url.startsWith(redirectBase)) {
      hasProcessedCallback.current = true;
      finalizeConnection();
      return;
    }

    // Legacy dashboard config detected (user registered the app URL, not the
    // CCXT callback). We can't complete the flow without dashboard migration.
    if (url.includes('apisession=') && !url.startsWith(ccxtAuthCallbackPrefix)) {
      hasProcessedCallback.current = true;
      setShowWebView(false);
      showAlert(
        'error',
        'ICICI Callback Not Configured',
        `Please log in to your ICICI developer dashboard, edit your app, and set the Redirect URL to:\n\n${ccxtAuthCallbackPrefix}${
          configData?.config?.REACT_APP_HEADER_NAME || getAdvisorSubdomain() || ''
        }\n\nThen try connecting again.`,
      );
    }
  };

  const checkValidApiAnSecret = details => {
    const bytesKey = CryptoJS.AES.encrypt(details, 'ApiKeySecret');
    return bytesKey.toString();
  };

  // Egress-IP gate (see EgressIpCallout). ICICI requires a dedicated
  // static IP whitelisted in Breeze API app → IP Whitelist.
  const [egressReady, setEgressReady] = useState(false);
  const [unmetAck, setUnmetAck] = useState(false);

  const initiateAuth = () => {
    if (!egressReady) {
      setUnmetAck(true);
      return;
    }
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
      egressUserId={userDetails?._id}
      egressUserEmail={userEmail}
      egressReady={egressReady}
      setEgressReady={setEgressReady}
      unmetAck={unmetAck}
      setUnmetAck={setUnmetAck}
      configData={configData}
    />
  );
};

export default ICICIUPModal;
