Created At: 2026-07-27T19:12:29+03:00
Updated At: 2026-07-27T19:15:00+03:00
File Path: `file:///home/ahmed/Projects/siraj/.ai/plans/staff-route-rename/plan.md`

# Plan: Full Staff Route Rename + Internal Identifier Refactoring + Onboarding UI Fixes

## Goal
1. Rename all `/managers` route references (hrefs, redirects, `router.push`) to `/staff` and `/managers/onboarding` to `/staff/create`.
2. Move all previously out-of-scope internal identifiers into scope to be implemented:
   - Rename frontend view directories `frontend/.../managers/` → `staff/`.
   - Rename locale files & folders `shared/locale/(ar|en)/dashboard/managers/` → `staff/`.
   - Rename stores `managerOnboardingStore` / `managersDirectoryStore` → `staffOnboardingStore` / `staffDirectoryStore`.
   - Rename GraphQL document files & exports (`manager-onboarding.documents.ts` → `staff-onboarding.documents.ts`).
   - Rename i18n namespace keys (`managerOnboarding` → `staffOnboarding`, `managersDirectory` → `staffDirectory`).
   - Rename permission key `PAGE_PERMISSIONS.managers` → `PAGE_PERMISSIONS.staff`.
3. Remove the word "Siraj" (سراج) from all user-facing strings on the onboarding page.
4. Fix UI issues: duplicate Password field in `SystemAccessSection`, wrong "SIGN UP" button label (AR), "Manager Onboarding" title mismatch (AR), misplaced Password field.

## Scope Decision
- **In scope (Everything)**:
  - Route & URL references (`/managers` → `/staff`, `/managers/onboarding` → `/staff/create`, `router.push`, hrefs, navigation configs, redirects).
  - Component & View directory renaming (`frontend/common/views/dashboard/managers/` → `staff/`, `frontend/desktop/views/dashboard/managers/` → `staff/`, `frontend/mobile/views/dashboard/managers/` → `staff/`).
  - Store files and state hooks (`managersDirectoryStore.ts` → `staffDirectoryStore.ts`, `managerOnboardingStore.ts` → `staffOnboardingStore.ts`).
  - GraphQL documents & exports (`manager-onboarding.documents.ts` → `staff-onboarding.documents.ts`).
  - i18n locale files, folders, and namespace keys (`shared/locale/(ar|en)/dashboard/managers/` → `staff/`, `managerOnboarding` → `staffOnboarding`, `managersDirectory` → `staffDirectory`).
  - Permission keys (`PAGE_PERMISSIONS.managers` → `PAGE_PERMISSIONS.staff`).
  - All user-facing UI bug fixes (duplicate password field, translations, removing "Siraj" / "سراج").
- **Out of scope**: None (all previously excluded items are now fully included).

---

## Tasks

### Task 1: Fix `/managers` Route Strings, Hrefs, and Redirects
Update all hardcoded route strings, links, redirects, and navigation items from `/managers` to `/staff`.

| File | Location / Target | Change Description |
|------|-------------------|--------------------|
| `frontend/common/views/dashboard/config/navigationConfig.ts` | `href: "/managers"` | Change to `href: "/staff"` |
| `frontend/common/views/dashboard/config/mockNavigationConfig.ts` | `href: "/managers"` | Change to `href: "/staff"` |
| `frontend/desktop/views/dashboard/managers/home/managersView.desktop.tsx` | `Link href="/managers/onboarding"` | Change to `href="/staff/create"` |
| `frontend/mobile/views/dashboard/managers/home/managersView.mobile.tsx` | `Link href="/managers/onboarding"` | Change to `href="/staff/create"` |
| `frontend/common/views/dashboard/managers/onboarding/useManagerOnboardingContainerViewModel.ts` | `router.push("/managers")` | Change both occurrences (successful submit & cancel redirect handlers) to `router.push("/staff")` |

