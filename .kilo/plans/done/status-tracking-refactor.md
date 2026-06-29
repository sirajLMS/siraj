# Status Tracking Page Refactor Plan

## Scope

All files in:
- `app/[locale]/(dashboard)/schedule/tracking/status/page.tsx`
- `frontend/views/dashboard/classes/status/tracking/*`

---

## Component Audit

### 1. `page.tsx` (app layer)
**Issues:** None — just renders `<StatusTrackingContainer />`. Clean.

### 2. `types.ts`
**Issues:**
- `SessionStatus` type is defined as a local union type (`"regular" | "suspended_pending" | "on_leave" | "pending_verification"`) instead of an enum.
- `computeSessionStatus` accepts `studentStatus: string | null` — should use the `StudentStatus` enum.
- `formatScheduleRange` is a utility function living in a types file (acceptable for co-located domain helpers).
- `StatusTrackingRow` is a re-export alias of `StatusTrackingScheduleRow` from generated types — **prohibited re-export** per rules.

**Fixes:**
- Convert `SessionStatus` to an enum in `shared/lib/enum.ts` (DB-layer enum).
- Update `computeSessionStatus` to use `StudentStatus` enum for the `studentStatus` param.
- Remove the `StatusTrackingRow` re-export alias; import `StatusTrackingScheduleRow` directly in consumers.
- Create `backend/types/status-tracking.types.ts` for the computed `SessionStatus` enum type and `SessionStatusReturnType`.

### 3. `StatusTrackingContainer.tsx`
**Issues:**
- No `useNotifications` — actions complete silently with no user feedback.
- No loading/error state handling (no spinner, no error UI).
- `handleActivate` just does `router.push(/classes/${id})` — could be more intentional (navigate to class details to activate).
- `handleReschedule` hardcodes `teacherTimezone: "Africa/Cairo"`.
- No `RequirePermission` wrapper.
- Missing `onReschedule` in mobile card list (the `_onReschedule` prop is destructured but unused in `StatusTrackingCardList`).

**Fixes:**
- Add `useNotifications` for success/error feedback on all actions.
- Add loading spinner and error UI (following `RescheduleTrackingContainer` pattern).
- Fix `handleReschedule` to use actual timezone from row data or a sensible default.
- Add `RequirePermission` wrapper with `AppPermission.ScheduleViewAll | AppPermission.DashboardViewMetrics`.
- Pass `onReschedule` through to `StatusTrackingCardList` for on_leave cards.

### 4. `StatusTrackingView.tsx`
**Issues:**
- `StatusTrackingLabels` interface defined in-file — must move to `.types.ts` file.
- `CardListLabels` type defined in-file.
- `MobileLayoutProps` and `DesktopLayoutProps` interfaces defined in-file.

**Fixes:**
- Move `StatusTrackingLabels`, `CardListLabels`, `MobileLayoutProps`, `DesktopLayoutProps` to `backend/types/status-tracking.types.ts`.
- Update imports.

### 5. `StatusTrackingDataGrid.tsx`
**Issues:**
- `StatusTrackingDataGridLabels` interface defined in-file.
- `StatusTrackingDataGridProps` interface defined in-file.
- `STATUS_LABEL_KEYS` uses string keys that should map to the `SessionStatus` enum.

**Fixes:**
- Move label/prop interfaces to `backend/types/status-tracking.types.ts`.
- Use `SessionStatus` enum values in `STATUS_LABEL_KEYS`.

### 6. `StatusTrackingCardList.tsx`
**Issues:**
- `StatusTrackingCardListProps` interface defined in-file.
- `getCardActionButton` for `"regular"` status has `/* join session */` — **non-functional action**.
- `onReschedule` prop destructured as `_onReschedule` and **never used**.
- `StyledSeeAllButton` has no `onClick` handler — **non-functional action**.
- `StyledCardActionButtonBase` has no `onClick` for join session — **non-functional action**.

**Fixes:**
- Move interfaces to `.types.ts` file.
- Wire `"regular"` join session button to navigate to `/classes/{id}` (class details page).
- Use `onReschedule` for on_leave cards' reschedule action.
- Wire "See All" button to a meaningful action (navigate to full schedule page or expand list).
- Pass `onReschedule` from the container through the view to the card list.

### 7. `StatusBadgeAction.tsx`
**Issues:**
- `StatusActionProps` interface defined in-file.
- `ActionButtonWrapperProps` interface defined in-file.
- Uses `useRouter` directly (imported from `@/shared/i18n/routing`) for the "regular" status join action — this is fine, but the container should own navigation logic.
- Uses `useRouter` imported directly; the container already handles actions. Inconsistent approach.

