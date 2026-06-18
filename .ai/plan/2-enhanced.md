# Story 2 Implementation Plan — Live Session Lifecycle & Status Controls (Enhanced)

**Source story:** `.ai/siraj_stories/2.md` (Part 3, builds on Story 1)  
**Security baseline:** `.ai/done/service/1-sprint_1__db_repo_service_enhancments.md` (mandatory — all threats addressed)  
**Status:** Planning only — do not implement until approved  
**Last updated:** 2026-06-18 (rev 3 — enhanced with flattened layer rules)

---

## Section 0: Story Metadata & Context

**Source story:** `.ai/siraj_stories/2.md` (Part 3 - Live Session Lifecycle & Status Controls, timestamps 00:00 - 01:58)  
**Security baseline:** `.ai/done/service/1-sprint_1__db_repo_service_enhancments.md` (mandatory prerequisite)  
**Story scope:** Implement live session control toolbar with Start, Absent, Leave, and Reset actions for activated class sessions  
**Target roles:** Academy Admin (full override + reset), Teacher (standard lifecycle management)  
**Status:** Planning phase - awaiting approval for execution  

---

## Section 1: Core Principles & Strict Rules (Mandatory Checklist)

### 1.1 Service Layer Architecture
- [ ] **NO monolithic services** - Extend only `ClassSessionService` and `SystemRulesService`
- [ ] **Domain-driven design** - Each service represents a single business domain
- [ ] **Business logic centralization** - All orchestration, validation, and permission checks reside in services, NOT repositories or GraphQL resolvers
- [ ] **SSR compatibility** - Services must work in Next.js Server Components without GraphQL-specific context dependencies

### 1.2 Data Persistence & State Management
- [ ] **NO dummy data in backend** - All state transitions must persist to `class_instances` and `class_status_events` tables
- [ ] **Complete transaction boundaries** - Each state change operation must be atomic
- [ ] **Idempotent operations** - Services should handle duplicate calls gracefully
- [ ] **Audit trail completeness** - Every state transition generates a `class_status_events` record

### 1.3 Package Manager & Build System
- [ ] **Bun exclusively** - Use `~/.bun/bin/bun` for all scripts, tests, and codegen commands
- [ ] **No npm/yarn/pnpm** - Package operations must use Bun's CLI
- [ ] **Build verification** - Every code change must pass `bun tsgo` before commit

### 1.4 GraphQL Schema & Type Safety
- [ ] **Non-null `id` fields** - Every mutation response returns objects with non-null `id` for Apollo cache updates
- [ ] **Pothos nullability alignment** - Fields are non-nullable by default unless schema specifies `nullable: true`
- [ ] **Type generation workflow** - Changes require: `bun run generate:gqlSchema` → `bun codegen`
- [ ] **Cache-first queries** - All GraphQL queries must include `id` fields for automatic cache normalization

### 1.5 Frontend Data Fetching Patterns
- [ ] **`useQuery` only** - Use `useQuery` from `@apollo/client/react` with generated `TypedDocumentNode`
- [ ] **`useLazyQuery` BANNED** - Stateful `useQuery` with `skip` option is the only approved pattern
- [ ] **No imperative fetching** - Avoid manual `client.query()` calls in component bodies
- [ ] **Error boundaries** - Every query/mutation must handle loading, error, and success states

### 1.6 Logging & Observability
- [ ] **Logger utility mandatory** - `import { logger } from '@/src/utils/logger'`
- [ ] **Console methods forbidden** - ESLint will reject `console.log/warn/error/debug` usage
- [ ] **Diagnostic-only logging** - `logger.info` must NEVER substitute for implementing user-facing functionality
- [ ] **Production suppression** - `info`, `warn`, `debug` suppressed in production; `error` always logs

### 1.7 Internationalization (i18n)
- [ ] **Backend translations** - Use `getBackendTranslations({ locale, namespace })` for all user-facing messages
- [ ] **No hardcoded strings** - Error messages, remarks, descriptions must come from translation keys
- [ ] **Locale propagation** - Thread `locale` from GraphQL context → services → repositories
- [ ] **Graceful fallbacks** - Default to `"ar"` locale when outside HTTP request context

### 1.8 Testing Requirements
- [ ] **Repository coverage** - 100% line + function coverage on all touched repository methods
- [ ] **GraphQL integration tests** - Extend `frontend/graphql/test/class-session.test.ts`
- [ ] **Security regression suite** - Add Story 2 test cases to `backend/db/test/logic/class_instances_security.test.ts`
- [ ] **Storybook stories** - Mock stores in `*.stories.tsx` files; production containers fully wired

### 1.9 Code Quality Gates
- [ ] **NO summary markdown files** - Never create `SUMMARY.md`, `CHANGES.md`, `REPORT.md`, `FIXED.md`
- [ ] **Zero incomplete implementations** - No `TODO`, `FIXME`, `@todo`, "placeholder", "for now" comments
- [ ] **No stub throws** - No `throw new Error("Not implemented")` or empty function bodies
- [ ] **No logger-only handlers** - Every UI action must have real GraphQL mutation + backend logic

### 1.10 Zero Incomplete Implementation Policy

The following patterns are **strictly prohibited**:

| **Prohibited Pattern** | **Required Instead** | **Verification Command** |
|---|---|---|
| `// TODO`, `// FIXME`, `@todo`, "later", "for now" | Fully working implementation in same task | `rg -i "TODO\|FIXME\|for now" backend frontend --glob "!**/*.md"` |
| `throw new Error("Not implemented")` | Complete service/repo method implementation | Manual code review |
| Handler calling only `logger.info`/`logger.warn` | Real GraphQL mutation + UI feedback | Grep for `logger.info.*handle` patterns |
| Commented-out "future" code paths | Delete or implement immediately | Manual code review |
| Empty function bodies `{}` with no implementation | Implement or remove function + UI entry point | Static analysis |
| GraphQL mutation wired in UI but missing backend | Both layers in same task | Integration test must pass |

**Enforcement:** Before task completion, run:
```bash
rg -i "TODO|FIXME|not implemented|placeholder|for now" backend frontend shared --glob "!**/*.md" --glob "!**/generated/**"
```
Output MUST be empty.

---

## Section 2: RBAC Permissions (Canonical - Story 2)

### 2.1 New Permissions

| **Permission Key** | **Group** | **UI Gate** | **Backend Service Method** | **GraphQL Mutation** |
|---|---|---|---|---|
| `session.activate_override` | Academy Admin | Live toolbar visibility check | `ClassSessionService.activateOverride()` | `activateOverrideClass` |
| `session.reset` | Academy Admin | Admin-only destructive reset | `ClassSessionService.reset()` | `resetClass` |
| `session.update_status.start` | Admin + Teacher | Start button in live toolbar | `ClassSessionService.updateStatus('start')` | `updateSessionStatusStart` |
| `session.update_status.absent` | Admin + Teacher | Absent button (post-waiting period) | `ClassSessionService.updateStatus('absent')` | `updateSessionStatusAbsent` |
| `session.update_status.leave` | Admin + Teacher | Leave button + reschedule flow | `ClassSessionService.updateStatus('leave')` | `updateSessionStatusLeave` |

### 2.2 Permission Renames (Story 1 → Story 2)

| **Old Permission Key** | **New Permission Key** | **Migration Task** |
|---|---|---|
| `session.force_activate` | `session.activate_override` | Task B |
| `session.start` | `session.update_status.start` | Task B |
| `session.mark_absent` | `session.update_status.absent` | Task B |
| `session.request_leave` / `session.admin_leave` | `session.update_status.leave` | Task B |
| `session.revert` | `session.reset` | Task B |

### 2.3 Retained Permissions (From Story 1)
- `session.activate_class` (teacher activation within time window)
- `session.override_actions` (admin override capability flag)
- `session.view_details` (viewing class details)
- `system.enforce_time_window` (time window enforcement toggle)
- All dashboard, schedule, history, and teacher permissions from Story 1

---

## Section 3: Session State Machine & Threat Alignment

### 3.1 Execution State Transitions

```
NOT_ACTIVATED
  │ session.activate_class (teacher, time window enforced)
  │ session.activate_override (admin, bypass window)
  ▼
ACTIVATED ── session.update_status.start ──► RUNNING
  │                                              │
  ├── session.update_status.absent ──────────────┼──► COMPLETED (outcome=ABSENT)
  └── session.update_status.leave ───────────────┘──► COMPLETED (outcome=LEAVE) + reschedule successor

session.reset (admin only) ──► NOT_ACTIVATED, outcome=PENDING, all fields cleared
```

### 3.2 Threat 3 Alignment: State Transition Guards

**Allowed Transitions:**
- `ACTIVATED → COMPLETED` ONLY when `outcome IN ('ABSENT', 'LEAVE')`
- `RUNNING → COMPLETED` for any outcome
- `ANY_STATE → NOT_ACTIVATED` only via reset (service enforces `SESSION_RESET` permission)

**Three-Layer Enforcement:**
1. **DB trigger** `fn_enforce_class_instance_transition()` - Task S1
2. **Repo guard** `runStateChange()` - Task C
3. **Service assertion** `assertSessionActivated()` - Task D


---

## Section 4: Security Threat Remediation (Extends Story 1)

All threats from `.ai/done/service/1-sprint_1__db_repo_service_enhancments.md` remain active. Story 2 **extends** but never weakens these protections.

### Threat 1: IDOR Scoping (Cross-Teacher Access)

**Current Gap:** Repository `runStateChange` checks teacher/parent relationships but does NOT bypass these checks for privileged admin/staff users.

**Required Fix (Task S0):**

At the top of `runStateChange()`, before teacher/parent relationship checks:

```typescript
// File: backend/db/repo/scheduling.repository.ts
async runStateChange(actorUserId: number, instanceId: number, state: Partial<ClassInstanceState>, locale?: string) {
  // NEW: Privileged actor bypass
  const isPrivilegedActor = await PermissionsService.hasAnyPermission(actorUserId, [
    AppPermission.SESSION_OVERRIDE_ACTIONS,
    AppPermission.SESSION_ACTIVATE_OVERRIDE,
    AppPermission.SESSION_RESET,
    AppPermission.DASHBOARD_VIEW_METRICS,
  ]);

  if (!isPrivilegedActor) {
    // EXISTING: Teacher/parent IDOR checks
    const instance = await db.select()
      .from(classInstances)
      .leftJoin(teachers, eq(classInstances.teacherId, teachers.id))
      .leftJoin(students, eq(classInstances.studentId, students.id))
      .leftJoin(users, eq(students.parentUserId, users.id))
      .where(eq(classInstances.id, instanceId));

    if (!instance.length) throw localized notFound;

    const isTeacher = instance[0].teachers?.userId === actorUserId;
    const isParent = instance[0].users?.id === actorUserId;

    if (!isTeacher && !isParent) {
      const t = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(t("unauthorizedAction"));
    }
  }

  // Continue with state change logic...
}
```

**Test Requirements (Task S0):**
- Teacher A cannot call `resetClassInstance` on Teacher B's instance → `unauthorizedAction`
- Academy admin CAN call `resetClassInstance` on any instance → succeeds
- Parent cannot mutate other student's instance → `unauthorizedAction`

---

### Threat 2: Timezone Off-By-One (Date Arithmetic)

**Story 2 Touch Point:** Absent waiting period calculation compares server `now` against `scheduledStartAt`.

**Protection (Task D):**
```typescript
// File: backend/services/system/system-rules.service.ts
async assertAbsentWaitingPeriod(instance: ClassInstance, locale?: string) {
  const settings = await SystemSettingsService.get("session_absent_waiting_minutes");
  const waitingMinutes = settings?.value ?? 30;

  const now = Date.now();
  const earliestAbsentTime = instance.scheduledStartAt.getTime() + (waitingMinutes * 60_000);

  if (now < earliestAbsentTime) {
    const t = await getBackendTranslations({ locale, namespace: "errors" });
    throw new Error(t("absentTooEarly", { waitingMinutes }));
  }
}
```

**Anti-Pattern (FORBIDDEN):**
```typescript
// ❌ DO NOT USE DATE() truncation for time-based comparisons
const scheduled = new Date(instance.scheduledStartAt);
if (scheduled.toDateString() !== today.toDateString()) { ... }
```

---

### Threat 3: State Machine Bypass

Addressed in Section 3.2 above. All three layers (DB trigger, repo guard, service assertion) must agree.

**Migration Required (Task S1):** Update `fn_enforce_class_instance_transition()` to allow `ACTIVATED → COMPLETED` for `outcome IN ('ABSENT', 'LEAVE')`.

---

### Threat 4: Student Quota Integrity

**Touch Points:**
1. **Reset operation** - Must restore `classesRemaining` when clearing `quotaDeducted`
2. **Leave reschedule** - Must validate quota BEFORE creating successor instance

**Implementation (Task C):**

```typescript
async resetClassInstance(id: number, actorUserId: number, locale?: string) {
  return db.transaction(async (tx) => {
    const existing = await tx.query.classInstances.findFirst({ where: eq(classInstances.id, id) });
    
    if (!existing) throw localized notFound;
    
    // CRITICAL: Restore quota if it was deducted
    if (existing.quotaDeducted) {
      await this.adjustQuotaOnUpdate(tx, existing.studentId, existing.subjectId, false, existing.quotaDeducted, locale);
    }

    await tx.update(classInstances).set({
      executionState: "NOT_ACTIVATED",
      outcome: "PENDING",
      classType: "REGULAR",
      actualStartAt: null,
      actualEndAt: null,
      remarksByTeacher: null,
      remarksBySystem: null,
      adminNotes: null,
      payrollCredited: false,
      isRescheduled: false,
      quotaDeducted: false,
    }).where(eq(classInstances.id, id));
  });
}
```

**Test Requirements (Task K):**
- Reset restores quota when `quotaDeducted = true`
- Leave reschedule fails when `classesRemaining = 0`

---

### Threat 5: Separation of Duties (Admin vs Teacher)

**Controls:**
- `session.reset` permission assigned ONLY to Academy Admin group
- Service layer `reset()` method rejects calls from actors lacking `SESSION_RESET`

**Implementation (Task D):**

```typescript
async reset(classInstanceId: number, actorUserId: number, locale?: string) {
  const hasResetPermission = await PermissionsService.hasPermission(actorUserId, AppPermission.SESSION_RESET);

  if (!hasResetPermission) {
    const t = await getBackendTranslations({ locale, namespace: "errors" });
    throw new Error(t("insufficientPermissions"));
  }

  return SchedulingRepository.resetClassInstance(classInstanceId, actorUserId, locale);
}
```

---

### Threat 6: Payroll Data Integrity

**Rules:**
- `payrollCredited` set to `true` ONLY in `markClassAbsent` repository method
- `payrollCredited` cleared to `false` ONLY by `resetClassInstance` (admin-only)

**Implementation (Task C):**

