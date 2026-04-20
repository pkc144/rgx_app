# Broker Connection Architecture

> **Last updated**: 2026-04-20 (synced to AlphaB2B v3.8.1)

## Overview

The app supports 14 stock brokers. Every broker's connect flow is wired into a modal under `src/components/BrokerConnectionModal/` and dispatched through `src/GlobalUIModals/ModalManager.js`. From the user's point of view there are two visible patterns:

1. **OAuth partner flow** (WebView): Zerodha, Upstox, Fyers, Groww, Axis, Motilal Oswal, ICICI Direct, HDFC, AliceBlue, Angel One, Dhan
2. **Developer-credential form**: IIFL Securities, Kotak — plus the credential-collection step that precedes OAuth for some brokers (Zerodha, Upstox, Motilal, HDFC, ICICI)

Under the hood there are three request patterns:

1. **Advisor-shared app** (Zerodha, Angel One) — the advisor's Kite Connect / SmartAPI app key is baked into the build. User does OAuth against that app.
2. **Per-user app** (Upstox, ICICI, HDFC, Motilal) — user registers their own Breeze / Upstox / HDFC / Motilal app in the broker dev portal, pastes the apiKey + secretKey into the in-app form, and then OAuths.
3. **Partner OAuth, server-side exchange** (Angel One nonce flow, Dhan, Groww, AliceBlue, Axis) — app hits a CCXT endpoint which redirects to the broker's partner-login URL; broker redirects back to CCXT; CCXT redirects back to `REACT_APP_BROKER_CONNECT_REDIRECT_URL` with tokens, which the WebView intercepts.

## Multi-Tenant Redirect URL

All OAuth brokers that return to the app use `REACT_APP_BROKER_CONNECT_REDIRECT_URL` from `.env`:

| App | Redirect URL |
|-----|--------------|
| RGX (this app) | `https://equitypro.co.in/stock-recommendation` |
| AlphaB2B | `https://prod.alphaquark.in/stock-recommendation` |

**For every OAuth broker** (ICICI, Axis, Motilal, Upstox, AliceBlue, Fyers, HDFC) the modal reads this URL via `configData?.config?.REACT_APP_BROKER_CONNECT_REDIRECT_URL || Config.REACT_APP_BROKER_CONNECT_REDIRECT_URL`. Don't hardcode any redirect URL in a broker modal — always pass through the env var.

## CCXT Callback URLs (broker dashboard registration)

These are URLs the **user** registers in the broker's developer dashboard. They point at the shared CCXT infrastructure (`ccxt.alphaquark.in`) — same for RGX and AlphaB2B:

| Broker | CCXT callback URL (register in dev dashboard) |
|--------|-----------------------------------------------|
| ICICI Direct (Option B) | `https://ccxt.alphaquark.in/icici/auth-callback/rgxresearch` |
| Motilal Oswal | `https://ccxt.alphaquark.in/motilal-oswal/callback` |
| Zerodha | `https://ccxt.alphaquark.in/zerodha/callback` + `https://ccxt.alphaquark.in/zerodha/postback` |
| HDFC | Set by broker (server-side) |
| Upstox | Set per-user via `redirect_uri` in update-key payload |

## Authentication Flows

### OAuth via partner-login (Angel One, Dhan, Groww, AliceBlue, Axis)

```
User taps broker tile
    │
    ▼
Modal opens WebView at {ccxtServer}{broker}/login?origin=…&returnPath=…
    │  CCXT stamps origin in MongoDB, redirects to broker partner page
    ▼
User authenticates at broker
    │  Broker redirects to ${ccxtServer}{broker}/callback
    │  CCXT processes tokens, redirects to ${origin}${returnPath}
    ▼
WebView intercepts final redirect
    │  Extracts query params → PUT /api/user/connect-broker
    ▼
fetchBrokerStatusModal() + getUserDeatils() → broker = connected
```

### OAuth via per-user dev app (Upstox, ICICI, HDFC, Motilal)

