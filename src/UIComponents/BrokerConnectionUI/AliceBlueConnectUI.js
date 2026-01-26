import React, {useState, useRef} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Image,
  Dimensions,
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
import LinearGradient from 'react-native-linear-gradient';
import HelpModal from '../../components/BrokerConnectionModal/HelpModal';
import AliceblueHelpContent from './HelpUI/AliceblueHelpContent';
import aliceBlueIcon from '../../assets/aliceblue.png';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import CrossPlatformOverlay from '../../components/CrossPlatformOverlay';

const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('screen');
const commonHeight = 40;

const AliceBlueConnectUI = ({
  isVisible,
  onClose,
  clientCode,
  apiKey,
  setclientCode,
  setApiKey,
  isPasswordVisible,
  isPasswordVisibleup,
  setIsPasswordVisible,
  setIsPasswordVisibleup,
  handleSubmit,
  loading,
  helpVisible,
  setHelpVisible,
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
              <Text style={styles.headerTitle}>Connect AliceBlue</Text>
            </View>
            <Image source={aliceBlueIcon} style={styles.headerIcon} />
          </LinearGradient>

          {/* Main Scrollable Content */}
          {expanded ? (
            /* Full Screen Help when expanded */
            <View style={styles.fullScreenHelp}>
              <ScrollView
                ref={scrollViewRef}
                style={{flex: 1}}
                contentContainerStyle={{padding: 10, paddingBottom: 20}}
                showsVerticalScrollIndicator={true}>
                <AliceblueHelpContent expanded={expanded} />
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
                  <AliceblueHelpContent expanded={expanded} />
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
                  <View style={styles.cardHeader}>
                    <Text style={styles.connectLabel}>Connect to AliceBlue</Text>
                    <Image
                      source={aliceBlueIcon}
                      style={styles.cardIcon}
                      resizeMode="contain"
                    />
                  </View>

                  {/* Input Fields */}
                  <View style={styles.inputSection}>
                    {/* User ID */}
                    <View style={styles.inputWrapper}>
                      <Text style={styles.headerLabel}>User ID:</Text>
                      <View style={styles.inputContainer}>
                        <TextInput
                          value={clientCode}
                          placeholder="Enter your User ID"
                          placeholderTextColor="grey"
                          style={[styles.inputStyles, {flex: 1}]}
                          secureTextEntry={!isPasswordVisibleup}
                          onChangeText={text => setclientCode(text.trim())}
                        />
                        <TouchableOpacity
                          onPress={() =>
                            setIsPasswordVisibleup(!isPasswordVisibleup)
                          }>
                          {clientCode ? (
                            isPasswordVisibleup ? (
                              <EyeIcon size={24} color="#000" />
                            ) : (
                              <EyeOffIcon size={24} color="#000" />
                            )
                          ) : null}
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* API Key */}
                    <View style={styles.inputWrapper}>
                      <Text style={styles.headerLabel}>API Key:</Text>
                      <View style={styles.inputContainer}>
                        <TextInput
                          value={apiKey}
                          placeholder="Enter your API Key"
                          placeholderTextColor="grey"
                          style={[styles.inputStyles, {flex: 1}]}
                          secureTextEntry={!isPasswordVisible}
                          onChangeText={text => setApiKey(text.trim())}
                        />
                        <TouchableOpacity
                          onPress={() => setIsPasswordVisible(!isPasswordVisible)}>
                          {apiKey ? (
                            isPasswordVisible ? (
                              <EyeIcon size={24} color="#000" />
                            ) : (
                              <EyeOffIcon size={24} color="#000" />
                            )
                          ) : null}
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Connect Button */}
                    <TouchableOpacity
                      style={[
                        styles.proceedButton,
                        {
                          backgroundColor:
                            clientCode && apiKey ? '#0056B7' : '#d3d3d3',
                        },
                      ]}
                      onPress={handleSubmit}
                      disabled={!(clientCode && apiKey)}>
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
            broker="AliceBlue"
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
  backButton: {
    padding: 4,
    borderRadius: 5,
    backgroundColor: '#fff',
    elevation: 4,
  },
  headerIcon: {width: 35, height: 35, borderRadius: 3, backgroundColor: '#fff'},
  container: {flex: 1, justifyContent: 'flex-start'},
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
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderTopColor: '#E8E9EC',
    backgroundColor: '#fff',
  },
  toggleText: {fontSize: 14, fontFamily: 'Poppins-SemiBold', color: '#0056B7'},
  toggleIconContainer: {
    marginLeft: 5,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 3,
    elevation: 3,
  },
  bottomContainer: {
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#E8E9EC',
    backgroundColor: '#fff',
  },
  inputCard: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#E8E9EC',
    borderRadius: 12,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 12,
  },
  cardIcon: {
    width: 30,
    height: 30,
    backgroundColor: '#fff',
    borderRadius: 3,
  },
  inputSection: {
    padding: 15,
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
  connectLabel: {
    fontSize: 16,
    color: '#000',
    fontFamily: 'Poppins-SemiBold',
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

export default AliceBlueConnectUI;
