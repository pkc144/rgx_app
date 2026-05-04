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
  ScrollView,
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
  AlertTriangle,
} from 'lucide-react-native';
import { Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import moment from 'moment';
import { isOrderSuccess, isOrderRejected, isOrderPending } from '../../utils/orderStatusUtils';
const { height: screenHeight } = Dimensions.get('window');
const { width: screenWidth } = Dimensions.get('window');
import { useModal } from '../ModalContext';
import LinearGradient from 'react-native-linear-gradient';
import { useConfig } from '../../context/ConfigContext';
import { resolveResultVariant } from '../../utils/tradeVariant';
import { DEFAULT_TOKENS } from '../../theme/colors';

const CheckedIcon = require('../../assets/checked.png');
const FailureIcon = require('../../assets/cross.png');
const PartialIcon = require('../../assets/partial_success.png');

const RecommendationSuccessModal = ({
  openSuccessModal,
  setOpenSucessModal,
  orderPlacementResponse,
  currentBroker,
  // Outgoing trade list captured at submit time by the parent. Used as a
  // fallback source for the per-row trade `variant` lookup when the
  // response item itself doesn't carry it (rebalance/MP lane via
  // ccxt-india's `rebalance/process-trade`, which doesn't echo variant).
  // Optional — when absent, missing variants default to `"REGULAR"` (no
  // pill rendered). See utils/tradeVariant.js § resolveResultVariant.
  originalStockDetails,
}) => {
  // Get dynamic colors from config
  const config = useConfig();
  const gradient1 = config?.gradient1 || 'rgba(0, 86, 183, 1)';
  const gradient2 = config?.gradient2 || 'rgba(0, 38, 81, 1)';
  const stepCompletedColor = config?.paymentModal?.stepCompletedColor || '#29A400';
  // Status warning tokens — used by the AMO pill on result cards. Sourced
  // from `theme/colors.js § DEFAULT_TOKENS.status`. Tenant overrides via
  // `colorTokens.status.warning(Bg)` are honoured when present (config
  // resolution mirrors `buildColors()`), otherwise we fall back to the
  // default tokens. No new tokens introduced for this feature.
  const warningColor =
    config?.colorTokens?.status?.warning || DEFAULT_TOKENS.status.warning;
  const warningBg =
    config?.colorTokens?.status?.warningBg || DEFAULT_TOKENS.status.warningBg;
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
    item => isOrderSuccess(item?.orderStatus) || isOrderPending(item?.orderStatus),
  ).length;

  const failureCount = orderResponse?.filter(
    item => isOrderRejected(item?.orderStatus),
  ).length;

  const totalCount = orderResponse?.length;
  const successPercentage = (successCount / totalCount) * 100;
  const failurePercentage = (failureCount / totalCount) * 100;
  const partialFailurePercentage = 100 - successPercentage;

  // Detect cautionary listing failures.
  //
  // Cautionary listing is a NARROWER concept than the backend's
  // `classification: 'RESTRICTED_SCRIP'` umbrella, which also covers NSE GSM /
  // ASM / T2T / illiquidity / Motilal 100073. The banner copy below
  // ("Cautionary Listing Restriction") is specific to cautionary, so we keep
  // message-text matching here instead of using `classification` — using the
  // umbrella tag would mis-fire for other restricted-scrip categories that
  // need different user guidance.
  const cautionaryListingStocks = orderResponse?.filter((item) => {
    const message = (
      item?.orderStatusMessage ||
      item?.message_aq ||
      item?.message ||
      ''
    ).toLowerCase();
    return message.includes('cautionary') && message.includes('listing');
  }) || [];

  const hasCautionaryListingFailures = cautionaryListingStocks.length > 0;

  // Detect insufficient-funds rejections.
  //
  // Prefer the backend `classification` envelope (ccxt-india message_map.py
  // ships `classification: 'LOW_FUNDS'` for Angel One AB4036 / Axis
  // ERR_NO_3_IN_1 with shortFallFlag=BUY_FUND / broker-specific shortfall
  // variants — see 2026-04-23 row in tidi_new BROKER_TRADING_ARCHITECTURE.md).
  // The tag is authoritative when present; fall back to message-text matching
  // for older backend deploys or broker paths that bypass the classifier.
  //
  // Phrasings observed in prod for the fallback path:
  //   Angel One    — "Your order has been rejected due to Insufficient Funds.
  //                   Available funds - Rs. <x> . You require Rs. <y> ..."
  //   Zerodha      — "Insufficient margin"
  //   Upstox/Fyers — "Insufficient balance"
  const lowFundsStocks = orderResponse?.filter((item) => {
    if (!isOrderRejected(item?.orderStatus)) return false;
    if (item?.classification === 'LOW_FUNDS') return true;
    const msg = (
      item?.orderStatusMessage || item?.message_aq || item?.message || ''
    ).toLowerCase();
    return (
      msg.includes('insufficient fund') ||
      msg.includes('low fund') ||
      msg.includes('insufficient margin') ||
      msg.includes('insufficient balance')
    );
  }) || [];

  const hasLowFundsFailures = lowFundsStocks.length > 0;

  // Parse Angel One's "Available funds - Rs. {x} . You require Rs. {y}"
  // pattern. Returns null/null when the broker did not surface numeric values
  // (Zerodha/Upstox typically don't — the banner gracefully omits the summary).
  const parseLowFundsAmounts = (message) => {
    if (!message) return [null, null];
    const availMatch = message.match(
      /available\s+funds?\s*[-:]?\s*Rs\.?\s*(-?[\d,]+\.?\d*)/i,
    );
    const reqMatch = message.match(/(?:require|need)s?\s*Rs\.?\s*(-?[\d,]+\.?\d*)/i);
    const avail = availMatch ? parseFloat(availMatch[1].replace(/,/g, '')) : null;
    const req = reqMatch ? parseFloat(reqMatch[1].replace(/,/g, '')) : null;
    return [
      Number.isFinite(avail) ? avail : null,
      Number.isFinite(req) ? req : null,
    ];
  };

  // Compute aggregate Available + summed Required across all low-funds rows.
  // Available is the same wallet figure on every row in a single batch, so we
  // pick the first non-null we see.
  let lowFundsAvailable = null;
  let lowFundsRequiredTotal = 0;
  let lowFundsSawAnyRequired = false;
  for (const item of lowFundsStocks) {
    const msg =
      item?.orderStatusMessage || item?.message_aq || item?.message || '';
    const [avail, req] = parseLowFundsAmounts(msg);
    if (lowFundsAvailable === null && avail !== null) lowFundsAvailable = avail;
    if (req !== null) {
      lowFundsRequiredTotal += req;
      lowFundsSawAnyRequired = true;
    }
  }

  // Indian-grouping currency formatter (12,34,567.89). Negative renders with a
  // leading minus on the rupee symbol so the banner highlights debit balances.
  const formatINR = (v) => {
    if (v === null || v === undefined || !Number.isFinite(v)) return '';
    const sign = v < 0 ? '-' : '';
    const abs = Math.abs(v);
    const intPart = Math.trunc(abs);
    const frac = abs - intPart;
    const intStr = String(intPart);
    let body;
    if (intStr.length <= 3) {
      body = intStr;
    } else {
      const last3 = intStr.slice(-3);
      let rest = intStr.slice(0, -3);
      const parts = [];
      while (rest.length > 2) {
        parts.unshift(rest.slice(-2));
        rest = rest.slice(0, -2);
      }
      if (rest.length > 0) parts.unshift(rest);
      body = parts.join(',') + ',' + last3;
    }
    const fracStr =
      frac > 0
        ? '.' + String(Math.round(frac * 100)).padStart(2, '0')
        : '';
    return `${sign}₹${body}${fracStr}`;
  };

  console.log('Log----', failureCount, successCount);

  const renderOrderItem = ({ item, index }) => {
    const isSuccessStatus =
      isOrderSuccess(item?.orderStatus) || isOrderPending(item?.orderStatus);

    const cardStyle = isSuccessStatus
      ? styles.successCard
      : styles.rejectedCard;

    const failureReason =
      item?.message_aq || item?.message || item?.orderStatusMessage || '';

    // Trade variant for THIS row — three-tier lookup (response → outgoing
    // payload match → 'REGULAR' default). See utils/tradeVariant.js
    // § resolveResultVariant + docs/APP_ARCHITECTURE.md § 4.5.2.
    const variant = resolveResultVariant(item, originalStockDetails);
    const isAmo = variant === 'AMO';

    return (
      <View style={[styles.orderGreenCard, cardStyle]}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}>
          <View style={{ flexDirection: 'row', alignContent: 'center', alignItems: 'center', flex: 1 }}>
            <Text style={styles.orderTitle}>{item.symbol}</Text>
            {!isSuccessStatus && (
              <View style={{
                marginLeft: 8,
                backgroundColor: '#FEE2E2',
                paddingHorizontal: 6,
                paddingVertical: 2,
                borderRadius: 4,
              }}>
                <Text style={{ color: '#DC2626', fontSize: 10, fontFamily: 'Poppins-Medium' }}>
                  {(item?.orderStatus || 'Rejected').toUpperCase()}
                </Text>
              </View>
            )}
            {/* AMO pill — rendered on every result card whose `variant`
                resolves to "AMO". After-Market Orders are accepted by the
                broker outside 09:15–15:30 IST and queued for execution at
                next market open. The amber color set comes from the
                existing `theme.colors.status.warning(Bg)` tokens — no new
                tokens introduced for this feature. */}
            {isAmo && (
              <View
                style={{
                  marginLeft: 8,
                  backgroundColor: warningBg,
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  borderRadius: 4,
                }}
                accessibilityLabel="After-Market Order">
                <Text
                  style={{
                    color: warningColor,
                    fontSize: 10,
                    fontFamily: 'Poppins-Medium',
                  }}>
                  AMO
                </Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={[
              styles.orderType,
              {
                backgroundColor:
                  item.transactionType.toLowerCase() === 'buy'
                    ? stepCompletedColor
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
          </View>
        </View>

        {/* Rejection reason displayed inline */}
        {!isSuccessStatus && failureReason ? (
          <View style={{
            marginTop: 6,
            marginBottom: 4,
            padding: 8,
            backgroundColor: '#FEF2F2',
            borderWidth: 1,
            borderColor: '#FECACA',
            borderRadius: 6,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              <AlertCircle size={14} color="#DC2626" style={{ marginTop: 1, marginRight: 6 }} />
              <Text style={{
                flex: 1,
                color: '#991B1B',
                fontSize: 11,
                fontFamily: 'Poppins-Regular',
                lineHeight: 16,
              }}>
                {failureReason}
              </Text>
            </View>
          </View>
        ) : null}
      </View>
    );
  };

  // Get broker display name for cautionary alert
  const brokerDisplayName = currentBroker || 'your broker';

  return (
    <Modal visible={openSuccessModal} animationType="slide" transparent={false}>
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalContent}>
          {/* Header Section */}
          <LinearGradient
            colors={[gradient1, gradient2]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.headerGradient}>
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
          </LinearGradient>

          {/* Content Section - Scrollable */}
          <View style={styles.contentContainer}>
            {/* Success/Failure Status */}
            {successCount === totalCount && successCount !== 0 && (
              <View style={styles.statusContainer}>
                <View style={[styles.statusIcon, { backgroundColor: stepCompletedColor }]}>
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

            {totalCount === 0 && (
              <View style={styles.statusContainer}>
                <View style={[styles.statusIcon, { backgroundColor: '#EF4639' }]}>
                  <XIcon size={40} color={'white'} />
                </View>
                <View style={styles.statusTextContainer}>
                  <Text style={styles.statusTitle}>No Orders Placed</Text>
                  <Text style={{
                    marginTop: 4, fontFamily: 'Poppins-Medium',
                    color: 'black',
                    fontSize: 10,
                    paddingRight: 10,
                  }}>
                    No trades were sent to the broker. This may be because the rebalance calculation returned no trades. Please go back and try again.
                  </Text>
                </View>
              </View>
            )}

            {failureCount === totalCount && totalCount > 0 && (
              <View style={styles.statusContainer}>
                <View style={[styles.statusIcon, { backgroundColor: '#EF4639' }]}>
                  <XIcon size={40} color={'white'} />
                </View>

                <View style={styles.statusTextContainer}>
                  <Text style={styles.statusTitle}>Order Failed</Text>

                  {/* Show the right reason summary based on which banners are
                      showing below. The cautionary + low-funds banners carry
                      the full per-reason explanation, so the header subtitle
                      just needs to point users at them. */}
                  <Text style={{
                    marginTop: 4, fontFamily: 'Poppins-Medium',
                    color: 'black',
                    fontSize: 10,
                    paddingRight: 10,
                  }}>
                    {hasLowFundsFailures && hasCautionaryListingFailures
                      ? `All ${totalCount} orders were rejected. See the alerts below for the reasons.`
                      : hasLowFundsFailures
                        ? 'Your broker rejected every order due to insufficient funds.'
                        : hasCautionaryListingFailures
                          ? 'Every order was blocked by the exchange. See the alert below.'
                          : (orderResponse?.[0]?.message_aq ||
                              orderResponse?.[0]?.message ||
                              'Your order could not be placed. Please contact your advisor.')}
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

            {/* Cautionary Listing Alert */}
            {hasCautionaryListingFailures && (
              <View style={cautionaryStyles.alertContainer}>
                {/* Header with icon */}
                <View style={cautionaryStyles.headerRow}>
                  <View style={cautionaryStyles.iconCircle}>
                    <AlertTriangle size={20} color="#D97706" />
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={cautionaryStyles.alertTitle}>
                      Cautionary Listing Restriction
                    </Text>
                  </View>
                </View>

                {/* Explanation */}
                <Text style={cautionaryStyles.alertDescription}>
                  {brokerDisplayName} does not allow stocks under{' '}
                  <Text style={{ fontFamily: 'Poppins-SemiBold' }}>
                    Exchange Cautionary Listing
                  </Text>{' '}
                  to be placed through the broker API connection. The following
                  stocks need to be traded directly:
                </Text>

                {/* Affected stocks badges */}
                <View style={cautionaryStyles.stockBadgeContainer}>
                  {cautionaryListingStocks.map((stock, idx) => (
                    <View key={idx} style={cautionaryStyles.stockBadge}>
                      <Text style={cautionaryStyles.stockBadgeText}>
                        {stock?.symbol || stock?.searchSymbol || 'Unknown'}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Instructions box */}
                <View style={cautionaryStyles.instructionsBox}>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                    <Info size={14} color="#2563EB" style={{ marginTop: 2, marginRight: 8 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={cautionaryStyles.instructionsTitle}>
                        What you need to do:
                      </Text>
                      <Text style={cautionaryStyles.instructionStep}>
                        1. Open your {brokerDisplayName} app or web platform directly
                      </Text>
                      <Text style={cautionaryStyles.instructionStep}>
                        2. Place the order for the above stock(s) manually
                      </Text>
                      <Text style={cautionaryStyles.instructionStep}>
                        3. This is a default restriction by {brokerDisplayName} for cautionary listed stocks
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Show success count if some orders went through */}
                {successCount > 0 && (
                  <Text style={cautionaryStyles.partialSuccessNote}>
                    {successCount} of {totalCount} order(s) were placed successfully. Only the above stock(s) require manual placement.
                  </Text>
                )}
              </View>
            )}

            {/* Insufficient Funds Alert — coexists with cautionary banner when
                a batch hits both reasons (Angel One 2026-04-29: 7 cautionary +
                19 LOW_FUNDS). Mirrors the cautionary block visually but in red
                and with parsed Available/Required amounts when the broker
                ships them in the rejection message. */}
            {hasLowFundsFailures && (
              <View style={lowFundsStyles.alertContainer}>
                <View style={lowFundsStyles.headerRow}>
                  <View style={lowFundsStyles.iconCircle}>
                    <AlertCircle size={20} color="#B91C1C" />
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={lowFundsStyles.alertTitle}>
                      Insufficient Funds
                    </Text>
                  </View>
                </View>

                <Text style={lowFundsStyles.alertDescription}>
                  {brokerDisplayName} rejected the orders below because available
                  funds are below the required amount. Add funds to your broker
                  account, then try again.
                </Text>

                {(lowFundsAvailable !== null || lowFundsSawAnyRequired) && (
                  <View style={lowFundsStyles.amountsBox}>
                    {lowFundsAvailable !== null && (
                      <View style={{ flex: 1 }}>
                        <Text style={lowFundsStyles.amountLabel}>Available</Text>
                        <Text
                          style={[
                            lowFundsStyles.amountValue,
                            lowFundsAvailable < 0 && { color: '#B91C1C' },
                          ]}>
                          {formatINR(lowFundsAvailable)}
                        </Text>
                      </View>
                    )}
                    {lowFundsSawAnyRequired && (
                      <View style={{ flex: 1 }}>
                        <Text style={lowFundsStyles.amountLabel}>
                          Required (sum)
                        </Text>
                        <Text style={lowFundsStyles.amountValue}>
                          {formatINR(lowFundsRequiredTotal)}
                        </Text>
                      </View>
                    )}
                  </View>
                )}

                <View style={lowFundsStyles.stockBadgeContainer}>
                  {lowFundsStocks.map((stock, idx) => (
                    <View key={idx} style={lowFundsStyles.stockBadge}>
                      <Text style={lowFundsStyles.stockBadgeText}>
                        {stock?.symbol || stock?.searchSymbol || 'Unknown'}
                      </Text>
                    </View>
                  ))}
                </View>

                <View style={lowFundsStyles.instructionsBox}>
                  <View
                    style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                    <Info
                      size={14}
                      color="#2563EB"
                      style={{ marginTop: 2, marginRight: 8 }}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={lowFundsStyles.instructionsTitle}>
                        What you need to do:
                      </Text>
                      <Text style={lowFundsStyles.instructionStep}>
                        1. Open your {brokerDisplayName} app and add funds to
                        cover the required amount
                      </Text>
                      <Text style={lowFundsStyles.instructionStep}>
                        2. Once funds are credited, return here and place the
                        orders again
                      </Text>
                      <Text style={lowFundsStyles.instructionStep}>
                        3. A negative available balance usually means existing
                        margin debit — clear it before retrying
                      </Text>
                    </View>
                  </View>
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

                  {failureCount === totalCount && totalCount > 0 && (
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

        {/* Bottom safe area for iOS home indicator */}
        {Platform.OS === 'ios' && <View style={styles.bottomSafeArea} />}
      </SafeAreaView>
    </Modal>
  );
};

// Cautionary listing alert styles
const cautionaryStyles = StyleSheet.create({
  alertContainer: {
    marginHorizontal: 12,
    marginTop: 12,
    marginBottom: 4,
    padding: 14,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FCD34D',
    borderRadius: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertTitle: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    color: '#92400E',
  },
  alertDescription: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#B45309',
    lineHeight: 18,
    marginBottom: 10,
  },
  stockBadgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  stockBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
  },
  stockBadgeText: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
    color: '#92400E',
  },
  instructionsBox: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 8,
    padding: 10,
  },
  instructionsTitle: {
    fontSize: 12,
    fontFamily: 'Poppins-SemiBold',
    color: '#1E40AF',
    marginBottom: 4,
  },
  instructionStep: {
    fontSize: 11,
    fontFamily: 'Poppins-Regular',
    color: '#1D4ED8',
    lineHeight: 18,
    marginLeft: 2,
  },
  partialSuccessNote: {
    fontSize: 11,
    fontFamily: 'Poppins-Medium',
    color: '#166534',
    marginTop: 10,
    backgroundColor: '#F0FDF4',
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
});

// Insufficient-funds alert styles — red callout matching the cautionary
// block's structure so the two banners read as a related family when both
// render in the same batch.
const lowFundsStyles = StyleSheet.create({
  alertContainer: {
    marginHorizontal: 12,
    marginTop: 12,
    marginBottom: 4,
    padding: 14,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertTitle: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    color: '#991B1B',
  },
  alertDescription: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: '#991B1B',
    lineHeight: 18,
  },
  amountsBox: {
    flexDirection: 'row',
    marginTop: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
  },
  amountLabel: {
    fontSize: 10,
    fontFamily: 'Poppins-Regular',
    color: '#7F1D1D',
  },
  amountValue: {
    fontSize: 13,
    fontFamily: 'Poppins-SemiBold',
    color: '#111827',
    marginTop: 2,
  },
  stockBadgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  stockBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    backgroundColor: '#FEE2E2',
    borderRadius: 16,
    marginRight: 6,
    marginBottom: 6,
  },
  stockBadgeText: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
    color: '#991B1B',
  },
  instructionsBox: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 8,
  },
  instructionsTitle: {
    fontSize: 12,
    fontFamily: 'Poppins-SemiBold',
    color: '#1E40AF',
    marginBottom: 4,
  },
  instructionStep: {
    fontSize: 11,
    fontFamily: 'Poppins-Regular',
    color: '#1D4ED8',
    lineHeight: 18,
  },
});

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalContent: {
    flex: 1,
    backgroundColor: '#fff',
  },

  headerGradient: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Platform.OS === 'ios' ? 0 : 10,
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

  contentContainer: {
    flex: 1,
  },

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
    flex: 1,
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
    paddingRight: 10,
  },

  ordersList: {
    flex: 1,
  },

  bottomSafeArea: {
    height: Platform.OS === 'ios' ? 34 : 0,
    backgroundColor: '#fff',
  },

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
