import {useState, useCallback, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Modal,
  Image,
  ScrollView,
  Platform,
} from 'react-native';
import axios from 'axios';
import moment from 'moment';
import server from '../../utils/serverConfig';
import CryptoJS from 'react-native-crypto-js';
import Toast from 'react-native-toast-message';
import IsMarketHours from '../../utils/isMarketHours';
import eventEmitter from '../../components/EventEmitter';
import LinearGradient from 'react-native-linear-gradient';
import Config from 'react-native-config';
import StepProgressBar from './StepProgressBar';
import Checkbox from '../../components/AdviceScreenComponents/Checkbox';
import {useNavigation} from '@react-navigation/native';
const Alpha100 = require('../../assets/mpf_1.png');
const screenWidth = Dimensions.get('window').width;
import {XIcon, Calendar, Check, X, Info} from 'lucide-react-native';
import APP_VARIANTS from '../../utils/Config';
import MPStatusModal from '../../components/AdviceScreenComponents/MPStatusModal';
import logo from '../../assets/fadedlogo.png';
const selectedVariant = Config?.APP_VARIANT || 'alphaquark';
const variantConfig = APP_VARIANTS[selectedVariant] || APP_VARIANTS['alphaquark'] || {};
const {
  logo: LogoComponent,
  mainColor = '#4CAAA0',
  themeColor = '#0056B7',
  CardborderWidth = 0,
  cardElevation = 3,
  cardverticalmargin = 3,
} = variantConfig;

import {generateToken} from '../../utils/SecurityTokenManager';
import RebalancePreferenceModal from './RebalancePreferenceModal';
import RebalanceDetailsModal from '../../components/AdviceScreenComponents/RebalanceDetailsModal';
import RebalanceChangeDetailModal from '../../components/RebalanceChangeDetailModal';
import {useTrade} from '../../screens/TradeContext';

