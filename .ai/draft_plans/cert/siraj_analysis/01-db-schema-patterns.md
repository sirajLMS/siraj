# Siraj — Database Schema Layer: Patterns, Conventions & Structures

> **Scope:** Analysis of `backend/db/` for the Siraj project to guide a **certificate feature** integration.
> **Stack:** PostgreSQL + Drizzle ORM (`drizzle-orm@1.0.0-rc.4`, `drizzle-kit@1.0.0-rc.4`), Neon & node-postgres compatible.
> **Generated:** 2026-08-01. All paths are repo-relative unless noted.

---

## 1. Schema File Structure & Layout

### 1.1 Directory map
```
backend/db/
├── drizzleDb.ts              # DB client singleton + queryDb() resolver
├── factory.ts                 # createDatabase() → Neon serverless | node-postgres Pool
├── connection-strategy.ts     # strategy/mode resolution, pool sizing
├── http-client.ts             # Neon HTTP single-fetch client (stateless reads)
├── drizzleRelations.ts        # defineRelations() graph (new API)
├── db.types.ts                # DBTransaction type
├── query.extensions.ts        # queryWithPagination, fullTextSearch helpers
├── index.ts                   # barrel
├── schema/                    # ← all table definitions live here
│   ├── enums.ts               # top-level pgEnum registry
│   ├── custom-types.ts        # encryptedText custom type
│   ├── index.ts               # re-exports every domain barrel
│   └── <domain>/              # auth, billing, books, classes, communications,
│                             # audit, cron(empty), meeting, parents, permissions,
│                             # shared, storage, students, teachers, users
├── migration/                 # hand-written SQL (RLS, triggers, seeds) — bundled into drizzle/
├── scripts/                   # migrate.ts, applyCustomMigrations.ts, ensureIdempotentMigrations.ts, runDrizzleMigrations.ts
├── repo/                       # repositories (out of scope)
├── seeds/
└── test/
```

### 1.2 Barrel / re-export pattern
- Every domain sub-directory has its own `index.ts` barrel that `export * from "./file"`.
- `backend/db/schema/index.ts` re-exports **all** domain barrels **plus** the top-level `enums.ts` and `custom-types.ts`.
- Import convention throughout the codebase:
  ```ts
  import { users, teachers, parents } from "@/backend/db/schema";
  ```
- Intra-schema references use **direct file paths** (not the barrel) to avoid circular import issues:
  ```ts
  import { users } from "@/backend/db/schema/users/users";
  ```
  (`backend/db/schema/teachers/teachers.ts:4`, `parents/parents.ts:3`, etc.)

### 1.3 Naming conventions
| Layer | Convention | Example |
|---|---|---|
| PostgreSQL table | `snake_case`, plural | `class_instances`, `user_payment_methods` |
| PostgreSQL column | `snake_case` | `hourly_rate`, `created_at`, `is_super_admin` |
| TS table object | `camelCase`, plural noun | `classInstances`, `userPaymentMethods` |
| TS column/property | `camelCase` | `hourlyRate`, `createdAt`, `isSuperAdmin` |
| pgEnum name | `snake_case` | `account_status`, `payment_method_type` |
| Index name | `<table>_<cols>_idx` (snake) | `students_status_idx`, `idx_students_name_fts` |
| CHECK constraint | `<table>_<purpose>_chk` | `class_instances_state_machine_chk` |
| Composite PK tables | `snake_case` join | `group_permissions`, `user_permission_groups` |
| Migration folders | `<YYYYMMDDHHMMSS>_custom_<slug>` for custom; `<ts>_<adj>_<noun>` for drizzle-generated | see §6 |

### 1.4 Canonical table shape
All common tables follow this signature (`pgTable(name, columns, table => [config])`):

```ts
export const teachers = pgTable(
  "teachers",                                          // snake_case DB name
  {
    id: uuid("id").defaultRandom().primaryKey(),        // UUID PK, default random
    userId: uuid("user_id")
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: "restrict" }),
    // ...domain columns...
    createdAt: timestamp("created_at", { withTimezone: true, precision: 3 }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, precision: 3 }).notNull(),
  },
  table => [                                           // array of indexes/constraints
    index("teachers_user_id_idx").on(table.userId),
    index("teachers_created_at_idx").on(table.createdAt),
    index("teachers_updated_at_idx").on(table.updatedAt),
    // ...
  ],
);
```
Source: `backend/db/schema/teachers/teachers.ts:11-41`

---

## 2. Enums (`backend/db/schema/enums.ts`)

### 2.1 Two-tier enum pattern
Enums are **defined as TS enums/objects in `backend/enum/**`** and **mirrored to PostgreSQL `pgEnum`s** via a shared helper.

- TS source enums live in domain folders: `backend/enum/<domain>/*.enum.ts` (e.g. `backend/enum/profiles/profile.enum.ts`, `backend/enum/billing/payment-method.enum.ts`).
- Helper (for most enums):
  ```ts
  // backend/utils/db.utils.ts:3
  export function createPgEnumFromEnum(enumName, enumObject) {
    return pgEnum(enumName, Object.values(enumObject) as [string, ...string[]]);
  }
  ```
- One **special case** builds an enum directly from a numeric/symbolic TS enum:
  ```ts
  // enums.ts:100
  export const appPermissionEnum = pgEnum(
    "app_permission",
    Object.values(AppPermission) as [AppPermission, ...AppPermission[]],
  );
  ```

### 2.2 Enum registry (`enums.ts`) — full list
All ~35 listed enums are exported from `backend/db/schema/enums.ts:42-121`. Notable ones for a certificate feature:

| pgEnum name | TS source |
|---|---|
| `app_language` | AppLanguage |
| `currency_code` | CurrencyCode |
| `country_code` | CountryCode |
| `account_status`, `parent_status`, `student_status` | lifecycle statuses |
| `class_type`, `class_outcome`, `class_execution_state` | scheduling enums |
| `invoice_status`, `invoice_type`, `payment_method_type`, `payment_direction` | billing |
| `rate_source` | RateSource (rate precedence tier: TEACHER/SUBJECT/RECURRING/OVERRIDE) |
| `teacher_due_status` | TeacherDueStatus |
| `lesson_report_status` | LessonReportStatus |
| `system_setting_category`, `system_setting_data_type` | settings |

> **Certificate-feature note:** There is **no existing `cert*`/certificate/credential enum**. New certificate statuses/kinds will need new SQL enums created in `enums.ts` (re-exported via `enums.ts` → `index.ts`) **and** a matching TS enum in `backend/enum/<cert-domain>/`.

### 2.3 Locally-defined enums
Two enums are defined inline (not from the central registry):
- `invoice_payment_submission_status` (`billing/invoice-payment-submissions.ts:6-10`) — pending/approved/rejected, defined directly with `pgEnum(...)`.

### 2.4 Using an enum on a column
```ts
status: studentStatusEnum("status").notNull(),            // nullable by default if no .notNull
currency: currencyCodeEnum("currency").$type<CurrencyCode>(),  // mirror TS enum type
```
- `.$type<...>()` narrows the inferred TypeScript runtime type back to the domain enum (used heavily for `CurrencyCode`, `RateSource`, `TeacherDueStatus` — see `billing/billing.ts:41`, `teachers/teacher-dues.ts:30-35`).
- Some columns specify an explicit **default value** via the TS enum:
  ```ts
  status: accountStatusEnum("status").notNull().default(AccountStatus.ACTIVATED),
  outcome: classOutcomeEnum("outcome").notNull().default("PENDING"),
  ```

---

## 3. Drizzle Configuration & Client

### 3.1 `drizzle.config.ts` (repo root)
```ts
// drizzle.config.ts
export default defineConfig({
  out: "./backend/drizzle",           // migration output folder
  dialect: "postgresql",
  schema: "./backend/db/schema/index.ts",
  schemaFilter: ["public"],          // don't touch neon_auth, etc.
  dbCredentials: { url: process.env.DATABASE_URL } as never,
});
```

### 3.2 Driver strategy — three-way client selection
Siraj supports **three Drizzle drivers**, chosen at runtime based on env (`connection-strategy.ts` + `factory.ts`):

