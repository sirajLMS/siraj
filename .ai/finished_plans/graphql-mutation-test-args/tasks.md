# Tasks: GraphQL Mutation Test Argument Coverage

## Execution Rules (Apply to Every Subtask)

### Outcome Knowledge Base (Feature 6)
- **BEFORE Execution**: Read ALL files in `.ai/plans/graphql-mutation-test-args/outcome/` to absorb prior findings.
- **AFTER Execution**: Write `.ai/plans/graphql-mutation-test-args/outcome/<task-id>-outcome.md` with research/doc findings and implementation details.
- **PROGRESS TRACKING**: Update task checkbox `[ ]` → `[x]` in this file upon completion.

### Quality Loop (Per File)
After modifying ANY file, run:
```bash
~/.bun/bin/bun tsgo
~/.bun/bin/bun biome:check
curl -s -X POST http://localhost:${LINT_QUEUE_PORT}/lint \
  -H "Content-Type: application/json" \
  -d '{"id":"<task-id>","files":["<the-file>"]}'
```
Fix all errors before proceeding. Progressive enforcement: tsgo first, then biome, then lint.

### Instruction Verification (Per File)
Validate modified files against:
- `/workspaces/siraj/frontend/common/graphql/test/AGENTS.md`
- `/workspaces/siraj/frontend/common/graphql/AGENTS.md`
- `/workspaces/siraj/.agents/instructions/tests.instructions.md`
- Root `/workspaces/siraj/AGENTS.md`

### CROSS-FILE DEPENDENCY Reporting
If a backend bug is found, DO NOT modify backend files. Report to orchestrator:
```
CROSS-FILE DEPENDENCY:
  Target file: <test file>
  Blocked by: <backend file>
  Rule violated: <what's broken>
  Required fix: <description>
```

### Argument Discovery Process (Per Mutation)
1. Find the mutation document in `frontend/common/graphql/sharedDocuments/<domain>/<name>.documents.ts`
2. Extract ALL `$varName` declarations from the GraphQL string (both `!` required and optional)
3. For input objects (`input: SomeInputType!`), look up the input type in `frontend/common/graphql/generated/gql/graphql-types.ts` and extract ALL its fields
4. Ensure test `variables` objects include ALL these variables with meaningful values
5. For optional args: pass a non-null value in at least one test, and `null` in at least one test

---

## Tasks

- [x] 1. **Orchestrator: Start Lint Queue Server**
  - Start `~/.bun/bin/bun run scripts/lint-queue-server.ts` as a background process
  - Export `LINT_QUEUE_PORT` (resolve from `scripts/lint-queue-config.ts`)
  - Verify server is responding on `http://localhost:${LINT_QUEUE_PORT}/status`
  - _Requirements: AC-4_

- [x] 2. **Subagent: Fix auth/auth.test.ts**
  - File: `frontend/common/graphql/test/auth/auth.test.ts`
  - Mutations: `demoLoginMutationDocument`, `logoutMutationDocument`, `refreshTokenMutationDocument`
  - Documents: `frontend/common/graphql/sharedDocuments/auth/auth.documents.ts`
  - Args types: `MutationDemoLoginArgs`, `MutationLogoutArgs`, `MutationRefreshTokenArgs`
  - Read test/AGENTS.md, graphql/AGENTS.md, tests.instructions.md
  - Ensure ALL mutation variables (required + optional) appear in test `variables`
  - Run quality loop on the file
  - Write outcome: `outcome/task-02-auth-test-outcome.md`
  - _Requirements: AC-1, AC-2, AC-4, AC-9, AC-10_

