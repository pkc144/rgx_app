# Broker Connection Architecture

> **Last updated**: 2026-03-31

## Overview

The app supports 14 stock brokers with two authentication patterns:

1. **OAuth-based** (WebView): Zerodha, Upstox, Fyers, Groww, Axis, Motilal Oswal, ICICI Direct
2. **Credential-based** (Form): Angel One, AliceBlue, Dhan, IIFL Securities, Hdfc Securities, Kotak

## Authentication Flows

### OAuth Flow (Mobile-Specific)

Unlike the web app which uses browser redirects, the mobile app uses **in-app WebView** for OAuth:

```
User taps "Connect" for OAuth broker
    │
    ▼
BrokerConnectionModal/<BrokerName>Modal.js
    │  Sends API key/secret to Node.js backend
    │  PUT /api/zerodha/update-key (or broker-specific endpoint)
    │
    ▼
Backend calls Python: POST /{broker}/login-url
    │  Returns OAuth URL
    │
    ▼
WebView opens with OAuth URL
    │  handleWebViewNavigationStateChange() monitors URL
    │  Intercepts redirect URL containing auth_code/request_token
    │
    ▼
Frontend extracts token from URL query params
    │  POST /{broker}/gen-access-token
    │
    ▼
Token stored → broker status → "connected"
    brokerSessionUtils.saveBrokerSessionTime(broker)
```

### Credential Flow

```
User fills credentials form
    │
    ▼
PUT /api/user/connect-broker
    { broker, clientCode, jwtToken/apiKey/secretKey, ... }
    │
    ▼
Backend validates with Python, stores encrypted credentials
    │
    ▼
Returns success → Toast → Context updated
```

## Per-Broker Details

| Broker | Auth | Credentials | Token Expiry | WebView | Special Notes |
|--------|------|-------------|--------------|---------|---------------|
| Zerodha | OAuth | apiKey, secretKey | Daily ~6AM | Yes | Kite Publisher SDK, GTT/OCO support |
| Angel One | OAuth (nonce) | apiKey (from config) | ~24h | Yes | Surveillance check, EDIS/TPIN |
| Upstox | OAuth PKCE | apiKey, secretKey | ~24h | Yes | GTT, OCO support |
| ICICI Direct | OAuth | apiKey, secretKey | Session | Yes | Manual mandate for SELLs |
| Kotak | Credential | mobile, mpin, totp | ~1h | No | TOTP required on every reconnect |
| Dhan | Credential | clientCode, jwtToken | Session | No | DDPI/TPIN for sells |
| Fyers | OAuth | clientCode, secretKey | Session | Yes | Publisher SDK, TPIN |
| Groww | OAuth PKCE | None | Session | Yes | Max 5 connections |
| AliceBlue | Credential | clientCode, apiKey | 24h | No | Daily API key regeneration |
| Motilal Oswal | OAuth | clientCode, apiKey | Session | Yes | — |
| Axis Securities | OAuth | None | Session | Yes | — |
| Hdfc Securities | Credential | accessToken | Session | No | — |
| IIFL Securities | Credential | clientCode, jwtToken | Session | No | — |
| DummyBroker | None | None | Never | No | Simulation only |

## Key Files

| File | Purpose |
|------|---------|
| `src/utils/brokerAuth.js` | OAuth state generation, callback registration |
| `src/utils/brokerSupport.js` | Per-broker feature matrix (order types, GTT, OCO) |
| `src/utils/brokerPublisher.js` | Kite/Fyers publisher SDK integration |
| `src/context/MultiBrokerContext.js` | Multi-broker state (holdings, funds, errors) |
| `src/components/BrokerConnectionModal/` | 15 per-broker auth modal components |

## Credential Encryption

Broker API keys and secrets are encrypted using AES with the key `ApiKeySecret`:

```javascript
// Encrypt (before storing)
CryptoJS.AES.encrypt(value, 'ApiKeySecret').toString()

// Decrypt (before using in API calls)
function defaultDecrypt(value) {
  if (!value) return value;
  try {
    const bytes = CryptoJS.AES.decrypt(value, 'ApiKeySecret');
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    return decrypted || value;  // Falls back to original if decryption fails
  } catch {
    return value;
  }
}
```

## WebView Differences from Web App

The web app (`prod-alphaquark-github`) uses browser-based OAuth redirects:
- Redirect URL: `https://prod.alphaquark.in/stock-recommendation` (or custom domain)
- Uses `window.location.origin` for state generation

The mobile app uses WebView with URL interception:
- Redirect URL configured in `.env` as `REACT_APP_BROKER_CONNECT_REDIRECT_URL`
- WebView `onNavigationStateChange` monitors for redirect
- Some brokers may need different redirect URLs than web

**Important**: Ensure `REACT_APP_BROKER_CONNECT_REDIRECT_URL` in `.env` matches what's configured in each broker's API dashboard.
