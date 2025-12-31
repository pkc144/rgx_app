import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import { Info, Eye, EyeOff } from "lucide-react-native"; // Ensure lucide-react-native is installed and imported correctly
import server from '../utils/serverConfig';
import { generateToken } from '../utils/SecurityTokenManager';
import Config from 'react-native-config';
const TokenExpireBrokerModal = ({
  openTokenExpireModel,
  setOpenTokenExpireModel,
  userId,
  apiKey,
  secretKey,
  checkValidApiAnSecret,
  clientCode,
  my2pin,
  panNumber,
  mobileNumber,
  getUserDetails,
  broker,
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [showSuccessMsg, setShowSuccessMsg] = useState(false);
  const [openOtpBox, setOpenOtpBox] = useState(false);
  const [storeResponse, setStoreResponse] = useState(null);
  const [showMpin, setShowMpin] = useState(false);
  const [mpin, setMpin] = useState('');
  const [otp, setOtp] = useState('');

  const handleIiflLogin = () => {
    setLoginLoading(true);
    const data = JSON.stringify({
      clientCode,
      password,
      my2pin,
      userId,
    });

    axios.post(`${server.baseUrl}api/iifl/generate-session`, data, {
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then(response => {
        setLoginLoading(false);
        getUserDetails();
        Toast.show({
          type: 'success',
          text1: 'You have been successfully logged in to IIFL Securities',
          position: 'bottom',
          visibilityTime: 5000,
          autoHide: true,
          topOffset: 50,
        });
        setOpenTokenExpireModel(false);
      })
      .catch(error => {
        setLoginLoading(false);
        const result = error.response?.data?.response || {};
        Toast.show({
          type: 'error',
          text1: result.message || 'An error occurred',
          position: 'bottom',
          visibilityTime: 5000,
          autoHide: true,
          topOffset: 50,
        });
      });
  };

  const updateKotakSecretKey = () => {
    setLoginLoading(true);
    const data = {
      uid: userId,
      apiKey,
      secretKey,
      ...(password && { password }),
      ...(mobileNumber && { mobileNumber: mobileNumber.toString() }),
      ...(panNumber && { pan: panNumber }),
    };

    axios.post(`${server.server.baseUrl}api/kotak/update-key`, data,   {
                              headers: {
                                          "Content-Type": "application/json",
                                          "X-Advisor-Subdomain": Config.REACT_APP_HEADER_NAME,
                                          "aq-encrypted-key": generateToken(
                                            Config.REACT_APP_AQ_KEYS,
                                            Config.REACT_APP_AQ_SECRET
                                          ),
                                        },
                          })
      .then(response => {
        setLoginLoading(false);
        setStoreResponse(response.data.response);
        setOpenOtpBox(true);
      })
      .catch(() => {
        setLoginLoading(false);
        Toast.show({
          type: 'error',
          text1: 'Incorrect credential. Please try again',
          position: 'bottom',
          visibilityTime: 5000,
          autoHide: true,
          topOffset: 50,
        });
      });
  };

  const handleKotakLogin = () => {
    setLoginLoading(true);
    const data = {
      uid: userId,
      apiKey,
      secretKey,
      jwtToken: storeResponse.access_token,
      password,
      otp,
      sid: storeResponse.sid,
      viewToken: storeResponse.view_token,
      ...(panNumber && { pan: panNumber }),
      ...(mobileNumber && { mobileNumber: mobileNumber }),
    };

    axios.put(`${server.server.baseUrl}api/kotak/connect-broker`, data,   {
                              headers: {
                                          "Content-Type": "application/json",
                                          "X-Advisor-Subdomain": Config.REACT_APP_HEADER_NAME,
                                          "aq-encrypted-key": generateToken(
                                            Config.REACT_APP_AQ_KEYS,
                                            Config.REACT_APP_AQ_SECRET
                                          ),
                                        },
                          })
      .then(() => {
        setLoginLoading(false);
        Toast.show({
          type: 'success',
          text1: 'You have been successfully logged in to your broker.',
          position: 'bottom',
          visibilityTime: 3000,
          autoHide: true,
          topOffset: 50,
        });
        setOpenTokenExpireModel(false);
      })
      .catch(() => {
        setLoginLoading(false);
        Toast.show({
          type: 'error',
          text1: 'Incorrect credential. Please try again',
          position: 'bottom',
          visibilityTime: 5000,
          autoHide: true,
          topOffset: 50,
        });
      });
  };

  useEffect(() => {
   // console.log("expiremodallll");
    if (showSuccessMsg) {
      const timer = setTimeout(() => {
        setShowSuccessMsg(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessMsg]);

  return (
    <TokenExpireBrokerModal
      openTokenExpireModel={openTokenExpireModel}
      setOpenTokenExpireModel={setOpenTokenExpireModel}
    >
      <View style={styles.modalContent}>
        <View style={styles.iconContainer}>
          <Info size={64} color="#00000080" />
        </View>
        <Text style={styles.title}>
          Please login to your broker to continue investments
        </Text>
        <View style={styles.inputContainer}>
          {broker === 'IIFL Securities' && (
            <View>
              <TextInput
                style={styles.input}
                value={clientCode}
                placeholder="Client Code"
                editable={false}
              />
              <Text style={styles.label}>Client Code</Text>
              <TextInput
                style={styles.input}
                value={my2pin}
                placeholder="My2Pin"
                editable={false}
              />
              <Text style={styles.label}>My2Pin</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Password"
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowPassword(prev => !prev)}
                >
                  {showPassword ? <Eye size={24} color="#00000060" /> : <EyeOff size={24} color="#00000060" />}
                </TouchableOpacity>
                <Text style={styles.label}>Password</Text>
              </View>
            </View>
          )}
          {broker === 'Kotak' && (
            <View>
              <TextInput
                style={styles.input}
                value={panNumber || mobileNumber}
                placeholder={panNumber ? 'Pan Number' : 'Mobile Number'}
                editable={false}
              />
              <Text style={styles.label}>{panNumber ? 'Pan Number' : 'Mobile Number'}</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Password"
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowPassword(prev => !prev)}
                >
                  {showPassword ? <Eye size={24} color="#00000060" /> : <EyeOff size={24} color="#00000060" />}
                </TouchableOpacity>
                <Text style={styles.label}>Password</Text>
              </View>
              {openOtpBox && (
                <>
                  <View style={styles.passwordContainer}>
                    <TextInput
                      style={styles.input}
                      value={mpin}
                      onChangeText={setMpin}
                      placeholder="Mpin"
                      keyboardType="numeric"
                      secureTextEntry={!showMpin}
                    />
                    <TouchableOpacity
                      style={styles.eyeIcon}
                      onPress={() => setShowMpin(prev => !prev)}
                    >
                      <Info size={64} />
                    </TouchableOpacity>
                    <Text style={styles.label}>Mpin</Text>
                  </View>
                  <TextInput
                    style={styles.input}
                    value={otp}
                    onChangeText={setOtp}
                    placeholder="Otp"
                    keyboardType="numeric"
                  />
                  <Text style={styles.label}>Otp</Text>
                  <TouchableOpacity
                    style={styles.submitButton}
                    onPress={handleKotakLogin}
                    disabled={loginLoading}
                  >
                    {loginLoading ? <ActivityIndicator size="small" color="#ffffff" /> : <Text style={styles.submitButtonText}>Submit</Text>}
                  </TouchableOpacity>
                </>
              )}
              {!openOtpBox && (
                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={updateKotakSecretKey}
                  disabled={loginLoading}
                >
                  {loginLoading ? <ActivityIndicator size="small" color="#ffffff" /> : <Text style={styles.submitButtonText}>Update Key</Text>}
                </TouchableOpacity>
              )}
            </View>
          )}
          {broker === 'ICICI Direct' && (
            <TouchableOpacity
              style={styles.submitButton}
              onPress={() => {}}
              disabled={loginLoading}
            >
              {loginLoading ? <ActivityIndicator size="small" color="#ffffff" /> : <Text style={styles.submitButtonText}>Submit</Text>}
            </TouchableOpacity>
          )}
        </View>
        {showSuccessMsg && (
          <Text style={styles.successMessage}>Login successful</Text>
        )}
      </View>
    </TokenExpireBrokerModal>
  );
};

const styles = StyleSheet.create({
  modalContent: {
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    width: '90%',
    alignSelf: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    marginBottom: 10,
    padding: 10,
  },
  label: {
    fontSize: 12,
    color: '#777',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eyeIcon: {
    position: 'absolute',
    right: 10,
  },
  submitButton: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
  },
  successMessage: {
    color: 'green',
    textAlign: 'center',
    marginTop: 10,
  },
});

export default TokenExpireBrokerModal;
