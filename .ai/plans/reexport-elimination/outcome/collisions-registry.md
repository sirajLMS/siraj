# Collisions Registry — Cases Where `export { }` Must Be Used Instead of `export *`

This file tracks ALL cases where `export *` cannot be used in `index.ts` because it would cause a naming collision. In these cases, named re-exports (`export { A, B } from "./file"`) are the ONLY allowed exception to the `export *` rule.

**Rule:** If `export *` causes a collision (two source files exporting the same symbol name), use named re-exports to disambiguate. Otherwise, ALWAYS use `export *`.

---

## Entry 1: `backend/services/communication/channels/whatsapp/cloud-api/requests/index.ts`

**Date:** 2026-08-12
**Reason:** All 4 `*.request.ts` files exported functions named `buildRequest` and `parseResponse` — `export *` causes `TS2308: Module has already exported a member named 'buildRequest'/'parseResponse'`.
**Resolution (2026-08-12):** RESOLVED by renaming functions in source files to unique descriptive names:
- `get-phone-number.request.ts`: `buildRequest` → `buildGetPhoneNumberRequest`, `parseResponse` → `parseGetPhoneNumberResponse`
- `list-message-templates.request.ts`: `buildRequest` → `buildListMessageTemplatesRequest`, `parseResponse` → `parseListMessageTemplatesResponse`
- `list-phone-numbers.request.ts`: `buildRequest` → `buildListPhoneNumbersRequest`, `parseResponse` → `parseListPhoneNumbersResponse`
- `send-template-message.request.ts`: `buildRequest` → `buildSendTemplateMessageRequest`, `parseResponse` → `parseSendTemplateResponse`

The `requests/index.ts` barrel now uses `export *` exclusively — no named re-exports or aliasing needed.

---

## Entry 2: `backend/db/seeds/billing/index.ts`

**Date:** 2026-08-12
**Reason:** All 14 `seed-*.ts` files export `seedOrGet` — `export *` causes `TS2308: Module has already exported a member named 'seedOrGet'`.
**Fix:** Use named re-exports with aliases to disambiguate:
```ts
export { seedOrGet as seedOrGetSupportedCurrencies } from "./seed-currencies";
export { seedOrGet as seedOrGetCurrencyExchangeAuditLogs } from "./seed-currency-exchange-audit-logs";
// ... (12 more)
```

---

## Entry 3: `backend/db/seeds/books/index.ts`

**Date:** 2026-08-12
**Reason:** `seed-books.ts` exports `seedOrGet`. While only one file, converting to `export *` would export as `seedOrGet` (not the aliased `seedOrGetBooks`). If more seeder files are added to this directory, collision would occur.
**Fix:** Use named re-export with alias:
```ts
export { seedOrGet as seedOrGetBooks } from "./seed-books";
```

---

## Entry 4: `backend/db/seeds/classes/index.ts`

**Date:** 2026-08-12
**Reason:** All 13 `seed-*.ts` files export `seedOrGet` — `export *` causes `TS2308: Module has already exported a member named 'seedOrGet'`.
**Fix:** Use named re-exports with aliases to disambiguate:
```ts
export { seedOrGet as seedOrGetClassCategories } from "./seed-class-categories";
export { seedOrGet as seedOrGetClassCommunications } from "./seed-class-communications";
// ... (11 more)
```

---

## Entry 5: `backend/db/seeds/complaints/index.ts`

**Date:** 2026-08-12
**Reason:** Both `seed-*.ts` files export `seedOrGet` — `export *` causes `TS2308: Module has already exported a member named 'seedOrGet'`.
**Fix:** Use named re-exports with aliases to disambiguate:
```ts
export { seedOrGet as seedOrGetComplaintResponses } from "./seed-complaint-responses";
export { seedOrGet as seedOrGetComplaints } from "./seed-complaints";
```

---

---

## Entry 7: `backend/db/seeds/students/index.ts`

**Date:** 2026-08-12
**Reason:** All 3 `seed-*.ts` files export `seedOrGet` — `export *` causes `TS2308: Module has already exported a member named 'seedOrGet'`.
**Fix:** Keep named re-exports with aliases:
```ts
export { seedOrGet as seedOrGetStudentProgress } from "./seed-student-progress";
export { seedOrGet as seedOrGetStudentStatusHistory } from "./seed-student-status-history";
export { seedOrGet as seedOrGetStudents } from "./seed-students";
```

---

## Entry 8: `backend/db/seeds/teachers/index.ts`