```typescript
async markClassAbsent(id: number, actorUserId: number, locale?: string) {
  return db.transaction(async (tx) => {
    const instance = await tx.query.classInstances.findFirst({ where: eq(classInstances.id, id) });
    if (!instance) throw localized notFound;
    
    await SystemRulesService.assertAbsentWaitingPeriod(instance, locale);

    await this.transitionToCompleted(tx, id, {
      outcome: "ABSENT",
      remarksBySystem: (await getBackendTranslations({ locale, namespace: "session" }))("absentWaitingRemark"),
      payrollCredited: true, // ← ONLY place this is set to true
    }, locale);
  });
}
```

---

### Threat 7: Leave Reschedule Completeness

**Prohibited:** Setting `isRescheduled=true` alone without creating successor instance.

**Required (Task C):**

```typescript
async processClassLeave(id: number, actorUserId: number, leaveReason: string, locale?: string) {
  return db.transaction(async (tx) => {
    // Step 1: Mark original as LEAVE
    await this.transitionToCompleted(tx, id, { outcome: "LEAVE", remarksByTeacher: leaveReason }, locale);

    // Step 2: Compute next slot
    const offsetDays = await SystemSettingsService.get("session_leave_reschedule_offset_days") ?? 7;
    const nextStartAt = new Date(instance.scheduledStartAt.getTime() + (offsetDays * 24 * 60 * 60 * 1000));

    // Step 3: MANDATORY - Create successor via rescheduleClassInstance
    const successorId = await this.rescheduleClassInstance(id, { ...newInstanceFields }, locale);

    // Step 4: Mark original as rescheduled
    await tx.update(classInstances).set({ isRescheduled: true }).where(eq(classInstances.id, id));

    return { completedInstanceId: id, rescheduledInstanceId: successorId };
  });
}
```

**Test Requirements (Task L):**
- `updateSessionStatusLeave` response includes `rescheduledInstanceId`
- Query database after leave → new instance row exists
- Original has `isRescheduled = true` AND `outcome = 'LEAVE'`

---

## Section 5: Prerequisites Verification (BLOCKING)

Before starting ANY Story 2 work, verify Story 1 security remediation:

| **Artifact** | **Path** | **Verification** | **Success Criteria** |
|---|---|---|---|
| RLS policies | `backend/db/migration/class_instances_rls_policies.sql` | psql query | Policies applied |
| State trigger | `backend/db/migration/class_instances_state_transition_trigger.sql` | psql query | Function exists |
| Security tests | `backend/db/test/logic/class_instances_security.test.ts` | `bun test` | All pass |
| IDOR tests | `backend/db/test/repo/scheduling.repository.test.ts` | `bun run test:coverage` | 100% coverage |
| Docs | `scheduling.repository.ts` header | Manual review | Four-layer model documented |

**If admin bypass (Threat 1) missing, Task S0 is BLOCKING.**

---

## Section 6: Granular Task Breakdown



### Task S0 — Security: Admin IDOR Bypass in Repository

**Objective:** Implement privileged actor bypass in `runStateChange()` to allow Academy Admin users to mutate ANY class instance.

**Layer-Specific Rules (Backend Repository - Flattened from backend/db/repo/AGENTS.md):**
- **Drizzle ORM**: Use `.select().from().leftJoin()` patterns instead of `db.query.table.findMany({ with: ... })` if TypeScript encounters `SQL<unknown>` errors
- **Separation of Concerns**: Repositories strictly for data access; business logic resides in services layer
- **No Hardcoded Strings**: Use `getBackendTranslations({ locale, namespace })` for all user-facing errors
- **Conditional Aggregation**: Use `sql<T>` template literals with `.mapWith()` for CASE WHEN aggregations

**Target Files:**
- `backend/db/repo/scheduling.repository.ts` (modify `runStateChange`)
- `backend/services/auth/permissions.service.ts` (add `hasAnyPermission` if missing)
- `backend/db/test/repo/scheduling.repository.test.ts` (add IDOR bypass tests)

**Detailed Implementation Steps:**

**Step 1:** Add `hasAnyPermission` utility to PermissionsService

```typescript
// File: backend/services/auth/permissions.service.ts
export class PermissionsService {
  static async hasAnyPermission(userId: number, permissions: AppPermission[]): Promise<boolean> {
    if (permissions.length === 0) return false;
    
    const userPermissions = await db.query.userPermissions.findMany({
      where: and(
        eq(userPermissions.userId, userId),
        inArray(userPermissions.permissionKey, permissions)
      ),
    });
    
    return userPermissions.length > 0;
  }
}
```

**Step 2:** Update `runStateChange` method header with four-layer security documentation

```typescript
/**
 * Multi-layer security enforcement for class instance state changes:
 * 
 * Layer 1: PostgreSQL RLS policies (class_instances_rls_policies.sql)
 *   - Row-level security enforced at database level
 * 
 * Layer 2: Database trigger (fn_enforce_class_instance_transition)
 *   - Validates state machine transitions
 * 
 * Layer 3: Repository assertions (teacher/parent IDOR checks with admin bypass)
 *   - Enforces relationship-based access control
 *   - Privileged actors bypass relationship checks
 * 
 * Layer 4: Service permission gates (explicit permission checks)
 *   - Services validate specific action permissions before calling repository
 */
```

**Step 3:** Implement privileged actor bypass at start of `runStateChange`

```typescript
async runStateChange(
  actorUserId: number,
  instanceId: number,
  state: Partial<ClassInstanceState>,
  locale?: string
) {
  // Check if actor has privileged permissions that bypass IDOR checks
  const isPrivilegedActor = await PermissionsService.hasAnyPermission(actorUserId, [
    AppPermission.SESSION_OVERRIDE_ACTIONS,
    AppPermission.SESSION_ACTIVATE_OVERRIDE,
    AppPermission.SESSION_RESET,
    AppPermission.DASHBOARD_VIEW_METRICS,
  ]);

  if (!isPrivilegedActor) {
    // Enforce teacher/parent relationship for non-privileged users
    const instance = await db
      .select({
        id: classInstances.id,
        teacherUserId: teachers.userId,
        parentUserId: users.id,
      })
      .from(classInstances)
      .leftJoin(teachers, eq(classInstances.teacherId, teachers.id))
      .leftJoin(students, eq(classInstances.studentId, students.id))
      .leftJoin(users, eq(students.parentUserId, users.id))
      .where(eq(classInstances.id, instanceId))
      .limit(1);

    if (instance.length === 0) {
      const t = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(t("notFound"));
    }

    const isTeacher = instance[0].teacherUserId === actorUserId;
    const isParent = instance[0].parentUserId === actorUserId;

    if (!isTeacher && !isParent) {
      const t = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(t("unauthorizedAction"));
    }
  }

  // Continue with existing state transition logic...
  const existing = await db.query.classInstances.findFirst({
    where: eq(classInstances.id, instanceId),
  });

  if (!existing) {
    const t = await getBackendTranslations({ locale, namespace: "errors" });
    throw new Error(t("notFound"));
  }

  // State transition guards (Threat 3)
  if (state.executionState === "COMPLETED") {
    const allowedFromActivated =
      existing.executionState === "ACTIVATED" &&
      (state.outcome === "ABSENT" || state.outcome === "LEAVE");

    if (existing.executionState !== "RUNNING" && !allowedFromActivated) {
      const t = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(t("invalidTransition"));
    }
  }

  // Apply state change in transaction...
}
```

**Step 4:** Add comprehensive IDOR tests

```typescript
// File: backend/db/test/repo/scheduling.repository.test.ts

describe("IDOR Protection with Admin Bypass", () => {
  it("prevents teacher A from mutating teacher B's instance", async () => {
    const teacherA = await createTestUser("teacher_a", "TEACHER");
    const teacherB = await createTestUser("teacher_b", "TEACHER");
    const instance = await createTestInstance(teacherB.id);

    await expect(
      SchedulingRepository.runStateChange(teacherA.id, instance.id, { executionState: "ACTIVATED" })
    ).rejects.toThrow("unauthorizedAction");
  });

  it("allows academy admin to mutate any instance", async () => {
    const admin = await createTestUser("admin", "ACADEMY_ADMIN");
    const teacher = await createTestUser("teacher", "TEACHER");
    const instance = await createTestInstance(teacher.id);

    await expect(
      SchedulingRepository.resetClassInstance(instance.id, admin.id)
    ).resolves.toBeDefined();
  });

  it("prevents parent from mutating other student's instance", async () => {
    const parentA = await createTestUser("parent_a", "PARENT");
    const parentB = await createTestUser("parent_b", "PARENT");
    const instanceB = await createTestInstance(null, parentB.id);

    await expect(
      SchedulingRepository.runStateChange(parentA.id, instanceB.id, { executionState: "ACTIVATED" })
    ).rejects.toThrow("unauthorizedAction");
  });
});
```

**Step 5:** Run coverage verification

```bash
~/.bun/bin/bun run test:coverage backend/db/test/repo/scheduling.repository.test.ts
```

**Success Criteria:**
- [ ] `hasAnyPermission` method implemented and tested
- [ ] Four-layer security model documented in repository header
- [ ] Privileged actor bypass implemented at start of `runStateChange`
- [ ] All IDOR tests pass (teacher cross-access blocked, admin bypass works)
- [ ] 100% line + function coverage on `runStateChange` method
- [ ] No hardcoded error strings (all use `getBackendTranslations`)

---

### Task S1 — Database: State Trigger Migration for Story 2

**Objective:** Extend `fn_enforce_class_instance_transition()` trigger to allow `ACTIVATED → COMPLETED` for absent/leave outcomes and support admin reset transitions.

**Layer-Specific Rules (Database Seeders - Flattened from backend/db/seeds/AGENTS.md):**
- **Check Constraints**: Ensure seeded data respects database CHECK constraints (e.g., `class_instances_state_machine_chk`)
- **Enums Verification**: PostgreSQL enums must match EXACTLY (e.g., `"ACTIVATED"` not `"ACTIVE"`)
- **Schema Synchronization**: Run `bun db cleanGenerate` before `bun run db seed` if schema changed
- **Idempotency**: Migrations must be safely runnable multiple times

**Target Files:**
- `backend/db/migration/class_instances_state_transition_trigger.sql` (extend trigger)
- `backend/db/test/logic/class_instances_security.test.ts` (add Story 2 transition tests)

**Detailed Implementation Steps:**

**Step 1:** Extend trigger function to allow `ACTIVATED → COMPLETED` for specific outcomes

```sql
-- File: backend/db/migration/class_instances_state_transition_trigger.sql

CREATE OR REPLACE FUNCTION fn_enforce_class_instance_transition()
RETURNS TRIGGER AS $$
BEGIN
  -- Existing transitions (from Story 1)
  IF OLD.execution_state = 'NOT_ACTIVATED' AND NEW.execution_state = 'ACTIVATED' THEN
    RETURN NEW;
  END IF;

  IF OLD.execution_state = 'ACTIVATED' AND NEW.execution_state = 'RUNNING' THEN
    RETURN NEW;
  END IF;

  IF OLD.execution_state = 'RUNNING' AND NEW.execution_state = 'COMPLETED' THEN
    RETURN NEW;
  END IF;

  -- NEW: Allow ACTIVATED → COMPLETED only for ABSENT or LEAVE outcomes
  IF OLD.execution_state = 'ACTIVATED' AND NEW.execution_state = 'COMPLETED' THEN
    IF NEW.outcome NOT IN ('ABSENT', 'LEAVE') THEN
      RAISE EXCEPTION 'Invalid transition: ACTIVATED can only complete to ABSENT or LEAVE outcomes. Got: %', NEW.outcome;
    END IF;
    RETURN NEW;
  END IF;

  -- NEW: Allow reset transitions (any active state → NOT_ACTIVATED)
  -- Note: Service layer enforces SESSION_RESET permission
  IF NEW.execution_state = 'NOT_ACTIVATED' AND OLD.execution_state IN ('ACTIVATED', 'RUNNING', 'COMPLETED') THEN
    RETURN NEW;
  END IF;

  -- Block all other transitions
  RAISE EXCEPTION 'Invalid state transition from % to %', OLD.execution_state, NEW.execution_state;
END;
$$ LANGUAGE plpgsql;
```

**Step 2:** Apply migration

```bash
~/.bun/bin/bun db cleanGenerate
```

**Step 3:** Add Story 2 transition tests to security logic suite

```typescript
// File: backend/db/test/logic/class_instances_security.test.ts

describe("Story 2: State Transitions", () => {
  it("allows ACTIVATED → COMPLETED with outcome=ABSENT", async () => {
    const instance = await createActivatedInstance();
    
    await expect(
      db.update(classInstances)
        .set({ executionState: "COMPLETED", outcome: "ABSENT" })
        .where(eq(classInstances.id, instance.id))
    ).resolves.toBeDefined();
  });

  it("allows ACTIVATED → COMPLETED with outcome=LEAVE", async () => {
    const instance = await createActivatedInstance();
    
    await expect(
      db.update(classInstances)
        .set({ executionState: "COMPLETED", outcome: "LEAVE" })
        .where(eq(classInstances.id, instance.id))
    ).resolves.toBeDefined();
  });

  it("blocks ACTIVATED → COMPLETED with outcome=TAKEN", async () => {
    const instance = await createActivatedInstance();
    
    await expect(
      db.update(classInstances)
        .set({ executionState: "COMPLETED", outcome: "TAKEN" })
        .where(eq(classInstances.id, instance.id))
    ).rejects.toThrow("Invalid transition");
  });

  it("allows COMPLETED → NOT_ACTIVATED (reset)", async () => {
    const instance = await createCompletedInstance();
    
    await expect(
      db.update(classInstances)
        .set({ executionState: "NOT_ACTIVATED", outcome: "PENDING" })
        .where(eq(classInstances.id, instance.id))
    ).resolves.toBeDefined();
  });

  it("allows ACTIVATED → NOT_ACTIVATED (reset)", async () => {
    const instance = await createActivatedInstance();
    
    await expect(
      db.update(classInstances)
        .set({ executionState: "NOT_ACTIVATED", outcome: "PENDING" })
        .where(eq(classInstances.id, instance.id))
    ).resolves.toBeDefined();
  });
});
```

**Step 4:** Run security test suite

```bash
~/.bun/bin/bun test backend/db/test/logic/class_instances_security.test.ts
```

**Success Criteria:**
- [ ] Trigger allows `ACTIVATED → COMPLETED` for `outcome IN ('ABSENT', 'LEAVE')`
- [ ] Trigger blocks `ACTIVATED → COMPLETED` for other outcomes (e.g., `TAKEN`)
- [ ] Trigger allows reset transitions (`ACTIVATED/RUNNING/COMPLETED → NOT_ACTIVATED`)
- [ ] All security logic tests pass
- [ ] Migration applied without errors

---



### Task A — Schema: Payroll Flag & Settings

**Objective:** Add `payrollCredited` boolean field to `class_instances` table and add system settings for absent waiting period and leave reschedule offset.

