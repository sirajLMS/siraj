# Backend Database Repository Layer

## Purpose

This directory contains Drizzle ORM repository classes — the **only** layer that touches the database directly. Each `.repository.ts` file exposes a `namespace` of pure data-access functions (no business logic, no permission checks). Files are grouped by domain, mirroring the `backend/graphql/`, `backend/types/`, and `backend/enum/` sub-directory layouts.

## Layout

```
backend/db/repo/
├── index.ts             (top-level barrel — re-exports every sub-directory)
├── AGENTS.md            (this file)
│
├── shared/              cross-cutting infra: cache, ratelimit, session, signedUrl, soft-delete, system-settings
├── audit/               audit trail
├── auth/                impersonation (auth-related)
├── users/               user
├── permissions/         permission-management
├── billing/             billing
├── books/               book, report
├── classes/             class-category, class-performance, class-subject, group-class, dst-migration, subject-resource
├── scheduling/          scheduling (nested sub-package, pre-existing — has its own internal layout)
├── parents/             parent, suggestion
├── students/            student, student-history
├── teachers/            teacher, teacher-availability, teacher-banking, teacher-notes, staff-profile
├── notifications/       notification, notification-preferences
├── complaints/          complaint, complaint-response
├── storage/             storage, learning-resource
└── utils/               repo-internal helpers
```

Each sub-directory (except `scheduling/` and `utils/` which pre-date this refactor and have their own internal barrels) contains its own `index.ts` barrel that re-exports every `*.repository.ts` file in that sub-directory. The top-level `backend/db/repo/index.ts` re-exports every sub-directory barrel.

## Rules

- **Neon HTTP Client for Bare Reads (CRITICAL)**: All non-transactional read methods in database repositories MUST use `queryDb(tx)` from `@/backend/db`. When Neon HTTP mode is eligible, reads execute statelessly over HTTP POST; when `tx` is passed or HTTP mode is disabled, it falls back seamlessly to transaction/TCP handles. See `docs/drizzle/neon-http-client.md` for complete architecture, rules, and examples.
- **Prepared Statements (CRITICAL)**: Simple read-only repository methods that execute on TCP mode may use Drizzle Prepared Statements 2.0 (`sql.placeholder(...)`) defined at module level. Module-level prepared statements MUST be removed if replaced by `queryDb(tx)` on non-tx read branches. See `docs/drizzle/prepared-statements.md` for the complete pattern reference.
- **`inArray` + Prepared Statements PROHIBITED**: Queries using `inArray(column, sql.placeholder("ids"))` MUST NOT use prepared statements. PostgreSQL's prepared statement protocol treats `$1` as a single scalar — it cannot expand array parameters for `IN` clauses. Use dynamic queries (`db.select()...where(inArray(col, ids))`) instead. This is a PostgreSQL protocol limitation, not a Drizzle bug.
- **Batch Lookup Methods for DataLoader**: Repositories that support GraphQL DataLoader batching MUST expose batch lookup methods (e.g., `findByUserIds(userIds: string[], tx?)`) returning `Map<string, T | null>`. Use `inArray(column, ids)` with a plain array (NOT `sql.placeholder`). Pre-initialize the map with all requested keys mapped to `null`, then fill in matches from query results. See `docs/graphql/dataloader-batching.md`.
- **Query Guidelines**: When `findMany` with complex relations creates `SQL<unknown>` errors or TypeScript property missing errors, revert to standard `.select().from().leftJoin()` or manual ID-based mapping. This is the required pattern for this environment to avoid type resolution issues.
- **Separation of Concerns**: Repositories are strictly for data access. Business logic, permission checking, and complex orchestration must reside in the `backend/services/` layer.
- **No Hardcoded Error Strings**: Repositories must not contain hardcoded user-facing error strings, messages, or warnings. Instead, use `getServerTranslations(locale, "<namespace>")` from `@/shared/locale/server-graphql` (optionally accepts a `locale?: string` parameter) to look up localized message templates. The legacy `getBackendTranslations` helper is deprecated and must not be used.
- **Conditional Aggregation**: When performing conditional aggregation (e.g., `CASE WHEN` with `SUM`/`COUNT`), Drizzle does not provide a native query builder DSL. Instead, use the `sql` template literal with generic typing (e.g., `sql<number>`) and chain `.mapWith(Number)` to cast returned values safely to JavaScript numbers. Avoid raw database-specific casts (like `CAST(... AS INTEGER)`) in SQL.
- **Type Definition Pattern**: Repository functions should use types defined in `backend/types/` (e.g., `{Entity}SelectType`, `{Entity}InsertType`) rather than directly referencing schema types. Define input/output types in the corresponding `backend/types/<subdir>/<entity>.types.ts` files using Drizzle's `$inferSelect` and `$inferInsert` types with custom transformations as needed.

### Import Convention
- Consumers of repositories import from the top-level barrel: `import { TeacherRepository } from "@/backend/db/repo";` or via the `Repository` namespace. This keeps move/refactor churn contained to the barrel.
- Deep imports (`@/backend/db/repo/teachers/teacher.repository`) are also valid for cases that need a specific repo and want to avoid pulling in transitive side-effects; the top-level barrel is the recommended entry point.
- Within a `.repository.ts` file, use `@/` aliases for cross-layer dependencies (types, schema, sibling repositories) — relative imports only for siblings in the same sub-directory.

