# Frontend Review Plan — Round 6

## Summary

8 parallel explore subagents reviewed the entire frontend/ and app/ codebase.
**18 CRITICAL**, **258 WARNING**, **125 SUGGESTION** findings.

Constraints: no commits, no pushes, respect AGENTS.md, fix all severities, don't undo other agents' work, skip errors on unmodified files.

## CRITICAL Findings (18) — Fix First

### i18n (3)
- [ ] `frontend/views/auth/login/components/LoginForm.tsx:107` — Hardcoded aria-label "Hide password"/"Show password" — add translation keys to AuthLoginLabels
- [ ] `frontend/mobile/views/dashboard/supervisor/teacher-dues/teacherDues.mobile.tsx:82` — Raw English `row.status ?? "PENDING"` as badge label — map to translation key
- [ ] `frontend/mobile/views/dashboard/profile/parent/sections/associatedStudentsCardList.mobile.tsx:41` — `formatStatusLabel` title-casing raw English status — use localized status label

### Patterns — Inline Chip → StatusBadge (15)
- [ ] `frontend/common/views/dashboard/admin/meeting-providers/useMeetingProvidersViewModel.tsx:108` — Inline Chip for active/inactive status → StatusBadge
- [ ] `frontend/common/views/dashboard/settings/utils/siteContentColumns.tsx:65` — Inline Chip for published/draft status → StatusBadge
- [ ] `frontend/common/views/dashboard/settings/tabs/meetingIntegrations/__shared__/meetingIntegrationsTabShared.tsx:97` — Inline Chip for test success/failure → StatusBadge
- [ ] `frontend/common/views/dashboard/settings/tabs/meetingIntegrations/__shared__/meetingIntegrationsTabShared.tsx:105` — Inline Chip for reauthNeeded → StatusBadge
- [ ] `frontend/desktop/views/dashboard/settings/components/meetingIntegrations/ConnectedAccountsTable.desktop.tsx:81` — Inline Chip for OAuth connection status → StatusBadge
- [ ] `frontend/mobile/views/dashboard/settings/components/meetingIntegrations/ConnectedAccountsTable.mobile.tsx:35` — Inline Chip for OAuth connection status (mobile) → StatusBadge
- [ ] `frontend/common/views/dashboard/cron/useCronViewModel.tsx:202` — Inline Chip for concurrencyPolicy status → StatusBadge cronRunStatus
- [ ] `frontend/desktop/views/dashboard/settings/whatsapp/tabs/OptInTab.desktop.tsx:40` — Inline Chip for optIn/optOut → StatusBadge
- [ ] `frontend/desktop/views/dashboard/settings/whatsapp/tabs/OptInTab.desktop.tsx:69` — Inline Chip for optedIn admin → StatusBadge
- [ ] `frontend/mobile/views/dashboard/settings/whatsapp/tabs/OptInTab.mobile.tsx:80` — Inline Chip for optIn/optOut (mobile) → StatusBadge
- [ ] `frontend/mobile/views/dashboard/settings/whatsapp/tabs/OptInTab.mobile.tsx:158` — Inline Chip for optedIn admin (mobile) → StatusBadge
- [ ] `frontend/desktop/views/dashboard/subjects/home/components/subjectCard.desktop.tsx:97` — Inline Chip for isActive===false → StatusBadge
- [ ] `frontend/mobile/views/dashboard/subjects/home/components/subjectCard.mobile.tsx:74` — Inline Chip for isActive===false (mobile) → StatusBadge
- [ ] `frontend/mobile/views/dashboard/settings/tabs/siteContent/siteContentSettingsTab.mobile.tsx:57` — Inline Chip for published/draft (mobile) → StatusBadge
- [ ] `frontend/common/views/dashboard/profile/shared/meeting-configs/ClassMeetingConfigsSection.tsx:92` — Inline Chip for meeting generation status → StatusBadge

## WARNING Findings (258)

### MUI v9 — component= direct props (162)
Typography `component` prop (51 occurrences across 28 files) and Box `component` prop (119 occurrences across 60+ files). Fix: wrap in actual HTML element or use styled() component. Per frontend/AGENTS.md, `component` is NOT a valid direct prop.

Files with Typography `component=` violations (28):
- simulationBannerShared.tsx, CreateRecurringClassDialogShared.tsx, CopyMeetingUrlButton.tsx, MeetingGenerationStatusIndicator.tsx (2), PhoneDisplay.tsx (2), TimezoneDisplay.tsx (2), catalogImageUploadShared.tsx, CountryOptionRow.tsx, CurrencyAutocompleteShared.tsx, currencyOptionRowShared.tsx, localizedStringDrawerShared.tsx, PaymentMethodOptionRow.tsx, TimezoneSelectShared.tsx, DateTimeTooltipDisplay.tsx, ScheduleTimezoneOffsetCell.tsx, EndpointList.tsx, and more.

Files with Box `component=` violations (60+):
- LocaleEmoji.tsx, MeetingJoinActionShared.tsx (2), MeetingUrlStatusBadge.tsx (2), OAuthConnectionStatusBadge.tsx, and 56+ others.

