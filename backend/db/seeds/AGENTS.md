# Backend Database Seeds Layer

## Purpose

This directory contains all idempotent data seeders for local/development database bootstrapping. Each `seed-<entity>.ts` file exports a `seedOrGet(...)` function that returns either newly-inserted or existing records. Files are grouped by domain, mirroring the `backend/db/repo/`, `backend/types/`, `backend/enum/`, and `backend/graphql/` sub-directory layouts.

## Layout

```
backend/db/seeds/
├── index.ts             (master controller — orchestrates the seed order and `SeedContext`)
├── AGENTS.md            (this file)
│
├── lib/                 Shared factories + helpers (admin-user, faker, orchestrateSeedMany, schedule-factory, …)
├── assets/              Static JSON / image seed assets (unchanged)
│
├── shared/              cross-cutting reference data + coverage verifier (system-settings, timezones, verify-coverage)
├── auth/                user-permission-overrides (auth-coupled seed)
├── users/               seed-users, seed-user-device-tokens
├── audit/               seed-admin-audit-logs, seed-audit-logs
├── teachers/            seed-teachers, seed-teacher-availability-windows, seed-teacher-recurring-unavailability,
│                        seed-teacher-vacation-requests, seed-teacher-banking-details-history, seed-teacher-payments,
│                        seed-leave-requests, seed-leave-quota-usage
├── parents/             seed-parents, seed-suggestions
├── students/            seed-students, seed-student-progress, seed-student-status-history
├── classes/             seed-classes, seed-class-instances, seed-class-performance, seed-class-status-events,
│                        seed-group-classes, seed-group-class-enrollments, seed-class-communications,
│                        seed-dst-migration-runs, seed-dst-migration-entries, seed-recurring-schedule-days
├── billing/             seed-currency-exchange-rates, seed-currency-exchange-audit-logs, seed-currency-hedges,
│                        seed-invoices, seed-invoice-coverage-months, seed-payments
├── notifications/       seed-user-notification-preferences, seed-notification-deliveries
├── complaints/          seed-complaints, seed-complaint-responses
└── storage/             seed-learning-resources, seed-site-content
```

Each domain sub-directory contains its own `index.ts` barrel that re-exports each `seedOrGet` under a domain-qualified alias (e.g. `export { seedOrGet as seedOrGetTeachers } from "./seed-teachers";`). The top-level `backend/db/seeds/index.ts` master controller is the **only** file that imports individual seeders — it now imports them via the sub-directory paths (e.g. `@/backend/db/seeds/teachers/seed-teachers`) or, equivalently, the sub-directory barrel aliases.

## Rules

When creating or updating a seeder in this directory, you must adhere to the following rules:

### FORBIDDEN: System permissions (CRITICAL)

**Do not seed system permissions from this directory.** Rows in `permissions`, `permission_groups`, and `group_permissions` are owned exclusively by SQL under `backend/db/migration/` and applied via drizzle migrations under `backend/drizzle/`.

- **Never** insert/upsert into `permissions`, `permission_groups`, or `group_permissions` from a seeder
- **Never** call `PermissionManagementService.upsertSystemPermissions`, `ensureSystemPermissionGroup`, `ensureGroupPermissionsForGroups`, or `revokeGroupPermissions` from seeders
- New permission keys, system groups (`student_default`, `supervisor_default`, etc.), or group grants → add SQL under `backend/db/migration/` **and** a new drizzle migration folder under `backend/drizzle/`
- Seeders **may** assign users to existing groups (`user_permission_groups`) and seed `user_permission_overrides` (per-user overrides only)
- Demo student / supervisor logins come from `shared/demo-users.ts` → `seed-users.ts`; student domain rows from `students/seed-students.ts`. Groups must already exist from migrations before `seed-users` runs.

### Standard seeder rules

- **"seed or get" Pattern**: Every seeder MUST export a function named `seedOrGet`.
- **One Seeder per Table**: Every table must have its own dedicated seeder file (e.g. `seed-classes.ts`, `seed-class-instances.ts`). Do not combine distinct domains.
- **Idempotency**: The `seedOrGet` function must be safely runnable multiple times. Use look-before-create in the seeder (`orchestrateSeedMany` or explicit checks), then service bootstrap methods that handle duplicates (`onConflictDoUpdate`, `onConflictDoNothing`, or race recovery).
- **Return Value**: The function should return the seeded or retrieved entities. This allows other seeders to use those entities without querying the database again.
- **Dependencies via Controller Context**: If your seeder depends on data seeded by another seeder, the results should be passed from the master seeder controller (`index.ts`) through context, calling that seeder's `seedOrGet` function or accepting it as a parameter.

This ensures that we avoid duplicating data (such as permission groups or users) even if seeders are run multiple times.

