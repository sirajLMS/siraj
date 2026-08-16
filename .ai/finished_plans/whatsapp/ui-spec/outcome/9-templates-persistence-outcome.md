# Task 9: Template Persistence & Body Preview — Outcome

## Summary

Wired the `whatsappTemplates` data (from sync mutation snapshot) to `TemplatesTabContent.tsx` with expandable body preview, localized status labels, empty state with Sync CTA (permission-gated), and error state with retry button.

## Changes Made

### 1. `whatsappTabSharedProps.ts` — Added error/retry props
- Added `queryError: boolean` to `TemplatesTabSharedProps`
- Added `onRetry: () => void` to `TemplatesTabSharedProps`

### 2. `whatsappSettingsTypes.ts` — Added queryError to ViewModel
- Added `queryError: boolean` to `WhatsappSettingsViewModel` interface

### 3. `useWhatsappSettingsViewModel.ts` — Exposed queryError, refactored for CodeScene
- `useDerivedWhatsappData` now returns `queryError = !!accountsQuery.error`
- `WhatsappViewModelParts` interface includes `queryError`
- `buildWhatsappViewModel` passes `queryError` through to the ViewModel
- Main hook destructures and passes `queryError` to `buildWhatsappViewModel`
- Extracted `useWhatsappSnackbarAndEditing` hook (closeSnackbar + editing IDs) to reduce main hook LoC
- Extracted `useWhatsappHandlers` hook (create/update/delete/utility handlers) to reduce main hook LoC

### 4. `WhatsappTabPanels.tsx` — Wired new props to TemplatesTabPanel
- `TemplatesTabPanel` now passes `queryError: viewModel.queryError` and `onRetry: viewModel.refetchTemplates` to `ResponsiveViewSwitch`

### 5. `TemplatesTabContent.tsx` — Major rewrite (primary deliverable)
- **Localized status labels**: `StatusBadge` now shows localized labels via `getTemplateStatusLabelKey()` → `WhatsappLabels` lookup, with type-safe `isTemplateStatusLabelKey` type guard
- **Expandable body preview**: Each template card uses `CardActionArea` + `Collapse` with a chevron toggle. Expand reveals `language`, `category`, `status` (localized), `lastSyncedAt`. Body/buttons fields noted as deferred until backend schema exposes them.
- **Empty state with Sync CTA**: When `templates.length === 0`, shows a centered `SyncOutlined` icon, `t.noTemplates` text, and a `RequirePermission`-gated `Button` with `AppPermission.WhatsappTemplatesManage`
- **Error state with retry**: When `queryError` is true, shows `ErrorOutlineOutlined` icon, `t.errorGenericTitle`, `t.errorGeneric`, and a retry button calling `onRetry`
- **Loading state**: Preserved from prior implementation (circular progress when `loading && !syncing`)

### Desktop/Mobile Wrappers
- `TemplatesTab.desktop.tsx` and `TemplatesTab.mobile.tsx` — No changes needed; both are thin wrappers that pass props to the shared `TemplatesTabContent`, which handles everything internally

## Key Design Decisions

1. **No backend resolver created**: Templates come from the `syncWhatsappAccountsFromMeta` mutation result snapshot, per task constraints. `refetchTemplates` calls `refetchAccounts()` (no standalone query exists).

2. **Body/buttons fields deferred**: `WhatsappTemplateSnapshotFieldsFragment` only has `id`, `name`, `language`, `status`, `category`, `lastSyncedAt`. The `body` and `buttons` fields don't exist in the fragment. The expand section shows available fields with a comment noting future backend schema additions.

3. **Collapsible card approach**: Instead of AppDataGrid detail panels (no existing pattern in codebase), used a simple `Card` + `CardActionArea` + `Collapse` pattern that works identically on desktop and mobile through the shared component.

4. **Type-safe i18n key resolution**: `isTemplateStatusLabelKey` type guard narrows the string to `TemplateStatusLabelKey` without unsafe type assertions, satisfying oxlint `no-unsafe-type-assertion` rule.

5. **CodeScene Large Method fix**: Extracted `useWhatsappSnackbarAndEditing` and `useWhatsappHandlers` hooks from the main `useWhatsappSettingsViewModel` function to reduce its line count below the CodeScene threshold.

## Files Modified
- `frontend/common/views/dashboard/settings/whatsapp/tabs/whatsappTabSharedProps.ts`
- `frontend/common/views/dashboard/settings/whatsapp/types/whatsappSettingsTypes.ts`
- `frontend/common/views/dashboard/settings/whatsapp/useWhatsappSettingsViewModel.ts`
- `frontend/common/views/dashboard/settings/whatsapp/WhatsappTabPanels.tsx`
- `frontend/common/views/dashboard/settings/whatsapp/tabs/shared/TemplatesTabContent.tsx`

## Quality Verification
- ✅ `bun tsgo` — passes clean
- ✅ `bun biome:check` — passes clean
- ✅ `bun run lint` — passes clean
- ✅ `sub-loop --lifecycle codescene` — all modified files pass

## Requirements Met
- **UI-REQ-2**: Template body preview (expand row/card showing body content, language, category, buttons — language/category/status/lastSyncedAt shown; body/buttons deferred pending backend schema)
- **UI-REQ-3**: Template persistence display (templates from sync mutation snapshot shown on mount)
