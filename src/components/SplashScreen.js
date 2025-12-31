import React, {useState, useEffect} from 'react';
import {View, Image, StyleSheet, Dimensions} from 'react-native';
import ProgressBar from 'react-native-progress-bar-horizontal';
import Config from 'react-native-config';
import AlphaQuarkLogo from '../assets/logo.png';
import auth from '@react-native-firebase/auth';
import axios from 'axios';
import {useNavigation} from '@react-navigation/native';
import server from '../utils/serverConfig';
import {generateToken} from '../utils/SecurityTokenManager';
import {useConfig} from '../context/ConfigContext';
import {getAdvisorSubdomain} from '../utils/variantHelper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {getRaId, getUserData, setUserData, setRaId} from '../utils/storageUtils';
export default function SplashScreen() {
  const [progress, setProgress] = useState(0.0);
  const screenWidth = Dimensions.get('window').width;
  const navigation = useNavigation();

  // Get logo from database via ConfigContext
  const config = useConfig();
  const {logo: LogoComponent, themeColor, configLoading} = config;

  console.log('SplashScreen config logo:', LogoComponent);
  console.log('SplashScreen logo type:', typeof LogoComponent);

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(user => {
      if (user && user.email) {
        const checkUserStatus = async () => {
          const email = user.email;
          try {
            // First, check if we have a cached RA ID from AsyncStorage
            const cachedRaId = await getRaId();
            const cachedUserData = await getUserData();

            console.log('🔍 SplashScreen: Checking cached data...');
            console.log('✓ Current user email:', email);
            console.log('✓ Cached RA ID:', cachedRaId);
            console.log('✓ Cached User Data:', cachedUserData ? JSON.stringify(cachedUserData) : 'null');
            console.log('✓ Email match:', cachedUserData?.email === email);

            // If we have cached RA ID and it matches the current user's email, go directly to Home
            if (cachedRaId && cachedUserData?.email === email) {
              console.log('✅ Using cached advisor configuration for:', cachedRaId);
              setTimeout(() => {
                navigation.replace('Home');
              }, 1000); // Shorter wait since we're using cache
              return;
            }

            // Log why cache is not being used
            if (!cachedRaId) console.log('⚠️ No cached RA ID found');
            if (!cachedUserData) console.log('⚠️ No cached user data found');
            if (cachedUserData?.email !== email) console.log('⚠️ Email mismatch:', cachedUserData?.email, 'vs', email);

            // Otherwise, fetch fresh user details from API
            console.log('🔄 Fetching fresh user details from API...');
            const response = await axios.get(
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
              },
            );
            const userDetails = response.data.User;
            const envAdvisorRaCode = Config.ADVISOR_RA_CODE;
            const advisorRaCode = userDetails?.advisor_ra_code || envAdvisorRaCode;

            const hasAdvisorRaCode = !!advisorRaCode;

            console.log('📊 API User Details: RA Code =', userDetails?.advisor_ra_code);
            console.log('📊 Has Advisor RA Code:', hasAdvisorRaCode);

            // Store user data after fetching from API
            if (userDetails) {
              await setUserData({
                email: email,
                raId: advisorRaCode || null,
                phone_number: userDetails.phone_number,
                name: userDetails.name,
                profileCompleted: !!(userDetails.phone_number && userDetails.name),
              });

              // Store RA ID if available
              if (advisorRaCode) {
                await setRaId(advisorRaCode);
              }
              console.log('✅ User data stored successfully');
            }

            setTimeout(() => {
              navigation.replace(
                hasAdvisorRaCode ? 'Home' : 'SignUpRADetails',
              );
            }, 2000);
          } catch (error) {
            console.error('Error checking user status:', error.message);
            setTimeout(() => navigation.replace('Login'), 2000);
          }
        };

        checkUserStatus(); // Call the async function
      } else {
        setTimeout(() => navigation.replace('Login'), 2000);
      }
    });

    return unsubscribe; // Clean up listener
  }, [navigation]);

  useEffect(() => {
    // Increment progress smoothly
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 1) {
          clearInterval(interval);
          return 1;
        }
        return prev + 0.1;
      });
    }, 300); // Adjust speed as needed

    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.container}>
      {/* Logo Section - Wait for config to load before showing logo */}
      <View style={styles.logoContainer}>
        {configLoading ? (
          // Show nothing or a placeholder while config is loading
          <View style={{width: 150, height: 150}} />
        ) : LogoComponent && typeof LogoComponent === 'function' ? (
          <LogoComponent width={200} height={200} />
        ) : LogoComponent && typeof LogoComponent === 'string' ? (
          <Image
            source={{uri: LogoComponent}}
            style={{width: 150, height: 150, resizeMode: 'contain'}}
          />
        ) : LogoComponent && typeof LogoComponent === 'object' && LogoComponent.uri ? (
          <Image
            source={{uri: LogoComponent.uri}}
            style={{width: 150, height: 150, resizeMode: 'contain'}}
          />
        ) : LogoComponent && typeof LogoComponent === 'object' ? (
          <Image
            source={LogoComponent}
            style={{width: 150, height: 150, resizeMode: 'contain'}}
          />
        ) : (
          <Image
            source={AlphaQuarkLogo}
            style={{width: 150, height: 150, resizeMode: 'contain'}}
          />
        )}
      </View>

      {/* Progress Bar Section */}
      <View style={{marginBottom: 70}}>
        <ProgressBar
          progress={progress}
          borderWidth={1}
          fillColor="#000"
          unfilledColor="#E9E9E9"
          height={7}
          width={screenWidth * 0.5}
          borderColor="#E9E9E9"
          duration={150}
        />
      </View>
    </View>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  logoContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
    margin: 25,
  },
});
