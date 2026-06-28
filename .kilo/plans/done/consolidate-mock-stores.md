# Plan: Consolidate Mock Stores into Stories & Extract Types

## Goal

Ensure all mock stores are **only** defined as top-level inline stores in the same `.stories.tsx` files that use them, **delete all standalone `mock*.ts` store files**, ensure no types are **re-exported** from stories, and **move any types currently defined in mock stores to `types.ts` / `types/` files** in the same domain directory (if not already declared there).

## Key Findings from Analysis

### 1. Mock Stores Inventory (25 files to delete)

| Mock Store File | Types Defined Inside | Already Exists in Domain types? | Store Hook + Mock Data Used by Production `.tsx`? |
|---|---|---|---|
| `mockUserStore.ts` | `MOCK_ADMIN_USER`, `MOCK_AUTHENTICATED_USER`, `userInfoToUser` (values, not types) | N/A — types come from `UserState`, `UserInfo` in `dashboard.ts` | Yes — imported by StoryWrapper, createMockAdminDecorator, and 9 stories |
| `mockDashboardStore.ts` | None (uses `DashboardState` from real store) | N/A | Yes — imported by `AdminDashboardContainer.stories.tsx` |
| `mockStudentsStore.ts` | `StudentsState` (interface), `MOBILE_METRIC_ICONS` (value) | `StudentsState` partially; `MOBILE_METRIC_ICONS` not in types | Yes — imported by `TeacherReassignmentContainer.tsx` |
| `mockAdminBillingStore.ts` | `AdminBillingState` (interface) | Types from `billingViewTypes.ts`; `AdminBillingState` only in mock | No (only stories could use it) |
| `mockReportsStore.ts` | `ReportsState` (interface) | Types from `reportsTypes.ts`; `ReportsState` only in mock | No |
| `mockResourcesStore.ts` | `ResourcesState` (interface) + **re-exports 5 types** | Types from `resourcesTypes.ts`; `ResourcesState` only in mock | No |
| `mockManagersStore.ts` | `Manager` (interface), `ManagersState` (interface) | `Manager` **already exists** in `managers/home/types.ts`; `ManagersState` only in mock | No |
| `mockTeacherScheduleStore.ts` | `ScheduledClass`, `TeacherWeeklySchedule`, `FutureSchedule`, `TeacherScheduleState` + **re-exports `FutureClass`** | `FutureClass` is from generated types; others only in mock | No |
| `mockCreateRecurringClassStore.ts` | `DayOfWeek`, `StudentGroup`, `DayScheduleConfig`, `CreateRecurringClassState` + `DEFAULT_DAY_SCHEDULE` | `DayOfWeek` and `DayScheduleConfig` exist in real store; `StudentGroup` only in mock | **YES** — production `.tsx` files import `StudentGroup`, `DayScheduleConfig`, `DEFAULT_DAY_SCHEDULE`, and the store hook |
| `mockDstMigrationStore.ts` | `DstMigrationState` (interface) | Domain types already in `tools/dst-migration/types.ts`; `DstMigrationState` only in mock | No |
| `mockTeacherDashboardStore.ts` | None (uses `TeacherDashboardState` from `teacherDashboardTypes.ts`) | N/A | No |
| `mockTeacherDashboardActiveStore.ts` | `TeacherDashboardActiveState` (interface) | Extends `TeacherDashboardState` from `teacherDashboardTypes.ts` | No |
| `mockTeachersStore.ts` | `TeacherDirectoryRow`, `TeacherMetrics`, `TeachersState` | `TeacherDirectoryRow` only in mock | **YES** — `TeacherReassignmentView.tsx` and `ManagementControlsCard.tsx` import type |
| `mockTeacherProfileStore.ts` | `TeacherProfileData` (interface), `TeacherProfileState` | `TeacherProfileData` only in mock | **YES** — `TeacherProfileView.tsx` imports type |
| `mockTeacherAvailabilityStore.ts` | `AvailabilityEntry`, `DayOfWeek`, `WeeklyAvailability`, `TeacherAvailabilityInsights`, `TeacherAvailabilityState` | None exist in domain types | **YES** — 5 production `.tsx` files import types + store hook |
| `mockStudentStatusStore.ts` | `UpcomingClass`, `StudentStatusInfo`, `StudentStatusState` | None exist in domain types | **YES** — 3 production `.tsx` files import types + store hook |
| `mockStudentQuotaStore.ts` | `StudentProfileData`, `StudentQuotaState` | None exist in domain types | **YES** — `StudentQuotaView.tsx` imports type |
| `mockStudentHistoryStore.ts` | `StudentHistoryState` + **re-exports `ClassSession`, `StudentHistoryMetrics`** | View-layer types exist in `students/history/types.ts` but with **different shapes** | Yes — story uses the store |
| `mockScheduleAlertsStore.ts` | `ScheduleAlertType`, `ScheduleAlert`, `ClassSessionAction`, `ClassSessionStatus`, `AcademicClassRow`, `AlertsMetric`, `ScheduleAlertsState` | None exist in domain types | **YES** — 6 production `.tsx` files import types + store hook |
| `mockRescheduleTrackingStore.ts` | `TrackingClassStatus`, `TrackingRow`, `RescheduleTrackingState` (+ inner types) | `TrackingRow` and `TrackingClassStatus` **already exist** in `reschedule/tracking/types.ts` | **YES** — `RescheduleTrackingView.tsx` imports type |
| `mockRescheduleStore.ts` | `RescheduleSession`, `RescheduleState` | None exist in domain types | **YES** — 2 production `.tsx` files import types + store hook |
| `mockParentsStore.ts` | `ParentAccountStatus`, `ParentDirectoryRow`, `ParentsState`, `MOBILE_METRIC_KEYS`, `MOBILE_METRIC_ICONS` | None exist in domain types | No |
| `mockParentDashboardStore.ts` | `ParentBookingStatus`, `ParentLiveClassStatus`, `ParentScheduleRow`, `StudentProgressItem`, `ParentDashboardMetrics`, `WorkshopPromo`, `ParentDashboardState` | None exist in domain types | **YES** — 8 production `.tsx` files import types + store hook |
| `mockClassDetailsStore.ts` | `ClassDetailsState` (interface — partial, different from real) | Real store has its own `ClassDetailsState` | No |
| `mockClassAuditStore.ts` | `ClassAuditStatus`, `AttendanceStatus`, `CommunicationType`, `RegisteredStudent`, `VenueInfo`, `CommunicationLogEntry`, `AdminNote`, `ClassAuditData`, `ClassAuditState` | None exist in domain types | **YES** — 6 production `.tsx` files import types + store hook |
| `mocKAdminManualInvoiceStore.ts` | `ParentInvoiceOption`, `AdminManualInvoiceState` | `ParentInvoiceOption` **already exists** in `billing/manual/types/manualInvoiceViewTypes.ts` | No |
| `moackParentBillingStore.ts` | `ParentInvoiceStatus`, `ParentBillingSummary`, `ParentInvoiceRow`, `ParentBillingState` | None exist in domain types | No |