**Date:** 2026-08-12
**Reason:** All 8 `seed-*.ts` files export `seedOrGet` — `export *` causes `TS2308: Module has already exported a member named 'seedOrGet'`.
**Fix:** Keep named re-exports with aliases:
```ts
export { seedOrGet as seedOrGetLeaveQuotaUsage } from "./seed-leave-quota-usage";
export { seedOrGet as seedOrGetLeaveRequests } from "./seed-leave-requests";
export { seedOrGet as seedOrGetTeacherAvailabilityWindows } from "./seed-teacher-availability-windows";
export { seedOrGet as seedOrGetTeacherImportantNotes } from "./seed-teacher-important-notes";
export { seedOrGet as seedOrGetTeacherPayments } from "./seed-teacher-payments";
export { seedOrGet as seedOrGetTeacherRecurringUnavailability } from "./seed-teacher-recurring-unavailability";
export { seedOrGet as seedOrGetTeacherVacationRequests } from "./seed-teacher-vacation-requests";
export { seedOrGet as seedOrGetTeachers } from "./seed-teachers";
```

---

## Entry 9: `backend/db/seeds/users/index.ts`

**Date:** 2026-08-12
**Reason:** Both `seed-*.ts` files export `seedOrGet` — `export *` causes `TS2308: Module has already exported a member named 'seedOrGet'`.
**Fix:** Keep named re-exports with aliases:
```ts
export { seedOrGet as seedOrGetUserDeviceTokens } from "./seed-user-device-tokens";
export { seedOrGet as seedOrGetUsers } from "./seed-users";
```

---

## Entry 10: `backend/db/repo/classes/index.ts`

**Date:** 2026-08-12
**Reason:** `lesson-report.repository.ts` exports both `PendingReviewFilters` (interface) and `LessonReportRepository` (class). The file has `export type { PendingReviewFilters } from "./lesson-report.repository"` to preserve the type-only export. Using `export * from "./lesson-report.repository"` alongside `export type { PendingReviewFilters }` causes a collision because `export *` also picks up `PendingReviewFilters` from the same module, resulting in `TS2308: Module has already exported a member named 'PendingReviewFilters'`.
**Fix:** Keep `export type { PendingReviewFilters } from "./lesson-report.repository"` as-is, and use `export { LessonReportRepository } from "./lesson-report.repository"` (named export) instead of `export *` for the same file. All other files in the directory use `export *`.

---

## Entry 6: `frontend/common/components/ui/badge/index.ts`

**Date:** 2026-08-12
**Reason:** `StatusBadge.tsx` re-exports `StatusBadgeCategory` via `export type { }`, and `StatusBadgeShared.tsx` re-exports `StatusBadgeCategory`, `StatusBadgeSharedProps`, `StatusBadgeSlotProps`, `StatusPaletteKey` via `export type { }`. These collide with the explicit `export type { } from "./types/statusBadgeShared.types"` line. Using `export *` for `StatusBadge.tsx` or `StatusBadgeShared.tsx` would cause `TS2308` type-only re-export collisions.
**Fix:** Keep named re-exports for `StatusBadge` and `StatusBadgeShared` (the function/class exports only). Converted `statusBadgeShared.utils.ts` to `export *` (no collision — only exports `getStatusColors` and `resolveStatusPaletteKey` consts). Kept `export type { } from "./types/statusBadgeShared.types"` as-is.

---

## Entry 11: `frontend/common/components/ui/display/meetingConfig/index.ts`

**Date:** 2026-08-12
**Reason:** `MeetingConfigList.tsx` re-exports `MeetingConfigListItem` and `MeetingConfigListProps` (types) and `MeetingJoinAction.tsx` re-exports `MeetingJoinActionProps` and `MeetingJoinEmptyRole` (types). These type symbols also appear in `./types` barrel via `export type { } from "./types"`. Using `export *` for these two files alongside `export type { } from "./types"` causes `TS2308` type-only re-export collisions.
**Fix:** Keep named re-exports for `MeetingConfigList` and `MeetingJoinAction` (only the value exports, not the type re-exports). Converted `AutoGeneratedBadge.tsx` and `MeetingConfigDisplay.tsx` to `export *` (no collisions — only export distinct value/type symbols). Kept `export type { } from "./types"` as-is.

---

## Entry 12: `frontend/common/components/ui/display/paymentMethod/index.ts`

