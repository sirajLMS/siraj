### Task B — Repositories: Status Tracking, Bulk Freeze, Bulk Unfreeze, Student Future Classes

**Objective:** Add four new repository methods to `SchedulingRepository` to support Story 10's service layer:
1. `getStatusTrackingRows()` — returns class instances joined with student status for admin status tracking dashboard
2. `bulkFreezeStudentClasses()` — sets `isFrozen = true` on all future NOT_ACTIVATED/ACTIVATED classes for a student
3. `bulkUnfreezeStudentClasses()` — clears `isFrozen = false` on future frozen classes for a student (needed for SUSPENDED→REGULAR restoration)
4. `getStudentFutureClasses()` — returns future NOT_ACTIVATED/ACTIVATED class IDs for a student (used by `StudentLeaveProcessingService`)

**Dependencies:** Depends on Task A — `AppPermission.SYSTEM_ENFORCE_SUSPENDED_LOCK` and `AppPermission.SYSTEM_PROCESS_STUDENT_LEAVE` enum values must exist (for import in service layer, not in repo layer). The migration and enum must be applied before running tests.

**Layer-Specific Rules (Database Repositories — Flattened from backend/db/repo/AGENTS.md):**
- Use Drizzle standard syntax `t.select().from(table).innerJoin()` instead of relational `findMany` when multiple joins are needed, to avoid type compilation slowdowns.
- Wrap all repository mutations (UPDATE) in an atomic `db.transaction()`.
- All new methods use the `(args, tx?: DBTransaction) => Promise<T>` pattern — callers can pass a transaction context.
- The `getStatusTrackingRows()` method uses the existing `getDayBoundaries()` timezone utility (imported dynamically to match the existing pattern).
- Drizzle imports (`gte`, `lt`, `and`, `eq`, `isNull`, `inArray`) are already present in `scheduling.repository.ts:1` — no new imports required.
- `students`, `teachers`, `users`, `classInstances` table references are already imported — no new schema imports needed.

**Target File:**
- `backend/db/repo/scheduling.repository.ts` (Modify — add four new exported functions and the `StatusTrackingRow` type export)

Also add all four new methods and the `StatusTrackingRow` type to the `SchedulingRepository` namespace re-export if one exists in the file. If the file uses named exports (no namespace), simply add the exports at the appropriate position.

---

**Detailed Implementation Steps:**

### Step 1: Add `StatusTrackingRow` Type and `getStatusTrackingRows()`

Add after the existing `RescheduleTrackingRow` type (or at the end of the types section), and add the function after the existing `getRescheduleTrackingRows()` function:

