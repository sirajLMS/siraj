# Managers Directory — Real Connections Implementation Plan

## User Decisions

| Issue | Decision |
|-------|----------|
| #1 Fake avatars | Add `avatarUrl` to API (users table already has `avatarUrl`) |
| #3/#4 No-op Settings buttons | Action Menu with Edit Profile / Deactivate actions |
| #6 Hardcoded onboarding metrics | Add backend API for real data |
| #7 Empty password | Add password field to onboarding form |
| #8 Department silently dropped | Remove department from form |

---

## Implementation Tasks (Ordered by Layer)

### Phase 1: Backend Changes

#### 1A. Add `avatarUrl` to Manager Directory query chain

**Files to modify:**
- `backend/types/staff-profile.types.ts` — Add `avatarUrl: string | null` to `ManagerDirectoryRow` interface
- `backend/db/repo/staff-profile.repository.ts` — Add `avatarUrl: users.avatarUrl` to `MANAGER_DIRECTORY_SELECT` constant
- `backend/graphql/pothos/staff-directory.pothos.ts` — Add `avatarUrl: t.exposeString("avatarUrl", { nullable: true })` to `ManagerDirectoryRowPothosObject`
- `frontend/graphql/sharedDocuments/staff-directory.documents.ts` — Add `avatarUrl` to `managerDirectory` query's `rows` selection

**Note:** `users` table already has `avatarUrl` column. The `MANAGER_DIRECTORY_SELECT` already joins `users`, so we just need to select and expose it.

#### 1B. Add `metrics` field to Manager Directory

**Files to modify:**
- `backend/types/staff-profile.types.ts` — Add `ManagerDirectoryMetrics` interface with `totalAdmin`, `systemStaff`, `activeNow`, `alerts` fields. Add `metrics` to `ManagerDirectoryResult`
- `backend/db/repo/staff-profile.repository.ts` — Add a new function `getManagerDirectoryMetrics()` that computes aggregate counts across ALL records (not just current page). Use SQL `COUNT(*) FILTER (WHERE ...)` or Drizzle conditional aggregation with `sql<number>`. Metrics:
  - `totalAdmin`: count where `permissionGroups.slug` contains "admin"
  - `systemStaff`: count where `permissionGroups.slug` does NOT contain "admin"
  - `activeNow`: count where `staffProfiles.status = 'ACTIVATED'`
  - `alerts`: count where `staffProfiles.status` is not ACTIVATED (simplified; or 0 if no alert system)
- `backend/services/staff/manager-directory.service.ts` — Update `getManagerDirectory` to call both `getManagerDirectory` (rows) and `getManagerDirectoryMetrics`, merging results
- `backend/graphql/pothos/staff-directory.pothos.ts` — Add `ManagerDirectoryMetricsPothosObject` (similar to `TeacherDirectoryMetricsPothosObject`). Add `metrics` field to `ManagerDirectoryResultPothosObject`
- `frontend/graphql/sharedDocuments/staff-directory.documents.ts` — Add `metrics { id totalAdmin systemStaff activeNow alerts }` to `managerDirectory` query

#### 1C. Add filter arguments to Manager Directory query

**Files to modify:**
- `backend/types/staff-profile.types.ts` — Add `ManagerDirectoryFilters` interface with optional `roleFilter` and `statusFilter`
- `backend/db/repo/staff-profile.repository.ts` — Update `getManagerDirectory()` signature to accept optional filter params. Add WHERE clauses:
  - `roleFilter`: filter on `permissionGroups.slug` (e.g., `%admin%` for admin, NOT LIKE `%admin%` for staff)
  - `statusFilter`: filter on `staffProfiles.status` (`ACTIVATED` / not)
- `backend/services/staff/manager-directory.service.ts` — Pass filters from resolver args to repository
- `backend/graphql/pothos/staff-directory.pothos.ts` — Add `roleFilter` and `statusFilter` string args to `managerDirectory` query field (optional). Create a `ManagerDirectoryFilterInput` Pothos input object
- `frontend/graphql/sharedDocuments/staff-directory.documents.ts` — Add `$roleFilter` and `$statusFilter` variables to `managerDirectory` query
- `frontend/stores/managersDirectoryStore.ts` — Already resets page on filter change — no change needed

#### 1D. Add onboarding metrics query

**Files to modify:**
- `backend/types/staff-profile.types.ts` — Add `OnboardingMetricsResult` interface with `activeStaff: number`, `pendingApproval: number`, `avgOnboardingDays: number`
- `backend/db/repo/staff-profile.repository.ts` — Add `getOnboardingMetrics()` function:
  - `activeStaff`: count of staff with status `ACTIVATED`
  - `pendingApproval`: count of staff with status `PENDING` (or appropriate status enum)
  - `avgOnboardingDays`: `AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 86400)` — average days between creation and activation
