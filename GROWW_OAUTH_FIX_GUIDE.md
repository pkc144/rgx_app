# Groww OAuth Connection - Blank Screen Fix

## Problem Summary
After signing in through Google during Groww broker connection, the app shows a blank white screen and doesn't redirect back properly.

## Root Causes Identified

### 1. **Insufficient URL Interception**
- The WebView navigation handler wasn't properly detecting all callback URL variations
- Only checked for specific query parameter names without considering URL fragments (`#`)
- Didn't handle intermediate redirects

### 2. **Intent URL Handling**
- Groww uses `intent://` URLs which were blocked but not handled gracefully
- Blocking the URL without feedback left users on a blank screen

### 3. **Missing Error & Loading States**
- No visual feedback when WebView was loading or had errors
- Users couldn't tell if the app was working or stuck

### 4. **Redirect URL Mismatch**
- Callback URL: `https://equitypro.co.in/stock-recommendation`
- WebView might not properly intercept this domain
- Query parameters could be in `?` or `#` format

## Fixes Applied

### File 1: `src/components/BrokerConnectionModal/GrowwConnectModal.js`

#### Enhanced Navigation Handler (Lines 77-130)
```javascript
// Added comprehensive logging
console.log('🔍 [Groww] Navigation State Change:', { url, loading, title });

// Improved callback URL detection
const isCallbackUrl = url && (
  url.includes('equitypro.co.in') ||
  url.includes('alphaquark.in') ||
  url.includes('oauth/callback') ||
  url.includes('access_token') ||
  url.includes('user_broker')
);

// Parse both ? and # query parameters
const urlParts = url.split(/[?#]/);
const queryString = urlParts.length > 1 ? urlParts.slice(1).join('&') : '';
const queryParams = parseQueryString(queryString);

// Better error handling
if (queryParams.error) {
  showAlert('error', 'Connection Failed', queryParams.error_description);
  onClose();
}

// Detect blank pages
if (title === '' || title === 'about:blank') {
  console.log('⚠️ [Groww] Detected blank page');
}
```

**Changes:**
- ✅ Added emoji-prefixed logs for easy filtering
- ✅ Check for both `?` and `#` query parameters
- ✅ Detect `equitypro.co.in` redirect domain
- ✅ Handle error responses from OAuth
- ✅ Detect blank page scenarios

### File 2: `src/UIComponents/BrokerConnectionUI/GrowwConnectUI.js`

#### Added Loading & Error States
```javascript
const [isLoading, setIsLoading] = React.useState(true);
const [loadError, setLoadError] = React.useState(null);
```

#### Enhanced WebView Configuration
- ✅ Added `onLoadStart`, `onLoadEnd` callbacks
- ✅ Added `onError`, `onHttpError` handlers
- ✅ Added `renderLoading` and `renderError` components
- ✅ Added `injectedJavaScript` for debugging
- ✅ Added `onMessage` handler to receive WebView messages

#### Loading Overlay (Lines 145-150)
Shows spinner with "Loading Groww..." text while page loads

#### Error Overlay (Lines 151-165)
Shows error message with retry button when loading fails

#### Injected JavaScript (Lines 94-125)
- Logs page URL, title, and query params from within WebView
- Detects blank pages (empty body)
- Sends page info back to React Native
- Helps debug what's happening inside the WebView

## Testing Instructions

### 1. Enable React Native Debugger Logs
```bash
# In terminal
npx react-native log-android
# or
npx react-native log-ios
```

### 2. Test Groww Connection Flow
1. Open the app
2. Navigate to Broker Connection
3. Select "Groww"
4. The WebView modal should open

### 3. Monitor Console Logs

Look for these log patterns:

**✅ Good Flow:**
```
🔍 [Groww] Navigation State Change: { url: 'https://groww.in/...', loading: true }
🔄 [Groww WebView] Load started
📍 Page loaded: https://groww.in/oauth/authorize...
📨 [Groww WebView Message]: { type: 'page_info', url: '...', title: 'Groww Login' }
✅ [Groww WebView] Load ended
🔍 [Groww] Navigation State Change: { url: 'https://equitypro.co.in/stock-recommendation?user_broker=Groww&status=0&access_token=...', loading: false }
✅ [Groww] Detected callback URL
📋 [Groww] Query params: { user_broker: 'Groww', status: '0', access_token: '...' }
🎉 [Groww] Authentication successful, token received
```

