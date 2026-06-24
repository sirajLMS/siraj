# Migration Plan: Enforce Single Canonical Object Type Pattern

## Overview
This plan tracks the migration of all database tables/domains to enforce the single canonical object type pattern. Each domain will be processed independently with mandatory approval checkpoints.

## Task Tracking Legend
- `[ ]` Not Started
- `[-]` In Progress  
- `[x]` Completed
- `[!]` Blocked/Needs Review

---

## Domain Migration Status

### 1. USERS Domain
**Schema:** `backend/db/schema/users.ts`

**Files by Layer:**
- **Types:** `backend/types/auth.types.ts`
- **Repository:** `backend/db/repo/user.repository.ts`
- **Services:** 
  - `backend/services/auth/session.service.ts`
  - `backend/services/auth/permissions.service.ts`
  - `backend/services/auth/demo-auth.service.ts`
- **GraphQL:** `backend/graphql/pothos/auth.pothos.ts`
- **Tests:** None found
- **Frontend:** `frontend/graphql/sharedDocuments/auth.documents.ts`

**Migration Tasks:**
```
[ ] Consolidate user types into backend/types/users.types.ts
[ ] Update repository to use canonical types
[ ] Update services to use canonical types
[ ] Update GraphQL to use canonical types
[ ] Update tests to use canonical types
[ ] Update frontend documents to align with canonical types
[ ] User approval checkpoint
```

---

### 2. TEACHERS Domain
**Schema:** `backend/db/schema/teachers.ts`

**Files by Layer:**
- **Types:** `backend/types/teacher.types.ts`
- **Repository:** `backend/db/repo/teacher.repository.ts`
- **Services:**
  - `backend/services/teacher/teacher.service.ts`
  - `backend/services/teacher/teacher-onboarding.service.ts`
  - `backend/services/teacher/teacher-dashboard.service.ts`
  - `backend/services/teacher/staff-directory.service.ts`
- **GraphQL:**
  - `backend/graphql/pothos/teacher.pothos.ts`
  - `backend/graphql/pothos/teacher-onboarding.pothos.ts`
  - `backend/graphql/pothos/teacher-dashboard.pothos.ts`
- **Tests:** `backend/db/test/repo/teacher.repository.test.ts`
- **Frontend:**
  - `frontend/graphql/sharedDocuments/teacher.documents.ts`
  - `frontend/graphql/sharedDocuments/teacher-onboarding.documents.ts`
  - `frontend/graphql/sharedDocuments/teacher-dashboard.documents.ts`

**Migration Tasks:**
```
[ ] Consolidate teacher types into backend/types/teachers.types.ts
[ ] Update repository to use canonical types
[ ] Update services to use canonical types
[ ] Update GraphQL to use canonical types
[ ] Update tests to use canonical types
[ ] Update frontend documents to align with canonical types
[ ] User approval checkpoint
```

---

### 3. TEACHER-BANKING Domain
**Schema:** `backend/db/schema/teacher-banking.ts`

**Files by Layer:**
- **Types:** (likely in teacher.types.ts)
- **Repository:** `backend/db/repo/teacher-banking.repository.ts`
- **Services:** (likely in teacher services)
- **GraphQL:** (likely in teacher pothos files)
- **Tests:** None found
- **Frontend:** None found

**Migration Tasks:**
```
[ ] Extract teacher-banking types into backend/types/teacher-banking.types.ts
[ ] Update repository to use canonical types
[ ] Update services to use canonical types
[ ] Update GraphQL to use canonical types
[ ] Update tests to use canonical types
[ ] User approval checkpoint
```

---

### 4. TEACHER-AVAILABILITY Domain
**Schema:** `backend/db/schema/teacher-availability.ts`

**Files by Layer:**
- **Types:** `backend/types/teacher-availability.types.ts`
- **Repository:** `backend/db/repo/teacher-availability.repository.ts`
- **Services:** `backend/services/schedule/availability-search.service.ts`
- **GraphQL:** `backend/graphql/pothos/availability-search.pothos.ts`
- **Tests:** `backend/db/test/repo/teacher-availability.repository.test.ts`
- **Frontend:** `frontend/graphql/sharedDocuments/availability-search.documents.ts`

