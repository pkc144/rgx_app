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
          onNavigationStateChange={handleWebViewNavigationStateChange}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          thirdPartyCookiesEnabled={true}
          sharedCookiesEnabled={true}
          startInLoadingState={true}
          originWhitelist={['*']}
          setSupportMultipleWindows={true}
          injectedJavaScript={`
            // Intercept Google Sign-In transform page
            (function() {
              const currentUrl = window.location.href;
              console.log('[Groww Injected JS] Page loaded:', currentUrl);

              // Check if we're on the gsi/transform page
              if (currentUrl.includes('gsi/transform')) {
                console.log('[Groww Injected JS] Detected gsi/transform - setting up interceptor');

                // Monitor for any redirects or postMessage events
                let checkCount = 0;
                const maxChecks = 30; // Check for 3 seconds (100ms * 30)

                const checkForRedirect = setInterval(() => {
                  checkCount++;

                  // Check if URL has changed
                  if (window.location.href !== currentUrl) {
                    console.log('[Groww Injected JS] URL changed to:', window.location.href);
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                      type: 'url_changed',
                      url: window.location.href
                    }));
                    clearInterval(checkForRedirect);
                    return;
                  }

                  // Check if there's any form that might auto-submit
                  const forms = document.querySelectorAll('form');
                  if (forms.length > 0) {
                    console.log('[Groww Injected JS] Found', forms.length, 'form(s) on page');
                    forms.forEach((form, idx) => {
                      console.log('[Groww Injected JS] Form', idx, 'action:', form.action);
                      if (form.action && !form.action.includes('gsi/transform')) {
                        // Form redirects elsewhere - might be the callback
                        window.ReactNativeWebView.postMessage(JSON.stringify({
                          type: 'form_detected',
                          action: form.action,
                          method: form.method
                        }));
                      }
                    });
                  }

                  if (checkCount >= maxChecks) {
                    console.log('[Groww Injected JS] Timeout - no redirect detected');
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                      type: 'transform_timeout',
                      url: currentUrl
                    }));
                    clearInterval(checkForRedirect);
                  }
                }, 100);

                // Intercept postMessage calls
                const originalPostMessage = window.postMessage;
                window.postMessage = function(...args) {
                  console.log('[Groww Injected JS] postMessage intercepted:', args);
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'postmessage_intercepted',
                    data: args
                  }));
                  return originalPostMessage.apply(this, args);
                };
              }

              // Send page info back
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'page_loaded',
                url: currentUrl,
                title: document.title
              }));
            })();
            true;
          `}
          onMessage={(event) => {
            try {
              const data = JSON.parse(event.nativeEvent.data);
              console.log('📨 [Groww WebView Message]:', data);

              if (data.type === 'transform_timeout') {
                console.log('⚠️ [Groww] Transform page timeout - OAuth may have failed');
                setLoadError('Google authentication timed out. Please try again.');
              } else if (data.type === 'url_changed') {
                console.log('🔄 [Groww] URL changed via JS:', data.url);
              } else if (data.type === 'form_detected') {
                console.log('📝 [Groww] Form detected - action:', data.action);
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
          renderLoading={() => (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2563eb" />
              <Text style={styles.loadingText}>Connecting to Groww...</Text>
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