**Verification**: Run `grep -r "/managers" .` (excluding `.ai/plans/` and historical plan docs) — zero hits must remain.

---

### Task 2: Remove Duplicate Password Field & Clean Up SystemAccessSection
File: `frontend/common/views/dashboard/managers/onboarding/SystemAccessSection.tsx` (and component call sites)

1. **Remove Duplicate Input**: Delete the password `TextField` block (~lines 107–119).
2. **Remove Helper**: Delete `getPasswordError()` helper function (~lines 78–84).
3. **Clean Props**: Remove unused `errors` prop from `SystemAccessSection` interface and call sites in `ManagerOnboardingView.tsx` / desktop / mobile views.
4. **Layout Adjustment**: Adjust Grid layout in `SystemAccessSection` so Account Type toggle spans full width (remove 2-column `md={6}` split).

**Verification**: Password field only appears once (in `StaffInfoSection`). `SystemAccessSection` contains only the account type toggle.

---

### Task 3: Rename Internal Directory Folders & File Paths
Rename directory structures to reflect staff domain:

1. **Frontend Common Views**: `frontend/common/views/dashboard/managers/` → `frontend/common/views/dashboard/staff/`
2. **Frontend Desktop Views**: `frontend/desktop/views/dashboard/managers/` → `frontend/desktop/views/dashboard/staff/`
3. **Frontend Mobile Views**: `frontend/mobile/views/dashboard/managers/` → `frontend/mobile/views/dashboard/staff/`
4. **Shared Locale Directories**:
   - `shared/locale/ar/dashboard/managers/` → `shared/locale/ar/dashboard/staff/`
   - `shared/locale/en/dashboard/managers/` → `shared/locale/en/dashboard/staff/`
5. **App Router Page Imports**: Update imports in `app/(dashboard)/staff/page.tsx` and `app/(dashboard)/staff/create/page.tsx` to point to the new `@/frontend/.../staff/` paths.

---

### Task 4: Refactor Stores & State Hooks
Rename Zustand store files and exported hook symbols:

1. `frontend/common/stores/managersDirectoryStore.ts` → `frontend/common/stores/staffDirectoryStore.ts`
   - Rename store hook `useManagersDirectoryStore` → `useStaffDirectoryStore`.
   - Update imports in view models (`useManagersContainerViewModel.ts` / `useStaffContainerViewModel.ts`).
2. `frontend/common/stores/managerOnboardingStore.ts` → `frontend/common/stores/staffOnboardingStore.ts`
   - Rename store hook `useManagerOnboardingStore` → `useStaffOnboardingStore`.
   - Update imports in `useCreateManagerOnboarding.ts` / `useCreateStaffOnboarding.ts`.

---

### Task 5: Refactor GraphQL Document Filenames & Exports
1. Rename file `frontend/common/graphql/sharedDocuments/teachers/manager-onboarding.documents.ts` → `staff-onboarding.documents.ts` (or under staff domain if applicable).
2. Update export index `frontend/common/graphql/sharedDocuments/teachers/index.ts`.
3. Update imports in test helpers: `frontend/common/graphql/test/helpers.ts`.

---

### Task 6: Refactor i18n Namespaces, Keys, and Locale Files
1. **Directory & Files**:
   - `shared/locale/ar/dashboard/staff/directory.ts`
   - `shared/locale/ar/dashboard/staff/onboarding.ts`
   - `shared/locale/en/dashboard/staff/directory.ts`
   - `shared/locale/en/dashboard/staff/onboarding.ts`
2. **Type Definitions**:
   - Update `shared/locale/types/dashboard.ts`: rename namespace keys `managersDirectory` → `staffDirectory`, `managerOnboarding` → `staffOnboarding`.
   - Update `shared/locale/types/index.ts` if referenced.
3. **Messages Bundles**:
   - Update `shared/locale/ar/messages.ts` and `shared/locale/en/messages.ts` to import from `./dashboard/staff/` and bind under `staffDirectory` / `staffOnboarding`.