**❌ Problem Flow (Blank Screen):**
```
🔍 [Groww] Navigation State Change: { url: 'https://equitypro.co.in/...', loading: true }
🔄 [Groww WebView] Load started
⚠️ Page is blank!
📨 [Groww WebView Message]: { type: 'blank_page', url: 'https://...' }
📄 [Groww] Page finished loading: about:blank
⚠️ [Groww] Detected blank page
```

### 4. Check for Common Issues

#### Issue A: Blank Screen After OAuth
**Symptoms:**
- White/blank screen after Google sign-in
- No error message
- Logs show `about:blank` or empty title

**Debug Steps:**
1. Check if `📨 [Groww WebView Message]` shows `type: 'blank_page'`
2. Look for the URL that caused the blank page
3. Check if query parameters are present in the URL

**Possible Causes:**
- Backend OAuth callback not redirecting properly
- Redirect URL mismatch
- Missing query parameters

#### Issue B: Intent URL Blocking
**Symptoms:**
- Navigation stops suddenly
- Logs show `⚠️ [Groww] Blocking intent:// URL`

**This is expected** - intent URLs are blocked to prevent crashes

#### Issue C: Missing Callback Parameters
**Symptoms:**
- Logs show `⚠️ [Groww] Partial match - missing some params`
- Modal doesn't close after OAuth

**Debug:**
Check the logged `all_params` object to see what's actually returned

### 5. Verify Backend Integration

The frontend expects this callback format:
```
https://equitypro.co.in/stock-recommendation?user_broker=Groww&status=0&access_token=<TOKEN>
```

**Verify:**
1. Backend OAuth callback endpoint: `https://ccxtprod.alphaquark.in/groww/oauth/callback`
2. After processing, backend should redirect to: `https://equitypro.co.in/stock-recommendation` with query params
3. Check backend logs to ensure redirect happens with correct parameters

## Alternative Solutions (If Current Fix Doesn't Work)

### Option 1: Deep Linking
If WebView interception continues to fail, implement deep linking:

1. Add intent filter to `android/app/src/main/AndroidManifest.xml`:
```xml
<intent-filter>
  <action android:name="android.intent.action.VIEW" />
  <category android:name="android.intent.category.DEFAULT" />
  <category android:name="android.intent.category.BROWSABLE" />
  <data
    android:scheme="https"
    android:host="equitypro.co.in"
    android:pathPrefix="/stock-recommendation" />
</intent-filter>
```

2. Handle deep link in app:
```javascript
import { Linking } from 'react-native';

Linking.addEventListener('url', (event) => {
  const { url } = event;
  if (url.includes('stock-recommendation')) {
    // Parse and handle Groww callback
  }
});
```

### Option 2: Custom URL Scheme
Change redirect URL to use custom scheme:
- `rgxresearch://groww/callback?...`
- Easier to intercept, no domain conflicts

### Option 3: Polling Backend
If redirects are unreliable:
1. After OAuth completes, poll backend for status
2. Backend stores token when callback received
3. App polls `/api/groww/status` until token available

## Files Modified

1. ✅ `src/components/BrokerConnectionModal/GrowwConnectModal.js`
   - Enhanced URL interception
   - Better error handling
   - Improved logging

2. ✅ `src/UIComponents/BrokerConnectionUI/GrowwConnectUI.js`
   - Added loading states
   - Added error states
   - Added injected JavaScript for debugging
   - Added visual feedback (spinners, error messages)

## Next Steps

1. **Test the flow end-to-end** with the enhanced logging
2. **Share the console logs** (especially the emoji-prefixed ones) to diagnose remaining issues
3. **Check backend logs** to verify OAuth callback is working correctly
4. **Consider deep linking** if WebView interception proves unreliable

## Contact
If issues persist, provide:
- Full console log output (filtered for `[Groww]`)
- Screenshot of the blank screen (already have this)
- Backend API logs for the OAuth flow
- Network tab from Chrome DevTools (if using Chrome debugging)