**Migration Tasks:**
```
[ ] Consolidate teacher-availability types
[ ] Update repository to use canonical types
[ ] Update services to use canonical types
[ ] Update GraphQL to use canonical types
[ ] Update tests to use canonical types
[ ] Update frontend documents to align with canonical types
[ ] User approval checkpoint
```

---

### 5. STUDENTS Domain
**Schema:** `backend/db/schema/students.ts`

**Files by Layer:**
- **Types:** `backend/types/student.types.ts`
- **Repository:**
  - `backend/db/repo/student.repository.ts`
  - `backend/db/repo/student-history.repository.ts`
- **Services:**
  - `backend/services/student/student-management.service.ts`
  - `backend/services/student/student-lifecycle.service.ts`
  - `backend/services/student/student-leave-processing.service.ts`
  - `backend/services/student/student-directory.service.ts`
  - `backend/services/student/suspended-lock.service.ts`
  - `backend/services/history/student-history.service.ts`
- **GraphQL:**
  - `backend/graphql/pothos/student.pothos.ts`
  - `backend/graphql/pothos/student-lifecycle.pothos.ts`
  - `backend/graphql/pothos/student-history.pothos.ts`
  - `backend/graphql/pothos/student-directory.pothos.ts`
- **Tests:**
  - `backend/db/test/repo/student.repository.test.ts`
  - `backend/db/test/repo/student-history.repository.test.ts`
  - `backend/db/test/repo/student-directory.test.ts`
- **Frontend:**
  - `frontend/graphql/sharedDocuments/student.documents.ts`
  - `frontend/graphql/sharedDocuments/student-lifecycle.documents.ts`
  - `frontend/graphql/sharedDocuments/student-history.documents.ts`
  - `frontend/graphql/sharedDocuments/student-directory.documents.ts`

**Migration Tasks:**
```
[ ] Consolidate student types into backend/types/students.types.ts
[ ] Update repositories to use canonical types
[ ] Update services to use canonical types
[ ] Update GraphQL to use canonical types
[ ] Update tests to use canonical types
[ ] Update frontend documents to align with canonical types
[ ] User approval checkpoint
```

---

### 6. PARENTS Domain
**Schema:** `backend/db/schema/parents.ts`

**Files by Layer:**
- **Types:** `backend/types/parent.types.ts`
- **Repository:** `backend/db/repo/parent.repository.ts`
- **Services:**
  - `backend/services/parent/parent-profile.service.ts`
  - `backend/services/parent/parent-onboarding.service.ts`
  - `backend/services/parent/parent-document.service.ts`
  - `backend/services/parent/parent-directory.service.ts`
- **GraphQL:**
  - `backend/graphql/pothos/parent-profile.pothos.ts`
  - `backend/graphql/pothos/parent-onboarding.pothos.ts`
  - `backend/graphql/pothos/parent-document.pothos.ts`
  - `backend/graphql/pothos/parent-directory.pothos.ts`
- **Tests:** `backend/db/test/repo/parent.repository.test.ts`
- **Frontend:**
  - `frontend/graphql/sharedDocuments/parent-profile.documents.ts`
  - `frontend/graphql/sharedDocuments/parent-onboarding.documents.ts`
  - `frontend/graphql/sharedDocuments/parent-documents.documents.ts`
  - `frontend/graphql/sharedDocuments/parent-directory.documents.ts`

**Migration Tasks:**
```
[ ] Consolidate parent types
[ ] Update repository to use canonical types
[ ] Update services to use canonical types
[ ] Update GraphQL to use canonical types
[ ] Update tests to use canonical types
[ ] Update frontend documents to align with canonical types
[ ] User approval checkpoint
```

---

### 7. STAFF Domain
**Schema:** `backend/db/schema/staff.ts`

**Files by Layer:**
- **Types:** `backend/types/staff-profile.types.ts`
- **Repository:** `backend/db/repo/staff-profile.repository.ts`
- **Services:**
  - `backend/services/staff/staff-profile.service.ts`
  - `backend/services/staff/manager-profile.service.ts`
  - `backend/services/staff/manager-onboarding.service.ts`
  - `backend/services/staff/manager-directory.service.ts`
- **GraphQL:**
  - `backend/graphql/pothos/staff-profile.pothos.ts`
  - `backend/graphql/pothos/staff-directory.pothos.ts`
  - `backend/graphql/pothos/manager-onboarding.pothos.ts`