**Date:** 2026-08-12
**Reason:** `PaymentMethodList.tsx` exports `PaymentMethodListProps` (type) which also appears in `./types` barrel via `export type { } from "./types"`. Using `export * from "./PaymentMethodList"` alongside `export type { } from "./types"` causes `TS2308` type-only re-export collision.
**Fix:** Keep named re-exports for `PaymentMethodList` (value + type exports). Converted `PaymentMethodDisplay.tsx` to `export *` (no collision — only exports the function). Kept `export type { } from "./types"` as-is.



---

## Entry 29: `frontend/common/components/ui/input/paymentMethodSelect/index.ts`

**Date:** 2026-08-12
**Reason:** `PaymentMethodAutocomplete.tsx` re-exports `PaymentMethodAutocompleteProps` (type) and `PaymentMethodSelect.tsx` re-exports `PaymentMethodSelectProps` (type). Both are also exported by `./types/index.ts`. Using `export *` from both the component files and `./types` causes `TS2308` collision on `PaymentMethodAutocompleteProps` and `PaymentMethodSelectProps`.
**Resolution:** Used named `export { PaymentMethodSelect } from "./PaymentMethodSelect"` and `export { PaymentMethodAutocomplete } from "./PaymentMethodAutocomplete"` (value-only named exports to avoid pulling the colliding type re-exports). Used `export type { PaymentMethodAutocompleteProps, PaymentMethodSelectProps } from "./types"` to export the canonical types from `./types` only. Used `export *` for `./PaymentMethodOptionRow`, `./paymentMethodOptionRow.utils`, and `./utils` (no collisions).

---

## Entry 30: `frontend/common/views/dashboard/teachers/classes/index.ts`

**Date:** 2026-08-12
**Reason:** `useTeacherClassListViewModel.ts` exports both types (`TeacherClassListLabels`, `TeacherClassListViewModel`, `UseTeacherClassListViewModelProps`) and functions (`formatClassSchedule`, `isRowJoinable`, `useTeacherClassListViewModel`). `TeacherClassListContainer.tsx` re-exports `TeacherClassListViewModel` and `UseTeacherClassListViewModelProps` via `export type { }`. Using `export * from "./useTeacherClassListViewModel"` would collide with the explicit `export type { }` block (which exports the same types from the same file). Using `export * from "./TeacherClassListContainer"` would also collide since the container re-exports the same types. `export *` causes `TS2308: Module has already exported a member named 'TeacherClassListViewModel'/'UseTeacherClassListViewModelProps'`.
**Fix:** Keep named re-exports as-is:
```ts
export { TeacherClassListContainer } from "./TeacherClassListContainer";
export type { TeacherClassListLabels, TeacherClassListViewModel, UseTeacherClassListViewModelProps } from "./useTeacherClassListViewModel";
export { useTeacherClassListViewModel } from "./useTeacherClassListViewModel";
```

---

## Entry 31: `frontend/desktop/components/ui/badge/index.ts`

**Date:** 2026-08-12
**Reason:** `DesktopStatusBadge.tsx` exports both `DesktopStatusBadgeProps` (interface) and `DesktopStatusBadge` (function), and re-exports `StatusBadgeCategory` via `export type { }`. The index uses `export type { DesktopStatusBadgeProps, StatusBadgeCategory as DesktopStatusBadgeCategory } from "./DesktopStatusBadge"` alongside `export { DesktopStatusBadge } from "./DesktopStatusBadge"`. Using `export * from "./DesktopStatusBadge"` would cause `TS2308` collision because `export *` also picks up `DesktopStatusBadgeProps` and `StatusBadgeCategory` from the same module, duplicating the explicit `export type { }` block.
**Fix:** Keep named re-exports as-is (with `./` path instead of `@/` path):
```ts
export type { DesktopStatusBadgeProps, StatusBadgeCategory as DesktopStatusBadgeCategory } from "./DesktopStatusBadge";
export { DesktopStatusBadge } from "./DesktopStatusBadge";
```

---

## Entry 32: `frontend/desktop/components/ui/card/MetricCard/index.ts`

**Date:** 2026-08-12
**Reason:** `DesktopMetricCard.tsx` exports both `DesktopMetricCardProps` (interface) and `DesktopMetricCard` (function). The index uses `export type { DesktopMetricCardProps } from "./DesktopMetricCard"` alongside `export { DesktopMetricCard } from "./DesktopMetricCard"`. Using `export * from "./DesktopMetricCard"` would cause `TS2308` collision because `export *` also picks up `DesktopMetricCardProps` from the same module, duplicating the explicit `export type { }` block.
**Fix:** Keep named re-exports as-is (with `./` path instead of `@/` path):
```ts
export type { DesktopMetricCardProps } from "./DesktopMetricCard";
export { DesktopMetricCard } from "./DesktopMetricCard";
```

