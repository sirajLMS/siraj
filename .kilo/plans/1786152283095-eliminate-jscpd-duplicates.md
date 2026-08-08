# Plan: Eliminate jscpd Duplicates (1021 clones)

## Context

`bun check:duplicates` (jscpd) reports **1021 clones** across 3316 files (8.40% duplicated lines, 9.06% duplicated tokens). The `.jscpd.json` config has an unknown `$schema` field warning. Clones fall into 11 categories, with Mobile/Desktop/Common UI triplication being the dominant pattern (~600+ clones).

The codebase has an established `*Shared.tsx` scaffold pattern (e.g., `baseDeleteDialogShared.tsx`, `appDataGridShared.tsx`) where shared JSX/logic is extracted into a scaffold with slot props, and tier variants inject their own button/component slots. However, many tier variants still duplicate the full JSX instead of consuming the scaffold.

## Architecture Constraints

- **Tier isolation**: `.mobile.tsx` / `.desktop.tsx` files must NEVER import `useMediaQuery` or `useViewport` (ESLint enforced). Only `ResponsiveViewSwitch` reads viewport.
- **Shared layer isolation**: `shared/` must NEVER import from `@/frontend/**`, `@/backend/**`, or `@/app/**`. Cross-layer enums belong in `shared/constants/`.
- **Backend enum isolation**: `backend/enum/` is backend-only. Shared code must use `shared/constants/`. Frontend uses GraphQL codegen enums.
- **Locale system**: Compile-time TypeScript i18n in `shared/locale/`. Migration from monolithic `profile.ts` → split `profile/{teacher,parent,staff,notifications}/` is in progress (both old and new exist).
- **Repository layer**: Data access only, no business logic. Uses `queryDb(tx)` for bare reads, `runInTransaction` for writes.
- **`*Shared.tsx` pattern**: Scaffold component with slot props (e.g., `CancelActionButton`, `ConfirmActionButton`) in `common/`. Tier variants import scaffold + inject tier-specific components.

## Phased Approach

### Phase 1: Config Fix + Quick Wins (Low Risk)

#### 1.1 Fix jscpd config warning
- **File**: `.jscpd.json`
- **Change**: Remove the `$schema` field (jscpd reports "unknown field '$schema'"). Alternatively, check if the schema URL is valid for the installed jscpd version and update/remove accordingly.
- **Verify**: `bun check:duplicates` no longer prints the config warning.

#### 1.2 Eliminate identical enum duplication
- **Files**: `backend/enum/shared/system-setting.enum.ts` and `shared/constants/settings/system-settings.enum.ts` are **100% identical**.
- **Fix**: Delete `backend/enum/shared/system-setting.enum.ts`. Make `backend/enum/shared/index.ts` re-export from `@/shared/constants/settings/system-settings.enum`. Update all backend imports.
- **Verify**: `bun tsgo` passes. `bun run lint` passes. No remaining clone between these two files.

#### 1.3 Eliminate identical utility duplication
- **`backend/lib/enum.ts` vs `frontend/common/lib/enum.ts`**: Extract shared enum utilities to `shared/lib/enum.ts`. Both backend and frontend import from shared.
- **`backend/lib/meeting-config.validation.ts` vs `frontend/common/lib/meeting-config.ts`**: Extract shared meeting-config validation/parsing to `shared/lib/meeting-config.ts`. Both import from shared.
- **`backend/services/meeting/meeting-url-parser.ts` vs `frontend/common/lib/meeting-config.ts`**: Extract URL parser to `shared/lib/meeting-url-parser.ts`. Both import from shared.
- **`backend/db/repo/utils/resolve-localized.ts` vs `frontend/common/lib/localized-string.ts`**: Extract `resolveLocalized`, `setLocalized`, `omitEmptyLocalized` to `shared/lib/localized-string.ts`. Both backend and frontend import from shared. Frontend keeps its additional helpers (`removeLocalizedString`, `hasRequiredLocalizedValue`, `pickInitialActiveLocale`, `unusedLocales`) in the frontend file.
- **`backend/lib/env-config-resolver.ts` vs `backend/services/system/environment-config.service.ts`**: Extract shared env-config resolution logic to a shared helper. Determine which is canonical (likely the service) and have the other import from it.
- **`frontend/common/lib/logger/index.ts` vs `backend/lib/logger/base-logger.ts`**: Extract shared logger base to `shared/lib/logger/`. Both import from shared.
- **`frontend/common/lib/currency.ts` vs `frontend/common/lib/static-currency-catalog.ts`**: Extract shared currency catalog data to a single source. One imports from the other.
- **Verify**: `bun tsgo`, `bun run lint`, `bun check:duplicates` shows these clones eliminated.

#### 1.4 Eliminate page-level duplication
- **`app/(dashboard)/meeting-providers/create/page.tsx` vs `edit/page.tsx`**: Extract shared page scaffold (metadata + auth + permission guard) into a helper. Both pages call the helper with their mode-specific params.
- **`app/(dashboard)/users/[id]/profile/page.tsx` vs `edit/page.tsx`**: Extract shared profile page scaffold.
- **`app/(dashboard)/parents/[id]/profile/page.tsx` vs `edit/page.tsx`**: Extract shared parent profile page scaffold.
- **`app/(dashboard)/teachers/[id]/availability/page.tsx` vs `schedule/future/page.tsx` vs `schedule/weekly/page.tsx`**: Extract shared teacher schedule page scaffold.
- **`app/(dashboard)/profile/page.tsx` vs `users/[id]/profile/edit/page.tsx`**: Extract shared profile page scaffold.
- **Verify**: `bun tsgo`, `bun run lint`, pages render correctly.

---

### Phase 2: Backend Duplication (Medium Risk)

#### 2.1 Repository internal duplication (same file)
For each repository with duplicated blocks, extract a shared helper function within the same file (or a sibling `*.helpers.ts`):