- [x] 3. **Subagent: Fix auth/impersonation.test.ts**
  - File: `frontend/common/graphql/test/auth/impersonation.test.ts`
  - Mutations: `startImpersonationMutationDocument`, `endImpersonationMutationDocument`, `createManualInvoiceMutationDocument`
  - Documents: `auth.documents.ts`, `billing/billing-management.documents.ts`
  - Args types: `MutationStartImpersonationArgs`, `MutationEndImpersonationArgs`, `MutationCreateManualInvoiceArgs`
  - Note: `startImpersonation` has optional `reason: String` — test with a reason string and with `null`
  - Note: `createManualInvoice` has many optional args: `billingMonths`, `exchangeRateSnapshot`, `exchangeRateSource`, `sendEmail`, `studentId` — test with values and `null`
  - Read applicable AGENTS.md and instructions
  - Run quality loop, write outcome
  - _Requirements: AC-1, AC-2, AC-4, AC-9, AC-10_

- [x] 4. **Subagent: Fix billing/billing-management.test.ts**
  - File: `frontend/common/graphql/test/billing/billing-management.test.ts`
  - Mutations: `createManualInvoiceMutationDocument`, `deleteInvoiceMutationDocument`, `markInvoicePaidMutationDocument`
  - Documents: `billing/billing-management.documents.ts`
  - Args types: `MutationCreateManualInvoiceArgs`, `MutationDeleteInvoiceArgs`, `MutationMarkInvoicePaidArgs`
  - Note: `createManualInvoice` has 5 optional args; `markInvoicePaid` has optional `expectedVersion`
  - Read applicable AGENTS.md and instructions
  - Run quality loop, write outcome
  - _Requirements: AC-1, AC-2, AC-4, AC-9, AC-10_

- [x] 5. **Subagent: Fix billing/payment-method.test.ts**
  - File: `frontend/common/graphql/test/billing/payment-method.test.ts`
  - Mutations: `createUserPaymentMethodMutationDocument`, `deleteUserPaymentMethodMutationDocument`
  - Documents: `billing/payment-method.documents.ts`
  - Args types: `MutationCreateUserPaymentMethodArgs`, `MutationDeleteUserPaymentMethodArgs`
  - Note: Look up `UserPaymentMethodCreateInput` type for all input fields (required + optional)
  - Read applicable AGENTS.md and instructions
  - Run quality loop, write outcome
  - _Requirements: AC-1, AC-2, AC-4, AC-9, AC-10_

- [x] 6. **Subagent: Fix classes/class-instance-detail.test.ts**
  - File: `frontend/common/graphql/test/classes/class-instance-detail.test.ts`
  - Mutation: `createTeacherManualClassEntryMutationDocument`
  - Documents: `teachers/teacher-dashboard.documents.ts`
  - Args type: `MutationCreateTeacherManualClassEntryArgs`
  - Note: Look up `CreateManualClassEntryInput` type for all input fields
  - Read applicable AGENTS.md and instructions
  - Run quality loop, write outcome
  - _Requirements: AC-1, AC-2, AC-4, AC-9, AC-10_

- [x] 7. **Subagent: Fix classes/class-session.test.ts**
  - File: `frontend/common/graphql/test/classes/class-session.test.ts`
  - Mutations: `activateClassMutationDocument`, `activateOverrideClassMutationDocument`, `cleanupTestEntitiesMutationDocument`, `createTeacherManualClassEntryMutationDocument`, `deleteClassInstanceMutationDocument`, `resetClassMutationDocument`, `updateSessionStatusAbsentMutationDocument`, `updateSessionStatusLeaveMutationDocument`, `updateSessionStatusStartMutationDocument`
  - Documents: `scheduling/class-session.documents.ts`, `shared/test-helper.documents.ts`, `teachers/teacher-dashboard.documents.ts`
  - This is a large file (24 mutation refs) — prioritize ensuring ALL variables for each mutation appear
  - Read applicable AGENTS.md and instructions
  - Run quality loop, write outcome
  - _Requirements: AC-1, AC-2, AC-4, AC-9, AC-10_

