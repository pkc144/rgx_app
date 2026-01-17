import React, {useEffect} from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
// LinearGradient import removed - using View with solid backgroundColor for iOS Fabric compatibility
// import LinearGradient from 'react-native-linear-gradient';
import {getAuth, signOut} from '@react-native-firebase/auth';
import {GoogleSignin} from '@react-native-google-signin/google-signin';
import {useTrade} from '../TradeContext';
import {useConfig} from '../../context/ConfigContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LogoutScreen = ({navigation}) => {
  const config = useConfig();
  const gradient1 = config?.gradient1 || '#002651';
  const gradient2 = config?.gradient2 || '#0056B7';
  const {
    setUserDetails,
    setIsProfileCompleted,
    setHasFetchedTrades,
    setFunds,
    setstockRecoNotExecutedfinal,
    setModelPortfolioStrategyfinal,
    setBroker,
  } = useTrade();

  const auth = getAuth();

  GoogleSignin.configure({
    webClientId:
      '892331696104-e26pu9iotqrjk1o6jq4ifd4e95fasil1.apps.googleusercontent.com',
  });

  const handleLogout = async () => {
    try {
      // Try to sign out from Google (may fail if user signed in with Apple/email)
      try {
        await GoogleSignin.signOut();
      } catch (googleError) {
        // Ignore - user may not have signed in with Google
        console.log('Google signOut skipped (user may not have used Google)');
      }

      // Sign out from Firebase (handles all auth providers)
      await signOut(auth);
      await AsyncStorage.removeItem('cartItems');

      // Reset state
      setUserDetails(null);
      setHasFetchedTrades(false);
      setIsProfileCompleted(false);
      setFunds({});
      setBroker(null);
      setstockRecoNotExecutedfinal([]);
      setModelPortfolioStrategyfinal([]);

      navigation.replace('Login');
    } catch (error) {
      console.error('Error signing out: ', error);
      // Still navigate to login even if there's an error
      navigation.replace('Login');
    }
  };

  useEffect(() => {
    handleLogout();
  }, []);

  return (
    // View replaces LinearGradient for iOS Fabric compatibility - uses first gradient color as solid background
    <View
      style={[styles.container, {backgroundColor: gradient1, overflow: 'hidden'}]}>
      <View style={styles.content}>
        <Text style={styles.text}>Logging out...</Text>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  text: {
    color: '#fff',
    fontSize: 18,
    marginRight: 20,
    fontFamily: 'Poppins-Medium',
  },
});

export default LogoutScreen;
