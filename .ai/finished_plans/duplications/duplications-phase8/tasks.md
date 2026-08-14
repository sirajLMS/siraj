# Tasks: Code Duplication Elimination — Phase 8

**Feature:** Phase 8 — Final Residual Clone Elimination (D7-6 Carry-Forward + D↔M Scaffold Residuals)
**Version:** 1.0
**Date:** 2026-08-12

**CRITICAL: No `jscpd:ignore` directives anywhere. No `.jscpd.json` changes. Every pair resolved by true code extraction. No reexport-only files.**

---

## Task Conventions

### Per-Task Subtasks (QL / SR / IV)

Every task that modifies code MUST include these three subtasks:

1. **QL (Quality Loop):** Run `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` per modified file. Exit code 0 = pass. Fix all errors before proceeding.
2. **SR (Semantic Review):** Agent self-review against the Semantic Review Checklist (race conditions, dead code, cross-layer imports, schema/types, no reexport-only files). See design.md for checklist.
3. **IV (Instruction Verification):** Read all instruction files and AGENTS.md files printed by `sub-loop.ts` for the target file. Verify compliance. Fix or report cross-file dependencies.

### No-Server-Tests Policy (MANDATORY)

| Command | Status |
|---------|--------|
| `bun run test:graphql` | ❌ NEVER |
| `bun run test:ui:e2e` | ❌ NEVER |
| `bun run test:ui:components` | ❌ NEVER |
| `bun run test:ui` | ❌ NEVER |
| `bun run build:test` | ❌ NEVER |
| `bun run test:integration` | ❌ NEVER |
| `bun run test:integration:sequential` | ❌ NEVER |
| `bun run test:db` | ❌ NEVER |
| `bun run test:db:sequential` | ❌ NEVER |
| `bun run test:services` | ❌ NEVER |
| `bun run test:services:sequential` | ❌ NEVER |
| `bun run test:live-comm` | ❌ NEVER |
| `bun run test:live-fx` | ❌ NEVER |
| `bun run test` | ❌ NEVER |
| `bun run scripts/run-test/run-test.ts <path>` | ❌ NEVER |

**Sole verification method:** `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene`

### No-Reexport Policy (CRITICAL)

Every new file created by Phase 8 MUST contain substantive logic (functions, components, types, constants, factories). Files containing ONLY `export * from` or `export { X } from "./..."` statements are **strictly prohibited**.

### Extraction Strategy (NO SUPPRESSION)

Every clone pair MUST be resolved by ONE of:
- **Pattern A:** Create `__shared__/*Shared.tsx` scaffold + `*Shared.options.ts` for D↔M pairs
- **Pattern B:** Extract shared utility/component to `frontend/common/` for C↔C pairs
- **Factory function** for boilerplate patterns
- **Hook-based prop forwarding** for D↔M wrapper boilerplate
- **Shared type/interface extraction** for duplicated type annotations
- **Prop-spread refactor** for explicit prop pass-through to existing shared components

**NEVER use `// jscpd:ignore-start` or `// jscpd:ignore-end`.**
**NEVER modify `.jscpd.json` to add ignore patterns.**
**NEVER create reexport-only files.**

### AGENTS.md Mapping

| File Path | Applicable AGENTS.md |
|-----------|---------------------|
| `frontend/common/**/*.ts(x)` | `frontend/AGENTS.md`, `frontend/common/components/ui/AGENTS.md` (if ui/) |
| `frontend/desktop/**/*.ts(x)` | `frontend/AGENTS.md`, `frontend/desktop/AGENTS.md` |
| `frontend/mobile/**/*.ts(x)` | `frontend/AGENTS.md`, `frontend/mobile/AGENTS.md` |

### Scaffold Pattern Reference

- `docs/frontend/ui-shared-scaffold-pattern.md`
- `docs/frontend/duplication-elimination-patterns.md`
- Existing examples in `frontend/common/views/dashboard/classes/recurring/components/__shared__/`

### Subagent Rule

ALL subagents MUST read ALL plan files in `.ai/plans/duplications-phase8/` before starting work:
- `requirements.md`
- `design.md`
- `tasks.md`
- `deferred-items.md`

---

## Phase 0: Baseline & Plan Review (Serial)

