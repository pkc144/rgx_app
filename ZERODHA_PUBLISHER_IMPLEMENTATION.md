# Zerodha Kite Publisher Implementation for Mobile Apps

## Overview

This document describes the implementation of **Kite Publisher basket order flow** for React Native mobile apps (rgx_app & Alphab2bapp). This is the **REQUIRED/COMPLIANT** method for placing orders on Zerodha.

---

## Why Publisher API?

**Regulatory/Compliance Requirement:**
- Kite Publisher is Zerodha's official, approved way for third-party platforms to facilitate order placement
- Direct API order placement may violate Zerodha's terms of service
- Publisher flow ensures user authorization and transparency

**Brokers Requiring Publisher API:**
- ✅ **Zerodha** - REQUIRED (Kite Publisher SDK)
- ✅ **FYERS** - REQUIRED (API Connect SDK)
- ❌ **Groww** - Uses regular API
- ❌ **AliceBlue** - Uses regular API

---

## Implementation Summary

### **Changes Made to rgx_app**

**File:** `/home/ravi/WORK/rgx_app/src/components/ModelPortfolioComponents/MPReviewTradeModal.js`

#### 1. Added Missing Import
```javascript
import moment from 'moment';
```

#### 2. Added Helper Function
```javascript
// Helper function to get last known price
const getLastKnownPrice = (symbol) => {
  const price = getLTPForSymbol(symbol);
  return price !== null ? price : '-';
};
```

#### 3. Activated Publisher Flow in Button (Line ~924)
**BEFORE:**
```javascript
onPress={() => {
  broker === 'Zerodha' ? placeOrder() : placeOrder(); // Both same!
}}
```

**AFTER:**
```javascript
onPress={() => {
  // Use Kite Publisher for Zerodha (compliant method)
  // Use server-side API for other brokers
  if (broker === 'Zerodha') {
    console.log('[PlaceOrder] Using Kite Publisher for Zerodha');
    handleZerodhaRedirect();
  } else {
    console.log('[PlaceOrder] Using server-side API for', broker);
    placeOrder();
  }
}}
```

#### 4. Updated Button Text
```javascript
<Text style={styles.orderButtonText}>
  {broker === 'Zerodha' ? 'Open Kite Basket' : 'Place Order'} (₹{' '}
  {parseFloat(totalInvestmentValue).toFixed(2)})
</Text>
```

#### 5. Fixed `handleZerodhaRedirect` Function (Line ~486)
**Key Changes:**
- Added proper loading states (`setLoading(true)`)
- Fixed axios call structure (headers in correct position)
- Fixed localStorage → AsyncStorage
- Added console logging for debugging
- Removed webViewRef.injectJavaScript (not needed, WebView loads HTML directly)

**BEFORE (Broken):**
```javascript
await axios.post(
  endpoint,
  { headers },  // ❌ Wrong position!
  { data }
)

localStorage.setItem(...) // ❌ Doesn't exist in RN!
```

**AFTER (Fixed):**
```javascript
await axios.post(
  endpoint,
  { data },      // ✅ Correct
  { headers }    // ✅ Correct
)

await AsyncStorage.setItem(...) // ✅ Correct for RN
```

#### 6. Enhanced WebView Navigation Detection (Line ~468)
**Added:**
- Success pattern detection (success, completed, basket/success)
- Cancel pattern detection
- Auto-close WebView on redirect
- Return false to prevent navigation after detection

**BEFORE:**
```javascript
if (url.includes('success') || url.includes('completed')) {
  setZerodhaStatus('success');
  setZerodhaRequestType('basket');
}
```

**AFTER:**
```javascript
if (url.includes('success') || url.includes('completed') || url.includes('basket/success')) {
  console.log('[ZerodhaPublisher] Success redirect detected - orders placed in Kite');
  setZerodhaStatus('success');
  setZerodhaRequestType('basket');
  setWebView(false); // Close WebView
  return false; // Prevent navigation
}

if (url.includes('cancelled') || url.includes('cancel')) {
  console.log('[ZerodhaPublisher] User cancelled basket order');
  setZerodhaStatus('cancelled');
  setWebView(false);
  setLoading(false);
  return false;
}
```