**Layer-Specific Rules (Database Seeders - Flattened):**
- **Seed or Get Pattern**: Every seeder must export a `seedOrGet` function
- **Idempotency**: Safely runnable multiple times using `onConflictDoUpdate` or `onConflictDoNothing`
- **Schema Synchronization**: Run `bun db cleanGenerate` after schema changes before seeding
- **Check Constraints**: Verify seeded data respects database CHECK constraints

**Target Files:**
- `backend/db/schema/scheduling.ts` (add `payrollCredited` column)
- `backend/db/seeds/system-settings.ts` (add new settings)

**Detailed Implementation Steps:**

**Step 1:** Add `payrollCredited` field to `class_instances` table

```typescript
// File: backend/db/schema/scheduling.ts

export const classInstances = pgTable("class_instances", {
  id: serial("id").primaryKey(),
  // ... existing fields
  payrollCredited: boolean("payroll_credited").notNull().default(false),
  // ... rest of fields
});
```

**Step 2:** Add system settings for Story 2

```typescript
// File: backend/db/seeds/system-settings.ts

export async function seedOrGet() {
  const settings = [
    // ... existing settings
    {
      key: "session_absent_waiting_minutes",
      value: "30",
      dataType: "number" as const,
      description: "Minimum minutes to wait before marking student absent after scheduled start time",
      category: "session",
    },
    {
      key: "session_leave_reschedule_offset_days",
      value: "7",
      dataType: "number" as const,
      description: "Default number of days to offset when rescheduling a leave request",
      category: "session",
    },
  ];

  await db
    .insert(systemSettings)
    .values(settings)
    .onConflictDoUpdate({
      target: systemSettings.key,
      set: { value: sql`EXCLUDED.value` },
    });

  return settings;
}
```

**Step 3:** Push schema changes

```bash
~/.bun/bin/bun db cleanGenerate
```

**Success Criteria:**
- [ ] `payrollCredited` column added to `class_instances` with default `false`
- [ ] `session_absent_waiting_minutes` setting seeded (default 30)
- [ ] `session_leave_reschedule_offset_days` setting seeded (default 7)
- [ ] Schema push completes without errors
- [ ] Seed script runs idempotently (can run multiple times)

---

### Task B — Permissions: Enum, Catalog, Seeds

**Objective:** Update permission enums, catalog, and seeds to replace Story 1 permission keys with Story 2 keys and assign to appropriate groups.

**Layer-Specific Rules (Database Seeders - Flattened):**
- **One Seeder per Table**: Each table gets dedicated seeder file
- **Dependencies via Context**: Pass seeded entities through context to dependent seeders
- **Return Value**: Return seeded entities for use by other seeders

**Target Files:**
- `shared/lib/enum.ts` (update `AppPermission` enum)
- `backend/services/auth/permission-catalog.ts` (update catalog entries)
- `backend/db/seeds/seed-permissions.ts` (update permission group assignments)

**Detailed Implementation Steps:**

**Step 1:** Update `AppPermission` enum to remove old keys and add new ones

```typescript
// File: shared/lib/enum.ts

export enum AppPermission {
  // ... existing permissions
  
  // REMOVE these Story 1 keys:
  // SESSION_FORCE_ACTIVATE = "session.force_activate",
  // SESSION_START = "session.start",
  // SESSION_MARK_ABSENT = "session.mark_absent",
  // SESSION_REQUEST_LEAVE = "session.request_leave",
  // SESSION_ADMIN_LEAVE = "session.admin_leave",
  // SESSION_REVERT = "session.revert",
  
  // ADD Story 2 keys:
  SESSION_ACTIVATE_OVERRIDE = "session.activate_override",
  SESSION_RESET = "session.reset",
  SESSION_UPDATE_STATUS_START = "session.update_status.start",
  SESSION_UPDATE_STATUS_ABSENT = "session.update_status.absent",
  SESSION_UPDATE_STATUS_LEAVE = "session.update_status.leave",
  
  // ... rest of permissions
}
```

**Step 2:** Update permission catalog with Story 2 descriptions

```typescript
// File: backend/services/auth/permission-catalog.ts

export const permissionCatalog: Record<AppPermission, PermissionMetadata> = {
  // ... existing permissions
  
  [AppPermission.SESSION_ACTIVATE_OVERRIDE]: {
    key: AppPermission.SESSION_ACTIVATE_OVERRIDE,
    name: "Activate Session Override",
    description: "Bypass time window enforcement to manually activate a class session",
    category: "session",
    risk: "high",
  },
  
  [AppPermission.SESSION_RESET]: {
    key: AppPermission.SESSION_RESET,
    name: "Reset Session",
    description: "Destructively clear session data and revert to NOT_ACTIVATED state",
    category: "session",
    risk: "critical",
  },
  
  [AppPermission.SESSION_UPDATE_STATUS_START]: {
    key: AppPermission.SESSION_UPDATE_STATUS_START,
    name: "Start Session",
    description: "Transition an activated session to RUNNING state upon student arrival",
    category: "session",
    risk: "low",
  },
  
  [AppPermission.SESSION_UPDATE_STATUS_ABSENT]: {
    key: AppPermission.SESSION_UPDATE_STATUS_ABSENT,
    name: "Mark Student Absent",
    description: "Mark student as absent after waiting period and credit teacher payroll",
    category: "session",
    risk: "medium",
  },
  
  [AppPermission.SESSION_UPDATE_STATUS_LEAVE]: {
    key: AppPermission.SESSION_UPDATE_STATUS_LEAVE,
    name: "Process Leave Request",
    description: "Process excused cancellation and trigger reschedule workflow",
    category: "session",
    risk: "medium",
  },
  
  // ... rest of catalog
};
```

**Step 3:** Update permission group assignments in seeds

```typescript
// File: backend/db/seeds/seed-permissions.ts

export async function seedOrGet() {
  const groups = await db
    .insert(permissionGroups)
    .values([
      { slug: "academy-admin", name: "Academy Admin" },
      { slug: "teacher", name: "Teacher" },
      // ... other groups
    ])
    .onConflictDoNothing()
    .returning();

  const permissions = [
    // ... existing permissions
    
    // Story 2 permissions
    { key: AppPermission.SESSION_ACTIVATE_OVERRIDE, name: "Activate Session Override", category: "session" },
    { key: AppPermission.SESSION_RESET, name: "Reset Session", category: "session" },
    { key: AppPermission.SESSION_UPDATE_STATUS_START, name: "Start Session", category: "session" },
    { key: AppPermission.SESSION_UPDATE_STATUS_ABSENT, name: "Mark Absent", category: "session" },
    { key: AppPermission.SESSION_UPDATE_STATUS_LEAVE, name: "Process Leave", category: "session" },
  ];

  await db.insert(permissions).values(permissions).onConflictDoNothing();

  // Assign to groups
  const adminGroup = groups.find(g => g.slug === "academy-admin")!;
  const teacherGroup = groups.find(g => g.slug === "teacher")!;

  const groupPermissions = [
    // Academy Admin - ALL session permissions
    { groupId: adminGroup.id, permissionKey: AppPermission.SESSION_ACTIVATE_OVERRIDE },
    { groupId: adminGroup.id, permissionKey: AppPermission.SESSION_RESET },
    { groupId: adminGroup.id, permissionKey: AppPermission.SESSION_UPDATE_STATUS_START },
    { groupId: adminGroup.id, permissionKey: AppPermission.SESSION_UPDATE_STATUS_ABSENT },
    { groupId: adminGroup.id, permissionKey: AppPermission.SESSION_UPDATE_STATUS_LEAVE },
    
    // Teacher - ONLY update_status permissions (NO override, NO reset)
    { groupId: teacherGroup.id, permissionKey: AppPermission.SESSION_UPDATE_STATUS_START },
    { groupId: teacherGroup.id, permissionKey: AppPermission.SESSION_UPDATE_STATUS_ABSENT },
    { groupId: teacherGroup.id, permissionKey: AppPermission.SESSION_UPDATE_STATUS_LEAVE },
  ];

  await db.insert(permissionGroupPermissions).values(groupPermissions).onConflictDoNothing();

  return { groups, permissions };
}
```

**Step 4:** Grep entire codebase for deprecated permission strings

```bash
rg "session\.force_activate|session\.start|session\.mark_absent|session\.request_leave|session\.admin_leave|session\.revert" backend frontend shared --glob "!**/*.md"
```

Output MUST be empty (all old permission strings removed).

**Step 5:** Run seeds and verify

```bash
~/.bun/bin/bun run db seed
```

**Success Criteria:**
- [ ] Old permission enum values removed from `AppPermission`
- [ ] New Story 2 permission keys added to enum
- [ ] Permission catalog updated with Story 2 entries
- [ ] Academy Admin group has ALL Story 2 permissions
- [ ] Teacher group has ONLY `update_status.*` permissions (NOT override/reset)
- [ ] Grep for deprecated strings returns empty
- [ ] Seed runs without errors

---

### Task C — Repository: Reset, Absent, Leave (Fully Implemented)

**Objective:** Implement `resetClassInstance`, `markClassAbsent`, and `processClassLeave` repository methods with full transaction support, quota handling, and reschedule logic.

**Layer-Specific Rules (Backend Repository - Flattened):**
- **Drizzle ORM**: Use standard `.select().from().leftJoin()` patterns for complex queries
- **Separation of Concerns**: Repositories for data access only; no permission checks (handled in services)
- **No Hardcoded Strings**: All user-facing messages via `getBackendTranslations`
- **Transaction Safety**: Wrap multi-step operations in `db.transaction()`

**Target Files:**
- `backend/db/repo/scheduling.repository.ts` (implement methods, update `runStateChange` guard)
- `backend/db/test/repo/scheduling.repository.test.ts` (100% coverage tests)

**Detailed Implementation Steps:**

**Step 1:** Implement `resetClassInstance` with quota restoration

```typescript
// File: backend/db/repo/scheduling.repository.ts

/**
 * Reset a class instance to its initial state (admin-only operation)
 * Clears all session data and restores student quota if it was deducted
 */
async resetClassInstance(id: number, actorUserId: number, locale?: string): Promise<void> {
  return db.transaction(async (tx) => {
    const existing = await tx.query.classInstances.findFirst({
      where: eq(classInstances.id, id),
      with: { student: true, subject: true },
    });

    if (!existing) {
      const t = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(t("notFound"));
    }

    // CRITICAL: Restore quota if it was deducted (Threat 4)
    if (existing.quotaDeducted) {
      await this.adjustQuotaOnUpdate(
        tx,
        existing.studentId,
        existing.subjectId,
        false, // newQuotaDeducted = false (restore quota)
        existing.quotaDeducted, // oldQuotaDeducted = true
        locale
      );
    }

    // Clear all session-specific data
    await tx
      .update(classInstances)
      .set({
        executionState: "NOT_ACTIVATED",
        outcome: "PENDING",
        classType: "REGULAR",
        actualStartAt: null,
        actualEndAt: null,
        remarksByTeacher: null,
        remarksBySystem: null,
        adminNotes: null,
        payrollCredited: false,
        isRescheduled: false,
        quotaDeducted: false,
        updatedAt: new Date(),
      })
      .where(eq(classInstances.id, id));

    // Create audit event
    const t = await getBackendTranslations({ locale, namespace: "session" });
    await this.createStatusEvent(tx, {
      classInstanceId: id,
      eventType: "RESET",
      description: t("resetDescription"),
      userId: actorUserId,
      createdAt: new Date(),
    });
  });
}
```

**Step 2:** Implement `markClassAbsent` with payroll flag and system remark

```typescript
/**
 * Mark a student as absent after waiting period
 * Sets payroll credit flag and injects system-generated remark
 */
async markClassAbsent(id: number, actorUserId: number, locale?: string): Promise<void> {
  return db.transaction(async (tx) => {
    const instance = await tx.query.classInstances.findFirst({
      where: eq(classInstances.id, id),
    });

    if (!instance) {
      const t = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(t("notFound"));
    }

    // Waiting period check delegated to SystemRulesService in service layer

    const t = await getBackendTranslations({ locale, namespace: "session" });

    // CRITICAL: Set payrollCredited flag (Threat 6 - ONLY place this is set to true)
    await this.transitionToCompleted(tx, id, {
      outcome: "ABSENT",
      remarksBySystem: t("absentWaitingRemark"), // e.g., "I have been waiting for whole class time."
      payrollCredited: true,
      updatedAt: new Date(),
    }, locale);

    // Create audit event
    await this.createStatusEvent(tx, {
      classInstanceId: id,
      eventType: "MARKED_ABSENT",
      description: t("absentEventDescription"),
      userId: actorUserId,
      createdAt: new Date(),
    });
  });
}
```

**Step 3:** Implement `processClassLeave` with MANDATORY reschedule creation

```typescript
/**
 * Process leave request with mandatory reschedule creation
 * Returns both completed original and new rescheduled instance IDs
 */
async processClassLeave(
  id: number,
  actorUserId: number,
  leaveReason: string,
  locale?: string
): Promise<{ completedInstanceId: number; rescheduledInstanceId: number }> {
  return db.transaction(async (tx) => {
    const instance = await tx.query.classInstances.findFirst({
      where: eq(classInstances.id, id),
      with: { teacher: true, student: true, subject: true },
    });

    if (!instance) {
      const t = await getBackendTranslations({ locale, namespace: "errors" });
      throw new Error(t("notFound"));
    }

    const t = await getBackendTranslations({ locale, namespace: "session" });

    // Step 1: Mark original as completed with LEAVE outcome
    await this.transitionToCompleted(tx, id, {
      outcome: "LEAVE",
      remarksByTeacher: leaveReason,
      remarksBySystem: t("leaveRescheduledRemark"), // e.g., "Leave approved - session rescheduled"
      updatedAt: new Date(),
    }, locale);

    // Step 2: Compute next slot (from system settings or +7 days default)
    const settings = await tx.query.systemSettings.findFirst({
      where: eq(systemSettings.key, "session_leave_reschedule_offset_days"),
    });
    const offsetDays = settings ? parseInt(settings.value) : 7;

    const nextStartAt = new Date(instance.scheduledStartAt.getTime() + (offsetDays * 24 * 60 * 60 * 1000));
    const nextEndAt = new Date(instance.scheduledEndAt.getTime() + (offsetDays * 24 * 60 * 60 * 1000));

    // Step 3: MANDATORY - Create successor instance via rescheduleClassInstance
    // This function MUST call performRescheduleValidations + quota check (Threat 4, Threat 7)
    const successorId = await this.rescheduleClassInstance(
      tx,
      id,
      {
        teacherId: instance.teacherId,
        studentId: instance.studentId,
        subjectId: instance.subjectId,
        scheduledStartAt: nextStartAt,
        scheduledEndAt: nextEndAt,
        classType: "REGULAR",
        executionState: "NOT_ACTIVATED",
        outcome: "PENDING",
      },
      locale
    );

    // Step 4: Mark original as rescheduled
    await tx
      .update(classInstances)
      .set({ isRescheduled: true, updatedAt: new Date() })
      .where(eq(classInstances.id, id));

    // Create audit event
    await this.createStatusEvent(tx, {
      classInstanceId: id,
      eventType: "LEAVE_PROCESSED",
      description: t("leaveProcessedDescription", { successorId }),
      userId: actorUserId,
      createdAt: new Date(),
    });

    return { completedInstanceId: id, rescheduledInstanceId: successorId };
  });
}
```