- **`audit.repository.ts`** (lines 36-49 vs 62-75): Extract `mapAuditLogRow(input, now)` helper. Both `createAuditLog` and `mapAuditLogRows` call it.
- **`billing.repository.ts`** (lines 112-128 vs 160-176): Extract shared billing row mapping helper.
- **`quota.repository.ts`** (lines 543-555 vs 607-620): Extract shared quota ledger mapping helper.
- **`parent.repository.ts`** (lines 423-443 vs 467-487, and 447-467 vs 491-511): Extract `toggleParentStatus(parentId, targetStatus, tx, locale)` helper that `deactivateParent` and `reactivateParent` both call. Extract shared parent update returning helper.
- **`user.repository.ts`** (lines 109-130 vs 144-165): Extract shared user query/mapping helper.
- **`notification.repository.ts`** (lines 43-55 vs 806-819): Extract shared notification mapping helper.
- **`session.repository.ts`** (lines 114-131 vs 454-470, and 270-289 vs 335-349): Extract shared session query/mapping helpers.
- **`cron.repository.ts`** (lines 402-415 vs 429-445): Extract shared cron job mapping helper.
- **`meeting-provider.repository.ts`** (lines 67-83 vs 150-166): Extract shared provider mapping helper.
- **`books/report.repository.ts`** (lines 144-155 vs 170-181): Extract shared report mapping helper.
- **`class-category.repository.ts` vs `class-subject.repository.ts`** (lines 217-239 vs 224-246): Extract shared category/subject mapping helper to `backend/db/repo/classes/class-shared.helpers.ts`.
- **`supported-mobile-wallet.repository.ts` vs `supported-online-account.repository.ts` vs `supported-payment-link.repository.ts`**: Extract shared supported-payment mapping helper to `backend/db/repo/billing/supported-payment-shared.helpers.ts`.
- **`scheduling/class-instance-upsert.ts`** (lines 42-65 vs 82-105): Extract shared upsert mapping helper.
- **`scheduling/recurring-schedule.repository.ts`** (lines 40-50 vs 236-246): Extract shared recurring schedule mapping helper.
- **`scheduling/scheduling-queries.repository.helpers.ts`** (lines 103-111 vs 181-189): Extract shared query helper.
- **`parents/suggestion.repository.ts`** (lines 149-159 vs 215-225): Extract shared suggestion mapping helper.
- **`meeting/class-meeting-config.repository.ts` vs `user-meeting-config.repository.ts`**: Extract shared meeting-config mapping helper to `backend/db/repo/meeting/meeting-config-shared.helpers.ts`.
- **Verify**: `bun run test:db` passes. `bun tsgo` passes. `bun run lint` passes.

#### 2.2 Cross-file repo/service duplication
- **`parent.repository.ts` vs `parent-onboarding.service.ts`** (lines 77-88 vs 74-85): The service duplicates repo query logic. Move the query to the repo, have the service call the repo method.
- **`teacher.repository.ts` vs `teacher-onboarding.service.ts`** (lines 44-57 vs 73-86): Same pattern — move query to repo, service calls repo.
- **`permission-management.repository.ts` vs `billing-management.service.ts`** (lines 620-630 vs 140-149): Move shared logic to repo, service calls repo.
- **`auth.mutation.ts` vs `demo-auth.service.ts`** (lines 248-260 vs 128-138): Extract shared auth logic to a service method, mutation calls service.
- **`lib/auth/permissions.ts` vs `services/auth/permissions.service.ts`** (lines 19-35 vs 25-41, and 35-49 vs 42-56): Consolidate into `permissions.service.ts`. Have `lib/auth/permissions.ts` re-export from the service or delete if unused.
- **`services/auth/impersonation.service.ts` vs `permission-group-simulation.service.ts`** (lines 24-32 vs 22-30): Extract shared banner/auth logic to a shared helper.
- **Verify**: `bun run test:db`, `bun run test:services`, `bun run test:graphql` pass.

#### 2.3 Schema duplication
- **`supported-mobile-wallets.ts` vs `supported-online-accounts.ts` vs `supported-payment-links.ts`** (lines 15-23): These share the same column definitions. Extract shared column definitions to `backend/db/schema/billing/supported-payment-shared-columns.ts`. Each schema imports and extends.
- **`class-category.ts` vs `class-subject.ts`** (lines 9-17 vs 31-39): Extract shared columns to `backend/db/schema/classes/class-shared-columns.ts`.
- **`scheduling.ts`** (lines 57-68 vs 148-159): Extract shared scheduling column block to a helper.
- **Verify**: `bun run db generate` (dry run, no migration needed). `bun tsgo` passes.

---

### Phase 3: GraphQL Duplication (Medium Risk)

#### 3.1 Pothos/query internal duplication
For each GraphQL file with duplicated blocks, extract shared resolver/field-builder helpers:

- **`meeting.mutation.ts`** (lines 88-105 vs 135-152): Extract shared meeting mutation resolver helper.
- **`billing-payments.pothos.ts`** (lines 24-45 vs 60-80): Extract shared payment field builder.
- **`credit.pothos.ts`** (lines 8-22 vs 38-52): Extract shared credit field builder.
- **`payment-method.pothos.ts`** (lines 256-264 vs 276-284): Extract shared payment method field builder.
- **`payment-method.mutation.ts`** (lines 116-126 vs 131-141): Extract shared mutation resolver.
- **`class-subject.pothos.ts`** (lines 53-63 vs 67-77): Extract shared field builder.
- **`complaint.pothos.ts`** (lines 174-187, 176-184 vs 214-222): Extract shared complaint field builder.
- **`cron.pothos.ts`** (lines 144-154 vs 159-169): Extract shared cron field builder.
- **`permission-management.pothos.ts`** (lines 277-285 vs 288-296): Extract shared permission field builder.
- **`recurring-schedule.pothos.ts`** (lines 26-35 vs 44-53): Extract shared field builder.
- **`schedule.pothos.ts`** (lines 31-46 vs teacher-dashboard 68-83, and 180-191 vs student-status 19-30): Extract shared schedule field builders.
- **`student-directory.pothos.ts`** (lines 63-78 vs staff-directory 166-181, and 64-81 vs parent-dashboard 21-36): Extract shared directory field builders.
- **`teacher-notes.pothos.ts`** (lines 33-42 vs 44-51): Extract shared notes field builder.
- **`whatsapp-account.pothos.ts`** (lines 50-59 vs 61-74): Extract shared whatsapp field builder.
- **`lesson-report.query.ts`** (lines 58-75 vs 89-106, and 83-106 vs 114-137): Extract shared lesson report query helper.
- **`parent-dashboard.query.ts` vs `parent-directory.query.ts`** (lines 17-34 vs 21-38): Extract shared parent query helper.
- **`monthly-report.query.ts`** (lines 12-20 vs 37-45): Extract shared report query helper.
- **`schedule.query.ts`** (lines 25-36 vs pagination 72-83, and 174-183 vs 205-214): Extract shared schedule query helper.
- **`student-history.query.ts` vs `student-profile.query.ts`** (lines 15-30 vs 13-28): Extract shared student query helper.
- **`fx-ingestion.pothos.ts` vs `timezones-settings.pothos.ts`** (lines 28-49 vs 9-28): Extract shared settings field builder.
- **Verify**: `bun run generate:gqlSchema`, `bun codegen`, `bun run test:graphql` pass.