### 2. Scope of the Problem

**27 mock store files** need to be deleted. Before deletion:

**A. Types to migrate to `types.ts` files** (mock stores that define types consumed by production `.tsx` files):

| Mock Store | Types to Move | Target `types.ts` |
|---|---|---|
| `mockClassAuditStore` | `ClassAuditStatus`, `AttendanceStatus`, `CommunicationType`, `RegisteredStudent`, `VenueInfo`, `CommunicationLogEntry`, `AdminNote`, `ClassAuditData` | `classes/audit/types.ts` (new) |
| `mockTeacherAvailabilityStore` | `AvailabilityEntry`, `DayOfWeek`, `WeeklyAvailability`, `TeacherAvailabilityInsights` | `teachers/availability/types.ts` (new) |
| `mockStudentStatusStore` | `UpcomingClass`, `StudentStatusInfo` | `students/status/types.ts` (new) |
| `mockStudentQuotaStore` | `StudentProfileData` | `students/quota/types.ts` (new) |
| `mockTeacherProfileStore` | `TeacherProfileData` | `teachers/profile/types.ts` (new) |
| `mockScheduleAlertsStore` | `ScheduleAlertType`, `ScheduleAlert`, `ClassSessionAction`, `ClassSessionStatus`, `AcademicClassRow`, `AlertsMetric` | `schedule/alerts/types.ts` (new) |
| `mockParentDashboardStore` | `ParentBookingStatus`, `ParentLiveClassStatus`, `ParentScheduleRow`, `StudentProgressItem`, `ParentDashboardMetrics`, `WorkshopPromo` | `parents/dashboard/types.ts` (add to existing dir) |
| `mockRescheduleStore` | `RescheduleSession` | `reschedule/home/types.ts` (new) |
| `mockTeachersStore` | `TeacherDirectoryRow`, `TeacherMetrics` | `teachers/home/types.ts` (new) |
| `mockCreateRecurringClassStore` | `StudentGroup` | `classes/recurring/types.ts` (new) |

