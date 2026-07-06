## Section 0: Story Metadata & Context

- **Source story:** `.ai/siraj_stories/10.md` (Part 11 - Permissions & Permission Groups, timestamps 00:00 - 01:57)
- **Security baseline:** `.ai/siraj_stories/9/` (mandatory prerequisite — Invoice Generation & Student Lifecycle sprint must be fully deployed)
- **Story scope:** Implements two system-automated permissions that enforce cascading rules on student status changes to `SUSPENDED` or `ON_LEAVE`. `system.enforce_suspended_lock` backs automated UI control revocation on the teacher's class schedule (class stays visible but action buttons are hidden). `system.process_student_leave` backs the automated future-class protection workflow (upcoming classes marked as excused, queued for rescheduling so no paid classes are lost). Both permissions are system-internal — triggered by the existing `student.manage_status` flow from Story 9. Key deliverables: permission seeds, service-layer enforcement hooks in `StudentLifecycleService.changeStudentStatus()`, new `statusTrackingSchedule` GraphQL query, and migration of `StatusTrackingContainer` from `mockStatusTrackingStore` to real Apollo `useQuery`.
- **Target roles:** System Automated (enforcement permissions). Admin / Super Admin already hold `student.manage_status` (Story 9) which triggers enforcement. Teacher role is read-only observer of the UI lock.
- **Status:** Planning phase — awaiting approval for execution.

---

### 0.1 Business Objectives

1. **Teacher UI Safety via Suspension Lock (`system.enforce_suspended_lock`):** When admin changes student to `SUSPENDED`, the class stays visible on teacher's schedule (so teacher sees the cancellation) but the system sets `isFrozen = true` on the class instance. The frontend renders the class with a `suspended_pending` status badge and all action buttons (Activate, Start, Absent, Leave) are hidden/disabled. Prevents teachers from opening virtual rooms for suspended students.

2. **Financial Quota Protection via Leave Processing (`system.process_student_leave`):** When admin changes student to `ON_LEAVE`, the system evaluates upcoming scheduled classes (`executionState IN ['NOT_ACTIVATED', 'ACTIVATED']`). Each future class is marked as excused (`outcome = LEAVE`, `isRescheduled = true`) and a new successor class instance is created to be rescheduled — ensuring no paid classes are permanently lost.

3. **Separation Between Suspension and Leave:** Suspension is punitive/administrative — freezes class interactivity (`isFrozen = true`). Leave is accommodating — preserves financial investment by rescheduling missed classes. Both are distinct automated rules with distinct permission keys.

4. **Real Data in Status Tracking Dashboard:** `StatusTrackingContainer` currently imports from `mockStatusTrackingStore` (verified: `frontend/stores/mockStatusTrackingStore.ts:115`). This sprint replaces it with a real `statusTrackingSchedule` GraphQL query returning class rows enriched with student status.

---

### 0.2 Scope Boundaries

**In scope:**
- New permission seeds in `backend/db/migration/3-system_permissions_and_groups.sql` for `system.enforce_suspended_lock` and `system.process_student_leave`
- New `AppPermission` enum entries in `shared/lib/enum.ts` (lines 489–492 context)
- New repo method `SchedulingRepository.getStatusTrackingRows()` in `backend/db/repo/scheduling.repository.ts`
- New repo method `SchedulingRepository.bulkFreezeStudentClasses()` in `backend/db/repo/scheduling.repository.ts`
- Extension of `StudentLifecycleService.changeStudentStatus()` in `backend/services/student/student-lifecycle.service.ts` to invoke side-effects
- New service `SuspendedLockService` in `backend/services/student/suspended-lock.service.ts`
- New service `StudentLeaveProcessingService` in `backend/services/student/student-leave-processing.service.ts`
- New Pothos query `statusTrackingSchedule` in `backend/graphql/pothos/schedule.pothos.ts`
- New frontend document `statusTrackingScheduleQueryDocument` in `frontend/graphql/sharedDocuments/schedule.documents.ts`
- Migration of `StatusTrackingContainer` to real `useQuery`
- Repository tests for new repo methods
- GraphQL integration tests for `statusTrackingSchedule` query
- i18n keys for new strings if needed

**Out of scope:**
- New database tables or schema columns (`isFrozen` already exists on `class_instances` at `scheduling.ts:135`)
- Modifying DB trigger `fn_enforce_student_status_transition` (already allows REGULAR→SUSPENDED and REGULAR→ON_LEAVE at `student_status_transition_trigger.sql:18–29`)
- `student.manage_status` permission (already seeded in Story 9 at migration line 748)
- New teacher-facing UI (suspension lock rendered via existing `StatusBadgeAction.tsx` disabled button for `suspended_pending`)
- Automated email/push notifications on status change
- Rescheduling UI for ON_LEAVE classes (reschedule tracking view already exists)
