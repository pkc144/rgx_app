# Rebalancing Architecture

> **Last updated**: 2026-03-31

## Overview

Rebalancing allows model portfolio subscribers to realign their holdings with the advisor's target allocation. The flow involves:

1. Fetching current holdings from the connected broker
2. Calling the rebalance/calculate API to get buy/sell trades
3. Reviewing trades in a modal
4. Executing trades via the broker

## End-to-End Flow

```
User navigates to Model Portfolio screen
    │
    ▼
RebalanceAdvices.js renders rebalance cards
    │  Displays pending rebalance signals
    │
    ▼
User taps "Rebalance" → RebalanceModal.js opens
    │
    ▼
Fetches current holdings from broker API
    │  fetchBrokerSpecificHoldings(broker, credentials)
    │
    ▼
Calls rebalance/calculate API
    │  POST /api/model-portfolio/rebalance/calculate
    │  Body: { broker payload fields + portfolio info }
    │
    ▼
API returns buy/sell trades
    │  Displays in review UI
    │
    ▼
User confirms → ProcessTrades.js executes orders
    │  Routes to broker-specific order endpoints
    │
    ▼
Order results displayed → portfolio refreshed
```

## Key Files

| File | Purpose |
|------|---------|
| `src/components/AdviceScreenComponents/RebalanceAdvices.js` | Rebalance card list, initiates rebalance flow |
| `src/components/AdviceScreenComponents/RebalanceModal.js` | Rebalance review modal, broker payload building |
| `src/utils/rebalanceHelpers.js` | Pure helper functions (payload building, error detection, decryption) |
| `src/utils/ProcessTrades.js` | Trade execution across all brokers |
| `src/services/BrokerOrderBookAPI.js` | Order book fetching |

## Broker Payload Building

The `buildBrokerPayloadFields()` function in `rebalanceHelpers.js` builds broker-specific API payloads:

```javascript
buildBrokerPayloadFields(broker, credentials, decryptFn, angelOneApiKey)
```

### Per-Broker Payload Fields

| Broker | Fields |
|--------|--------|
| Zerodha | `accessToken` (jwtToken) |
| Angel One | `apiKey` (from config), `jwtToken` |
| Upstox | `apiKey` (decrypted), `apiSecret` (decrypted), `accessToken` |
| ICICI Direct | `apiKey` (decrypted), `secretKey` (decrypted), `accessToken` |
| Dhan | `clientId`, `accessToken` |
| Kotak | `consumerKey` (decrypted), `consumerSecret` (decrypted), `accessToken`, `viewToken`, `sid`, `serverId` |
| Hdfc Securities | `apiKey` (decrypted), `accessToken` |
| IIFL Securities | `clientCode` |
| AliceBlue | `clientId`, `accessToken`, `apiKey` |
| Fyers | `clientId`, `accessToken` |
| Motilal Oswal | `clientCode`, `accessToken`, `apiKey` (decrypted) |
| Groww | `accessToken` |
| Axis Securities | `accessToken` |

## Decryption

Broker API keys are stored encrypted. The `defaultDecrypt` function in `rebalanceHelpers.js` handles decryption:

```javascript
export function defaultDecrypt(value) {
  if (!value) return value;
  try {
    const bytes = CryptoJS.AES.decrypt(value, 'ApiKeySecret');
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    return decrypted || value;  // Fallback to original if empty
  } catch {
    return value;  // Fallback on error
  }
}
```

**Important**: All components must use `defaultDecrypt` from `rebalanceHelpers.js` — never use local decryption functions without try-catch and fallback logic. This was a bug fixed on 2026-03-31.

## Error Detection Helpers

`rebalanceHelpers.js` provides granular error detection:

| Function | Detects |
|----------|---------|
| `isFundsErrorOrMissing(funds, status)` | Missing/error fund data while broker is connected |
| `isRebalanceErrorResponse(data)` | Backend error in rebalance API response |
| `isSubscriptionAmountError(msg)` | Missing subscription amount |
| `isLowAllowedBalanceError(msg)` | Insufficient balance |
| `checkPortfolioShortfall(data)` | Portfolio value below required minimum |
| `isBrokerAuthError(msg)` | Expired/invalid broker tokens |

## Parity with Web App

The rebalancing flow in this mobile app mirrors `prod-alphaquark-github`:
- Same `buildBrokerPayloadFields()` function
- Same `rebalanceHelpers.js` utilities
- Same backend API endpoints
- Same decryption logic (`defaultDecrypt`)

Differences:
- Mobile uses React Native modals, web uses React modals
- Mobile uses `react-native-toast-message`, web uses `react-hot-toast`
- Mobile fetches holdings via `fetchBrokerSpecificHoldings`, web may have different fetch patterns