- **Check Constraints**: Ensure your seeded data respects database-level `CHECK` constraints (e.g. `class_instances_state_machine_chk`). Check `backend/db/schema/*.ts` for these constraints to prevent seeding failures.
- **Enums Verification**: PostgreSQL enums must be matched EXACTLY. Check the `backend/db/schema/enums.ts` or `shared/lib/enum.ts` for the correct values (e.g., using `"ACTIVATED"` or `"REGULAR"` instead of `"ACTIVE"`). Do not guess valid statuses.
- **Schema Synchronization**: If you modified the database schema during your task (e.g. adding a column like `avatar_url`), you MUST run `bun run db push` to apply changes to the local database before running `bun run db seed`. Drizzle kit config (`drizzle.config.ts`) points at `./backend/db/schema/index.ts`, which resolves every table via the sub-directory barrels — no config change needed when adding sub-directories. **Note: `db reset` and `db cleanGenerate` are permanently disabled by repo policy** — use `db push` for schema changes and `db migrate` for migration management.
- **Type Safety**: Seeders do not query the database directly. Use canonical types from `@/backend/types` for entities passed between seeders and returned from services. If a type is missing, add it under `backend/types/` (one type file per domain) rather than using inline types or `any`. For many-row idempotent inserts, use `orchestrateSeedMany` from `@/backend/db/seeds/lib` with service `find*` / `list*` + `createMany*` / `upsert*` methods.

### File Organization
- Group seeders for the same domain in the matching sub-directory.
- File naming: `backend/db/seeds/<subdir>/seed-<entity>.ts` (e.g. `backend/db/seeds/teachers/seed-teachers.ts`).
- The pre-existing `lib/` and `assets/` directories are **not** part of this domain grouping — `lib/` holds shared factories and helpers imported by all seeders via `@/backend/db/seeds/lib`; `assets/` holds static seed data files.

### Adding New Seeders
1. Identify the matching sub-directory (or create a new one following the sub-directory convention).
2. Create `seed-<entity>.ts` in that sub-directory; expose `export async function seedOrGet(...) { ... }`.
3. Add `export { seedOrGet as seedOrGet<Entity> } from "./seed-<entity>";` to the sub-directory's `index.ts`.
4. Add the import + orchestration call to `backend/db/seeds/index.ts` (the master controller) so the new seeder runs in the correct dependency order.
5. If a new sub-directory was created, also add its `index.ts` barrel.

## Service-Only Data Access (CRITICAL)

Seeders **must not** import from `@/backend/db/**` (schema, repo, drizzleDb, migrations). ESLint enforces this via `no-restricted-imports` on `backend/db/seeds/**/*.ts`.

### Allowed imports in seeders

| Layer | Path pattern | Purpose |
|-------|--------------|---------|
| Services | `@/backend/services/**` | All database writes and reads |
| Seed lib | `@/backend/db/seeds/lib` | Factories, config, `seedOrGet` helpers |
| Types | `@/backend/types` | Entity shapes returned to the controller |
| Enums | `@/backend/enum/**` | Seed data constants |
| Storage bootstrap | `@/backend/storage/demo/**` | Physical file seeding only (no DB) |

### Forbidden in seeders

- `@/backend/db/drizzleDb`, `@/backend/db/schema/**`, `@/backend/db/repo/**`
- Direct `drizzle-orm` queries against application tables
- `batchInsert` (moved to `@/backend/db/repo/shared/bulk-upsert` — use service bootstrap methods instead)

When a bootstrap method is missing on a service, **add it to the service** (and repository if needed) rather than querying the DB from the seeder.

## Stable Key Registry

Use these service bootstrap entry points from seeders. Domain seed data (constants, specs) stays in the seeder or `lib/*-factory.ts`; persistence goes through services.

| Seeder domain | Service | Bootstrap method(s) |
|---------------|---------|---------------------|
| `auth/seed-user-permission-overrides` | `PermissionManagementService` | `ensureUserPermissionOverride` |
| `audit/seed-audit-logs` | `AuditService` | `countAuditLogs`, `listAuditLogs`, `createManyAuditLogs` |
| `audit/seed-admin-audit-logs` | `AuditService` | `countAdminAuditLogs`, `listAdminAuditLogs`, `createManyAdminAuditLogs` |
| `complaints/seed-complaints` | `ComplaintService` | `createManyComplaints` |
| `complaints/seed-complaint-responses` | `ComplaintService` | `ensureComplaintResponse` |
| `notifications/seed-user-notification-preferences` | `NotificationPreferencesService` | `upsertManyPreferences` |
| `notifications/seed-notification-deliveries` | `CommunicationService` | `createManyDeliveries` |
| `parents/seed-suggestions` | `SuggestionService` | `createManySuggestions` |
| `storage/seed-learning-resources` | `LearningResourceService` | `findByFilePath`, `insertResource` |
| `storage/seed-site-content` | `StorageService` | `upsertManySiteContent` |
| `meeting/seed-meeting-providers` | `MeetingProviderCatalogService` | `upsertManyProviders` |
| `shared/timezones` | `ReferenceDataService` | `upsertManyTimezones` |
| `shared/system-settings` | `SystemSettingsService` | `upsertManySettings`, `uploadHandbook`, `uploadParentHandbook` |
| File attachments | `StorageService` (via `lib/file-seed-helper`) | `linkFileToEntity` |