### Task 0.1: Capture Baseline
- [x] 0.1.1 Run `bunx jscpd . --config .jscpd.json` to generate baseline: 12 clones, 1,192 tokens, 3,208 files
- [x] 0.1.2 Categorize: C↔C utility 4 pairs (387t), C↔C skeleton 1 pair (83t), D↔M scaffold residual 1 pair (89t), D↔M barrel 1 pair (81t), D↔M residuals 5 pairs (641t)
- [x] 0.1.3 Write outcome: `.ai/plans/duplications-phase8/outcome/0.1-baseline-outcome.md`
- [x] 0.1.4 Update progress: Mark 0.1 as `[x]`

### Task 0.2: Plan Review via @plan-review Skill
- [x] 0.2.1 Invoke `@plan-review` skill on this plan
- [x] 0.2.2 Fix all violations reported
- [x] 0.2.3 Re-run `@plan-review` until output is "Plan passes all AGENTS.md rules"
- [x] 0.2.4 Write outcome: `.ai/plans/duplications-phase8/outcome/0.2-plan-review-outcome.md`
- [x] 0.2.5 Update progress: Mark 0.2 as `[x]`

---

## Phase 1: C↔C Cross-File Utility Extraction (Serial)

### Task 1.1: Pair 1 — Excel Export Title Cell Dedup (84 tokens)
**Problem:** `report-export.ts` [132:9–140:8] re-declares title-cell merge+write that `shared-export-logic.ts` [71:80–75:2] already exports as `writeMergedTitleCell()`.
**Solution:** Replace inline merge logic in `report-export.ts` with a call to the existing `writeMergedTitleCell()` utility.

- [x] 1.1.1 Read all plan files
- [x] 1.1.2 Read `frontend/common/utils/excel-export/report-export.ts` lines 125–150 and `frontend/common/utils/excel-export/shared-export-logic.ts` lines 65–85
- [x] 1.1.3 Refactor `report-export.ts` to call `writeMergedTitleCell()` from `shared-export-logic.ts` instead of re-declaring the merge logic
- [x] 1.1.4 QL: `bun run scripts/health/sub-loop.ts frontend/common/utils/excel-export/report-export.ts --lifecycle codescene` (exit 0)
- [x] 1.1.5 SR: Verify `writeMergedTitleCell` signature matches usage; no dead code; no cross-layer imports
- [x] 1.1.6 IV: Read AGENTS.md files printed by sub-loop.ts
- [x] 1.1.7 Outcome: `.ai/plans/duplications-phase8/outcome/1.1-excel-export-outcome.md`
- [x] 1.1.8 Update progress: Mark 1.1 as `[x]`

### Task 1.2: Pairs 2–4 — Billing ViewModel Helpers Extraction (303 tokens)
**Problem:** `useParentBillingViewModel.ts` and `useUserBillingProfileViewModel.ts` share 3 duplicated sections (117 + 96 + 90 tokens).
**Solution:** Create `billingViewModelHelpers.ts` with 3 exported functions; both VMs import from it.

- [x] 1.2.1 Read all plan files
- [x] 1.2.2 Read `frontend/common/views/dashboard/billing/useParentBillingViewModel.ts` lines 230–330 and `frontend/common/views/dashboard/users/billing-profile/useUserBillingProfileViewModel.ts` lines 55–115, 295–325
- [x] 1.2.3 Create `frontend/common/views/dashboard/billing/__shared__/billingViewModelHelpers.ts`:
  - `buildInvoiceFeeFromDisplayAmount(inv, locale, fxMessages, opts)` — Pair 2 extraction (parameterize `staleDefault` and `currencyDefault`)
  - `buildParentBillingSummary(summaryData, locale, fxMessages)` — Pair 3 extraction
  - `resolveQuickPayAction(summary, handlers, labels, locale, fxMessages)` — Pair 4 extraction
- [x] 1.2.4 QL (new file): `bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/billing/__shared__/billingViewModelHelpers.ts --lifecycle codescene` (exit 0)
- [x] 1.2.5 Refactor `useParentBillingViewModel.ts` to import and call shared helpers
- [x] 1.2.6 QL: `bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/billing/useParentBillingViewModel.ts --lifecycle codescene` (exit 0)
- [x] 1.2.7 Refactor `useUserBillingProfileViewModel.ts` to import and call shared helpers
- [x] 1.2.8 QL: `bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/users/billing-profile/useUserBillingProfileViewModel.ts --lifecycle codescene` (exit 0)
- [x] 1.2.9 SR: Verify parameterized defaults match original behavior (stale true vs null, currency Usd vs null); no dead code; no `as Type` assertions
- [x] 1.2.10 IV: Read AGENTS.md files printed by sub-loop.ts for all 3 files
- [x] 1.2.11 Outcome: `.ai/plans/duplications-phase8/outcome/1.2-billing-vm-helpers-outcome.md`
- [x] 1.2.12 Update progress: Mark 1.2 as `[x]`