- **Tests:** `backend/db/test/repo/staff-profile.test.ts`
- **Frontend:**
  - `frontend/graphql/sharedDocuments/staff-profile.documents.ts`
  - `frontend/graphql/sharedDocuments/staff-directory.documents.ts`
  - `frontend/graphql/sharedDocuments/manager-onboarding.documents.ts`

**Migration Tasks:**
```
[ ] Consolidate staff types
[ ] Update repository to use canonical types
[ ] Update services to use canonical types
[ ] Update GraphQL to use canonical types
[ ] Update tests to use canonical types
[ ] Update frontend documents to align with canonical types
[ ] User approval checkpoint
```

---

### 8. COMMUNICATIONS Domain (Complaints & Suggestions)
**Schema:** `backend/db/schema/communications.ts`

**Files by Layer:**
- **Types:**
  - `backend/types/complaint.types.ts`
  - `backend/types/complaintResponses.types.ts`
  - `backend/types/suggestions.types.ts`
  - `backend/types/communications.types.ts`
  - `backend/types/notificationDeliveries.types.ts`
  - `backend/types/userNotificationPreferences.types.ts`
  - `backend/types/userDeviceTokens.types.ts`
- **Repository:**
  - `backend/db/repo/complaint.repository.ts`
  - `backend/db/repo/complaint-response.repository.ts`
  - `backend/db/repo/suggestion.repository.ts`
  - `backend/db/repo/notification.repository.ts`
- **Services:**
  - `backend/services/communication/complaint.service.ts`
  - `backend/services/communication/complaintResponses.service.ts`
  - `backend/services/communication/suggestion.service.ts`
  - `backend/services/communication/communication.service.ts`
  - `backend/services/notification/notification-alerts.service.ts`
  - `backend/services/system/notification-sync.service.ts`
- **GraphQL:**
  - `backend/graphql/pothos/complaint.pothos.ts`
  - `backend/graphql/pothos/complaintResponses.pothos.ts`
  - `backend/graphql/pothos/suggestion.pothos.ts`
  - `backend/graphql/pothos/notification-alerts.pothos.ts`
- **Tests:**
  - `backend/db/test/repo/complaint.repository.test.ts`
  - `backend/db/test/repo/complaint-response.repository.test.ts`
- **Frontend:**
  - `frontend/graphql/sharedDocuments/notification-alerts.documents.ts`

**Migration Tasks:**
```
[ ] Separate communications types into individual canonical files:
  [ ] backend/types/complaints.types.ts (for complaints table)
  [ ] backend/types/complaint-responses.types.ts (for complaint_responses table)
  [ ] backend/types/suggestions.types.ts (for suggestions table)
  [ ] backend/types/notification-deliveries.types.ts (for notification_deliveries table)
  [ ] backend/types/user-notification-preferences.types.ts (for user_notification_preferences table)
  [ ] backend/types/user-device-tokens.types.ts (for user_device_tokens table)
[ ] Update repositories to use canonical types
[ ] Update services to use canonical types
[ ] Update GraphQL to use canonical types
[ ] Update tests to use canonical types
[ ] Update frontend documents to align with canonical types
[ ] User approval checkpoint
```

---

### 9. SCHEDULING Domain
**Schema:** `backend/db/schema/scheduling.ts`

**Files by Layer:**
- **Types:** `backend/types/scheduling.types.ts`
- **Repository:** (likely in multiple scheduling-related repos)
- **Services:**
  - `backend/services/schedule/schedule.service.ts`
  - `backend/services/schedule/schedule-query.service.ts`
  - `backend/services/schedule/schedule-deletion.service.ts`
  - `backend/services/schedule/recurring-class.service.ts`
  - `backend/services/schedule/weekly-schedule.service.ts`
  - `backend/services/session/class-session.service.ts`
- **GraphQL:**
  - `backend/graphql/pothos/schedule.pothos.ts`
  - `backend/graphql/pothos/schedule-deletion.pothos.ts`
  - `backend/graphql/pothos/recurring-class.pothos.ts`
  - `backend/graphql/pothos/weekly-schedule.pothos.ts`
  - `backend/graphql/pothos/class-session.pothos.ts`
- **Tests:**
  - `backend/db/test/repo/scheduling.repository.test.ts`
  - `backend/db/test/repo/scheduling-status-tracking.repository.test.ts`
  - `backend/db/test/repo/scheduling-state-changes.repository.test.ts`
  - `backend/db/test/repo/scheduling-recurring.repository.test.ts`
