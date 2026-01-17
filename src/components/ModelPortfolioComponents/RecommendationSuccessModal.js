import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  Dimensions,
  Image,
  SafeAreaView,
  Alert,
  Platform,
} from 'react-native';
import {
  XIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CheckIcon,
  ChevronLeft,
  CrossIcon,
  Info,
  InfoIcon,
  AlertCircle,
} from 'lucide-react-native';
import { Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import moment from 'moment';
const { height: screenHeight } = Dimensions.get('window');
const { width: screenWidth } = Dimensions.get('window');
import { useModal } from '../ModalContext';
// LinearGradient from 'react-native-linear-gradient' removed for iOS Fabric compatibility
// Using solid background color with View instead
import { useConfig } from '../../context/ConfigContext';

const CheckedIcon = require('../../assets/checked.png');
const FailureIcon = require('../../assets/cross.png');
const PartialIcon = require('../../assets/partial_success.png');

const RecommendationSuccessModal = ({
  openSuccessModal,
  setOpenSucessModal,
  orderPlacementResponse,
}) => {
  // Get dynamic colors from config
  const config = useConfig();
  const gradient1 = config?.gradient1 || 'rgba(0, 86, 183, 1)';
  const gradient2 = config?.gradient2 || 'rgba(0, 38, 81, 1)';
  const getProgressBarWidth = (executed, total) => {
    return (executed / total) * 100 + '%';
  };

  console.log("Order Response ----------", orderPlacementResponse);
  const { hideAddToCartModal, successclosemodel, setsuccessclosemodel } =
    useModal();

  const navigation = useNavigation();
  const [orderResponse, setOrderResponse] = useState(orderPlacementResponse);

  useEffect(() => {
    setOrderResponse(orderPlacementResponse);
  }, []);

  const [showStocksDetails, setShowStocksDetails] = useState(false);

  const getFormattedDate = () => {
    const date = new Date();
    return moment(date).format('Do MMM YYYY');
  };

  const toggleStocksDetails = () => {
    setShowStocksDetails(!showStocksDetails);
  };

  console.log('Order Response : ---', orderPlacementResponse);

  const successCount = orderResponse?.filter(
    item =>
      item?.orderStatus === 'complete' ||
      item?.orderStatus === 'COMPLETE' ||
      item?.orderStatus === 'Placed' ||
      item?.orderStatus === 'Executed' ||
      item?.orderStatus === 'Ordered' ||
      item?.orderStatus === 'open' ||
      item?.orderStatus === 'OPEN' ||
      item?.orderStatus === 'Transit' ||
      item?.orderStatus === 'Traded' ||
      item?.orderStatus === 'PENDING' ||
      item?.orderStatus === 'TRADED',
  ).length;

  const failureCount = orderResponse?.filter(
    item =>
      item?.orderStatus === 'rejected' ||
      item?.orderStatus === 'FAILURE' ||
      item?.orderStatus === 'Rejected' ||
      item?.orderStatus === 'REJECTED' ||
      item?.orderStatus === 'cancelled',
  ).length;

  const totalCount = orderResponse?.length;
  const successPercentage = (successCount / totalCount) * 100;
  const failurePercentage = (failureCount / totalCount) * 100;
  const partialFailurePercentage = 100 - successPercentage;

  const [visibleTooltipIndex, setVisibleTooltipIndex] = useState(null);

  console.log('Log----', failureCount, successCount);

  const renderOrderItem = ({ item, index }) => {
    const isSuccessStatus =
      item?.orderStatus === 'Placed' ||
      item?.orderStatus === 'complete' ||
      item?.orderStatus === 'COMPLETE' ||
      item?.orderStatus === 'Executed' ||
      item?.orderStatus === 'open' ||
      item?.orderStatus === 'OPEN' ||
      item?.orderStatus === 'Transit' ||
      item?.orderStatus === 'Traded' ||
      item?.orderStatus === 'TRADED' ||
      item?.orderStatus === 'PENDING' ||
      item?.orderStatus === 'Ordered';

    const cardStyle = isSuccessStatus
      ? styles.successCard
      : styles.rejectedCard;

    const failureReason =
      item?.message_aq || item?.message || item?.orderStatusMessage || '';

    return (
      <View style={[styles.orderGreenCard, cardStyle]}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}>
          <View style={{ flexDirection: 'row', alignContent: 'center', alignItems: 'center' }}>
            <Text style={styles.orderTitle}>{item.symbol}</Text>
            {!isSuccessStatus && failureReason ? (
              <TouchableOpacity
                onPress={() => {
                  setVisibleTooltipIndex(index);
                  setTimeout(() => setVisibleTooltipIndex(null), 3000);
                }}

                style={{
                  marginLeft: 8,
                  borderRadius: 12,
                  backgroundColor: '#e0e0e0',
                }}>
                <Info size={16} />
              </TouchableOpacity>
            ) : null}
          </View>

          <TouchableOpacity
            style={[
              styles.orderType,
              {
                backgroundColor:
                  item.transactionType.toLowerCase() === 'buy'
                    ? '#29A400'
                    : '#FF2F2F',
              },
            ]}>
            <Text style={styles.buyButtonText}>{item?.transactionType}</Text>
          </TouchableOpacity>
        </View>

        <View
          style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
          <Text style={styles.metaTextMuted}>Qty.</Text>
          <Text style={styles.metaTextStrong}> {item.quantity} </Text>
        </View>

        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 2,
            paddingBottom: 2,
          }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
            <Text style={styles.metaTextMuted}>Ord. Type:</Text>
            <Text style={styles.metaTextStrong}>
              {item.orderType}
              {' |'}
            </Text>
            <Text style={styles.metaTextStrong}>{item?.exchange}</Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.dateText}>{getFormattedDate()}</Text>

            {/* Info button for failed orders */}

          </View>
        </View>

        {/* Tooltip */}
        {visibleTooltipIndex === index && failureReason ? (
          <View
            style={{
              position: 'absolute',
              right: 10,
              bottom: -10,
              backgroundColor: 'rgba(0,0,0,0.85)',
              padding: 10,
              borderRadius: 8,
              maxWidth: 250,
              zIndex: 100,
            }}>
            <Text style={{ color: 'white', fontSize: 12, textAlign: 'left' }}>
              {failureReason}
            </Text>
          </View>
        ) : null}
      </View>
    );
  };


  return (
    <Modal visible={openSuccessModal} animationType="slide" transparent={false}>
      {/* ✅ FIXED: Proper SafeAreaView structure for iOS */}
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalContent}>
          {/* Header Section - View replaces LinearGradient for iOS Fabric compatibility */}
          <View
            style={[styles.headerGradient, { backgroundColor: gradient1, overflow: 'hidden' }]}>
            <View style={styles.headerRow}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => {
                  setOpenSucessModal(false);
                  setsuccessclosemodel(true);
                  hideAddToCartModal();
                }}>
                <ChevronLeft size={24} color="#000" />
              </TouchableOpacity>
              <View style={styles.headerTextContainer}>
                <Text style={styles.headerTitle}>Trade Details</Text>
              </View>
            </View>
            <View style={styles.subHeaderContainer}>
              <Text style={styles.subHeaderText}>All Trade Details</Text>
            </View>
          </View>

          {/* Content Section - Scrollable */}
          <View style={styles.contentContainer}>
            {/* Success/Failure Status */}
            {successCount === totalCount && successCount !== 0 && (
              <View style={styles.statusContainer}>
                <View style={[styles.statusIcon, { backgroundColor: '#29A400' }]}>
                  <CheckIcon size={40} color={'white'} />
                </View>
                <View style={styles.statusTextContainer}>
                  <Text style={styles.statusTitle}>
                    All Orders Placed Successfully
                  </Text>
                  <Text style={styles.statusDescription}>
                    Please review the{' '}
                    <Text
                      onPress={() => {
                        navigation.navigate('Orders');
                        setOpenSucessModal(false);
                      }}
                      style={styles.linkText}>
                      Order details
                    </Text>{' '}
                    below.
                  </Text>
                </View>
              </View>
            )}

            {failureCount === totalCount && (
              <View style={styles.statusContainer}>
                <View style={[styles.statusIcon, { backgroundColor: '#EF4639' }]}>
                  <XIcon size={40} color={'white'} />
                </View>

                <View style={styles.statusTextContainer}>
                  <Text style={styles.statusTitle}>Order Failed</Text>

                  {/* Show broker-specific failure message */}
                  <Text style={{
                    marginTop: 4, fontFamily: 'Poppins-Medium',
                    color: 'black',
                    fontSize: 10,
                    paddingRight: 10,
                  }}>
                    {
                      orderResponse?.[0]?.message_aq ||
                      orderResponse?.[0]?.message ||
                      'Your order could not be placed. Please contact your advisor.'
                    }
                  </Text>

                  {/* Keep link to Orders */}
                  <Text style={styles.statusDescription}>
                    Please review the{' '}
                    <Text
                      onPress={() => {
                        navigation.navigate('Orders');
                        setOpenSucessModal(false);
                      }}
                      style={styles.linkText}>
                      Order details
                    </Text>{' '}
                    below.
                  </Text>
                </View>
              </View>
            )}


            {successCount > 0 && successCount !== totalCount && (
              <View style={styles.statusContainer}>
                <View style={[styles.statusIcon, { backgroundColor: '#FFCD28' }]}>
                  <AlertCircle size={40} color={'black'} />
                </View>
                <View style={styles.statusTextContainer}>
                  <Text style={styles.statusTitle}>
                    Some orders are not placed
                  </Text>
                  <Text style={styles.statusDescription}>
                    Please review the{' '}
                    <Text
                      onPress={() => {
                        navigation.navigate('Orders');
                        setOpenSucessModal(false);
                      }}
                      style={styles.linkText}>
                      Order details
                    </Text>{' '}
                    below and contact your advisor for next steps.
                  </Text>
                </View>
              </View>
            )}

            {/* Info Row */}
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Text style={styles.infoTitle}>Placed On</Text>
                <Text style={styles.infoValue}>{getFormattedDate()}</Text>
              </View>
              <View style={styles.infoItem1}>
                <Text style={styles.infoTitle}>Status</Text>
                <Text style={styles.infoValue}>
                  {successCount === totalCount
                    ? 'Placed'
                    : successCount > 0
                      ? 'Partially Placed'
                      : 'Failed'}
                </Text>

              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoTitle}>
                  {successCount} of {totalCount} Executed
                </Text>
                <View style={styles.progressBarContainer}>
                  {successCount === totalCount && (
                    <View
                      style={[
                        styles.successBar,
                        { width: `${successPercentage}%` },
                      ]}
                    />
                  )}

                  {failureCount === totalCount && (
                    <View
                      style={[
                        styles.failureBar,
                        { width: `${failurePercentage}%` },
                      ]}
                    />
                  )}

                  {successCount >= 1 && successCount !== totalCount && (
                    <>
                      <View
                        style={[
                          styles.successBar,
                          { width: `${successPercentage}%` },
                        ]}
                      />
                      <View
                        style={[
                          styles.failureBar,
                          { width: `${partialFailurePercentage}%` },
                        ]}
                      />
                    </>
                  )}
                </View>
              </View>
            </View>

            {/* Orders List */}
            <FlatList
              data={orderResponse}
              renderItem={renderOrderItem}
              keyExtractor={(item, index) => index.toString()}
              style={styles.ordersList}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>

        {/* ✅ FIXED: Bottom safe area for iOS home indicator */}
        {Platform.OS === 'ios' && <View style={styles.bottomSafeArea} />}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  // ✅ FIXED: Updated modal container styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalContent: {
    flex: 1,
    backgroundColor: '#fff',
  },

  // ✅ FIXED: Header styles
  headerGradient: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    // Remove paddingTop as SafeAreaView handles it
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Platform.OS === 'ios' ? 0 : 10, // Adjusted for iOS
  },
  headerTextContainer: {
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-Medium',
    color: '#fff',
  },
  subHeaderContainer: {
    marginLeft: 45,
    marginTop: 2,
  },
  subHeaderText: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#f0f0f0',
  },

  // ✅ FIXED: Content container
  contentContainer: {
    flex: 1,
  },

  // ✅ FIXED: Status container styles
  statusContainer: {
    paddingHorizontal: 10,
    paddingVertical: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  statusIcon: {
    padding: 10,
    borderRadius: 40,
  },
  statusTextContainer: {
    flexDirection: 'column',
    marginLeft: 10,
    flex: 1, // Prevent text overflow
  },
  statusTitle: {
    fontFamily: 'Satoshi-Bold',
    color: 'black',
    fontSize: 18,
  },
  statusDescription: {
    fontFamily: 'Poppins-Regular',
    color: 'black',
    fontSize: 10,
    paddingRight: 10, // Reduced padding
  },

  // ✅ FIXED: Orders list style
  ordersList: {
    flex: 1,
  },

  // ✅ FIXED: Bottom safe area for home indicator
  bottomSafeArea: {
    height: Platform.OS === 'ios' ? 34 : 0, // Height of home indicator
    backgroundColor: '#fff',
  },

  // Rest of your existing styles remain the same
  successCard: {
    backgroundColor: '#B6FF92',
  },
  rejectedCard: {
    backgroundColor: 'rgba(255, 0, 0, 0.10)',
  },
  backButton: {
    padding: 4,
    borderRadius: 5,
    backgroundColor: '#fff',
    marginRight: 10,
  },
  linkText: {
    fontSize: 10,
    color: 'blue',
    marginTop: 6,
    fontFamily: 'Poppins-Regular',
    textDecorationLine: 'underline',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 0.5,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  infoItem: {
    flex: 1,
    alignItems: 'flex-start',
    paddingLeft: 10,
  },
  infoItem1: {
    flex: 1,
    alignItems: 'flex-start',
    paddingLeft: 10,
    borderRightWidth: 0.5,
    borderLeftWidth: 0.5,
  },
  infoTitle: {
    fontSize: 11,
    fontFamily: 'Poppins-Regular',
    color: '#888',
  },
  infoValue: {
    color: '#464646',
    fontSize: 12,
    fontFamily: 'Satoshi-Bold',
  },
  progressBarContainer: {
    flexDirection: 'row',
    height: 5,
    marginVertical: 10,
    marginRight: 15,
    alignSelf: 'flex-start',
    justifyContent: 'flex-start',
    alignContent: 'flex-start',
    alignItems: 'flex-start',
    backgroundColor: '#D9D9D9',
    borderRadius: 8,
  },
  successBar: {
    backgroundColor: '#338D72',
    height: 5,
    borderTopLeftRadius: 3,
    borderBottomLeftRadius: 3,
  },
  failureBar: {
    backgroundColor: '#EF344A',
    height: 5,
    alignSelf: 'flex-start',
    justifyContent: 'flex-start',
    alignContent: 'flex-start',
    alignItems: 'flex-start',
    borderTopRightRadius: 3,
    borderBottomRightRadius: 3,
  },
  orderGreenCard: {
    backgroundColor: '#B6FF92',
    paddingTop: 10,
    paddingHorizontal: 10,
    borderRadius: 0,
    width: '100%',
    borderColor: '#c8c8c8',
    borderBottomWidth: 0.5,
  },
  orderTitle: {
    fontSize: 12,
    color: '#161917',
    fontWeight: '500',
    letterSpacing: 0.5,
    fontFamily: 'Poppins-Medium',
  },
  orderType: {
    color: '#fff',
    fontFamily: 'Satoshi-Bold',
    fontSize: 10,
    borderRadius: 3,
    paddingVertical: 2,
    paddingHorizontal: 10,
  },
  buyButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '400',
    fontFamily: 'Poppins-Regular',
  },
  metaTextMuted: {
    color: '#888B8C',
    fontSize: 12,
    fontWeight: '400',
    fontFamily: 'Poppins-Regular',
    marginRight: 2,
  },
  metaTextStrong: {
    color: '#15171A',
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'Poppins-Medium',
    marginRight: 6,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  dateText: {
    color: '#4A4A4A',
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
  },
});

export default RecommendationSuccessModal;
