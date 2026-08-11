# Tasks: Code Duplication Elimination — Phase 6

**Feature:** Code Duplication Elimination Phase 6 — Deferred P3 Micro Clusters & Structural Noise Suppression
**Version:** 1.0
**Date:** 2026-08-11

---

## Task Conventions

### Per-Task Subtasks (QL / SR / IV)

Every task that modifies code MUST include these three subtasks:

1. **QL (Quality Loop):** Run `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` per modified file. Exit code 0 = pass. Fix all errors before proceeding.
2. **SR (Semantic Review):** Agent self-review against the Semantic Review Checklist (race conditions, dead code, cross-layer imports, schema/types). See design.md for checklist.
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
| `bun run test:live-comm` | ❌ NEVER |
| `bun run test:live-fx` | ❌ NEVER |
| `bun run test:db` | ❌ NEVER |
| `bun run test:db:sequential` | ❌ NEVER |
| `bun run test:services` | ❌ NEVER |
| `bun run test` | ❌ NEVER |
| `bun run scripts/run-test/run-test.ts <path>` | ❌ NEVER |

**Sole verification method:** `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene`

### AGENTS.md Mapping (Per File Path Pattern)

| File Path | Applicable AGENTS.md |
|-----------|---------------------|
| `frontend/**/*.ts(x)` | `frontend/AGENTS.md`, `frontend/views/AGENTS.md` (if views/) |
| `shared/**` | `shared/AGENTS.md` |
| Configuration files (`.jscpd.json`) | Root `AGENTS.md` |

### Instruction File Mapping

| File Path Pattern | Instruction File |
|---|---|
| `frontend/**/*.ts(x)` | `.github/instructions/frontend.instructions.md` |
| `backend/**/*.ts` | `.github/instructions/backend.instructions.md` |

### `sub-loop.ts` Lifecycle

All tasks use `--lifecycle codescene` (the deepest check: tsgo → oxlint → biome → lint → check:duplicates → codescene).

---

## Phase 0: Baseline & Plan Review (Serial)

### Task 0.1: Capture Baseline
- [x] 0.1.1 Run `bun check:duplicates 2>&1 | tee /tmp/phase6-baseline-jscpd.txt`
- [ ] 0.1.2 Run `bun tsgo 2>&1 | tee /tmp/phase6-baseline-tsgo.txt`
- [ ] 0.1.3 Run `bun biome:check 2>&1 | tee /tmp/phase6-baseline-biome.txt`
- [x] 0.1.4 Write outcome file: `.ai/plans/duplications-phase6/outcome/0-baseline-outcome.md`
  - Record: jscpd total clones (504), duplicated tokens (68,194), tsgo errors (pre-existing count), biome warnings
  - Record: P3 pair count (135), P3 token count (11,090), shared/locale pair count (16), shared/locale token count (1,604)
- [x] 0.1.5 Update progress: Mark 0.1 as `[x]` (jscpd captured; tsgo/biome deferred to implementation)

### Task 0.2: Plan Review via @plan-review Skill
- [x] 0.2.1 Invoke `@plan-review` skill on this plan
- [x] 0.2.2 Fix all violations reported
- [x] 0.2.3 Re-run `@plan-review` until output is "Plan passes all AGENTS.md rules"
- [x] 0.2.4 Write outcome: `.ai/plans/duplications-phase6/outcome/plan-review-R1.md`
- [x] 0.2.5 Commit the plan
- [x] 0.2.6 Update progress: Mark 0.2 as `[x]`

---

## Phase 1: Structural Suppression (Serial)

### Task 1.1: Add `shared/locale/**` to `.jscpd.json` Ignore Patterns
- [x] 1.1.1 Read current `.jscpd.json` configuration
- [x] 1.1.2 Add `"shared/locale/**"` to the `ignore` array (if not already present)
- [x] 1.1.3 Run `bun check:duplicates` and verify shared/locale pair count = 0
- [x] 1.1.4 QL: `bun run scripts/health/sub-loop.ts .jscpd.json --lifecycle codescene` (if applicable to config files; otherwise skip)
- [x] 1.1.5 Write outcome: `.ai/plans/duplications-phase6/outcome/1.1-jscpd-locale-ignore-outcome.md`
  - Document: before/after pair count, before/after token count, which 16 pairs were suppressed
