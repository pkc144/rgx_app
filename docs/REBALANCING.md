# Rebalancing Architecture

> **Last updated**: 2026-04-20 (synced to AlphaB2B v3.8.1)

## Overview

Rebalancing computes the delta between a user's current holdings and a target model portfolio's weights, then routes the resulting BUY/SELL trades to the connected broker. The flow is driven by three components:

- `src/components/AdviceScreenComponents/RebalanceAdvices.js` — tab container, model portfolio list, entry point
- `src/UIComponents/RebalanceAdvicesUI/RebalanceCard.js` — per-plan card, pre-flight checks, "Check Status" / "Accept Rebalance" buttons
- `src/components/AdviceScreenComponents/RebalanceModal.js` — confirmation modal, trade preview, order placement

## High-Level Flow

```
RebalanceCard → POST ccxt/rebalance/calculate
                  { user_email, user_broker, modelName, advisor, viewToken,
                    ...buildBrokerPayloadFields(broker, credentials, decrypt, angelOneApiKey),
                    caPendingInfo }                                  ← added v5.3.0
                      │
                      ▼
                calculatedPortfolioData
                  { status, message, buy[], sell[], totalValue, minInvestmentValue,
                    orderErrors, fundsRequired }
                      │
                      ▼
           ─────┬──────┬───────────┬───────────────────────────┐
                │      │           │                           │
             status=1  │           │                           │
      (message-check) │    hasBuy||hasSell            allOrdersFailed     isShortfall
           │          │        │                        │                    │
    isBrokerAuthError │   openRebalanceModal       soft toast +          warn, continue
         → TokenExpire│        │                   enrollStatusCheckQueue
    isSubscriptionAmt │        ▼
         → navigate   │   RebalanceModal
    isFundsErrMissing │        │
         → TokenExpire│        ▼ user taps "Place Orders"
                      │   POST ccxt/rebalance/process-trade (or publisher SDK)
                      │        │
                      ▼        ▼
                  execution results
                  └─────→ enrollStatusCheckQueue() → getRebalanceRepair()
```

## Error Detection Helpers (`src/utils/rebalanceHelpers.js`)

All helpers were aligned to web in v5.3.0. `isFundsErrorOrMissing` now returns a **boolean** (was `{isError, reason}` object pre-5.3.0).

| Helper | Returns | Matches |
|--------|---------|---------|
| `isFundsErrorOrMissing(funds, brokerStatus)` | `boolean` | `null` funds + connected; `status === 1 \| 2`. Skips transient errors. |
| `isTransientFundsError(resp)` | `boolean` | Upstox `UDAPI100072` / `UDAPI100074` + message patterns (`temporarily unavailable`, `service window`, `market hours`, etc.) |
| `detectTransientOrderWindowError(responseData)` | `message \| null` | Every failed row in `results[]` is transient → soft toast |
| `isRebalanceErrorResponse(data)` | `boolean` | `status === 1 \| 2` |
| `isBrokerAuthError(message)` | `boolean` | `invalid api_key`, `session expired`, `token expired`, `unauthorized`, `authentication`, `please login`, `please re-login`, `login required`, `error: 401`, `401 unauthorized` |
| `isSubscriptionAmountError(message)` | `boolean` | `subscription_amount_raw`, `subscription amount`, `not set or has been cleared` |
| `isLowAllowedBalanceError(message)` | `boolean` | `low allowed balance` only (narrowed from 3 keywords pre-5.3.0) |
| `checkPortfolioShortfall(responseData)` | `{isShortfall, hasTrades, currentValue, requiredAmount}` | Message regex `less than required minimum` + `required minimum amount (N)` extract. Was numeric comparison pre-5.3.0. |

## Transient Broker Errors (v5.3.0)

Upstox's funds + place-order services are offline daily 00:00–05:30 IST for broker-side maintenance. Before v5.3.0, hitting either during this window forced the user through an OAuth re-flow even though the JWT was still valid.

**Fix:** `TRANSIENT_NON_AUTH_BROKER_ERROR_CODES` maps these codes to friendly messages. `isFundsErrorOrMissing` short-circuits (returns `false`) when `isTransientFundsError(currentFunds)` matches, leaving cached funds in place.

**All-orders-failed path:** When every row in `results[]` is transient, `detectTransientOrderWindowError(response.data)` returns the first matching message. Both `RebalanceModal.js` (bespoke + MP rebalance) and `MPReviewTradeModal.js` (MP subscription) then:
1. Swap the all-orders-failed internal modal for a soft "Broker service window" toast
2. Call `enrollStatusCheckQueue()` + `getRebalanceRepair()` so the failed rows come back for retry when the window reopens
3. Clean-exit the flow — no dead-end error

Fyers publisher path (`MPReviewTradeModal.js`) **does not** use this soft-fail — publisher SDK flow is mobile-specific and its status-recording chain must run even on transient failure.

## Pre-Flight Checks (RebalanceCard v5.3.0)

Before `handleCheckStatus` fires, `RebalanceCard` now validates:

1. **Broker selected and not DummyBroker** (or respects `allowDummyFlow`)
2. **Funds present and not in error** — via `isFundsErrorOrMissing`. If errored, routes to `TokenExpireBrokerModal`.
3. **Zero-quantity holdings filtered** — prevents backend from seeing `{quantity: 0}` rows that inflate the sell list.
4. **`skipRepairRef`** — when the user initiates a fresh rebalance (not a repair retry), `skipRepairRef.current = true` bypasses stale `repairData` from previous runs.

## `buildBrokerPayloadFields(broker, credentials, decrypt, angelOneApiKey)`