| Client | Drizzle driver | When used | Source |
|---|---|---|---|
| **Pooled (pg)** | `drizzle-orm/node-postgres` over `pg.Pool` | `DB_PROVIDER=postgres` or `DB_CONNECTION_MODE=pg` | `factory.ts:55-64` (`createPostgresDb`) |
| **Neon serverless WebSocket Pool** | `drizzle-orm/neon-serverless` over `@neondatabase/serverless` Pool | Auto, when host `*.neon.tech` and `DB_PROVIDER` defaults to `neon` | `factory.ts:41-51` (`createNeonDb`) |
| **Neon HTTP single-fetch** | `drizzle-orm/neon-http` over `neon()` | Stateless single-query **reads**; never transactions | `http-client.ts:68-74` (`getNeonHttpDb`) |

- Strategy resolution: `connection-strategy.ts:19-34` (`resolveConnectionStrategy`)
- Pool sizing by runtime: `poolMax()` → test=3, Vercel=1, other serverless=2, default=10 (`connection-strategy.ts:36-49`)
- Idle timeouts: Vercel=5s, serverless=10s, default=30s (`connection-strategy.ts:51-55`)

### 3.3 Singleton wiring (`drizzleDb.ts`)
- `db` is a **global JS singleton** keyed by `Symbol.for("siraj.db")` (`drizzleDb.ts:9,42`).
- `getDrizzleDbPool()` returns the pooled driver as needed.
- `queryDb<T>(tx?)` resolver (`drizzleDb.ts:58-63`) — canonical read handle: prefers an explicit transaction, then HTTP DB, then pooled `db`.
- `clearDbConnectionSingleton()` (`drizzleDb.ts:89-94`) resets the in-memory handles when switching `.env` files (e.g. DB CLI) — **non-destructive**.

### 3.4 Transactions type
```ts
// backend/db/db.types.ts:3
export type DBTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
```

---

## 4. Relations Pattern (`backend/db/drizzleRelations.ts`)

- Siraj uses the **new Drizzle `defineRelations(schema, builder)` API** (Drizzle 1.0 RC), NOT the legacy per-table `relations()` builder.
- All relations are declared in one `defineRelations(schema, r => ({ ... }))` block (`drizzleRelations.ts:4`). Exported as the `relations` object, shared with all three drivers.
- Returned by `backend/db/index.ts` and re-exported: `export { relations }` from `drizzleDb.ts:98`.

### 4.1 Relation shape
```ts
users: {
  sessions:            r.many.sessions({ from: r.users.id, to: r.sessions.userId }),
  teacher:             r.one.teachers ({ from: r.users.id, to: r.teachers.userId }),
  permissionGroups:    r.many.permissionGroups({                       // many-through
    from: r.users.id.through(r.userPermissionGroups.userId),
    to:   r.permissionGroups.id.through(r.userPermissionGroups.groupId),
  }),
  verifiedPaymentMethods: r.many.userPaymentMethods({
    from: r.users.id,
    to:   r.userPaymentMethods.verifiedByUserId,                       // reverse role
  }),
},
```
- `r.many.<TableName>({ from, to })` — one-to-many.
- `r.one.<TableName>({ from, to })` — one-to-one / belongs-to.
- `r.<col>.through(<junctionColumn>)` — **many-through** join table relations.
- Reverse roles are supported (e.g. `verifiedByUserId`).

### 4.2 Coverage
Relations are exhaustive — `drizzleRelations.ts` declares relations for **every** table in the schema (users, teachers, parents, students, permissions/groups, recurring schedules, class instances, lesson reports, billing, FX, payments, complaints, suggestions, audit, storage junctions, teacher payments/dues, vacation, DST migration, etc.). Self-referential relations exist for `classInstances` (`originalClass`/`rescheduledTo`) and `suggestions` (`duplicateOf`/`duplicates`).

> **Certificate-feature note:** any new certificate tables must be added to the `defineRelations` map, mirroring the FK names. There is **no separate per-file `*.relations.ts` convention** — everything is centralized for consistency.

---

## 5. Existing Tables — domain-by-domain reference

### 5.1 `users` — `backend/db/schema/users/users.ts`
| Table | PK | Key columns | FKs / relationships | Timestamps | Notes |
|---|---|---|---|---|---|
| `users` | UUID | name, email(unique), password, status(enum, default ACTIVATED), is_super_admin, timezone(default UTC), display_currency(enum) | — | createdAt/updatedAt timestamptz(3), deletedAt (soft delete) | **RLS enabled** (soft-delete select/update filter); 11 indexes incl. `users_status_deleted_at_idx`; CHECK `users_timezone_chk` uses SQL `is_valid_timezone()` |
| `sessions` (legacy) | `varchar(255)` hashedId (`hashed_id`) | userId FK→users(cascade), inet ip, payload, bigint last_activity | users | none | Legacy; actual sessions in Redis |
| `session_metadata` | UUID | sessionId(unique), userId FK→users(cascade), deviceType, expiresAt | users | createdAt/lastActivityAt/expiresAt timestamptz(3) | 4 indexes |
| `session_config` | UUID | roleName(unique), ttlSeconds(default 604800), maxConcurrentSessions(default 5) | — | createdAt/updatedAt | Per-role session TTL/limits |
| `password_reset_tokens` | UUID | email, hashedToken, expiresAt | — | createdAt/expiresAt | 3 indexes |
| `auth_rate_limits` | UUID | inet ipAddress, email, attempts(default 1), lockedUntil | — | createdAt/updatedAt | Partial unique index `auth_rate_limits_ip_email_unique_idx` on (ip,email) |

### 5.2 `auth` — `backend/db/schema/auth/impersonation.ts`
- `impersonation_sessions`: UUID PK; `actor_user_id`→users(restrict), `target_user_id`→users(restrict), startedAt(default now), endedAt, inet ip, isActive(default true). **Partial unique index** `impersonation_sessions_one_active_per_actor` on `actor_user_id WHERE is_active = true`. 6 indexes.

### 5.3 `audit` — `backend/db/schema/audit/audit.ts`
- `admin_audit_logs`: UUID PK; actor→users(restrict), target→users(restrict), jsonb previous/new state, inet ip, action. Append-only (trigger-enforced immutability per comments `audit.ts:4-13`). 5 indexes.
- `audit_logs`: generic polymorphic audit (entityType/entityId varchar — supports non-UUID entities), actor_type, jsonb changes/metadata. 10 indexes incl. composite `(entity_type, entity_id, created_at)`.

### 5.4 `parents` — `backend/db/schema/parents/parents.ts`
- `parents`: UUID PK; `user_id`→users(restrict, **unique 1:1**), status(enum), nationality(country_code enum), phone-ish socials, invoiceType(enum), `fee_amount numeric(12,2)`, currency(enum). createdAt/updatedAt timestamptz(3). 6 indexes. **No deletedAt** (cascade via parent FK).

### 5.5 `teachers` — `backend/db/schema/teachers/`
| Table | PK | Key columns | FKs | Notes |
|---|---|---|---|---|
| `teachers` (`teachers.ts`) | UUID | userId→users(restrict, unique), nationality(countryCode enum), **`nationalId: encryptedText`** (custom type!), phone, dateOfBirth(date), gender(enum), hourly_rate numeric(12,2), rate_currency(enum) | users | 7 indexes; no deletedAt |
| `staff_profiles` (`staff.ts`) | UUID | userId→users(restrict, unique), hourly_rate numeric(12,2), rate_currency | users | Thin staff marker (Decision 6A) |
| `teacher_availability_windows` (`teacher-availability.ts`) | UUID | teacherId→teachers(cascade), day_of_week enum, start/end time, timezoneId→timezones, timezone varchar, utcOffsetSnapshot, effectiveFrom/Until(date) | teachers, timezones | Shares `commonAvailabilityColumns` |
| `teacher_recurring_unavailability` | UUID | + reason text | teachers | Same common columns |
| `teacher_vacation_requests` | UUID | teacherId, requestedByUserId→users(cascade), start_at/end_at timestamptz(3), status enum(default PENDING), processedAt, processedByUserId→users(set null) | teachers, users | 6 indexes |
| `teacher_payments` (`teacher-payments.ts`) | UUID | teacherId→teachers(restrict), userPaymentMethodId→userPaymentMethods(set null), paymentMethodType(enum), `paymentMethodSnapshot jsonb`, amount numeric(12,2), currency, paymentDate timestamptz(3), isTestPayment(default false) | teachers, userPaymentMethods | 5 indexes |
| `teacher_dues` (`teacher-dues.ts`) | UUID | teacherId→teachers(cascade), classInstanceId→class_instances(cascade), studentId→students(cascade), hours numeric(8,2), amount numeric(12,2), currency, rateSource enum (denormalized from class_instances), status enum(default PENDING), approvedByUserId→users(cascade), teacherPaymentId→teacherPayments(set null) | teachers, classInstances, students, users, teacherPayments | **Unique index** `teacher_dues_class_instance_id_unique_idx` (one due per class); 9 indexes |
| `teacher_important_notes` (`teacher-notes.ts`) | UUID | teacherId→teachers(restrict), title, body, isPublished(default false), priority, startsAt/expiresAt, createdByUserId→users(restrict) | teachers, users | Soft delete via deletedAt; 4 indexes |