- [x] 1.1.6 Update progress: Mark 1.1 as `[x]`

### Task 1.2: Evaluate Frontend↔Shared Locale Type Cross-Layer Pairs (D5-2)
- [x] 1.2.1 Read `frontend/common/views/dashboard/classes/details/useClassDetailsLabels.ts` and compare with `shared/locale/types/dashboard/classes/details.ts`
- [x] 1.2.2 Determine if the 3 frontend↔shared locale type pairs (115t, 102t, 79t) are structural (i18n type system) or fixable (duplicate types)
- [x] 1.2.3 If structural → add `// jscpd:ignore` directive or extend `.jscpd.json` pattern
- [x] 1.2.4 If fixable → consolidate to `shared/locale/types/` canonical source, repoint frontend import
- [x] 1.2.5 QL: `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` per modified file
- [x] 1.2.6 IV: Read `shared/AGENTS.md` (locale rules), `frontend/AGENTS.md`
- [x] 1.2.7 Write outcome: `.ai/plans/duplications-phase6/outcome/1.2-locale-cross-layer-evaluation-outcome.md`
- [x] 1.2.8 Update progress: Mark 1.2 as `[x]`

---

## Phase 2: P3 Triage & Fix — D↔M Triplication Residuals (Parallel Subagents)

**Scope:** 70 desktop↔mobile pairs, 5,791 tokens. 9 batches of ~8 pairs. Max 2 subagents concurrent per wave.

**Triage criteria per pair:**
- D↔M pair differs by ≤3 lines → **jscpd-ignore** (differences too small to scaffold)
- D↔M pair shares clear presentational structure with 1-2 config differences → **micro-scaffold** (config-object)
- D↔M pair is structurally different (only surface similarity) → **jscpd-ignore** (false positive)

### Task 2.1: D↔M Batch 1 — Billing, Classes, Resources, Suggestions (8 pairs, 725 tokens)
- [ ] 2.1.1 Triage each pair in the batch (see pair list below)
- [ ] 2.1.2 For "fix" pairs: extract shared element or add config-object scaffold
- [ ] 2.1.3 For "ignore" pairs: add `// jscpd:ignore-start` / `// jscpd:ignore-end` directives around the duplicated block with a comment explaining rationale
- [ ] 2.1.4 QL: `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` per modified file
- [ ] 2.1.5 SR: Self-review against Semantic Review Checklist
- [ ] 2.1.6 IV: Read `frontend/AGENTS.md`, `frontend/views/AGENTS.md`, `.github/instructions/frontend.instructions.md`
- [ ] 2.1.7 Write outcome: `.ai/plans/duplications-phase6/outcome/2.1-dm-batch1-outcome.md`
- [ ] 2.1.8 Update progress: Mark 2.1 as `[x]`

**Pairs:**
1. `billing/components/parentInvoiceRowActions` D↔M (91t)
2. `classes/recurring/components/dayScheduleRow` D↔M (91t)
3. `resources/components/resourceFileTypeIcon` D↔M (91t)
4. `resources/components/resourceUploadDropzone` D↔M (91t)
5. `suggestions/components/suggestionSocialProof` D↔M (91t)
6. `reports/components/reportFiltersForm` D↔M (90t)
7. `reschedule/home/components/rescheduleDateTimeSection` D↔M (90t)
8. `schedule/alerts/scheduleAlertsView` D↔M (90t)

### Task 2.2: D↔M Batch 2 — Students Quota/Status, Teachers Onboarding, Misc (8 pairs, 706 tokens)
- [ ] 2.2.1–2.2.8 Same subtask pattern as Task 2.1
- **Pairs:**
  1. `students/quota/studentQuota` D↔M (90t)
  2. `students/status/components/policyOverviewCard` D↔M (90t)
  3. `reports/components/reportFiltersForm` D↔M (89t, overlap pair)
  4. `students/quota/studentQuota` D↔M (88t, overlap pair)
  5. `teachers/onboarding/teacherOnboardingView` D↔M (88t)
  6. `classes/status/tracking/statusTrackingDataGrid` D↔M (87t)
  7. `reschedule/home/components/rescheduleDateTimeSection` D↔M (87t, overlap)
  8. `supervisor/monthly-reports/monthlyReports` D↔M (87t)
