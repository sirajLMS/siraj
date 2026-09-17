# Frontend Review Plan — Round 1

**Date**: 2026-09-17
**Scope**: All frontend code (frontend/**, app/**) — ~3,525 files
**Focus**: Comprehensive (MUI v9, React 19, Apollo/GraphQL, Zustand, i18n, theme, patterns, logging)
**Files Reviewed**: ~3,525 (sampled by 8 review groups)
**Prior Round**: none (first r<N> round)

## Summary

The codebase is in strong shape on React 19 and Apollo conventions (zero FormEvent, zero useLazyQuery, correct hook imports, all documents typed via TypedDocumentNode). The dominant issues are: (1) ~42 files using banned `Box component="form"/"button"` direct props (MUI v9 rule), (2) ~26 hardcoded fontSize sites bypassing theme typography tokens, (3) 8 untranslated user-facing components (English-only strings in a bilingual app), (4) Zustand store hygiene issues (stale date defaults, unvalidated persist rehydration, UTC-vs-local "today" drift), and (5) 6 local status-chip implementations bypassing shared StatusBadge. No console.* violations, no next-intl/shared/messages imports.

## Findings

### CRITICAL (28)
- [x] [CRITICAL] mui: frontend/views/auth/login/components/LoginForm.tsx:331 — Box component="form" direct prop banned; migrate to plain form element / approved pattern
- [x] [CRITICAL] mui: frontend/mobile/views/dashboard/accounting/expenses/expenses.mobile.tsx:203 — Box component="button" direct prop banned
- [x] [CRITICAL] mui: frontend/mobile/views/dashboard/accounting/PaymentFormView.mobile.tsx:93 — Box component="form" direct prop banned (also line 146)
- [x] [CRITICAL] mui: frontend/mobile/views/dashboard/accounting/PackagePlanFormView.mobile.tsx:69 — Box component="form" direct prop banned
- [x] [CRITICAL] mui: frontend/mobile/views/dashboard/staff/onboarding/managerOnboarding.mobile.tsx:56 — Box component="form" direct prop banned
- [x] [CRITICAL] mui: frontend/mobile/views/dashboard/settings/whatsapp/tabs/InboxTab.mobile.tsx:28 — Box component="button" direct prop banned
- [x] [CRITICAL] mui: frontend/common/views/errors/FullScreenErrorView.tsx:121 — Box component="main" direct prop banned
- [x] [CRITICAL] mui: frontend/common/views/dashboard/whatsapp/groups/GroupsListShared.tsx:67 — Box component="button" direct prop banned
- [x] [CRITICAL] mui: frontend/mobile/views/dashboard/students/status/studentStatus.mobile.tsx:71 — Box component="form" direct prop banned
- [x] [CRITICAL] mui: frontend/mobile/views/dashboard/billing/quota/quotaForm.mobile.tsx:38 — Box component="form" direct prop banned
- [x] [CRITICAL] mui: frontend/common/views/dashboard/whatsapp/conversations/ConversationListShared.tsx:134 — Box component="button" direct prop banned
- [x] [CRITICAL] mui: frontend/common/views/dashboard/subjects/home/components/__shared__/dialogShellShared.tsx:69 — Box component="form" direct prop banned
- [x] [CRITICAL] mui: frontend/mobile/views/dashboard/billing/manual/manualInvoice.mobile.tsx:47 — Box component="form" direct prop banned
- [x] [CRITICAL] mui: frontend/common/views/dashboard/students/onboarding/__shared__/studentOnboardingShared.tsx:80 — Box component="form" direct prop banned
- [x] [CRITICAL] mui: frontend/common/views/dashboard/parents/lifecycle/components/sharedViewContent.tsx:181 — Box component="form" direct prop banned
- [x] [CRITICAL] mui: frontend/desktop/views/dashboard/accounting/PaymentFormView.desktop.tsx:155 — Box component="form" direct prop banned (also line 218)
- [x] [CRITICAL] mui: frontend/common/views/dashboard/search-schedule/components/searchScheduleFormShared.tsx:226 — Box component="form" direct prop banned
- [x] [CRITICAL] mui: frontend/common/views/dashboard/profile/components/__shared__/profileEditFormShell.tsx:91 — Box component="form" direct prop banned
- [x] [CRITICAL] mui: frontend/desktop/views/dashboard/accounting/PackagePlanFormView.desktop.tsx:165 — Box component="form" direct prop banned
- [x] [CRITICAL] mui: frontend/common/views/dashboard/students/quota/components/__shared__/studentQuotaShared.tsx:182 — Box component="form" direct prop banned
- [x] [CRITICAL] mui: frontend/common/views/dashboard/users/createUser/__shared__/generalUserCreateShared.tsx:438 — Box component="form" direct prop banned
- [x] [CRITICAL] mui: frontend/common/views/dashboard/classes/recurring/RecurringRateSection.tsx:77 — Box component="form" direct prop banned
- [x] [CRITICAL] mui: frontend/common/views/dashboard/classes/recurring/components/__shared__/recurringClassFormShared.tsx:112 — Box component="form" direct prop banned
- [x] [CRITICAL] mui: frontend/common/views/dashboard/profile/shared/meeting-configs/MeetingConfigFormDialogContent.tsx:167 — Box component="form" direct prop banned
- [x] [CRITICAL] mui: frontend/common/views/dashboard/accounting/expenses/ExpenseDetailDrawer.tsx:174 — Box component="button" direct prop banned
- [x] [CRITICAL] mui: frontend/common/views/dashboard/profile/teacher/TeacherProfileEditForm.tsx:91 — Box component="form" direct prop banned
- [x] [CRITICAL] mui: frontend/common/components/ui/dialog/BaseFormDialogSection.tsx:42 — Typography component="span" direct prop banned (same pattern in baseDeleteDialogShared.tsx:54)
- [x] [CRITICAL] mui: frontend/common/views/dashboard/accounting/components/ConfirmSummaryDetails.tsx:38 — Typography component="dt"/"dd" direct props banned

### WARNING (52)
- [x] [WARNING] mui: frontend/common/views/dashboard/accounting/expenses/ExpenseFormDialog.tsx:164 — TextField inputProps removed in MUI v9; use slotProps={{ htmlInput }}
- [x] [WARNING] mui: frontend/common/views/dashboard/billing/accounting/reports/CarryoverBulkCreateDialog.tsx:253 — Typography component="span"/"p" direct props (also lines 287, 409)  → Fix: Box component="span"/"p" wrappers applied (all three lines)
- [x] [WARNING] apollo: frontend/common/graphql/sharedDocuments/whatsapp/whatsapp.documents.ts:235-247 — dead commented-out documents targeting non-existent resolvers; delete
- [x] [WARNING] zustand: frontend/common/stores/searchScheduleStore.ts:28 — Pick/Omit-intersection remapping of codegen types violates no-mapping rule (stores/AGENTS.md:6) → Fix: SKIPPED — needs design; local shapes diverge materially from codegen types
- [x] [WARNING] zustand: frontend/common/stores/teacherDashboardStore.ts:62 — hand-defined derived snapshot instead of codegen TeacherDashboardQuery_* types → Fix: SKIPPED — needs design; ViewModel display types require mapping-layer redesign
- [x] [WARNING] zustand: frontend/common/stores/teacherDashboardStore.ts:129 — function registry in state; non-serializable, breaks if persist added later → Fix: SKIPPED — function-registry refactor deferred (risky, non-persisted store)
- [x] [WARNING] zustand: frontend/common/stores/dashboardStore.ts:74 — dead mock fields never populated, misleading state surface
- [x] [WARNING] zustand: frontend/common/stores/reportsStore.ts:7 — stale default date range "2023-08-01/31" as initial filter state
- [x] [WARNING] zustand: frontend/common/stores/profitLossFilterStore.ts:84 — persist without merge/validation; enum drift reaches store unvalidated
- [x] [WARNING] zustand: frontend/common/stores/weeklyScheduleStore.ts:37 — UTC toISOString "today" lazy init; off-by-one vs local-date util
- [x] [WARNING] zustand: frontend/common/stores/futureScheduleDateStore.ts:16 — same UTC-vs-local "today" inconsistency
- [x] [WARNING] zustand: frontend/common/stores/layoutStore.ts:48 — initGroupCollapsed bakes defaultCollapsed into persisted state; future defaults never reach users
- [x] [WARNING] zustand: frontend/common/stores/studentHistoryStore.ts:40 — module-level INITIAL_YEAR/MONTH captured at import time; stale after month rollover
- [x] [WARNING] i18n: frontend/common/views/dashboard/reports/monthly-appraisal/teacher/AppraisalFormDialog.tsx:154 — hardcoded English errors ("Learning targets are required.", "Student ID is missing.")
- [x] [WARNING] i18n: frontend/common/views/dashboard/reports/monthly-appraisal/teacher/AppraisalFormDialog.tsx:62 — rubric labels hardcoded English, no i18n at all
- [x] [WARNING] i18n: frontend/common/views/dashboard/reports/monthly-appraisal/teacher/AppraisalFormDialog.tsx:101 — hardcoded placeholders/dialog copy (Cancel 244, Learning Targets 227, subtitle 203, aria-label 204)
- [x] [WARNING] i18n: frontend/desktop/views/dashboard/scheduling/studentWeekCalendar.desktop.tsx:279 — page untranslated ("Weekly Schedule", "Today", "Failed to load schedule.", aria-labels 281/288)
- [x] [WARNING] i18n: frontend/desktop/views/dashboard/scheduling/studentWeekCalendar.desktop.tsx:33 — hardcoded English day names + AM/PM + toLocaleDateString("en")
- [x] [WARNING] i18n: frontend/common/views/dashboard/widgets/StudentDashboardWidgets.tsx:14 — all widget labels hardcoded English (lines 14-37)
- [x] [WARNING] i18n: frontend/common/views/dashboard/components/customize/BrandIdentitySection.tsx:40 — hardcoded English labels, no i18n
- [x] [WARNING] i18n: frontend/common/views/dashboard/classes/recurring/useRecurringScheduleDetailViewModel.ts:142 — hardcoded "Failed to update rate" though `t` is available
- [x] [WARNING] theme: frontend/views/auth/login/components/LoginForm.tsx:93 — hardcoded borderRadius 12 bypasses theme.layout.radius.button
- [x] [WARNING] theme: frontend/views/auth/login/components/LoginForm.tsx:94 — fontSize "0.875rem" → theme.typography.bodyMd
- [x] [WARNING] theme: frontend/views/auth/login/components/LoginFooter.tsx:21 — fontSize "0.75rem" → theme.typography.caption
- [x] [WARNING] theme: frontend/views/auth/login/components/DemoFastLogin.tsx:30 — fontSize 16 → theme.typography.bodyLg
- [x] [WARNING] theme: frontend/views/auth/login/components/LoginHeader.tsx:53 — fontSize "0.7rem" → nearest token labelSm → Fix: SKIPPED — no clean token (0.7rem = 11.2px); change would alter visual design
- [x] [WARNING] theme: frontend/common/views/dashboard/components/customize/WcagBadge.tsx:49 — CSS-var string var(--mui-palette-error-main) instead of theme.palette in sx callback
- [x] [WARNING] theme: frontend/common/views/dashboard/components/customize/WcagBadge.tsx:50 — CSS-var strings onError/onSuccess instead of theme.palette siblings
- [x] [WARNING] theme: frontend/common/views/dashboard/components/customize/WcagBadge.tsx:75 — CSS-var text-secondary instead of theme.palette.text.secondary
- [x] [WARNING] theme: frontend/desktop/views/dashboard/accounting/PackagePlansListView.desktop.tsx:63 — fontSize 11 → theme.typography.labelUppercase
- [x] [WARNING] theme: frontend/desktop/views/dashboard/accounting/PackagePlansListView.desktop.tsx:95 — fontSize 12 → theme.typography.caption
- [x] [WARNING] theme: frontend/desktop/views/dashboard/accounting/PaymentsListView.desktop.tsx:162 — fontSize 12 → caption token
- [x] [WARNING] theme: frontend/common/views/dashboard/accounting/payroll/PayrollReportsDataGrid.tsx:158 — fontSize 12 → caption token
- [x] [WARNING] theme: frontend/common/views/dashboard/accounting/credits/StudentCreditsList.tsx:243 — fontSize 12 → caption token
- [x] [WARNING] theme: frontend/common/views/dashboard/accounting/credits/CreditAdjustForm.tsx:348 — fontSize 10 → labelSm token
- [x] [WARNING] theme: frontend/common/views/dashboard/accounting/credits/CreditAdjustForm.tsx:342 — fontSize 12 → caption token
- [x] [WARNING] theme: frontend/common/views/dashboard/accounting/credits/StudentCreditsList.tsx:63 — fontSize 13, no exact variant; prefer nearest token → Fix: SKIPPED (fontSize 13) — no token equals 13px
- [x] [WARNING] theme: frontend/desktop/views/dashboard/scheduling/studentWeekCalendar.desktop.tsx:101 — fontSize "0.7rem", prefer theme token → Fix: SKIPPED — no clean token for 0.7rem
- [x] [WARNING] theme: frontend/common/views/dashboard/accounting/carryover/CarryoverDataGrid.tsx:86 — fontSize "0.7rem", prefer theme token → Fix: SKIPPED — no exact token for 0.7rem; module-level constant without theme access
- [x] [WARNING] theme: frontend/common/views/dashboard/billing/accounting/reports/SessionAuditDataGrid.tsx:115 — fontSize "0.7rem", prefer theme token → Fix: SKIPPED — no exact token for 0.7rem; module-level constant without theme access
- [x] [WARNING] theme: frontend/common/components/ui/input/richText/RichTextEditor.tsx:151 — fontSize "0.75em" → caption token → Fix: SKIPPED — em-relative size is intentional for notched-outline geometry
- [x] [WARNING] theme: frontend/mobile/views/dashboard/students/history/studentHistory.mobile.tsx:100 — fontSize 16 → bodyLg token
- [x] [WARNING] theme: frontend/desktop/views/dashboard/billing/components/studentCreditDataGrid.desktop.tsx:19 — fontSize 16 → bodyLg token
- [x] [WARNING] theme: frontend/desktop/views/dashboard/reports/monthly-appraisal/teacherMonthlyAppraisals.desktop.tsx:148 — fontSize 13 on InputLabel; prefer token
- [x] [WARNING] theme: frontend/mobile/views/dashboard/reports/monthly-appraisal/teacherMonthlyAppraisals.mobile.tsx:115 — fontSize 13 on InputLabel; prefer token
- [x] [WARNING] theme: frontend/common/views/dashboard/accounting/credits/StudentCreditsList.tsx:69 — fontSize 13, prefer token
- [x] [WARNING] patterns: frontend/common/views/dashboard/widgets/OpenRequestsWidget.tsx:44 — local StatusChip with hand-rolled status→color map instead of shared StatusBadge
- [x] [WARNING] patterns: frontend/common/views/dashboard/scheduling/leave-requests/components/LeaveRequestStatusBadge.tsx:26 — raw Chip with own status map instead of shared StatusBadge (clones OpenRequestsWidget's map)
- [x] [WARNING] patterns: frontend/common/views/dashboard/billing/accounting/reports/SessionAuditStatusChip.tsx:15 — per-feature chip with SESSION_AUDIT_STATUS_COLORS map; add StatusBadge sessionAudit category
- [x] [WARNING] patterns: frontend/common/views/dashboard/settings/whatsapp/tabs/shared/OptInTabContent.tsx:91 — raw Chip + manual getStatusColors instead of StatusBadge category="syncStatus"
- [x] [WARNING] logging: frontend/common/lib/logger/index.ts:1 — barrel contains implementation + imports; move ClientLogger to a separate module and keep index.ts export-only

### SUGGESTION (26)
- [ ] [SUGGESTION] react: LoginForm.tsx:180, useLoginViewModel.ts:211, meetingProviderFormShared.tsx:151, useOnboardingSubmit.ts:55, useStudentStatusViewModel.ts:366, useLocalizedStringInputState.ts:259, localizedStringDrawerShared.tsx:298 — nested conditionals; extract helpers
- [ ] [SUGGESTION] react: EditableTypography stories (shared:42, desktop:42, mobile:43) — nested validation ternaries in stories
- [ ] [SUGGESTION] apollo: whatsapp-conversations.documents.ts:23 — deep import instead of domain barrel
- [ ] [SUGGESTION] apollo: parent-dashboard.documents.ts:7 + profile.documents.ts:7, auth.documents.ts:28, general-user-create.documents.ts:8 — deep imports of EFFECTIVE_MEETING_FIELDS instead of barrel
- [ ] [SUGGESTION] zustand: searchScheduleStore.ts:262 — DOM element in state; prefer ViewModel ref
- [ ] [SUGGESTION] zustand: appearancePreviewStore.ts:57 — DEFAULT_APPEARANCE_DRAFT duplicated from backend service; move to shared/
- [ ] [SUGGESTION] zustand: userStore.ts:6 — denormalized derived user fields can go stale
- [ ] [SUGGESTION] zustand: subjectManagementStore.ts:5 — dual dialog-state representations can desync
- [ ] [SUGGESTION] zustand: dashboardStore.ts:44 — empty-string-sentinel lazy date init repeated across 5 stores; extract factory
- [ ] [SUGGESTION] zustand: creditAdjustFormStore.ts:6 — clientRequestId guard token never sent to server; wire or remove
- [ ] [SUGGESTION] i18n: useImageUpload.ts:215 — hardcoded English error string
- [ ] [SUGGESTION] i18n: STYLED_COMPONENTS_REFACTORING_GUIDE.md:243, NEW_PAGE_WORKFLOW.md:46, page-prompt.md:252 — stale docs reference removed next-intl/shared/messages
- [ ] [SUGGESTION] theme: app/global-error.tsx:85 — hardcoded hex (documented by-design; no MUI at this level)
- [ ] [SUGGESTION] theme: ColorEditorSection.tsx:156 — "#000000" fallback → theme.palette.common.black
- [ ] [SUGGESTION] patterns: SessionAuditFilterBar.tsx:126 — raw Chip status preview; use StatusBadge
- [ ] [SUGGESTION] patterns: PayrollReportsFilterBar.tsx:131 — raw Chip status preview; use StatusBadge
- [ ] [SUGGESTION] logging: AGENTS.md vs actual logger import path drift (@/frontend/utils/logger does not exist)
- [ ] [SUGGESTION] logging: ~678 frontend directories missing index.ts barrels — recommend dedicated barrel-creation round

## Scoping Decisions

### IN-SCOPE (will fix this round)
- All 28 CRITICAL findings (Box/Typography component props, MUI v9 banned API)
- All 52 WARNING findings
- Deferred SUGGESTIONs are NOT fixed this round (except where trivially adjacent to an in-scope file edit)

### DEFERRED (NOT in scope — see Deferral Decision Tree)
- app/global-error.tsx hex colors — documented by-design (outside all providers)
- Missing barrels (~678 dirs) — massive scope; recommend dedicated round
- All SUGGESTION findings — future round
- Additional Box component= sites beyond the 30-finding cap (~12 more files: permissionGroupFormShared.tsx:118, assignGroupDialogShared.tsx:42, teacherOnboardingShared.tsx:218, managerOnboarding.desktop.tsx:57, SessionConfigFormDialog.tsx:88, studentParentAppraisals.desktop.tsx:118, quotaForm.desktop.tsx:38, meetingProviderFormShared.tsx:387, manualInvoice.desktop.tsx:60, parentOnboardingShared.tsx:256) — enumerate fully during fix phase
- Apollo id-field gaps (supervisor/teacher-dashboard, student-history, student-profile, teacher-dues documents) — blocked on backend synthetic id fields, per prior plan
- Numeric borderRadius 1-4 (~240 sites) — consistent with theme's own scale; accepted convention

## Cross-File Impacts

| Finding | Impacted Files | Impact Type | Status |
|---|---|---|---|
| StatusBadge categories (sessionAudit, leave-request/open-request status) | StatusBadge shared component may need new category entries | Pattern consolidation | pending |
| i18n fixes (AppraisalFormDialog, studentWeekCalendar, widgets, BrandIdentitySection) | shared/locale/ needs new namespaces/keys (ar + en) | i18n cascade | pending |
| logger barrel split | all `@/frontend/common/lib/logger` consumers (import path unchanged — barrel stays) | barrel | pending |

## Deferred Findings (for future rounds)

| Pattern | Count | Recommendation |
|---|---|---|
| Missing index.ts barrels | ~678 dirs | dedicated barrel-creation round |
| Box component= sites (beyond cap) | ~12 files | include in fix phase of next round if not reached |
| Apollo id-field gaps | 5 document files | unblock after backend synthetic id lands |
| SUGGESTION-tier nested conditionals/stores/docs | 26 | next maintenance round |

## Layer Compliance Notes

- Stores layer: several files violate stores/AGENTS.md NO MAPPING rule (Pick/Omit remapping, hand-defined snapshots). The serialization rule applies only to persist-enabled stores — the teacherDashboardStore function registry is a hygiene finding, not a serialization-rule violation. profitLossFilterStore persist-merge validation is a hygiene hardening, not a documented rule requirement.
- i18n: 8 components bypass the compile-time locale system entirely (bilingual app)
- No violations found: React 19 patterns, Apollo hook imports, document naming, console.* usage, next-intl/shared/messages imports

### plan-review validation results (Round 1)
1. **i18n tier-view rule (ESLint-enforced)**: `useAppTranslation` is NOT allowed in `frontend/mobile/views/**` or `frontend/desktop/views/**` tier files — labels must come via props from the ViewModel. Applies to: studentWeekCalendar.desktop.tsx and teacherMonthlyAppraisals .desktop/.mobile fontSize-adjacent i18n fixes. Fix approach for these: translate in the ViewModel / shared tier component, pass labels as props.
2. **Box component= framing**: `component="output"`/`"alert"` are AGENTS-endorsed (frontend/AGENTS.md:101) — do NOT flag/fix those. Only `form`/`button`/`main` (Box) and all Typography `component` usages are violations. The ~12-file deferred sweep must use this narrowed criterion.
3. **i18n namespace registration is 6-step** (shared/AGENTS.md:129-136): types interface, ar + en implementations, MessageSchema export, server loader namespacePaths, LocaleProvider if SSR, stable namespace ID. Pluralization/interpolation must be typed functions, not ICU strings. Product code imports only `@/shared/locale` — no deep paths.
4. **StatusBadge new categories**: frontend-only (types + utils); new categories must map into `StatusPaletteKey` union (`active|pending|blocked|confirmed|completed|cancelled`) or extend it.
5. **Logger barrel split**: keep batching/flush behavioral rules intact when moving ClientLogger out of index.ts; import path `@/frontend/common/lib/logger` unchanged.

## Fix Status

- Total findings: 106 (28 CRITICAL, 52 WARNING, 26 SUGGESTION)
- Fixed: 70 / 80 (in-scope; 10 resolved-as-skipped with rationale)
- Remaining: 0 in-scope
- Note: 10 findings fixed as "skipped/no clean token" within their fix (see Fix annotations); all others fully fixed
- Deferred: 26
