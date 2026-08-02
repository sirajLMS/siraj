# Siraj Backend — Types & Enums Layer Analysis

> Analysis artifact for the certificate feature integration. Documents the canonical type-system patterns, enum definitions, permission model, and end-to-end type flow used across the backend.
>
> Working directory: `/home/ahmed/Projects/siraj-cert`

---

## 1. Type Definitions Pattern (`backend/types/`)

### 1.1 Canonical guidance
`backend/types/AGENTS.md` defines a **"Single Canonical Object Type Pattern"**. For each database table/entity there must be a single foundational type, derived from the Drizzle table via `$inferSelect` / `$inferInsert`, plus canonical return and input types.

Required naming convention (from `backend/types/AGENTS.md`):

| Suffix | Purpose |
|---|---|
| `{Entity}SelectType` | Raw DB row shape inferred via `typeof {entityTable}.$inferSelect` |
| `{Entity}InsertType` | Raw insert shape inferred via `typeof {entityTable}.$inferInsert` |
| `{Entity}ReturnType` | Canonical return type: `Omit<{Entity}SelectType, forbiddenFields...> & { reapply enums; resolved props... }` |
| `{Entity}SubmitInput` | Input type: `Omit<{Entity}InsertType, "id" | "createdAt" | "updatedAt" | ...>` |

The AGENTS.md example template:

```typescript
// backend/types/<domain>/<entity>.types.ts (e.g. backend/types/users/user.types.ts)
import type { {entityTable} } from "@/backend/db/schema";

export type {Entity}SelectType = typeof {entityTable}.$inferSelect;
export type {Entity}InsertType = typeof {entityTable}.$inferInsert;

export type {Entity}ReturnType = Omit<{Entity}SelectType,
  // Remove forbidden fields like deletedAt, internal fields
  | "deletedAt"
  | "internalNotes"
> & {
  // Reapply enums with proper typing
  status: StatusEnum;
  role: RoleEnum;
  // Add resolved properties
  resolvedProperty?: string;
};
```

### 1.2 Layer rules
- Types are `export type` aliases built on Drizzle `$inferSelect` / `$inferInsert`.
- Use `Omit` to drop forbidden fields (e.g. `deletedAt`, `idempotencyKey`, `version`, `createdByUserId`).
- Enums are **re-applied** on the `ReturnType` so the GraphQL-facing shape uses the proper TS enum types rather than the raw `string` inferred from the DB.
- "Resolved properties" (data coming from joins) are added as optional fields on the return type.
- GraphQL Pothos implementations must reuse these centralized types — defining ad-hoc `{Entity}Definition` types inside Pothos files is prohibited.

### 1.3 Concrete entity examples

#### a) Students — `backend/types/students/student.types.ts`
Students use a slightly different `Entity`/`EntityInput` naming (an older variant coexisting with the AGENTS.md convention); the structure is the same:

```typescript
import type { students } from "@/backend/db/schema";
import type { AppLanguage, Gender, OrderSortDirection, StudentStatus } from "@/backend/enum";
import type { PageInfo } from "@/backend/types/shared/pagination.types";

export type StudentEntity      = typeof students.$inferSelect;   // raw DB row
export type StudentEntityInput = typeof students.$inferInsert;    // raw insert

// Canonical return type: drop enum column names, re-typing them with enums + add resolved props
export type Student = Omit<
  StudentEntity,
  "status" | "gender" | "language" | "hoursPerWeek"
> & {
  gender: Gender | null;
  language: AppLanguage | null;
  status: StudentStatus;
  // resolved (from joins)
  email?: string | null;
  parentName?: string | null;
  teacherName?: string | null;
  avatarUrl?: string | null;
  hoursPerWeek?: number | null;
};

// Input type: drop forbidden/system fields, re-typing enums
export type StudentCreateInput = Omit<
  StudentEntityInput,
  "status" | "gender" | "language" | "id" | "createdAt" | "updatedAt"
> & {
  gender?: Gender | null;
  language?: AppLanguage | null;
  status: StudentStatus;
};

export type PartialStudentUpdateInput = Partial<Omit<StudentCreateInput, "idempotencyKey">> & { id: string };
```

Other student types in the same file: `StudentDirectory`, `StudentDirectoryResult`, `StudentOnboardingInput`, `StudentOnboardingResult`, `StudentFilterArgs` (rich filter grid), `StudentsOrderByClause`, `StudentsOrderByColumn` (a TS enum also defined here), `StudentHistoryMetricsType`, `StudentClassHistory`, `StudentSessionDetail`, `StudentsWithFiltersResponse`.

#### b) Parents — `backend/types/parents/parent.types.ts`
```typescript
export type ParentEntity       = typeof import("@/backend/db/schema").parents.$inferSelect;
export type ParentEntityInput  = typeof import("@/backend/db/schema").parents.$inferInsert;

export type ParentCreateResult = Pick<ParentEntity, "id" | "userId" | "status" | ...> & { readonly timezone: IanaTimezone; };
```
File defines: `ParentDirectoryRawRow`/`ParentDirectoryRawMetrics` (repo layer raw rows), `ParentDirectoryRow` (service-enriched, with `lifecycleStatus: ParentStatus` and `accountStatus: AccountStatus`), `ParentDirectoryResult`, `ParentDashboardScheduleRow`, `ParentDashboardMetricsType`, `ParentProfileResult`, `ParentProfileUpdateInput`, `AssociatedStudentResult`, `DeactivateParentResult`, `ReactivateParentResult`, `ChangeParentLifecycleResult`, `ParentDocument`, etc.

