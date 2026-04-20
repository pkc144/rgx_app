# Model Portfolio Architecture

> **Last updated**: 2026-04-20 (synced to AlphaB2B v3.8.1)

## Overview

Model Portfolios (MP) are advisor-created curated baskets that a client can subscribe to with a set amount. Subscribing triggers the initial buy trades, after which the plan appears in **My Plans** and participates in the rebalance flow.

## Screens & Components

| File | Purpose |
|------|---------|
| `src/screens/Drawer/ModelPortfolioScreen.js` | Top-level MP list with `Model Portfolio` / `Bespoke Plans` tabs |
| `src/components/ModelPortfolioComponents/MPCard.js` | List card for a single plan |
| `src/components/ModelPortfolioComponents/UserStrategySubscribeModal.js` | Subscribe-now modal (amount picker, broker check, pre-order validation) |
| `src/components/ModelPortfolioComponents/MPReviewTradeModal.js` | Review trade modal (per-stock preview, EDIS/TPIN, place orders) |
| `src/components/ModelPortfolioComponents/MPInvestNowModal.js` | Quick-invest entry |
| `src/components/ModelPortfolioComponents/RecommendationSuccessModal.js` | Post-subscription success state |
| `src/components/AdviceScreenComponents/MPStatusModal.js` | Per-order status panel with stale-failure guard |
| `src/screens/Home/AfterSubscriptionScreen.js` | Post-subscribe dashboard: holdings table, distribution, funds |
| `src/screens/Drawer/MPPerformanceScreen.js` | Per-plan performance: TOTAL INVESTED / TOTAL CURRENT / RETURNS top card |

## Subscription Flow

```
User taps MPCard → UserStrategySubscribeModal opens
    │   • Reads strategyDetails + user's broker credentials
    │   • POST ccxt/rebalance/calculate  (just for amount/qty preview)
    │   • EDIS pre-flight for 8 brokers (sells need authorization first)
    │
    ▼
MPReviewTradeModal (per-stock table)
    │   • User confirms
    │   • POST ccxt/model-portfolio-place-order
    │       with buildBrokerPayloadFields() credentials + caPendingInfo
    │
    ▼
Results processed
    │   Soft-fail path: detectTransientOrderWindowError → toast + enrollStatusCheckQueue
    │   All-failed hard-fail: funds/EDIS/TPIN recovery modals
    │   Success: RecommendationSuccessModal → HOLDINGS_REFRESH event
    │
    ▼
AfterSubscriptionScreen
    │   • TOTAL INVESTED / TOTAL CURRENT / CURRENT RETURNS top card
    │   • TabView: Portfolio Holdings  |  Portfolio Distribution
```

## EDIS Pre-Flight Check

Before submitting SELL orders for 8 brokers (AliceBlue, IIFL, ICICI, Upstox, Kotak, HDFC, Motilal, Groww), `UserStrategySubscribeModal` checks the user's `is_authorized_for_sell` status. If false, blocks submission with a user-friendly toast pointing them to the DDPI / TPIN flow.

## Feature-Flag Tab Visibility (v5.3.0)

`ModelPortfolioScreen` used to hide a tab when its list was empty (collapsing the UI to a single full-width pill). Now tab visibility is driven purely by feature flags:

- `config.modelPortfolioEnabled` (default true) → MP tab shows
- `config.bespokePlansEnabled` (default true) → Bespoke tab shows

Each tab's scene still renders its own empty-state copy, so a user on an advisor with no MP strategies sees the MP tab with an "No plans yet" card instead of a missing tab.

## Post-Subscription UI (`AfterSubscriptionScreen`)

### Duplicate Tab-Bar Fix (v5.3.0)

The outer screen has its own TabView (`Portfolio Holdings` / `Portfolio Distribution`). The `Portfolio Distribution` scene renders `<DistributionGrid />` — but `DistributionRowGrid.js` also has its own internal tab switcher. Without the `type` prop, both rendered and the user saw two "Portfolio Holdings" tabs stacked.

**Fix**: pass `type="MPPerformanceScreen"` to `DistributionGrid`. `DistributionRowGrid.js` branches on this prop and hides its inner tabs, rendering only the grid.

### 6-Column Holdings Table (v5.3.0)

The outer Portfolio Holdings table is now the detailed 6-column layout:

| Stock | Current Price | Avg. Buy | Returns | Weight | Shares |

