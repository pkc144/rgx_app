import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Image,
  Dimensions,
  BackHandler,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  EyeIcon,
  EyeOffIcon,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
} from 'lucide-react-native';
import WebView from 'react-native-webview';
import ZerodhaIcon from '../../assets/Zerodha.png';
import ZerodhaHelpContent from './HelpUI/ZerodhaHelpContent';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CrossPlatformOverlay from '../../components/CrossPlatformOverlay';

const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('screen');

const ZerodhaConnectUI = ({
  isVisible,
  onClose,
  shouldRenderContent,
  showWebView,
  apiKey,
  secretKey,
  isPasswordVisible,
  isPasswordVisibleUp,
  setApiKey,
  setSecretKey,
  setIsPasswordVisible,
  setIsPasswordVisibleUp,
  updateSecretKey,
  isLoading,
  authUrl,
  handleWebViewNavigationStateChange,
  scrollViewRef,
}) => {
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
      <View style={[styles.fullScreen, { paddingTop: insets.top }]}>
        {/* HEADER - Use solid background color instead of LinearGradient for iOS Fabric compatibility */}
        <View
          style={[styles.headerRow, {backgroundColor: 'rgba(0, 38, 81, 1)', overflow: 'hidden'}]}>
          {shouldRenderContent && !showWebView ? (
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <TouchableOpacity style={styles.backButton} onPress={onClose}>
                <ChevronLeft size={24} color="#000" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Connect to Zerodha</Text>
            </View>
          ) : (
            <TouchableOpacity
              onPress={onClose}
              style={styles.backButtonContainer}>
              <ChevronLeft size={20} color="#fff" />
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          )}
          <Image
            source={ZerodhaIcon}
            style={styles.headerIcon}
            resizeMode="contain"
          />
        </View>

        {/* CONTENT */}
        <View style={styles.contentContainer}>
          {shouldRenderContent && !showWebView && expanded ? (
            /* Full Screen Help when expanded */
            <View style={styles.fullScreenHelp}>
              <ScrollView
                ref={scrollViewRef}
                style={{flex: 1}}
                contentContainerStyle={{padding: 10, paddingBottom: 20}}
                showsVerticalScrollIndicator={true}>
                <ZerodhaHelpContent expanded={expanded} onExpandChange={setExpanded} />
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
          ) : shouldRenderContent && !showWebView ? (
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
                {/* Help content */}
                <View style={[styles.guideBox, {maxHeight: 280}]}>
                  <ZerodhaHelpContent expanded={expanded} onExpandChange={setExpanded} />
                </View>
                <TouchableOpacity
                  onPress={() => setExpanded(true)}
                  style={styles.toggleContainer}>
                  <Text style={styles.toggleText}>Read More</Text>
                  <View style={styles.toggleIconContainer}>
                    <ChevronDown size={14} color="#000" />
                  </View>
                </TouchableOpacity>

                {/* Input card */}
                <View style={styles.inputCard}>
                  <View style={styles.connectRow}>
                    <Text style={styles.connectLabel}>Connect to Zerodha</Text>
                    <Image
                      source={ZerodhaIcon}
                      style={styles.connectIcon}
                      resizeMode="contain"
                    />
                  </View>

                  <View>
                    <Text style={styles.headerLabel}>API Key :</Text>
                    <View style={styles.inputContainer}>
                      <TextInput
                        value={apiKey}
                        placeholder="Enter your API key"
                        placeholderTextColor="grey"
                        style={[styles.inputStyles, {color: 'grey', flex: 1}]}
                        autoCapitalize="none"
                        autoCorrect={false}
                        onChangeText={text => setApiKey(text.trim())}
                      />
                    </View>
                  </View>

                  <View>
                    <Text style={styles.headerLabel}>Secret Key :</Text>
                    <View style={styles.inputContainer}>
                      <TextInput
                        value={secretKey}
                        placeholder="Enter your Secret key"
                        placeholderTextColor="grey"
                        style={[styles.inputStyles, {color: 'grey', flex: 1}]}
                        autoCapitalize="none"
                        autoCorrect={false}
                        onChangeText={text => setSecretKey(text.trim())}
                      />
                    </View>
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.proceedButton,
                      {
                        backgroundColor:
                          apiKey && secretKey ? '#0056B7' : '#d3d3d3',
                      },
                    ]}
                    onPress={updateSecretKey}
                    disabled={!(apiKey && secretKey)}>
                    {isLoading ? (
                      <ActivityIndicator size={27} color="#fff" />
                    ) : (
                      <Text style={styles.proceedButtonText}>
                        Connect Zerodha
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </KeyboardAvoidingView>
          ) : (
            <View style={styles.webViewContainer}>
              <WebView
                source={{uri: authUrl}}
                style={styles.webView}
                nestedScrollEnabled
                onNavigationStateChange={handleWebViewNavigationStateChange}
                javaScriptEnabled
                domStorageEnabled
                startInLoadingState
              />
            </View>
          )}
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
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderColor: '#E8E9EC',
    paddingVertical: 13,
  },
  headerLabel: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    marginVertical: 5,
    color: 'black',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    color: '#fff',
    marginLeft: 20,
  },
  headerIcon: {
    width: 35,
    height: 35,
    backgroundColor: '#fff',
    borderRadius: 3,
  },
  backButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    color: '#fff',
    marginLeft: 4,
  },
  contentContainer: {
    flex: 1,
  },
  guideBox: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginHorizontal: 8,
    marginTop: 8,
    padding: 12,
    elevation: 2,
    shadowColor: '#ccc',
  },
  fullScreenHelp: {flex: 1, backgroundColor: '#fff'},
  toggleWrapper: {
    borderTopWidth: 1,
    borderTopColor: '#E8E9EC',
    backgroundColor: '#fff',
    paddingVertical: 5,
  },
  helpScrollContent: {
    paddingBottom: 10,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 10,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(0, 86, 183, 1)',
    marginRight: 8,
  },
  toggleIconContainer: {
    backgroundColor: '#fff',
    elevation: 3,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 3,
  },
  inputCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 8,
    marginTop: 18,
    elevation: 3,
    shadowColor: '#ccc',
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
    fontWeight: '700',
    color: '#000',
    fontFamily: 'Poppins-SemiBold',
  },
  connectIcon: {
    width: 30,
    height: 30,
    backgroundColor: '#fff',
    borderRadius: 3,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    borderColor: '#ccc',
  },
  inputStyles: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    paddingVertical: 5,
  },
  proceedButton: {
    marginTop: 28,
    backgroundColor: 'black',
    padding: 11,
    borderRadius: 4,
    height: 45,
    alignItems: 'center',
    justifyContent: 'center',
  },
  proceedButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    fontFamily: 'Poppins-SemiBold',
  },
  webViewContainer: {
    flex: 1,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    overflow: 'hidden',
  },
  webView: {
    flex: 1,
  },
});

export default ZerodhaConnectUI;