- [x] 8. **Subagent: Fix classes/group-class.test.ts**
  - File: `frontend/common/graphql/test/classes/group-class.test.ts`
  - Mutations: `cleanupTestEntitiesMutationDocument`, `cleanupTestGroupClassMutationDocument`, `createTestGroupClassMutationDocument`, `deleteClassInstanceMutationDocument`, `resendClassNotificationsMutationDocument`, `updateClassAdminNoteMutationDocument`
  - Documents: `shared/test-helper.documents.ts`, `classes/group-class.documents.ts`
  - Note: `createTestGroupClass` has required args `classInstanceId` and `teacherName`; ensure both present
  - Read applicable AGENTS.md and instructions
  - Run quality loop, write outcome
  - _Requirements: AC-1, AC-2, AC-4, AC-9, AC-10_

- [x] 9. **Subagent: Fix complaints/complaint.test.ts**
  - File: `frontend/common/graphql/test/complaints/complaint.test.ts`
  - Mutations: `deleteComplaintMutationDocument`, `respondToComplaintMutationDocument`, `submitComplaintMutationDocument`
  - Documents: `complaints/complaint.documents.ts`
  - Args types: `MutationDeleteComplaintArgs`, `MutationRespondToComplaintArgs`, `MutationSubmitComplaintArgs`
  - Note: `respondToComplaint` and `submitComplaint` use input objects — look up `RespondToComplaintInput` and `ComplaintSubmitInput` for ALL fields
  - Read applicable AGENTS.md and instructions
  - Run quality loop, write outcome
  - _Requirements: AC-1, AC-2, AC-4, AC-9, AC-10_

- [x] 10. **Subagent: Fix meeting/meeting-config.test.ts**
  - File: `frontend/common/graphql/test/meeting/meeting-config.test.ts`
  - Mutations: `createMeetingProviderMutationDocument`, `createUserMeetingConfigMutationDocument`, `setDefaultMeetingConfigMutationDocument`
  - Documents: `meeting/meeting.documents.ts`
  - Args types: `MutationCreateMeetingProviderArgs`, `MutationCreateUserMeetingConfigArgs`, `MutationSetDefaultMeetingConfigArgs`
  - Note: Look up `MeetingProviderCreateInput` and `UserMeetingConfigCreateInput` for all input fields
  - Read applicable AGENTS.md and instructions
  - Run quality loop, write outcome
  - _Requirements: AC-1, AC-2, AC-4, AC-9, AC-10_

- [x] 11. **Subagent: Fix notifications/notification-preferences.test.ts**
  - File: `frontend/common/graphql/test/notifications/notification-preferences.test.ts`
  - Mutation: `updateNotificationPreferencesMutationDocument`
  - Documents: `notifications/notification-preferences.documents.ts`
  - Args type: lookup the mutation args type for `MutationUpdateNotificationPreferencesArgs`
  - Note: Look up the input type for notification preferences — ensure ALL optional fields are tested
  - Read applicable AGENTS.md and instructions
  - Run quality loop, write outcome
  - _Requirements: AC-1, AC-2, AC-4, AC-9, AC-10_

- [x] 12. **Subagent: Fix parents/parent-onboarding.test.ts**
  - File: `frontend/common/graphql/test/parents/parent-onboarding.test.ts`
  - Mutation: `createParentMutationDocument`
  - Documents: `parents/parent-onboarding.documents.ts`
  - Args type: `MutationCreateParentArgs`
  - Note: Look up `ParentOnboardingInput` type for ALL input fields (this is a large input type — handle all optional fields)
  - Read applicable AGENTS.md and instructions
  - Run quality loop, write outcome
  - _Requirements: AC-1, AC-2, AC-4, AC-9, AC-10_