Wrapped in a horizontal `ScrollView` (six columns don't fit on narrow phones). Pre-5.3.0 the screen had a 4-column simplified view (Stock / Current / Avg Buy / P&L %) while the inner duplicate showed the 6-column version — users preferred the fuller one.

### N/A Fallback for Missing LTP (v5.3.0)

Pre-5.3.0, when live WebSocket + saved snapshot + ccxt cache all missed, `tableData.currentPrice` fell back to `averagePrice`. Result: top card showed "TOTAL CURRENT ₹0 / RETURNS -100%" while rows showed "Current ₹1.24 / Avg ₹1.24 / P&L +0.0%" — confusing split signal.

**Fix**: aligned with web's `StrategyDetailsWithPortfolioData.js:614-632`. Added a `hasValidPrice` gate (`resolvedLtp !== null && !isNaN && !== 0 && avg !== 0`) and emit literal `'N/A'` for `currentPrice` / `returns` when LTP is unavailable. The row renderer shows literal `N/A` text and a neutral gray for the returns cell. Mobile-only snapshot + ccxt-cache fallbacks remain in the resolution chain (legitimate offline sources); only the `avg` last-resort fallback was dropped.

`avgBuyPrice` still renders independently so users can see what they paid.

## `planSummary` Top Card (v5.3.0 — PortfolioScreen)

In `PortfolioScreen.js`, when the All-Holdings tab is active **and** a plan is selected, the top card now shows plan-specific aggregates (invested / current / returns) instead of broker-wide totals.

Implementation: a `planSummary` useMemo aggregates `totalInvested` / `totalCurrent` / `totalReturns` / `returnsPercentage` client-side from `planHoldings` using live LTP. `profitAndLoss` / `pnlPercentage` / `effectiveHoldingsData` prefer it when `selectedInnerTab === 0` (All Holdings) + plan selected. Pre-5.3.0, plan-specific aggregates only applied to `selectedInnerTab === 1` (MP tab).

## Transient Broker Errors (v5.3.0)

`MPReviewTradeModal` wires `detectTransientOrderWindowError(response?.data)` at its all-orders-failed site (`api/model-portfolio-place-order`). When the entire batch is a known transient error (Upstox maintenance window, etc.), it:

1. Swaps the internal failure modal for a soft "Broker service window" toast
2. Calls `enrollStatusCheckQueue` + `getRebalanceRepair`
3. Clean-exits

See `docs/REBALANCING.md` for the full transient-error contract.

**Fyers publisher path** (`MPReviewTradeModal.js:~1291`) intentionally skips this soft-fail — publisher SDK flow is mobile-specific and its status-recording chain must run even on transient failure.

## Bespoke Plans → Rejected Tab (v5.3.0)

`HomeScreen.js` "View All" page now has an Active / Rejected tab switcher above `<StockAdvices>`:
- **Active** — renders `type='All'` (the recommended list)
- **Rejected** — renders `type='OSrejected'` against `rejectedTrades`

`TradeContext` no longer double-pushes rejected bespoke into `recommended`, so rejected cards appear only in the Rejected tab.

`StockCard.js` renders **Ignore + Trade Now** buttons when `type === 'OSrejected'` (replacing Add-to-Cart + Retry):
- **Ignore** → `IgnoreAdviceModal` → `PUT /api/recommendation { trade_place_status: 'ignored' }`
- **Trade Now** → reuses `handleSingleSelectStock` → `ReviewTradeModal`

## MP Status Modal — Stale-Failure Guard

`MPStatusModal.js` previously marked an order as failed whenever the backend `rebalance_status` read `"failure"`, even if the live order on the broker side was `COMPLETE` or still PENDING (stale DB row). v5.2.4 added `isOrderSuccess` / `isOrderPending` checks before the "failed" state is rendered — live broker status takes precedence.

## MP `advice_show_latest_days` Fix (v5.3.0)

`TradeContext.js:fetchAdviceShowDays` was reading `response.data?.adviceShowLatestDays` from `/api/admin/frontend-config`. But the backend returns `{ success, data: { adviceShowLatestDays } }` — the wrong path yielded `undefined` → `Number(undefined) === NaN` → `setAdviceShowDays` never fired → the app kept the `useState(15)` fallback regardless of admin setting.

**Fix**: read `response.data?.data?.adviceShowLatestDays`. Pair with `aq_backend_github` fix in `updateTermsConditions.js` so the admin's POST now writes to both `AdminAccess.adviceShowLatestDays` AND `AllAdvisorDetails.advice_show_latest_days` (the field `loginRoutes.js` reads first).

## Model Portfolio Lifecycle

| State | Source of truth |
|-------|-----------------|
| Pending subscription (recommended) | `modelPortfolioStrategyfinal` in `TradeContext` |
| Active subscription | Backend user's `user_subscribed_strategies[]` array |
| Rebalance pending | Backend `model_portfolios` stored with `rebalance_status` |
| Executed / failed | `rebalance_status` + per-order `status` |

Subscription creates the first set of orders via `api/model-portfolio-place-order`. Future changes to the model produce rebalances via `ccxt/rebalance/calculate` + `ccxt/rebalance/process-trade`.

## RGX-Specific Notes

- Every MP API call uses `X-Advisor-Subdomain: configData?.config?.REACT_APP_HEADER_NAME || configData?.subdomain || getAdvisorSubdomain()` so data writes land in the `rgxresearch` Mongo namespace.
- Theme colors (MPCard gradient, basket color, etc.) come from `Config.js` `rgxresearch` variant, not hardcoded.
- `BasketCard.js` regular-state gradient uses `configData.config.basket1 / basket2` (RGX → red; alphab2b → purple; falls back to web's navy palette if the variant is missing).
