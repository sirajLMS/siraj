# Design: Code Duplication Elimination — Phase 8

**Feature:** Phase 8 — Final Residual Clone Elimination
**Version:** 1.0
**Date:** 2026-08-12

---

## 1. Architecture Overview

Phase 8 is the final phase, targeting 12 residual clone pairs (1,192 tokens) that survived Phases 1–7. These are the hardest residuals — Phase 6 explicitly documented many as "structurally too different for full scaffolding." Phase 8 uses **creative but safe extraction patterns** to eliminate every remaining pair **without jscpd:ignore and without reexport-only files**.

### 1.1 Refactoring Patterns (inherited from Phase 6 + new)

| Pattern | When to Use | Phase 8 Pairs |
|---------|-------------|-------------|
| **Pattern B:** Shared utility extraction | C↔C pairs — two files in `frontend/common/` duplicate a function | 1, 2, 3, 4 |
| **Pattern A:** `__shared__/*Shared` scaffold + options | D↔M pairs — desktop/mobile variants share structure with tier-specific sizing | 6, 8 |
| **Shared type extraction** | D↔M pairs — identical type annotations across tier variants | 9 |
| **Prop-spread refactor** | D↔M pairs — explicit prop pass-through to an existing `*Shared` component | 10 |
| **Hook-based prop forwarding** | D↔M pairs — ViewModel destructure + prop forwarding boilerplate duplicated | 11 |
| **Shared prop-bag type + spread** | D↔M pairs — identical 17-prop forwarding to a section component | 12 |
| **Factory function** | C↔C pairs — identical import + config boilerplate | 5 |
| **Dead barrel deletion** | D↔M barrel — 16/17 entries identical but zero consumers | 7 |

### 1.2 No-Reexport Policy (CRITICAL)

**Every new file created by Phase 8 MUST contain substantive logic.** No file may be a barrel that only re-exports from other files. Specifically:

- ❌ `export * from "./someModule"` — prohibited (reexport-only file)
- ❌ `export { foo, bar } from "./someModule"` — prohibited (reexport-only file)
- ✅ `export function foo() { /* logic */ }` — allowed (substantive)
- ✅ `export const BAR = 42;` — allowed (substantive)
- ✅ `export interface FooProps { /* fields */ }` — allowed (substantive type)
- ✅ `export function makeConfig(opts) { return { /* config */ } }` — allowed (factory)

For the D↔M barrel (Pair 7): the two per-tier input barrel files (`frontend/{desktop,mobile}/components/ui/input/index.ts`) are **dead code** — zero consumers import from them. The 16 "identical" `export *` lines in each barrel point to tier-specific subdirectories (e.g., desktop barrel's `./countrySelect` → `frontend/desktop/.../countrySelect/` with `.desktop.tsx` files; mobile barrel's `./countrySelect` → `frontend/mobile/.../countrySelect/` with `.mobile.tsx` files). All consumers already import via direct subpath imports (`@/frontend/{desktop,mobile}/components/ui/input/countrySelect`) or from the common barrel (`@/frontend/common/components/ui/input`). The parent UI barrels (`frontend/{desktop,mobile}/components/ui/index.ts`) re-export `./input` but **zero symbols** from the input subdirectory are consumed through that chain. Pair 7 is resolved by **deleting both barrel files** and **removing the dead `export * from "./input"` line** from both parent UI barrels. No new files are created. No consumer updates needed.

---

## 2. Component Design — Per-Clone-Pair

### 2.1 Pair 1: Excel Export Title Cell Duplication (84 tokens)

**Problem:** `report-export.ts` re-declares a title-cell merge+write that `shared-export-logic.ts` already exports as `writeMergedTitleCell()`.

**Solution:** Call the existing `writeMergedTitleCell()` from `report-export.ts` instead of re-declaring the merge logic inline.

**New files:** NONE (refactor existing file to call existing utility).

**Modified:**
- `frontend/common/utils/excel-export/report-export.ts` — replace inline merge logic with `writeMergedTitleCell(ws, title, totalCols)` call

### 2.2 Pairs 2–4: Billing ViewModel Utility Extraction (303 tokens)

**Problem:** `useParentBillingViewModel.ts` and `useUserBillingProfileViewModel.ts` share 3 duplicated sections: invoice fee formatting (Pair 2), billing summary builder (Pair 3), quick-pay action resolver (Pair 4).

