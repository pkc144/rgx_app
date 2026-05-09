# SYNC.md — rgx_app Whitelabel Overlay

This repo is a whitelabel overlay on top of the `Alphab2bapp` upstream. The
canonical contract for whitelabel forks is in
`docs/WHITELABEL_RECIPE.md` (mirrored from upstream). Read that first if
you're new here.

## Upstream

- **Repo**: `https://github.com/.../Alphab2bapp` (local clone at
  `/home/pk/Alphaquark_docs/AlphaQuark/codes/github/Alphab2bapp`)
- **Tracked branch**: `feature/sdk-plus-config_forkv2`
- **Last sync**: 2026-05-10 — Phase 0 + Phase 1 of the byte-identical
  src/ migration (see `docs/SYNC_PLAN.md` for the full plan).

## ⚠️ This fork has unrelated git history with upstream

`git merge-base feature/zerodha_ibt upstream/feature/sdk-plus-config_forkv2`
returns no merge base. This repo was not created by `git clone` from
Alphab2bapp — it was seeded as a fresh repo. As a result:

- The canonical `git fetch upstream && git merge upstream/<branch>` from
  `WHITELABEL_RECIPE.md` will **NOT** work here. Git would need
  `--allow-unrelated-histories` and would conflict on every shared file.
- Until the repo is rebuilt as a real clone of upstream (long-term
  cleanup), syncs happen by **content port**: read upstream's diff,
  port the relevant edits manually onto matching files here.

## What this fork contains (post-Phase 0)

- `whitelabel/appVariants.js` — APP_VARIANTS map for arfs / magnus /
  alphaquark / rgxresearch / zamzamcapital / EmptyStateUi (this fork's
  tenant set). Lifted out of `src/utils/Config.js` on 2026-05-10 so
  `src/utils/Config.js` can stay byte-identical with upstream.
- `designs/` — copied from upstream Phase 0. Adds the design-system
  infrastructure (`designs/default/`, `designs/registry.js`) the fork
  was missing entirely. New variant overlays go under `designs/<name>/`.
- `designs/rgx/assets/logo.png` — RGX brand mark, stashed from
  `src/assets/AppLogo/logo.png` (the shared asset was overwritten
  with the RGX logo on this fork — same leak the alphanomy fork had,
  fixed the same way: revert shared path, stash to designs/rgx/).
- `src/design/` — DesignProvider, useDesign, useComponent,
  resolveDesign. Copied from upstream Phase 0.
- `src/theme/` — colors, spacing, typography, radii, shadows, assets,
  useTokens. Copied from upstream Phase 0.
- `src/sdk/` — SdkProviderRoot. Copied from upstream Phase 0.
- `src/screens/Home/hooks/` — useHomeMarketSummary, useHomePlanSummary,
  useNotificationFeed (variant-friendly data hooks). Copied from
  upstream Phase 0.
- 25+ other upstream-only files (BrokerConnectModalDispatch,
  Phase3SdkBrokerModal, ExecutionGate, broker config, etc.) — copied
  from upstream Phase 0.

## Sync state — Phase 0 + Phase 1 (2026-05-10)

| Phase | Status | Files affected |
|---|---|---|
| 0 — scaffolding | Done | designs/, src/{design,theme,sdk}/, src/screens/Home/hooks/, ~30 upstream-only files, whitelabel/ folder |
| 1 — quick wins | Done | 2 WS-only files, brand-asset leak fix, firebaseConfig, Config.js → whitelabel re-exporter |
| 2 — test suite alignment | Pending | ~7 test files |
| 3 — misc utils + ConfigContext | Pending | ~10 files |
| 4 — broker logic in utils/services/FunctionCall | Pending (BULK OVERWRITE) | ~13 files |
| 5 — broker connection modals + UIComponents | Pending (BULK OVERWRITE) | ~30 files |
| 6 — Model Portfolio + Advice components | Pending | ~30 files |
| 7 — screens + containers | Pending | ~25 files |
| 8 — fork-only files cleanup | Pending | 23 files |

**Phases 4 + 5 are bulk-overwrites** per user directive 2026-05-10:
"keep alphab2b broker setup in rgx also". rgx's local broker patches are
adopted from upstream wholesale.

After Phase 0 + Phase 1: divergence dropped from 170 modified files to
~165 modified — but more importantly, the structural scaffolding
(designs/, theme/, sdk/, hooks/, whitelabel/) is in place so subsequent
phases can bulk-overwrite without runtime crashes.

## What this fork must NOT have

- A patch to `src/assets/*` — that breaks the default variant's
  appearance. Variant-specific images go under `designs/rgx/assets/`.
- Any `src/`-side patch that diverges from upstream behavior. If you find
  one, it belongs upstream as a generic improvement OR as a new
  variant-override mechanism that the fork then consumes. Do not
  perpetuate `src/`-side drift.
- A copy of `designs/default/` divergent from upstream's. Fallback chain
  handles default flow-through automatically.

## Sync workflow (today, until rebuild)

Same content-port pattern as Alphanomy fork. See its `SYNC.md` for the
prior-art workflow. The rule: anything tenant-specific lives in
`whitelabel/` or `designs/rgx/`; `src/` stays byte-identical with
upstream.

## Long-term: rebuild as a real fork

Same as alphanomy fork's plan — `git clone` upstream, re-apply this
fork's deltas (`designs/rgx/`, native shell, `whitelabel/`, `.env`,
this `SYNC.md`), force-push the clean history. Coordinate with anyone
who has the repo cloned.
