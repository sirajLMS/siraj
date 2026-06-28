# Plan: Make Managers Page Components Real (No Placeholder/Fake Data)

## Architecture Overview

The managers page (`app/[locale]/(dashboard)/managers/`) has two sub-pages:

1. **Home** (`/managers`) — Manager directory listing with metrics, filters, and row actions
2. **Onboarding** (`/managers/onboarding`) — Create new manager form

### Data Flow
```
Page (Server Component)
  → Container (Client Component, Apollo useQuery)
    → View (Pure presentational)
      → Sub-components
```

---

## Component Audit Report

### 1. Managers Home Page

| Component | File | Status | Issues |
|-----------|------|--------|--------|
| `ManagersContainer` | `frontend/views/dashboard/managers/home/ManagersContainer.tsx` | **REAL** | Fetches via `managerDirectoryQueryDocument` with proper Apollo query, maps filters from Zustand store, passes data down |
| `ManagersView` | `frontend/views/dashboard/managers/home/ManagersView.tsx` | **REAL** | Pure presentational. "Add Manager" button links to `/managers/onboarding` — a real route with real page |
| `ManagersMetrics` | `frontend/views/dashboard/managers/home/ManagersMetrics.tsx` | **REAL** | Receives metrics from container (fetched via GraphQL). Displays `MetricCard` components with real data |
| `ManagersFilterBar` | `frontend/views/dashboard/managers/home/ManagersFilterBar.tsx` | **REAL** | Filters are wired to Zustand store (`useManagersDirectoryStore`), which triggers Apollo refetch via variable changes |
| `ManagersDataGrid` | `frontend/views/dashboard/managers/home/ManagersDataGrid.tsx` | **REAL** | Renders data from GraphQL, server-side pagination via `onPageChange` → `setPage` in Zustand |
| `ManagersCardList` | `frontend/views/dashboard/managers/home/ManagersCardList.tsx` | **REAL** | Mobile card view with same data source, pagination |
| `ManagerRowActions` | `frontend/views/dashboard/managers/home/ManagerRowActions.tsx` | **REAL** | Edit profile dialog calls `updateManagerProfileMutationDocument` (real mutation). Deactivate/activate calls the same mutation with status change |
| `types.ts` | `frontend/views/dashboard/managers/home/types.ts` | **ISSUE** | Re-exports `ManagerDirectoryRow` from generated types (unused). Defines local `Manager`, `ManagerRole`, `ManagerStatus`, `ManagersMetrics` types that **duplicate** `backend/types/staff-profile.types.ts` types. This violates the Single Canonical Type Pattern from AGENTS.md |
| `managersDirectoryStore` | `frontend/stores/managersDirectoryStore.ts` | **REAL** | Proper Zustand store for filter/pagination state |
| `ManagersContainer.stories.tsx` | Stories file | **OK** | Properly mocks Apollo for Storybook |

### 2. Managers Onboarding Page

| Component | File | Status | Issues |
|-----------|------|--------|--------|
| `ManagerOnboardingContainer` | `frontend/views/dashboard/managers/onboarding/ManagerOnboardingContainer.tsx` | **REAL** | Calls `useCreateManagerMutation()` (real GraphQL mutation). Navigates to `/managers` on success/cancel |
| `ManagerOnboardingView` | `frontend/views/dashboard/managers/onboarding/ManagerOnboardingView.tsx` | **REAL** | Form wired to react-hook-form with Zod validation. Submit calls real mutation |
| `StaffInfoSection` | `frontend/views/dashboard/managers/onboarding/StaffInfoSection.tsx` | **REAL** | Uses shared `OnboardingIdentityFields` + skype field, all registered with react-hook-form |
| `SystemAccessSection` | `frontend/views/dashboard/managers/onboarding/SystemAccessSection.tsx` | **REAL** | Account type toggle and password field, both controlled by react-hook-form |
| `OnboardingMetricsOverview` | `frontend/views/dashboard/managers/onboarding/OnboardingMetricsOverview.tsx` | **REAL** | Fetches via `onboardingMetricsQueryDocument` (real GraphQL query) |
| `types.ts` | `frontend/views/dashboard/managers/onboarding/types.ts` | **REAL** | Derives types from generated `ManagerOnboardingInput` |
| `managerOnboardingSchema.ts` | Schemas | **REAL** | Zod validation schema matching the mutation input |
| `managerOnboardingStore` | `frontend/stores/managerOnboardingStore.ts` | **REAL** | Wraps `useMutation` for `createManagerMutationDocument` |