### Task 1.3: Pair 5 — Profile Loading Skeleton Factory (83 tokens)
**Problem:** `ParentProfileLoadingSkeleton.tsx` [1:1–10:36] and `StaffProfileLoadingSkeleton.tsx` [1:1–10:36] share identical 10-line import headers + config-open pattern.
**Solution:** Create `createProfileLoadingSkeletonConfig()` factory; both files call it.

- [x] 1.3.1 Read all plan files
- [x] 1.3.2 Read both skeleton files and `frontend/common/views/dashboard/profile/shared/ProfileLoadingSkeleton.tsx`
- [x] 1.3.3 Create `frontend/common/views/dashboard/profile/shared/createProfileLoadingSkeletonConfig.ts` — export `createProfileLoadingSkeletonConfig(cards: ProfileCardConfig[])` factory
- [x] 1.3.4 QL (new file): `bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/profile/shared/createProfileLoadingSkeletonConfig.ts --lifecycle codescene` (exit 0)
- [x] 1.3.5 Refactor `ParentProfileLoadingSkeleton.tsx` to use factory
- [x] 1.3.6 QL: `bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/profile/parent/sections/ParentProfileLoadingSkeleton.tsx --lifecycle codescene` (exit 0)
- [x] 1.3.7 Refactor `StaffProfileLoadingSkeleton.tsx` to use factory
- [x] 1.3.8 QL: `bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/profile/staff/sections/StaffProfileLoadingSkeleton.tsx --lifecycle codescene` (exit 0)
- [x] 1.3.9 SR: Verify config shapes match originals; no dead code
- [x] 1.3.10 IV: Read AGENTS.md files printed by sub-loop.ts
- [x] 1.3.11 Outcome: `.ai/plans/duplications-phase8/outcome/1.3-skeleton-factory-outcome.md`
- [x] 1.3.12 Update progress: Mark 1.3 as `[x]`

---

## Phase 2: D↔M Scaffold Residuals — Shared Module Extraction (Parallelizable)

### Task 2.1: Pair 6 — Hero Summary Card Scaffold Unification (89 tokens)
**Problem:** Two tier-forked `__shared__/` scaffold files duplicate the same JSX layout.
**Solution:** Merge into single tier-agnostic `HeroSummaryCardShared` with `PrimaryActionComponent` slot; delete mobile fork.

- [x] 2.1.1 Read all plan files
- [x] 2.1.2 Read `frontend/common/views/dashboard/supervisor/dashboard/components/__shared__/heroSummaryCardShared.tsx` and `frontend/mobile/views/dashboard/supervisor/dashboard/components/__shared__/supervisorHeroCardShared.tsx`
- [x] 2.1.3 Modify `heroSummaryCardShared.tsx` to accept `PrimaryActionComponent` slot prop and `gap`/layout options
- [x] 2.1.4 QL: `bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/supervisor/dashboard/components/__shared__/heroSummaryCardShared.tsx --lifecycle codescene` (exit 0)
- [x] 2.1.5 Find all consumers of `supervisorHeroCardShared.tsx` and update imports to use `heroSummaryCardShared` with `MobilePrimaryPageAction` slot
- [x] 2.1.6 Delete `frontend/mobile/views/dashboard/supervisor/dashboard/components/__shared__/supervisorHeroCardShared.tsx`
- [x] 2.1.7 QL: Run `bun run scripts/health/sub-loop.ts <each-modified-consumer> --lifecycle codescene` (exit 0)
- [x] 2.1.8 SR: Verify tier differences preserved via slots; no dead code; no cross-tier imports
- [x] 2.1.9 IV: Read `frontend/AGENTS.md`, `frontend/desktop/AGENTS.md`, `frontend/mobile/AGENTS.md`
- [x] 2.1.10 Outcome: `.ai/plans/duplications-phase8/outcome/2.1-hero-card-unification-outcome.md`
- [x] 2.1.11 Update progress: Mark 2.1 as `[x]`

