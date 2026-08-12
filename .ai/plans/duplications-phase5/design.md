# Design: Code Duplication Elimination — Phase 5

**Feature:** Phase 5 — Frontend Triplication & Duplication Focus
**Version:** 1.0
**Date:** 2026-08-11

---

## 1. Architecture

### 1.1 Three-Tier Responsive Architecture

The frontend uses three parallel component tiers:

```
frontend/
  common/           # Tier-neutral (shared logic + neutral styling)
    components/ui/   # UI components (input, display, card, etc.)
    views/           # View components (dashboard views)
    stores/          # Zustand stores
    lib/             # Utilities (enum, logger, etc.)
  desktop/           # Desktop breakpoint variants
    components/ui/
    views/
  mobile/            # Mobile breakpoint variants
    components/ui/
    views/
```

### 1.2 Duplication Sources

The 470 frontend↔frontend clones arise from:

| Type | Pair Count | Description | Pattern |
|------|-----------|-------------|---------|
| D↔M views | 243 | Desktop↔Mobile view component pairs | `__shared__/` scaffold |
| C↔D components | 60 | Common↔Desktop component pairs | Extend common as scaffold |
| C↔M components | 51 | Common↔Mobile component pairs | Extend common as scaffold |
| C↔C views | 45 | Intra-common view duplication | Consolidate within common |
| C↔C components | 16 | Intra-common component duplication | Consolidate within common |
| D↔M components | 12 | Desktop↔Mobile component pairs | `__shared__/` scaffold |
| D↔D views | 11 | Intra-desktop view duplication | Consolidate within desktop |
| M↔M views | 10 | Intra-mobile view duplication | Consolidate within mobile |
| C↔D views | 6 | Common↔Desktop view pairs | Extend common as scaffold |
| C↔M views | 4 | Common↔Mobile view pairs | Extend common as scaffold |
| Other | 12 | Mixed | Case-by-case |

### 1.3 Scaffold Patterns

**⛔ CRITICAL: All shared scaffolds MUST live in `frontend/common/` — never in `frontend/desktop/` or `frontend/mobile/`.**

Desktop and mobile variants import scaffolds from `common/`. This respects:
- **ESLint `no-restricted-imports`**: Mobile files cannot import desktop files (regex `\.desktop`), and vice versa
- **dependency-cruiser**: Cross-tier imports are forbidden — `frontend/desktop/**` → `frontend/mobile/**` and vice versa
- **Tier isolation**: Scaffolds are tier-agnostic — no `useMediaQuery`, `useViewport`, or viewport context imports

**Pattern A: UI Component Scaffold (Triplication)**

```
frontend/common/components/ui/<category>/<Component>/
  <Component>Shared.tsx       # Scaffold with slotProps (tier-agnostic)
  <Component>.tsx             # Common tier variant (thin wrapper)
frontend/desktop/components/ui/<category>/<component>/
  <component>.desktop.tsx     # Desktop tier (imports Shared from common/, passes slots)
frontend/mobile/components/ui/<category>/<component>/
  <component>.mobile.tsx      # Mobile tier (imports Shared from common/, passes slots)
```

**Pattern B: View Component Scaffold (D↔M Duplication)**

```
frontend/common/views/dashboard/<domain>/components/
  __shared__/
    <componentName>Shared.tsx  # Scaffold with slotProps (tier-agnostic, lives in common/)
    <componentName>Shared.types.ts  # (optional) shared types
frontend/desktop/views/dashboard/<domain>/components/
  <componentName>.desktop.tsx  # Desktop variant (thin wrapper, imports from common/__shared__/)
frontend/mobile/views/dashboard/<domain>/components/
  <componentName>.mobile.tsx   # Mobile variant (thin wrapper, imports from common/__shared__/)
```

**⛔ Both desktop and mobile variants import the scaffold from `frontend/common/views/dashboard/<domain>/components/__shared__/`** — never from each other's tier directories.

**Pattern C: Canonical Source Deletion (Byte-Identical)**

When D↔M files are byte-identical (only function name differs):
```
frontend/common/views/dashboard/<domain>/components/
  <componentName>.tsx          # Single canonical file
# Delete .desktop.tsx and .mobile.tsx — re-export from common or import directly
```

---

## 2. Critical Policies