---

### Phase 4: Locale Duplication (Medium Risk — Migration Completion)

#### 4.1 Complete locale namespace split
The locale files are mid-migration: monolithic `profile.ts` is being split into `profile/{teacher,parent,staff,notifications}/`. Both old and new exist, causing duplication. Complete the migration:

- **`profile.ts` vs `profile/teacher/index.ts`** (lines 49-127): Remove the `teacher` block from `profile.ts`. Ensure `profile/teacher/index.ts` is the canonical source. Update `MessageSchema` type and namespace registration.
- **`profile.ts` vs `profile/parent/index.ts`** (lines 151-217): Remove the `parent` block from `profile.ts`.
- **`profile.ts` vs `profile/staff/index.ts`** (lines 218-263): Remove the `staff` block from `profile.ts`.
- **`profile.ts` vs `profile/notifications/index.ts`** (lines 320-387): Remove the `notifications` block from `profile.ts`.
- **`auth/index.ts` vs `auth/login.ts`** (lines 4-30): Split `auth/index.ts` — move login-specific labels to `auth/login.ts`. Keep shared auth labels in `auth/index.ts`.
- **`auth/index.ts` vs `auth/impersonation.ts`** (lines 31-46): Move impersonation labels to `auth/impersonation.ts`.
- **`ui/meeting-config.ts` vs `ui/meetingConfig/display.ts`** (lines 13-34): Split `ui/meeting-config.ts` — move display labels to `ui/meetingConfig/display.ts`.
- **`ui/meeting-config.ts` vs `ui/meetingConfig/manager.ts`** (lines 45-72): Move manager labels to `ui/meetingConfig/manager.ts`.
- **`ui/payment-method.ts` vs `ui/paymentMethod/manager.ts`** (lines 61-79): Move manager labels to `ui/paymentMethod/manager.ts`.
- **`errors/index.ts`** (lines 120-135 vs 235-250, 152-170 vs 270-288): Extract repeated error message patterns to shared helper functions or split into sub-namespaces.
- **`dashboard/admin/view.ts` vs `dashboard/classes/details.ts`** (lines 20-57 vs 22-59, 67-87 vs 82-102): Extract shared dashboard view labels to a shared sub-namespace.
- **`dashboard/parents/onboarding.ts`** (lines 13-29 vs 34-50): Extract shared onboarding label block to a helper.
- **`locale/types/errors/index.ts`** (lines 149-157 vs 288-296, 185-195 vs 312-323): Extract shared error type patterns.
- **Verify**: `bun tsgo` passes (compile-time type safety catches missing keys). `bun run lint` passes. All locales (ar + en) updated symmetrically. Manual smoke test of affected pages.

---

### Phase 5: Mobile/Desktop/Common UI Triplication (High Effort, Dominant Pattern)

This is the largest phase (~600+ clones). Apply the established `*Shared.tsx` scaffold pattern systematically.

#### 5.1 Audit existing `*Shared.tsx` files and ensure tier variants consume them
Several `*Shared.tsx` scaffolds already exist but tier variants don't use them:
- **`baseDeleteDialogShared.tsx`**: `BaseDeleteDialog`, `DesktopBaseDeleteDialog`, `MobileBaseDeleteDialog` all duplicate full JSX. Refactor all 3 to call `BaseDeleteDialogScaffold` with slot props.
- **`appDataGridShared.tsx`**: `AppDataGrid`, `DesktopAppDataGrid` duplicate. Refactor to consume scaffold.
- **`avatarShared.tsx`**: `BaseAvatar`, `DesktopBaseAvatar`, `MobileBaseAvatar` duplicate. Refactor to consume scaffold.
- **`catalogImageUploadShared.tsx`**: `CatalogImageUpload`, desktop, mobile duplicate. Refactor to consume scaffold.

#### 5.2 Create `*Shared.tsx` scaffolds for components without them
For each component group with triplication, create a scaffold in `common/` and refactor tier variants to consume it:

**Avatar group:**
- `BaseAvatar` / `DesktopBaseAvatar` / `MobileBaseAvatar` — already has `avatarShared.tsx`, ensure all consume it.

**Badge group:**
- `StatusBadge` / `DesktopStatusBadge` / `MobileStatusBadge` — create `statusBadgeShared.tsx` with slot props for tier-specific styling.

**Card group:**
- `MetricCard` / `DesktopMetricCard` / `MobileMetricCard` — create `metricCardShared.tsx`.
- `MetricCard/styled.tsx` / desktop / mobile — create `metricCardStyledShared.tsx`.
- `MetricCard/utils.ts` / desktop / mobile — these are 100% identical. Delete desktop/mobile copies, import from common.
- `BaseCard` / mobile `BaseCard` — create `baseCardShared.tsx`.

**Container group:**
- `HorizontalScrollRow` / `DesktopHorizontalScrollRow` / `MobileHorizontalScrollRow` — create `horizontalScrollRowShared.tsx`.
- `SectionPanel` / `DesktopSectionPanel` — create `sectionPanelShared.tsx`.
- `AdminControlPanel` / `DesktopAdminControlPanel` / `MobileAdminControlPanel` — create `adminControlPanelShared.tsx`.
- `PageHeader` stories — consolidate story boilerplate.

