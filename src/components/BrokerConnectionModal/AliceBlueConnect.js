import React, {useRef, useState, useEffect} from 'react';
import {Dimensions} from 'react-native';
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

const AliceBlueConnect = ({
  isVisible,
  setShowAliceblueModal,
  onClose,
  setShowBrokerModal,
  fetchBrokerStatusModal,
}) => {
  const {configData} = useTrade();
  const showAlert = useModalStore(state => state.showAlert);

  const [clientCode, setClientCode] = useState('');
  const [apiKey, setApiKey] = useState('');
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

  const handleSubmit = () => {
    if (!userId || !clientCode || !apiKey) {
      showAlert(
        'error',
        'Missing Fields',
        'Please fill in all required fields.',
      );
      return;
    }

    setLoading(true);
    const brokerData = {
      uid: userId,
      user_broker: 'AliceBlue',
      clientCode: clientCode,
      apiKey: apiKey,
    };

    const config = {
      method: 'put',
      url: `${server.server.baseUrl}api/user/connect-broker`,
      headers: {
        'Content-Type': 'application/json',
        'X-Advisor-Subdomain':
          configData?.config?.REACT_APP_HEADER_NAME || getAdvisorSubdomain(),
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
        console.log(
          '[AliceBlue] Broker connected successfully, updating model portfolio...',
        );

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
            'X-Advisor-Subdomain':
              configData?.config?.REACT_APP_HEADER_NAME ||
              getAdvisorSubdomain(),
            'aq-encrypted-key': generateToken(
              Config.REACT_APP_AQ_KEYS,
              Config.REACT_APP_AQ_SECRET,
            ),
          },
        };

        return axios.request(A1_broker).catch(err => {
          console.warn(
            '[AliceBlue] Model portfolio update failed (non-critical):',
            err,
          );
          return null;
        });
      })
      .then(response => {
        if (response) {
          console.log('[AliceBlue] Model portfolio updated successfully');
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
      })
      .catch(error => {
        console.error('[AliceBlue] Connection error:', error);
        setLoading(false);
        showAlert(
          'error',
          'Incorrect Credentials',
          'Please check your User ID and API Key and try again.',
        );
      });
  };

  return (
    <AliceBlueConnectUI
      isVisible={isVisible}
      onClose={onClose}
      clientCode={clientCode}
      setClientCode={setClientCode}
      apiKey={apiKey}
      setApiKey={setApiKey}
      handleSubmit={handleSubmit}
      loading={loading}
    />
  );
};

export default AliceBlueConnect;
