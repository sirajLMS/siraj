# Task 6 Outcome — Redesign RevokeTokenDialog with BaseDeleteDialog

## Summary

Replaced the raw MUI `Dialog` implementation in `RevokeTokenDialog.tsx` with a thin wrapper around `BaseDeleteDialog`. The component now delegates all dialog rendering (icon, title, body, action buttons, loading state) to the shared `BaseDeleteDialog` primitive, matching the established pattern used by `MeetingConfigDeleteDialog` and `SessionConfigDeleteDialog`.

## Files Modified

- `frontend/common/views/dashboard/settings/components/meetingIntegrations/RevokeTokenDialog.tsx` — complete rewrite from raw `Dialog` to `BaseDeleteDialog` wrapper.

### Changes

1. **Removed raw MUI Dialog imports**: `Button`, `Dialog`, `DialogActions`, `DialogContent`, `DialogContentText`, `DialogTitle` — no longer needed.
2. **Added `BaseDeleteDialog` import** from `@/frontend/common/components/ui/dialog/BaseDeleteDialog`.
3. **Exported `RevokeTokenDialogProps` interface** — previously the props were inline; now explicitly exported for consistency with other dialog wrappers.
4. **Prop mapping to BaseDeleteDialog**:
   - `open` → `open` (direct)
   - `onCancel` → `onClose` (renamed to match BaseDeleteDialog API)
   - `onConfirm` → `onConfirm` (direct)
   - `revoking` → `isLoading` (renamed to match BaseDeleteDialog API)
   - `labels.actions.revokeConfirmTitle` → `title`
   - `labels.actions.revokeConfirm` → `body` (warning about impact: "The teacher will need to re-connect")
   - `labels.actions.cancel` → `cancelLabel`
   - `labels.actions.confirmRevoke` → `confirmLabel`
5. **No `useAppTranslation`** — all strings passed via `labels` prop from ViewModel (per `frontend/common/views/AGENTS.md` Rule 7).
6. **No `useBaseDeleteDialog` hook** — this is a thin wrapper component passing props directly to `BaseDeleteDialog`.

## Files NOT Modified

- `RevokeTokenDialog.stories.tsx` — no changes needed; stories already pass `labels`, `open`, `revoking`, `onConfirm`, `onCancel` which match the unchanged public props interface.
- Consumer (`meetingIntegrationsTabShared.tsx`) — no changes needed; public props interface (`labels`, `open`, `revoking`, `onConfirm`, `onCancel`) is preserved.

## Verification Results

### `RevokeTokenDialog.tsx`
```
bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/settings/components/meetingIntegrations/RevokeTokenDialog.tsx --lifecycle lint
✅ tsgo passed
✅ oxlint passed
✅ biome:check passed
✅ lint:type-aware passed
✅ All checks for lifecycle "lint" passed. (exit code 0)
```

### `RevokeTokenDialog.stories.tsx`
```
bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/settings/components/meetingIntegrations/RevokeTokenDialog.stories.tsx --lifecycle lint
✅ tsgo passed
✅ oxlint passed
✅ biome:check passed
✅ lint:type-aware passed
✅ All checks for lifecycle "lint" passed. (exit code 0)
```

## Carry-Forward Knowledge

- The `BaseDeleteDialog` component is a thin wrapper around `BaseDeleteDialogScaffold` with fixed `CancelActionButton={FilterButton}` and `ConfirmActionButton={PrimaryPageAction}`. It renders a warning icon, centered title, centered body, and full-width cancel/confirm buttons with error-palette styling by default.
- `BaseDeleteDialog` props: `open`, `onClose`, `onConfirm`, `isLoading` (NOT `loading`), `title`, `body` (NOT `message`), `cancelLabel`, `confirmLabel`, optional `confirmSx`.
- The existing `labels.actions.revokeConfirm` text already includes the impact warning ("The teacher will need to re-connect") — no new translation keys were needed.
- The public props interface is preserved (`revoking` → internally mapped to `isLoading`), so no consumer changes were required.
- Reference pattern: `MeetingConfigDeleteDialog` and `SessionConfigDeleteDialog` follow the same thin-wrapper approach.

## Cross-File Dependencies

None. The consumer at `meetingIntegrationsTabShared.tsx` was not modified because the public props interface is unchanged.

## Deferred Items

None.
