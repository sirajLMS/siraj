# Phase E Outcome — Suppress Log Noise + Batch Client Logs

## Summary

Phase E implemented two sets of changes to reduce client-side log noise and optimize batch logging behavior:

1. **E1**: Gated the default `logger.debug` call in `RequirePermission.tsx` behind `NEXT_PUBLIC_DEBUG_PERMISSIONS === "true"` (default: no log on access denied)
2. **E2**: Increased the client logger batch interval from 2s to 30s, added a `beforeunload` flush listener with `keepalive: true`, and added a minimum batch size guard (5 entries) with forced log bypass

## Files Modified

### `frontend/common/components/auth/RequirePermission.tsx`
- **E1.1**: Gated `logger.debug` call behind `process.env.NEXT_PUBLIC_DEBUG_PERMISSIONS === "true"` — default behavior is now NO log on access denied
- Quality loop: ✅ tsgo → oxlint → biome → lint → duplicates → codescene (all passed)

### `test/ui/components/RequirePermission.test.tsx`
- **E1.2**: Added `mock.module` for `@/frontend/common/lib/logger`, added test case "does not call logger.debug on access denied by default"
- **E1.3**: All 6 tests pass (including the new test)
- Quality loop: ✅ all checks passed

### `frontend/common/lib/logger/index.ts`
- **E2.1**: Changed `batchInterval: 2000` to `batchInterval: 30000` (30s)
- **E2.2**: Added `beforeunloadHandler` that calls `flushLogs(true, true)` with `keepalive: true` — uses `fetch` (NOT `navigator.sendBeacon` which defaults to `text/plain` content-type)
- **E2.2**: Added `destroy()` method that removes the `beforeunload` listener and clears any pending timer
- **E2.2**: Added `typeof window !== "undefined"` guard for SSR safety
- **E2.3**: Added `MIN_BATCH_SIZE = 5` static constant and `hasForcedLog` boolean flag
- **E2.3**: In `flushLogs()`: if queue < 5 AND not forced AND no forced log queued → re-schedule timer and skip POST
- **E2.3**: Forced logs (`force: true`) set `hasForcedLog = true`, bypassing the guard
- **E2.3**: Updated `flushLogs` signature to `flushLogs(keepalive = false, force = false)`
- Exported `ClientLogger` class (was private) for testability — singleton `logger` instance unchanged
- Quality loop: ✅ all checks passed

### `frontend/common/lib/logger/test/logger.test.ts` (NEW)
- **E2.4**: Created 12 unit tests covering:
  - `beforeunload` listener registration on construction
  - `destroy()` removes `beforeunload` listener
  - `batchInterval` set to 30000ms (30s)
  - Minimum batch size guard: skips POST when queue < 5 and timer fired
  - Minimum batch size guard: sends POST when queue >= 5 and timer fired
  - Forced log (error with `force: true`) bypasses minimum batch size guard
  - `beforeunload` flush uses `keepalive: true`
  - `beforeunload` flush sends queued logs even when below minimum batch size
  - `destroy()` clears the pending batch timer
  - POST body contains JSON with `Content-Type: application/json`
  - Only one timer is scheduled for multiple logs before flush
  - Flush resets timer allowing new batch to schedule
- **E2.5**: All 12 tests pass
- Quality loop: ✅ tsgo → oxlint → biome → lint:type-aware → duplicates → codescene (all passed)

## Test Results

### RequirePermission component tests (E1.3)
```
6 pass, 0 fail
```
Run with: `SIRAJ_TEST_RUNNER_OK=1 bun test test/ui/components/RequirePermission.test.tsx --preload ./test/ui/test-env.ts --preload ./test/ui/components/happydom-preload.ts --preload ./test/ui/components/next-dynamic-mock.ts`

### ClientLogger unit tests (E2.5)
```
12 pass, 0 fail, 26 expect() calls
```
Run with: `SIRAJ_TEST_RUNNER_OK=1 bun test frontend/common/lib/logger/test/logger.test.ts`

## Design Decisions

### E1.1: Gate vs Remove
Decided to **gate** the DEBUG log behind `NEXT_PUBLIC_DEBUG_PERMISSIONS === "true"` rather than removing it entirely. This preserves the ability for developers to temporarily enable verbose permission debugging when troubleshooting access issues, while defaulting to silence in production.

### E2.2: `fetch` with `keepalive` vs `navigator.sendBeacon`
Per task requirements, used `fetch(url, { keepalive: true })` instead of `navigator.sendBeacon`. `sendBeacon` defaults to `text/plain` content-type, which would break the JSON parser in `/api/logs`. The `fetch` API with `keepalive: true` provides the same reliability for sending data during page unload while allowing proper `Content-Type: application/json` headers.

### E2.3: Minimum batch size guard
Implemented the optional minimum batch size guard with these design choices:
- `MIN_BATCH_SIZE = 5` — when timer fires and queue < 5, re-schedules the timer instead of dropping logs
- `hasForcedLog` flag — set to `true` when any log with `force: true` is queued; bypasses the guard
- `beforeunload` (force=true) always bypasses the guard to ensure pending logs are sent on page unload
- The guard only applies to the timer-triggered flush path, not to forced/unload paths

## Deferred Items

None — all subtasks (E1.1–E1.3, E2.1–E2.6) are complete.