---

## Entry 32: `frontend/desktop/components/ui/form/time/index.ts`

**Date:** 2026-08-12
**Reason:** `DesktopAppTimePicker.tsx` exports both `DesktopAppTimePickerProps` (type) and `DesktopAppTimePicker` (function). The index uses `export type { DesktopAppTimePickerProps } from "./DesktopAppTimePicker"` alongside `export { DesktopAppTimePicker } from "./DesktopAppTimePicker"`. Using `export * from "./DesktopAppTimePicker"` would cause `import-x/export` collision (Multiple exports of name 'DesktopAppTimePickerProps') because `export *` also picks up the type, duplicating the explicit `export type { }` block. Same situation with `DesktopAppTimeRangePicker.tsx` which exports both `DesktopAppTimeRangePickerProps` (type) and `DesktopAppTimeRangePicker` (function).
**Fix:** Keep named re-exports as-is:
```ts
export type { DesktopAppTimePickerProps } from "./DesktopAppTimePicker";
export { DesktopAppTimePicker } from "./DesktopAppTimePicker";
export type { DesktopAppTimeRangePickerProps } from "./DesktopAppTimeRangePicker";
export { DesktopAppTimeRangePicker } from "./DesktopAppTimeRangePicker";
```

---

## Entry 33: `frontend/desktop/components/ui/input/catalogImageUpload/index.ts`

**Date:** 2026-08-12
**Reason:** `catalogImageUpload.desktop.tsx` exports both `CatalogImageUploadProps` (type) and `CatalogImageUploadDesktop` (const). The index uses `export type { CatalogImageUploadProps } from "./catalogImageUpload.desktop"` alongside `export { CatalogImageUploadDesktop } from "./catalogImageUpload.desktop"`. Using `export * from "./catalogImageUpload.desktop"` would cause `import-x/export` collision (Multiple exports of name 'CatalogImageUploadProps') because `export *` also picks up the type, duplicating the explicit `export type { }` block.
**Fix:** Keep named re-exports as-is:
```ts
export type { CatalogImageUploadProps } from "./catalogImageUpload.desktop";
export { CatalogImageUploadDesktop } from "./catalogImageUpload.desktop";
```

---

## Entry 34: `frontend/mobile/components/ui/avatar/index.ts`

**Date:** 2026-08-12
**Reason:** Multiple source files in this directory export both types and values. `MobileBaseAvatar.tsx` exports `BaseAvatarProps` and `BaseAvatarVariant` (via `export type`) alongside `MobileBaseAvatar` (function). `MobileClassAvatar.tsx` exports `ClassAvatarProps` (via `export type`) alongside `MobileClassAvatar` (function). Using `export *` for any of these would also re-export the types, duplicating the explicit `export type { }` blocks and causing `import-x/export` collision.
**Fix:** Keep named re-exports as-is:
```ts
export type { BaseAvatarProps, BaseAvatarVariant } from "./MobileBaseAvatar";
export { MobileBaseAvatar } from "./MobileBaseAvatar";
export type { ClassAvatarProps } from "./MobileClassAvatar";
export { MobileClassAvatar } from "./MobileClassAvatar";
export { MobileUserAvatar } from "./MobileUserAvatar";
```

---

## Entry 35: `frontend/mobile/components/ui/badge/index.ts`

**Date:** 2026-08-12
**Reason:** `MobileStatusBadge.tsx` exports both `MobileStatusBadgeCategory` (type alias) and `MobileStatusBadgeProps` (interface) alongside `MobileStatusBadge` (function). Using `export *` would also re-export the types, duplicating the explicit `export type { }` block and causing `import-x/export` collision.
**Fix:** Keep named re-exports as-is:
```ts
export type {
  MobileStatusBadgeCategory,
  MobileStatusBadgeProps,
} from "./MobileStatusBadge";
export { MobileStatusBadge } from "./MobileStatusBadge";
```

---

## Entry 36: `frontend/mobile/components/ui/button/index.ts`