#### c) Teachers — `backend/types/teachers/teacher.types.ts`
```typescript
export type TeacherEntity      = typeof teachers.$inferSelect;
export type TeacherEntityInput = typeof teachers.$inferInsert;

export type TeacherPaymentSelectType  = typeof teacherPayments.$inferSelect;
export type TeacherPaymentInsertInput = typeof teacherPayments.$inferInsert;
export type TeacherPaymentReturnType  = TeacherPaymentSelectType & { readonly displayAmount?: DisplayAmountReturnType | null; };

export type TeacherCreateResult = Pick<TeacherEntity, "id" | "userId" | "createdAt"> & { readonly status: AccountStatus; readonly timezone: IanaTimezone; };

// Profile return: Omit sensitive/system columns from entity, re-typing enums + adding computed props
export type TeacherProfileReturnType = Omit<TeacherEntity, "userId" | "status" | "gender" | "nationality" | "countryCode" | "paymentMethod" | "timezone" | "timezoneId" | "createdAt" | "dateOfBirth" | "updatedAt"> & {
  userId: string; name: string; email: string;
  status: AccountStatus; gender: Gender | null; nationality: string | null;
  countryCode: string | null; dateOfBirth: string | null; updatedAt: string;
  timezone: IanaTimezone; totalClasses: number; avgEngagementScore: number;
};
```
File also defines `TeacherProfileUpdateInputType`, `TeacherDirectoryReturnType`, `TeacherAssignedStudentReturnType`, `TeacherOwnProfileReturnType`, `TeacherOwnProfileUpdateInput`, `TeacherAssignedClassesResult`, `CreateManualClassEntryInput`, `TeacherSimple`, etc.

#### d) Billing — `backend/types/billing/billing.types.ts`
This file is the most faithful implementer of the AGENTS.md naming convention:

```typescript
export type InvoiceSelectType = typeof invoices.$inferSelect;
export type InvoiceInsertType = typeof invoices.$inferInsert;

export type InvoiceReturnType = Omit<InvoiceSelectType, "deletedAt" | "idempotencyKey" | "version" | "createdByUserId"> & {
  status: InvoiceStatus;
  invoiceType: InvoiceType;
};

export type InvoiceSubmitInput = Omit<InvoiceInsertType,
  | "id" | "createdAt" | "updatedAt" | "deletedAt" | "idempotencyKey" | "version" | "createdByUserId" | "status" | "paidDate"
>;

export type PaymentSelectType = typeof payments.$inferSelect;
export type PaymentInsertType = typeof payments.$inferInsert;
export type PaymentReturnType  = PaymentSelectType & { readonly displayAmount?: DisplayAmountReturnType | null; ... };
export type PaymentSubmitInput = Omit<PaymentInsertType, "id" | "createdAt" | "updatedAt" | ...>;
```
The same file adds many sibling result types: `CurrencyExchangeRateSelectType/InsertType/SubmitInput/ReturnType`, `FxSyncRunSelectType/InsertType/ReturnType`, `CurrencyHedgeSelectType/InsertType/SubmitInput/UpdateInput`, `InvoicePaymentSubmissionSelectType/InsertType/ReturnType`, `InvoiceCoverageMonthSelectType/Input`, `CurrencyExchangeAuditLogInsertType`, plus aggregate/dto types (`BillingCurrencyTotal`, `UnpaidInvoiceSummaryResult`, `ParentBillingSummaryResult`, `AdminBillingSummaryResult`, `ManualInvoiceResult`, `MarkInvoicePaidResult/ReturnType`, `DeleteInvoiceResult/ReturnType`, `DisplayAmountReturnType`, …).

#### e) Storage — `backend/types/storage/storage.types.ts`
```typescript
// Type aliases to match Kotlin entities
export type FileEntity       = typeof storageFiles.$inferSelect;
export type FileEntityInput  = typeof storageFiles.$inferInsert;
export type DirectoryEntity      = typeof storageDirectories.$inferSelect;
export type DirectoryEntityInput = typeof storageDirectories.$inferInsert;
```
Storage also defines local TypeScript enums inside the types file (not `backend/enum`): `FileTypes`, `FileSortField`, `UploadType`; plus a rich set of input/result interfaces (`FolderCreateInput`, `StorageItemProtectionUpdateInput`, `FileUsageRegisterInput`, `BulkOperationResult`, `UploadPreparationResult`, …) and DB-column alias types `InvoiceFileSelectType`/`ParentFileSelectType`/`LinkedFileReturnType`.

#### f) Permissions — `backend/types/permissions/permission-group.types.ts`
```typescript
export type PermissionGroupSelectType = typeof permissionGroups.$inferSelect;
export type PermissionGroupInsertType = typeof permissionGroups.$inferInsert;

export type PermissionGroupReturnType = Omit<PermissionGroupSelectType, "deletedAt" | "internalNotes"> & {
  name: LocalizedString;
  description: LocalizedString | null;
};

export type PermissionGroupSubmitInput = Omit<PermissionGroupInsertType, "id" | "createdAt" | "updatedAt" | "deletedAt">;
export type PermissionGroupFilterInput = { name?: string; isActive?: boolean };
```

### 1.4 Naming variance observed
Two naming dialects coexist (both valid):
- AGENTS.md canonical: `{Entity}SelectType` / `{Entity}InsertType` / `{Entity}ReturnType` / `{Entity}SubmitInput` (used by billing, permissions).
- Older alias: `{Entity}Entity` (=$inferSelect) / `{Entity}EntityInput` (=$inferInsert) with the canonical return type named simply `{Entity}` (e.g., `Student`, `Parent`) (used by students, teachers, storage).
Both styles honor the same Omit-and-extend contract.

---

## 2. Type Index Pattern (`backend/types/index.ts`)

Top-level barrel `backend/types/index.ts` re-exports every sub-directory barrel:

```typescript
export * from "./audit";
export * from "./auth";
export * from "./billing";
export * from "./books";
export * from "./classes";
export * from "./complaints";
export * from "./meeting";
export * from "./notifications";
export * from "./parents";
export * from "./permissions";
export * from "./profile";
export * from "./report";
export * from "./scheduling";
export * from "./shared";
export * from "./staff";
export * from "./storage";
export * from "./students";
export * from "./supervisor";
export * from "./teachers";
export * from "./users";
```

Each sub-directory ships its own `index.ts` (e.g. `backend/types/students/index.ts`):
```typescript
export * from "./student.types";
export * from "./student-field-manifest";
export * from "./student-lifecycle.types";
export * from "./student-profile.types";
export * from "./student-status.types";
export * from "./studentProgress.types";
export * from "./studentStatusHistory.types";
```

Consumption pattern is illustrated in `backend/graphql/pothos/students/student.pothos.ts`:
```typescript
import type { PartialStudentUpdateInput, Student, StudentCreateInput, StudentFilterArgs, StudentsOrderByClause, StudentsWithFiltersResponse } from "@/backend/types";
import { StudentsOrderByColumn } from "@/backend/types";
```
And in the repository: `import * as Types from "@/backend/types";` then `Types.StudentEntity`, `Types.StudentsOrderByColumn`, etc.

