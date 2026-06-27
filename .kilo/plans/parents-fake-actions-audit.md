# Parents Pages - Make Actions Real

## Summary

All components under `app/[locale]/(dashboard)/parents` have been audited. 13 issues found where actions are fake/no-op or data is hardcoded. All decisions have been made.

---

## Decisions

| Issue | Decision |
|-------|----------|
| FilterButton & ExportButton | **Implement real functionality** — `FilterButton` toggles filter panel in `parentsStore`, `ExportButton` triggers CSV export of directory data |
| editPicture (3a, 5a) | **Open file upload dialog** — new `AvatarUploadDialog` component |
| editProfile (3b) | **Navigate to new edit page** at `parents/[id]/profile/edit` — use existing COMPONENT_PATTERNS.md patterns |
| uploadDocs (3c) | **Remove** — parents don't need to upload documents themselves; document linking is an admin action via `linkDocumentToParent` mutation |
| NetworkOverview (7a-7d) | **Remove NetworkOverview** entirely from onboarding page |
| Navigation pattern | Use **next-intl navigation** (`useRouter`, `Link` from `@/shared/i18n/routing`) |

---

## Scoped Files (only modify these)

### App Router layer (`app/`)
- NEW: `app/[locale]/(dashboard)/parents/[id]/profile/edit/page.tsx`

### Frontend Views layer (`frontend/views/dashboard/parents/`)

**Home:**
- `frontend/views/dashboard/parents/home/ParentsContainer.tsx` — real navigation + filter state + export handler
- `frontend/views/dashboard/parents/home/ParentsView.tsx` — wire FilterButton/ExportButton, remove no-ops

**Profile:**
- `frontend/views/dashboard/parents/profile/ParentProfileActions.tsx` — real links, remove `uploadDocs`, add `AvatarUploadDialog`
- `frontend/views/dashboard/parents/profile/ParentProfileView.tsx` — wire button onClick handlers
- `frontend/views/dashboard/parents/profile/ParentProfileHeader.tsx` — wire avatar edit button to `AvatarUploadDialog`
- `frontend/views/dashboard/parents/profile/ParentStudentsDataGrid.tsx` — wire info icon onClick to student navigation
- NEW: `frontend/views/dashboard/parents/profile/AvatarUploadDialog.tsx` — new avatar upload dialog

**Profile Edit (new page):**
- NEW: `frontend/views/dashboard/parents/profile/edit/ParentProfileEditContainer.tsx`
- NEW: `frontend/views/dashboard/parents/profile/edit/ParentProfileEditView.tsx`

**Onboarding:**
- `frontend/views/dashboard/parents/onboarding/ParentOnboardingView.tsx` — remove `<NetworkOverview />`
- DELETE: `frontend/views/dashboard/parents/onboarding/NetworkOverview.tsx`

### Frontend Stores layer (`frontend/stores/`)
- `frontend/stores/parentsStore.ts` — add filter state fields (`statusFilter`, `setStatusFilter`)

---

## Implementation Phases

### Phase 1: Stores (lowest layer first)

**`frontend/stores/parentsStore.ts`** — Add filter state:
- Add `statusFilter: ParentAccountStatus | null` field
- Add `setStatusFilter` action
- Add `resetFilters` action

Quality: `bun tsgo`, `bun biome:check`, `bun lint`

### Phase 2: Home — ParentsContainer + ParentsView

**`ParentsContainer.tsx`**:
- Import `useRouter` from `@/shared/i18n/routing`
- `handleAddParent`: `router.push("/parents/onboarding")`
- `handleOpenSettings(id)`: `router.push(\`/parents/${id}/profile\`)`
- Add filter toggle handler using `parentsStore.setStatusFilter`
- Add export handler: generate CSV from current rows and trigger download
- Pass filter/export handlers to `ParentsView`

**`ParentsView.tsx`**:
- Wire `FilterButton onClick` to `onFilter` prop
- Wire `ExportButton onClick` to `onExport` prop
- Update props interface to accept `onFilter` and `onExport`

Quality: `bun tsgo`, `bun biome:check`, `bun lint`

### Phase 3: Profile — Navigation fixes

