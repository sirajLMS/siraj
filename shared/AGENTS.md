# Shared Layer Rules

## Purpose

The `shared/` layer contains code used by **both** frontend and backend: utilities, i18n messages, domain constants, enums, and cross-layer types. It sits below `app/`, `frontend/`, and `backend/` in the dependency graph — nothing in shared may depend on those layers.

## Layer Isolation (CRITICAL)

- **NEVER** import from `@/frontend/**`, `@/backend/**`, or `@/app/**`.
- Enforced by ESLint `no-restricted-imports` in `eslint.config.mjs` for all `shared/**/*.{ts,tsx}` files.
- If shared code needs a value that currently lives in another layer (enum, type, utility), **move or duplicate the canonical definition into `shared/`** and have the other layer import from shared — not the reverse.

### Positive Pattern

```typescript
// shared/lib/social-links.ts
import { isSafeUrl } from "@/shared/lib/safe-url";

// shared/lib/schedule-instance-dashboard-status.ts
import { ClassExecutionState, ClassOutcome } from "@/shared/constants/class-instance-detail.enum";
```

### Negative Pattern (PROHIBITED)

```typescript
import { isSafeUrl } from "@/frontend/common/lib/safeRedirect";
import { ClassOutcome } from "@/backend/enum";
import type { InvoiceStatus } from "@/frontend/common/graphql/generated/gql/graphql-types";
```

## Import Convention

- Always use the `@/` path alias — relative `./` or `../` imports are banned (same rule as `app/`, `backend/`, `frontend/`, `test/`, and `scripts/`).
- Prefer deep imports over barrel files: `import { ClassOutcome } from "@/shared/constants/class-instance-detail.enum"`.
- `**/index.ts` barrel files may use relative `./` sibling re-exports by design (ESLint exception).

## File Organization

| Directory | Purpose | Examples |
|-----------|---------|----------|
| `shared/lib/` | Pure utilities and domain logic with no layer deps | `safe-url.ts`, `social-links.ts`, `phone/`, `logger/` |
| `shared/constants/` | Enums and stable domain constants | `class-instance-detail.enum.ts`, `billing-months.ts`, `permission-group.enum.ts` |
| `shared/types/` | Cross-layer TypeScript types | `billing-view.ts` |
| `shared/messages/` | i18n message definitions and label types | `en.ts`, `ar/`, `types/` |
| `shared/utils/` | General helpers | `date-utils.ts`, `storage.utils.ts` |

## Shared Enums

When frontend and backend both need the same enum values:

1. Define the enum in `shared/constants/{domain}.enum.ts` using the same string values as the backend enum.
2. Use dot access in shared code and tests: `ClassOutcome.PENDING`, `SystemPermissionGroupSlug.SUPER_ADMIN`.
3. Keep `@/backend/enum` for backend-only code; backend services/repos import from there.
4. Frontend should use GraphQL codegen enums for API-facing types, or import from `@/shared/constants/` when shared logic requires the same values.
5. **Never** import `@/backend/enum` from `shared/` — see `backend/enum/AGENTS.md`.

## Extracting Code Into Shared

When moving logic from `frontend/` or `backend/` into `shared/`:

1. Place the implementation in the appropriate `shared/` subdirectory (`lib/`, `constants/`, `types/`).
2. Update all consumers to import directly from the `shared/` source (e.g. `import { isSafeUrl } from "@/shared/lib/safe-url"`). Do not re-export from `frontend/` or `backend/` locations — consumers must import from `shared/` directly.
3. Move or define any required enums/types in `shared/` before updating imports in shared files.
4. Run tests for affected shared modules and verify ESLint passes on changed `shared/**` files.

## i18n Message Types

- Message label types in `shared/messages/types/` must not reference frontend view types or GraphQL codegen types.
- Define canonical status/key unions in `shared/types/` or `shared/constants/` and use those in message type definitions.
- Example: `BillingMonthId` lives in `@/shared/constants/billing-months`; `AdminInvoiceStatus` in `@/shared/types/billing-view`.

## Translation System (Compile-Time i18n)