**Solution:** Create a shared billing utilities module with three exported functions. Both ViewModels import from it.

**New files:**
- `frontend/common/views/dashboard/billing/__shared__/billingViewModelHelpers.ts` — exports:
  - `buildInvoiceFeeFromDisplayAmount(inv, locale, fxMessages, opts)` — Pair 2 extraction
  - `buildParentBillingSummary(summaryData, locale, fxMessages)` — Pair 3 extraction
  - `resolveQuickPayAction(summary, handlers, labels, locale, fxMessages)` — Pair 4 extraction

**Modified:**
- `frontend/common/views/dashboard/billing/useParentBillingViewModel.ts` — import and call shared helpers
- `frontend/common/views/dashboard/users/billing-profile/useUserBillingProfileViewModel.ts` — import and call shared helpers

**Parameterization:** The two VMs have different null-handling defaults (`stale ?? true` vs `stale ?? null`, `currency ?? CurrencyCode.Usd` vs `currency ?? null`). These are parameterized via the `opts` argument to `buildInvoiceFeeFromDisplayAmount`.

### 2.3 Pair 5: Profile Loading Skeleton Factory (83 tokens)

**Problem:** `ParentProfileLoadingSkeleton.tsx` and `StaffProfileLoadingSkeleton.tsx` share identical 10-line import headers + config-open pattern.

**Solution:** Create a factory function `createProfileLoadingSkeletonConfig(cards: ProfileCardConfig[])` in the existing `profile/shared/` directory. Both files call it instead of re-declaring the config boilerplate.

**New files:**
- `frontend/common/views/dashboard/profile/shared/createProfileLoadingSkeletonConfig.ts` — exports `createProfileLoadingSkeletonConfig()` factory

**Modified:**
- `frontend/common/views/dashboard/profile/parent/sections/ParentProfileLoadingSkeleton.tsx` — call factory
- `frontend/common/views/dashboard/profile/staff/sections/StaffProfileLoadingSkeleton.tsx` — call factory

### 2.4 Pair 6: Hero Summary Card Scaffold Unification (89 tokens)

**Problem:** Two tier-forked `__shared__/` scaffold files (one in `common/`, one in `mobile/`) duplicate the same JSX layout. The common one uses `DesktopPrimaryPageAction`, the mobile one uses `MobilePrimaryPageAction`.

**Solution:** Merge into a single tier-agnostic `HeroSummaryCardShared` component in `common/__shared__/` with a `PrimaryActionComponent` slot prop. Delete the mobile fork.

**New files:** NONE (modify existing)

**Modified:**
- `frontend/common/views/dashboard/supervisor/dashboard/components/__shared__/heroSummaryCardShared.tsx` — add `PrimaryActionComponent` slot prop, accept gap/layout options
- `frontend/mobile/views/dashboard/supervisor/dashboard/components/__shared__/supervisorHeroCardShared.tsx` — **DELETE**; mobile variant imports from common

**Files to update (consumers):**
- `frontend/mobile/views/dashboard/supervisor/dashboard/supervisorDashboard.mobile.tsx` (or wherever `supervisorHeroCardShared` is imported) → import from common `__shared__/`

### 2.5 Pair 7: D↔M Input Barrel Deletion (81 tokens)

**Problem:** Desktop and mobile input barrel files share 16 of 17 `export *` entries. Only line 1 diverges (catalogImageUpload.desktop vs catalogImageUpload.mobile).

**Investigation findings:**
1. **Zero consumers import from the bare barrel paths** (`@/frontend/{desktop,mobile}/components/ui/input`).
2. **The 16 "identical" lines are NOT truly identical** — each barrel's `./countrySelect` resolves to its own tier's subdirectory containing `.desktop.tsx` or `.mobile.tsx` files. They are different modules that happen to have the same relative path text.
3. **The parent UI barrels** (`frontend/{desktop,mobile}/components/ui/index.ts`) re-export `./input`, but **zero symbols** from the input subdirectory are consumed through the `@/frontend/{desktop,mobile}/components/ui` barrel chain. All 20 desktop symbols and 28 mobile symbols imported from the UI barrel come from other subdirectories (display, dataGrid, container, filter, state, etc.).
4. **`export *` is static ES module syntax** — it cannot be generated from a runtime array, making a "shared import list module" approach structurally impossible.