### Shared lib exports

- `orchestrateSeedMany` — idempotent many-row seeding helper (re-exported from `lib/index.ts`); coordinates look-before-create and duplicate-key race recovery via services
- `batchInsert` — **removed**; bulk inserts live in `@/backend/db/repo/shared/bulk-upsert` and are called from service bootstrap methods, not seeders

## Phased execution (`runSeedStep`)

`backend/db/seeds/index.ts` wraps each domain step with `runSeedStep` from `lib/run-seed-step.ts`. Failed steps are logged and collected in `context.failedSteps`, then passed to `verifySeedCoverage(failedSteps)` so coverage reporting distinguishes empty tables from earlier step failures.

## Asset checkpoint

- Manifest: `lib/asset-manifest.ts`
- Validator: `bun run validate:seed-assets` (also runs automatically in `backend/db/scripts/drizzleSeed.ts` for `standard` profile)
- Skip gate: `SEED_SKIP_ASSET_CHECK=true`
- Prompts for human-generated assets: `backend/db/seeds/prompts/`

## Additional bootstrap registry entries

| Seeder | Service | Bootstrap method(s) |
|--------|---------|---------------------|
| `books/seed-books` | `BookService` | `findBooksByNames`, `upsertManyBooks` |
| `classes/seed-class-categories` | `ClassCatalogService` | `findCategoriesBySlugs`, `upsertManyCategories` |
| `classes/seed-class-subjects` | `ClassCatalogService` | `findSubjectsBySlugs`, `upsertManySubjects` |
| `classes/seed-class-instances` | `ClassSessionService` | `upsertManyClassInstancesForSeed` |
| `classes/seed-subject-resources` | `ClassCatalogService` | `createManySubjectResources` |
| `meeting/seed-user-meeting-configs` | `MeetingConfigService` | `upsertManyUserMeetingConfigs` |
| `meeting/seed-class-meeting-configs` | `MeetingConfigService` | `upsertManyClassMeetingConfigs` |
| `teachers/seed-teacher-important-notes` | `TeacherNotesService` | `findNotesByTitles`, `createManyImportantNotes` |
| `billing/seed-invoice-payment-submissions` | `BillingManagementService` | `findInvoicePaymentSubmissionsByInvoiceIds`, `createManyInvoicePaymentSubmissions` |
| `billing/seed-quotas` | `QuotaService`, `ClassCatalogService`, `RecurringClassService` | `seedOrGetQuotaBatch`, `findSubjectsBySlugs`, `upsertManyRecurringSchedules` |

### Avatar and logo helpers

- `lib/avatar-seed-helper.ts` — `seedAvatarForEntity`, `seedAvatarPool`, `linkAvatarsToEntities`
- `lib/logo-seed-helper.ts` — `seedCatalogLogoUrl` for meeting/payment/subject branding assets
- `lib/class-catalog-factory.ts` — canonical specs for books, categories, subjects, and subject-resource links


## Oxlint Rules (CRITICAL — NO `oxlint-disable` comments allowed)

Oxlint is the project's linter (`bun run oxlint`). It uses type-aware mode (`typeAware: true`, `typeCheck: true` in `oxlint.config.mts`). NEVER add `oxlint-disable` comments — fix the root cause instead.

### no-unsafe-type-assertion (STRICT — stricter than ESLint)

Oxlint's `no-unsafe-type-assertion` rule flags ALL `as Type` assertions that narrow from a wider type to a narrower one. **`as unknown as Type` (double assertion) does NOT bypass this rule.**

**Use type guards instead of `as`:**
```ts
// WRONG — flagged by oxlint
const record = value as Record<string, unknown>;
const error = caught as Error;
const row = result as EntitySelectType;

// RIGHT — type guard (not flagged)
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
const record = isRecord(value) ? value : {};

// RIGHT — instanceof for errors
if (error instanceof Error) return error;
throw new Error(String(error));

// RIGHT — find() with widening cast for enum narrowing
const match = Object.values(SomeEnum).find(v => (v as string) === value);
// `(v as string)` is a widening cast (safe, not flagged)
```