- `backend/services/staff/manager-directory.service.ts` — Add `getOnboardingMetrics()` function with permission check
- `backend/graphql/pothos/staff-directory.pothos.ts` — Add `onboardingMetrics` query field
- `frontend/graphql/sharedDocuments/staff-directory.documents.ts` — Add `onboardingMetrics` query document

#### 1E. Run codegen

```bash
bun run generate:gqlSchema && bun codegen
```

This regenerates all TypeScript types after schema changes.

---

### Phase 2: Frontend Changes

#### 2A. Wire `avatarUrl` from API (replaces fake URLs)

**Files to modify:**
- `frontend/views/dashboard/managers/home/ManagersContainer.tsx` — Remove the fake `avatarUrl` computation at line 58. Map `avatarUrl` directly from `row.avatarUrl` (now returned by API). Add fallback: `avatarUrl: row.avatarUrl ?? ""`
- `frontend/views/dashboard/managers/home/ManagersCardList.tsx` — Update `<Avatar>` to show initials when `avatarUrl` is empty: `<Avatar src={manager.avatarUrl || undefined}>{manager.name.charAt(0)}</Avatar>`
- `frontend/views/dashboard/managers/home/ManagersDataGrid.tsx` — Same avatar fallback pattern
- `frontend/views/dashboard/managers/home/types.ts` — `avatarUrl` is already in `Manager` type — no change needed

#### 2B. Wire metrics from API (replaces client-side computation)

**Files to modify:**
- `frontend/views/dashboard/managers/home/ManagersContainer.tsx` — Remove the `metrics` useMemo (lines 64-79). Read `metrics` from `data?.managerDirectory?.metrics`. Pass it to `ManagersView`. Remove `filteredManagers` useMemo — no longer needed since filtering moves to server
- `frontend/views/dashboard/managers/home/ManagersView.tsx` — Update `metrics` prop type to match API shape (add `id` field)
- `frontend/views/dashboard/managers/home/ManagersMetrics.tsx` — No structural change needed if prop shape matches

#### 2C. Wire server-side filters (replaces client-side filtering)

**Files to modify:**
- `frontend/views/dashboard/managers/home/ManagersContainer.tsx` — Pass `roleFilter` and `statusFilter` as variables to the `useQuery` call. Remove the `filteredManagers` useMemo. Pass `rows` directly to `ManagersView` instead of `filteredManagers`
- `frontend/graphql/sharedDocuments/staff-directory.documents.ts` — Already updated in 1C with filter variables
- `frontend/stores/managersDirectoryStore.ts` — No changes needed (already resets page)

#### 2D. Add Action Menu to Settings/Options buttons

**Files to modify:**
- `frontend/views/dashboard/managers/home/ManagersCardList.tsx` — Add a `ManagerActionMenu` component (using MUI `Menu` + `MenuItem`) that opens on gear icon click. Actions:
  - "Edit Profile" — opens an inline edit dialog for `phone` and `skypeId` using the `updateManagerProfile` mutation
  - "Deactivate" — triggers a confirmation dialog, then calls `updateManagerProfile` with status change (requires adding status to `UpdateManagerProfileInput` if not already there)
- `frontend/views/dashboard/managers/home/ManagersDataGrid.tsx` — Same `ManagerActionMenu` component in the options column renderCell. May need to extract a shared `ManagerRowActions` component used by both CardList and DataGrid
- `frontend/views/dashboard/managers/home/types.ts` — Add `onEditManager` and `onDeactivateManager` callbacks to relevant props, or keep state local within the action menu

**Pattern reference:** Follow the existing `RowActions` pattern from `PermissionGroupsDataGrid.tsx:26-60`.

**Mutation to use:** `updateManagerProfileMutationDocument` from `staff-directory.documents.ts` (already defined).

**Note:** The current `UpdateManagerProfileInput` only supports `phone` and `skypeId`. To support deactivation, we need to either:
- (a) Extend `UpdateManagerProfileInput` to include `status` — requires backend changes
- (b) Create a separate `deactivateManager` mutation — requires backend changes
- Recommendation: extend `UpdateManagerProfileInput` to add optional `status` field (minimal backend change)

**Edit dialog:** Use MUI `Dialog` with `TextField` components for `phone` and `skypeId`. Use `useMutation` with `updateManagerProfileMutationDocument`. On success, Apollo cache auto-updates if `id` is returned.

#### 2E. Replace hardcoded OnboardingMetricsOverview with real API data

**Files to modify:**
- `frontend/views/dashboard/managers/onboarding/OnboardingMetricsOverview.tsx` — Replace `METRIC_ITEMS` hardcoded values with a `useQuery` call to the new `onboardingMetrics` query. Change `value` type from `string` to `number` (or format server-returned values). Handle loading state
- `frontend/views/dashboard/managers/onboarding/ManagerOnboardingView.tsx` — No change needed if `OnboardingMetricsOverview` self-fetches