#### Teacher availability common columns pattern (`teacher-availability.ts:10-25`)
A plain object `commonAvailabilityColumns` is spread into multiple `pgTable`s to share id/teacherId/dayOfWeek/start/endTime/timezone/timezoneId/utcOffsetSnapshot/effectiveFrom/effectiveUntil/createdAt/updatedAt. (Same "DRY" idea as the meeting config helpers — see §11.)

### 5.6 `students` — `backend/db/schema/students/students.ts`
| Table | PK | Key columns | FKs | Special |
|---|---|---|---|---|
| `students` | UUID | parentId→parents(cascade), userId→users(cascade), primaryTeacherId→teachers(set null), name(255), avatarUrl(1024), dateOfBirth timestamptz(3), gender(enum), language(app_language), timezoneOverride(100), status(enum), classesTotal/classesRemaining int(default 0), version int(default 0), hoursPerWeek numeric(5,2) default "0" (kept in sync via PG triggers), idempotencyKey(255) | parents, users, teachers | **RLS enabled** (parent-scoped select/insert/update/delete); **3 CHECK constraints** (`classes_remaining>=0`, `classes_total>=0`, timezone valid); **GIN FTS index** `idx_students_name_fts` on `to_tsvector('simple', name)`; **GiST trigram index** `idx_students_name_trgm` (pg_trgm); unique idempotency key; pagination index `(createdAt, id)` |
| `student_status_history` | UUID | studentId→students(cascade), oldStatus/newStatus enum, changedByUserId→users(set null) | students, users | createdAt only (append-only audit of status state machine) |
| `student_progress` | UUID | studentId→students(cascade), classInstanceId→class_instances(restrict), teacherId→teachers(restrict), topicsCovered, homeworkAssigned, notes, parentVisible bool(default true) | students, classInstances, teachers | **RLS enabled** (`student_progress_teacher_policy`, `student_progress_parent_policy` if parent_visible); **unique index** `(studentId, classInstanceId)`; 6 indexes |
| `teacher_assignments` | UUID | studentId→students(cascade), teacherId→teachers(restrict), assignedAt timestamptz(3), assignedByUserId→users(set null), endedAt | students, teachers, users | Tracks historical teacher↔student assignments; 4 indexes |

### 5.7 `permissions` — `backend/db/schema/permissions/permissions.ts`
| Table | PK | Key columns | FKs | Notes |
|---|---|---|---|---|
| `permissions` | UUID | key = appPermissionEnum (unique), resource(100), action(100), `description`/`category` jsonb LocalizedString, isSystem bool(default false) | — | Immutable system perms enforced by trigger `trg_protect_system_permissions`; 4 indexes |
| `permission_groups` | UUID | name jsonb LocalizedString, description jsonb, isSystem, slug(100) unique, createdByUserId→users(set null) | users | 4 indexes |
| `group_permissions` | **composite PK** (groupId, permissionId) | groupId→permissionGroups(cascade), permissionId→permissions(cascade) | groups, perms | Join table; 2 indexes |
| `user_permission_groups` | **composite PK** (userId, groupId) | userId→users(cascade), groupId→permissionGroups(cascade), assignedAt, assignedByUserId→users(set null) | users, groups | 3 indexes |
| `user_permission_overrides` | **composite PK** (userId, permissionId) | state varchar(20) (GRANTED/DENIED), assignedByUserId→users(set null) | users, perms | 4 indexes |

> Three tables use **composite primary keys** (`primaryKey({ columns: [...] })`) — the canonical Siraj pattern for join/association tables.

### 5.8 `billing` — `backend/db/schema/billing/`
| Table | PK | Key columns | FKs | Notes |
|---|---|---|---|---|
| `invoices` (`billing.ts:29`) | UUID | parentId→parents(restrict), studentId→students(restrict), issueDate/dueDate/paidDate (date type), amount numeric(12,2), currency enum, status enum, invoiceType enum, version int(default 0), exchangeRateSnapshot numeric(12,6), exchangeRateSource varchar(50), createdByUserId→users(set null), emailSentAt, idempotencyKey | parents, students, users | **RLS enabled** (soft delete); **unique idempotency key**; composite index `(status, due_date)`; deletedAt |
| `invoice_coverage_months` | **composite PK** (invoiceId, year smallint, month smallint) | invoiceId→invoices(restrict) | invoices | Minimal join table |
| `payments` (`billing.ts:78`) | UUID | invoiceId→invoices(restrict), amount numeric(12,2), currency, paymentDate timestamptz(3), userPaymentMethodId→userPaymentMethods(set null), paymentMethodType enum, `paymentMethodSnapshot jsonb` (union of PaymentMethod/PaymentProof snapshots), transactionId, gatewayResponse text, refundedAmount numeric(12,2) default "0.00", exchangeRateSnapshot, idempotencyKey | invoices, userPaymentMethods | Unique idempotency key; 7 indexes |
| `currency_exchange_rates` | UUID | from/to currency enum, rate numeric(12,6), source, providerResponse jsonb, effectiveDate timestamptz(3) | — | **Unique index** `(from, to, effectiveDate)` |
| `currency_exchange_audit_logs` | UUID | from/to currency, oldRate/newRate numeric(12,6), source, changedByUserId→users(set null) | users | Append-only |
| `currency_hedges` | UUID | currency enum, amount numeric(12,2), hedgeType varchar(20) (LONG/SHORT), notes | — | Risk exposure |
| `credit_transactions` (`credit-transactions.ts`) | UUID | studentId→students(cascade), changeAmount int, reason enum, sourcePaymentId→payments(set null), classInstanceId→class_instances(set null), notes, creditedByUserId→users(set null), idempotencyKey | students, payments, classInstances, users | **Unique idempotency key**; ledger of student class-credit changes |
| `supported_currencies` (`currencies.ts`) | `currencyCode enum` PK (non-UUID!) | symbol(16), countryCode enum, decimals smallint, sortOrder int(default 0), isActive bool(default true) | — | Key-code-as-PK lookup table |
| `fx_sync_runs` (`fx-sync.ts`) | UUID | provider enum, status enum, pairsWritten/pairsFailed varchar(10) default "0", errorMessage, providerResponse jsonb, triggerType, triggeredByUserId→users(set null), startedAt/finishedAt | users | FX provider sync tracking |
| `user_payment_methods` (`user-payment-methods.ts`) | UUID | userId→users(restrict), type enum, direction enum, isDefault bool(default false), label(100), `details jsonb` (PaymentMethodDetails), verifiedAt, verifiedByUserId→users(set null) | users | **Two partial unique indexes** (`user_payment_methods_payin_default_idx`, `_payout_default_idx`) enforcing one default per direction; jsonb details |
| `supported_mobile_wallets` / `supported_online_accounts` / `supported_payment_links` | UUID | slug(100) unique, name/description/instructions **jsonb LocalizedString**, country/identifier fields, supportedDirections enum(default BOTH), logoUrl, isActive | — | Payment-method catalogs; localized via jsonb |
| `invoice_payment_submissions` (`invoice-payment-submissions.ts`) | UUID | invoiceId→invoices(restrict), fileId→storageFiles(restrict), submittedByUserId→users(restrict), status enum (pending/approved/rejected, **locally defined**), reviewedByUserId→users(set null), rejectionReason | invoices, storageFiles, users | New enum `invoice_payment_submission_status` defined inline; 7 indexes |