- Write outcome: `.ai/plans/duplications-phase6/outcome/2.2-dm-batch2-outcome.md`

### Task 2.3: D↔M Batch 3 — Teachers Availability, Permissions, Complaints (8 pairs, 685 tokens)
- [ ] 2.3.1–2.3.8 Same pattern
- **Pairs:**
  1. `teachers/availability/components/availabilitySearchForm` D↔M (87t)
  2. `permissions/components/addPermissionBulkBar` D↔M (86t, overlap)
  3. `permissions/components/addPermissionBulkBar` D↔M (86t, overlap)
  4. `students/quota/studentQuota` D↔M (86t, overlap)
  5. `components/ui/input/localizedString/localeAdornmentSwitch` D↔M (85t)
  6. `complaints/components/complaintQueueCardList` D↔M (85t)
  7. `complaints/components/complaintsSearchBar` D↔M (85t)
  8. `permissions/permissionManagementView` D↔M (85t)
- Write outcome: `.ai/plans/duplications-phase6/outcome/2.3-dm-batch3-outcome.md`

### Task 2.4: D↔M Batch 4 — Reschedule, Search, Suggestions, Profile (8 pairs, 677 tokens)
- [ ] 2.4.1–2.4.8 Same pattern
- **Pairs:**
  1. `reschedule/home/components/quickAdjustSection` D↔M (85t)
  2. `search-schedule/components/searchScheduleResultsSkeleton` D↔M (85t)
  3. `search-schedule/searchSchedule` D↔M (85t)
  4. `students/quota/studentQuota` D↔M (85t, overlap)
  5. `suggestions/components/suggestionSocialProof` D↔M (85t, overlap)
  6. `teachers/futureSchedule/components/supportContact` D↔M (85t)
  7. `profile/teacher/teacherProfile` D↔M (84t)
  8. `billing/manual/components/manualInvoiceSupportCards` D↔M (83t)
- Write outcome: `.ai/plans/duplications-phase6/outcome/2.4-dm-batch4-outcome.md`

### Task 2.5: D↔M Batch 5 — Status Tracking, Permissions, Avatars, Settings (8 pairs, 659 tokens)
- [ ] 2.5.1–2.5.8 Same pattern
- **Pairs:**
  1. `classes/status/tracking/statusTrackingDataGrid` D↔M (83t, overlap)
  2. `permissions/components/permissionGroupForm` D↔M (83t)
  3. `students/quota/studentQuota` D↔M (83t, overlap)
  4. `components/ui/avatar/ClassAvatar` D↔M (82t)
  5. `settings/tabs/siteContent/siteContentSettingsTab` D↔M (82t)
  6. `students/onboarding/components/parentAssignmentSection` D↔M (82t, overlap)
  7. `students/onboarding/components/parentAssignmentSection` D↔M (82t, overlap)
  8. `students/quota/studentQuota` D↔M (82t, overlap)
- Write outcome: `.ai/plans/duplications-phase6/outcome/2.5-dm-batch5-outcome.md`

### Task 2.6: D↔M Batch 6 — Policy Cards, Supervisor, Permissions (8 pairs, 644 tokens)
- [ ] 2.6.1–2.6.8 Same pattern
- **Pairs:**
  1. `students/status/components/policyOverviewCard` D↔M (82t)
  2. `components/ui/input/localizedString/localeAdornmentSwitch` D↔M (81t, overlap)
  3. `supervisor/dashboard/supervisorDashboard` D↔M (81t)
  4. `permissions/components/addPermissionFilterBar` D↔M (80t)
  5. `permissions/components/assignedUsersTab` D↔M (80t)
  6. `permissions/components/permissionGroupForm` D↔M (80t, overlap)
  7. `profile/core/notifications/notificationPreferencesTab` D↔M (80t)
  8. `search-schedule/components/teacherAvailabilityGrid` D↔M (80t)