**Step 4:** Update `runStateChange` COMPLETED guard per Threat 3

```typescript
// In runStateChange method, update the COMPLETED transition guard:

if (state.executionState === "COMPLETED") {
  const allowedFromActivated =
    existing.executionState === "ACTIVATED" &&
    (state.outcome === "ABSENT" || state.outcome === "LEAVE");

  if (existing.executionState !== "RUNNING" && !allowedFromActivated) {
    const t = await getBackendTranslations({ locale, namespace: "errors" });
    throw new Error(t("invalidTransition"));
  }
}
```

**Step 5:** Delete deprecated `revertClassInstance` export

```typescript
// REMOVE this export entirely:
// export async function revertClassInstance(...) { ... }

// And remove all references to it in service layer
```

**Step 6:** Add comprehensive repository tests (100% coverage)

```typescript
// File: backend/db/test/repo/scheduling.repository.test.ts

describe("resetClassInstance", () => {
  it("clears all session data", async () => {
    const instance = await createCompletedInstance();
    await SchedulingRepository.resetClassInstance(instance.id, adminUserId);
    
    const updated = await db.query.classInstances.findFirst({ where: eq(classInstances.id, instance.id) });
    expect(updated.executionState).toBe("NOT_ACTIVATED");
    expect(updated.outcome).toBe("PENDING");
    expect(updated.actualStartAt).toBeNull();
    expect(updated.payrollCredited).toBe(false);
  });

  it("restores quota when quotaDeducted was true", async () => {
    const instance = await createInstanceWithQuotaDeducted();
    const quotaBefore = await getStudentQuota(instance.studentId, instance.subjectId);
    
    await SchedulingRepository.resetClassInstance(instance.id, adminUserId);
    
    const quotaAfter = await getStudentQuota(instance.studentId, instance.subjectId);
    expect(quotaAfter.classesRemaining).toBe(quotaBefore.classesRemaining + 1);
  });

  it("creates audit event with resetDescription", async () => {
    const instance = await createActivatedInstance();
    await SchedulingRepository.resetClassInstance(instance.id, adminUserId);
    
    const events = await db.query.classStatusEvents.findMany({
      where: eq(classStatusEvents.classInstanceId, instance.id),
    });
    
    expect(events.some(e => e.eventType === "RESET")).toBe(true);
  });
});

describe("markClassAbsent", () => {
  it("sets payrollCredited to true", async () => {
    const instance = await createActivatedInstance();
    await SchedulingRepository.markClassAbsent(instance.id, teacherUserId);
    
    const updated = await db.query.classInstances.findFirst({ where: eq(classInstances.id, instance.id) });
    expect(updated.payrollCredited).toBe(true);
  });

  it("injects system remark", async () => {
    const instance = await createActivatedInstance();
    await SchedulingRepository.markClassAbsent(instance.id, teacherUserId);
    
    const updated = await db.query.classInstances.findFirst({ where: eq(classInstances.id, instance.id) });
    expect(updated.remarksBySystem).toContain("waiting");
  });

  it("transitions to COMPLETED with outcome=ABSENT", async () => {
    const instance = await createActivatedInstance();
    await SchedulingRepository.markClassAbsent(instance.id, teacherUserId);
    
    const updated = await db.query.classInstances.findFirst({ where: eq(classInstances.id, instance.id) });
    expect(updated.executionState).toBe("COMPLETED");
    expect(updated.outcome).toBe("ABSENT");
  });
});

describe("processClassLeave", () => {
  it("creates successor instance with rescheduled date", async () => {
    const instance = await createActivatedInstance();
    const result = await SchedulingRepository.processClassLeave(instance.id, teacherUserId, "Family emergency");
    
    const successor = await db.query.classInstances.findFirst({
      where: eq(classInstances.id, result.rescheduledInstanceId),
    });
    
    expect(successor).toBeDefined();
    expect(successor.scheduledStartAt.getTime()).toBeGreaterThan(instance.scheduledStartAt.getTime());
  });

  it("marks original as rescheduled with outcome=LEAVE", async () => {
    const instance = await createActivatedInstance();
    await SchedulingRepository.processClassLeave(instance.id, teacherUserId, "Student sick");
    
    const updated = await db.query.classInstances.findFirst({ where: eq(classInstances.id, instance.id) });
    expect(updated.isRescheduled).toBe(true);
    expect(updated.outcome).toBe("LEAVE");
  });

  it("fails when student has no quota remaining", async () => {
    const instance = await createInstanceWithZeroQuota();
    
    await expect(
      SchedulingRepository.processClassLeave(instance.id, teacherUserId, "Reason")
    ).rejects.toThrow();
  });
});
```

**Step 7:** Run coverage verification

```bash
~/.bun/bin/bun run test:coverage backend/db/test/repo/scheduling.repository.test.ts
```

**Success Criteria:**
- [ ] `resetClassInstance` implemented with quota restoration
- [ ] `markClassAbsent` implemented with payroll flag + system remark
- [ ] `processClassLeave` implemented with MANDATORY successor creation
- [ ] `runStateChange` COMPLETED guard updated for Threat 3
- [ ] Deprecated `revertClassInstance` deleted
- [ ] All repository tests pass
- [ ] 100% line + function coverage on new/modified methods
- [ ] No hardcoded error strings (all use `getBackendTranslations`)

---



### Task D — Service Layer: Permissions, Rules, No Stubs

**Objective:** Implement service methods for all Story 2 actions with explicit permission checks, waiting period validation, and complete business logic orchestration.

**Layer-Specific Rules (Backend Services - Flattened from backend/services/AGENTS.md):**
- **Domain-Driven Architecture**: Services per domain (no monoliths)
- **Business Logic Hub**: All orchestration, permission gating, and complex rules live here
- **SSR Usage**: Services must work in Next.js Server Components without GraphQL context
- **Localized Errors**: All user-facing messages via `getBackendTranslations({ locale, namespace })`

**Target Files:**
- `backend/services/session/class-session.service.ts` (rename methods, add permission checks)
- `backend/services/system/system-rules.service.ts` (add `assertAbsentWaitingPeriod`)

**Detailed Implementation Steps:**

**Step 1:** Rename `forceActivate` → `activateOverride` with bypass logic

```typescript
// File: backend/services/session/class-session.service.ts

/**
 * Activate a class session bypassing time window enforcement
 * Requires SESSION_ACTIVATE_OVERRIDE permission (Academy Admin only)
 */
async activateOverride(
  classInstanceId: number,
  actorUserId: number,
  locale?: string
): Promise<ClassInstance> {
  // CRITICAL: Explicit permission check (Threat 5)
  const hasPermission = await PermissionsService.hasPermission(
    actorUserId,
    AppPermission.SESSION_ACTIVATE_OVERRIDE
  );

  if (!hasPermission) {
    const t = await getBackendTranslations({ locale, namespace: "errors" });
    throw new Error(t("insufficientPermissions"));
  }

  // Bypass time window check - directly call repository
  return SchedulingRepository.runStateChange(
    actorUserId,
    classInstanceId,
    {
      executionState: "ACTIVATED",
      activatedAt: new Date(),
    },
    locale
  );
}
```

**Step 2:** Rename `revert` → `reset` with admin-only enforcement

```typescript
/**
 * Destructively reset a class instance to initial state
 * Requires SESSION_RESET permission (Academy Admin only)
 * Restores student quota if it was deducted
 */
async reset(
  classInstanceId: number,
  actorUserId: number,
  locale?: string
): Promise<void> {
  // CRITICAL: Explicit permission check (Threat 5)
  const hasResetPermission = await PermissionsService.hasPermission(
    actorUserId,
    AppPermission.SESSION_RESET
  );

  if (!hasResetPermission) {
    const t = await getBackendTranslations({ locale, namespace: "errors" });
    throw new Error(t("insufficientPermissions"));
  }

  // Additional safeguard: Even if actor has update_status permissions, reset is separate
  return SchedulingRepository.resetClassInstance(classInstanceId, actorUserId, locale);
}
```

**Step 3:** Implement `updateStatusStart` with session activation check

```typescript
/**
 * Start a class session (ACTIVATED → RUNNING)
 * Requires SESSION_UPDATE_STATUS_START permission
 */
async updateStatusStart(
  classInstanceId: number,
  actorUserId: number,
  locale?: string
): Promise<ClassInstance> {
  // Permission check
  const hasPermission = await PermissionsService.hasPermission(
    actorUserId,
    AppPermission.SESSION_UPDATE_STATUS_START
  );

  if (!hasPermission) {
    const t = await getBackendTranslations({ locale, namespace: "errors" });
    throw new Error(t("insufficientPermissions"));
  }

  // Fetch instance to validate state
  const instance = await SchedulingRepository.findById(classInstanceId);
  
  if (!instance) {
    const t = await getBackendTranslations({ locale, namespace: "errors" });
    throw new Error(t("notFound"));
  }

  // CRITICAL: Verify session is activated (Threat 3)
  await this.assertSessionActivated(instance, locale);

  // Transition to RUNNING
  return SchedulingRepository.runStateChange(
    actorUserId,
    classInstanceId,
    {
      executionState: "RUNNING",
      actualStartAt: new Date(),
    },
    locale
  );
}
```

**Step 4:** Implement `updateStatusAbsent` with waiting period check

```typescript
/**
 * Mark student as absent after waiting period
 * Requires SESSION_UPDATE_STATUS_ABSENT permission
 */
async updateStatusAbsent(
  classInstanceId: number,
  actorUserId: number,
  locale?: string
): Promise<void> {
  // Permission check
  const hasPermission = await PermissionsService.hasPermission(
    actorUserId,
    AppPermission.SESSION_UPDATE_STATUS_ABSENT
  );

  if (!hasPermission) {
    const t = await getBackendTranslations({ locale, namespace: "errors" });
    throw new Error(t("insufficientPermissions"));
  }

  const instance = await SchedulingRepository.findById(classInstanceId);
  
  if (!instance) {
    const t = await getBackendTranslations({ locale, namespace: "errors" });
    throw new Error(t("notFound"));
  }

  // CRITICAL: Verify session is activated (Threat 3)
  await this.assertSessionActivated(instance, locale);

  // CRITICAL: Verify waiting period elapsed (Threat 2)
  await SystemRulesService.assertAbsentWaitingPeriod(instance, locale);

  // Mark absent (sets payroll flag + system remark)
  return SchedulingRepository.markClassAbsent(classInstanceId, actorUserId, locale);
}
```

**Step 5:** Implement `updateStatusLeave` with full reschedule orchestration

```typescript
/**
 * Process leave request with mandatory reschedule creation
 * Requires SESSION_UPDATE_STATUS_LEAVE permission
 */
async updateStatusLeave(
  classInstanceId: number,
  actorUserId: number,
  leaveReason: string,
  locale?: string
): Promise<{ completedInstanceId: number; rescheduledInstanceId: number }> {
  // Permission check
  const hasPermission = await PermissionsService.hasPermission(
    actorUserId,
    AppPermission.SESSION_UPDATE_STATUS_LEAVE
  );

  if (!hasPermission) {
    const t = await getBackendTranslations({ locale, namespace: "errors" });
    throw new Error(t("insufficientPermissions"));
  }

  const instance = await SchedulingRepository.findById(classInstanceId);
  
  if (!instance) {
    const t = await getBackendTranslations({ locale, namespace: "errors" });
    throw new Error(t("notFound"));
  }

  // CRITICAL: Verify session is activated (Threat 3)
  await this.assertSessionActivated(instance, locale);

  // Process leave with MANDATORY reschedule (Threat 7)
  return SchedulingRepository.processClassLeave(classInstanceId, actorUserId, leaveReason, locale);
}
```

**Step 6:** Add `assertSessionActivated` helper method

```typescript
/**
 * Verify session is in ACTIVATED or RUNNING state before status updates
 * Throws localized error if not
 */
private async assertSessionActivated(instance: ClassInstance, locale?: string): Promise<void> {
  const validStates = ["ACTIVATED", "RUNNING"];
  
  if (!validStates.includes(instance.executionState)) {
    const t = await getBackendTranslations({ locale, namespace: "errors" });
    throw new Error(t("sessionNotActivated"));
  }
}
```

**Step 7:** Add `assertAbsentWaitingPeriod` to SystemRulesService

```typescript
// File: backend/services/system/system-rules.service.ts

/**
 * Verify that sufficient time has passed since scheduled start before marking absent
 * Uses session_absent_waiting_minutes system setting (default 30 minutes)
 */
async assertAbsentWaitingPeriod(instance: ClassInstance, locale?: string): Promise<void> {
  const settings = await SystemSettingsService.get("session_absent_waiting_minutes");
  const waitingMinutes = settings ? parseInt(settings.value) : 30;

  const now = Date.now();
  const earliestAbsentTime = instance.scheduledStartAt.getTime() + (waitingMinutes * 60_000);

  if (now < earliestAbsentTime) {
    const t = await getBackendTranslations({ locale, namespace: "errors" });
    throw new Error(t("absentTooEarly", { waitingMinutes }));
  }
}
```

**Step 8:** Remove ALL deprecated service method exports

```typescript
// DELETE these methods entirely:
// - forceActivate
// - revert
// - requestLeave (absorbed into updateStatusLeave)
// - adminLeave (absorbed into updateStatusLeave)

// Update all imports in GraphQL layer to use new method names
```

**Success Criteria:**
- [ ] `activateOverride` implemented with `SESSION_ACTIVATE_OVERRIDE` check
- [ ] `reset` implemented with `SESSION_RESET` check (Threat 5)
- [ ] `updateStatusStart` implemented with activation assertion
- [ ] `updateStatusAbsent` implemented with waiting period check (Threat 2)
- [ ] `updateStatusLeave` implemented with full reschedule (Threat 7)
- [ ] `assertSessionActivated` helper method added
- [ ] `assertAbsentWaitingPeriod` added to SystemRulesService
- [ ] All deprecated methods deleted
- [ ] No hardcoded error strings (all use `getBackendTranslations`)

---

### Task E — GraphQL: Mutations, Localized Errors

**Objective:** Rename GraphQL mutations to match Story 2 naming, expose new fields on response types, implement locale propagation for error messages, and generate updated TypeScript types.

**Layer-Specific Rules (Backend GraphQL - Flattened from backend/graphql/AGENTS.md):**
- **Framework**: Pothos for code-first schema building
- **Nullability**: Fields non-nullable by default unless `nullable: true` specified
- **Resolvers**: Delegate to services layer (no business logic in resolvers)
- **Cache Updates**: Always expose `id` fields for Apollo auto-cache
- **Locale Propagation**: Thread `ctx.locale` to service/repo calls for localized errors

