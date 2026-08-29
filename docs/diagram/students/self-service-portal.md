# Student Self Portal & Week Schedule

A logged-in student accesses three self-service surfaces under `app/(dashboard)/student/`: the weekly schedule, the leave-requests list, and monthly appraisals. The week-schedule page renders `StudentWeekCalendarContainer`, which paginates a week window and issues `studentUpcomingClasses`; `StudentStatusService.getUpcomingClasses` enforces the student-field ACL, loads `class_instances` for the range, and enriches each row through `EffectiveMeetingService` with the meeting join URL and execution state. Each session card exposes delay/cancel actions that are disabled within a 12-hour lock window (configurable via `SELF_SERVICE_RESCHEDULE_LOCK_HOURS`); when unlocked, the mutations `requestSessionDelay`/`requestSessionCancel` go through `LeaveRequestService`, which validates permissions, session existence, the lock window, and duplicate PENDING requests before inserting a `leave_requests` row for supervisor review. The requests page lists the student's own `leave_requests` rows via `myLeaveRequests` (`SESSION_SELF_DELAY`), and supervisors later approve or reject them (`rejectLeaveRequest` sets REJECTED, triggering reschedule/cancel flows). The monthly-appraisals page uses `myMonthlyAppraisal` (`APPRAISAL_VIEW`) which resolves the student row from the auth user id and returns null for an empty state when no appraisal (or student profile) exists. Students can also append feedback through `addAppraisalFeedback`, which requires `APPRAISAL_FEEDBACK`, a student-or-parent tenancy check, and a non-empty body, writing an `appraisal_feedback` row.

## Key sources

- `app/(dashboard)/student/week-schedule/page.tsx` — route entry rendering `StudentWeekCalendarContainer`
- `app/(dashboard)/student/requests/page.tsx` and `app/(dashboard)/__shared__/makeLeaveRequestsPage.tsx` — permission-gated requests page (`SESSION_SELF_DELAY`)
- `app/(dashboard)/student/monthly-appraisals/page.tsx` and `app/(dashboard)/__shared__/makeStudentParentAppraisalPage.tsx` — permission-gated appraisals page (`APPRAISAL_VIEW`)
- `frontend/desktop/views/dashboard/scheduling/studentWeekCalendar.desktop.tsx` — week grid, `studentUpcomingClasses` query, OutcomeChip, lock logic
- `frontend/common/views/dashboard/scheduling/session-actions/SessionActions.tsx` — delay/cancel dialogs and mutations
- `frontend/common/views/dashboard/scheduling/leave-requests/LeaveRequestsContainer.tsx` — `myLeaveRequests` query container
- `frontend/common/views/dashboard/reports/monthly-appraisal/student-parent/StudentParentAppraisalContainer.tsx` — appraisal queries and feedback modal
- `backend/graphql/query/students/student-status.query.ts` — `studentUpcomingClasses` resolver
- `backend/graphql/query/scheduling/leave-request.query.ts` and `backend/graphql/mutation/scheduling/leave-request.mutation.ts` — `myLeaveRequests`, `requestSessionDelay`, `requestSessionCancel`, `rejectLeaveRequest`
- `backend/graphql/query/reports/monthly-appraisal.query.ts` and `backend/graphql/mutation/reports/monthly-appraisal.mutation.ts` — `myMonthlyAppraisal`, `studentMonthlyAppraisals`, `addAppraisalFeedback`
- `backend/services/student/student-status.service.ts` — `StudentStatusService.getUpcomingClasses` (field ACL, repo load, meeting enrichment)
- `backend/services/leave-request/leave-request.service.ts` — create/reject/list logic, 12-hour lock, duplicate-PENDING guard
- `backend/services/monthly-appraisal/monthly-appraisal.service.ts` — `getMyMonthlyAppraisal`, `addFeedback`, tenancy checks
- `backend/db/schema/classes/scheduling.ts` (`classInstances`, `leaveRequests`) and `backend/db/schema/students/monthly-appraisals.ts` / `appraisal-feedback.ts` — tables touched

## Diagram

