# Task 18b Outcome — MeetingConfigsManager Enhanced Container

## Summary

Enhanced `MeetingConfigsManager.tsx` from a simple list+dialog container into a full orchestration layer for ALL profile-side meeting config components. The manager now composes `OAuthCallbackHandler`, `AutoGenerationSupportCallout` (with `onCreateConfig`), `ReauthNeededBanner` + `ReconnectAllAction`, `ConnectProviderAccount` list, `TokenExpiryWarning` (per-provider), `MeetingConfigList`, form/delete dialogs, and `DisconnectConfirmDialog`. The manager owns NO visual styling — it is pure composition using `<Stack spacing={2}>`. All labels are delegated to per-component `labels` props sourced from the ViewModel. The manager does NOT call `useAppTranslation` (per Rule 7); it only calls `useAppLocale()` for locale context.

The ViewModel (`useMeetingConfigsManagerViewModel.ts`) was enhanced with 6 new fields: `navigateToSettings`, `handleOAuthCallback`, `reconnectAllProvider`, `onReconnectAllComplete`, `providerTokenExpiryMap`, and `reconnectingFor`. A module-scope `showReconnectBatchToast` helper was extracted to keep `onReconnectAllComplete` under the cognitive complexity threshold.

## Files Modified

- `frontend/common/views/dashboard/profile/shared/meeting-configs/MeetingConfigsManager.tsx` — complete rewrite as orchestration container: new imports for `OAuthCallbackHandler`, `ReconnectAllAction`, `TokenExpiryWarning`, `DisconnectConfirmDialog`, `SettingsOutlinedIcon`; extracted `renderRowExtraRow`/`renderRowExtraFactory`/`buildProviderNameMap` to module scope; refactored `MeetingConfigDialogs` into 3 sub-sections (`MeetingConfigFormDialogSection`, `MeetingConfigDeleteDialogSection`, `MeetingConfigSnackbarSection`); composed all enhanced components in render order
- `frontend/common/views/dashboard/profile/shared/meeting-configs/useMeetingConfigsManagerViewModel.ts` — added `useNotifications`, `useRouter`, `useRef` imports; added `reconnectingFor` state, `navigateToSettings` callback, `reconnectUrlsRef` ref, `providerTokenExpiryMap` useMemo, `handleOAuthCallback` callback, `reconnectAllProvider` callback, `onReconnectAllComplete` callback; extracted `showReconnectBatchToast` module-scope helper; exposed all 6 new fields on return object
- `shared/locale/types/ui/index.ts` — added `cancel`, `disconnectError`, `navigateToAdminSettings`, `navigateToAdminSettingsAriaLabel` to `MeetingConfigEnhancementLabels` interface
- `shared/locale/types/ui/meetingConfigEnhancements.ts` — added `navigateToAdminSettings` and `navigateToAdminSettingsAriaLabel` to the interface
- `shared/locale/en/ui/meetingConfig/enhancements.ts` — added EN strings: `"Admin Provider Settings"`, `"Open admin meeting provider settings"`
- `shared/locale/ar/ui/meetingConfig/enhancements.ts` — added AR strings: `"إعدادات المزود الإدارية"`, `"فتح إعدادات مزود الاجتماعات الإدارية"`
- `.ai/plans/auto-meeting-url/ui/tasks.md` — updated task 18b checkbox from `[ ]` to `[x]`

## Component Design

### Orchestration Render Order

```
<Stack spacing={2}>
  <OAuthCallbackHandler />                      // OAuth callback detection (task 11)
  <AutoGenerationSupportCallout />              // Auto-gen guide (task 18), onCreateConfig wired
  {reauthProviders.length > 0 && (
    <>
      <ReauthNeededBanner />                   // Reauth banner (task 14)
      <ReconnectAllAction />                    // Batch reconnect (task 13)
    </>
  )}
  <Stack flexDirection="row" justifyContent="flex-end">
    {canManage ? <Button>Add</Button>           // Add config (managers only)
              : <Button>Admin Provider Settings</Button>}  // Cross-link (non-managers)
  </Stack>
  {canManage && connectProviderAccountItems.length > 0 && (
    <Stack spacing={1.5}>
      {connectProviderAccountItems.map(item => (
        <ConnectProviderAccount />              // Per-provider connect/reconnect/disconnect (task 12)
      ))}
    </Stack>
  )}
  {providerTokenExpiryMap.size > 0 && (
    <Stack spacing={1}>
      {providerTokenExpiryMap.entries().map(([slug, expiresAt]) => (
        <TokenExpiryWarning />                   // Per-provider expiry warning (task 17)
      ))}
    </Stack>
  )}
  <MeetingConfigList />                         // Config list with edit/delete/default
  <MeetingConfigDialogs />                       // Form + delete + snackbar dialogs
  <DisconnectConfirmDialog />                    // Disconnect confirmation (task 14b)
</Stack>
```

