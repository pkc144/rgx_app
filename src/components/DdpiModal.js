import React, {useState, useEffect} from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Linking,
  TextInput,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import DDPI from '../assets/DDPI.png';
import LinearGradient from 'react-native-linear-gradient';
import Toast from 'react-native-toast-message';
import WebView from 'react-native-webview';
import Config from 'react-native-config';
import YoutubePlayer from 'react-native-youtube-iframe';
import server from '../utils/serverConfig';

import {generateToken} from '../utils/SecurityTokenManager';
import {
  AlertTriangle,
  BadgeAlertIcon,
  XIcon,
  Check,
  ChevronLeft,
  X,
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useTrade} from '../screens/TradeContext';
const {height: screenHeight, width: screenWidth} = Dimensions.get('window');
const checkValidApiAnSecret = data => {
  const bytesKey = CryptoJS.AES.decrypt(data, 'ApiKeySecret');
  const Key = bytesKey.toString(CryptoJS.enc.Utf8);
  if (Key) {
    return Key;
  }
};

export default function DdpiModal({
  isOpen = false,
  setIsOpen = () => {},
  userDetails,
}) {
  if (userDetails?.user_broker === 'Upstox') {
    setIsOpen(false);
    return null;
  }
  console.log('opened');
  const [authUrl, setAuthUrl] = useState(null); // Holds the URL for authentication
  const [loading, setLoading] = useState(false); // Loading state for API call

  const proceedWithTpin = async () => {
    try {
      setLoading(true); // Show loading indicator

      const response = await fetch(
        `https://ccxtprod.alphaquark.in/zerodha/auth-sell`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            accessToken: userDetails?.jwtToken,
          }),
        },
      );

      setLoading(false); // Hide loading indicator

      if (!response.ok) {
        throw new Error('Response was not ok');
      }

      const data = await response.json();
      //  console.log("API Response:", data);

      if (data.status === 0) {
        setAuthUrl(data.auth_url); // Set the authentication URL to open in WebView
      } else {
        console.error('Error in response:', data.message);
        // Alert.alert("Error", data.message || "An error occurred.");
      }
    } catch (error) {
      setLoading(false); // Hide loading indicator
      console.error('Error in API call:', error);
      //Alert.alert("Error", "Failed to proceed with authentication.");
    }
  };

  return (
    <>
      <Modal
        visible={isOpen}
        transparent={true}
        style={{
          justifyContent: 'flex-end',
          margin: 0,
        }}
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setIsOpen(false)}>
              <Text style={styles.closeIcon}>X</Text>
            </TouchableOpacity>
            <View style={styles.contentWrapper}>
              <View style={styles.imageWrapper}>
                <Image
                  source={DDPI} // Replace with your image
                  style={styles.image}
                />
              </View>
              <View style={styles.textSection}>
                <View style={styles.alertHeader}>
                  <Text style={styles.alertIcon}>⚠️</Text>
                  <Text style={styles.title}>
                    DDPI Inactive: Proceed with TPIN Mandate
                  </Text>
                </View>
                <View style={styles.list}>
                  <Text style={styles.listItem}>
                    • Use TPIN for a temporary authorization to sell selected
                    stocks while DDPI is inactive
                  </Text>
                  <Text style={styles.listItem}>
                    • This secure, one-time mandate allows smooth transactions
                    until DDPI is active
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.proceedButton}
                  onPress={proceedWithTpin}>
                  <Text style={styles.buttonText}>
                    Proceed with Authorization to Sell
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* WebView Modal */}
      <Modal
        visible={!!authUrl}
        animationType="slide"
        onRequestClose={() => setAuthUrl(null)}>
        <WebView
          source={{uri: authUrl}}
          onLoadStart={() => console.log('WebView loading started')}
          onLoadEnd={() => console.log('WebView loading finished')}
          onNavigationStateChange={event => {
            console.log('url zerodha:', event.url);
            if (event.url.includes('callback_url')) {
              // Handle callback logic if necessary
              setAuthUrl(null); // Close WebView
              //Alert.alert("Success", "Authentication completed.");
            }
          }}
          renderLoading={() => <ActivityIndicator size="large" color="#000" />}
        />
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => setAuthUrl(null)}>
          <Text style={styles.closeIcon}>✕</Text>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    width: '100%',
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,

    alignItems: 'center',
  },

  ////

  actionsContainer: {
    flexDirection: 'row',
    marginTop: 16,
    justifyContent: 'space-between',
    paddingBottom: 8,
  },
  button: {
    height: 41,
    paddingHorizontal: 10,
    borderRadius: 8,
    justifyContent: 'center',
    marginRight: 15,
    alignItems: 'center',
    marginBottom: 8,
  },
  enabledButton: {
    backgroundColor: '#E43D3D',
  },
  disabledButton: {
    backgroundColor: '#E43D3D',
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 14,
    fontFamily: 'Poppins', // Use the font family you need
    color: '#fff',
  },
  howToButton: {
    height: 41,
    borderRadius: 8,
    paddingHorizontal: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E43D3D',
  },
  howToButtonText: {
    fontSize: 14,
    fontFamily: 'Poppins', // Use the font family you need
    color: '#E43D3D',
  },

  ////

  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checked: {
    backgroundColor: '#10B981', // Tailwind color for success
    borderColor: '#10B981', // Green border when checked
  },
  unchecked: {
    backgroundColor: '#fff',
    borderColor: '#D1D5DB', // Light gray border when unchecked
  },
  checkmark: {
    width: 12,
    height: 12,
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  label: {
    fontSize: 14,
    fontFamily: 'Poppins', // Replace with your font if needed
    color: '#4B5563', // Tailwind equivalent of text-gray-600
  },

  closeIcon: {
    fontSize: 24,
    color: '#999',
  },
  contentContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  textSection: {
    flex: 1,
    width: '100%',
    padding: 16,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  listContainer: {
    marginBottom: 16,
    paddingLeft: 8,
  },
  listItem: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  proceedButton: {
    backgroundColor: '#ef4444',
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  imageSection: {
    width: '100%',
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 6,
  },
  dialogContainer: {
    width: '95%',
    maxHeight: '90%',
    backgroundColor: '#FFF',
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
    flexDirection: 'row',
  },
  listText: {
    fontSize: 13,
    lineHeight: 18,
    color: '#333',
  },
  boldText: {
    fontWeight: '600',
  },
  buttonGradient: {
    borderRadius: 8,
    overflow: 'hidden',
    alignSelf: 'center',
  },
  activateButton: {
    height: 46,
    width: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  imageContainer: {
    width: '40%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '90%',
    aspectRatio: 1,
    borderRadius: 10,
  },
  textContainer: {
    flex: 1,
    paddingHorizontal: 10,
    justifyContent: 'center',
  },

  //
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  container: {
    backgroundColor: '#fff',
    borderRadius: 10,
    width: '90%',
    maxHeight: '90%',
    padding: 10,
  },
  closeButton: {},
  closeIcon: {
    fontSize: 20,
    color: 'gray',
  },
  contentWrapper: {},
  textSection: {
    padding: 16,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  alertIcon: {
    fontSize: 24,
    color: 'red',
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    marginLeft: 10,
    marginRight: 20,
    fontWeight: '600',
    color: '#000000B3',
  },
  list: {
    marginVertical: 10,
  },
  listItem: {
    fontSize: 14,
    color: 'gray',
    marginBottom: 6,
  },
  proceedButton: {
    backgroundColor: 'red',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
  },
  imageWrapper: {
    width: screenWidth,
    height: 244,
    marginTop: 10,

    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  noHoldingsModal: {
    backgroundColor: '#fff',
    borderRadius: 10,
    width: '80%',
    padding: 16,
  },
  header: {
    alignContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  warningText: {
    color: 'red',
    fontWeight: 'bold',
    marginTop: 10,
  },
  tpinModal: {
    backgroundColor: '#fff',
    borderRadius: 10,
    width: '80%',
    padding: 20,
    alignItems: 'center',
  },
  tpinTitle: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 20,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginRight: 8,
    color: 'black',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 20,
    paddingHorizontal: 12,
    width: '60%',
    height: 40,
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  verifyButton: {
    backgroundColor: '#5ACAC9',
    padding: 10,
    borderRadius: 20,
    alignItems: 'center',
    width: '40%',
  },
  cancelButton: {
    backgroundColor: 'gray',
    padding: 10,
    borderRadius: 20,
    alignItems: 'center',
    width: '40%',
  },

  modalBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 50,
    padding: 16,
  },

  /* Modal Container */

  /* Close Button */
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 10,
    padding: 0,
    backgroundColor: 'transparent',
    borderWidth: 0,
    color: '#6b7280',
    fontSize: 24,
  },
  BackButton: {
    position: 'absolute',
    top: 12,
    left: 10,
    padding: 0,
    backgroundColor: 'transparent',
    borderWidth: 0,
    color: '#6b7280',
    fontSize: 24,
  },

  /* Content Container */
  modalContent: {
    flexDirection: 'column',
    alignContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    paddingLeft: 16,
    paddingRight: 16,
    paddingBottom: 16,
  },

  playerWrapper: {
    overflow: 'hidden',
    marginTop: 20,
    alignSelf: 'center',
    borderRadius: 20,
    marginBottom: 20,
  },

  /* Header Section */
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    marginBottom: 16,
  },

  /* Icon Style */
  alertIcon: {
    width: 28,
    height: 28,
    marginTop: 4,
    color: '#e43d3d',
  },

  /* Title */
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'black',
    fontFamily: 'Poppins-Bold',
    lineHeight: 26,
    alignContent: 'flex-start',
    alignItems: 'flex-start',
    alignSelf: 'flex-start',
    marginBottom: 8,
  },

  /* List Items */
  modalListItem: {
    fontSize: 13,
    fontWeight: '300',
    fontFamily: 'Poppins',
    color: '#4b5563',
    marginBottom: 8,
  },

  /* Checkbox Section */
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },

  checkboxLabel: {
    fontSize: 14,
    fontFamily: 'Poppins',
    marginLeft: 10,
  },

  /* Button Styles */
  primaryButton: {
    width: '100%',
    height: 41,
    borderRadius: 8,
    fontFamily: 'Poppins',
    fontSize: 14,
    color: 'white',
    textAlign: 'center',
    paddingHorizontal: 16,
    backgroundColor: '#e43d3d',
  },

  primaryButtonDisabled: {
    backgroundColor: 'rgba(228, 61, 61, 0.5)',
    cursor: 'not-allowed',
  },

  secondaryButton: {
    width: '100%',
    height: 41,
    paddingHorizontal: 16,
    fontFamily: 'Poppins',
    fontSize: 14,
    color: '#e43d3d',
    borderColor: '#e43d3d',
    borderWidth: 1,
    borderRadius: 8,
    textAlign: 'center',
  },
});