#### 7. Completely Rewrote `checkZerodhaStatus` Function (Line ~663)
**Implemented proper Publisher post-order flow matching web:**

**API Call Sequence:**
1. **POST** `/api/zerodha/publisher/record-orders` - Record orders & fetch actual statuses from Zerodha
2. **POST** `/api/model-portfolio-db-update` - Update model portfolio database
3. **POST** `/rebalance/add-user/status-check-queue` - Add to periodic status check queue
4. **POST** `/zerodha/user-portfolio` - Update portfolio holdings from Zerodha

**BEFORE (Wrong endpoint):**
```javascript
await axios.post(`${server.server.baseUrl}api/zerodha/order-place`, ...)
```

**AFTER (Correct Publisher endpoint):**
```javascript
// Step 1: Record orders and fetch statuses
await axios.post(
  `${server.server.baseUrl}api/zerodha/publisher/record-orders`,
  {
    stockDetails: zerodhaStockDetails,
    publisherResults: [{ status: 'success', batchIndex: 0 }],
    userEmail: userEmail,
    broker: 'Zerodha',
  },
  { headers: requestHeaders }
);

// Step 2-4: Model portfolio update, status queue, portfolio sync
...
```

**Removed undefined references:**
- `setOpenZerodhaModel` - Not needed
- `eventEmitter.emit('OrderPlacedReferesh')` - Not needed for model portfolio
- `getAllTrades` - Not needed for model portfolio
- `setflag` - Not needed

#### 8. Fixed WebView Close Button (Line ~839)
**BEFORE:**
```javascript
<XIcon onPress={handleClose} size={16} color={'black'} />
// handleClose was undefined!
```

**AFTER:**
```javascript
<TouchableOpacity onPress={() => {
  setWebView(false);
  setLoading(false);
  setZerodhaStatus(null);
  setZerodhaRequestType(null);
}}>
  <XIcon size={16} color={'black'} />
</TouchableOpacity>
```

---

## Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ USER: Reviews basket and clicks "Open Kite Basket" button  │
└───────────────┬─────────────────────────────────────────────┘
                ↓
┌───────────────────────────────────────────────────────────┐
│ handleZerodhaRedirect()                                    │
│ - Store stock details in AsyncStorage                     │
│ - Create basket format for Kite                           │
│ - Call POST /update-reco-with-zerodha-model-pf            │
│   (Mark trades as "being placed")                         │
│ - Generate HTML form for basket POST                      │
│ - Open WebView with Kite basket URL                       │
└───────────────┬───────────────────────────────────────────┘
                ↓
┌───────────────────────────────────────────────────────────┐
│ WEBVIEW: Kite basket page loads                           │
│ - User reviews orders in Kite UI                          │
│ - User modifies quantities if needed                      │
│ - User clicks "Place Orders" in Kite                      │
└───────────────┬───────────────────────────────────────────┘
                ↓
┌───────────────────────────────────────────────────────────┐
│ Kite processes orders → Redirects to success URL          │
└───────────────┬───────────────────────────────────────────┘
                ↓
┌───────────────────────────────────────────────────────────┐
│ handleWebViewNavigationStateChange()                       │
│ - Detects "success" or "basket/success" in URL            │
│ - Sets zerodhaStatus = 'success'                          │
│ - Closes WebView                                          │
└───────────────┬───────────────────────────────────────────┘
                ↓
┌───────────────────────────────────────────────────────────┐
│ useEffect() triggers checkZerodhaStatus()                 │
└───────────────┬───────────────────────────────────────────┘
                ↓
┌───────────────────────────────────────────────────────────┐
│ checkZerodhaStatus()                                       │
│ Step 1: POST /api/zerodha/publisher/record-orders         │
│         - Send stock list to backend                      │
│         - Backend queries Zerodha orderbook               │
│         - Returns actual order statuses                   │
│                                                            │
│ Step 2: POST /api/model-portfolio-db-update               │
│         - Save order results to MongoDB                   │
│                                                            │
│ Step 3: POST /rebalance/add-user/status-check-queue       │
│         - Add to periodic status polling queue            │
│                                                            │
│ Step 4: POST /zerodha/user-portfolio                      │
│         - Sync user's portfolio holdings from Zerodha     │
└───────────────┬───────────────────────────────────────────┘
                ↓