---

## 3. Enum Definitions (`backend/enum/`)

### 3.1 Layer rules (from `backend/enum/AGENTS.md`)
- Backend-only. Frontend must use GraphQL codegen enums (`@/frontend/common/graphql/generated/gql/graphql-types`) or cross-layer enums duplicated into `shared/constants/`. Shared code must NOT import `@/backend/enum`.
- **Prefer deep imports** over the barrel:
  `import { StudentStatus } from "@/backend/enum/students/student-lifecycle.enum"`.
- One enum file per logical domain, grouped under a matching sub-dir; related enums live in the same file (e.g. `InvoiceStatus`, `InvoiceType`, `InvoicePaymentSubmissionStatus` in `billing/billing.enum.ts`).
- Const payloads that go with an enum live alongside it in the same file (e.g. `ALLOWED_STATUS_TRANSITIONS` next to `StudentStatus`).
- File name convention: `backend/enum/<subdir>/<entity>.enum.ts`.

### 3.2 Definition style — TypeScript `enum` (not const objects)
All enums are real TypeScript `enum`s mapping keys → string values. Examples:

```typescript
// backend/enum/students/student-lifecycle.enum.ts
export enum StudentStatus {
  REGULAR = "REGULAR",
  ON_LEAVE = "ON_LEAVE",
  SUSPENDED = "SUSPENDED",
  ON_TRIAL = "ON_TRIAL",
  DEACTIVATED = "DEACTIVATED",
}
export const ALLOWED_STATUS_TRANSITIONS: Record<StudentStatus, readonly StudentStatus[]> = {
  [StudentStatus.ON_TRIAL]:   [StudentStatus.REGULAR, StudentStatus.DEACTIVATED],
  [StudentStatus.REGULAR]:    [StudentStatus.SUSPENDED, StudentStatus.ON_LEAVE, StudentStatus.DEACTIVATED],
  [StudentStatus.SUSPENDED]:  [StudentStatus.REGULAR, StudentStatus.DEACTIVATED],
  [StudentStatus.ON_LEAVE]:   [StudentStatus.REGULAR, StudentStatus.DEACTIVATED],
  [StudentStatus.DEACTIVATED]:[StudentStatus.REGULAR],
};
```

```typescript
// backend/enum/billing/billing.enum.ts
export enum InvoiceStatus { UNPAID="UNPAID"; PAYMENT_PENDING="PAYMENT_PENDING"; PAID="PAID"; CANCELLED="CANCELLED" }
export enum InvoiceType { PER_CLASSES="PER_CLASSES"; MONTHLY="MONTHLY"; MANUAL="MANUAL" }
export enum InvoicePaymentSubmissionStatus { PENDING="pending"; APPROVED="approved"; REJECTED="rejected" }
```

```typescript
// backend/enum/parents/parent.enum.ts
export enum ParentStatus { REGULAR; ON_LEAVE; SUSPENDED; ON_TRIAL }
export enum BookingStatus { CONFIRMED="confirmed"; RESCHEDULED="rescheduled" }
```

```typescript
// backend/enum/users/user.enum.ts
export enum Gender { MALE="MALE"; FEMALE="FEMALE" }
```

```typescript
// backend/enum/shared/pagination.enum.ts
export enum OrderSortDirection { ASC="ASC"; DESC="DESC" }
```

### 3.3 Enum → PostgreSQL enum mapping
Two-step pattern:

1. TS enums live in `backend/enum/**`. PG enums are created in `backend/db/schema/enums.ts`, importing the TS enum and passing it through a helper.
2. The helper `createPgEnumFromEnum` (`backend/utils/db.utils.ts`) wraps Drizzle's `pgEnum` using `Object.values(enumObject)`:
```typescript
// backend/utils/db.utils.ts
import { pgEnum } from "drizzle-orm/pg-core";
export function createPgEnumFromEnum(enumName: string, enumObject: Record<string, string>) {
  return pgEnum(enumName, Object.values(enumObject) as [string, ...string[]]);
}
```

Example mappings (`backend/db/schema/enums.ts`):
```typescript
export const genderEnum       = createPgEnumFromEnum("gender", Gender);
export const studentStatusEnum = createPgEnumFromEnum("student_status", StudentStatus);
export const parentStatusEnum  = createPgEnumFromEnum("parent_status", ParentStatus);
export const accountStatusEnum = createPgEnumFromEnum("account_status", AccountStatus);
export const invoiceStatusEnum = createPgEnumFromEnum("invoice_status", InvoiceStatus);
export const invoiceTypeEnum    = createPgEnumFromEnum("invoice_type", InvoiceType);
export const currencyCodeEnum  = createPgEnumFromEnum("currency_code", CurrencyCode);
export const countryCodeEnum   = createPgEnumFromEnum("country_code", CountryCode);
// ...and many more (notification_channel, fx_provider, day_of_week, ...)
```

**Special case — `AppPermission`** is registered directly with `pgEnum` (not via the helper) because it is huge and the values are already the canonical strings:
```typescript
export const appPermissionEnum = pgEnum(
  "app_permission",
  Object.values(AppPermission) as [AppPermission, ...AppPermission[]]
);
```

### 3.4 Full enum file inventory (`backend/enum/`)

