import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Modal,
  Image,
} from 'react-native';
import {FloatingLabelInput} from 'react-native-floating-label-input';
import {
  XIcon,
  EyeIcon,
  EyeOffIcon,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
} from 'lucide-react-native';
import WebView from 'react-native-webview';
import UpstoxHelpContent from './HelpUI/UpstoxHelpContent';
import LinearGradient from 'react-native-linear-gradient';
import upstoxIcon from '../../assets/upstox.png';
import ZerodhaIcon from '../../assets/Zerodha.png';
import {TextInput} from 'react-native-gesture-handler';
import ZerodhaHelpContent from './HelpUI/ZerodhaHelpContent';
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

  return (
    <Modal visible={isVisible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* HEADER */}
          <LinearGradient
            colors={['rgba(0, 38, 81, 1)', 'rgba(0, 86, 183, 1)']}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={styles.headerRow}>
            {shouldRenderContent && !showWebView ? (
              <View style={{flexDirection: 'row'}}>
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
            <TouchableOpacity onPress={onClose}>
              <Image
                source={ZerodhaIcon}
                style={{
                  width: 35,
                  height: 35,
                  marginBottom: 8,
                  backgroundColor: '#fff',
                  borderRadius: 3,
                }}
                resizeMode="contain"
              />
            </TouchableOpacity>
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
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignContent: 'center',
                      alignItems: 'center',
                      backgroundColor: '#F5F5F5',
                      padding: 10,
                      borderRadius: 3,
                      marginBottom: 10,
                    }}>
                    <Text style={styles.connectLabel}>Connect to Zerodha</Text>
                    <Image
                      source={ZerodhaIcon}
                      style={{
                        width: 30,
                        height: 30,
                        backgroundColor: '#fff',
                        borderRadius: 3,
                      }}
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
                        style={[styles.inputStyles, {color: 'grey', flex: 1}]} // placeholder + entered text grey
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
                        style={[styles.inputStyles, {color: 'grey', flex: 1}]} // placeholder + entered text grey
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
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    flex: 1,
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
    alignContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
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
  connectLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    fontFamily: 'Poppins-SemiBold',
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
  inputLabel: {
    colorFocused: '#222',
    colorBlurred: '#222',
    fontSizeFocused: 18,
    fontSizeBlurred: 18,
  },
  inputLabelText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: '#777',
    backgroundColor: '#fff',
    paddingHorizontal: 5,
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