**Fixes:**
- Move interfaces to `.types.ts` file.
- Remove direct `useRouter` usage from `StatusBadgeAction`; instead, add an `onJoin` callback prop so the container controls all navigation.
- Update the container to pass an `onJoin` handler.

### 8. `SuspensionAnalytics.tsx`
**Issues:**
- `SuspensionAnalyticsLabels` interface exported from this component file — must move to `.types.ts`.
- `SuspensionAnalyticsProps` interface defined in-file.
- `OpenAuditLogs` button has no `onClick` — **non-functional action**.

**Fixes:**
- Move interfaces to `.types.ts` file.
- Add `onOpenAuditLogs` callback prop; wire in container to navigate to audit logs page.

### 9. `SuspensionAnalyticsChart.tsx`
**Issues:**
- Uses `BAR_HEIGHTS` static hardcoded data — no real data source.
- This is a presentation-only chart; acceptable for now unless there's a suspension analytics API.

**Fixes:**
- Low priority — chart is decorative. Document as known placeholder. No backend suspension analytics API exists yet.

### 10. `useStatusTrackingMetrics.ts`
**Issues:**
- `MetricCounts` and `RawMetric` interfaces defined in-file.
- No notification of issues.

**Fixes:**
- Move `MetricCounts` and `RawMetric` to `.types.ts` file (if they're needed outside).

### 11. `useStatusTrackingLabels.ts`
**Issues:** None — pure translation hook, clean.

### 12. `StatusTrackingContainer.stories.tsx`
**Issues:**
- `handleNewReport` is `() => { /* Navigate or open modal in future */ }` — **non-functional**.

**Fixes:**
- Wire `handleNewReport` to call `router.push("/classes/new")` matching the real container.

---

## Implementation Plan

### Phase 1: Enums & Types Migration

1. **Add `SessionStatus` enum to `shared/lib/enum.ts`**:
   ```ts
   export enum SessionStatus {
     REGULAR = "regular",
     SUSPENDED_PENDING = "suspended_pending",
     ON_LEAVE = "on_leave",
     PENDING_VERIFICATION = "pending_verification",
   }
   ```

2. **Create `backend/types/status-tracking.types.ts`** containing:
   - All label interfaces (`StatusTrackingLabels`, `StatusTrackingDataGridLabels`, `CardListLabels`, `SuspensionAnalyticsLabels`)
   - All prop interfaces (`StatusTrackingViewProps`, `StatusTrackingDataGridProps`, `StatusTrackingCardListProps`, `SuspensionAnalyticsProps`, `StatusActionProps`, `ActionButtonWrapperProps`, `MobileLayoutProps`, `DesktopLayoutProps`)
   - `MetricCounts`, `RawMetric` interfaces from `useStatusTrackingMetrics.ts`
   - Import `SessionStatus` enum from `shared/lib/enum` and `StudentStatus` from generated types.

3. **Update `types.ts` in tracking/**:
   - Remove `SessionStatus` type alias; import from `shared/lib/enum`.
   - Remove `StatusTrackingRow` re-export; consumers import `StatusTrackingScheduleRow` directly.
   - Update `computeSessionStatus` to use `StudentStatus` enum for `studentStatus` param.

4. **Add `SessionStatus` to Pothos enum registry** (`backend/graphql/pothos/enum.pothos.ts`), regenerate schema & codegen.

### Phase 2: Container Refactor — Real Actions & Notifications

5. **Update `StatusTrackingContainer.tsx`**:
   - Add `useNotifications` from `@toolpad/core/useNotifications`.
   - Add loading state (CircularProgress) and error state UI.
   - Add `RequirePermission` wrapper with `AppPermission.ScheduleViewAll`.
   - Fix `handleReschedule` timezone: use row's teacher timezone or Intl API default.
   - Add `handleJoin` (navigates to `/classes/{id}`).
   - Add `handleOpenAuditLogs` (navigates to appropriate audit page).
   - Wire `handleNewReport` properly (already navigates to `/classes/new`).
   - Add notification calls on action success/failure.
   - Refetch `statusTrackingSchedule` query after mutations if any are added.

6. **Update `StatusBadgeAction.tsx`**:
   - Remove direct `useRouter` import and usage.
   - Add `onJoin: (id: string) => void` prop.
   - Replace `router.push` in "regular" status with `onJoin(rowId)`.

7. **Update `StatusTrackingCardList.tsx`**:
   - Wire "Join Session" button (regular status) with a real `onJoin` callback.
   - Wire `onReschedule` for on_leave cards.
   - Wire "See All" button with navigation callback (`onSeeAll`).
   - Remove `_onReschedule` dead-code pattern.

8. **Update `SuspensionAnalytics.tsx`**:
   - Add `onOpenAuditLogs` callback prop.
   - Wire the "Open Audit Logs" button `onClick` to this callback.

9. **Update `StatusTrackingView.tsx`**:
   - Pass `onJoin` and `onOpenAuditLogs` through to child components.
   - Import types from `backend/types/status-tracking.types.ts`.

### Phase 3: Storybook Update

10. **Update `StatusTrackingContainer.stories.tsx`**:
    - Wire `handleNewReport` to actually navigate.
    - Add missing `onJoin` handler for regular-status stories.

### Phase 4: Validation

11. Run type checks: `bun tsgo`
12. Run linting: `bun biome:check` then lint queue for `bun lint`
13. Run existing tests: `bun test frontend/graphql/test/status-tracking.test.ts`
14. Verify no hardcoded colors, no console.*, MUI v9 prop patterns.

---

## Files Changed (In-Scope Only)

| File | Changes |
|------|---------|
| `shared/lib/enum.ts` | Add `SessionStatus` enum |
| `backend/types/status-tracking.types.ts` | **New file** — all shared label/prop interfaces |
| `backend/types/index.ts` | Re-export from status-tracking.types.ts |
| `backend/graphql/pothos/enum.pothos.ts` | Register `SessionStatus` Pothos enum |
| `frontend/views/dashboard/classes/status/tracking/types.ts` | Remove `SessionStatus` union type, remove `StatusTrackingRow` re-export, update `computeSessionStatus` signature |
| `frontend/views/dashboard/classes/status/tracking/StatusTrackingContainer.tsx` | Add `useNotifications`, loading/error UI, `RequirePermission`, fix actions |
| `frontend/views/dashboard/classes/status/tracking/StatusTrackingView.tsx` | Move interfaces out, add `onJoin`/`onOpenAuditLogs` props, pass through |
| `frontend/views/dashboard/classes/status/tracking/StatusTrackingDataGrid.tsx` | Move interfaces out, use `SessionStatus` enum |
| `frontend/views/dashboard/classes/status/tracking/StatusTrackingCardList.tsx` | Move interfaces out, wire join/reschedule/seeAll actions |
| `frontend/views/dashboard/classes/status/tracking/StatusBadgeAction.tsx` | Move interfaces out, add `onJoin` prop, remove direct `useRouter` |
| `frontend/views/dashboard/classes/status/tracking/SuspensionAnalytics.tsx` | Move interfaces out, add `onOpenAuditLogs` prop |
| `frontend/views/dashboard/classes/status/tracking/SuspensionAnalyticsChart.tsx` | No changes (decorative chart) |
| `frontend/views/dashboard/classes/status/tracking/useStatusTrackingMetrics.ts` | Move interfaces out |
| `frontend/views/dashboard/classes/status/tracking/useStatusTrackingLabels.ts` | No changes |
| `frontend/views/dashboard/classes/status/tracking/StatusTrackingContainer.stories.tsx` | Wire `handleNewReport`, add `onJoin` |

**Out-of-scope files that need changes**: `shared/lib/enum.ts`, `backend/types/status-tracking.types.ts` (new), `backend/types/index.ts`, `backend/graphql/pothos/enum.pothos.ts` — these are foundational type changes required by the tracking module's type migration.

---

## Risk & Notes

- **SessionStatus enum in GraphQL**: Adding a new Pothos enum requires `generate:gqlSchema` + `codegen`. The `StatusTrackingScheduleRow.studentStatus` field is currently `String`; changing it to use the `SessionStatus` enum in the Pothos schema would be a breaking API change. **Decision:** Keep `studentStatus` as `String` in the Pothos schema for now (it comes from the `StudentStatus` enum on the student, not `SessionStatus`). The `SessionStatus` enum is purely a frontend computed type — it doesn't need to be a GraphQL enum. We WILL add it to `shared/lib/enum.ts` for type safety but will NOT expose it through Pothos.
- **SuspensionAnalyticsChart**: The hardcoded `BAR_HEIGHTS` data has no backend counterpart. This is documented as a known placeholder. Creating a backend analytics API is out of scope.
- **Route for audit logs**: No global `/audit` route exists. The `onOpenAuditLogs` handler will show a `useNotifications` info message indicating this feature is coming soon. The per-class audit page exists at `/classes/[id]/audit` but that's instance-specific, not a global dashboard.
