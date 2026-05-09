# rgx_app — `src/` byte-identical sync plan

> **Goal**: bring `src/` byte-identical with upstream `Alphab2bapp` (matching the contract documented in upstream's `docs/WHITELABEL_RECIPE.md`). Tenant-specific code lives in a top-level `whitelabel/` folder (rgx-only); variant UI in `designs/<variant>/` (rgx variant — likely needs creating).
>
> **Status**: SURVEY ONLY. No code changes yet. Awaiting sign-off on the categorization + phased execution plan below.
>
> **Drafted**: 2026-05-10 by /loop session that just completed the same exercise for the Alphanomy fork. Approach is the same; the scale is dramatically larger.

---

## 1 · The numbers

| | Value |
|---|---|
| Modified `src/` files | **170** |
| Whitespace-only diffs (trivial syncs) | 2 |
| Real content divergences | 170 |
| Top diff size (one file, lines changed) | 2698 (`MPInvestNowModal.js`) |
| Files only in rgx (likely dead-code or rgx-experimental) | 23 |
| Files only in upstream (rgx is missing — recent additions to upstream) | 37 |
| Total `src/` divergence surface | ~230 files |

This is **~7× the size** of the Alphanomy cleanup that just shipped. The rgx fork has accumulated many months of broker-flow integrations, a ported test suite, a brokerRegistry config, and per-screen variant work that has not converged with upstream.

---

## 2 · rgx commit themes (for context)

From `git log --oneline` (last 40 commits):

- **Heavy broker integration work**: Dhan OAuth, HDFC EgressIp gating, Groww connect modal, Kite/Zerodha basket flow, AngelOne booking flow, Upstox flow corrections, Fyers connect, AliceBlue, Axis, ICICI, Kotak, Motilal — every supported broker has rgx commits.
- **Test framework port**: 11 suites / 281 tests, "broker-qa integration test framework with .env.broker pattern", `rebalanceFlow.test.js`, `brokerTradeFlow.test.js`.
- **Recurring "alphab2b changes to rgx" sync commits**: rgx is content-port-synced from upstream periodically, same model as Alphanomy.
- **Performance chart, rebalance calculation, model-portfolio alignment**, "v51 crash prevention", "developer error" fixes.
- Latest commit: `51a434a fix(dhan): OAuth-primary flow + 5 partner broker audit (v5.3.3)`.

**Implication**: rgx is not strictly behind upstream. It's heavily ahead in some places (broker flows, tests) and behind in others (whatever upstream has shipped since `ac5cc25 sync alphab2b v3.8.0–v3.8.9 into rgx`). Bulk-overwriting either direction is wrong.

---

## 3 · Categorization scheme (verdicts)

Each file gets one verdict. Definitions:

| Verdict | Meaning | Action |
|---|---|---|
| `S` — Stale | rgx is behind upstream. Upstream's version is newer; rgx never synced. | Copy upstream → rgx. |
| `R` — RGX-improvement | rgx has work upstream doesn't. Generic-friendly improvement. | Port rgx → upstream. Then both byte-identical. |
| `V` — Variant integration | Variant-aware logic (DESIGN_VARIANT gates, viewModel enrichments, container/presentation splits). Generic-friendly. | Port rgx → upstream as variant infrastructure. |
| `T` — Tenant-specific | Per-rgx config (logos, APP_VARIANTS entries, env-specific keys). | Move OUT of `src/` into `whitelabel/`. |
| `B` — Both-direction | Both repos have improvements going different directions. | Manual merge: keep both improvements; result lands in both repos. |
| `WS` — Whitespace-only | LF/CRLF or trailing whitespace difference. | Trivial copy. |
| `?` — Needs deeper inspection | Diff size suggests genuine divergence; can't categorize from sample. | Read the file in detail before deciding. |

---

## 4 · Per-group verdicts (representative sampling)

### 4.1 — Tenant-specific (extract to `whitelabel/`)

**Verdict: T. Move out of `src/` into `whitelabel/`.**

| File | Note |
|---|---|
| `src/utils/Config.js` | rgx's `APP_VARIANTS` map (arfs, magnus, rgx, zamzam — old format, missing alphaquark/alphanomy entries). Move map to `whitelabel/appVariants.js`. `src/utils/Config.js` becomes the upstream re-exporter. |
| `src/__mocks__/react-native-config.js` | Test mock with `APP_VARIANT='rgxresearch'`. Probably stays as-is or moves to `whitelabel/__mocks__/`. Decide during execution. |
| `src/assets/AppLogo/logo.png` | RGX brand logo overwrote the shared default. **Same leak as Alphanomy had — fix the same way.** Stash to `designs/rgx/assets/`, revert shared path to upstream. |

Estimate: 3 files in this category.

### 4.2 — Whitespace-only

**Verdict: WS. One-line `cp` per file.**

| File |
|---|
| `src/components/PendingOrderWarningModal.js` |
| `src/services/ReconciliationService.js` |

Estimate: 2 files.

### 4.3 — Broker connection modals (likely R or B)

`src/components/BrokerConnectionModal/*` (15 files), `src/components/BrokerSelectionModal.js`, `src/components/TokenExpireBrokerModal.js`, `src/config/brokerRegistry.js`, plus `src/UIComponents/BrokerConnectionUI/*` (~12 files).

**Verdict: most likely R or B.** rgx has shipped broker work in every commit range (Dhan OAuth, HDFC EgressIp hard-gate, Groww publisher basket fixes, Kite Publisher product field, AngelOne flow, Upstox corrections, etc.). Some of this work upstream may already have done independently. Need per-file inspection.

Sub-estimate from sample:
- `EgressIpCallout.js` — 21-line diff. Probably small variant-aware additions or rgx-specific config wiring. R or B.
- `AngleoneBookingModal.js` — 137-line diff. rgx broker-flow correction. R.
- `GrowwConnectModal.js` — 894-line diff. Significant rgx work. Likely R, possibly with upstream-only bug fixes too → B.

Estimate: ~30 files in this category. **Highest-stakes group.** Risks shipping bugs OR erasing tested rgx work if done carelessly.

### 4.4 — Broker logic in utils + services + FunctionCall

| File | Likely |
|---|---|
| `src/utils/brokerAuth.js` | 411-line diff. R |
| `src/utils/brokerPublisher.js` | likely R |
| `src/FunctionCall/fetchBrokerAllHoldings.js` | R |
| `src/FunctionCall/fetchBrokerSpecificHoldings.js` | R |
| `src/FunctionCall/fetchFunds.js` | R or B |
| `src/services/BrokerOrderBookAPI.js` | R or S |

Estimate: ~13 files. Same risk profile as 4.3.

### 4.5 — Screen + container files (mostly heavy V or B)

`src/screens/Home/{HomeScreen,OrderScreen,WatchlistScreen,AccountSettingsScreen,...}.js`, `src/screens/Drawer/{ModelPortfolioScreen,MPPerformanceScreen,BespokePerformanceScreen,...}.js`, `src/screens/PortfolioScreen/PortfolioScreen.js`, `src/screens/Authentication/{LoginScreen,SignupScreen,SignUpRADetails}.js`, `src/screens/AccountSettingScreen/ChangeAdvisor.js`.

**Verdict: V or B**, with very large diffs (1000+ lines for several). Same pattern as Alphanomy's screens — variant integration + viewModel enrichment + container/presentation split. But rgx may be on a DIFFERENT design-system migration path than Alphanomy. Need to verify whether rgx uses `useComponent()` and the `designs/` pattern at all.

Estimate: ~25 files. **Largest individual diffs are here.**

### 4.6 — Model Portfolio + advice components (V or B, large)

`src/components/ModelPortfolioComponents/*` (~13 files including `MPInvestNowModal.js` at 2698-line diff), `src/components/AdviceScreenComponents/*` (~16 files including `StockAdvices.js` at 819-line diff), `src/components/HomeScreenComponents/*`.

**Verdict: V or B.** Heavy MP + advice flow work both upstream and rgx have shipped.

Estimate: ~30 files.

### 4.7 — Test suite (likely R, clean ports up)

`src/__tests__/integration/*`, `src/__tests__/utils/*` — 7 files. rgx ported these from upstream's earlier state per commit `8f1f899 add test suite: 11 suites (281 tests) ported from alphab2b`.

**Verdict: most likely R or S** — rgx has the up-to-date test ports; upstream may have evolved the tests since. Or rgx is behind. Need to compare per-file.

Estimate: 7 files.

### 4.8 — Misc (firebaseConfig, infrastructure)

| File | Verdict |
|---|---|
| `src/utils/firebaseConfig.js` | Same fix as alphanomy — drop hardcoded fallbacks. **R** (port up the no-fallback version). |
| `src/context/ConfigContext.js` | Same merge as alphanomy: hydrateFromCache (upstream) + googleWebClientId.trim() + taglines (rgx may or may not have these). **B**. |
| `src/utils/SecurityTokenManager.js`, `src/utils/storageUtils.js`, `src/utils/variantHelper.js`, `src/utils/websocketInitializer.js`, etc. | Mix of S / R / B. Per-file inspection. |
| `src/GlobalUIModals/*` | S or R. |

Estimate: ~10 files.

### 4.9 — Files only in rgx (23 fork-only files)

Sub-categorize once read:
- Likely dead-code from rgx's older snapshot (delete).
- Likely rgx-specific tests (move to `whitelabel/__tests__/` or delete if redundant).
- Possibly rgx-only working components (move to `whitelabel/` or `designs/rgx/`).

### 4.10 — Files only in upstream (37 missing in rgx)

Need rgx to receive these. They're upstream commits that rgx never synced. Pure copy down.

---

## 5 · Phased execution plan

Each phase ships in one rgx commit + one upstream commit (where applicable). After each phase, run the build, smoke-test the rgx variant, then proceed.

### Phase 0 — Baseline + scaffolding (~30 min)

- Add `whitelabel/` folder skeleton in rgx.
- Mirror upstream's `docs/WHITELABEL_RECIPE.md` into `rgx_app/docs/`.
- Write `rgx_app/SYNC.md` describing the fork's state, the unrelated-history situation, the per-machine setup gotchas.
- Document the regression tolerance: **rgx variant must continue to render correctly after each phase**, or we revert.

### Phase 1 — Quick wins (~30 min)

- 2 whitespace-only files → `cp` from upstream.
- 3 tenant-specific files → move to `whitelabel/`.
- 1 brand-asset leak → revert shared file + stash to `designs/rgx/assets/`.
- `firebaseConfig.js` → drop hardcoded fallbacks (R, port up).
- 37 upstream-only files → copy upstream → rgx.

After Phase 1: ~45 of 230 surface files resolved.

### Phase 2 — Test suite alignment (~1 hr)

- Per-file inspection of 7 test files. Decide R / S per file. Port accordingly.
- Verify tests still pass on rgx (`npm test`).

After Phase 2: ~52 / 230.

### Phase 3 — Misc utilities + ConfigContext (~2 hr)

- ~10 files: `ConfigContext` (B-merge, same as Alphanomy), GlobalUIModals, misc utils. Per-file inspection.

After Phase 3: ~62 / 230.

### Phase 4 — Broker logic in utils / services / FunctionCall (~3 hr)

- ~13 files: `brokerAuth.js`, `brokerPublisher.js`, fetch* helpers, `BrokerOrderBookAPI.js`. Read each, port direction-by-direction. **High risk of rgx-improvement loss; tread carefully.**

After Phase 4: ~75 / 230.

### Phase 5 — Broker connection modals + UIComponents (~5 hr)

- ~30 files: every broker connect modal, BrokerSelectionModal, TokenExpireBrokerModal, brokerRegistry, BrokerConnectionUI/*. **Highest-stakes group — rgx's last 6 months of broker-flow correction work lives here.**

After Phase 5: ~105 / 230.

### Phase 6 — Model Portfolio + Advice components (~5 hr)

- ~30 files. The 2698-line MPInvestNowModal diff is here. Likely a major design-system convergence task.

After Phase 6: ~135 / 230.

### Phase 7 — Screens + containers (~5 hr)

- ~25 files. Same pattern as Alphanomy's HomeScreen / OrderScreen / etc., scaled up.

After Phase 7: ~160 / 230.

### Phase 8 — Fork-only files cleanup + final verification (~1 hr)

- 23 fork-only files: delete or relocate.
- Final `diff -rq upstream/src rgx/src` should return nothing.
- Smoke-test rgx variant end-to-end.
- Update `SYNC.md` with the converged state + the standing rule.

After Phase 8: 230 / 230 — `src/` byte-identical.

**Total estimated time: 22-25 hours of focused work**, spread across multiple sessions. Realistically 4-6 sessions over 1-2 weeks.

---

## 6 · Risks + rollback

- **High-stakes group is broker connection modals** (Phase 5). rgx has tested broker flows we don't want to regress. Rollback plan: each phase is one git commit per repo; revert that commit and the phase is undone.
- **rgx may have its own design-system migration** that I haven't surveyed yet. If `designs/rgx/` doesn't exist, Phase 5+ may need to first build it before screens can be aligned.
- **Cross-repo coupling**: changes that land in upstream are immediately consumed by Alphanomy (which is now byte-identical and pushes from upstream). Any upstream regression hits 2 forks at once. Validate alphanomy after every upstream push.
- **Branch coordination**: rgx's active branch is `feature/zerodha_ibt`, which is its own active dev branch. Cleanup commits should land here OR a separate `feature/whitelabel-cleanup` branch; user decides.

---

## 6.5 · Strategy update — 2026-05-10 (post-survey, user directive)

**User decision**: "keep alphab2b broker setup in rgx also". The previously-flagged
high-stakes group (Phase 5 — broker connection modals + UIComponents +
brokerRegistry + broker utils + FunctionCall broker fetchers) is now
**bulk-overwrite from upstream**, not careful-merge.

Rationale: upstream's broker code reflects the canonical AlphaQuark broker
integration (Phase 3 SDK migration, EgressIpCallout hard-gate, sell-auth
architecture, broker-portal whitelist handling — all in upstream). rgx's
local broker patches (Dhan OAuth, HDFC EgressIp, Groww basket, Kite
publisher) are either already in upstream OR have been superseded by
upstream's evolution. Keeping rgx aligned with upstream's broker setup
is the explicit goal.

**Net effect on the plan**:
- Phases 4 + 5 collapse into bulk-copy-from-upstream operations.
- Estimated time drops from 22-25 hr to **~10-15 hr** total.
- The remaining careful-merge group is mostly: `ConfigContext.js`,
  `__tests__/`, the small set of files where rgx may have improvements
  upstream lacks (e.g. specific bugfixes that didn't make it back).
- **Phase 0 must additionally copy upstream's design-system infrastructure
  into rgx** — `src/design/`, `designs/`, `src/theme/` — because most
  upstream src/ files reference `useComponent()` and the token bundle.
  Without that scaffolding, bulk-copying screens will crash at runtime.

## 7 · Open questions (need answers before Phase 1)

1. ~~**Does rgx have an existing `designs/rgx/` folder?**~~ **Confirmed: NO.** rgx has **neither `designs/` nor `whitelabel/`**. The fork predates the entire design-system migration that landed in upstream around 2026-05-01 (Phases A–I). This is a much older snapshot than I assumed.

   **Implication — categorization shifts heavily**:
   - The "V — variant integration" verdict is mostly empty for rgx files (rgx doesn't have a variant system yet — there's nothing in rgx for it to "integrate with").
   - Most large diffs (HomeScreen 1262 lines, MPInvestNowModal 2698 lines, etc.) are **UPSTREAM-AHEAD**, not rgx-ahead. Upstream evolved through the design-system container/presentation split; rgx never received it.
   - The risky group is genuinely-rgx-ahead **broker work** (Phase 5 in the plan above). That's where rgx has shipped corrections upstream lacks.
   - The bulk of the work is **stale resync** (upstream → rgx), much like the alphanomy overwrite — but in this case there's no widespread alphanomy-style variant code to preserve.
   
   **Phase 0 must therefore include**: wiring up the design-system infrastructure in rgx (or at least a no-op shim) before Phase 5+ can land. Otherwise the upstream HomeScreen / MP screens will reference `useComponent('screens.HomeScreen')` which will throw.
2. **Is the current `feature/zerodha_ibt` branch fine to commit cleanup work to**, or should we do it on a separate `feature/sync-cleanup` branch and merge?
3. **What's the risk tolerance for Phase 5 broker work** — accept that one or two broker flows might regress and we fix forward, OR insist on per-broker QA between phases?
4. **Time budget**: the 22-25 hr estimate is substantial. Do we want to commit to all 8 phases, or stop after Phase 1+2+3 (the easy wins, ~3 hr) and revisit the bigger phases later?

---

## 8 · Recommended next step

Phase 0 + Phase 1 in this session (~1 hr total). Quick wins to validate the approach + get the scaffolding in place. Then user signs off on the broader plan before we touch broker code or screens.
