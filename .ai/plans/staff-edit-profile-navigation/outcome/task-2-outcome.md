# Task 2 Outcome — Staff Edit Profile: Dialog → Route Navigation

## Implementation Date
2026-08-14

## What Changed

File: `frontend/common/views/dashboard/staff/home/ManagerRowActions.tsx`

### Removed
- `EditProfileDialog` component (lines 80-129 of original)
- `EditProfileDialogProps` interface (lines 66-78)
- `StyledEditField` styled component (lines 37-40)
- Edit-related state: `editDialogOpen`, `editName`, `editEmail`, `editPhone`
- `handleEditClick` (old version that opened dialog) and `handleEditSubmit`
- Unused imports: `TextField`, `PhoneInput`, `outlinedInputSx`, `styled`
- The `<EditProfileDialog>` JSX usage (lines 275-287 of original)

### Added
- `useRouter` import from `@/shared/i18n/navigation`
- `profileHrefForUser` import from `@/frontend/common/utils/profileHref`
- New `handleEditClick` that calls `router.push(\`${profileHrefForUser(manager.userId)}?tab=profile\`)`

### Kept (unchanged)
- `DeactivateDialog` component and its props
- `ViewAsUserButton` usage
- `executeManagerUpdate` helper (still used by deactivate)
- `useMutation` hook (still needed for deactivate)
- `resolveSubmitLabel` helper
- All deactivate-related state and handlers

## Key Decisions

1. **Navigation pattern**: Used `useRouter()` from `@/shared/i18n/navigation` (i18n-aware router), matching the pattern in `ProfileActionBar.tsx`. This ensures locale-prefixed URLs work correctly.

2. **URL construction**: Used `profileHrefForUser(userId)` from the canonical `profileHref.ts` utility (returns `/users/${userId}/profile`), then appended `?tab=profile`. This mirrors how the desktop data grid already links staff names to their profile page.

3. **`?tab=profile`**: The unified profile page reads `searchParams.get("tab")` in `useProfilePageClientViewModel.ts` and defaults to `"profile"`. Explicitly passing `?tab=profile` ensures the correct tab is shown regardless of any URL state changes.

4. **Deactivate dialog preserved**: The deactivate/activate confirmation dialog was kept as-is since it's a delete/restore confirmation, not an edit form — appropriate for a dialog.

## Research Findings

- The `/staff` route redirects to `/users?tab=staff` when the users directory feature is enabled (both render `<ManagersContainer />`)
- The unified profile page at `/users/[id]/profile` accepts `?tab=<ProfileTabId>` via `useSearchParams()`
- The `profile` tab is visible for `STAFF-OTHER` audience (confirmed in `profileTabs.ts` TAB_VISIBILITY)
- `profileHrefForStaff({ userId })` already exists but returns the base URL without `?tab=` — we need the explicit tab parameter, so we use `profileHrefForUser(userId)` + `?tab=profile` directly

## Environment Note

The `sub-loop.ts` quality loop reported oxlint failure, but this was an environment issue: `bunx` couldn't resolve the `oxlint` binary in the sandboxed shell (exit code 127 = command not found). All checks were verified individually:
- tsgo: 0 errors (no matching lines for ManagerRowActions.tsx)
- oxlint (via `node_modules/.bin/oxlint`): exit 0
- biome:check (with --write --unsafe): exit 0
- lint-service: exit 0
- VS Code diagnostics: empty

## Files Modified
- `frontend/common/views/dashboard/staff/home/ManagerRowActions.tsx` — 113 deletions, 4 insertions

## Carry-Over Points
- None. The change is self-contained in a single file.
- If the users directory feature flag is off and the legacy `/staff` route renders `<ManagersContainer />` directly, the same row actions apply — the edit navigation works in both cases.
