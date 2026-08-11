# Tasks: Remove Container-Level `<RequirePermission>` Wrappers

## Execution Model: Pool of 16 Parallel Subagents

A pool of 16 subagents runs concurrently. Each subagent gets ONE file. When a subagent completes, a new file is dispatched to the freed slot. The pool stays full until all files are processed.

---

## Phase 1: Server Guard Fixes (4 files — sequential batch)

**MUST complete before Phase 2 begins.**

- [ ] 1. **Add `requirePermissionForPage` to `complaints/page.tsx`**
  - File: `app/(dashboard)/complaints/page.tsx`
  - Add `requirePermissionForPage` with `[AppPermission.SUPPORT_SUBMIT_COMPLAINT]`
  - Currently only has `getCachedParentIdForComplaints` — add permission check after that
  - _Req: AC-2, AC-4_

- [ ] 2. **Widen server guard in `teachers/page.tsx`**
  - File: `app/(dashboard)/teachers/page.tsx`
  - Current: `[STAFF_VIEW_DIRECTORY]` → Add `TEACHERS_LIST`
  - _Req: AC-4_

- [ ] 3. **Widen server guard in `parents/page.tsx`**
  - File: `app/(dashboard)/parents/page.tsx`
  - Current: `[PARENT_VIEW_DIRECTORY]` → Add `PARENTS_LIST`
  - _Req: AC-4_

- [ ] 4. **Widen server guard in `schedule/tracking/page.tsx`**
  - File: `app/(dashboard)/schedule/tracking/page.tsx`
  - Current: `[SESSION_RESCHEDULE, SCHEDULE_VIEW_ALL, SCHEDULE_VIEW_LIST]` → Add `DASHBOARD_VIEW_METRICS`
  - _Req: AC-4_

## Phase 2: Client Wrapper Removal — Pool of 16 (50 files)

Each subagent: remove `<RequirePermission>` wrapper, clean unused imports, run `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene`, fix until exit 0.

### Batch 1 (files 1-16)
- [ ] 5. `frontend/common/views/dashboard/cron/CronPageContainer.tsx` — perm: `CronManage`
- [ ] 6. `frontend/common/views/dashboard/billing/BillingPageContainer.tsx` — perm: `BillingViewHistory`
- [ ] 7. `frontend/common/views/dashboard/billing/manual/ManualInvoiceContainer.tsx` — perm: `BillingCreateInvoice`
- [ ] 8. `frontend/common/views/dashboard/billing/ParentBillingContainer.tsx` — perm: `BillingViewHistory`
- [ ] 9. `frontend/common/views/dashboard/staff/home/ManagersContainer.tsx` — perm: `StaffViewDirectory`
- [ ] 10. `frontend/common/views/dashboard/teachers/home/TeachersContainer.tsx` — perm: `StaffViewDirectory, TeachersList`
- [ ] 11. `frontend/common/views/dashboard/teachers/reassignment/TeacherReassignmentContainer.tsx` — perm: `StudentReassignTeacher, StudentManageStatus`
- [ ] 12. `frontend/common/views/dashboard/teachers/rules/TeacherRulesContainer.tsx` — perm: `TeacherViewDashboard`
- [ ] 13. `frontend/common/views/dashboard/teachers/availability/TeacherAvailabilityContainer.tsx` — perm: `ScheduleSearchAvailability`
- [ ] 14. `frontend/common/views/dashboard/teachers/students/TeacherStudentsContainer.tsx` — perm: `TeacherViewStudents`
- [ ] 15. `frontend/common/views/dashboard/teachers/schedule/weekly/TeacherWeeklyScheduleContainer.tsx` — outer perm: `ScheduleViewWeekly` (KEEP inner `ScheduleCreateClass` gate, KEEP import)
- [ ] 16. `frontend/common/views/dashboard/teachers/own-profile/TeacherOwnProfileContainer.tsx` — perm: `ProfileCoreIdentityViewOwn`
- [ ] 17. `frontend/common/views/dashboard/admin/billing/AdminBillingContainer.tsx` — perm: `BillingViewHistory`
- [ ] 18. `frontend/common/views/dashboard/admin/billing/currencies/SupportedCurrenciesContainer.tsx` — perm: `BillingViewExchangeRates`
- [ ] 19. `frontend/common/views/dashboard/admin/billing/currency-hedges/CurrencyHedgesContainer.tsx` — perm: `BillingManageCurrencyHedges`
- [ ] 20. `frontend/common/views/dashboard/admin/billing/exchange-rates/ExchangeRatesContainer.tsx` — perm: `BillingViewExchangeRates`

