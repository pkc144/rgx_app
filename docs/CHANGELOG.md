# Changelog

All notable changes to the RGX Research Mobile App (EquityPro) are documented here.

---

## [5.3.3] - 2026-04-20 — Dhan OAuth-primary flow + partner broker audit

### Fixed — Dhan connect modal stuck on legacy credential-only flow

`src/components/BrokerConnectionModal/DhanConnectModal.js` — was 368 lines out of sync with alphab2b. Ported the OAuth-primary flow (OAuth mode starts true; manual credential form is fallback):
- Added `oauthMode` state + `hasProcessedCallback` ref
- Added `DHAN_OAUTH_URL = ${ccxtServer}dhan/login` (CCXT-driven consent flow)
- Renders `<DhanOAuthUI>` from `UIComponents/BrokerConnectionUI/DhanOAuthUI.js` (already ported in v5.3.0 Phase 9)
- Uses `CrossPlatformOverlay` primitive (already in RGX, identical to alphab2b)
- `handleDhanCallback` parses deep-link callback with `dhan_client_id` + `dhan_access_token` params

### Audited — 5 partner brokers now fully aligned with alphab2b + web

Cross-checked Zerodha, Angel One, Dhan, AliceBlue, Axis Securities flows against `Alphab2bapp`. Result:

| Broker | Modal diff vs alphab2b | Flow | ModalManager wired | BrokerSelectionModal tile | TokenExpireBrokerModal OAUTH list |
|--------|------------------------|------|--------------------|----------------------------|-----------------------------------|
| Zerodha | 0 | Partner OAuth (advisor-shared Kite Connect) | ✓ | ✓ | ✓ |
| Angel One | 0 | Partner OAuth (SmartAPI) | ✓ | ✓ | ✓ |
| Dhan | 0 (after this fix) | OAuth primary + credential fallback | ✓ | ✓ | ✓ |
| AliceBlue | 2 (intentional) | CCXT origin-tracking WebView | ✓ | ✓ | ✓ |
| Axis Securities | 0 | Partner SSO (ssoId → authToken) | ✓ | ✓ | ✓ |

AliceBlue's 2-line intentional divergence: RGX's `buildAliceBlueAuthUrl()` fallback is `https://${getAdvisorSubdomain()}.alphaquark.in/stock-recommendation` (resolves to `rgxresearch.alphaquark.in`) vs alphab2b's hardcoded `https://prod.alphaquark.in/stock-recommendation` — correct RGX multi-tenant behavior.

---

## [5.3.2] - 2026-04-20 — HDFC EgressIpCallout wire-up + docs

### Fixed — HDFC Securities was missing EgressIpCallout hard-gate

`src/components/BrokerConnectionModal/HDFCconnectModal.js` — wholesale-copied from alphab2b so the egress state wiring (`egressReady`, `unmetAck`, acknowledgment checkbox, submit gate, red-flash on unmet ack) now matches the other 5 whitelist brokers. Previously the HDFC flow was the only v5.3.1 broker whose submit button didn't gate on the per-user dedicated IP claim — a SEBI-compliance gap.

After this fix all 6 whitelist brokers have dynamic egress provisioning:

- Upstox, Fyers, HDFC, ICICI, Kotak → modal manages state, UI renders `<EgressIpCallout>`
- Groww → single-file inline implementation
- Motilal → intentional static IPv4 callout (shared `72.61.251.253`, no dynamic claim)

### Docs

`docs/BROKER_CONNECTION.md` — added "EgressIpCallout — Per-Customer Static IP Gate" section covering: 7 render states, `/egress/me` + `/egress/claim` backend contract, hard-gate mechanics, per-broker wire-up matrix, migration banner, per-broker dev-portal URLs + whitelist hints.

---

## [5.3.1] - 2026-04-20 — Follow-up sync from AlphaB2B v3.8.2–v3.8.9

Pulls in 8 more AlphaB2B release tags that landed after the v5.3.0 cut. All behavioural, not just docs.

### Fixed — WebSocket LTP stream now delivers prices (was silently returning 0 for every symbol)

`src/FunctionCall/useWebSocketCurrentPrice.js` fully rewritten to match web's `MarketDataContext.js`:
- Server: `https://ccxtprod.alphaquark.in` (same host as REST calls) instead of `wss://ccxt.alphaquark.in`
- Namespace: `/ltp` instead of default `/`
- Handshake: emits `subscribe_me` with `{userEmail, dbName}` on connect
- Subscribe: batched `POST ${ccxtUrl}/subscribe-array` instead of per-symbol `/websocket/subscribe`
- Events: both `ltp_update` (primary) and `market_data` (alt payload)
- Added queueing for pre-connect subscriptions + re-subscribe on reconnect

