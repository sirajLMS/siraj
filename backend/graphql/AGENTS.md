# Backend GraphQL & Pothos Layer Rules

- **Framework**: We use Pothos to build our GraphQL schema code-first.
- **Nullability**: In Pothos, fields are non-nullable by default unless explicitly set to `nullable: true`. Ensure your TypeScript types align with your Pothos definitions.
- **Resolvers**: Pothos field resolvers should generally delegate to the `backend/services/` layer, rather than putting business logic inside the GraphQL definitions or calling Repositories directly.
- **Cache Updates**: Ensure `id` fields are always exposed on GraphQL objects so the Apollo client can auto-update its cache.
- **Locale Propagation & Localized Errors**: GraphQL field resolvers must propagate the request locale (`ctx.locale`) to service and repository calls to enable proper localized error messages. Any direct error thrown in resolvers must be translated via `ctx.t("<namespace>")` — already bound to `ctx.locale`. Example: `const tErrors = await ctx.t("errors"); throw new GraphQLError(tErrors.auth.invalidCredentials, ...);`. Do NOT import `getBackendTranslations` or `next-intl`.
- **Type Definition Pattern**: GraphQL Pothos objects should use types from `backend/types/` (e.g., `{Entity}ReturnType`, `{Entity}SubmitInput`) as the underlying type references for object and input definitions. Import these types from `@/backend/types` and use them in Pothos `.implement()` calls to ensure consistency between GraphQL types and backend service/repository types.

## Pothos Enum Registration Pattern (CRITICAL RULE)

GraphQL enums MUST be backed by a real TypeScript `enum` defined in `backend/enum/`. **Hardcoding enum value literal arrays inside a Pothos file is PROHIBITED** — it bypasses the single-source-of-truth enum definition and drifts away from the backend layer.

### Positive Pattern (Required):
- Define the enum in `backend/enum/<subdir>/<entity>.enum.ts` (see `backend/enum/AGENTS.md`).
- Register it with Pothos by passing the enum object: `gqlSchemaBuilder.enumType(MyEnum, { name: "MyEnum" })`.
- All Pothos enum registrations live in `backend/graphql/pothos/shared/enum.pothos.ts`. Import the registered Pothos enum (e.g. `MyEnumPothosEnum`) from there into the domain Pothos files that reference it on a field — never re-register the same enum in a domain file.
- Run `bun run generate:gqlSchema` then `bun codegen` after registering a new enum so the frontend codegen output (`@/frontend/common/graphql/generated/gql/graphql-types`) stays in sync.

```typescript
// backend/enum/profiles/profile.enum.ts
export enum ProfileMode {
  VIEW = "view",
  EDIT = "edit",
}

// backend/graphql/pothos/shared/enum.pothos.ts
import { ProfileMode } from "@/backend/enum";
export const ProfileModePothosEnum = gqlSchemaBuilder.enumType(ProfileMode, { name: "ProfileMode" });

// backend/graphql/pothos/profile/profile.pothos.ts
import { ProfileModePothosEnum } from "@/backend/graphql/pothos/shared/enum.pothos";
// ...use ProfileModePothosEnum as a field type
```

### Negative Pattern (PROHIBITED):
- Hardcoding enum value literals inside a Pothos file:
  ```typescript
  // ❌ DO NOT DO THIS in *.pothos.ts files
  export const ProfileModePothosEnum = gqlSchemaBuilder.enumType("ProfileMode", {
    values: ["view", "edit"] as const,
  });
  ```
- Defining a TypeScript `enum` inline inside a Pothos file instead of `backend/enum/`.
- Re-registering an enum that is already registered in `shared/enum.pothos.ts` (produces a "has already been declared" runtime error).
- Re-declaring enum values as a string-union type somewhere else (e.g. `type ProfileMode = "view" | "edit"`); the canonical enum lives in `backend/enum/` and all other layers should reference that enum (or, for the frontend, the GraphQL codegen enum).

### Migrating an existing hardcoded Pothos enum:
1. Define (or locate) the canonical TypeScript `enum` under `backend/enum/<subdir>/`.
2. Add it to the sub-directory's `index.ts` and (if needed) the top-level `backend/enum/index.ts` barrel.
3. Register it once in `backend/graphql/pothos/shared/enum.pothos.ts` using the enum-object form.
4. Replace any `values: [...]` usages in domain Pothos files with an import of the registered Pothos enum from `shared/enum.pothos`.
5. Regenerate the schema and codegen.

## Single Canonical Object Type Pattern (CRITICAL RULE)

### Positive Pattern (Required):
- Create a single GraphQL object type per entity using types from `backend/types/` (e.g., `{Entity}ReturnType`)
- Use the canonical type as the basis for Pothos object implementation: `gqlSchemaBuilder.objectRef<{Entity}ReturnType>("<Entity>")`
- Add additional fields as needed (resolved relationships, computed properties) beyond the canonical type
- Leverage GraphQL's selection mechanism - clients can request only the fields they need from the full object
- Define input types using types from `backend/types/` (e.g., `{Entity}SubmitInput`)

### Negative Pattern (PROHIBITED - Major Violation):
- Creating local type definitions within Pothos files (e.g., `export type {Entity}Definition = {...}`)
- Defining multiple GraphQL object types for the same entity when one canonical type would suffice
- Duplicating entity structure in local types instead of using centralized types from `backend/types/`
- Creating ad-hoc types like `export type <Entity>SimpleDefinition`

### Example of Proper Pattern:
```typescript
// Instead of defining local types in Pothos files:
export type <Entity>SimpleDefinition = {
  id: string;
  name: string;
};

// Use types from backend/types:
import type { {Entity}ReturnType } from "@/backend/types";

const {Entity}Ref = gqlSchemaBuilder.objectRef<{Entity}ReturnType>("<Entity>");
export const {Entity}PothosObject = {Entity}Ref.implement({
  fields: t => ({
    id: t.exposeString("id"),
    name: t.exposeString("name"),
    // ... other fields from {Entity}ReturnType
  }),
});
```

### Exception Policy:
- Input types (mutation inputs, filter inputs) are allowed as separate definitions when they serve a specific purpose
- Wrapper types for collections or complex responses (e.g., paginated results) are allowed as separate definitions
- Complex computed/derived types that don't map directly to a single table may require custom definitions (but should still import base types from `backend/types/`)

## WhatsApp GraphQL Patterns

- **Canonical reference**: `docs/services/whatsapp-cloud-api.md` — comprehensive WhatsApp integration patterns.
- **Object types**: `WhatsappAccountPothosObject`, `WhatsappTemplateSnapshotPothosObject` (BL3), `WhatsappSyncFromMetaResultPothosObject` (wrapper). All expose `id` for Apollo cache normalization.
- **Input type pattern**: Use `inputType(string-named)` instead of `inputRef<BackendType>` to avoid LocalizedString null incompatibility.
- **Credential mutations**: `setWhatsappAccessToken`, `setWhatsappTwoStepPin` — all credential/config mutations call `resetWhatsappChannel()` (S4) for token rotation without restart.
- **Delete behavior**: `deleteWhatsappAccount` deactivates (`isActive = false`), does not hard-delete.
- **Side-effect barrels**: `import "./whatsapp-account.mutation";` registers resolvers via side-effect imports.

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
