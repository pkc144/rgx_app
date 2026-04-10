# Changelog

All notable changes to the RGX Research Mobile App (EquityPro) are documented here.

---

## [5.2.4] - 2026-04-01

### Fixed
- **Order status classification**: Moved `open`/`transit`/`placed`/`ordered` from SUCCESS_STATUSES to PENDING_STATUSES in `orderStatusUtils.js`. Added separate `isOrderCancelled()` function — cancelled orders no longer treated as rejected.
- **OrderScreen card colors**: Cancelled orders now show grey (#F3F4F6/#6B7280) instead of red. Added expandable rejection reason display on tap for rejected orders. Added qty/price fallback defaults to prevent `undefined` display. Filtered out model portfolio trades (`!trade.model_id`) from rejected orders list. Files: `OrderScreen.js`, `orderStatusUtils.js`.
- **TradeContext fetch params**: Fixed `fetchFunds()`, `fetchBrokerSpecificHoldings()`, `fetchBrokerAllHoldings()` calls — replaced `userEmail` with `configData` as last param, added missing `viewToken` param to holdings calls. Added `adviceShowDays` to useEffect dependency array so trades re-fetch when setting changes. File: `TradeContext.js`.
- **TradeContext recommended filter**: Model portfolio trades with `trade_place_status === 'recommend'` now correctly appear in recommended list (matching AlphaB2B). `!trade.model_id` guard moved to rejected sub-condition only. File: `TradeContext.js`.
- **ICICI Direct token field**: Changed `sessionToken` to `accessToken` in `UserStrategySubscribeModal.js` to match backend expectation.
- **Zerodha payload cleanup**: Removed unnecessary `apiKey`/`SecretKey` from Zerodha broker payload in `UserStrategySubscribeModal.js` — server only needs `accessToken`.
- **Kotak credential decryption**: Fixed `ProcessTrades.js` to send `consumerKey`/`consumerSecret` (decrypted) and `viewToken` instead of raw encrypted `apiKey`/`secretKey` for regular orders.
- **MPStatusModal stale failure guard**: Added `isOrderSuccess`/`isOrderPending` check before marking orders as failed, preventing stale backend `rebalance_status: "failure"` from incorrectly marking live orders. File: `MPStatusModal.js`.
- **Security: removed credential logging**: Removed `console.log` statements in `UserStrategySubscribeModal.js` that leaked Upstox credentials to device logs.

### Added
- **EDIS pre-flight sell check**: Added EDIS authorization pre-validation for 8 brokers (AliceBlue, IIFL, ICICI, Upstox, Kotak, Hdfc, Motilal, Groww) in `UserStrategySubscribeModal.js`. Blocks sell orders with user-friendly toast when `is_authorized_for_sell` is false.
- **Axis Securities broker support**: Added `"Axis Securities": "axis"` to `BROKER_URL_MAP` in `ProcessTrades.js`.
- **DummyBroker fallback**: Added `broker ? broker : 'DummyBroker'` fallback in `UserStrategySubscribeModal.js` when no broker is connected.
- **EDIS keyword detection**: `ProcessTrades.js` now detects EDIS-related rejections by keyword matching (`cdsl`, `edis`, `tpin`, `ddpi`, `demat`, etc.) instead of triggering TPIN modals for all rejected sell orders.
- **Rebalance retry after TPIN**: Added `reopenRebalanceModal` and `getUserDetails` callbacks to all TPIN/EDIS/DDPI modals in `RebalanceAdviceContent.js` so users can auto-retry rebalancing after authorization.
- **Dynamic white label text**: Replaced 5 hardcoded "AlphaQuark" instances in `HelpModal.js` with `Config?.REACT_APP_WHITE_LABEL_TEXT || 'AlphaQuark'`.

### Changed
- **AliceBlue apiKey**: Changed from `checkValidApiAnSecret(apiKey)` to raw `apiKey` in `UserStrategySubscribeModal.js` to match AlphaB2B behavior.
- **Kotak serverId default**: Added empty string fallback (`serverId ? serverId : ''`) in `UserStrategySubscribeModal.js`.
- **Model name trimming**: Added `.trim()` to `strategyDetails?.model_name` in `UserStrategySubscribeModal.js`.
- **Fund default**: Added `'0'` fallback for `userFund` when `availablecash` is undefined in `UserStrategySubscribeModal.js`.

---

## [5.2.3] - 2026-04-01

### Added
- **Test suite ported from AlphaB2B**: Ported 11 test suites (281 tests) from `Alphab2bapp/src/__tests__/` to `rgx_app/src/__tests__/`. Includes unit tests for `brokerAuth`, `brokerSessionUtils`, `brokerSupport`, `orderStatusUtils`, `portfolioEvents`, `rebalanceHelpers`, `ProcessTrades`, `storageUtils`, `BrokerOrderBookAPI`, and integration tests for broker trade flow and rebalance flow. Adapted tests for RGX-specific differences: axios-based brokerAuth, simplified storageUtils (3 keys, no retry), `getAdvisorSubdomain()` subdomain resolution. Skipped 3 B2B-only test files (`ModelPortfolioService`, `rebalanceDiffUtils`, `symbolNormalizer`) whose source modules do not exist in RGX. Created `__mocks__/` directory with mocks for `react-native-config`, `react-native-crypto-js`, `react-native-toast-message`, and `@react-native-async-storage/async-storage`. Updated `jest.config.js` with setup files, module name mappers, and transform ignore patterns.

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
