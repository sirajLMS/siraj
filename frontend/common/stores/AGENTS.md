# Frontend Stores Layer Rules

- **Zustand**: We use Zustand for global state management.
- **Strict Typing**: Stores should be strictly typed using the GraphQL generated types (e.g., import `User` from `graphql-types.ts`). Avoid redefining types if they exist in the GraphQL schema.
- **Direct Assignment**: Solve TypeScript errors by adjusting the GraphQL schema or queries to align with the frontend types. Do NOT create complex intermediate mapping functions or map manually if it can be avoided by simply relying on the exact typed structure from Codegen.
- **Import Types from `graphql-types.ts`**: Import generated entity TYPES from `graphql-types.ts`, NOT `operations.ts`:
  ```ts
  import type * as Types from "@/frontend/common/graphql/generated/gql/graphql-types";  // ✅ CORRECT — has all type definitions
  import type * as Operations from "@/frontend/common/graphql/generated/gql/operations"; // ✅ CORRECT — only for operation result/variable types
  // ❌ WRONG — do NOT import entity types from operations.ts; it has poorer type definitions
  ```
  - `graphql-types.ts` has the complete and canonical type definitions (enums, interfaces, input types, etc.)
  - `operations.ts` is only for operation-specific result/variable types (e.g., `DeleteBookMutationMutation`)
  - Zustand stores and other type consumers: always prefer `graphql-types.ts` for entity types

## Person Autocomplete options cache

- `userAutocompleteStore` caches **fetched options only** (by audience + search + scope), not selection.
- Page/domain stores (or RHF) hold the **selected** `PersonOption` / id.
- In-memory LRU (no `persist`) — survives SPA navigation and tier switch; refresh refetches.

## Serialization

- **Non-serializable values**: Never store `File`, `Blob`, `FormData`, `Promise`, or other non-JSON-serializable values in `persist`-enabled Zustand stores. `JSON.stringify(new File(...))` produces `{}`, destroying the value on rehydration.
- **Three mitigation strategies** (choose one):
  1. **Non-persisted store**: Create the store without `persist` middleware. State survives tier switch (in-memory) but not page refresh — acceptable for `File` objects since browsers don't let you restore them across refresh anyway.
  2. **`partialize` exclusion**: Use `partialize` in the `persist` config to exclude non-serializable fields. Example: `partialize: (state) => ({ ...state, selectedFile: undefined })` — persist only serializable metadata (e.g., `documentName`), accept that the file must be re-selected on hard refresh.
  3. **`useRef` in ViewModel hook**: Keep `File` objects in a `useRef` inside the `useXxViewModel()` hook (the hook lives above the tier-switch unmount boundary, so the ref survives). Store only serializable metadata in Zustand.
- **ViewModel hook for `File`**: The recommended pattern for file uploads is option 3 — keep `File` in a `useRef` in the ViewModel hook, store `documentName` (string) in Zustand.
- **ESLint enforcement**: No automated enforcement yet; developers must follow this rule. Add a manual review check in `plan-review` skill for stores using `persist`.
- **Cross-reference**: See `frontend/views/AGENTS.md` (ViewModel Pattern), `.agents/instructions/mobile-desktop.instructions.md`.

## Serialization

### Non-serializable values

- Never store `File`, `Blob`, `FormData`, `Promise`, or other non-JSON-serializable values in `persist`-enabled Zustand stores. `JSON.stringify(new File(...))` produces `{}`, destroying the value on rehydration.

### Three mitigation strategies (choose one)

1. **Non-persisted store**: Create the store without `persist` middleware. State survives tier switch (in-memory) but not page refresh — acceptable for `File` objects since browsers don't let you restore them across refresh anyway.
2. **`partialize` exclusion**: Use `partialize` in the `persist` config to exclude non-serializable fields. Example: `partialize: (state) => ({ ...state, selectedFile: undefined })` — persist only serializable metadata (e.g., `documentName`), accept that the file must be re-selected on hard refresh.
3. **`useRef` in ViewModel hook**: Keep `File` objects in a `useRef` inside the `useXxViewModel()` hook (the hook lives above the tier-switch unmount boundary, so the ref survives). Store only serializable metadata in Zustand.

### ViewModel hook for `File`

- The recommended pattern for file uploads is option 3 — keep `File` in a `useRef` in the ViewModel hook, store `documentName` (string) in Zustand.

### ESLint enforcement

- No automated enforcement yet; developers must follow this rule. Add a manual review check in `plan-review` skill for stores using `persist`.

### Cross-reference

- See `frontend/views/AGENTS.md` (ViewModel Pattern), `.agents/instructions/mobile-desktop.instructions.md`.


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