### Batch 2 (files 17-32)
- [ ] 21. `frontend/common/views/dashboard/admin/billing/exchange-rates/ProviderSettingsSection.tsx` — perm: `BillingManageFxProvider` (KEEP import? No — only usage)
- [ ] 22. `frontend/common/views/dashboard/admin/meeting-providers/MeetingProvidersContainer.tsx` — perm: `MeetingProvidersManageCatalog`
- [ ] 23. `frontend/common/views/dashboard/admin/meeting-providers/form/MeetingProviderFormContainer.tsx` — perm: `MeetingProvidersManageCatalog`
- [ ] 24. `frontend/common/views/dashboard/admin/parents/home/ParentsContainer.tsx` — perm: `ParentViewDirectory, ParentsList`
- [ ] 25. `frontend/common/views/dashboard/admin/parents/onboarding/ParentOnboardingContainer.tsx` — perm: `ParentsCreate`
- [ ] 26. `frontend/common/views/dashboard/admin/parents/students/StudentsContainer.tsx` — perm: `StudentsList`
- [ ] 27. `frontend/common/views/dashboard/admin/payment-catalogs/PaymentCatalogsPageContainer.tsx` — perm: `PaymentMethodsManageCatalogs, MeetingProvidersManageCatalog`
- [ ] 28. `frontend/common/views/dashboard/complaints/AdminComplaintsContainer.tsx` — perm: `ComplaintsRespond, ComplaintsList`
- [ ] 29. `frontend/common/views/dashboard/complaints/ParentComplaintsContainer.tsx` — perm: `SupportSubmitComplaint` (Phase 1 must add server guard first)
- [ ] 30. `frontend/common/views/dashboard/feedback/FeedbackManagePageContainer.tsx` — perm: `ComplaintsRespond, ComplaintsList, SuggestionsList`
- [ ] 31. `frontend/common/views/dashboard/parent/dashboard/ParentDashboardContainer.tsx` — perm: `ScheduleViewFamily`
- [ ] 32. `frontend/common/views/dashboard/parent/rules/ParentRulesContainer.tsx` — perm: `ScheduleViewFamily`
- [ ] 33. `frontend/common/views/dashboard/parent/social/ParentSocialContainer.tsx` — perm: `ScheduleViewFamily`
- [ ] 34. `frontend/common/views/dashboard/parent/students/ParentStudentsContainer.tsx` — perm: `ParentViewStudents`
- [ ] 35. `frontend/common/views/dashboard/reports/ReportsContainer.tsx` — perm: `ReportGenerateCustom`
- [ ] 36. `frontend/common/views/dashboard/reschedule/home/RescheduleContainer.tsx` — perm: `SessionReschedule`

### Batch 3 (files 33-48)
- [ ] 37. `frontend/common/views/dashboard/reschedule/tracking/RescheduleTrackingContainer.tsx` — perm: `SessionReschedule`
- [ ] 38. `frontend/common/views/dashboard/resources/ResourcesContainer.tsx` — perm: `ResourcesList`
- [ ] 39. `frontend/common/views/dashboard/schedule/alerts/ScheduleAlertsContainer.tsx` — perm: `ScheduleViewList`
- [ ] 40. `frontend/common/views/dashboard/schedule/tracking/ScheduleTrackingPageContainer.tsx` — perm: `SessionReschedule, ScheduleViewAll, ScheduleViewList`
- [ ] 41. `frontend/common/views/dashboard/search-schedule/SearchScheduleContainer.tsx` — perm: `ScheduleSearchAvailability`
- [ ] 42. `frontend/common/views/dashboard/settings/SettingsPageContainer.tsx` — perm: 7 settings perms
- [ ] 43. `frontend/common/views/dashboard/settings/whatsapp/WhatsappSettingsContainer.tsx` — perm: `WhatsappView`
- [ ] 44. `frontend/common/views/dashboard/student/credits/StudentCreditsContainer.tsx` — perm: `StudentViewOwnDashboard`
- [ ] 45. `frontend/common/views/dashboard/student/dashboard/StudentDashboardContainer.tsx` — perm: `StudentViewOwnDashboard`
- [ ] 46. `frontend/common/views/dashboard/student/history/StudentHistoryContainer.tsx` — perm: `StudentViewOwnDashboard`
- [ ] 47. `frontend/common/views/dashboard/student/sessions/StudentSessionsContainer.tsx` — perm: `StudentViewOwnDashboard`
- [ ] 48. `frontend/common/views/dashboard/students/onboarding/StudentOnboardingContainer.tsx` — perm: `StudentsCreate`
- [ ] 49. `frontend/common/views/dashboard/students/profile/StudentProfilePageClient.tsx` — perm: `StudentsList, StudentViewAssociated`
- [ ] 50. `frontend/common/views/dashboard/subjects/home/SubjectsContainer.tsx` — perm: `SubjectsList`
- [ ] 51. `frontend/common/views/dashboard/suggestions/AdminSuggestionsContainer.tsx` — perm: `SuggestionsList`
- [ ] 52. `frontend/common/views/dashboard/suggestions/ParentSuggestionsContainer.tsx` — perm: `CommunicationSubmitSuggestion`

