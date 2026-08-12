# UI Test Rules (`test/ui/`)

All tests under `test/ui/` run with `TEST_SERVER_MODE=production`. Any test that starts the shared Next.js test harness uses **`next start`** against a pre-built production bundle — not `next dev`.

## Prerequisites

**Before E2E tests (or any UI test that hits the running app), build the test production bundle:**

```bash
bun run build:test
```

- Output directory: `.next-test-prod` (override with `TEST_SERVER_DIST_DIR`)
- Uses **only** `.env.test` — injected into the `next build` / `next start` process env (no parent shell env). Per [Next.js test env rules](https://nextjs.org/docs/app/guides/environment-variables#test-environment-variables), keys already set in `process.env` are not overridden by `.env.local` or other files on disk
- Tests do **not** run `next build` automatically; missing build fails fast with a clear error

**Rebuild `build:test` after changes to:** server code, auth/cookies, middleware, API routes, or anything that affects the running Next.js app.

## Test Layers

| Layer | Path | Server | Notes |
|-------|------|--------|-------|
| Component | `test/ui/components/` | None | Happy DOM + mocked Apollo. No browser, no network. |
| E2E | `test/ui/e2e/` | Production (`next start`) | Playwright via `bun:test`. Uses `setupBrowserLifecycle()` → `setupTestServerLifecycle()`. |
| Static checks | `test/ui/mobile-desktop-isolation.test.ts` | None | Import-boundary scans only. |

Component tests do not need `build:test`. E2E tests **do**.

## Commands

```bash
bun run build:test          # Build .next-test-prod (required before E2E)
bun run test:ui:components  # Happy DOM component tests
bun run test:ui:e2e         # Playwright E2E (production server)
bun run test:ui:static      # Mobile/desktop isolation checks
bun run test:ui             # All of the above
bun run test:ui:kill        # Kill test servers on ports 3001/3020–3199 only (never dev:3000 or start:4000)
```

All `test:ui*` scripts preload `test/ui/test-env.ts`, which sets `TEST_SERVER_MODE=production`.

## Shared Test Server Infrastructure

E2E reuses the GraphQL test harness in `frontend/common/graphql/test/`:

- `lifecycle.ts` — `setupTestServerLifecycle()` (port allocation, start/stop)
- `testServer.ts` — spawns `next start` when mode is production
- `testPort.ts` — `getTestServerMode()` defaults to production for any run under `test/ui/`

**GraphQL integration tests** (`frontend/common/graphql/test/`) still use the **dev** server by default. Do not change that unless explicitly requested — `test-helper` mutations are blocked in production `NODE_ENV`.

## E2E Conventions

- Import lifecycle from `@/test/ui/e2e/lifecycle` — call `setupBrowserLifecycle()` at module scope
- Login helpers: `test/ui/e2e/helpers.ts` (`loginAsDemoUser` via `Bun.fetch`, not Playwright `context.request`)
- No `happydom-preload` in E2E — conflicts with Playwright
- No `waitForTimeout` / `networkidle` — use auto-waiting Playwright assertions
- Auth cookies: `AUTH_COOKIE_SECURE=false` in `.env.test` so `http://localhost` works in production mode

## Component Test Conventions

- Preloads: `test/ui/test-env.ts`, `happydom-preload.ts`, `next-dynamic-mock.ts`
- Use `TestWrapper` for Apollo mocks — never hit a real server
- See `frontend/common/components/ui/AGENTS.md` for component test structure

## Shared Test Helpers (Duplication Elimination)

Test files sharing identical mock setup (navigation, router, session activation) should import from shared helpers instead of defining inline mocks:

- **Navigation mocks:** `test/ui/components/helpers/mockNavigation.tsx` — Next.js router mock, pathname mock, router state
- **Session activate button tests:** `test/ui/components/helpers/sessionActivateButtonTests.ts` — shared test logic for activate/deactivate button
- **Student history fixtures:** `test/ui/components/fixtures/studentHistoryFixtures.ts` — shared test data shapes

See `docs/testing/mock-navigation-helpers.md` for the complete pattern reference.


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
