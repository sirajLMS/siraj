# Staff Edit Profile: Dialog → Route Navigation

**Type:** Minor Feature
**Effort:** 1-2 hours
**Date:** 2026-08-14

## What

In the superadmin staff directory (`/staff` or `/users?tab=staff`), the "Edit Profile" row action currently opens an inline dialog. It must instead navigate to the unified profile page at `/users/[id]/profile?tab=profile`.

## Why

The inline `EditProfileDialog` in `ManagerRowActions.tsx` duplicates the unified profile edit form at `/users/[id]/profile/edit`. The profile page provides a richer, tab-aware editing experience (profile, permissions, etc.) and is the canonical place to manage a user's details. Opening a dialog from the staff directory is inconsistent with the rest of the app where clicking "Edit" navigates to the profile page (see `ProfileActionBar.tsx` which uses `router.push(editHref)`).

## How

- **Baseline:** Record error count before starting (`bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` exit code)
- Remove the `EditProfileDialog` component, its state (`editDialogOpen`, `editName`, `editEmail`, `editPhone`), the `handleEditClick` handler, and the `handleEditSubmit` handler from `ManagerRowActions.tsx`
- Replace the edit `IconButton` onClick with `router.push(\`${profileHrefForUser(manager.userId)}?tab=profile\`)` using `useRouter` from `@/shared/i18n/navigation`
- Remove unused imports (`useState`, `TextField`, `PhoneInput`, `Dialog`, `DialogTitle`, `DialogContent`, `DialogActions`, `Button`, `Typography`, `styled`, `useMutation`, `updateManagerProfileMutationDocument`, `managerDirectoryQueryDocument`, `logger`, `outlineInputSx`, `UpdateManagerProfileInput`, `StyledEditField`, `executeManagerUpdate`)
- Keep the DeactivateDialog and ViewAsUserButton as-is (unchanged)
- Add `profileHrefForUser` import from `@/frontend/common/utils/profileHref`
- **Quality Loop:** `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` after change (exit code 0 = pass)

## Acceptance

1. Clicking the Edit Profile icon button in the staff directory navigates to `/users/{userId}/profile?tab=profile`
2. No dialog opens when clicking Edit Profile
3. The Deactivate/Activate dialog still works as before
4. The ViewAsUserButton still works as before
5. No TypeScript, lint, or biome errors on the modified file

## Files

- `frontend/common/views/dashboard/staff/home/ManagerRowActions.tsx` — Replace dialog-based edit action with route navigation; remove all edit dialog related code

## Notes

- `profileHrefForUser(userId)` returns `/users/${userId}/profile` (already used by the desktop data grid name cell)
- The unified profile page reads `?tab=` via `useSearchParams().get("tab")` in `useProfilePageClientViewModel.ts` — `?tab=profile` is the default and valid for `STAFF-OTHER` audience
- Navigation pattern mirrors `ProfileActionBar.tsx`: `useRouter()` from `@/shared/i18n/navigation` + `router.push(href)`
- The `Manager` type has a `userId` field used by `ViewAsUserButton` and the existing name cell link
