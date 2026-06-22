## Section 3: State Machine & Threat Alignment

Story 10 involves two distinct automated workflows triggered by student status changes. This section visualizes the state machines for student status transitions and the resulting class instance state changes.

---

### 3.1 Student Status State Machine

The DB trigger `fn_enforce_student_status_transition` in `student_status_transition_trigger.sql` enforces the following allowed transitions (verified from actual file read):

```mermaid
stateDiagram-v2
    [*] --> ON_TRIAL : Student created (initial state)

    ON_TRIAL --> REGULAR : Trial period approved
    ON_TRIAL --> DEACTIVATED : Trial rejected / expired

    REGULAR --> SUSPENDED : student.manage_status (admin punitive action)
    REGULAR --> ON_LEAVE : student.manage_status (admin accommodation)
    REGULAR --> DEACTIVATED : student.manage_status (admin termination)
    REGULAR --> GRADUATED : student.manage_status (admin graduation)

    SUSPENDED --> REGULAR : student.manage_status (admin restoration)
    SUSPENDED --> DEACTIVATED : student.manage_status (admin termination)

    ON_LEAVE --> REGULAR : student.manage_status (admin return)
    ON_LEAVE --> DEACTIVATED : student.manage_status (admin termination)

    DEACTIVATED --> [*]
    GRADUATED --> [*]

    note right of SUSPENDED
        Story 10: isFrozen = true set on all future
        NOT_ACTIVATED and ACTIVATED class instances
        by SuspendedLockService.enforceSuspendedLock()
    end note

    note right of ON_LEAVE
        Story 10: future NOT_ACTIVATED classes are
        processed by StudentLeaveProcessingService:
        outcome = LEAVE, isRescheduled = true,
        successor class instance created
    end note

    note right of REGULAR
        Story 10: if coming from SUSPENDED,
        SuspendedLockService.releaseSuspendedLock()
        clears isFrozen = false on all frozen classes
    end note
```

**State Transition Guards:**
- DB trigger `fn_enforce_student_status_transition` enforces allowed state paths at the database level. Any attempt to bypass the service layer and write an invalid transition directly fails at the DB level.
- The trigger uses a whitelist of allowed `(old_status, new_status)` pairs.
- Story 10 does NOT modify this trigger — the allowed transitions are already correct.

---

### 3.2 Class Instance State Machine — Suspension Lock Effect

When a student transitions to `SUSPENDED`, `SuspendedLockService.enforceSuspendedLock()` is called. The following diagram shows how the class instance state changes:

```mermaid
stateDiagram-v2
    state "Class Instance (Normal)" as Normal {
        NOT_ACTIVATED : executionState = NOT_ACTIVATED\nisFrozen = false
        ACTIVATED : executionState = ACTIVATED\nisFrozen = false
        RUNNING : executionState = RUNNING
        COMPLETED : executionState = COMPLETED
    }

    state "Class Instance (After Suspension Lock)" as Locked {
        NOT_ACTIVATED_FROZEN : executionState = NOT_ACTIVATED\nisFrozen = true\n⚠️ Action buttons hidden on teacher UI
        ACTIVATED_FROZEN : executionState = ACTIVATED\nisFrozen = true\n⚠️ Action buttons hidden on teacher UI
    }

    NOT_ACTIVATED --> NOT_ACTIVATED_FROZEN : bulkFreezeStudentClasses()\nstudent transitions to SUSPENDED
    ACTIVATED --> ACTIVATED_FROZEN : bulkFreezeStudentClasses()\nstudent transitions to SUSPENDED

    NOT_ACTIVATED_FROZEN --> NOT_ACTIVATED : bulkUnfreezeStudentClasses()\nstudent returns to REGULAR
    ACTIVATED_FROZEN --> ACTIVATED : bulkUnfreezeStudentClasses()\nstudent returns to REGULAR

    note right of NOT_ACTIVATED_FROZEN
        Teacher sees class in schedule
        with "suspended_pending" badge.
        All action buttons (Activate, Start,
        Absent, Leave) are hidden.
        isFrozen = true is the gate.
    end note

    note right of RUNNING
        RUNNING and COMPLETED classes are
        NOT affected by suspension lock.
        bulkFreezeStudentClasses() filters
        by NOT_ACTIVATED and ACTIVATED only.
    end note
```

**Frontend rendering rule for `isFrozen = true`:**
- `StatusTrackingContainer.mapToSessionStatus()` returns `"suspended_pending"` when `isFrozen = true` OR `studentStatus === "SUSPENDED"`.
- `StatusBadgeAction.tsx` renders no action buttons for `suspended_pending` status — this is an existing behavior, not a new Story 10 UI change.

