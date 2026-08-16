# Task 25 Outcome — Enhance `MeetingJoinAction` with copy, status, retry

**Status**: ✅ Complete  
**Date**: 2026-08-15  
**Requirements**: AC-3.1-3.6 (MeetingJoinAction enhancement)

## Summary

Enhanced the `MeetingJoinActionShared` scaffold component with URL status badge integration (pending/generated/failed/expired), a copy-to-clipboard button for non-admin users, retry action for failed generations, and null-safe `expiresAt` display. Each variant (icon, button, action) now renders the appropriate state-aware content:

- **pending**: `MeetingUrlStatusBadge` (CircularProgress icon)
- **generated**: Join button + `CopyMeetingUrlButton` (when `showCopyButton` is true) + optional `expiresAt` line
- **failed**: `MeetingUrlStatusBadge` (error icon) + optional retry button (when `onRetry` callback provided)
- **expired**: `MeetingUrlStatusBadge` (schedule icon)

All new strings come from `useAppTranslation(Translation.Dashboard.MeetingUrlStatus)` — the self-contained UI primitive owns its translations.

## Files Modified

| File | Action |
|------|--------|
| `frontend/common/components/ui/display/meetingConfig/types/meetingJoinAction.types.ts` | Added 5 new props to `MeetingJoinActionProps` |
| `frontend/common/components/ui/display/meetingConfig/MeetingJoinActionShared.tsx` | Rewritten to integrate status badge, copy button, retry, expiresAt |
| `frontend/common/lib/meetingJoinAction.ts` | Extended `JoinContext` type with 5 new fields |
| `frontend/common/hooks/useJoinContext.ts` | Pass-through of new props to `JoinContext` |

## Files NOT Modified

- `frontend/common/components/ui/display/meetingConfig/MeetingJoinAction.tsx` — the public-facing wrapper that delegates to the shared scaffold; unchanged since it passes all props through to `MeetingJoinActionShared`.
- No desktop/mobile variants exist — `MeetingJoinAction.tsx` delegates to `MeetingJoinActionShared` which is viewport-agnostic.

## New Props on `MeetingJoinActionProps`

```typescript
export type MeetingJoinActionProps = {
  // ... existing props ...
  /** Show copy-to-clipboard button alongside the join action (non-admin users). */
  readonly showCopyButton?: boolean;
  /** URL generation status from backend (pending / generated / failed / expired). */
  readonly meetingUrlStatus?: string | null;
  /** Error message from failed generation, shown as badge tooltip / retry context. */
  readonly meetingUrlError?: string | null;
  /** Optional retry callback for failed URL generations. */
  readonly onRetry?: () => void;
  /** ISO timestamp when the generated URL expires (null-safe: omitted renders nothing). */
  readonly expiresAt?: string | null;
};
```

## Component State Matrix

| `meetingUrlStatus` | `hasUrl` | Icon variant | Button/Action variant |
|--------------------|----------|-------------|----------------------|
| `pending` | any | `MeetingUrlStatusBadge` (CircularProgress) | `MeetingUrlStatusBadge` (CircularProgress) |
| `generated` or null | true | Join IconButton + optional `CopyMeetingUrlButton` | Join Button + optional `CopyMeetingUrlButton` + optional `expiresAt` |
| `failed` | any | `MeetingUrlStatusBadge` (error) + optional retry | `MeetingUrlStatusBadge` (error) + optional retry |
| `expired` | any | `MeetingUrlStatusBadge` (schedule) | `MeetingUrlStatusBadge` (schedule) |
| (no status, no URL) | false | Setup link (if `setupHref` provided) or settings icon | Setup alert (if `emptyRole` + `setupHref`) |

## Status Mapping

The `mapUrlStatus()` helper maps the codegen string field to the `MeetingUrlStatus` union:

| Input `meetingUrlStatus` | `hasUrl` | Output |
|--------------------------|----------|--------|
| `"failed"` | any | `"failed"` |
| `"expired"` | any | `"expired"` |
| `"pending"` | any | `"pending"` |
| `"generated"` or null/undefined | true | `"generated"` |
| (any other) | false | `"pending"` |

## Key Design Decisions

