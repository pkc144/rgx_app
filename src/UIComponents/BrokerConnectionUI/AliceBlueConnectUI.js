import React, {useRef} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Platform,
  BackHandler,
} from 'react-native';
import WebView from 'react-native-webview';
import {ChevronLeft, XIcon} from 'lucide-react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import CrossPlatformOverlay from '../../components/CrossPlatformOverlay';

const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('screen');

const AliceBlueConnectUI = ({
  isVisible,
  onClose,
  authUrl,
  handleWebViewNavigationStateChange,
  loading,
}) => {
  const webViewRef = useRef(null);
  const insets = useSafeAreaInsets();

  // Handle Android back button
  React.useEffect(() => {
    if (!isVisible) return;

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        onClose();
        return true;
      },
    );

    return () => backHandler.remove();
  }, [isVisible, onClose]);

  return (
    <CrossPlatformOverlay visible={isVisible} onClose={onClose}>
      <View style={styles.fullScreen}>
        <View style={[styles.header, {paddingTop: insets.top}]}>
          <TouchableOpacity onPress={onClose} style={styles.headerButton}>
            <ChevronLeft size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Connect to AliceBlue</Text>
          <TouchableOpacity onPress={onClose} style={styles.headerButton}>
            <XIcon size={24} color="#000" />
          </TouchableOpacity>
        </View>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0056B7" />
            <Text style={styles.loadingText}>
              Connecting AliceBlue...
            </Text>
          </View>
        ) : (
          <WebView
            ref={webViewRef}
            source={{uri: authUrl}}
            style={styles.webView}
            nestedScrollEnabled={true}
            onNavigationStateChange={handleWebViewNavigationStateChange}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            cacheEnabled={true}
            sharedCookiesEnabled={true}
            thirdPartyCookiesEnabled={true}
            scrollEnabled={true}
            originWhitelist={['*']}
            mixedContentMode="compatibility"
            setSupportMultipleWindows={false}
            userAgent={
              Platform.OS === 'android'
                ? 'Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Mobile Safari/537.36'
                : 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile Safari/604.1'
            }
            renderLoading={() => (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0056B7" />
                <Text style={styles.loadingText}>
                  Loading AliceBlue login...
                </Text>
              </View>
            )}
          />
        )}
      </View>
    </CrossPlatformOverlay>
  );
};

const styles = StyleSheet.create({
  fullScreen: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: '#fff',
  },
  header: {
    height: 56,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  headerButton: {
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: '#000',
  },
  webView: {
    flex: 1,
    width: SCREEN_WIDTH,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#6B7280',
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
  },
});

export default AliceBlueConnectUI;