Public hook surface (`{ltp, getLTPForSymbol}`) unchanged — all 7 callers (`AfterSubscriptionScreen`, `ModelPFCard`, `PortfolioScreen`, `MPStatusModal`, `RebalanceModal`, `MPReviewTradeModal`, `UserStrategySubscribeModal`) work without changes. Prices now populate on every screen.

`dbName` resolves via `Config.REACT_APP_HEADER_NAME || Config.REACT_APP_URL || Config.REACT_APP_ADVISOR_SUBDOMAIN || getAdvisorSubdomain()` (RGX fallback added).

### Fixed — `user_email` at top level of process-trades payloads (B1)

`StockAdvices.js`, `AddtoCartModal.js`, `IgnoreTradesScreen.js` — added top-level `user_email: userEmail` to `gttPayload` / `basePayload` / cart-path `getOrderPayload`. Required by the ccxt-india egress request hook to resolve the customer's whitelisted IPv6. Without this fix, basket/bespoke orders from those three flows fail on whitelist-required brokers (Upstox) with `UDAPI1154 — static IP does not match request origin IP` even when the customer's IPv6 was correctly provisioned.

### Fixed — `user_email` in OAuth finish-connection endpoints (B2)

Added top-level `user_email` to 10 callsites across Zerodha/Upstox/Fyers/IIFL finish-connection POSTs:
- `ZerodhaConnectModal.js`, `ZerodhaConnectUI.js`, `HelpUI/ZerodhaConnectModal.js` (5 `/zerodha/gen-access-token` sites)
- `upstoxModal.js` (`/upstox/gen-access-token`)
- `FyersConnect.js` + `BrokerCredentialScreen.js` Fyers branch (`/fyers/gen-access-token`)
- `iiflmodal.js`, `iiflproceedmodal.js` (`/iifl/login/client`)

Without this, post-OAuth token exchange binds the shared static IPv4 instead of the customer's route64 IPv6 — ICICI returns status:500 in an HTTP 200 body, Upstox returns UDAPI1154, and the success dialog never fires.

### Changed — Groww migrated from partner OAuth to API-Key + API-Secret + IP whitelist

Groww deprecated partner-API order placement in 2026-04. The only supported path is now user-created approval-mode keys at https://groww.in/trade-api/api-keys with a per-customer Route64 IPv6 whitelisted against those keys.

- **`GrowwConnectModal.js`** — full rewrite. Dropped the InAppBrowser OAuth flow. New flow: `EgressIpCallout` at top (gates submit via `egressReady` + `unmetAck`), 4-step scrollable instructions, two TextInputs for API Key + API Secret. `handleSubmit` AES-encrypts both with `'ApiKeySecret'` and POSTs `{uid, user_email, user_broker: 'Groww', apiKey, secretKey}` to `${server}api/groww/update-key`. Amber note explains Groww's **daily approval requirement** — access tokens reset at 6 AM IST.
- **`EgressIpCallout.js`** — added `'groww'` to `WHITELIST_BROKERS`, dev-portal URL, whitelist hint.
- **`TokenExpireBrokerModal.js`** — removed `'Groww'` from `OAUTH_BROKERS`, added dedicated `handleGrowwReconnect` that dispatches `useModalStore.getState().openModal('Groww')` so expired Groww users see the new credential form.
- **`brokerRegistry.js`** — Groww `authType: OAUTH → CREDENTIAL`, added `fields: [{apiKey}, {secretKey}]`.

Existing Groww users on partner OAuth tokens keep working until expiry (~24h), then flow through the new form on reconnect.

### Fixed — DDPI authorize-for-sell race (await getUserDetails before reopening rebalance modal)

`src/components/DdpiModal.js` — added `await` to all 6 `handleProceed`-style callers: `handleProceed` (main DdpiModal), `AngleOneTpinModal.handleProceed`, `DhanTpinModal.handleProceed`, `OtherBrokerModel.handleContinue` (Add-to-Cart flow), `OtherBrokerModel.handleAcceptRebalance` (rebalance flow), `FyersTpinModal.handleProceed`. Previously fire-and-forget — reopened modal read stale userDetails (`is_authorized_for_sell=false`) and re-triggered DDPI right after user ticked Authorize for Sell.

### Changed — Per-broker polish