### Task 2.2: Pair 7 — D↔M Input Barrel Deletion (81 tokens)
**Problem:** Desktop and mobile input barrel files share 16 of 17 `export *` entries, but both barrels have zero consumers.
**Solution:** Delete both barrel files and remove the dead `export * from "./input"` line from both parent UI barrels. No new files created.

- [x] 2.2.1 Read all plan files
- [x] 2.2.2 Read `frontend/desktop/components/ui/input/index.ts` and `frontend/mobile/components/ui/input/index.ts` — confirm 17 `export *` lines each
- [x] 2.2.3 Read `frontend/desktop/components/ui/index.ts` and `frontend/mobile/components/ui/index.ts` — confirm `export * from "./input"` exists in each
- [x] 2.2.4 Delete `frontend/desktop/components/ui/input/index.ts`
- [x] 2.2.5 Delete `frontend/mobile/components/ui/input/index.ts`
- [x] 2.2.6 Remove `export * from "./input";` line from `frontend/desktop/components/ui/index.ts`
- [x] 2.2.7 Remove `export * from "./input";` line from `frontend/mobile/components/ui/index.ts`
- [x] 2.2.8 QL: `bun run scripts/health/sub-loop.ts frontend/desktop/components/ui/index.ts --lifecycle codescene` (exit 0)
- [x] 2.2.9 QL: `bun run scripts/health/sub-loop.ts frontend/mobile/components/ui/index.ts --lifecycle codescene` (exit 0)
- [x] 2.2.10 SR: Verify zero broken imports — run `bun tsgo` to confirm no TypeScript errors from deleted barrels; verify no new files created (no reexport-only files); verify `catalogImageUpload.{desktop,mobile}.stories.tsx` still import directly (bypass barrel)
- [x] 2.2.11 IV: Read `frontend/AGENTS.md`, `frontend/desktop/AGENTS.md`, `frontend/mobile/AGENTS.md`
- [x] 2.2.12 Outcome: `.ai/plans/duplications-phase8/outcome/2.2-input-barrel-outcome.md`
- [x] 2.2.13 Update progress: Mark 2.2 as `[x]`

### Task 2.3: Pair 8 — Status Tracking Grid Shared SX (83 tokens)
**Problem:** Desktop and mobile statusTrackingDataGrid share identical `sx` + `getRowClassName` for styled suspended rows.
**Solution:** Extract `STATUS_ROW_SX` constant + `statusRowClassName` callback to shared module.

- [x] 2.3.1 Read all plan files
- [x] 2.3.2 Read `frontend/desktop/views/dashboard/classes/status/tracking/statusTrackingDataGrid.desktop.tsx` lines 155–175 and `frontend/mobile/views/dashboard/classes/status/tracking/statusTrackingDataGrid.mobile.tsx` lines 228–248
- [x] 2.3.3 Create `frontend/common/views/dashboard/classes/status/tracking/components/__shared__/statusTrackingGridShared.ts`:
  - `STATUS_ROW_SX` — exported const with the `sx` callback using `theme.palette.status.blocked` + `alpha`
  - `statusRowClassName(row)` — exported callback for `getRowClassName`
- [x] 2.3.4 QL (new file): `bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/classes/status/tracking/components/__shared__/statusTrackingGridShared.ts --lifecycle codescene` (exit 0)
- [x] 2.3.5 Refactor `statusTrackingDataGrid.desktop.tsx` to import shared `STATUS_ROW_SX` + `statusRowClassName`
- [x] 2.3.6 QL: `bun run scripts/health/sub-loop.ts frontend/desktop/views/dashboard/classes/status/tracking/statusTrackingDataGrid.desktop.tsx --lifecycle codescene` (exit 0)
- [x] 2.3.7 Refactor `statusTrackingDataGrid.mobile.tsx` to import shared `STATUS_ROW_SX` + `statusRowClassName`
- [x] 2.3.8 QL: `bun run scripts/health/sub-loop.ts frontend/mobile/views/dashboard/classes/status/tracking/statusTrackingDataGrid.mobile.tsx --lifecycle codescene` (exit 0)
- [x] 2.3.9 SR: Verify theme palette access correct; no hardcoded colors; no `as Type` assertions
- [x] 2.3.10 IV: Read `frontend/AGENTS.md`, `frontend/desktop/AGENTS.md`, `frontend/mobile/AGENTS.md`
- [x] 2.3.11 Outcome: `.ai/plans/duplications-phase8/outcome/2.3-status-grid-sx-outcome.md`
- [x] 2.3.12 Update progress: Mark 2.3 as `[x]`