**Solution:** Delete both per-tier input barrel files and remove the dead `export * from "./input"` line from both parent UI barrels. This eliminates 100% of the duplicated tokens without creating any new files. No consumer updates needed because no consumer imports from these barrels.

**New files:** NONE

**Deleted:**
- `frontend/desktop/components/ui/input/index.ts` — 17 `export *` lines, zero consumers
- `frontend/mobile/components/ui/input/index.ts` — 17 `export *` lines, zero consumers

**Modified:**
- `frontend/desktop/components/ui/index.ts` — remove line `export * from "./input";` (dead re-export, zero symbols consumed through it)
- `frontend/mobile/components/ui/index.ts` — remove line `export * from "./input";` (dead re-export, zero symbols consumed through it)

### 2.6 Pair 8: Status Tracking DataGrid Shared SX (83 tokens)

**Problem:** Desktop and mobile statusTrackingDataGrid variants share an identical `sx` prop + `getRowClassName` callback for styled suspended rows.

**Solution:** Extract `STATUS_ROW_SX` constant and `statusRowClassName` callback into a shared module in the existing `common/.../tracking/components/__shared__/` directory.

**New files:**
- `frontend/common/views/dashboard/classes/status/tracking/components/__shared__/statusTrackingGridShared.ts` — exports `STATUS_ROW_SX` and `statusRowClassName`

**Modified:**
- `frontend/desktop/views/dashboard/classes/status/tracking/statusTrackingDataGrid.desktop.tsx` — import shared SX/className
- `frontend/mobile/views/dashboard/classes/status/tracking/statusTrackingDataGrid.mobile.tsx` — import shared SX/className

### 2.7 Pair 9: Schedule Alerts View Common Props Type (90 tokens)

**Problem:** Desktop and mobile `scheduleAlertsView` variants share identical 15-field destructured-prop type annotations with only 1 field differing (gridLabels vs cardListLabels).

**Solution:** Extract a `ScheduleAlertsViewCommonProps<TLabels>` generic interface in a shared types file.

**New files:**
- `frontend/common/views/dashboard/schedule/alerts/__shared__/scheduleAlertsViewSharedProps.ts` — exports `ScheduleAlertsViewCommonProps<TLabels>` interface

**Modified:**
- `frontend/desktop/views/dashboard/schedule/alerts/scheduleAlertsView.desktop.tsx` — use shared interface
- `frontend/mobile/views/dashboard/schedule/alerts/scheduleAlertsView.mobile.tsx` — use shared interface

### 2.8 Pair 10: Search Schedule Prop-Spread Refactor (98 tokens)

**Problem:** Desktop and mobile `searchSchedule` variants pass ~17 props explicitly to `SearchScheduleFormSectionShared`. 15 of 17 come from `rest` (the ViewModel return). Only `FormComponent` and `errorSx` differ.

**Solution:** Spread `rest` directly into `SearchScheduleFormSectionShared`, extracting only the diverging props.

**New files:** NONE (refactor existing)

**Modified:**
- `frontend/desktop/views/dashboard/search-schedule/searchSchedule.desktop.tsx` — spread `rest` into shared component
- `frontend/mobile/views/dashboard/search-schedule/searchSchedule.mobile.tsx` — spread `rest` into shared component

### 2.9 Pair 11: Create Recurring Class Dialog Hook-Based Prop Forwarding (173 tokens)

**Problem:** Desktop and mobile `createRecurringClassDialog` variants destructure 15 identical fields from `viewModel` and forward ~20 props to `CreateRecurringClassDialogShared`. Only `slots` and `layout` differ per tier.

**Solution:** Create a `useCreateRecurringClassDialogProps(viewModel)` hook that returns the shared prop object. Desktop/mobile files spread it and only specify `slots`/`layout`.

**New files:**
- `frontend/common/views/dashboard/teachers/schedule/weekly/components/__shared__/useCreateRecurringClassDialogProps.ts` — exports `useCreateRecurringClassDialogProps(viewModel)` hook

**Modified:**
- `frontend/desktop/views/dashboard/teachers/schedule/weekly/components/createRecurringClassDialog.desktop.tsx` — use hook, spread props
- `frontend/mobile/views/dashboard/teachers/schedule/weekly/components/createRecurringClassDialog.mobile.tsx` — use hook, spread props

