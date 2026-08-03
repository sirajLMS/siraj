# 13 — Drizzle Enum Helper & `jsonb.$type<>()` Verification

**Plan reference:** `/home/ahmed/.cursor/plans/email_template_system_(react_email_+_editor)_08419060.plan.md` (lines 351, 357, 380)
**Date:** 2026-08-01

---

## 1. Verdict on `createPgEnumFromEnum` existence in `enums.ts`

**VERIFIED — the helper EXISTS and IS USED as the plan describes.**

- `backend/db/schema/enums.ts:40` — `import { createPgEnumFromEnum } from "@/backend/utils/db.utils";`
- `backend/db/schema/enums.ts:84` — `export const notificationChannelEnum = createPgEnumFromEnum("notification_channel", NotificationChannel);`

The plan's claim ("see how `notificationChannelEnum` is built from the `NotificationChannel` TS enum") is **accurate**.

## 2. The actual helper (verbatim)

File: `backend/utils/db.utils.ts` (lines 1–5)

```ts
import { pgEnum } from "drizzle-orm/pg-core";

export function createPgEnumFromEnum(enumName: string, enumObject: Record<string, string>) {
  return pgEnum(enumName, Object.values(enumObject) as [string, ...string[]]);
}
```

- **Import path to use (canonical barrel):** `@/backend/utils` (re-exports via `backend/utils/index.ts:2`)
  - `export { createPgEnumFromEnum, escapeLikeWildcards } from "@/backend/utils/db.utils";`
- **Deep import (also valid):** `@/backend/utils/db.utils`
- **Signature:** `createPgEnumFromEnum(enumName: string, enumObject: Record<string, string>): PgEnum<[string, ...string[]]>`

The earlier drizzle subagent's claim (research_node/08 doc lines 180, 185, 243) that `createPgEnumFromEnum` lives at `backend/utils/db.utils.ts:3–5` wrapping `pgEnum(enumName, Object.values(enumObject))` is **correct**.

## 3. ALL `pgEnum(...)` call sites in the repo (canonical pattern)

Two patterns observed. The repo-standard pattern is `createPgEnumFromEnum` (39 enums); two raw `pgEnum(...)` outliers exist.

| File:line | Pattern | Code (verbatim) |
|---|---|---|
| `backend/utils/db.utils.ts:4` | helper definition | `return pgEnum(enumName, Object.values(enumObject) as [string, ...string[]]);` |
| `backend/db/schema/enums.ts:100-103` | raw `pgEnum` with `Object.values` cast (outlier) | `export const appPermissionEnum = pgEnum("app_permission", Object.values(AppPermission) as [AppPermission, ...AppPermission[]]);` |
| `backend/db/schema/billing/invoice-payment-submissions.ts:6-10` | raw `pgEnum` with manually listed string tuples (outlier — no backing TS enum) | `export const invoicePaymentSubmissionStatusEnum = pgEnum("invoice_payment_submission_status", ["pending", "approved", "rejected"]);` |

All other enums in `backend/db/schema/enums.ts` (lines 42–121) use `createPgEnumFromEnum`.

### Enum declarations in `enums.ts` (full list, verbatim activation)

Each follows: `export const <name>Enum = createPgEnumFromEnum("<pg_name>", <TsEnum>);`