### MUI v9 — Hardcoded borderRadius (5)
- [ ] `frontend/common/views/dashboard/admin/parents/students/components/ClassesLeftProgress.tsx:42,45` — borderRadius: 4 → 6
- [ ] `frontend/common/views/dashboard/permissions/components/__shared__/singleGroupHeaderShared.tsx:117` — borderRadius: 4 → 6
- [ ] `frontend/mobile/views/dashboard/reschedule/tracking/components/rescheduleTrackingCardList.mobile.tsx:117` — borderRadius: 8 → 12
- [ ] `frontend/mobile/views/dashboard/students/history/components/performanceStreak.mobile.tsx:21` — borderRadius: 4 → 6

### Theme — String-based palette access (39)
All `sx={{ color: "text.secondary" }}` or `color="text.secondary"` should use `sx={theme => ({ color: theme.palette.text.secondary })}`.

Key files (multiple occurrences each):
- InvoicePaymentDetailsDialog.tsx (8), SubmitPaymentProofDialog.tsx (2), MeetingProviderCredentialForm.tsx (6), TestConnectionResultPanel.tsx (2), TokenMetadataDialog.tsx (2), EnvironmentConfigEntryRow.tsx (4), environmentConfigTabShared.options.tsx (3), parentProfileShared.tsx, PaymentMethodDisplayShared.tsx, CountryOptionRow.tsx, UserPaymentMethodAutocompleteShared.tsx, RecurringMeetingConfigSection.tsx, SettingsComingSoonTab.tsx, EndpointList.tsx, SettingsTabShell.tsx, configTabLoadingGuardShared.tsx, MeetingConfigFields.tsx, DashboardErrorBoundary.tsx, recurringSchedulesListView.desktop.tsx

### i18n — Hardcoded "Redirecting..." (12)
- [ ] `app/(dashboard)/billing/invoices/page.tsx:5` — generateMetadata hardcoded "Redirecting..."
- [ ] `app/(dashboard)/billing/manual/page.tsx:5` — same
- [ ] `app/(dashboard)/billing/exchange-rates/page.tsx:5` — same
- [ ] `app/(dashboard)/billing/currency-hedges/page.tsx:5` — same
- [ ] `app/(dashboard)/billing/currencies/page.tsx:5` — same
- [ ] `app/(dashboard)/complaints/manage/page.tsx:5` — same
- [ ] `app/(dashboard)/complaints/page.tsx:5` — same
- [ ] `app/(dashboard)/schedule/alerts/page.tsx:5` — same
- [ ] `app/(dashboard)/schedule/tracking/reschedule/page.tsx:5` — same
- [ ] `app/(dashboard)/schedule/tracking/status/page.tsx:5` — same
- [ ] `app/(dashboard)/suggestions/manage/page.tsx:5` — same
- [ ] `app/(dashboard)/meeting-providers/page.tsx:5` — same

### i18n — Hardcoded aria-label (2)
- [ ] `frontend/common/views/dashboard/settings/components/meetingIntegrations/MeetingIntegrationsBreadcrumb.tsx:12` — hardcoded aria-label="breadcrumb"
- [ ] `frontend/common/views/dashboard/profile/shared/meeting-configs/MeetingConfigsBreadcrumb.tsx:12` — hardcoded aria-label="breadcrumb"

### Apollo — Inline types (2)
- [ ] `frontend/common/graphql/sharedDocuments/students/student-directory.documents.ts:57-76` — inline types instead of generated
- [ ] `frontend/common/graphql/sharedDocuments/students/student-profile.documents.ts:136-167` — inline types instead of generated

### Zustand (5)
- [ ] `frontend/common/stores/adminBillingStore.ts:24,34` — inline `"success" | "error"` → shared SnackbarSeverity
- [ ] `frontend/common/stores/studentPortalProfileStore.ts:21,31` — same inline pattern
- [ ] `frontend/common/stores/currencyStore.ts:25-37` — complex intermediate mapping

### Barrels (5)
- [ ] `frontend/common/components/ui/index.ts:10` — export * from "./story/StoryBookPageContainer" — direct nested file re-export
- [ ] `frontend/mobile/components/ui/index.ts:7` — export * from "./container/page" — direct nested dir re-export
- [ ] `shared/locale/types/index.ts:15-35` — 21 lines re-exporting nested subdirs directly
- [ ] `shared/locale/types/dashboard/` — missing index.ts barrel
- [ ] `frontend/common/components/ui/story/` — missing index.ts barrel

### Patterns — useRouter from next/navigation (17)
All should import from `@/shared/i18n/navigation` instead of `next/navigation`:
- recurringSchedulesListView.desktop.tsx, recurringSchedulesListView.mobile.tsx, quotaList.mobile.tsx, useMeetingProvidersViewModel.tsx, useMeetingProviderFormViewModel.ts, useQuotaFormViewModel.ts, useQuotaDetailViewModel.ts, useRecurringSchedulesListViewModel.ts, MeetingProviderCredentialForm.tsx, useSettingsViewModel.ts, useEnvironmentConfigViewModel.ts, useMeetingIntegrationsViewModel.ts, whatsappTabUrl.ts, useProfileTabNavViewModel.ts, useMeetingConfigsManagerViewModel.ts, useUsersDirectoryTabsViewModel.ts, useTabbedPaneViewModel.ts, useTabbedPane.ts