4. **Nav Labels**:
   - `shared/locale/ar/dashboard/core/nav.ts`: `managers: "الموظفون"`, `managerOnboarding: "انضمام الموظف"`.
   - `shared/locale/en/dashboard/core/nav.ts`: `managers: "Staff"`, `managerOnboarding: "Staff Onboarding"`.
5. **Page Strings & Translation Updates (Remove "Siraj" / "سراج")**:
   - `shared/locale/ar/dashboard/staff/onboarding.ts`:
     - `pageTitle`: `"انضمام الموظف"` (was `"انضمام المدير"`)
     - `pageSubtitle`: `"سجّل موظفاً جديداً."` (removed `"في نظام إدارة سراج"`)
     - `actions.signup`: `"إنشاء موظف"` (was `"تسجيل"`)
   - `shared/locale/ar/dashboard/staff/directory.ts`:
     - `pageTitle`: `"دليل الموظفين"`
     - `actions.addManager`: `"إضافة موظف جديد"`
   - `shared/locale/en/dashboard/staff/directory.ts`:
     - `pageTitle`: `"Staff Directory"`
     - `actions.addManager`: `"Add New Staff"`

---

### Task 7: Update Permission Key (`PAGE_PERMISSIONS`)
1. In `frontend/common/types/page-permissions.types.ts`: rename `PAGE_PERMISSIONS.managers` → `PAGE_PERMISSIONS.staff`.
2. Update usage in `navigationConfig.ts` & `mockNavigationConfig.ts`: `permission: PAGE_PERMISSIONS.staff`.

---

### Task 8: Update All Internal View Component & Hook Imports
Update all relative and `@/frontend/...` import statements across common, desktop, and mobile view files to point to the renamed `staff` directories, stores, and schemas.

---

### Task 9: Verification Loop & Quality Gate
1. Run `bun tsgo` to ensure all TypeScript types, imports, store references, and i18n namespaces pass clean.
2. Run `bun biome:check` on all modified files.
3. Run lint via queue client on modified files.
4. Manually verify navigation in dev server:
   - Access `/staff` and `/staff/create`.
   - Verify sidebar navigation links, redirects after onboarding form submission, single password field, and updated Arabic/English labels with no "Siraj"/"سراج" references.

---

## Files Touched Summary
- `app/(dashboard)/staff/page.tsx`
- `app/(dashboard)/staff/create/page.tsx`
- `frontend/common/views/dashboard/config/navigationConfig.ts`
- `frontend/common/views/dashboard/config/mockNavigationConfig.ts`
- `frontend/common/types/page-permissions.types.ts`
- `frontend/common/stores/managersDirectoryStore.ts` → `staffDirectoryStore.ts`
- `frontend/common/stores/managerOnboardingStore.ts` → `staffOnboardingStore.ts`
- `frontend/common/graphql/sharedDocuments/teachers/manager-onboarding.documents.ts` → `staff-onboarding.documents.ts`
- `frontend/common/graphql/test/helpers.ts`
- `frontend/common/views/dashboard/managers/*` → `frontend/common/views/dashboard/staff/*`
- `frontend/desktop/views/dashboard/managers/*` → `frontend/desktop/views/dashboard/staff/*`
- `frontend/mobile/views/dashboard/managers/*` → `frontend/mobile/views/dashboard/staff/*`
- `shared/locale/ar/dashboard/managers/*` → `shared/locale/ar/dashboard/staff/*`
- `shared/locale/en/dashboard/managers/*` → `shared/locale/en/dashboard/staff/*`
- `shared/locale/types/dashboard.ts`
- `shared/locale/ar/messages.ts`
- `shared/locale/en/messages.ts`
- `shared/locale/ar/dashboard/core/nav.ts`
- `shared/locale/en/dashboard/core/nav.ts`

---

## Out of Scope
- None (All previously out-of-scope refactoring tasks are now fully incorporated into the plan).