**B. Types already existing in domain types but imported from mock store** (switch import source):

| Production File | Current Import From | Switch To |
|---|---|---|
| `RescheduleTrackingView.tsx` | `mockRescheduleTrackingStore` | `./types` |
| `parentDashboardLabels.ts` | `mockParentDashboardStore` → `ParentBookingStatus`, `ParentLiveClassStatus` | After migration: `./types` |

**C. Mock store hooks used by production `.tsx` files** (these containers are currently using mock stores directly — they need the mock store code inlined into the story):

Productions `.tsx` files that import and use mock store _hooks_ (not just types):
- `ClassAuditContainer.tsx` → `useClassAuditStore` from `mockClassAuditStore`
- `StatusTrackingContainer.tsx` → `useRescheduleStore` from `mockRescheduleStore`
- `CreateRecurringClassContainer.tsx` → `useCreateRecurringClassStore` from `mockCreateRecurringClassStore`
- `ScheduleAlertsContainer.tsx` → `useScheduleAlertsStore` from `mockScheduleAlertsStore`
- `StudentStatusContainer.tsx` → `useStudentStatusStore` from `mockStudentStatusStore`
- `TeacherAvailabilityContainer.tsx` → `useTeacherAvailabilityStore` from `mockTeacherAvailabilityStore`
- `ParentDashboardContainer.tsx` → `useParentDashboardStore` from `mockParentDashboardStore`
- `TeacherReassignmentContainer.tsx` → `useStudentsStore` + `useTeachersStore` from mock stores

These containers need to be refactored to import from **real stores** instead. The mock data/state lives only in stories.

### 3. Stories That Use Mock Stores (17 stories)

Stories importing mock stores need the mock store logic moved **inline into the story file** itself (as a `create()` call with mock data at the top of the file, or via a decorator).

| Story File | Mock Store(s) Used | Current Import |
|---|---|---|
| `AdminDashboardContainer.stories.tsx` | `useMockDashboardStore` | `mockDashboardStore` |
| `DashboardContainer.stories.tsx` | `useMockUserStore` | `mockUserStore` |
| `DashboardLayout.stories.tsx` | `useUserStore` | `mockUserStore` |
| `StudentsContainer.stories.tsx` | `useMockUserStore` | `mockUserStore` |
| `ManagersContainer.stories.tsx` | `useMockUserStore` | `mockUserStore` |
| `ReportsContainer.stories.tsx` | `useMockUserStore` | `mockUserStore` |
| `ResourcesContainer.stories.tsx` | `useMockUserStore` | `mockUserStore` |
| `ParentSuggestionsDesktopView.stories.tsx` | `useMockUserStore` | `mockUserStore` |
| `ParentComplaintsDesktopView.stories.tsx` | `useMockUserStore` | `mockUserStore` |
| `ClassDetailsContainer.stories.tsx` | `useClassDetailsStore` + `useUserStore` | `mockClassDetailsStore` + `mockUserStore` |
| `LiveSessionToolbar.stories.tsx` | `useUserStore` | `mockUserStore` |
| `StatusTrackingContainer.stories.tsx` | `useRescheduleStore` | `mockRescheduleStore` |
| `StudentHistoryContainer.stories.tsx` | `useStudentHistoryStore` | `mockStudentHistoryStore` |
| `TeacherDashboardContainer.stories.tsx` | `useTeacherDashboardActiveStore` + `useTeacherDashboardStore` + `useMockUserStore` | 3 mock stores |
| `TeacherWeeklyScheduleContainer.stories.tsx` | `useTeacherScheduleStore` | `mockTeacherScheduleStore` (indirect via Container) |
| `FutureScheduleContainer.stories.tsx` | `useTeacherScheduleStore` | `mockTeacherScheduleStore` (indirect via Container) |
| `RescheduleTrackingContainer.stories.tsx` | `useRescheduleTrackingStore` | `mockRescheduleTrackingStore` |
| `RescheduleContainer.stories.tsx` | `useRescheduleStore` | `mockRescheduleStore` |

