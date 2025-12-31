// components/DhanConnectUI.js
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
  XIcon,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
} from 'lucide-react-native';
import HelpModal from '../../components/BrokerConnectionModal/HelpModal';
import LinearGradient from 'react-native-linear-gradient';
import DhanHelpContent from './HelpUI/DhanHelpContent';
import dhanIcon from '../../assets/dhan.png';
const {height: screenHeight} = Dimensions.get('window');
const commonHeight = 40;

const DhanConnectUI = ({
  isVisible,
  onClose,
  cliendId,
  accessToken,
  setCliendId,
  setaccessToken,
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

  return (
    <Modal
      isVisible={isVisible}
      onBackdropPress={onClose}
      style={styles.modal}
      backdropOpacity={0.1}
      useNativeDriver>
      <SafeAreaView style={styles.safeArea}>
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
            <Text style={styles.headerTitle}>Connect to Dhan</Text>
          </View>
          <Image source={dhanIcon} style={styles.headerIcon} />
        </LinearGradient>

        {/* Scrollable Help Content */}
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={{padding: 10}}
          showsVerticalScrollIndicator={false}>
          <View style={[styles.guideBox, {maxHeight: expanded ? 420 : 320}]}>
            <DhanHelpContent expanded={expanded} />
          </View>
        </ScrollView>

        {/* Read More / See Less outside scroll */}
        <TouchableOpacity
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
        </TouchableOpacity>

        <View
          style={{
            marginHorizontal: 15,
            borderWidth: 0.3,
            borderColor: '#c8c8c8',
            borderRadius: 8,
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
            <Text style={styles.connectLabel}>Connect to Dhan</Text>
            <Image
              source={dhanIcon}
              style={{
                width: 30,
                height: 30,
                backgroundColor: '#fff',
                borderRadius: 3,
              }}
              resizeMode="contain"
            />
          </View>

          {/* Fixed Bottom Inputs & Button */}
          <View style={styles.bottomContainer}>
            {/* Client ID */}
            <View style={styles.inputWrapper}>
              <Text style={styles.headerLabel}>Client ID:</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  value={cliendId}
                  placeholder="Enter your Client ID"
                  placeholderTextColor="grey"
                  style={[styles.inputStyles, {flex: 1}]}
                  secureTextEntry={!isPasswordVisibleup}
                  onChangeText={text => setCliendId(text.trim())}
                />
                <TouchableOpacity
                  onPress={() => setIsPasswordVisibleup(!isPasswordVisibleup)}>
                  {cliendId ? (
                    isPasswordVisibleup ? (
                      <EyeIcon size={24} color="#000" />
                    ) : (
                      <EyeOffIcon size={24} color="#000" />
                    )
                  ) : null}
                </TouchableOpacity>
              </View>
            </View>

            {/* Access Token */}
            <View style={styles.inputWrapper}>
              <Text style={styles.headerLabel}>Access Token:</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  value={accessToken}
                  placeholder="Enter your Access Token"
                  placeholderTextColor="grey"
                  style={[styles.inputStyles, {flex: 1}]}
                  secureTextEntry={!isPasswordVisible}
                  onChangeText={text => setaccessToken(text.trim())}
                />
                <TouchableOpacity
                  onPress={() => setIsPasswordVisible(!isPasswordVisible)}>
                  {accessToken ? (
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
                    cliendId && accessToken ? '#0056B7' : '#d3d3d3',
                },
              ]}
              onPress={handleSubmit}
              disabled={!(cliendId && accessToken)}>
              {loading ? (
                <ActivityIndicator size={27} color="#fff" />
              ) : (
                <Text style={styles.proceedButtonText}>Connect</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
        <HelpModal
          broker="Dhan"
          visible={helpVisible}
          onClose={() => setHelpVisible(false)}
        />
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modal: {justifyContent: 'flex-end', margin: 0},
  headerIcon: {width: 35, height: 35, borderRadius: 3, backgroundColor: '#fff'},
  safeArea: {flex: 1, backgroundColor: '#fff'},
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
  closeButton: {padding: 4, borderRadius: 5, backgroundColor: '#000'},
  guideBox: {
    borderWidth: 1,
    borderColor: '#E8E9EC',
    borderRadius: 8,
    padding: 10,
  },
  toggleContainer: {flexDirection: 'row', alignItems: 'center', padding: 10},
  toggleText: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    color: '#0056B7',
    marginLeft: 15,
  },
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
  helpText: {
    color: '#1890FF',
    fontFamily: 'Poppins-SemiBold',
    paddingHorizontal: 5,
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

export default DhanConnectUI;