```typescript
// ─── Status Tracking Row ───────────────────────────────────────────────────────

export type StatusTrackingRow = {
  id: string;
  studentId: string;
  studentName: string;
  studentInitials: string;
  studentStatus: string;
  teacherId: string;
  teacherName: string;
  scheduledStartAt: Date;
  scheduledEndAt: Date;
  durationMinutes: number;
  executionState: string;
  outcome: string;
  isFrozen: boolean;
};

export const getStatusTrackingRows = async (
  date: Date,
  options?: { search?: string; viewerTimezone?: string },
  tx?: DBTransaction
): Promise<StatusTrackingRow[]> => {
  const runner = async (t: DBTransaction): Promise<StatusTrackingRow[]> => {
    const { getDayBoundaries } = await import("@/backend/lib/timezone");
    const viewerTimezone = options?.viewerTimezone ?? "UTC";
    const { startOfDayUtc, endOfDayUtc } = getDayBoundaries(date, viewerTimezone);
    const search = options?.search;

    const rows = await t
      .select({
        id: classInstances.id,
        studentId: students.id,
        studentName: students.name,
        studentStatus: students.status,
        teacherId: classInstances.teacherId,
        scheduledStartAt: classInstances.scheduledStartAt,
        scheduledEndAt: classInstances.scheduledEndAt,
        durationMinutes: classInstances.durationMinutes,
        executionState: classInstances.executionState,
        outcome: classInstances.outcome,
        isFrozen: classInstances.isFrozen,
        teacherUserName: users.name,
      })
      .from(classInstances)
      .innerJoin(students, eq(classInstances.studentId, students.id))
      .innerJoin(teachers, eq(classInstances.teacherId, teachers.id))
      .innerJoin(users, eq(teachers.userId, users.id))
      .where(
        and(
          isNull(classInstances.deletedAt),
          gte(classInstances.scheduledStartAt, startOfDayUtc),
          lt(classInstances.scheduledStartAt, endOfDayUtc)
        )
      )
      .orderBy(classInstances.scheduledStartAt);

    let results = rows.map(r => ({
      id: r.id,
      studentId: r.studentId,
      studentName: r.studentName,
      studentInitials: r.studentName
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((w: string) => w[0]?.toUpperCase() ?? "")
        .join(""),
      studentStatus: r.studentStatus,
      teacherId: r.teacherId,
      teacherName: r.teacherUserName,
      scheduledStartAt: r.scheduledStartAt,
      scheduledEndAt: r.scheduledEndAt,
      durationMinutes: r.durationMinutes,
      executionState: r.executionState,
      outcome: r.outcome,
      isFrozen: r.isFrozen,
    }));

    if (search) {
      const lower = search.toLowerCase();
      results = results.filter(
        r =>
          r.studentName.toLowerCase().includes(lower) ||
          r.teacherName.toLowerCase().includes(lower)
      );
    }

    return results;
  };

  return tx ? runner(tx) : db.transaction((t: DBTransaction) => runner(t));
};
```

**Key implementation notes for `getStatusTrackingRows()`:**
- Uses `innerJoin(students)`, `innerJoin(teachers)`, `innerJoin(users)` — same join pattern as `getDailySchedule()` in `scheduling-queries.repository.ts:78`
- The `getDayBoundaries()` import is dynamic (`await import(...)`) to match the existing pattern in the file
- `studentInitials` is computed in TypeScript (not SQL) — splits `studentName` by spaces, takes first 2 parts, uppercases first char of each
- Search filtering is done in TypeScript after query (not in SQL) — consistent with existing search patterns
- Does NOT filter by `executionState` — returns ALL class instances for the given day, regardless of state (admin needs full picture)
- Does NOT filter by student status — returns ALL students' classes (admin sees suspended, on-leave, and regular students)
- `isFrozen` is directly selected from `classInstances.isFrozen` — no computation needed

### Step 2: Add `bulkFreezeStudentClasses()`

Add after `getStatusTrackingRows()`:

```typescript
export const bulkFreezeStudentClasses = async (
  studentId: string,
  fromDate: Date,
  tx?: DBTransaction
): Promise<number> => {
  const runner = async (t: DBTransaction): Promise<number> => {
    const result = await t
      .update(classInstances)
      .set({ isFrozen: true, updatedAt: new Date() })
      .where(
        and(
          eq(classInstances.studentId, studentId),
          isNull(classInstances.deletedAt),
          gte(classInstances.scheduledStartAt, fromDate),
          inArray(classInstances.executionState, ["NOT_ACTIVATED", "ACTIVATED"])
        )
      )
      .returning({ id: classInstances.id });
    return result.length;
  };
  return tx ? runner(tx) : db.transaction((t: DBTransaction) => runner(t));
};
```

**Key implementation notes for `bulkFreezeStudentClasses()`:**
- Filters by `executionState IN ["NOT_ACTIVATED", "ACTIVATED"]` — does NOT freeze RUNNING or COMPLETED classes
- Filters by `scheduledStartAt >= fromDate` — only future classes from the freeze timestamp onwards
- Filters by `isNull(classInstances.deletedAt)` — respects soft deletes
- Returns `result.length` (count of frozen rows) — NOT the IDs array
- For a non-existent `studentId`, the WHERE clause matches 0 rows, so `result.length = 0` (not an error)
- `updatedAt: new Date()` is set to track when the freeze was applied
- Uses `db.transaction()` wrapper for atomicity on the UPDATE

