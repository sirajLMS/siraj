# Fix Review Findings: DST Migration + Availability Search

## Overview

Fix all 8 findings from the code review across security, performance, business logic, deploy safety, duplication, and dead-code tracks.

---

## Phase 1: CRITICAL — DST Migration Idempotency & Validation (3 fixes)

### 1.1 Add idempotency guard to DST migration service

**File:** `backend/services/system/dst-migration.service.ts`

**Problem:** `executeBulkDstUpdate` can be re-run, double-applying the offset to both `utcOffsetSnapshot` and `defaultStartTime` with no guard.

**Fix:**
- Before processing, query `dstMigrationRuns` for a recent run (same `offsetMinutes`, created within the last 7 days). If found, throw a localized error: "A DST migration with offset {X} minutes was already executed on {date}".
- Add a `getRecentMigrationRun(offsetMinutes, tx)` method to `dst-migration.repository.ts` that queries `dstMigrationRuns` where `offsetMinutes = ? AND createdAt > NOW() - interval '7 days'`, returning the most recent run or null.
- In the service, if a recent run exists, throw a translated error using `getBackendTranslations`.
- This 7-day window allows legitimate re-runs after the window passes while preventing accidental double-application during a DST transition period.

**Edge case:** An admin truly needing to re-apply should use a different `offsetMinutes` or wait 7 days. Alternatively, add a `force: boolean` parameter, but that's out of scope for now.

### 1.2 Validate offsetMinutes server-side

**File:** `backend/services/system/dst-migration.service.ts`

**Problem:** `offsetMinutes` accepts any integer (e.g., ±1440), corrupting all schedule data.

**Fix:**
- Add early validation at the start of `executeBulkDstUpdate`:
  ```ts
  const VALID_DST_OFFSETS = [-120, -90, -60, -45, -30, 30, 45, 60, 90, 120];
  if (!VALID_DST_OFFSETS.includes(offsetMinutes)) {
    const tFunc = await getBackendTranslations({ locale, namespace: "errors" });
    throw new Error(tFunc("invalidDstOffset", { offset: offsetMinutes }));
  }
  ```
- Also reject `0` explicitly (no-op migration).
- Add the translation key `invalidDstOffset` to the i18n namespace.

### 1.3 Fix `detectDstOffsetMinutes()` for fall-back DST

**File:** `frontend/views/dashboard/tools/dst-migration/DstMigrationContainer.tsx`

**Problem:**
- `Math.abs(dstShiftMinutes)` makes the result always positive — cannot handle "fall back" (negative offset)
- When DST is not active (`dstShiftMinutes === 0`), hardcodes `60` — wrong for 30-min and 120-min DST regions

**Fix:**
- Remove `Math.abs()`. The expression `standardOffset - currentOffset` is already correctly signed: positive for spring-forward, negative for fall-back.
- When `dstShiftMinutes === 0`, the user is outside a DST transition period. Instead of hardcoding `60`, throw a warning notification and prevent the migration (the button should remain disabled or the function should return `null`).
- Update `handleUpdate` to handle `null` from `detectDstOffsetMinutes()`.
- Update the `UpdateSchedulesButton` and `UpdateSchedulesButtonMobile` components to check if DST offset is detectable before allowing the click.

---

## Phase 2: WARNING — Query Batching (2 fixes)

### 2.1 Batch DST migration queries

**File:** `backend/services/system/dst-migration.service.ts`

**Current:** ~400-600 queries in 1 transaction for 200 schedules.
**Target:** ~3 queries total.

**Fix — Conflict check → in-memory map:**
- The data is already loaded in `schedules` from `getActiveRecurringSchedules`.
- Build a `Map<string, string>` keyed by `${teacherId}:${defaultStartTime}` → `scheduleId` from the loaded schedules.
- For each schedule, compute its `newStartTime`, then check the map: if the map already has an entry at `${schedule.teacherId}:${newStartTime}` that isn't the current schedule, that's a conflict.
- Remove the `checkConflictingSchedules` repository method entirely (no more N+1).

**Fix — Bulk INSERT migration entries:**
- Collect all `migrationEntry` objects into an array during the loop.
- After the loop, do a single `DstMigrationRepository.recordMigrationEntries(entries, tx)` (plural) that uses Drizzle's multi-row `.values(array)` INSERT.

**Fix — Batch UPDATE schedules:**
- Collect all `(scheduleId, newStartTime, newOffset)` tuples into an array.
- Add `updateRecurringScheduleTimesBatch(updates, tx)` to the repository that uses raw SQL: `UPDATE recurring_schedules SET defaultStartTime = v.start, utc_offset_snapshot = v.offset, updated_at = NOW() FROM (VALUES ...) AS v(id, start, offset) WHERE id = v.id::uuid`.
- Or use a simpler approach: iterate the collected updates with individual UPDATEs but outside the main processing loop (still N queries but grouped at the end). This is acceptable since UPDATEs must be per-row when each has different values.

**Transaction strategy:** Keep the single transaction but with ~3 fixed queries instead of ~500, so the transaction duration drops from seconds to milliseconds.

### 2.2 Batch teacher availability queries