**DataGrid group:**
- `AppDataGrid` / `DesktopAppDataGrid` / `MobileAppDataGrid` — already has `appDataGridShared.tsx`, ensure all consume it.
- `AppDataGridLoadingOverlay` / `DesktopAppDataGridLoadingOverlay` — create `appDataGridLoadingOverlayShared.tsx`.
- `AppDataGridNoRowsOverlay` / `DesktopAppDataGridNoRowsOverlay` — create `appDataGridNoRowsOverlayShared.tsx`.
- `appDataGridShared.types.ts` duplicated in two locations — delete one, import from canonical.

**Display group:**
- `CountryDisplay` / desktop / mobile — create `countryDisplayShared.tsx`.
- `CurrencyDisplay` / desktop / mobile — create `currencyDisplayShared.tsx`.
- `LanguageDisplay` / desktop / mobile — create `languageDisplayShared.tsx`.
- `LocalizedStringDisplay` / desktop / mobile — create `localizedStringDisplayShared.tsx`.
- `MeetingConfigDisplay` / desktop / mobile — create `meetingConfigDisplayShared.tsx`.
- `MeetingConfigList` / desktop / mobile — create `meetingConfigListShared.tsx`.
- `MeetingJoinAction` / desktop / mobile — create `meetingJoinActionShared.tsx`.
- `PaymentMethodDisplay` / desktop / mobile — create `paymentMethodDisplayShared.tsx`.
- `PaymentMethodList` / desktop / mobile — create `paymentMethodListShared.tsx`.
- `PhoneDisplay` / desktop / mobile — create `phoneDisplayShared.tsx`.
- `TimezoneDisplay` / desktop / mobile — create `timezoneDisplayShared.tsx`.
- `ClassProfileLink` / desktop / mobile — already has `ProfileLinkBase.tsx`, ensure all consume it.
- `PersonProfileLink` / desktop / mobile — create `personProfileLinkShared.tsx`.

**Filter group:**
- `PaginationControls` / desktop / mobile — create `paginationControlsShared.tsx`.

**Form group:**
- `AppDatePicker` / `DesktopAppDatePicker` — create `appDatePickerShared.tsx`.
- `AppDateRangePicker` / desktop / mobile — create `appDateRangePickerShared.tsx`.
- `AppTimePicker` / desktop / mobile — create `appTimePickerShared.tsx`.
- `AppTimeRangePicker` / desktop / mobile — already has `appTimeRangePickerShared.tsx`, ensure all consume it.
- `dateRangePickerShared.tsx` vs `appTimeRangePickerShared.tsx` — these duplicate each other. Extract common range-picker logic.
- `FormErrorSnackbar` / desktop — create `formErrorSnackbarShared.tsx`.
- `FormSuccessSnackbar` / desktop / mobile — create `formSuccessSnackbarShared.tsx`.

**Input group:**
- `CountryAutocomplete` / desktop / mobile — create `countryAutocompleteShared.tsx`.
- `countryAutocompletePopper.ts` / desktop / mobile — 100% identical. Delete desktop/mobile copies, import from common.
- `countryAutocompletePopper.ts` vs `currencyAutocompletePopper.ts` vs `paymentMethodAutocompletePopper.ts` — extract shared popper logic to `autocompletePopperShared.ts`.
- `CurrencyAutocomplete` / desktop / mobile — create `currencyAutocompleteShared.tsx`.
- `currencyAutocompletePopper.ts` / desktop / mobile — 100% identical. Delete copies, import from common.
- `PaymentMethodAutocomplete` / desktop / mobile — create `paymentMethodAutocompleteShared.tsx`.
- `paymentMethodAutocompletePopper.ts` — extract shared popper logic.
- `UserPaymentMethodAutocomplete` / desktop / mobile — create `userPaymentMethodAutocompleteShared.tsx`.
- `UserPaymentMethodSelect` / desktop / mobile — create `userPaymentMethodSelectShared.tsx`.
- `CatalogImageUpload` / desktop / mobile — already has `catalogImageUploadShared.tsx`, ensure all consume it.
- `EditableTypography` / desktop / mobile — create `editableTypographyShared.tsx`.
- `GenderSelector` / desktop / mobile — create `genderSelectorShared.tsx`.
- `LanguageSelector` / desktop / mobile — create `languageSelectorShared.tsx`.
- `LocalizedStringFormField` / desktop / mobile — create `localizedStringFormFieldShared.tsx`.
- `LocalizedStringInput` / desktop / mobile — create `localizedStringInputShared.tsx`.
- `MeetingConfigSelect` / desktop / mobile — create `meetingConfigSelectShared.tsx`.
- `MeetingConfigTypeFields` / desktop / mobile — create `meetingConfigTypeFieldsShared.tsx`.
- `PaymentMethodDefaultsEditor` / desktop / mobile — create `paymentMethodDefaultsEditorShared.tsx`.
- `PaymentMethodTypeFields` / desktop / mobile — create `paymentMethodTypeFieldsShared.tsx`.
- `PaymentMethodTypeSelector` / desktop / mobile — create `paymentMethodTypeSelectorShared.tsx`.
- `PhoneInput` / desktop / mobile — create `phoneInputShared.tsx`.
- `PhoneFormField` / desktop / mobile — create `phoneFormFieldShared.tsx`.
- `TagInput` / desktop / mobile — create `tagInputShared.tsx`.
- `TimezoneSelect` / desktop / mobile — create `timezoneSelectShared.tsx`.
- `usePhoneInput.ts` (common/components) vs `usePhoneInput.ts` (common/hooks) — **two divergent copies**. Consolidate into one canonical location. Determine which is the active version (likely `common/hooks/` based on "PLAN v5" comments). Delete the other, update imports.
- `useTagInputEditing.ts` (common/components) vs `useTagInputEditing.ts` (common/hooks) — **100% identical**. Delete one, import from the other.

**State group:**
- `ErrorState` / desktop / mobile — create `errorStateShared.tsx`.

