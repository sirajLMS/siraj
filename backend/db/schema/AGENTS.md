# Backend Database Schema Layer (Drizzle)

## Purpose

This directory contains all Drizzle ORM table definitions for the PostgreSQL database. Each `.ts` file defines one or more `pgTable(...)` definitions (and their relations) for a specific domain. Files are grouped by domain, mirroring the `backend/db/repo/`, `backend/types/`, `backend/enum/`, `backend/graphql/`, and `backend/db/seeds/` sub-directory layouts.

## Layout

```
backend/db/schema/
├── index.ts             (top-level barrel — re-exports every sub-directory + shared top-level files)
├── enums.ts             (shared enum registry — stays top-level, imported by every domain file)
├── custom-types.ts      (shared custom Drizzle column types — stays top-level)
├── AGENTS.md            (this file)
│
├── shared/              cache, settings, timezones                       ← cross-cutting infra + reference data
├── auth/                impersonation
├── users/               users
├── permissions/         permissions
├── audit/               audit
├── teachers/            teachers, teacher-availability, teacher-banking, teacher-notes, staff
├── parents/             parents
├── students/            students
├── classes/             class-category, class-subject, group-class, subject-resource, scheduling
├── books/               books
├── billing/             billing, fx-sync
├── communications/     communications
└── storage/             storage, site-content
```

Each sub-directory contains its own `index.ts` barrel that re-exports every `*.ts` table-definition file in that sub-directory. The top-level `backend/db/schema/index.ts` re-exports every sub-directory barrel **plus** the top-level `enums` and `custom-types` modules that are shared across every domain file.

## Rules

- **Drizzle ORM Only**: All table definitions use `pgTable(...)` from `drizzle-orm/pg-core`. No raw SQL DDL.
- **One Table per Domain File**: Group related tables in the same domain file. Distinct domains live in distinct files (e.g. `teachers/teacher-banking.ts` vs. `teachers/teacher-notes.ts`).
- **Shared Top-Level Files**: `enums.ts` (the single registry for every Drizzle enum-color value) and `custom-types.ts` (shared custom Drizzle column types like `localizedText`, `jsonb` helpers) stay **top-level** under `backend/db/schema/` — they're imported by nearly every domain table file and by `enums.ts` consumers across the repo. Do not move them into a sub-directory.
- **Enum Verification**: PostgreSQL enums must be matched EXACTLY. Check `backend/db/schema/enums.ts` or `shared/lib/enum.ts` for the correct values (e.g. using `"ACTIVATED"` or `"REGULAR"` instead of `"ACTIVE"`). Do not guess valid statuses.
- **Schema Synchronization**: After schema edits, run `bun run db push` (or `bun run scripts/dbActions.ts push`) to apply changes to the local database before running `bun run db seed`. Drizzle kit config (`drizzle.config.ts`) points at `./backend/db/schema/index.ts`, which resolves every table via the sub-directory barrels — no config change needed when adding sub-directories. **Note: `db reset` and `db cleanGenerate` are permanently disabled by repo policy** — use `db push` for schema changes and `db migrate` for migration management.

### Import Convention
- Consumers (`backend/db/repo/`, services, types, seeds, graphql) import tables via the top-level barrel: `import { teachers, users, auditLogs } from "@/backend/db/schema";`. This keeps move/refactor churn contained to the barrel.
- Deep imports (`@/backend/db/schema/teachers/teacher-banking`) are also valid for cases that need a specific table and want to avoid pulling in the whole schema graph; the top-level barrel is the recommended entry point.
- Within a `.ts` schema file, use `@/` aliases for cross-domain table references or for shared top-level modules (e.g. `import { classInstancesState } from "@/backend/db/schema/enums";`). Relative imports only for siblings in the same sub-directory.
- The cross-directory enum registration pattern still holds: TypeScript `enum` definitions live in `backend/enum/<subdir>/`; Drizzle enum-color values live in `backend/db/schema/enums.ts`; the GraphQL registration lives in `backend/graphql/pothos/shared/enum.pothos.ts`. See `backend/graphql/AGENTS.md` for the full pattern.

### File Organization
- File naming: `backend/db/schema/<subdir>/<entity>.ts` (e.g. `backend/db/schema/teachers/teacher-banking.ts`).
- Default-export names follow Drizzle conventions: `export const teachers = pgTable("teachers", { ... });`.
- Relationships go in the same file as the owning table or in a dedicated relations file inside the same sub-directory if they get large.

### Adding New Tables
1. Identify the matching sub-directory (or create a new one following the sub-directory convention).
2. Create `<entity>.ts` in that sub-directory; expose `export const <entity> = pgTable(...)`.
3. Add `export * from "./<entity>";` to the sub-directory's `index.ts`.
4. If a new sub-directory was created, add `export * from "./<subdir>";` to the top-level `backend/db/schema/index.ts`.
5. If the table needs new enum values, register them in `enums.ts` and the corresponding `backend/enum/<subdir>/` enum, then run `bun run generate:gqlSchema` and `bun codegen` if the table is exposed via GraphQL.


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