**Target Files:**
- `backend/graphql/mutation/class-session.mutation.ts` (rename mutations, update resolvers)
- `backend/graphql/utils/class-session.utils.ts` (fix `resolveDetail` localized error)
- `backend/graphql/types/class-session.types.ts` (expose new fields)
- `frontend/graphql/sharedDocuments/class-session.documents.ts` (update mutation names)

**Detailed Implementation Steps:**

**Step 1:** Rename mutations in Pothos schema

```typescript
// File: backend/graphql/mutation/class-session.mutation.ts

builder.mutationField("activateOverrideClass", (t) =>
  t.field({
    type: ClassInstanceDetail, // MUST include non-null `id` field
    args: {
      classInstanceId: t.arg.int({ required: true }),
    },
    resolve: async (_parent, args, ctx) => {
      const instance = await ClassSessionService.activateOverride(
        args.classInstanceId,
        ctx.session.userId,
        ctx.locale // ← CRITICAL: Propagate locale for localized errors
      );
      return resolveDetail(instance.id, ctx.locale);
    },
  })
);

builder.mutationField("resetClass", (t) =>
  t.field({
    type: "Void", // Or return ClassInstanceDetail after reset
    args: {
      classInstanceId: t.arg.int({ required: true }),
    },
    resolve: async (_parent, args, ctx) => {
      await ClassSessionService.reset(
        args.classInstanceId,
        ctx.session.userId,
        ctx.locale
      );
      return null;
    },
  })
);

builder.mutationField("updateSessionStatusStart", (t) =>
  t.field({
    type: ClassInstanceDetail,
    args: {
      classInstanceId: t.arg.int({ required: true }),
    },
    resolve: async (_parent, args, ctx) => {
      const instance = await ClassSessionService.updateStatusStart(
        args.classInstanceId,
        ctx.session.userId,
        ctx.locale
      );
      return resolveDetail(instance.id, ctx.locale);
    },
  })
);

builder.mutationField("updateSessionStatusAbsent", (t) =>
  t.field({
    type: ClassInstanceDetail,
    args: {
      classInstanceId: t.arg.int({ required: true }),
    },
    resolve: async (_parent, args, ctx) => {
      await ClassSessionService.updateStatusAbsent(
        args.classInstanceId,
        ctx.session.userId,
        ctx.locale
      );
      return resolveDetail(args.classInstanceId, ctx.locale);
    },
  })
);

builder.mutationField("updateSessionStatusLeave", (t) =>
  t.field({
    type: LeaveProcessResult, // NEW type with completedInstanceId + rescheduledInstanceId
    args: {
      classInstanceId: t.arg.int({ required: true }),
      leaveReason: t.arg.string({ required: true }),
    },
    resolve: async (_parent, args, ctx) => {
      const result = await ClassSessionService.updateStatusLeave(
        args.classInstanceId,
        ctx.session.userId,
        args.leaveReason,
        ctx.locale
      );
      return result;
    },
  })
);

// DELETE these old mutations:
// - forceActivateClass
// - startClass
// - markClassAbsent
// - requestClassLeave
// - adminExcuseClassLeave
// - revertClass
```

**Step 2:** Create `LeaveProcessResult` type for leave mutation response

```typescript
// File: backend/graphql/types/class-session.types.ts

export const LeaveProcessResult = builder.objectRef<{
  completedInstanceId: number;
  rescheduledInstanceId: number;
}>("LeaveProcessResult").implement({
  fields: (t) => ({
    completedInstanceId: t.exposeInt("completedInstanceId"),
    rescheduledInstanceId: t.exposeInt("rescheduledInstanceId"),
    
    // Optionally expose full instance objects
    completedInstance: t.field({
      type: ClassInstanceDetail,
      resolve: (parent, _args, ctx) => resolveDetail(parent.completedInstanceId, ctx.locale),
    }),
    rescheduledInstance: t.field({
      type: ClassInstanceDetail,
      resolve: (parent, _args, ctx) => resolveDetail(parent.rescheduledInstanceId, ctx.locale),
    }),
  }),
});
```

**Step 3:** Expose new fields on `ClassInstanceDetail` type

```typescript
// File: backend/graphql/types/class-session.types.ts

export const ClassInstanceDetail = builder.objectRef<ClassInstance>("ClassInstanceDetail").implement({
  fields: (t) => ({
    id: t.exposeID("id"), // ← CRITICAL: Non-null ID for Apollo cache
    
    // ... existing fields
    
    // NEW Story 2 fields
    payrollCredited: t.exposeBoolean("payrollCredited"),
    isRescheduled: t.exposeBoolean("isRescheduled"),
    executionState: t.exposeString("executionState"), // Ensure exposed
    outcome: t.exposeString("outcome"), // Ensure exposed
    
    // ... rest of fields
  }),
});
```

**Step 4:** Fix `resolveDetail` to use localized error instead of hardcoded string

```typescript
// File: backend/graphql/utils/class-session.utils.ts

export async function resolveDetail(classInstanceId: number, locale?: string): Promise<ClassInstance> {
  const instance = await SchedulingRepository.findById(classInstanceId);
  
  if (!instance) {
    // FIX: Replace hardcoded "Not found" with localized error
    const t = await getBackendTranslations({ locale, namespace: "errors" });
    throw new Error(t("notFound"));
  }
  
  return instance;
}
```

**Step 5:** Update frontend GraphQL documents with new mutation names

```typescript
// File: frontend/graphql/sharedDocuments/class-session.documents.ts

export const activateOverrideClassMutationDocument = gql`
  mutation ActivateOverrideClass($classInstanceId: Int!) {
    activateOverrideClass(classInstanceId: $classInstanceId) {
      id
      executionState
      activatedAt
    }
  }
` as TypedDocumentNode<ActivateOverrideClassMutation, ActivateOverrideClassMutationVariables>;

export const resetClassMutationDocument = gql`
  mutation ResetClass($classInstanceId: Int!) {
    resetClass(classInstanceId: $classInstanceId)
  }
` as TypedDocumentNode<ResetClassMutation, ResetClassMutationVariables>;

export const updateSessionStatusStartMutationDocument = gql`
  mutation UpdateSessionStatusStart($classInstanceId: Int!) {
    updateSessionStatusStart(classInstanceId: $classInstanceId) {
      id
      executionState
      actualStartAt
    }
  }
` as TypedDocumentNode<UpdateSessionStatusStartMutation, UpdateSessionStatusStartMutationVariables>;

export const updateSessionStatusAbsentMutationDocument = gql`
  mutation UpdateSessionStatusAbsent($classInstanceId: Int!) {
    updateSessionStatusAbsent(classInstanceId: $classInstanceId) {
      id
      executionState
      outcome
      payrollCredited
      remarksBySystem
    }
  }
` as TypedDocumentNode<UpdateSessionStatusAbsentMutation, UpdateSessionStatusAbsentMutationVariables>;

export const updateSessionStatusLeaveMutationDocument = gql`
  mutation UpdateSessionStatusLeave($classInstanceId: Int!, $leaveReason: String!) {
    updateSessionStatusLeave(classInstanceId: $classInstanceId, leaveReason: $leaveReason) {
      completedInstanceId
      rescheduledInstanceId
      completedInstance {
        id
        outcome
        isRescheduled
      }
      rescheduledInstance {
        id
        scheduledStartAt
        scheduledEndAt
      }
    }
  }
` as TypedDocumentNode<UpdateSessionStatusLeaveMutation, UpdateSessionStatusLeaveMutationVariables>;

// DELETE old document exports:
// - forceActivateClassMutationDocument
// - startClassMutationDocument
// - markClassAbsentMutationDocument
// - requestClassLeaveMutationDocument
// - revertClassMutationDocument
```

**Step 6:** Run GraphQL schema generation and codegen

```bash
~/.bun/bin/bun run generate:gqlSchema
~/.bun/bin/bun codegen
```

**Step 7:** Verify no old mutation names remain in codebase

```bash
rg "forceActivateClass|startClass|markClassAbsent|requestClassLeave|adminExcuseClassLeave|revertClass" backend frontend --glob "!**/*.md"
```

Output MUST be empty.

**Success Criteria:**
- [ ] All mutations renamed to Story 2 naming convention
- [ ] `LeaveProcessResult` type created with both instance IDs
- [ ] `ClassInstanceDetail` exposes `payrollCredited`, `isRescheduled`, `executionState`, `outcome`
- [ ] `resolveDetail` uses localized `notFound` error (no hardcoded strings)
- [ ] Frontend documents updated with new mutation names
- [ ] GraphQL schema generation and codegen run successfully
- [ ] Old mutation names completely removed from codebase
- [ ] All mutation resolvers propagate `ctx.locale` to services

---



### Task F — Frontend: LiveSessionToolbar Component

**Objective:** Create a reusable live session toolbar component with per-button permission wrappers, loading states, and error handling.

**Layer-Specific Rules (Frontend Views - Flattened from frontend/views/AGENTS.md):**
- **Functional Components**: All React components as functional components with hooks
- **Domain Structure**: Group components by domain (e.g., `views/dashboard/classes`)
- **Access Control**: Wrap permission-required components in `<RequirePermission>` with exact permissions from sprint
- **Data Fetching**: Use `useQuery`/`useMutation` from `@apollo/client/react` with `TypedDocumentNode`

**Storybook Rules:**
- **Permission Seeding**: Use `useUserStore.setState()` in stories to test specific permission states
- **Translation Context**: All stories auto-wrapped in `NextIntlClientProvider`
- **Mock Stores**: Use mock stores in `*.stories.tsx`, real stores in production
- **Story Decorators**: Define additional context in `decorators` array

**Target Files:**
- `frontend/views/dashboard/classes/details/components/LiveSessionToolbar.tsx` (NEW)
- `frontend/views/dashboard/classes/details/components/LiveSessionToolbar.stories.tsx` (NEW)

**Detailed Implementation Steps:**

**Step 1:** Create `LiveSessionToolbar` component with props interface

```typescript
// File: frontend/views/dashboard/classes/details/components/LiveSessionToolbar.tsx

import { useTranslations } from "next-intl";
import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import { AppPermission } from "@/shared/lib/enum";
import { Button } from "@/frontend/components/ui/Button";
import { Alert } from "@/frontend/components/ui/Alert";

interface LiveSessionToolbarProps {
  classInstanceId: number;
  executionState: string;
  
  // Mutation handlers from parent container
  onStart: () => void;
  onAbsent: () => void;
  onLeave: (reason: string) => void;
  onReset: () => void;
  
  // Loading states
  isStarting?: boolean;
  isMarkingAbsent?: boolean;
  isProcessingLeave?: boolean;
  isResetting?: boolean;
  
  // Error state
  error?: string;
}

export function LiveSessionToolbar({
  classInstanceId,
  executionState,
  onStart,
  onAbsent,
  onLeave,
  onReset,
  isStarting = false,
  isMarkingAbsent = false,
  isProcessingLeave = false,
  isResetting = false,
  error,
}: LiveSessionToolbarProps) {
  const t = useTranslations("dashboard.classDetails.liveSession");
  
  // Only show toolbar when session is ACTIVATED or RUNNING
  if (executionState !== "ACTIVATED" && executionState !== "RUNNING") {
    return null;
  }
  
  const isAnyLoading = isStarting || isMarkingAbsent || isProcessingLeave || isResetting;
  
  return (
    <div className="live-session-toolbar">
      {error && (
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
      )}
      
      <div className="flex gap-2">
        {/* Start button - only visible when ACTIVATED */}
        {executionState === "ACTIVATED" && (
          <RequirePermission permissions={[AppPermission.SESSION_UPDATE_STATUS_START]}>
            <Button
              onClick={onStart}
              disabled={isAnyLoading}
              loading={isStarting}
              variant="primary"
            >
              {t("startButton")}
            </Button>
          </RequirePermission>
        )}
        
        {/* Absent button - only after waiting period (enforced by backend) */}
        {executionState === "ACTIVATED" && (
          <RequirePermission permissions={[AppPermission.SESSION_UPDATE_STATUS_ABSENT]}>
            <Button
              onClick={onAbsent}
              disabled={isAnyLoading}
              loading={isMarkingAbsent}
              variant="warning"
            >
              {t("absentButton")}
            </Button>
          </RequirePermission>
        )}
        
        {/* Leave button - triggers dialog for reason input */}
        {executionState === "ACTIVATED" && (
          <RequirePermission permissions={[AppPermission.SESSION_UPDATE_STATUS_LEAVE]}>
            <Button
              onClick={() => {
                const reason = prompt(t("leaveReasonPrompt"));
                if (reason) onLeave(reason);
              }}
              disabled={isAnyLoading}
              loading={isProcessingLeave}
              variant="secondary"
            >
              {t("leaveButton")}
            </Button>
          </RequirePermission>
        )}
        
        {/* Reset button - admin only, destructive action */}
        <RequirePermission permissions={[AppPermission.SESSION_RESET]}>
          <Button
            onClick={() => {
              if (confirm(t("resetConfirmation"))) {
                onReset();
              }
            }}
            disabled={isAnyLoading}
            loading={isResetting}
            variant="danger"
          >
            {t("resetButton")}
          </Button>
        </RequirePermission>
      </div>
    </div>
  );
}
```

**Step 2:** Create Storybook story with permission state testing

```typescript
// File: frontend/views/dashboard/classes/details/components/LiveSessionToolbar.stories.tsx

import type { Meta, StoryObj } from "@storybook/react";
import { LiveSessionToolbar } from "./LiveSessionToolbar";
import { useUserStore } from "@/frontend/stores/userStore";
import { AppPermission } from "@/shared/lib/enum";

const meta: Meta<typeof LiveSessionToolbar> = {
  title: "Dashboard/Classes/LiveSessionToolbar",
  component: LiveSessionToolbar,
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof LiveSessionToolbar>;

export const TeacherView: Story = {
  args: {
    classInstanceId: 1,
    executionState: "ACTIVATED",
    onStart: () => console.log("Start clicked"),
    onAbsent: () => console.log("Absent clicked"),
    onLeave: (reason) => console.log("Leave clicked:", reason),
    onReset: () => console.log("Reset clicked"),
  },
  decorators: [
    (Story) => {
      // Seed teacher permissions (NO reset)
      useUserStore.setState({
        permissions: [
          AppPermission.SESSION_UPDATE_STATUS_START,
          AppPermission.SESSION_UPDATE_STATUS_ABSENT,
          AppPermission.SESSION_UPDATE_STATUS_LEAVE,
        ],
      });
      return <Story />;
    },
  ],
};

export const AdminView: Story = {
  args: {
    classInstanceId: 1,
    executionState: "ACTIVATED",
    onStart: () => console.log("Start clicked"),
    onAbsent: () => console.log("Absent clicked"),
    onLeave: (reason) => console.log("Leave clicked:", reason),
    onReset: () => console.log("Reset clicked"),
  },
  decorators: [
    (Story) => {
      // Seed admin permissions (includes reset)
      useUserStore.setState({
        permissions: [
          AppPermission.SESSION_UPDATE_STATUS_START,
          AppPermission.SESSION_UPDATE_STATUS_ABSENT,
          AppPermission.SESSION_UPDATE_STATUS_LEAVE,
          AppPermission.SESSION_RESET,
        ],
      });
      return <Story />;
    },
  ],
};

export const WithError: Story = {
  args: {
    classInstanceId: 1,
    executionState: "ACTIVATED",
    error: "Waiting period has not elapsed. Please wait 15 more minutes.",
    onStart: () => {},
    onAbsent: () => {},
    onLeave: () => {},
    onReset: () => {},
  },
  decorators: [
    (Story) => {
      useUserStore.setState({
        permissions: [AppPermission.SESSION_UPDATE_STATUS_ABSENT],
      });
      return <Story />;
    },
  ],
};

export const LoadingState: Story = {
  args: {
    classInstanceId: 1,
    executionState: "ACTIVATED",
    isStarting: true,
    onStart: () => {},
    onAbsent: () => {},
    onLeave: () => {},
    onReset: () => {},
  },
  decorators: [
    (Story) => {
      useUserStore.setState({
        permissions: [AppPermission.SESSION_UPDATE_STATUS_START],
      });
      return <Story />;
    },
  ],
};

export const RunningState: Story = {
  args: {
    classInstanceId: 1,
    executionState: "RUNNING",
    onStart: () => {},
    onAbsent: () => {},
    onLeave: () => {},
    onReset: () => {},
  },
  decorators: [
    (Story) => {
      useUserStore.setState({
        permissions: [AppPermission.SESSION_RESET],
      });
      return <Story />;
    },
  ],
};
```