┌───────────────────────────────────────────────────────────┐
│ Show Success Modal with order results                     │
│ - Display order statuses (Placed, Rejected, etc.)         │
│ - Close review modal                                      │
│ - Clean up AsyncStorage                                   │
└───────────────────────────────────────────────────────────┘
```

---

## Key Technical Points

### 1. **Why WebView Form POST Instead of JavaScript SDK?**

**Web uses:**
```javascript
const kite = new window.KiteConnect(apiKey);
kite.add(basket);
kite.connect(); // Opens popup
kite.finished((status) => { /* callback */ });
```

**Mobile CANNOT use SDK because:**
- React Native WebView doesn't have `window.KiteConnect` global
- `window.open()` popups are blocked in WebView
- SDK expects DOM manipulation not available in RN

**Mobile uses HTML Form POST:**
```javascript
const htmlContent = `
  <form method="POST" action="https://kite.zerodha.com/connect/basket">
    <input name="api_key" value="${apiKey}" />
    <input name="data" value='${JSON.stringify(basket)}' />
    <input name="redirect_params" value="success=true" />
  </form>
  <script>document.forms[0].submit();</script>
`;
```

### 2. **Redirect URL Detection**

- Kite redirects to: `https://kite.zerodha.com/connect/basket/success?status=success`
- We detect via `onNavigationStateChange` in WebView
- Multiple patterns checked: 'success', 'completed', 'basket/success'

### 3. **Publisher vs Regular API**

**Publisher API (Zerodha):**
- User reviews orders in Kite UI before placing
- Can modify quantities
- Transparent and compliant
- Requires two-step flow (basket → record orders)

**Regular API (Other brokers):**
- Direct API order placement
- One-step flow (process-trade)
- No user review in broker app

---

## Backend API Requirements

### Must Exist:
1. **POST** `/api/zerodha/model-portfolio/update-reco-with-zerodha-model-pf`
   - Marks trade recommendations as "being placed"
   - Returns enriched stock details with tradeId

2. **POST** `/api/zerodha/publisher/record-orders`
   - Accepts: `{ stockDetails, publisherResults, userEmail, broker }`
   - Queries Zerodha orderbook API
   - Matches orders by symbol/qty/transaction_type
   - Returns: `{ response: [{ orderStatus, orderStatusMessage, ... }] }`

3. **POST** `/api/model-portfolio-db-update`
   - Accepts: `{ modelId, orderResults, modelName, userEmail }`
   - Updates MongoDB model portfolio documents

4. **POST** `/rebalance/add-user/status-check-queue`
   - Accepts: `{ userEmail, modelName, advisor, broker }`
   - Adds user to periodic status check queue

5. **POST** `/zerodha/user-portfolio`
   - Accepts: `{ user_email }`
   - Syncs portfolio holdings from Zerodha

---

## Testing Checklist

### Unit Tests
- [ ] `getLastKnownPrice()` returns correct LTP or '-'
- [ ] Basket generation formats orders correctly
- [ ] WebView navigation detection triggers on correct URLs
- [ ] AsyncStorage operations work (store/retrieve/remove)

### Integration Tests
- [ ] Full flow: button → WebView → redirect → API calls → success modal
- [ ] Cancel flow: user closes WebView → state resets properly
- [ ] Error scenarios: network failure → user sees error message
- [ ] Multiple stocks: basket includes all orders

### E2E Tests (Real Zerodha Account)
- [ ] Open Kite basket in WebView
- [ ] Place orders in Kite
- [ ] Redirect detected automatically
- [ ] Order statuses fetched correctly
- [ ] Success modal shows accurate results
- [ ] Portfolio updates in app

### Device Testing
- [ ] Android: WebView loads Kite properly
- [ ] iOS: WebView loads Kite properly
- [ ] Both: Redirect detection works
- [ ] Both: Cancel button closes WebView

---

## Rollout Strategy

### Phase 1: Internal Testing
1. Deploy to internal test build
2. Test with Zerodha sandbox/test account
3. Verify all 4 post-order API calls succeed
4. Check order statuses match Kite orderbook

### Phase 2: Beta Testing
1. Deploy to beta testers
2. Monitor logs for errors
3. Collect feedback on UX
4. Check success rate metrics