### 3. App Router Pages

| File | Status | Issue |
|------|--------|-------|
| `app/[locale]/(dashboard)/managers/page.tsx` | **ISSUE** | Missing auth guard (`getServerUserContext`). Per `app/AGENTS.md`, pages should verify authentication. However, the `RequirePermission` wrapper in the container does client-side permission check |
| `app/[locale]/(dashboard)/managers/onboarding/page.tsx` | **ISSUE** | Same — missing auth guard. Also missing `setRequestLocale` for i18n |

### 4. GraphQL Documents

| File | Status | Issue |
|------|--------|-------|
| `staff-directory.documents.ts` | **REAL** | All 3 operations (`managerDirectory`, `updateManagerProfile`, `onboardingMetrics`) query real backend fields |
| `manager-onboarding.documents.ts` | **ISSUE** | `ManagerOnboardingResult` selection is **missing `id` field**. Per `sharedDocuments/AGENTS.md`: "Every query/mutation selection set **must** include the `id` field on every named object type so Apollo Client can auto-update its cache" |

### 5. Pothos/Backend (Out of Scope — Not Modified)

| File | Status | Issue |
|------|--------|-------|
| `backend/graphql/pothos/staff-directory.pothos.ts` | **AGENTS.md VIOLATION** | Defines local `ManagerDirectoryRowDefinition`, `ManagerDirectoryMetricsDefinition`, `ManagerDirectoryResultDefinition` types instead of importing from `backend/types/`. This violates the "Single Canonical Object Type Pattern" |
| `backend/graphql/pothos/manager-onboarding.pothos.ts` | **AGENTS.md VIOLATION** | Imports types from service layer instead of `backend/types/`. Defines `ManagerOnboardingGqlInput` locally |
| `backend/graphql/pothos/manager-onboarding.pothos.ts` | **AGENTS.md VIOLATION** | `ManagerOnboardingResultPothosObject` is **missing `id` field** — required by Apollo cache normalization |

---

## Issues Within Scope (Frontend Views + App Router + GraphQL Documents + Stores)

### Issue 1: `managers/home/types.ts` — Duplicate Type Definitions
**Violation**: `frontend/stores/AGENTS.md` — "Strict Typing: Stores should be strictly typed using the GraphQL generated types. Avoid redefining types if they exist in the GraphQL schema."
**Violation**: `frontend/views/AGENTS.md` — Data fetching uses Apollo hooks with generated TypedDocumentNodes.

**Current**: `Manager`, `ManagerRole`, `ManagerStatus`, `ManagersMetrics` are manually defined interfaces in `types.ts`, duplicating the shape from generated `ManagerDirectoryRow` and `ManagerDirectoryMetrics` types.

**Important Detail**: The generated `ManagerDirectoryRow` has all fields nullable (`Maybe<string>`), while the local `Manager` type has required strings. The container already does null-coalescing (`row.name ?? ""`) to bridge this gap.

**Fix approach**: 
- Remove the local `Manager` interface. The `ManagersContainer` already maps the raw rows to the biased non-null shape. We'll define a `ManagerRow` utility type that is `Required<Pick<ManagerDirectoryRow, 'id' | 'name' | 'email' | 'phone' | 'skypeId' | 'avatarUrl'>> & { role: ManagerRole; status: ManagerStatus }` — this keeps the non-null guarantee for the view layer while deriving from generated types.
- Remove the local `ManagersMetrics` interface and use the generated `ManagerDirectoryMetrics` type (also all-nullable, so we'll still need the container's null-coalescing).
- Keep `ManagerRole`, `ManagerStatus`, `ManagerRoleFilter`, `ManagerStatusFilter` as UI-specific union types since they're derived display categories (not in the GraphQL schema).

### Issue 2: `manager-onboarding.documents.ts` — Missing `id` Field
**Violation**: `frontend/graphql/sharedDocuments/AGENTS.md` — "Every query/mutation selection set **must** include the `id` field on every named object type so Apollo Client can auto-update its cache."

