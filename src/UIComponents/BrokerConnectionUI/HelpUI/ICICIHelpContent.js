import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Linking, TouchableOpacity, Dimensions } from 'react-native';
import Config from 'react-native-config';
import YoutubePlayer from "react-native-youtube-iframe";
const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

const ICICIHelpContent = ({expanded, onExpandChange }) => {
  const brokerConnectRedirectURL=Config.REACT_APP_BROKER_CONNECT_REDIRECT_URL;
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
          videoId="XFLjL8hOctI"
        />
      </View>
      <Text style={styles.title}>Steps to Obtain API and Secret key for ICICI:</Text>
<View style={styles.content}>
             <Text style={styles.instruction}>
                           1. Visit{" "}
                           <Text onPress={() => Linking.openURL('https://api.icicidirect.com/apiuser/home')} style={styles.link}>
                             https://api.icicidirect.com/apiuser/home
                           </Text>{" "}
                           and log in using your username and password. Verify your identity with the OTP and submit.
                         </Text>
                         <Text style={styles.instruction}>
                           2. Click on the "Register an App" tab, then fill in the "App Name" field with "AlphaQuark" or a name of
                           your choice. Enter the "Redirect URL" as{" "}
                           <Text onPress={() => Linking.openURL(brokerConnectRedirectURL)} style={styles.link}>
                             {brokerConnectRedirectURL}
                           </Text>{" "}
                           and click "Submit". Please ensure that "redirect URL" is entered correctly as mentioned above.
                         </Text>
                   
            
            </View>
      {expanded && (
        <>
           <Text style={styles.instruction}>
                           3. Navigate to the "View Apps" tab and copy your API and Secret Key- enter these details on the screen.
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

export default ICICIHelpContent;
