# Task 10: Delete Confirm with Account Name & Per-Row Loading — Outcome

## Summary

Repaired the `DeleteConfirmDialog` in both desktop and mobile NumbersTab views to display the account name via the `deleteConfirmMessage` interpolation key. Wired per-row `LinearProgress` overlays for deletion (`deletingId`) and per-row sync icon spinners (`syncingId`) from the ViewModel.

## Changes Made

### 1. `whatsappTabSharedProps.ts` — Added new props to `NumbersTabSharedProps`
- Added `syncingId: string | null` — per-row syncing indicator (null or sentinel `"all"` when bulk syncing)
- Added `onOpenDeleteConfirmDialog: (accountId: string, displayName: string) => void` — opens the delete confirmation dialog with the account's display name

### 2. `WhatsappTabPanels.tsx` — Wired new props from ViewModel
- `NumbersTabPanel` now passes `syncingId: viewModel.syncingId` to `ResponsiveViewSwitch`
- `NumbersTabPanel` now passes `onOpenDeleteConfirmDialog: viewModel.openDeleteConfirmDialog` to `ResponsiveViewSwitch`

### 3. `NumbersTab.desktop.tsx` — Major changes (primary deliverable)
- **Fixed `DeleteConfirmDialog`**: Replaced the ignored `state` prop with `displayName: string`. Dialog body now uses `labels.deleteConfirmMessage(displayName)` interpolation ("Are you sure you want to delete '{displayName}'?"). Dialog title uses `labels.deleteConfirmTitle`.
- **Removed local delete dialog state**: Eliminated the buggy `DeleteDialogState` interface and local `deleteDialog` state. Delete confirm now renders based on `dialogState.type === "deleteConfirm"` from the ViewModel, with `dialogState.displayName` passed to the dialog.
- **Per-row `LinearProgress` overlay**: Each `NumberCard` is wrapped in a positioned `Box`. When `deletingId === account.id`, a `LinearProgress` overlay appears at the top of the card.
- **Per-row sync icon spinner**: When `syncingId !== null`, the sync icon in each card's action area shows a `CircularProgress` spinner.
- **Delete flow**: Delete button now calls `onOpenDeleteConfirmDialog(account.id, displayName)` which sets `dialogState` in the ViewModel. `handleDeleteConfirm` reads `dialogState.accountId` and calls `onDeleteAccount`, then `onCloseDialog()`.
- **CodeScene Large Method fix**: Extracted `useCredentialMenuState` hook (menu + credential dialog state/handlers) and `NumbersTabDialogs` component (all dialog rendering) from the main `NumbersTabDesktop` function to reduce its line count from 143 to ~99 lines.

### 4. `NumbersTab.mobile.tsx` — Major changes (primary deliverable)
- **Added `DeleteConfirmDialogMobile` component**: Same pattern as desktop — uses `deleteConfirmMessage(displayName)` interpolation and `deleteConfirmTitle` for the title.
- **Per-row `LinearProgress` overlay**: Each account card wrapped in positioned `Box` with `LinearProgress` overlay when `deletingId === account.id`.
- **Per-row sync icon spinner**: When `syncingId !== null`, sync icon shows `CircularProgress` spinner.
- **Delete flow**: Delete button now calls `onOpenDeleteConfirmDialog(account.id, displayName)` instead of directly calling `onDeleteAccount`. `handleDeleteConfirm` reads from `dialogState.accountId`.
- **Sync button**: Uses `startIcon` with conditional `CircularProgress` when syncing.

## Key Design Decisions

1. **ViewModel `dialogState` is the single source of truth**: The delete confirmation dialog now reads `dialogState.type`, `dialogState.accountId`, and `dialogState.displayName` from the ViewModel instead of maintaining local state. This was already available from Task 6 but never wired to the UI.

2. **`syncingId` is a bulk-sync sentinel**: `syncingId` is `"all"` when syncing (not a per-account ID). All rows show the sync spinner when `syncingId !== null` — this is correct because sync is a bulk operation that affects all accounts.

3. **`deleteConfirmMessage` interpolation**: The i18n key is a function `(displayName: string) => string`, added in Task 1. Now properly consumed: English: `Are you sure you want to delete "{displayName}"? This action cannot be undone.`

4. **CodeScene fix via hook extraction**: The `useCredentialMenuState` hook encapsulates menu anchor state, credential dialog state, and all related handlers. The `NumbersTabDialogs` component encapsulates all dialog rendering. Both are at module scope, keeping `NumbersTabDesktop` as a thin orchestrator.

## Files Modified
- `frontend/common/views/dashboard/settings/whatsapp/tabs/whatsappTabSharedProps.ts`
- `frontend/common/views/dashboard/settings/whatsapp/WhatsappTabPanels.tsx`
- `frontend/desktop/views/dashboard/settings/whatsapp/tabs/NumbersTab.desktop.tsx`
- `frontend/mobile/views/dashboard/settings/whatsapp/tabs/NumbersTab.mobile.tsx`

## Quality Verification
- ✅ `sub-loop --lifecycle codescene` on `NumbersTab.desktop.tsx` — all checks pass (tsgo, oxlint, biome, lint:type-aware, duplicates, codescene)
- ✅ `sub-loop --lifecycle codescene` on `NumbersTab.mobile.tsx` — all checks pass
- ✅ `sub-loop --lifecycle codescene` on `whatsappTabSharedProps.ts` — all checks pass
- ✅ `sub-loop --lifecycle codescene` on `WhatsappTabPanels.tsx` — all checks pass
- ✅ `bun tsgo` — passes clean
- ✅ `bun biome:check` — passes clean
- ✅ `bun run lint` — passes clean

## Requirements Met
- **UI-REQ-7**: Delete confirmation dialog shows the account name via `deleteConfirmMessage` interpolation
- **UI-REQ-8**: Per-row loading states (LinearProgress for deletion, sync icon spinner for syncing) wired from ViewModel's `deletingId` and `syncingId`