| Policy | Rationale |
|--------|-----------|
| **No barrel re-exports** for scaffold imports | Causes TDZ (Temporal Dead Zone) errors. Always use direct file paths. |
| **MUI v9 `sx` prop only** | Style props (`fontWeight`, `textAlign`, `mb`, `mt`, `p`, `display`) are NOT valid on Typography, Stack, Box, Grid. |
| **`*Outlined` icon naming** | `ErrorOutline` → `ErrorOutlined`, `InfoOutline` → `InfoOutlined`. |
| **No `oxlint-disable` comments** | Fix root cause. Type guards for `no-unsafe-type-assertion`. `Promise.all` for `no-await-in-loop`. Module-scope for `consistent-function-scoping`. |
| **⛔ No `jscpd:ignore` comments** | **NEVER** add `jscpd:ignore-start`/`jscpd:ignore-end` or any jscpd ignore directive. Always truly eliminate duplicates via scaffolds (Pattern A/B), canonical deletion (Pattern C), or consolidation. If a pair is truly structural (e.g., i18n type shapes), document in `deferred-items.md` — but never suppress with jscpd:ignore. |
| **Cross-tier import rules (ESLint + dependency-cruiser)** | Mobile files (`*.mobile.tsx/ts`) **MUST NOT** import desktop files (`*.desktop.tsx/ts`) and vice versa. Desktop/mobile variants **MUST** import shared scaffolds from `frontend/common/` only. Scaffolds live in `frontend/common/` (either `components/ui/` or `views/dashboard/<domain>/components/__shared__/`). Both desktop and mobile variants import scaffolds from `common/` — never from each other. |
| **Scaffolds are tier-agnostic** | Scaffolds in `frontend/common/` must NOT import `useMediaQuery`, `useViewport`, or any viewport context. They must NOT import from `frontend/desktop/**` or `frontend/mobile/**`. Tier-specific hooks/imports stay in the `.desktop.tsx`/`.mobile.tsx` wrappers. |
| **`logger` not `console.*`** | Use `import { logger } from '@/frontend/utils/logger'` in frontend. |
| **i18n: no hardcoded strings** | Use `useAppTranslation("namespace")` from `@/shared/locale/client`. Never hardcode user-facing text. |
| **No server tests** | Only `sub-loop.ts --lifecycle codescene` (read-only static analysis). |

---

## 3. Key Design Decisions

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | Top 10 clusters first (P0) | 34.9% of all frontend dup tokens in 10 clusters — highest ROI |
| 2 | `__shared__/` dir for D↔M view scaffolds | Follows Phase 3 precedent (`subjects/home/components/__shared__/`) |
| 3 | Common component as scaffold for triplication | When common already exists, lift it to `*Shared.tsx` with slot props |
| 4 | Canonical source deletion for byte-identical pairs | Simplest refactor — delete duplicate, import from canonical |
| 5 | Direct file path imports only | Prevents circular dependency / TDZ errors per scaffold pattern doc |
| 6 | Config-object slots for minor visual diffs | `DESKTOP_OPTIONS`/`MOBILE_OPTIONS` consts for fontsize/padding differences |
| 7 | Component slots for structural diffs | `ComponentType<P>` or render functions for different child components |
| 8 | Render function slots for type-contravariance | When desktop uses `UiTypographyVariant` and mobile uses `UiTypographyVariantLoose` |
| 9 |Extend existing scaffolds rather than duplicate | If `*Shared.tsx` exists, extend it — don't create a parallel scaffold |
| 10 | Batch single-pair clusters by directory | Group single-pair clusters in same domain to amortize context-switch cost. **⛔ Never use jscpd:ignore — always create proper scaffolds or consolidate.** |
| 11 | Cross-layer `enum.ts` / `logger` → consolidate to `shared/` | Per AGENTS.md cross-layer rules — `shared/` is canonical for cross-layer utilities |
| 12 | `frontend↔shared` locale type duplicates → document as structural | Structural duplication from i18n compile-time type pattern — 331 tokens. If Pattern A (consolidate to shared) is feasible without breaking i18n, do it. Otherwise document in `deferred-items.md`. ⛔ NEVER use jscpd:ignore. |

---

## 4. Phase Architecture

### Phase 0: Baseline & Review (serial)
- Task 0.1: Capture baseline (tsgo, jscpd, biome) → `/tmp/phase5-baseline-*.txt`
- Task 0.2: Plan review gate (invoke `plan-review` skill)