### Phase 3: Production Rollout
1. Staged rollout: 10% → 50% → 100%
2. Monitor error rates
3. Compare with previous server-side API metrics
4. Be ready to rollback if issues arise

---

## Monitoring & Alerts

### Key Metrics to Track
1. **Publisher Success Rate:** % of users who complete flow
2. **API Error Rate:** Failed /record-orders or /db-update calls
3. **WebView Load Time:** Time to open Kite basket
4. **Order Mismatch Rate:** Orders placed in Kite but not recorded in DB

### Log Prefixes for Debugging
- `[ZerodhaPublisher]` - Main Publisher flow logs
- `[PlaceOrder]` - Button click and broker routing
- `[CRITICAL]` - Critical errors requiring immediate attention

---

## Known Limitations

1. **No Symbol Conversion**
   - Web has `/zerodha/convert-symbol` API for Angel One → Zerodha format
   - Mobile assumes symbols are already in correct format
   - **TODO:** Add symbol conversion if needed

2. **No Batch Splitting**
   - Web splits large baskets into batches of 10
   - Mobile sends all orders in one basket
   - Kite has a limit (usually 20-50 orders per basket)
   - **TODO:** Add batching if users have large baskets

3. **No GTT Orders via Publisher**
   - Publisher only supports regular orders (MARKET, LIMIT, SL, SL_M)
   - GTT orders must use different endpoint
   - Current implementation doesn't handle GTT for Zerodha

4. **No Deep Linking** (Yet)
   - Custom URL scheme (alphaquark://) not configured
   - Currently relies on detecting redirect in WebView
   - **Future:** Add deep linking for better UX

---

## Troubleshooting

### Issue: WebView doesn't open
**Check:**
- `zerodhaApiKey` is defined in configData
- `handleZerodhaRedirect()` is being called (check logs)
- `setWebView(true)` is executed
- WebView component is not hidden by `isWebView === false`

### Issue: Redirect not detected
**Check:**
- `onNavigationStateChange={handleWebViewNavigationStateChange}` prop is set
- Console logs show Navigation URL
- URL contains 'success', 'completed', or 'basket/success'
- WebView didn't crash during navigation

### Issue: "Invalid credentials" in Kite
**Check:**
- `REACT_APP_ZERODHA_API_KEY` is correct in .env
- API key matches the one registered with Zerodha
- Basket data format is correct (tradingsymbol, exchange, quantity, etc.)

### Issue: Orders placed but not recorded
**Check:**
- `checkZerodhaStatus()` is called (check useEffect logs)
- `/api/zerodha/publisher/record-orders` endpoint exists and works
- `zerodhaStockDetails` has correct stock list from AsyncStorage
- Backend can query Zerodha orderbook successfully

### Issue: Success modal doesn't show
**Check:**
- `setOrderPlacementResponse()` is called with valid data
- `setOpenSucessModal(true)` is executed
- Success modal component is properly wired
- No errors in checkZerodhaStatus() before modal show

---

## Files Modified

### rgx_app
- ✅ `/src/components/ModelPortfolioComponents/MPReviewTradeModal.js`

### Alphab2bapp (TO DO)
- ⏳ `/src/components/ModelPortfolioComponents/MPReviewTradeModal.js` (Apply same changes)

### Configuration (Future)
- ⏳ `/ios/rgxapp/Info.plist` (Deep linking)
- ⏳ `/android/app/src/main/AndroidManifest.xml` (Deep linking)

---

## Next Steps

1. **Test rgx_app implementation**
   - Build and run on physical device
   - Test Zerodha basket flow end-to-end
   - Verify all 4 API calls succeed

2. **Apply changes to Alphab2bapp**
   - Mirror all edits from rgx_app
   - Test on Alphab2bapp

3. **Add deep linking** (optional enhancement)
   - Configure custom URL scheme
   - Handle app backgrounding during order placement

4. **Monitor production**
   - Track success metrics
   - Watch for errors
   - Collect user feedback

---

**Implementation Date:** 2026-02-12
**Implemented By:** Claude Code
**Status:** ✅ Implemented in rgx_app, ⏳ Pending in Alphab2bapp
