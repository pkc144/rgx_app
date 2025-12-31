// KotakConnectUI.js
import React, {useState, useRef} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StyleSheet,
  Dimensions,
  TextInput,
  ActivityIndicator,
  Image,
} from 'react-native';
import Modal from 'react-native-modal';
import {
  EyeIcon,
  EyeOffIcon,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
} from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import HelpModal from '../../components/BrokerConnectionModal/HelpModal';
import kotakIcon from '../../assets/kotak_securities.png'; // <-- replace with your Kotak logo asset
import KotakHelpContent from './HelpUI/KotakHelpContent';

const {height: screenHeight} = Dimensions.get('window');
const commonHeight = 40;

const KotakConnectUI = ({
  isVisible,
  onClose,
  helpVisible,
  setHelpVisible,
  shouldRenderContent,
  openOtpBox,
  mpin,
  setMpin,
  totp,
  settotp,
  mobileNumber,
  setMobileNumber,
  consumerKey,
  setConsumerKey,
  consumerSecret,
  setConsumerSecret,
  ucc,
  setucc,
  iskeyVisible,
  setIskeyVisible,
  issecretVisible,
  setIssecretVisible,
  ismpinVisible,
  setIsmpinVisible,
  updateKotakSecretKey,
  submitOtp,
  isLoading,
}) => {
  const scrollViewRef = useRef(null);
  const [expanded, setExpanded] = useState(false);

  return (
    <Modal
      isVisible={isVisible}
      onBackdropPress={onClose}
      style={styles.modal}
      backdropOpacity={0.1}
      useNativeDriver>
      <SafeAreaView style={styles.safeArea}>
        {/* Gradient Header */}
        <LinearGradient
          colors={['#0B3D91', '#0056B7']}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
          style={styles.headerRow}>
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <TouchableOpacity onPress={onClose} style={styles.backButton}>
              <ChevronLeft size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Connect to Kotak</Text>
          </View>
          <Image source={kotakIcon} style={styles.headerIcon} />
        </LinearGradient>

        {/* If expanded → Show HelpContent Fullscreen */}
        {expanded ? (
          <View style={styles.fullScreenHelp}>
            <ScrollView
              ref={scrollViewRef}
              contentContainerStyle={{padding: 10}}
              showsVerticalScrollIndicator={false}>
              <KotakHelpContent expanded={expanded} />
            </ScrollView>
            <TouchableOpacity
              style={styles.toggleContainer}
              onPress={() => setExpanded(false)}>
              <Text style={styles.toggleText}>See Less</Text>
              <View style={styles.toggleIconContainer}>
                <ChevronUp size={14} color="#000" />
              </View>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Normal Help Box */}
            <ScrollView
              ref={scrollViewRef}
              contentContainerStyle={{padding: 10}}
              showsVerticalScrollIndicator={false}>
              <View style={[styles.guideBox, {maxHeight: 320}]}>
                <KotakHelpContent expanded={expanded} />
              </View>
            </ScrollView>

            {/* Toggle Read More */}
            <TouchableOpacity
              style={styles.toggleContainer}
              onPress={() => setExpanded(true)}>
              <Text style={styles.toggleText}>Read More</Text>
              <View style={styles.toggleIconContainer}>
                <ChevronDown size={14} color="#000" />
              </View>
            </TouchableOpacity>

            {/* OTP Flow */}
            {openOtpBox ? (
              <View style={styles.bottomContainer}>
                <Text style={styles.headerLabel}>Enter OTP:</Text>
                <TextInput
                  value={mpin}
                  placeholder="Enter OTP"
                  placeholderTextColor="grey"
                  keyboardType="numeric"
                  style={styles.inputBox}
                  onChangeText={text => setMpin(text.trim())}
                />
                <TouchableOpacity
                  onPress={submitOtp}
                  style={[
                    styles.proceedButton,
                    (!mpin || !totp) && {backgroundColor: '#d3d3d3'},
                  ]}
                  disabled={!mpin || !totp}>
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.proceedButtonText}>Submit OTP</Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              /* Fixed Bottom Inputs */
              <View style={styles.bottomContainer}>
                {[
                  {
                    label: 'Consumer Key',
                    value: consumerKey,
                    setValue: setConsumerKey,
                    secure: !iskeyVisible,
                    toggle: () => setIskeyVisible(!iskeyVisible),
                  },
                  {
                    label: 'Consumer Secret',
                    value: consumerSecret,
                    setValue: setConsumerSecret,
                    secure: !issecretVisible,
                    toggle: () => setIssecretVisible(!issecretVisible),
                  },
                  {
                    label: 'Mobile Number',
                    value: mobileNumber,
                    setValue: setMobileNumber,
                  },
                  {
                    label: 'MPIN',
                    value: mpin,
                    setValue: setMpin,
                    secure: !ismpinVisible,
                    toggle: () => setIsmpinVisible(!ismpinVisible),
                  },
                  {label: 'UCC', value: ucc, setValue: setucc},
                  {label: 'TOTP', value: totp, setValue: settotp},
                ].map((input, idx) => (
                  <View key={idx} style={styles.inputWrapper}>
                    <Text style={styles.headerLabel}>{input.label}:</Text>
                    <View style={styles.inputContainer}>
                      <TextInput
                        value={input.value}
                        placeholder={`Enter your ${input.label}`}
                        placeholderTextColor="grey"
                        style={[styles.inputStyles, {flex: 1}]}
                        secureTextEntry={input.secure}
                        onChangeText={input.setValue}
                      />
                      {input.toggle && input.value ? (
                        <TouchableOpacity onPress={input.toggle}>
                          {input.secure ? (
                            <EyeOffIcon size={22} color="#000" />
                          ) : (
                            <EyeIcon size={22} color="#000" />
                          )}
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  </View>
                ))}

                {/* Connect Button */}
                <TouchableOpacity
                  onPress={updateKotakSecretKey}
                  style={[
                    styles.proceedButton,
                    (!mpin || !consumerKey || !consumerSecret) && {
                      backgroundColor: '#d3d3d3',
                    },
                  ]}
                  disabled={!mpin || !consumerKey || !consumerSecret}>
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.proceedButtonText}>Connect Kotak</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </>
        )}

        {/* Help Modal */}
        <HelpModal
          broker={'Kotak'}
          visible={helpVisible}
          onClose={() => setHelpVisible(false)}
        />
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modal: {justifyContent: 'flex-end', margin: 0},
  safeArea: {flex: 1, backgroundColor: '#fff'},
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
  headerIcon: {width: 35, height: 35, borderRadius: 3, backgroundColor: '#fff'},
  backButton: {
    padding: 4,
    borderRadius: 5,
    backgroundColor: '#fff',
    elevation: 4,
  },
  guideBox: {
    borderWidth: 1,
    borderColor: '#E8E9EC',
    borderRadius: 8,
    padding: 10,
  },
  fullScreenHelp: {flex: 1, backgroundColor: '#fff'},
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
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
  inputBox: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    backgroundColor: '#fff',
    fontFamily: 'Poppins-Regular',
    marginBottom: 10,
  },
  proceedButton: {
    height: commonHeight,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    backgroundColor: '#0056B7',
  },
  proceedButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Poppins-SemiBold',
  },
});

export default KotakConnectUI;
