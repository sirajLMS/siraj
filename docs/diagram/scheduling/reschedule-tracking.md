# Reschedule Request & Tracking

The reschedule workflow has two entry paths for the same domain. On the client, a teacher (or an authorized admin) submits a leave/reschedule request against a class instance from the teacher dashboard, future-schedule, or class-details surfaces via the `updateSessionStatusLeave` GraphQL mutation; alternatively, an admin uses the `RescheduleContainer` form to pick a new date/time (target selection) and calls the `rescheduleClass` mutation. Both mutations land in `ClassSessionService`, which enforces permissions (`SESSION_UPDATE_STATUS_LEAVE` / `SESSION_RESCHEDULE`), validates the session is ACTIVATED and the teacher's monthly leave quota is available, then runs a DB transaction: the leave path marks the original instance COMPLETED/LEAVE, creates a successor instance and a `leaveRequests` row (status RESCHEDULED); the direct-reschedule path inserts a successor linked by `originalClassId` and marks the original `isRescheduled`. Quota/credit accounting runs inside the same transaction — the original's deduction is released or credit-refunded and re-deducted against the successor, so no free class leaks. After commit, a best-effort notification fan-out (`CLASS_LEAVE_REQUESTED` or `CLASS_RESCHEDULED`) resolves the affected teacher and parent users and dispatches via `dispatchWithPreferences`; dispatch failures are caught and logged, never thrown. The tracking page (`/schedule/tracking?tab=reschedule` — the `reschedule` route itself just redirects to this tab) guards on `SESSION_RESCHEDULE`, reads joined `classInstances`/`leaveRequests`/`teachers`/`students`/`users` rows plus metrics, and lets approvers approve a pending request (which re-enters `updateSessionStatusLeave` and the fan-out) or reject/view by navigating to the class details page. Edge cases handled client-side: missing `originalClassId` on a tracking row blocks approve/reject with an error snackbar, an invalid date/time combination aborts the form submission before the mutation fires, and mutation errors surface as notifications.

## Key sources

- `app/(dashboard)/schedule/tracking/reschedule/page.tsx`
- `app/(dashboard)/schedule/tracking/page.tsx`
- `frontend/common/views/dashboard/reschedule/home/RescheduleContainer.tsx`
- `frontend/common/views/dashboard/reschedule/home/useRescheduleViewModel.ts`
- `frontend/common/views/dashboard/reschedule/tracking/useRescheduleTrackingViewModel.ts`
- `frontend/common/views/dashboard/teachers/futureSchedule/useFutureScheduleViewModel.ts`
- `frontend/common/graphql/sharedDocuments/scheduling/class-session.documents.ts`
- `backend/graphql/mutation/classes/class-session.mutation.ts`
- `backend/graphql/query/scheduling/schedule.query.ts`
- `backend/services/session/class-session.service.ts`
- `backend/services/schedule/schedule.service.ts`
- `backend/db/repo/scheduling/state-changes.ts`
- `backend/db/repo/scheduling/scheduling-queries.repository/reschedule-tracking.repository.ts`

```mermaid
%% Reschedule Request & Tracking — request initiation, target selection, approvals, notification fan-out
flowchart TB
    subgraph INIT["1. Request Initiation"]
        A["TeacherScheduleActionsIsland / useFutureScheduleViewModel / useClassMutations"]
        A --> M1["mutation updateSessionStatusLeave"]
    end

    subgraph TGT["2. Direct Reschedule (target selection)"]
        H["RescheduleContainer (reschedule home view)"]
        H --> F1["RHF form + zodResolver (rescheduleSchema)"]
        F1 --> F2["combineDateTime: newDate + newTime into startAt/endAt"]
        F2 --> M2["mutation rescheduleClass"]
    end

    subgraph SVC["3. ClassSessionService"]
        M1 --> S1["updateStatusLeave"]
        M2 --> S2["reschedule"]
        S1 --> P1{"permitted + session ACTIVATED + teacher leave quota available?"}
        S2 --> P2{"AppPermission.SESSION_RESCHEDULE?"}
        P1 -- "no" --> E1["UnauthorizedError / ValidationError -> error snackbar"]
        P2 -- "no" --> E1
        P1 -- "yes" --> TX1[("DB transaction: SchedulingRepository.processClassLeave")]
        P2 -- "yes" --> S2B["computeLeaveQuotaNote + buildRescheduleRemarks"]
        S2B --> TX2[("DB transaction: SchedulingRepository.rescheduleClassInstance")]
    end

    subgraph DB["4. SchedulingRepository (tables)"]
        TX1 --> R1["classInstances: original to COMPLETED/LEAVE + successor created"]
        TX1 --> R2["leaveRequests: insert row with status RESCHEDULED"]
        TX2 --> R3["classInstances: insert successor with originalClassId, mark original isRescheduled"]
    end

    subgraph MONEY["5. Quota / Credit Ledger"]
        TX1 --> Q1["releaseQuotaIfDeducted, else refundCreditIfDeducted"]
        TX2 --> Q2["re-deduct QuotaService or CreditService on successor"]
    end

    subgraph NTFY["6. Notification Fan-out (best effort)"]
        S1 --> N1["notifyAffectedForInstance: CLASS_LEAVE_REQUESTED"]
        S2 --> N2["notifyClassLifecycle: CLASS_RESCHEDULED (newStartAt + originalInstanceId)"]
        N1 --> N3["SchedulingRepository.getClassInstanceAffectedUsers (teacher + parent)"]
        N2 --> N3
        N3 --> N4["buildClassLifecyclePayloads -> dispatchWithPreferences"]
        N4 -. "dispatch failure caught and logged, never thrown" .-> E2["logger.error only"]
    end

    subgraph TRK["7. Tracking & Approvals"]
        TC["RescheduleTrackingContainer (/schedule/tracking?tab=reschedule)"]
        TC --> Q3["queries rescheduleTrackingRows + rescheduleTrackingMetrics"]
        Q3 --> S3["ScheduleService.getRescheduleTracking / getRescheduleTrackingMetrics"]
        S3 --> P3{"AppPermission.SESSION_RESCHEDULE?"}
        P3 -- "no" --> E1
        P3 -- "yes" --> R4["SchedulingRepository.getRescheduleTrackingRows / getRescheduleTrackingMetrics"]
        R4 --> D2[("classInstances + leaveRequests + teachers + students + users")]
        TC --> AP["onApprove -> updateSessionStatusLeave -> refetch rows and metrics"]
        AP --> M1
        TC --> RJ["onReject / onView -> route to class details"]
        TC --> EX["onExport -> exportRescheduleTracking (client-side Excel)"]
    end
```

Machine-checkable copy: [reschedule-tracking.mmd](./reschedule-tracking.mmd)
