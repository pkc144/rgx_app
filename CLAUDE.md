# CLAUDE.md — RGX Research Mobile App (EquityPro)

## Project Overview

This is the **RGX Research Mobile App (EquityPro)** — a React Native application enabling advisory clients to connect stock brokers, receive trade recommendations, subscribe to model portfolios, and execute rebalance trades. It shares the same backend as the AlphaQuark B2B app (`../Alphab2bapp`) but operates under the `rgxresearch` subdomain for data isolation.

## Architecture Documentation

All architecture docs are in the `docs/` folder:

| Document | Purpose |
|----------|---------|
| [APP_ARCHITECTURE.md](docs/APP_ARCHITECTURE.md) | System architecture, broker flows, trade execution, state management |
| [BROKER_CONNECTION.md](docs/BROKER_CONNECTION.md) | Per-broker auth details, WebView OAuth, credential flows |
| [REBALANCING.md](docs/REBALANCING.md) | Rebalancing flow, decryption, broker payload building |
| [MODEL_PORTFOLIO.md](docs/MODEL_PORTFOLIO.md) | Model portfolio subscription, basket execution, review trade flow |
| [CHANGELOG.md](docs/CHANGELOG.md) | All changes, fixes, and updates with dates |

## Key Directories

```
src/
├── components/
│   ├── AdviceScreenComponents/   # Trade advices, rebalancing UI (21 files)
│   ├── BrokerConnectionModal/    # Per-broker auth modals (15 files)
│   ├── ModelPortfolioComponents/ # MP subscription, review trade (15 files)
│   ├── HomeScreenComponents/    # Home screen widgets, Knowledge Hub
│   ├── CustomHomeTabs/          # Custom tab components
│   ├── Navigation.js            # React Navigation setup (Stack/Tab/Drawer)
│   ├── AppProvider.js           # Global context providers wrapper
│   └── ReviewTradeModal.js      # Trade review modal
├── screens/
│   ├── Authentication/          # Login, Signup, Reset Password, RA Details (8 files)
│   ├── Home/                    # HomeScreen, OrderScreen, Watchlist, Advice (31 files)
│   ├── PortfolioScreen/         # Portfolio holdings view (6 files)
│   ├── Drawer/                  # Model Portfolio, MP Performance, Settings (19 files)
│   ├── OrderManagement/         # PlaceOrdersScreen
│   ├── AccountSettingScreen/    # Account settings
│   └── TradeContext.js          # CORE CONTEXT — 40+ exports
├── context/
│   ├── ConfigContext.js         # App config from API + static variants
│   └── GstConfigContext.js      # GST configuration
├── utils/
│   ├── rebalanceHelpers.js      # Rebalance logic, broker payload, decryption
│   ├── brokerAuth.js            # OAuth state, callback registration (uses serverConfig)
│   ├── brokerSupport.js         # Per-broker feature matrix (GTT, OCO, etc.)
│   ├── brokerSessionUtils.js    # Token expiry validation
│   ├── SecurityTokenManager.js  # AQ encrypted key generation (JWT, 15s expiry)
│   ├── Config.js                # Static app variant definitions (5 variants)
│   ├── variantHelper.js         # Subdomain resolution (defaults to 'rgxresearch')
│   ├── safeConfig.js            # Environment variable wrapper
│   ├── serverConfig.js          # Centralized server URLs (ccxt, ccxtWs, brokerAuth)
│   ├── storageUtils.js          # AsyncStorage wrappers (3 keys)
│   ├── portfolioEvents.js       # EventEmitter for cross-component communication
│   ├── orderStatusUtils.js      # Order status mapping
│   └── formatCurrency.js        # INR currency formatting
├── FunctionCall/
│   ├── ProcessTrades.js         # Trade execution across all brokers
│   ├── fetchFunds.js            # Broker cash balance
│   ├── fetchBrokerAllHoldings.js    # Multi-broker aggregated holdings
│   ├── fetchBrokerSpecificHoldings.js # Single broker holdings
│   ├── PaymentHandle.js         # Razorpay/Cashfree/PayU
│   └── useWebSocketCurrentPrice.js  # Real-time price hook
├── services/
│   ├── BrokerOrderBookAPI.js    # Unified order book for all brokers
│   ├── orderService.js          # Order management
│   ├── ZerodhaOAuthService.js   # Zerodha OAuth
│   └── GstConfigService.js      # GST config
├── GlobalUIModals/              # Global modal management (Zustand store)
├── UIComponents/                # Reusable UI components
└── assets/                      # Images, fonts, logos
```

## Multi-Tenant Architecture

This app uses the same backend as alphab2b but with data isolation via subdomain:

| Setting | Value |
|---------|-------|
| `APP_VARIANT` | `rgxresearch` |
| `X-Advisor-Subdomain` header | `rgxresearch` |
| Backend DB collection | `rgxresearch` (separate from alphab2b's `prod`) |
| Advisor tag | `rgxresearch` |
| Deep link scheme | `rgxapp://` |
| Broker register origin | `https://rgxresearch.alphaquark.in` |

## Server Endpoints

| Server | URL | Purpose |
|--------|-----|---------|
| API Server | `https://server.alphaquark.in/` | Business logic, user management |
| CCXT Server | `https://ccxtprod.alphaquark.in/` | Broker APIs, order execution, rebalancing |
| WebSocket | `wss://ccxt.alphaquark.in` | Real-time price feeds (socket.io) |
| Broker Auth | `https://alphaquark.in/api/deploy/broker/` | OAuth callback registration |

**Important:** WebSocket endpoints (`/websocket/subscribe`, `/api/price/`) live on `ccxt.alphaquark.in`, NOT `ccxtprod.alphaquark.in`. REST APIs use `ccxtprod`.

## Supported Brokers (14)

Zerodha, Angel One, Upstox, ICICI Direct, Kotak, Dhan, Fyers, IIFL Securities (unavailable), AliceBlue, Motilal Oswal, Hdfc Securities, Groww, Axis Securities, DummyBroker (simulation)

## App Variants

| Variant | Subdomain | Package |
|---------|-----------|---------|
| `rgxresearch` (default) | `rgxresearch` | `com.rgx.aq` |
| `alphaquark` | `prod` | — |
| `magnus` | `magnus` | — |
| `arfs` | `arfs` | — |
| `zamzamcapital` | `zamzamcapital` | — |

## Build & Run

```bash
# Install dependencies
cd /Users/pratik/PycharmProjects/rgx_app && npm install

# Start Metro bundler
npx react-native start

# Run on Android emulator
cd android && ./gradlew app:installDebug

# Launch on device
adb shell monkey -p com.rgx.aq -c android.intent.category.LAUNCHER 1
```

## Environment Variables (.env)

```
APP_VARIANT=rgxresearch
REACT_APP_AQ_KEYS=<api-key>
REACT_APP_AQ_SECRET=<api-secret>
REACT_APP_HEADER_NAME=rgxresearch
REACT_APP_DEEP_LINK_SCHEME=rgxapp
```

## Relationship to AlphaB2B App (../Alphab2bapp)

Both apps share:
- Same backend APIs (server.alphaquark.in, ccxtprod.alphaquark.in)
- Same `rebalanceHelpers.js` functions (buildBrokerPayloadFields, decryption)
- Same `brokerSupport.js` feature matrix
- Same `portfolioEvents.js` event system
- Same DummyBroker 3-step execution flow

Key RGX-specific differences:
- `variantHelper.js` defaults to `'rgxresearch'` (not `'alphaquark'`)
- `serverConfig.js` has `ccxtWs` and `brokerAuth` centralized config
- `brokerAuth.js` uses `server.brokerAuth.*` URLs (not hardcoded)
- All `'common'` subdomain fallbacks replaced with `getAdvisorSubdomain()`
- More comprehensive EDIS/DDPI pre-order validation in MPReviewTradeModal
- Config-driven WebSocket URLs (not hardcoded)
- `storageUtils.js` simplified to 3 keys (vs alphab2b's 15+ legacy keys)

## Documentation Maintenance Rules

**IMPORTANT: These rules MUST be followed whenever code changes are made.**

### When to update architecture docs
- **Any change to broker connection flow** → update `docs/BROKER_CONNECTION.md`
- **Any change to rebalancing logic, broker payloads, or error helpers** → update `docs/REBALANCING.md`
- **Any change to model portfolio subscription, execution, or review flow** → update `docs/MODEL_PORTFOLIO.md`
- **Any change to system architecture, state management, navigation, or new screens/contexts** → update `docs/APP_ARCHITECTURE.md`
- **Every code change** → add entry to `docs/CHANGELOG.md` with date, category (Added/Changed/Fixed/Removed/Disabled), and description

### Changelog format
Every change must be logged in `docs/CHANGELOG.md` under the current version:
```markdown
## [version] - YYYY-MM-DD

### Fixed
- **Short title**: Description of what was broken and how it was fixed. Include file names.

### Changed
- **Short title**: What changed and why. Include file names.

### Added
- **Short title**: What was added. Include file names.
```

### When syncing from alphab2b
After syncing files from `../Alphab2bapp`:
1. Re-apply RGX subdomain fixes (`'common'` → `getAdvisorSubdomain()`)
2. Re-apply WebSocket URL fixes (hardcoded → `server.ccxtWs.*`)
3. Verify no hardcoded `alphaquark.in` URLs leaked in (except `serverConfig.js` and `HelpModal.js`)
4. Verify no hardcoded `ARFS` advisor references leaked in
5. Update `docs/CHANGELOG.md` with what was synced
6. Update relevant architecture docs if flows changed
