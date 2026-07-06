## Section 7: Final Verification & Integrity Protocol

All items in this section must be verified **after all tasks A–H are complete**. No item may be skipped. The sprint is NOT done until every checkpoint below passes.

---

### 7.1 Test Suite Verification (Zero Failures)

Run the complete test suite in the specified order. Every command must exit with code 0.

```bash
# 7.1.1 Database layer — repo + logic tests
bun run test:db

# 7.1.2 GraphQL integration tests — statusTrackingSchedule query
bun run test:graphql

# 7.1.3 UI component tests
bun run test:ui:components

# 7.1.4 Full test suite (all layers combined)
bun run test
```

**Expected output:** 0 failures across all test layers. Any failure is BLOCKING — fix before proceeding.

---

### 7.2 TypeScript Compilation (Zero Errors)

```bash
bun tsgo
```

**Expected output:** 0 TypeScript errors, 0 warnings. Any error is BLOCKING.

---

### 7.3 Linting & Formatting (Zero Issues)

```bash
bun biome:check
bun lint
```

**Expected output:** 0 errors, 0 warnings from both tools. Any issue is BLOCKING.

---

### 7.4 Code Quality Gate

```bash
bun codescene
```

**Expected output:** 0 code health issues introduced by Story 10 changes. Any newly introduced issue is BLOCKING.

---

### 7.5 Mock Store Removal Verification

```bash
rg "useStatusTrackingStore" frontend/views/dashboard/classes/status/tracking/StatusTrackingContainer.tsx
```

**Expected output:** Empty (no matches). The container should only import `StatusSessionRow` as a type, not use the store hook. Any runtime store usage is BLOCKING.

---

### 7.6 Incomplete Implementation Verification

```bash
rg -i "TODO|FIXME|@todo" backend/services/student backend/services/schedule backend/graphql/pothos frontend/views/dashboard/classes/status/tracking frontend/graphql/sharedDocuments
```

**Expected output:** Empty (no matches in scope). Any match is BLOCKING.

---

### 7.7 No Drizzle/DB Imports in Services

```bash
rg "from ['\"]drizzle-orm|from ['\"]backend/db/schema|from ['\"]backend/db/index" backend/services/student backend/services/schedule
```

**Expected output:** Empty (no matches). Services must access database only through repository methods. Any match is BLOCKING.

---

### 7.8 No Repo Imports in GraphQL Resolvers

```bash
rg "from ['\"]backend/db" backend/graphql/pothos
```

**Expected output:** Empty (no matches in `pothos/` directory). GraphQL resolvers must call services, not repositories directly. Any match is BLOCKING.

---

### 7.9 Permission Enum Verification

```bash
grep -n "SYSTEM_ENFORCE_SUSPENDED_LOCK\|SYSTEM_PROCESS_STUDENT_LEAVE" shared/lib/enum.ts
```

**Expected output:** Both enum keys found with correct string values:
- `SYSTEM_ENFORCE_SUSPENDED_LOCK = "system.enforce_suspended_lock"`
- `SYSTEM_PROCESS_STUDENT_LEAVE = "system.process_student_leave"`

Missing key is BLOCKING.

---

### 7.10 Migration Integrity Verification

```bash
bun db cleanGenerate
bun db reset
bun db seed
bun test:db
```

**Expected output:** All 4 commands pass with 0 errors. Any failure is BLOCKING.

---

### 7.11 Generated Types Verification

```bash
grep -n "StatusTrackingScheduleQuery\|QueryStatusTrackingScheduleArgs" frontend/graphql/generated/gql/graphql-types.ts
```

**Expected output:** Both generated type names found. Missing value requires re-running `bun run generate:gqlSchema && bun codegen`.

---

### 7.12 GraphQL Query Verification

```bash
grep -n "statusTrackingSchedule" frontend/graphql/sharedDocuments/schedule.documents.ts
```

**Expected output:** Query document exported. Missing export is BLOCKING.

---

### 7.13 Repository Method Verification

```bash
grep -n "getStatusTrackingRows\|bulkFreezeStudentClasses\|bulkUnfreezeStudentClasses\|getStudentFutureClasses" backend/db/repo/scheduling.repository.ts
```

**Expected output:** All 4 repository methods found. Missing method is BLOCKING.

---

### 7.14 Service Implementation Verification

```bash
ls -la backend/services/student/suspended-lock.service.ts
ls -la backend/services/student/student-leave-processing.service.ts
ls -la backend/services/schedule/schedule-query.service.ts
```

**Expected output:** All 3 new service files exist. Missing file is BLOCKING.

---

### 7.15 Side-Effect Integration Verification

```bash
grep -n "SuspendedLockService\|StudentLeaveProcessingService" backend/services/student/student-lifecycle.service.ts
```

**Expected output:** Both services imported and called within `changeStudentStatus()` method. Missing import or call is BLOCKING.

---

### 7.16 Frozen Class Verification (Manual Test)

**Prerequisites:** Development environment running with Admin session.

**Test Scenario 1: Suspension Lock**
1. Navigate to Parent Profile → Students section
2. Click StatusBadge on a REGULAR student
3. Select "Suspended" → Confirm
4. Navigate to Status Tracking dashboard
5. Verify the student's future classes show:
   - `isFrozen: true` in GraphQL response
   - Status badge displays "Suspended" (suspended_pending)
   - Action buttons (Activate, Start, Join) are hidden/disabled
6. Check browser console for successful GraphQL query execution

**Test Scenario 2: Suspension Release**
1. Click StatusBadge on the SUSPENDED student (from Scenario 1)
2. Select "Regular" → Confirm
3. Navigate back to Status Tracking dashboard
4. Verify the student's classes show:
   - `isFrozen: false` in GraphQL response
   - Status badge displays "Regular" or appropriate status
   - Action buttons are visible again