| Broker | Fields |
|--------|--------|
| Zerodha | `{accessToken}` |
| Angel One | `{apiKey: angelOneApiKey, jwtToken}` |
| Upstox | `{apiKey (decrypted), apiSecret (decrypted), accessToken}` |
| ICICI Direct | `{apiKey, secretKey, accessToken}` (both decrypted) |
| Dhan | `{clientId, accessToken}` |
| Groww | `{accessToken}` |
| IIFL Securities | `{clientCode}` |
| Kotak | `{consumerKey, consumerSecret, accessToken, sid, serverId, viewToken}` |
| Hdfc Securities | `{apiKey (decrypted), accessToken}` |
| AliceBlue | `{clientId, accessToken, apiKey}` |
| Fyers | `{clientId, accessToken}` |
| Motilal Oswal | `{clientCode, accessToken, apiKey (decrypted)}` |
| Axis Securities | `{accessToken}` |
| DummyBroker | `{}` |
| default (unknown) | `{}` |

## `caPendingInfo` — Split-Settlement Tracking (v5.3.0)

When the rebalance produces BUY orders whose execution depends on SELL settlements clearing, the backend needs a hint that it's OK to enqueue the BUYs for later. `RebalanceModal` now passes `caPendingInfo` in the `process-trade` payload so the backend can split the batch into an immediate-fire set (SELLs) and a settlement-dependent set (BUYs), rather than failing the whole batch when broker funds are temporarily short.

## Sell-Against-Holdings Filter (v5.3.0)

Before a SELL order is submitted, `RebalanceModal` now filters the sell set against actual holdings — preventing cases where the backend recommended a SELL for a symbol the user doesn't own (possible after broker-side corporate actions or stale cache). Symbols the user doesn't own are dropped with a log; the rest proceed.

## `allOrdersFailed` Detection (v5.3.0)

After `process-trade` returns, the rebalance path checks for:

- `response.data.orderErrors?.length === totalOrdersSubmitted`
- `response.data.fundsRequired` populated with non-zero shortfall

Either condition → render the "Unable to Execute" recovery modal with "Fix Funds" / "Retry" actions, rather than the generic success panel.

## Publisher Timeout Fallback (v5.3.0)

Zerodha's Kite Publisher SDK runs in a WebView. On some devices the publisher's "basket submitted" postMessage doesn't fire even after the user completes the flow. A **90-second timeout** now fires if no postMessage arrives — after timeout, the flow enrolls the trades for a status-check sweep and treats them as "pending confirmation" rather than blocking the UI forever.

## Subscription-Amount Error → Modify Investment (v5.3.0)

If `POST ccxt/rebalance/calculate` returns `isSubscriptionAmountError(message) === true` on an MP plan, the user is now navigated to `AfterSubscriptionScreen` with a `modifyInvestment` prop instead of seeing an alert. This matches web — user can set the subscription amount inline and re-trigger rebalance without leaving the flow.

## Portfolio Shortfall Warning

When `checkPortfolioShortfall(response.data).isShortfall === true` (message contains "less than required minimum") **but** `hasTrades === true`, the backend is returning a reduced trade set. The UI should:
1. Show a non-blocking warning banner with `currentValue` and `requiredAmount`
2. Still let the user proceed with the reduced set
3. Suggest topping up funds afterwards

If `isShortfall && !hasTrades`, block with a hard error — nothing to execute.

## DummyBroker Rebalance

3-step flow, functionally aligned with web:
1. `POST ccxt/rebalance/process-trade` with DummyBroker `user_broker` sentinel
2. `POST api/subscriber/subscriber-execution` to record the execution
3. `POST api/subscriber/status-check-queue` to enqueue status reconciliation

Retry-once-with-2s-delay on each step. Emits `PORTFOLIO_EVENTS.HOLDINGS_REFRESH` on completion. 2s + 5s delayed refresh matches web.

## Relationship to ModelPortfolio flow

Rebalance = execute delta on an **existing subscription**. Model Portfolio first-time subscription goes through `MPReviewTradeModal.js` (see `docs/MODEL_PORTFOLIO.md`). Both share:
- `isFundsErrorOrMissing` / `isBrokerAuthError` pre-flight
- `buildBrokerPayloadFields` for credentials
- `detectTransientOrderWindowError` for all-failed soft-fail
- `portfolioEvents` (`HOLDINGS_REFRESH`, `REBALANCE_EXECUTED`) for UI refresh

## Key Files

| File | Purpose |
|------|---------|
| `src/utils/rebalanceHelpers.js` | All error detection + `buildBrokerPayloadFields` + `defaultDecrypt` |
| `src/utils/rebalanceDiffUtils.js` | `computeRebalanceDiff`, `computeRowsDiff`, `summarizeRebalanceDiff` (v5.3.0 new) |
| `src/components/AdviceScreenComponents/RebalanceAdvices.js` | Top-level list, tab container, auth error → reconnect router |
| `src/components/AdviceScreenComponents/RebalanceModal.js` | Trade preview, `process-trade` submission, transient-fail handling |
| `src/UIComponents/RebalanceAdvicesUI/RebalanceCard.js` | Per-plan card, pre-flight checks |
| `src/components/AdviceScreenComponents/RebalanceAdviceContent.js` | TPIN / EDIS / DDPI modal wiring with `reopenRebalanceModal` callbacks |
| `src/utils/portfolioEvents.js` | EventEmitter used to trigger cross-component refreshes after execute |

## RGX-Specific Divergences

- `X-Advisor-Subdomain` header uses `configData?.config?.REACT_APP_HEADER_NAME || configData?.subdomain || getAdvisorSubdomain()` (third fallback is the RGX-specific safety net).
- All `ccxtServer`, `ccxtWs`, `brokerAuth` URL bases go through `src/utils/serverConfig.js` — no hardcoded `alphaquark.in` URLs in rebalance code.
- Backend data writes to the `rgxresearch` Mongo namespace because of the header.
