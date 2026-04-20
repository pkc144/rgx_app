// components/MotilalConnectUI.js
import React, {useState, useRef} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  TextInput,
  ActivityIndicator,
  Image,
  Platform,
  KeyboardAvoidingView,
  BackHandler,
} from 'react-native';
import {
  EyeIcon,
  EyeOffIcon,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
} from 'lucide-react-native';
import HelpModal from '../../components/BrokerConnectionModal/HelpModal';
import LinearGradient from 'react-native-linear-gradient';
import {WebView} from 'react-native-webview';
import motilalIcon from '../../assets/Motilalicon.png';
import MotilalHelpContent from './HelpUI/MotilalHelpContent';
import Toast from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CrossPlatformOverlay from '../../components/CrossPlatformOverlay';

const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('screen');
const commonHeight = 40;

const MotilalConnectUI = ({
  isVisible,
  onClose,
  apiKey,
  clientCode,
  setApiKey,
  setClientCode,
  isPasswordVisible,
  isPasswordVisibleup,
  setIsPasswordVisible,
  setIsPasswordVisibleup,
  handleConnect,
  loading,
  helpVisible,
  setHelpVisible,
  showWebView,
  authUrl,
  handleWebViewNavigationStateChange,
  handleWebViewClose,
  egressUserId,
  egressUserEmail,
  egressReady,
  setEgressReady,
  unmetAck,
  setUnmetAck,
  configData,
}) => {
  const scrollViewRef = useRef(null);
  const [expanded, setExpanded] = useState(false);
  const insets = useSafeAreaInsets();

  // Handle Android back button
  React.useEffect(() => {
    if (!isVisible) return;

    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });

    return () => backHandler.remove();
  }, [isVisible, onClose]);

  return (
    <CrossPlatformOverlay visible={isVisible} onClose={onClose}>
      <View style={styles.fullScreen}>
        <View style={{flex: 1, paddingTop: insets.top}}>
          {/* Header */}
          <LinearGradient
            colors={['#0B3D91', '#0056B7']}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={styles.headerRow}>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <TouchableOpacity onPress={onClose} style={styles.backButton}>
                <ChevronLeft size={24} color="#000" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Connect to Motilal Oswal</Text>
            </View>
            <Image source={motilalIcon} style={styles.headerIcon} />
          </LinearGradient>

          {/* WebView Section */}
          {showWebView && authUrl ? (
            <View style={{flex: 1}}>
              <WebView
                source={{uri: authUrl}}
                onNavigationStateChange={handleWebViewNavigationStateChange}
                startInLoadingState
                javaScriptEnabled
                domStorageEnabled
                renderLoading={() => (
                  <ActivityIndicator
                    size="large"
                    color="#0056B7"
                    style={{marginTop: 20}}
                  />
                )}
              />
            </View>
          ) : expanded ? (
            /* Full Screen Help when expanded */
            <View style={styles.fullScreenHelp}>
              <ScrollView
                ref={scrollViewRef}
                style={{flex: 1}}
                contentContainerStyle={{padding: 10, paddingBottom: 20}}
                showsVerticalScrollIndicator={true}>
                <MotilalHelpContent expanded={expanded} />
                <View style={[styles.toggleWrapper, {marginTop: 15, paddingBottom: insets.bottom + 10}]}>
                  <TouchableOpacity
                    style={styles.toggleContainer}
                    onPress={() => setExpanded(false)}>
                    <Text style={styles.toggleText}>See Less</Text>
                    <View style={styles.toggleIconContainer}>
                      <ChevronUp size={14} color="#000" />
                    </View>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          ) : (
            <KeyboardAvoidingView
              style={{flex: 1}}
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
              <ScrollView
                ref={scrollViewRef}
                style={{flex: 1}}
                contentContainerStyle={{padding: 10, paddingBottom: insets.bottom + 100}}
                showsVerticalScrollIndicator={true}
                keyboardShouldPersistTaps="handled">
                {/* Help Content */}
                <View style={[styles.guideBox, {maxHeight: 280}]}>
                  <MotilalHelpContent expanded={expanded} />
                </View>

                {/* Read More */}
                <TouchableOpacity
                  style={styles.toggleContainer}
                  onPress={() => setExpanded(true)}>
                  <Text style={styles.toggleText}>Read More</Text>
                  <View style={styles.toggleIconContainer}>
                    <ChevronDown size={14} color="#000" />
                  </View>
                </TouchableOpacity>

                {/* Motilal is IPv4-only — all calls go through the
                    server's shared static IPv4 (72.61.251.253) via the
                    IPv4-pinned session on ccxt-india. Ports web 156589e:
                    replace EgressIpCallout with a simple static callout
                    showing the server IPv4, a Copy button, and an
                    acknowledgment checkbox. `egressReady` gate is
                    preserved so Connect stays locked until ticked;
                    `unmetAck` still fires the red-flash signal. */}
                <View style={styles.motilalIpCallout}>
                  <Text style={styles.motilalIpTitle}>
                    Server IPv4 to whitelist on Motilal
                  </Text>
                  <View style={styles.motilalIpRow}>
                    <Text style={styles.motilalIpValue}>72.61.251.253</Text>
                    {/* Matches the existing app-wide pattern (HelpModal.js,
                        KotakConsumerKeySteps.js, DdpiModal.js) — Clipboard
                        used as a runtime global without an explicit import.
                        If the platform doesn't expose a Clipboard shim, the
                        catch shows a toast asking the user to long-press. */}
                    <TouchableOpacity
                      onPress={() => {
                        try {
                          // eslint-disable-next-line no-undef
                          Clipboard.setString('72.61.251.253');
                          Toast.show({
                            type: 'success',
                            text1: 'Server IP copied',
                            position: 'bottom',
                            visibilityTime: 1500,
                          });
                        } catch {
                          Toast.show({
                            type: 'info',
                            text1: 'Long-press the IP to copy manually',
                            position: 'bottom',
                            visibilityTime: 2500,
                          });
                        }
                      }}
                      style={styles.motilalIpCopy}>
                      <Text style={styles.motilalIpCopyText}>Copy</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.motilalIpHint}>
                    Paste the IP above into Motilal's "Allowed IPs" field on
                    the API Key settings page. Motilal rejects every order
                    from a non-whitelisted IP.
                  </Text>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => {
                      setEgressReady && setEgressReady(!egressReady);
                      if (unmetAck) setUnmetAck && setUnmetAck(false);
                    }}
                    style={[
                      styles.motilalIpAckRow,
                      unmetAck && !egressReady && styles.motilalIpAckRowFlash,
                    ]}>
                    <View
                      style={[
                        styles.motilalIpAckBox,
                        egressReady && styles.motilalIpAckBoxChecked,
                      ]}>
                      {egressReady ? (
                        <Text style={styles.motilalIpAckCheck}>✓</Text>
                      ) : null}
                    </View>
                    <Text style={styles.motilalIpAckLabel}>
                      I've whitelisted{' '}
                      <Text style={{fontWeight: '700'}}>72.61.251.253</Text> on
                      Motilal's API Key page.
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Input Card */}
                <View style={styles.inputCard}>
                  <View style={styles.connectRow}>
                    <Text style={styles.connectLabel}>
                      Connect to Motilal Oswal
                    </Text>
                    <Image
                      source={motilalIcon}
                      style={styles.connectIcon}
                      resizeMode="contain"
                    />
                  </View>

                  {/* Fixed Bottom Inputs & Button */}
                  <View style={styles.bottomContainer}>
                    {/* API Key */}
                    <View style={styles.inputWrapper}>
                      <Text style={styles.headerLabel}>API Key:</Text>
                      <View style={styles.inputContainer}>
                        <TextInput
                          value={apiKey}
                          placeholder="Enter your API Key"
                          placeholderTextColor="grey"
                          style={[styles.inputStyles, {flex: 1}]}
                          autoCapitalize="none"
                          autoCorrect={false}
                          onChangeText={text => setApiKey(text.trim())}
                        />
                      </View>
                    </View>

                    {/* Client Code */}
                    <View style={styles.inputWrapper}>
                      <Text style={styles.headerLabel}>Client Code:</Text>
                      <View style={styles.inputContainer}>
                        <TextInput
                          value={clientCode}
                          placeholder="Enter your Client Code"
                          placeholderTextColor="grey"
                          style={[styles.inputStyles, {flex: 1}]}
                          autoCapitalize="none"
                          autoCorrect={false}
                          onChangeText={text => setClientCode(text.trim())}
                        />
                      </View>
                    </View>

                    {/* Connect Button */}
                    <TouchableOpacity
                      style={[
                        styles.proceedButton,
                        {
                          backgroundColor:
                            apiKey && clientCode && egressReady
                              ? 'rgba(0, 86, 183, 1)'
                              : '#d3d3d3',
                        },
                      ]}
                      onPress={handleConnect}
                      disabled={!(apiKey && clientCode && egressReady)}>
                      {loading ? (
                        <ActivityIndicator size={27} color="#fff" />
                      ) : (
                        <Text style={styles.proceedButtonText}>Connect</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>
            </KeyboardAvoidingView>
          )}

          <HelpModal
            broker="Motilal Oswal"
            visible={helpVisible}
            onClose={() => setHelpVisible(false)}
          />
        </View>
      </View>
    </CrossPlatformOverlay>
  );
};