### Overview
Siraj replaces the legacy `next-intl` package (now fully removed) with a custom **compile-time TypeScript i18n system** in `shared/locale/` that provides:
- **Compile-time safety**: `t.x.y` instead of `t("x.y")` — IDE autocomplete + TypeScript errors on missing keys
- **Native TypeScript pluralization**: `(count: number) => string` functions instead of ICU strings
- **Lazy loading**: standard dynamic `import()` per namespace — only loads needed translations
- **SSR & API support**: `getTranslations(locale, namespace)` for server components / API routes
- **GraphQL context integration**: `ctx.t("namespace")` bound to `ctx.locale`
- **SEO routing preserved**: Next.js native `[locale]` segments + middleware (Native Next.js routing, no third-party i18n routing library.)

### File Structure
```
shared/locale/
├── AppLocale.ts              ← locale enum & type
├── serverLegacy.ts                 ← getTranslations<K>(locale, namespace) for SSR/API
├── server-graphql-legacy.ts         ← getServerTranslations<K>(locale, namespace) for GraphQL/scripts
├── clientLegacy.ts                 ← useAppTranslation<K>(namespace) hook for client components
├── index.ts                  ← re-exports
│
├── types/                    ← TypeScript interfaces (the "schema")
│   ├── auth/index.ts
│   ├── common/index.ts
│   ├── dashboard/<domain>/...
│   ├── errors/index.ts
│   ├── ui/index.ts
│   ├── profile.ts
│   ├── session/index.ts
│   └── message.ts            ← MessageSchema (top-level map of all namespaces)
│
├── ar/                       ← Arabic implementations
│   ├── auth/index.ts
│   ├── common/index.ts
│   ├── dashboard/<domain>/...
│   ├── errors.ts
│   ├── ui/index.ts
│   └── profile.ts
│
└── en/                       ← English implementations
    ├── auth/index.ts
    ├── common/index.ts
    ├── dashboard/<domain>/...
    ├── errors.ts
    ├── ui/index.ts
    └── profile.ts
```

### Rules for All Layers

#### Server Components (`app/**/*.tsx`)
```typescript
// ✅ Correct
import { getTranslations } from "@/shared/locale/server";
const t = await getTranslations(locale, "auth");
return <h1>{t.login.pageTitle}</h1>;

// ❌ Forbidden
import { getTranslations } from "next-intl/server";
const t = await getTranslations({ locale, namespace: "auth.login" });
return <h1>{t("pageTitle")}</h1>;
```

#### Client Components (`frontend/**/*.tsx`)
```typescript
// ✅ Correct
import { useAppTranslation } from "@/shared/locale/client";
const t = useAppTranslation("auth").login;
return <input placeholder={t.email} />;

// ❌ Forbidden
import { useTranslations } from "next-intl";
const t = useTranslations("auth.login");
return <input placeholder={t("email")} />;
```

#### GraphQL Resolvers (`backend/graphql/**/*.mutation.ts`, `*.query.ts`)
```typescript
// ✅ Correct
resolve: async (_parent, args, ctx) => {
  const tErrors = await ctx.t("errors");
  throw new GraphQLError(tErrors.auth.invalidCredentials, ...);
};

// ❌ Forbidden
import { getBackendTranslations } from "@/backend/lib/intl";
const t = await getBackendTranslations({ locale: ctx.locale, namespace: "errors" });
throw new GraphQLError(t("auth.invalidCredentials"), ...);
```

#### API Routes / Scripts / Tests (`app/api/**`, `scripts/**`, `backend/db/test/**`)
```typescript
// ✅ Correct
import { getServerTranslations } from "@/shared/locale/server-graphql";
const t = await getServerTranslations(locale, "errors");
return NextResponse.json({ error: t.auth.notFound }, { status: 404 });
```

### Pluralization Pattern
Replace ICU strings with TypeScript functions in the type schema and implementations:

```typescript
// types/dashboard/students.ts
export interface StudentDirectoryLabels {
  title: string;
  studentCount: (count: number) => string; // Typed function — compile-time safe!
}

// ar/dashboard/students.ts
export const studentDirectory: StudentDirectoryLabels = {
  title: "الطلاب",
  studentCount: (count) => {
    if (count === 0) return "لا يوجد طلاب";
    if (count === 1) return "طالب واحد";
    if (count === 2) return "طالبان";
    if (count >= 3 && count <= 10) return `${count} طلاب`;
    return `${count} طالباً`;
  },
};

// en/dashboard/students.ts
export const studentDirectory: StudentDirectoryLabels = {
  title: "Students",
  studentCount: (count) =>
    count === 0 ? "No students" : count === 1 ? "1 student" : `${count} students`,
};
```

**Usage:** `t.studentDirectory.studentCount(42)` → `"42 طالباً"`