export function ActivateNowModel({
  isOpen = false,
  setIsOpen = () => {},
  onActivate = () => {},
}) {
  return (
    <Modal
      isVisible={isOpen}
      onBackdropPress={() => setIsOpen(false)}
      backdropOpacity={0.5}
      style={styles.modalContainer}>
      <View style={styles.dialogContainer}>
        {/* Close Button */}
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => setIsOpen(false)}>
          <Text style={styles.closeText}>×</Text>
        </TouchableOpacity>

        {/* Content */}
        <ScrollView contentContainerStyle={styles.contentContainer}>
          {/* Left Section: Image */}
          <View style={styles.imageContainer}>
            <Image
              source={require('../assets/DDPI.png')} // Replace with your DDPI image path
              style={styles.image}
              resizeMode="cover"
            />
          </View>

          {/* Right Section: Text & Button */}
          <View style={styles.textContainer}>
            <Text style={styles.title}>
              Save Time and Effort by {'\n'}Enabling DDPI!
            </Text>

            {/* Bullet Points */}
            <View style={styles.listContainer}>
              <View style={styles.listItem}>
                <Image
                  source={require('../assets/checked.png')} // Replace with checkmark image
                  style={styles.checkIcon}
                />
                <Text style={styles.listText}>
                  <Text style={styles.boldText}>Instant Selling:</Text> Sell
                  your holdings instantly after DDPI activation without needing
                  a T-PIN or OTP.
                </Text>
              </View>

              <View style={styles.listItem}>
                <Image
                  source={require('../assets/checked.png')} // Replace with checkmark image
                  style={styles.checkIcon}
                />
                <Text style={styles.listText}>
                  <Text style={styles.boldText}>Seamless Liquidation:</Text>{' '}
                  Liquidate your holdings without the hassle of daily
                  pre-authorization for each sell order.
                </Text>
              </View>

              <View style={styles.listItem}>
                <Image
                  source={require('../assets/checked.png')} // Replace with checkmark image
                  style={styles.checkIcon}
                />
                <Text style={styles.listText}>
                  <Text style={styles.boldText}>Faster Transactions:</Text>{' '}
                  Enjoy smoother and quicker trading experiences with fewer
                  barriers.
                </Text>
              </View>
            </View>

            {/* Action Button */}
            <LinearGradient
              colors={['#D97706', '#F59E0B', '#D97706']}
              style={styles.buttonGradient}>
              <TouchableOpacity
                style={styles.activateButton}
                onPress={onActivate}>
                <Text style={styles.buttonText}>
                  Activate DDPI Now &gt;&gt;
                </Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

export function ActivateTopModel(userDetails) {
  const [showModal, setShowModal] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);

  const handleCopy = textToCopy => {
    navigator.clipboard.writeText(textToCopy).then(
      () => {
        Toast.show({
          type: 'success',
          text1: 'success',
          text2: 'Copied to clipboard!',
        });
      },
      () => {
        Toast.show({
          type: 'error',
          text1: 'error',
          text2: 'Failed to copy text.',
        });
      },
    );
  };

  const brokerInstructions = {
    Dhan: {
      title: 'Dhan Broker: How to Authorize Stocks for Selling',
      directLink:
        'https://knowledge.dhan.co/support/solutions/articles/82000900258-from-where-ddpi-service-can-be-activated-',
      steps: [
        'If you have not enabled DDPI, please enable it by following these steps:',
        'Log in to your Dhan account.',
        'Navigate to the DDPI activation section.',
        'Follow the on-screen instructions to complete the DDPI activation process.',
      ],
    },

    // "AliceBlue": {
    //   title: 'Aliceblue Broker: How to Authorize Stocks for Selling',
    //   videoId: 'https://youtu.be/ncFGDQAARhM',
    //   steps: [
    //     '1. Log in to your Aliceblue account. ',
    //     '2. Navigate to Portfolio > Holdings, and click the Authorize button located below the Portfolio Value.',
    //     '3. In the CDSL interface, select the stocks to authorize, click Authorize, and proceed to CDSL.',
    //     '4. Enter your TPIN and OTP for verification. If required, generate a TPIN before proceeding. ',
    //     '5. Upon successful authorization, you will be redirected to the Portfolio screen.',
    //     '6. Go back to the our platform and attempt to sell your stocks again',

    //   ],
    // },

    Zerodha: {
      title: 'Zerodha: How to Authorize Stocks for Selling',
      directLink:
        'https://support.zerodha.com/category/account-opening/online-account-opening/other-online-account-opening-related-queries/articles/activate-ddpi',
      steps: [
        'If you have not enabled DDPI, please enable it by following these steps:',
        'Log in to your Zerodha account.',
        'Navigate to the Profile or Settings section.',
        'Find the DDPI activation option and follow the prompts.',
      ],
    },

    'Angel One': {
      title: 'Angel One: How to Authorize Stocks for Selling',
      directLink:
        'https://www.angelone.in/knowledge-center/demat-account/how-to-set-up-ddpi-on-angel-on',
    },
  };
  const handleActivateClick = () => {
    if (instructions.directLink) {
      window.open(instructions.directLink, '_blank', 'noopener,noreferrer');
    } else {
      setShowModal(true);
    }
  };

  const broker = userDetails?.userDetails?.user_broker;
  const instructions = brokerInstructions[broker] || {};
  return (
    <>
      {/* Banner Section */}
      <View style={styles.bannerContainer}>
        <View style={styles.infoIcon} />
        <Text style={styles.bannerText}>
          Enable DDPI for faster trades and seamless transactions.
        </Text>
        <TouchableOpacity style={styles.button} onPress={handleActivateClick}>
          <Text style={styles.buttonText}>Activate DDPI &gt;&gt;</Text>
        </TouchableOpacity>
      </View>

      {/* Modal Section */}
      <Modal transparent={true} animationType="slide" visible={showModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowModal(false)}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>

            <ScrollView contentContainerStyle={styles.modalContent}>
              {instructions.videoId && (
                <YoutubePlayer
                  height={200}
                  play={false}
                  videoId={instructions.videoId}
                />
              )}

              <Text style={styles.modalTitle}>{instructions.title}</Text>

              {/* Steps Section */}
              {instructions.steps.map((step, index) => (
                <View key={index} style={styles.stepContainer}>
                  <Text style={styles.stepNumber}>{index + 1}.</Text>
                  <View style={styles.stepTextContainer}>
                    <Text style={styles.stepText}>{step}</Text>
                    {step.includes('http') && (
                      <Tooltip
                        popover={
                          <Text style={styles.tooltipText}>Copied!</Text>
                        }
                        isVisible={copied}>
                        <TouchableOpacity
                          onPress={() =>
                            handleCopy(step.match(/https?:\/\/[^\s]+/)[0])
                          }>
                          <Text style={styles.copyButton}>📋</Text>
                        </TouchableOpacity>
                      </Tooltip>
                    )}
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

export function AngleOneTpinModal({
  isOpen,
  setIsOpen,
  userDetails,
  edisStatus,
  tradingSymbol,
}) {
  const [loading, setLoading] = useState(false);
  console.log('This ABB:', edisStatus);
  const [isWebViewOpen, setIsWebViewOpen] = useState(false);
  const [formHtml, setformhtml] = useState(`
  <!DOCTYPE html>
  <html>
  <script>window.onload = function() { document.getElementById("submitBtn").click(); }</script>
  <body>
    <form 
      name="frmDIS" 
      method="post"
      action="https://edis.cdslindia.com/eDIS/VerifyDIS/"
      style="display:none;"
    >
      <input type="hidden" name="DPId" value="${
        edisStatus?.data?.DPId || ''
      }" />
      <input type="hidden" name="ReqId" value="${
        edisStatus?.data?.ReqId || ''
      }" />
      <input type="hidden" name="Version" value="1.1" />
      <input type="hidden" name="TransDtls" value="${
        edisStatus?.data?.TransDtls || ''
      }" />
      <input type="hidden" name="returnURL" value="https://test.alphaquark.in/stock-recommendation" />
      <input id="submitBtn" type="submit" />
    </form>
  </body>
  </html>
`);
  const proceedWithTpin = async () => {
    setIsWebViewOpen(true); // Open the WebView modal with the form content
    // setIsOpen(false); // Close the DDPI modal
  };
  const closeModal = async () => {
    setIsWebViewOpen(false); // Open the WebView modal with the form content
    setformhtml('');
    setIsOpen(false); // Close the DDPI modal
  };

  return (
    <>
      <Modal visible={isOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
              <Text style={styles.closeIcon}>X</Text>
            </TouchableOpacity>
            <View style={styles.contentWrapper}>
              <View style={styles.imageWrapper}>
                <Image
                  source={DDPI} // Replace with your image
                  style={styles.image}
                />
              </View>
              <View style={styles.textSection}>
                <View style={styles.alertHeader}>
                  <Text style={styles.alertIcon}>⚠️</Text>
                  <Text style={styles.title}>
                    DDPI Inactive: Proceed with TPIN Mandate
                  </Text>
                </View>
                <View style={styles.list}>
                  <Text style={styles.listItem}>
                    • Use TPIN for a temporary authorization to sell selected
                    stocks while DDPI is inactive
                  </Text>
                  <Text style={styles.listItem}>
                    • This secure, one-time mandate allows smooth transactions
                    until DDPI is active
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.proceedButton}
                  onPress={proceedWithTpin}>
                  <Text style={styles.buttonText}>
                    Proceed with Dhan Authorization to Sell
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* WebView Modal */}
      {isWebViewOpen && (
        <Modal visible={isWebViewOpen} transparent animationType="slide">
          <WebView
            originWhitelist={['*']}
            source={{html: formHtml}}
            startInLoadingState
            renderLoading={() => <Text>Loading...</Text>}
            onNavigationStateChange={navState => {
              if (navState.url.includes('stock-recommendation')) {
                setIsWebViewOpen(false); // Close WebView when the user is redirected
                //  window.location.reload(); // Reload the page (can be customized)
              }
            }}
          />
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setIsWebViewOpen(false)}>
            <Text style={styles.closeIcon}>X</Text>
          </TouchableOpacity>
        </Modal>
      )}
    </>
  );
}

export function DhanTpinModal({
  isOpen,
  setIsOpen,
  userDetails,
  dhanEdisStatus,
  stockTypeAndSymbol,
  singleStockTypeAndSymbol,
}) {
  const [loading, setLoading] = useState(false);
  const [isPopupOpen, setIsPopupOpen] = useState(false); // State for controlling popup visibility
  const [tpin, setTpin] = useState(''); // State for capturing the TPIN entered by the user
  const [matchedData, setMatchedData] = useState(null);
  const [matchedIsin, setMatchedIsin] = useState(null);
  const [showNoHoldingModal, setShowNoHoldingModal] = useState(false);

  useEffect(() => {
    const shouldOpenPopup = AsyncStorage.getItem('openDhanPopup');
    if (shouldOpenPopup === 'true') {
      setIsPopupOpen(true);
      AsyncStorage.removeItem('openDhanPopup');
    }
  }, []);
  const stockTypeAndSymbolfinal = [...stockTypeAndSymbol].reverse();
  console.log('stockTypeAndSymbol', stockTypeAndSymbolfinal);
  console.log('stockTypeAndSymbolsingle', singleStockTypeAndSymbol);

  console.log('dhanEdisStatus', dhanEdisStatus);

  useEffect(() => {
    if (dhanEdisStatus && dhanEdisStatus.data) {
      let stockToMatch = null;

      if (
        Array.isArray(stockTypeAndSymbolfinal) &&
        stockTypeAndSymbolfinal.length > 0
      ) {
        console.log(
          'Handling array of stocks-------------))))))))))>>>>>>>',
          stockTypeAndSymbolfinal,
        );
        stockToMatch = stockTypeAndSymbolfinal.find(
          stock => stock.Type === 'SELL',
        );
      } else if (
        singleStockTypeAndSymbol &&
        singleStockTypeAndSymbol.type === 'SELL'
      ) {
        console.log('Handling single stock');
        stockToMatch = {
          Symbol: singleStockTypeAndSymbol.symbol,
          Exchange: singleStockTypeAndSymbol.exchange || 'NSE', // Assuming NSE if not provided
        };
      }

      console.log(
        'Stock to match:---------------------------<>>><><>',
        stockToMatch,
      );

      if (stockToMatch) {
        const matchedOrder = dhanEdisStatus.data.find(
          order =>
            order.symbol === stockToMatch.Symbol &&
            (order.exchange === stockToMatch.Exchange ||
              !stockToMatch.Exchange),
        );

        console.log('Matched order:', matchedOrder);

        if (matchedOrder) {
          setMatchedData({
            isin: matchedOrder.isin,
            symbol: matchedOrder.symbol,
            exchange: matchedOrder.exchange,
          });
          setMatchedIsin(matchedOrder.isin);
        } else {
          console.log('No matching order found');
          setShowNoHoldingModal(true);
        }
      } else {
        console.log('No SELL order found');
        setShowNoHoldingModal(true);
      }
    } else {
      console.log('dhanEdisStatus or its data is not available');
    }
  }, [stockTypeAndSymbol, singleStockTypeAndSymbol, dhanEdisStatus]);

  const [isWebViewOpen, setIsWebViewOpen] = useState(false);
  const [webViewUrl, setWebViewUrl] = useState('');

  const proceedWithDhanTpin = async () => {
    setLoading(true);

    try {
      const broker = userDetails?.user_broker;
      if (broker === 'Dhan') {
        // Generate TPIN API call
        const generateTpinResponse = await fetch(
          'https://ccxtprod.alphaquark.in/dhan/generate-tpin',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              clientId: userDetails?.clientCode,
              accessToken: userDetails?.jwtToken,
            }),
          },
        );
        const generateTpinData = await generateTpinResponse.json();

        if (generateTpinData.status === 0) {
          Toast.show({
            type: 'success',
            text1: 'Success',
            text2: 'TPIN generated successfully for Dhan.',
          });

          // Enter TPIN API call
          const enterTpinResponse = await fetch(
            'https://ccxtprod.alphaquark.in/dhan/enter-tpin',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                clientId: userDetails?.clientCode,
                accessToken: userDetails?.jwtToken,
                isin: matchedData.isin,
                symbol: matchedData.symbol,
                exchange: matchedData.exchange,
              }),
            },
          );
          const enterTpinData = await enterTpinResponse.json();

          if (enterTpinData.status === 0) {
            Toast.show({
              type: 'success',
              text1: 'Success',
              text2: enterTpinData.message || 'Operation successful.',
            });

            if (enterTpinData?.data?.edisFormHtml) {
              // Pass the HTML form to WebView
              const edisFormHtml = enterTpinData.data.edisFormHtml;
              setWebViewUrl(edisFormHtml);
              setIsWebViewOpen(true);
            } else {
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'EDIS form data not received.',
              });
            }
          } else {
            throw new Error(enterTpinData.message || 'Failed to enter TPIN');
          }
        } else {
          throw new Error(
            generateTpinData.message || 'Failed to generate TPIN for Dhan',
          );
        }
      }
    } catch (error) {
      console.error('Error in API call:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'An error occurred during the process',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleWebViewNavigation = navState => {
    const {url} = navState;
    console.log('Url we get:', url);
    if (url.includes('ReturnUrl')) {
      // Check if the success condition is met
      Toast.show({
        type: 'success',
        text1: 'success',
        text2: 'EDIS Activated Successfully.',
      });
      setIsWebViewOpen(false);
      setIsOpen(false);
    } else if (url.includes('failure')) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'EDIS form data not received.',
      });
      setIsWebViewOpen(false);
    }
  };

  const handleCancel = () => {
    setTpin('');
    setIsPopupOpen(false);
    setIsOpen(false);
  };

  const closeModal = () => {
    setIsOpen(false);
  };

  return (
    <>
      <Modal visible={isOpen} transparent animationType="fade">
        {showNoHoldingModal ? (
          // No Holdings Modal
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>No Holdings</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setIsOpen(false)}>
                <XIcon size={20} color={'grey'} />
              </TouchableOpacity>
              <Text style={styles.warningText}>
                Unable to place orders. Each order must have sufficient holdings
                to proceed.
              </Text>
            </View>
          </View>
        ) : !isPopupOpen ? (
          // DDPI Inactive Modal
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <TouchableOpacity style={styles.closeButton} onPress={closeModal}>
                <XIcon size={20} color={'grey'} />
              </TouchableOpacity>
              <View style={styles.imageWrapper}>
                <Image
                  source={DDPI} // Replace with your image
                  style={styles.image}
                />
              </View>
              <View style={styles.contentWrapper}>
                <View style={styles.textSection}>
                  <View style={styles.alertHeader}>
                    <Text style={styles.alertIcon}>⚠️</Text>
                    <Text style={styles.title}>
                      DDPI Inactive: Proceed with TPIN Mandate
                    </Text>
                  </View>
                  <View style={styles.list}>
                    <Text style={styles.listItem}>
                      • Use TPIN for a temporary authorization to sell selected
                      stocks while DDPI is inactive
                    </Text>
                    <Text style={styles.listItem}>
                      • This secure, one-time mandate allows smooth transactions
                      until DDPI is active
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.proceedButton}
                    onPress={proceedWithDhanTpin}>
                    <Text style={styles.buttonText}>
                      Proceed with Dhan Authorization to Sell
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        ) : null}
      </Modal>

      {/* WebView Modal */}
      {isWebViewOpen && (
        <Modal visible={isWebViewOpen} animationType="slide">
          <WebView
            originWhitelist={['*']}
            source={{html: webViewUrl}}
            onNavigationStateChange={handleWebViewNavigation}
            startInLoadingState
            renderLoading={() => (
              <ActivityIndicator size="large" color="#0000ff" />
            )}
          />
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setIsWebViewOpen(false)}>
            <XIcon size={20} color={'grey'} />
          </TouchableOpacity>
        </Modal>
      )}
    </>
  );
}