```startLine:42:backend/db/schema/enums.ts
export const appLanguageEnum = createPgEnumFromEnum("app_language", AppLanguage);
```
```startLine:44:backend/db/schema/enums.ts
export const genderEnum = createPgEnumFromEnum("gender", Gender);
```
```startLine:46:backend/db/schema/enums.ts
export const countryCodeEnum = createPgEnumFromEnum("country_code", CountryCode);
```
```startLine:48:backend/db/schema/enums.ts
export const currencyCodeEnum = createPgEnumFromEnum("currency_code", CurrencyCode);
```
```startLine:50:backend/db/schema/enums.ts
export const accountStatusEnum = createPgEnumFromEnum("account_status", AccountStatus);
```
```startLine:52:backend/db/schema/enums.ts
export const parentStatusEnum = createPgEnumFromEnum("parent_status", ParentStatus);
```
```startLine:54:backend/db/schema/enums.ts
export const studentStatusEnum = createPgEnumFromEnum("student_status", StudentStatus);
```
```startLine:56:backend/db/schema/enums.ts
export const classTypeEnum = createPgEnumFromEnum("class_type", ClassType);
```
```startLine:58:backend/db/schema/enums.ts
export const classOutcomeEnum = createPgEnumFromEnum("class_outcome", ClassOutcome);
```
```startLine:60:backend/db/schema/enums.ts
export const classExecutionStateEnum = createPgEnumFromEnum("class_execution_state", ClassExecutionState);
```
```startLine:62:backend/db/schema/enums.ts
export const invoiceStatusEnum = createPgEnumFromEnum("invoice_status", InvoiceStatus);
```
```startLine:64:backend/db/schema/enums.ts
export const invoiceTypeEnum = createPgEnumFromEnum("invoice_type", InvoiceType);
```
```startLine:66:backend/db/schema/enums.ts
export const paymentMethodTypeEnum = createPgEnumFromEnum("payment_method_type", PaymentMethodType);
```
```startLine:68:backend/db/schema/enums.ts
export const paymentDirectionEnum = createPgEnumFromEnum("payment_direction", PaymentDirection);
```
```startLine:70:backend/db/schema/enums.ts
export const identifierKindEnum = createPgEnumFromEnum("identifier_kind", IdentifierKind);
```
```startLine:72:backend/db/schema/enums.ts
export const complaintCategoryEnum = createPgEnumFromEnum("complaint_category", ComplaintCategory);
```
```startLine:74:backend/db/schema/enums.ts
export const complaintStatusEnum = createPgEnumFromEnum("complaint_status", ComplaintStatus);
```
```startLine:76:backend/db/schema/enums.ts
export const suggestionStatusEnum = createPgEnumFromEnum("suggestion_status", SuggestionStatus);
```
```startLine:78:backend/db/schema/enums.ts
export const leaveRequestStatusEnum = createPgEnumFromEnum("leave_request_status", LeaveRequestStatus);
```
```startLine:80:backend/db/schema/enums.ts
export const leaveRequesterTypeEnum = createPgEnumFromEnum("leave_requester_type", LeaveRequesterType);
```
```startLine:82:backend/db/schema/enums.ts
export const vacationRequestStatusEnum = createPgEnumFromEnum("vacation_request_status", VacationRequestStatus);
```
```startLine:84:backend/db/schema/enums.ts
export const notificationChannelEnum = createPgEnumFromEnum("notification_channel", NotificationChannel);
```
```startLine:86:backend/db/schema/enums.ts
export const notificationEventTypeEnum = createPgEnumFromEnum("notification_event_type", NotificationEventType);
```
```startLine:88:backend/db/schema/enums.ts
export const notificationDeliveryStatusEnum = createPgEnumFromEnum(
  "notification_delivery_status",
  NotificationDeliveryStatus
);
```
```startLine:93:backend/db/schema/enums.ts
export const devicePlatformEnum = createPgEnumFromEnum("device_platform", DevicePlatform);
```
```startLine:95:backend/db/schema/enums.ts
export const dayOfWeekEnum = createPgEnumFromEnum("day_of_week", DayOfWeek);
```
```startLine:97:backend/db/schema/enums.ts
export const dstMigrationResultEnum = createPgEnumFromEnum("dst_migration_result", DstMigrationResult);
```
```startLine:99:backend/db/schema/enums.ts
export const availabilityStatusEnum = createPgEnumFromEnum("availability_status", AvailabilityStatus);
export const appPermissionEnum = pgEnum(
  "app_permission",
  Object.values(AppPermission) as [AppPermission, ...AppPermission[]]
);
```
```startLine:105:backend/db/schema/enums.ts
export const fxProviderEnum = createPgEnumFromEnum("fx_provider", FxProvider);
```
```startLine:107:backend/db/schema/enums.ts
export const fxSyncStatusEnum = createPgEnumFromEnum("fx_sync_status", FxSyncStatus);
```
```startLine:109:backend/db/schema/enums.ts
export const systemSettingDataTypeEnum = createPgEnumFromEnum("system_setting_data_type", SystemSettingDataType);
```
```startLine:111:backend/db/schema/enums.ts
export const systemSettingCategoryEnum = createPgEnumFromEnum("system_setting_category", SystemSettingCategory);
```
```startLine:113:backend/db/schema/enums.ts
export const teacherDueStatusEnum = createPgEnumFromEnum("teacher_due_status", TeacherDueStatus);
```
```startLine:115:backend/db/schema/enums.ts
export const lessonReportStatusEnum = createPgEnumFromEnum("lesson_report_status", LessonReportStatus);
```
```startLine:117:backend/db/schema/enums.ts
export const attendanceEvaluationEnum = createPgEnumFromEnum("attendance_evaluation", AttendanceEvaluation);
```
```startLine:119:backend/db/schema/enums.ts
export const creditReasonEnum = createPgEnumFromEnum("credit_reason", CreditReason);
```
```startLine:121:backend/db/schema/enums.ts
export const rateSourceEnum = createPgEnumFromEnum("rate_source", RateSource);
```

