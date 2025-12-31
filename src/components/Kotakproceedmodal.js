import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import Modal from 'react-native-modal';
import {Input} from 'react-native-elements';
import {XIcon, EyeOffIcon, EyeIcon} from 'lucide-react-native';
import axios from 'axios';
import toast from 'react-native-toast-message';
import {getAuth} from '@react-native-firebase/auth';
import {auth} from '../utils/firebaseConfig';
import server from '../utils/serverConfig';
import {generateToken} from '../utils/SecurityTokenManager';
import Config from 'react-native-config';
import {useTrade} from '../screens/TradeContext';
import {getAdvisorSubdomain} from '../utils/variantHelper';
const {width: screenWidth, height: screenHeight} = Dimensions.get('window');
const commonHeight = screenHeight * 0.06; // Common height
const commonWidth = '100%'; // Common width

const KotakProceedModal = ({isVisible, onClose, clientCode}) => {
  const {configData} = useTrade();
  const [my2Pin, setMy2Pin] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [qrValue, setQrValue] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [uid, setUid] = useState('');
  const [broker, setBroker] = useState('IIFL Securities');
  const auth = getAuth();
  const user = auth.currentUser;
  const userEmail = user?.email;

  useEffect(() => {
    if (isVisible && userEmail) {
      fetchUserEmailAndId();
    }
  }, [isVisible, userEmail]);

  const fetchUserEmailAndId = async () => {
    try {
      const response = await axios.get(
        `${server.server.baseUrl}api/user/getUser/${userEmail}`,
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
      //   console.log('API Response Data:', response.data.User);
      if (!response.data || !response.data.User) {
        console.error('Profile data not found in response');
        return;
      }
      const profile = response.data.User;
      setUid(profile._id);
    } catch (error) {
      console.error(
        'Error fetching user email and id:',
        error.response?.data || error.message,
      );
    }
  };

  const handleSubmit = async () => {
    if (!clientCode || !apiKey || !password) {
      toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please fill all required fields.',
      });
      return;
    }

    setLoading(true);
    try {
      const data = JSON.stringify({
        uid: uid,
        user_broker: broker,
        clientCode: clientCode,
        qrValue: qrValue,
        apiKey: apiKey,
        password: password,
      });

      console.log('Request Data:', data);

      const config = {
        method: 'put',
        url: `${server.server.baseUrl}api/user/connect-broker`,

        headers: {
          'Content-Type': 'application/json',
          'X-Advisor-Subdomain': configData?.config?.REACT_APP_HEADER_NAME,
          'aq-encrypted-key': generateToken(
            Config.REACT_APP_AQ_KEYS,
            Config.REACT_APP_AQ_SECRET,
          ),
        },

        data: data,
      };

      const response = await axios.request(config);
      console.log('Response:', response);
      setLoading(false);
      toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Broker successfully connected!',
      });
      onClose();
    } catch (error) {
      console.log('error yahan h');
      console.error('Error:', error.response?.data || error.message);
      setLoading(false);
      toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Incorrect credentials. Please try again.',
      });
    }
  };

  return (
    <Modal
      isVisible={isVisible}
      onBackdropPress={onClose}
      style={styles.modal}
      backdropOpacity={0.5}
      useNativeDriver
      hideModalContentWhileAnimating
      animationIn="slideInUp"
      animationOut="slideOutDown"
      swipeDirection={['down']}
      onSwipeComplete={onClose}>
      <View style={styles.modalContent}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <XIcon size={24} color="#000" />
        </TouchableOpacity>
        <View style={styles.horizontal}></View>
        <ScrollView contentContainerStyle={styles.scrollViewContent}>
          <Pressable>
            <View style={styles.content}>
              <Text style={styles.stepGuide}>Step-by-Step Guide:</Text>
              <Text style={styles.instruction}>
                • In the next field, enter your My2PIN, which is your date of
                birth. Ensure you use the correct format as specified (e.g.,
                YYYYMMDD).
              </Text>
              <Text style={styles.instruction}>
                • Type in your account password. Remember, this password is only
                used for verification purposes and is not stored in the backend.
                Hence, you will be prompted for the password again once the
                password token validity expires.
              </Text>
              <Text style={styles.title}>Connect IIFL Securities</Text>
              <Text style={styles.label}>My2Pin :</Text>
              <TextInput
                style={styles.input}
                placeholder=""
                value={apiKey}
                onChangeText={text => setApiKey(text)}
                keyboardType="numeric"
              />
              <Text style={styles.label}>Password :</Text>
              <Input
                inputContainerStyle={styles.inputContainer}
                secureTextEntry={!isPasswordVisible}
                rightIcon={
                  <TouchableOpacity
                    onPress={() => setIsPasswordVisible(!isPasswordVisible)}>
                    {isPasswordVisible ? (
                      <EyeIcon size={24} color="#000" />
                    ) : (
                      <EyeOffIcon size={24} color="#000" />
                    )}
                  </TouchableOpacity>
                }
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity
                style={styles.proceedButton}
                onPress={handleSubmit}
                disabled={loading}>
                <Text style={styles.proceedButtonText}>
                  {loading ? 'Connecting...' : 'Connect IIFL Securities'}
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modal: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: screenWidth * 0.05, // Dynamic padding
    height: screenHeight / 1.5,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
  },
  horizontal: {
    width: 110,
    height: 6,
    borderRadius: 250,
    alignSelf: 'center',
    backgroundColor: '#f1f4f8',
    marginBottom: 20,
  },
  scrollViewContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  content: {
    marginTop: 30,
  },
  stepGuide: {
    fontSize: screenWidth * 0.045, // Dynamic font size
    fontWeight: '700',
    color: 'black',
    marginBottom: 10,
  },
  instruction: {
    fontSize: screenWidth * 0.04, // Dynamic font size
    color: 'black',
    marginBottom: 10,
  },
  title: {
    fontSize: screenWidth * 0.06, // Dynamic font size
    fontWeight: '700',
    color: 'black',
    marginVertical: 20,
  },
  label: {
    fontSize: screenWidth * 0.05, // Dynamic font size
    color: 'black',
    marginBottom: 5,
    fontWeight: '600',
  },
  inputContainer: {
    borderColor: '#d5d4d4',
    alignSelf: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    width: '106%',
    height: commonHeight, // Apply common height
  },
  input: {
    height: commonHeight, // Apply common height
    borderColor: '#d5d4d4',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    marginBottom: 20,
    color: '#000101',
    width: commonWidth,
  },
  proceedButton: {
    backgroundColor: 'black',
    padding: 10,
    borderRadius: 8,
    height: screenHeight * 0.06, // Dynamic height
    alignItems: 'center',
    justifyContent: 'center',
  },
  proceedButtonText: {
    fontSize: screenWidth * 0.045, // Dynamic font size
    fontWeight: '600',
    color: 'white',
  },
});

export default KotakProceedModal;
