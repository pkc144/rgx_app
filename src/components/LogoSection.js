// src/components/LogoSection.js
import React from 'react';
import {View, Text, Image, StyleSheet, Dimensions} from 'react-native';
import Config from 'react-native-config';
const screenWidth = Dimensions.get('window').width;

import APP_VARIANTS from '../utils/Config';
const LogoSection = () => {
  const selectedVariant = Config.APP_VARIANT; // Default to "arfs" if not set
  const {logo: LogoComponent, themeColor} = APP_VARIANTS[selectedVariant];
  const logo = Config.REACT_APP_WHITE_LABEL_TEXT;

  return (
    <View style={styles.containerLogo}>
      <LogoComponent width={screenWidth * 0.65} height={80} />

      <Text style={styles.subtitle}>Invest with {logo}</Text>
      <Text
        style={{
          fontSize: 13,
          textAlign: 'center',
          marginBottom: 20,
          color: '#9ca2ae',
          fontFamily: 'Satoshi-Medium',
        }}>
        Please Login To Start Trading with {logo}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  containerLogo: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 20,
  },
  logo: {
    width: screenWidth * 0.65, // 65% of screen width
    height: 80, // Set a specific height
    resizeMode: 'contain', // Ensure the image scales properly
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#000101',
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 5,
    fontFamily: 'Satoshi-Bold',
    marginBottom: 20,
    color: '#000101',
  },
});

export default LogoSection;
