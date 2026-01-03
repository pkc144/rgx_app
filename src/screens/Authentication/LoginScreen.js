import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Keyboard,
  TouchableWithoutFeedback,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {Image} from 'react-native-elements';
import auth from '@react-native-firebase/auth';
import Config from 'react-native-config';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {GoogleSignin} from '@react-native-google-signin/google-signin';
import axios from 'axios';
import server from '../../utils/serverConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment';
import {useTrade} from '../TradeContext';
import {generateToken} from '../../utils/SecurityTokenManager';
import Toast from 'react-native-toast-message';
import {Mail, Lock, Eye} from 'lucide-react-native';
import APP_VARIANTS from '../../utils/Config';
import {getAdvisorSubdomain} from '../../utils/variantHelper';
import {useConfig} from '../../context/ConfigContext';

// Import enhanced storage utilities
import {
  checkAndFetchAdvisorConfig,
  setUserData,
  isUserDataComplete,
  refreshAllAppData,
} from '../../utils/storageUtils';
import {
  logLoginAttempt,
  trackAppUser,
} from '../../FunctionCall/services/LoginLoggingService';

const Glogo = require('../../assets/GLogo.png');
const AlphaQuarkLogo = require('../../assets/logo.png');

const LoginScreen = () => {
  // Get logo and theme from database via ConfigContext
  const config = useConfig();
  const {logo: LogoComponent, themeColor, configLoading} = config;

  // Get dynamic gradient colors from config
  const gradient1 = config?.gradient1 || 'rgba(0, 38, 81, 1)';
  const gradient2 = config?.gradient2 || 'rgba(0, 86, 183, 1)';

  console.log('LoginScreen config logo:', LogoComponent);
  console.log('LoginScreen logo type:', typeof LogoComponent);

  const {reloadConfigData} = useTrade();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorShow, setErrorShow] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const navigation = useNavigation();
  const {
    setIsProfileCompleted,
    getAllTrades,
    getModelPortfolioStrategyDetails,
  } = useTrade();

  // Configure Google Sign-In with googleWebClientId from database
  React.useEffect(() => {
    if (config?.googleWebClientId) {
      GoogleSignin.configure({
        webClientId: config.googleWebClientId,
      });
      console.log('Google Sign-In configured with Client ID from database:', config.googleWebClientId);
    }
  }, [config?.googleWebClientId]);

  // Navigation handler - store data and navigate
  const handlePostLoginNavigation = async (userDetails, userEmail) => {
    try {
      const hasAdvisorRaCode = Config?.ADVISOR_RA_CODE
        ? Config?.ADVISOR_RA_CODE
        : !!userDetails.data?.User?.advisor_ra_code;

      setIsProfileCompleted(hasAdvisorRaCode);
      await storeLoginTime();

      if (hasAdvisorRaCode) {
        const advisorRaCode = Config?.ADVISOR_RA_CODE
          ? Config?.ADVISOR_RA_CODE
          : userDetails.data.User.advisor_ra_code;

        // Store user data
        await setUserData({
          email: userEmail,
          advisor_ra_code: advisorRaCode,
          profileCompleted: true,
          ...userDetails.data.User,
        });

        // Fetch advisor config
        const configResult = await checkAndFetchAdvisorConfig(advisorRaCode);

        if (configResult.success) {
          // Reload config for UI
          await reloadConfigData();

          // Load home data in background (don't wait)
          getAllTrades().catch(err => console.error('Trade load error:', err));
          getModelPortfolioStrategyDetails().catch(err => console.error('Portfolio load error:', err));

          // Navigate to Home
          navigation.replace('Home');
        } else {
          if (configResult.advisorExists === false) {
            navigation.replace('SignUpRADetails', {
              userEmail: userEmail,
            });
          } else {
            navigation.replace('Home');
          }
        }
      } else {
        await setUserData({
          email: userEmail,
          profileCompleted: false,
          ...userDetails?.data?.User,
        });
        navigation.replace('SignUpRADetails', {
          userEmail: userEmail,
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      navigation.replace('Home');
    }
  };

  const signInWithEmail = async () => {
    setLoading(true);
    setErrorShow(false);

    if (!email || !password) {
      setError('Email and password are required');
      setErrorShow(true);
      setLoading(false);
      return;
    }

    try {
      // Step 1: Firebase auth
      const response = await auth().signInWithEmailAndPassword(email, password);
      const user = response.user;

      if (user) {
        // Step 2: Get user details
        let userDetails = null;

        try {
          const getResponse = await axios.get(
            `${server.server.baseUrl}api/user/getUser/${email}`,
            {
              headers: {
                'Content-Type': 'application/json',
                'X-Advisor-Subdomain': getAdvisorSubdomain(),
                'aq-encrypted-key': generateToken(
                  Config.REACT_APP_AQ_KEYS,
                  Config.REACT_APP_AQ_SECRET,
                ),
              },
              timeout: 10000,
            },
          );
          userDetails = getResponse;
        } catch (getUserError) {
          console.log('User does not exist, creating...');

          // Create user
          await axios.post(
            `${server.server.baseUrl}api/user/`,
            {
              email: user.email,
              name: user.displayName || 'New User',
              firebaseId: user.uid,
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
              timeout: 10000,
            },
          );

          // Return minimal user data to avoid second API call
          userDetails = {
            data: {
              User: {
                email: user.email,
                name: user.displayName || 'New User',
              },
            },
          };
        }

        // Log successful login (fire-and-forget) - use subdomain from config
        // Try multiple possible locations for the subdomain
        const advisorSubdomain = config?.subdomain || config?.advisorRaCode?.toLowerCase();
        trackAppUser({
          email: email,
          firebase_id: user.uid,
          name: user.displayName,
          login_method: 'email',
          advisor_subdomain: advisorSubdomain,
        });
        logLoginAttempt({
          email: email,
          firebase_id: user.uid,
          status: 'success',
          login_method: 'email',
          advisor_subdomain: advisorSubdomain,
        });

        // Navigate with handlePostLoginNavigation
        await handlePostLoginNavigation(userDetails, email);
      }
    } catch (error) {
      console.error('Login error:', error);

      // Log failed login attempt (fire-and-forget) - use subdomain from config
      const failedAdvisorSubdomain = config?.subdomain || config?.advisorRaCode?.toLowerCase();
      logLoginAttempt({
        email: email,
        status: 'failed',
        login_method: 'email',
        failure_reason: error.code?.includes('auth/') ? 'firebase_error' : 'api_error',
        error_message: error.message,
        error_code: error.code,
        advisor_subdomain: failedAdvisorSubdomain,
      });

      setError(error.message);
      setErrorShow(true);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setErrorShow(false);
      await GoogleSignin.hasPlayServices({showPlayServicesUpdateDialog: true});
      const {idToken} = await GoogleSignin.signIn();

      if (!idToken) throw new Error('No ID token returned');

      const googleCredential = auth.GoogleAuthProvider.credential(idToken);
      setLoading(true);
      const response = await auth().signInWithCredential(googleCredential);

      if (response) {
        const user = response.user;

        await axios.post(
          `${server.server.baseUrl}api/user/`,
          {
            email: user.email,
            name: user.displayName,
            imageUrl: user.photoURL,
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

        const userDetails = await axios.get(
          `${server.server.baseUrl}api/user/getUser/${user.email}`,
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

        // Log successful Google login (fire-and-forget) - use subdomain from config
        const googleAdvisorSubdomain = config?.subdomain || config?.advisorRaCode?.toLowerCase();
        trackAppUser({
          email: user.email,
          firebase_id: user.uid,
          name: user.displayName,
          login_method: 'google',
          advisor_subdomain: googleAdvisorSubdomain,
        });
        logLoginAttempt({
          email: user.email,
          firebase_id: user.uid,
          status: 'success',
          login_method: 'google',
          advisor_subdomain: googleAdvisorSubdomain,
        });

        await handlePostLoginNavigation(userDetails, user.email);
      }
    } catch (error) {
      // console.error('❌ Error during Google login:', error);

      // Log failed Google login attempt (fire-and-forget) - use subdomain from config
      const failedGoogleAdvisorSubdomain = config?.subdomain || config?.advisorRaCode?.toLowerCase();
      logLoginAttempt({
        email: 'unknown',
        status: 'failed',
        login_method: 'google',
        failure_reason: 'google_auth_error',
        error_message: error.message,
        error_code: error.code,
        advisor_subdomain: failedGoogleAdvisorSubdomain,
      });

      setError(error.message);
      setErrorShow(true);
    } finally {
      setLoading(false);
    }
  };

  const storeLoginTime = async () => {
    try {
      const now = moment().toISOString();
      await AsyncStorage.setItem('lastActiveTime', now);
      // console.log('⏰ Login time stored:', now);
    } catch (error) {
      console.error('❌ Error storing login time:', error);
    }
  };

  const dismissKeyboard = () => {
    setErrorShow(false);
    Keyboard.dismiss();
  };

  useFocusEffect(
    React.useCallback(() => {
      return () => setErrorShow(false);
    }, []),
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{flex: 1}}>
      <TouchableWithoutFeedback onPress={dismissKeyboard}>
        <LinearGradient
          colors={[gradient1, gradient2]}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
          style={styles.container}>
          <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Decorative background circles */}
            <View style={[styles.backgroundCircleabove, styles.circleOne]} />
            <View style={[styles.backgroundCircle, styles.circleFour]} />
            <View style={[styles.backgroundCircle, styles.circleTwo]} />
            <View style={[styles.backgroundCircle, styles.circleThree]} />

            <View style={styles.content}>
              <View style={styles.logoContainer}>
                {configLoading ? (
                  <View style={styles.logo} />
                ) : LogoComponent && typeof LogoComponent === 'function' ? (
                  <LogoComponent style={styles.logo} />
                ) : LogoComponent && typeof LogoComponent === 'string' ? (
                  <Image
                    source={{uri: LogoComponent}}
                    style={styles.logo}
                    resizeMode="contain"
                  />
                ) : LogoComponent && typeof LogoComponent === 'object' && LogoComponent.uri ? (
                  <Image
                    source={{uri: LogoComponent.uri}}
                    style={styles.logo}
                    resizeMode="contain"
                  />
                ) : LogoComponent && typeof LogoComponent === 'object' ? (
                  <Image
                    source={LogoComponent}
                    style={styles.logo}
                    resizeMode="contain"
                  />
                ) : (
                  <Image
                    source={AlphaQuarkLogo}
                    style={styles.logo}
                    resizeMode="contain"
                  />
                )}

                <Text style={styles.logoText}>
                  {Config?.REACT_APP_WHITE_LABEL_TEXT}
                </Text>
              </View>

              <View
                style={{
                  alignContent: 'flex-start',
                  alignItems: 'flex-start',
                  alignSelf: 'flex-start',
                }}>
                <Text style={styles.title}>
                  Your {Config?.REACT_APP_WHITE_LABEL_TEXT} Universe Awaits
                </Text>
                <View style={styles.underline} />
              </View>
              <Text style={styles.subtitle}>
                Its only takes a minute to create your account
              </Text>

              <View style={styles.inputContainer}>
                <Mail
                  color="rgba(100, 199, 59, 1)"
                  size={16}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Email address"
                  placeholderTextColor="#9E9E9E"
                  value={email}
                  onChangeText={text => setEmail(text.toLowerCase())}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputContainer}>
                <Lock
                  color="rgba(100, 199, 59, 1)"
                  size={16}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor="#9E9E9E"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!isPasswordVisible}
                />
                <TouchableOpacity
                  onPress={() => setIsPasswordVisible(!isPasswordVisible)}>
                  <Eye color="#9E9E9E" size={20} />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                onPress={() => navigation.navigate('ResetPassword')}>
                <Text style={styles.forgotPassword}>Forgot Password?</Text>
              </TouchableOpacity>

              {loading && (
                <ActivityIndicator
                  size="large"
                  color="#FFFFFF"
                  style={styles.loader}
                />
              )}
              {errorShow && <Text style={styles.errorText}>{error}</Text>}

              <TouchableOpacity
                style={styles.loginButton}
                onPress={signInWithEmail}
                disabled={loading}>
                <Text style={styles.loginButtonText}>Log In</Text>
              </TouchableOpacity>

              <View style={styles.orContainer}>
                <View style={styles.orLine} />
                <Text style={styles.orText}>OR</Text>
                <View style={styles.orLine} />
              </View>

              <TouchableOpacity
                style={styles.googleButton}
                onPress={handleGoogleLogin}
                disabled={loading}>
                <Image source={Glogo} style={styles.googleIcon} />
                <Text style={styles.googleButtonText}>
                  Continue With Google
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.signupContainer}>
              <Text style={styles.signupText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
                <Text style={styles.signupLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>
            <Toast />
          </View>
        </LinearGradient>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  backgroundCircle: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 500,
  },
  backgroundCircleabove: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 500,
  },
  circleOne: {
    width: 350,
    height: 350,
    top: -80,
    right: -80,
  },
  circleFour: {
    width: 300,
    height: 300,
    top: -80,
    right: -80,
  },
  circleTwo: {
    width: 250,
    height: 250,
    bottom: -50,
    left: -50,
  },
  circleThree: {
    width: 250,
    height: 250,
    bottom: -100,
    left: -100,
  },
  content: {
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  logo: {
    width: 40,
    height: 40,
    marginRight: 8,
  },
  logoText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 1.5,
    fontFamily: Platform.select({
      ios: 'Azonix',
      android: 'Azonix',
      default: 'System',
    }),
  },
  title: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    textAlign: 'left',
  },
  underline: {
    height: 2,
    width: '100%',
    backgroundColor: '#0D47A1',
    marginTop: 4,
    alignSelf: 'center',
  },
  subtitle: {
    color: '#BDCFFF',
    fontSize: 12,
    textAlign: 'left',
    marginBottom: 35,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginBottom: 15,
    paddingHorizontal: 15,
    height: 40,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: '100%',
    color: '#000',
    fontSize: 13,
  },
  forgotPassword: {
    color: 'rgba(133, 245, 0, 1)',
    textAlign: 'right',
    marginBottom: 20,
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
  },
  loginButton: {
    backgroundColor: 'rgba(41, 164, 0, 1)',
    paddingVertical: 5,
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
    height: 45,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
  },
  orContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 25,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  orText: {
    color: '#BDCFFF',
    marginHorizontal: 15,
    fontSize: 14,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    borderRadius: 3,
    height: 45,
  },
  googleIcon: {
    width: 22,
    height: 22,
    marginRight: 15,
  },
  googleButtonText: {
    color: '#333333',
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
  },
  signupContainer: {
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
  },
  signupLink: {
    color: '#85F500',
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    marginLeft: 5,
  },
  errorText: {
    color: '#FF6B6B',
    textAlign: 'center',
    marginBottom: 10,
    fontSize: 14,
  },
  loader: {
    marginVertical: 10,
  },
});

export default LoginScreen;
