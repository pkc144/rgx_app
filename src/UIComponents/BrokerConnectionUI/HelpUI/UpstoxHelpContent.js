import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Linking,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Config from 'react-native-config';
import YoutubePlayer from 'react-native-youtube-iframe';
const {width: screenWidth, height: screenHeight} = Dimensions.get('window');

const UpstoxHelpContent = ({expanded, onExpandChange}) => {
  const brokerConnectRedirectURL = Config.REACT_APP_BROKER_CONNECT_REDIRECT_URL;
  useEffect(() => {
    onExpandChange?.(expanded);
  }, [expanded]);

  return (
    <View>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{paddingBottom: 20}}>
        <View style={styles.videoBox}>
          <YoutubePlayer
            height={screenHeight * 0.24}
            width={screenWidth * 0.86}
            play={false}
            videoId="yfTXrjl0k3E"
          />
        </View>
        <Text style={styles.title}>
          Steps to Obtain API and Secret key for Upstox:
        </Text>
        <View style={styles.content}>
          <Text style={styles.instruction}>
            1. Visit{' '}
            <Text
              onPress={() => Linking.openURL('https://shorturl.at/plWYJ')}
              style={styles.link}>
              https://shorturl.at/pIWYJ
            </Text>{' '}
            your phone number. Verify your identity with the OTP and continue.
          </Text>
          <Text style={styles.instruction}>
            2. Enter your 6-digit PIN and continue.
          </Text>
        </View>
        {expanded && (
          <>
            <Text style={styles.instruction}>
              3. Click on the "New App" button. Fill in the "App Name" field
              with "AlphaQuark" or a name of your choice. Enter the "Redirect
              URL" as{' '}
              <Text
                onPress={() => Linking.openURL(brokerConnectRedirectURL)}
                style={styles.link}>
                {brokerConnectRedirectURL}
              </Text>{' '}
              You can skip the Postback URL and Description as they are
              optional. Accept the Terms & Conditions and click on the
              "Continue" button. Please ensure that the "Redirect URL" is
              entered correctly as mentioned above.
            </Text>

            <Text style={styles.instruction}>
              4. Review the details (make sure you don't have more than 2 apps)
              and click on the "Confirm Plan" button. Your API is now ready!
              Click on the "Done" button.
            </Text>
            <Text style={styles.instruction}>
              5. Click on the newly created app, copy your API and Secret Key,
              and enter these details on the designated screen.
            </Text>
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
  },
  videoBox: {
    alignItems: 'center',
    marginVertical: 12,
  },
  title: {
    fontSize: 13,
    fontFamily: 'Poppins-Medium',
    color: '#222',
    marginBottom: 9,
  },
  instruction: {
    fontSize: 14,
    color: '#222',
    marginBottom: 8,
  },
  link: {
    color: '#1890FF',
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

export default UpstoxHelpContent;