### Step 3: Add `bulkUnfreezeStudentClasses()`

Add after `bulkFreezeStudentClasses()`:

```typescript
export const bulkUnfreezeStudentClasses = async (
  studentId: string,
  fromDate: Date,
  tx?: DBTransaction
): Promise<number> => {
  const runner = async (t: DBTransaction): Promise<number> => {
    const result = await t
      .update(classInstances)
      .set({ isFrozen: false, updatedAt: new Date() })
      .where(
        and(
          eq(classInstances.studentId, studentId),
          isNull(classInstances.deletedAt),
          gte(classInstances.scheduledStartAt, fromDate),
          eq(classInstances.isFrozen, true)
        )
      )
      .returning({ id: classInstances.id });
    return result.length;
  };
  return tx ? runner(tx) : db.transaction((t: DBTransaction) => runner(t));
};
```

**Key implementation notes for `bulkUnfreezeStudentClasses()`:**
- Filters by `eq(classInstances.isFrozen, true)` — only unfreezes currently-frozen classes (idempotent)
- Does NOT filter by `executionState` — unfreezes any frozen class regardless of state
- Filters by `scheduledStartAt >= fromDate` — only future classes from the unfreeze timestamp onwards
- Returns count of unfrozen rows — 0 if none are frozen (no error)
- For a non-existent `studentId`, returns 0 (no error)

### Step 4: Add `getStudentFutureClasses()`

Add after `bulkUnfreezeStudentClasses()`:

```typescript
export const getStudentFutureClasses = async (
  studentId: string,
  fromDate: Date,
  tx?: DBTransaction
): Promise<{ id: string; executionState: string; scheduledStartAt: Date }[]> => {
  const queryDb = tx ?? db;
  const rows = await queryDb
    .select({
      id: classInstances.id,
      executionState: classInstances.executionState,
      scheduledStartAt: classInstances.scheduledStartAt,
    })
    .from(classInstances)
    .where(
      and(
        eq(classInstances.studentId, studentId),
        isNull(classInstances.deletedAt),
        gte(classInstances.scheduledStartAt, fromDate),
        inArray(classInstances.executionState, ["NOT_ACTIVATED", "ACTIVATED"])
      )
    )
    .orderBy(classInstances.scheduledStartAt);
  return rows;
};
```

**Key implementation notes for `getStudentFutureClasses()`:**
- Returns a minimal shape `{ id, executionState, scheduledStartAt }` — only what `StudentLeaveProcessingService` needs
- Filters by `executionState IN ["NOT_ACTIVATED", "ACTIVATED"]` — returns only processable future classes
- Does NOT wrap in `db.transaction()` — this is a read-only query; the caller (`StudentLeaveProcessingService`) processes results one by one
- Uses `tx ?? db` pattern (not the `runner` pattern) — simpler for read-only queries

### Step 5: Update `SchedulingRepository` Namespace Exports

If `scheduling.repository.ts` uses a barrel namespace export (e.g., `export const SchedulingRepository = { ... }`), add all four new methods and the `StatusTrackingRow` type to it:

```typescript
export const SchedulingRepository = {
  // ... existing exports ...
  getStatusTrackingRows,
  bulkFreezeStudentClasses,
  bulkUnfreezeStudentClasses,
  getStudentFutureClasses,
};

export type { StatusTrackingRow };
```

If the file uses named module exports (no namespace object), the `export` keyword on each function declaration is sufficient.

### Step 6: Verify Imports Are Correct

After adding the four methods, verify that all referenced symbols are already imported:

