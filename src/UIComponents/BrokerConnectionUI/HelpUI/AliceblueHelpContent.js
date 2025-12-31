import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Linking, TouchableOpacity, Dimensions } from 'react-native';
import Config from 'react-native-config';
import YoutubePlayer from "react-native-youtube-iframe";
const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

const AliceblueHelpContent = ({expanded, onExpandChange }) => {
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
          videoId="m906oWzMe0o"
        />
      </View>
      <Text style={styles.title}>Steps to Obtain API and Secret key for ICICI:</Text>
<View style={styles.content}>
             <Text
                          style={styles.instruction}
                        >
                          1. Visit{" "}
                          <Text onPress={() => Linking.openURL('https://ant.aliceblueonline.com/apps')}  style={styles.link}>ant.aliceblueonline.com/apps</Text>{' '}
                          with your phone number, password, and TOTP or mobile OTP.
                        </Text>
                      
                        <Text style={styles.instruction}>
                          2. If prompted with a Risk Disclosure pop-up, click "Proceed."
                        </Text>
                       
                       
                        
                   
            
            </View>
      {expanded && (
        <>
          <Text style={styles.instruction}>
                          3. In the "Apps" tab, select "API Key," click "Copy," and paste it on your platform. Note: This key is valid for 24 hours, so generate a new one daily.
                        </Text>
                        <Text style={styles.instruction}>
                          4. For your User ID, click the profile icon, go to "Your Profile/Settings," and copy the client ID under your name. Paste it onto your platform.
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

export default AliceblueHelpContent;