- [x] 13. **Subagent: Fix parents/parent.test.ts**
  - File: `frontend/common/graphql/test/parents/parent.test.ts`
  - Mutations: `changeParentLifecycleStatusMutationDocument`, `deactivateParentMutationDocument`, `reactivateParentMutationDocument`, `updateStudentQuotaMutationDocument`
  - Documents: `parents/parent-lifecycle.documents.ts`, `parents/parent-portal.documents.ts`
  - Args types: `MutationChangeParentLifecycleStatusArgs`, `MutationDeactivateParentArgs`, `MutationReactivateParentArgs`, lookup `MutationUpdateStudentQuotaArgs`
  - Read applicable AGENTS.md and instructions
  - Run quality loop, write outcome
  - _Requirements: AC-1, AC-2, AC-4, AC-9, AC-10_

- [x] 14. **Subagent: Fix permissions/permission-group-simulation.test.ts**
  - File: `frontend/common/graphql/test/permissions/permission-group-simulation.test.ts`
  - Mutations: `startPermissionGroupSimulationMutationDocument`, `endPermissionGroupSimulationMutationDocument`
  - Documents: `permissions/permission-management.documents.ts`
  - Args types: `MutationStartPermissionGroupSimulationArgs`, `MutationEndPermissionGroupSimulationArgs`
  - Note: `startPermissionGroupSimulation` requires `groupSlug: String!` — ensure present in all calls
  - Read applicable AGENTS.md and instructions
  - Run quality loop, write outcome
  - _Requirements: AC-1, AC-2, AC-4, AC-9, AC-10_

- [x] 15. **Subagent: Fix reports/report.test.ts**
  - File: `frontend/common/graphql/test/reports/report.test.ts`
  - Mutations: `assignPermissionGroupToUserMutationDocument`, `createPermissionGroupMutationDocument`, `deletePermissionGroupMutationDocument`, `revokePermissionGroupFromUserMutationDocument`
  - Documents: `permissions/permission-management.documents.ts`
  - Args types: `MutationAssignPermissionGroupToUserArgs`, `MutationCreatePermissionGroupArgs`, `MutationDeletePermissionGroupArgs`, `MutationRevokePermissionGroupFromUserArgs`
  - Note: Look up `AssignPermissionGroupToUserInput`, `CreatePermissionGroupInput`, `RevokePermissionGroupFromUserInput` for all fields
  - Read applicable AGENTS.md and instructions
  - Run quality loop, write outcome
  - _Requirements: AC-1, AC-2, AC-4, AC-9, AC-10_

- [x] 16. **Subagent: Fix resources/learning-resource-graphql.test.ts**
  - File: `frontend/common/graphql/test/resources/learning-resource-graphql.test.ts`
  - Mutations: `deleteLearningResourceMutationDocument`, `uploadLearningResourceMutationDocument`
  - Documents: `resources/learning-resource.documents.ts`
  - Args types: `MutationDeleteLearningResourceArgs`, `MutationUploadLearningResourceArgs` (lookup)
  - Note: Look up the upload input type for all fields — likely has many optional fields (file metadata, tags, etc.)
  - Read applicable AGENTS.md and instructions
  - Run quality loop, write outcome
  - _Requirements: AC-1, AC-2, AC-4, AC-9, AC-10_

- [x] 17. **Subagent: Fix scheduling/schedule.test.ts**
  - File: `frontend/common/graphql/test/scheduling/schedule.test.ts`
  - Mutations: `clearWeeklyScheduleMutationDocument`, `deleteRecurringClassMutationDocument`, `executeDstBulkUpdateMutationDocument`
  - Documents: `scheduling/schedule-deletion.documents.ts`, `scheduling/recurring-class.documents.ts`, `scheduling/dst-migration.documents.ts`
  - Args types: `MutationClearWeeklyScheduleArgs`, `MutationDeleteRecurringClassArgs`, `MutationExecuteDstBulkUpdateArgs`
  - Note: `executeDstBulkUpdate` requires `description: String!` and `offsetMinutes: Int!` — ensure both present
  - Read applicable AGENTS.md and instructions
  - Run quality loop, write outcome
  - _Requirements: AC-1, AC-2, AC-4, AC-9, AC-10_