```
User pastes apiKey + secretKey into form
    │
    ▼
POST / PUT /api/{broker}/update-key
    { uid, apiKey, secretKey, redirect_uri, user_broker }   ← user_broker added in v5.3.0
    │  Server validates credentials, returns OAuth login URL
    ▼
WebView opens login URL
    │
    ▼
Broker redirects with auth_code / requestToken / apisession
    │  (ICICI Option B: CCXT server-side handles this; WebView only sees final app URL)
    ▼
WebView intercepts redirect
    │  Mobile exchanges (or for ICICI, CCXT already did) → tokens returned
    ▼
PUT /api/user/connect-broker → broker = connected
```

### Credential Flow (IIFL, Kotak, legacy)

```
User fills credential form (mobile + mpin + totp, or clientCode + jwtToken)
    │
    ▼
PUT /api/user/connect-broker
    │  Backend validates, stores AES-encrypted creds
    ▼
Toast → context updated → connected_brokers[] entry created
```

## ICICI Direct — Option B Migration (BREAKING, v5.3.0)

The ICICI flow was refactored on 2026-04-17 to match web. The client-side chain has been removed; CCXT now handles the token exchange server-side.

**Old flow** (pre-5.3.0):
1. WebView intercepts `apisession=` in redirect
2. Mobile calls `ccxt/icici/customer-details` with apisession + creds
3. Mobile calls `PUT /api/user/connect-broker` with resulting tokens

**New flow** (5.3.0+):
1. User registers `https://ccxt.alphaquark.in/icici/auth-callback/rgxresearch` as Redirect URL in ICICI developer dashboard (not the mobile app URL!)
2. WebView waits for the **final** redirect back to `REACT_APP_BROKER_CONNECT_REDIRECT_URL`
3. CCXT's `/icici/auth-callback/{subdomain}` does the `customer-details` exchange + token persist server-side
4. Mobile simply refreshes broker status

**User migration**: existing ICICI users on RGX must update their dev-dashboard Redirect URL. If they land on the legacy URL with `apisession=` in the query string, the modal surfaces a guided error with the correct URL to register.

## Per-Broker Details

| Broker | Auth type | User creds needed | Token expiry | Key modal file |
|--------|-----------|-------------------|--------------|----------------|
| Zerodha | OAuth (advisor-shared Kite Connect app) | — | Daily ~06:00 IST | `ZerodhaConnectModal.js` |
| Angel One | OAuth (partner SmartAPI) | — | ~24h | `AngleoneBookingModal.js` |
| Upstox | OAuth (per-user app) | apiKey, secretKey | ~24h | `upstoxModal.js` |
| ICICI Direct | OAuth Option-B (per-user app + CCXT callback) | apiKey, secretKey | Session | `icicimodal.js` |
| Kotak | Credential | mobile, mpin, totp | ~1h | `KotakModal.js` |
| Dhan | OAuth partner | clientCode | Session | `DhanConnectModal.js` |
| Fyers | OAuth (per-user app) | clientCode, secretKey | Session | `FyersConnect.js` |
| Groww | OAuth partner | — | Session | `GrowwConnectModal.js` |
| AliceBlue | OAuth via CCXT origin-tracking | clientCode | 24h | `AliceBlueConnect.js` |
| Motilal Oswal | OAuth (per-user app) | clientCode, apiKey | Session | `MotilalModal.js` |
| Axis Securities | OAuth partner (client-side token exchange) | — | Session | `AxisConnectModal.js` |
| Hdfc Securities | OAuth (per-user app) | apiKey, secretKey | Session | `HDFCconnectModal.js` |
| IIFL Securities | Credential (backend gates availability) | clientCode, jwtToken | Session | `iiflmodal.js` |
| DummyBroker | None — simulation sentinel | — | Never | (no modal; set by "Continue without broker") |

## Payload Parity with Web (v5.3.0 additions)

These fields are now sent in update-key requests to match web:

| Broker | Endpoint | Field added |
|--------|----------|-------------|
| Motilal Oswal | `PUT /api/motilal-oswal/update-key` | `user_broker: 'Motilal Oswal'` |
| Upstox | `POST /api/upstox/update-key` | `user_broker: 'Upstox'` |
| HDFC Securities | `POST /api/hdfc/update-key` | `user_broker: 'Hdfc Securities'` |
| HDFC Securities | `POST ccxt/hdfc/access-token` | `user_email` |

## DummyBroker Flow

DummyBroker is a cross-platform sentinel (not mobile-only). It fires when the user picks "Continue without broker" or an advisor marks trades as `manually_placed`. Endpoint parity with web:

| Step | Endpoint | Purpose |
|------|----------|---------|
| 1 | `POST ccxt/rebalance/process-trade` | Build trade batch (DummyBroker payload) |
| 2 | `POST api/subscriber/subscriber-execution` | Record subscription execution |
| 3 | `POST api/subscriber/status-check-queue` | Enqueue post-trade status |

Retry-once-with-2s-delay and delayed refresh (2s + 5s) identical between mobile and web.

## Session-Expiry Reconnect (v5.3.0)

When a broker's token expires mid-flow (rebalance, MP execution, order placement), two UI paths handle the reconnect:

1. **Mid-trade modal** — `src/components/TokenExpireBrokerModal.js` fires automatically from `RebalanceAdvices.js` / `MPReviewTradeModal.js` when `isBrokerAuthError(message)` matches. Its OAUTH_BROKERS set includes all 10 partner-OAuth brokers (Zerodha, Angel One, Dhan, Fyers, Upstox, AliceBlue, Groww, Hdfc Securities, Motilal Oswal, Axis Securities).
2. **Manage Connections tile** — `ManageConnectionsModal.js` now surfaces an amber "Session Expired" badge next to any broker whose `connected_brokers[].status === 'expired'` or `'error'`. Tapping Reconnect dispatches directly to the per-broker modal via `ModalManager` (no picker detour).

Map from backend `connected_brokers[].broker` string → ModalManager switch key:

| Backend value | ModalManager key |
|---------------|------------------|
| `ICICI Direct` | `ICICI` |
| `Hdfc Securities` | `HDFC` |
| `Motilal Oswal` | `Motilal` |
| `IIFL Securities` | `IIFL` |
| `Axis Securities` | `Axis` |
| all others | same as name |

## Credential Encryption

Broker API keys and secrets are AES-encrypted with the key `ApiKeySecret` via `CryptoJS.AES.encrypt(value, 'ApiKeySecret')`. `defaultDecrypt` in `src/utils/rebalanceHelpers.js` is the canonical decrypt helper — falls back to the original value if decryption fails (so unencrypted legacy values still work).

## Key Files

| File | Purpose |
|------|---------|
| `src/utils/brokerAuth.js` | OAuth state generation, callback registration, deep-link scheme (`rgxapp://`) |
| `src/utils/brokerSupport.js` | Per-broker feature matrix (order types, GTT, OCO). IIFL marked `unavailable` |
| `src/utils/brokerPublisher.js` | Kite / Fyers publisher SDK integration (GTT basket submission) |
| `src/utils/brokerSessionUtils.js` | Token-expiry validation, session-time tracking |
| `src/context/MultiBrokerContext.js` | Multi-broker state (holdings, funds, connection status) |
| `src/config/brokerRegistry.js` | Broker metadata — logos, display names, broker-specific constants |
| `src/components/BrokerConnectionModal/` | 15 per-broker auth modals + AxisConnectModal (added v5.3.0) |
| `src/GlobalUIModals/ModalManager.js` | Dispatches `visibleModal` from Zustand store to per-broker modal |
| `src/components/TokenExpireBrokerModal.js` | Mid-trade reconnect modal (10 OAuth brokers) |
| `src/screens/Home/ManageConnectionsModal.js` | Tile UI + session-expiry badge + Reconnect routing |

## Relationship to AlphaB2B

Both apps share:
- Same backend (`server.alphaquark.in`, `ccxtprod.alphaquark.in`, `ccxt.alphaquark.in`)
- Same broker modal code paths
- Same `buildBrokerPayloadFields()` logic
- Same CCXT callback URLs (registered in broker dev dashboards)

RGX-specific divergences:
- `REACT_APP_BROKER_CONNECT_REDIRECT_URL` → `https://equitypro.co.in/stock-recommendation`
- `X-Advisor-Subdomain` header → `rgxresearch` (via `.env` + `getAdvisorSubdomain()` fallback)
- Data collection in MongoDB → separate `rgxresearch` namespace
- UI theme (colors, gradients) via `Config.js` variant config

Intentional mobile divergences from web:
- Zerodha — mobile uses advisor-shared Kite Connect app (env var), not per-user
- WebView instead of browser redirect
- IIFL Securities shipped on mobile; commented out on web's `AllBrokerList.js`