const RebalanceCard = ({
  openRebalModal,
  data,
  mininvestvalue,
  frequency,
  setOpenRebalanceModal,
  modelName,
  imageUrl,
  userEmail,
  apiKey,
  setmatchfailed,
  jwtToken,
  secretKey,
  clientCode,
  sid,
  matchingFailedTrades,
  serverId,
  viewToken,
  setCalculatedPortfolioData,
  repair,
  advisorName,
  setModelPortfolioModelId,
  storeModalName,
  setStoreModalName,
  setOpenTokenExpireModel,
  broker,
  brokerStatus,
  rebalanceDetails,
  setBrokerModel,
  sortedRebalances,
  funds,
  overView,
  userExecution,
  showstatusModal,
  setShowstatusModal,
  stockDataForModal,
  setStockDataForModal,
  setLatestRebalanceData,
  setRepairmessageModal,
  setuserExecution,
  setmatchingFailedTrades,
  userExecutionFinal
}) => {
  const {configData} = useTrade();
  const angelOneApiKey = configData?.config.REACT_APP_ANGEL_ONE_API_KEY;
  const zerodhaApiKey = configData?.config.REACT_APP_ZERODHA_API_KEY;
  const navigation = useNavigation();
  const [allRebalanceHoldingData, setallRebalanceHoldingData] = useState(null);
  const [isChangeModal, setisChangeModal] = useState(false);
  const showToast = (message1, type, message2) => {
    Toast.show({
      type: type,
      text2: message2 + ' ' + message1,
      position: 'bottom',
      visibilityTime: 4000,
      autoHide: true,
      topOffset: 60,
      bottomOffset: 80,
      text1Style: {
        color: 'black',
        fontSize: 12,
        fontWeight: '400',
        fontFamily: 'Poppins-Medium',
      },
      text2Style: {
        color: 'black',
        fontSize: 12,
        fontFamily: 'Poppins-Regular',
      },
    });
  };

  // const [showstatusModal, setShowstatusModal] = useState(false);

  const [showCheckboxModal, setShowCheckboxModal] = useState(false);
  const [apiResponseData, setApiResponseData] = useState(null);
  const [latestUpdatedResponse, setLatestUpdatedResponse] = useState(null);
  const [selectedOption, setSelectedOption] = useState('option1');
  const [currentStep, setCurrentStep] = useState(1);
  const [modalVisibleDetails, setModalVisibleDetails] = useState(false);
  // Define 3 steps data to match web
  const stepsData = [
    {label: 'Rebalance Preference'},
    {label: 'Current holdings'},
    {label: 'Final Rebalance'},
  ];

  const handleCheckStatus = async () => {
    try {
      const response = await axios.get(
        `${server.ccxtServer.baseUrl}rebalance/user-portfolio/latest/${userEmail}/${modelName}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Advisor-Subdomain': configData?.config?.REACT_APP_HEADER_NAME,
            'aq-encrypted-key': generateToken(
              Config.REACT_APP_AQ_KEYS,
              Config.REACT_APP_AQ_SECRET,
            ),
          },
        },
      );
      const orderResults =
        response.data?.data?.user_net_pf_model?.order_results || [];
      setApiResponseData(response.data);
      setStockDataForModal(orderResults);
    } catch (error) {
      setShowstatusModal(true);
      console.error('Error fetching stock data:', error);
    }
    setShowstatusModal(true);
  };

  const [modalVisible, setModalVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [loading, setLoading] = useState(false);

  const openModal = () => {
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
  };

  const checkValidApiAnSecret = data => {
    const bytesKey = CryptoJS.AES.decrypt(data, 'ApiKeySecret');
    const Key = bytesKey.toString(CryptoJS.enc.Utf8);
    if (Key) {
      return Key;
    }
  };

  const handleexpire = () => {
    eventEmitter.emit('openExpireModel', {isOpen: true});
  };

  const handleBrokerConnect = () => {
    eventEmitter.emit('openBrokerConnect', {isOpen2: true});
  };

  const handleAcceptClick = () => {
    setisChangeModal(false);
    setModelPortfolioModelId(data.model_Id);
    setmatchfailed(matchingFailedTrades);
    if (repair && userExecution?.status !== 'toExecute') {
      setStoreModalName(modelName);
      setCurrentStep(2);
      handleCheckStatus();
    } else {
      setShowCheckboxModal(true);
      setStoreModalName(modelName);
    }
  };

  const handleChangeCheck = () => {
  console.log("Here DATA----", userExecutionFinal, matchingFailedTrades);

  // Set the values regardless of whether they're defined or not
  setuserExecution(userExecutionFinal);
  setmatchingFailedTrades(matchingFailedTrades);

  // Proceed with opening the change modal (no date restriction for repair/multiple executions)
  setisChangeModal(true);
  setStoreModalName(modelName);
  setLatestRebalanceData(data);
};

  const handleViewMore = () => {
    navigation.navigate('MPPerformanceScreen', {
      modelName: modelName.name,
      specificPlan: modelName,
    });
  };
  const handleConfirmPreference = () => {
    handleCheckBroker();
  };

  const handleCheckBroker = () => {
    if (brokerStatus === 'Disconnected') {
      setShowCheckboxModal(false);
      setCurrentStep(2);
      // handleCheckStatus();
      setBrokerModel(true);
    } else {
      const isMarketHours = IsMarketHours();
      setLoading(true);
      if (!broker) {
        setShowCheckboxModal(false);
        setBrokerModel(true);
        setLoading(false);
        return;
      } else if (funds?.status === 1 || funds?.status === 2 || funds === null) {
        setOpenTokenExpireModel(true);
        setLoading(false);
        return;
      } else {
        setShowCheckboxModal(false);
        setCurrentStep(2);
        handleCheckStatus();
        setLoading(false);
      }
    }
  };

  return (
    <View>
      <View>
        <LinearGradient
          colors={
            repair && userExecution?.status !== 'toExecute'
              ? ['rgba(0, 38, 81, 1)', '#dc4108ff']
              : ['#002651', '#0672edff']
          }
          start={{x: 0, y: 1}}
          end={{x: 1, y: 1}}
          style={[styles.cardContainer, {borderRadius: isExpanded ? 0 : 6}]}>
          <View style={styles.cardContent}>
            <View style={styles.textContent}>
              <Text style={styles.titleText}>{modelName}</Text>
              <View style={{flexDirection: 'column'}}>
                <Text
                  style={[
                    styles.subText,
                    {
                      color:
                        repair && userExecution?.status !== 'toExecute'
                          ? '#fff'
                          : '#fff',
                    },
                  ]}>
                  <Text
                    style={{
                      color: '#fff',
                      fontFamily: 'Satoshi-Regular',
                    }}></Text>
                  {overView?.length > 50
                    ? isExpanded
                      ? overView
                      : `${overView?.substring(0, 50)}...`
                    : overView}
                  {overView?.length > 50 && (
                    <Text
                      onPress={openModal}
                      style={{
                        fontFamily: 'Satoshi-Regular',
                        color: '#4B8CEE',
                        padding: 1,
                        fontSize: 10,
                      }}>
                      {isExpanded ? ' Read Less' : ' Read More'}
                    </Text>
                  )}
                </Text>
              </View>
            </View>
            <View
              style={{
                borderWidth: 1,
                borderColor:
                  repair && userExecution?.status !== 'toExecute'
                    ? '#fff'
                    : "#fff",
                alignContent: 'center',
                alignItems: 'center',
                alignSelf: 'center',
                borderRadius: 15,
                paddingHorizontal: 10,
              }}>
              <Text style={styles.rebalanceText}>
                Rebalance: {frequency}
              </Text>
            </View>
            <View style={styles.logoContainer} pointerEvents="none">
              <Image
                source={logo}
                style={[styles.logo, { tintColor: '#FFFFFF' }]}
                resizeMode="contain"
              />
            </View>
          </View>
          <View
            style={{
              paddingVertical: 5,
            }}>
            <View style={{ paddingHorizontal: 10 }}>
              <Text
                style={{
                  color: '#DBD8D8',
                  fontSize: 12,
                  fontFamily: 'Satoshi-Medium',
                  marginRight: 10,
                }}>
                Minimum Investment Required
              </Text>
              <Text
                style={{
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontSize: 14,
                  fontFamily: 'Satoshi-Bold',
                  marginLeft: 5,
                }}>
                ₹ {Number.parseFloat(mininvestvalue).toFixed(2)}
              </Text>
            </View>
          </View>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              gap: 12,
              paddingHorizontal: 10,
              marginTop: 10,
            }}>
            <TouchableOpacity
              onPress={() =>
                navigation.navigate('AfterSubscriptionScreen', {
                  fileName: modelName,
                })
              }
              style={styles.viewMoreButton}>
              <Text style={styles.viewMoreText}>Detail on portfolio</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleChangeCheck()}
              style={styles.button}>
              {loading ? (
                <ActivityIndicator size={14} color="#FFF" />
              ) : (
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'center',
                    alignContent: 'center',
                    alignItems: 'center',
                    alignSelf: 'center',
                  }}>
                  <Text style={styles.buttonText}>
                    {repair && userExecution?.status !== 'toExecute'
                      ? 'View/action on updates'
                      : 'View and act'}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>

      {/* Step 1: Rebalance Preference Modal */}
      <RebalancePreferenceModal
        showCheckboxModal={showCheckboxModal}
        setShowCheckboxModal={setShowCheckboxModal}
        setSelectedOption={setSelectedOption}
        selectedOption={selectedOption}
        handleConfirmPreference={handleConfirmPreference}
      />

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeModal}>
        <View style={styles.readMoreModalContainer}>
          <View style={styles.readMoreModalContent}>
            <View
              style={{flexDirection: 'row', justifyContent: 'space-between'}}>
              <Text style={styles.readMoreModalTitle}>
                {'Overview for ' + modelName}
              </Text>
              <XIcon onPress={closeModal} size={20} color={'black'} />
            </View>
            <Text style={styles.readMoreModalText}>{overView}</Text>
          </View>
        </View>
      </Modal>
      <RebalanceDetailsModal
        visible={modalVisibleDetails}
        onClose={() => setModalVisibleDetails(false)}
        data={rebalanceDetails || {}}
      />

      {isChangeModal && (
        <RebalanceChangeDetailModal
          isVisible={isChangeModal}
          modelName={modelName}
          onClose={() => setisChangeModal(false)}
          handleAcceptClick={handleAcceptClick}
          rebalanceDetails={rebalanceDetails}
          holdingsData={allRebalanceHoldingData}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    paddingVertical: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
    marginRight: 10,
    flex: 1,
  },
  cardContent: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    flex: 1,
  },
  viewMoreButton: {
    flex: 1,
    backgroundColor: 'rgba(232, 232, 232, 0.58)',
    borderRadius: 3,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewMoreText: {color: '#fff', fontSize: 12, fontFamily: 'Poppins-Medium'},
  textContent: {
    flex: 1,
  },
  titleText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    marginBottom: 5,
  },
  subText: {
    fontSize: 10,
    fontFamily: 'Satoshi-Regular',
  },
  rebalanceText: {
    fontSize: 12,
    borderTopRightRadius: 10,
    borderBottomLeftRadius: 10,
    color: '#fff',
    marginTop: 2,
    fontFamily: 'Poppins-Regular',
  },
  dateContainer: {
    flex: 1,
    flexDirection: 'row',
    alignContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    position: 'absolute',
    top: '100%',
    left: '60%',
    transform: [{translateX: -50}, {translateY: -50}], // centers it
    zIndex: 0,
    opacity: 1,
  },
  logo: {
    width: 110,
    height: 110,
    resizeMode: 'contain', // makes sure it fits nicely
  },

  dateText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: 'Satoshi-Regular',
    marginLeft: 5,
  },
  button: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 1)',
    borderRadius: 3,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: 'rgba(0, 86, 183, 1)',
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
  },

  // Enhanced Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: '100%',
    maxWidth: 500,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    top: 16,
    zIndex: 10,
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  modalHeader: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  optionsContainer: {
    paddingHorizontal: 24,
    gap: 16,
  },
  optionCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedOptionCard: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    lineHeight: 20,
    marginBottom: 4,
  },
  optionSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    lineHeight: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    padding: 24,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#374151',
    fontWeight: '500',
    fontSize: 14,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },

  // Read More Modal Styles
  readMoreModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  readMoreModalContent: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    width: '80%',
    maxWidth: 400,
  },
  readMoreModalTitle: {
    fontSize: 18,
    marginBottom: 10,
    color: 'black',
    fontFamily: 'Poppins-Bold',
  },
  readMoreModalText: {
    fontSize: 12,
    textAlign: 'left',
    color: '#858585',
    marginBottom: 20,
    fontFamily: 'Satoshi-Regular',
  },
});

export default RebalanceCard;