- **Frontend:**
  - `frontend/graphql/sharedDocuments/schedule.documents.ts`
  - `frontend/graphql/sharedDocuments/schedule-deletion.documents.ts`
  - `frontend/graphql/sharedDocuments/recurring-class.documents.ts`
  - `frontend/graphql/sharedDocuments/weekly-schedule.documents.ts`
  - `frontend/graphql/sharedDocuments/class-session.documents.ts`

**Migration Tasks:**
```
[ ] Consolidate scheduling types
[ ] Update services to use canonical types
[ ] Update GraphQL to use canonical types
[ ] Update tests to use canonical types
[ ] Update frontend documents to align with canonical types
[ ] User approval checkpoint
```

---

### 10. BILLING Domain
**Schema:** `backend/db/schema/billing.ts`

**Files by Layer:**
- **Types:** `backend/types/billing.types.ts`
- **Repository:** `backend/db/repo/billing.repository.ts`
- **Services:**
  - `backend/services/billing/billing-management.service.ts`
  - `backend/services/billing/billing-history.service.ts`
  - `backend/services/billing/billing-alerts.service.ts`
- **GraphQL:**
  - `backend/graphql/pothos/billing-management.pothos.ts`
  - `backend/graphql/pothos/billing-history.pothos.ts`
  - `backend/graphql/pothos/billing-alerts.pothos.ts`
- **Tests:** `backend/db/test/repo/billing.repository.test.ts`
- **Frontend:**
  - `frontend/graphql/sharedDocuments/billing-management.documents.ts`
  - `frontend/graphql/sharedDocuments/parent-billing-history.documents.ts`
  - `frontend/graphql/sharedDocuments/billing-alerts.documents.ts`

**Migration Tasks:**
```
[ ] Consolidate billing types
[ ] Update repository to use canonical types
[ ] Update services to use canonical types
[ ] Update GraphQL to use canonical types
[ ] Update tests to use canonical types
[ ] Update frontend documents to align with canonical types
[ ] User approval checkpoint
```

---

### 11. STORAGE Domain
**Schema:** `backend/db/schema/storage.ts`

**Files by Layer:**
- **Types:** `backend/types/storage.types.ts`
- **Repository:** `backend/db/repo/storage.repository.ts`
- **Services:** `backend/services/resource/learning-resource.service.ts`
- **GraphQL:** `backend/graphql/pothos/storage.pothos.ts`
- **Tests:** `backend/db/test/repo/storage.repository.test.ts`
- **Frontend:** `frontend/graphql/sharedDocuments/learning-resource.documents.ts`

**Migration Tasks:**
```
[ ] Consolidate storage types
[ ] Update repository to use canonical types
[ ] Update services to use canonical types
[ ] Update GraphQL to use canonical types
[ ] Update tests to use canonical types
[ ] Update frontend documents to align with canonical types
[ ] User approval checkpoint
```

---

### 12. PERMISSIONS Domain
**Schema:** `backend/db/schema/permissions.ts`

**Files by Layer:**
- **Types:** `backend/types/permission-management.types.ts`
- **Repository:** `backend/db/repo/permission-management.repository.ts`
- **Services:** `backend/services/auth/permission-management.service.ts`
- **GraphQL:** `backend/graphql/pothos/permission-management.pothos.ts`
- **Tests:**
  - `backend/db/test/repo/permission-management.repository.test.ts`
  - `backend/db/test/repo/permissions.test.ts`
- **Frontend:** `frontend/graphql/sharedDocuments/permission-management.documents.ts`

**Migration Tasks:**
```
[ ] Consolidate permissions types
[ ] Update repository to use canonical types
[ ] Update services to use canonical types
[ ] Update GraphQL to use canonical types
[ ] Update tests to use canonical types
[ ] Update frontend documents to align with canonical types
[ ] User approval checkpoint
```

---

### 13. SETTINGS Domain
**Schema:** `backend/db/schema/settings.ts`

**Files by Layer:**
- **Types:** `backend/types/system-settings.types.ts`
- **Repository:** `backend/db/repo/system-settings.repository.ts`
- **Services:** `backend/services/system/system-settings.service.ts`
- **GraphQL:** None found
- **Tests:** `backend/db/test/repo/system-settings.repository.test.ts`
- **Frontend:** None found