### Task 2.4: Pair 9 — Schedule Alerts View Common Props Type (90 tokens)
**Problem:** Desktop and mobile scheduleAlertsView share identical 15-field destructured-prop type with only 1 field differing.
**Solution:** Extract `ScheduleAlertsViewCommonProps<TLabels>` generic interface.

- [x] 2.4.1 Read all plan files
- [x] 2.4.2 Read `frontend/desktop/views/dashboard/schedule/alerts/scheduleAlertsView.desktop.tsx` lines 70–95 and `frontend/mobile/views/dashboard/schedule/alerts/scheduleAlertsView.mobile.tsx` lines 73–98
- [x] 2.4.3 Create `frontend/common/views/dashboard/schedule/alerts/__shared__/scheduleAlertsViewSharedProps.ts`:
  - Export `ScheduleAlertsViewCommonProps<TLabels>` generic interface with 15 common fields + `labels: TLabels` generic field
- [x] 2.4.4 QL (new file): `bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/schedule/alerts/__shared__/scheduleAlertsViewSharedProps.ts --lifecycle codescene` (exit 0)
- [x] 2.4.5 Refactor `scheduleAlertsView.desktop.tsx` to use shared interface with `AcademicScheduleDataGridDesktopLabels` as type param
- [x] 2.4.6 QL: `bun run scripts/health/sub-loop.ts frontend/desktop/views/dashboard/schedule/alerts/scheduleAlertsView.desktop.tsx --lifecycle codescene` (exit 0)
- [x] 2.4.7 Refactor `scheduleAlertsView.mobile.tsx` to use shared interface with `AcademicScheduleCardListMobileLabels` as type param
- [x] 2.4.8 QL: `bun run scripts/health/sub-loop.ts frontend/mobile/views/dashboard/schedule/alerts/scheduleAlertsView.mobile.tsx --lifecycle codescene` (exit 0)
- [x] 2.4.9 SR: Verify type param constraints correct; all 15 fields preserved; no dead code
- [x] 2.4.10 IV: Read `frontend/AGENTS.md`, `frontend/desktop/AGENTS.md`, `frontend/mobile/AGENTS.md`
- [x] 2.4.11 Outcome: `.ai/plans/duplications-phase8/outcome/2.4-alerts-props-type-outcome.md`
- [x] 2.4.12 Update progress: Mark 2.4 as `[x]`

### Task 2.5: Pair 10 — Search Schedule Prop-Spread Refactor (98 tokens)
**Problem:** Desktop and mobile searchSchedule pass ~17 props explicitly to `SearchScheduleFormSectionShared`; 15 of 17 come from `rest`.
**Solution:** Spread `rest` directly, extracting only diverging props (`FormComponent`, `errorSx`).

- [x] 2.5.1 Read all plan files
- [x] 2.5.2 Read `frontend/desktop/views/dashboard/search-schedule/searchSchedule.desktop.tsx` lines 105–130 and `frontend/mobile/views/dashboard/search-schedule/searchSchedule.mobile.tsx` lines 145–175
- [x] 2.5.3 Refactor `searchSchedule.desktop.tsx` to spread `{...rest}` into `SearchScheduleFormSectionShared`, keeping only `FormComponent={SearchScheduleFormDesktop}` and `error={...}` explicit
- [x] 2.5.4 QL: `bun run scripts/health/sub-loop.ts frontend/desktop/views/dashboard/search-schedule/searchSchedule.desktop.tsx --lifecycle codescene` (exit 0)
- [x] 2.5.5 Refactor `searchSchedule.mobile.tsx` to spread `{...rest}`, keeping `FormComponent={SearchScheduleFormMobile}` and `errorSx={MOBILE_ERROR_SX}` explicit
- [x] 2.5.6 QL: `bun run scripts/health/sub-loop.ts frontend/mobile/views/dashboard/search-schedule/searchSchedule.mobile.tsx --lifecycle codescene` (exit 0)
- [x] 2.5.7 SR: Verify `rest` type matches `SearchScheduleFormSectionShared` props; no missing props; no extra props
- [x] 2.5.8 IV: Read `frontend/AGENTS.md`, `frontend/desktop/AGENTS.md`, `frontend/mobile/AGENTS.md`
- [x] 2.5.9 Outcome: `.ai/plans/duplications-phase8/outcome/2.5-search-schedule-spread-outcome.md`
- [x] 2.5.10 Update progress: Mark 2.5 as `[x]`

