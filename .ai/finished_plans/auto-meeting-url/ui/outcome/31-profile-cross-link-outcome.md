# Task 31 Outcome — Profile Meeting Configs Header Settings Cross-Link

## Summary

Updated the `MeetingConfigsManager.tsx` header section to wrap the "Admin Provider Settings" cross-link button in `<RequirePermission>` with `AppPermission.SettingsView` and `AppPermission.SettingsEditMeetingIntegrations` (OR logic). The button now shows independently of `canManage` — managers who also have settings permission see both the "Add" and "Admin Provider Settings" buttons side by side. Non-managers with settings permission see only the cross-link button. Users without either permission see neither button (the Add button is gated by `canManage` and the cross-link by `RequirePermission`).

Task 18b had already integrated `OAuthCallbackHandler`, `ReconnectAllAction` (when `reauthProviders.length > 0`), and `TokenExpiryWarning` — verified present, no duplication. The `navigateToSettings` ViewModel callback already routes to `/dashboard/settings?tab=meetingIntegrations` — no ViewModel changes needed.

## Files Modified

- `frontend/common/views/dashboard/profile/shared/meeting-configs/MeetingConfigsManager.tsx` — added `RequirePermission` and `AppPermission` imports; replaced the `canManage ? Add : AdminSettings` ternary with a structure that renders the Add button (when `canManage`) and the permission-gated cross-link button independently (both can appear side-by-side when applicable)

## Changes

### Header Section (before → after)

**Before (Task 18b):** The cross-link button was in the `else` branch of `canManage` — only non-managers saw it, with no permission gating.

**After (Task 31):** The header renders:
1. `Add` button — shown when `canManage` is true
2. `Admin Provider Settings` button — wrapped in `<RequirePermission permissions={[AppPermission.SettingsView, AppPermission.SettingsEditMeetingIntegrations]}>`, shown when user has at least one of these permissions

Both buttons coexist in the same `Stack flexDirection="row" justifyContent="flex-end"` row. A `ml: 1` margin separates them when both are visible.

### Permission Gating

```tsx
<RequirePermission
  permissions={[AppPermission.SettingsView, AppPermission.SettingsEditMeetingIntegrations]}
>
  <Button
    startIcon={<SettingsOutlinedIcon />}
    variant="outlined"
    size="small"
    onClick={state.navigateToSettings}
    aria-label={state.labels.enhancements.navigateToAdminSettingsAriaLabel}
    sx={canManage ? { ml: 1 } : undefined}
  >
    {state.labels.enhancements.navigateToAdminSettings}
  </Button>
</RequirePermission>
```

- `AppPermission` enum imported from `@/frontend/common/graphql/generated/gql/graphql-types` (NOT bare string literals)
- `RequirePermission` imported from `@/frontend/common/components/auth/RequirePermission`
- OR logic: user needs at least one of the two permissions to see the button

### Pre-Existing Integrations (Verified)

| Integration | Task | Status |
|-------------|------|--------|
| `OAuthCallbackHandler` | 11 / 18b | ✅ Already present at top of render stack |
| `ReconnectAllAction` | 13 / 18b | ✅ Already present inside `reauthProviders.length > 0` branch |
| `ReauthNeededBanner` | 14 / 18b | ✅ Already present above `ReconnectAllAction` |
| `TokenExpiryWarning` | 17 / 18b | ✅ Already present per-provider section |
| `DisconnectConfirmDialog` | 14b / 18b | ✅ Already present at bottom of render stack |
| `navigateToSettings` ViewModel | 18b | ✅ Already routes to `/dashboard/settings?tab=meetingIntegrations` |
| Labels via `state.labels.enhancements` | 18b | ✅ Already plumbed (no `useAppTranslation` in this view component) |

### Navigation

`state.navigateToSettings` calls `router.push("/dashboard/settings?tab=meetingIntegrations")` — same-tab navigation, no `target="_blank"`. Verified in `useMeetingConfigsManagerViewModel.ts:170-172`.

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

## Carry-Forward Knowledge

- The `RequirePermission` component uses OR logic for arrays — user needs at least one permission, not all.
- The cross-link button is no longer mutually exclusive with the Add button. Managers who also have settings permission see both buttons. This matches the design intent: a manager with settings access should be able to navigate to admin settings from either location.
- No new i18n keys needed — `navigateToAdminSettings` and `navigateToAdminSettingsAriaLabel` were added in Task 18b.
- No ViewModel changes needed — all required fields (`navigateToSettings`, `reauthProviders`, `requiresReconnect`, `labels.enhancements`) were already exposed by Task 18b.

## Cross-File Dependencies

None. All changes are self-contained in `MeetingConfigsManager.tsx`.
