# Backend Architecture Pattern

This document outlines the standard architectural pattern used throughout the backend for defining and managing entity types consistently across all layers.

## Standard Type Definition Pattern

The backend follows a consistent pattern for defining and using types across all layers:

### 1. Database Schema (`backend/db/schema/*.ts`)
- Define the database table structure using Drizzle ORM
- Example: `{entityTable}` table in `backend/db/schema/{location}.ts`

### 2. Type Definitions (`backend/types/*.types.ts`)
- Define TypeScript types using Drizzle's `$inferSelect` and `$inferInsert`
- Create custom input/output types with appropriate transformations
- Define specialized types for different use cases (e.g., `{Entity}SubmitInput`, `{Entity}ReturnType`)
- Example: `{Entity}SelectType`, `{Entity}InsertType`, `{Entity}SubmitInput`, `{Entity}ReturnType` in `backend/types/{entity}.types.ts`

### 3. Repository Layer (`backend/db/repo/*repository.ts`)
- Use types defined in `backend/types/` for function parameters and return types
- Focus solely on data access operations
- Apply business logic constraints at the service layer, not in repositories
- Example: Using `{Entity}InsertType` for insert operations and `{Entity}SelectType` for select operations in `{entity}.repository.ts`
- **Neon HTTP Client for Bare Reads**: All non-transactional read methods in database repositories MUST use `queryDb(tx)` from `@/backend/db`. See `docs/drizzle/neon-http-client.md`.
- **Prepared Statements**: Simple read-only methods executing on TCP mode may use Drizzle Prepared Statements 2.0 (`sql.placeholder(...)`) defined at module level. Module-level prepared statements MUST be removed if replaced by `queryDb(tx)`. See `docs/drizzle/prepared-statements.md`.
- **Batch Lookup Methods**: Repositories that support DataLoader batching MUST expose `findBy{Key}Ids(ids: string[], tx?)` methods returning `Map<string, T | null>`. Use `inArray(column, ids)` with plain arrays. See `docs/graphql/dataloader-batching.md`.

### 4. Service Layer (`backend/services/**/*.ts`)
- Import and use types from `backend/types/` for function signatures
- Handle business logic, permissions, and orchestration
- Perform data transformations as needed between types
- Example: Using `{Entity}SubmitInput` for input validation and `{Entity}ReturnType` for output in `{entity}.service.ts`
- **Batch Service Methods**: Services called from GraphQL resolvers MUST expose batch versions (e.g., `resolveTeacherIdsForUsers(userIds: string[])`) returning `Map<string, T | null>` for DataLoader support. See `docs/graphql/dataloader-batching.md`.
- **Hot-Resolver & Read Caching**: Hot read paths use `cachedRead` from `@/backend/services/cache` with identity+role-scoped key formats. Mutation write paths invoke tag invalidation helpers in `try/catch`. See `docs/services/entity-cache-service.md`.
- **Cron Service**: Scheduled job execution with pluggable queue backends (pg-boss, custom-sql, bullmq). Uses hybrid trigger model (Vercel ticker + manual trigger). See `docs/services/cron-service.md` for the complete pattern reference.

### 5. GraphQL Layer (`backend/graphql/pothos/*.pothos.ts`)
- Reference types from `backend/types/` for Pothos object implementations
- Create Pothos input and object types that map to backend types
- Maintain consistency between GraphQL types and backend service types
- Example: Using `{Entity}ReturnType` for the GraphQL `{Entity}` object in `{entity}.pothos.ts`
- **DataLoader Batching**: All field resolvers that call services per-parent-object MUST use `t.loadable()` or `loadableObject` to eliminate N+1 queries. See `docs/graphql/dataloader-batching.md`.

### 6. Test Layer (`backend/db/test/repo/*.test.ts`)
- Import and use the same types from `backend/types/` for consistent testing
- Verify that repository functions return expected type structures
- Example: Using `{Entity}SelectType` and `{Entity}ReturnType` in `{entity}.repository.test.ts`

## Single Canonical Object Type Pattern (CRITICAL RULE)

### Positive Pattern (Required):
- Each entity should have a single canonical GraphQL object type that represents the complete entity structure
- Use types from `backend/types/` as the foundation for GraphQL object types
- Allow GraphQL clients to request only the fields they need through field selection
- Add resolved properties (joins, computed values) to the canonical type as needed

### Negative Pattern (PROHIBITED):
- Creating multiple GraphQL object types for the same entity when one canonical type would suffice
- Defining local type definitions within Pothos files (e.g., `export type {Entity}Definition = {...}`)
- Duplicating entity structure in local types instead of using centralized types from `backend/types/`
- Creating ad-hoc types like `export type <Entity>SimpleDefinition`