- [x] 18. **Subagent: Fix settings/environment-config.test.ts**
  - File: `frontend/common/graphql/test/settings/environment-config.test.ts`
  - Mutations: `deleteEnvConfigEntryMutationDocument`, `upsertEnvConfigEntryMutationDocument`
  - Documents: `settings/environment-config.documents.ts`
  - Args types: `MutationDeleteEnvConfigEntryArgs`, lookup upsert args type
  - Note: Look up the upsert input type for all fields (likely has key, value, description, etc.)
  - Read applicable AGENTS.md and instructions
  - Run quality loop, write outcome
  - _Requirements: AC-1, AC-2, AC-4, AC-9, AC-10_

- [x] 19. **Subagent: Fix settings/general-settings.test.ts**
  - File: `frontend/common/graphql/test/settings/general-settings.test.ts`
  - Mutation: `upsertSystemSettingMutationDocument`
  - Documents: `settings/general-settings.documents.ts`
  - Args type: `MutationUpsertSystemSettingArgs` (lookup)
  - Note: Look up the system setting input type for all optional fields
  - Read applicable AGENTS.md and instructions
  - Run quality loop, write outcome
  - _Requirements: AC-1, AC-2, AC-4, AC-9, AC-10_

- [x] 20. **Subagent: Fix settings/session-config.test.ts**
  - File: `frontend/common/graphql/test/settings/session-config.test.ts`
  - Mutations: `deleteSessionConfigMutationDocument`, `upsertSessionConfigMutationDocument`
  - Documents: `settings/session-config.documents.ts`
  - Args types: `MutationDeleteSessionConfigArgs`, lookup upsert args type
  - Note: `deleteSessionConfig` requires `roleName: String!` — ensure present
  - Read applicable AGENTS.md and instructions
  - Run quality loop, write outcome
  - _Requirements: AC-1, AC-2, AC-4, AC-9, AC-10_

- [x] 21. **Subagent: Fix settings/site-content-settings.test.ts**
  - File: `frontend/common/graphql/test/settings/site-content-settings.test.ts`
  - Mutations: `deleteSiteContentMutationDocument`, `upsertSiteContentMutationDocument`
  - Documents: `settings/site-content-settings.documents.ts`
  - Args types: `MutationDeleteSiteContentArgs`, lookup upsert args type
  - Note: Look up the site content input type for all optional fields
  - Read applicable AGENTS.md and instructions
  - Run quality loop, write outcome
  - _Requirements: AC-1, AC-2, AC-4, AC-9, AC-10_

- [x] 22. **Subagent: Fix students/status-tracking.test.ts**
  - File: `frontend/common/graphql/test/students/status-tracking.test.ts`
  - Mutation: `changeStudentStatusMutationDocument`
  - Documents: `students/student-status.documents.ts`
  - Args type: `MutationChangeStudentStatusArgs` (`studentId: String!`, `newStatus: StudentStatus!`, `expectedVersion: Int` optional)
  - Note: `expectedVersion` is optional — test with a real version number from a prior query AND with `null`
  - Read applicable AGENTS.md and instructions
  - Run quality loop, write outcome
  - _Requirements: AC-1, AC-2, AC-4, AC-9, AC-10_

- [x] 23. **Subagent: Fix students/student-history.test.ts**
  - File: `frontend/common/graphql/test/students/student-history.test.ts`
  - Mutation: `cleanupTestEntitiesMutationDocument`
  - Documents: `shared/test-helper.documents.ts`
  - Args type: `MutationCleanupTestEntitiesArgs` (6 required fields — ensure all present)
  - Read applicable AGENTS.md and instructions
  - Run quality loop, write outcome
  - _Requirements: AC-1, AC-2, AC-4, AC-9, AC-10_