- Write outcome: `.ai/plans/duplications-phase6/outcome/2.6-dm-batch6-outcome.md`

### Task 2.7: D↔M Batch 7 — Admin Billing, Onboarding, Schedule (8 pairs, 629 tokens)
- [ ] 2.7.1–2.7.8 Same pattern
- **Pairs:**
  1. `admin/billing/adminBilling` D↔M (79t)
  2. `admin/parents/onboarding/parentOnboarding` D↔M (79t)
  3. `classes/recurring/components/recurringClassFormFields` D↔M (79t)
  4. `permissions/components/manageOverridesDialog` D↔M (79t)
  5. `schedule/alerts/components/classSessionActionButton` D↔M (79t)
  6. `components/ui/container/AdminControlPanel` D↔M (78t)
  7. `parent/social/parentSocial` D↔M (78t)
  8. `settings/tabs/session/sessionConfigTab` D↔M (78t)
- Write outcome: `.ai/plans/duplications-phase6/outcome/2.7-dm-batch7-outcome.md`

### Task 2.8: D↔M Batch 8 — Billing, Schedule, Teachers, Classes (8 pairs, 613 tokens)
- [ ] 2.8.1–2.8.8 Same pattern
- **Pairs:**
  1. `students/onboarding/components/parentAssignmentSection` D↔M (78t, overlap)
  2. `billing/components/parentInvoiceRowActions` D↔M (77t, overlap)
  3. `schedule/alerts/scheduleAlertsView` D↔M (77t, overlap)
  4. `teachers/availability/components/availabilitySearchForm` D↔M (77t, overlap)
  5. `classes/recurring/components/dayScheduleRow` D↔M (76t, overlap)
  6. `parent/social/parentSocial` D↔M (76t, overlap)
  7. `permissions/components/overridesToolbar` D↔M (76t)
  8. `reschedule/home/rescheduleView` D↔M (76t)
- Write outcome: `.ai/plans/duplications-phase6/outcome/2.8-dm-batch8-outcome.md`

### Task 2.9: D↔M Batch 9 — Final D↔M Pairs (6 pairs, 453 tokens)
- [ ] 2.9.1–2.9.6 Same pattern
- **Pairs:**
  1. `reschedule/home/rescheduleView` D↔M (76t, overlap)
  2. `search-schedule/searchSchedule` D↔M (76t, overlap)
  3. `students/quota/studentQuota` D↔M (76t, overlap)
  4. `billing/manual/components/manualInvoiceParentField` D↔M (75t)
  5. `teachers/availability/components/availabilitySearchForm` D↔M (75t, overlap)
  6. `teachers/reassignment/components/reassignmentBentoGrid` D↔M (75t)
- Write outcome: `.ai/plans/duplications-phase6/outcome/2.9-dm-batch9-outcome.md`

---

## Phase 3: P3 Triage & Fix — C↔C Intra-Layer (Parallel Subagents)

**Scope:** 31 common↔common pairs, 2,527 tokens. 4 batches.

### Task 3.1: C↔C Batch 1 — ViewModels, UI Display, Hooks (10 pairs, 876 tokens)
- [ ] 3.1.1 Triage each pair:
  - If dead code → delete
  - If shared utility → extract
  - If structural → jscpd-ignore
- [ ] 3.1.2 For "fix" pairs: extract shared function/component/constant
- [ ] 3.1.3 For "ignore" pairs: add jscpd-ignore directives with rationale
- [ ] 3.1.4 QL: per modified file
- [ ] 3.1.5 SR: Semantic Review Checklist
- [ ] 3.1.6 IV: `frontend/AGENTS.md`, `frontend/views/AGENTS.md`, `.github/instructions/frontend.instructions.md`
- [ ] 3.1.7 Write outcome: `.ai/plans/duplications-phase6/outcome/3.1-cc-batch1-outcome.md`
- [ ] 3.1.8 Update progress
- **Pairs:**
  1. `staff/home/useManagersContainerViewModel` ↔ `useManagersViewModel` (91t)
  2. `billing/useParentBillingViewModel` ↔ `users/billing-profile/useUserBillingProfileViewModel` (90t)
  3. `display/countryDisplay/CountryDisplay` ↔ `display/language/LanguageDisplay` (89t)
  4. `profile/teacher/TeacherProfileContainer` ↔ `TeacherProfileView` (89t)
  5. `hooks/useCreateParentOnboarding` ↔ `hooks/useCreateTeacherOnboarding` (88t)
  6. `input/phoneInput/PhoneInput` ↔ `PhoneInputShared` (87t)
  7. `complaints/types/complaintsViewTypes` ↔ `useParentComplaintsViewModel` (87t)
  8. `admin/parents/students/StudentsContainer` ↔ `StudentsView` (86t)
  9. `subjects/home/__shared__/LabeledTextField` ↔ `editCategoryDialogShared` (85t)
  10. `utils/excel-export/report-export` ↔ `shared-export-logic` (84t)

