# Task 16 Outcome: Navigation & "Create User" Action Button

## Date: 2026-08-14

## Summary

Added a "Create User" action button to the `/users` directory page header (both mobile and desktop tiers), added the `createUser` nav label to the i18n system (en + ar + type interface), and added a route permission entry mapping `/users/create` to `AppPermission.StaffCreate`. The button is permission-gated — only visible when the user has `AppPermission.StaffCreate`. Clicking navigates to `/users/create`.

## Files Modified

| File | Change |
|------|--------|
| `shared/locale/types/dashboard/core/nav.ts` | Added `readonly createUser: string` to `DashboardNavigationLabels` interface (after `usersDirectory`) |
| `shared/locale/en/dashboard/core/nav.ts` | Added `createUser: "Create User"` to `dashboardCoreNavEn` |
| `shared/locale/ar/dashboard/core/nav.ts` | Added `createUser: "إنشاء مستخدم"` to `dashboardCoreNavAr` |
| `frontend/common/types/page-permissions.types.ts` | Added `usersCreate: [AppPermission.StaffCreate] as PagePermissions` entry (after `usersStaff`) |
| `frontend/common/views/dashboard/users/directory/tabs/types.ts` | Extended `UsersDirectoryViewLabels` with `createUserLabel: string`; extended `UsersDirectoryTabsViewModel` with `canCreateUser: boolean` and `onCreateUser: () => void` |
| `frontend/common/views/dashboard/users/directory/tabs/useUsersDirectoryTabsViewModel.ts` | Added `navLabels` via `useAppTranslation(Translation.Dashboard.CoreNav)`, `canCreateUser` via `hasPermission(AppPermission.StaffCreate)`, `handleCreateUser` via `router.push("/users/create")`, and passed `createUserLabel` through `viewLabels` |
| `frontend/mobile/views/dashboard/users/directory/usersDirectory.mobile.tsx` | Added `AddOutlined` icon import and `MobilePrimaryPageAction` import; destructured `canCreateUser` and `onCreateUser` from ViewModel; rendered permission-gated action button in `MobilePageHeader` `actions` slot |
| `frontend/desktop/views/dashboard/users/directory/usersDirectory.desktop.tsx` | Added `AddOutlined` icon import and `DesktopPrimaryPageAction` import; destructured `canCreateUser` and `onCreateUser` from ViewModel; rendered permission-gated action button in `DesktopPageHeader` `actions` slot |

## Files Created

No files created.

## Nav Label Key Added

```
createUser
```

- **Type**: `readonly createUser: string` in `DashboardNavigationLabels`
- **English**: `"Create User"`
- **Arabic**: `"إنشاء مستخدم"`
- **Namespace**: `Translation.Dashboard.CoreNav` (the existing nav labels namespace)

## Route Permission Entry

```typescript
usersCreate: [AppPermission.StaffCreate] as PagePermissions,
```

- **Key**: `usersCreate` (in `PAGE_PERMISSIONS` object in `frontend/common/types/page-permissions.types.ts`)
- **Permission**: `AppPermission.StaffCreate` (enum value `STAFF_CREATE` / `"staff.create"`)
- **Import**: `AppPermission` imported as a value (not `import type`) since it's used in runtime expressions — already imported this way in the existing file
- **Usage**: Future `/users/create` page route will reference `PAGE_PERMISSIONS.usersCreate` when the page is created in a subsequent task

## Action Button Implementation Details

### ViewModel Changes

The ViewModel (`useUsersDirectoryTabsViewModel`) now:
1. Loads nav labels via `useAppTranslation(Translation.Dashboard.CoreNav)` to get the `createUser` label
2. Computes `canCreateUser` via `hasPermission(AppPermission.StaffCreate)` — the button is hidden if the user lacks this permission
3. Provides `handleCreateUser` — calls `router.push("/users/create")`
4. Passes `createUserLabel` through the existing `viewLabels` object (added to `UsersDirectoryViewLabels` type)

### Mobile Chrome

Uses `MobilePrimaryPageAction` from `@/frontend/mobile/components/ui` with `startIcon={<AddOutlined />}`. The button is rendered in the `MobilePageHeader` `actions` slot, which stretches it to full width (matching the mobile primary action pattern).

