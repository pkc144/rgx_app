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
import {WebView} from 'react-native-webview';
import motilalIcon from '../../assets/Motilalicon.png';
import MotilalHelpContent from './HelpUI/MotilalHelpContent';
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
          {/* Header - Use solid background color instead of LinearGradient for iOS Fabric compatibility */}
          <View
            style={[styles.headerRow, {backgroundColor: '#0B3D91', overflow: 'hidden'}]}>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <TouchableOpacity onPress={onClose} style={styles.backButton}>
                <ChevronLeft size={24} color="#000" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Connect to Motilal Oswal</Text>
            </View>
            <Image source={motilalIcon} style={styles.headerIcon} />
          </View>

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
                            apiKey && clientCode
                              ? 'rgba(0, 86, 183, 1)'
                              : '#d3d3d3',
                        },
                      ]}
                      onPress={handleConnect}
                      disabled={!(apiKey && clientCode)}>
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
    flex: 1,
    width: SCREEN_WIDTH,
    backgroundColor: '#fff',
    overflow: 'hidden',
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
});

export default MotilalConnectUI;