const styles = StyleSheet.create({
  fullScreen: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: '#fff',
  },
  headerIcon: {width: 35, height: 35, borderRadius: 3, backgroundColor: '#fff'},
  backButton: {
    padding: 4,
    borderRadius: 5,
    backgroundColor: '#fff',
    elevation: 4,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    color: '#fff',
    marginLeft: 10,
  },
  guideBox: {
    borderWidth: 1,
    borderColor: '#E8E9EC',
    borderRadius: 8,
    padding: 10,
  },
  fullScreenHelp: {flex: 1, backgroundColor: '#fff'},
  toggleWrapper: {
    borderTopWidth: 1,
    borderTopColor: '#E8E9EC',
    backgroundColor: '#fff',
    paddingVertical: 5,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    paddingHorizontal: 20,
  },
  toggleText: {fontSize: 14, fontFamily: 'Poppins-SemiBold', color: '#0056B7'},
  toggleIconContainer: {
    marginLeft: 5,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 3,
    elevation: 3,
  },
  inputCard: {
    marginHorizontal: 20,
    borderWidth: 0.3,
    borderRadius: 8,
    borderColor: '#c8c8c8',
    marginBottom: 20,
  },
  connectRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 10,
    borderRadius: 3,
    marginBottom: 10,
  },
  connectLabel: {
    fontSize: 16,
    color: '#000',
    fontFamily: 'Poppins-SemiBold',
  },
  connectIcon: {
    width: 30,
    height: 30,
    backgroundColor: '#fff',
    borderRadius: 3,
  },
  bottomContainer: {
    borderTopColor: '#E8E9EC',
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  inputWrapper: {marginBottom: 10},
  headerLabel: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: '#000',
    marginBottom: 5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: commonHeight,
  },
  inputStyles: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: '#000',
    paddingVertical: 5,
  },
  proceedButton: {
    height: commonHeight,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  proceedButtonText: {color: '#fff', fontSize: 16, fontWeight: '600'},

  // Motilal static server-IPv4 callout (replaces EgressIpCallout for
  // this broker only — see web 156589e).
  motilalIpCallout: {
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginHorizontal: 10,
    marginTop: 10,
  },
  motilalIpTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400e',
    marginBottom: 6,
  },
  motilalIpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  motilalIpValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    letterSpacing: 0.5,
  },
  motilalIpCopy: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#fde68a',
  },
  motilalIpCopyText: {fontSize: 12, fontWeight: '600', color: '#78350f'},
  motilalIpHint: {fontSize: 12, color: '#92400e', lineHeight: 17, marginBottom: 10},
  motilalIpAckRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 6,
    borderRadius: 6,
  },
  motilalIpAckRowFlash: {
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  motilalIpAckBox: {
    width: 18,
    height: 18,
    borderRadius: 3,
    borderWidth: 1.5,
    borderColor: '#92400e',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  motilalIpAckBoxChecked: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  motilalIpAckCheck: {color: '#fff', fontSize: 12, fontWeight: '700'},
  motilalIpAckLabel: {flex: 1, fontSize: 12, color: '#0f172a', lineHeight: 17},
});

export default MotilalConnectUI;