**Success Criteria:**
- [ ] `LiveSessionToolbar` component created with props interface
- [ ] Per-button `RequirePermission` wrappers with exact Story 2 permissions
- [ ] Toolbar only visible when `executionState IN ('ACTIVATED', 'RUNNING')`
- [ ] All buttons disabled while any mutation loading
- [ ] Error alert displayed when `error` prop provided
- [ ] Storybook stories cover Teacher, Admin, Error, Loading, and Running states
- [ ] NO logger-only handlers (all real handlers passed from parent)

---

### Task G — Class Details Page: Full Wiring (Zero Stubs)

**Objective:** Wire all Story 2 mutations in class details container and views, replace ALL logger-only handlers with real implementations, and integrate `LiveSessionToolbar`.

**Layer-Specific Rules (Frontend Views - Flattened):**
- **Data Fetching**: Use `useQuery`/`useMutation` with `TypedDocumentNode` from generated documents
- **NO Lazy Queries**: Use `useQuery` with `skip` option, never `useLazyQuery`
- **Access Control**: Wrap components in `<RequirePermission>` with sprint-specific permissions
- **Mock Data Ban**: NO mock data in production views (only in `*.stories.tsx`)

**Target Files:**
- `frontend/views/dashboard/classes/details/ClassDetailsContainer.tsx` (wire mutations, replace stubs)
- `frontend/views/dashboard/classes/details/admin/ClassDetailsAdminView.tsx` (add toolbar)
- `frontend/views/dashboard/classes/details/teacher/ClassDetailsTeacherView.tsx` (add toolbar)
- `frontend/views/dashboard/classes/details/teacher/ActionsPanel.tsx` (update actions)
- `frontend/views/dashboard/classes/details/ClassDetailsContainer.stories.tsx` (mock handlers)

**Detailed Implementation Steps:**

**Step 1:** Wire all Story 2 mutations in ClassDetailsContainer

```typescript
// File: frontend/views/dashboard/classes/details/ClassDetailsContainer.tsx

import { useMutation, useApolloClient } from "@apollo/client/react";
import {
  updateSessionStatusStartMutationDocument,
  updateSessionStatusAbsentMutationDocument,
  updateSessionStatusLeaveMutationDocument,
  resetClassMutationDocument,
  classInstanceQueryDocument,
  classStatusEventsQueryDocument,
} from "@/frontend/graphql/sharedDocuments/class-session.documents";

export function ClassDetailsContainer({ classInstanceId }: { classInstanceId: number }) {
  const client = useApolloClient();
  const [error, setError] = useState<string | null>(null);
  
  // Wire all mutations with refetch on success
  const [startSession, { loading: isStarting }] = useMutation(
    updateSessionStatusStartMutationDocument,
    {
      onCompleted: () => {
        setError(null);
        // Refetch instance details to update UI
        client.refetchQueries({ include: [classInstanceQueryDocument] });
      },
      onError: (err) => setError(err.message),
    }
  );
  
  const [markAbsent, { loading: isMarkingAbsent }] = useMutation(
    updateSessionStatusAbsentMutationDocument,
    {
      onCompleted: () => {
        setError(null);
        client.refetchQueries({ include: [classInstanceQueryDocument] });
      },
      onError: (err) => setError(err.message),
    }
  );
  
  const [processLeave, { loading: isProcessingLeave }] = useMutation(
    updateSessionStatusLeaveMutationDocument,
    {
      onCompleted: () => {
        setError(null);
        client.refetchQueries({ include: [classInstanceQueryDocument] });
      },
      onError: (err) => setError(err.message),
    }
  );
  
  const [resetSession, { loading: isResetting }] = useMutation(
    resetClassMutationDocument,
    {
      onCompleted: () => {
        setError(null);
        client.refetchQueries({ include: [classInstanceQueryDocument] });
      },
      onError: (err) => setError(err.message),
    }
  );
  
  // REPLACE handleGenerateLog stub with real implementation
  const handleGenerateLog = async () => {
    try {
      const { data } = await client.query({
        query: classStatusEventsQueryDocument,
        variables: { classInstanceId },
      });
      
      if (data?.classStatusEvents) {
        // Download as JSON file
        const blob = new Blob([JSON.stringify(data.classStatusEvents, null, 2)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `class-${classInstanceId}-events.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      setError(err.message);
    }
  };
  
  // REPLACE handleViewProfile stub with real navigation
  const router = useRouter();
  const handleViewProfile = (studentId: number) => {
    router.push(`/${locale}/students/${studentId}/status`);
  };
  
  // REPLACE handleInfoEdit stub with real action
  // Option 1: Navigate to audit page
  const handleInfoEdit = () => {
    router.push(`/${locale}/classes/${classInstanceId}/audit`);
  };
  
  // Option 2: Open remarks dialog (if update mutation exists)
  // const handleInfoEdit = () => {
  //   setRemarksDialogOpen(true);
  // };
  
  // Render view with toolbar and handlers
  return (
    <ClassDetailsAdminView
      instance={instanceData}
      onStart={() => startSession({ variables: { classInstanceId } })}
      onAbsent={() => markAbsent({ variables: { classInstanceId } })}
      onLeave={(reason) => processLeave({ variables: { classInstanceId, leaveReason: reason } })}
      onReset={() => resetSession({ variables: { classInstanceId } })}
      onGenerateLog={handleGenerateLog}
      onViewProfile={handleViewProfile}
      onInfoEdit={handleInfoEdit}
      isStarting={isStarting}
      isMarkingAbsent={isMarkingAbsent}
      isProcessingLeave={isProcessingLeave}
      isResetting={isResetting}
      error={error}
    />
  );
}
```

**Step 2:** Integrate LiveSessionToolbar in admin and teacher views

```typescript
// File: frontend/views/dashboard/classes/details/admin/ClassDetailsAdminView.tsx

import { LiveSessionToolbar } from "../components/LiveSessionToolbar";

export function ClassDetailsAdminView({
  instance,
  onStart,
  onAbsent,
  onLeave,
  onReset,
  onGenerateLog,
  onViewProfile,
  onInfoEdit,
  isStarting,
  isMarkingAbsent,
  isProcessingLeave,
  isResetting,
  error,
}: ClassDetailsAdminViewProps) {
  const t = useTranslations("dashboard.classDetails");
  
  return (
    <div className="class-details-admin">
      <div className="class-details-header">
        <h1>{t("title")}</h1>
        
        {/* Live session toolbar - only shown when ACTIVATED or RUNNING */}
        <LiveSessionToolbar
          classInstanceId={instance.id}
          executionState={instance.executionState}
          onStart={onStart}
          onAbsent={onAbsent}
          onLeave={onLeave}
          onReset={onReset}
          isStarting={isStarting}
          isMarkingAbsent={isMarkingAbsent}
          isProcessingLeave={isProcessingLeave}
          isResetting={isResetting}
          error={error}
        />
      </div>
      
      <div className="class-details-body">
        {/* Instance details, student info, etc. */}
        <button onClick={() => onViewProfile(instance.student.id)}>
          {t("viewStudentProfile")}
        </button>
        
        <button onClick={onInfoEdit}>
          {t("editInfo")}
        </button>
        
        <button onClick={onGenerateLog}>
          {t("generateLog")}
        </button>
      </div>
    </div>
  );
}
```

```typescript
// File: frontend/views/dashboard/classes/details/teacher/ClassDetailsTeacherView.tsx

import { LiveSessionToolbar } from "../components/LiveSessionToolbar";

export function ClassDetailsTeacherView({
  instance,
  onStart,
  onAbsent,
  onLeave,
  isStarting,
  isMarkingAbsent,
  isProcessingLeave,
  error,
}: ClassDetailsTeacherViewProps) {
  const t = useTranslations("dashboard.classDetails");
  
  return (
    <div className="class-details-teacher">
      {/* Live session toolbar - NO reset button (permission-gated) */}
      <LiveSessionToolbar
        classInstanceId={instance.id}
        executionState={instance.executionState}
        onStart={onStart}
        onAbsent={onAbsent}
        onLeave={onLeave}
        onReset={() => {}} // Teacher view doesn't expose reset, but component handles permission gating
        isStarting={isStarting}
        isMarkingAbsent={isMarkingAbsent}
        isProcessingLeave={isProcessingLeave}
        error={error}
      />
      
      {/* Rest of teacher view */}
    </div>
  );
}
```

**Step 3:** Update ActionsPanel to use real mutations

```typescript
// File: frontend/views/dashboard/classes/details/teacher/ActionsPanel.tsx

export function ActionsPanel({
  onStart,
  onAbsent,
  onLeave,
  isLoading,
}: ActionsPanelProps) {
  // Remove all logger.info calls
  // Wire to real mutation handlers passed from container
  
  return (
    <div className="actions-panel">
      <RequirePermission permissions={[AppPermission.SESSION_UPDATE_STATUS_START]}>
        <Button onClick={onStart} disabled={isLoading}>
          Start Session
        </Button>
      </RequirePermission>
      
      <RequirePermission permissions={[AppPermission.SESSION_UPDATE_STATUS_ABSENT]}>
        <Button onClick={onAbsent} disabled={isLoading}>
          Mark Absent
        </Button>
      </RequirePermission>
      
      <RequirePermission permissions={[AppPermission.SESSION_UPDATE_STATUS_LEAVE]}>
        <Button onClick={() => onLeave("Leave reason")} disabled={isLoading}>
          Process Leave
        </Button>
      </RequirePermission>
    </div>
  );
}
```

**Step 4:** Update Storybook story with mock handlers

```typescript
// File: frontend/views/dashboard/classes/details/ClassDetailsContainer.stories.tsx

export const MockClassDetailsContainer: Story = {
  args: {
    classInstanceId: 1,
  },
  decorators: [
    (Story) => {
      // Mock Apollo mutations in Storybook only
      const mockMutations = {
        onStart: () => console.log("Start clicked"),
        onAbsent: () => console.log("Absent clicked"),
        onLeave: (reason: string) => console.log("Leave clicked:", reason),
        onReset: () => console.log("Reset clicked"),
        onGenerateLog: () => console.log("Generate log clicked"),
        onViewProfile: (id: number) => console.log("View profile:", id),
        onInfoEdit: () => console.log("Edit info clicked"),
      };
      
      return <Story {...mockMutations} />;
    },
  ],
};
```

**Step 5:** Verify zero logger-only handlers

```bash
rg "logger\.(info|warn).*handle" frontend/views/dashboard/classes/details --glob "!**/*.stories.tsx"
```

Output MUST be empty (no logger-only handlers in production views).

**Success Criteria:**
- [ ] All Story 2 mutations wired in `ClassDetailsContainer`
- [ ] `handleGenerateLog` replaced with real `classStatusEvents` download
- [ ] `handleViewProfile` replaced with real `router.push` navigation
- [ ] `handleInfoEdit` replaced with real action (navigate or dialog)
- [ ] `LiveSessionToolbar` integrated in admin and teacher views
- [ ] All mutation handlers trigger `refetchQueries` on success
- [ ] Error state displayed via toolbar `error` prop
- [ ] Storybook story uses mock handlers (NOT real Apollo)
- [ ] Zero logger-only handlers in production views

---

### Task H — Teacher Active Dashboard

**Objective:** Update teacher dashboard to use renamed mutations, remove `useLazyQuery`, and wire live session controls.

**Layer-Specific Rules (Frontend Views - Flattened):**
- **NO useLazyQuery**: Use `useQuery` with `skip` option instead
- **Data Fetching**: Import hooks from `@apollo/client/react`
- **Access Control**: Wrap components in `<RequirePermission>`

**Target Files:**
- `frontend/views/dashboard/teachers/dashboard/TeacherDashboardContainer.tsx`
- `frontend/views/dashboard/teachers/dashboard/TeacherActiveSessionControls.tsx`

**Detailed Implementation Steps:**

**Step 1:** Remove `useLazyQuery` and replace with stateful `useQuery`

```typescript
// File: frontend/views/dashboard/teachers/dashboard/TeacherDashboardContainer.tsx

import { useQuery, useMutation } from "@apollo/client/react";

export function TeacherDashboardContainer() {
  const [handbookRequested, setHandbookRequested] = useState(false);
  
  // REMOVE useLazyQuery
  // REPLACE with useQuery + skip option
  const { data: handbookData, loading: handbookLoading } = useQuery(
    teacherHandbookUrlQueryDocument,
    {
      skip: !handbookRequested, // Only fetch when requested
    }
  );
  
  const handleRequestHandbook = () => {
    setHandbookRequested(true);
  };
  
  // Wire renamed mutations
  const [startSession] = useMutation(updateSessionStatusStartMutationDocument);
  const [markAbsent] = useMutation(updateSessionStatusAbsentMutationDocument);
  const [processLeave] = useMutation(updateSessionStatusLeaveMutationDocument);
  
  return (
    <TeacherDashboardView
      onStart={(id) => startSession({ variables: { classInstanceId: id } })}
      onAbsent={(id) => markAbsent({ variables: { classInstanceId: id } })}
      onLeave={(id, reason) => processLeave({ variables: { classInstanceId: id, leaveReason: reason } })}
      onRequestHandbook={handleRequestHandbook}
      handbookUrl={handbookData?.teacherHandbook?.url}
    />
  );
}
```

**Step 2:** Wire TeacherActiveSessionControls with permission wrappers

```typescript
// File: frontend/views/dashboard/teachers/dashboard/TeacherActiveSessionControls.tsx

import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import { AppPermission } from "@/shared/lib/enum";