## Key Benefits

- **Consistency**: Types are defined once and reused across all backend layers
- **Maintainability**: Changes to entity structure only require updates in one place (the type definition file)
- **Type Safety**: Full type safety across all layers using the same definitions
- **Clarity**: Clear separation of concerns with well-defined interfaces between layers
- **Reduced Duplication**: No need to redefine entity structures multiple times across layers
- **GraphQL Efficiency**: Single canonical types allow for flexible field selection by clients

## Best Practices

- Always define types in `backend/types/{entity}.types.ts` when creating new entities
- Import types using the alias `@/backend/types` consistently
- Use Drizzle's `$inferSelect` and `$inferInsert` as the foundation for your types
- Create specialized variations (input types, return types) as needed for different use cases
- Follow the naming convention: `{Entity}SelectType`, `{Entity}InsertType`, `{Entity}ReturnType`, `{Entity}SubmitInput`, etc.
- Use a single canonical GraphQL object type per entity, extending it with resolved properties as needed
- Never create local type definitions in Pothos files; always use types from `backend/types/`

## Important References

- `docs/services/meeting-providers.md` - Meeting provider adapter/factory pattern reference (auto URL generation for Zoom, Google Meet, Microsoft Teams)

## WhatsApp Cloud API Integration

- **Canonical reference**: `docs/services/whatsapp-cloud-api.md` — covers the full integration (adapter, factory, webhook, dispatch, schema, opt-in, frontend).
- **Schema**: `backend/db/schema/whatsapp-accounts.ts` — `whatsapp_accounts` table with `encryptedText` columns for credentials, `varchar` for raw Meta tier enums (no local mapping), `isActive` for soft delete (no `deletedAt`).
- **Permissions**: `WHATSAPP_VIEW`, `WHATSAPP_CONFIG_MANAGE`, `WHATSAPP_TEMPLATES_MANAGE` (no `WHATSAPP_DISPATCH` in v1 — no send mutation).
- **Migrations**: Two-phase (enum ALTER TYPE + data INSERT) with idempotent `IF NOT EXISTS` / `ON CONFLICT` clauses.
- **Partial unique index**: `notification_deliveries_provider_message_id_unique WHERE provider_message_id IS NOT NULL` (B5) — enables P3 ON CONFLICT upsert by `provider_message_id`.

## Quota System (Billing Domain)

The Quota System is an append-only ledger-based class credit tracking system. See `docs/billing/quota-system.md` for the complete architecture reference. Key rules for backend code interacting with quotas:

### Ledger & Cached Columns

- **Single Writer**: Only `QuotaRepository` writes to `quota_ledger` and updates `quotas` cached columns (`remaining`, `reservedClasses`, `usedThisPeriod`). No other code — including `CreditService`, `state-changes.ts`, or recurring-class flows — directly modifies quota columns. All quota state changes go through `QuotaService` → `QuotaRepository`.
- **Ledger Transaction**: Ledger inserts and cache updates MUST share the same Drizzle transaction (`tx`). Idempotency keys are checked within the same tx.
- **Foreign Key Constraint**: `quota_ledger.quotaId` uses `ON DELETE RESTRICT`. Quotas cannot be hard-deleted while ledger entries exist — use soft-delete (`deletedAt`) or archive.

### FIFO Selection

- Always use `QuotaRepository.selectQuotaForBookingFIFO` for automatic quota assignment. Sorts by priority DESC, then validUntil ASC.
- Idempotency keys: All ledger writes require a deterministic idempotency key (SHA-256). See `QuotaRepository` for the 6 key derivation helpers.

### Permissions

- `QUOTAS_VIEW` (`"quotas.view"`) — read access to quotas, balances, ledger
- `QUOTAS_MANAGE` (`"quotas.manage"`) — create, update, delete, manage reservations
- All `QuotaService` methods gate on these via `requireManagePermission` / `requireViewPermission`

### Integration Points

- `AvailabilityService`: slot availability checks that integrate with `class_instances`
- `RecurringClassService`: `cancelSchedule` + `switchSchedulingMode` interact with `QuotaService`
- `CreditService`: after any credit change, call `QuotaService.refreshStudentOndemandInstances(studentId, tx)` in same transaction
- `Notification`: 7 quota event types registered in `NotificationEventCategory` + `NOTIFICATION_EVENT_CATEGORY`

### Testing

- Always use `runInRollback` wrapper for DB tests involving quotas
- Always pass `tx` to ALL repository methods inside transactions
- Race condition tests for quota reservation/redeem are NOT yet implemented


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