### Patterns — Non-standard buttons / metric cards / inline patterns
- [ ] MeetingUrlCell.tsx — inline copy-to-clipboard instead of shared CopyMeetingUrlButton
- [ ] CronRunsDialog.tsx:156 — raw MUI DataGrid instead of AppDataGrid
- [ ] PerformanceLedgerCardShared.tsx:20 — inline StatCell instead of MetricCard
- [ ] SupervisorQuotaView.tsx:199 — inline metric cards instead of MetricCard
- [ ] TeacherQuotaView.tsx:50 — inline metric card
- [ ] SupervisorQuotaView.tsx:189 — ad-hoc title block instead of PageHeader
- [ ] parentDashboard.desktop.tsx:33 — missing PageHeader
- [ ] SupervisorQuotaView.tsx:194 — non-standard Button instead of PrimaryPageAction
- [ ] PaymentMethodsManager.tsx:133 — non-standard Button
- [ ] ClassMeetingConfigsSection.tsx:210 — non-standard Button
- [ ] StudentManagerProfileTab.tsx:100 — non-standard Button
- [ ] currencyHedges.mobile.tsx:31 — non-standard Button
- [ ] exchangeRates.desktop.tsx:130 — non-standard Button
- [ ] exchangeRates.mobile.tsx:261 — non-standard Button

### React 19 (1)
- [ ] `frontend/common/components/ui/dataGrid/appDataGridSharedUtils.tsx:20-21` — hook util without "use client"

## SUGGESTION Findings (125)

### Theme — Hardcoded transitions (112)
All `transition: "all 0.2s ease"` etc. should use `theme.transitions.create(...)`.

### Zustand — Date objects (2)
- [ ] `frontend/common/stores/studentHistoryStore.ts:17,26` — stores Date directly
- [ ] `frontend/common/stores/teacherAvailabilityStore.ts:7-8` — stores Date | null

### React 19 (2)
- [ ] `frontend/common/views/dashboard/profile/shared/AdminResetPasswordSection.tsx:27` — forwardRef can use ref-as-prop
- [ ] `frontend/common/views/dashboard/billing/quota/quotaFormAccessContext.ts:5-7` — non-null context default

### Barrels — Undocumented collision registry (4)
- [ ] `frontend/common/components/ui/display/meetingConfig/index.ts:8` — MeetingUrlCell named re-export
- [ ] `frontend/common/components/ui/input/meetingConfigTypeFields/index.ts:1` — MeetingConfigTypeFields collision
- [ ] `frontend/common/providers/theme/index.ts:2` — MuiProvider default export alias
- [ ] `frontend/common/lib/locale/country/index.ts:2` — countryList alias

### Patterns (1)
- [ ] `frontend/common/views/dashboard/students/quota/audience/SupervisorQuotaView.tsx:233` — AppDataGrid without SectionPanel wrapper

### i18n (2)
- [ ] `app/manifest.ts:7` — hardcoded English PWA description
- [ ] `frontend/common/views/dashboard/admin/billing/exchange-rates/ProviderSettingsSection.tsx:124-125` — brand names as literal JSX text

## Fix Strategy

### Phase 1: CRITICAL (18 items)
1. i18n CRITICALs — add translation keys, replace hardcoded strings
2. Inline Chip → StatusBadge — migrate 15 Chip usages to StatusBadge with appropriate categories

### Phase 2: WARNING — High impact
3. String-based `text.secondary` palette access (39 occurrences → ~20 files)
4. Hardcoded "Redirecting..." metadata (12 files)
5. useRouter from next/navigation → @/shared/i18n/navigation (17 files)
6. Zustand SnackbarSeverity + currencyStore
7. Apollo inline types
8. Barrel file fixes
9. Non-standard Button → PrimaryPageAction

### Phase 3: WARNING — MUI component= (162)
10. Typography component= (51 occurrences)
11. Box component= (111 occurrences)
12. Hardcoded borderRadius (5)

### Phase 4: SUGGESTION (125)
13. Hardcoded transitions (112) — use theme.transitions.create()
14. Other suggestions

## Plan Review Validation

### Affected layers:
- `app/` — app/AGENTS.md
- `frontend/views/` — frontend/views/AGENTS.md, frontend/AGENTS.md
- `frontend/stores/` — frontend/stores/AGENTS.md, frontend/AGENTS.md
- `frontend/common/graphql/` — frontend/common/graphql/AGENTS.md, frontend/AGENTS.md
- `shared/` — shared/AGENTS.md

### Rule compliance:
- **Type imports**: All types from @/backend/types — verified
- **MUI v9**: component= not valid direct prop — fixing in Phase 3
- **i18n**: All strings via translation system — fixing in Phase 1-2
- **Logging**: No console.* violations found
- **Barrels**: Fixing violations in Phase 2
- **Zustand**: Using shared SnackbarSeverity type
