# Tasks — Staff Edit Profile Navigation

- [x] 1. Record baseline (Phase 0)
  - Run `bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/staff/home/ManagerRowActions.tsx --lifecycle codescene` to record pre-change exit code
  - _Requirements: Phase 0 baseline_

- [x] 2. Implement: Replace EditProfileDialog with route navigation in ManagerRowActions.tsx
  - Add `useRouter` from `@/shared/i18n/navigation` and `profileHrefForUser` from `@/frontend/common/utils/profileHref`
  - Replace the edit `IconButton` onClick with `router.push(\`${profileHrefForUser(manager.userId)}?tab=profile\`)`
  - Remove `EditProfileDialog` component, `EditProfileDialogProps` interface, `DeactivateDialog` stays
  - Remove unused edit state: `editDialog`, `editName`, `editEmail`, `editPhone`, `handleEditClick`, `handleEditSubmit`, `executeManagerUpdate`, `StyledEditField`
  - Remove `useMutation` import (deactivate still uses it — KEEP if still needed, remove if not)
  - Remove now-unused imports: `Button`, `Dialog`, `DialogActions`, `DialogContent`, `DialogTitle`, `TextField`, `Typography`, `styled`, `PhoneInput`, `outlinedInputSx`, `logger`, `UpdateManagerProfileInput`, `updateManagerProfileMutationDocument` (keep `managerDirectoryQueryDocument` if deactivate still uses the mutation)
  - Rewrite `handleDeactivateSubmit` — currently calls `executeManagerUpdate(...)` which itself calls `updateProfile(...)`. If `executeManagerUpdate` is removed, inline the logic or keep a simplified version that only handles the deactivate/activate mutation
  - _Requirements: AC-1, AC-2, AC-3, AC-4_

- [x] 3. Quality loop on modified file
  - Run `bun run scripts/health/sub-loop.ts frontend/common/views/dashboard/staff/home/ManagerRowActions.tsx --lifecycle codescene`
  - Fix all errors until exit code 0
  - Run semantic self-review checklist
  - _Requirements: AC-5_

- [x] 4. Write outcome file and mark tasks complete
  - Create `.ai/plans/staff-edit-profile-navigation/outcome/task-2-outcome.md` with implementation details
  - Mark all tasks `[x]`