**For Drizzle pgEnum columns** (inferred as `string` not the enum type):
- Add `.$type<EnumType>()` to the column definition in the schema to fix at source
- OR use type guards: `function isStatus(value: string): value is Status { return (Object.values(Status) as readonly string[]).includes(value); }`

**For `response.json()` (returns `any`):**
- Type the variable: `const data: SomeType = await response.json();`
- OR use a type guard: `const data: unknown = await response.json(); if (!isSomeType(data)) throw ...;`

### no-await-in-loop

`await` inside `for`, `while`, `do...while`, `for...of` loops is flagged.

**Use `Promise.all` for independent iterations:**
```ts
// WRONG
for (const item of items) { await process(item); }

// RIGHT — parallel
await Promise.all(items.map(item => process(item)));
```

**Use recursive helper for sequential iterations (shared transactions, ordered timestamps):**
```ts
async function processNext(index: number): Promise<void> {
  if (index >= items.length) return;
  await process(items[index]);
  return processNext(index + 1);
}
await processNext(0);
```

**Use `reduce` chain as alternative:**
```ts
await items.reduce(async (prev, item) => {
  await prev;
  return processOne(item);
}, Promise.resolve());
```

**`for await...of` is NOT flagged** (async iterable iteration).

**DO NOT parallelize when:** iterations share a DB transaction connection, each depends on the previous result, or ordering matters (e.g., sequential timestamps for pagination tests).

### consistent-function-scoping

Functions defined inside another function that don't capture any variables from the enclosing scope should be at module scope.

```ts
// WRONG — doesn't capture anything from parent
function component() {
  const helper = (x: string) => x.toUpperCase(); // flagged
  return helper("test");
}

// RIGHT — moved to module scope
const helper = (x: string) => x.toUpperCase();
function component() {
  return helper("test");
}
```

### no-object-type-as-default-prop

React component default props must not be object/array literals (re-created every render, breaks referential equality).

```ts
// WRONG
function Component({ options = {} }: Props) { ... }
function Component({ items = [] }: Props) { ... }

// RIGHT — stable module-level reference
const DEFAULT_OPTIONS = {};
const DEFAULT_ITEMS: readonly ItemType[] = [];
function Component({ options = DEFAULT_OPTIONS, items = DEFAULT_ITEMS }: Props) { ... }
```

### no-underscore-dangle

Identifiers with leading underscores are flagged. Fix by renaming, or use bracket notation for external API fields:

```ts
// WRONG
const value = obj._ref;
function _helper() { ... }

// RIGHT — rename
const value = obj.ref;
function helper() { ... }

// RIGHT — bracket notation for external API fields (not flagged)
const refKey = "_ref";
const value = obj[refKey];
// OR: const { _ref } = obj; (destructuring not flagged)
```

### no-unsafe-enum-comparison

Comparing values of different enum types (or enum vs string) is flagged.

```ts
// WRONG — enum vs string
if (row.status === SomeEnum.VALUE) { ... }

// RIGHT — both sides as string
if (String(row.status) === String(SomeEnum.VALUE)) { ... }
// OR use string literals
if (row.status === "VALUE") { ... }
// OR use Set-based lookup
const VALID_STATUSES = new Set(Object.values(SomeEnum) as string[]);
if (VALID_STATUSES.has(row.status)) { ... }
```

### no-shadow

Variable names shadowing an outer scope variable are flagged. Fix with destructuring rename or `_` prefix for unused params:

```ts
// WRONG
const studentHref = "...";
function Card({ studentHref }: Props) { ... } // shadows

// RIGHT — destructuring rename
function Card({ studentHref: href }: Props) { ... }

// RIGHT — unused param prefix (config: argsIgnorePattern: "^_")
async function test(_tx: DBTransaction) { ... }
```

### consistent-return

Functions must consistently return values or not return values (no mixing `return value` and `return;`).

```ts
// WRONG — mixes void and value returns
function getStatus(active: boolean) {
  if (active) return "ACTIVE";
  return; // void return — flagged
}

// RIGHT — consistent value returns
function getStatus(active: boolean) {
  if (active) return "ACTIVE";
  return undefined; // or return null;
}
```

**Config override exists** for `useEffect` callbacks (false positives — the rule doesn't understand React cleanup patterns). Already configured in `oxlint.config.mts`.

### Config Overrides (legitimate — NOT `oxlint-disable`)

The `oxlint.config.mts` has `overrides` for:
- **Test files**: `@typescript-eslint/unbound-method: "off"` (false positive for mock function references)
- **`useEffect` files**: `@typescript-eslint/consistent-return: "off"` (false positive for cleanup callbacks)
- **Logger/scripts**: `no-console: "off"` (intentional console usage)

These are config-level overrides, NOT inline `oxlint-disable` comments.
