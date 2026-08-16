# Task 6 Outcome: ViewModel Enhancement (Create/Update/Validation/Loading States)

## Summary

Enhanced `useWhatsappSettingsViewModel` with create/update mutations (`createWhatsappAccount`, `updateWhatsappAccount`), consolidated dialog state, per-row loading states, validation function exposure, `mutationError` state for inline error display, refactored snackbar to the new `{ message, severity } | null` pattern, and `refetchTemplates` for manual refresh. Wired the new ViewModel properties through to both desktop and mobile tier views via updated shared props and config view destructuring. Added comprehensive ViewModel integration tests covering loading, accounts population, opt-in defaults, query error handling, snackbar initial state, and sync/optIn loading flags.

## Files Modified (9)

### 1. `frontend/common/views/dashboard/settings/whatsapp/useWhatsappSettingsViewModel.ts`
- **Major refactor** — organized into composable hook functions:
  - `useWhatsappQueries()` — wraps `whatsappAccounts`, `isUserWhatsappOptIn`, `isWhatsappConfigured` queries
  - `useWhatsappMutations()` — wraps `delete`, `setAccessToken`, `setTwoStepPin`, `syncFromMeta`, `setOptIn`, `createAccount`, `updateAccount` mutations (new: `createAccount` and `updateAccount`)
  - `useDerivedWhatsappData()` — derives `accounts`, `templates` (from sync mutation result), `loading`, `isOptedIn`, `isConfigured`
  - `useWhatsappDialogs()` — consolidated `dialogState` object with `create | editName | editToken | editPin | deleteConfirm | null` type, plus `mutationError` state
  - `useWhatsappSnackbar()` — new `WhatsappSnackbar` pattern (`null | { message, severity }`), `showSnackbar` callback, `closeSnackbar`
  - `useWhatsappCreateHandler()` — `handleCreate` (validates `displayName` before mutation); manages `creating` loading state
  - `useWhatsappUpdateDeleteHandlers()` — `handleEditName` (validates `displayName`), `handleDelete`; manages `deletingId`, `updatingId` loading states
  - `useWhatsappUtilityHandlers()` — `handleSubmitToken`, `handleSubmitPin`, `handleSync`, `handleToggleOptIn`; manages `syncingId`, `optInLoading` loading states
  - `useWhatsappLabels()` — maps i18n translation keys for snackbar messages
  - `useRefetchers()` — wraps `refetchAccounts` and `refetchTemplates`
  - `buildWhatsappViewModel()` — assembles the flat ViewModel object from `WhatsappViewModelParts` with all state, handlers, validation functions, dialog state, and legacy aliases
- **New mutation actions**: `createAccountAction`, `buildCreateInput`, `buildUpdateInput`, `updateAccountAction` — pure async helpers that call mutations, refetch accounts, and show snackbar
- **`refetchTemplates`**: Implemented as a passthrough to `refetchAccounts()` (noted limitation: backend `whatsappTemplates` query resolver does not yet exist — templates come from sync mutation result)
- **Legacy aliases preserved**: `onDeleteAccount`, `onSetAccessToken`, `onSetTwoStepPin`, `onSyncFromMeta`, `onToggleOptIn`, `onDismissSnackbar` — all map to their `handle*` / `close*` counterparts for backward compatibility
- **`closeSnackbar`** also clears `mutationError` when the snackbar closes
- **Documented known limitation**: Templates persistence — `refetchTemplates` triggers `refetchAccounts()` which does NOT re-fetch templates from the server (no backend `whatsappTemplates` query). Templates persist only in Apollo cache from the last sync mutation.

