# Shared GraphQL Documents Rules

## Layout

GraphQL documents are organized **by domain** into sub-directories, each with an `index.ts` barrel that re-exports its `.documents.ts` files. The top-level `index.ts` re-exports all sub-directory barrels.

```
frontend/common/graphql/sharedDocuments/
├── AGENTS.md             ← this file
├── index.ts              ← re-exports all sub-directory barrels
├── profile.documents.test.ts  ← co-located test (exception: stays at top level)
│
├── auth/                 auth
├── billing/              billing-alerts, billing-management, user-billing-profile, fx-ingestion
├── classes/              group-class, class-category, class-subject
├── complaints/           complaint
├── meeting/              meeting
├── notifications/        notification-alerts, notification-preferences
├── parents/              parent-directory, parent-documents, parent-dashboard, parent-profile,
│                         parent-billing-history, parent-onboarding, parent-portal
├── permissions/          permission-management
├── profile/              profile
├── reports/              report
├── resources/            learning-resource, books-and-bags
├── scheduling/           schedule, schedule-deletion, weekly-schedule, recurring-class,
│                         availability-search, dst-migration, class-session
├── shared/               test-helper, translation
├── students/             student, student-directory, student-history, student-lifecycle,
│                         student-status, student-onboarding, student-profile
├── suggestions/          suggestion
├── supervisor/           supervisor-dashboard
└── teachers/             teacher, teacher-dashboard, teacher-notes, teacher-onboarding,
                          teacher-portal, staff-profile, staff-directory, manager-onboarding
```

### Barrel pattern

Each sub-directory has an `index.ts` that re-exports its documents:

```ts
export * from "./schedule.documents";
export * from "./weekly-schedule.documents";
// ...
```

The top-level `index.ts` re-exports sub-directory barrels:

```ts
export * from "./scheduling";
export * from "./teachers";
// ...
```

### Consumer import conventions

| Use case | Import pattern |
|---|---|
| **Preferred** (barrel) | `import { fooQueryDocument } from "@/frontend/common/graphql/sharedDocuments";` |
| **Deep import** (also valid) | `import { fooQueryDocument } from "@/frontend/common/graphql/sharedDocuments/<subdir>/foo.documents";` |
| **Never** (stale flat path) | `import { … } from "@/frontend/common/graphql/sharedDocuments/foo.documents";` ← broken after refactor |

Both barrel and deep-import paths resolve to the same exports. Prefer the barrel (`@/frontend/common/graphql/sharedDocuments`) in views/hooks unless you need to avoid pulling in the full barrel tree.

When adding a **new** document file:
1. Create `<domain>.documents.ts` in the matching sub-directory.
2. Add `export * from "./<domain>.documents";` to that sub-directory's `index.ts`.
3. Ensure the sub-directory is exported from the top-level `index.ts` (add `export * from "./<subdir>";` if it's a new sub-directory).
4. Run `bun run generate:gqlSchema && bun codegen`.
5. Document any new sub-directory under **Layout** above.

## File Naming
- One file per domain: `<domain>.documents.ts` (e.g., `auth.documents.ts`, `schedule.documents.ts`)
- Place files in the matching sub-directory; export all documents from the top-level `index.ts` via sub-directory barrels.

## Import Pattern
Always import from `"@apollo/client"` — **never** from `"@apollo/client/core"`:

```ts
import { gql, type TypedDocumentNode } from "@apollo/client";
import type * as Types from "@/frontend/common/graphql/generated/gql/graphql-types";
import type * as Operations from "@/frontend/common/graphql/generated/gql/operations";
```

## TypedDocumentNode Convention
The naming follows a strict, predictable pattern derived from the operation name:

| Operation | Const name | TypedDocumentNode type |
|---|---|---|
| `query <entityName>` | `{entityName}QueryDocument` | `TypedDocumentNode<Operations.{EntityName}Query, Types.Query{EntityName}Args>` |
| `mutation <entityName>` | `{entityName}MutationDocument` | `TypedDocumentNode<Operations.{EntityName}Mutation, Types.Mutation{EntityName}Args>` |

**Rules:**
- Query const: `<camelCaseName>QueryDocument` → `TypedDocumentNode<Operations.<PascalCaseName>Query, Types.Query<PascalCaseName>Args>`
- Mutation const: `<camelCaseName>MutationDocument` → `TypedDocumentNode<Operations.<PascalCaseName>Mutation, Types.Mutation<PascalCaseName>Args>`
- No-arg queries: omit the second type parameter → `TypedDocumentNode<Operations.{EntityName}Query>`
- These types are **always** available after `bun run generate:gqlSchema && bun codegen` — **never** use inline type literals

## Codegen
After modifying any `.documents.ts` file or any backend schema/pothos file, always run:
```bash
~/.bun/bin/bun run generate:gqlSchema
~/.bun/bin/bun codegen
```

## `id` Field Requirement
Every query/mutation selection set **must** include the `id` field on every named object type so Apollo Client can auto-update its cache.

## Frontend Client Queries and Hook Usage
- **NO Lazy Queries**: Do NOT use `useLazyQuery`. It is banned in this project. Use stateful `useQuery` exclusively, which automatically tracks data, loading, and error states.
- **Imports**: Always import Apollo hooks from `"@apollo/client/react"` (e.g., `import { useQuery, useApolloClient } from "@apollo/client/react";`).


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