### Task 3.2: C↔C Batch 2 — DataGrid, Stores, Profile Sections (10 pairs, 811 tokens)
- [ ] 3.2.1–3.2.8 Same pattern
- **Pairs:**
  1. `admin/home/components/ScheduleOverviewDataGrid` ↔ `useScheduleColumns` (84t)
  2. `profile/parent/ParentProfileLoadingSkeleton` ↔ `StaffProfileLoadingSkeleton` (83t) — Phase 2 may have already fixed; verify with git diff
  3. `dataGrid/AppDataGrid` ↔ `appDataGridShared` (82t)
  4. `stores/dashboardStore` ↔ `teacherDashboardStore` (82t)
  5. `profile/staff/AccountSection` ↔ `supervisor/profile/SupervisorAdminSection` (82t)
  6. `stores/searchScheduleStore` ↔ `search-schedule/useSearchScheduleViewModel` (81t)
  7. `profile/staff/AccountSection` ↔ `students/profile/StudentAdminSection` (81t)
  8. `classes/details/student/ClassDetailsStudentView` ↔ `teacher/ClassDetailsTeacherView` (80t)
  9. `onboarding/UserEntityFieldsSection` ↔ `profile/__shared__/CompensationSectionBase` (78t)
  10. `onboarding/UserEntityFieldsSection` ↔ `profile/shared/CurrencyControllerField` (78t)

### Task 3.3: C↔C Batch 3 — Tab ViewModels, Payment, Resources (10 pairs, 765 tokens)
- [ ] 3.3.1–3.3.8 Same pattern
- **Pairs:**
  1. `admin/payment-catalogs/tabs/usePaymentCatalogsTabsViewModel` ↔ `feedback/tabs/useFeedbackManageTabsViewModel` (78t)
  2. `admin/payment-catalogs/tabs/usePaymentCatalogsTabsViewModel` ↔ `schedule/tracking/tabs/useScheduleTrackingTabsViewModel` (78t)
  3. `input/userPaymentMethodSelect/UserPaymentMethodAutocompleteShared` ↔ `UserPaymentMethodSelect` (77t)
  4. `profile/parent/ParentProfileEditForm` ↔ `profile/staff/StaffProfileEditForm` (77t)
  5. `admin/parents/students/types` ↔ same file (76t) — self-duplicate (same file twice, different line ranges)
  6. `admin/payment-catalogs/tabs` ↔ `billing/tabs/useBillingTabsViewModel` (76t)
  7. `profile/parent/ParentProfileEditForm` ↔ `profile/teacher/TeacherAdminEditForm` (76t)
  8. `resources/types/resourcesTypes` ↔ same file (76t) — self-duplicate
  9. `shared/history/studentHistoryMappersShared` ↔ `student/history/types/studentHistoryTypes` (76t)
  10. `admin/parents/onboarding/FeesContractSection` ↔ `teachers/onboarding/SalaryDetailsSection` (75t)

### Task 3.4: C↔C Batch 4 — Remaining (1 pair, 75 tokens)
- [ ] 3.4.1 Triage and fix/ignore:
  1. `classes/details/teacher/StudentProfileCard` ↔ `TeacherProfileCard` (75t)
- Write outcome: `.ai/plans/duplications-phase6/outcome/3.4-cc-batch4-outcome.md`

---