### 2.10 Pair 12: User Billing Profile Prop-Bag Extraction (108 tokens)

**Problem:** Desktop and mobile `userBillingProfile` variants forward 17 identical props to their respective billing section components.

**Solution:** Extract a `UserBillingSectionProps` interface and a `useUserBillingSectionProps(viewModel)` hook that returns the shared prop bag. Both tiers spread it.

**New files:**
- `frontend/common/views/dashboard/users/billing-profile/__shared__/userBillingProfileSharedProps.ts` — exports `UserBillingSectionProps` interface + `useUserBillingSectionProps(viewModel)` hook

**Modified:**
- `frontend/desktop/views/dashboard/users/billing-profile/userBillingProfile.desktop.tsx` — use hook, spread props
- `frontend/mobile/views/dashboard/users/billing-profile/userBillingProfile.mobile.tsx` — use hook, spread props

---

## 3. Dependency Flow

```
Pair 1: report-export.ts → shared-export-logic.ts (existing)
Pairs 2-4: useParentBillingViewModel.ts ─┐
                                         ├→ billingViewModelHelpers.ts (NEW)
          useUserBillingProfileViewModel.ts ┘
Pair 5: ParentProfileLoadingSkeleton.tsx ─┐
                                         ├→ createProfileLoadingSkeletonConfig.ts (NEW)
          StaffProfileLoadingSkeleton.tsx ─┘
Pair 6: heroSummaryCardShared.tsx (common) ← supervisorHeroCardShared.tsx (mobile, DELETED)
Pair 7: desktop/input/index.ts (DELETED) + mobile/input/index.ts (DELETED)
         desktop/components/ui/index.ts (REMOVE `export * from "./input"`)
         mobile/components/ui/index.ts (REMOVE `export * from "./input"`)
Pair 8: statusTrackingDataGrid.desktop.tsx ─┐
                                             ├→ statusTrackingGridShared.ts (NEW)
          statusTrackingDataGrid.mobile.tsx ─┘
Pair 9: scheduleAlertsView.desktop.tsx ─┐
                                        ├→ scheduleAlertsViewSharedProps.ts (NEW)
          scheduleAlertsView.mobile.tsx ─┘
Pair 10: searchSchedule.desktop.tsx (spread rest)
Pair 11: createRecurringClassDialog.desktop.tsx ─┐
                                                  ├→ useCreateRecurringClassDialogProps.ts (NEW)
          createRecurringClassDialog.mobile.tsx ─┘
Pair 12: userBillingProfile.desktop.tsx ─┐
                                          ├→ userBillingProfileSharedProps.ts (NEW)
          userBillingProfile.mobile.tsx ─┘
```

---

## 4. Semantic Review Checklist (Per Task)

### Race Conditions & Concurrency
- [ ] No read-then-write sequences without atomicity
- [ ] No module-level mutable state without bounded size

### Code Quality
- [ ] No dead branches (all paths reachable)
- [ ] No cross-layer imports (frontend → backend, shared → frontend/backend)
- [ ] No reexport-only files (every new file has substantive logic)
- [ ] No `as Type` assertions (use type guards per AGENTS.md)

### Schema & Types
- [ ] All enums imported as value imports when used in runtime
- [ ] No string literals where enum types expected
- [ ] Proper generic constraints on shared interfaces

### Deferred Work
- [ ] No deferred items without entry in `deferred-items.md`

---

## 5. Extraction Strategy Rules

Every clone pair MUST be resolved by ONE of:
- **Pattern A:** `__shared__/*Shared.tsx` scaffold + options for D↔M pairs
- **Pattern B:** Extract shared utility to `frontend/common/` for C↔C pairs
- **Factory function** for boilerplate patterns
- **Hook-based prop forwarding** for D↔M wrapper boilerplate
- **Shared type/interface extraction** for duplicated type annotations
- **Prop-spread refactor** for explicit prop pass-through to existing shared components

**NEVER use `// jscpd:ignore-start` or `// jscpd:ignore-end`.**
**NEVER modify `.jscpd.json` to add ignore patterns.**
**NEVER create reexport-only files (`export * from` / `export { x } from`).**