export function TeacherActiveSessionControls({
  activeSession,
  onStart,
  onAbsent,
  onLeave,
  isLoading,
}: TeacherActiveSessionControlsProps) {
  if (!activeSession || activeSession.executionState === "COMPLETED") {
    return null;
  }
  
  return (
    <div className="active-session-controls">
      <RequirePermission permissions={[AppPermission.SESSION_UPDATE_STATUS_START]}>
        {activeSession.executionState === "ACTIVATED" && (
          <Button onClick={() => onStart(activeSession.id)} disabled={isLoading}>
            Start Session
          </Button>
        )}
      </RequirePermission>
      
      <RequirePermission permissions={[AppPermission.SESSION_UPDATE_STATUS_ABSENT]}>
        <Button onClick={() => onAbsent(activeSession.id)} disabled={isLoading}>
          Mark Absent
        </Button>
      </RequirePermission>
      
      <RequirePermission permissions={[AppPermission.SESSION_UPDATE_STATUS_LEAVE]}>
        <Button
          onClick={() => {
            const reason = prompt("Enter leave reason");
            if (reason) onLeave(activeSession.id, reason);
          }}
          disabled={isLoading}
        >
          Process Leave
        </Button>
      </RequirePermission>
    </div>
  );
}
```

**Step 3:** Verify no `useLazyQuery` usage

```bash
rg "useLazyQuery" frontend/views/dashboard/teachers
```

Output MUST be empty.

**Success Criteria:**
- [ ] `useLazyQuery` removed and replaced with `useQuery` + `skip`
- [ ] All mutations renamed to Story 2 naming
- [ ] `TeacherActiveSessionControls` wrapped with per-permission `RequirePermission`
- [ ] `refetch()` called after each mutation
- [ ] No logger-only click handlers

---



### Task I — i18n: Translation Keys

**Objective:** Add all Story 2 translation keys for UI labels, error messages, and system remarks in both Arabic and English.

**Target Files:**
- `frontend/locales/ar/dashboard.json` (UI labels)
- `frontend/locales/en/dashboard.json` (UI labels)
- `backend/locales/ar/session.json` (system remarks)
- `backend/locales/en/session.json` (system remarks)
- `backend/locales/ar/errors.json` (error messages)
- `backend/locales/en/errors.json` (error messages)

**Translation Keys Required:**

**Dashboard UI (frontend/locales/*/dashboard.json):**
```json
{
  "classDetails": {
    "liveSession": {
      "startButton": "Start Session / بدء الجلسة",
      "absentButton": "Mark Absent / تسجيل غياب",
      "leaveButton": "Process Leave / معالجة إجازة",
      "resetButton": "Reset Session / إعادة تعيين الجلسة",
      "leaveReasonPrompt": "Enter leave reason / أدخل سبب الإجازة",
      "resetConfirmation": "Are you sure you want to reset this session? All data will be cleared. / هل أنت متأكد من إعادة تعيين هذه الجلسة؟ سيتم حذف جميع البيانات."
    },
    "viewStudentProfile": "View Student Profile / عرض ملف الطالب",
    "editInfo": "Edit Information / تعديل المعلومات",
    "generateLog": "Generate Log / إنشاء سجل"
  }
}
```

**Session Remarks (backend/locales/*/session.json):**
```json
{
  "absentWaitingRemark": "I have been waiting for whole class time. / لقد انتظرت طوال وقت الحصة.",
  "leaveRescheduledRemark": "Leave approved - session rescheduled. / تمت الموافقة على الإجازة - تم إعادة جدولة الجلسة.",
  "resetDescription": "Session reset by administrator. / تم إعادة تعيين الجلسة من قبل المسؤول.",
  "absentEventDescription": "Student marked as absent after waiting period. / تم تسجيل غياب الطالب بعد فترة الانتظار.",
  "leaveProcessedDescription": "Leave request processed, rescheduled to instance {{successorId}}. / تمت معالجة طلب الإجازة، أعيدت جدولته إلى الجلسة {{successorId}}."
}
```

**Error Messages (backend/locales/*/errors.json):**
```json
{
  "notFound": "Resource not found. / المورد غير موجود.",
  "unauthorizedAction": "You are not authorized to perform this action. / ليس لديك صلاحية لتنفيذ هذا الإجراء.",
  "insufficientPermissions": "Insufficient permissions. / صلاحيات غير كافية.",
  "invalidTransition": "Invalid state transition. / انتقال حالة غير صالح.",
  "sessionNotActivated": "Session must be activated before performing this action. / يجب تفعيل الجلسة قبل تنفيذ هذا الإجراء.",
  "absentTooEarly": "Cannot mark absent yet. Please wait {{waitingMinutes}} minutes from scheduled start time. / لا يمكن تسجيل الغياب بعد. يرجى الانتظار {{waitingMinutes}} دقيقة من وقت البدء المجدول."
}
```

**Implementation Steps:**

**Step 1:** Add keys to all locale files (ar and en)

**Step 2:** Verify keys are used in code

```bash
rg "t\(\"absentWaitingRemark\"|t\(\"sessionNotActivated\"|t\(\"absentTooEarly\"" backend frontend
```

**Step 3:** Run TypeScript compilation to catch missing translation keys

```bash
~/.bun/bin/bun tsgo
```

**Success Criteria:**
- [ ] All Story 2 UI labels added to `dashboard.json` (ar + en)
- [ ] All system remarks added to `session.json` (ar + en)
- [ ] All error messages added to `errors.json` (ar + en)
- [ ] Translation keys match usage in code
- [ ] TypeScript compilation passes

---

### Task J — Permission Sweep: Remove Deprecated Keys

**Objective:** Grep entire codebase for deprecated Story 1 permission strings and replace with Story 2 keys, then verify TypeScript compilation.

**Target:** All files in `backend`, `frontend`, `shared`

**Deprecated Keys to Remove:**
- `session.force_activate` → `session.activate_override`
- `session.start` → `session.update_status.start`
- `session.mark_absent` → `session.update_status.absent`
- `session.request_leave` → `session.update_status.leave`
- `session.admin_leave` → `session.update_status.leave`
- `session.revert` → `session.reset`

**Implementation Steps:**

**Step 1:** Search for deprecated permission strings

```bash
rg "session\.force_activate|SESSION_FORCE_ACTIVATE" backend frontend shared --glob "!**/*.md"
rg "session\.start|SESSION_START" backend frontend shared --glob "!**/*.md" --glob "!**/system-settings.ts"
rg "session\.mark_absent|SESSION_MARK_ABSENT" backend frontend shared --glob "!**/*.md"
rg "session\.request_leave|SESSION_REQUEST_LEAVE" backend frontend shared --glob "!**/*.md"
rg "session\.admin_leave|SESSION_ADMIN_LEAVE" backend frontend shared --glob "!**/*.md"
rg "session\.revert|SESSION_REVERT" backend frontend shared --glob "!**/*.md"
```

**Step 2:** Replace all occurrences with Story 2 keys

**Step 3:** Verify enum values updated

```typescript
// shared/lib/enum.ts - verify these are REMOVED:
// SESSION_FORCE_ACTIVATE
// SESSION_START (careful - don't break system settings keys)
// SESSION_MARK_ABSENT
// SESSION_REQUEST_LEAVE
// SESSION_ADMIN_LEAVE
// SESSION_REVERT

// And these are PRESENT:
// SESSION_ACTIVATE_OVERRIDE
// SESSION_RESET
// SESSION_UPDATE_STATUS_START
// SESSION_UPDATE_STATUS_ABSENT
// SESSION_UPDATE_STATUS_LEAVE
```

**Step 4:** Run TypeScript compilation

```bash
~/.bun/bin/bun tsgo
```

**Success Criteria:**
- [ ] All deprecated permission strings removed from codebase
- [ ] All references updated to Story 2 keys
- [ ] TypeScript compilation passes with zero errors
- [ ] Grep for deprecated strings returns empty

---

### Task K — Repository Tests: 100% Coverage

**Objective:** Achieve 100% line and function coverage on all new/modified repository methods with comprehensive test cases.

**Layer-Specific Rules (Repository Testing):**
- **Coverage**: 100% line + function coverage mandatory per `backend/db/test/AGENTS.md`
- **Test Organization**: Group by method, test happy path + error cases + edge cases
- **Database State**: Use test fixtures to create consistent starting state
- **Assertions**: Verify database state changes, not just return values

**Target File:**
- `backend/db/test/repo/scheduling.repository.test.ts`

**Test Cases Required:**

**resetClassInstance:**
- [ ] Clears all session data (executionState, outcome, timestamps, remarks, payroll)
- [ ] Restores quota when quotaDeducted was true
- [ ] Does NOT restore quota when quotaDeducted was false
- [ ] Creates audit event with localized resetDescription
- [ ] Throws notFound error when instance doesn't exist
- [ ] Works with ACTIVATED, RUNNING, and COMPLETED states

**markClassAbsent:**
- [ ] Sets payrollCredited to true
- [ ] Injects localized system remark
- [ ] Transitions to COMPLETED with outcome=ABSENT
- [ ] Creates audit event with MARKED_ABSENT type
- [ ] Throws notFound error when instance doesn't exist
- [ ] Only works from ACTIVATED state (guards tested in Task S1)

**processClassLeave:**
- [ ] Creates successor instance with rescheduled date
- [ ] Marks original as rescheduled with outcome=LEAVE
- [ ] Successor has same teacher, student, subject
- [ ] Successor has NOT_ACTIVATED state and PENDING outcome
- [ ] Fails when student has no quota remaining
- [ ] Uses system setting for reschedule offset days
- [ ] Falls back to 7 days when setting not present
- [ ] Creates audit event with successorId reference

**runStateChange (COMPLETED guard update):**
- [ ] Allows ACTIVATED → COMPLETED with outcome=ABSENT
- [ ] Allows ACTIVATED → COMPLETED with outcome=LEAVE
- [ ] Blocks ACTIVATED → COMPLETED with outcome=TAKEN
- [ ] Allows RUNNING → COMPLETED with any outcome
- [ ] Existing transitions still work (NOT_ACTIVATED → ACTIVATED, etc.)

**IDOR protection (from Task S0):**
- [ ] Teacher cannot mutate another teacher's instance
- [ ] Parent cannot mutate another student's instance
- [ ] Academy admin CAN mutate any instance
- [ ] Admin with SESSION_RESET can reset any instance

**Implementation:**

```bash
~/.bun/bin/bun run test:coverage backend/db/test/repo/scheduling.repository.test.ts
```

Expected output:
```
File                          | % Stmts | % Branch | % Funcs | % Lines
------------------------------|---------|----------|---------|--------
scheduling.repository.ts      |   100   |   100    |   100   |   100
```

**Success Criteria:**
- [ ] All test cases pass
- [ ] 100% statement coverage
- [ ] 100% branch coverage
- [ ] 100% function coverage
- [ ] 100% line coverage
- [ ] Tests use localized assertions (check for translated error keys)

---

### Task L — GraphQL Integration Tests

**Objective:** Add comprehensive integration tests for all Story 2 mutations covering happy paths, error cases, and security boundaries.

**Layer-Specific Rules (GraphQL Testing - Flattened from frontend/graphql/test/AGENTS.md):**
- **Server Lifecycle**: Use `setupTestServerLifecycle()` helper at describe block root
- **Apollo Client**: Use shared `testClient` from `testClient.ts`
- **Type Safety**: Use `TypedDocumentNode` from generated documents, never raw strings
- **Dynamic Headers**: Change locale/auth via `context: { headers: {...} }` on per-query basis
- **Error Handling**: Check `result.error` (type `ApolloError | undefined`), not `result.errors`
- **Null Checks**: Verify `result.data?.field` is defined before assertions
- **Shared Helpers**: Use `loginDemoUser()` and `fetchFirstStudentTeacherPair()` from `helpers.ts`
- **No Repository Imports**: Test ONLY via GraphQL API, never import backend repos/services directly

**Target File:**
- `frontend/graphql/test/class-session.test.ts`

**Test Cases Required:**

```typescript
// File: frontend/graphql/test/class-session.test.ts

import { describe, it, expect } from "bun:test";
import { setupTestServerLifecycle } from "./lifecycle";
import { testClient } from "./testClient";
import { loginDemoUser, fetchFirstStudentTeacherPair } from "./helpers";
import {
  activateOverrideClassMutationDocument,
  updateSessionStatusStartMutationDocument,
  updateSessionStatusAbsentMutationDocument,
  updateSessionStatusLeaveMutationDocument,
  resetClassMutationDocument,
} from "@/frontend/graphql/sharedDocuments/class-session.documents";

