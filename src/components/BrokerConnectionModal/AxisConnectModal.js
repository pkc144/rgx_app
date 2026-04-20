/**
 * AxisConnectModal.js
 * Axis Securities SSO broker connection.
 * Ported from prod-alphaquark-github for feature parity.
 */
import React, {useState, useRef} from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import {X, Shield, ExternalLink} from 'lucide-react-native';
import {WebView} from 'react-native-webview';
import axios from 'axios';
import Config from 'react-native-config';
import {getAuth} from '@react-native-firebase/auth';
import server from '../../utils/serverConfig';
import {generateToken} from '../../utils/SecurityTokenManager';
import {getAdvisorSubdomain} from '../../utils/variantHelper';
import Toast from 'react-native-toast-message';
import eventEmitter from '../EventEmitter';
import {useTrade} from '../../screens/TradeContext';

const AxisConnectModal = ({
  isVisible,
  onClose,
  fetchBrokerStatusModal,
}) => {
  const {configData} = useTrade();
  const auth = getAuth();
  const userEmail = auth.currentUser?.email;
  const [userDetails, setUserDetails] = useState(null);
  const userId = userDetails?._id;
  const [loading, setLoading] = useState(false);
  const [showWebView, setShowWebView] = useState(false);
  const [loginUrl, setLoginUrl] = useState('');
  const hasProcessedCallback = useRef(false);

  React.useEffect(() => {
    if (!userEmail) return;
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
      .then(res => setUserDetails(res.data.User))
      .catch(err => console.log('[Axis] getUser error:', err?.message));
  }, [userEmail, configData?.config?.REACT_APP_HEADER_NAME]);

  const requestHeaders = {
    'Content-Type': 'application/json',
    'X-Advisor-Subdomain':
      configData?.config?.REACT_APP_HEADER_NAME || getAdvisorSubdomain(),
    'aq-encrypted-key': generateToken(
      Config.REACT_APP_AQ_KEYS,
      Config.REACT_APP_AQ_SECRET,
    ),
  };

  const brokerConnectRedirectURL =
    configData?.config?.REACT_APP_BROKER_CONNECT_REDIRECT_URL || '';

  const handleAxisLogin = async () => {
    setLoading(true);
    try {
      const response = await axios.post(
        `${server.ccxtServer.baseUrl}axis/login-url`,
        {redirectUrl: brokerConnectRedirectURL},
        {headers: requestHeaders},
      );

      const url = response.data?.data?.redirectURL;
      if (url) {
        setLoginUrl(url);
        setShowWebView(true);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Failed to get login URL from Axis Securities',
          visibilityTime: 5000,
        });
      }
    } catch (error) {
      console.error('Axis login-url error:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to initiate Axis login. Please try again.',
        visibilityTime: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleWebViewNavigation = async navState => {
    const {url} = navState;
    if (!url || hasProcessedCallback.current) return;

    // Detect callback URL with ssoId
    const urlObj = new URL(url);
    const ssoId = urlObj.searchParams.get('ssoId') || urlObj.searchParams.get('spSsoId');

    if (ssoId) {
      hasProcessedCallback.current = true;
      setShowWebView(false);
      setLoading(true);

      try {
        // Exchange SSO ID for tokens (parsing matches web
        // StockRecommendation.js:1716-1728 — response is `{ data: { ... } }`
        // and `authToken` / `refreshToken` may each be a raw string or
        // `{ token: string }`).
        const callbackResponse = await axios.post(
          `${server.ccxtServer.baseUrl}axis/callback`,
          {ssoId},
          {headers: requestHeaders},
        );

        const data = callbackResponse.data?.data;
        if (!data) {
          throw new Error('Invalid response from Axis Securities');
        }
        const authToken = data.authToken?.token || data.authToken;
        const refreshToken = data.refreshToken?.token || data.refreshToken || '';
        const subAccountId =
          data.accounts?.[0]?.subAccountId ||
          data.metadata?.accounts?.[0]?.subAccountId;

        if (!authToken || !subAccountId) {
          throw new Error('Missing credentials from Axis SSO response');
        }

        // Save broker connection
        await axios.put(
          `${server.server.baseUrl}api/user/connect-broker`,
          {
            uid: userId,
            user_broker: 'Axis Securities',
            clientCode: subAccountId,
            jwtToken: authToken,
            secretKey: refreshToken,
          },
          {headers: requestHeaders},
        );

        // Update model portfolio broker (non-critical)
        try {
          await axios.post(
            `${server.ccxtServer.baseUrl}rebalance/change_broker_model_pf`,
            {user_email: userEmail, user_broker: 'Axis Securities'},
            {headers: requestHeaders},
          );
        } catch (mpErr) {
          console.warn('Model portfolio broker update failed:', mpErr);
        }

        Toast.show({
          type: 'success',
          text1: 'Axis Securities connected successfully!',
          visibilityTime: 3000,
        });

        fetchBrokerStatusModal?.();
        eventEmitter.emit('refreshEvent', {source: 'Axis broker connection'});
        onClose();
      } catch (error) {
        console.error('Axis callback error:', error);
        Toast.show({
          type: 'error',
          text1: 'Failed to connect Axis Securities',
          text2: error?.response?.data?.message || error.message,
          visibilityTime: 5000,
        });
      } finally {
        setLoading(false);
        hasProcessedCallback.current = false;
      }
    }
  };

  if (showWebView && loginUrl) {
    return (
      <Modal visible={isVisible} animationType="slide" onRequestClose={() => setShowWebView(false)}>
        <SafeAreaView style={{flex: 1}}>
          <View style={styles.webViewHeader}>
            <TouchableOpacity onPress={() => setShowWebView(false)}>
              <X size={22} color="#374151" />
            </TouchableOpacity>
            <Text style={styles.webViewTitle}>Axis Securities Login</Text>
            <View style={{width: 22}} />
          </View>
          <WebView
            source={{uri: loginUrl}}
            onNavigationStateChange={handleWebViewNavigation}
            startInLoadingState
            javaScriptEnabled
          />
        </SafeAreaView>
      </Modal>
    );
  }

  return (
    <Modal visible={isVisible} transparent animationType="fade" onRequestClose={onClose}>
      <SafeAreaView style={styles.overlay}>
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <X size={22} color="#6B7280" />
          </TouchableOpacity>

          <View style={styles.content}>
            <Text style={styles.title}>Login with Axis Securities</Text>
            <Text style={styles.subtitle}>
              You'll be securely redirected to Axis Direct to authorize your
              account. No credentials are shared with us.
            </Text>

            <TouchableOpacity
              style={[styles.loginBtn, loading && {opacity: 0.6}]}
              onPress={handleAxisLogin}
              disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <ExternalLink size={18} color="#fff" />
                  <Text style={styles.loginBtnText}>Login with Axis Direct</Text>
                </>
              )}
            </TouchableOpacity>

            <View style={styles.securityNote}>
              <Shield size={16} color="#059669" />
              <View style={{flex: 1}}>
                <Text style={styles.securityTitle}>Secure SSO Login</Text>
                <Text style={styles.securityText}>
                  Your login credentials are entered directly on Axis Direct's secure page. We only receive a session token to execute trades on your behalf.
                </Text>
              </View>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 16},
  modalContainer: {backgroundColor: '#fff', borderRadius: 12, maxHeight: '85%'},
  closeBtn: {position: 'absolute', top: 12, right: 12, zIndex: 1, padding: 4},
  content: {padding: 24, paddingTop: 36, alignItems: 'center'},
  title: {fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 8, textAlign: 'center'},
  subtitle: {fontSize: 13, color: '#6B7280', textAlign: 'center', marginBottom: 24, lineHeight: 18},
  loginBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: '#059669', paddingVertical: 14, paddingHorizontal: 24,
    borderRadius: 10, width: '100%', marginBottom: 20,
  },
  loginBtnText: {color: '#fff', fontSize: 15, fontWeight: '600'},
  securityNote: {
    flexDirection: 'row', gap: 10, padding: 14, borderRadius: 10,
    backgroundColor: '#ECFDF5', borderWidth: 1, borderColor: '#A7F3D0',
  },
  securityTitle: {fontSize: 13, fontWeight: '600', color: '#065F46', marginBottom: 4},
  securityText: {fontSize: 12, color: '#047857', lineHeight: 16},
  webViewHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
  },
  webViewTitle: {fontSize: 16, fontWeight: '600', color: '#111827'},
});

export default AxisConnectModal;
