import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Linking, TouchableOpacity, Dimensions } from 'react-native';
import Config from 'react-native-config';
import YoutubePlayer from "react-native-youtube-iframe";
const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

const GrowwHelpContent = ({expanded, onExpandChange }) => {
  const brokerConnectRedirectURL=Config.REACT_APP_BROKER_CONNECT_REDIRECT_URL;
  useEffect(() => {
    onExpandChange?.(expanded);
  }, [expanded]);

  return (
    <View>
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 0 }}>

      <Text style={styles.title}>Steps to Obtain API and Secret key for Groww:</Text>
<View style={styles.content}>
               <Text style={styles.instruction}>
                    1. Go to{' '}
                    <Text
                      onPress={() => Linking.openURL('https://groww.in/login')}
                      style={styles.link}>
                      https://groww.in/login
                    </Text>{' '}
                  </Text>
                  <Text style={styles.instruction}>
                    2. Go to Settings - Settings are present in your profile
                    section with your email icon. Click on that and you will see
                    the settings icon.
                    <Text
                      onPress={() =>
                        Linking.openURL(
                          'https://groww.in/user/profile/basic-details',
                        )
                      }
                      style={styles.link}>
                      https://groww.in/user/profile/basic-details
                    </Text>{' '}
                  </Text>
                   <Text style={styles.instruction}>
                    3. Click on the settings icon. You will see "Unique Client
                    Code" - copy that unique client code and add it in place of
                    the unique client code field.
                  </Text>
                  <Text style={styles.instruction}>
                    4. You will see left-hand side tabs in settings. There is an
                    option "Trading API" - click on that.
                  </Text>
                  <Text style={styles.instruction}>
                    5. Now click on "Generate API Key". You will see a modal
                    with two items: API Secret and Secret Key. Please ignore the
                    API Key and Secret Key.
                  </Text>
            </View>
      {expanded && (
        <>
          
                  <Text style={styles.instruction}>
                    6. Type a token name and check if "Access Token" is enabled
                    or not, then click on "Generate API Key".
                  </Text>
                  <Text style={styles.instruction}>
                    7. After that, you will get an Access Token. Copy that
                    access token and paste it in our portal.
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

export default GrowwHelpContent;