```mermaid
%% Student Self Portal & Week Schedule — week calendar, self-service delay/cancel leave requests, and monthly appraisal viewing plus feedback
flowchart TB
  ENTRY["Logged-in student opens student week-schedule, requests, or monthly-appraisals page"]
  AUTH["withPageAuth enforces SESSION_SELF_DELAY and APPRAISAL_VIEW permissions; unauthorized users are redirected"]

  ENTRY --> AUTH

  subgraph SCHEDULE["Week Schedule"]
    WK_PAGE["StudentWeekCalendarPage renders StudentWeekCalendarContainer with a navigable weekStart"] --> WK_Q["useQuery studentUpcomingClasses with studentId plus week from/to range"]
    WK_Q --> WK_RES["Pothos studentUpcomingClasses query requires loggedIn scope and ctx.user"]
    WK_RES --> WK_SVC["StudentStatusService.getUpcomingClasses: assertStudentFieldView on student_schedule or throws insufficientPermissions"]
    WK_SVC --> WK_REPO["StudentRepository.findById then SchedulingRepository.getUpcomingClassesForStudent over class_instances in the range"]
    WK_REPO --> WK_MEET["EffectiveMeetingService.resolveForClassInstance enriches each row with meetingJoinUrl, executionState, outcome"]
    WK_MEET --> WK_GRID["WeekGrid renders a SessionCard per day column with OutcomeChip and SessionActions"]
  end

  subgraph REQUESTS["Leave Requests"]
    LR_PAGE["LeaveRequestsContainer runs myLeaveRequestsQueryDocument with cache-and-network"] --> LR_RES["Pothos myLeaveRequests query with SESSION_SELF_DELAY authScope and requireAuth"]
    LR_RES --> LR_SVC["LeaveRequestService.getMyRequests selects leave_requests by requestedByUserId"]
    LR_SVC --> LR_UI["Mobile/desktop views list requestType, proposedStartAt, and status PENDING/APPROVED/REJECTED"]
  end

  subgraph ACTIONS["Self-Service Session Actions"]
    SA_LOCK["SessionActions locked when the session starts within 12 hours or is in the past"] -->|"unlocked"| SA_BTN["Delay and Cancel buttons open DelayDialog or CancelDialog"]
    SA_BTN --> SA_MUT["requestSessionDelay or requestSessionCancel mutations require SESSION_SELF_DELAY or SESSION_SELF_CANCEL"]
    SA_MUT --> SA_CHK["createStudentRequest checks permission, class_instances row exists, not inside lock window, no duplicate PENDING row"]
    SA_CHK --> SA_ERR["ValidationError SESSION_LOCKED or ConflictError surfaces as a dialog error Alert"]
    SA_CHK --> SA_INS["Insert leave_requests row with status PENDING for supervisor review"]
    SA_INS --> SA_REV["Supervisor approves via the reschedule flow or rejects via rejectLeaveRequest setting status REJECTED"]
  end

  subgraph APPRAISALS["Monthly Appraisals"]
    AP_PAGE["StudentParentAppraisalContainer with studentId null uses myMonthlyAppraisal for the current month"] --> AP_RES["Pothos myMonthlyAppraisal requires APPRAISAL_VIEW and requireAuth"]
    AP_RES --> AP_SVC["MonthlyAppraisalService.getMyMonthlyAppraisal resolves the students row from userId; no row returns null empty state"]
    AP_SVC --> AP_REPO["MonthlyAppraisalRepository.findForStudentMonth reads monthly_appraisals with appraisal_feedback"]
    AP_REPO --> AP_VM["ViewModel maps rubric grades behavior/attendance/punctuality/overall plus learningTargets and the feedback thread"]
    AP_VM --> AP_FB["Feedback modal submits the addAppraisalFeedback mutation"]
    AP_FB --> AP_SVC2["MonthlyAppraisalService.addFeedback: APPRAISAL_FEEDBACK permission, student-or-parent tenancy check, non-empty body, appends appraisal_feedback row then refetches"]
  end

  AUTH --> WK_PAGE
  AUTH --> LR_PAGE
  AUTH --> AP_PAGE
  WK_GRID --> SA_LOCK
```

Machine-readable copy: [self-service-portal.mmd](./self-service-portal.mmd)
