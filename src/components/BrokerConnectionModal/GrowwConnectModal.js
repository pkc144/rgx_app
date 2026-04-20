import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { getAuth } from '@react-native-firebase/auth';
import axios from 'axios';
import CryptoJS from 'react-native-crypto-js';
import Config from 'react-native-config';
import Toast from 'react-native-toast-message';
import { ExternalLink } from 'lucide-react-native';

import server from '../../utils/serverConfig';
import { generateToken } from '../../utils/SecurityTokenManager';
import { getAdvisorSubdomain } from '../../utils/variantHelper';
import { useTrade } from '../../screens/TradeContext';
import eventEmitter from '../EventEmitter';
import useModalStore from '../../GlobalUIModals/modalStore';
import CrossPlatformOverlay from '../../components/CrossPlatformOverlay';
import EgressIpCallout from './EgressIpCallout';

// Matches the symmetric AES pattern the backend decrypts with
// checkValidApiAnSecret() in aq_backend_github/Routes/Broker/*.js.
const encryptForTransport = (plain) =>
  CryptoJS.AES.encrypt(plain, 'ApiKeySecret').toString();

const GROWW_PORTAL_URL = 'https://groww.in/trade-api/api-keys';

const GrowwConnectModal = ({
  isVisible,
  onClose,
  setShowBrokerModal,
  fetchBrokerStatusModal,
}) => {
  const { configData } = useTrade();
  const showAlert = useModalStore((state) => state.showAlert);

  const auth = getAuth();
  const user = auth.currentUser;
  const userEmail = user?.email;

  const [userDetails, setUserDetails] = useState(null);
  const [apiKey, setApiKey] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [egressReady, setEgressReady] = useState(false);
  const [unmetAck, setUnmetAck] = useState(false);

  const userId = userDetails?._id;

  useEffect(() => {
    if (!isVisible || !userEmail) return;
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
      .then((res) => setUserDetails(res.data.User))
      .catch((err) =>
        console.log('[Groww] Failed to fetch user details:', err?.message),
      );
  }, [isVisible, userEmail, configData?.config?.REACT_APP_HEADER_NAME]);

  const openGrowwPortal = () => {
    Linking.openURL(GROWW_PORTAL_URL).catch(() =>
      Toast.show({
        type: 'error',
        text1: 'Could not open link',
        text2: GROWW_PORTAL_URL,
      }),
    );
  };

  const handleSubmit = () => {
    if (!egressReady) {
      setUnmetAck(true);
      return;
    }
    if (!apiKey || !secretKey) return;
    if (!userId) {
      showAlert('error', 'User not ready', 'Please try again in a moment.');
      return;
    }

    setLoading(true);

    // apiKey = Groww "API Key" long string from the "API key and secret"
    // popup on groww.in/trade-api/api-keys.
    // secretKey = Groww "API Secret" (approval-mode secret used by the
    // backend SDK to compute the HMAC checksum for daily token minting).
    // NOT a TOTP seed, NOT a one-time code — shown once at key creation.
    const payload = JSON.stringify({
      uid: userId,
      user_email: userEmail,
      user_broker: 'Groww',
      apiKey: encryptForTransport(apiKey),
      secretKey: encryptForTransport(secretKey),
    });

    axios
      .request({
        method: 'post',
        url: `${server.server.baseUrl}api/groww/update-key`,
        data: payload,
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
      .then(() => {
        fetchBrokerStatusModal?.();
        eventEmitter.emit('refreshEvent', { source: 'Groww broker connection' });
        showAlert(
          'success',
          'Connected Successfully',
          'Your Groww broker has been connected successfully!',
        );
        setShowBrokerModal?.(false);
        onClose?.();
      })
      .catch((error) => {
        console.log('[Groww] update-key error:', error?.response?.data);
        const msg =
          error?.response?.data?.message ||
          'Incorrect credentials or IP not yet whitelisted. Please try again.';
        showAlert('error', 'Connection Error', msg);
      })
      .finally(() => setLoading(false));
  };

  const submitDisabled = !apiKey || !secretKey || loading;

  return (
    <CrossPlatformOverlay visible={isVisible} onClose={onClose}>
      <View style={styles.container}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Connect Groww</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeBtn}>Close</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled">
            {/* EgressIpCallout — claim dedicated IP + whitelist ack.
                Submit stays gated until the customer ticks the
                acknowledgment checkbox inside this component. */}
            <EgressIpCallout
              broker="groww"
              customerId={userId}
              customerEmail={userEmail}
              onAcknowledgeChange={setEgressReady}
              showUnmetAck={unmetAck}
              onUnmetAckHandled={() => setUnmetAck(false)}
              configData={configData}
            />

            <Text style={styles.sectionTitle}>Setup Instructions</Text>

            <View style={styles.step}>
              <Text style={styles.stepNum}>1</Text>
              <View style={styles.stepBody}>
                <Text style={styles.stepTitle}>Open Groww Trade API page</Text>
                <Text style={styles.stepText}>
                  Log in to Groww and open the Trade API section.
                </Text>
                <TouchableOpacity style={styles.linkBtn} onPress={openGrowwPortal}>
                  <Text style={styles.linkText}>groww.in/trade-api/api-keys</Text>
                  <ExternalLink size={14} color="#2563eb" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.step}>
              <Text style={styles.stepNum}>2</Text>
              <View style={styles.stepBody}>
                <Text style={styles.stepTitle}>Create an API Key + Secret</Text>
                <Text style={styles.stepText}>
                  Click "Create API Key" on the dashboard and choose the{' '}
                  <Text style={styles.bold}>API Key &amp; Secret</Text> option
                  (not "Access Token"). Groww will show a popup titled "API
                  key and secret" with two long strings — copy both, they are
                  shown only once.
                </Text>
                <View style={styles.noteBox}>
                  <Text style={styles.noteText}>
                    Groww requires daily approval — if you can't place trades
                    tomorrow, visit the API keys page, approve the day's
                    session, then reconnect here. Access tokens reset at 6 AM
                    IST daily.
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.step}>
              <Text style={styles.stepNum}>3</Text>
              <View style={styles.stepBody}>
                <Text style={styles.stepTitle}>Whitelist your static IP</Text>
                <Text style={styles.stepText}>
                  On the same Trade API page, paste the static IP shown in
                  the panel above into the "Whitelisted IPs" field and save.
                  Groww rejects every order from a non-whitelisted IP, so
                  this step is mandatory.
                </Text>
              </View>
            </View>

            <View style={styles.step}>
              <Text style={styles.stepNum}>4</Text>
              <View style={styles.stepBody}>
                <Text style={styles.stepTitle}>Paste credentials below</Text>
                <Text style={styles.stepText}>
                  Copy the <Text style={styles.bold}>API Key</Text> and{' '}
                  <Text style={styles.bold}>API Secret</Text> from the "API
                  key and secret" popup and paste them below.
                </Text>
              </View>
            </View>

            <Text style={styles.label}>
              API Key <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              value={apiKey}
              onChangeText={(v) => setApiKey(v.trim())}
              placeholder="Paste your Groww API Key"
              placeholderTextColor="#9ca3af"
              style={styles.input}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={styles.label}>
              API Secret <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              value={secretKey}
              onChangeText={(v) => setSecretKey(v.trim())}
              placeholder="Paste your Groww API Secret"
              placeholderTextColor="#9ca3af"
              style={styles.input}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Text style={styles.hint}>
              Found in the "API key and secret" popup on the Groww Trade API
              page, shown only at key creation time.
            </Text>

            <TouchableOpacity
              style={[
                styles.submitBtn,
                !egressReady && styles.submitBtnLocked,
                submitDisabled && styles.submitBtnDisabled,
              ]}
              onPress={handleSubmit}
              disabled={submitDisabled}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitText}>Connect Groww</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </CrossPlatformOverlay>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  title: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  closeBtn: { fontSize: 14, color: '#64748b', fontWeight: '600' },
  scroll: { maxHeight: '100%' },
  scrollContent: { padding: 20, paddingBottom: 40 },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 12,
    marginBottom: 12,
  },
  step: { flexDirection: 'row', marginBottom: 14 },
  stepNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#d1fae5',
    color: '#047857',
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '700',
    fontSize: 12,
    marginRight: 10,
  },
  stepBody: { flex: 1 },
  stepTitle: { fontSize: 14, fontWeight: '600', color: '#0f172a' },
  stepText: {
    fontSize: 13,
    color: '#475569',
    marginTop: 2,
    lineHeight: 19,
  },
  bold: { fontWeight: '700', color: '#0f172a' },
  linkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
    borderWidth: 1,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  linkText: { fontSize: 12, color: '#2563eb', fontWeight: '600' },
  noteBox: {
    marginTop: 8,
    padding: 10,
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
    borderWidth: 1,
    borderRadius: 8,
  },
  noteText: { fontSize: 12, color: '#92400e', lineHeight: 17 },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
    marginTop: 14,
    marginBottom: 6,
  },
  required: { color: '#ef4444' },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0f172a',
  },
  hint: { fontSize: 11, color: '#64748b', marginTop: 4 },
  submitBtn: {
    marginTop: 24,
    backgroundColor: '#059669',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  submitBtnLocked: { backgroundColor: '#9ca3af' },
  submitBtnDisabled: { opacity: 0.6 },
  submitText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});

export default GrowwConnectModal;
