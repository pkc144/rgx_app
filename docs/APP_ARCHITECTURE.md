# Mobile App Architecture

> **Last updated**: 2026-04-20 (synced to AlphaB2B v3.8.1)
> **Covers**: React Native mobile app (`rgx_app`), Node.js backend (`aq_backend_github`), Python backend (`ccxt-india`)
> **Consistency with**: `prod-alphaquark-github` (web app), `Alphab2bapp` (sibling app)

---

## Table of Contents

1. [Overview](#1-overview)
2. [System Architecture](#2-system-architecture)
3. [Broker Connection Architecture](#3-broker-connection-architecture)
4. [Trade Execution Architecture](#4-trade-execution-architecture)
5. [Model Portfolio Execution Architecture](#5-model-portfolio-execution-architecture)
6. [Broker Data Management](#6-broker-data-management)
7. [State Management](#7-state-management)
8. [File Reference](#8-file-reference)
9. [Web Parity Status](#9-web-parity-status)
10. [v5.3.0 Sync — Changes Since 2026-04-01](#10-v530-sync--changes-since-2026-04-01)

---

## 1. Overview

The **RGX Research (EquityPro)** mobile app is a React Native application that enables advisory clients to:
- Connect to 14 stock brokers and manage sessions
- Receive and execute trade recommendations from advisors
- Subscribe to model portfolios and execute rebalance signals
- Track portfolio P&L with real-time WebSocket prices

**Supported brokers:** Zerodha, Angel One, Upstox, ICICI Direct, Kotak, Dhan, Fyers, IIFL Securities, AliceBlue, Motilal Oswal, Hdfc Securities, Groww, Axis Securities, DummyBroker (simulation).

**Shared backend:** The app shares the same Node.js (`aq_backend_github`) and Python (`ccxt-india`) backends as the web app (`prod-alphaquark-github`) and the sibling mobile app (`Alphab2bapp`). Data isolation is enforced via the `X-Advisor-Subdomain: rgxresearch` header — all data writes land in the `rgxresearch` MongoDB namespace.

**Multi-tenant defaults (this app):**
- `APP_VARIANT=rgxresearch`
- `X-Advisor-Subdomain: rgxresearch` (via `.env` + `getAdvisorSubdomain()` fallback)
- Broker redirect URL: `https://equitypro.co.in/stock-recommendation`
- Deep-link scheme: `rgxapp://`
- Android package: `com.rgx.aq`

---

## 2. System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      MOBILE APP (React Native)                          │
│  Alphab2bapp                                                            │
│                                                                         │
│  ┌─────────────────────┐  ┌────────────────────┐  ┌─────────────────┐  │
│  │ Screens              │  │ Components          │  │ State Mgmt      │  │
│  │                      │  │                     │  │                 │  │
│  │ Home/                │  │ BrokerConnection    │  │ TradeContext     │  │
│  │   HomeScreen         │  │   Modal/ (15 files) │  │ ConfigContext    │  │
│  │   OrderScreen        │  │                     │  │ MultiBroker     │  │
│  │   WatchlistScreen    │  │ AdviceScreen        │  │   Context       │  │
│  │                      │  │   Components/       │  │ GstConfig       │  │
│  │ Drawer/              │  │   (21 files)        │  │   Context       │  │
│  │   ModelPortfolio     │  │                     │  │                 │  │
│  │   Screen             │  │ ModelPortfolio      │  │ AsyncStorage    │  │
│  │   MPPerformance      │  │   Components/       │  │   (persistent)  │  │
│  │   Screen             │  │   (15 files)        │  │                 │  │
│  │                      │  │                     │  │ EventEmitter    │  │
│  │ PortfolioScreen/     │  │ ReviewTradeModal    │  │   (cross-comp)  │  │
│  │ Authentication/      │  │ DdpiModal           │  │                 │  │
│  │                      │  │ KitePublisherModal  │  │                 │  │
│  └──────────┬───────────┘  └─────────┬──────────┘  └────────┬────────┘  │
│             │                        │                       │           │
│  ┌──────────┴────────────────────────┴───────────────────────┴────────┐  │
│  │                      UTILITIES & SERVICES                          │  │
│  │                                                                    │  │
│  │  brokerSessionUtils  brokerAuth      brokerSupport                │  │
│  │  brokerPublisher     ProcessTrades   rebalanceHelpers             │  │
│  │  tradeUtils          orderStatusUtils portfolioEvents             │  │
│  │  SecurityTokenManager storageUtils    serverConfig                │  │
│  │  BrokerOrderBookAPI  ReconciliationService  ZerodhaOAuthService   │  │
│  └────────────────────────────┬──────────────────────────────────────┘  │
└───────────────────────────────┤──────────────────────────────────────────┘
                                │
              ┌─────────────────┤──────────────────┐
              ▼                                    ▼
┌──────────────────────────────────┐  ┌──────────────────────────────────────┐
│  NODE.JS BACKEND                 │  │  PYTHON BACKEND (ccxt-india)         │
│  aq_backend_github               │  │                                      │
│                                  │  │  Per-Broker Apps:                    │
│  Routes:                         │  │  - apps/app_zerodha.py              │
│  - Routes/multiBrokerRoutes.js   │  │  - apps/app_angelone.py             │
│  - Routes/Broker/zerodha.js      │  │  - apps/app_upstox.py              │
│  - Routes/Broker/ProcessTrades.js│  │  - apps/app_icici.py               │
│  - Routes/Broker/Kotak.js        │  │  - apps/app_kotak.py               │
│  - Routes/Broker/Fyers.js        │  │  - ... (14 brokers)                 │
│  - Routes/Broker/upstox.js       │  │                                      │
│  - Routes/Broker/icici.js        │  │  Trading Logic:                      │
│  - Routes/Broker/Hdfc.js         │  │  - trading_logic/                   │
│  - Routes/Broker/Axis.js         │  │      buy_sell_all_brokers.py         │
│  - Routes/Broker/Motilaloswal.js │  │                                      │
│                                  │  │  Rebalancing:                        │
│  Models:                         │  │  - rebalancing/rebalancing.py        │
│  - Models/userModel.js           │  │  - rebalancing/utils/db_manager.py  │
│  - Models/tradeReco.js           │  │                                      │
│  - Models/modelPortfolioModel.js │  │  Broker Implementations:            │
│  - Models/modelPortfolioUser.js  │  │  - brokers/ directory               │
│                                  │  │  - BrokerInterface (ABC)             │
│  Brokers:                        │  │                                      │
│  - brokers/BrokerFactory.js      │  │  Advice Delivery:                   │
│  - brokers/ZerodhaBroker.js      │  │  - advice/send/reco.py              │
│  - brokers/AngelOneBroker.js     │  │  - advice/fcm_notifier.py           │
│  - ... (13 broker files)         │  │                                      │
│                                  │  │  Apps:                               │
│  Cron:                           │  │  - apps/app_order.py (GTT, orders)  │
│  - CronJob/brokerTokenRefresh.js │  │  - apps/app_gtt.py                  │
│                                  │  │  - apps/app_broker_capabilities.py  │
│  Utilities:                      │  │                                      │
│  - utilities/encryptionUtils.js  │  │                                      │
└──────────────────────────────────┘  └──────────────────────────────────────┘
```

**Server Endpoints:**
```
ccxtServer: https://ccxtprod.alphaquark.in/   (broker APIs, order execution)
server:     https://server.alphaquark.in/      (business logic, user management)
websocket:  https://websocket.alphaquark.in/   (real-time price feeds)
```

---

## 3. Broker Connection Architecture

### 3.1 Overview

The broker connection system manages authentication, credential storage, and session lifecycle for 14 supported brokers. The mobile app uses WebView-based OAuth (no deep linking) for OAuth brokers and direct credential forms for credential-based brokers.

### 3.2 Authentication Flows

#### OAuth-Based Brokers (WebView)

```
User enters credentials (API Key, Secret Key, etc.)
    │
    ▼
Frontend sends to Node.js backend
    │  e.g., PUT /api/zerodha/update-key
    │
    ▼
Node.js validates, stores encrypted credentials
    │  Calls Python: POST /{broker}/login-url
    │
    ▼
Python returns OAuth login URL
    │
    ▼
Mobile opens WebView with OAuth URL
    │  WebView monitors URL changes via
    │  handleWebViewNavigationStateChange()
    │
    ▼
User logs in at broker's OAuth page
    │
    ▼
Broker redirects to callback URL with auth code
    │  WebView intercepts redirect URL
    │  Extracts auth_code/request_token from query params
    │
    ▼
Frontend exchanges auth code for access token
    │  e.g., POST /zerodha/gen-access-token
    │
    ▼
Token stored → broker status updated → UI refreshed
    brokerSessionUtils.saveBrokerSessionTime(broker)
```

**OAuth brokers:** Zerodha, Upstox, Fyers, Groww, Axis, Motilal Oswal, ICICI Direct

#### Credential-Based Brokers

```
User enters credentials in form
    │
    ▼
Frontend sends to Node.js:
    │  PUT /api/user/connect-broker
    │  Body: { broker, clientCode, jwtToken/apiKey, ... }
    │
    ▼
Node.js validates with Python backend
    │  Stores encrypted credentials (AES-256-CBC)
    │
    ▼
Returns success → Toast notification → Context updated
```

**Credential-based brokers:** Angel One, AliceBlue, Dhan, IIFL Securities, Hdfc Securities, Kotak

### 3.3 Per-Broker Auth Details

| Broker | Auth Type | Credentials Required | Token Expiry | Special |
|--------|-----------|---------------------|--------------|---------|
| **Zerodha** | OAuth | apiKey, secretKey | Daily ~6AM IST | Kite Publisher SDK, GTT/OCO |
| **Angel One** | OAuth (nonce) | apiKey (from config) | ~24h | Surveillance check, EDIS/TPIN |
| **Upstox** | OAuth PKCE | apiKey, secretKey | ~24h | GTT, OCO |
| **ICICI Direct** | OAuth | apiKey, secretKey | Session | Manual mandate for SELLs |
| **Kotak** | Credential (MPIN+TOTP) | mobile, mpin, totp | ~1h | TOTP on every reconnect |
| **Dhan** | Credential | clientCode, jwtToken | Session | DDPI/TPIN for sells |
| **Fyers** | OAuth | clientCode, secretKey | Session | Publisher SDK, TPIN |
| **Groww** | OAuth PKCE | None (OAuth handles) | Session | Max 5 connections |
| **AliceBlue** | Credential | clientCode, apiKey | 24h | Daily API key regeneration |
| **Motilal Oswal** | OAuth | clientCode, apiKey | Session | — |
| **Axis Securities** | OAuth | None (OAuth handles) | Session | — |
| **Hdfc Securities** | Credential | accessToken | Session | — |
| **IIFL Securities** | Credential | clientCode, jwtToken | Session | — |
| **DummyBroker** | None | None | Never | Simulation only |

### 3.4 OAuth State Management

**File:** `src/utils/brokerAuth.js`

```
generateState(broker, returnPath):
    │
    ├── Creates JSON: { broker, returnPath, timestamp, nonce, platform }
    ├── Base64-encodes the JSON
    └── Returns: base64 string (passed as ?state= in OAuth URL)

registerCallback(broker, returnPath):
    │  For brokers that don't return state (Angel One, AliceBlue)
    ├── POST https://alphaquark.in/api/deploy/broker/register
    └── Returns: nonce string

saveOAuthState(broker, state):
    │  Stores in AsyncStorage for validation on callback
    └── Key: @broker:oauthState:{broker}

validateOAuthState(broker, returnedState):
    │  Compares returned state against stored state
    └── Expires after 10 minutes
```

### 3.5 Multi-Broker Context

**File:** `src/context/MultiBrokerContext.js`

```javascript
MultiBrokerContext = {
  // State
  connectedBrokers: [],              // Array of connected broker objects
  selectedBroker: null,              // Currently active broker
  brokerHoldings: {},                // { "Zerodha": [...], "Angel One": [...] }
  aggregatedHoldings: [],            // Combined across all brokers
  brokerFunds: {},                   // { "Zerodha": { availablecash: N }, ... }
  isLoading: Boolean,
  errors: {},                        // { "Zerodha": "Token expired", ... }

  // Methods
  setBrokerHoldings(broker, holdings),
  setBrokerFunds(broker, funds),
  setBrokerError(broker, error),
  getBrokerStatus(broker),           // Returns BROKER_STATUS enum
  getTotalValue(),                   // Sum across all brokers
  getTotalPnL(),                     // Aggregated P&L
  resetBrokerData(broker),
}
```

**Status Constants:**
```javascript
BROKER_STATUS = {
  CONNECTED: "connected",
  EXPIRED: "expired",
  ERROR: "error",
  DISCONNECTED: "disconnected",
}
```

### 3.6 Token Expiry Detection

Three mechanisms:

1. **Backend cron job** (every 30 minutes):
   - `CronJob/brokerTokenRefresh.js` → `checkExpiredTokens()`
   - Sets status to "expired" for tokens past `token_expire` date

2. **API call failure** (runtime):
   - `BrokerOrderBookAPI.js` detects `TOKEN_EXPIRED` in responses
   - Returns `{success: false, tokenExpired: true}`

3. **Session freshness check** (frontend):
   - `brokerSessionUtils.isBrokerSessionFresh(broker)`
   - Compares session date in AsyncStorage to today (IST)
   - Used before order placement

### 3.7 Credential Encryption

```
Frontend:
  CryptoJS.AES.encrypt(apiKey, "ApiKeySecret")  →  sends to Node.js

Node.js:
  CryptoJS.AES.decrypt(data, "ApiKeySecret")     →  recovers plaintext
  encryptionUtils.encrypt(plaintext)              →  AES-256-CBC for DB storage

What gets encrypted:
  apiKey: Yes (AES-256-CBC)
  secretKey: Yes (AES-256-CBC)
  jwtToken: No (rotated frequently)
  clientCode: No (not sensitive)
```

### 3.8 Broker Disconnection

```
User clicks "Disconnect" in ManageConnectionsModal
    │
    ▼
API: DELETE /api/user/disconnect-broker
    │  Body: { broker }
    │
    ├── Removes from connected_brokers array
    ├── Groww: POST /groww/revoke (frees connection slot)
    │
    ▼
MultiBrokerContext.resetBrokerData(broker)
```

### 3.9 EDIS / DDPI / TPIN Authorization

Authorization required for SELL orders on certain brokers:

| Broker | Authorization | Detection | Modal |
|--------|--------------|-----------|-------|
| **Zerodha** | DDPI | `ddpi_status` field | `DdpiModal.js` |
| **Angel One** | EDIS/TPIN | `checkAngelOneEDIS()` API | TPIN modal in StockAdvices |
| **Dhan** | EDIS/TPIN | `is_authorized_for_sell` | Dhan TPIN modal |
| **Fyers** | TPIN | `is_authorized_for_sell` | Fyers TPIN modal |
| **ICICI Direct** | Manual Mandate | CDSL error detection | Manual sell instructions |

---

## 4. Trade Execution Architecture

### 4.1 Overview

The trade execution flow follows a recommendation → cart → review → execute pipeline. Advisors create BUY/SELL recommendations which are delivered to clients via email, WhatsApp, Telegram, and FCM push. Clients review, select, and place orders through their connected broker.

### 4.2 Recommendation Flow

```
┌───────────────────────────────────────────────────────────────────┐
│  ADVISOR SIDE (Backend)                                           │
│                                                                   │
│  advice/send/reco.py → Recommendation.send_advice_from_data()    │
│    1. Save to traderecos collection (per recipient)               │
│    2. Send email notification                                     │
│    3. Send WhatsApp via gateway                                   │
│    4. Send Telegram to group                                      │
│    5. Send FCM push notification                                  │
└──────────────────────────────┬────────────────────────────────────┘
                               │
                               ▼
┌───────────────────────────────────────────────────────────────────┐
│  CLIENT SIDE (Mobile App)                                         │
│                                                                   │
│  [StockAdvices.js] ─ fetches recommendations                     │
│       │  API: GET /api/user/trade-reco-for-user?user_email={email}│
│       │                                                           │
│       ├── "Recommendations" Tab  (trade_place_status = "recommend")
│       ├── "Ignored" Tab          (trade_place_status = "ignored") │
│       └── "Rejected" Tab         (trade_place_status = "rejected")│
│                                                                   │
│  [AddtoCartModal.js] ─ individual recommendation card + cart      │
│       │  Checkbox to select, quantity adjustment                  │
│       │  Live LTP via WebSocket                                   │
│       │  Advised range, SL, PT display                            │
│       │                                                           │
│       ▼                                                           │
│  [ReviewTradeModal.js] ─ order review + execution                │
│       │  Angel One surveillance check (automatic)                 │
│       │  Fix Size algorithm (proportional allocation)             │
│       │  Slide-to-execute confirmation                            │
│       │                                                           │
│       ▼                                                           │
│  [ProcessTrades.js] ─ centralized order pipeline                 │
│       │  Builds broker-specific payload                           │
│       │  Separates GTT vs regular orders                          │
│       │  Routes to correct API endpoint                           │
│       │  Detects EDIS/TPIN failures → triggers auth modals        │
│       │                                                           │
│       ▼                                                           │
│  Post-order: refresh recommendations, clear cart, update holdings │
└───────────────────────────────────────────────────────────────────┘
```

### 4.3 Cart System

The mobile app uses AsyncStorage-based cart with event-driven sync:

```
Cart Operations:
    │
    ├── Add to cart:    AsyncStorage.setItem('cartItems', [...])
    ├── Remove:         Filter and save back
    ├── Clear:          AsyncStorage.removeItem('cartItems')
    │
    ├── Events:
    │   ├── 'cartUpdated'   → triggers cart count refresh
    │   └── 'stockRemoved'  → triggers individual removal
    │
    └── Zerodha-specific: 'stockDetailsZerodhaOrder' key
```

### 4.4 Centralized Trade Processing

**File:** `src/utils/ProcessTrades.js`

```
createPlaceOrderFunction({broker, credentials, userEmail, ...callbacks})
    │
    │  Returns: async placeOrders(stockDetails)
    │
    ├── 1. Separate GTT orders from regular orders
    │      gttOrders = stockDetails.filter(s => s.gttCheck)
    │      regularOrders = stockDetails.filter(s => !s.gttCheck)
    │
    ├── 2. Place GTT orders via broker-specific endpoint
    │      POST {ccxtServer}{brokerUrl}/process-trades
    │      Payload includes leg details (entry, SL, PT)
    │
    ├── 3. Place regular orders via unified endpoint
    │      POST {server}api/process-trades/order-place
    │
    ├── 4. Detect EDIS/TPIN failures
    │      Scans response for CDSL/EDIS/TPIN keywords
    │      Triggers onTpinRequired(broker, failedOrders) callback
    │
    ├── 5. Detect session expiry
    │      Triggers onSessionExpired() callback
    │
    └── 6. Return results
          { success, results, sessionExpired? }
```

**Broker credential mapping:**

| Broker | Fields Sent |
|--------|------------|
| Zerodha | `jwtToken` only (server fetches rest) |
| Angel One | `apiKey` (from config) + `accessToken` |
| Upstox | `apiKey` + `apiSecret` + `accessToken` (AES decrypted) |
| ICICI Direct | `apiKey` + `secretKey` + `accessToken` (AES decrypted) |
| Kotak | `apiKey` + `secretKey` + `jwtToken` + `sid` + `serverId` |
| IIFL Securities | `clientCode` + `jwtToken` |
| Dhan | `clientCode` + `accessToken` |
| Fyers | `clientCode` + `accessToken` |
| Motilal Oswal | `apiKey` + `clientCode` + `jwtToken` |
| AliceBlue | `clientCode` + `apiKey` + `accessToken` |
| Hdfc Securities | `apiKey` (AES decrypted) + `accessToken` |
| Groww | `accessToken` |
| Axis Securities | `authToken` + `subAccountId` |

### 4.5 GTT (Good Till Triggered) Orders

Supported by Zerodha and Upstox via the app.

```
GTT Order Structure:
    entryLeg: { Type: "BUY", orderType, price, triggerPrice }
    leg1 (SL): { Type: "SELL", orderType, price, triggerPrice }
    leg2 (PT): { Type: "SELL", orderType, price, triggerPrice }

GTT Flow:
    1. Advisor creates recommendation with gttOrdersCheck = true
    2. Client sees GTT details on recommendation card
    3. GTT orders separated: stockDetails.filter(s => s.gttCheck)
    4. Sent to broker-specific endpoint: POST {ccxtServer}/{broker}/process-trades
    5. Backend places GTT rule on broker
    6. GTT remains active until price trigger, cancellation, or expiry
```

### 4.6 Order Status Normalization

**File:** `src/utils/orderStatusUtils.js`

All broker-specific statuses are normalized to 6 canonical values:

| Canonical | Broker Statuses Mapped |
|-----------|----------------------|
| `complete` | COMPLETE, COMPLETED, TRADED, FILLED, EXECUTED, PLACED, ORDERED |
| `pending` | PENDING, TRIGGER PENDING, REQUESTED, OPEN, TRANSIT, AM |
| `rejected` | REJECTED, FAILED, FAILURE, ERROR, DECLINED |
| `cancelled` | CANCELLED, CANCELED, CANCELLED BY USER/SYSTEM |
| `partial` | PARTIALLY FILLED, PARTIAL |
| `unknown` | Everything else |

### 4.7 Ignore & Restore Flow

```
Ignore:
    PUT /api/recommendation { uid: tradeId, trade_place_status: "ignored", reason }
    Trade moves to "Ignored" tab

Restore:
    Select ignored trade → place order normally
    Status updated back to "recommend"
```

### 4.8 Reconciliation Service

**File:** `src/services/ReconciliationService.js`

Detects conflicts between pending orders and closure trades before placement:

```
detectConflicts(basketTrades, allOrders):
    For each closure trade (SELL):
        Check if pending BUY order exists for same symbol
        If unfilled → PENDING_ORDER_CONFLICT
        If partially filled → PARTIAL_FILL_CONFLICT

reconcileBasket(basketTrades, allOrders):
    Returns:
      hasConflicts, conflicts, tradesToPlace, tradesToSkip, warnings
```

---

## 5. Model Portfolio Execution Architecture

### 5.1 Overview

Advisors create reusable investment portfolios (strategies). Clients subscribe with a chosen investment amount and receive rebalance signals when the advisor updates allocations. The mobile app adds payment integration, digital signatures, and step-by-step UX on top of the shared backend.

### 5.2 Subscription Flow (Mobile-Specific Multi-Step)

```
┌─────────────────────────────────────────────────────────────────┐
│  [MPInvestNowModal.js] — 5,346 lines, core investment modal     │
│                                                                  │
│  Step 1: User Information                                        │
│    ├── Collect Date of Birth, PAN, Mobile Number                 │
│    └── Validate completeness                                     │
│                                                                  │
│  Step 2: Payment Processing                                      │
│    ├── Payment gateways: Razorpay | Cashfree | PayU              │
│    ├── Recurring/SIP: PayU SI | Cashfree recurring               │
│    ├── Coupon code validation                                    │
│    ├── GST calculation (useGstConfig context)                    │
│    └── PendingPaymentManager for recovery on failure             │
│                                                                  │
│  Step 3: Digital Signature (Digio)                               │
│    ├── Aadhaar-based authentication (preferred)                  │
│    ├── OTP-based fallback                                        │
│    ├── Configurable timing: beforePayment | afterPayment         │
│    ├── Polls document status for completion                      │
│    └── Downloads signed PDF on success                           │
│                                                                  │
│  Step 4: Order Execution                                         │
│    ├── Calculate rebalance: POST /ccxt/rebalance/calculate       │
│    ├── Display order preview (BUY/SELL lists)                    │
│    ├── Confirm and place orders                                  │
│    └── Subscribe: PUT /api/model-portfolio/subscribe-strategy    │
└─────────────────────────────────────────────────────────────────┘
```

### 5.3 Rebalance Lifecycle

#### 5.3.1 Pre-Rebalance Validation

```
[RebalanceAdvices.js] opens
    │
    ├── 1. Refresh broker status (live, not cached)
    │      API: GET /api/user/getUser/{email}
    │
    ├── 2. Validate broker connection
    │      If not connected → Show connect broker modal
    │
    ├── 3. Check market hours
    │      isMarketHours() → 9:15 AM - 3:30 PM IST
    │
    ├── 4. Fetch fresh funds
    │      fetchFunds() → broker API
    │      Check: isFundsErrorOrMissing(funds, brokerStatus)
    │        status 1 → Token expired
    │        status 2 → Backend error
    │
    └── 5. Check EDIS authorization for SELL orders
```

#### 5.3.2 Rebalance Calculation

```
User clicks "Rebalance"
    │
    ▼
Build broker-specific payload:
    buildBrokerPayloadFields(broker, credentials, decryptFn, angelOneApiKey)
    │  File: src/utils/rebalanceHelpers.js
    │
    ▼
API: POST {ccxtServer}/rebalance/calculate
    │
    │  Backend (ccxt-india/rebalancing/rebalancing.py):
    │    1. Fetch user's current holdings from broker
    │    2. Apply corporate action adjustments (splits, mergers, demergers)
    │    3. Compare current holdings vs target allocation
    │    4. Calculate BUY orders for underweight positions
    │    5. Calculate SELL orders for overweight positions
    │    6. Factor in available cash
    │    7. Skip stocks where cash is insufficient (partial rebalance)
    │
    │  Response:
    │  {
    │    buy: [{ symbol, quantity, price, token, exchange }],
    │    sell: [{ symbol, quantity, price, token, exchange }],
    │    status: 0|1|2,
    │    message, uniqueId, totalValue, minInvestmentValue
    │  }
    │
    ▼
Display order preview → User confirms → Place orders
```

#### 5.3.3 Order Placement

For real brokers (non-publisher, non-DummyBroker):

```
User clicks "Confirm Orders"
    │
    ├── Step 1: POST {ccxtServer}/rebalance/process-trade
    │     Places orders via broker API
    │     Returns: { results, status, orderErrors, fundsRequired }
    │
    ├── Step 2: PUT {ccxtServer}/rebalance/update/subscriber-execution
    │     Marks rebalance as "executed"
    │
    └── Step 3: POST {ccxtServer}/rebalance/add-user/status-check-queue
          Enrolls for async order status tracking
```

#### 5.3.4 Publisher SDK Flow (Zerodha / Fyers)

**Files:**
- `src/components/KitePublisherModal.js` — WebView wrapper for Kite SDK
- `src/utils/brokerPublisher.js` — SDK utilities

```
isPublisherSupported(broker) === true
    │
    ├── 1. Load publisher SDK in WebView
    │      Zerodha: kite.trade/publisher.js?v=3
    │      Fyers: api-connect-docs.fyers.in/fyers-lib.js
    │
    ├── 2. Convert symbols to broker format
    │      POST {ccxtServer}/zerodha/convert-symbol
    │
    ├── 3. Build basket items
    │      createBatches(stockDetails, broker) — respects max basket size
    │      convertToBasketItem(broker, stock, symbolMap)
    │
    ├── 4. WebView ↔ React Native postMessage communication
    │      Messages: loaded → init → ready → addItems → opened → finished
    │
    ├── 5a. Publisher callback fires (happy path)
    │      Record results: POST /{broker}/publisher/record-orders
    │
    └── 5b. Callback doesn't fire (iOS WebView issue)
           Polling fallback: every 5s, timeout 90s
           Compare new order IDs vs baseline
```

#### 5.3.5 DummyBroker Flow

```
DummyBroker detected → editable order form
    │
    ├── User can: modify quantities, edit prices, add/remove stocks
    │
    ├── If dataArray.length === 0 (already aligned):
    │     POST /rebalance/process-trade (empty trades)
    │
    └── User confirms → simulated execution → COMPLETE status
```

### 5.4 Post-Rebalance Status Tracking

```
After orders placed
    │
    ├── Backend status-check-queue (async):
    │     Polls broker order book every 30-60s
    │     Updates user_net_pf_model in database
    │     Sends completion notification
    │
    ├── [MPStatusModal.js]
    │     API: GET {ccxtServer}/rebalance/user-portfolio/latest/{email}/{modelName}
    │     Status color-coding:
    │       Green:  COMPLETE, COMPLETED, TRADED, FILLED
    │       Yellow: OPEN, PENDING, TRANSIT, TRIGGER PENDING
    │       Red:    REJECTED, CANCELLED, FAILURE, FAILED
    │
    │     Mobile-specific features:
    │       - Edit failed orders (modify quantity/price)
    │       - Add new stocks to execution
    │       - Remove stocks
    │       - Explicit confirmation required per failed stock
    │
    └── Portfolio event emission:
          portfolioEvents.emit(PORTFOLIO_EVENTS.HOLDINGS_REFRESH)
```

### 5.5 Multi-Broker Order Routing

**File:** `src/utils/rebalanceHelpers.js` → `buildBrokerPayloadFields()`

```
Frontend                          Python Backend
────────                          ──────────────
buildBrokerPayloadFields()        1. Extract auth_params from request
  ↓                               2. Fetch DB credentials via ProcessTradesDbManager
Encrypt sensitive fields           3. If DB creds exist AND no fresh frontend token → use DB
(AES for ICICI, Upstox, etc.)     4. Else → use frontend tokens
  ↓                               5. Normalize to BrokerFactory fields
Send to API endpoint               6. Create Rebalancing instance → execute
```

### 5.6 Corporate Action Handling

Backend handles during rebalance calculation:

| CA Type | Handler | Logic |
|---------|---------|-------|
| Stock Split | `_handle_split()` | Adjust quantity by ratio, recalculate avg price |
| Demerger | `_handle_demerger_new_stock()` | Add new security with adjusted quantity |
| Merger | `_handle_merger_conversion()` | Convert old shares to merged entity |
| Rights Issue | `_handle_rights_issue()` | Add new shares from entitlement |
| Buyback | `_handle_buyback()` | Reduce quantity for bought-back shares |

### 5.7 Payment Integration (Mobile-Specific)

```
Payment Gateways:
    ├── Razorpay:  RazorpayCheckout native module
    ├── Cashfree:  CFPaymentGatewayService + CFDropCheckoutPayment
    └── PayU:      PayUService + PayUSIPayment (recurring/SIP)

Payment Recovery (PendingPaymentManager.js):
    ├── savePendingPayment(): Stores incomplete state to AsyncStorage
    ├── checkAndRecoverPendingPayment(): Auto-resumes on app reopen
    └── Tracks PaymentType enum: 'RAZORPAY', 'CASHFREE', 'PAYU'
```

### 5.8 Digital Signature — Digio (Mobile-Specific)

```
Configurable via: configData.digioCheck
    ├── 'beforePayment': Sign before payment step
    └── 'afterPayment':  Sign after payment step

Authentication Methods:
    ├── Aadhaar-based (preferred if aadhaarBasedAuthentication = true)
    └── OTP-based fallback (otpBasedAuthentication = true)

Process:
    1. Create document + access token via API
    2. Open Digio gateway in modal
    3. Poll document status for completion
    4. Download signed PDF on success
    5. Update user digio_verification flag
```

---

## 6. Broker Data Management

### 6.1 Holdings Fetching

**File:** `src/services/BrokerOrderBookAPI.js`

```
fetchOrderBook(broker, credentials, configData):
    │
    ├── Builds broker-specific request payload
    │     buildOrderBookPayload(broker, credentials, configData)
    │
    ├── Calls broker API via ccxtServer
    │
    ├── Normalizes response to common format:
    │     { orderId, symbol, exchange, transactionType, quantity,
    │       filledQuantity, pendingQuantity, price, orderType,
    │       status, normalizedStatus, placedAt, variety }
    │
    └── Detects TOKEN_EXPIRED → returns { success: false, tokenExpired: true }

Supported operations:
    fetchOrderBook()     → All orders
    fetchPendingOrders() → Pending only
    getOrderStatus()     → Single order by ID
    cancelOrder()        → Cancel order
    modifyOrder()        → Modify price/qty (AliceBlue, Angel One, Zerodha, Upstox, Dhan, Kotak)
```

### 6.2 Holdings Aggregation

Via MultiBrokerContext:

```
For each connected broker:
    1. Fetch holdings from broker API
    2. Store in brokerHoldings[broker]
    3. Aggregate across all brokers into aggregatedHoldings

Metrics calculated:
    getTotalValue() → Σ(ltp × quantity) across all brokers
    getTotalPnL()   → Σ((ltp - avgPrice) × quantity) across all brokers
```

### 6.3 Funds Fetching

```
fetchFunds(broker, clientCode, apiKey, jwtToken, ...):
    │
    │  Returns: { status: 0|1|2, data: { availablecash } }
    │    status 0: Success
    │    status 1: Token expired
    │    status 2: Backend error
    │
    └── Check: isFundsErrorOrMissing(funds, brokerStatus)
              Returns: { isError, reason }
```

### 6.4 Broker Capability Matrix

**File:** `src/utils/brokerSupport.js`

```
BROKER_SUPPORT = {
  Zerodha:    { MARKET, LIMIT, SL, SL_M, GTT, GTT_OCO: all true },
  Upstox:     { MARKET, LIMIT, SL, SL_M, GTT, GTT_OCO: all true },
  AngelOne:   { MARKET, LIMIT, SL: true; GTT: single-leg only, no OCO },
  Dhan:       { MARKET, LIMIT, SL, GTT: true; no SL_M, no OCO },
  Fyers:      { MARKET, LIMIT, SL, SL_M, GTT, GTT_OCO: all true },
  ICICI:      { MARKET, LIMIT, SL, GTT: true; no SL_M, no OCO },
  Groww:      { MARKET, LIMIT, SL, GTT: true; no SL_M, no OCO },
  Kotak:      { MARKET, LIMIT, SL: true; no GTT },
  HDFC:       { MARKET, LIMIT, SL: true; no GTT },
  IIFL:       { MARKET, LIMIT, SL: true; no GTT },
  AliceBlue:  { MARKET, LIMIT, SL: true; no GTT },
  MotilalOswal: { MARKET, LIMIT, SL: true; no GTT },
}

Key exports:
  isOrderTypeSupported(broker, orderType) → boolean
  isFeatureSupported(broker, feature) → boolean
  getGTTSupportedBrokers() → string[]
  validateOrderConfig(order, broker) → { errors, warnings }
```

---

## 7. State Management

### 7.1 Architecture Overview

```
┌───────────────────────────────────────────────────────────┐
│                    State Management Layers                  │
│                                                            │
│  ┌──────────────────────┐  ┌───────────────────────────┐  │
│  │ React Context         │  │ AsyncStorage (Persistent)  │  │
│  │                       │  │                            │  │
│  │ TradeContext          │  │ @app:raId                  │  │
│  │   - recommendations   │  │ @app:userData              │  │
│  │   - holdings          │  │ @app:advisorConfig         │  │
│  │   - broker status     │  │ cartItems                  │  │
│  │   - config data       │  │ brokerSession:{broker}     │  │
│  │                       │  │ @broker:oauthState:{broker}│  │
│  │ ConfigContext         │  │ pendingPayment             │  │
│  │   - app config        │  │                            │  │
│  │   - feature flags     │  └───────────────────────────┘  │
│  │   - payment config    │                                 │
│  │   - theme/branding    │  ┌───────────────────────────┐  │
│  │                       │  │ Event System               │  │
│  │ MultiBrokerContext    │  │                            │  │
│  │   - multi-broker data │  │ portfolioEvents            │  │
│  │   - aggregated P&L    │  │   HOLDINGS_REFRESH         │  │
│  │                       │  │   REBALANCE_EXECUTED        │  │
│  │ GstConfigContext      │  │   DISTRIBUTION_REFRESH      │  │
│  │   - GST settings      │  │   BROKER_CONNECTED          │  │
│  └──────────────────────┘  │   ORDER_PLACED               │  │
│                             └───────────────────────────┘  │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ WebSocket (Real-time)                                 │  │
│  │   - Live price feeds                                  │  │
│  │   - Symbol subscriptions                              │  │
│  │   - Server: wss://websocket.alphaquark.in             │  │
│  └──────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────┘
```

### 7.2 Provider Hierarchy

```
<ConfigProvider>
  <GstConfigProvider>
    <MultiBrokerProvider>
      <TradeProvider>
        <NavigationContainer>
          <App />
        </NavigationContainer>
      </TradeProvider>
    </MultiBrokerProvider>
  </GstConfigProvider>
</ConfigProvider>
```

### 7.3 Event System

**File:** `src/utils/portfolioEvents.js`

```javascript
PORTFOLIO_EVENTS = {
  HOLDINGS_REFRESH: "HOLDINGS_REFRESH",
  REBALANCE_EXECUTED: "REBALANCE_EXECUTED",
  DISTRIBUTION_REFRESH: "DISTRIBUTION_REFRESH",
  BROKER_CONNECTED: "BROKER_CONNECTED",
  BROKER_DISCONNECTED: "BROKER_DISCONNECTED",
  ORDER_PLACED: "ORDER_PLACED",
  ORDER_STATUS_UPDATED: "ORDER_STATUS_UPDATED",
}

// Subscribe
const unsub = portfolioEvents.on(PORTFOLIO_EVENTS.HOLDINGS_REFRESH, (data) => {
  refetchHoldings();
});

// Emit after rebalance execution
portfolioEvents.emit(PORTFOLIO_EVENTS.HOLDINGS_REFRESH, { userEmail, modelName });

// Cleanup
unsub();
```

---

## 8. File Reference

### 8.1 Utilities (`src/utils/`)

| File | Purpose | Lines |
|------|---------|-------|
| `brokerSessionUtils.js` | Broker session validation, token freshness | 112 |
| `brokerSupport.js` | Broker capability matrix, order validation | 614 |
| `brokerAuth.js` | OAuth state/nonce management, callback handling | ~230 |
| `brokerPublisher.js` | Publisher SDK utilities (Kite, Fyers) | ~180 |
| `ProcessTrades.js` | Centralized order placement pipeline | ~280 |
| `rebalanceHelpers.js` | Rebalance error detection, broker payload builder | ~210 |
| `tradeUtils.js` | Trade data standardization | 36 |
| `orderStatusUtils.js` | Order status normalization | 82 |
| `portfolioEvents.js` | Structured event emitter | ~75 |
| `SecurityTokenManager.js` | JWT token generation | 133 |
| `storageUtils.js` | AsyncStorage wrapper with retry | 708 |
| `serverConfig.js` | Server endpoints | 24 |
| `Config.js` | App variant configuration | 68 |
| `isMarketHours.js` | Market hours check (9:15 AM - 3:30 PM IST) | — |
| `gstHelpers.js` | GST calculation utilities | — |
| `cryptoUtils.js` | AES encryption/decryption | — |
| `websocketInitializer.js` | WebSocket connection setup | — |

### 8.2 Services (`src/services/`)

| File | Purpose |
|------|---------|
| `BrokerOrderBookAPI.js` | Unified order book API across all brokers (782 lines) |
| `ReconciliationService.js` | Pending order conflict detection |
| `GstConfigService.js` | GST configuration fetcher |
| `ZerodhaOAuthService.js` | Zerodha OAuth flow management |

### 8.3 Contexts (`src/context/`)

| File | Purpose |
|------|---------|
| `ConfigContext.js` | App-wide configuration (288 lines) |
| `GstConfigContext.js` | GST settings (72 lines) |
| `MultiBrokerContext.js` | Multi-broker portfolio state |

### 8.4 Key Components

| Component | File | Purpose |
|-----------|------|---------|
| StockAdvices | `src/components/AdviceScreenComponents/StockAdvices.js` | Recommendation display (99.5 KB) |
| AddtoCartModal | `src/components/AdviceScreenComponents/AddtoCartModal.js` | Cart-based selection (49.1 KB) |
| ReviewTradeModal | `src/components/ReviewTradeModal.js` | Generic order review (48.8 KB) |
| ReviewZerodhaTradeModal | `src/components/ReviewZerodhaTradeModal.js` | Zerodha-specific review (47.0 KB) |
| IIFLReviewTradeModal | `src/components/IIFLReviewTradeModal.js` | IIFL-specific review (13.6 KB) |
| DdpiModal | `src/components/DdpiModal.js` | DDPI authorization (66.0 KB) |
| MPInvestNowModal | `src/components/ModelPortfolioComponents/MPInvestNowModal.js` | Investment flow (134 KB) |
| MPStatusModal | `src/components/AdviceScreenComponents/MPStatusModal.js` | Execution tracking (66.3 KB) |
| MPCard | `src/components/ModelPortfolioComponents/MPCard.js` | Portfolio display (20.9 KB) |
| KitePublisherModal | `src/components/KitePublisherModal.js` | Zerodha Publisher WebView |
| BrokerConnectionModal/ | `src/components/BrokerConnectionModal/` | 15 broker connection modals |
| ManageConnectionsModal | `src/screens/Home/ManageConnectionsModal.js` | Broker management |

### 8.5 Screens

| Screen | File |
|--------|------|
| Home | `src/screens/Home/HomeScreen.js` |
| Orders | `src/screens/Home/OrderScreen.js` |
| Watchlist | `src/screens/Home/WatchlistScreen.js` |
| Model Portfolio | `src/screens/Drawer/ModelPortfolioScreen.js` |
| MP Performance | `src/screens/Drawer/MPPerformanceScreen.js` |
| Portfolio | `src/screens/PortfolioScreen/` |
| Authentication | `src/screens/Authentication/` |

---

## 9. Web Parity Status

### Features Consistent with Web

| Feature | Status | Notes |
|---------|--------|-------|
| 14 broker support | Done | All brokers supported |
| OAuth authentication | Done | Via WebView (web uses redirect) |
| Credential encryption (AES-256-CBC) | Done | Same algorithm |
| Order status normalization | Done | Same canonical values |
| Broker capability matrix | Done | Comprehensive support matrix |
| GTT order support | Done | Zerodha, Upstox |
| EDIS/DDPI/TPIN authorization | Done | Per-broker auth modals |
| Rebalance calculation | Done | Same backend API |
| Publisher SDK (Zerodha) | Done | Via WebView postMessage |
| Recommendation lifecycle | Done | Same backend flow |
| Multi-broker context | Done | New: `MultiBrokerContext.js` |
| Centralized trade processing | Done | New: `ProcessTrades.js` |
| OAuth state management | Done | New: `brokerAuth.js` |
| Rebalance helpers | Done | New: `rebalanceHelpers.js` |
| Portfolio event system | Done | New: `portfolioEvents.js` |
| Publisher SDK utilities | Done | New: `brokerPublisher.js` |
| Reconciliation service | Done | Pending order conflict detection |

### Mobile-Specific Enhancements (Kept)

| Feature | File | Reason Kept |
|---------|------|-------------|
| Slide-to-execute | ReviewTradeModal.js | Better mobile UX, prevents accidental taps |
| Surveillance on modal open | ReviewTradeModal.js, MPReviewTradeModal.js | Same as prod: triggered when review modal opens, shows non-blocking warning |
| Fix Size algorithm | ReviewTradeModal.js | Proportional allocation useful on mobile |
| Payment integration | MPInvestNowModal.js | Mobile payment gateways (Razorpay, Cashfree, PayU) |
| Digio signatures | MPInvestNowModal.js | Mobile-native digital signing |
| Pending payment recovery | PendingPaymentManager.js | Handles app backgrounding/crashes |
| GST handling | GstConfigContext.js | Dynamic GST calculation |
| Coupon codes | MPInvestNowModal.js | Discount application |
| Step-by-step modals | MPInvestNowModal.js | Better mobile navigation |
| Failed order confirmation | MPStatusModal.js | Explicit user consent per failed stock |
| AsyncStorage persistence | storageUtils.js | Mobile offline support |

### Integration Guide

To adopt the new utilities in existing components:

```javascript
// 1. Wrap app with MultiBrokerProvider
import { MultiBrokerProvider } from './context/MultiBrokerContext';
// Add to provider hierarchy (see Section 7.2)

// 2. Use portfolio events instead of generic EventEmitter
import portfolioEvents, { PORTFOLIO_EVENTS } from './utils/portfolioEvents';
portfolioEvents.emit(PORTFOLIO_EVENTS.HOLDINGS_REFRESH, { userEmail });

// 3. Use centralized ProcessTrades
import { createPlaceOrderFunction } from './utils/ProcessTrades';
const placeOrders = createPlaceOrderFunction({ broker, credentials, ... });
const result = await placeOrders(stockDetails);

// 4. Use rebalance helpers for payload building
import { buildBrokerPayloadFields, isFundsErrorOrMissing } from './utils/rebalanceHelpers';
const payload = buildBrokerPayloadFields(broker, creds, decrypt, angelKey);

// 5. Use brokerAuth for OAuth flows
import { generateState, saveOAuthState, validateOAuthState } from './utils/brokerAuth';
const state = generateState('zerodha', '/recommendation');

// 6. Use publisher utilities for SDK flows
import { isPublisherSupported, createBatches, convertToBasketItem } from './utils/brokerPublisher';
if (isPublisherSupported(broker)) { ... }
```

---

## 10. v5.3.0 Sync — Changes Since 2026-04-01

The 2026-04-20 sync pulled AlphaB2B v3.8.0 + v3.8.1 fixes and new features into this repo. Summary by area:

### 10.1 New utilities

| Module | Purpose |
|--------|---------|
| `src/utils/basketUtils.js` | F&O symbol parsing, lot-size helpers, `netBasketTrades()` with closure + rejected handling |
| `src/utils/rebalanceDiffUtils.js` | `computeRebalanceDiff`, `computeRowsDiff` (added/removed/increased/decreased between rebalances) |
| `src/utils/symbolNormalizer.js` | Normalize NSE/BSE symbols across broker quirks |
| `src/utils/marketDataLTP.js` | Unified LTP resolution across WebSocket + cache + snapshot |
| `src/utils/brokerPublisher.js` | Kite / Fyers publisher SDK batch construction |
| `src/utils/formatCurrency.js` | INR formatter (web parity) |
| `src/config/brokerRegistry.js` | Broker metadata (logos, display names, broker constants) |

### 10.2 New contexts

| Context | Purpose |
|---------|---------|
| `src/context/MultiBrokerContext.js` | Per-broker holdings / funds / status map |
| `src/context/MarketDataContext.js` | Real-time market data subscriptions |

### 10.3 New hooks

| Hook | Purpose |
|------|---------|
| `src/hooks/useMultiBrokerHoldings.js` | Aggregated holdings across connected brokers |
| `src/hooks/useSymbolSearch.js` | Broker-aware symbol search |

### 10.4 New screens & flows

| Area | Files |
|------|-------|
| `src/screens/Broker/` | `BrokerAuthScreen`, `BrokerCredentialScreen`, `BrokerSelectionScreen` — modal-free broker connect |
| `src/screens/Invest/` | `InvestFlowScreen` — amount-first investment flow |
| `src/screens/Rebalance/` | `CurrentHoldingsScreen`, `ExecutionStatusScreen`, `RebalanceReviewScreen` — full-screen rebalance path |
| `src/screens/Home/TradePnLScreen.js` | Per-trade P&L detail |

### 10.5 New services

| Service | Purpose |
|---------|---------|
| `src/services/ModelPortfolioService.js` | MP list / details / perf API wrapper |
| `src/services/OrderService.js` | Order-list / order-detail API wrapper (complements `BrokerOrderBookAPI`) |

### 10.6 New components

| Component | Purpose |
|-----------|---------|
| `BrokerConnectionModal/AxisConnectModal.js` | Axis Securities SSO modal (full 14-broker support) |
| `BrokerConnectionModal/EgressIpCallout.js` | ICICI / Breeze egress-IP whitelist guidance |
| `UIComponents/BrokerConnectionUI/DhanOAuthUI.js` | Dhan partner-OAuth UI shell |
| `components/GttDetailsModal.js` + `GttSuccessModal.js` | GTT order details + success state |
| `components/ManualSellModal.js` | Manual-sell entry for closure positions |
| `components/ReviewBrokerRecordsModal.js` | Show broker-side records for reconciliation |
| `components/FloatingAcceptRebalanceButton.js` | Bottom-floating CTA in rebalance scene |

### 10.7 Cart / Trade-intent state separation (Option B)

Pre-5.3.0, `stockDetails` was used as both cart state AND trade-intent state — causing "Trade Now" on a single card to leak the full cart into the review modal. v5.3.0 splits them cleanly:

- **`cartContainer`** — the cart. Written by `updateCartStates()`. Read by bottom-bar counter, Select-All, etc.
- **`stockDetails`** — the trade-intent payload. Written only at trade-intent boundaries (single "Trade Now" or bottom-bar "Trade (N)"). Read by `ReviewTradeModal`.

`syncCartWithStockDetails` effect no longer writes `stockDetails`; it populates `cartContainer` + `stocksWithoutSource` on mount/tab-change. `stockDetails` stays empty until the user triggers a trade-intent action. Mirrors web `NewStockCard.js:561-587` + `StockRecommendation.js:544`.

### 10.8 Session-expiry reconnect (UX)

`src/screens/Home/ManageConnectionsModal.js` now surfaces an amber "Session Expired" badge next to any broker with `connected_brokers[].status === 'expired' | 'error'`. Reconnect button dispatches directly to the per-broker modal via `ModalManager` — no picker detour. `BROKER_MODAL_KEY_MAP` translates backend broker names to ModalManager switch keys (`ICICI Direct → ICICI`, `Hdfc Securities → HDFC`, etc.). All 13 OAuth brokers now route through `ModalManager`.

`TokenExpireBrokerModal` now lists Axis Securities in its `OAUTH_BROKERS` set — prior versions left Axis users stuck with a blank modal.

### 10.9 ProcessTrades web-parity fixes

- **GTT payload** — per-trade leg structure (`Symbol` → `tradingSymbol`, etc.); legs live inside trade objects, not at payload top level
- **Case-insensitive rejection detection** — `REJECTED_ORDER_STATUSES` set covers 9 variants (`REJECTED`/`Rejected`/`rejected`, `CANCELLED`/…, `FAILURE`/…)
- **HTTP 401/403 detection** — `err.sessionExpired = true` routes through `onSessionExpired` callback (matches web's axios error handling)
- **TPIN modal keyword filter dropped** — `detectEdisFailures` now returns every rejected SELL regardless of message text (web parity)
- **Kotak / Motilal / AliceBlue credentials** — `consumerKey`/`consumerSecret`/`apiKey` now AES-decrypted on the way out

### 10.10 RGX-specific preservations

The sync preserved every existing RGX divergence:

- `'common'` / `'prod'` fallbacks in `X-Advisor-Subdomain` headers → replaced with `getAdvisorSubdomain()` (resolves to `rgxresearch`)
- WebSocket URLs remain `server.ccxtWs.*` / `server.brokerAuth.*` (centralized in `serverConfig.js`)
- Advisor tag remains dynamic `REACT_APP_ADVISOR_SPECIFIC_TAG` (not hardcoded `ARFS`)
- UI colors sourced from `Config.js` `rgxresearch` variant (red basket, blue theme) — not alphab2b's purple
- `storageUtils.js` 3-key schema retained
- Deep-link scheme stays `rgxapp://`
- Broker redirect URL stays `https://equitypro.co.in/stock-recommendation` via env var

### 10.11 Breaking change — ICICI Option B

Existing ICICI users on this app must update the Redirect URL in their ICICI dev dashboard from the mobile app URL to `https://ccxt.alphaquark.in/icici/auth-callback/rgxresearch` before they can reconnect. If they land on the legacy URL, the modal surfaces a guided error with the correct URL. See `docs/BROKER_CONNECTION.md#icici-direct--option-b-migration-breaking-v530`.