- [x] 24. **Subagent: Fix students/student-lifecycle.test.ts**
  - File: `frontend/common/graphql/test/students/student-lifecycle.test.ts`
  - Mutations: `changeStudentStatusMutationDocument`, `reassignStudentTeacherMutationDocument`
  - Documents: `students/student-status.documents.ts`, `students/student-lifecycle.documents.ts`
  - Args types: `MutationChangeStudentStatusArgs`, `MutationReassignStudentTeacherArgs`
  - Note: Both have optional `expectedVersion: Int` — ensure tested with a real version AND `null`
  - Read applicable AGENTS.md and instructions
  - Run quality loop, write outcome
  - _Requirements: AC-1, AC-2, AC-4, AC-9, AC-10_

- [x] 25. **Subagent: Fix students/student-onboarding.test.ts**
  - File: `frontend/common/graphql/test/students/student-onboarding.test.ts`
  - Mutations: `createParentMutationDocument`, `createStudentMutationDocument`
  - Documents: `parents/parent-onboarding.documents.ts`, `students/student-onboarding.documents.ts`
  - Args types: `MutationCreateParentArgs`, `MutationCreateStudentArgs`
  - Note: Look up `StudentOnboardingInput` and `ParentOnboardingInput` for ALL optional input fields — these are large types
  - Read applicable AGENTS.md and instructions
  - Run quality loop, write outcome
  - _Requirements: AC-1, AC-2, AC-4, AC-9, AC-10_

- [x] 26. **Subagent: Fix suggestions/suggestion.test.ts**
  - File: `frontend/common/graphql/test/suggestions/suggestion.test.ts`
  - Mutations: `markSuggestionReviewedMutationDocument`, `submitSuggestionMutationDocument`
  - Documents: `suggestions/suggestion.documents.ts`
  - Args types: `MutationMarkSuggestionReviewedArgs`, `MutationSubmitSuggestionArgs`
  - Note: Look up `SubmitSuggestionInput` for all optional fields
  - Read applicable AGENTS.md and instructions
  - Run quality loop, write outcome
  - _Requirements: AC-1, AC-2, AC-4, AC-9, AC-10_

- [x] 27. **Subagent: Fix teachers/manager-directory-graphql.test.ts**
  - File: `frontend/common/graphql/test/teachers/manager-directory-graphql.test.ts`
  - Mutation: `updateManagerProfileMutationDocument`
  - Documents: `teachers/staff-onboarding.documents.ts` or `teachers/staff-directory.documents.ts`
  - Args type: lookup `MutationUpdateManagerProfileArgs`
  - Note: Look up the manager profile update input type for all optional fields
  - Read applicable AGENTS.md and instructions
  - Run quality loop, write outcome
  - _Requirements: AC-1, AC-2, AC-4, AC-9, AC-10_

- [x] 28. **Subagent: Fix teachers/manager-onboarding.test.ts**
  - File: `frontend/common/graphql/test/teachers/manager-onboarding.test.ts`
  - Mutation: `createManagerMutationDocument`
  - Documents: `teachers/staff-onboarding.documents.ts`
  - Args type: `MutationCreateManagerArgs`
  - Note: Look up `ManagerOnboardingInput` for ALL optional input fields — this is a large input type
  - Read applicable AGENTS.md and instructions
  - Run quality loop, write outcome
  - _Requirements: AC-1, AC-2, AC-4, AC-9, AC-10_

- [x] 29. **Subagent: Fix teachers/teacher-dashboard.test.ts**
  - File: `frontend/common/graphql/test/teachers/teacher-dashboard.test.ts`
  - Mutations: `cleanupTestEntitiesMutationDocument`, `createTeacherManualClassEntryMutationDocument`, `deleteClassInstanceMutationDocument`
  - Documents: `shared/test-helper.documents.ts`, `teachers/teacher-dashboard.documents.ts`
  - Args types: `MutationCleanupTestEntitiesArgs`, `MutationCreateTeacherManualClassEntryArgs`, `MutationDeleteClassInstanceArgs`
  - Note: Look up `CreateManualClassEntryInput` for all input fields
  - Read applicable AGENTS.md and instructions
  - Run quality loop, write outcome
  - _Requirements: AC-1, AC-2, AC-4, AC-9, AC-10_