### Task 2.6: Pair 11 — Create Recurring Class Dialog Hook-Based Prop Forwarding (173 tokens)
**Problem:** Desktop and mobile createRecurringClassDialog destructure 15 identical fields from `viewModel` and forward ~20 props to `CreateRecurringClassDialogShared`.
**Solution:** Create `useCreateRecurringClassDialogProps(viewModel)` hook; both tiers spread it + specify `slots`/`layout`.

- [x] 2.6.1 Read all plan files
- [x] 2.6.2 Read `frontend/desktop/views/dashboard/teachers/schedule/weekly/components/createRecurringClassDialog.desktop.tsx` lines 75–135 and `frontend/mobile/views/dashboard/teachers/schedule/weekly/components/createRecurringClassDialog.mobile.tsx` lines 97–155
- [x] 2.6.3 Create `frontend/common/views/dashboard/teachers/schedule/weekly/components/__shared__/useCreateRecurringClassDialogProps.ts`:
  - Export `useCreateRecurringClassDialogProps(viewModel)` hook
  - Hook destructures 15 fields from `viewModel` and returns the shared prop object (all props except `slots` and `layout`)
- [x] 2.6.4 QL (new file): `bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/teachers/schedule/weekly/components/__shared__/useCreateRecurringClassDialogProps.ts --lifecycle codescene` (exit 0)
- [x] 2.6.5 Refactor `createRecurringClassDialog.desktop.tsx` to use hook, spread props, specify `slots` + `layout`
- [x] 2.6.6 QL: `bun run scripts/health/sub-loop.ts frontend/desktop/views/dashboard/teachers/schedule/weekly/components/createRecurringClassDialog.desktop.tsx --lifecycle codescene` (exit 0)
- [x] 2.6.7 Refactor `createRecurringClassDialog.mobile.tsx` to use hook, spread props, specify `slots` + `layout`
- [x] 2.6.8 QL: `bun run scripts/health/sub-loop.ts frontend/mobile/views/dashboard/teachers/schedule/weekly/components/createRecurringClassDialog.mobile.tsx --lifecycle codescene` (exit 0)
- [x] 2.6.9 SR: Verify all 15 destructured fields preserved; prop names match; no missing props
- [x] 2.6.10 IV: Read `frontend/AGENTS.md`, `frontend/desktop/AGENTS.md`, `frontend/mobile/AGENTS.md`
- [x] 2.6.11 Outcome: `.ai/plans/duplications-phase8/outcome/2.6-recurring-dialog-hook-outcome.md`
- [x] 2.6.12 Update progress: Mark 2.6 as `[x]`

### Task 2.7: Pair 12 — User Billing Profile Prop-Bag Extraction (108 tokens)
**Problem:** Desktop and mobile userBillingProfile forward 17 identical props to billing section components.
**Solution:** Extract `UserBillingSectionProps` interface + `useUserBillingSectionProps(viewModel)` hook.

- [x] 2.7.1 Read all plan files
- [x] 2.7.2 Read `frontend/desktop/views/dashboard/users/billing-profile/userBillingProfile.desktop.tsx` lines 30–60 and `frontend/mobile/views/dashboard/users/billing-profile/userBillingProfile.mobile.tsx` lines 30–65
- [x] 2.7.3 Create `frontend/common/views/dashboard/users/billing-profile/__shared__/userBillingProfileSharedProps.ts`:
  - Export `UserBillingSectionProps` interface with all 17 shared fields
  - Export `useUserBillingSectionProps(viewModel)` hook that extracts the 17 props from the ViewModel
- [x] 2.7.4 QL (new file): `bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/users/billing-profile/__shared__/userBillingProfileSharedProps.ts --lifecycle codescene` (exit 0)
- [x] 2.7.5 Refactor `userBillingProfile.desktop.tsx` to use hook, spread props, keep tier-specific chrome wrapper
- [x] 2.7.6 QL: `bun run scripts/health/sub-loop.ts frontend/desktop/views/dashboard/users/billing-profile/userBillingProfile.desktop.tsx --lifecycle codescene` (exit 0)
- [x] 2.7.7 Refactor `userBillingProfile.mobile.tsx` to use hook, spread props, keep tier-specific header/metrics props
- [x] 2.7.8 QL: `bun run scripts/health/sub-loop.ts frontend/mobile/views/dashboard/users/billing-profile/userBillingProfile.mobile.tsx --lifecycle codescene` (exit 0)
- [x] 2.7.9 SR: Verify all 17 props preserved; tier-specific props (pageTitle, pageSubtitle, metrics) NOT in shared hook
- [x] 2.7.10 IV: Read `frontend/AGENTS.md`, `frontend/desktop/AGENTS.md`, `frontend/mobile/AGENTS.md`
- [x] 2.7.11 Outcome: `.ai/plans/duplications-phase8/outcome/2.7-billing-profile-props-outcome.md`
- [x] 2.7.12 Update progress: Mark 2.7 as `[x]`

