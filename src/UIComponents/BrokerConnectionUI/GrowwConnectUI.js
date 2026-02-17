// components/GrowwConnectUI.js
import React, { useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Linking,
  Platform,
  BackHandler,
  ActivityIndicator,
  Text,
} from 'react-native';
import WebView from 'react-native-webview';
import { ChevronLeft, XIcon } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CrossPlatformOverlay from '../../components/CrossPlatformOverlay';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('screen');

const GrowwConnectUI = ({ isVisible, onClose, authUrl, handleWebViewNavigationStateChange, handleClose, webViewRef: externalWebViewRef }) => {
  const internalWebViewRef = useRef(null);
  const webViewRef = externalWebViewRef || internalWebViewRef;
  const insets = useSafeAreaInsets();
  const [isLoading, setIsLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState(null);

  const sanitizeUrl = (url) => {
    if (!url) return null;
    if (url.startsWith("intent://")) {
      console.log("URL Here sanitizi--", url);
      return url.replace("intent://", "https://").split("#Intent")[0];
    }
    return url;
  };

  // Handle Android back button
  React.useEffect(() => {
    if (!isVisible) return;

    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });

    return () => backHandler.remove();
  }, [isVisible, onClose]);

  // Reset loading state when modal opens
  React.useEffect(() => {
    if (isVisible) {
      setIsLoading(true);
      setLoadError(null);
    }
  }, [isVisible]);

  return (
    <CrossPlatformOverlay visible={isVisible} onClose={onClose}>
      <View style={styles.fullScreen}>
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <TouchableOpacity onPress={handleClose || onClose} style={styles.headerButton}>
            <ChevronLeft size={24} color="#000" />
          </TouchableOpacity>
          <View style={styles.handleIndicator} />
          <TouchableOpacity onPress={onClose} style={styles.headerButton}>
            <XIcon size={24} color="#000" />
          </TouchableOpacity>
        </View>
        <WebView
          ref={webViewRef}
          source={{ uri: sanitizeUrl(authUrl) }}
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
          incognito={false}
          allowsBackForwardNavigationGestures={false}
          userAgent={
            Platform.OS === 'android'
              ? 'Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Mobile Safari/537.36'
              : 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile Safari/604.1'
          }
          injectedJavaScript={`
            // Debug script to log page info
            (function() {
              console.log('📍 Page loaded:', window.location.href);
              console.log('📄 Document title:', document.title);
              console.log('🔍 Query params:', window.location.search);
              console.log('🔗 Hash:', window.location.hash);

              // Check if page is blank
              if (document.body && document.body.innerHTML.trim() === '') {
                console.log('⚠️ Page is blank!');
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'blank_page',
                  url: window.location.href
                }));
              }

              // Send page info back to React Native
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'page_info',
                url: window.location.href,
                title: document.title,
                search: window.location.search,
                hash: window.location.hash
              }));
            })();
            true;
          `}
          onMessage={(event) => {
            try {
              const data = JSON.parse(event.nativeEvent.data);
              console.log('📨 [Groww WebView Message]:', data);

              if (data.type === 'blank_page') {
                console.log('⚠️ Detected blank page via injected script');
                setLoadError('Page loaded but appears blank');
              }
            } catch (e) {
              console.log('📨 [Groww WebView Message - unparsed]:', event.nativeEvent.data);
            }
          }}
          onLoadStart={() => {
            console.log('🔄 [Groww WebView] Load started');
            setIsLoading(true);
            setLoadError(null);
          }}
          onLoadEnd={() => {
            console.log('✅ [Groww WebView] Load ended');
            setIsLoading(false);
          }}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.error('❌ [Groww WebView] Error:', nativeEvent);
            setIsLoading(false);
            setLoadError(nativeEvent.description || 'Failed to load page');
          }}
          onHttpError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.error('❌ [Groww WebView] HTTP Error:', nativeEvent.statusCode);
            if (nativeEvent.statusCode >= 400) {
              setLoadError(`HTTP ${nativeEvent.statusCode}: Failed to load`);
            }
          }}
          renderLoading={() => (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2563eb" />
              <Text style={styles.loadingText}>Connecting to Groww...</Text>
            </View>
          )}
          renderError={(errorDomain, errorCode, errorDesc) => (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>Failed to connect</Text>
              <Text style={styles.errorDesc}>{errorDesc}</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => webViewRef.current?.reload()}
              >
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}
          onShouldStartLoadWithRequest={(request) => {
            const { url } = request;
            console.log("🔗 [Groww WebView] Should start load:", url);
            if (url.startsWith("intent://")) {
              Linking.openURL(url).catch((err) => {
                console.error("Failed to open URL via Linking:", err);
              });
              console.log("Intercepted and handled intent:// URL:", url);
              return false;
            }
            return true;
          }}
        />
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#2563eb" />
            <Text style={styles.loadingText}>Loading Groww...</Text>
          </View>
        )}
        {loadError && (
          <View style={styles.errorOverlay}>
            <Text style={styles.errorText}>Connection Error</Text>
            <Text style={styles.errorDesc}>{loadError}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => {
                setLoadError(null);
                webViewRef.current?.reload();
              }}
            >
              <Text style={styles.retryText}>Retry Connection</Text>
            </TouchableOpacity>
          </View>
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
  handleIndicator: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#e0e0e0',
  },
  webView: {
    flex: 1,
    width: SCREEN_WIDTH,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 24,
  },
  errorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#dc2626',
    marginBottom: 8,
  },
  errorDesc: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#2563eb',
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default GrowwConnectUI;