| Sub-dir | File | Enums / constants |
|---|---|---|
| `permissions/` | `permission.enum.ts` | `AppPermission` (+ `filterKnownAppPermissions` helper) |
| `permissions/` | `permission-group.enum.ts` | `SystemPermissionGroupSlug` |
| `permissions/` | `permission-management.enum.ts` | `OverrideState` |
| `users/` | `account-type.enum.ts` | `ManagerAccountType`, `MANAGER_ACCOUNT_TYPES` |
| `users/` | `user.enum.ts` | `Gender` |
| `users/` | `userDeviceTokens.enum.ts` | device token enums |
| `auth/` | `auth.enum.ts` | `AppLanguage`, `AccountStatus`, `UserRole` |
| `billing/` | `billing.enum.ts` | `InvoiceStatus`, `InvoiceType`, `InvoicePaymentSubmissionStatus` |
| `billing/` | `credit.enum.ts` | `CreditReason` (and related) |
| `billing/` | `payment-method.enum.ts` | `PaymentMethodType`, `PaymentDirection`, `IdentifierKind` |
| `books/` | `book.enum.ts` | book enums |
| `classes/` | `lesson-report.enum.ts`, `group-class.enum.ts`, `class-instance-detail.enum.ts`, `dst-migration.enum.ts` | class enums |
| `complaints/` | `complaint.enum.ts` | `ComplaintStatus`, `ComplaintCategory` |
| `fx/` | `fx-provider.enum.ts` | `FxProvider`, `FxProviderConfigSource`, `FxSyncStatus`, `FxSyncTrigger` |
| `notifications/` | `notificationDeliveries.enum.ts` | delivery enums |
| `parents/` | `parent.enum.ts` | `ParentStatus`, `BookingStatus` |
| `parents/` | `suggestions.enum.ts` | `SuggestionStatus` |
| `pricing/` | `rate-source.enum.ts` | `RateSource` |
| `profiles/` | `profile.enum.ts` | `ProfileAudience`, `ProfileScope`, `ProfileMode` |
| `scheduling/` | `scheduling.enum.ts`, `schedule.enum.ts` | scheduling enums (`ClassType`, `ClassExecutionState`, `ClassOutcome`, `AvailabilityStatus`, `DayOfWeek`, `LeaveRequestStatus`, `RescheduleDateLabel`, …) |
| `shared/` | `country.enum.ts` | `CountryCode` (full ISO-3166 ~250 entries) |
| `shared/` | `currency.enum.ts` | `CurrencyCode` (ISO-4217, ~31 entries) |
| `shared/` | `timezone.enum.ts` | `IanaTimezone` |
| `shared/` | `pagination.enum.ts` | `OrderSortDirection` |
| `shared/` | `system-setting.enum.ts` | `SystemSettingCategory`, `SystemSettingDataType` |
| `students/` | `student-lifecycle.enum.ts` | `StudentStatus`, `ALLOWED_STATUS_TRANSITIONS` |
| `teachers/` | `teacher-availability.enum.ts` | `DayOfWeek`, `AvailabilitySearchSortBy` |
| `teachers/` | `teacher-due.enum.ts`, `teacher-progress-feed.enum.ts` | `TeacherDueStatus`, `TeacherProgressFeedEventKind` |

The top-level barrel `backend/enum/index.ts` re-exports all sub-directories:
```typescript
// ⚠️ Backend-only enum barrel file.
export * from "./auth/auth.enum";
export * from "./billing";
export * from "./books/book.enum";
export * from "./classes";
export * from "./complaints";
export * from "./fx";
export * from "./notifications";
export * from "./parents";
export * from "./permissions";
export * from "./pricing";
export * from "./profiles";
export * from "./scheduling";
export * from "./shared";
export * from "./students";
export * from "./teachers";
export * from "./users";
```

### 3.5 GraphQL enum registration
Enums are surfaced to the GraphQL schema in `backend/graphql/pothos/shared/enum.pothos.ts` via Pothos `gqlSchemaBuilder.enumType(Enum, { name })`. Example excerpt:
```typescript
export const AppPermissionPothosEnum      = gqlSchemaBuilder.enumType(AppPermission, { name: "AppPermission" });
export const ManagerAccountTypePothosEnum = gqlSchemaBuilder.enumType(ManagerAccountType, { name: "ManagerAccountType" });
export const OrderSortDirectionPothosObject = gqlSchemaBuilder.enumType(OrderSortDirection, { name: "OrderSortDirection" });
export const GenderPothosObject    = gqlSchemaBuilder.enumType(Gender, { name: "Gender" });
export const AccountStatusPothosObject = gqlSchemaBuilder.enumType(AccountStatus, { name: "AccountStatus" });
export const StudentStatusPothosObject = gqlSchemaBuilder.enumType(StudentStatus, { name: "StudentStatus" });
export const ParentStatusPothosEnum     = gqlSchemaBuilder.enumType(ParentStatus, { name: "ParentStatus" });
export const InvoiceStatusPothosObject  = gqlSchemaBuilder.enumType(InvoiceStatus, { name: "InvoiceStatus" });
export const CurrencyCodePothosObject    = gqlSchemaBuilder.enumType(CurrencyCode, { name: "CurrencyCode" });
export const UserRolePothosEnum          = gqlSchemaBuilder.enumType(UserRole, { name: "UserRole" });
// ...many more (ClassType, ClassOutcome, ClassExecutionState, DayOfWeek, FxProvider, ProfileAudience, IanaTimezone, etc.)
```
Some enums (e.g., `SystemSettingCategory`) are registered with explicit value-name maps because their TS keys are lowercase but the GraphQL surface needs the original casing.

The AGENTS.md says: "*If the enum should be exposed via GraphQL, register it in `backend/graphql/pothos/shared/enum.pothos.ts` and run codegen.*"

---

## 4. Permissions Enum

File: `backend/enum/permissions/permission.enum.ts`

### 4.1 Definition & naming
- TypeScript `enum AppPermission` (`export enum AppPermission { ... }`).
- Every value is a **dot-separated string** following `entity.action` (or `entity.subentity.action`) convention. The enum keys are SCREAMING_SNAKE_CASE; the values are the dot-paths.

### 4.2 Values by group (representative, ~190 total entries)

**Auth / system**
- `auth.login`
- `system.dispatch_email`, `system.sync_notifications`, `system.bulk_update_dst`, `system.enforce_time_window`, `system.enforce_leave_limit`, `system.enforce_suspended_lock`, `system.process_student_leave`, `system.restrict_resource_access`

**Dashboard**
- `dashboard.view`, `dashboard.view_metrics`, `dashboard.filter_metrics`, `dashboard.metrics.view_all`, `dashboard.search`

**Schedule / session / history**
- `schedule.view_list`, `schedule.filter_advanced`, `schedule.view_all`, `schedule.view_assigned`, `schedule.view_family`, `schedule.search_availability`, `schedule.manage_recurring`, `schedule.dst_migrate`, `schedule.view_timezones`, `schedule.view_weekly`, `schedule.view_workload`, `schedule.create_class`, `schedule.delete_class`, `schedule.clear_weekly`
- `session.view_details`, `session.activate_class`, `session.activate_override`, `session.update_status.start`, `session.update_status.absent`, `session.update_status.leave`, `session.reschedule`, `session.reset`, `session.override_actions`
- `history.view_calendar`, `history.view_details`

