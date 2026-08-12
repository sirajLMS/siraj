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