---

### 3.3 Class Instance State Machine — ON_LEAVE Processing

When a student transitions to `ON_LEAVE`, `StudentLeaveProcessingService.processStudentLeave()` is called. The following diagram shows how each future NOT_ACTIVATED class is processed:

```mermaid
stateDiagram-v2
    [*] --> NOT_ACTIVATED : Class scheduled, awaiting activation

    NOT_ACTIVATED --> LEAVE_PROCESSED : processStudentLeave()\nstudent transitions to ON_LEAVE
    NOT_ACTIVATED --> ACTIVATED : Teacher activates (normal flow)
    ACTIVATED --> RUNNING : Teacher starts session
    RUNNING --> COMPLETED : Session ends normally

    state LEAVE_PROCESSED {
        original : Original Class Instance\nexecutionState = NOT_ACTIVATED (unchanged)\noutcome = LEAVE\nisRescheduled = true
        successor : Successor Class Instance\nexecutionState = NOT_ACTIVATED\noutcome = PENDING\nscheduledStartAt = original + offsetDays
    }

    original --> [*] : Class marked as excused
    successor --> NOT_ACTIVATED : Awaits rescheduling

    note right of LEAVE_PROCESSED
        SchedulingRepository.processClassLeave() handles
        both the original class update AND successor
        creation atomically. Uses idempotency key:
        leave-reschedule-{classId}-{scheduledStartAt}
        ON CONFLICT DO NOTHING prevents duplicates.
    end note

    note right of ACTIVATED
        ACTIVATED classes are NOT processed by
        processStudentLeave(). Only NOT_ACTIVATED
        classes are safe to process without checking
        activation window. This is intentional.
    end note
```

**Leave Processing Rules:**
1. Only `executionState = NOT_ACTIVATED` classes are targeted (safe to process without activation window check).
2. The existing `SchedulingRepository.processClassLeave()` at line 566 is reused for each class — it handles the atomic update + successor creation.
3. A failure on one class does NOT stop processing of remaining classes (logged, then continues).
4. The idempotency key `leave-reschedule-{classId}-{scheduledStartAt}` prevents duplicate successor instances if `processStudentLeave()` is called more than once.

---

### 3.4 Complete Side-Effect Dispatch Flow

```mermaid
stateDiagram-v2
    [*] --> PermissionCheck : changeStudentStatus() called

    PermissionCheck --> StudentNotFound : Student does not exist
    PermissionCheck --> TransitionCheck : Permission granted

    StudentNotFound --> [*] : throw studentNotFound error

    TransitionCheck --> InvalidTransition : Transition not allowed by DB trigger rules
    TransitionCheck --> StatusChange : Transition allowed

    InvalidTransition --> [*] : throw invalidStatusTransition error

    StatusChange --> SideEffectDispatch : StudentRepository.changeStatus() succeeds

    state SideEffectDispatch {
        [*] --> CheckNewStatus
        CheckNewStatus --> EnforceSuspendedLock : newStatus === "SUSPENDED"
        CheckNewStatus --> ReleaseSuspendedLock : currentStatus === "SUSPENDED" AND newStatus === "REGULAR"
        CheckNewStatus --> ProcessStudentLeave : newStatus === "ON_LEAVE"
        CheckNewStatus --> NoSideEffect : other transitions

        EnforceSuspendedLock --> [*] : bulkFreezeStudentClasses() → isFrozen = true
        ReleaseSuspendedLock --> [*] : bulkUnfreezeStudentClasses() → isFrozen = false
        ProcessStudentLeave --> [*] : per-class leave processing → outcome = LEAVE, successor created
        NoSideEffect --> [*]
    }

    SideEffectDispatch --> [*] : return { id, status, version }
```

**Critical observations from this flow:**
- The permission check (`student.manage_status`) happens ONCE at the top.
- All three side-effect branches (`EnforceSuspendedLock`, `ReleaseSuspendedLock`, `ProcessStudentLeave`) execute ONLY after the permission check passes AND the status change commits to DB.
- If the status change itself fails (e.g., DB constraint violation), none of the side effects run.
- If a side-effect fails (e.g., `bulkFreezeStudentClasses()` throws), the `catch(error)` block at the bottom of `changeStudentStatus()` re-throws, so the caller gets an error. The status change IS already committed by this point — this is an acceptable design because the side-effect failure is logged and can be retried by the admin.