#### 2F. Add password field to onboarding form

**Files to modify:**
- `frontend/views/dashboard/managers/onboarding/schemas/managerOnboardingSchema.ts` — Add `password: z.string().min(8, "passwordMinLength")` to the schema. Remove `department` field.
- `frontend/views/dashboard/managers/onboarding/types.ts` — `ManagerOnboardingFormData` extends `ManagerOnboardingInput` (minus `password` + department). Since we're now adding password back, change the `Omit` to NOT exclude password. Remove `department` override.
- `frontend/views/dashboard/managers/onboarding/SystemAccessSection.tsx` — Remove `DepartmentSelect` sub-component. Add a password `Input` field with `type="password"`. Use `register("password")` from React Hook Form. Remove the `DEPARTMENTS` constant and `DepartmentSelect` sub-component entirely
- `frontend/stores/managerOnboardingStore.ts` — Remove `password: ""` hardcoded. Pass `password: formData.password` instead. Remove `department` from input construction

#### 2G. Remove department from onboarding

**Files to modify:**
- `frontend/views/dashboard/managers/onboarding/schemas/managerOnboardingSchema.ts` — Remove `department` field from schema
- `frontend/views/dashboard/managers/onboarding/types.ts` — Remove `department` from `ManagerOnboardingFormData`
- `frontend/views/dashboard/managers/onboarding/SystemAccessSection.tsx` — Remove `DepartmentSelect` component and the `DEPARTMENTS` constant. Remove the `<Grid>` column for department
- `frontend/stores/managerOnboardingStore.ts` — Already not sending department; just clean up any references

#### 2H. Redirect after successful onboarding

**Files to modify:**
- `frontend/views/dashboard/managers/onboarding/ManagerOnboardingContainer.tsx` — Add `await router.push("/managers")` after `execute(formData)` succeeds (line 54-56). Optionally keep the snackbar by adding a query param like `?created=1` that the directory page reads

---

### Phase 3: Optional Backend Extension for Deactivation

#### 3A. Extend `UpdateManagerProfileInput` to support status changes

**Files to modify:**
- `backend/graphql/pothos/staff-directory.pothos.ts` — Add `status: t.string({ required: false })` to `UpdateManagerProfileInputPothosObject`
- `backend/services/staff/manager-profile.service.ts` — Accept `status` in `UpdateManagerProfileInput`. When provided, update staff profile status
- `backend/db/repo/staff-profile.repository.ts` — Extend `ManagerProfileUpdateInput` with `status?` and `statusIsSet?` fields. Include in the update query

---

## Execution Order

1. **Phase 1** (backend) — All changes in parallel, then `bun run generate:gqlSchema && bun codegen`
2. **Phase 2** (frontend) — All changes after codegen completes
3. **Phase 3** (optional deactivation) — During Phase 1 or as follow-up
4. **Quality gate** — `bun quality-gate` after all changes
5. **Test** — Run `bun run test:db`, `bun run test:graphql`, `bun run test:ui:components`

## Files Changed Summary

**New files:** None (all modifications to existing files)

**Modified files (backend):**
1. `backend/types/staff-profile.types.ts`
2. `backend/db/repo/staff-profile.repository.ts`
3. `backend/services/staff/manager-directory.service.ts`
4. `backend/services/staff/manager-profile.service.ts`
5. `backend/graphql/pothos/staff-directory.pothos.ts`

**Modified files (frontend):**
6. `frontend/graphql/sharedDocuments/staff-directory.documents.ts`
7. `frontend/stores/managersDirectoryStore.ts`
8. `frontend/stores/managerOnboardingStore.ts`
9. `frontend/views/dashboard/managers/home/ManagersContainer.tsx`
10. `frontend/views/dashboard/managers/home/ManagersView.tsx`
11. `frontend/views/dashboard/managers/home/ManagersCardList.tsx`
12. `frontend/views/dashboard/managers/home/ManagersDataGrid.tsx`
13. `frontend/views/dashboard/managers/home/types.ts`
14. `frontend/views/dashboard/managers/onboarding/OnboardingMetricsOverview.tsx`
15. `frontend/views/dashboard/managers/onboarding/ManagerOnboardingView.tsx`
16. `frontend/views/dashboard/managers/onboarding/ManagerOnboardingContainer.tsx`
17. `frontend/views/dashboard/managers/onboarding/SystemAccessSection.tsx`
18. `frontend/views/dashboard/managers/onboarding/schemas/managerOnboardingSchema.ts`
19. `frontend/views/dashboard/managers/onboarding/types.ts`
