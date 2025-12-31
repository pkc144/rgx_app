// components/AngleOneModalUI.js
import React, { useRef } from 'react';
import { View, StyleSheet, Dimensions, ScrollView, SafeAreaView, TouchableOpacity, Linking } from 'react-native';
import WebView from 'react-native-webview';
import Modal from 'react-native-modal';
import { ChevronLeft, XIcon } from 'lucide-react-native';

const { height: screenHeight } = Dimensions.get('window');

const GrowwConnectUI = ({ isVisible, onClose, authUrl, handleWebViewNavigationStateChange, handleClose }) => {
  const webViewRef = useRef(null);
  const sanitizeUrl = (url) => {
    if (!url) return null;
    if (url.startsWith("intent://")) {
      console.log("URL Here sanitizi--",url);
      // Convert intent://groww.in -> https://groww.in
      return url.replace("intent://", "https://").split("#Intent")[0];
    }
    return url;
  };
  return (
    <Modal
      isVisible={isVisible}
      onBackdropPress={onClose}
      style={styles.modal}
      backdropOpacity={0.1}
      useNativeDriver
      animationIn="slideInUp"
      animationOut="slideOutDown"
      onSwipeComplete={onClose}
    >
      <SafeAreaView style={styles.modalContent}>
        <View style={styles.header}>
          <ChevronLeft size={24} color={'black'} onPress={handleClose} style={{ top: 10, right: 0 }} />
          <View style={styles.handleIndicator} />
          <TouchableOpacity onPress={onClose} style={{ top: 10, right: 10 }}>
            <XIcon size={24} color="#000" />
          </TouchableOpacity>
        </View>
        <ScrollView nestedScrollEnabled contentContainerStyle={styles.content} indicatorStyle="black">
          <View style={styles.sheetContent}>
            <WebView
              source={{ uri: sanitizeUrl(authUrl) }}
              style={styles.webView}
              onNavigationStateChange={handleWebViewNavigationStateChange}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              startInLoadingState={true}
              cacheEnabled={true}
              sharedCookiesEnabled={true}
              thirdPartyCookiesEnabled={true}
              userAgent={
                Platform.OS === 'android'
                  ? 'Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Mobile Safari/537.36'
                  : 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile Safari/604.1'
              }
              onShouldStartLoadWithRequest={(request) => {
                const { url } = request;
                console.log("url here i am here----", url);
                if (url.startsWith("intent://")) {
                  // This is the critical change: Use Linking.openURL to handle the intent natively
                
                  console.error("Failed to open URL via Linking:", err);
                    // Add your own fallback or error handling here if the link fails
            
                  console.log("Intercepted and handled intent:// URL:", url);
                  return false; // Crucial to prevent WebView from loading it
                }

                // If it's a regular HTTP/HTTPS URL, allow it to be loaded in the WebView
                return true;
              }}
            />

          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  content: { padding: 10 },
  modal: { justifyContent: 'flex-end', alignContent: 'center', margin: 0 },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 10,
    height: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 10,
  },
  handleIndicator: {
    width: 110,
    height: 6,
    borderRadius: 250,
    alignSelf: 'center',
    backgroundColor: '#f1f4f8',
    marginBottom: 5,
    marginTop: 20,
  },
  sheetContent: { flex: 1 },
  webView: { flex: 1, minHeight: screenHeight },
});

export default GrowwConnectUI;