- [x] 30. **Subagent: Fix teachers/teacher-onboarding.test.ts**
  - File: `frontend/common/graphql/test/teachers/teacher-onboarding.test.ts`
  - Mutation: `createTeacherMutationDocument`
  - Documents: `teachers/teacher-onboarding.documents.ts`
  - Args type: `MutationCreateTeacherArgs`
  - Note: Look up `TeacherOnboardingInput` for ALL optional input fields — this is a large input type with many optional fields
  - This file has 20 mutation refs — carefully ensure every mutation call passes all available variables
  - Read applicable AGENTS.md and instructions
  - Run quality loop, write outcome
  - _Requirements: AC-1, AC-2, AC-4, AC-9, AC-10_

- [x] 31. **Subagent: Fix teachers/teacher.test.ts**
  - File: `frontend/common/graphql/test/teachers/teacher.test.ts`
  - Mutation: `updateTeacherProfileMutationDocument`
  - Documents: `teachers/teacher.documents.ts`
  - Args type: lookup `MutationUpdateTeacherProfileArgs`
  - Note: Look up the teacher profile update input type for all optional fields
  - This file has 20 mutation refs — ensure every call passes all available variables
  - Read applicable AGENTS.md and instructions
  - Run quality loop, write outcome
  - _Requirements: AC-1, AC-2, AC-4, AC-9, AC-10_

- [x] 32. **Orchestrator: Process CROSS-FILE DEPENDENCY Reports**
  - Collect all CROSS-FILE DEPENDENCY reports from subagent outcomes
  - Deduplicate by target backend file
  - Dispatch one subagent per unique backend file needing a fix
  - Each backend fix subagent:
    - Read all outcome files
    - Read applicable AGENTS.md: `backend/AGENTS.md`, `backend/services/AGENTS.md` or `backend/graphql/AGENTS.md`, root `AGENTS.md`
    - Read `.agents/instructions/backend.instructions.md`
    - Apply the fix
    - Run quality loop on the backend file
    - Write outcome: `outcome/task-32-backend-fix-<filename>-outcome.md`
  - _Requirements: AC-3, AC-6_

- [x] 33. **Orchestrator: Run Full GraphQL Test Suite**
  - Run `~/.bun/bin/bun run test:graphql` to verify all tests pass
  - If any tests fail, identify the failing test file(s) and dispatch a fix subagent
  - Re-run until all tests pass
  - _Requirements: AC-7_

- [x] 34. **Knowledge Propagation & Documentation**
  - Read all outcome files in `.ai/plans/graphql-mutation-test-args/outcome/` to synthesize all learnings
  - Create canonical reference doc: `docs/testing/mutation-argument-coverage.md`
    - Document the pattern: how to ensure all mutation variables are covered in tests
    - Document the argument discovery process (documents.ts + generated types + schema.graphql)
    - Document rules for optional args (test with value AND null)
    - Document any backend bugs found and how they were fixed
    - Include a rollout summary of files modified
  - Update `frontend/common/graphql/test/AGENTS.md`: Add a "Mutation Argument Coverage" rule section referencing the new doc
  - Update root `AGENTS.md` Important References section with the new doc
  - Update `.agents/instructions/tests.instructions.md`: Add reference to the new doc as required reading
  - Run global check: `~/.bun/bin/bun tsgo`, `~/.bun/bin/bun biome:check`, `~/.bun/bin/bun run lint` (0 errors, 0 warnings)
  - Write outcome file: `outcome/task-34-knowledge-propagation-outcome.md`
  - Update progress: Mark this task as `[x]` in this file
  - _Requirements: AC-8_