### Interpolation Pattern
Replace `{placeholder}` ICU strings with typed template functions:

```typescript
// types/auth/index.ts
export interface AuthImpersonationLabels {
  bannerLoggedInAs: (name: string) => string;  // was: string with {name}
  bannerViewingAs: (name: string, email: string) => string;
  // static strings stay as string
  returnToNormalLogin: string;
}

// ar/auth/index.ts
export const auth: AuthLabels = {
  impersonation: {
    bannerLoggedInAs: (name) => `أنت مسجل الدخول باسم ${name}.`,
    bannerViewingAs: (name, email) => `أنت تعرض لوحة التحكم باسم ${name} (${email})`,
  }
};
```

**Usage:** `t.impersonation.bannerLoggedInAs("أحمد")`

### Namespace Registration (Required for each new namespace)
1. Add interface to `shared/locale/types/<namespace>/index.ts`
2. Add implementations to `shared/locale/ar/<namespace>/index.ts` and `shared/locale/en/<namespace>/index.ts`
3. Export in `shared/locale/types/message.ts` (add to `MessageSchema`)
4. Add path mapping in `shared/locale/serverLegacy.ts` (`namespacePaths` map)
5. If used in layout SSR, add to `LocaleProvider` translations in `app/[locale]/layout.tsx`

### Public import contract

- **Product code** (`app/`, `frontend/`, `backend/` outside `shared/locale/`) imports **`@/shared/locale`** and **`@/shared/locale/types`** only — never deep paths such as `@/shared/locale/old/**` or `@/shared/locale/beta/**`.
- **`shared/locale/index.ts`** and **`shared/locale/types/index.ts`** are the public barrel — add new canonical exports there when modules land; run `bun tsgo` after barrel changes.
- **Inside `shared/locale/`** implementation files may use relative or deep paths.

### View-layer label types

Canonical `*Labels` interfaces live in `shared/locale/types/**`. View-layer code in `frontend/common/views/**/types/` may **`Pick`**, **`Omit`**, or compose those canonical types (e.g. `*ShellLabels`, column/filter slices) — do not duplicate string keys. See `frontend/common/views/AGENTS.md` Rule 7 for placement and grouping thresholds.

### Migration Status
- **Complete**: all translation namespaces now live in `shared/locale/`; the legacy `next-intl` package has been fully removed from `package.json`.
- **Legacy intact**: nothing — `shared/messages/` directory no longer exists; `next-intl` is no longer installed; `NextIntlClientProvider` is not used anywhere. Do not reintroduce them.

### Browser Translation Cache (Hybrid SW + IndexedDB)

- **Primary Path (HTTPS / Secure Contexts)**: Service Worker (`public/sw.js`) intercepts `/_next/static/chunks/*.js` GET requests and caches responses in Cache API store `siraj-static-chunks-v1`. Per-namespace invalidation happens automatically via Turbopack content hashes in chunk URLs.
- **Fallback Path (HTTP Staging / Insecure Contexts)**: Auto-detected via `window.isSecureContext === false`. Serves JSON snapshots from IndexedDB (`siraj-locale-snapshots`) keyed by `${BUILD_ID}:${namespaceId}:${locale}`.
- **Build ID Stamping**: Resolved in `next.config.ts` (`NEXT_PUBLIC_BUILD_ID` env → `.next-locale-snapshots-version` content hash → random UUID fallback). Mismatched `BUILD_ID` automatically wipes stale IndexedDB entries on first access.
- **Adding New Namespaces**: Each new `defineNamespace` call in `shared/locale/namespaces/**/*.namespace.ts` MUST pass a stable string ID as the first parameter (e.g. `defineNamespace("dashboard.students.directory", config)`).

## Cross-Layer Shared Types Pattern

When a type definition is used by both backend and frontend, it MUST live in `shared/types/` to avoid duplication. See `docs/backend/shared-types-pattern.md` for the complete pattern.

Key rules:
- Cross-layer types go in `shared/types/<domain>.types.ts`
- Both backend and frontend import from the same canonical file
- `shared/` layer MUST NOT import from `backend/` or `frontend/`

## Locale Namespace Migration

Monolithic locale files (e.g., `profile.ts`, `meeting-config.ts`) should be migrated to camelCase sub-module directories. See `docs/i18n/locale-namespace-migration.md` for the migration pattern.

Completed migrations: `profile/`, `meetingConfig/`, `paymentMethod/`



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