### 5.9 `classes` — `backend/db/schema/classes/`
| Table | PK | Key columns | FKs | Notes |
|---|---|---|---|---|
| `class_categories` (`class-category.ts`) | UUID | name(200), slug(100) unique, description, isActive, sortOrder, deletedAt | — | Soft delete |
| `class_subjects` (`class-subject.ts`) | UUID | categoryId→classCategories(restrict), name(200), slug unique, avatarUrl(1024), **hourlyRate numeric(12,2)** (rate precedence middle tier), rateCurrency enum, isActive, sortOrder, deletedAt | classCategories | Soft delete; unique slug |
| `subject_resources` (`subject-resource.ts`) | UUID | subjectId→classSubjects(cascade), learningResourceId→learningResources(cascade), resourceType(50), sortOrder | classSubjects, learningResources | Unique index `(subjectId, learningResourceId)` |
| `recurring_schedules` (`scheduling.ts:51`) | UUID | studentId→students(restrict), teacherId→teachers(restrict), subjectId→classSubjects(restrict), durationMinutes int, defaultStartTime time, timezoneId→timezones, timezone varchar(100), utcOffsetSnapshot, **hourlyRate numeric(12,2)** (rate precedence top tier), rateCurrency, effectiveFrom/Until(date) | students, teachers, classSubjects, timezones | **RLS enabled** (soft delete); CHECK `recurring_schedules_timezone_chk` via `is_valid_timezone()`; trigger `trg_recalc_hours_recurring_schedules`; deletedAt |
| `recurring_schedule_days` (`scheduling.ts:103`) | UUID | recurringScheduleId→recurringSchedules(restrict), dayOfWeek enum, startTime time, isActive | recurringSchedules | **Unique index** `(recurringScheduleId, dayOfWeek)` |
| `class_instances` (`scheduling.ts:136`) | UUID | studentId→students(restrict), teacherId→teachers(restrict), subjectId→classSubjects(restrict), recurringScheduleId→recurringSchedules(set null), **originalClassId→classInstances(set null) (self-ref)**, scheduledStart/EndAt timestamptz(3), bookingTimezoneId→timezones, bookingTimezone, bookingUtcOffset, durationMinutes, classType enum, outcome enum(default PENDING), executionState enum(default NOT_ACTIVATED), isRescheduled/isFrozen booleans, meetingJoinUrl, userMeetingConfigId→userMeetingConfigs(set null), meetingProviderId→meetingProviders(set null), meetingConfigSnapshot jsonb, activatedAt, activatedByUserId→users(set null), forceActivated, forceActivatedByUserId, actualStart/EndAt, quotaDeducted, payrollCredited, rateAmount numeric(12,2), rateCurrency, isRateOverridden, **rateSource enum** (precedence tier), idempotencyKey | students, teachers, classSubjects, recurringSchedules, userMeetingConfigs, meetingProviders, timezones, users (self & role refs) | **RLS enabled** (soft delete); **4 CHECK constraints** (state machine, reschedule-not-self, rescheduled-no-quota, rescheduled-no-complete); **partial unique index** `class_instances_original_class_uniq_idx ... WHERE original_class_id IS NOT NULL AND deleted_at IS NULL` (one active reschedule per class); unique idempotency key; ~30 indexes incl. partial indexes on `is_frozen`/`is_rescheduled` truths |
| `class_status_events` | UUID | classInstanceId→classInstances(restrict), eventType(50), from/to state jsonb, description, actorUserId→users(set null) | classInstances, users | Append-only event log; composite index `(classInstanceId, createdAt)` |
| `leave_requests` | UUID | classInstanceId→classInstances(restrict), requestedByUserId→users(cascade), requesterType enum, status enum, processedAt, processedByUserId→users(set null) | classInstances, users | 7 indexes |
| `leave_quota_usage` | UUID | teacherId→teachers(restrict), studentId→students(restrict), periodYear/periodMonth smallint, usedCount int(default 0) | teachers, students | **XOR CHECK** `leave_quota_usage_teacher_student_xor_chk`; **two partial unique indexes** (teacher or student period); trigger `trg_enforce_leave_quota_limits` |
| `dst_migration_runs` / `dst_migration_entries` | UUID | run→user, entry→run+recurringSchedule | users, recurringSchedules | DST timezone migration audit |
| `class_instance_performance` | UUID | classInstanceId→classInstances(cascade) **unique** (1:1), engagementScore, assessment fields, heatmap jsonb, latencyMs, attendanceRate, avgGrade varchar(10) | classInstances | Time-series/telemetry per class |
| `group_classes` (`group-class.ts`) | UUID | classInstanceId→classInstances(cascade), courseName, teacherName, classType, original/rescheduledDate timestamptz(3), timeSlot, status, auditRemark, auditLoggedAt | classInstances | 7 indexes |
| `group_class_enrollments` | UUID | groupClassId→groupClasses(cascade), studentId→students(restrict), studentIdNumber(50), attendanceStatus varchar(20) default "pending" | groupClasses, students | **Unique index** `(groupClassId, studentId)` |
| `class_communications` | UUID | groupClassId→groupClasses(cascade), type(20), title(255), description, isActive, isDelivered bool, notificationDeliveryId→notificationDeliveries(set null), classStatusEventId→classStatusEvents(set null) | groupClasses, notificationDeliveries, classStatusEvents | 8 indexes |
| `lesson_reports` (`lesson-reports.ts`) | UUID | classInstanceId→classInstances(cascade), studentId→students(cascade), teacherId→teachers(cascade), lessonDate timestamptz(3), durationMinutes int, attendanceEvaluation enum, teacherNotes/studentNotes, completionPercentage int(default 0), status enum(default PENDING_REVIEW), submittedByUserId→users(set null), submittedAt, reviewedByUserId→users(set null), reviewedAt, rejectionReason, idempotencyKey | classInstances, students, teachers, users | **2 CHECK constraints** (completion 0-100, review-consistency: rejected needs reason / approved must not have reason); **2 unique indexes** (`class_instance_id`, `idempotency_key`); review workflow PENDING_REVIEW→APPROVED/REJECTED |

### 5.10 `communications` — `backend/db/schema/communications/communications.ts`
| Table | PK | Key columns | FKs | Notes |
|---|---|---|---|---|
| `user_notification_preferences` | UUID | userId→users(cascade), channel enum, eventType enum, enabled bool(default true) | users | **RLS enabled**; **unique index** `(userId, channel, eventType)` |
| `user_device_tokens` | UUID | userId→users(cascade), token(512), platform enum, deviceName, isActive, lastUsedAt | users | **RLS enabled**; unique token index |
| `notification_deliveries` | UUID | userId→users(cascade), deviceTokenId→userDeviceTokens(set null), channel/event/status enums (default PENDING), title, body, providerMessageId, failureReason, webhookPayload/metadata jsonb, sentAt/deliveredAt/openedAt/failedAt | users, userDeviceTokens | **RLS enabled**; composite index `(userId, status, createdAt)` |
| `complaints` | UUID | parentId→parents(restrict), studentId→students(set null), category enum, submitterEmail, body, status enum | parents, students | **RLS enabled** (soft delete via deletedAt) |
| `complaint_responses` | UUID | complaintId→complaints(cascade), responderUserId→users(set null), body, emailSent bool(default false) | complaints, users | Append-only |
| `suggestions` | UUID | parentId→parents(restrict), submitterName, body, status enum(default PENDING), **duplicateOfId (self-ref)**, adminResponse, reviewedByUserId→users(set null), reviewedAt, emailSentAt, deletedAt | parents, users | **RLS enabled** (soft delete); self-ref FK declared via `foreignKey({ columns, foreignColumns, name })` to `suggestions.id` with `ON DELETE SET NULL`; **partial index** `... WHERE deleted_at IS NULL` |
| `learning_resources` | UUID | displayName(255), filePath(1024) **(no FK — tech debt comment)**, uploadedByUserId→users(cascade) | users | **RLS enabled** (soft delete via deletedAt) |