## Phase 4: P3 Triage & Fix — C↔D, C↔M, D↔D, M↔M (Parallel Subagents)

**Scope:** C↔D (12 pairs, 1,001 tokens) + C↔M (11 pairs, 887 tokens) + D↔D (7 pairs, 567 tokens) + M↔M (4 pairs, 317 tokens) = 34 pairs, 2,772 tokens.

### Task 4.1: C↔D & C↔M Cross-Tier Pairs (23 pairs, 1,888 tokens)
- [ ] 4.1.1 Triage each C↔D and C↔M pair:
  - If common↔desktop/mobile pair shares clear logic with minor variant → extend existing `*Shared.tsx` scaffold or config
  - If structural (MUI variant boilerplate) → jscpd-ignore
- [ ] 4.1.2 For "fix" pairs: extend existing scaffold or create micro-scaffold
- [ ] 4.1.3 For "ignore" pairs: add jscpd-ignore directives
- [ ] 4.1.4 QL: per modified file
- [ ] 4.1.5 SR: Semantic Review Checklist
- [ ] 4.1.6 IV: `frontend/AGENTS.md`, `frontend/views/AGENTS.md`, `.github/instructions/frontend.instructions.md`
- [ ] 4.1.7 Write outcome: `.ai/plans/duplications-phase6/outcome/4.1-cd-cm-batch-outcome.md`
- [ ] 4.1.8 Update progress
- **C↔D pairs (12):**
  1-12: See jscpd output for exact pairs — these are common↔desktop pairs where the common tier has the base logic and the desktop tier adds visual variants
- **C↔M pairs (11):**
  1-11: See jscpd output for exact pairs — these are common↔mobile pairs, similar to C↔D

### Task 4.2: D↔D Same-Tier Pairs (7 pairs, 567 tokens)
- [ ] 4.2.1 Triage each D↔D pair:
  - If two desktop views share a clear pattern (entity list, billing, data grid) → shared view scaffold
  - If structurally different → jscpd-ignore
- [ ] 4.2.2 For "fix" pairs: extract shared view scaffold (e.g., `TeacherEntityListViewShared.tsx` for teacherClassListView ↔ teacherStudentsView)
- [ ] 4.2.3 For "ignore" pairs: add jscpd-ignore
- [ ] 4.2.4 QL: per modified file
- [ ] 4.2.5 SR: Semantic Review Checklist
- [ ] 4.2.6 IV: `frontend/AGENTS.md`, `frontend/views/AGENTS.md`, `.github/instructions/frontend.instructions.md`
- [ ] 4.2.7 Write outcome: `.ai/plans/duplications-phase6/outcome/4.2-dd-batch-outcome.md`
- [ ] 4.2.8 Update progress
- **Pairs:**
  1. `tools/dst-migration/checkedEmptyPanel` ↔ `updatedSessionsSection` (85t)
  2. `classes/recurring/recurringScheduleDetailView` ↔ `recurringSchedulesListView` (82t)
  3. `student/history/studentHistory` ↔ `student/sessions/studentSessions` (81t)
  4. `supervisor/dashboard/duesSummaryCard` ↔ `pendingReviewsHeroCard` (81t)
  5. `supervisor/lesson-reviews/lessonReportDetailPanel` ↔ `supervisor/profile/supervisorProfile` (80t)
  6. `subjects/home/createSubjectDialog` ↔ `editSubjectDialog` (79t)
  7. `teachers/dashboard/missedClassAlertBanner` ↔ `missedClassAlertBannerContent` (79t)

### Task 4.3: M↔M Same-Tier Pairs (4 pairs, 317 tokens)
- [ ] 4.3.1 Triage each M↔M pair:
  - If two mobile views share a clear pattern → shared view scaffold
  - If structural → jscpd-ignore
