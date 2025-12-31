import React, {useState} from 'react';
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Dimensions,
  TextInput,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import Modal from 'react-native-modal';
import {WebView} from 'react-native-webview';
import {
  ChevronLeft,
  Eye as EyeIcon,
  EyeOff as EyeOffIcon,
  ChevronUp,
  ChevronDown,
} from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import HelpModal from '../../components/BrokerConnectionModal/HelpModal';
import FyersHelpContent from './HelpUI/FyersHelpContent';
import fyersIcon from '../../assets/fyers.png';

const {height: screenHeight} = Dimensions.get('window');
const commonHeight = 40;

const FyersConnectUI = ({
  isVisible,
  onClose,
  showWebView,
  authUrl,
  secretKey,
  isPasswordVisibleup,
  setIsPasswordVisibleup,
  apiKey,
  isPasswordVisible,
  setIsPasswordVisible,
  setSecretKey,
  setApiKey,
  updateSecretKey,
  loading,
  helpVisible,
  setHelpVisible,
  handleWebViewNavigationStateChange,
}) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <Modal
      isVisible={isVisible}
      onBackdropPress={onClose}
      style={styles.modal}
      backdropOpacity={0.1}
      useNativeDriver>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{flex: 1}}>
        <SafeAreaView style={styles.safeArea}>
          {/* Header */}
          <LinearGradient
            colors={['#0B3D91', '#0056B7']}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={styles.headerRow}>
            <View style={{flexDirection: 'row', alignItems: 'center'}}>
              <Pressable onPress={onClose} style={styles.backButton}>
                <ChevronLeft size={24} color="#000" />
              </Pressable>
              <Text style={styles.headerTitle}>Connect Fyers</Text>
            </View>
            <Image source={fyersIcon} style={styles.headerIcon} />
          </LinearGradient>

          {showWebView ? (
            <WebView
              source={{uri: authUrl}}
              style={{flex: 1}}
              javaScriptEnabled
              domStorageEnabled
              startInLoadingState
              onNavigationStateChange={handleWebViewNavigationStateChange}
            />
          ) : (
            <View style={{flex: 1}}>
              {/* Scrollable Help Content */}
              <ScrollView
                contentContainerStyle={{padding: 15}}
                showsVerticalScrollIndicator={true}
                style={{flex: 1}}>
                <Pressable style={styles.guideBox}>
                  <FyersHelpContent expanded={expanded} />
                </Pressable>
              </ScrollView>

              {/* Read More / See Less outside scroll */}
              <Pressable
                style={styles.toggleContainer}
                onPress={() => setExpanded(!expanded)}>
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
              </Pressable>

              <View
                style={{
                  marginHorizontal: 15,
                  borderWidth: 0.3,
                  borderRadius: 8,
                  borderColor: '#c8c8c8',
                  marginBottom: 10,
                }}>
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
                  <Text style={styles.connectLabel}>Connect to Fyers</Text>
                  <Image
                    source={fyersIcon}
                    style={{
                      width: 30,
                      height: 30,
                      backgroundColor: '#fff',
                      borderRadius: 3,
                    }}
                    resizeMode="contain"
                  />
                </View>

                {/* Sticky Inputs */}
                <View style={styles.bottomContainer}>
                  <View style={styles.inputWrapper}>
                    <Text style={styles.headerLabel}>User ID:</Text>
                    <View style={styles.inputContainer}>
                      <TextInput
                        value={secretKey}
                        placeholder="Enter your User ID"
                        placeholderTextColor="#aaa"
                        style={[styles.inputStyles, {flex: 1}]}
                        secureTextEntry={!isPasswordVisibleup}
                        onChangeText={text => setSecretKey(text.trim())}
                      />
                      <Pressable
                        onPress={() =>
                          setIsPasswordVisibleup(!isPasswordVisibleup)
                        }>
                        {secretKey ? (
                          isPasswordVisibleup ? (
                            <EyeIcon size={24} color="#000" />
                          ) : (
                            <EyeOffIcon size={24} color="#000" />
                          )
                        ) : null}
                      </Pressable>
                    </View>
                  </View>

                  <View style={styles.inputWrapper}>
                    <Text style={styles.headerLabel}>API Key:</Text>
                    <View style={styles.inputContainer}>
                      <TextInput
                        value={apiKey}
                        placeholder="Enter your API key"
                        placeholderTextColor="#aaa"
                        style={[styles.inputStyles, {flex: 1}]}
                        secureTextEntry={!isPasswordVisible}
                        onChangeText={text => setApiKey(text.trim())}
                      />
                      <Pressable
                        onPress={() =>
                          setIsPasswordVisible(!isPasswordVisible)
                        }>
                        {apiKey ? (
                          isPasswordVisible ? (
                            <EyeIcon size={24} color="#000" />
                          ) : (
                            <EyeOffIcon size={24} color="#000" />
                          )
                        ) : null}
                      </Pressable>
                    </View>
                  </View>

                  <Pressable
                    style={[
                      styles.proceedButton,
                      {
                        backgroundColor:
                          apiKey && secretKey ? '#0056B7' : '#d3d3d3',
                      },
                    ]}
                    onPress={updateSecretKey}
                    disabled={!(apiKey && secretKey)}>
                    {loading ? (
                      <ActivityIndicator size={27} color="#fff" />
                    ) : (
                      <Text style={styles.proceedButtonText}>
                        Connect Fyers
                      </Text>
                    )}
                  </Pressable>
                </View>
              </View>
            </View>
          )}

          <HelpModal
            broker="Fyers"
            visible={helpVisible}
            onClose={() => setHelpVisible(false)}
          />
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeArea: {flex: 1, backgroundColor: '#fff'},
  modal: {justifyContent: 'flex-end', margin: 0},
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  backButton: {
    padding: 4,
    borderRadius: 5,
    backgroundColor: '#fff',
    elevation: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    color: '#fff',
    marginLeft: 10,
  },
  headerIcon: {width: 35, height: 35, borderRadius: 3, backgroundColor: '#fff'},
  guideBox: {
    borderWidth: 1,
    borderColor: '#E8E9EC',
    borderRadius: 8,
    padding: 10,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderTopColor: '#E8E9EC',
    backgroundColor: '#fff',
    justifyContent: 'flex-start',
    marginHorizontal: 20,
  },
  toggleText: {fontSize: 14, fontFamily: 'Poppins-SemiBold', color: '#0056B7'},
  toggleIconContainer: {
    marginLeft: 5,
    borderRadius: 20,
    padding: 3,
    backgroundColor: '#fff',
    elevation: 2,
  },
  bottomContainer: {
    borderTopWidth: 1,
    borderColor: '#E8E9EC',
    padding: 15,
    backgroundColor: '#fff',
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
    paddingVertical: 0,
  },
  proceedButton: {
    height: commonHeight,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  proceedButtonText: {color: '#fff', fontSize: 16, fontWeight: '600'},
  connectLabel: {
    fontSize: 16,
    color: '#000',
    fontFamily: 'Poppins-SemiBold',
  },
});

export default FyersConnectUI;
