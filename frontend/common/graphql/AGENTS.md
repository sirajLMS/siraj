# Frontend GraphQL & Apollo Layer Rules

## Framework
- We use Apollo Client with GraphQL for data fetching and state management on the frontend.
- Generated types are created using GraphQL Code Generator and stored in `frontend/common/graphql/generated/gql/`.

## Document Organization
- GraphQL documents (queries, mutations, subscriptions) are organized by domain in `frontend/common/graphql/sharedDocuments/`
- Each domain has its own file named `<domain>.documents.ts` (e.g., `auth.documents.ts`, `schedule.documents.ts`)
- All documents are exported from `frontend/common/graphql/sharedDocuments/index.ts`

## Type Safety
- All GraphQL operations must be strongly typed using generated types from `frontend/common/graphql/generated/gql/`
- Use `TypedDocumentNode` with proper typing: `TypedDocumentNode<Operations.QueryType, Types.QueryArgsType>`
- Follow the standardized naming convention for document constants as outlined in `frontend/common/graphql/sharedDocuments/AGENTS.md`

## Code Generation
- After modifying any GraphQL documents or backend schema, run:
  ```bash
  bun run generate:gqlSchema
  bun codegen
  ```
- This regenerates all typed operations and types for consistent frontend-backend integration

## Apollo Client Usage
- Use the shared Apollo Client instance configured in `frontend/common/graphql/`
- Import Apollo hooks from `"@apollo/client/react"` (e.g., `import { useQuery, useApolloClient } from "@apollo/client/react";`)
- Include `id` fields in all query selections for proper Apollo cache normalization
- Avoid `useLazyQuery` - use stateful `useQuery` exclusively for consistent loading/error state management

## Integration Testing
- GraphQL integration tests are located in `frontend/common/graphql/test/`
- Follow the testing rules documented in `frontend/common/graphql/test/AGENTS.md`
- Use the shared test client and lifecycle management for proper test execution

## Document Structure
- Organize queries and mutations by functional domain
- Use descriptive names that align with backend GraphQL operations
- Maintain consistency with backend naming patterns for easier maintenance

## Type Usage Patterns

### Positive Pattern (Required):
- Use generated types from the backend with generic patterns: `Operations.{Entity}Query`, `Types.Query{Entity}Args`
- Follow the standardized naming convention for document constants generically: `<entityName>QueryDocument`, `<entityName>MutationDocument`
- Apply consistent patterns across all entities without creating ad-hoc type definitions

### Negative Pattern (Prohibited):
- Creating custom inline type definitions instead of using generated types
- Defining custom types that duplicate the functionality of generated operations
- Hardcoding type names instead of following the established naming patterns

### Example of Proper Pattern:
```typescript
// Use generic naming patterns that apply to any entity
const {entityName}QueryDocument = gql`
  query {EntityName}($id: String!) {
    {entityName}(id: $id) {
      id
      # ... other fields
    }
  }
` as TypedDocumentNode<Operations.{EntityName}Query, Types.Query{EntityName}Args>;

// Or for mutations
const {entityName}MutationDocument = gql`
  mutation {EntityName}Mutation($input: {EntityName}Input!) {
    {entityName}(input: $input) {
      id
      # ... other fields
    }
  }
` as TypedDocumentNode<Operations.{EntityName}Mutation, Types.Mutation{EntityName}Args>;

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