describe("Story 2: Live Session Lifecycle", () => {
  setupTestServerLifecycle();

  describe("activateOverrideClass", () => {
    it("allows admin to activate outside time window", async () => {
      const adminToken = await loginDemoUser("academy-admin");
      const { classInstanceId } = await fetchFirstStudentTeacherPair(adminToken, new Date());

      const result = await testClient.mutate({
        mutation: activateOverrideClassMutationDocument,
        variables: { classInstanceId },
        context: { headers: { Authorization: `Bearer ${adminToken}` } },
      });

      expect(result.error).toBeUndefined();
      expect(result.data?.activateOverrideClass?.executionState).toBe("ACTIVATED");
    });

    it("rejects teacher without SESSION_ACTIVATE_OVERRIDE permission", async () => {
      const teacherToken = await loginDemoUser("teacher");
      const { classInstanceId } = await fetchFirstStudentTeacherPair(teacherToken, new Date());

      const result = await testClient.mutate({
        mutation: activateOverrideClassMutationDocument,
        variables: { classInstanceId },
        context: { headers: { Authorization: `Bearer ${teacherToken}` } },
      });

      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain("insufficientPermissions");
    });
  });

  describe("updateSessionStatusStart", () => {
    it("transitions ACTIVATED → RUNNING with actualStartAt timestamp", async () => {
      const teacherToken = await loginDemoUser("teacher");
      const { classInstanceId } = await activateClass(teacherToken); // Helper to activate first

      const result = await testClient.mutate({
        mutation: updateSessionStatusStartMutationDocument,
        variables: { classInstanceId },
        context: { headers: { Authorization: `Bearer ${teacherToken}` } },
      });

      expect(result.error).toBeUndefined();
      expect(result.data?.updateSessionStatusStart?.executionState).toBe("RUNNING");
      expect(result.data?.updateSessionStatusStart?.actualStartAt).toBeDefined();
    });

    it("rejects when session not activated", async () => {
      const teacherToken = await loginDemoUser("teacher");
      const { classInstanceId } = await fetchFirstStudentTeacherPair(teacherToken, new Date());

      const result = await testClient.mutate({
        mutation: updateSessionStatusStartMutationDocument,
        variables: { classInstanceId },
        context: { headers: { Authorization: `Bearer ${teacherToken}` } },
      });

      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain("sessionNotActivated");
    });
  });

  describe("updateSessionStatusAbsent", () => {
    it("marks student absent with payrollCredited flag and system remark", async () => {
      const teacherToken = await loginDemoUser("teacher");
      const { classInstanceId } = await activateAndWait(teacherToken, 31); // Wait 31 minutes

      const result = await testClient.mutate({
        mutation: updateSessionStatusAbsentMutationDocument,
        variables: { classInstanceId },
        context: { headers: { Authorization: `Bearer ${teacherToken}` } },
      });

      expect(result.error).toBeUndefined();
      expect(result.data?.updateSessionStatusAbsent?.executionState).toBe("COMPLETED");
      expect(result.data?.updateSessionStatusAbsent?.outcome).toBe("ABSENT");
      expect(result.data?.updateSessionStatusAbsent?.payrollCredited).toBe(true);
      expect(result.data?.updateSessionStatusAbsent?.remarksBySystem).toContain("waiting");
    });

    it("rejects when waiting period not elapsed", async () => {
      const teacherToken = await loginDemoUser("teacher");
      const { classInstanceId } = await activateClass(teacherToken); // Just activated

      const result = await testClient.mutate({
        mutation: updateSessionStatusAbsentMutationDocument,
        variables: { classInstanceId },
        context: { headers: { Authorization: `Bearer ${teacherToken}` } },
      });

      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain("absentTooEarly");
    });
  });

  describe("updateSessionStatusLeave", () => {
    it("processes leave with rescheduled successor instance", async () => {
      const teacherToken = await loginDemoUser("teacher");
      const { classInstanceId } = await activateClass(teacherToken);

      const result = await testClient.mutate({
        mutation: updateSessionStatusLeaveMutationDocument,
        variables: { classInstanceId, leaveReason: "Family emergency" },
        context: { headers: { Authorization: `Bearer ${teacherToken}` } },
      });

      expect(result.error).toBeUndefined();
      expect(result.data?.updateSessionStatusLeave?.completedInstanceId).toBe(classInstanceId);
      expect(result.data?.updateSessionStatusLeave?.rescheduledInstanceId).toBeGreaterThan(0);
      
      // Verify original marked as rescheduled
      expect(result.data?.updateSessionStatusLeave?.completedInstance?.isRescheduled).toBe(true);
      expect(result.data?.updateSessionStatusLeave?.completedInstance?.outcome).toBe("LEAVE");
      
      // Verify successor exists with future date
      const successor = result.data?.updateSessionStatusLeave?.rescheduledInstance;
      if (!successor) throw new Error("Successor instance not returned");
      
      expect(new Date(successor.scheduledStartAt).getTime()).toBeGreaterThan(Date.now());
    });

    it("fails when student has no quota remaining", async () => {
      const teacherToken = await loginDemoUser("teacher");
      const { classInstanceId } = await activateClassWithZeroQuota(teacherToken);

      const result = await testClient.mutate({
        mutation: updateSessionStatusLeaveMutationDocument,
        variables: { classInstanceId, leaveReason: "Emergency" },
        context: { headers: { Authorization: `Bearer ${teacherToken}` } },
      });

      expect(result.error).toBeDefined();
      // Check for quota-related error message
    });
  });

  describe("resetClass", () => {
    it("allows admin to reset completed session", async () => {
      const adminToken = await loginDemoUser("academy-admin");
      const { classInstanceId } = await completeClassSession(adminToken);

      const result = await testClient.mutate({
        mutation: resetClassMutationDocument,
        variables: { classInstanceId },
        context: { headers: { Authorization: `Bearer ${adminToken}` } },
      });

      expect(result.error).toBeUndefined();
      
      // Verify reset cleared data (query instance again)
      const instanceQuery = await testClient.query({
        query: classInstanceQueryDocument,
        variables: { classInstanceId },
        context: { headers: { Authorization: `Bearer ${adminToken}` } },
      });
      
      expect(instanceQuery.data?.classInstance?.executionState).toBe("NOT_ACTIVATED");
      expect(instanceQuery.data?.classInstance?.outcome).toBe("PENDING");
      expect(instanceQuery.data?.classInstance?.payrollCredited).toBe(false);
    });

    it("rejects teacher without SESSION_RESET permission", async () => {
      const teacherToken = await loginDemoUser("teacher");
      const { classInstanceId } = await completeClassSession(teacherToken);

      const result = await testClient.mutate({
        mutation: resetClassMutationDocument,
        variables: { classInstanceId },
        context: { headers: { Authorization: `Bearer ${teacherToken}` } },
      });

      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain("insufficientPermissions");
    });
  });

  describe("IDOR Protection", () => {
    it("prevents teacher from resetting another teacher's class", async () => {
      const teacherAToken = await loginDemoUser("teacher");
      const teacherBToken = await loginDemoUser("teacher-b");
      const { classInstanceId } = await activateClass(teacherBToken);

      const result = await testClient.mutate({
        mutation: resetClassMutationDocument,
        variables: { classInstanceId },
        context: { headers: { Authorization: `Bearer ${teacherAToken}` } },
      });

      expect(result.error).toBeDefined();
      expect(result.error?.message).toContain("unauthorizedAction");
    });
  });
});
```

**Implementation:**

```bash
~/.bun/bin/bun test frontend/graphql/test/class-session.test.ts
```

**Success Criteria:**
- [ ] All integration tests pass
- [ ] `activateOverrideClass` tested (admin succeeds, teacher fails)
- [ ] `updateSessionStatusStart` tested (RUNNING transition + timestamp)
- [ ] `updateSessionStatusAbsent` tested (payroll flag + waiting period)
- [ ] `updateSessionStatusLeave` tested (successor instance created)
- [ ] `resetClass` tested (admin succeeds, teacher fails)
- [ ] IDOR protection verified (cross-teacher access blocked)
- [ ] Tests use `TypedDocumentNode` (no raw strings)
- [ ] Tests use shared helpers (`loginDemoUser`, etc.)

---

### Task M — Security Regression Suite

**Objective:** Add Story 2-specific test cases to the security logic test suite to ensure all threat mitigations are covered.

**Target File:**
- `backend/db/test/logic/class_instances_security.test.ts`

**Test Cases Required:**

```typescript
// File: backend/db/test/logic/class_instances_security.test.ts

describe("Story 2: State Transition Security", () => {
  it("allows ACTIVATED → COMPLETED with outcome=ABSENT", async () => {
    const instance = await createActivatedInstance();
    
    await expect(
      db.update(classInstances)
        .set({ executionState: "COMPLETED", outcome: "ABSENT" })
        .where(eq(classInstances.id, instance.id))
    ).resolves.toBeDefined();
  });

  it("allows ACTIVATED → COMPLETED with outcome=LEAVE", async () => {
    const instance = await createActivatedInstance();
    
    await expect(
      db.update(classInstances)
        .set({ executionState: "COMPLETED", outcome: "LEAVE" })
        .where(eq(classInstances.id, instance.id))
    ).resolves.toBeDefined();
  });

  it("blocks ACTIVATED → COMPLETED with outcome=TAKEN", async () => {
    const instance = await createActivatedInstance();
    
    await expect(
      db.update(classInstances)
        .set({ executionState: "COMPLETED", outcome: "TAKEN" })
        .where(eq(classInstances.id, instance.id))
    ).rejects.toThrow("Invalid transition");
  });

  it("allows reset transition (COMPLETED → NOT_ACTIVATED)", async () => {
    const instance = await createCompletedInstance();
    
    await expect(
      db.update(classInstances)
        .set({ executionState: "NOT_ACTIVATED", outcome: "PENDING" })
        .where(eq(classInstances.id, instance.id))
    ).resolves.toBeDefined();
  });

  it("allows reset from ACTIVATED state", async () => {
    const instance = await createActivatedInstance();
    
    await expect(
      db.update(classInstances)
        .set({ executionState: "NOT_ACTIVATED", outcome: "PENDING" })
        .where(eq(classInstances.id, instance.id))
    ).resolves.toBeDefined();
  });

  it("allows reset from RUNNING state", async () => {
    const instance = await createRunningInstance();
    
    await expect(
      db.update(classInstances)
        .set({ executionState: "NOT_ACTIVATED", outcome: "PENDING" })
        .where(eq(classInstances.id, instance.id))
    ).resolves.toBeDefined();
  });
});
```

**Implementation:**

```bash
~/.bun/bin/bun test backend/db/test/logic/class_instances_security.test.ts
```

**Success Criteria:**
- [ ] All Story 2 state transition tests pass
- [ ] Database trigger correctly enforces outcome-specific transitions
- [ ] Reset transitions work from all states
- [ ] Invalid transitions blocked with descriptive error

---

## Section 7: Strict Verification & Integrity Protocol

Run these commands in sequence before declaring Story 2 complete:

```bash
# 0. Completeness gate (MUST be empty)
rg -i "TODO|FIXME|not implemented|placeholder|for now" backend frontend shared --glob "!**/*.md" --glob "!**/generated/**"

# 1. Schema & seeds
~/.bun/bin/bun db cleanGenerate
~/.bun/bin/bun run db seed

# 2. GraphQL codegen
~/.bun/bin/bun run generate:gqlSchema
~/.bun/bin/bun codegen

# 3. Security & repo tests
~/.bun/bin/bun test backend/db/test/logic/class_instances_security.test.ts
~/.bun/bin/bun run test:coverage backend/db/test/repo/scheduling.repository.test.ts

# 4. GraphQL integration tests
~/.bun/bin/bun test frontend/graphql/test/class-session.test.ts

# 5. TypeScript & lint
~/.bun/bin/bun tsgo
~/.bun/bin/bun run lint

# 6. Quality gate (if exists)
~/.bun/bin/bun quality-gate
```

### Manual Smoke Checklist

- [ ] Admin `activateOverride` bypasses time window; teacher `activate` still blocked
- [ ] Live toolbar appears only when `ACTIVATED` or `RUNNING`
- [ ] Start button transitions to `RUNNING` + captures `actualStartAt` timestamp
- [ ] Absent button sets `payrollCredited=true` + injects localized system remark
- [ ] Leave button creates rescheduled successor instance with future date
- [ ] Reset button (admin-only) clears all session data and restores quota
- [ ] Teacher cannot see or use reset button (permission-gated)
- [ ] Teacher cannot mutate another teacher's session (IDOR protection)
- [ ] Generate Log downloads JSON file with `classStatusEvents` data
- [ ] View Profile navigates to student status page
- [ ] Edit Info navigates to audit page or opens remarks dialog
- [ ] **Zero** logger-only handlers in production views
- [ ] **Zero** TODO/FIXME/stub patterns in touched files
- [ ] All mutations return `ClassInstanceDetail` with non-null `id` field
- [ ] Apollo cache automatically updates after mutations (no manual refetch needed in most cases)

---

## Section 8: Appendix A — Threat → Implementation Map

| **Threat** | **Story 2 Touch Point** | **Task** | **Verification** |
|---|---|---|---|
| IDOR scoping | All state-changing mutations | S0 | Teacher cross-access blocked, admin bypass works |
| Timezone off-by-one | Absent waiting period calculation | D | Uses millisecond arithmetic, not date truncation |
| State machine bypass | Absent/leave/reset transitions | S1, C | DB trigger + repo guard + service assertion aligned |
| Student quota | Reset + leave reschedule | C | Reset restores quota; leave validates before reschedule |
| Separation of duties | Reset admin-only enforcement | B, D, L | Teacher reset rejected; admin succeeds |
| Payroll integrity | Absent flag setting | A, C, K | Only `markClassAbsent` sets flag; reset clears it |
| Reschedule completeness | Leave workflow | C, E, L | Successor instance created via `rescheduleClassInstance` |

---

## Section 9: Appendix B — Known Story 1 Stubs Eliminated

| **Location** | **Old Stub** | **Story 2 Implementation** |
|---|---|---|
| `ClassDetailsContainer.handleGenerateLog` | `logger.info("Generate log")` | Download JSON from `classStatusEvents` query |
| `ClassDetailsContainer.handleInfoEdit` | `logger.info("Edit info")` | Navigate to `/classes/[id]/audit` or open remarks dialog |
| `ClassDetailsContainer.handleViewProfile` | `logger.info("View profile")` | `router.push(\`/students/\${id}/status\`)` |
| `class-session.utils.resolveDetail` | `throw new Error("Not found")` | Localized `errors.notFound` via `getBackendTranslations` |
| `requestClassLeave` leave path | Sets `outcome` only | Full `rescheduleClassInstance` call in transaction |
| `runStateChange` admin bypass | Missing | Privileged actor check at method start (Task S0) |
| `TeacherDashboard` handbook | `useLazyQuery` | `useQuery` with `skip` option |

---

## Section 10: Appendix C — Decisions Log

| **Decision** | **Resolution** |
|---|---|
| Security baseline | Sprint 1 threat doc is mandatory prerequisite; all protections extended |
| ACTIVATED → COMPLETED | Allowed only for ABSENT/LEAVE; DB trigger + repo + service aligned |
| Leave reschedule | Mandatory successor instance via `rescheduleClassInstance` in same transaction |
| Incomplete code policy | Zero tolerance — no TODOs, no logger stubs, no stub throws allowed |
| Admin IDOR bypass | Privileged permission check bypasses teacher/parent relationship scoping |
| `useLazyQuery` ban | Removed from teacher dashboard; replaced with stateful `useQuery` + `skip` |
| Logger-only handlers | All eliminated; every UI action has real GraphQL mutation + backend logic |
| Permission naming | Story 2 uses dot-notation hierarchy (`update_status.start`, `update_status.absent`) |
| Localization | All user-facing strings (errors, remarks, UI labels) via `getBackendTranslations` |
| GraphQL cache | All mutations return objects with non-null `id` for Apollo auto-cache updates |

---

## Section 11: Task Execution Order & Dependencies

```
Blocking Prerequisites (verify first):
├─ Story 1 security remediation complete
└─ All Story 1 artifacts deployed (RLS, trigger, tests)

Phase 1: Security & Database (blocking for all others)
├─ Task S0: Admin IDOR bypass ← BLOCKING
├─ Task S1: State trigger migration ← BLOCKING
└─ Task A: Schema changes (payrollCredited, settings)

Phase 2: Permissions & Backend Logic
├─ Task B: Permission enum/catalog/seeds
├─ Task C: Repository methods (reset, absent, leave)
└─ Task D: Service layer (permissions, rules)

Phase 3: GraphQL & Type Generation
├─ Task E: GraphQL mutations + codegen
└─ Task I: i18n translation keys

Phase 4: Frontend Integration
├─ Task F: LiveSessionToolbar component
├─ Task G: Class details page wiring
└─ Task H: Teacher dashboard wiring

Phase 5: Testing & Verification
├─ Task J: Permission sweep
├─ Task K: Repository tests (100% coverage)
├─ Task L: GraphQL integration tests
└─ Task M: Security regression suite

Final: Section 7 verification protocol + manual smoke testing
```

---

**END OF ENHANCED PLAN**

**Next Steps:**
1. Review this enhanced plan for completeness
2. Obtain approval from technical lead / product owner
3. Execute tasks in dependency order
4. Run verification protocol after each phase
5. Complete manual smoke checklist before declaring Story 2 done