### Batch 4 (files 49-55)
- [ ] 53. `frontend/common/views/dashboard/supervisor/lesson-reviews/PendingReviewsContainer.tsx` — perm: `LessonReportsReview, LessonReportsApprove`
- [ ] 54. `frontend/common/views/dashboard/supervisor/monthly-reports/MonthlyReportsContainer.tsx` — perm: `MonthlyReportsView`
- [ ] 55. `frontend/common/views/dashboard/supervisor/teacher-dues/TeacherDuesContainer.tsx` — perm: `TeacherDuesView`
- [ ] 56. `frontend/common/views/dashboard/tools/dst-migration/DstMigrationContainer.tsx` — perm: `SystemBulkUpdateDst` (dynamic)
- [ ] 57. `frontend/common/views/dashboard/users/billing-profile/UserBillingProfileContainer.tsx` — perm: `BillingViewHistory`
- [ ] 58. `frontend/common/views/dashboard/users/directory/UsersDirectoryPageContainer.tsx` — perm: `StaffViewDirectory, ParentViewDirectory, StudentsList`
- [ ] 59. `frontend/common/views/dashboard/classes/recurring/CreateRecurringClassContainer.tsx` — perm: `ScheduleManageRecurring`
- [ ] 60. `frontend/common/views/dashboard/classes/recurring/RecurringScheduleDetailContainer.tsx` — perm: `ScheduleViewAll`
- [ ] 61. `frontend/common/views/dashboard/classes/recurring/RecurringSchedulesListContainer.tsx` — perm: `ScheduleViewList`
- [ ] 62. `frontend/common/views/dashboard/classes/status/tracking/StatusTrackingContainer.tsx` — perm: `ScheduleViewAll, DashboardViewMetrics`
- [ ] 63. `frontend/common/views/dashboard/teachers/lesson-reports/TeacherLessonReportsContainer.tsx` — perm: `TeacherViewDashboard`
- [ ] 64. `app/(dashboard)/permissions/page.tsx` — remove direct `<RequirePermission>` (Category C — server guard already exists)
- [ ] 65. `frontend/common/views/dashboard/admin/home/AdminDashboardContainer.tsx` — perm: `DashboardViewMetrics` (sub-component of dashboard dispatcher — KEEP as fine-grained)

### Files NOT modified (Category B — fine-grained gating, KEEP):
- `frontend/common/views/dashboard/classes/details/admin/AdminActionsBar.tsx`
- `frontend/common/views/dashboard/classes/details/components/ClassDetailsToolbarArea.tsx`
- `frontend/common/views/dashboard/classes/details/components/LiveSessionToolbar.tsx`
- `frontend/common/views/dashboard/classes/details/teacher/ActionsPanel.tsx`
- `frontend/common/views/dashboard/feedback/FeedbackManageTabPanels.tsx` — per-tab gating
- `frontend/common/views/dashboard/billing/BillingTabPanels.tsx` — per-tab gating
- `frontend/common/views/dashboard/settings/SettingsTabPanels.tsx` — per-tab gating
- `frontend/common/views/dashboard/schedule/tracking/ScheduleTrackingTabPanels.tsx` — per-tab gating
- `frontend/common/views/dashboard/admin/payment-catalogs/PaymentCatalogsTabPanels.tsx` — per-tab gating
- `frontend/common/views/dashboard/admin/home/AdminDashboardContainer.tsx` — sub-component gating within dashboard dispatcher

## Phase 3: Cleanup & Documentation

- [ ] 66. **Verify `RequirePermission` component still needed**
  - Confirm Category B files still import `RequirePermission`
  - Confirm `RequirePermission.tsx` is NOT deleted
  - _Req: AC-3_

- [ ] 67. **Update `app/AGENTS.md`**
  - Line 34: Remove "Keep client `<RequirePermission>` as defense-in-depth" mandate
  - Replace with: "Container-level `<RequirePermission>` is NOT required — the server-side `requirePermissionForPage` is the single page-level gate. Fine-grained `<RequirePermission>` for individual buttons/tabs/sections is still encouraged for UX."
  - _Req: AC-7_

- [ ] 68. **Create `docs/auth/permission-architecture.md`**
  - Document the three-tier permission architecture
  - Server page guard (security boundary)
  - Service/GraphQL layer (security boundary)
  - Client ViewModel `hasPermission` (UX only — button/tab visibility)
  - Explain why container-level `<RequirePermission>` was removed
  - _Req: AC-7_

- [ ] 69. **Update root `AGENTS.md` Important References**
  - Add `docs/auth/permission-architecture.md` to Important References section
  - _Req: AC-7_

- [ ] 70. **Run full quality gate**
  - Run `bun tsgo` — 0 new errors (baseline: 0)
  - Run `bun biome:check` — 0 new warnings
  - Run `bun run lint` — 0 new lint errors
  - _Req: AC-9_