### 4. Re-exports from Mock Stores (must be eliminated)

| Mock Store File | Re-exported Types |
|---|---|
| `mockResourcesStore.ts` | `LearningResourceRow`, `ResourceFileType`, `ResourceFilterType`, `ResourceSortBy`, `ResourceUploadFormData` — already in `resourcesTypes.ts` |
| `mockTeacherScheduleStore.ts` | `FutureClass` — already in generated types |
| `mockStudentHistoryStore.ts` | `ClassSession`, `StudentHistoryMetrics` — already in `studentHistoryStore.ts` |
| `mockTeacherScheduleStore.ts` | `FutureClass` — already in GraphQL generated types |

### 5. Storybook Aliasing

`.storybook/main.ts` aliases `@/frontend/stores/userStore` → `mockUserStore` and `../stores/userStore` → `mockUserStore`. After deleting `mockUserStore.ts`, the StoryWrapper + `createMockAdminDecorator` need to seed the real store directly.

---

## Decisions

1. **Real stores**: Create minimal real Zustand stores with empty/default state for all domains that don't have one yet. Production containers import the real hook. Stories seed the real store with mock data via `setState()` decorators.
2. **Storybook alias**: Remove the `userStore → mockUserStore` alias from `.storybook/main.ts`. Stories and StoryWrapper will seed the real `useUserStore` directly. No new aliases added.

---

## Phase 0: Create Missing Domain `types.ts` Files

Move types from mock stores into domain-local types files. Each new `types.ts` only gets types that don't already exist in the domain. For each type, **do not duplicate** — if a type already exists in domain types (e.g., `TrackingRow` in `reschedule/tracking/types.ts`), update the production code's import path instead.

### Task A — `classes/audit/types.ts` (new)

Create `frontend/views/dashboard/classes/audit/types.ts` with types from `mockClassAuditStore.ts`:
- `ClassAuditStatus`
- `AttendanceStatus`
- `CommunicationType`
- `RegisteredStudent`
- `VenueInfo`
- `CommunicationLogEntry`
- `AdminNote`
- `ClassAuditData`

Then update all 6 production imports:
- `AdminNoteCard.tsx`
- `VenueLocationCard.tsx`
- `RegisteredStudentsSection.tsx`
- `ClassAuditDetailsCard.tsx`
- `ClassAuditView.tsx`
- `CommunicationLogCard.tsx`

### Task B — `teachers/availability/types.ts` (new)

Create `frontend/views/dashboard/teachers/availability/types.ts` with types from `mockTeacherAvailabilityStore.ts`:
- `AvailabilityEntry`
- `DayOfWeek`
- `WeeklyAvailability`
- `TeacherAvailabilityInsights`

Update imports in:
- `TeacherAvailabilityView.tsx`
- `TeacherAvailabilityContainer.tsx`
- `WeeklyAvailabilityGrid.tsx`
- `AvailabilityInsights.tsx`

### Task C — `students/status/types.ts` (new)

Create `frontend/views/dashboard/students/status/types.ts` with types from `mockStudentStatusStore.ts`:
- `UpcomingClass`
- `StudentStatusInfo`

