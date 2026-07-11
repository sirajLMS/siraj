# Mobile/Desktop Refactor Tracker

| Page | Status | Plan Dir | Started | Completed |
|------|--------|----------|---------|-----------|
| Resources | [ ] not started | .ai/plans/resources/ | - | - |
| Reports | [ ] not started | .ai/plans/reports/ | - | - |
| Students | [ ] not started | .ai/plans/students/ | - | - |
| AdminComplaints | [ ] not started | .ai/plans/admin-complaints/ | - | - |
| ParentComplaints | [ ] not started | .ai/plans/parent-complaints/ | - | - |
| AdminBilling | [ ] not started | .ai/plans/admin-billing/ | - | - |
| UserBillingProfile | [ ] not started | .ai/plans/user-billing-profile/ | - | - |
| ParentBilling | [ ] not started | .ai/plans/parent-billing/ | - | - |
| ManualInvoice | [ ] not started | .ai/plans/manual-invoice/ | - | - |
| AdminSuggestions | [ ] not started | .ai/plans/admin-suggestions/ | - | - |
| ParentSuggestions | [ ] not started | .ai/plans/parent-suggestions/ | - | - |
| ScheduleOverview (Admin Dashboard) | [ ] not started | .ai/plans/schedule-overview/ | - | - |
| TeacherDashboard | [ ] not started | .ai/plans/teacher-dashboard/ | - | - |
| ParentDashboard | [ ] not started | .ai/plans/parent-dashboard/ | - | - |
| ScheduleOverviewSection | [ ] not started | .ai/plans/schedule-overview-section/ | - | - |
| DateNavigator | [ ] not started | .ai/plans/date-navigator/ | - | - |
| LocalizedStringDrawer | [ ] not started | .ai/plans/localized-string-drawer/ | - | - |
| SearchScheduleFilterDrawer | [ ] not started | .ai/plans/search-schedule-filter-drawer/ | - | - |
| ParentsView | [ ] not started | .ai/plans/parents-view/ | - | - |
| ScheduleAlertsView | [ ] not started | .ai/plans/schedule-alerts/ | - | - |
| ScheduleAlertBanners | [ ] not started | .ai/plans/schedule-alert-banners/ | - | - |
| InstitutionalReportCard | [ ] not started | .ai/plans/institutional-report-card/ | - | - |
| DstMigrationView | [ ] not started | .ai/plans/dst-migration/ | - | - |
| UpdatedSessionsSection | [ ] not started | .ai/plans/updated-sessions/ | - | - |
| FutureScheduleView | [ ] not started | .ai/plans/future-schedule/ | - | - |
| JumpToDateHeader | [ ] not started | .ai/plans/jump-to-date-header/ | - | - |
| FutureClassCard | [ ] not started | .ai/plans/future-class-card/ | - | - |
| CreateRecurringClassView | [ ] not started | .ai/plans/create-recurring-class/ | - | - |
| UpcomingClassesTable | [ ] not started | .ai/plans/upcoming-classes-table/ | - | - |
| StudentStatusHeader | [ ] not started | .ai/plans/student-status-header/ | - | - |
| OnlineMeetingCard | [ ] not started | .ai/plans/online-meeting-card/ | - | - |
| CommunicationLogCard | [ ] not started | .ai/plans/communication-log-card/ | - | - |
| ClassAuditView | [ ] not started | .ai/plans/class-audit/ | - | - |
| AdminNoteCard | [ ] not started | .ai/plans/admin-note-card/ | - | - |
| RescheduleTrackingView | [ ] not started | .ai/plans/reschedule-tracking/ | - | - |
| TeacherAvailabilityView | [ ] not started | .ai/plans/teacher-availability/ | - | - |
| PermissionManagementView | [ ] not started | .ai/plans/permission-management/ | - | - |
| PermissionCatalogSection | [ ] not started | .ai/plans/permission-catalog/ | - | - |
| NotificationPreferencesTab | [ ] not started | .ai/plans/notification-preferences/ | - | - |
| RescheduleView | [ ] not started | .ai/plans/reschedule/ | - | - |
| TeacherReassignmentView | [ ] not started | .ai/plans/teacher-reassignment/ | - | - |
| ManagersView | [ ] not started | .ai/plans/managers/ | - | - |
| TeacherWeeklyScheduleView | [ ] not started | .ai/plans/teacher-weekly-schedule/ | - | - |
| ClassDetailsContainer | [ ] not started | .ai/plans/class-details-container/ | - | - |
| SubjectsView | [ ] not started | .ai/plans/subjects/ | - | - |
| LocaleAdornmentSwitch | [ ] not started | .ai/plans/locale-adornment-switch/ | - | - |
| StatusTrackingDataGrid | [ ] not started | .ai/plans/status-tracking-datagrid/ | - | - |

**Status codes**: `[ ]` not started, `[~]` in progress, `[x]` done

**Skill updates this file** after each page:
- On start: change `[ ]` → `[~]`, fill Started date
- On complete: change `[~]` → `[x]`, fill Completed date

## ESLint Verification Checklist (per page)

After migration, verify:
- [ ] No `useMediaQuery` imports in any `.mobile.tsx`/`.desktop.tsx`
- [ ] No `useViewport`/`ViewportContext` imports in any `.mobile.tsx`/`.desktop.tsx`
- [ ] No cross-tier imports (`.mobile` importing `.desktop` or vice versa)
- [ ] `ResponsiveViewSwitch` is the ONLY shared component importing `useViewport`
- [ ] `View.tsx` switcher is the ONLY page-level file importing `useViewport`
- [ ] All `File`/`Blob` state in `useRef` in ViewModel hook, not Zustand

## Quality Gates (per page)

- [ ] `bun tsgo` clean on all new/modified files
- [ ] `bun biome:check` clean
- [ ] Lint queue passes on all new/modified files
- [ ] `bun quality-gate` passes (or at least BASIC_CHECKS)
- [ ] Manual resize test: state survives desktop→mobile→desktop
- [ ] Storybook stories render in all 3 viewport globals