### Desktop Chrome

Uses `DesktopPrimaryPageAction` from `@/frontend/desktop/components/ui` with `startIcon={<AddOutlined />}`. The button is rendered in the `DesktopPageHeader` `actions` slot, which places it to the right of the title (matching the desktop primary action pattern from `parentsView.desktop.tsx`).

### Permission Gating

Both mobile and desktop chrome conditionally render the button: `{canCreateUser ? <PrimaryPageAction ... /> : null}`. This follows the existing pattern from `parentsView.desktop.tsx` where `canParentsCreate` gates the "Add Parent" button.

## Verification Results

All 8 modified files passed `sub-loop.ts --lifecycle codescene` (tsgo → oxlint → biome → lint:type-aware → duplicates → codescene):

| File | Result |
|------|--------|
| `shared/locale/types/dashboard/core/nav.ts` | ✅ All 6 checks passed |
| `shared/locale/en/dashboard/core/nav.ts` | ✅ All 6 checks passed |
| `shared/locale/ar/dashboard/core/nav.ts` | ✅ All 6 checks passed |
| `frontend/common/types/page-permissions.types.ts` | ✅ All 6 checks passed |
| `frontend/common/views/dashboard/users/directory/tabs/types.ts` | ✅ All 6 checks passed |
| `frontend/common/views/dashboard/users/directory/tabs/useUsersDirectoryTabsViewModel.ts` | ✅ All 6 checks passed |
| `frontend/mobile/views/dashboard/users/directory/usersDirectory.mobile.tsx` | ✅ All 6 checks passed |
| `frontend/desktop/views/dashboard/users/directory/usersDirectory.desktop.tsx` | ✅ All 6 checks passed |

### tsgo (project-wide)

The only tsgo error is **pre-existing** in `backend/services/notification/notification-dispatch.helpers.test.ts(75,5)` — unrelated to this task. No type errors from any modified files.

## Carry-Forward Knowledge for Future Tasks

### 1. Nav Label Access Pattern
- **Namespace**: `Translation.Dashboard.CoreNav` — the nav labels namespace
- **Client hook**: `useAppTranslation(Translation.Dashboard.CoreNav)` returns the full `DashboardNavigationLabels` object
- **Key**: `labels.createUser` — compile-time safe access

### 2. Route Permission Key
- **Key**: `PAGE_PERMISSIONS.usersCreate` — use this in the future `/users/create` page route's `withPageAuth` or `requirePermissionForPage`
- **Array**: `[AppPermission.StaffCreate]` — OR semantics (single permission)

### 3. Action Button Pattern
- **Mobile**: `MobilePrimaryPageAction` from `@/frontend/mobile/components/ui` — full-width contained button
- **Desktop**: `DesktopPrimaryPageAction` from `@/frontend/desktop/components/ui` — contained button, right-aligned in header
- **Both**: Accept `startIcon` and `onClick` props (standard MUI Button props)
- **Permission gating**: Conditionally render with `{canDo ? <Button /> : null}` — never render a disabled button when permission is missing

### 4. ViewModel Extension Pattern
When adding a new action button to an existing tabbed directory page:
1. Extend the `ViewLabels` type with the button label
2. Extend the `ViewModel` type with `canDo` (boolean) and `onDo` (handler)
3. Load the label via the appropriate nav namespace translation
4. Compute the permission boolean via `hasPermission(AppPermission.X)`
5. Provide the handler via `useMemo` to stabilize the reference
6. Destructure both in the mobile/desktop chrome and render in the `actions` slot

### 5. Page Route Not Yet Created
The `/users/create` page route (`app/(dashboard)/users/create/page.tsx`) does not exist yet. When it is created in a subsequent task, it should:
- Use `withPageAuth([AppPermission.STAFF_CREATE], ...)` (matching `PAGE_PERMISSIONS.usersCreate`)
- Import the create user container/view from `@/frontend/common/views/dashboard/users/createUser/`
- Use `getTranslations(locale).dashboardTranslations.usersCreateUser` for metadata
- Follow the pattern from `app/(dashboard)/teachers/onboarding/page.tsx`