Update imports in:
- `StudentStatusView.tsx`
- `StudentStatusContainer.tsx`
- `UpcomingClassesTable.tsx`
- `StudentStatusHeader.tsx`

### Task D — `students/quota/types.ts` (new)

Create `frontend/views/dashboard/students/quota/types.ts` with `StudentProfileData` from `mockStudentQuotaStore.ts`.

Update import in:
- `StudentQuotaView.tsx`

### Task E — `teachers/profile/types.ts` (new)

Create `frontend/views/dashboard/teachers/profile/types.ts` with `TeacherProfileData` from `mockTeacherProfileStore.ts`.

Update import in:
- `TeacherProfileView.tsx`

### Task F — `schedule/alerts/types.ts` (new)

Create `frontend/views/dashboard/schedule/alerts/types.ts` with types from `mockScheduleAlertsStore.ts`:
- `ScheduleAlertType`
- `ScheduleAlert`
- `ClassSessionAction`
- `ClassSessionStatus`
- `AcademicClassRow`
- `AlertsMetric`

Update imports in:
- `ScheduleAlertsView.tsx`
- `ScheduleAlertsContainer.tsx`
- `ScheduleAlertBanners.tsx`
- `ClassSessionActionButton.tsx`
- `AcademicScheduleDataGrid.tsx`
- `AcademicScheduleCardList.tsx`

### Task G — `parents/dashboard/types.ts` (extend existing)

Add to `frontend/views/dashboard/parents/dashboard/types/parentDashboardTypes.ts` (new file, since the current file is just `parentDashboardLabels.ts`):
- `ParentBookingStatus`
- `ParentLiveClassStatus`
- `ParentScheduleRow`
- `StudentProgressItem`
- `ParentDashboardMetrics`
- `WorkshopPromo`

Update imports in:
- `ParentDashboardView.tsx`
- `ParentDashboardContainer.tsx`
- `WorkshopPromoCard.tsx`
- `ParentScheduleDataGrid.tsx`
- `ParentDashboardMetrics.tsx`
- `ParentClassStatusIndicator.tsx`
- `AcademicProgressSummary.tsx`
- `ParentScheduleCardList.tsx`
- `parentDashboardLabels.ts` (switch from mock to local types)

### Task H — `reschedule/home/types.ts` (new)

Create `frontend/views/dashboard/reschedule/home/types.ts` with `RescheduleSession` from `mockRescheduleStore.ts`.

Update imports in:
- `RescheduleView.tsx`
- `ClassParticipantsSection.tsx`

### Task I — `teachers/home/types.ts` (new)

Create `frontend/views/dashboard/teachers/home/types.ts` with `TeacherDirectoryRow` and `TeacherMetrics` from `mockTeachersStore.ts`.

Update imports in:
- `TeacherReassignmentView.tsx`
- `TeacherReassignmentContainer.tsx`
- `ManagementControlsCard.tsx`

### Task J — `classes/recurring/types.ts` (new)

Create `frontend/views/dashboard/classes/recurring/types.ts` with `StudentGroup` from `mockCreateRecurringClassStore.ts`.

Update imports in:
- `StudentGroupSelect.tsx`
- `RecurringClassFormFields.tsx`
- `RecurringClassForm.tsx`
- `CreateRecurringClassView.tsx`

### Task K — Fix already-existing type imports pointing to mock stores

These production files import types that already exist in domain types files but point to mock stores:

- `RescheduleTrackingView.tsx` → switch `TrackingRow` import from `mockRescheduleTrackingStore` to `./types`

---

## Phase 1: Refactor Production Containers to Use Real Stores

Production `.tsx` files currently importing **store hooks** from mock stores must be changed to import from real stores. This is the prerequisite for deleting mock store files.

### Task L — Container Refactoring

For each container that uses a mock store hook, refactor to use the real store:

| Container | Current Mock Store Hook | New Source |
|---|---|---|
| `ClassAuditContainer.tsx` | `useClassAuditStore` from `mockClassAuditStore` | Create/use a real ` useClassAuditStore` in `frontend/stores/` or import mock inline in story |
| `StatusTrackingContainer.tsx` | `useRescheduleStore` from `mockRescheduleStore` | Use real `useRescheduleStore` or inline in story |
| `CreateRecurringClassContainer.tsx` | `useCreateRecurringClassStore` from `mockCreateRecurringClassStore` + `useUserStore` from `mockUserStore` | Use real `useCreateRecurringClassStore` from `createRecurringClassStore.ts` + `useUserStore` from `userStore.ts` (Storybook aliases) |
| `ScheduleAlertsContainer.tsx` | `useScheduleAlertsStore` from `mockScheduleAlertsStore` | Create real store or inline in story |
| `StudentStatusContainer.tsx` | `useStudentStatusStore` from `mockStudentStatusStore` | Create real store or inline in story |
| `TeacherAvailabilityContainer.tsx` | `useTeacherAvailabilityStore` from `mockTeacherAvailabilityStore` | Create real store or inline in story |
| `ParentDashboardContainer.tsx` | `useParentDashboardStore` from `mockParentDashboardStore` | Create real store or inline in story |
| `TeacherReassignmentContainer.tsx` | `useStudentsStore` + `useTeachersStore` from mock stores | Create real stores or inline |

**Strategy** (confirmed): Create minimal real Zustand stores (empty defaults, no mock data) in `frontend/stores/`. The mock data lives exclusively in story files via `setState()` decorators. For containers that already have a real store (like `CreateRecurringClassContainer.tsx` → real `createRecurringClassStore.ts` exists), just switch the import. The Storybook alias for `userStore` will be removed — StoryWrapper and `createMockAdminDecorator` will seed the real `useUserStore` directly.

### Real Stores to Create

| New Real Store File | State Shape (Minimal) |
|---|---|
| `frontend/stores/classAuditStore.ts` | `ClassAuditState` with `audit: ClassAuditData | null`, `resendNotifications`, `updateAdminNote` |
| `frontend/stores/scheduleAlertsStore.ts` | `ScheduleAlertsState` with empty defaults |
| `frontend/stores/studentStatusStore.ts` | `StudentStatusState` with `studentInfo: null`, `isLoading: false`, `isUpdating: false` |
| `frontend/stores/teacherAvailabilityStore.ts` | `TeacherAvailabilityState` with empty defaults |
| `frontend/stores/parentDashboardStore.ts` | `ParentDashboardState` with empty defaults |
| `frontend/stores/rescheduleStore.ts` | `RescheduleState` with `session: default`, `isSubmitting: false` |
| `frontend/stores/teachersStore.ts` | `TeachersState` with empty defaults |
| `frontend/stores/parentsStore.ts` | `ParentsState` with empty defaults |

**Note**: Some real stores already exist:
- `dashboardStore.ts` (real) ← mockDashboardStore can be replaced via Storybook alias
- `createRecurringClassStore.ts` (real) ← mockCreateRecurringClassStore already has a counterpart
- `classDetailsStore.ts` (real) ← mockClassDetailsStore has a counterpart
- `userStore.ts` (real) ← already aliased in Storybook

---

## Phase 2: Inline Mock Store Logic into Stories

For each story that imports a mock store, move the `create<StoreType>()` call with mock data **inline into the story file** (or a co-located helper within the story). The story creates the store with mock data and provides it via a decorator that seeds the real store's state.

**Pattern**:

```tsx
// Before (in story file):
import { useMockDashboardStore } from "@/frontend/stores/mockDashboardStore";

// After (in story file):
import { useDashboardStore } from "@/frontend/stores/dashboardStore";
import type { DashboardState } from "@/frontend/stores/dashboardStore";

const MOCK_DASHBOARD_INITIAL_STATE: Partial<DashboardState> = {
  todayClasses: [...],
  scheduleRows: [...],
  // ...mock data...
};

const withMockDashboard = (Story) => {
  useDashboardStore.setState(MOCK_DASHBOARD_INITIAL_STATE);
  return <Story />;
};
```

### Stories to Update (17 files)