1. **Self-contained translations**: The component uses `useAppTranslation(Translation.Dashboard.MeetingUrlStatus)` directly — appropriate for a UI primitive under `frontend/common/components/ui/` (per `frontend/common/components/ui/AGENTS.md`).

2. **`MeetingUrlStatusBadge` consumed directly (task 19)**: Rather than duplicating the badge rendering, the component imports and renders the existing badge component which handles its own translations and accessibility.

3. **`CopyMeetingUrlButton` consumed directly (task 20)**: The copy button from task 20 is integrated via `renderCopyButton()` helper. It handles its own clipboard fallback and error states. Only shown when `showCopyButton` is true and a URL is resolved.

4. **Backward-compatible setup alert**: The existing setup alert for `emptyRole` + `setupHref` + no URL still works — but only when `meetingUrlStatus` is not set (the new status-based rendering takes priority when a status is present).

5. **Module-scope render helpers**: `mapUrlStatus()`, `formatExpiresAt()`, `renderCopyButton()`, `renderRetryButton()`, `renderExpiresAt()`, and the variant render functions are all module-scope to keep cognitive complexity under sonarjs limits.

6. **MUI v9 compliance**: All style props (`alignItems`, `gap`, `flexDirection`, `fontSize`) go in `sx`. Icons use `*Outlined` suffix. No direct style props on Typography/Stack/Box.

7. **No new i18n keys**: The existing `MeetingUrlStatusLabels` namespace already has `urlPending`, `urlReady`, `urlFailed`, `urlExpired`, `retryUrlGeneration`, `joinMeeting`, `copyUrl` keys from task 1.

## `JoinContext` Extension

The `JoinContext` type in `meetingJoinAction.ts` was extended with 5 new fields so all render helpers receive a complete context:

```typescript
export type JoinContext = {
  // ... existing fields ...
  readonly showCopyButton: boolean;
  readonly meetingUrlStatus: string | null;
  readonly meetingUrlError: string | null;
  readonly onRetry?: () => void;
  readonly expiresAt: string | null;
};
```

The `useJoinContext` hook normalizes props with safe defaults:
- `showCopyButton` → `props.showCopyButton === true` (default: false)
- `meetingUrlStatus` → `props.meetingUrlStatus ?? null`
- `meetingUrlError` → `props.meetingUrlError ?? null`
- `expiresAt` → `props.expiresAt ?? null`

## Cross-File Dependencies

- **Task 19 (MeetingUrlStatusBadge)**: Direct import — `MeetingUrlStatusBadge` and `MeetingUrlStatus` type consumed.
- **Task 20 (CopyMeetingUrlButton)**: Direct import — `CopyMeetingUrlButton` consumed via `renderCopyButton()` helper.
- **Task 1 (i18n foundation)**: `Translation.Dashboard.MeetingUrlStatus` namespace with `retryUrlGeneration` key used via `useAppTranslation`.

## Quality Verification

| File | Check | Result |
|------|-------|--------|
| `MeetingJoinActionShared.tsx` | tsgo | ✅ passed |
| `MeetingJoinActionShared.tsx` | oxlint | ✅ passed |
| `MeetingJoinActionShared.tsx` | biome:check | ✅ passed |
| `MeetingJoinActionShared.tsx` | lint:type-aware | ✅ passed |
| `meetingJoinAction.ts` | tsgo | ✅ passed |
| `meetingJoinAction.ts` | oxlint | ✅ passed |
| `meetingJoinAction.ts` | biome:check | ✅ passed |
| `meetingJoinAction.ts` | lint:type-aware | ✅ passed |
| `useJoinContext.ts` | tsgo | ✅ passed |
| `useJoinContext.ts` | oxlint | ✅ passed |
| `useJoinContext.ts` | biome:check | ✅ passed |
| `useJoinContext.ts` | lint:type-aware | ✅ passed |
| `meetingJoinAction.types.ts` | tsgo | ✅ passed |
| `meetingJoinAction.types.ts` | oxlint | ✅ passed |
| `meetingJoinAction.types.ts` | biome:check | ✅ passed |
| `meetingJoinAction.types.ts` | lint:type-aware | ✅ passed |

## Deferred Items

- Integration into consumer components (tasks 26-27: teacher schedule grid, class instance details)
- Storybook stories for all states × variants
- Component tests for status badge / copy / retry / expiresAt behavior
