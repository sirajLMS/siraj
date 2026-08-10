# Backend GraphQL Query Layer

## Purpose

This directory contains the GraphQL **query** root-field definitions (Pothos `queryField`/`queryType` registrations). Each `.query.ts` file registers one or more root query fields by delegating to the `backend/services/` layer. Files are grouped by domain, mirroring the `backend/graphql/pothos/` and `backend/enum/` sub-directory layout.

## Layout

```
backend/graphql/query/
├── index.ts             (top-level barrel — side-effect-imports every sub-directory)
├── AGENTS.md            (this file)
│
├── shared/              cross-cutting query helpers (e.g. intl)
├── auth/                authentication queries
├── billing/             billing queries
├── classes/             class queries (class-category, class-session, …)
├── scheduling/          scheduling + availability-search queries
├── teachers/            teacher queries (teacher, teacher-dashboard, teacher-portal)
├── parents/             parent queries (parent-portal, parent-dashboard, parent-directory)
├── students/            student queries (student, student-history, student-status)
├── notifications/       notification queries (notification-alerts, notification-preferences)
├── storage/             storage queries
└── profile/             profile queries
```

Each sub-directory contains its own `index.ts` barrel that side-effect-imports every `*.query.ts` file in that sub-directory. The top-level `backend/graphql/query/index.ts` imports every sub-directory barrel.

## Rules

### Side-Effect Imports Only
- `gqlSchema.ts` imports this layer exactly once: `import "@/backend/graphql/query";`.
- The top-level barrel and every sub-directory barrel use **side-effect imports** (`import "./x.query";`) — these files have no named exports; they register root fields on `gqlSchemaBuilder` at import time.
- A `.query.ts` file MUST NOT be imported directly from outside this directory. To add a new query, create a `*.query.ts` file in the matching sub-directory and add a side-effect import to that sub-directory's `index.ts`.

### Resolver Delegation
- Field resolvers delegate to the `backend/services/` layer — never to repositories directly and never with inline business logic. See the root `backend/graphql/AGENTS.md` for the full rules (locale propagation, localized errors, Apollo cache `id` exposure, type-definition pattern).

### Import Convention
- Use `@/` aliased imports for cross-layer dependencies (services, types, pothos objects, enums). E.g. `import { TeacherService } from "@/backend/services/teacher";`, `import { TeacherPothosObject } from "@/backend/graphql/pothos/teachers/teacher.pothos";`.
- Within the same sub-directory, prefer relative imports for sibling query files (rare — usually none).

### File Organization
- Group related root queries for the same domain in the same sub-directory.
- File naming: `backend/graphql/query/<subdir>/<entity>.query.ts` (e.g. `backend/graphql/query/teachers/teacher.query.ts`).
- Do not place Pothos object/enum/input type definitions here — those live in `backend/graphql/pothos/<subdir>/`. Query files only register root `queryField`s and their resolvers.

### Adding New Queries
1. Identify the matching sub-directory (or create a new one following the sub-directory convention).
2. Create `<entity>.query.ts` in that sub-directory; register the root field(s) on `gqlSchemaBuilder`.
3. Add `import "./<entity>.query";` to the sub-directory's `index.ts`.
4. If a new sub-directory was created, add `import "./<subdir>";` to the top-level `backend/graphql/query/index.ts`.
5. Run `bun run generate:gqlSchema` then `bun codegen` to refresh the GraphQL schema and frontend types.


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