## 4. Exact `notificationChannelEnum` declaration (verbatim)

```startLine:84:backend/db/schema/enums.ts
export const notificationChannelEnum = createPgEnumFromEnum("notification_channel", NotificationChannel);
```

Backing TS enum imported at `enums.ts:27` per the import block (lines 2–38):

```startLine:27:backend/db/schema/enums.ts
  NotificationChannel,
```

## 5. `.array()` usage today

**NO.** Grep for `.array()` across `backend/db/schema/**/*.ts` returned **zero matches**. There are no array-of-enum (or any-array) columns in the schema today. The plan's proposal to use `pgEnum(...).array()` (claim 8 / lines 248–296) would be a **first-time-use case** in this repo. The earlier FINAL-VERIFICATION-SUMMARY already flagged this and recommended the safer `jsonb.$type<readonly EmailEditorPermission[]>()` fallback — that recommendation stands.

## 6. `jsonb.$type<>()` canonical pattern in repo

The pattern `jsonb("<field>").$type<T>()` is used pervasively. Representative call sites:

| File:line | Code (verbatim) |
|---|---|
| `backend/db/schema/billing/supported-mobile-wallets.ts:10` | `name: jsonb("name").$type<LocalizedString>().notNull(),` |
| `backend/db/schema/billing/user-payment-methods.ts:26` | `details: jsonb("details").$type<PaymentMethodDetails>().notNull(),` |
| `backend/db/schema/communications/communications.ts:117` | `metadata: jsonb("metadata").$type<NotificationMetadata | null>(),` |
| `backend/db/schema/permissions/permissions.ts:20` | `description: jsonb("description").$type<LocalizedString>().notNull(),` |
| `backend/db/schema/meeting/meeting-providers.ts:17` | `fieldSchema: jsonb("field_schema").$type<MeetingProviderFieldSchema>().notNull(),` |
| `backend/db/schema/meeting/__shared__/meeting-config-columns.ts:17` | `details: jsonb("details").$type<MeetingConfigDetails>().notNull(),` |
| `backend/db/schema/classes/scheduling.ts:173` | `meetingConfigSnapshot: jsonb("meeting_config_snapshot").$type<MeetingConfigSnapshot>(),` |
| `backend/db/schema/billing/billing.ts:93` | `$type<PaymentMethodTransactionSnapshot | PaymentProofTransactionSnapshot>()` |

### `readonly T[]` as `$type<>` argument (plan line 380)

**YES — the repo already uses `readonly T[]` inside `$type<>`.** Two exact precedents:

```13:backend/db/schema/meeting/meeting-providers.ts
    urlAllowlist: jsonb("url_allowlist").$type<readonly string[]>().notNull(),
```

```13:backend/db/schema/billing/supported-payment-links.ts
    urlAllowlist: jsonb("url_allowlist").$type<readonly string[]>().notNull(),
```

This is a direct precedent for the plan's proposed `attachmentRules: jsonb("attachment_rules").$type<readonly EmailEditorPermission[]>().notNull()` (plan line 380). The `readonly` modifier is repo-idiomatic for `jsonb` array payloads.

### Enum columns can also carry `$type<T>()` — repo precedent

The repo also applies `$type<T>()` after enum-column calls, not just `jsonb`. Examples:

```8:backend/db/schema/billing/currencies.ts
    code: currencyCodeEnum("code").$type<CurrencyCode>().primaryKey(),
```

```16:backend/db/schema/shared/settings.ts
    category: systemSettingCategoryEnum("category").$type<SystemSettingCategory>().notNull(),
```

## 7. One-line verdict

**VERIFIED.** The helper `createPgEnumFromEnum` DOES exist at `backend/utils/db.utils.ts:3` (imported at `enums.ts:40`) and is the canonical pattern — `notificationChannelEnum` at `enums.ts:84` is built exactly as the plan claims. The plan (lines 351, 357) is **accurate as written**; no correction to the helper name or import path is needed. Plan line 380's proposed `jsonb.$type<readonly EmailEditorPermission[]>()` is also repo-idiomatic — direct precedent at `backend/db/schema/meeting/meeting-providers.ts:13` and `backend/db/schema/billing/supported-payment-links.ts:13`. The only adjacent caveat (already captured in FINAL-VERIFICATION-SUMMARY claim 8) is that `.array()` on pgEnums is a first-time use case in this repo (zero matches), so `jsonb.$type<readonly T[]>()` remains the safer fallback per existing convention.