**Teachers**
- `teacher.view_dashboard`, `teacher.view_students`, `teachers.list`, `teachers.create`, `teachers.edit`, `teachers.manage_schedule`

**Parents**
- `parents.list`, `parents.create`, `parents.edit`, `parent.view_directory`, `parent.view_students`, `parent.manage_status`

**Students**
- `students.list`, `students.create`, `students.edit`, `students.change_teacher`, `students.change_status`, `students.override_quota`
- `student.view_associated`, `student.edit_quota`, `student.reassign_teacher`, `student.manage_status`
- `student.view_own_dashboard`

**Invoices / billing / credits**
- `invoices.list`, `invoices.delete`, `invoices.create`, `invoices.mark_paid`, `invoices.edit`
- `billing.view_unpaid_invoices`, `billing.view_history`, `billing.create_invoice`, `billing.update_status_paid`, `billing.submit_payment_proof`, `billing.delete_invoice`, `billing.view_exchange_rates`, `billing.refresh_exchange_rates`, `billing.manage_fx_provider`, `billing.override_exchange_rates`, `billing.manage_currency_hedges`, `billing.manage_currencies`
- `payment_methods.manage_catalogs`, `payment_methods.verify_bank_transfer`
- `credits.manage`

**Resources / storage / reports**
- `resources.list`, `resources.delete`, `resources.upload`
- `storage.manage`
- `reports.generate`, `report.generate_custom`, `report.view_financials`, `monthly_reports.view`

**Complaints / support / communication / suggestions**
- `complaints.list`, `complaints.delete`, `complaints.respond`
- `support.submit_complaint`, `support.view_history`
- `communication.submit_suggestion`
- `suggestions.list`, `suggestions.review`, `suggestions.delete`

**Subjects / categories / notes**
- `subjects.list`, `subjects.create`, `subjects.update`, `subjects.delete`, `subjects.view_resources`, `subjects.manage_resources`
- `categories.list`, `categories.create`, `categories.update`, `categories.delete`
- `notes.list`, `notes.create`, `notes.update`, `notes.delete`

**Staff / permission groups / supervisor**
- `staff.view_directory`, `staff.list`, `staff.create`, `staff.edit`
- `permission_groups.manage`, `permission_groups.assign`
- `supervisor.view_dashboard`

**Notification**
- `notification.view_alerts`

**Meeting providers / configs**
- `meeting_providers.manage_catalog`, `meeting_configs.manage_own`, `meeting_configs.manage_other`, `meeting_configs.manage_class`

**Teacher dues**
- `teacher_dues.view`, `teacher_dues.mark_paid`

**Lesson reports**
- `lesson_reports.submit`, `lesson_reports.review`, `lesson_reports.approve`, `lesson_reports.reject`

**Settings**
- `settings.view`, `settings.edit_general`, `settings.edit_env`, `settings.edit_session`, `settings.audit_view`, `settings.site_content_manage`, `settings.timezones_view`

**Profile field-group ACL** (`profile.<group>.{view|edit}_own` and `..._other`)
Groups covered: `core_identity`, `core_contact`, `teacher_professional`, `teacher_identity`, `parent_social`, `parent_identity`, `parent_billing`, `parent_account`, `parent_students`, `teacher_students`, `staff_role`, `staff_permissions`, `payment_methods`, `meeting_configs`.
Each group has four permissions: `view_own`, `view_other`, `edit_own`, `edit_other`.

**Student field-group ACL** (`student.<group>.{view|edit}_own` and `..._other`)
Groups: `student_identity`, `student_academic`, `student_teacher`, `student_parent`, `student_schedule`, `student_history`, `student_quota_edit`.
Each group has four permissions: `view_own`, `view_other`, `edit_own`, `edit_other`.

**Test-only**
- `test.system_only`, `test.custom_only`, `test.custom_alt`

### 4.3 Helper
The file also exposes a memoized guard that drops DB rows whose keys were removed from the TS/GraphQL enum:
```typescript
let knownAppPermissionsCache: Set<string> | undefined;
function getKnownAppPermissions(): Set<string> { /* builds from Object.values(AppPermission), cached */ }
export function filterKnownAppPermissions(keys: Iterable<string>): AppPermission[] {
  // keeps only known keys, dedups
}
```

### 4.4 DB column type
`appPermissionEnum` is a PG enum over all the dot-paths and is reused on the `permissions.key` column (`backend/db/schema/permissions/permissions.ts`):
```typescript
key: appPermissionEnum("key").notNull().unique(),
```
The `permissions` table stores `key`, `resource`, `action`, `description` (JSONB `LocalizedString`), `category` (JSONB `LocalizedString`), and `isSystem`. A DB trigger (`trg_protect_system_permissions`) blocks creating new system permissions or converting custom ones to system.

---

## 5. Permission Groups

### 5.1 System group slugs — `backend/enum/permissions/permission-group.enum.ts`
```typescript
export enum SystemPermissionGroupSlug {
  SUPER_ADMIN       = "super_admin",
  ACADEMY_ADMIN     = "academy_admin",
  TEACHER_DEFAULT   = "teacher_default",
  PARENT_DEFAULT    = "parent_default",
  STAFF_DEFAULT     = "staff_default",
  SUPERVISOR_DEFAULT= "supervisor_default",
  STUDENT_DEFAULT   = "student_default",
}
```
These 7 slugs define the system (immutable) role buckets. Custom admin-created groups have `isSystem = false`. Cross-layer copy exists in `shared/constants/permission-group.enum.ts` (per `shared/AGENTS.md`), mirroring the same string values for frontend usage without depending on `@/backend/enum`.

