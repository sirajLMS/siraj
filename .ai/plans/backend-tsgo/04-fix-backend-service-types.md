---
name: "04: Fix backend service type issues"
overview: "Fix TypeScript errors in backend services"
todos:
  - id: "1"
    content: Fix billing management service types
    status: "pending"
  - id: "2"
    content: Fix billing payment proof helpers
    status: "pending"
  - id: "3"
    content: Fix credit service types
    status: "pending"
  - id: "4"
    content: Fix currency hedge service types
    status: "pending"
  - id: "5"
    content: Fix group class service types
    status: "pending"
  - id: "6"
    content: Fix student history service types
    status: "pending"
  - id: "7"
    content: Fix meeting config service types
    status: "pending"
  - id: "8"
    content: Fix effective meeting service types
    status: "pending"
  - id: "9"
    content: Fix meeting config snapshot types
    status: "pending"
  - id: "10"
    content: Fix meeting provider catalog service types
    status: "pending"
  - id: "11"
    content: Fix notification alerts service types
    status: "pending"
  - id: "12"
    content: Fix payment catalog service types
    status: "pending"
  - id: "13"
    content: Fix payment method service types
    status: "pending"
  - id: "14"
    content: Fix profile service types
    status: "pending"
  - id: "15"
    content: Fix teacher profile service test types
    status: "pending"
  - id: "16"
    content: Fix schedule deletion service types
    status: "pending"
  - id: "17"
    content: Fix schedule query service types
    status: "pending"
  - id: "18"
    content: Fix schedule service types
    status: "pending"
  - id: "19"
    content: Fix weekly schedule service types
    status: "pending"
  - id: "20"
    content: Fix class instance expiry service types
    status: "pending"
  - id: "21"
    content: Fix class session service types
    status: "pending"
  - id: "22"
    content: Fix student status service types
    status: "pending"
  - id: "23"
    content: Fix teacher portal service types
    status: "pending"
isProject: false
---

# Plan 04: Fix Backend Service Type Issues

## Files to Modify (from git status)
- `backend/services/billing/billing-management.service.ts`
- `backend/services/billing/billing-payment-proof.helpers.ts`
- `backend/services/billing/credit.service.ts`
- `backend/services/fx/currency-hedge.service.ts`
- `backend/services/group-class/group-class.service.ts`
- `backend/services/history/student-history.service.ts`
- `backend/services/meeting/class-meeting-config.service.ts`
- `backend/services/meeting/effective-meeting.service.test.ts`
- `backend/services/meeting/meeting-config-snapshot.ts`
- `backend/services/meeting/meeting-config.service.ts`
- `backend/services/meeting/meeting-provider-catalog.service.ts`
- `backend/services/notification/notification-alerts.service.ts`
- `backend/services/payment-method/payment-catalog.service.ts`
- `backend/services/payment-method/payment-method.service.ts`
- `backend/services/profile/profile.service.ts`
- `backend/services/profile/teacher-profile.service.test.ts`
- `backend/services/schedule/schedule-deletion.service.ts`
- `backend/services/schedule/schedule-query.service.ts`
- `backend/services/schedule/schedule.service.ts`
- `backend/services/schedule/weekly-schedule.service.ts`
- `backend/services/session/class-instance-expiry.service.ts`
- `backend/services/session/class-session.service.ts`
- `backend/services/student/student-status.service.ts`
- `backend/services/teacher/teacher-portal.service.ts`

## Common Issues
1. Translation namespace mismatches
2. Missing type imports from `@/backend/types`
3. Incorrect function signatures
4. Unused variables