**Button group:**
- `ActionButtons` / desktop — create `actionButtonsShared.tsx`.
- `ActionIconLink` / desktop — create `actionIconLinkShared.tsx`.

#### 5.3 Story file consolidation
Story files (`*.stories.tsx`) are duplicated across common/desktop/mobile with near-identical boilerplate. For each story group:
- Extract shared story configuration (args, decorators, play functions) to a `*.stories.shared.ts` file.
- Each tier story file imports the shared config and only overrides tier-specific rendering.
- **Verify**: Storybook builds. `bun run test:ui:components` passes.

#### 5.4 View-level duplication (frontend views)
- **`admin/billing/utils/billingMetrics.ts` vs `billing/utils/billingMetrics.ts`**: Consolidate into one. Admin version likely extends the base. Have admin import from base.
- **`admin/billing/utils/label-mappers.ts` vs `billing/utils/label-mappers.ts`**: Same pattern.
- **`admin/home/components/ScheduleInstanceStatusBadge.tsx` vs `dashboard/components/ScheduleInstanceStatusBadge.tsx`**: Consolidate into one.
- **`admin/home/utils/scheduleInstanceStatus.ts` vs `dashboard/utils/scheduleInstanceStatus.ts`**: Consolidate.
- **`admin/home/utils/scheduleCardHelpers.ts` vs `components/scheduleSessionCardLayout.utils.ts`**: Extract shared helper.
- **`admin/parents/home/ParentsViewTypes.ts` vs `directory.ts`**: Consolidate types.
- **`student/history/utils/studentHistoryMappers.ts` vs `students/history/utils/studentHistoryMappers.ts`**: Consolidate (singular vs plural directory duplication).
- **`student/profile/useStudentProfileViewModel.ts` vs `students/profile/useStudentManagerProfileTabViewModel.ts`**: Extract shared logic.
- **`students/history/types/studentHistoryViewProps.ts` vs `useStudentHistoryViewModel.ts`**: Consolidate.
- **`StaffProfileContainer.tsx` vs `StaffProfileView.tsx`**: Consolidate (100% identical).
- **`TeacherProfileContainer.tsx` vs `TeacherProfileView.tsx`**: Consolidate (100% identical).
- **`ReauthNeededBanner.tsx` vs `reauth-needed-banner.tsx`**: Consolidate (duplicate file with different casing).
- **`admin/__shared__/adminDashboardHooks.ts` vs `useAdminDashboard.ts`**: Consolidate (100% identical).
- **`dashboard/useDashboardContainerViewModel.ts` vs `useDashboardViewModel.ts`**: Extract shared logic.
- **`staff/home/useManagersContainerViewModel.ts` vs `useManagersViewModel.ts`**: Extract shared logic.
- **`searchScheduleStore.ts` vs `useSearchScheduleViewModel.ts`**: Consolidate store/viewModel overlap.
- **`dashboardStore.ts` vs `teacherDashboardStore.ts`**: Extract shared store slice.
- **`generalSettingsStore.ts` vs `sessionConfigSettingsStore.ts`**: Extract shared store slice.
- **`useCreateParentOnboarding.ts` vs `useCreateTeacherOnboarding.ts`**: Extract shared onboarding hook logic.
- **`notificationPreferenceTypes.ts` vs `notificationPreferenceUtils.ts`**: Consolidate overlapping type/utility definitions.
- **`notification-alerts.metadata.types.ts` vs `notificationDrawer.types.ts`**: Consolidate.
- **`GroupSimulationBanner.tsx` vs `ImpersonationBanner.tsx`**: Extract shared banner scaffold.
- **`UserEntityFieldsSection.tsx` vs `CompensationSectionBase.tsx` / `CurrencyControllerField.tsx`**: Extract shared currency field logic.
- **`UserEntityFieldsSection.tsx` vs `manualInvoiceFormFields.desktop.tsx`**: Extract shared form field logic.
- **`userPersonalFieldComponents.tsx` vs `ProfilePersonalSection.tsx`**: Extract shared personal field logic.
- **`DashboardLayoutLoading.tsx` vs `DashboardShellSkeleton.tsx`**: Consolidate.
- **`NotificationDrawerRow.stories.tsx` vs `NotificationRowBase.stories.tsx`**: Consolidate story boilerplate.
- **`navigationConfig.ts`** (lines 157-185 vs 578-606, 253-318 vs 727-792): Extract shared navigation config blocks.
- **`createTabbedPanePanels.tsx` vs various TabPanels**: Ensure all TabPanels consume the shared factory.
- **`usePaymentCatalogsTabsViewModel.ts` vs `useBillingTabsViewModel.ts` vs `useFeedbackManageTabsViewModel.ts` vs `useScheduleTrackingTabsViewModel.ts`**: Extract shared tabs viewmodel logic.
- **`InvoicePaymentDetailsDialog.tsx`** (lines 194-218 vs 345-369): Extract shared dialog section.
- **`useParentBillingViewModel.ts` vs `useUserBillingProfileViewModel.ts`**: Extract shared billing viewmodel logic.
- **`useClassDetailsViewModel.ts`** (lines 80-92 vs 216-228): Extract shared class details logic.
- **`ClassDetailsStudentView.tsx` vs `ClassDetailsTeacherView.tsx`**: Extract shared class details view logic.
- **`StudentProfileCard.tsx` vs `TeacherProfileCard.tsx`**: Extract shared profile card scaffold.
- **`useClassDetailsLabels.ts` vs locale types**: Consolidate label definitions.
- **`ParentComplaintsDesktopView.stories.tsx` vs `ParentSuggestionsDesktopView.stories.tsx`**: Consolidate story boilerplate.
- **`complaintsViewTypes.ts` vs `useParentComplaintsViewModel.ts`**: Consolidate.
- **`complaint.service.ts` vs `suggestion.service.ts`**: Extract shared communication service logic.
- **`GoogleMeetAdapter.ts` vs `MicrosoftTeamsAdapter.ts` vs `ZoomMeetingAdapter.ts`**: Extract shared meeting adapter logic to a base adapter class.
- **`meeting-config.service.ts`** (lines 296-318 vs 354-376): Extract shared meeting config service logic.
- **`parent-dashboard.service.ts`** (lines 20-33 vs 62-75): Extract shared parent dashboard service logic.
- **`parent-portal.service.ts` vs `parent-social.service.ts`**: Extract shared parent service logic.
- **`schedule.service.ts` vs `weekly-schedule.service.ts`**: Extract shared schedule service logic.
- **`staff-profile.service.ts`** (lines 93-106 vs 116-129): Extract shared staff profile service logic.
- **`credit.service.ts`** (lines 82-96 vs 148-163): Extract shared credit service logic.
- **`EntityCacheService.ts`** (lines 160-183 vs 216-239): Extract shared cache service logic.
- **`complaint.service.ts`** (lines 43-54 vs 63-74, 216-226 vs 263-273): Extract shared complaint service logic.
- **`studentHistoryMappers.ts`** (singular vs plural): Consolidate.
- **`ParentQuotaView.tsx` / `StudentQuotaView.tsx` / `TeacherQuotaView.tsx` / `SupervisorQuotaView.tsx`**: Extract shared quota view scaffold.
- **`StudentExtensionSection.tsx` vs `StudentPersonalFields.tsx`**: Consolidate (100% identical first 13 lines + large overlap).
- **`LabeledTextField.tsx` vs `editCategoryDialog.desktop.tsx`**: Extract shared labeled text field.
- **`SubjectsViewTypes.ts` vs `useSubjectsViewModel.ts`**: Consolidate.
- **`RecentApprovalCardList.tsx` vs `ScheduleOverviewCardList.tsx`**: Extract shared card list logic.
- **`ScheduleOverviewDataGrid.tsx` vs `useScheduleColumns.tsx`**: Extract shared column logic.
- **`PendingReviewsContainer.tsx` vs `TeacherDuesContainer.tsx`**: Extract shared container logic.
- **`duesSummaryCard.desktop.tsx` vs `pendingReviewsHeroCard.desktop.tsx`**: Extract shared summary card logic.
- **`lessonReportDetailPanel.desktop.tsx` vs `supervisorProfile.desktop.tsx`**: Extract shared panel logic.
- **`availabilityInsights.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`teacherClassListView.desktop.tsx` vs `teacherStudentsView.desktop.tsx`**: Extract shared teacher list view logic.
- **`missedClassAlertBanner.desktop.tsx` vs `missedClassAlertBannerContent.desktop.tsx`**: Consolidate.
- **`studentHistory.desktop.tsx` vs `studentSessions.desktop.tsx`**: Extract shared student history/sessions logic.
- **`studentStatus.desktop.tsx` vs `MobileAdminControlPanel.tsx`**: Extract shared admin control panel logic.
- **`studentDirectoryDataGrid.desktop.tsx` vs `parentsDataGrid.desktop.tsx`**: Extract shared directory data grid logic.
- **`parentOnboarding.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`mobileWalletCatalogGrid.desktop.tsx` vs `onlineAccountCatalogGrid.desktop.tsx` vs `paymentLinkCatalogGrid.desktop.tsx`**: Extract shared catalog grid logic.
- **`parentInvoiceRowActions.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`manualInvoiceDateField.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`manualInvoiceFormFields.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`manualInvoiceParentField.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`manualInvoiceSupportCards.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`parentBilling.desktop.tsx` vs `userBillingProfile.desktop.tsx`**: Extract shared billing profile logic.
- **`classAuditView.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`communicationLogCard.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`dayScheduleRow.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`daysScheduleSection.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`durationInput.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`recurringClassForm.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`recurringClassFormFields.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`timeInput.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`recurringScheduleDetailView.desktop.tsx` vs `recurringSchedulesListView.desktop.tsx`**: Extract shared recurring schedule view logic.
- **`suspensionAnalytics.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`statusTrackingDataGrid.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`adminComplaints.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`complaintFormFields.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`complaintPolicyPanel.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`complaintQueueCard.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`complaintQueueCardList.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`complaintRecordCard.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`complaintRecordCardList.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`complaintsSearchBar.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`dashboardMetricsSection.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`notificationDrawer.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`cronView.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`academicProgressSummary.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`parentClassStatusIndicator.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`parentScheduleCard.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`parentRules.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`parentSocial.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`parentStudentCard.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`addPermissionBulkBar.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`addPermissionFilterBar.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`addPermissionsTab.desktop.tsx` vs `currentPermissionsTab.desktop.tsx`**: Extract shared permissions tab logic.
- **`assignedUsersTab.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`currentPermissionsTab.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`deleteGroupDialog.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`manageOverridesDialog.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`overrideEditControls.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`overrideEffectiveDisplay.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`overridesDataGrid.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`overridesDialogFooter.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`overridesToolbar.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`overridesUserSidebar.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`permissionCategoryGroup.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`permissionCategoryList.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`permissionFilterBar.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`permissionGroupForm.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`permissionManagementDialogs.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`permissionRow.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`singleGroupHeader.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`singleGroupView.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`userOverridesDataGrid.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`permissionManagementView.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`notificationPreferencesTab.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`profileShell.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`profileSkeleton.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`parentProfile.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`staffProfile.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`teacherProfile.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`financialDistributionCard.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`performanceLedgerCard.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`reportFiltersForm.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`reportsTotalsSection.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`classParticipantsSection.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`notificationPolicyCard.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`quickAdjustSection.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`rescheduleDateTimeSection.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`timezoneWarningBanner.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`rescheduleView.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`rescheduleTrackingView.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`resourceFileTypeIcon.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`resourceGovernancePanel.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`resourceLibraryHeader.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`resourceUploadDropzone.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`resourceUploadForm.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`resourceUploadGuidelines.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`classSessionActionButton.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`scheduleAlertsView.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`searchScheduleForm.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`searchScheduleResultsSkeleton.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`searchScheduleSortMenu.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`teacherAvailabilityCalendarGrid.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`teacherAvailabilityDayPill.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`teacherAvailabilityGrid.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`teacherAvailabilityMonthDrawer.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`searchSchedule.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`searchScheduleFilterDrawer.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`settingsAuditTab.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`environmentConfigTab.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`meetingIntegrationsTab.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`sessionConfigTab.desktop.tsx` vs `siteContentSettingsTab.desktop.tsx`**: Extract shared settings tab logic.
- **`siteContentSettingsTab.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`settingsTimezonesTab.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`SettingsTimezonesSearchBar.tsx` vs `billingMobileSearchBar.mobile.tsx`**: Extract shared search bar logic.
- **`sessionConfigColumns.tsx` vs `siteContentColumns.tsx`**: Extract shared column logic.
- **`NumbersSnackbar.tsx` vs `exchangeRates.desktop.tsx`**: Extract shared snackbar logic.
- **`studentProfile.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`parentAssignmentSection.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`teacherAssignmentSection.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`studentOnboarding.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`contextualHelperCards.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`courseDetailsSection.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`studentInformationSection.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`studentQuota.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`policyOverviewCard.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`studentStatusHeader.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`upcomingClassesTable.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`studentStatus.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`categoriesSection.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`createCategoryDialog.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`createSubjectDialog.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`editCategoryDialog.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`editSubjectDialog.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`subjectsView.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`suggestionFormFields.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`suggestionSocialProof.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`suggestionsSearchBar.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`suggestionsTabBar.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`supervisorDashboard.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`lessonReportDetail.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`monthlyReports.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`supervisorProfile.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`availabilitySearchForm.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`weeklyAvailabilityGrid.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`teacherClassListView.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`sessionActivateButton.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`studentProgressFeed.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`teacherActiveSessionControls.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`futureClassCard.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`importantNotes.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`jumpToDateHeader.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`miniCalendar.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`supportContact.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`futureScheduleView.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`teacherLessonReportsView.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`teacherOnboardingView.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`teacherOwnProfileView.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`currentTeacherCard.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`managementControlsCard.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`reassignmentBentoGrid.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`studentContextCard.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`teacherReassignmentView.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`createRecurringClassDialog.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`teacherWeeklyScheduleView.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`teacherStudentsView.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`checkedEmptyPanel.desktop.tsx` vs `conflictErrorsPanel.desktop.tsx` vs `updatedSessionsSection.desktop.tsx` vs mobile**: Extract shared DST migration panel logic.
- **`updateSchedulesButton.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`MobileMetricCard.stories.tsx` duplicate**: Consolidate the two mobile metric card story files.
- **`studentDirectoryCard.mobile.tsx` vs `studentDirectoryCardBase.mobile.tsx`**: Consolidate.
- **`parentBilling.mobile.tsx` vs `userBillingProfile.mobile.tsx`**: Extract shared billing profile logic.
- **`recurringScheduleDetailView.mobile.tsx` vs `recurringSchedulesListView.mobile.tsx`**: Extract shared recurring schedule view logic.
- **`assignedUsersTab.mobile.tsx` vs `singleGroupHeader.mobile.tsx`**: Extract shared assigned users logic.
- **`studentHistory.mobile.tsx` vs `studentSessions.mobile.tsx`**: Extract shared student history/sessions logic.
- **`contextualHelperCards.mobile.tsx`** (lines 22-42 vs 63-83): Extract shared helper card logic.
- **`deleteCategoryDialog.mobile.tsx` vs `deleteSubjectDialog.mobile.tsx`**: Extract shared delete dialog logic.
- **`duesSummaryCard.mobile.tsx` vs `pendingReviewsHeroCard.mobile.tsx`**: Extract shared summary card logic.
- **`teacherClassListView.mobile.tsx` vs `teacherStudentsView.mobile.tsx`**: Extract shared teacher list view logic.
- **`paymentMethodTypeFields.mobile.tsx`** (lines 268-281 vs 285-298 vs 302-315): Extract shared payment method type fields logic.
- **`supportedCurrencies.mobile.tsx` vs `currencyHedges.mobile.tsx`**: Extract shared currency logic.
- **`adminDashboard.mobile.tsx` vs `scheduleOverview.mobile.tsx`**: Extract shared admin dashboard logic.
- **`MeetingJoinAction.mobile.stories.tsx` vs various**: Consolidate story boilerplate.
- **`paginationControls.mobile.stories.tsx` vs `MobileEmptyState.stories.tsx`**: Consolidate story boilerplate.
- **`paymentMethodAutocomplete.mobile.stories.tsx` vs `paymentMethodSelect.mobile.stories.tsx`**: Consolidate story boilerplate.
- **`useGroupPermissionFilters.ts` vs `usePermissionCatalogFilter.ts`**: Extract shared permission filter logic.
- **`assignGroupDialogShared.tsx` vs `editCategoryDialog.desktop.tsx` vs `deleteGroupDialog.desktop.tsx`**: Extract shared dialog logic.
- **`excel-export/parent-directory-export.ts` vs `report-export.ts` vs `tracking-export.ts`**: Extract shared excel export logic.
- **`storyPermissions.tsx` vs `SubjectDetailContainer.stories.tsx`**: Consolidate story boilerplate.
- **`activationPolicyPanelShared.tsx` vs desktop vs mobile**: Ensure all consume the shared scaffold.
- **`FeesContractSection.tsx` vs `SalaryDetailsSection.tsx`**: Extract shared salary/fees section logic.
- **`ParentMeetingConfigOnboardingSection.tsx` vs `MeetingConfigOnboardingSection.tsx`**: Extract shared meeting config onboarding logic.
- **`parentOnboardingSchema.ts` vs `teacherOnboardingSchema.ts`**: Extract shared onboarding schema logic.
- **`ParentsViewTypes.ts`** (lines 79-104 vs 107-127): Extract shared parent view types logic.
- **`resourcesTypes.ts`** (lines 75-87 vs 87-99): Extract shared resource types logic.
- **`availability/types.ts` vs locale types**: Consolidate.
- **`recurringSchedulesListViewModel.types.ts` vs locale types**: Consolidate.
- **`complaintsViewTypes.ts` vs `useParentComplaintsViewModel.ts`**: Consolidate.
- **`studentHistoryViewProps.ts` vs `useStudentHistoryViewModel.ts`**: Consolidate.
- **`useMeetingConfigsManagerViewModel.ts`** (lines 501-522 vs 540-561): Extract shared meeting configs manager logic.
- **`InfoField.tsx`** (parent vs teacher): Consolidate (100% identical).
- **`ParentProfileLoadingSkeleton.tsx` vs `StaffProfileLoadingSkeleton.tsx` vs `TeacherProfileLoadingSkeleton.tsx`**: Extract shared profile loading skeleton scaffold.
- **`adminBilling.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`adminInvoicesDataGrid.desktop.tsx`** (lines 173-186 vs 196-209): Extract shared invoice data grid logic.
- **`exchangeRates.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`meetingProviderForm.desktop.tsx` vs mobile**: Already handled in 5.2.
- **`parentsDataGrid.desktop.tsx` vs `studentDirectoryDataGrid.desktop.tsx`**: Extract shared directory data grid logic.
- **`mobileWalletCatalogGrid.desktop.tsx` vs `onlineAccountCatalogGrid.desktop.tsx` vs `paymentLinkCatalogGrid.desktop.tsx`**: Extract shared catalog grid logic.
- **Verify**: `bun tsgo`, `bun run lint`, `bun run test:ui:components`, `bun run test:ui:static` (mobile/desktop import isolation), Storybook builds.

---

### Phase 6: Script Duplication (Low Risk)

#### 6.1 Parallel test runner scripts
- **`run-db-tests-parallel.ts` vs `run-services-tests-parallel.ts` vs `run-integration-tests-parallel.ts`**: Extract shared parallel test runner logic to `scripts/run-test/run-parallel-shared.ts`. Each script imports the shared runner and passes its test-glob/config.
- **Verify**: `bun run test:db`, `bun run test:services`, `bun run test:integration` all pass.

#### 6.2 Health/config scripts
- **`health/codescene/config.ts` vs `health/sonar/ts/docker.ts`** (lines 57-68): Extract shared config logic.
- **`health/codescene/config.ts` vs `health/sonar/ts/config.ts`** (lines 85-109): Extract shared config logic.
- **Verify**: `bun quality-gate` passes.

---

## Execution Strategy

### Wave-based execution
Each phase should be executed as a wave of parallel subagents:
1. **Phase 1**: 1 subagent for config, 1 for enums, 2 for utilities, 1 for pages (4 parallel)
2. **Phase 2**: 1 subagent per repository file (~15 parallel), 1 per cross-file pair (~6 parallel)
3. **Phase 3**: 1 subagent per GraphQL file (~20 parallel)
4. **Phase 4**: 1 subagent per locale namespace split (~8 parallel, ar+en together)
5. **Phase 5**: 1 subagent per component group (~40 parallel), 1 per view-level consolidation (~30 parallel)
6. **Phase 6**: 1 subagent for test scripts, 1 for health scripts (2 parallel)

### Per-file verification
After each subagent completes its file(s):
```bash
bun run scripts/health/sub-loop.ts <file-path> --lifecycle lint
```

### Phase gate verification
After each phase:
```bash
bun tsgo                          # Type check
bun biome:check                   # Format + lint
bun run lint                      # ESLint
bun check:duplicates              # jscpd — confirm clone count dropped
bun run test                      # All tests
```

### Final verification
```bash
bun quality-gate                  # Full quality gate
bun check:duplicates              # Confirm 0 clones (or acceptable residual)
```

## Risks

1. **Tier isolation violations**: Extracting shared logic must not introduce `useMediaQuery` or `useViewport` imports in `.mobile.tsx` / `.desktop.tsx` files. ESLint enforces this, but verify after each change.
2. **Shared layer violations**: Moving backend/frontend utilities to `shared/` must not introduce `@/frontend/**` or `@/backend/**` imports in shared files.
3. **Locale migration**: Splitting locale namespaces requires updating `MessageSchema` type, namespace registration in `serverLegacy.ts`, and `LocaleProvider` translations. Missing a registration causes runtime errors.
4. **Repository refactoring**: Extracting helpers must preserve `tx` propagation. Mixing `tx` and `db` queries causes deadlocks.
5. **GraphQL schema changes**: Extracting Pothos field builders must not change the generated schema. Run `generate:gqlSchema` + `codegen` after changes.
6. **Story files**: Consolidating story boilerplate must preserve Storybook's ability to render each story independently.
7. **Scale**: 1021 clones is large. Phase 5 alone touches ~600+ clones across ~300+ files. Execute in waves with phase gates to catch regressions early.

## Resolved Questions

1. **`usePhoneInput.ts` consolidation**: `common/hooks/usePhoneInput.ts` is canonical — all tier variants (`PhoneInput.tsx`, `phoneInput.desktop.tsx`, `mobile/PhoneInput.tsx`) import from it. The `common/components/ui/input/phoneInput/usePhoneInput.ts` copy is stale. **Action**: Delete the stale copy, update any remaining imports.
2. **`StaffProfileContainer.tsx` vs `StaffProfileView.tsx`** (100% identical): `StaffProfileContainer` is imported by `ProfilePageClient.tsx` (production). `StaffProfileView` is imported by tests/stories. **Action**: Keep `StaffProfileView` as canonical (matches the `*View.tsx` switcher naming convention). Make `StaffProfileContainer.tsx` a re-export: `export { StaffProfileView as StaffProfileContainer } from "./StaffProfileView"`. Same pattern for `TeacherProfileContainer.tsx` vs `TeacherProfileView.tsx`.

## Open Questions

1. **Locale migration completion**: The `profile.ts` → `profile/{teacher,parent,staff,notifications}/` split is in progress. Confirm whether the old `profile.ts` should be fully deleted after the split, or kept as a re-export barrel for backward compatibility.
2. **`ReauthNeededBanner.tsx` vs `reauth-needed-banner.tsx`**: Two files with different casing conventions. Confirm which naming convention is canonical (PascalCase vs kebab-case) for this component.
3. **`adminDashboardHooks.ts` vs `useAdminDashboard.ts`** (100% identical): Confirm which is canonical.
4. **jscpd threshold**: After refactoring, some residual clones may remain (e.g., structural patterns that can't be deduplicated without over-abstraction). Decide whether to adjust `minTokens`/`minLines` thresholds or accept residual clones.