### Phase 1: Cross-Layer Consolidation (serial, 3 tasks)
- Task 1.1: Consolidate `enum.ts` → `shared/lib/enum.ts` canonical
- Task 1.2: Consolidate `logger` → `shared/lib/logger/base-logger.ts` canonical
- Task 1.3: Evaluate `useClassDetailsLabels.ts` ↔ `shared/locale/types/` pairs (fix or document as structural — ⛔ NO jscpd:ignore)

### Phase 2: P0 — Top 10 Clusters (parallel subagents, 10 clusters)
Each cluster gets one subagent that creates `__shared__/` scaffolds and converts variants:

| Task | Cluster | Pairs | Tokens | Effort | Approach |
|------|---------|-------|--------|--------|----------|
| 2.1 | permissions/components | 45 | 6,833 | L | New `__shared__/` for ~15 components |
| 2.2 | classes/recurring/components | 14 | 2,064 | M | New `__shared__/` (6 components) |
| 2.3 | ui/input/localizedString | 13 | 2,045 | M | Extend existing drawer scaffold pattern |
| 2.4 | reschedule/home/components | 12 | 1,726 | M | New `__shared__/` + delete byte-identical |
| 2.5 | dashboard/resources/components | 10 | 1,670 | M | New `__shared__/` (config-object slots) |
| 2.6 | teachers/dashboard/components | 8 | 1,651 | M | Extend `activationPolicyPanelShared` |
| 2.7 | dashboard/search-schedule/components | 8 | 1,584 | M | Extend calendar grid pattern |
| 2.8 | dashboard/reports/components | 11 | 1,465 | M | New `__shared__/` (4 components) |
| 2.9 | subjects/home/components | 10 | 1,545 | M | Extend existing `__shared__/` scaffolds |
| 2.10 | (deprecated frontend/views) | 0 | 0 | S | Verify & close |

### Phase 3: P1 — Medium 20 Clusters (parallel subagents, 5 waves of 4)

| Task | Clusters | Key Patterns |
|------|----------|-------------|
| 3.1 | ui/display/meetingConfig (9 pairs, 1258 tokens) | Extend existing `MeetingConfigDisplayShared` |
| 3.2 | ui/input/paymentMethodDefaultsEditor (8, 1216) | New UI scaffold |
| 3.3 | ui/input/timezoneSelect (5, 1029) | New UI scaffold |
| 3.4 | dashboard/complaints/components (7, 995) | New `__shared__/` |
| 3.5 | card/MetricCard/styled.tsx (4, 953) | Consolidate styled components |
| 3.6 | ui/input/meetingConfigTypeFields (7, 940) | New UI scaffold |
| 3.7 | ui/input/meetingConfigSelect (5, 871) | New UI scaffold |
| 3.8 | parent/dashboard/components (5, 819) | New `__shared__/` |
| 3.9 | ui/input/genderSelector (2, 808) | New UI scaffold |
| 3.10 | dashboard/suggestions/components (7, 777) | New `__shared__/` |
| 3.11 | ui/display/paymentMethod (3, 749) | Extend existing `PaymentMethodDisplayShared` |
| 3.12 | dashboard/students/quota (8, 695) | New `__shared__/` |
| 3.13 | teachers/reassignment/components (4, 691) | New `__shared__/` |
| 3.14 | billing/manual/components (5, 631) | New `__shared__/` |
| 3.15 | ui/input/languageSelector (3, 631) | New UI scaffold |

(remaining 5 medium clusters batched in Phase 3 wave 5)

### Phase 4: P2 — Single-Pair Clusters (parallel subagents, batched by domain)
49 clusters with 1 pair each (6,242 tokens). Batch by parent domain to amortize context:
- Batch 4.1: All UI component single-pair clusters (~15 pairs)
- Batch 4.2: All view single-pair clusters in `dashboard/` (~20 pairs)
- Batch 4.3: All remaining single-pair clusters (~14 pairs)

### Phase 5: Review Gates
- Task 5.1: Mid-point review (after Phase 2 completes) — jscpd verification + plan-review
- Task 5.2: Post-implementation review (after all phases) — plan-review
- Task 5.3: Final jscpd + quality gate verification