- **Kotak mobile pre-fill on reconnect** (`KotakModal.js`): reads `connected_brokers[broker=Kotak].mobileNumber` (fallback to `phone_number`), strips `+91`, pre-fills 10-digit input so returning users don't retype it.
- **Motilal server-IPv4 static callout** (`MotilalConnectUI.js`): replaced the broker's `<EgressIpCallout>` with an inline static callout (IP `72.61.251.253` + Copy + acknowledgment checkbox + red-flash). Motilal is IPv4-only; all calls route through the server's shared static IPv4.
- **Upstox Help step 3**: "Allowed IPs" instruction added before the Redirect URL text (`UDAPI1154` avoidance).
- **HDFC Help step 4**: "Allowed IPs" instruction added for InvestRight.
- **ICICI Help step 2**: "IP Whitelist" instruction added for Breeze.

### Preserved — RGX brokerAuth.js (not overwritten)

`src/utils/brokerAuth.js` was NOT replaced with alphab2b's version — RGX's file has different multi-tenant OAuth routing (`BROKER_REGISTER_ORIGIN = https://${getAdvisorSubdomain()}.alphaquark.in`, `rgxapp://` deep-link scheme, centralized `server.brokerAuth.*` URLs). The alphab2b Groww-specific config changes to `brokerAuth.js` don't apply — RGX's version doesn't have per-broker config entries. Groww migration works through `GrowwConnectModal.js` + `brokerRegistry.js` + `TokenExpireBrokerModal.js` without touching `brokerAuth.js`.

---

## [5.3.0] - 2026-04-20 — Web-parity sync from AlphaB2B v3.8.0 + v3.8.1

Large sync pulling all AlphaB2B changes from 2026-04-08 through 2026-04-20 into RGX.
RGX-specific divergences preserved: `rgxresearch` subdomain (via `getAdvisorSubdomain()`),
RGX UI colors and branding (via `Config.js` variants), 3-key storage schema,
centralized `serverConfig.ccxtWs` / `serverConfig.brokerAuth`.

### Added

- **Transient broker error handling** (`src/utils/rebalanceHelpers.js`): Added `TRANSIENT_NON_AUTH_BROKER_ERROR_CODES`, `isTransientFundsError` / `isTransientBrokerError`, `detectTransientOrderWindowError`. Upstox `UDAPI100072` / `UDAPI100074` maintenance-window errors (00:00–05:30 IST) no longer force re-OAuth; rebalance/MP flows show a soft toast instead.
- **`basketUtils.js`**: ported `parseFnOSymbol`, `adjustForLotSize`, `getLotsCount`, `formatQuantityWithLots`, `buildBasket`, `separateByTransactionType`, `calculateBasketValue`, `validateBasket`, `parseExpiryFromSymbol`, `isBasketExpired`, `netBasketTrades`.
- **`rebalanceDiffUtils.js`**: new file with `computeRebalanceDiff`, `computeRowsDiff`, `summarizeRebalanceDiff` for showing added/removed/increased/decreased stocks between consecutive rebalance snapshots.
- **Axis Securities full support**: added `src/assets/axis.png`, `AxisConnectModal.js`, tile in `BrokerSelectionModal.brokersmain`, `case 'Axis Securities'` in `ModalManager.js`, and `'Axis Securities'` in `TokenExpireBrokerModal.OAUTH_BROKERS`.
- **alphab2b-only features ported**:
  - `src/config/brokerRegistry.js`
  - `src/hooks/` (`useMultiBrokerHoldings.js`, `useSymbolSearch.js`)
  - `src/screens/Broker/` (`BrokerAuthScreen`, `BrokerCredentialScreen`, `BrokerSelectionScreen`)
  - `src/screens/Invest/` (`InvestFlowScreen`)
  - `src/screens/Rebalance/` (`CurrentHoldingsScreen`, `ExecutionStatusScreen`, `RebalanceReviewScreen`)
  - `src/screens/Home/TradePnLScreen.js`
  - `src/context/MarketDataContext.js`, `MultiBrokerContext.js`
  - `src/services/ModelPortfolioService.js`, `OrderService.js`
  - `src/components/GttDetailsModal.js`, `GttSuccessModal.js`, `ManualSellModal.js`, `ReviewBrokerRecordsModal.js`, `FloatingAcceptRebalanceButton.js`
  - `src/components/BrokerConnectionModal/EgressIpCallout.js`
  - `src/UIComponents/BrokerConnectionUI/DhanOAuthUI.js`
  - `src/utils/formatCurrency.js`, `symbolNormalizer.js`, `marketDataLTP.js`, `brokerPublisher.js`
