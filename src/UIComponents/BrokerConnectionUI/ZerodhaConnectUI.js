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
} from 'react-native';
import {
  EyeIcon,
  EyeOffIcon,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
} from 'lucide-react-native';
import WebView from 'react-native-webview';
import LinearGradient from 'react-native-linear-gradient';
import ZerodhaIcon from '../../assets/Zerodha.png';
import {TextInput} from 'react-native-gesture-handler';
import ZerodhaHelpContent from './HelpUI/ZerodhaHelpContent';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FullWindowOverlay } from 'react-native-screens';

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

  if (!isVisible) return null;

  return (
    <FullWindowOverlay>
      <View style={[styles.fullScreen, { paddingTop: insets.top }]}>
        {/* HEADER */}
        <LinearGradient
          colors={['rgba(0, 38, 81, 1)', 'rgba(0, 86, 183, 1)']}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
          style={styles.headerRow}>
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
        </LinearGradient>

        {/* CONTENT */}
        <View style={styles.contentContainer}>
          {shouldRenderContent && !showWebView ? (
            <>
              {/* Scrollable help content with toggle expand */}
              <View
                style={[styles.guideBox, {maxHeight: expanded ? 420 : 320}]}>
                <ScrollView
                  ref={scrollViewRef}
                  showsVerticalScrollIndicator
                  nestedScrollEnabled
                  contentContainerStyle={styles.helpScrollContent}>
                  <ZerodhaHelpContent
                    expanded={expanded}
                    onExpandChange={setExpanded}
                  />
                </ScrollView>
                <TouchableOpacity
                  onPress={() => setExpanded(!expanded)}
                  style={styles.toggleContainer}>
                  <Text style={styles.toggleText}>
                    {expanded ? 'See Less' : 'Read More'}
                  </Text>
                  <View style={styles.toggleIconContainer}>
                    {expanded ? (
                      <ChevronUp size={14} color="#000" />
                    ) : (
                      <ChevronDown size={14} color="#000" />
                    )}
                  </View>
                </TouchableOpacity>
              </View>

              {/* Fixed input card at bottom */}
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
                      secureTextEntry={!isPasswordVisibleUp}
                      onChangeText={text => setApiKey(text.trim())}
                    />
                    <TouchableOpacity
                      onPress={() =>
                        setIsPasswordVisibleUp(!isPasswordVisibleUp)
                      }>
                      {apiKey ? (
                        isPasswordVisibleUp ? (
                          <EyeIcon size={24} color="#000" />
                        ) : (
                          <EyeOffIcon size={24} color="#000" />
                        )
                      ) : null}
                    </TouchableOpacity>
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
                      secureTextEntry={!isPasswordVisible}
                      onChangeText={text => setSecretKey(text.trim())}
                    />
                    <TouchableOpacity
                      onPress={() =>
                        setIsPasswordVisible(!isPasswordVisible)
                      }>
                      {secretKey ? (
                        isPasswordVisible ? (
                          <EyeIcon size={24} color="#000" />
                        ) : (
                          <EyeOffIcon size={24} color="#000" />
                        )
                      ) : null}
                    </TouchableOpacity>
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
            </>
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
    </FullWindowOverlay>
  );
};

const styles = StyleSheet.create({
  fullScreen: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: '#fff',
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
