import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import server from '../../utils/serverConfig';
import { getAuth } from '@react-native-firebase/auth';
import Toast from 'react-native-toast-message';
import axios from 'axios';
import { generateToken } from '../../utils/SecurityTokenManager';
import Config from 'react-native-config';
import DhanConnectUI from '../../UIComponents/BrokerConnectionUI/DhanConnectUI';
import { useTrade } from '../../screens/TradeContext';
import { getAdvisorSubdomain } from '../../utils/variantHelper';
import eventEmitter from '../EventEmitter';
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const commonHeight = screenHeight * 0.06;
const commonWidth = '100%';
const DhanConnectModal = ({
  isVisible,

  onClose,
  setShowBrokerModal,
  fetchBrokerStatusModal,
}) => {
  const { configData } = useTrade();
  const [cliendId, setCliendId] = useState('');
  const [accessToken, setaccessToken] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isPasswordVisibleup, setIsPasswordVisibleup] = useState(false);
  const auth = getAuth();
  const user = auth.currentUser;
  const [loading, setLoading] = useState(false);
  const userEmail = user?.email;
  const sheet = useRef(null);
  const scrollViewRef = useRef(null);
  const [shouldRenderContent, setShouldRenderContent] = React.useState(false);

  const [helpVisible, setHelpVisible] = useState(false);
  const OpenHelpModal = () => {
    // console.log('modal:',helpVisible)
    setHelpVisible(true);
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
  useEffect(() => {
    if (isVisible) {
      setShouldRenderContent(true);
      console.log('open');
      sheet.current?.present(); // Show the TrueSheet if visible
    } else {
      sheet.current?.dismiss(); // Hide the TrueSheet if not visible
    }
  }, [isVisible]);

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
        fontSize: 12,
        fontFamily: 'Poppins-Regular', // Customize your font
      },
    });
  };

  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = () => {
    setLoading(true);
    const data = JSON.stringify({
      uid: userId,
      user_broker: 'Dhan',
      clientCode: cliendId, // separate clientCode input
      jwtToken: accessToken, // separate jwtToken input
    });
    console.log('data', data);
    const config = {
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

      data: data,
    };
    axios
      .request(config)
      .then(response => {
        setLoading(false);
        console.log('connected');
        showToast('Broker Connected Successfully', 'success', '');
        fetchBrokerStatusModal();
        eventEmitter.emit('refreshEvent', { source: 'Dhan broker connection' });
        // setShowDhanModal(false);
        setShowBrokerModal(false);
        onClose();
        getUserDeatils();
        setIsLoading(false);
      })
      .catch(error => {
        console.log(error.response, error.response.message, error.message);
        setLoading(false);
        getUserDeatils();
        Toast.show({
          type: 'error',
          text1: 'Incorrect credentials',
          text2: 'Please try again.',
          position: 'top',
          visibilityTime: 5000,
          autoHide: true,
          topOffset: 30,
        });
      });
  };

  return (
    <DhanConnectUI
      isVisible={isVisible}
      onClose={onClose}
      cliendId={cliendId}
      accessToken={accessToken}
      setCliendId={setCliendId}
      setaccessToken={setaccessToken}
      isPasswordVisible={isPasswordVisible}
      isPasswordVisibleup={isPasswordVisibleup}
      setIsPasswordVisible={setIsPasswordVisible}
      setIsPasswordVisibleup={setIsPasswordVisibleup}
      handleSubmit={handleSubmit}
      loading={loading}
      shouldRenderContent={shouldRenderContent}
      OpenHelpModal={OpenHelpModal}
      setHelpVisible={setHelpVisible}
      helpVisible={helpVisible}
    />
  );
};

const styles = StyleSheet.create({
  modal: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
  },
  horizontal: {
    width: 110,
    height: 6,
    borderRadius: 250,
    alignSelf: 'center',
    backgroundColor: 'lightgray',
  },
  scrollViewContent: {
    padding: 0,
  },
  playerWrapper: {
    overflow: 'hidden',
    marginTop: 20,
    alignSelf: 'center',
    borderRadius: 20,
  },
  content: {
    marginTop: screenHeight * 0.01,
  },
  content1: {
    paddingHorizontal: 10,
  },
  label: {
    fontSize: 17,
    fontWeight: 'bold',
    color: 'black',
    marginBottom: 5,
  },
  inputContainer: {
    borderColor: '#d5d4d4',
    alignSelf: 'center',
    borderWidth: 1,
    borderRadius: 10,
    color: 'black',
    paddingHorizontal: 10,
    width: '106%',
    height: commonHeight,
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
    fontSize: 18,
    color: 'black',
    marginRight: 10,
    marginLeft: 10,
    fontFamily: 'Poppins-SemiBold',
  },
  proceedButton: {
    backgroundColor: 'black',
    padding: 10,
    borderRadius: 8,
    height: screenHeight * 0.06,
    alignItems: 'center',
    justifyContent: 'center',
  },
  proceedButtonText: {
    fontSize: screenWidth * 0.045,
    fontWeight: '600',
    color: 'white',
  },
  webView: {
    flex: 1,
  },
  closeWebViewButton: {
    backgroundColor: 'black',
    padding: 10,
    alignItems: 'center',
  },
  closeWebViewButtonText: {
    color: 'white',
    fontSize: 16,
  },
});

export default DhanConnectModal;