---

## Phase 3: Verification & Review (Serial)

### Task 3.1: Final jscpd Verification
- [x] 3.1.1 Run `bunx jscpd . --config .jscpd.json` — expect 0 clones
- [x] 3.1.2 If clones remain: identify which pairs were not fully resolved and trace back to the responsible task
- [x] 3.1.3 Fix any residual duplication (re-run the relevant task's subtasks)
- [x] 3.1.4 Write outcome: `.ai/plans/duplications-phase8/outcome/3.1-final-verification-outcome.md`
- [x] 3.1.5 Update progress: Mark 3.1 as `[x]`

### Task 3.2: No-Reexport Verification
- [x] 3.2.1 Run `grep -rn "^export \* from\|^export {.*} from" frontend/common/views/dashboard/billing/__shared__/ frontend/common/views/dashboard/profile/shared/createProfileLoadingSkeletonConfig.ts frontend/common/components/ui/input/__shared__/ frontend/common/views/dashboard/classes/status/tracking/components/__shared__/ frontend/common/views/dashboard/schedule/alerts/__shared__/ frontend/common/views/dashboard/teachers/schedule/weekly/components/__shared__/ frontend/common/views/dashboard/users/billing-profile/__shared__/` — expect 0 matches in new files only
- [x] 3.2.2 Verify each new file contains substantive logic (functions, components, types, constants — not just re-exports)
- [x] 3.2.3 Write outcome: `.ai/plans/duplications-phase8/outcome/3.2-no-reexport-verification-outcome.md`
- [x] 3.2.4 Update progress: Mark 3.2 as `[x]`

### Task 3.3: Quality Gate
- [x] 3.3.1 Run `bun quality-gate` on all modified files
- [x] 3.3.2 Fix any tsgo, oxlint, biome, lint, codescene, or duplicates failures
- [x] 3.3.3 Re-run `bun quality-gate` until clean
- [x] 3.3.4 Write outcome: `.ai/plans/duplications-phase8/outcome/3.3-quality-gate-outcome.md`
- [x] 3.3.5 Update progress: Mark 3.3 as `[x]`

---

## Phase 4: Knowledge Propagation (Serial)

### Task 4.1: Update Documentation
- [x] 4.1.1 Read all outcome files in `.ai/plans/duplications-phase8/outcome/`
- [x] 4.1.2 Create/update `docs/frontend/duplication-elimination-patterns.md` — add Phase 8 patterns: hook-based prop forwarding, factory function, shared import list, prop-spread refactor
- [x] 4.1.3 Update root `AGENTS.md` if new references needed
- [x] 4.1.4 QL: `bun run scripts/health/sub-loop.ts docs/frontend/duplication-elimination-patterns.md --lifecycle codescene` (if applicable)
- [x] 4.1.5 Write outcome: `.ai/plans/duplications-phase8/outcome/4.1-knowledge-propagation-outcome.md`
- [x] 4.1.6 Update progress: Mark 4.1 as `[x]`

### Task 4.2: Update Deferred Items
- [x] 4.2.1 Document D7-6 resolution (overlapping members resolved, non-overlapping disposition)
- [x] 4.2.2 Document any new deferred items discovered during implementation
- [x] 4.2.3 Write outcome: `.ai/plans/duplications-phase8/outcome/4.2-deferred-items-outcome.md`
- [x] 4.2.4 Update progress: Mark 4.2 as `[x]`

### Task 4.3: Commit Plan Files
- [x] 4.3.1 Stage all Phase 8 plan files: requirements.md, design.md, tasks.md, deferred-items.md, outcome/
- [x] 4.3.2 Commit with message: `phase8: final residual clone elimination plan (12 pairs → 0)`
- [x] 4.3.3 Include Co-authored-by trailer
- [x] 4.3.4 Update progress: Mark 4.3 as `[x]`