**Migration Tasks:**
```
[ ] Consolidate settings types
[ ] Update repository to use canonical types
[ ] Update services to use canonical types
[ ] Update tests to use canonical types
[ ] User approval checkpoint
```

---

### 14. AUDIT Domain
**Schema:** `backend/db/schema/audit.ts`

**Files by Layer:**
- **Types:** `backend/types/audit.types.ts`
- **Repository:** `backend/db/repo/audit.repository.ts`
- **Services:** None found
- **GraphQL:** None found
- **Tests:** None found
- **Frontend:** None found

**Migration Tasks:**
```
[ ] Consolidate audit types
[ ] Update repository to use canonical types
[ ] User approval checkpoint
```

---

### 15. CACHE Domain
**Schema:** `backend/db/schema/cache.ts`

**Files by Layer:**
- **Types:** None found
- **Repository:** `backend/db/repo/cache.repository.ts`
- **Services:** None found
- **GraphQL:** None found
- **Tests:** None found
- **Frontend:** None found

**Migration Tasks:**
```
[ ] Create backend/types/cache.types.ts
[ ] Update repository to use canonical types
[ ] User approval checkpoint
```

---

### 16. TIMEZONES Domain
**Schema:** `backend/db/schema/timezones.ts`

**Files by Layer:**
- **Types:** None found
- **Repository:** None found
- **Services:** None found
- **GraphQL:** None found
- **Tests:** None found
- **Frontend:** None found

**Migration Tasks:**
```
[ ] Create backend/types/timezones.types.ts (if needed)
[ ] User approval checkpoint
```

---

### 17. SITE-CONTENT Domain
**Schema:** `backend/db/schema/site-content.ts`

**Files by Layer:**
- **Types:** None found
- **Repository:** None found
- **Services:** None found
- **GraphQL:** None found
- **Tests:** None found
- **Frontend:** None found

**Migration Tasks:**
```
[ ] Create backend/types/site-content.types.ts (if needed)
[ ] User approval checkpoint
```

---

### 18. ADDITIONAL DOMAINS (No Schema Found)

#### Class Performance
- **Types:** `backend/types/class-instance-performance.types.ts`
- **Repository:** `backend/db/repo/class-performance.repository.ts`
- **Services:** `backend/services/performance/class-performance.service.ts`
- **GraphQL:** None found
- **Tests:** `backend/db/test/repo/class-performance.repository.test.ts`
- **Frontend:** None found

**Migration Tasks:**
```
[ ] Consolidate class-performance types
[ ] Update repository to use canonical types
[ ] Update services to use canonical types
[ ] Update tests to use canonical types
[ ] User approval checkpoint
```

#### Reports
- **Types:** None found
- **Repository:** `backend/db/repo/report.repository.ts`
- **Services:** `backend/services/report/report.service.ts`
- **GraphQL:** `backend/graphql/pothos/report.pothos.ts`
- **Tests:** `backend/db/test/repo/report.repository.test.ts`
- **Frontend:** `frontend/graphql/sharedDocuments/report.documents.ts`

**Migration Tasks:**
```
[ ] Create backend/types/reports.types.ts
[ ] Update repository to use canonical types
[ ] Update services to use canonical types
[ ] Update GraphQL to use canonical types
[ ] Update tests to use canonical types
[ ] Update frontend documents to align with canonical types
[ ] User approval checkpoint
```

#### DST Migration
- **Types:** None found
- **Repository:** `backend/db/repo/dst-migration.repository.ts`
- **Services:** `backend/services/system/dst-migration.service.ts`
- **GraphQL:** `backend/graphql/pothos/dst-migration.pothos.ts`
- **Tests:** None found
- **Frontend:** `frontend/graphql/sharedDocuments/dst-migration.documents.ts`

**Migration Tasks:**
```
[ ] Create backend/types/dst-migration.types.ts
[ ] Update repository to use canonical types
[ ] Update services to use canonical types
[ ] Update GraphQL to use canonical types
[ ] Update frontend documents to align with canonical types
[ ] User approval checkpoint
```

#### Soft Delete
- **Types:** `backend/types/soft-delete.types.ts`
- **Repository:** `backend/db/repo/soft-delete.repository.ts`
- **Services:** None found
- **GraphQL:** None found
- **Tests:** None found
- **Frontend:** None found

