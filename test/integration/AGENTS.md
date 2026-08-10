# Provider Integration Tests (`test/integration/`)

Live **provider smokes** only — one real API round-trip per external service to confirm the adapter is wired correctly. These tests are **not** service behaviour tests, full app flows, or database-layer integration tests.

## What belongs here

| Category | Path pattern | Example |
|----------|--------------|---------|
| Communication adapters | `communication/*.integration.test.ts` | Resend, Twilio, FCM |
| FX providers | `fx/*.integration.test.ts` | Fixer, OpenExchangeRates |
| Database providers | `db/*.integration.test.ts` | Neon HTTP |
| Cache / Redis providers | `redis/*.integration.test.ts` | Upstash, Redis Cloud, local Redis |
| Meeting adapters | `meeting/*.integration.test.ts` | Zoom, Google Meet, Microsoft Teams |

**Naming:** `*.integration.test.ts` only. One `describe` block per provider adapter, **one `test` per file** (single API call — avoids quota / rate limits).

## What does NOT belong here

| Test type | Correct location |
|-----------|------------------|
| Service unit tests (mocked deps) | `backend/services/**/*.test.ts` — run `bun run test:services` |
| PG repo / logic tests (`runInRollback`) | `backend/db/test/` — run `bun run test:db` |
| GraphQL API tests | `frontend/common/graphql/test/` |
| UI / E2E | `test/ui/` — see `test/ui/AGENTS.md` |

Never add `*.integration.test.ts` under `backend/services/` or `backend/db/test/` for external SaaS providers.

## Commands

All scripts load **`.env.test`** via `bun --env-file=.env.test`.

```bash
bun run test:integration              # All provider smokes (parallel runner)
bun run test:integration:sequential   # Same files, single bun process (debugging)
bun run test:live-comm                  # communication/ only (preload: live-comm-preload.ts)
bun run test:live-fx                    # fx/ only (preload: live-fx-preload.ts)
```

Subset by path:

```bash
bun --env-file=.env.test test test/integration/redis/ --timeout=120000
```

`test:integration` is **not** part of default CI — suites skip when required env keys are absent.

## Environment

- Secrets and provider URLs live in **`.env.test`** (gitignored). Document new keys in `.env.example` and `environment.d.ts`.
- Optional recipient / device tokens (e.g. `RESEND_TEST_TO_EMAIL`, `TWILIO_VERIFIED_TEST_RECIPIENT`, `FCM_TEST_DEVICE_TOKEN`) are for manual full-path runs only; smokes should prefer **zero-cost paths** (simulator addresses, invalid recipients, invalid tokens) where the provider still returns a real HTTP response.
- Preload scripts in `preload/` fail fast when **no** keys exist for a targeted subset (`test:live-comm`, `test:live-fx`).

## Conventions

### Gating (`describeLiveWhen`)

```typescript
import { describeLiveWhen } from "@/test/integration/helpers/describe-live";

const hasResend = Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL);
const describeLive = describeLiveWhen(hasResend, "ResendEmailAdapter @live-comm");

describeLive("ResendEmailAdapter @live-comm", () => {
  test("send() reaches the live Resend API", async () => { /* one call */ });
});
```

When env keys are missing, the suite is `describe.skip` — not a failure.

### Scope of each smoke

- Instantiate the **adapter directly** (`new ResendEmailAdapter()`, `new FixerAdapter()`, etc.) — not the lazy singleton factory unless the factory is what you are integrating.
- Stub **DB side-effects** (`spyOn(NotificationRepository, …)`) when the adapter writes delivery rows; the smoke validates the **provider** path, not persistence.
- Assert the adapter reached the provider: success with a provider id **or** a structured provider rejection (e.g. Resend 429 quota) with `FAILED` delivery status — not unhandled throws.
- Do **not** test business logic, fan-out, permissions, or multi-step service orchestration here.

### Logging

- **Never** use `console.log` / `console.error` — use `testLogger` from `@/shared/lib/logger/testlogger` when debug output is needed.

### Imports

- Use `@/` path aliases (`@/backend/...`, `@/test/integration/helpers/...`).
- No imports from `@/frontend/**` or `@/app/**`.

## Directory layout

```
test/integration/
  AGENTS.md
  helpers/
    describe-live.ts          # shared describe.skip gating
  preload/
    live-comm-preload.ts      # fail-fast for test:live-comm
    live-fx-preload.ts        # fail-fast for test:live-fx
  communication/              # Resend, Twilio, FCM
  fx/                         # Fixer, OpenExchangeRates
  db/                         # Neon HTTP, etc.
  redis/                      # Upstash, Redis Cloud, local (planned)
  meeting/                    # Meeting provider smokes (Zoom, Google Meet, Microsoft Teams)
```

## Adding a new provider smoke

1. Create `test/integration/<domain>/<provider>.integration.test.ts`.
2. One `test`, one API round-trip, gate with `describeLiveWhen`.
3. Add env vars to `.env.test`, `.env.example`, and `environment.d.ts`.
4. Run per-file verification: `bun run scripts/health/sub-loop.ts <file> --lifecycle lint`.
5. Run `bun run test:integration` locally with keys configured.

## Verification

```bash
bun run scripts/health/sub-loop.ts test/integration/communication/resend.integration.test.ts --lifecycle lint
bun run test:integration
```

Instruction file for integration tests: `.github/instructions/tests.instructions.md` (when present).


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
