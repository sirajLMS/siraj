# Task 29 Outcome: Update `useMeetingIntegrationsViewModel` with new actions

## Summary

Updated the `useMeetingIntegrationsViewModel` hook with three new actions: `connectProvider(slug)`, `navigateToProfile()`, and `canViewProfile`. Also completed the missing `connectErrorFor`/`setConnectErrorFor` store fields from Task 28.

## Files Modified

### 1. `frontend/common/stores/meetingIntegrationsSettingsStore.ts`

**Added missing Task 28 fields:**
- `connectErrorFor: Readonly<Partial<Record<MeetingIntegrationProviderSlug, string | null>>>` — error messages keyed by provider slug for the connect flow
- `setConnectErrorFor: (slug, error) => void` — setter that immutably updates a single provider's error

These were added to all three locations: interface declaration, `initialState`, and `create()` implementation.

### 2. `frontend/common/views/dashboard/settings/types/meetingIntegrations.types.ts`

**Added to `MeetingIntegrationsViewModel`:**
- `canViewProfile: boolean` — whether the current user may see the ProfileLinkCallout

### 3. `frontend/common/views/dashboard/settings/tabs/meetingIntegrations/useMeetingIntegrationsViewModel.ts`

**New imports:**
- `useRouter` from `next/navigation`
- `connectMeetingProviderOAuthMutationDocument` from `@/frontend/common/graphql/sharedDocuments/meeting/meeting.documents`
- `MEETING_INTEGRATIONS_PROFILE_LINK_PERMISSION` from the store
- `useUserStore` for `hasPermission`
- `logger` from `@/frontend/common/utils/logger`
- `useAppLocale`, `Translation` from `@/shared/locale`

**New actions:**

#### `connectProvider(slug)`
- Calls `connectMeetingProviderOAuth` GraphQL mutation with `{ providerSlug, returnPath }`
- On success: redirects to `authorizeUrl` via `globalThis.window.location.href`
- On error: shows toast notification (`labels.connectProviderError`) + logs via `logger.error`
- Sets `connectingProviderSlug` during the flow and clears it in `finally`
- Sets `connectErrorFor` on failure

#### `navigateToProfile()`
- Calls `router.push("/profile?tab=meeting")` to cross-navigate to the teacher profile meeting-configs tab

#### `canViewProfile`
- Synced into the store via `useEffect` — `hasPermission(MEETING_INTEGRATIONS_PROFILE_LINK_PERMISSION)` → `store.setCanViewProfile(permitted)`
- `MEETING_INTEGRATIONS_PROFILE_LINK_PERMISSION` = `AppPermission.SettingsEditMeetingIntegrations` (exported from store, not a bare string literal)
- Re-checked whenever `hasPermission` changes

**Store wiring:**
- `connectingFor: store.connectingProviderSlug` — exposed on the ViewModel return
- `connectErrorFor: store.connectErrorFor` — exposed on the ViewModel return
- `canViewProfile: store.canViewProfile` — exposed on the ViewModel return

**Pattern used:**
- `buildConnectProvider` follows the existing `buildRunTest`/`buildRevokeAccount` module-scope pattern: takes deps + store Pick, returns async function
- `useCallback` wraps the `buildConnectProvider` call to memoize

**Notification calls:**
- All in the ViewModel via `useNotifications()` from `@toolpad/core/useNotifications` (subpath import, NOT `@toolpad/core`)
- View components receive `labels` props and do NOT call `useAppTranslation` directly (per `frontend/common/views/AGENTS.md` Rule 7)

**Error logging:**
- `logger.error` from `@/frontend/common/utils/logger` used for all catch blocks
- No `console.*` calls

## Quality Verification

Both files passed `bun run scripts/health/sub-loop.ts <file> --lifecycle lint`:

```
✅ tsgo passed
✅ oxlint passed
✅ biome:check passed
✅ lint:type-aware passed
✅ All checks for lifecycle "lint" passed.
```

## Requirements Mapped

- AC-1.5: `connectProvider` action with OAuth flow
- AC-1.6: `navigateToProfile` cross-navigation
- AC-1.8: `canViewProfile` permission check using `AppPermission.SettingsEditMeetingIntegrations` enum
