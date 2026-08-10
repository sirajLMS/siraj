# Backend Database Logic Tests

## Purpose

This directory contains **business-logic** integration tests that run against a live PostgreSQL instance inside rolled-back transactions. Tests here verify cross-cutting behaviour that a single repository cannot capture on its own: state-machine transitions, security/RLS enforcement, concurrency & quota races, encryption/column constraints, audit/immutability guarantees, soft-delete integrity, and orchestration across multiple repositories + services.

Files are grouped by domain, mirroring the `backend/db/test/repo/`, `backend/db/repo/`, `backend/types/`, `backend/enum/`, `backend/graphql/`, and `backend/db/seeds/` sub-directory layouts.

## Layout

```
backend/db/test/logic/
├── AGENTS.md            (this file)
│
├── shared/              cross-cutting infra + integrity tests
│                        audit-immutability, audit-trail, cache_split_routing, concurrency,
│                        column-encryption, hours-recalc, ip-format, poly-integrity, rls,
│                        soft_delete_security, session-scalability, permissions_rls
├── auth/                auth-rate-limit, auth_rate_limit_enforcement, impersonation-sessions, password-reset-token
├── parents/             parent_directory
├── students/            student-pagination-stability, student_progress, student_status_history, student_status_transition
├── teachers/           teacher_availability, teacher_banking_history, teacher_banking_verification, teacher_profile
├── scheduling/          class_instances_overlap, class_instances_security, class_quota_race, class_rescheduling,
│                        class_teacher_integrity, leave_quota, scheduling_security
├── billing/             billing-safeguards, exchange-rate, invoice-restriction, payment-idempotency
├── notifications/       notification_delivery_tracking, notification_preferences
├── audit/               audit-immutability, audit-trail           (audit-domain logic tests; shared/* holds cross-cutting ones)
├── timezone/            timezone_dst, timezone_validation
└── permissions/         permissions_rls, permission-management.service.test
```

## Rules

All rules from the parent `backend/db/test/AGENTS.md` apply here (transaction rollbacks, `runInRollback`, try/catch error helper pattern, `bun:test`, no `any`, no hardcoded error strings). The sub-directory layout is the only addition; rules are restated for convenience.

### Mandatory Test Patterns
- **`runInRollback`**: Every database test MUST run inside `runInRollback` (imported from `@/backend/db/test/test-utils` or `../../test-utils`). Pass the `tx` instance to **every** repository method AND Drizzle query — mixing `tx` queries with `db`-backed repo calls causes deadlocks.
- **No `expect(...).rejects.toThrow()` inside `runInRollback`** — use a try/catch helper (e.g. `expectRepoError` / `expectRepositoryError`) and assert on `.toContain()` with a translated-message substring, not the raw translation key.
- **Clean Setup Helpers**: Use helpers from `@/backend/db/test/entity-setup` (or `../../entity-setup`) — `createTestUser`, `createTestTeacher`, `setupTestEntities`, etc. Generate unique emails / IDs via `randomUUID()` or prefixed strings to avoid unique-constraint violations.
- **Bun Test**: Use `import { describe, test, it, expect, beforeAll, afterAll } from "bun:test"` — never Jest/Vitest.
- **Strict Type Safety**: No `as any` overrides. No `console.log` — use `testLogger` or no logging.
- **Code Cleanliness**: Run `bun tsgo` and lint via the queue client after creating or modifying tests (`curl -s -X POST http://localhost:${LINT_QUEUE_PORT}/lint -H "Content-Type: application/json" -d '{"id":"db-logic","files":["<file>"]}'`). Fix all resulting TS6133 unused-import / unused-variable errors.

### Import Convention
- **Aliased imports for parent helpers** (preferred): `import { runInRollback } from "@/backend/db/test/test-utils";` and `import { setupTestEntities } from "@/backend/db/test/entity-setup";`. Aliased paths are unchanged by sub-directory moves, so prefer them over relative references.
- **Relative imports allowed**: `import { runInRollback } from "../../test-utils";` also works. If you use relative paths, remember that sub-directory files are **one level deeper** than the old flat layout — parent helpers are now at `../../entity-setup` and `../../test-utils`.
- Respository / service / type / schema / enum imports use the standard `@/` aliases: `import { TeacherRepository } from "@/backend/db/repo";`, `import { teachers, users } from "@/backend/db/schema";`, `import { TeacherBankingDetailsHistorySelectType } from "@/backend/types";`, `import { StudentStatus } from "@/backend/enum";`.
- Intra-domain sibling imports (rare in `test/logic/`) use relative paths: `import { testRepoError } from "./scheduling-test-helpers";`.

### File Organization
- Group related business-logic tests for the same domain in the matching sub-directory.
- File naming follows the existing convention (mixed `_` and `-` are tolerated for legacy file names): `backend/db/test/logic/<subdir>/<scenario>.test.ts` (e.g. `backend/db/test/logic/scheduling/class_quota_race.test.ts`).
- The pre-existing `backend/db/test/repo/` directory holds repository **unit** tests (one repo per file); this `logic/` directory holds **cross-repo / cross-service** tests. Don't duplicate coverage between them.
- Cross-cutting tests that don't fit any single domain (RLS, cache routing, encryption, concurrency, audit immutability across tables) live in `shared/`. Domain-specific audit tests live in `audit/`. Domain-specific permission RLS tests can live either in `permissions/` (permission-table-centred) or in the relevant domain subdir (e.g. `scheduling/scheduling_security.test.ts`) — both are acceptable; pick the one that matches the table the test primarily asserts against.

### Adding New Tests
1. Identify the matching sub-directory (or create a new one following the sub-directory convention).
2. Create `<scenario>.test.ts` in that sub-directory.
3. No `index.ts` barrel is needed — test files are not imported by other code; the test runner discovers them by glob (`backend/db/test/logic/**/*.test.ts`). Sub-directories exist purely for organisation.
4. If a new sub-directory is created, document it in this `AGENTS.md` under **Layout**.
5. Follow the verification loop: `bun tsgo` + `bun biome:check` + lint queue client for new/modified test files before considering the test done.


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