### 5.2 Permission-group schema — `backend/db/schema/permissions/permissions.ts`
```typescript
export const permissionGroups = pgTable("permission_groups", {
  id, name: jsonb("name").$type<LocalizedString>().notNull(),
  description: jsonb("description").$type<LocalizedString>(),
  isSystem: boolean("is_system").notNull().default(false),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  createdByUserId: uuid("created_by_user_id").references(() => users.id, { onDelete: "set null" }),
  createdAt, updatedAt,
});

export const groupPermissions = pgTable("group_permissions", {
  groupId: uuid("group_id").notNull().references(() => permissionGroups.id, { onDelete: "cascade" }),
  // permissionId ... (primaryKey on (groupId, permissionId))
});
```

### 5.3 Permission-group type layer — `backend/types/permissions/permission-group.types.ts`
```typescript
export type PermissionGroupSelectType = typeof permissionGroups.$inferSelect;
export type PermissionGroupInsertType = typeof permissionGroups.$inferInsert;
export type PermissionGroupReturnType = Omit<PermissionGroupSelectType, "deletedAt" | "internalNotes"> & {
  name: LocalizedString;
  description: LocalizedString | null;
};
export type PermissionGroupSubmitInput = Omit<PermissionGroupInsertType, "id" | "createdAt" | "updatedAt" | "deletedAt">;
export type PermissionGroupFilterInput = { name?: string; isActive?: boolean };
```
`name`/`description` stay as raw JSONB `LocalizedString` maps so the frontend edits each locale independently; resolution to a single display string happens client-side via `resolveLocalizedString`.

### 5.4 How groups attach to users — `ManagerAccountType`
File: `backend/enum/users/account-type.enum.ts`
```typescript
export enum ManagerAccountType {
  admin = "admin",
  manager = "manager",
  supervisor = "supervisor",
}
export const MANAGER_ACCOUNT_TYPES: readonly ManagerAccountType[] = [
  ManagerAccountType.admin, ManagerAccountType.manager, ManagerAccountType.supervisor,
] as const;
```
Doc block explains the mapping:
- `admin` → `ACADEMY_ADMIN` group
- `manager` → `STAFF_DEFAULT` group
- `supervisor` → `SUPERVISOR_DEFAULT` group

The enum keys are intentionally lowercase because Pothos derives the public GraphQL enum keys from them (existing client/server contract exposes `admin`/`manager`/`supervisor`). Backend callers MUST access via dot access (`ManagerAccountType.admin`) so renaming a value only needs a single edit. The `resolveTargetGroupSlug` function in the manager onboarding service (`backend/services/staff/manager-onboarding.service.ts`) performs the `ManagerAccountType → SystemPermissionGroupSlug` mapping.

---

## 6. Account Type & User Role Enums

### 6.1 `UserRole` — `backend/enum/auth/auth.enum.ts`
```typescript
export enum AppLanguage { ar = "ar"; en = "en" }
export enum AccountStatus { ACTIVATED = "ACTIVATED"; DEACTIVATED = "DEACTIVATED" }
export enum UserRole {
  SUPER_ADMIN   = "SUPER_ADMIN",
  ACADEMY_ADMIN = "ACADEMY_ADMIN",
  SUPERVISOR    = "SUPERVISOR",
  TEACHER       = "TEACHER",
  PARENT        = "PARENT",
  STUDENT       = "STUDENT",
  STAFF         = "STAFF",
  USER          = "USER",
  GUEST         = "GUEST",
}
```
`UserRole` is the coarse, role-scope enum exposed via GraphQL (`UserRolePothosEnum`). The fine-grained permission model is layered on top through permission groups (`SystemPermissionGroupSlug` + `AppPermission`).

### 6.2 `ManagerAccountType` (covered in §5.4) — used to discriminate the staff-side user-of-type buckets when creating manager/staff accounts. Maps to permission group assignment via `resolveTargetGroupSlug`.

### 6.3 `AccountStatus` — lifecycle activation/deactivation flag used on `users`/teachers/parents (referenced in `TeacherProfileReturnType.status`, `ParentDirectoryRow.accountStatus`, `DeactivateParentResult`, …).

---

## 7. Shared Types (`shared/types/`)

Per `shared/AGENTS.md`, the `shared/` layer sits below `app/`, `frontend/`, and `backend/` and may never depend on them (enforced by ESLint `no-restricted-imports`). Shared types live in `shared/types/`.

### 7.1 Inventory
```
shared/types/
├── index.ts            ← barrel: re-exports billing-view + localized-string
├── localized-string.ts ← LocalizedString + locale helpers
└── billing-view.ts     ← cross-layer billing status unions
```

### 7.2 `shared/types/localized-string.ts`
```typescript
import { type AppLocale, defaultLocale, locales } from "@/shared/locale/AppLocale";

/** Partial map keyed by AppLocale; default locale should be present for system seeds. */
export type LocalizedString = Partial<Record<AppLocale, string>>;

export const DEFAULT_CONTENT_LOCALE: AppLocale = defaultLocale;

export function isAppLocale(value: string): value is AppLocale { return KNOWN_LOCALES.includes(value); }
export function normalizeContentLocale(locale?: string): AppLocale { ... }
```
`LocalizedString` is the canonical JSONB map type used across the DB schema for localized names/descriptions (e.g. `permissions.description`, `permissionGroups.name`, `permissionGroups.description`). The backend re-exports it from `@/backend/types/shared/localized-string.types` for backwards compatibility, but the canonical definition lives in `shared/`.

### 7.3 `shared/types/billing-view.ts`
Cross-layer canonical status unions used by frontend views / message label types (to avoid importing GraphQL codegen types into shared):
```typescript
export type CoreInvoiceStatus    = "UNPAID" | "PAYMENT_PENDING" | "PAID" | "CANCELLED";
export type AdminInvoiceStatus   = "OVERDUE" | "PENDING" | CoreInvoiceStatus;
export type StudentCreditStatus  = "negative_balance" | "active_credit";
```

### 7.4 Shared `constants/` enums (frontend-visible)
`shared/AGENTS.md` Rule "Shared Enums": when frontend and backend both need the same enum values, define it in `shared/constants/{domain}.enum.ts` using the same string values as the backend enum. Examples present: `shared/constants/class-instance-detail.enum.ts`, `shared/constants/billing-months.ts`, `shared/constants/permission-group.enum.ts` (the cross-layer mirror of `SystemPermissionGroupSlug`). Backend imports `@/backend/enum`, frontend/graphql codegen enums, and `@/shared/constants/` coexist without `shared/` ever pulling from backend.

---

