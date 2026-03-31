# Changelog

All notable changes to the RGX Research Mobile App (EquityPro) are documented here.

---

## [5.2.2] - 2026-04-01

### Changed
- **DdpiModal.js synced from AlphaB2B**: Replaced entire file with B2B's more complete version. B2B has additional features including TPIN confirmation modal, DDPI activation flow with YouTube player, and multi-broker DDPI support (Zerodha, ICICI, Groww, Kotak, Dhan, Axis, HDFC). All 7 `X-Advisor-Subdomain` headers use full fallback chain (`configData?.config?.REACT_APP_HEADER_NAME || configData?.subdomain || getAdvisorSubdomain()`). Fixed one header that was missing the fallback (rebalance/calculate endpoint).
- **BrokerSelectionModal.js synced to AlphaB2B**: Copied RGX's BrokerSelectionModal.js to AlphaB2B (`Alphab2bapp/src/components/BrokerSelectionModal.js`). Features ported: `registerCallback()` for Angel One nonce-based OAuth fallback, "Broker Connected" / "Connecting..." / "Continue without connecting broker" tri-state buttons, "Can't Find Your Broker? Let Us Know" flow with broker search and unavailable broker save API, SEBI disclaimer text, and all associated styles.

---

## [5.2.1] - 2026-03-31

### Fixed
- **Multi-tenant DB isolation**: All `X-Advisor-Subdomain` headers now correctly use `rgxresearch` instead of `common`, `prod`, or hardcoded values. Data now routes to the correct MongoDB collection.
- **Hardcoded alphaquark URLs**: 9+ hardcoded `ccxt.alphaquark.in` / `ccxtprod.alphaquark.in` URLs moved to `serverConfig.js`. WebSocket endpoints correctly point to `ccxt.alphaquark.in`, REST APIs to `ccxtprod.alphaquark.in`.
- **Broker register origin**: Changed from `rgxapp://` (rejected by backend) to `https://rgxresearch.alphaquark.in`.
- **`alphab2b://` deep link**: PayUService.js and PayUWebView.js now use `rgxapp://` scheme.
- **`Config.REACT_APP_URL` as subdomain**: Fixed in `fetchAdmindata.js`, `ReviewTradeModal.js`, `WhatsAppAndEmailService.js` — was sending URL string instead of subdomain.
- **OneTimePaymentService.js syntax error**: `process.envREACT_APP_URL` (missing dot) → `process.env.REACT_APP_HEADER_NAME`.
- **axios param order**: Fixed `update-trade-reco` in `AddtoCartModal.js` and `IgnoreTradesScreen.js` — payload was in 3rd position instead of 2nd (silently failing).
- **Rebalancing decryption**: Replaced local `checkValidApiAnSecret` with `defaultDecrypt` from `rebalanceHelpers.js` (proper error handling + fallback).
- **user_net_pf_model handling**: Now handles array format (sort by date, take latest) matching alphab2b.
- **Dev IP**: Removed hardcoded `10.90.60.251:8001` from PushNotificationScreen.

### Changed
- **Advisor tag**: All hardcoded `ARFS` references replaced with dynamic `configData?.config?.REACT_APP_ADVISOR_SPECIFIC_TAG` or `'RGX Research'`.
- **Default variant**: `variantHelper.js` defaults to `rgxresearch` instead of `alphaquark`.
- **Motilal Oswal broker URL**: `motilal-oswal` → `motilal` (3 occurrences).
- **Motilal holdings endpoint**: `motilal-oswal/all-holdings` → `motilal-oswal/holdings` (404 fix).
- **Rebalance flag**: Now respects user choice (`option1 ? 1 : 0`) instead of always `0`.
- **DummyBroker flow**: Aligned with alphab2b — 3-step process (process-trade → subscriber-execution → status-check-queue) with Toast notifications and delayed refresh.
- **Market hours check**: Added before order placement in StockAdvices.js.
- **GTT credentials**: Now properly decrypted with `checkValidApiAnSecret` for Upstox/Zerodha/AliceBlue.
- **adviceShowDays**: Now fetched from backend `/api/admin/frontend-config` (default 15 days) instead of hardcoded env var.
- **model_id filter**: Trade recommendations now filter out model portfolio trades.

### Added
- **`serverConfig.js`**: Added `ccxtWs` (WebSocket URLs) and `brokerAuth` (callback URLs) config.
- **`portfolioEvents.js`**: Event emitter for cross-component communication (HOLDINGS_REFRESH, REBALANCE_EXECUTED).
- **`rebalanceHelpers.js`**: Added `isLowAllowedBalanceError()`, `checkPortfolioShortfall()`, `isBrokerAuthError()`, `defaultDecrypt()`.
- **`brokerSupport.js`**: Added `isBrokerAvailable()`, `getBrokerUnavailableReason()`. IIFL marked unavailable.
- **Trade tags**: Zerodha basket orders now include `tag: tradeTag` for reconciliation.
- **Portfolio events**: Emitted after trade execution in RebalanceModal, DummyBrokerHoldingConfirmation.
- **model_id**: Added to all rebalance payloads (MPReviewTradeModal, DummyBrokerHoldingConfirmation).
- **`.env`**: Added `REACT_APP_AQ_KEYS`, `REACT_APP_AQ_SECRET`, `REACT_APP_HEADER_NAME`, `REACT_APP_DEEP_LINK_SCHEME`.
- **Architecture docs**: `CLAUDE.md`, `docs/APP_ARCHITECTURE.md`, `docs/BROKER_CONNECTION.md`, `docs/REBALANCING.md`, `docs/MODEL_PORTFOLIO.md`, `docs/CHANGELOG.md`.

### Disabled
- **IIFL Securities**: All endpoints return "temporarily unavailable" (backend returns 404).
- **Kotak modify-order**: Throws error with guidance to cancel and re-place.

---

## [5.2.0] - 2026-03-26 (Previous)

### Added
- Rebalance calculation
- Production changes to RGX
- Performance data chart updates
- Crash prevention

---

## Changelog Format

Each entry follows:
```
## [version] - YYYY-MM-DD

### Added (new features)
### Changed (modifications to existing features)
### Fixed (bug fixes)
### Removed (removed features)
### Disabled (temporarily unavailable features)
```