### ViewModel New Fields

| Field | Type | Purpose |
|-------|------|---------|
| `navigateToSettings` | `() => void` | Routes to `/[locale]/settings/meeting-integrations` |
| `handleOAuthCallback` | `(status: OAuthCallbackStatus) => void` | Processes OAuth callback query params, shows success/error toast |
| `reconnectAllProvider` | `(slug: string) => Promise<boolean>` | Reconnects a single provider within batch flow; collects authorize URL in `reconnectUrlsRef` instead of redirecting |
| `onReconnectAllComplete` | `(reconnectedCount: number, failedCount: number) => void` | Shows toast with counts, opens collected OAuth URLs in tabs |
| `providerTokenExpiryMap` | `ReadonlyMap<string, Date>` | Map of provider slug → token expiry date for providers expiring within 7 days |
| `reconnectingFor` | `string \| null` | Tracks which provider is currently being reconnected (for `TokenExpiryWarning` loading state) |

### Key Design Decisions

1. **Pure composition (no styling)**: The manager uses only `<Stack spacing={2}>` for vertical layout. No `Card`, `Box`, `Paper`, or theme `sx` props. The only `sx` usage is `flexDirection`/`justifyContent` on the button row — purely structural, not visual styling.

2. **Rule 7 compliance**: The manager does NOT call `useAppTranslation`. It calls `useAppLocale()` (locale context, not translation) and receives all labels via `state.labels.*` from the ViewModel.

3. **`showReconnectBatchToast` module-scope helper**: Extracted from `onReconnectAllComplete` to keep cognitive complexity under 15. The helper takes `notifications`, `enhancements`, `reconnectedCount`, `failedCount` and shows the appropriate toast (success/error/warning) based on the counts.

4. **`reconnectUrlsRef` pattern**: Uses `useRef<Map<string, string>>` to collect OAuth authorize URLs during batch reconnect. The ref persists across renders and is accessible in both `reconnectAllProvider` (which populates it) and `onReconnectAllComplete` (which opens the URLs in tabs and clears the map). This replaces the `globalThis.window.__reconnectUrls` pattern which triggered lint errors.

5. **`navigateToSettings` cross-link**: Non-managers (teachers/students) see an "Admin Provider Settings" button that navigates to the settings meeting-integrations tab. Managers see the "Add" button instead. The button uses `SettingsOutlinedIcon` and `aria-label` for accessibility.

6. **`DisconnectConfirmDialog` wiring**: Uses local `disconnectTarget` state. `onDisconnect` on `ConnectProviderAccount` is wired to `setDisconnectTarget` (accepts the slug string). `onConfirm` calls `state.disconnectProvider(disconnectTarget)` then clears the target.

7. **`TokenExpiryWarning` per-provider**: Maps `state.providerTokenExpiryMap.entries()` to render a `TokenExpiryWarning` for each provider with an expiring token. Uses `providerNameMap` (built from connected providers + configs) to resolve display names. `reconnecting` state tracks `state.reconnectingFor === slug`.

8. **Refactored `MeetingConfigDialogs`**: Split into 3 sub-components (`MeetingConfigFormDialogSection`, `MeetingConfigDeleteDialogSection`, `MeetingConfigSnackbarSection`) to keep cognitive complexity under threshold. Each sub-component receives only the props it needs via `Pick`.

9. **Extracted `renderRowExtraFactory`**: Moved the `renderRowExtra` closure to a module-scope factory + `renderRowExtraRow` function to reduce the main component's cognitive complexity.

10. **Extracted `buildProviderNameMap`**: Module-scope function that builds a `Map<string, string>` of provider slug → display name from `connectProviderAccountItems` and `configs`.

### Labels Added

| Key | Type | EN | AR |
|-----|------|----|----|
| `navigateToAdminSettings` | `string` | "Admin Provider Settings" | "إعدادات المزود الإدارية" |
| `navigateToAdminSettingsAriaLabel` | `string` | "Open admin meeting provider settings" | "فتح إعدادات مزود الاجتماعات الإدارية" |

## Verification Results

### MeetingConfigsManager.tsx (lint lifecycle)
```
bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/profile/shared/meeting-configs/MeetingConfigsManager.tsx --lifecycle lint
✅ tsgo passed
✅ oxlint passed
✅ biome:check passed
✅ lint:type-aware passed
✅ All checks for lifecycle "lint" passed. (exit code 0)
```