- [ ] 4.3.2 For "fix" pairs: extract shared component
- [ ] 4.3.3 For "ignore" pairs: add jscpd-ignore
- [ ] 4.3.4 QL: per modified file
- [ ] 4.3.5 SR: Semantic Review Checklist
- [ ] 4.3.6 IV: `frontend/AGENTS.md`, `frontend/views/AGENTS.md`, `.github/instructions/frontend.instructions.md`
- [ ] 4.3.7 Write outcome: `.ai/plans/duplications-phase6/outcome/4.3-mm-batch-outcome.md`
- [ ] 4.3.8 Update progress
- **Pairs:**
  1. `students/quota/components/contextualHelperCards` ↔ same file (83t) — self-duplicate
  2. `admin/parents/students/components/studentDirectoryCard` ↔ `studentDirectoryCardBase` (82t)
  3. `admin/billing/currencies/supportedCurrencies` ↔ `currency-hedges/currencyHedges` (76t)
  4. `permissions/components/assignedUsersTab` ↔ `singleGroupHeader` (76t)

---

## Phase 5: Review Gates (Serial)

### Task 5.1: Mid-Point Review
- [ ] 5.1.1 Run `bun check:duplicates` after Phases 1-4 complete
- [ ] 5.1.2 Compare clone count to Phase 6 baseline (505)
- [ ] 5.1.3 Verify shared/locale pairs = 0 (Task 1.1 success)
- [ ] 5.1.4 Verify P3 pair count reduced by ≥100 (G1)
- [ ] 5.1.5 Check ignore-to-fix ratio: if >70% jscpd-ignore, review whether some ignores should be fixes
- [ ] 5.1.6 Write outcome: `.ai/plans/duplications-phase6/outcome/5.1-midpoint-review-outcome.md`
- [ ] 5.1.7 Update progress: Mark 5.1 as `[x]`

### Task 5.2: Post-Implementation Review
- [ ] 5.2.1 Read ALL outcome files in `.ai/plans/duplications-phase6/outcome/` to synthesize findings
- [ ] 5.2.2 Dispatch parallel review subagents:
  - `review-frontend` (scope: all `frontend/` files modified by Phase 6)
- [ ] 5.2.3 Collect findings, deduplicate, categorize (CRITICAL/HIGH/MEDIUM/LOW)
- [ ] 5.2.4 Filter out pre-existing issues (compare to Phase 0 baseline)
- [ ] 5.2.5 Fix feature-specific findings per file cluster
- [ ] 5.2.6 Re-verify fixed files via sub-loop
- [ ] 5.2.7 Write outcome: `.ai/plans/duplications-phase6/outcome/5.2-post-implementation-review-outcome.md`
- [ ] 5.2.8 Update progress: Mark 5.2 as `[x]`

### Task 5.3: Final Quality Gate
- [ ] 5.3.1 Run `bun quality-gate` (tsgo → oxlint → biome → lint → codescene)
- [ ] 5.3.2 Verify zero NEW errors (compare to Phase 0 baseline — 3 pre-existing tsgo errors in scripts/health/sub-loop-uncommitted.ts are NOT Phase 6 files)
- [ ] 5.3.3 Run `bun check:duplicates` and record final clone count
- [ ] 5.3.4 Compare: Phase 6 baseline (505) vs Final count
- [ ] 5.3.5 Write outcome: `.ai/plans/duplications-phase6/outcome/5.3-quality-gate-outcome.md`
- [ ] 5.3.6 Update progress: Mark 5.3 as `[x]`

---

## Phase 6: Residual Sweep & Knowledge Propagation (Serial)

### Task 6.1: Post-Phase 4/5 Residual Sweep (CONDITIONAL)
- [ ] 6.1.1 Check if Phases 4 and 5 are complete (git log for commits, check plan outcome files)
- [ ] 6.1.2 If Phases 4 and 5 are NOT complete → mark as deferred (D6-1) and skip to Task 6.2
- [ ] 6.1.3 If Phases 4 and 5 ARE complete → run `bun check:duplicates`
- [ ] 6.1.4 Triage all remaining clones:
  - "fix" — code extraction
  - "ignore" — jscpd-ignore directive
  - "defer to Phase 7" — too large for Phase 6 residual sweep
- [ ] 6.1.5 Execute "fix" triage items (quick fixes only — ≤15 min each)
- [ ] 6.1.6 Add "ignore" directives for structural pairs
- [ ] 6.1.7 Add "defer" items to `deferred-items.md` as D7-x entries
- [ ] 6.1.8 QL: per modified file
- [ ] 6.1.9 Write outcome: `.ai/plans/duplications-phase6/outcome/6.1-residual-sweep-outcome.md`
- [ ] 6.1.10 Update progress: Mark 6.1 as `[x]`