**Current**: `createManager` mutation does not include `id` on `ManagerOnboardingResult`.
**Fix**: This requires a 2-part change:
1. **Backend** (includes `id` in service return + Pothos object): Add `id` field to `ManagerOnboardingResult` in `manager-onboarding.service.ts` (use `staffProfileId` as the `id` value for Apollo normalization), and expose `id` in `ManagerOnboardingResultPothosObject` in `manager-onboarding.pothos.ts`.
2. **Frontend**: Add `id` to mutation selection set in `manager-onboarding.documents.ts`.

Since the user approved this fix, we will make both backend and frontend changes. The `id` field on `ManagerOnboardingResult` will be set to `staffProfileId` (already available in the return object), which gives Apollo a stable cache key. After modifying the Pothos schema, we must run `bun run generate:gqlSchema && bun codegen`.

### Issue 3: App Router Pages — Missing Auth Guards and i18n
**Violation**: `app/AGENTS.md` — "Use `getServerUserContext()` to verify authentication." and "Use `setRequestLocale` for i18n."

**Current**: `managers/page.tsx` — has `setRequestLocale` but missing auth guard. `managers/onboarding/page.tsx` — missing both auth guard and `setRequestLocale`.
**Fix**: Add `getServerUserContext()` + redirect to both page files. Add `setRequestLocale` to onboarding page. Follow pattern from `app/AGENTS.md`.

---

## Implementation Plan (In Order)

### Phase 1: App Router Layer — Auth Guards (2 files)
1. Update `app/[locale]/(dashboard)/managers/page.tsx` — Add auth guard
2. Update `app/[locale]/(dashboard)/managers/onboarding/page.tsx` — Add auth guard + `setRequestLocale`

### Phase 2: Backend + GraphQL — Add `id` to ManagerOnboardingResult (3 files)
3. Update `backend/services/staff/manager-onboarding.service.ts` — Add `id` field to `ManagerOnboardingResult` interface and return value (set `id: staffProfile.id`)
4. Update `backend/graphql/pothos/manager-onboarding.pothos.ts` — Add `id: t.exposeString("id")` to `ManagerOnboardingResultPothosObject`
5. Run `bun run generate:gqlSchema && bun codegen` to regenerate types
6. Update `frontend/graphql/sharedDocuments/manager-onboarding.documents.ts` — Add `id` to `createManager` mutation selection set

### Phase 3: Frontend Views — Fix Duplicate Types (6 files)
7. Update `frontend/views/dashboard/managers/home/types.ts` — Refactor `Manager` to derive from generated `ManagerDirectoryRow`. Remove duplicate `ManagersMetrics`, use generated `ManagerDirectoryMetrics`. Keep `ManagerRole`/`ManagerStatus` as UI-only union types.
8. Update `ManagersContainer.tsx` — Use updated types from `types.ts` (same shape, just derived from generated).
9. Update `ManagersView.tsx` — Update `metrics` prop type to use `ManagerDirectoryMetrics` from generated types.
10. Update `ManagersMetrics.tsx` — Update `metrics` prop type to use generated `ManagerDirectoryMetrics`.
11. Update `ManagersDataGrid.tsx` — No changes needed if `Manager` type shape stays the same (just derivation changes).
12. Update `ManagersCardList.tsx` — No changes needed if `Manager` type shape stays the same.
13. Update `ManagerRowActions.tsx` — No changes needed if `Manager` type shape stays the same.

### Phase 4: Run Quality Checks
12. Run `bun tsgo`
13. Run `bun biome:check`
14. Run `bun run lint`
15. Run `bun run test:db` (for staff-profile repo tests affected by backend changes)
16. Run `bun run test:graphql` (for manager-directory and manager-onboarding integration tests)
17. Run `bun run test:ui:components` (for component tests if any)

---

## Out-of-Scope Issues (Documented but NOT Fixed)
- **`backend/graphql/pothos/staff-directory.pothos.ts`**: Local type definitions (`ManagerDirectoryRowDefinition`, etc.) violate Single Canonical Type Pattern — requires separate backend refactor task
- **`backend/graphql/pothos/staff-directory.pothos.ts`**: `UpdateManagerProfileInputDefinition` defined locally instead of from `backend/types/` — requires backend agent