**Date:** 2026-08-12
**Reason:** `MobileFab.tsx` exports both `MobileFabProps` (interface) and `MobileFab` (function). Using `export *` would also re-export the type, duplicating the explicit `export type { }` block and causing `import-x/export` collision. Additionally, `MobileActionButtons.tsx` re-exports `ButtonProps` from `@mui/material` — `export *` from that file would bring in `ButtonProps` as well, but the barrel intentionally did not re-export it (dead `MobileActionButtonsButtonProps` alias was removed).
**Fix:** Keep named re-exports as-is:
```ts
export {
  MobileExportButton,
  MobileFilterButton,
  MobilePrimaryPageAction,
} from "./MobileActionButtons";
export { MobileActionIconLink } from "./MobileActionIconLink";
export type { MobileFabProps } from "./MobileFab";
export { MobileFab } from "./MobileFab";
```

---

## Entry 37: `frontend/desktop/components/ui/input/userPaymentMethodSelect/index.ts`

**Date:** 2026-08-12
**Reason:** Both `userPaymentMethodAutocomplete.desktop.tsx` and `userPaymentMethodSelect.desktop.tsx` re-export `UserPaymentMethodAutocompleteProps` type (from different source paths). `export *` causes duplicate type export.
**Fix:** Keep named re-exports with `./` paths (already converted from `@/` to `./`):
```ts
export { UserPaymentMethodAutocompleteDesktop } from "./userPaymentMethodAutocomplete.desktop";
export { UserPaymentMethodSelectDesktop } from "./userPaymentMethodSelect.desktop";
```

---

## Entry 34: `frontend/mobile/components/ui/display/index.ts`

**Date:** 2026-08-12
**Reason:** `paymentMethodList.mobile.tsx` re-exports `MobilePaymentMethodDisplay` (line 162), and `paymentMethodDisplay.mobile.tsx` also exports `MobilePaymentMethodDisplay`. Using `export *` for both files would cause `TS2308: Module has already exported a member named 'MobilePaymentMethodDisplay'`.
**Fix:** Keep named exports for `paymentMethodList.mobile` (the re-exporting file) and use `export *` for `paymentMethodDisplay.mobile` (the original source):
```ts
export * from "./paymentMethod/paymentMethodDisplay.mobile";
export {
  MobilePaymentMethodList,
  type PaymentMethodRow,
} from "./paymentMethod/paymentMethodList.mobile";
```

---

## Entry 35: `frontend/mobile/components/ui/container/page/index.ts`

**Date:** 2026-08-12
**Reason:** `MobilePageContainer.tsx` exports both `MobilePageContainerProps` (interface) and `MobilePageContainer` (function). The index uses `export type { MobilePageContainerProps } from "./MobilePageContainer"` alongside a value export. Using `export * from "./MobilePageContainer"` alongside the explicit `export type { }` block would cause `TS2308` collision because `export *` also picks up `MobilePageContainerProps`. Same situation with `MobilePageHeader.tsx` which exports both `MobilePageHeaderProps` (interface) and `MobilePageHeader` (function).
**Fix:** Keep named re-exports as-is (with `./` paths instead of `@/` paths):
```ts
export type { MobilePageContainerProps } from "./MobilePageContainer";
export { MobilePageContainer } from "./MobilePageContainer";
export type { MobilePageHeaderProps } from "./MobilePageHeader";
export { MobilePageHeader } from "./MobilePageHeader";
```

---

## Entry 38: `frontend/mobile/components/ui/input/userPaymentMethodSelect/index.ts`

**Date:** 2026-08-12
**Reason:** Both `userPaymentMethodAutocomplete.mobile.tsx` and `userPaymentMethodSelect.mobile.tsx` re-export `UserPaymentMethodAutocompleteProps` type (from different source paths). `export *` causes duplicate type export.
**Fix:** Keep named re-exports with `./` paths (converted from `@/` to `./`):
```ts
export { UserPaymentMethodAutocompleteMobile } from "./userPaymentMethodAutocomplete.mobile";
export { UserPaymentMethodSelectMobile } from "./userPaymentMethodSelect.mobile";
```

---

## Entry 39: `shared/locale/en/dashboard/lms/index.ts`