export function OtherBrokerModel({
  userDetails,
  onContinue,
  setShowOtherBrokerModel,
  openReviewModal,
  setOpenReviewTrade,
  userEmail,
  apiKey,
  jwtToken,
  secretKey,
  clientCode,
  visible,
  sid,
  viewToken,
  showActivateNowModel,
  serverId,
  setCaluculatedPortfolioData,
  setModelPortfolioModelId,
  modelPortfolioModelId,
  modelName,
  setActivateNowModel,
  setOpenRebalanceModal,
  funds,
  setStoreModalName,
  storeModalName,
}) {
  const {configData} = useTrade();
  const [isOpen, setIsOpen] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isSellAllowed, setIsSellAllowed] = useState(false);

  const [showMainModal, setShowMainModal] = useState(true);
  const [showHowToAuthorize, setShowHowToAuthorize] = useState(false);

  const brokerInstructions = {
    'IIFL Securities': {
      title: 'IIFL Securities Broker : Steps to Authorize Stocks for Selling  ',
      videoId: 'hpP5M5H52HY',
      steps: [
        '1.Log in to your IIFL Securities account.',
        '2.Tap on the Holdings tab at the bottom of the screen.',
        '3.Select the stocks to sell, click Transfer, and then click **Authorize Now.',
        '4.Complete TPIN verification and OTP authentication.',
        '5.After successful authorization, return to the platform to retry selling orders.',
      ],
    },
    'ICICI Direct': {
      title: 'To enable DDPI on your ICICI Direct account:',
      // steps: [
      //   "To enable DDPI on your ICICI Direct account:",
      //   "There is no online process for activation. You need to fill out the DDPI form provided and send it to your broker's office via courier. Once received, the broker or DP will review and process the request within two to three business days.",
      //   "Download DDPI Form - <a href='https://www.icicidirect.com/mailimages/BM_DDPI_Version_9.pdf?_gl=1*1nq02ef*_gcl_au*MTUyMjU1Nzk2OS4xNzI2MjMxNzQw' target='_blank' rel='noopener noreferrer' class='text-blue-600 hover:underline'>DDPI Form</a>",
      //   "Customer Care Details:",
      //   "- Email: helpdesk@icicidirect.com",
      //   "- Phone: 022-3355-1122",
      //   "Complete this process to enable DDPI on your account."
      // ],
    },
    Upstox: {
      title: 'Upstox Broker: How to Authorize Stocks for Selling ',
      videoId: 'eD6aQ07Ommw',
      steps: [
        '1.Log in to your Upstox account.  ',
        '2.Go to the Holdings tab and click Authorize next to the Day P&L value.',
        '3.Select Authorize with T-PIN.',
        '4.Click Continue to CDSL.',
        '5.Enter your T-PIN (or generate a new one if needed) and verify it, then enter the OTP for authentication.',
        '6.Once verified, return to the Alphaquark platform and place your sell order.',
      ],
    },
    'Kotak Securities': {
      title: 'Kotak Securities: Steps to authorize Stocks for Selling',
      steps: [
        'Login to your kotak securities account',
        'Click on User profile icon > Select Services > Service Request > Click on Proceed of Demat Debit and Pledge Instruction Execution.',
      ],
    },
    'HDFC Securities': {
      title: 'HDFC Broker: Steps to authorize Stocks for Selling',
      videoId: 'CkZI_2psXLY',
      steps: [
        '1.Login to your HDFC Broker account. ',
        '2.Navigate to Portfolio > Demat Balance > Equity.',
        '3.Click Raise eDIS Request, select stock(s), and submit for authorization.',
        '4.Accept the Terms and Conditions, click **Authorize Now, and use **Forgotten TPIN if needed.',
        '5.Complete authorization on CDSL by entering your TPIN and OTP. ',
        '6.After successful authorization, click OK and retry the sell order on Alphaquark.',
      ],
    },
    AliceBlue: {
      title: 'Aliceblue Broker: How to Authorize Stocks for Selling',
      videoId: 'gP06qK8LfYo',
      steps: [
        '1.Log in to your Aliceblue account.  ',
        '2.Navigate to Portfolio > Holdings, and click the Authorize button located below the Portfolio Value.  ',
        '3.In the CDSL interface, select the stocks to authorize, click Authorize, and proceed to CDSL.  ',
        '4.Enter your TPIN and OTP for verification. If required, generate a TPIN before proceeding.',
        '5.Upon successful authorization, you will be redirected to the Portfolio screen.',
        '6.Go back to the our platform and attempt to sell your stocks again.',
      ],
    },
    Dhan: {
      title: 'Dhan One: How to Authorize Stocks for Selling',
      videoId: 'https://www.youtube.com/embed/angelone_ddpi_video_id',
      steps: [],
    },
  };

  const broker = userDetails?.user_broker;
  const instructions = brokerInstructions[broker] || {};

  const [showOtherBroker, setShowOtherBroker] = useState(false);
  const [loadingRebalance, setLoadingRebalance] = useState(false);
  const handleContinue = () => {
    setIsOpen(false);
    setShowOtherBrokerModel(false);
    openReviewModal();
    onContinue();
  };

  const handleClose = () => {
    console.log('here we');
    setIsOpen(false); // Close the modal
    setShowOtherBrokerModel(false); // Close the other broker model
    setShowMainModal(false); // Close the main modal
    setShowHowToAuthorize(false); // Hide authorization instructions
    setIsAuthorized(false); // Reset authorization flag
    setIsSellAllowed(false);
  };

  if (!isOpen) return null;

  const openHowToAuthorize = () => {
    setShowMainModal(false);
    setShowHowToAuthorize(true);
  };

  const closeHowToAuthorize = () => {
    setShowHowToAuthorize(false);
    setShowMainModal(true);
  };

  const handleRetrySellOrder = () => {
    console.log('Retrying sell order...');
    // Add your retry sell order logic here
    closeHowToAuthorize();
  };

  const angelOneApiKey = configData?.config?.REACT_APP_ANGEL_ONE_API_KEY;
  const advisorName = configData?.config?.REACT_APP_ADVISOR_TAG;
  const handleAcceptRebalance = () => {
    onContinue();
    setLoadingRebalance(true);

    let payload = {
      userEmail: userEmail,
      userBroker: broker,
      modelName: storeModalName,
      advisor: advisorName,
      model_id: modelPortfolioModelId,
      userFund: funds?.data?.availablecash,
    };
    if (broker === 'IIFL Securities') {
      payload = {
        ...payload,
        clientCode: clientCode,
      };
    } else if (broker === 'ICICI Direct') {
      payload = {
        ...payload,
        apiKey: checkValidApiAnSecret(apiKey),
        secretKey: checkValidApiAnSecret(secretKey),
        sessionToken: jwtToken,
      };
    } else if (broker === 'Upstox') {
      payload = {
        ...payload,
        apiKey: checkValidApiAnSecret(apiKey),
        apiSecret: checkValidApiAnSecret(secretKey),
        accessToken: jwtToken,
      };
    } else if (broker === 'Angel One') {
      payload = {
        ...payload,
        apiKey: angelOneApiKey,
        jwtToken: jwtToken,
      };
    } else if (broker === 'Zerodha') {
      payload = {
        ...payload,
        apiKey: zerodhaApiKey,
        accessToken: jwtToken,
      };
    } else if (broker === 'Dhan') {
      payload = {
        ...payload,
        clientId: clientCode,
        accessToken: jwtToken,
      };
    } else if (broker === 'Hdfc Securities') {
      payload = {
        ...payload,
        apiKey: checkValidApiAnSecret(apiKey),
        accessToken: jwtToken,
      };
    } else if (broker === 'Kotak') {
      payload = {
        ...payload,
        consumerKey: checkValidApiAnSecret(apiKey),
        consumerSecret: checkValidApiAnSecret(secretKey),
        accessToken: jwtToken,
        viewToken: viewToken,
        sid: sid,
        serverId: serverId,
      };
    }
    let config = {
      method: 'post',
      url: `${server.ccxtServer.baseUrl}rebalance/calculate`,

      headers: {
        'Content-Type': 'application/json',
        'X-Advisor-Subdomain': configData?.config?.REACT_APP_HEADER_NAME,
        'aq-encrypted-key': generateToken(
          Config.REACT_APP_AQ_KEYS,
          Config.REACT_APP_AQ_SECRET,
        ),
      },

      data: JSON.stringify(payload),
    };

    axios
      .request(config)
      .then(response => {
        console.log('res', response);
        setLoadingRebalance(false);
        setCaluculatedPortfolioData(response.data);
        setOpenRebalanceModal(true);
        setModelPortfolioModelId(modelPortfolioModelId);
        // setStoreModalName(modelName);
        setShowOtherBrokerModel(false);
      })
      .catch(error => {
        console.log(error);
        setLoadingRebalance(false);
      });
  };

  const toggleCheckbox = () => {
    console.log('toog');
    setIsSellAllowed(!isSellAllowed);
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <XIcon name="close" size={24} color="gray" />
          </TouchableOpacity>
          {showActivateNowModel && (
            <TouchableOpacity
              style={styles.BackButton}
              onPress={() => setActivateNowModel(false)}>
              <ChevronLeft name="chevron-left" size={24} color="gray" />
            </TouchableOpacity>
          )}

          <ScrollView contentContainerStyle={styles.modalContent}>
            {showHowToAuthorize ? (
              <>
                {/* YouTube iframe */}
                <View style={styles.playerWrapper}>
                  <YoutubePlayer
                    height={screenHeight * 0.23}
                    width={screenWidth * 0.85}
                    play={false}
                    videoId={brokerInstructions[broker].videoId}
                  />
                </View>

                {/* Broker instructions */}
                {brokerInstructions[broker]?.title && (
                  <Text style={styles.title}>
                    {brokerInstructions[broker].title}
                  </Text>
                )}

                {brokerInstructions[broker]?.steps?.length > 0 && (
                  <View style={styles.stepsContainer}>
                    {brokerInstructions[broker].steps.map((step, index) => (
                      <Text key={index} style={styles.listItem}>
                        {step}
                      </Text>
                    ))}
                  </View>
                )}
              </>
            ) : (
              <View style={styles.header}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignContent: 'center',
                    alignItems: 'center',
                    alignSelf: 'center',
                    justifyContent: 'flex-end',
                  }}>
                  <AlertTriangle size={24} color={'black'} />
                  <Text style={styles.title}>
                    Action Required: Stock Authorization to Sell
                  </Text>
                </View>

                <View style={styles.header}>
                  <Text style={styles.listText}>
                    Your broker doesn’t have EDIS flow. Please authorize your
                    stocks manually on your broker before trying to sell orders
                    from here again.
                  </Text>
                </View>
              </View>
            )}

            <View style={styles.checkboxContainer}>
              <TouchableOpacity
                onPress={toggleCheckbox}
                style={[
                  styles.checkbox,
                  isSellAllowed ? styles.checked : styles.unchecked,
                ]}>
                {isSellAllowed && <Check size={20} color={'#fff'} />}
              </TouchableOpacity>
              <Text style={styles.label}>
                I've authorized the sell of the above stocks
              </Text>
            </View>

            <View style={styles.actionsContainer}>
              {modelPortfolioModelId ? (
                <TouchableOpacity
                  style={[
                    styles.button,
                    isSellAllowed
                      ? styles.enabledButton
                      : styles.disabledButton,
                  ]}
                  disabled={!isSellAllowed}
                  onPress={handleAcceptRebalance}>
                  {loadingRebalance ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Retry sell order</Text>
                  )}
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[
                    styles.button,
                    isSellAllowed
                      ? styles.enabledButton
                      : styles.disabledButton,
                  ]}
                  disabled={!isSellAllowed}
                  onPress={handleContinue}>
                  <Text style={styles.buttonText}>Retry sell order</Text>
                </TouchableOpacity>
              )}

              {!showHowToAuthorize && (
                <TouchableOpacity
                  style={styles.howToButton}
                  onPress={openHowToAuthorize}>
                  <Text style={styles.howToButtonText}>
                    How to Authorize {'>'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export function AfterPlaceOrderDdpiModal({onClose, userDetails}) {
  const [showActivateNowModel, setShowActivateNowModel] = useState(false);

  const handleCopy = textToCopy => {
    navigator.clipboard.writeText(textToCopy).then(
      () => {
        Toast.show({
          type: 'success',
          text1: 'success',
          text2: 'Copied to clipboard!',
        });
      },
      () => {
        Toast.show({
          type: 'error',
          text1: 'error',
          text2: 'Failed to copy text.',
        });
      },
    );
  };

  const brokerInstructions = {
    'IIFL Securities': {
      title: 'IIFL Broker: Enable DDPI Instructions',
      videoId: 'N0KXx4vuThw',
      steps: [
        '1. Log in to your IIFL Securities account.',
        '2. Tap on the Holdings tab at the bottom of the screen.',
        '3. Select the stocks to sell, click Transfer, and then click **Authorize Now.',
        '4. Complete TPIN verification and OTP authentication.',
        '5. After successful authorization, return to the platform to retry selling orders.',
      ],
    },
    'ICICI Direct': {
      title: 'To enable DDPI on your ICICI Direct account:',

      steps: [
        "1. There is no online process for activation. You need to fill out the DDPI form provided and send it to your broker's office via courier.",
        '2. Once received, the broker or DP will review and process the request within two to three business days.',
        '3. Download DDPI Form - www.icicidirect.com/mailimages/BM_DDPI_Version_9.pdf?_gl=1*1nq02ef*_gcl_au*MTUyMjU1Nzk2OS4xNzI2MjMxNzQw)',
        '4. Customer Care Details:',
        'Email: helpdesk@icicidirect.com',
        'Phone: 022-3355-1122',
        '5. Complete this process to enable DDPI on your account.',
      ],
    },

    Upstox: {
      title: 'Upstox: Enable DDPI Instructions',
      directLink:
        'https://help.upstox.com/support/solutions/articles/260205-how-do-i-activate-ddpi-poa-on-upstox-',
      steps: [
        '1. If you have not enabled DDPI, please enable it by following these steps:',
        '2. Log in to your Upstox account.',
        '3. Go to the Settings or Profile section.',
        '4. Look for the DDPI activation option and follow the prompts to complete the process.',
      ],
    },

    'Kotak Securities': {
      title: 'Steps to Enable DDPI on Kotak Securities Account:',
      steps: [
        'For Website:',
        '1. Log in to your Kotak Securities account.',
        '2. Click on the User Profile icon.',
        '3. Go to Services > Service Request > Proceed under Demat Debit and Pledge Instruction Execution',
        '',
        'For Mobile App (Neo App):',
        '1. Log in to the Neo App.',
        '2. Click on the Profile Option (displayed as the initials of your name).',
        '3. Navigate to Services > Service Request > Demat Debit and Pledge Instruction Execution',
        '',
        'Customer Care Details:',
        '- Email: service.securities@kotak.com',
        '- Phone: 1800-209-9191',
        '- WhatsApp: +91 77389 88888',
        '',
        'Follow these steps to enable DDPI on your Kotak account for smooth and faster transactions.',
      ],
    },

    'HDFC Securities': {
      title: 'To enable DDPI on your HDFC Securities account:',
      steps: [
        '1. New Accounts: You will receive an email after account creation. Follow the instructions to activate DDPI.',
        "2. Existing Accounts: Contact HDFC Securities customer care as there's no online process. They will email you the steps for activation.",
        '4. Customer Care Details:',
        'Email: support@hdfcsec.com',
        'Phone: 022-6246-5555',
        '5. Follow this process to enable DDPI for faster transactions.',
      ],
    },

    AliceBlue: {
      title: 'AliceBlue: Enable DDPI Instructions',
      directLink:
        'https://aliceblueonline.com/support/account-opening/ddpi-activation-guide/',
      steps: [
        '1. If you have not enabled DDPI, please enable it by following these steps:',
        '2. Sign in to your AliceBlue trading account.',
        '3. Find the DDPI activation option in the Account or Settings menu.',
        '4. Follow the provided instructions to activate DDPI for your account.',
      ],
    },
    Dhan: {
      title: 'Dhan Broker: Enable DDPI Instructions',
      directLink:
        'https://knowledge.dhan.co/support/solutions/articles/82000900258-from-where-ddpi-service-can-be-activated-',
      steps: [
        '1. If you have not enabled DDPI, please enable it by following these steps:',
        '2. Log in to your IIFL account.',
        '3. Navigate to the DDPI activation section.',
        '4. Follow the on-screen instructions to complete the DDPI activation process.',
      ],
    },

    Zerodha: {
      title: 'Zerodha: Enable DDPI Instructions',
      directLink:
        'https://support.zerodha.com/category/account-opening/online-account-opening/other-online-account-opening-related-queries/articles/activate-ddpi',

      steps: [
        '1. If you have not enabled DDPI, please enable it by following these steps:',
        '2. Log in to your Zerodha account.',
        '3. Navigate to the Profile or Settings section.',
        '4. Find the DDPI activation option and follow the prompts.',
      ],
    },

    'Angel One': {
      title: 'AngelOne: Enable DDPI Instructions',
      directLink:
        'https://www.angelone.in/knowledge-center/demat-account/how-to-set-up-ddpi-on-angel-one',
      steps: [
        '1. If you have not enabled DDPI, please enable it by following these steps:',
        '2. Log in to your AngelOne account.',
        '3. Access the Profile section.',
        '4. Find the DDPI option and complete the activation steps.',
      ],
    },
  };

  const broker = userDetails?.user_broker;
  const instructions = brokerInstructions[broker] || {};

  const handleActivateDDPiNow = () => {
    // Close the current modal if it's open, and show the new modal
    if (instructions.directLink) {
      window.open(instructions.directLink, '_blank', 'noopener,noreferrer');
      onClose();
    } else {
      setShowActivateNowModel(true);
    }
  };

  const closeModal = () => {
    setShowActivateNowModel(false);
    onClose();
  };

  const handleBackButton = () => {
    setShowActivateNowModel(false);
  };

  return (
    <Modal visible={isModalVisible} transparent={true} animationType="fade">
      <View style={styles.overlay}>
        {!showActivateNowModel ? (
          <View style={styles.modalContainer}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <X size={18} color="black" />
            </TouchableOpacity>
            <View style={styles.modalContent}>
              <View style={styles.imageContainer}>
                <Image
                  source={require('../assets/DDPI.png')}
                  style={styles.image}
                />
              </View>
              <View style={styles.textContainer}>
                <Text style={styles.title}>
                  Save Time and Effort by Enabling DDPI!
                </Text>
                <ScrollView style={styles.listContainer}>
                  <View style={styles.listItem}>
                    <Text style={styles.listText}>
                      <Text style={styles.bold}>Instant Selling:</Text> Sell
                      your holdings instantly after DDPI activation.
                    </Text>
                  </View>
                  <View style={styles.listItem}>
                    <Text style={styles.listText}>
                      <Text style={styles.bold}>Seamless Liquidation:</Text>{' '}
                      Liquidate your holdings without the hassle.
                    </Text>
                  </View>
                  <View style={styles.listItem}>
                    <Text style={styles.listText}>
                      <Text style={styles.bold}>Faster Transactions:</Text>{' '}
                      Enjoy smoother and quicker trading experiences.
                    </Text>
                  </View>
                </ScrollView>
                <TouchableOpacity
                  style={styles.activateButton}
                  onPress={handleActivateDDPiNow}>
                  <Text style={styles.activateButtonText}>
                    Activate DDPI Now &gt;&gt;
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                onPress={handleBackButton}
                style={styles.backButton}>
                <ArrowLeft size={18} color="gray" />
                <Text style={styles.backButtonText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                <X size={20} color="gray" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              {instructions.videoId && (
                <View style={styles.videoContainer}>
                  <WebView
                    source={{uri: instructions.videoId}}
                    style={styles.video}
                    javaScriptEnabled
                    domStorageEnabled
                  />
                </View>
              )}
              <Text style={styles.stepTitle}>{instructions.title}</Text>
              <ScrollView style={styles.stepsContainer}>
                {instructions.steps.map((step, index) => (
                  <View key={index} style={styles.step}>
                    <Text style={styles.stepText}>{step}</Text>
                    {step.includes('http') && (
                      <TouchableOpacity
                        onPress={() => Linking.openURL(step)}
                        style={styles.linkButton}>
                        <ClipboardList size={16} color="gray" />
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </ScrollView>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}

export function FyersTpinModal({isOpen, setIsOpen, userDetails}) {
  const [loading, setLoading] = useState(false);
  const [webViewHtml, setWebViewHtml] = useState('');
  const [isWebViewOpen, setIsWebViewOpen] = useState(false);

  const proceedWithFyersTpin = async () => {
    setLoading(true);
    try {
      const broker = userDetails.user_broker;

      if (broker === 'Fyers') {
        console.log('Generating TPIN...');
        const generateTpinResponse = await fetch(
          'https://ccxtprod.alphaquark.in/fyers/tpin',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              clientId: userDetails?.clientCode,
              accessToken: userDetails?.jwtToken,
            }),
          },
        );

        const generateTpinData = await generateTpinResponse.json();

        if (generateTpinData.status === 0) {
          Toast.show({
            type: 'success',
            text1: 'Success',
            text2: 'TPIN generated successfully for Fyers.',
          });

          console.log('Submitting holdings for Fyers...');
          const submitHoldingsResponse = await fetch(
            'https://ccxtprod.alphaquark.in/fyers/submit-holdings',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                clientId: userDetails?.clientCode,
                accessToken: userDetails?.jwtToken,
              }),
            },
          );

          const submitHoldingsData = await submitHoldingsResponse.json();

          if (submitHoldingsData.status === 0) {
            // Open the CDSL form in a WebView modal
            setWebViewHtml(submitHoldingsData.data);
            setIsWebViewOpen(true);
          } else {
            throw new Error(
              submitHoldingsData.message ||
                'Failed to submit holdings for Fyers.',
            );
          }
        } else {
          throw new Error(
            generateTpinData.message || 'Failed to generate TPIN for Fyers.',
          );
        }
      } else {
        throw new Error('Invalid broker');
      }
    } catch (error) {
      console.error('Error in API call:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'An error occurred during the process.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleWebViewNavigation = navState => {
    if (navState.url.includes('success')) {
      setIsWebViewOpen(false);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'CDSL authorization completed successfully.',
      });
    }
  };

  const handleCancel = () => {
    setIsOpen(false);
  };

  return (
    <>
      <Modal visible={isOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <TouchableOpacity style={styles.closeButton} onPress={handleCancel}>
              <XIcon size={20} color={'grey'} />
            </TouchableOpacity>
            <View style={styles.imageWrapper}>
              <Image
                source={DDPI} // Replace with your image
                style={styles.image}
              />
            </View>
            <View style={styles.contentWrapper}>
              <View style={styles.textSection}>
                <Text style={styles.title}>
                  DDPI Inactive: Proceed with TPIN Mandate
                </Text>
                <Text style={styles.listItem}>
                  • Use TPIN for a temporary authorization to sell selected
                  stocks while DDPI is inactive.
                </Text>
                <Text style={styles.listItem}>
                  • This secure, one-time mandate allows smooth transactions
                  until DDPI is active.
                </Text>
                <TouchableOpacity
                  style={styles.proceedButton}
                  onPress={proceedWithFyersTpin}
                  disabled={loading}>
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>
                      Proceed with Authorization
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* WebView Modal */}
      {isWebViewOpen && (
        <Modal visible={isWebViewOpen} animationType="slide">
          <WebView
            originWhitelist={['*']}
            source={{html: webViewHtml}}
            onNavigationStateChange={handleWebViewNavigation}
            startInLoadingState
            renderLoading={() => (
              <ActivityIndicator size="large" color="#0000ff" />
            )}
          />
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setIsWebViewOpen(false)}>
            <XIcon size={20} color={'grey'} />
          </TouchableOpacity>
        </Modal>
      )}
    </>
  );
}