**Test Scenario 3: Leave Processing**
1. Click StatusBadge on a REGULAR student with future scheduled classes
2. Select "On Leave" → Confirm
3. Check database or GraphQL response to verify:
   - Future NOT_ACTIVATED classes have `outcome: "LEAVE"`
   - Successor class instances were created for rescheduling
   - Original classes marked with `isRescheduled: true`
4. Navigate to Reschedule Tracking dashboard
5. Verify the rescheduled classes appear in the reschedule queue

**Expected output:** All 3 scenarios complete successfully. Any failure is BLOCKING.

---

### 7.17 GraphQL Query Permission Verification

**Test Scenario:**
1. Log in as Teacher (no `SCHEDULE_VIEW_ALL` or `DASHBOARD_VIEW_METRICS` permission)
2. Navigate to Status Tracking dashboard
3. Open browser DevTools → Network tab → Filter by "graphql"
4. Verify the `statusTrackingSchedule` query returns an error:
   - Response contains `"errors": [{ "message": "Unauthorized" ... }]`
   - OR component displays empty state (graceful error handling)

5. Log in as Admin (has `DASHBOARD_VIEW_METRICS` permission)
6. Navigate to Status Tracking dashboard
7. Verify the query succeeds and returns data

**Expected output:** Permission enforcement works correctly. Teacher cannot fetch data; Admin can. Any bypass is BLOCKING.

---

### 7.18 Coverage Report (Final)

```bash
bun run test:coverage backend/db/test/repo/scheduling.repository.test.ts
```

**Expected output:** 100% line + function coverage on all new repository methods:
- `getStatusTrackingRows`
- `bulkFreezeStudentClasses`
- `bulkUnfreezeStudentClasses`
- `getStudentFutureClasses`

Any method below 100% coverage is BLOCKING.

---

### 7.19 Functional Verification Checklist

**Status Tracking Dashboard (requires Admin session in development environment):**
- [ ] Navigate to Status Tracking dashboard → Page loads without errors
- [ ] Class sessions appear in the table with correct student/teacher names
- [ ] Time ranges are formatted correctly (e.g., "09:00 AM - 10:00 AM")
- [ ] Metric cards show accurate counts (Regular, Pending, Suspended, On Leave)
- [ ] "Total Sessions" metric shows total row count
- [ ] For a REGULAR student with `isFrozen: false`: badge shows "Regular"
- [ ] For a SUSPENDED student or `isFrozen: true`: badge shows "Suspended" with error styling
- [ ] For an ON_LEAVE student: badge shows "On Leave"
- [ ] For NOT_ACTIVATED class with regular student: badge shows "Pending Verification"
- [ ] Click "Reschedule" button on ON_LEAVE session → Navigates to reschedule page
- [ ] Frozen sessions (isFrozen: true) have action buttons hidden/disabled

**Suspension Lock Enforcement:**
- [ ] Change student to SUSPENDED → Future classes become frozen (isFrozen: true)
- [ ] Change student back to REGULAR → Frozen classes are unfrozen (isFrozen: false)
- [ ] Attempt to activate a frozen class (via API) → Operation blocked or fails gracefully

**Leave Processing:**
- [ ] Change student to ON_LEAVE → Future NOT_ACTIVATED classes marked as LEAVE outcome
- [ ] Successor class instances created for rescheduling
- [ ] Rescheduled classes appear in Reschedule Tracking dashboard
- [ ] Calling processStudentLeave twice does not create duplicate successors (idempotency)

**Permission Enforcement:**
- [ ] Teacher (no permission) cannot fetch statusTrackingSchedule data
- [ ] Admin (has permission) can fetch statusTrackingSchedule data
- [ ] Unauthorized actors cannot trigger side-effects via changeStudentStatus

**i18n (verify in both English and Arabic locales):**
- [ ] All status labels render correctly in English (Regular, Suspended, On Leave, Pending Verification)
- [ ] All status labels render correctly in Arabic with RTL layout
- [ ] Metric card labels render correctly in both locales
- [ ] Table headers render correctly in both locales

---

### 7.20 Sprint Closure Sign-Off

All of the following must be confirmed before marking Sprint 10 as DONE:

- [ ] Section 7.1 — All 4 test commands pass with 0 failures ✅
- [ ] Section 7.2 — `bun tsgo` passes with 0 errors ✅
- [ ] Section 7.3 — `bun biome:check` and `bun lint` pass with 0 issues ✅
- [ ] Section 7.4 — `bun codescene` passes with 0 new issues ✅
- [ ] Section 7.5 — Mock store removed from StatusTrackingContainer ✅
- [ ] Section 7.6 — No TODO/FIXME markers in scope ✅
- [ ] Section 7.7 — No Drizzle imports in services ✅
- [ ] Section 7.8 — No repo imports in GraphQL resolvers ✅
- [ ] Section 7.9 — Both permission enum values present ✅
- [ ] Section 7.10 — Migration sequence completes cleanly ✅
- [ ] Section 7.11 — Generated types contain new query types ✅
- [ ] Section 7.12 — GraphQL query document exported ✅
- [ ] Section 7.13 — All 4 repository methods implemented ✅
- [ ] Section 7.14 — All 3 new service files exist ✅
- [ ] Section 7.15 — Side-effects integrated in StudentLifecycleService ✅
- [ ] Section 7.16 — Suspension lock/release verified manually ✅
- [ ] Section 7.17 — Permission enforcement verified manually ✅
- [ ] Section 7.18 — 100% coverage on new repo methods ✅
- [ ] Section 7.19 — All functional scenarios manually verified ✅
