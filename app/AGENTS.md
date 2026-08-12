# App Router Layer Rules

## Server Components

- All files under `app/` are Server Components by default (no `"use client"` directive).
- Server Components may call backend services directly (e.g., `SessionService`, `PermissionsService`).
- Server Components must **not** call repositories or the database directly — always go through the service layer.
- Server Components must **not** use React hooks (`useState`, `useEffect`, etc.) or browser APIs.

## Authentication Guards

- Use `getServerUserContext()` from `@/backend/lib/auth/server-auth` to verify authentication in layout files.
- Redirect unauthenticated users with `redirectToLogin()` from `@/frontend/common/lib/redirectToLogin` (or `redirect()` from `next/navigation`).
- For dashboard pages, use the shared `withPageAuth()` wrapper from `app/(dashboard)/__shared__/withPageAuth.ts` instead of inline auth checks. See `docs/app/with-page-auth.md` for the complete pattern reference.

```tsx
import { getServerUserContext } from "@/backend/lib/auth/server-auth";
import { redirectToLogin } from "@/frontend/common/lib/redirectToLogin";

const { userId, context } = await getServerUserContext();
if (!userId || !context) {
  await redirectToLogin();
  return;
}
```

### Page-level access control (auth ≠ permission)

| Concern | Helper | Redirect |
|---------|--------|----------|
| Not logged in | Layout / `redirectToLogin` | Login |
| Missing teacher/parent identity | `requireTeacherIdForPage` / `requireParentIdForPage` | `/dashboard` |
| Missing `AppPermission`(s) | `requirePermissionForPage` | `/dashboard` |
| Profile view/edit | `resolveProfilePageContext` | `/dashboard` or `/profile` |
| UX-level gating | `<RequirePermission>` on buttons/tabs/sections | Renders `fallback` (often `null`) |

**Permission-gated pages** must call `requirePermissionForPage` in `page.tsx` before rendering the Container. Do **not** add container-level `<RequirePermission>` wrappers that gate entire page returns — the server guard is the security boundary and the client wrapper is trivially bypassable. Fine-grained `<RequirePermission>` on individual buttons/tabs/sections is encouraged for UX (e.g., hiding buttons users can't use). Do **not** gate `/dashboard` itself — it is the redirect landing page. See `docs/auth/permission-architecture.md` for the full 3-tier model.

```tsx
import { AppPermission } from "@/backend/enum";
import { requirePermissionForPage } from "@/backend/lib/auth/require-permission";
import { getServerUserContext } from "@/backend/lib/auth/server-auth";
import { redirectToLogin } from "@/frontend/common/lib/redirectToLogin";
import { getLocale } from "@/shared/locale/server-cookies";

export default async function ExamplePage() {
  const locale = await getLocale();
  const { userId, context } = await getServerUserContext();
  if (!userId) {
    await redirectToLogin();
    return;
  }
  await requirePermissionForPage(userId, [AppPermission.SESSION_RESCHEDULE], locale, context);
  return <ExampleContainer />;
}
```

- Permission arrays use **OR** semantics (any one permission grants access), matching client `RequirePermission`.
- Prefer passing `context` from `getServerUserContext()` so impersonation / group simulation stay correct.
- Locale comes from `getLocale()` (`@/shared/locale/server-cookies`) — there is no `[locale]` URL segment under `(dashboard)`.

## Cached Request Pattern

- Next.js layouts **cannot pass props to page children**. Pages only receive `params` and `searchParams`.
- To share data between a layout and its pages without duplicate fetches, use `React.cache()` wrappers.
- `React.cache()` memoizes function results per request, so calling the same function in both layout and page executes only once.

### Example: `getCurrentUser()`

```tsx
// backend/lib/auth/cached-user.ts
import { cache } from "react";
import { SessionService } from "@/backend/services/auth/session.service";

export const getCurrentUser = cache(async (userId: string) => {
  return SessionService.getCurrentUserProfile(userId);
});
```

**Usage in layout:**

```tsx
import { getCurrentUser } from "@/backend/lib/auth/cached-user";

const userProfile = await getCurrentUser(userId);
```

**Usage in page (same request, no duplicate fetch):**

```tsx
import { getCurrentUser } from "@/backend/lib/auth/cached-user";

const userProfile = await getCurrentUser(userId);
```

## Creating New Cached Wrappers

- Place cached wrappers in `backend/lib/auth/` or a similar shared location.
- Always wrap with `cache()` from `react`.
- Import types from `@/backend/types`.
- Name functions clearly (e.g., `getCurrentUser`, `getDashboardMetrics`).

## Translations in Server Components

- Use `getTranslations(locale)` from `@/shared/locale/server` for server-side translations (synchronous — returns a `<namespace>` property-chain, NOT a promise).
- Pass already-translated strings as props to client components; do NOT use `getMessages()`.
- Example: `const t = getTranslations(locale).commonTranslations;` then use `t.fieldName`.

## Locale Handling

- Locale is available via `params` (as a Promise in Next.js 15+): `const { locale } = await params;`
- Use locale for redirects: `redirect(`/${locale}/login`)`.


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