### 2. `frontend/common/views/dashboard/settings/whatsapp/types/whatsappSettingsTypes.ts`
- **`WhatsappSettingsViewModel` interface** — major expansion:
  - Per-row loading states: `creating`, `deletingId`, `updatingId`, `syncingId`, `editingTokenForId`, `editingPinForId`, `syncing` (boolean alias), `optInLoading`
  - Error states: `mutationError: string | null`
  - New snackbar pattern: `snackbar: WhatsappSnackbar`, `closeSnackbar: () => void`
  - Validation function exposure: `validateDisplayName`, `validatePhoneNumberId`, `validateWabaId`, `validateAccessToken`, `validateTwoStepPin`
  - Consolidated dialog state: `dialogState: WhatsappDialogState`, `openCreateDialog`, `openEditNameDialog`, `openEditTokenDialog`, `openEditPinDialog`, `openDeleteConfirmDialog`, `closeDialog`
  - New handlers: `handleCreate`, `handleEditName`, `handleDelete`, `handleSubmitToken`, `handleSubmitPin`, `handleSync`, `handleToggleOptIn`
  - Refetch: `refetchAccounts`, `refetchTemplates`
  - Legacy deprecated aliases: `onDeleteAccount`, `onSetAccessToken`, `onSetTwoStepPin`, `onSyncFromMeta`, `onToggleOptIn`, `onDismissSnackbar`
- **`WhatsappSnackbar` type** — new pattern `{ message, severity } | null` (already added in Task 2, now consumed in ViewModel interface)
- **`WhatsappDialogState` interface** — consolidated `type: "create" | "editName" | "editToken" | "editPin" | "deleteConfirm" | null` with `accountId?` and `displayName?`

### 3. `frontend/common/views/dashboard/settings/whatsapp/tabs/components/NumbersSnackbar.tsx`
- Refactored to consume the new `WhatsappSnackbar` type (`null | { message, severity }`)
- Returns `null` when state is `null` (snackbar closed)
- Wraps `AppSnackbar` with `open: true` when state is non-null
- Props: `{ state: WhatsappSnackbar; onClose: () => void }` (all `readonly`)

### 4. `frontend/common/views/dashboard/settings/whatsapp/tabs/whatsappTabSharedProps.ts`
- **`NumbersTabSharedProps`** — updated to use new snackbar pattern and new ViewModel properties:
  - `snackbar: WhatsappSnackbar` (was `WhatsappSnackbarState`)
  - `deletingId: string | null` (already present from Task 2 types, now wired through)
  - Legacy handler prop names preserved (`onDeleteAccount`, `onSetAccessToken`, `onSetTwoStepPin`, `onSyncFromMeta`, `onDismissSnackbar`) — tier views still consume these via shared props

### 5. `frontend/desktop/views/dashboard/settings/whatsapp/tabs/NumbersTab.desktop.tsx`
- Updated to consume `snackbar: WhatsappSnackbar` via `NumbersSnackbar` component
- Passes `snackbar` and `onDismissSnackbar` to `NumbersSnackbar`
- `DeleteConfirmDialog` component accepts `state: DeleteDialogState` (unused but kept for future dialog consolidation)

### 6. `frontend/desktop/views/dashboard/settings/whatsapp/whatsappConfig.desktop.tsx`
- Destructures new ViewModel properties: `snackbar`, `deletingId`, `handleDelete`, `handleSubmitToken`, `handleSubmitPin`, `handleSync`, `closeSnackbar`
- Maps `handle*` names to legacy `on*` prop names when passing to `NumbersTabDesktop` (e.g., `onDeleteAccount={handleDelete}`, `onSetAccessToken={handleSubmitToken}`, `onDismissSnackbar={closeSnackbar}`)

### 7. `frontend/mobile/views/dashboard/settings/whatsapp/tabs/NumbersTab.mobile.tsx`
- Updated to consume `snackbar: WhatsappSnackbar` via `NumbersSnackbar` component
- Comments document that mobile view is read-only for accounts (sync and delete only, no credential editing)

### 8. `frontend/mobile/views/dashboard/settings/whatsapp/whatsappConfig.mobile.tsx`
- Same destructuring and mapping as desktop config view
- Maps `handle*` → `on*` legacy prop names for `NumbersTabMobile`