## 8. Type Flow Through Layers — Students end-to-end

Tracing the `Student` entity from DB schema → types → repo → service → GraphQL.

### 8.1 Schema — `backend/db/schema/students/students.ts`
```typescript
import { appLanguageEnum, genderEnum, studentStatusEnum } from "@/backend/db/schema/enums";

export const students = pgTable("students", {
  id: uuid("id").defaultRandom().primaryKey(),
  parentId: uuid("parent_id").references(() => parents.id, { onDelete: "cascade" }),
  userId:   uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  primaryTeacherId: uuid("primary_teacher_id").references(() => teachers.id, { onDelete: "set null" }),
  name: varchar("name", { length: 255 }).notNull(),
  avatarUrl: varchar("avatar_url", { length: 1024 }),
  dateOfBirth: timestamp("date_of_birth", { withTimezone: true, precision: 3 }),
  gender: genderEnum("gender"),
  language: appLanguageEnum("language"),
  timezoneOverride: varchar("timezone_override", { length: 100 }),
  status: studentStatusEnum("status").notNull(),
  classesTotal: integer("classes_total").notNull().default(0),
  classesRemaining: integer("classes_remaining").notNull().default(0),
  version: integer("version").notNull().default(0),
  hoursPerWeek: numeric("hours_per_week", { precision: 5, scale: 2 }).notNull().default("0"),
  idempotencyKey: varchar("idempotency_key", { length: 255 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true, precision: 3 }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true, precision: 3 }).notNull(),
}, table => [ /* indexes, checks (>=0), GIN trigram, full-text tsvector, RLS via triggers ... */ ]);
```
Note `gender`/`language`/`status` columns use the PG enums built from the TS enums in `backend/db/schema/enums.ts` (§3.3). The schema also exports `studentStatusHistory`, `studentProgress`, `teacherAssignments`.

### 8.2 Types — `backend/types/students/student.types.ts`
(See §1.3 a.) Produces `StudentEntity` (=$inferSelect), `StudentEntityInput` (=$inferInsert), the canonical `Student` return type (drops/retypes enums + adds resolved join props), plus `StudentCreateInput`, `StudentFilterArgs`, `StudentsOrderByClause`, `StudentsOrderByColumn` enum, `StudentOnboardingInput/Result`, history/session dto types.

### 8.3 Repository — `backend/db/repo/students/student.repository.ts`
```typescript
import * as Types from "@/backend/types";             // pulls Student*, StudentsOrderByColumn
import { OrderSortDirection, StudentStatus } from "@/backend/enum";
import { ALLOWED_STATUS_TRANSITIONS } from "@/backend/enum/";

const _processStudentQuery = async (
  query: PgSelect,
  paginationArgs?: Types.PaginationArgs | null,
  orderBy?: Types.StudentsOrderByClause[] | null,
  filters?: Types.StudentFilterArgs | null,
): Promise<Types.StudentsWithFiltersResponse> => {
  // applyFilters / applyOrdering from utils, cursor pagination, then:
  const results = await (processedQuery as unknown as Promise<{ student: Types.StudentEntity; total: number }[]>);
  const items: Types.Student[] = results
    .map(r => StudentUtils.mapEntityToDto(r.student))   // entity → canonical Student
    .filter((s): s is Types.Student => s !== null);
  return { data: items, pageInfo: ... };
};
```
Key behaviors:
- Raw Drizzle rows are typed as `Types.StudentEntity` at the query boundary.
- `StudentUtils.mapEntityToDto` maps the entity row into the canonical `Student` return type (this is where enum columns are widened to `StudentStatus`/`Gender`/`AppLanguage` and resolved props like `email`/`parentName`/`teacherName` are attached).
- The repository's public return types are the canonical backend types (`Types.Student`, `Types.StudentsWithFiltersResponse`, `EditQuotaResult`, …).

### 8.4 Service — `backend/services/student/student-management.service.ts`
```typescript
import { ParentRepository, StudentRepository } from "@/backend/db/repo";
import { NotificationEventType } from "@/backend/enum";
import { assertStudentFieldEdit, buildStudentFieldFilterContext } from "@/backend/services/student/student-field-acl";

export interface EditQuotaResult { readonly id; classesRemaining; classesTotal; version }

export namespace StudentManagementService {
  export async function editQuota(actorUserId, studentId, tErrors, newClassesRemaining, expectedVersion?, locale?): Promise<EditQuotaResult> {
    const fieldCtx = await buildStudentFieldFilterContext(actorUserId, studentId);  // permission check (AppPermission: student.edit_quota / student_quota_edit group)
    assertStudentFieldEdit(fieldCtx, "student_quota_edit");
    const current = await StudentRepository.findById(studentId);
    if (newClassesRemaining > current.classesTotal) throw Error(tErrors.quotaExceedsTotal(...));
    const updated = await StudentRepository.setClassesRemaining(studentId, newClassesRemaining, tErrors, expectedVersion);
    await dispatchStudentQuotaOverriddenNotifications(...);
    return { id: updated.id, classesRemaining: updated.classesRemaining, classesTotal: updated.classesTotal, version: updated.version };
  }
}
```
- Services operate purely in backend types and backend enums; they call repositories by the canonical types and surface their own `*Result` interfaces (often defined inline).
- Permission enforcement uses `AppPermission` group helpers (`student-field-acl.ts`) which reference the dot-path permissions from §4.