```bash
# Verify these are already imported at the top of scheduling.repository.ts
grep -n "gte\|lt\|and\|eq\|isNull\|inArray" backend/db/repo/scheduling.repository.ts | head -5
grep -n "classInstances\|students\|teachers\|users" backend/db/repo/scheduling.repository.ts | head -5
grep -n "DBTransaction\|db" backend/db/repo/scheduling.repository.ts | head -5
```

If any symbol is missing, add the import — but from the verified context, all required imports are already present at line 1.

### Step 7: TypeScript Compilation Check

After adding all four methods, run:

```bash
bun tsgo
```

Expected: 0 TypeScript errors. Pay attention to:
- `studentInitials` computation — the `map((w: string) => ...)` needs the explicit `: string` type annotation to avoid implicit `any`
- `getDayBoundaries` dynamic import return type — should be inferred correctly
- `result.length` return type — Drizzle's `.returning()` returns an array, so `.length` is `number`

---

**Test Execution Requirements:**

Run the database test suite after completing all four method implementations:

```bash
bun run test:db
```

**Expected output:** 0 failures. All existing tests still pass. New method tests will be added in Task C.

Also verify TypeScript compilation:
```bash
bun tsgo
bun biome:check
bun lint
```

---

**Success Criteria / Check Progress Points:**

- [ ] `StatusTrackingRow` type is exported from `scheduling.repository.ts`
- [ ] `getStatusTrackingRows()` is implemented with correct joins (students, teachers, users via classInstances)
- [ ] `getStatusTrackingRows()` computes `studentInitials` from `studentName` split by spaces
- [ ] `getStatusTrackingRows()` supports optional `search` filter (post-query, in TypeScript)
- [ ] `getStatusTrackingRows()` uses `getDayBoundaries()` for timezone-aware day filtering
- [ ] `bulkFreezeStudentClasses()` updates `isFrozen = true` on `NOT_ACTIVATED` and `ACTIVATED` classes only
- [ ] `bulkFreezeStudentClasses()` filters by `scheduledStartAt >= fromDate` (future only)
- [ ] `bulkFreezeStudentClasses()` returns count of affected rows (0 for non-existent studentId)
- [ ] `bulkUnfreezeStudentClasses()` updates `isFrozen = false` on currently-frozen classes only
- [ ] `bulkUnfreezeStudentClasses()` returns count of affected rows (0 if none frozen)
- [ ] `getStudentFutureClasses()` returns minimal `{ id, executionState, scheduledStartAt }` shape
- [ ] `getStudentFutureClasses()` filters by `NOT_ACTIVATED` and `ACTIVATED` states only
- [ ] All four methods exported from `SchedulingRepository` namespace (or as named exports)
- [ ] No new Drizzle imports needed — all used operators already present
- [ ] `bun run test:db` passes with 0 failures (existing tests not broken)
- [ ] `bun tsgo` passes with 0 TypeScript errors

**Quality Gate — Per-File Validation:**
- [ ] `bun tsgo` on working files passes with 0 TypeScript errors & 0 warnings, after creating/modifying a single file
- [ ] `bun biome:check` on working files passes with 0 errors & 0 warnings, after creating/modifying a single file
- [ ] `bun lint` on working files passes with 0 errors & 0 warnings, after creating/modifying a single file
- [ ] `bun codescene` on working files passes with 0 errors & 0 warnings, after creating/modifying a single file
- [ ] `loop over tsgo, biome:check, lint, codescene` on working files till no issues at all, after creating/modifying a single file

**Quality Gate — Task Completion Validation:**
- [ ] `bun tsgo` on working files passes with 0 TypeScript errors & 0 warnings, after completing all steps
- [ ] `bun biome:check` on working files passes with 0 errors & 0 warnings, after completing all steps
- [ ] `bun lint` on working files passes with 0 errors & 0 warnings, after completing all steps
- [ ] `bun codescene` on working files passes with 0 errors & 0 warnings, after completing all steps
- [ ] `loop over tsgo, biome:check, lint, codescene` on working files till no issues at all, after completing all steps
