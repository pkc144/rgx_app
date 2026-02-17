import React, { useState, useRef, useEffect } from 'react';
import { Dimensions } from 'react-native';
import { getAuth } from '@react-native-firebase/auth';
import server from '../../utils/serverConfig';
import axios from 'axios';

import Config from 'react-native-config';
import { generateToken } from '../../utils/SecurityTokenManager';

import AliceBlueConnectUI from '../../UIComponents/BrokerConnectionUI/AliceBlueConnectUI';
import { useTrade } from '../../screens/TradeContext';
import { getAdvisorSubdomain } from '../../utils/variantHelper';
import eventEmitter from '../EventEmitter';
import useModalStore from '../../GlobalUIModals/modalStore';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const AliceBlueConnect = ({
  isVisible,
  setShowAliceblueModal,
  onClose,
  setShowBrokerModal,
  fetchBrokerStatusModal,
}) => {
  const { configData } = useTrade();
  const showAlert = useModalStore((state) => state.showAlert);
  const [apiKey, setApiKey] = useState('');
  const [clientCode, setclientCode] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isPasswordVisibleup, setIsPasswordVisibleup] = useState(false);
  const [showWebView, setShowWebView] = useState(false);
  const [authUrl, setAuthUrl] = useState('');

  const [loading, setLoading] = useState(false);
  const [sessionToken, setSessionToken] = useState(null);
  const [apiSession, setApiSession] = useState(null);
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
    console.log('here1', url);
    if (url.includes('apisession=')) {
      console.log('here2', url);
      const queryParams = parseQueryString(url.split('?')[1]);
      const sessionToken1 = queryParams.apisession;
      if (sessionToken1) {
        setApiSession(sessionToken1);
        console.log('here3', sessionToken1);
        setShowWebView(false);
        setShowAliceblueModal(false);
      }
    }
  };

  const connectBrokerDbUpadte = () => {
    // Validate inputs before connecting
    if (!clientCode || !apiKey) {
      showAlert('error', 'Missing Information', 'Please enter both Client ID and API Key.');
      return;
    }

    if (!userId) {
      showAlert('error', 'User Not Found', 'Unable to fetch user details. Please try again.');
      return;
    }

    setLoading(true);
    console.log('[AliceBlue] Connecting broker...');

    let brokerData = {
      uid: userId,
      user_broker: 'AliceBlue',
      clientCode: clientCode.trim(),
      apiKey: apiKey.trim(),
    };
    console.log('[AliceBlue] Broker data:', { ...brokerData, apiKey: '***' }); // Hide API key in logs
    let config = {
      method: 'put',
      url: `${server.server.baseUrl}api/user/connect-broker`,
      data: brokerData,
      headers: {
        'Content-Type': 'application/json',
        'X-Advisor-Subdomain': configData?.config?.REACT_APP_HEADER_NAME || getAdvisorSubdomain(),
        'aq-encrypted-key': generateToken(
          Config.REACT_APP_AQ_KEYS,
          Config.REACT_APP_AQ_SECRET,
        ),
      },
      // No need for JSON.stringify
    };

    axios
      .request(config)
      .then(response => {
        console.log('[AliceBlue] Broker connected successfully, updating model portfolio...');

        // Update model portfolio with broker information
        let newBrokerData = {
          user_email: userEmail,
          user_broker: 'AliceBlue',
        };
        let A1_broker = {
          method: 'post',
          url: `${server.ccxtServer.baseUrl}rebalance/change_broker_model_pf`,
          data: JSON.stringify(newBrokerData),
          headers: {
            'Content-Type': 'application/json',
            'X-Advisor-Subdomain': configData?.config?.REACT_APP_HEADER_NAME || getAdvisorSubdomain(),
            'aq-encrypted-key': generateToken(
              Config.REACT_APP_AQ_KEYS,
              Config.REACT_APP_AQ_SECRET,
            ),
          },
        };

        // Execute the model portfolio broker update
        return axios.request(A1_broker);
      })
      .then(response => {
        console.log('[AliceBlue] Model portfolio updated successfully');
        fetchBrokerStatusModal();
        eventEmitter.emit('refreshEvent', { source: 'AliceBlue broker connection' });
        showAlert('success', 'Connected Successfully', 'Your AliceBlue broker has been connected successfully!');
        setLoading(false);
        setShowAliceblueModal(false);
        setShowBrokerModal(false);
      })
      .catch(error => {
        console.error('[AliceBlue] Connection error:', error);
        console.error('[AliceBlue] Error details:', error.response ? error.response.data : error.message);

        setLoading(false);

        // Provide more specific error message
        const errorMessage = error.response?.data?.message
          || error.response?.data?.error
          || error.message
          || 'Failed to connect to AliceBlue. Please verify your Client ID and API Key.';

        showAlert('error', 'Connection Error', errorMessage);
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

  const [activeSections, setActiveSections] = useState([]);

  const OpenHelpModal = () => {
    // console.log('modal:',helpVisible)
    setHelpVisible(true);
  };

  return (
    <AliceBlueConnectUI
      isVisible={isVisible}
      onClose={onClose}
      shouldRenderContent={shouldRenderContent}
      clientCode={clientCode}
      apiKey={apiKey}
      setclientCode={setclientCode}
      setApiKey={setApiKey}
      handleSubmit={connectBrokerDbUpadte}
      scrollViewRef={scrollViewRef}
      setIsPasswordVisible={setIsPasswordVisible}
      setIsPasswordVisibleup={setIsPasswordVisibleup}
      isPasswordVisible={isPasswordVisible}
      isPasswordVisibleup={isPasswordVisibleup}
      showWebView={showWebView}
      OpenHelpModal={OpenHelpModal}
      setShowAliceblueModal={setShowBrokerModal}
      connectBrokerDbUpadte={connectBrokerDbUpadte}
      activeSections={activeSections}
      setActiveSections={setActiveSections}
      loading={loading}
      helpVisible={helpVisible}
      setHelpVisible={setHelpVisible}
    />
  );
};

export default AliceBlueConnect;