- **Bespoke Recommendations → Rejected tab** (`HomeScreen.js`): Active/Rejected tab switcher on "View All".
- **StockCard `OSrejected` state** (`UIComponents/StockAdvicesUI/StockCard.js`): Ignore + Trade Now buttons replace Add-to-Cart + Retry for rejected bespoke trades.
- **Research Report PDF download** (`ResearchReportScreen.js`): replaced broken WebView PDF render with `RNFS.downloadFile` + toast on complete.
- **Manage Connections session expiry** (`ManageConnectionsModal.js`): amber "Session Expired" badge + Reconnect button per expired broker; `BROKER_MODAL_KEY_MAP` dispatches directly to the per-broker modal via `ModalManager`.

### Changed

- **`isFundsErrorOrMissing` returns boolean** (`rebalanceHelpers.js`): was `{isError, reason}` object, now `boolean`. Caller in `RebalanceAdvices.js` and test files updated.
- **`checkPortfolioShortfall` uses message regex** (was numeric comparison): aligned with web — message-based detection (`less than required minimum`) plus regex extracts `required minimum amount (N)`.
- **`isBrokerAuthError` keyword set expanded**: now catches `please login`, `please re-login`, `login required`, `error: 401`, `401 unauthorized`, `token expired`. Fixes dead-end "Unable to Rebalance" on Groww / upstream broker 401s.
- **`isSubscriptionAmountError` keywords aligned to web**: now matches `subscription_amount_raw`, `subscription amount`, `not set or has been cleared`.
- **`isLowAllowedBalanceError` narrowed**: dropped `insufficient` / `not enough funds`; only `low allowed balance` matches (web parity).
- **`ProcessTrades.js` GTT payload**: per-trade leg structure with field transforms (`Symbol` → `tradingSymbol`, etc.), numeric `parseFloat` cast, quantity from `stock.quantity`. Replaces the old top-level `payload.entryLeg/leg1/leg2`.
- **`ProcessTrades.js` case-insensitive rejection detection**: added `REJECTED_ORDER_STATUSES` set covering 9 variants (`REJECTED`/`Rejected`/`rejected`, `CANCELLED`/…, `FAILURE`/…).
- **`ProcessTrades.js` HTTP 401/403 + network-error detection**: tagged `err.sessionExpired = true` routes through `onSessionExpired` callback, matching web.
- **`ProcessTrades.js` drop EDIS keyword filter**: `detectEdisFailures` now returns every rejected SELL regardless of error-message wording (matches web's explicit "don't rely on CDSL keyword detection" stance). Trade-off: TPIN modal may fire on market-hours / fund failures too.
- **`ProcessTrades.js` credentials** — Kotak now sends `consumerKey`/`consumerSecret` (decrypted) + `viewToken`; Motilal + AliceBlue `apiKey` now decrypted.
- **`fetchFunds.js` userEmail pattern**: server fetches apiKey/secretKey from DB using userEmail; callers updated (`TradeContext`, `MPPerformanceScreen`, `BespokePerformanceScreen`, `UserStrategySubscribeModal`). IIFL Securities re-enabled (backend-gated). Motilal `Bearer ` stripping removed. Axis Securities case added. Error path returns `error?.response?.data`.
- **Motilal `update-key` payload**: added `user_broker: 'Motilal Oswal'` (web parity).
- **Upstox `update-key` payload**: added `user_broker: 'Upstox'`.
- **HDFC `access-token` body**: added `user_email`. HDFC `update-key` body: added `user_broker: 'Hdfc Securities'`.
- **AliceBlue authUrl**: swapped hardcoded `ant.aliceblueonline.com` for `buildAliceBlueAuthUrl()` — constructs `${ccxtServer}aliceblue/login?origin=…&returnPath=…` (MongoDB origin tracking).
- **ICICI Option B (breaking)**: removed client-side `apisession → customer-details → connect-broker` chain. WebView only intercepts the final `REACT_APP_BROKER_CONNECT_REDIRECT_URL` redirect after CCXT's server-side `/icici/auth-callback/{subdomain}` finishes the handshake. `ICICIHelpContent.js` updated with new required Redirect URL `{ccxtServer}icici/auth-callback/{REACT_APP_HEADER_NAME}`. **Migration required**: existing ICICI users must update the Redirect URL in their ICICI dev dashboard.
- **Axis response parsing** (`AxisConnectModal.js`): reads nested `.data.data` envelope, unwraps `authToken.token` / `refreshToken.token`, adds `metadata?.accounts?.[0]?.subAccountId` fallback.
- **Cart/Trade-intent separation (Option B)** — `StockAdvices.js`, `StockAdviceContent.js`, `ReviewTradeModal.js`, `StockCard.js`:
  - `cartContainer` holds the cart; `stockDetails` holds the trade-intent payload. They no longer share writes.
  - "Trade Now" on a single stock no longer leaks full cart into the review modal.
  - Bottom-bar "Trade (N)" counter now reads `cartContainer.length`.
  - "Scale quantities by amount" reads from `useLTPStore` (not dead `getLastKnownPrice`) and uses equal-budget allocation (matches the Note text).
  - Limit-price preserved on cart refresh via `POST api/cart/update` with regex-validated decimal string.
- **Rebalance flow web-parity** — `RebalanceCard.js`, `RebalanceModal.js`, `RebalanceAdvices.js`, `MPReviewTradeModal.js`:
  - Pre-flight broker + funds check before `handleCheckStatus`.
  - Zero-quantity holdings filter + `skipRepairRef` for fresh rebalance.
  - `caPendingInfo` in process-trade payload (split-settlement tracking).
  - Sell-against-holdings filter prevents selling stocks user doesn't own.
  - `allOrdersFailed` detection from `orderErrors` / `fundsRequired`.
  - `detectTransientOrderWindowError` wired at both RebalanceModal and MPReviewTradeModal all-orders-failed sites — swaps the internal-failure modal for a soft "Broker service window" toast.
  - Publisher timeout fallback (90s Zerodha WebView).
  - Subscription amount error now navigates to AfterSubscriptionScreen with modify-investment option.
- **MP Performance fixes** (`AfterSubscriptionScreen.js`):
  - Portfolio Distribution tab passes `type="MPPerformanceScreen"` to `DistributionGrid` (removes duplicate inner tab bar).
  - Holdings table rebuilt to 6-column detailed layout (Stock / Current / Avg.Buy / Returns / Weight / Shares) inside horizontal ScrollView.
  - Row renderer shows literal `N/A` for missing LTP (matches web `tableData`) — no silent fallback to `avgBuyPrice` as "current".
- **Portfolio top card** (`PortfolioScreen.js`): `planSummary` useMemo aggregates invested/current/returns client-side from `planHoldings` when All Holdings + plan is selected.
- **Plans tab visibility** (`ModelPortfolioScreen.js`): driven purely by `config.bespokePlansEnabled` / `config.modelPortfolioEnabled` feature flags (defaulting to enabled). Tabs no longer collapse to single-pill when list is empty.
- **TradeContext fixes**: `fetchAdviceShowDays` now reads `response.data?.data?.adviceShowLatestDays` (was `response.data?.adviceShowLatestDays` — returned `undefined`). `'common'` subdomain fallback replaced with `getAdvisorSubdomain()`.
- **BasketCard palette** (`UIComponents/StockAdvicesUI/BasketCard.js`): regular-state gradient switched to dark navy (`#000C18 → #002C59 → #000C18`) with translucent green accent border (matches web).

### Fixed

- **Groww 401 → "Unable to Rebalance" dead-end**: expanded `isBrokerAuthError` keywords now route broker-forwarded 401s into `TokenExpireBrokerModal` for reconnection.
- **Broker header / Funds Info card mismatch on aborted Reconnect**: dropped optimistic `setBroker(expiredBroker)` in `SubscriptionScreen.onReconnect`. Header now stays in sync with `user_broker` until the per-broker modal's `PUT /api/user/connect-broker` settles.
- **Axis missing from reconnect modal**: added `'Axis Securities'` to `TokenExpireBrokerModal.OAUTH_BROKERS`.
- **Duplicate tab bar on MP Performance Portfolio Distribution tab**: pass `type="MPPerformanceScreen"` to `DistributionGrid` so it hides its own inner tab switcher.
- **MP Performance current price fallback to avg**: added `hasValidPrice` gate; `tableData.currentPrice` and `returns` emit `'N/A'` string instead of silently echoing `avgBuyPrice`.
- **Bottom-bar Trade (N) stuck at 0 after Add to Cart**: counter reads `cartContainer.length` (not stale `stockDetails.length`).
- **"Scale quantities by amount" no-op**: rewrote `handleFixSize` to read LTP from `useLTPStore.getState().ltps[symbol]` and use equal-budget allocation per stock (matches Note label).
- **"Trade Now" leaking cart items into review modal**: Option-B split — `updateCartStates` only writes `cartContainer`; trade-intent path populates `stockDetails` fresh.
- **ICICI client-side customer-details flow brittle under backend restructure**: moved to server-side CCXT `auth-callback` (Option B). Help content updated with new Redirect URL.
- **AliceBlue origin-tracking missing**: now routes through `ccxt/aliceblue/login?origin=…&returnPath=…` so backend can stamp the originating subdomain.

### Disabled

- **IIFL Securities** — backend gates availability. Mobile now calls through (matches web); backend 404s if unavailable.

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
