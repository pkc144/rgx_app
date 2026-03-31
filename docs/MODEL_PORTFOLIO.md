# Model Portfolio Architecture

> **Last updated**: 2026-03-31

## Overview

Model portfolios allow advisors to create curated stock baskets that subscribers can invest in. The system handles subscription, trade execution, rebalancing, and performance tracking.

## Flow

### 1. Subscription Flow

```
User browses available model portfolios
    │  Screen: PlansScreen / ModelPortfolioScreen
    │
    ▼
User taps "Subscribe" on a portfolio
    │  Opens UserStrategySubscribeModal.js
    │
    ▼
Payment processing (if required)
    │  Razorpay / Cashfree / PayU
    │
    ▼
Subscription created on backend
    │  POST /api/model-portfolio/subscribe
    │
    ▼
Portfolio appears in user's subscriptions
```

### 2. Trade Execution Flow

```
Advisor publishes rebalance signal
    │  Backend calculates buy/sell trades per subscriber
    │
    ▼
User sees rebalance notification
    │  RebalanceAdvices.js shows pending trades
    │
    ▼
User opens review modal → MPReviewTradeModal.js
    │  Shows buy/sell trades with quantities and prices
    │
    ▼
User confirms execution
    │  ProcessTrades.js routes to broker-specific endpoints
    │
    ▼
Orders placed → Results displayed
    │  Success/failure per stock shown
    │
    ▼
Portfolio holdings updated
```

### 3. Rebalancing Flow

See [REBALANCING.md](REBALANCING.md) for detailed rebalancing architecture.

## Key Files

| File | Purpose |
|------|---------|
| `src/components/ModelPortfolioComponents/MPReviewTradeModal.js` | Review and execute model portfolio trades |
| `src/components/ModelPortfolioComponents/UserStrategySubscribeModal.js` | Subscribe to a model portfolio |
| `src/services/ModelPortfolioService.js` | API calls for model portfolio operations |
| `src/screens/Drawer/ModelPortfolioScreen.js` | Model portfolio listing screen |
| `src/screens/Drawer/MPPerformanceScreen.js` | Portfolio performance tracking |
| `src/components/AdviceScreenComponents/RebalanceAdvices.js` | Rebalance trade cards |
| `src/components/AdviceScreenComponents/RebalanceModal.js` | Rebalance review modal |

## Trade Types

Model portfolio trades can be:
- **Buy**: New positions or adding to existing
- **Sell**: Reducing or exiting positions
- **Rebalance**: Adjusting weights to match target allocation

## Broker Integration

Trade execution goes through the same broker infrastructure as regular stock advices:
- `ProcessTrades.js` handles all broker-specific API routing
- `buildBrokerPayloadFields()` constructs broker-specific payloads
- `defaultDecrypt()` handles credential decryption

## Backend APIs

| Endpoint | Purpose |
|----------|---------|
| `GET /api/model-portfolio/strategies` | List available model portfolios |
| `POST /api/model-portfolio/subscribe` | Subscribe to a portfolio |
| `POST /api/model-portfolio/rebalance/calculate` | Calculate rebalance trades |
| `POST /api/model-portfolio/execute` | Execute model portfolio trades |
| `GET /api/model-portfolio/performance` | Get portfolio performance data |

## Parity with Web App

Both mobile and web apps:
- Use the same backend APIs for model portfolio operations
- Share the same `buildBrokerPayloadFields()` logic
- Support the same set of brokers for trade execution

Differences:
- Mobile uses `MPReviewTradeModal.js`, web uses `ReviewBrokerRecordsModal.js`
- Mobile navigation is stack-based, web uses route-based navigation
- Mobile has `DummyBrokerHoldingConfirmation` for simulation mode