**Date:** 2026-08-12
**Reason:** Each source file exports with unique original names (`dashboardLmsCreditEn`, `dashboardLmsLessonReportsEn`, etc.), but the barrel restructures them via `as` aliases (`credit`, `lessonReports`, `monthlyReports`, `teacherDues`). `export *` cannot apply `as` renaming — it would export the original verbose names, not the short aliased names that consumers depend on. This is a semantic aliasing requirement, not a collision.
**Fix:** Keep named re-exports with `as` aliases as-is:
```ts
export { dashboardLmsCreditEn as credit } from "./credit";
export { dashboardLmsLessonReportsEn as lessonReports } from "./lessonReports";
export { dashboardLmsMonthlyReportsEn as monthlyReports } from "./monthlyReports";
export { dashboardLmsTeacherDuesEn as teacherDues } from "./teacherDues";
```

---

## Entry 40: `frontend/common/lib/index.ts`

**Date:** 2026-08-12
**Reason:** Both `./currency` and `./enum` export `parseCurrencyCode`. Converting `./currency` to `export *` would cause a TS2308 collision with `./enum` (which was successfully converted to `export *`). The original named export for `./currency` deliberately excluded `parseCurrencyCode` to avoid the collision.
**Exports kept as named:** `./currency` — `type CurrencyOption`, `currencies`, `formatLockedAmount`, `getCurrencyByCode`, `getCurrencyDecimals`, `getCurrencyDisplayName`, `getCurrencyFlag`, `getCurrencyOptionLabel`, `getCurrencyOptions`, `getCurrencySymbol`
**Successfully converted to `export *`:** `./enum`, `./localized-string`

---

## Entry 41: `frontend/common/components/ui/badge/index.ts`

**Date:** 2026-08-12
**Reason:** `StatusBadge.tsx` re-exports `type StatusBadgeCategory` from `./types/statusBadgeShared.types`, and `StatusBadgeShared.tsx` re-exports `StatusBadgeCategory`, `StatusBadgeSharedProps`, `StatusBadgeSlotProps`, `StatusPaletteKey` from the same types file. Converting either to `export *` causes `import-x/export` "Multiple exports of name" errors because the barrel also has an explicit `export type { } from "./types/statusBadgeShared.types"` for those same types.
**Exports kept as named:** `./StatusBadge` — `StatusBadge`; `./StatusBadgeShared` — `type StatusBadgeScaffoldProps`, `StatusBadgeShared`

---

## Entry 42: `frontend/common/components/ui/display/meetingConfig/index.ts`

**Date:** 2026-08-12
**Reason:** `MeetingConfigList.tsx` re-exports `type MeetingConfigListItem` and `type MeetingConfigListProps` from `./types`, and `MeetingJoinAction.tsx` re-exports `type MeetingJoinActionProps` and `type MeetingJoinEmptyRole` from `./types`. Converting either to `export *` causes `import-x/export` "Multiple exports of name" errors because the barrel also has an explicit `export type { } from "./types"` for those same types.
**Exports kept as named:** `./MeetingConfigList` — `MeetingConfigList`; `./MeetingJoinAction` — `MeetingJoinAction`, `type MeetingJoinActionProps`


---

## Entry 40: `backend/db/repo/classes/index.ts`

**Date:** 2026-08-12
**Reason:** The file has both `export type { PendingReviewFilters } from "./lesson-report.repository"` (line 6) and `export { LessonReportRepository } from "./lesson-report.repository"` (line 7). Converting line 7 to `export *` causes `export *` to also re-export `PendingReviewFilters` (an interface in the source file), creating a duplicate export of `PendingReviewFilters` alongside the existing `export type` statement. ESLint `import-x/export` rule flags this as "Multiple exports of name 'PendingReviewFilters'".
**Exports kept as named:** `LessonReportRepository`

---

## Entry 41: `backend/db/repo/scheduling/index.ts`

**Date:** 2026-08-12
**Reason:** The file has `export type { ClassInstanceAffectedUsers, ClassInstanceWithAffectedUsers } from "./scheduling-queries.repository.helpers"` (lines 15-18) and `export { classLifecycleAffectedUserIds, getClassInstanceAffectedUsers, getClassInstanceAffectedUsersForTeacher } from "./scheduling-queries.repository.helpers"` (lines 19-23). Converting lines 19-23 to `export *` causes `export *` to also re-export `ClassInstanceAffectedUsers` and `ClassInstanceWithAffectedUsers` (interfaces in the source file), creating duplicate exports alongside the existing `export type` statement. ESLint `import-x/export` flags "Multiple exports of name 'ClassInstanceAffectedUsers'" and "Multiple exports of name 'ClassInstanceWithAffectedUsers'".
**Exports kept as named:** `classLifecycleAffectedUserIds`, `getClassInstanceAffectedUsers`, `getClassInstanceAffectedUsersForTeacher`
