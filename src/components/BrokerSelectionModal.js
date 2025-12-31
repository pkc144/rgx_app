// BrokerSelectionModal.js
import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
  Image,
  TextInput,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import Modal from 'react-native-modal';
import {
  ChevronRight,
  ChevronLeft,
  XIcon,
  Info,
  AlertOctagon,
  ArrowRight,
} from 'lucide-react-native';
import axios from 'axios';
import {getAuth} from '@react-native-firebase/auth';
import server from '../utils/serverConfig';
import Config from 'react-native-config';
import {generateToken} from '../utils/SecurityTokenManager';
import useModalStore from '../GlobalUIModals/modalStore';
import LinearGradient from 'react-native-linear-gradient';
import {useTrade} from '../screens/TradeContext';
import {getAdvisorSubdomain} from '../utils/variantHelper';

const {width: screenWidth, height: screenHeight} = Dimensions.get('window');

const BrokerSelectionModal = ({
  showBrokerModal,
  setShowBrokerModal,
  OpenTokenExpireModel,
  setOpenTokenExpireModel,
  handleAcceptRebalanceWithoutBroker,
}) => {
  const {configData} = useTrade();
  const openModal = useModalStore(state => state.openModal);

  const brokersmain = [
    {
      name: 'AngelOne',
      key: 'Angel One',
      url: `https://smartapi.angelbroking.com/publisher-login?api_key=${configData?.config?.REACT_APP_ANGEL_ONE_API_KEY}`,
      logo: require('../assets/AngleLogo.png'),
    },
    {
      name: 'Zerodha',
      key: 'Zerodha',
      url: 'https://www.zerodha.com/',
      logo: require('../assets/Zerodha.png'),
    },
    {
      name: 'ICICI',
      key: 'ICICI',
      url: 'https://www.icicidirect.com/',
      logo: require('../assets/icici.png'),
    },
    {
      name: 'Upstox',
      key: 'Upstox',
      url: 'https://www.upstox.com/',
      logo: require('../assets/upstox.png'),
    },
    {
      name: 'Kotak',
      key: 'Kotak',
      url: 'https://www.kotak.com/',
      logo: require('../assets/kotak_securities.png'),
    },
    {
      name: 'Hdfc',
      key: 'HDFC',
      url: 'https://www.hdfc.com/',
      logo: require('../assets/hdfc_securities.png'),
    },
    {
      name: 'Dhan',
      key: 'Dhan',
      url: 'https://www.dhan.com/',
      logo: require('../assets/dhan.png'),
    },
    {
      name: 'AliceBlue',
      key: 'AliceBlue',
      url: 'https://www.aliceblue.com/',
      logo: require('../assets/aliceblue.png'),
    },
    {
      name: 'Fyers',
      key: 'Fyers',
      url: 'https://www.fyers.com/',
      logo: require('../assets/fyers.png'),
    },
    {
      name: 'Motilal Oswal',
      key: 'Motilal',
      url: 'https://www.motilaloswal.com/',
      logo: require('../assets/Motilalicon.png'),
    },
    {
      name: 'Groww',
      key: 'Groww',
      url: 'https://www.groww.com/',
      logo: require('../assets/GrowwIcon.png'),
    },
  ];

  const [pressedBroker, setPressedBroker] = useState(null);
  const [userDetails, setUserDetails] = useState();
  const auth = getAuth();
  const user = auth.currentUser;
  const userEmail = user?.email;
  const [loginLoading, setLoginLoading] = useState(false);
  const [brokerStatus, setBrokerStatus] = useState(
    userDetails ? userDetails.connect_broker_status : null,
  );
  const [showMessage, setShowMessage] = useState(false);

  const getUserDeatils = () => {
    axios
      .get(`${server.server.baseUrl}api/user/getUser/${userEmail}`, {
        headers: {
          'Content-Type': 'application/json',
          'X-Advisor-Subdomain': getAdvisorSubdomain(),
          'aq-encrypted-key': generateToken(
            Config.REACT_APP_AQ_KEYS,
            Config.REACT_APP_AQ_SECRET,
          ),
        },
      })
      .then(res => {
        setUserDetails(res.data.User);
        setBrokerStatus(res.data.User.connect_broker_status);
      })
      .catch(err => console.log(err));
  };

  useEffect(() => {
    if (userEmail) {
      getUserDeatils();
    }
  }, [userEmail]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowMessage(true);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleBrokerSelect = broker => {
    const {openModal, closeModal} = useModalStore.getState();
    if (broker?.key) {
      setShowBrokerModal(false);
      closeModal();
      setTimeout(() => {
        openModal(broker.key);
      }, 100);
    }
  };

  const handleBrokerSelectOpenExpire = broker => {
    const {openModal, closeModal} = useModalStore.getState();
    if (broker) {
      setShowBrokerModal(false);
      setOpenTokenExpireModel(false);
      closeModal();
      setTimeout(() => {
        openModal(broker);
      }, 100);
    }
  };

  const broker = userDetails?.user_broker;

  const onClose = () => {
    setShowBrokerModal(false);
    setOpenTokenExpireModel(false);
  };

  // Create rows of brokers (4 per row)
  const chunkArray = (array, size) => {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  };

  const brokerRows = chunkArray(brokersmain, 4);

  return (
    <Modal
      visible={showBrokerModal || OpenTokenExpireModel}
      backdropOpacity={0.5}
      useNativeDriver
      hideModalContentWhileAnimating
      animationIn="slideInUp"
      animationOut="slideOutDown"
      swipeDirection={['down']}
      style={styles.modal}
      onRequestClose={onClose}>
      {showBrokerModal && (
        <LinearGradient
          colors={['#002651', '#003572', '#0053B1']}
          style={styles.gradientContainer}
          start={{x: 0, y: 0}}
          end={{x: 0, y: 1}}>
          <SafeAreaView style={styles.safeArea}>
            <View style={styles.contentContainer}>
              {/* Header */}
              <View style={styles.header}>
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => setShowBrokerModal(false)}
                  activeOpacity={0.9}>
                  <ChevronLeft size={24} color="#ffffff" />
                </TouchableOpacity>

                <Text style={styles.headerTitle}>
                  Select your broker for connection
                </Text>
              </View>

              {/* Important Notice Box */}
              <View style={styles.noticeBox}>
                <Text style={styles.noticeTitle}>Important:</Text>
                <Text style={styles.noticeText}>
                  • Actions and detection are solely yours.
                </Text>
                <Text style={styles.noticeText}>
                  • RA doesn't control or influence your action.
                </Text>
                <Text style={styles.noticeText}>
                  • RA isn't responsible for your outcome.
                </Text>
                <Text style={styles.noticeText}>
                  • You act independently on the broker platform.
                </Text>
              </View>

              {/* Scrollable Broker Grid */}
              <ScrollView
                style={styles.brokerScrollView}
                contentContainerStyle={styles.brokerScrollContent}
                showsVerticalScrollIndicator={false}>
                <View style={styles.brokerGrid}>
                  {brokerRows.map((row, rowIndex) => (
                    <View key={rowIndex} style={styles.brokerRow}>
                      {row.map((broker, index) => (
                        <TouchableOpacity
                          key={index}
                          activeOpacity={0.7}
                          style={[
                            styles.brokerCard,
                            pressedBroker === broker.key &&
                              styles.brokerCardPressed,
                          ]}
                          onPressIn={() => setPressedBroker(broker.key)}
                          onPressOut={() => setPressedBroker(null)}
                          onPress={() => handleBrokerSelect(broker)}>
                          <View style={styles.brokerLogoContainer}>
                            <Image
                              source={broker.logo}
                              style={styles.brokerLogo}
                              resizeMode="contain"
                            />
                          </View>
                          <Text style={styles.brokerName}>{broker.name}</Text>
                        </TouchableOpacity>
                      ))}
                      {/* Add empty placeholders for last row if needed */}
                      {row.length < 4 &&
                        Array.from({length: 4 - row.length}).map((_, i) => (
                          <View
                            key={`placeholder-${i}`}
                            style={styles.brokerCardPlaceholder}
                          />
                        ))}
                    </View>
                  ))}
                </View>
              </ScrollView>

              {/* Continue Without Broker Button */}
              <TouchableOpacity
                style={styles.continueButton}
                activeOpacity={0.7}
                hitSlop={{top: 15, bottom: 15, left: 15, right: 15}}
                onPress={handleAcceptRebalanceWithoutBroker}>
                <Text style={styles.continueButtonText}>
                  Continue without broker
                </Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </LinearGradient>
      )}

      {OpenTokenExpireModel && (
        <View style={styles.expireModalContainer}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <XIcon size={24} color="#666" />
          </TouchableOpacity>

          {!showMessage || !broker ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
            </View>
          ) : (
            <View style={styles.loginPromptContainer}>
              <View style={styles.loginPromptHeader}>
                <View style={styles.alertIconWrapper}>
                  <AlertOctagon size={40} color="#FF3B30" />
                </View>
                <View style={styles.loginPromptTextContainer}>
                  <Text style={styles.loginPromptTitle}>
                    Authentication Required
                  </Text>
                </View>
              </View>

              <View style={styles.securityNoteContainer}>
                <Info size={16} color="#0066CC" />
                <Text style={styles.securityNoteText}>
                  Your session has expired. Please login to your broker to
                  continue with your investments.
                </Text>
              </View>

              {broker && (
                <TouchableOpacity
                  style={styles.enhancedLoginButton}
                  onPress={() => handleBrokerSelectOpenExpire(broker)}
                  disabled={loginLoading}
                  activeOpacity={0.7}>
                  <View style={styles.loginButtonContent}>
                    <Text style={styles.loginButtonText}>
                      Login to {broker}
                    </Text>
                    <View style={styles.arrowIconContainer}>
                      <ArrowRight size={16} color="#FFFFFF" />
                    </View>
                  </View>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      )}
    </Modal>
  );
};

const styles = StyleSheet.create({
  modal: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  backButton: {
    padding: 6,
    borderRadius: 8,
    color: '#FFB800',
    marginRight: 14,
    elevation: 3,
  },
  gradientContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    flex: 1,
    maxHeight: screenHeight * 0.9,
  },
  safeArea: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Satoshi-Bold',
    color: '#FFFFFF',
    lineHeight: 30,
  },
  noticeBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderWidth: 2,
    borderColor: '#FFB800',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  noticeTitle: {
    fontSize: 14,
    fontFamily: 'Satoshi-Bold',
    color: '#FFB800',
    marginBottom: 8,
  },
  noticeText: {
    fontSize: 13,
    fontFamily: 'Satoshi-Regular',
    color: '#FFFFFF',
    lineHeight: 20,
    marginBottom: 4,
  },
  brokerScrollView: {
    flex: 1,
    marginBottom: 16,
  },
  brokerScrollContent: {
    paddingBottom: 10,
  },
  brokerGrid: {},
  brokerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  brokerCardPlaceholder: {
    width: (screenWidth - 60) / 4,
    aspectRatio: 1,
  },
  brokerCard: {
    width: (screenWidth - 70) / 4, // 4 cards with spacing
    aspectRatio: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  brokerCardPressed: {
    backgroundColor: '#E8F4FF',
    transform: [{scale: 0.95}],
  },
  brokerLogoContainer: {
    width: '50%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  brokerLogo: {
    width: '100%',
    height: '100%',
  },
  brokerName: {
    fontSize: 11,
    fontFamily: 'Satoshi-Medium',
    color: '#000000',
    textAlign: 'center',
  },
  continueButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    marginBottom: 20,
    minHeight: 54,
  },
  continueButtonText: {
    fontSize: 16,
    fontFamily: 'Satoshi-Bold',
    color: '#FFFFFF',
  },

  // Token Expire Modal Styles
  expireModalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: screenWidth * 0.05,
  },
  closeButton: {
    position: 'absolute',
    right: 10,
    top: 10,
    zIndex: 1,
  },
  loaderContainer: {
    marginVertical: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginPromptContainer: {
    marginTop: 20,
    marginBottom: 15,
    padding: 15,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  loginPromptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  alertIconWrapper: {
    backgroundColor: '#FFF2F2',
    padding: 12,
    borderRadius: 12,
    marginRight: 15,
  },
  loginPromptTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  loginPromptTitle: {
    fontSize: 18,
    fontFamily: 'Satoshi-Bold',
    color: '#000000',
  },
  enhancedLoginButton: {
    backgroundColor: '#0066CC',
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginTop: 15,
    shadowColor: '#0066CC',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#0052A3',
  },
  loginButtonContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  loginButtonText: {
    fontSize: 15,
    fontFamily: 'Satoshi-Bold',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  arrowIconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 15,
    padding: 5,
    marginLeft: 8,
  },
  securityNoteContainer: {
    marginBottom: 10,
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#0066CC',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  securityNoteText: {
    fontSize: 12,
    fontFamily: 'Satoshi-Regular',
    color: '#666666',
    lineHeight: 18,
    marginLeft: 10,
    flex: 1,
  },
});

export default BrokerSelectionModal;