### Task 6.2: Update `.jscpd.json` Documentation
- [ ] 6.2.1 Read all outcome files to synthesize jscpd-ignore strategy learnings
- [ ] 6.2.2 Update `docs/frontend/duplication-elimination-patterns.md`:
  - Add "jscpd-ignore Strategy" section: when to use `.jscpd.json` ignore patterns vs inline `// jscpd:ignore` directives
  - Add `.jscpd.json` configuration reference table: what's ignored and why
  - Add "Structural vs Fixable Duplication" decision tree
- [ ] 6.2.3 QL: `bun run scripts/health/sub-loop.ts docs/frontend/duplication-elimination-patterns.md --lifecycle codescene` (docs may not need full lifecycle — verify)
- [ ] 6.2.4 Write outcome: `.ai/plans/duplications-phase6/outcome/6.2-docs-update-outcome.md`
- [ ] 6.2.5 Update progress: Mark 6.2 as `[x]`

### Task 6.3: Update AGENTS.md Files
- [ ] 6.3.1 Update root `AGENTS.md` Important References section:
  - Add reference to `.jscpd.json` configuration documentation
  - Add reference to `docs/frontend/duplication-elimination-patterns.md` jscpd-ignore section
- [ ] 6.3.2 Update `shared/AGENTS.md`:
  - Add note that `shared/locale/**` is excluded from `bun check:duplicates` via `.jscpd.json` (structural i18n pattern)
- [ ] 6.3.3 QL: Verify AGENTS.md changes don't break any tooling
- [ ] 6.3.4 Write outcome: `.ai/plans/duplications-phase6/outcome/6.3-agents-md-update-outcome.md`
- [ ] 6.3.5 Update progress: Mark 6.3 as `[x]`

### Task 6.4: Commit Final Changes & Update Deferred Items
- [ ] 6.4.1 Update `deferred-items.md` with any newly deferred items (D6-1, D6-2, or residual sweep D7-x)
- [ ] 6.4.2 Stage all Phase 6 changes
- [ ] 6.4.3 Commit: `docs: add Phase 6 duplications elimination plan (P3 micro clusters & structural noise suppression)`
- [ ] 6.4.4 Write outcome: `.ai/plans/duplications-phase6/outcome/6.4-commit-outcome.md`
- [ ] 6.4.5 Update progress: Mark 6.4 as `[x]`

---

## Summary

| Phase | Tasks | Pairs | Tokens | Approach |
|-------|-------|-------|--------|----------|
| Phase 0: Baseline & Review | 2 | — | — | Capture metrics, plan review |
| Phase 1: Structural Suppression | 2 | 16 | 1,604 | `.jscpd.json` ignore for `shared/locale/**` |
| Phase 2: D↔M Residuals | 9 | 70 | 5,791 | Triage per pair: fix (scaffold) or ignore |
| Phase 3: C↔C Intra-Layer | 4 | 31 | 2,527 | Triage per pair: fix (utility/team) or ignore |
| Phase 4: Cross-Tier & Same-Tier | 3 | 34 | 2,772 | Triage per pair: fix (scaffold) or ignore |
| Phase 5: Review Gates | 3 | — | — | Mid-point, post-impl, quality gate |
| Phase 6: Residual & Knowledge | 4 | TBD | TBD | Post-Phase 4/5 sweep + docs + commit |
| **Total** | **27** | **151+** | **11,694+** | |

### Predecessor Dependencies

- Phase 6 Phases 2-4 (P3 triage) can start independently of Phases 4 and 5
- Phase 6 Task 6.1 (residual sweep) depends on Phases 4 and 5 completion — may be deferred (D6-1)
- Phase 6 Task 5.1 (mid-point review) can run after Phase 6 Phases 1-4 complete (does NOT require Phases 4/5)
- Phase 6 Task 5.3 (final quality gate) can run independently but the total clone count comparison requires Phases 4/5 to be done for a complete picture