Each story needs:
1. Remove the `import { useMock... } from "@/frontend/stores/mock..."` line
2. Add `import { useRealStore } from "@/frontend/stores/realStore"`
3. Define mock data constants inline (or via a decorator)
4. Add a decorator that seeds the real store with mock data via `useRealStore.setState()`

---

## Phase 3: Update Storybook Config & Shared Decorators

### Task M — `.storybook/main.ts`

Remove the `userStore → mockUserStore` alias entirely. The StoryWrapper will seed the real `useUserStore` directly (no aliasing needed).

### Task N — `.storybook/StoryWrapper.tsx`

Replace:
```tsx
import { MOCK_ADMIN_USER, userInfoToUser } from "@/frontend/stores/mockUserStore";
import { useUserStore } from "@/frontend/stores/userStore";
```

With:
```tsx
import { useUserStore } from "@/frontend/stores/userStore";
import type { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";

const MOCK_ADMIN_PERMISSIONS: AppPermission[] = [ ... ]; // copy from mockUserStore
// Seed directly in useEffect
```

### Task O — `createMockAdminDecorator.tsx`

Replace `useMockUserStore` import with `useUserStore` from the real store. Drop the `setState` call on the mock — only use the real one.

---

## Phase 4: Delete All Mock Store Files

Delete all 27 mock store files:

1. `frontend/stores/mockDashboardStore.ts`
2. `frontend/stores/mockStudentsStore.ts`
3. `frontend/stores/mockAdminBillingStore.ts`
4. `frontend/stores/mockReportsStore.ts`
5. `frontend/stores/mockResourcesStore.ts`
6. `frontend/stores/mockManagersStore.ts`
7. `frontend/stores/mockTeacherScheduleStore.ts`
8. `frontend/stores/mockCreateRecurringClassStore.ts`
9. `frontend/stores/mockDstMigrationStore.ts`
10. `frontend/stores/mockTeacherDashboardStore.ts`
11. `frontend/stores/mockTeacherDashboardActiveStore.ts`
12. `frontend/stores/mockUserStore.ts`
13. `frontend/stores/mockTeachersStore.ts`
14. `frontend/stores/mockTeacherProfileStore.ts`
15. `frontend/stores/mockTeacherAvailabilityStore.ts`
16. `frontend/stores/mockStudentStatusStore.ts`
17. `frontend/stores/mockStudentQuotaStore.ts`
18. `frontend/stores/mockStudentHistoryStore.ts`
19. `frontend/stores/mockScheduleAlertsStore.ts`
20. `frontend/stores/mockRescheduleTrackingStore.ts`
21. `frontend/stores/mockRescheduleStore.ts`
22. `frontend/stores/mockParentsStore.ts`
23. `frontend/stores/mockParentDashboardStore.ts`
24. `frontend/stores/mockClassDetailsStore.ts`
25. `frontend/stores/mockClassAuditStore.ts`
26. `frontend/stores/mocKAdminManualInvoiceStore.ts`
27. `frontend/stores/moackParentBillingStore.ts`

Also clean up:
- `frontend/views/dashboard/config/mockNavigationConfig.ts` — **NOT a mock store** (it's navigation config for Storybook sidebar), keep or rename
- `frontend/views/auth/login/actions/mockLogin.ts` — **NOT a mock store** (it's a mock server action), keep

---

## Phase 5: Verification

1. `bun tsgo` — no TypeScript errors
2. `bun run lint` — no lint errors  
3. `rg "from.*stores/mock" frontend/` — empty output (no remaining imports from mock stores)
4. `rg "export type|export interface" frontend/views/dashboard/**/*.stories.tsx` — empty (no type re-exports from stories)
5. `bun quality-gate` — passes

---

## Execution Order

1. **Phase 0 tasks** (A–K) first — create types files, update production imports
2. **Phase 1** (Task L) — create real stores, update container imports
3. **Phase 2** — inline mock data into each story file (can be parallelized per domain)
4. **Phase 3** (Tasks M–O) — update Storybook config
5. **Phase 4** — delete mock store files
6. **Phase 5** — verify everything compiles and passes

Each phase must pass `bun tsgo` before proceeding.