### 9. `test/ui/components/useWhatsappSettingsViewModel.test.tsx`
- **6 ViewModel integration tests** (Q3.1–Q3.6) using Apollo `MockLink`:
  - Q3.1: loading=true while queries pending, then accounts populate with full field round-trip verification
  - Q3.2: `isOptedIn` defaults to `false` when query returns `null`
  - Q3.3: `isOptedIn=true` when query returns `true`
  - Q3.4: accounts default to empty array on query error
  - Q3.5: snackbar starts closed (`null` — new pattern from Task 2)
  - Q3.6: sync and optIn loading flags start `false`
- Uses effect-based capture pattern (no `renderHook` in this `@testing-library/react` version) — consumer component with `useEffect` capturing ViewModel snapshots
- `mockNextNavigation` for Next.js router mock
- `renderWithWrapper` from `TestWrapper` for Apollo Provider + locale context

## Files NOT Modified (and why)

- **`frontend/common/views/dashboard/settings/whatsapp/WhatsappConfigView.tsx`** — The switcher only needs `WhatsappConfigViewSharedProps` which inherits from `WhatsappConfigViewProps`. The new ViewModel properties flow through `WhatsappConfigViewSharedProps` which already extends the ViewModel type. No changes needed here — the switcher passes `viewModel` directly to tier views via `ResponsiveViewSwitch`.
- **`frontend/common/graphql/sharedDocuments/whatsapp/whatsapp.documents.ts`** — `createWhatsappAccountMutationDocument` and `updateWhatsappAccountMutationDocument` were already present (added in earlier work). No new GraphQL documents needed for this task.
- **`frontend/common/views/dashboard/settings/whatsapp/whatsappFormValidation.ts`** — Validators were already created in Task 2. Task 6 imports and exposes them on the ViewModel; no changes to the validation functions themselves.
- **`backend/graphql/`** — Backend resolver for `whatsappTemplates` query does not exist (documented in Task 3 outcome). Task 6 uses the sync mutation's template snapshot data instead. Backend changes are out of scope (Task 9 dependency).

## Verification Results

| Check | Result |
|-------|--------|
| tsgo (global) | ✅ 0 errors |
| oxlint (per-file sub-loop) | ✅ clean |
| biome:check (global) | ✅ clean (1 file auto-fixed) |
| lint (global) | ✅ clean |
| codescene (per-file sub-loop) | ✅ clean |
| test:ui:components (ViewModel tests Q3.1–Q3.6) | ✅ 6/6 pass |
| sub-loop codescene — useWhatsappSettingsViewModel.ts | ✅ all checks pass |
| sub-loop codescene — whatsappSettingsTypes.ts | ✅ all checks pass |
| sub-loop codescene — whatsappTabSharedProps.ts | ✅ all checks pass |
| sub-loop codescene — NumbersSnackbar.tsx | ✅ all checks pass |
| sub-loop codescene — whatsappConfig.desktop.tsx | ✅ all checks pass |
| sub-loop codescene — whatsappConfig.mobile.tsx | ✅ all checks pass |
| sub-loop codescene — NumbersTab.desktop.tsx | ✅ all checks pass |
| sub-loop codescene — NumbersTab.mobile.tsx | ✅ all checks pass |

All quality checks pass for all 9 modified files.

## Carry-Forward Knowledge for Future Subtasks

1. **ViewModel hook composition pattern**: The ViewModel is organized into composable sub-hooks (`useWhatsappQueries`, `useWhatsappMutations`, `useDerivedWhatsappData`, `useWhatsappDialogs`, `useWhatsappSnackbar`, `useWhatsappCreateHandler`, `useWhatsappUpdateDeleteHandlers`, `useWhatsappUtilityHandlers`, `useWhatsappLabels`, `useRefetchers`) with a `buildWhatsappViewModel` assembler that takes a `WhatsappViewModelParts` interface. Future tasks should follow this pattern when adding new state/handlers — add to the relevant sub-hook, then update `buildWhatsappViewModel` and `WhatsappSettingsViewModel` interface.