### useMeetingConfigsManagerViewModel.ts (lint lifecycle)
```
bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/profile/shared/meeting-configs/useMeetingConfigsManagerViewModel.ts --lifecycle lint
✅ tsgo passed
✅ oxlint passed
✅ biome:check passed
✅ lint:type-aware passed
✅ All checks for lifecycle "lint" passed. (exit code 0)
```

### shared/locale/types/ui/index.ts (lint lifecycle)
```
bun run scripts/health/sub-loop.ts shared/locale/types/ui/index.ts --lifecycle lint
✅ tsgo passed
✅ oxlint passed
✅ biome:check passed
✅ lint:type-aware passed
✅ All checks for lifecycle "lint" passed. (exit code 0)
```

### shared/locale/types/ui/meetingConfigEnhancements.ts (lint lifecycle)
```
bun run scripts/health/sub-loop.ts shared/locale/types/ui/meetingConfigEnhancements.ts --lifecycle lint
✅ tsgo passed
✅ oxlint passed
✅ biome:check passed
✅ lint:type-aware passed
✅ All checks for lifecycle "lint" passed. (exit code 0)
```

### shared/locale/en/ui/meetingConfig/enhancements.ts (lint lifecycle)
```
bun run scripts/health/sub-loop.ts shared/locale/en/ui/meetingConfig/enhancements.ts --lifecycle lint
✅ tsgo passed
✅ oxlint passed
✅ biome:check passed
✅ lint:type-aware passed
✅ All checks for lifecycle "lint" passed. (exit code 0)
```

### shared/locale/ar/ui/meetingConfig/enhancements.ts (lint lifecycle)
```
bun run scripts/health/sub-loop.ts shared/locale/ar/ui/meetingConfig/enhancements.ts --lifecycle lint
✅ tsgo passed
✅ oxlint passed
✅ biome:check passed
✅ lint:type-aware passed
✅ All checks for lifecycle "lint" passed. (exit code 0)
```

## Carry-Forward Knowledge

### For Task 30 (ViewModel finalization)
The ViewModel now exposes all fields needed by the enhanced manager. Task 30 should verify:
1. All 6 new fields are properly typed on the return object
2. `reconnectAllProvider` correctly uses `reconnectUrlsRef` (not `globalThis.window.__reconnectUrls`)
3. `handleOAuthCallback` correctly processes OAuth callback status and refetches connected providers

### For Task 31 (Settings tab cross-link)
The `navigateToSettings` callback uses `router.push(\`/${locale}/settings/meeting-integrations\`)`. Task 31 should verify the settings tab route exists and accepts the navigation.

### For Storybook stories (task 35b)
`MeetingConfigsManager.stories.tsx` will need:
1. Mock `OAuthCallbackHandler` (or provide the `labels.enhancements` prop)
2. Mock `ReconnectAllAction` (or provide `reauthProviders` with 2+ entries)
3. Mock `TokenExpiryWarning` (or provide `providerTokenExpiryMap` entries)
4. Mock `DisconnectConfirmDialog` (or provide `disconnectTarget` state)
5. The `labels.enhancements` constant needs the new `navigateToAdminSettings` and `navigateToAdminSettingsAriaLabel` keys

## Cross-File Dependencies

- **Task 11 (OAuthCallbackHandler)**: Integrated at top of render stack; receives `labels.enhancements` and `onCallbackDetected={state.handleOAuthCallback}`
- **Task 12 (ConnectProviderAccount)**: Already integrated; `onDisconnect` now wired to local `setDisconnectTarget` state for `DisconnectConfirmDialog`
- **Task 13 (ReconnectAllAction)**: Integrated inside `reauthProviders.length > 0` branch; receives `providers`, `labels.enhancements`, `onReconnectProvider`, `onComplete`
- **Task 14 (ReauthNeededBanner)**: Already integrated; rendered above `ReconnectAllAction`
- **Task 14b (DisconnectConfirmDialog)**: Integrated at bottom of render stack; wired to `disconnectTarget` state
- **Task 17 (TokenExpiryWarning)**: Integrated per-provider section mapping `providerTokenExpiryMap`
- **Task 18 (AutoGenerationSupportCallout)**: Already integrated; now has `onCreateConfig={canManage ? state.openCreateForm : undefined}`
- **Task 31 (Settings tab cross-link)**: `navigateToSettings` callback provides the cross-link handler

## Deferred Items

- Desktop/mobile tier split: Not warranted — the manager is pure composition with no visual styling. A single shared composition works for both tiers. `ResponsiveViewSwitch` + `createLazyView` would only be needed if the layout structure differs significantly between desktop and mobile.
- Storybook stories for the enhanced manager (task 35b)
- Component tests for orchestrated interactions (task 35)
- Full codescene lifecycle sweep (task 18b ran lint lifecycle; codescene can be run during full quality-gate)
