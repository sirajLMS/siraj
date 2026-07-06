# Siraj Security & Logical Remediation Plan

This implementation plan details the resolutions for identified service-layer vulnerabilities (IDOR Scoping, Timezone shifts, State transitions, and negative Student Quotas) in compliance with the database, repository, and service layer development guidelines.

---

## Phase 1: Database Schema & Migrations

### 1.1 Class Instance RLS Policies
**Target File:** `backend/db/migration/class_instances_rls_policies.sql` (new)
* Enable Row Level Security (RLS) on `class_instances` for role-based scoping based on `current_user_id()`.
* **Policies to implement:**
  - **Select/Update/Delete (Admins & Staff):** Bypass scoping check.
  - **Select/Update (Teachers):** Restrict access where:
    ```sql
    teacher_id IN (SELECT id FROM teachers WHERE user_id = current_user_id())
    ```
  - **Select (Parents):** Restrict access where:
    ```sql
    student_id IN (
        SELECT s.id 
        FROM students s 
        JOIN parents p ON s.parent_id = p.id 
        WHERE p.user_id = current_user_id()
    )
    ```

### 1.2 State Machine Transition Trigger
**Target File:** `backend/db/migration/class_instances_state_transition_trigger.sql` (new)
* Write a `BEFORE UPDATE` trigger function `fn_enforce_class_instance_transition()` on `class_instances`.
* Enforce the following transition validations:
  - If state is `COMPLETED`, it cannot transition to `ACTIVATED` or `RUNNING` (must be reverted/rescheduled).
  - If state is `RUNNING`, it cannot transition to `NOT_ACTIVATED`.
  - Raise an exception on violation to force transaction rollback.

---

## Phase 2: Repository Layer Enforcement

* **i18n & Error Handling Rule:** Never hardcode error strings. Accept a `locale?: string` parameter and look up localized templates using the `getBackendTranslations` helper.
* **ORM Rule:** Use Drizzle ORM `.select().from().leftJoin()` rather than raw SQL or nested `findMany` that raises compilation issues.

### 2.1 Threat 1: Scope Validation (IDOR)
**Target File:** `backend/db/repo/scheduling.repository.ts`
* In the `runStateChange` helper, verify the relationship of the `actorUserId` to the class instance:
  - Check if `actorUserId` is a teacher. If yes, assert that the resolved `teacher.id` matches `existing.teacherId`.
  - Check if `actorUserId` is a parent. If yes, assert that the resolved parent record is linked to `existing.studentId`.
  - Allow Super Admin / Admin / Staff user roles to bypass relationship checking.
  - Reject unauthorised requests with a localized error using `getBackendTranslations({ locale, namespace: "errors" })("unauthorizedAction")`.
* Document these repository checks and RLS enforcement in comments at the top of `SchedulingRepository`.

### 2.2 Threat 2: Timezone Off-by-One Day Filtering
**Target File:** `backend/db/repo/scheduling.repository.ts`
* Rewrite `getDailySchedule` to calculate day boundary timestamps in JavaScript based on the user's `viewerTimezone` (falling back to UTC):
  - Convert `date` into `startOfDay` and `endOfDay` in UTC based on the local timezone.
  - Query using standard timestamp range comparisons:
    ```ts
    and(
      gte(classInstances.scheduledStartAt, startOfDayUtc),
      lt(classInstances.scheduledStartAt, endOfDayUtc)
    )
    ```
  - This avoids database-side functional casts and leverages the `scheduled_start_at` database index.

### 2.3 Threat 3: State Machine Logic Bypasses
**Target File:** `backend/db/repo/scheduling.repository.ts`
* In the `runStateChange` helper, perform transition validations:
  - `activateClassInstance`: Assert `existing.executionState === 'NOT_ACTIVATED'`.
  - `startClassInstance`: Assert `existing.executionState === 'ACTIVATED'`.
  - `stopClassInstance` / `markClassAbsent` / `requestClassLeave` / `adminExcuseClassLeave`: Assert `existing.executionState === 'RUNNING'`.
  - Raise a localized error if a state transition is violated.

### 2.4 Threat 4: Student Quota Enforcements
**Target File:** `backend/db/repo/scheduling.repository.ts`
* In `createClassInstance` and `rescheduleClassInstance`:
  - Fetch the student's record and assert `student.classesRemaining > 0` before booking if `quotaDeducted` is true.
  - Reject the booking with a localized error if the student is out of quota.

---

## Phase 3: Service Layer & Documentation

### 3.1 Domain Services Rule compliance
* **No Monolithic Services:** Ensure checking resides within domain-specific service concerns.
* Document the multi-layered security setup (RLS policy, DB triggers, and Repository assertions) in `ClassSessionService` header documentation.

---

## Phase 4: Test Suite Implementation

* **Database testing rules compliance:**
  1. **Isolation:** Wrap every database test inside the `runInRollback` transaction wrapper from `./test-utils`.
  2. **RLS Testing:** When testing Row Level Security, use `setupRlsRole()` in `beforeAll` and `teardownRlsRole()` in `afterAll`, switching roles within the transaction using `await tx.execute(sql`SET LOCAL ROLE test_rls_user`)`.
  3. **Coverage:** Maintain 100% line and function coverage for modified files under `backend/db/test/repo/`.
  4. **Entity mapping:** Always map relationships cleanly using setup helpers and insert `teacherAssignments` before booking tests.
  5. **Pre-existing data:** Fetch the initial count before executing test operations and assert against `initialCount + newCount`.
  6. **Anti-Duplication:** Build custom test wrappers within test files to bypass structural repetition and comply with CodeScene rules.

### 4.1 Database Logic Verification
**Target File:** `backend/db/test/logic/class_instances_security.test.ts` (new)
* Test the state transition trigger rolls back invalid flows (e.g., `COMPLETED` -> `RUNNING`).
* Test parent/teacher RLS policies block unauthorized SELECT/UPDATE.
* Test that the check constraint `students_classes_remaining_chk` rolls back negative quota inserts/updates.

### 4.2 Repository Verification
**Target File:** `backend/db/test/repo/scheduling.repository.test.ts` (update)
* Verify IDOR scoping checks throw errors for mismatched teacher/student combinations.
* Verify timezone range querying returns correct timezone-shifted dates.
* Verify sequential state transitions are blocked.
* Verify scheduling / rescheduling fails with explicit quota-exhausted errors if student balance is zero.