**Migration Tasks:**
```
[ ] Review soft-delete types (may be utility types)
[ ] User approval checkpoint
```

#### Signed URLs
- **Types:** None found
- **Repository:** `backend/db/repo/signedUrl.repository.ts`
- **Services:** None found
- **GraphQL:** None found
- **Tests:** None found
- **Frontend:** None found

**Migration Tasks:**
```
[ ] Create backend/types/signed-urls.types.ts (if needed)
[ ] Update repository to use canonical types
[ ] User approval checkpoint
```

#### Session
- **Types:** None found
- **Repository:** `backend/db/repo/session.repository.ts`
- **Services:** None found
- **GraphQL:** None found
- **Tests:** None found
- **Frontend:** None found

**Migration Tasks:**
```
[ ] Create backend/types/sessions.types.ts (if needed)
[ ] Update repository to use canonical types
[ ] User approval checkpoint
```

#### Rate Limiting
- **Types:** None found
- **Repository:** `backend/db/repo/ratelimit.repository.ts`
- **Services:** None found
- **GraphQL:** None found
- **Tests:** None found
- **Frontend:** None found

**Migration Tasks:**
```
[ ] Create backend/types/rate-limit.types.ts (if needed)
[ ] Update repository to use canonical types
[ ] User approval checkpoint
```

#### Idempotency
- **Types:** None found
- **Repository:** None found
- **Services:** `backend/services/idempotency.service.ts`
- **GraphQL:** None found
- **Tests:** None found
- **Frontend:** None found

**Migration Tasks:**
```
[ ] Create backend/types/idempotency.types.ts (if needed)
[ ] Update service to use canonical types
[ ] User approval checkpoint
```

#### System Rules
- **Types:** None found
- **Repository:** None found
- **Services:** `backend/services/system/system-rules.service.ts`
- **GraphQL:** None found
- **Tests:** None found
- **Frontend:** None found

**Migration Tasks:**
```
[ ] Create backend/types/system-rules.types.ts (if needed)
[ ] Update service to use canonical types
[ ] User approval checkpoint
```

#### Test Helper
- **Types:** None found
- **Repository:** None found
- **Services:** `backend/services/system/test-helper.service.ts`
- **GraphQL:** None found
- **Tests:** None found
- **Frontend:** `frontend/graphql/sharedDocuments/test-helper.documents.ts`

**Migration Tasks:**
```
[ ] Review test-helper types (may be utility types)
[ ] User approval checkpoint
```

#### Translation
- **Types:** None found
- **Repository:** None found
- **Services:** None found
- **GraphQL:** None found
- **Tests:** None found
- **Frontend:** `frontend/graphql/sharedDocuments/translation.documents.ts`

**Migration Tasks:**
```
[ ] Create backend/types/translations.types.ts (if needed)
[ ] Update frontend documents to align with canonical types
[ ] User approval checkpoint
```

---

## Execution Strategy

### Phase 1: Discovery (Complete)
- [x] List all schema files
- [x] List all type files
- [x] List all repository files
- [x] List all service files
- [x] List all GraphQL files
- [x] List all test files
- [x] List all frontend documents

### Phase 2: Per-Domain Migration (Iterative)
For each domain above:
1. **STOP** - Present domain to user
2. **WAIT** - Get user approval to proceed
3. Consolidate types into canonical file
4. **STOP** - Present consolidated types to user
5. **WAIT** - Get user approval
6. Update all dependent layers
7. **STOP** - Present all updates to user
8. **WAIT** - Get user approval
9. Move to next domain

### Phase 3: Validation (Per Domain)
After each domain approval:
- Verify no local type definitions remain
- Verify all imports point to canonical types
- Verify functionality remains intact
- Run tests if available

---

## Critical Rules

1. **MANDATORY STOP POINTS**: Never proceed without explicit user approval
2. **ONE DOMAIN AT A TIME**: Process domains sequentially, not in parallel
3. **NO ASSUMPTIONS**: Discover current state dynamically for each domain
4. **CONSOLIDATION FIRST**: Always consolidate types before updating other layers
5. **APPROVAL REQUIRED**: Each checkpoint requires explicit user instruction to proceed

---

## Progress Summary

**Total Domains:** 25+
**Completed:** 0
**In Progress:** 0
**Not Started:** 25+

**Next Action:** Begin with Domain #1 (USERS) after user approval