**File:** `backend/db/repo/teacher-availability.repository.ts`

**Current:** ~101 queries for 50 teachers (2 per teacher + 1 initial).
**Target:** 3 queries total.

**Fix:**
- After fetching `allTeachers`, collect `teacherIds = allTeachers.map(t => t.teacherId)`.
- Batch-load windows:
  ```ts
  const allWindows = await t
    .select()
    .from(teacherAvailabilityWindows)
    .where(inArray(teacherAvailabilityWindows.teacherId, teacherIds));
  ```
- Batch-load unavailabilities:
  ```ts
  const allUnavailabilities = await t
    .select()
    .from(teacherRecurringUnavailability)
    .where(inArray(teacherRecurringUnavailability.teacherId, teacherIds));
  ```
- Add `inArray` to the Drizzle import (it's already used elsewhere in the project).
- Group in-memory using `Map.groupBy` or a manual loop:
  ```ts
  const windowsByTeacher = new Map<string, TeacherAvailabilityWindowSelectType[]>();
  for (const w of allWindows) {
    const list = windowsByTeacher.get(w.teacherId) ?? [];
    list.push(w);
    windowsByTeacher.set(w.teacherId, list);
  }
  ```
- Use the same pattern for unavailabilities.
- In the teacher loop, look up `windowsByTeacher.get(teacher.teacherId) ?? []` instead of issuing a query.

---

## Phase 3: WARNING — Grid Data Loss (1 fix)

### 3.1 Fix grid cell overwrite for multiple teachers

**Files:**
- `frontend/views/dashboard/teachers/availability/types.ts` — change `WeeklyAvailability` value type
- `frontend/views/dashboard/teachers/availability/TeacherAvailabilityContainer.tsx` — update `transformToWeeklyAvailability`
- `frontend/views/dashboard/teachers/availability/components/WeeklyAvailabilityGrid.tsx` — render multiple entries per cell

**Fix — types.ts:**
- Change `WeeklyAvailability` cell type from `AvailabilityEntry | null` to `AvailabilityEntry[]`:
  ```ts
  export interface WeeklyAvailability {
    readonly [time: string]: {
      readonly [K in DayOfWeek]?: AvailabilityEntry[];
    };
  }
  ```

**Fix — TeacherAvailabilityContainer.tsx:**
- In `transformToWeeklyAvailability`, change:
  ```ts
  // Before
  timeSlot[gap.dayOfWeek] = entry;
  // After
  if (!timeSlot[gap.dayOfWeek]) {
    timeSlot[gap.dayOfWeek] = [];
  }
  timeSlot[gap.dayOfWeek]!.push(entry);
  ```

**Fix — WeeklyAvailabilityGrid.tsx:**
- In `GridRow`, change rendering from:
  ```tsx
  {entry && <AvailabilityBlock entry={entry} onClick={...} />}
  ```
  to:
  ```tsx
  {dayEntries?.[day]?.map(entry => (
    <AvailabilityBlock key={entry.id} entry={entry} onClick={onBlockClick ? () => onBlockClick(entry) : undefined} />
  ))}
  ```
- Update `GridRow` prop type for `dayEntries` to match the new array type.

---

## Phase 4: SUGGESTION — Type Drift & Dead Code (2 fixes)

### 4.1 Replace inline GraphQL response types with generated types

**File:** `frontend/views/dashboard/teachers/availability/TeacherAvailabilityContainer.tsx`

**Current:** `transformToWeeklyAvailability` and `computeInsights` each define inline object shapes for the GraphQL response (~20 lines each).

**Fix:**
- Import the generated type:
  ```ts
  import type { SearchTeacherAvailabilityQuery } from "@/frontend/graphql/generated/gql/graphql";
  ```
- Define a type alias:
  ```ts
  type AvailabilitySearchData = NonNullable<SearchTeacherAvailabilityQuery["searchTeacherAvailability"]>;
  ```
- Replace both function signatures to accept `AvailabilitySearchData` instead of inline types.
- This eliminates ~30 lines of inline type duplication and ensures compile-time errors if the schema changes.

### 4.2 Remove dead re-export in types.ts

**File:** `frontend/views/dashboard/teachers/availability/types.ts`

**Fix:** Remove line 3 (`export type { DayOfWeek, Gender }`). No consumer imports these from `./types` — they all import directly from the generated GraphQL types. Keep the `import type` on line 1 since `DayOfWeek` and `Gender` are used internally in the file's interface definitions.

---

## Execution Order

1. Phase 1 (CRITICAL): 1.2 → 1.1 → 1.3 (validate first, idempotency guard second, frontend fix last)
2. Phase 2 (WARNING/Performance): 2.1 → 2.2 (DST migration batching first since it's in a transaction)
3. Phase 3 (WARNING/Business Logic): 3.1
4. Phase 4 (SUGGESTION): 4.1 → 4.2

## Verification

After all changes:
- Run `bun run tsgo` for type checking
- Run `bun biome:check` for formatting
- Run `bun run lint` (via queue server if parallel)
- Run `bun run test:db` to check for database test regressions
- If `bun quality-gate` is available, run it as final verification
