# Task 14: Mobile Numbers Tab Full CRUD — Outcome

## Summary

Implemented full CRUD on mobile NumbersTab, achieving parity with the desktop variant. The mobile tab now supports creating accounts, editing names, editing credentials (token/PIN) with `fullScreen` dialogs, deleting with confirmation, and per-row loading states.

## Files Modified

1. **`frontend/mobile/views/dashboard/settings/whatsapp/tabs/NumbersTab.mobile.tsx`** — Complete rewrite with full CRUD
2. **`frontend/common/views/dashboard/settings/whatsapp/tabs/whatsappTabSharedProps.ts`** — Added `editingTokenForId`, `editingPinForId`, `validateAccessToken`, `validateTwoStepPin` to `NumbersTabSharedProps`
3. **`frontend/common/views/dashboard/settings/whatsapp/WhatsappTabPanels.tsx`** — Pass new props from ViewModel to ResponsiveViewSwitch

## Changes

### NumbersTab.mobile.tsx

- **Per-card action menu**: MUI `Menu` with `MoreVertOutlined` IconButton per account card (matches existing mobile pattern from permissionGroupCardList.mobile.tsx). Menu items: Edit Name, Edit Token, Edit Pin, Delete.
- **CredentialEditDialogMobile**: Component for editing access token or two-step PIN with `fullScreen` on mobile. Includes validation (`validateAccessToken`, `validateTwoStepPin`), loading state, and submit/cancel handlers.
- **DeleteConfirmDialogMobile**: `DeleteConfirmDialog` with `fullScreen` wrapper for mobile viewport.
- **SkeletonAccountCard**: Loading placeholder displayed during account creation.
- **useMobileCredMenuState hook**: Module-level hook managing menu anchor, selected account, and credential dialog type (token vs pin vs closed).
- **isCardBusy helper**: Module-level function checking if a card is in any loading state (deleting, updating, editingToken, editingPin).
- **AccountsListMobile**: Extracted component rendering account cards with action menu triggers and LinearProgress overlay for busy cards.
- **AccountActionMenuMobile**: Extracted component for the per-card Menu with permission-gated items.
- **NumbersHeaderMobile**: Extracted component for the header with title, subtitle, and "Add Account" button.
- **CreateAccountDialog** and **EditNameDialog**: Reuses the same shared components as desktop (from Task 8).

### whatsappTabSharedProps.ts

- Added `editingTokenForId: string | null` — ViewModel state for which account is currently editing its token
- Added `editingPinForId: string | null` — ViewModel state for which account is currently editing its PIN
- Added `validateAccessToken: (value: string) => string | null` — validation function for access token input
- Added `validateTwoStepPin: (value: string) => string | null` — validation function for PIN input

### WhatsappTabPanels.tsx

- Passes `editingTokenForId`, `editingPinForId` from ViewModel to ResponsiveViewSwitch in NumbersTabPanel
- Passes `validateAccessToken`, `validateTwoStepPin` from ViewModel to ResponsiveViewSwitch in NumbersTabPanel

## Patterns Used

- **Mobile isolation**: No `useMediaQuery` or `useViewport` imports; `fullScreen` applied unconditionally on mobile dialogs
- **Per-card action menu**: MUI `Menu` with `MoreVertOutlined` (existing project pattern, not SpeedDial/BottomSheet)
- **Permission gating**: `RequirePermission` with `AppPermission.WhatsappConfigManage` wrapping admin actions
- **Module-level extraction**: All sub-components, hooks, and helpers extracted to module scope to avoid CodeScene Large Method warnings
- **i18n**: All labels via `useAppTranslation("whatsapp")` → `WhatsappLabels` type
- **Path aliases**: All imports use `@/` path aliases
- **Validation**: Uses ViewModel's `validateAccessToken` and `validateTwoStepPin` for credential input validation
- **Per-row loading**: `isCardBusy` checks multiple loading states; `LinearProgress` overlay on busy cards

## Quality Verification

All per-file and global checks passed:

- ✅ `sub-loop --lifecycle codescene` on all 3 modified files
- ✅ `tsgo` (global) — exit code 0
- ✅ `biome:check` (global) — exit code 0
- ✅ `lint` (global) — exit code 0

## Requirements Met

- **UI-REQ-12**: Mobile Numbers Tab Full CRUD
