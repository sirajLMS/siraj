# Theme Refactoring Migration Tasks

This file tracks the migration of components to the new Material 3 theme architecture.

## Migration Checklist Patterns

- [ ] **Run Quality Gate**: Execute `bun tsgo` and `bun biome:check <file>` after migration to ensure zero type errors and biome compliance.
- [ ] **Status Tracking**: Mark tasks as "in progress" (`[ ]`) before starting and "completed" (`[x]`) only after QG passes.
- [ ] Replace `color="primary.main"` with `sx={(theme) => ({ color: theme.palette.primary.main })}` (Use callback ONLY if theme values are needed).
- [x] **NEVER DELETE** properties like `boxShadow`. Map them to `theme.palette.shadow.card` or similar.
- [x] Replace hardcoded hex/rgba with `theme.palette...`
- [x] Replace `contrastText` with `on<Color>` (e.g. `onPrimary`)
- [x] Ensure NO quotes are used for color values in props.

## File Tasks

### Completed

- [x] src\app\[locale]\(auth)\login\page.tsx
- [x] src\app\[locale]\page.tsx
- [x] src\components\LanguageSwitcher.tsx
- [x] src\components\ThemeSwitcher.tsx
- [x] src\components\ui\ActionButtons.tsx
- [x] src\components\ui\AppDataGridNoRowsOverlay.tsx
- [x] src\components\ui\BaseCard.tsx
- [x] src\components\ui\MetricCard.tsx
- [x] src\components\ui\PageHeader.tsx
- [x] src\components\ui\SectionPanel.tsx
- [x] src\providers\theme\ThemeProvider.tsx
- [x] src\views\auth\login\components\LoginFooter.tsx
- [x] src\views\auth\login\components\LoginForm.tsx
- [x] src\views\auth\login\components\LoginHeader.tsx
- [x] src\views\auth\login\components\ThemeLanguageControls.tsx
- [x] src\components\ui\StatusBadge.tsx
- [x] src\views\dashboard\classes\CreateRecurringClassView.tsx
- [x] src\views\dashboard\classes\components\ActionsPanel.tsx
- [x] src\views\dashboard\classes\components\ActivityHeatmap.tsx
- [x] src\views\dashboard\classes\components\AdminActionsBar.tsx
- [x] src\views\dashboard\classes\components\AdminNoteCard.tsx
- [x] src\views\dashboard\classes\components\ClassAuditDetailsCard.tsx
- [x] src\views\dashboard\classes\components\ClassInfoCard.tsx
- [x] src\views\dashboard\classes\components\ClassInstanceDetailsCard.tsx
- [x] src\views\dashboard\classes\components\CommunicationLogCard.tsx
- [x] src\views\dashboard\classes\components\LivePerformanceGrid.tsx
- [x] src\views\dashboard\classes\components\PerformanceOverviewCard.tsx
- [x] src\views\dashboard\components\Sidebar.tsx
- [x] src\views\dashboard\components\TopNavbar.tsx
- [x] src\views\dashboard\schedule\components\AcademicScheduleCardList.tsx
- [x] src\views\dashboard\schedule\components\InstitutionalReportCard.tsx
- [x] src\views\dashboard\schedule\components\ScheduleAlertBanners.tsx
- [x] src\views\dashboard\schedule\components\StatusTrackingDataGrid.tsx
- [x] src\views\dashboard\students\components\ClassesLeftProgress.tsx
- [x] src\views\dashboard\students\components\StudentDirectoryCardStats.tsx
- [x] src\views\dashboard\students\components\StudentMobileMetricsScroll.tsx
- [x] src\views\dashboard\students\history\components\CalendarGrid.tsx
- [x] src\views\dashboard\students\history\components\ClassDetailsModal.tsx
- [x] src\views\dashboard\teachers\components\FutureClassCard.tsx
- [x] src\views\dashboard\teachers\components\JumpToDateHeader.tsx
- [x] src\views\dashboard\teachers\schedule\weekly\MobileScheduleList.tsx
- [x] src\views\dashboard\teachers\schedule\weekly\WeeklyScheduleGrid.tsx
- [x] src\views\dashboard\classes\components\DayScheduleRow.tsx
- [x] src\views\dashboard\classes\components\DurationInput.tsx
- [x] src\views\dashboard\classes\components\MetadataCard.tsx
- [x] src\views\dashboard\classes\components\MobileDayOverrideRow.tsx
- [x] src\views\dashboard\classes\components\RegisteredStudentsSection.tsx
- [x] src\views\dashboard\classes\components\StudentProfileCard.tsx
- [x] src\views\dashboard\classes\components\TimeInput.tsx
- [x] src\views\dashboard\classes\components\TimezoneWarningBanner.tsx
- [x] src\views\dashboard\classes\components\VenueLocationCard.tsx
- [x] src\views\dashboard\classes\components\WeekendDayRow.tsx
- [x] src\views\dashboard\schedule\ScheduleAlertsView.tsx
- [x] src\views\dashboard\schedule\StatusTrackingView.tsx
- [x] src\components\ui\AppDataGridLoadingOverlay.tsx
- [x] src\views\dashboard\schedule\components\AcademicScheduleDataGrid.tsx
- [x] src\views\dashboard\schedule\components\ClassSessionActionButton.tsx
- [x] src\views\dashboard\schedule\components\RescheduleTrackingCardList.tsx
- [x] src\views\dashboard\schedule\components\RescheduleTrackingDataGrid.tsx
- [x] src\views\dashboard\schedule\components\ScheduleOverviewDataGrid.tsx
- [x] src\views\dashboard\schedule\components\ScheduleOverviewSection.tsx
- [x] src\views\dashboard\schedule\components\StatusTrackingCardList.tsx
- [x] src\views\dashboard\schedule\components\SuspensionAnalytics.tsx
- [x] src\views\dashboard\schedule\components\SuspensionAnalyticsChart.tsx
- [x] src\views\dashboard\students\StudentsMobileView.tsx
- [x] src\views\dashboard\students\components\StudentDirectoryCardHeader.tsx
- [x] src\views\dashboard\students\components\StudentDirectoryDataGrid.tsx
- [x] src\views\dashboard\students\history\components\ClassSessionList.tsx
- [x] src\views\dashboard\students\history\components\MobileWeeklyScroller.tsx
- [x] src\views\dashboard\students\history\components\PerformanceStreak.tsx
- [x] src\views\dashboard\students\history\components\StudentHistoryDesktop.tsx
- [x] src\views\dashboard\students\history\components\StudentHistoryMobile.tsx
- [x] src\views\dashboard\students\quota\StudentQuotaView.tsx
- [x] src\views\dashboard\students\quota\components\ContextualHelperCards.tsx
- [x] src\views\dashboard\students\quota\components\CourseDetailsSection.tsx
- [x] src\views\dashboard\students\quota\components\SectionHeader.tsx
- [x] src\views\dashboard\students\quota\components\StudentInformationSection.tsx
- [x] src\views\dashboard\students\status\StudentStatusView.tsx
- [x] src\views\dashboard\students\status\components\AdminHoldControls.tsx
- [x] src\views\dashboard\students\status\components\PolicyOverviewCard.tsx
- [x] src\views\dashboard\students\status\components\StudentStatusHeader.tsx
- [x] src\views\dashboard\students\status\components\UpcomingClassesTable.tsx
- [x] src\views\dashboard\teachers\FutureScheduleView.tsx
- [x] src\views\dashboard\teachers\availability\components\AvailabilityInsights.tsx
- [x] src\views\dashboard\teachers\availability\components\AvailabilitySearchForm.tsx
- [x] src\views\dashboard\teachers\availability\components\WeeklyAvailabilityGrid.tsx
- [x] src\views\dashboard\teachers\components\ImportantNotes.tsx
- [x] src\views\dashboard\teachers\components\MiniCalendar.tsx
- [x] src\views\dashboard\teachers\components\SupportContact.tsx
- [x] src\views\dashboard\teachers\components\TeacherCardList.tsx
- [x] src\views\dashboard\teachers\components\TeacherDataGrid.tsx
- [x] src\views\dashboard\teachers\onboarding\TeacherOnboardingView.tsx
- [x] src\views\dashboard\teachers\onboarding\components\BankingLedgerSection.tsx
- [x] src\views\dashboard\teachers\onboarding\components\OfficialDetailsSection.tsx
- [x] src\views\dashboard\teachers\profile\components\SectionHeader.tsx
- [x] src\views\dashboard\teachers\onboarding\components\TeacherInfoSection.tsx
- [x] src\views\dashboard\teachers\onboarding\components\SalaryDetailsSection.tsx
- [x] src\views\dashboard\teachers\profile\components\SystemConfigSection.tsx
- [x] src\views\dashboard\teachers\profile\components\TeacherInfoFields.tsx
- [x] src\views\dashboard\teachers\profile\components\TeacherProfileFormActions.tsx
- [x] src\views\dashboard\teachers\profile\components\TeacherProfileStats.tsx
- [x] src\views\dashboard\teachers\reassignment\components\CurrentTeacherCard.tsx
- [x] src\views\dashboard\teachers\reassignment\components\ManagementControlsCard.tsx
- [x] src\views\dashboard\teachers\reassignment\components\ReassignmentBentoGrid.tsx
- [x] src\views\dashboard\teachers\reassignment\components\StudentContextCard.tsx
- [x] src\views\dashboard\teachers\schedule\weekly\TeacherWeeklyScheduleView.tsx

### Pending

## Progress Log

- [ ] Status Legend: `[ ]` Pending, `[ ]` In Progress, `[x]` Completed.