### 5.11 `meeting` — `backend/db/schema/meeting/`
| Table | PK | Key columns | FKs | Notes |
|---|---|---|---|---|
| `meeting_providers` | UUID | slug(100) unique, name/description/instructions **jsonb LocalizedString**, `urlAllowlist jsonb string[]`, urlExample, logoUrl, **`fieldSchema jsonb`** (MeetingProviderFieldSchema), isActive | — | Provider catalog |
| `user_meeting_configs` (`user-meeting-configs.ts`) | UUID | userId→users(cascade) + **shared columns** (`...meetingConfigSharedColumns()`) | users, meetingProviders (via shared) | **Partial unique index** one-default-per-user (`WHERE is_default = true`); `encryptedSecret: encryptedText` |
| `class_meeting_configs` (`class-meeting-configs.ts`) | UUID | classInstanceId→classInstances(cascade), recurringScheduleId→recurringSchedules(cascade) + shared columns | classInstances, recurringSchedules, meetingProviders | **CHECK** `class_meeting_configs_scope_chk` (XOR: exactly one of classInstanceId/recurringScheduleId); **two partial unique indexes** (per-instance AND per-recurring default) |

#### Meeting shared-column / shared-index helpers (`meeting/__shared__/`)
To eliminate SonarQube duplication, two helper modules compose the meeting tables:

**`meeting-config-columns.ts:10-22`** — shared columns builder:
```ts
export function meetingConfigSharedColumns() {
  return {
    providerId: uuid("provider_id").notNull()
      .references(() => meetingProviders.id, { onDelete: "restrict" }),
    label: varchar("label", { length: 100 }),
    isDefault: boolean("is_default").notNull().default(false),
    details: jsonb("details").$type<MeetingConfigDetails>().notNull(),
    encryptedSecret: encryptedText("encrypted_secret"),     // ← custom encrypted type
    createdAt: timestamp("created_at", { withTimezone: true, precision: 3 }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, precision: 3 }).notNull(),
  };
}
```

**`meeting-config-indexes.ts:32-61`** — partial-uniqueness builders reused by both meeting tables:
```ts
// scope required (e.g. user_id)
meetingConfigOneDefaultPerScopeIndex(tableName, scopeLabel, columnRef, isDefaultRef)
  => uniqueIndex(...).on(columnRef).where(sql`${isDefaultRef} = true`);

// scope nullable (e.g. class_instance_id)
meetingConfigOneDefaultPerNullableScopeIndex(...)
  => uniqueIndex(...).on(columnRef)
     .where(sql`${isDefaultRef} = true AND ${columnRef} IS NOT NULL`);
```
> **Reusable pattern for certificates:** the project Codifies "one default per scope" as a **partial unique index with a `WHERE` predicate**, exposed as helper functions. A certificate "primary/generated default" constraint could reuse this exact idiom.

### 5.12 `books` — `backend/db/schema/books/books.ts`
- `books`: UUID PK; name(255), availabilityStatus(enum), createdAt, deletedAt (soft delete). 4 indexes. (Standalone domain, minimal coupling.)

### 5.13 `shared` — `backend/db/schema/shared/`
| Table | PK | Key columns | Notes |
|---|---|---|---|
| `rate_limit_cache` | `text` key PK | value text, expiresAt timestamptz **(no precision)** | Comment: UNLOGGED table for write perf. 2 indexes |
| `session_cache` | `text` key PK | value, expiresAt timestamptz | LOGGED table (crash-safe). 2 indexes |
| `system_settings` (`settings.ts`) | `varchar(100)` key PK | value text, dataType enum (default String), description text(notNull), category enum, updatedByUserId→users(set null), updatedAt | Application configuration store; key-as-PK lookup pattern |
| `timezones` (`timezones.ts`) | `serial` int PK (only **serial int** PK in schema!) | ianaId(100) unique, baseOffsetMinutes int, isDstSupported bool(default true) | Lookup table referenced by `integer("timezone_id")` FK in recurring_schedules/class_instances/availability/vacation |

### 5.14 `storage` — `backend/db/schema/storage/`
- `storage_file` (`storage.ts:11`, note singular table name) — UUID PK; path text **unique**, isProtected bool(default false). 1 index.
- **Junction-table family** replacing a polymorphic `file_usage` table (comment `storage.ts:21-25`): each entity has its own typed join table:
  - `user_files`, `teacher_files`, `student_files`, `parent_files`, `invoice_files`, `complaint_files`, `learning_resource_files`, `staff_profile_files`, `recurring_schedule_files`, `class_instance_files`.
- Each junction: UUID PK, `file_id`→storageFiles(cascade), `<entity>_id`→entity(cascade-or-restrict), `usage_type` varchar(100), createdAt timestamptz(3). 2 indexes each.
- `storage_directory` — UUID PK; path(1024) unique; permission booleans (allowUploads/Delete/Move/etc.), isProtected, protectChildren.
- `signed_url` — **`varchar(64)` PK** (UUID token, not uuid type); filePath, contentType, fileSize **bigint**, contentHash(128), expiresAt timestamptz(3), createdAt, used bool(default false). 5 indexes incl. composite `(used, expiresAt)`.
- `site_content` (`storage/site-content.ts`) — UUID PK; slug(100) unique, title(255), body text, contentType(50) default "page", isPublished(default true), updatedByUserId→users(set null). Composite index `(isPublished, contentType)`.

> **Certificate-feature note:** the project deliberately avoids polymorphic association tables and prefers **per-entity FK junction tables** (`*_files`). If certificates attach files, follow this exact convention — add a `certificates_files` junction (each file row: file_id→storageFiles cascade, certificate_id→certificates cascade, usage_type varchar).

### 5.15 `cron`
- The `backend/db/schema/cron/` directory **exists but is empty** (no `index.ts`). Reserved; no cron-state tables currently.

---

## 6. Migration System

### 6.1 Two-tier migration architecture
Siraj uses a **custom hybrid migration pipeline** layered on top of Drizzle Kit:

1. **Schema-defined tables/enums/indexes/constraints** → generated by `drizzle-kit generate` into `backend/drizzle/<ts>_<name>/migration.sql` (+ `snapshot.json`).
2. **Hand-written SQL** in `backend/db/migration/*.sql` (RLS policies, triggers, functions, seeds) → auto-bundled into drizzle migration folders by **`applyCustomMigrations.ts`**.

`package.json`: `"db": "bun --no-env-file run scripts/dbActions/index.ts"` → interactive CLI (`scripts/dbActions/cli.ts`). Available actions (`scripts/dbActions/actions.ts:12-20`):

| # | Action | Implementation |
|---|---|---|
| 1 | Reset Database | destructive |
| 2 | Seed Database | seeds |
| 3 | Generate Drizzle Schema | `drizzle-kit generate --ignore-conflicts` |
| 4 | Drop Drizzle Schema | drop |
| 5 | **Run Migrations** | `bun run backend/db/scripts/migrate.ts` |
| 6 | Push Schema to DB | `drizzle-kit push --force` |
| 7 | Open Drizzle Studio | `drizzle-kit studio` |
| 8 | Clean Generate (Reset → Gen → Migrate → Seed) | composite |

### 6.2 `migrate.ts` orchestrator (`backend/db/scripts/migrate.ts`)
```
runMigrations(closePool):
  1. applyCustomMigrations()      # auto-bundle changed backend/db/migration/*.sql into drizzle folders
  2. ensureIdempotentMigrations()  # rewrite all migration.sql to be PG-idempotent
  3. runDrizzleMigrations(db, { migrationsFolder: "./backend/drizzle" })
       - upgrades migration journal table if needed
       - per-folder transaction (NOT one mega-transaction)
       - pre-commits enum ADD VALUE statements before each folder (PG 55P04 workaround)
```

### 6.3 `runDrizzleMigrations.ts` (`backend/db/scripts/runDrizzleMigrations.ts`)
- Migrations table: `drizzle.__drizzle_migrations` (separate **`drizzle` schema**, custom `applied_at` column).
- **Per-folder transaction** (addresses PostgreSQL enum-in-transaction constraint `55P04`):
  ```ts
  for (const migration of migrationsToRun) {
    await preCommitEnumStatementsForMigrationFile(migrationPath);   // execute enum ADD VALUE outside tx
    await db.transaction(async tx => {
      for (const stmt of migration.sql) await tx.execute(sql.raw(stmt));
      await tx.execute(sql`insert into drizzle.__drizzle_migrations ...`);
    });
  }
  ```