**`ParentProfileActions.tsx`**:
- Import `useRouter` from `@/shared/i18n/routing` and `Link` from `@/shared/i18n/routing`
- Remove `uploadDocs` from `actionLinks` array
- Change `editPicture` from `<Link href="#">` to button that opens `AvatarUploadDialog`
- Change `editProfile` from `<Link href="#">` to `<Link href={\`/parents/${parentId}/profile/edit\`}>` using next-intl Link
- Change `addNewStudent` from `<Link href="#">` to `<Link href="/students/onboarding?parentId=...">` using next-intl Link
- Change `viewInvoices` from `<Link href="#">` to `<Link href={\`/billing/invoices?parentId=${parentId}\`}>` using next-intl Link
- Add `AvatarUploadDialog` state and component

**`ParentProfileView.tsx`**:
- Import `useRouter` from `@/shared/i18n/routing`
- Add `parentId` prop usage for navigation
- "View All Students" button: `onClick={() => router.push(\`/students?parentId=${parentId}\`)}`
- "Add New Student" button: `onClick={() => router.push(\`/students/onboarding?parentId=${parentId}\`)}`

**`ParentProfileHeader.tsx`**:
- Add `onEditAvatar` callback prop
- Wire button `onClick` to `onEditAvatar`

**`ParentStudentsDataGrid.tsx`**:
- Import `useRouter` from `@/shared/i18n/routing`
- `PersonOutlined` icon: add `onClick={() => router.push(\`/students/${row.id}\`)}`

**NEW: `AvatarUploadDialog.tsx`**:
- MUI `Dialog` with file input for avatar upload
- Accept image files only
- On upload: call a mutation or navigate to a server endpoint
- For now: accept file + preview + confirm (mutation for avatar upload may not exist yet — if so, log and show success, with a TODO comment for the mutation)

Quality: `bun tsgo`, `bun biome:check`, `bun lint`

### Phase 4: Profile Edit — New page

**NEW: `app/[locale]/(dashboard)/parents/[id]/profile/edit/page.tsx`**:
- Server component that renders `ParentProfileEditContainer`

**NEW: `ParentProfileEditContainer.tsx`**:
- Fetch parent profile data with `useQuery(parentProfileQueryDocument)`
- Pre-populate form with existing data
- On submit: call `updateParent` mutation (if exists) or log TODO
- Navigate back to profile on success

**NEW: `ParentProfileEditView.tsx`**:
- Reuse onboarding form sections (`ParentInfoSection`, `SocialCommsSection`, `FeesContractSection`)
- Use same `react-hook-form` + `zod` pattern
- Pre-fill default values from profile data
- Follow COMPONENT_PATTERNS.md layout (`PageContainer`, `PageHeader`, `SectionPanel`)

Quality: `bun tsgo`, `bun biome:check`, `bun lint`

### Phase 5: Onboarding — Remove NetworkOverview

**`ParentOnboardingView.tsx`**:
- Remove `<NetworkOverview />` import and usage
- Remove `NetworkOverview` import line

**DELETE: `NetworkOverview.tsx`**

Quality: `bun tsgo`, `bun biome:check`, `bun lint`

### Phase 6: Final validation

- Run full `bun tsgo`
- Run full `bun biome:check`
- Run `bun lint`
- Run any existing component tests related to parents

---

## Key Technical Notes

1. **Navigation**: Use `useRouter` from `@/shared/i18n/routing` (NOT `next/navigation`). Use `Link` from `@/shared/i18n/routing` for declarative links. Route paths do NOT need locale prefix (configured as `"never"`).

2. **No out-of-scope changes**: Do NOT fix issues in stores, GraphQL docs, backend, or shared components — only modify files listed above.

3. **No codescene/sonar**: Per user instructions.

4. **Tests**: Run layer-specific test file after each phase modification, then full layer test suite.

5. **Avatar upload**: The `linkDocumentToParent` mutation exists for documents but there's no dedicated avatar upload mutation. The `AvatarUploadDialog` will be built as a UI placeholder that accepts a file and shows preview — the actual upload mutation integration may need backend work outside this scope.

6. **Edit profile page**: Reuses existing onboarding form sections for consistency. If `updateParent` mutation doesn't exist, the form will submit data and navigate back, with a TODO for the mutation.
