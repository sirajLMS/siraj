# Local Review: Uncommitted Changes — Fix Plan

All 4 issues confirmed for fix by user.

## Fix 1: SessionStatus enum vs raw strings
**File:** `frontend/views/dashboard/classes/status/tracking/useStatusTrackingMetrics.ts`

Replace raw string comparisons with `SessionStatus` enum constants and add import:

1. Add `SessionStatus` to import from `./types`
2. Line 29: `"regular"` → `SessionStatus.REGULAR`
3. Line 30: `"pending_verification"` → `SessionStatus.PENDING_VERIFICATION`
4. Line 31: `"suspended_pending"` → `SessionStatus.SUSPENDED_PENDING`
5. Line 32: `"on_leave"` → `SessionStatus.ON_LEAVE`
6. Line 50 (suspendedCount filter): `"suspended_pending"` → `SessionStatus.SUSPENDED_PENDING`

## Fix 2: Restore GridColDef generic
**File:** `frontend/views/dashboard/students/status/components/UpcomingClassesTable.tsx`

1. Change `const columns: GridColDef[]` → `const columns: GridColDef<UpcomingClassDisplay>[]`
2. Import `UpcomingClassDisplay` from `../types`

## Fix 3: Pass expectedVersion for optimistic concurrency
**Chain of changes (schema → service → Pothos → query → container):**

### 3a. Repository: add version to query result
**File:** `backend/db/repo/parent.repository.ts`
- Add `version: number` to `AssociatedStudentRow` type
- Add `version` to `mapAssociatedStudentRow` mapping
- Add `students.version` to `getAssociatedStudentsBaseQuery` select

### 3b. Service: add version to result type
**File:** `backend/services/parent/parent-profile.service.ts`
- Add `readonly version: number` to `AssociatedStudentResult` interface

### 3c. GraphQL: expose version on AssociatedStudent type
**File:** `backend/graphql/pothos/parent-profile.pothos.ts`
- Add `version: t.exposeInt("version")` to `AssociatedStudentPothosObject`

### 3d. Frontend query: select version field
**File:** `frontend/graphql/sharedDocuments/student.documents.ts`
- Add `version` to `studentByIdQueryDocument` selection set

### 3e. Run codegen
```bash
bun run generate:gqlSchema && bun codegen
```

### 3f. Container: pass expectedVersion
**File:** `frontend/views/dashboard/students/status/StudentStatusContainer.tsx`
- Add `version` to `StudentStatusPageData` type in `./types.ts`
- In the `student` memo, capture `version` from `studentData?.studentById?.version ?? 0`
- In `handleUpdateStatus`, pass `expectedVersion: student.version` instead of `expectedVersion: null`

## Fix 4: Add LIMIT to getUpcomingClassesForStudent
**File:** `backend/db/repo/scheduling/scheduling-queries.repository.ts`
- Add `.limit(100)` before `.orderBy()` in the query chain
