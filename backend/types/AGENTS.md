# Backend Types Layer Rules

## Single Canonical Object Type Pattern

Each database table/entity must have a single canonical type definition in the types layer that serves as the foundation for all GraphQL and backend operations.

### Positive Pattern (Required):
- Define a single core type per entity using Drizzle's `$inferSelect` (e.g., `{Entity}SelectType = typeof {entityTable}.$inferSelect`)
- Create a single canonical return type that extends the core type with resolved properties, enums properly typed, and forbidden fields excluded (e.g., `{Entity}ReturnType`)
- Define input types as needed (e.g., `{Entity}SubmitInput`, `{Entity}UpdateInput`) with appropriate field omissions
- Use consistent naming: `{Entity}SelectType`, `{Entity}InsertType`, `{Entity}ReturnType`, `{Entity}SubmitInput`, etc.

### Negative Pattern (Prohibited):
- Creating multiple similar types for the same entity
- Defining local types in GraphQL/Pothos files instead of using centralized types
- Creating ad-hoc type definitions like `{Entity}Definition` in Pothos files
- Duplicating entity structure across multiple type definitions without clear purpose

### Example:
```typescript
// backend/types/<domain>/<entity>.types.ts (e.g. backend/types/users/user.types.ts)
import type { {entityTable} } from "@/backend/db/schema";

export type {Entity}SelectType = typeof {entityTable}.$inferSelect;
export type {Entity}InsertType = typeof {entityTable}.$inferInsert;

export type {Entity}ReturnType = Omit<{Entity}SelectType, 
  // Remove forbidden fields like deletedAt, internal fields
  | "deletedAt"
  | "internalNotes"
> & {
  // Reapply enums with proper typing
  status: StatusEnum;
  role: RoleEnum;
  // Add resolved properties
  resolvedProperty?: string;
};
```

## GraphQL Integration

- Types defined here must be compatible with GraphQL Pothos object implementations
- Use `Omit` to exclude forbidden properties (like `deletedAt`) from GraphQL exposure
- Add resolved properties that come from joins as optional fields
- Enums should be properly typed using shared enum types

## Base Interface Pattern (Duplication Elimination)

When multiple entity types share identical fields/methods (e.g., meeting config base, communication base entity), extract a `*Base*` type in a shared types file. See `docs/backend/shared-types-pattern.md` and `docs/frontend/duplication-elimination-patterns.md` Pattern 3 for the extraction process.

Completed extractions:
- `backend/types/meeting/meeting-config-base.types.ts` — shared shape for class-meeting-config and meeting-config types
- `backend/types/communication/communication.types.ts` — `BaseEntity`, `BaseRepo<T>`, `DBTx`, `ResolutionResult` for complaint/suggestion types
- `shared/types/pagination.types.ts` — `PaginationInput` consolidated from 3 duplicate definitions

## Types Location Rules (CRITICAL)

- **All `.types.ts` files MUST live in `backend/types/`.** Service-layer files must not define or re-export types — import from `@/backend/types` instead.
- **If a service file contains both types and runtime code, split:** types → `backend/types/`, runtime → stays in the service layer with a non-`.types` filename (e.g., `.helpers.ts`, `.constants.ts`).
- **`backend/types/**/index.ts` barrels MUST use `./` relative paths and `export * from "./..."`.** No `@/` aliases, no `../` parent traversal, no explicit per-export `export type { ... }`.
- **`DBTransaction` and `DBQueryExecutor` live in `@/backend/types`** (moved from `@/backend/db/db.types`). All consumers import from `@/backend/types`.

### Completed Migration: Service-Layer `.types.ts` → `backend/types/`

The following `.types.ts` files were moved from the service layer into `backend/types/`:

| Source (deleted) | Target | Notes |
|---|---|---|
| `backend/db/db.types.ts` | `backend/types/db.types.ts` | `DBTransaction`, `DBQueryExecutor` |
| `backend/services/fx/providers/fixer/fixer.types.ts` | `backend/types/fx/fixer.types.ts` | `FixerLatestResponse` (interface only); `fixerResponseSchema` (Zod) → `fixer.helpers.ts` |
| `backend/services/fx/providers/openexchangerates/openexchangerates.types.ts` | `backend/types/fx/openexchangerates.types.ts` | `OpenExchangeRatesResponse` |
| `backend/services/communication/channels/email/resend/resend.types.ts` | `backend/types/communication/resend.types.ts` | `ResendEmailContext`, `ResendSendResponse`, `ResendErrorResponse` |
| `backend/services/communication/channels/push/fcm/fcm.types.ts` | `backend/types/communication/fcm.types.ts` | Interfaces only; `FCM_*` consts → `fcm.helpers.ts` |
| `backend/services/communication/channels/sms/twilio/twilio.types.ts` | `backend/types/communication/twilio.types.ts` | `TwilioSmsContext`, `TwilioMessageResponse`, `TwilioRateLimitConfig` |
| `backend/services/communication/channels/whatsapp/cloud-api/meta-cloud-api.types.ts` | (types already in `backend/types/whatsapp/`) | Runtime helpers → `meta-cloud-api.helpers.ts` |
| `backend/services/meeting/channels/google-meet/google-meet.types.ts` | `backend/types/meeting/channels/google-meet.types.ts` | Google Meet interfaces |
| `backend/services/meeting/channels/microsoft-teams/microsoft-teams.types.ts` | `backend/types/meeting/channels/microsoft-teams.types.ts` | Teams interfaces |
| `backend/services/meeting/channels/zoom/zoom.types.ts` | `backend/types/meeting/channels/zoom.types.ts` | Zoom interfaces |

## Cross-Layer Enum Migration

When an enum exists in both `shared/constants/` (canonical) and `backend/enum/` (duplicate), convert the backend file to a re-export shim. See `docs/i18n/cross-layer-enum-migration.md` for the complete migration workflow.

Completed migrations:
- `IANATimezone` — `backend/enum/shared/timezone.enum.ts` → re-export from `shared/constants/iana-timezone.enum.ts`
- `CurrencyCode` — `backend/enum/shared/currency.enum.ts` → re-export from `shared/constants/currency.enum.ts`
- `ClassInstanceDetail` — `backend/enum/shared/class-instance-detail.enum.ts` → re-export from `shared/constants/class-instance-detail.enum.ts`

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