2. **Legacy alias pattern**: All new `handle*` handlers have deprecated `on*` aliases on the ViewModel for backward compatibility. Tier views currently consume `on*` names via `NumbersTabSharedProps`. When Task 7/8 updates tier views to use `handle*` directly, the aliases can eventually be removed.

3. **`dialogState` is consolidated**: A single `WhatsappDialogState` object replaces individual booleans. Future dialog-rendering tasks (7/8/10) should read `dialogState.type` to decide which dialog to render, and call `openCreateDialog`/`openEditNameDialog`/etc. to set the state.

4. **`mutationError` for inline form errors**: `handleCreate` and `handleEditName` call `setMutationError` on validation failure. Form dialogs should display `mutationError` inline (near the form field or at the top of the dialog). `closeDialog` and `closeSnackbar` both clear `mutationError`.

5. **`refetchTemplates` is a passthrough**: Currently calls `refetchAccounts()` — does NOT re-fetch templates from the server. This will not work correctly until Task 9 creates the backend `whatsappTemplates` query resolver. Templates currently persist only in Apollo cache from the last `syncWhatsappAccountsFromMeta` mutation result.

6. **`syncingId` uses sentinel value `"all"`**: Since sync is a bulk operation (all accounts), `syncingId` is set to `"all"` (string) when syncing, `null` otherwise. This is distinct from `deletingId`/`updatingId` which hold actual account IDs.

7. **`closeSnackbar` also clears `mutationError`**: When the snackbar closes, any inline mutation error is also cleared. This prevents stale error messages from lingering after a snackbar dismiss.

8. **Test harness pattern**: UI component tests use a consumer component with `useEffect`-based capture (not `renderHook`) because `renderHook` is unavailable in the installed `@testing-library/react` version. `ViewModelSnapshot` captures key fields. Future ViewModel tests should extend this pattern.

9. **`NumbersTabSharedProps` still uses legacy `on*` names**: The shared props bridge maps `handle*` → `on*` at the config-view level (desktop/mobile). Task 7 or 8 should update `NumbersTabSharedProps` to use `handle*` names directly, then remove the legacy aliases from the ViewModel interface.

## Cross-File Dependencies Discovered

1. **`whatsappTemplates` backend query resolver missing** (Task 9 dependency): `refetchTemplates` cannot truly re-fetch templates from the server. Templates come from the `syncWhatsappAccountsFromMeta` mutation result's `templates` field. Task 3 documented this with commented-out stub documents in `whatsapp.documents.ts`. Task 9 must create the backend resolver, uncomment the stubs, and run codegen.

2. **`NumbersTabSharedProps` uses legacy `on*` prop names**: The shared props for NumbersTab (desktop + mobile) still define `onDeleteAccount`, `onSetAccessToken`, `onSetTwoStepPin`, `onSyncFromMeta`, `onDismissSnackbar` — these are the deprecated ViewModel aliases. Config views map `handle*` → `on*` when passing props. Future task (7 or 8) should migrate the shared props interface to `handle*` names.

3. **`TemplatesTabSharedProps` and `OptInTabSharedProps`** (in `whatsappTabSharedProps.ts`): Still use `onSyncFromMeta` and `onToggleOptIn` respectively. These are also legacy aliases. Same migration path as above.

4. **`DeleteConfirmDialog` in `NumbersTab.desktop.tsx`**: Has an unused `state: DeleteDialogState` prop in its function signature (line 55) that doesn't match the `Readonly<{...}>` props block (which doesn't destructure `state`). This is a pre-existing minor issue — the dialog renders correctly but the `state` param is dead. Should be cleaned up in a future component refinement task.
