import React, {useEffect} from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
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
      await GoogleSignin.signOut();
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
    }
  };

  useEffect(() => {
    handleLogout();
  }, []);

  return (
    <LinearGradient
      colors={[gradient1, gradient2]}
      start={{x: 0, y: 0}}
      end={{x: 0, y: 1}}
      style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.text}>Logging out...</Text>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    </LinearGradient>
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
