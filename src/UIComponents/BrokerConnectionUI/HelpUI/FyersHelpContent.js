import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Linking, TouchableOpacity, Dimensions } from 'react-native';
import Config from 'react-native-config';
import YoutubePlayer from "react-native-youtube-iframe";
const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

const FyersHelpContent = ({expanded, onExpandChange }) => {
  const brokerConnectRedirectURL=Config.REACT_APP_BROKER_CONNECT_REDIRECT_URL;
  useEffect(() => {
    onExpandChange?.(expanded);
  }, [expanded]);

  return (
    <View>
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 0 }}>
      <View style={styles.videoBox}>
        <YoutubePlayer
          height={screenHeight * 0.24}
          width={screenWidth * 0.86}
          play={false}
          videoId="blhTiePBIg0"
        />
      </View>
      <Text style={styles.title}>Steps to Obtain API and Secret key for Fyers:</Text>
<View style={styles.content}>
              <Text
                          style={styles.instruction}
                        >
                          1. Visit{" "}
                          <Text onPress={() => Linking.openURL('https://myapi.fyers.in/dashboard')}  style={styles.link}>myapi.fyers.in/dashboard</Text>{' '}
                        </Text>
                        <Text style={styles.instruction}>
                          2. Log in using your phone number, enter the TOTP, and your 4-digit PIN.
                        </Text>
                      
                       
                       
                        
                   
            
            </View>
      {expanded && (
        <>
        <Text style={styles.instruction}>
                          3. Click on the "Create App" button. Provide an app name, paste the redirect URL as specified in the instructions, add a description, and delete the webhook. Grant all app permissions and check the box to accept the API Usage Terms and Conditions. Finally, click on "Create App."
                        </Text>
                        <Text style={styles.instruction}>
                          4. Scroll down to find the newly created app. Copy the App ID and Secret ID and paste them into your platform.
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
    fontFamily:'Poppins-Medium',
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

export default FyersHelpContent;
