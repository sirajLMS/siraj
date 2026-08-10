# Backend Enum Layer

## Purpose

This directory contains all backend enum definitions, organized by domain. Each sub-directory groups related enum files and ships its own `index.ts` barrel. This mirrors the sub-directory layout of the `backend/types/` layer.

## Layout

```
backend/enum/
├── index.ts             (top-level barrel — re-exports every sub-directory)
├── AGENTS.md            (this file)
│
├── shared/              cross-cutting reference data (country, currency, timezone, pagination)
├── auth/                authentication enums
├── users/               user + user-device-token enums
├── permissions/         permission + permission-group enums
├── billing/             billing enums
├── books/               book enums
├── classes/             class-instance-detail, group-class, dst-migration enums
├── scheduling/          scheduling + schedule enums
├── parents/             parent + suggestions enums
├── profiles/            profile-audience / scope / mode enums
├── students/            student-lifecycle enums
├── teachers/            teacher-availability enums
├── notifications/       notification-delivery enums
└── complaints/          complaint enums
```

Each sub-directory contains its own `index.ts` barrel that re-exports every `*.enum.ts` file in that sub-directory. The top-level `backend/enum/index.ts` re-exports every sub-directory barrel.

## Rules

### Backend-Only
- Enums in this directory are **backend-only**.
- Frontend code must use GraphQL codegen enums from `@/frontend/common/graphql/generated/gql/graphql-types` instead of importing from `@/backend/enum`.
- Shared layer code (`shared/`) must not import from `@/backend/enum` — shared code is used by both frontend and backend. Define cross-layer enums in `shared/constants/` instead; see `shared/AGENTS.md`.

### Import Convention
- Prefer deep imports: `import { StudentStatus } from "@/backend/enum/students/student-lifecycle.enum"`.
- The barrel `index.ts` is available for convenience but deep imports are preferred (same pattern as `backend/types/`).

### File Organization
- One file per logical domain, grouped under the matching sub-directory.
- Related enums in the same domain go in the same file (e.g., `InvoiceStatus`, `InvoiceType`, `PaymentMethod` in `billing/billing.enum.ts`).
- Const objects like `ALLOWED_STATUS_TRANSITIONS` live alongside their related enum in the domain file.
- File naming follows the convention `backend/enum/<subdir>/<entity>.enum.ts` (e.g. `backend/enum/users/user.enum.ts`).

### Adding New Enums
1. Identify the appropriate sub-directory (or create a new one following the sub-directory convention).
2. Add the enum to the matching `<entity>.enum.ts` file in that sub-directory (create a new file if needed).
3. If a new file was created, add `export * from "./<entity>.enum";` to the sub-directory's `index.ts`.
4. If a new sub-directory was created, add `export * from "./<subdir>";` to the top-level `backend/enum/index.ts`.
5. If the enum should be exposed via GraphQL, register it in `backend/graphql/pothos/shared/enum.pothos.ts` and run codegen.


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
