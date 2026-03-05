import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import server from '../../utils/serverConfig';
import CryptoJS from 'react-native-crypto-js';
import { getAuth } from '@react-native-firebase/auth';
import axios from 'axios';

import { generateToken } from '../../utils/SecurityTokenManager';
import Config from 'react-native-config';
import MotilalConnectUI from '../../UIComponents/BrokerConnectionUI/MotilalConnectUI';
import { useTrade } from '../../screens/TradeContext';
import { getAdvisorSubdomain } from '../../utils/variantHelper';
import eventEmitter from '../EventEmitter';
import useModalStore from '../../GlobalUIModals/modalStore';

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
  const showAlert = useModalStore((state) => state.showAlert);
  const [apiKey, setApiKey] = useState('');
  const [clientCode, setClientCode] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [ispasswordVisibleup, setIsPasswordVisibleup] = useState(false);
  const [showWebView, setShowWebView] = useState(false);
  const [authUrl, setAuthUrl] = useState('');
  const auth = getAuth();
  const user = auth.currentUser;
  const userEmail = user?.email;
  const sheet = useRef(null);
  const scrollViewRef = useRef(null);

  const [loading, setLoading] = useState(false);

  const checkValidApiAnSecret = details => {
    const bytesKey = CryptoJS.AES.encrypt(details, 'ApiKeySecret');
    const Key = bytesKey.toString();
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

  const [helpVisible, setHelpVisible] = useState(false);

  const initiateAuth = () => {
    console.log('I am here--', apiKey, clientCode, userDetails?._id);
    if (!userDetails?._id || !apiKey || !clientCode) {
      showAlert('error', 'Missing Fields', 'Please fill in all required fields.');
      return;
    }
    const data = {
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

  const handleWebViewNavigationStateChange = newNavState => {
    const { url } = newNavState;
    const callbackUrl = configData?.config?.REACT_APP_BROKER_CONNECT_REDIRECT_URL || '';

    if (url.includes(callbackUrl) || url.includes('/callback')) {
      setShowWebView(false);
      fetchBrokerStatusModal();
      eventEmitter.emit('refreshEvent', { source: 'Motilal Oswal broker connection' });
      showAlert('success', 'Connected Successfully', 'Your Motilal Oswal broker has been connected successfully!');
      onClose();
      setShowBrokerModal(false);
    }
  };

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
    setShowWebView(false);
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
    height: '100%',
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
