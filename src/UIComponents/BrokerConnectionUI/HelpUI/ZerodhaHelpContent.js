import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Linking, TouchableOpacity, Dimensions } from 'react-native';
import Config from 'react-native-config';
import YoutubePlayer from "react-native-youtube-iframe";
const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

const ZerodhaHelpContent = ({ expanded, onExpandChange }) => {
  const brokerConnectRedirectURL = Config.REACT_APP_BROKER_CONNECT_REDIRECT_URL;
  useEffect(() => {
    onExpandChange?.(expanded);
  }, [expanded]);

  return (
    <View>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 20 }}>
        <View style={styles.videoBox}>
          <YoutubePlayer
            height={screenHeight * 0.24}
            width={screenWidth * 0.86}
            play={false}
            videoId="tqJTYfgkS04"
          />
        </View>
        <Text style={styles.title}>Steps to Obtain API and Secret key for Zerodha:</Text>
        <View style={styles.content}>
          <Text style={styles.instruction}>
            1. Visit{' '}
            <Text onPress={() => Linking.openURL('https://developers.kite.trade/apps')} style={styles.link}>
              https://developers.kite.trade/apps
            </Text>{' '}in your browser and sign up/login with your credentials.
          </Text>

          {/* STEP 2 */}
          <Text style={styles.instruction}>
            2. Locate and click on the <Text style={{ fontWeight: 'bold' }}>Create New App</Text> button in the top-right corner of the dashboard.
          </Text>

          {/* STEP 3 */}
          <Text style={styles.instruction}>
            3. Configure your application with these details:
          </Text>
          <Text style={styles.instruction}>- Select <Text style={{ fontWeight: 'bold' }}>Personal</Text> for application type.</Text>
          <Text style={styles.instruction}>- Enter a descriptive name for your application.</Text>
          <Text style={styles.instruction}>- Input your <Text style={{ fontWeight: 'bold' }}>Zerodha Client ID</Text>.</Text>
          <Text style={styles.instruction}>- Set the Redirect URL to:</Text>

          <View style={styles.linkContainer}>
            <TouchableOpacity onPress={() => Linking.openURL("https://ccxt.alphaquark.in/zerodha/callback")}>
              <Text style={styles.link}>https://ccxt.alphaquark.in/zerodha/callback</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.instruction}>- Set the Postback URL to:</Text>

          <View style={styles.linkContainer}>
            <TouchableOpacity onPress={() => Linking.openURL("https://ccxt.alphaquark.in/zerodha/postback")}>
              <Text style={styles.link}>https://ccxt.alphaquark.in/zerodha/postback</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.instruction}>- Provide a brief description (e.g., "Trading advisory application for client portfolio management").</Text>


        </View>
        {expanded && (
          <>
            <Text style={styles.instruction}>- Click <Text style={{ fontWeight: 'bold' }}>Create</Text> to submit your application.</Text>

            {/* STEP 4 */}
            <Text style={styles.instruction}>
              4. Retrieve and secure your API credentials:
            </Text>
            <Text style={styles.instruction}>- You will be redirected to the applications dashboard.</Text>
            <Text style={styles.instruction}>- Click on your newly created application to view its details.</Text>
            <Text style={styles.instruction}>- Locate your <Text style={{ fontWeight: 'bold' }}>API Key</Text> on this page.</Text>
            <Text style={styles.instruction}>- Click <Text style={{ fontWeight: 'bold' }}>Show Secret</Text> to reveal your API Secret.</Text>
            <Text style={styles.instruction}>- Securely copy both your <Text style={{ fontWeight: 'bold' }}>API Key</Text> and <Text style={{ fontWeight: 'bold' }}>API Secret</Text>.</Text>

            {/* STEP 5 */}
            <Text style={styles.instruction}>
              5. Paste these details in our app to complete your Zerodha API integration.
            </Text>
          </>
        )}

      </ScrollView>

    </View>

  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    paddingHorizontal: 12,
  },
  videoBox: {
    alignItems: 'center',
    marginVertical: 12,
  },
  title: {
    fontSize: 13,
    fontFamily: 'Poppins-Medium',
    color: "#222",
    marginBottom: 9,
  },
  instruction: {
    fontSize: 14,
    color: "#222",
    marginBottom: 8,
  },
  link: {
    color: "#1890FF",
    textDecorationLine: 'underline',
  },
  toggleContainer: {
    marginTop: 6,
    marginBottom: 10,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1890FF',
  },
});

export default ZerodhaHelpContent;