### File Organization
- Group related repositories for the same domain in the same sub-directory.
- File naming: `backend/db/repo/<subdir>/<entity>.repository.ts` (e.g. `backend/db/repo/teachers/teacher.repository.ts`).
- One `namespace` per repository file — the namespace name is the canonical export `{Entity}Repository`.
- Pre-existing nested sub-packages (`scheduling/scheduling-queries.repository/`, `utils/`) keep their internal structure; only the top-level `scheduling/index.ts` barrel is re-exported here.

### Adding New Repositories
1. Identify the matching sub-directory (or create a new one following the sub-directory convention).
2. Create `<entity>.repository.ts` in that sub-directory; expose a `export namespace <Entity>Repository { ... }`.
3. Add `export * from "./<entity>.repository";` to the sub-directory's `index.ts`.
4. If a new sub-directory was created, add the sub-directory re-export to the top-level `backend/db/repo/index.ts`.
5. Wired types live in `backend/types/<subdir>/<entity>.types.ts`; wired GraphQL exposure lives in `backend/graphql/pothos/<subdir>/`.

## Meeting Provider Tokens (`meeting_provider_tokens`)

- **Encrypted storage (CRITICAL)**: The `meeting_provider_tokens` table uses the `encryptedText` custom Drizzle type (from `backend/db/schema/custom-types`) for both `access_token` and `refresh_token` columns. The `MeetingProviderTokenRepository` (`backend/db/repo/meeting/meeting-provider-token.repository.ts`) handles encryption/decryption transparently — never write plaintext tokens to a side table or log them.
- **Unique constraint**: A unique index on `(userId, providerSlug)` ensures one token row per user per provider. Use `upsert` (not manual insert-or-update) to respect this constraint.
- **Reads via `queryDb(tx)`**: Non-transactional reads (`getByUserAndProvider`, `listByUser`, `listByProvider`) use `queryDb(tx)` per the Neon HTTP Client pattern. See `docs/drizzle/neon-http-client.md`.
- **Refresh-token rotation**: Zoom rotates refresh tokens on every exchange. After `refreshAccessToken` (`backend/services/meeting/integrations/token-refresh.ts`) succeeds, the service layer calls `upsert` with the rotated `refresh_token` value. Never assume the stored refresh token is still valid after a refresh.
- **Scope column**: Per-user OAuth tokens carry a `scope` text column for auditing which scopes were granted at consent time. adapters compare it against the required scope set and throw `InsufficientScopesError` when missing.
- See `docs/services/meeting-providers.md` for the complete adapter/factory pattern reference.

## Append-Only Ledger Pattern (Quota)

The Quota System uses an **append-only ledger** pattern in `quota_ledger`. See `docs/billing/quota-system.md` for the full reference. Key repo-level rules:

### Write Pattern

- **Every quota mutation writes a ledger row + updates cache columns in the SAME transaction** (`tx`). No ledger entry without a cache update, no cache update without a ledger entry.
- **Idempotency first**: Before inserting a ledger row, check for existing entry with the same `idempotencyKey` (SHA-256). If found, return the existing row — do NOT insert a duplicate.
- **Cache columns are snapshot only**: `remaining`, `reservedClasses`, `usedThisPeriod` on `quotas` are denormalized snapshots. The ledger is always the authoritative source. Use `computeBalance` to reconstruct truth from ledger.

### idempotency Key Derivations

All keys follow the pattern `"quota-{operation}:{unique-segment}:..."` hashed with SHA-256. Helper functions in `quota.repository.ts`:
- `deriveGrantIdempotencyKey(quotaId)`
- `deriveRedeemIdempotencyKey(classInstanceId, quotaId)`
- `deriveReserveIdempotencyKey(recurringScheduleId, quotaId)`
- `deriveReleasePoolIdempotencyKey(classInstanceId, quotaId)`
- `deriveReleaseEarmarkIdempotencyKey(scheduleId, instanceId, quotaId)`
- `deriveExpireIdempotencyKey(quotaId, periodString)`

### FIFO Object Selection

`selectQuotaForBookingFIFO(studentId, tx?)`: filters ACTIVE quotas, sorts by priority DESC → validUntil ASC, returns the first with `remaining > 0`.

### Foreign Key Constraint

`quota_ledger.quotaId` → `quotas.id` uses `ON DELETE RESTRICT`. Hard-deleting a quota while ledger entries exist will fail. Use soft-delete (`deletedAt`) or archive ledger entries first.


## Billing Repository Factory (Duplication Elimination)

Billing repositories (supported-online-accounts, supported-mobile-wallets, supported-payment-links) share identical CRUD/list/deactivate/query structure. Use `makeBillingRepo<TRow, TSelect, TInsert, TUpdate, TFilters>()` from `__shared__/billingRepoFactory.ts`. Entity-specific insert defaults (e.g., `identifierLabel ?? name`) go in the `prepareInsert` hook — NOT in the factory. See `docs/backend/billing-repo-factory.md` for the complete pattern reference.

## Schema Helpers (Duplication Elimination)

Schema tables sharing identical column configurations (timestamps, slugs, active flags) or junction table patterns use helpers from `__shared__/columnHelpers.ts` and `__shared__/junctionTableHelper.ts`. See `docs/backend/schema-helpers.md` for the complete pattern reference.

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
