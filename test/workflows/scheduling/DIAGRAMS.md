# Scheduling workflow journey diagrams

Mermaid diagram for the cross-actor journey suite in this directory, using the same actor names, service entry points, and statuses as the journey code.

## lesson-report-lifecycle.test.ts

A teacher submits lesson reports on their completed class instances and a manager reviews the queue: approval flips the report to APPROVED, creates the teacher due, and notifies only the submitting teacher; rejection flips the second report to REJECTED, writes a REFUND credit row for the student, and notifies the teacher. Cross-actor negatives are honest — a second teacher cannot submit on or review the class, and the teacher cannot approve.

```mermaid
sequenceDiagram
  autonumber
  participant teacher as "teacher - class owner"
  participant other as "second teacher - no rights here"
  participant svc as "LessonReportService"
  participant manager as "manager - reviewer"
  participant db as "Postgres"
  participant notify as "notification dispatch spy"

  teacher->>svc: submitReport class instance 1 at 100 percent
  svc->>db: insert report PENDING_REVIEW
  Note over db: idempotency key is lesson-report plus classInstanceId

  manager->>svc: getPendingReviews filtered by teacher
  svc-->>manager: queue contains the pending report
  other->>svc: getPendingReviews
  svc-->>other: unauthorized - submit-only scope

  manager->>svc: approveReport report 1
  svc->>db: status APPROVED plus reviewedBy manager
  svc->>db: insert teacherDues row for class instance 1
  svc-)notify: reviewed notification
  notify-->>teacher: dispatch to submitting teacher only

  other->>svc: submitReport on class instance 1
  svc-->>other: notEligibleForReview
  teacher->>svc: approveReport without reviewer rights
  svc-->>teacher: unauthorized

  teacher->>svc: submitReport class instance 2 at 40 percent
  svc->>db: second PENDING_REVIEW report
  manager->>svc: rejectReport report 2 with rejection reason
  svc->>db: status REJECTED plus rejectionReason
  svc->>db: insert REFUND credit ledger row plus 1 class for student
  svc-)notify: rejection notification
  notify-->>teacher: dispatch targets the teacher
```