### Phase 6: Knowledge Propagation
- Task 6.1: Update `docs/frontend/ui-shared-scaffold-pattern.md` with Phase 5 rollout summary
- Task 6.2: Update `frontend/AGENTS.md` if new conventions established
- Task 6.3: Resolve `deferred-items.md`

---

## 5. Parallelism Strategy

| Phase | Subagent Count | Model |
|-------|----------------|-------|
| Phase 2 (P0) | 10 parallel (one per cluster) | general-purpose, background |
| Phase 3 (P1) | 5 waves × 3-4 subagents | general-purpose, background |
| Phase 4 (P2) | 3 batches × 5 subagents | general-purpose, background |

**Pool size: 16 max** (per quality-gate skill — 24 causes rate-limiting).

**Lifecycle stage for all subagents:** `codescene` (full sub-loop: tsgo → oxlint → biome → lint → check:duplicates → codescene).

---

## 6. Risk Assessment

| Risk | Severity | Likelihood | Mitigation |
|------|----------|------------|------------|
| Scaffold introduces circular dependency | High | Medium | Use direct file path imports, never barrel `index.ts`. Sub-loop's tsgo will catch. |
| Behavioral change in desktop/mobile variants | High | Low | Semantic review checklist per task. Compare rendered output before/after (manual inspection). |
| MUI v9 style prop violation | Medium | Medium | Sub-loop's lint stage catches. Use `sx` prop always. |
| Slot type contravariance (desktop vs mobile type mismatch) | Medium | Medium | Use render function slots instead of `ComponentType<P>` when types differ. |
| i18n hardcoded string introduced in scaffold | Medium | Low | Sub-loop's lint stage catches. Use `useAppTranslation`. |
| Subagent modifies wrong tier's file | Medium | Low | Fix-Or-Report rule — subagent only modifies assigned files. |
| Phase 4 (other session) conflicts with Phase 5 files | Low | Very Low | Phase 4 scope is backend/shared/app/scripts — no frontend files. Zero overlap. |
| Byte-identical pair deletion breaks barrel export | Medium | Low | Check `index.ts` barrel before deleting. Update barrel to re-export from canonical. |
| Jscpd reports fewer clones mid-execution (Phase 4 running in parallel) | Low | Medium | Baseline captured at Phase 0. Compare against baseline, not against live count. |

---

## 7. Edge Cases

| Edge Case | Handling |
|-----------|----------|
| Existing `*Shared.tsx` in wrong location (not `__shared__/`) | Migrate to `__shared__/` if it's a view scaffold; leave if it's a UI component scaffold (per pattern doc) |
| `activationPolicyPanelShared.tsx` exists but variants don't use it | Convert variants to thin wrappers — biggest single win in cluster 7 (704 tokens) |
| Cluster 4 (`localizedString`) has existing drawer scaffold | Extend by creating `localizedStringInputShared.tsx` alongside existing `localizedStringDrawerShared.tsx` |
| Desktop/mobile variants use different MUI components entirely | Use `ComponentType<P>` slot prop or render function |
| Variants differ only in `sx` prop values | Use config-object slot (`DESKTOP_SX` / `MOBILE_SX` consts passed as `slotProps`) |
| Paired files share a barrel `index.ts` that must be updated | Update barrel to re-export from new scaffold location. Verify no TDZ. |
| Intra-common duplication (C↔C, 45+16 pairs) | Consolidate within common — extract shared helper or merge into existing common component. **⛔ Never jscpd:ignore.** |
| Intra-desktop (D↔D, 11+1 pairs) / intra-mobile (M↔M, 10+1 pairs) | Consolidate within the tier — extract shared sub-component within same tier. **⛔ Never jscpd:ignore.** |

---

## 8. Knowledge Propagation Targets

| Target | Document | Content |
|--------|----------|---------|
| Scaffold pattern rollout summary | `docs/frontend/ui-shared-scaffold-pattern.md` | Add Phase 5 rollout table (clusters done, tokens eliminated) |
| Frontend AGENTS.md | `frontend/AGENTS.md` | Add any new `__shared__/` conventions discovered |
| Cross-layer enum consolidation | `docs/frontend/duplication-elimination-patterns.md` | Add `enum.ts` / `logger` consolidation case study |
| Deferred items | `.ai/plans/duplications-phase5/deferred-items.md` | Document any pairs that cannot be eliminated (structural, type constraints) |
