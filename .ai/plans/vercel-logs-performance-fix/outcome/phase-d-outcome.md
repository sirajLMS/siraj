# Phase D Outcome — Increase me Poll Interval + Idle Pause

## Summary

Reduced GraphQL `me` query polling frequency from 60s to 120s and added idle detection to pause polling entirely after 5 minutes of user inactivity. When the user returns from idle, an immediate refetch is triggered.

## Tasks Completed

### D1.1 — Increase poll interval to 120s

- **File**: `frontend/common/views/dashboard/components/DashboardClientBridge.tsx`
- Changed `NOTIFICATION_COUNT_POLL_INTERVAL_MS` from `60_000` to `120_000`
- Exported the constant for test access
- Quality loop (codescene lifecycle): ✅ All checks passed (tsgo, oxlint, biome, lint, duplicates, codescene)

### D1.2 — Add idle detection hook

- **File**: `frontend/common/views/dashboard/components/DashboardClientBridge.tsx`
- Added `useIdleDetection` hook that tracks `mousemove`, `keydown`, `mousedown`, `touchstart`, `focus` (on `window`) and `visibilitychange` (on `document`)
- After `IDLE_TIMEOUT_MS` (300_000ms = 5 minutes) of inactivity, sets `isIdle` to `true`
- Any activity event resets `isIdle` to `false` and restarts the idle timer
- `useLiveNotificationCount` now uses dynamic `pollInterval: isIdle ? 0 : NOTIFICATION_COUNT_POLL_INTERVAL_MS`
- Added `wasIdleRef` to trigger immediate `refetch()` when transitioning from idle to active
- All event listeners use `{ passive: true }` and are properly cleaned up in `useEffect` return
- Quality loop (codescene lifecycle): ✅ All checks passed

### D1.3 — Trigger me refetch on markAlertsRead completion

- **Finding**: Already satisfied — no changes needed
- `useNotificationsDrawerViewModel.ts` line 44 defines `REFETCH_QUERIES = [{ query: notificationAlertsQueryDocument }, { query: meQueryDocument }]`
- `markAllReadMutation` (line ~160) uses `refetchQueries: [...REFETCH_QUERIES]`, which automatically refetches the `me` query after alerts are marked as read
- This uses Apollo's built-in `refetchQueries` mechanism, which is the idiomatic approach (preferred over manual `onCompleted` + `refetch()`)

### D1.4 — Component test

- **File**: `test/ui/components/DashboardClientBridge.test.tsx` (new)
- Test 1: Verifies `NOTIFICATION_COUNT_POLL_INTERVAL_MS` is `120_000`
- Test 2: Verifies fallback `notificationCount` (3) renders before `me` query resolves
- Test 3: Verifies `notificationCount` updates to 7 after `me` query resolves
- Mocks heavy child dependencies (DashboardLayout, NotificationDrawer, UserStoreInitializer, TeacherProfileCompletionRedirect, getDashboardLayoutData, useNotificationsDrawerViewModel, navigation modules)
- Quality loop (codescene lifecycle): ✅ All checks passed

### D1.5 — Test suite run

- All 3 tests pass (0 fail)
- Run via component test preloads (happydom, translation, next-dynamic-mock)
- Command used: `SIRAJ_TEST_RUNNER_OK=1 bun --env-file=.env.test test --parallel=1 test/ui/components/DashboardClientBridge.test.tsx --preload ./test/ui/test-env.ts --preload ./test/ui/components/happydom-preload.ts --preload ./test/ui/components/translation-preload.ts --preload ./test/ui/components/next-dynamic-mock.ts`

## Files Modified

| File | Change |
|------|--------|
| `frontend/common/views/dashboard/components/DashboardClientBridge.tsx` | Poll interval 60s→120s, added `useIdleDetection` hook, dynamic pollInterval, idle-return refetch |
| `test/ui/components/DashboardClientBridge.test.tsx` | New — 3 component tests for poll interval and me query rendering |
| `.ai/plans/vercel-logs-performance-fix/trackable-tasks.md` | D1.1–D1.6 checkboxes updated to [x] |

## Deferred Items

- **Idle pause/resume test coverage**: Full testing of the idle detection hook (simulating 5 min of inactivity, verifying pollInterval becomes 0, simulating activity to verify refetch) was deferred — the `useIdleDetection` hook is internal and not independently exported. Testing it would require either exporting the hook or testing via Apollo's internal polling state, which is fragile. The poll interval constant (120_000) is directly tested.
- **markAlertsRead refetch test**: Testing that `markAlertsRead` triggers `me` refetch would require mocking the full notification drawer view model + mutation flow. This is already covered by existing `REFETCH_QUERIES` configuration in `useNotificationsDrawerViewModel.ts` — adding a redundant test would be brittle.

## Quality Results

- `DashboardClientBridge.tsx`: tsgo ✅ | oxlint ✅ | biome ✅ | lint ✅ | duplicates ✅ | codescene ✅
- `DashboardClientBridge.test.tsx`: tsgo ✅ | oxlint ✅ | biome ✅ | lint ✅ | duplicates ✅ | codescene ✅