### 8.5 GraphQL / Pothos — `backend/graphql/pothos/students/student.pothos.ts`
```typescript
import type { PartialStudentUpdateInput, Student, StudentCreateInput, StudentFilterArgs,
  StudentsOrderByClause, StudentsWithFiltersResponse } from "@/backend/types";
import { StudentsOrderByColumn } from "@/backend/types";
import { GenderPothosObject, AppLanguagePothosObject, StudentStatusPothosObject, OrderSortDirectionPothosObject } from "@/backend/graphql/pothos/shared/enum.pothos";

export const StudentPothosObject = gqlSchemaBuilder
  .loadableObjectRef<Student, string>("Student", {
    load: async (ids) => StudentRepository.loadByIds(ids),
    sort: s => s.id,
  })
  .implement({
    fields: t => ({
      id:       t.exposeString("id", { nullable: false }),
      name:     t.exposeString("name", { nullable: false }),
      email:    t.exposeString("email"),
      status:   t.field({ type: StudentStatusPothosObject, nullable: false, resolve: s => s.status }),
      gender:   t.field({ type: GenderPothosObject, nullable: true, resolve: s => s.gender }),
      language: t.field({ type: AppLanguagePothosObject, nullable: true, resolve: s => s.language }),
      // ...classesTotal, classesRemaining, hoursPerWeek, createdAt, updatedAt
    }),
  });

export const StudentCreateInputPothosObject = gqlSchemaBuilder
  .inputRef<StudentCreateInput>("StudentCreateInput")
  .implement({ fields: t => ({ /* mirrors StudentCreateInput, using Pothos enum refs */ }) });

export const StudentFilterArgsPothosObject = gqlSchemaBuilder.inputRef<StudentFilterArgs>("StudentFilterArgs").implement({ ... });
export const PartialStudentUpdateInputPothosObject = gqlSchemaBuilder.inputRef<PartialStudentUpdateInput>("PartialStudentUpdateInput").implement({ ... });
export const StudentsWithFiltersPothosObject = gqlSchemaBuilder.objectRef<StudentsWithFiltersResponse>("StudentsWithFiltersResponse").implement({ ... });
export const StudentsOrderByColumnPothosObject = gqlSchemaBuilder.enumType(StudentsOrderByColumn, { name: "StudentsOrderByColumn" });
export const StudentsOrderByClausePothosObject = gqlSchemaBuilder.inputRef<StudentsOrderByClause>("StudentsOrderByClause").implement({ ... });
```
- The Pothos object is typed against the canonical backend `Student` type (NO local redefinition).
- The loader delegates to `StudentRepository.loadByIds`.
- Enum fields map to the shared Pothos enum wrappers (`StudentStatusPothosObject`, `GenderPothosObject`, `AppLanguagePothosObject`), which themselves wrap the `backend/enum` TS enums.
- Input/filter types are typed against backend `StudentCreateInput`/`StudentFilterArgs`/`PartialStudentUpdateInput`/`StudentsOrderByClause`/`StudentsWithFiltersResponse` — exactly enforcing the contracts from the types layer.

### 8.6 End-to-end chain summary
```
backend/db/schema/students/students.ts        (Drizzle pgTable; columns use PG enums from enums.ts)
   │ $inferSelect / $inferInsert
   ▼
backend/types/students/student.types.ts       (StudentEntity, StudentEntityInput, Student, StudentCreateInput, ...)
   │ exported via backend/types/students/index.ts → backend/types/index.ts
   ▼
backend/db/repo/students/student.repository.ts (imports * as Types from "@/backend/types"; maps rows via StudentUtils.mapEntityToDto → Types.Student)
   ▼
backend/services/student/*                    (calls repo; enforces AppPermission via field-acl; returns service *Result interfaces)
   ▼
backend/graphql/pothos/students/student.pothos.ts
   │  loadableObjectRef<Student> + inputRef<StudentCreateInput> + enum Pothos wrappers from shared/enum.pothos (wrapping backend/enum TS enums)
   ▼
backend/graphql/query/students/*.query.ts / mutation/students/*.mutation.ts  (resolvers)
   ▼
codegen → frontend/common/graphql/generated/gql/graphql-types.ts   (frontend uses codegen enums, never @/backend/enum)
```

---

## 9. Key Takeaways for the Certificate Feature

1. **Place new enums in `backend/enum/<new-or-existing-subdir>/<entity>.enum.ts`** as TypeScript `enum`s with string values matching the intended PG enum labels; add a `createPgEnumFromEnum` call in `backend/db/schema/enums.ts`; if GraphQL-facing, register it in `backend/graphql/pothos/shared/enum.pothos.ts`. If the enum is needed by frontend UI/shared logic, duplicate the definition into `shared/constants/<domain>.enum.ts` (never import `@/backend/enum` from `shared/`).
2. **Define certificate types in `backend/types/<domain>/certificate.types.ts`** following the AGENTS.md canonical naming:
   - `CertificateSelectType = typeof certificates.$inferSelect`
   - `CertificateInsertType = typeof certificates.$inferInsert`
   - `CertificateReturnType = Omit<CertificateSelectType, "deletedAt" | "idempotencyKey" | "version" | ...> & { status: CertificateStatus; ... }`
   - `CertificateSubmitInput = Omit<CertificateInsertType, "id" | "createdAt" | "updatedAt" | "deletedAt" | "status" | ...>`
   Then add `export * from "./certificate.types";` in the sub-dir's `index.ts`.
3. **Add a new `AppPermission` group for certificates**, e.g. `certificates.list`, `certificates.create`, `certificates.verify`, `certificates.revoke`, `certificates.download`, `certificates.manage_template` (dot-separated, keys in SCREAMING_SNAKE_CASE). Remember to also add profile/student field-group ACL permissions (`certificate.<group>.{view|edit}_own|other`) if certificates carry field-level visibility. Then bump `appPermissionEnum` (regenerated automatically from `Object.values(AppPermission)`).
4. **Reuse `LocalizedString`** (`@/shared/types`) for any localized certificate template fields (title, description) stored as JSONB — see how `permissions.description` / `permissionGroups.name` do it.
5. **Repository layer** `backend/db/repo/<domain>/certificate.repository.ts` should `import * as Types from "@/backend/types"` and expose the canonical `Certificate` return type (with a `CertificateUtils.mapEntityToDto` mapping), `StudentsWithFiltersResponse`-style result wrappers, and `PageInfo`.
6. **Service layer** `backend/services/<domain>/certificate.service.ts` (namespace-export pattern matching `StudentManagementService`) enforces `AppPermission` via the existing field-acl/permission helpers and returns its own `*Result` interfaces.
7. **GraphQL layer** `backend/graphql/pothos/<domain>/certificate.pothos.ts` should type `loadableObjectRef<Certificate>` and `inputRef<CertificateSubmitInput>` against the centralized backend types — do NOT create ad-hoc `CertificateDefinition` types in Pothos files (prohibited by `backend/types/AGENTS.md`).

---

*Artifact path: `/home/ahmed/Projects/siraj-cert/.ai/draft_plans/cert/siraj_analysis/02-types-enums-patterns.md`*