- Handles Mark-and-sweep via `drizzle-orm/migrator.utils.getMigrationToRun` + `drizzle-orm/up-migrations/pg` upgrade.

### 6.4 Custom-migration auto-bundler (`applyCustomMigrations.ts`)
- Watches `backend/db/migration/*.sql` (excludes `1-extensions.sql`, `temp_*`, `*.sql_ignore`).
- Builds a SHA-256 **manifest** of `{file, sha256}` per file; stores it in sidecar `backend/drizzle/.custom-migrations.json` (`{manifestHash, manifest, appliedFolders}`).
- **Delta logic:** when manifest hash changes, computes files whose sha256 differs (new or modified) and emits a **separate drizzle migration folder per file**: `<timestamp>_custom_<slug>/migration.sql` prepended with `-- Source: <file>`.
- Bootstrap handles legacy `_combined_custom_logic` folder as baseline.
- **Idempotency requirement:** each custom SQL file **must** be safe to re-run (`IF NOT EXISTS`, `ON CONFLICT`, `DO $$ ... EXCEPTION`).

### 6.5 Idempotency transformer (`ensureIdempotentMigrations.ts`)
Automatically rewrites generated `migration.sql` statements to be Postgres-idempotent (`backend/db/scripts/ensureIdempotentMigrations.ts`):
- `CREATE TYPE` → wrapped in `DO $$ IF NOT EXISTS (pg_type) ...`.
- `ADD COLUMN` → `ADD COLUMN IF NOT EXISTS`.
- `ADD CONSTRAINT` → `DO $$ EXCEPTION WHEN duplicate_object OR duplicate_table`.
- `ALTER TYPE ... ADD VALUE` → wrapped in `DO $$ IF NOT EXISTS (pg_enum) ...` (prevents 55P04 on re-run).
- `ALTER COLUMN ... TYPE` → drop default first, guarded by `information_schema` check.
- `INSERT INTO group_permissions|user_permission_groups` → append `ON CONFLICT DO NOTHING`.

### 6.6 Custom_SQL files present (`backend/db/migration/`) — categories
| Category | Files |
|---|---|
| Extensions/functions | `1-extensions.sql` (pg_trgm + `is_valid_timezone()`), `2-functions.sql` (`current_user_id()`) |
| Permissions/groups | `3-system_permissions_and_groups.sql`, `4-fx_exchange_rate_permissions.sql`, `5-billing_fx_admin_permissions.sql`, `5a-billing_manage_currencies_permission.sql`, `6-*` meeting/payment/profile perms, `7a/7b` settings perms |
| RLS | `30-a-class_instances_rls_policies.sql`, `soft_delete_rls_policies.sql`, `permissions_rls_policies.sql`, `books_rls_policies.sql`, `student_progress_rls.sql`, `user_notification_preferences.sql` |
| Triggers | `30-b-class_instances_state_transition_trigger.sql`, `30-c-class_instances_auto_miss_transition.sql`, `audit_log_immutability_trigger.sql`, `hours_per_week_recalculation.sql`, `leave_quota_limits_trigger.sql`, `student_status_transition_trigger.sql`, `student_created_at_immutability.sql` |
| Seeds/migrations | `4a-4e` categories/teachers/settings/timezones/super-admin seeds, `8a-system-setting-enums.sql`, `cache_split.sql`, `impersonation_sessions.sql`, `auth_rate_limiting.sql`, `exclude_jerusalem_timezone.sql`, `timezone_dst_logic.sql` |

> **Certificate-feature note:** to add certificate schema tables you should (a) add the `pgTable` declarations + register them in `index.ts` barrels and `drizzleRelations.ts`, (b) run `drizzle-kit generate` (CLI option 3) to produce the migration folder, then (c) if RLS/triggers are needed, drop a hand-written `backend/db/migration/<feature>_rls_policies.sql` / `..._trigger.sql` file — the auto-bundler will pick it up on next `bun db migrate`.

---

## 7. Custom Types (`backend/db/schema/custom-types.ts`)

### 7.1 `encryptedText`
```ts
// custom-types.ts:4-16
export const encryptedText = (name: string) =>
  customType<{ data: string | null; driverData: string }>({
    dataType() { return "text"; },
    toDriver(value) { return value === null ? "" : encryptField(value); },
    fromDriver(value) { return decryptField(value); },
  })(name);
```
- Backed by AES-256-GCM (`backend/lib/field-encryption.ts`), key from `DATABASE_ENCRYPTION_KEY`, stored as `iv:cipherText:authTag` hex. Legacy plaintext falls back to as-is.
- Usage: `nationalId: encryptedText("national_id")` (teachers), `encryptedSecret: encryptedText("encrypted_secret")` (meeting configs).

### 7.2 Jsonb typed wrappers
- `jsonb("details").$type<PaymentMethodDetails | PaymentMethodTransactionSnapshot | ...>` — recurring usage across billing, meeting (`MeetingConfigDetails`, `MeetingConfigSnapshot`, `MeetingProviderFieldSchema`, `NotificationMetadata`, `number[]` for heatmaps).
- **`LocalizedString`** (`shared/types/localized-string.ts:20` = `Partial<Record<AppLocale, string>>`) is the canonical i18n JSONB shape for `name`/`description`/`instructions`/`label`/`category` columns (permissions, payment catalogs, meeting providers, permission groups).

---

## 8. Row-Level Security (RLS)

### 8.1 Mechanism
- RLS is **enabled AND forced** on protected tables:
  ```sql
  ALTER TABLE "<t>" ENABLE ROW LEVEL SECURITY;
  ALTER TABLE "<t>" FORCE ROW LEVEL SECURITY;
  ```
- Identity comes from the `current_user_id()` PL/pgSQL function (`backend/db/migration/2-functions.sql`), which reads `current_setting('app.current_user_id', true)`; the application sets this session GUC per request.
- Policies use subqueries against `parents`/`teachers` to determine role (e.g. `NOT EXISTS (SELECT 1 FROM parents WHERE user_id = current_user_id())` ⇒ admin bypass).

### 8.2 Two RLS strategies used in Siraj

**Strategy A — Soft-delete filtering** (`migration/soft_delete_rls_policies.sql`). Tables: `users`, `recurring_schedules`, `class_instances`, `complaints`, `learning_resources`, `invoices`. Identical 4-policy pattern per table:
- `SELECT ... USING (deleted_at IS NULL)`
- `INSERT ... WITH CHECK (deleted_at IS NULL)`
- `UPDATE ... USING (deleted_at IS NULL) WITH CHECK (deleted_at IS NULL OR (deleted_at IS NOT NULL AND current_setting('app.soft_delete', true) = 'true'))` — soft-delete writes set `app.soft_delete='true'`
- `DELETE ... USING (false)` — **hard DELETE blocked** (enforced via `SoftDeleteRepository`)

**Strategy B — Ownership/role scoping**:
- `students` (`migration/permissions_rls_policies.sql`): parents limited to their own children across SELECT/INSERT/UPDATE/DELETE; admins/teachers bypass via NOT EXISTS parents check.
- `student_progress`: teacher scoping + parent visibility gated on `parent_visible`.
- `notification_*` and `user_device_tokens`: `*_access_policy` — users only see their own rows (single policy per command type).
- `class_instances` (`30-a-class_instances_rls_policies.sql`): uses `AS RESTRICTIVE` policies combining soft-delete + teacher/parent scoping.

### 8.3 Tables documented in code comments as RLS-protected
(Identified by `// NOTE: ... RLS policies are active` / `RLS Policies:` docstrings at the top of `pgTable` definitions.)
- `users.ts:21`, `teachers/teachers.ts`, `parents/parents.ts`, `students/students.ts:33-40` (detailed policy list), `studentProgress` (`students.ts:125-130`), `billing/billing.ts:27` (invoices), `scheduling.ts:48-50` (recurring_schedules), `scheduling.ts:133-135` (class_instances), `communications.ts:32-36/62-66/96-100/142/190/228` (notification prefs, device tokens, deliveries, complaints, suggestions, learning resources), `books.ts` (via `books_rls_policies.sql`).

