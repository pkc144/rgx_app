import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  ScrollView,
  RefreshControl,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import axios from 'axios';
import { getAuth } from '@react-native-firebase/auth';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft, Pencil } from 'lucide-react-native';
import { FadeLoading } from 'react-native-fade-loading';
import ThinkingSvg from '../../assets/thinking.svg';
import BrokerSelectionModal from '../../components/BrokerSelectionModal';
import { useTrade } from '../TradeContext';
import { useConfig } from '../../context/ConfigContext';
import server from '../../utils/serverConfig';
import Config from 'react-native-config';
import { generateToken } from '../../utils/SecurityTokenManager';
import Toast from 'react-native-toast-message';
import DisconnectBrokerModal from './DisconnectBrokerModal';
import { getAdvisorSubdomain } from '../../utils/variantHelper';

const cross = require('../../assets/cross.png');
const tick = require('../../assets/checked.png');
const { width: screenWidth } = Dimensions.get('window');

const SubscriptionScreen = () => {
  const {
    userDetails,
    broker,
    getUserDeatils,
    funds,
    setBroker,
    isBrokerConnected,
    brokerStatus,
    configData,
    getAllFunds,
    getAllBrokerSpecificHoldings,
    getAllHoldings,
  } = useTrade();

  // Get dynamic config from API
  const config = useConfig();
  const themeColor = config?.themeColor || '#0056B7';

  const [loading, setLoading] = useState(true);
  const [brokername, setBrokerName] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const navigation = useNavigation();

  const auth = getAuth();
  const user = auth.currentUser;
  const userEmail = user?.email;

  const [showDisconnectBroker, setShowDisconnectBroker] = useState(false);
  const [withoutBrokerLoader, setWithoutBrokerLoader] = useState(false);

  const handleContinueWithoutBrokerSave = async () => {
    try {
      setWithoutBrokerLoader(true);

      // First API call
      await axios.put(
        `${server.ccxtServer.baseUrl}comms/no-broker-required/save`,
        {
          userEmail: userEmail,
          noBrokerRequired: true,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Advisor-Subdomain': getAdvisorSubdomain(),
            'aq-encrypted-key': generateToken(
              Config.REACT_APP_AQ_KEYS,
              Config.REACT_APP_AQ_SECRET,
            ),
          },
        },
      );

      Toast.show({
        type: 'success',
        text1: 'Your preference has been stored successfully.',
        visibilityTime: 3000,
      });

      // Second API call
      const newBrokerData = {
        user_email: userEmail,
        user_broker: 'DummyBroker',
      };

      const brokerReqConfig = {
        method: 'post',
        url: `${server.ccxtServer.baseUrl}rebalance/change_broker_model_pf`,
        data: JSON.stringify(newBrokerData),
        headers: {
          'Content-Type': 'application/json',
          'X-Advisor-Subdomain': configData?.config?.REACT_APP_HEADER_NAME,
          'aq-encrypted-key': generateToken(
            Config.REACT_APP_AQ_KEYS,
            Config.REACT_APP_AQ_SECRET,
          ),
        },
      };

      const checkResponse = await axios.request(brokerReqConfig);

      console.log('Broker change response:', checkResponse.data);
      await Promise.all([
        getUserDeatils(), // Refresh user details
        fetchBrokerStatusModal(), // Refresh broker status
        getAllFunds(), // Refresh funds
        getSubscribedPlans(), // Refresh subscribed plans
        getAllBrokerSpecificHoldings(),
        getAllHoldings(),
      ]);
      setWithoutBrokerLoader(false);
      setShowDisconnectBroker(false);
      setModalVisible(false);
    } catch (err) {
      setWithoutBrokerLoader(false);
      Toast.show({
        type: 'error',
        text1: 'Something went wrong. Please try again.',
        visibilityTime: 4000,
      });
    }
  };

  const getSubscribedPlans = async () => {
    try {
      const url = `${server.ccxtServer.baseUrl}comms/subscribed/plans/${userEmail}`;
      await axios.get(url, {
        headers: {
          'Content-Type': 'application/json',
          'X-Advisor-Subdomain': configData?.config?.REACT_APP_HEADER_NAME,
          'aq-encrypted-key': generateToken(
            Config.REACT_APP_AQ_KEYS,
            Config.REACT_APP_AQ_SECRET,
          ),
        },
      });
    } catch (error) {
      console.error('Error fetching subscribed plans:', error);
    }
  };

  const fetchBrokerStatusModal = async () => {
    setLoading(true);
    if (userEmail) {
      try {
        const updatedUserDetails = await getUserDeatils();
        setBrokerName(updatedUserDetails?.user_broker || '');
      } catch (error) {
      } finally {
        setLoading(false);
      }
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await getUserDeatils();
      await fetchBrokerStatusModal();
      await getSubscribedPlans();
      // await getAllFunds(); // Removed to avoid race condition
    } catch (e) {
      // Handle error if needed
    }
    setRefreshing(false);
  }, [userEmail]);

  useEffect(() => {
    fetchBrokerStatusModal();
    getSubscribedPlans();
  }, [userEmail]);

  // Optimized: Call getAllFunds when broker is present (ignoring status for AngelOne)
  useEffect(() => {
    if (broker) {
      getAllFunds();
    }
  }, [broker]);

  useEffect(() => {
    if (brokername) {
      setBroker(brokername);
    }
  }, [brokername]);

  const handleOpen = () => {
    setModalVisible(true);
  };

  // DEBUG: Monitor brokerStatus changes
  useEffect(() => {
    console.log('🔍 [SUBSCRIPTION SCREEN] brokerStatus changed:', brokerStatus);
    console.log('🔍 [SUBSCRIPTION SCREEN] broker:', broker);
    console.log('🔍 [SUBSCRIPTION SCREEN] userDetails?.user_broker:', userDetails?.user_broker);
    console.log('🔍 [SUBSCRIPTION SCREEN] isBrokerConnected:', isBrokerConnected);
  }, [brokerStatus, broker, userDetails, isBrokerConnected]);


  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['rgba(0, 86, 183, 1)', 'rgba(0, 38, 81, 1)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.headerGradient}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              getAllBrokerSpecificHoldings(),
                getAllHoldings(),
                getAllFunds(),
                navigation.goBack();
            }}
            activeOpacity={0.7}>
            <ChevronLeft size={24} color="#004A94" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Broker Screen</Text>
            <Text style={styles.headerSubtitle}>
              You can connect to Brokers here
            </Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#004A94"
          />
        }>
        {/* Broker Connection Status */}
        <View style={styles.statusContainer}>
          {loading ? (
            <FadeLoading
              style={styles.loadingBar}
              primaryColor="#f0f0f0"
              secondaryColor="#e0e0e0"
              duration={500}
            />
          ) : !(
            !brokerStatus ||
            brokerStatus === null ||
            brokerStatus === 'Disconnected'
          ) ? (
            <LinearGradient
              colors={['rgba(0, 86, 183, 1)', 'rgba(0, 38, 81, 1)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.brokerStatusCard}>
              <View style={styles.brokerStatusContent}>
                <View style={styles.brokerStatusLeft}>
                  <Image source={tick} style={styles.statusIcon} />
                  <View>
                    <Text style={styles.brokerConnectedText}>
                      {broker} Broker Connected
                    </Text>
                    <Text style={styles.brokerSubText}>{userEmail}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.changeButton}
                  onPress={handleOpen}
                  activeOpacity={0.8}>
                  <Pencil size={14} color="#fff" />
                </TouchableOpacity>
              </View>
            </LinearGradient>
          ) : (
            <View style={styles.errorContainer}>
              <View style={styles.errorMessage}>
                <Image source={cross} style={styles.crossIcon} />
                <View>
                  <Text style={styles.brokerDisconnectedText}>
                    Broker Disconnected
                  </Text>
                  <Text style={styles.brokerSubDisText}>{userEmail}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.changeButtonDis, {borderColor: themeColor}]}
                onPress={handleOpen}
                activeOpacity={0.8}>
                <Text style={[styles.changeButtonTextDis, {color: themeColor}]}>Connect Broker</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Broker & Funds Info Card */}
        <LinearGradient
          colors={['rgba(0, 86, 183, 1)', 'rgba(0, 38, 81, 1)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.infoCard}>
          <Text style={styles.infoCardTitle}>Your Broker & Funds Info</Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Broker:</Text>
            <Text style={styles.infoValue}>
              {userDetails?.user_broker || 'N/A'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Available Cash:</Text>
            <Text style={styles.infoValue}>
              {!broker || broker === null
                ? 'N/A'
                : `₹ ${parseFloat(funds?.data?.availablecash || 0).toFixed(2)}`}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Phone:</Text>
            <Text style={styles.infoValue}>
              {userDetails?.phone_number || 'N/A'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email:</Text>
            <Text style={styles.infoValue}>{userDetails?.email || 'N/A'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>PAN:</Text>
            <Text style={styles.infoValue}>
              {userDetails?.panNumber || 'N/A'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Account Created:</Text>
            <Text style={styles.infoValue}>
              {userDetails?.created_at
                ? new Date(userDetails.created_at).toLocaleDateString('en-IN', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })
                : 'N/A'}
            </Text>
          </View>
        </LinearGradient>
      </ScrollView>

      {!(
        !brokerStatus ||
        brokerStatus === null ||
        brokerStatus === 'Disconnected'
      ) && (
          <TouchableOpacity
            style={[styles.button, styles.disconnectButton]}
            onPress={() => setShowDisconnectBroker(true)}
            activeOpacity={0.8}>
            <Text style={styles.disconnectText}>Disconnect</Text>
          </TouchableOpacity>
        )}

      {/* Bottom doodle & info section */}
      <View style={styles.bottomDoodleContainer}>
        {/* Example doodle shape, you can replace with an SVG or Image */}
        <View style={styles.doodleShape}>
          <ThinkingSvg width="100%" height="100%" />
        </View>
        <View style={styles.doodleContent}>
          <Text style={styles.doodleTitle}>Did You Know?</Text>
          <Text style={styles.doodleText}>
            Connecting your broker helps you manage investments seamlessly and
            stay updated with your portfolio.
          </Text>
        </View>
      </View>

      <DisconnectBrokerModal
        showDisconnectBroker={showDisconnectBroker}
        setShowDisconnectBroker={setShowDisconnectBroker}
        handleContinueWithoutBrokerSave={handleContinueWithoutBrokerSave}
        withoutBrokerLoader={withoutBrokerLoader}
      />

      {/* Broker Selection Modal */}
      {modalVisible && (
        <BrokerSelectionModal
          showBrokerModal={modalVisible}
          OpenTokenExpireModel={false}
          setOpenTokenExpireModel={() => { }}
          setShowBrokerModal={setModalVisible}
          handleAcceptRebalanceWithoutBroker={handleContinueWithoutBrokerSave}
          withoutBrokerLoader={withoutBrokerLoader}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F0F0',
  },
  button: {
    width: screenWidth - 100,
    paddingVertical: 10,
    borderRadius: 8,
    alignContent: 'center',
    alignSelf: 'center',
    alignItems: 'center',
  },
  headerGradient: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 18,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    elevation: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#fff',
    marginRight: 14,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-Medium',
    color: '#fff',
    marginBottom: 0,
  },
  disconnectButton: {
    backgroundColor: '#dc2626',
  },
  disconnectText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#d9e4f5',
  },
  statusContainer: {
    marginHorizontal: 20,
    marginTop: 24,
  },
  loadingBar: {
    width: screenWidth - 60,
    height: 20,
    borderRadius: 8,
  },
  brokerStatusCard: {
    borderRadius: 6,
    paddingVertical: 18,
    paddingHorizontal: 20,
    elevation: 6,
    shadowColor: '#1A3BFF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  brokerStatusContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brokerStatusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIcon: {
    width: 28,
    height: 28,
    marginRight: 14,
  },
  brokerConnectedText: {
    fontSize: 12,
    color: '#fff',
    fontFamily: 'Poppins-Medium',
  },
  brokerDisconnectedText: {
    fontSize: 12,
    color: '#090909ff',
    fontFamily: 'Poppins-Medium',
  },
  brokerSubText: {
    fontSize: 12,
    color: '#CFE4FF',
    marginTop: 2,
    fontFamily: 'Satoshi-Regular',
  },
  brokerSubDisText: {
    fontSize: 12,
    color: '#575859ff',
    marginTop: 2,
    fontFamily: 'Satoshi-Regular',
  },
  changeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fff',
  },
  changeButtonText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
  },
  changeButtonDis: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#0056B7',
  },
  changeButtonTextDis: {
    color: '#0056B7',
    fontSize: 10,
    fontFamily: 'Poppins-Regular',
  },
  errorContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#FCE9EB',
    elevation: 3,
    shadowColor: '#d45',
    shadowOpacity: 0.22,
    shadowRadius: 4,
  },
  errorMessage: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  crossIcon: {
    width: 32,
    height: 32,
    marginRight: 12,
  },
  errorTitle: {
    fontSize: 15,
    fontFamily: 'Poppins-SemiBold',
    color: '#A92327',
  },
  errorSubtitle: {
    fontSize: 12,
    color: '#7e7e7e',
    marginTop: 2,
    fontFamily: 'Satoshi-Regular',
  },
  connectButton: {
    backgroundColor: '#000',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 18,
    justifyContent: 'center',
  },
  connectButtonText: {
    color: '#fff',
    fontSize: 13,
    fontFamily: 'Poppins-SemiBold',
    textAlign: 'center',
  },
  infoCard: {
    marginHorizontal: 20,
    marginTop: 30,
    borderRadius: 6,
    paddingVertical: 22,
    paddingHorizontal: 25,
    elevation: 8,
    shadowColor: '#2a4bd7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  infoCardTitle: {
    fontSize: 18,
    fontFamily: 'Satoshi-Bold',
    color: 'white',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  infoLabel: {
    fontSize: 14,
    fontFamily: 'Satoshi-Medium',
    color: '#D1D9FF',
  },
  infoValue: {
    fontSize: 14,
    fontFamily: 'Satoshi-Regular',
    color: 'white',
    maxWidth: '55%',
    textAlign: 'right',
  },

  /* Bottom doodle & info styles */
  bottomDoodleContainer: {
    backgroundColor: '#E6F0FA',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingVertical: 18,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    elevation: 10,
    shadowColor: '#aed0f7',
    shadowRadius: 20,
    shadowOpacity: 0.6,
    shadowOffset: { width: 0, height: -5 },
  },
  doodleShape: {
    width: 80,
    height: 80,
    backgroundColor: '#6494ed65',
    borderRadius: 40,
    marginRight: 18,
  },
  doodleContent: {
    flex: 1,
  },
  doodleTitle: {
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
    color: '#214EAC',
    marginBottom: 6,
  },
  doodleText: {
    fontSize: 13,
    fontFamily: 'Poppins-Regular',
    color: '#4F5E7D',
    marginBottom: 8,
  },
  doodleInfo: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: '#2F3E6B',
  },
});

export default SubscriptionScreen;
