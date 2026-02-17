import React, { useRef, useState, useEffect } from 'react';

import { View, StyleSheet, Dimensions, ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import { getAuth } from '@react-native-firebase/auth';
import server from '../../utils/serverConfig';
import axios from 'axios';
const { height: screenHeight } = Dimensions.get('window');
import Config from 'react-native-config';
import { generateToken } from '../../utils/SecurityTokenManager';
import { getAdvisorSubdomain } from '../../utils/variantHelper';
import InAppBrowser from 'react-native-inappbrowser-reborn';
import { useTrade } from '../../screens/TradeContext';
import eventEmitter from '../EventEmitter';
import useModalStore from '../../GlobalUIModals/modalStore';
import CrossPlatformOverlay from '../../components/CrossPlatformOverlay';

const GrowwConnectModal = ({
  isVisible,
  setShowangleoneModal,
  onClose,
  setShowBrokerModal,
  fetchBrokerStatusModal,
}) => {
  const { configData } = useTrade();
  const showAlert = useModalStore((state) => state.showAlert);
  const [isLoading, setIsLoading] = useState(false);
  const [authUrl, setAuthUrl] = useState('');
  const [userDetails, setUserDetails] = useState();
  const auth = getAuth();
  const user = auth.currentUser;
  const userEmail = user?.email;

  const getUserDetails = () => {
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
      .catch(err => console.log('[Groww] Failed to fetch user details:', err));
  };

  useEffect(() => {
    if (userEmail) {
      getUserDetails();
    }
  }, [userEmail, server.server.baseUrl]);

  const userId = userDetails?._id;

  // Parse query parameters from URL
  const parseQueryString = queryString => {
    const params = {};
    const query = queryString?.startsWith('?') ? queryString?.substring(1) : queryString;
    const pairs = query?.split('&');
    pairs?.forEach(pair => {
      const [key, value] = pair?.split('=');
      if (key && value) {
        params[decodeURIComponent(key)] = decodeURIComponent(value);
      }
    });
    return params;
  };

  // Save broker connection to database
  const saveBrokerConnection = async (accessToken) => {
    try {
      console.log('[Groww] Saving broker connection to database...');
      const brokerData = {
        uid: userId,
        user_broker: 'Groww',
        jwtToken: accessToken,
      };

      const response = await axios.request({
        method: 'put',
        url: `${server.server.baseUrl}api/user/connect-broker`,
        headers: {
          'Content-Type': 'application/json',
          'X-Advisor-Subdomain': configData?.config?.REACT_APP_HEADER_NAME || getAdvisorSubdomain(),
          'aq-encrypted-key': generateToken(Config.REACT_APP_AQ_KEYS, Config.REACT_APP_AQ_SECRET),
        },
        data: JSON.stringify(brokerData),
      });

      console.log('[Groww] Broker connection saved successfully, updating model portfolio...');

      // Update model portfolio with broker information
      let newBrokerData = {
        user_email: userEmail,
        user_broker: 'Groww',
      };
      let A1_broker = {
        method: 'post',
        url: `${server.ccxtServer.baseUrl}rebalance/change_broker_model_pf`,
        data: JSON.stringify(newBrokerData),
        headers: {
          'Content-Type': 'application/json',
          'X-Advisor-Subdomain': configData?.config?.REACT_APP_HEADER_NAME || getAdvisorSubdomain(),
          'aq-encrypted-key': generateToken(Config.REACT_APP_AQ_KEYS, Config.REACT_APP_AQ_SECRET),
        },
      };

      // Execute the model portfolio broker update
      await axios.request(A1_broker);

      console.log('[Groww] Model portfolio updated successfully');
      fetchBrokerStatusModal();
      eventEmitter.emit('refreshEvent', { source: 'Groww broker connection' });
      showAlert('success', 'Connected Successfully', 'Your Groww broker has been connected successfully!');
      setShowBrokerModal(false);
      onClose();
    } catch (error) {
      console.error('[Groww] Failed to save broker connection:', error);
      showAlert('error', 'Connection Error', 'Failed to save Groww connection. Please try again.');
    }
  };

  // Open Groww OAuth in InAppBrowser (Chrome Custom Tabs / SFSafariViewController)
  const connectGroww = async () => {
    if (!userId) {
      showAlert('error', 'Error', 'User not found. Please try again.');
      return;
    }

    setIsLoading(true);
    try {
      // Get OAuth URL from backend
      const redirectUrl = Config.REACT_APP_BROKER_CONNECT_REDIRECT_URL;
      console.log('[Groww] Using redirect URL:', redirectUrl);

      const response = await axios.get(
        `${server.ccxtServer.baseUrl}groww/login/oauth?redirectUri=${redirectUrl.replace('https://', '')}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Advisor-Subdomain': configData?.config?.REACT_APP_HEADER_NAME || getAdvisorSubdomain(),
            'aq-encrypted-key': generateToken(Config.REACT_APP_AQ_KEYS, Config.REACT_APP_AQ_SECRET),
          },
        }
      );

      if (response?.data?.status === 0 && response?.data?.redirectUrl) {
        const oauthUrl = response.data.redirectUrl;
        console.log('[Groww] Opening OAuth URL in InAppBrowser:', oauthUrl);

        // Close the modal before opening InAppBrowser
        onClose();

        // Open OAuth in InAppBrowser (Chrome Custom Tabs on Android, SFSafariViewController on iOS)
        if (await InAppBrowser.isAvailable()) {
          const result = await InAppBrowser.openAuth(oauthUrl, redirectUrl, {
            dismissButtonStyle: 'cancel',
            preferredBarTintColor: '#ffffff',
            preferredControlTintColor: '#000000',
            readerMode: false,
            animated: true,
            modalPresentationStyle: 'fullScreen',
            modalTransitionStyle: 'coverVertical',
            modalEnabled: true,
            enableBarCollapsing: false,
            // Android Chrome Custom Tabs options
            showTitle: true,
            enableUrlBarHiding: true,
            enableDefaultShare: false,
            forceCloseOnRedirection: false,
          });

          console.log('[Groww] InAppBrowser result:', result);

          // Parse the callback URL
          if (result.type === 'success' && result.url) {
            const urlParts = result.url.split(/[?#]/);
            const queryString = urlParts.length > 1 ? urlParts.slice(1).join('&') : '';
            const queryParams = parseQueryString(queryString);

            const growwBroker = queryParams.user_broker;
            const growwStatus = queryParams.status;
            const growwToken = queryParams.access_token;

            // Check for successful authentication
            if (growwBroker === 'Groww' && growwStatus === '0' && growwToken) {
              console.log('[Groww] Authentication successful, saving connection...');
              await saveBrokerConnection(growwToken);
            } else if (queryParams.error) {
              console.error('[Groww] OAuth error:', queryParams.error);
              showAlert('error', 'Connection Failed', queryParams.error_description || 'Failed to connect to Groww');
            } else {
              console.log('[Groww] Unexpected callback params:', queryParams);
              showAlert('error', 'Connection Failed', 'Failed to complete Groww authentication');
            }
          } else if (result.type === 'cancel') {
            console.log('[Groww] User canceled OAuth');
          }
        } else {
          showAlert('error', 'Error', 'InAppBrowser is not available on this device');
        }
      } else {
        throw new Error('Failed to get OAuth URL from server');
      }
    } catch (error) {
      console.error('[Groww] Connection error:', error);
      showAlert('error', 'Connection Error', error.response?.data?.msg || error.message || 'Failed to connect to Groww');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <CrossPlatformOverlay visible={isVisible} onClose={onClose}>
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Connect to Groww</Text>
          <Text style={styles.description}>
            Click the button below to securely connect your Groww account. You'll be redirected to Groww's login page in your browser.
          </Text>
          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={connectGroww}
            disabled={isLoading || !userId}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Connect Groww</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </CrossPlatformOverlay>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },
  content: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 24,
  },
  button: {
    backgroundColor: '#00d09c',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
  },
});

export default GrowwConnectModal;