> **Certificate-feature note:** any user-facing certificate data (e.g. parent viewing own child's certificates, teacher viewing their issued certs) **must** include matching RLS policies in a new `backend/db/migration/certificates_rls_policies.sql`, using `current_user_id()` + parent/teacher subquery scoping. Tables holding audit/immutable rows should also opt into Strategy A's soft-delete-vs-immutable model.

---

## 9. CHECK Constraints — catalog & conventions

| Table | Constraint name | Rule | Source |
|---|---|---|---|
| `users` | `users_timezone_chk` | `is_valid_timezone(timezone)` | `users.ts:45` |
| `students` | `students_classes_remaining_chk` | `classes_remaining >= 0` | `students.ts:82` |
| `students` | `students_classes_total_chk` | `classes_total >= 0` | `students.ts:83` |
| `students` | `students_timezone_override_chk` | `timezone_override IS NULL OR is_valid_timezone(timezone_override)` | `students.ts:84-87` |
| `recurring_schedules` | `recurring_schedules_timezone_chk` | `is_valid_timezone(timezone)` | `scheduling.ts:93` |
| `class_instances` | `class_instances_state_machine_chk` | Compose multi-clause state-machine: (execution_state != COMPLETED OR outcome != PENDING) AND (NOT_ACTIVATED ⇒ actualStartAt NULL) AND (forceActivated ⇒ forceActivatedByUserId NOT NULL) AND (TAKEN ⇒ actualStartAt NOT NULL) AND (isRateOverridden ⇒ rateAmount NOT NULL) | `scheduling.ts:231-240` |
| `class_instances` | `class_instances_reschedule_not_self_chk` | `original_class_id IS NULL OR original_class_id != id` | `scheduling.ts:241-244` |
| `class_instances` | `class_instances_rescheduled_no_quota_chk` | `is_rescheduled = false OR quota_deducted = false` | `scheduling.ts:245-248` |
| `class_instances` | `class_instances_rescheduled_no_complete_chk` | `is_rescheduled = false OR (execution_state != 'COMPLETED' OR outcome != 'TAKEN')` | `scheduling.ts:249-252` |
| `leave_quota_usage` | `leave_quota_usage_teacher_student_xor_chk` | XOR: exactly one of teacher_id/student_id is NOT NULL | `scheduling.ts:334-337` |
| `lesson_reports` | `lesson_reports_completion_percentage_chk` | `completion_percentage BETWEEN 0 AND 100` | `lesson-reports.ts:72-75` |
| `lesson_reports` | `lesson_reports_review_consistency_chk` | (REJECTED ⇒ rejection_reason NOT NULL) AND (APPROVED ⇒ rejection_reason IS NULL) | `lesson-reports.ts:76-79` |
| `class_meeting_configs` | `class_meeting_configs_scope_chk` | XOR: exactly one of class_instance_id / recurring_schedule_id is NOT NULL | `class-meeting-configs.ts:32-38` |

**Convention:** checks live inside the `table => [...]` config array as `check("<table>_<purpose>_chk", sql\`...\`)`. They are used to enforce **invariants the application alone can't guarantee** (state-machine coherence, range bounds, conditional-not-null, XOR scope, timezone validity). Custom SQL functions (`is_valid_timezone`) are available from migration `1-extensions.sql`.

> **Certificate-feature note:** prefer **CHECK constraints** for invariants like `issued_at <= expires_at OR expires_at IS NULL`, `status`-dependent not-null guards, or `status IN (...)` enumerations on `varchar`-columns — replicate the camelCase SQL column references inside ``sql`...` `` exactly as in `class_instances_state_machine_chk`.

---

## 10. Timestamp Conventions

Near-universal pattern across the codebase:
```ts
createdAt: timestamp("created_at", { withTimezone: true, precision: 3 }).notNull(),
updatedAt: timestamp("updated_at", { withTimezone: true, precision: 3 }).notNull(),
```
- **`withTimezone: true`** → `timestamptz`.
- **`precision: 3`** → millisecond precision (almost everywhere).
- For "initialized once" / audit tables, `createdAt` typically carries `.notNull().defaultNow()` (`audit.ts:75`, `communications.ts`, `lesson-reports.ts`, `credit-transactions.ts:26`).
- For mutable tables, `createdAt`/`updatedAt` are **`.notNull()` but WITHOUT `.defaultNow()`** — the application/repository sets them explicitly (e.g. `users.ts:40-41`, `teachers.ts:29-30`, `parents.ts:23-24`).
- **Soft-delete column** when needed: `deletedAt: timestamp("deleted_at", { withTimezone: true, precision: 3 })` (no `notNull`, no default). RLS Strategy A filters on it.
- **Date-only** columns use `date("...")` (`date_of_birth` on teachers; `issue_date`/`due_date`/`paid_date` on invoices; `effective_from`/`effective_until` on schedules).
- **Time-of-day** columns use `time("...")` (`default_start_time`, `start_time`/`end_time` on schedule/availability).
- **Catch tables** (`rate_limit_cache`, `session_cache`, `shared/cache.ts`) use `timestamp("expires_at", { withTimezone: true })` **without precision** (second precision acceptable for cache expiry).
- **Cache tables** use text PKs and timestamptz expiresAt; `rate_limit_cache` is documented UNLOGGED (`shared/cache.ts:5-8`).

> **Certificate-feature note:** follow the dominant convention — `createdAt`/`updatedAt notNull timestamptz(3)` set by the repository, no `defaultNow`; add `deletedAt` if soft-delete RLS is desired. Snapshot/issuance timestamps (e.g. `issued_at`, `expires_at`) should be timestamptz(3) notNull.

---

## 11. Index Patterns

### 11.1 Standard btree index
Default `index("<table>_<col>_idx").on(table.col)` — virtually every FK column, status enum, and timestamp has one. Naming: `<table>_<col>_idx` (sometimes `<table>_<col1>_<col2>_idx` for composites). Some嶝 use a bare `idx_<table>_<purpose>` prefix (notably students: `idx_students_name_fts`, `idx_students_filter_mobile`).

### 11.2 Unique index (Drizzle `uniqueIndex`)
- Unique constraint SQL-side mirrors TS `.unique()` on column (`email`, `slug`, `user_id`, `token`).
- **Idempotency-guard unique indexes** on `idempotency_key` columns: `invoices`, `payments`, `credit_transactions`, `class_instances`, `lesson_reports`.
- **Composite unique indexes**: `(studentId, classInstanceId)` (`student_progress`), `(groupClassId, studentId)` (`group_class_enrollments`), `(subjectId, learningResourceId)` (`subject_resources`).
- **Tuple uniqueness** for join tables is implemented either via `primaryKey({columns: [...]})` (group_permissions, user_permission_groups, user_permission_overrides, invoice_coverage_months) or `uniqueIndex(...).on(a,b)`.

### 11.3 Partial unique indexes (the "one X per scope" idiom)
Heavily used; expressed as `uniqueIndex(...).on(...).where(sql\`...\`)`:
- `impersonation_sessions_one_active_per_actor` ... `WHERE is_active = true` (`impersonation.ts:30-32`)
- `user_payment_methods_payin_default_idx` / `_payout_default_idx` ... `WHERE is_default = true AND direction IN (...)` (`user-payment-methods.ts:42-47`)
- `class_instances_original_class_uniq_idx` ... `WHERE original_class_id IS NOT NULL AND deleted_at IS NULL` (`scheduling.ts:228-230`)
- `class_instances_frozen_idx` / `_rescheduled_idx` ... partial indexes on truthy boolean (`scheduling.ts:207-208`) — **non-unique partial indexes** for hot-path filtered scans
- `leave_quota_teacher_period_idx` / `leave_quota_student_period_idx` ... `WHERE teacher_id IS NOT NULL` / `student_id IS NOT NULL` (`scheduling.ts:327-332`)
- Meeting configs: `*_one_default_<scope>_idx` built via helper functions (`meeting/__shared__/meeting-config-indexes.ts`)
- `suggestions_active_created_at_idx` ... `WHERE deleted_at IS NULL` (`communications.ts:221`) — partial index for hot reads of non-deleted rows

> **Reusable idiom:** "at most one default/config per scope" ⇒ partial unique index `WHERE <is_default> = true AND <scope_col> IS NOT NULL` — exactly the helper exported in `meeting-config-indexes.ts`. A certificate "primary credential per student" or "one active certificate per category" rule should reuse this.

### 11.4 GIN full-text index
- `idx_students_name_fts` → `.using("gin", sql\`to_tsvector('simple', ${table.name})\`)` (`students.ts:78`) — backed by the FTS `fullTextSearch()` helper in `query.extensions.ts:28` (sanitizes + prefix `:*` + AND `&` join).
- Extensions `pg_trgm` enabled by `1-extensions.sql`.

### 11.5 GiST trigram index
- `idx_students_name_trgm` → `.using("gist", table.name.op("gist_trgm_ops"))` (`students.ts:79`) — fast fuzzy `ILIKE`/similarity on student names.

### 11.6 Composite / pagination indexes
- `students_pagination_idx` on `(createdAt, id)` — cursor pagination (`students.ts:88`).
- Several `(status, ...)` and `(entity_type, entity_id, ...)` composite indexes (audit, notifications, class instances).
- `idx_students_filter_mobile` on `(status, primaryTeacherId, dateOfBirth)` — domain-tuned multi-filter read path.

### 11.7 Other index types / behaviors
- No explicit GIN-on-jsonb indexes observed (jsonb is read but not indexed via GIN), though pg_trgm/GIN are available.
- `saltedIndexes` not used (indexes are conventional).

---

## 12. Repository & Query Conventions (supporting layer)

- `backend/db/repo/` — repository layer (out of scope), receives a `DBTransaction` or `queryDb()` handle.
- `queryDb<T>(tx?)` (`drizzleDb.ts:58`) — repository read handle resolves: passed tx (transactional safety) → Neon HTTP singleton (stateless) → pooled `db`.
- **Soft deletes** are enforced via `SoftDeleteRepository` (sets session var `app.soft_delete='true'` and UPDATEs `deleted_at` — never a hard DELETE because RLS `DELETE ... USING (false)` blocks it).
- `fullTextSearch()` + `escapeLikeWildcards()` (`db.utils.ts:7`) — search helpers reused across repositories.
- **Idempotency keys** are a first-class column (`idempotency_key varchar(255) notNull`) on every financial/mutating flow (invoices, payments, credit_transactions, class_instances, lesson_reports), each paired with a unique index — designed for safe retries / async pipelines.

---

## 13. Summary: Conventions the Certificate Feature MUST Follow

| Concern | Adopted Siraj convention |
|---|---|
| **Table location** | `backend/db/schema/certificates/certificates.ts` (+ any sub-tables); barrel `certificates/index.ts`; add `export * from "./certificates"` in `schema/index.ts` |
| **PK** | `id: uuid("id").defaultRandom().primaryKey()` (universal; exceptions: lookup tables with code/serial/text PKs) |
| **FKs** | `.references(() => referenced.id, { onDelete })` — choose `cascade` (owned child), `set null` (optional soft link), or `restrict` (must-not-delete parents) |
| **Enums** | Define TS enum in `backend/enum/<domain>/`, register `createPgEnumFromEnum("..._enum", X)` in `schema/enums.ts`; import from `enums` (not inline) unless truly local-only |
| **Timestamps** | `createdAt`/`updatedAt` `timestamptz(3) notNull` (no `defaultNow`, repository sets); `deletedAt` only if soft-delete RLS desired |
| **Invariants** | `check("<table>_<purpose>_chk", sql\`...\`)`, mirroring `class_instances_state_machine_chk` for status/conditional-null logic |
| **Uniqueness per scope** | partial unique index via helper `meetingConfigOneDefault*ScopeIndex` (or replicate) |
| **File attachments** | per-entity junction table `certificate_files` mirroring `invoice_files`/`class_instance_files` |
| **Encrypted secrets** | `encryptedText("...")` custom type (e.g. for cert signing keys) |
| **TLS/jsonb snapshots** | `jsonb("...").$type<MySnapshotType>()` for serialized snapshots (e.g. issuer/snapshot of certificate) |
| **Localized strings** | `jsonb("name").$type<LocalizedString>()` for any i18n labels |
| **RLS** | new file `backend/db/migration/certificates_rls_policies.sql` — `ALTER TABLE ... ENABLE + FORCE ROW LEVEL SECURITY`; use `current_user_id()` + parent/teacher subqueries; if soft-delete, follow the 4-policy template in `soft_delete_rls_policies.sql` |
| **Relations** | add `certificates`/`certificate*` entries in `drizzleRelations.ts`'s single `defineRelations(schema, r => ({ ... }))` block |
| **Idempotency** | `idempotencyKey: varchar("idempotency_key", { length: 255 }).notNull()` + `uniqueIndex(...)` if mutating via async/external flows |
| **At least one index per FK + status + timestamps** | matching `<table>_<col>_idx` |
| **Migration generation** | add `pgTable` → run CLI option 3 (`drizzle-kit generate --ignore-conflicts`) → write custom SQL in `backend/db/migration/` as needed (auto-bundled) → CLI option 5 (`bun db migrate`). Custom SQL files MUST be idempotent. |

---

### Quick file-path cheat sheet (for the certificate plan)
- Drizzle config: `/home/ahmed/Projects/siraj-cert/drizzle.config.ts`
- Schema barrel: `/home/ahmed/Projects/siraj-cert/backend/db/schema/index.ts`
- Enum registry: `/home/ahmed/Projects/siraj-cert/backend/db/schema/enums.ts`
- Custom type: `/home/ahmed/Projects/siraj-cert/backend/db/schema/custom-types.ts`
- Relations: `/home/ahmed/Projects/siraj-cert/backend/db/drizzleRelations.ts`
- DB client / queryDb: `/home/ahmed/Projects/siraj-cert/backend/db/drizzleDb.ts`
- Driver factory: `/home/ahmed/Projects/siraj-cert/backend/db/factory.ts`
- Connection strategy: `/home/ahmed/Projects/siraj-cert/backend/db/connection-strategy.ts`
- Neon HTTP client: `/home/ahmed/Projects/siraj-cert/backend/db/http-client.ts`
- Migration orchestrator: `/home/ahmed/Projects/siraj-cert/backend/db/scripts/migrate.ts`
- Drizzle migrator: `/home/ahmed/Projects/siraj-cert/backend/db/scripts/runDrizzleMigrations.ts`
- Custom-bundler: `/home/ahmed/Projects/siraj-cert/backend/db/scripts/applyCustomMigrations.ts`
- Idempotency transformer: `/home/ahmed/Projects/siraj-cert/backend/db/scripts/ensureIdempotentMigrations.ts`
- Hand-written SQL migrations: `/home/ahmed/Projects/siraj-cert/backend/db/migration/`
- Generated migrations: `/home/ahmed/Projects/siraj-cert/backend/drizzle/`
- DB CLI entry: `/home/ahmed/Projects/siraj-cert/scripts/dbActions/index.ts` + `actions.ts` + `cli.ts`
- "One default per scope" helpers: `/home/ahmed/Projects/siraj-cert/backend/db/schema/meeting/__shared__/meeting-config-indexes.ts`
- Shared meeting columns: `/home/ahmed/Projects/siraj-cert/backend/db/schema/meeting/__shared__/meeting-config-columns.ts`
- Enum helper: `/home/ahmed/Projects/siraj-cert/backend/utils/db.utils.ts`
- FTS / pagination helpers: `/home/ahmed/Projects/siraj-cert/backend/db/query.extensions.ts`
- LocalizedString type: `/home/ahmed/Projects/siraj-cert/shared/types/localized-string.ts`
- Field encryption (for `encryptedText`): `/home/ahmed/Projects/siraj-cert/backend/lib/field-encryption.ts`

---

**Note on file creation:** I was unable to write this document to `/home/ahmed/Projects/siraj-cert/.ai/draft_plans/cert/siraj_analysis/01-db-schema-patterns.md` because my operating rules prohibit using shell redirection, heredocs, or any other mechanism to write files (file-writing is reserved; my mandated output channel is response text only). To produce the deliverable, please copy the markdown above into that exact path. The directory already exists — I created it during the analysis step.