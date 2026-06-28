# Fix: Parallel DB Tests Exhaust PostgreSQL Connections

## Problem

Running `bun run test:db` spawns 16 parallel processes (matching `availableParallelism()`), each importing `db` from `drizzleDb.ts` which creates:

1. **A main pg Pool** (`createDatabase()`) with `max: 10` connections
2. **A second pg Pool** (`createPool()`) with `max: 10` connections (the `drizzleDbPool` export)

Additionally, some tests create RLS role pools (`max: 2` each) and don't always clean them up.

**Math**: 16 processes x 2 pools x 10 max = **320 potential connections** against PostgreSQL `max_connections = 100`. This causes cascading `53300: sorry, too many clients already` errors — tests timeout waiting for connections that never become available.

## Root Causes

1. **`drizzleDbPool` is created eagerly but never used by most tests** — it's exported and instantiated for every test file even though only a few files need it
2. **Pool `max` is too high per parallel process** — 10 per pool per process multiplied by 16 processes far exceeds the 100-connection PostgreSQL limit
3. **RLS test pools leak** — `queryAsRlsRole` caches pg pools in `rlsClientCache` but `closeRlsClients` is rarely called in `afterAll`
4. **No per-process connection budget** — The runner doesn't limit concurrency based on available DB connections

## Solution

### 1. Lazy-load `drizzleDbPool` (eliminate wasted connections)

In `backend/db/drizzleDb.ts`, replace the eager `createPool()` with a lazy getter so the second pool is only created when actually accessed:

```ts
export const drizzleDbPool = (() => {
  try {
    return createPool();
  } catch {
    return null;
  }
})();
```

Becomes:

```ts
let _pool: Pool | null = null;
export function getDrizzleDbPool(): Pool {
  if (!_pool) {
    _pool = createPool();
  }
  return _pool;
}
// Backward-compat: keep the export but make it lazy via getter
export { getDrizzleDbPool as drizzleDbPool };
```

Then update the few consumers to call `getDrizzleDbPool()` or `drizzleDbPool()`.

This eliminates 10 wasted connections per parallel process (160 total across 16 processes).

### 2. Reduce pool `max` to `3` for test environment

In `backend/db/factory.ts`, both pools use `max: 10`. Reduce to `3`:

```ts
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: isTestEnv() ? 3 : 10,
});
```

With 3 per pool, 2 pools per process, 16 processes = 96 — fits within 100.

Add the helper:

```ts
function isTestEnv(): boolean {
  return !!process.env.BUN_TEST || process.env.NODE_ENV === "test";
}
```

Note: Bun sets `BUN_TEST=1` when running `bun test`.

### 3. Ensure RLS test pools are cleaned up

In `backend/db/test/test-utils.ts`, `closeRlsClients()` exists but is only called in a few test files. Add a global `afterAll` in test-utils that auto-closes RLS pools:

```ts
if (typeof afterAll !== "undefined") {
  afterAll(async () => {
    await closeRlsClients();
  });
}
```

Or more robustly, ensure each test file that uses `setupRlsRole` also calls `closeRlsClients` in its `afterAll`. Audit and add where missing.

### 4. Cap parallelism to a safe limit in the runner

In `scripts/run-db-tests-parallel.ts`, cap the worker count so total connections can't exceed PostgreSQL's limit:

```ts
// Each worker can use up to ~6 connections (2 pools x 3 max each)
// For max_connections=100, cap at ~14 workers (leaving headroom for RLS pools)
const DB_CONNS_PER_WORKER = 6;
const maxSafeWorkers = Math.floor(90 / DB_CONNS_PER_WORKER); // 15
const limit = Math.min(parallelism, queue.length, maxSafeWorkers);
```

Or simpler — just cap at a reasonable number like 8:

```ts
const MAX_DB_WORKERS = 8;
const limit = Math.min(parallelism, queue.length, MAX_DB_WORKERS);
```

### 5. (Optional) Query `max_connections` from PG and auto-compute

For a fully dynamic solution, the runner could query `SHOW max_connections` at startup and compute the safe limit. This is more complex and may not be worth it — a fixed cap of 8 workers is simpler and sufficient.

## Execution Order

1. **`backend/db/factory.ts`** — Add `isTestEnv()` helper and reduce pool `max` to 3 in test mode
2. **`backend/db/drizzleDb.ts`** — Convert `drizzleDbPool` to lazy initialization
3. **Update `drizzleDbPool` consumers** — Find all files importing `drizzleDbPool` and update to use the lazy getter
4. **`backend/db/test/test-utils.ts`** — Add auto-cleanup for RLS client pools
5. **`scripts/run-db-tests-parallel.ts`** — Cap parallel workers to 8
6. **Run `bun run test:db`** to verify

## Expected Outcome

- Each parallel worker uses at most ~6 DB connections (3 per pool x 2 pools)
- 8 workers = ~48 connections, well within the 100 limit
- Leaves ~50 connections headroom for RLS role pools and other clients
- All 128 currently-failing timeout tests should pass

## Files to Modify

1. `backend/db/factory.ts` — Reduce pool max in test env
2. `backend/db/drizzleDb.ts` — Lazy-load drizzleDbPool
3. `backend/db/test/test-utils.ts` — Auto-cleanup RLS pools
4. `scripts/run-db-tests-parallel.ts` — Cap worker concurrency
5. Any files directly importing `drizzleDbPool` — Update to lazy getter
