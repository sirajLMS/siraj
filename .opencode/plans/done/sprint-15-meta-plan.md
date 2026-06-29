# Sprint 15 — Meta Plan (Orchestration & Data Collection)

> **Purpose**: Collect, analyze, and verify all data required before authoring the split-file implementation plan for Story 15 (`.ai/siraj_stories/15.md`). Every intermediate outcome is saved under `.ai/siraj_stories/15/temp/`. **Nothing is added to the plan without explicit user confirmation.**

---

## Meta Rules (Mandatory)

1. **User Confirmation Required**: Before adding any task, permission, schema change, or architectural decision to the final plan files, the agent MUST present findings to the user and await explicit approval.
2. **Temp File References**: All intermediate analysis results are saved under `.ai/siraj_stories/15/temp/`.
3. **Conflict Resolution**: If analysis reveals conflicts with existing code, flag them and ask the user.
4. **No Assumptions**: Verify every fact against the actual codebase.
5. **Plan Format Compliance**: Follow the split-file format defined in `AGENTS_STORY_PLANNING.md`.
6. **Story 14 Dependency**: This story builds on Story 14's communication service architecture. All channel implementations must conform to the `CommunicationService` interface defined in Story 14.

---

## Temp File Index

| Temp File | Purpose |
|---|---|
| `temp/M1-schema-analysis.md` | Analysis of suggestion schema changes needed (status, duplicateOfId, adminResponse, reviewedBy, reviewedAt) |
| `temp/M2-permission-gap.md` | Gap analysis: 3 new suggestion permissions + existing communication permissions |
| `temp/M3-communication-service.md` | Analysis of existing CommunicationService interface from Story 14 and channel implementation requirements |
| `temp/M4-notification-infra.md` | Analysis of existing NotificationRepository, notificationDeliveries, userDeviceTokens |
| `temp/M5-storage-integration.md` | Analysis of complaintFiles integration: StorageRepository, file upload patterns, system settings |
| `temp/M6-frontend-analysis.md` | Analysis of existing suggestion admin UI, complaint form, file upload patterns |
| `temp/M7-dependency-graph.md` | Task dependency graph and build order |
| `temp/M8-user-decisions.md` | Log of all user-confirmed decisions |

---

## Meta Tasks (Execution Order)

### Task M1 — Schema Analysis (Suggestions)

**Objective**: Determine exact schema changes needed for suggestion management.

**Actions**:
1. Read `backend/db/schema/communications.ts` — current `suggestions` table definition
2. Read `backend/db/schema/enums.ts` — check for existing suggestion status enum
3. Read `shared/lib/enum.ts` — check for existing SuggestionStatus enum
4. Determine new columns: `status`, `duplicateOfId`, `adminResponse`, `reviewedByUserId`, `reviewedAt`
5. Determine new enum: `SuggestionStatus` (PENDING, REVIEWED, DUPLICATE)
6. Check Drizzle relations for self-referencing FK pattern

**Output**: `temp/M1-schema-analysis.md`

---

### Task M2 — Permission Gap Analysis

**Objective**: Confirm 3 new suggestion admin permissions + verify existing communication permissions.

**Actions**:
1. Verify existing `complaints.*` permissions in enum + migration
2. Verify `support.submit_complaint`, `support.view_history`, `communication.submit_suggestion`, `system.dispatch_email` exist (from Story 14)
3. Define 3 new permissions: `suggestions.list`, `suggestions.review`, `suggestions.delete`
4. Determine group assignments

**Output**: `temp/M2-permission-gap.md`

---

### Task M3 — Communication Service Analysis

**Objective**: Understand the CommunicationService interface from Story 14 and what channel implementations need.

**Actions**:
1. Read Story 14 plan files for CommunicationService interface definition
2. Read existing `notification-alerts.service.ts` for notification patterns
3. Determine channel implementation contract
4. Determine email template requirements (Resend)
5. Determine SMS template requirements (Twilio)
6. Determine push notification requirements (FCM)

**Output**: `temp/M3-communication-service.md`

---

### Task M4 — Notification Infrastructure Analysis

**Objective**: Audit existing notification delivery infrastructure.

**Actions**:
1. Read `backend/db/repo/notification.repository.ts` — full CRUD for deliveries
2. Read `backend/types/communications.types.ts` — notification types
3. Check `NotificationChannel`, `NotificationEventType`, `NotificationDeliveryStatus` enums
4. Check `userDeviceTokens` table and `DevicePlatform` enum
5. Determine what needs to be added/modified

**Output**: `temp/M4-notification-infra.md`

---

### Task M5 — Storage & File Integration Analysis

**Objective**: Audit complaint file attachment infrastructure.

**Actions**:
1. Read `backend/db/schema/storage.ts` — `complaintFiles` table
2. Read `backend/db/repo/storage.repository.ts` — `registerFileUsage`, `unregisterFileUsage` for complaints
3. Read `frontend/views/dashboard/resources/components/ResourceUploadDropzone.tsx` — existing upload pattern
4. Check system settings seeder for existing config keys
5. Determine new system settings keys needed

**Output**: `temp/M5-storage-integration.md`

---

### Task M6 — Frontend Analysis

**Objective**: Audit existing frontend components for suggestion admin and complaint file upload.

**Actions**:
1. Read suggestion admin components: `AdminSuggestionsContainer`, `AdminSuggestionsView`, `SuggestionsDataGrid`, `SuggestionsCardList`
2. Read complaint form: `ComplaintFormFields`, `ParentComplaintsView`
3. Read `ResourceUploadDropzone` for file upload pattern
4. Check for existing duplicate/search UI patterns
5. Determine new components needed

**Output**: `temp/M6-frontend-analysis.md`

---

### Task M7 — Dependency Graph & Build Order

**Objective**: Construct task sequence.

**Output**: `temp/M7-dependency-graph.md`

---

### Task M8 — User Decision Log

**Objective**: Consolidate all confirmations.

**Output**: `temp/M8-user-decisions.md`

---

## Post-Collection: Plan Authoring

```
.ai/siraj_stories/15/
├── section-0-metadata.md
├── section-1-core-principles.md
├── section-2-rbac-permissions.md
├── section-3-state-machine.md          (suggestion status transitions)
├── section-4-security-threats.md
├── section-5-prerequisites.md
├── section-6-tasks/
│   ├── task-a-migration-schema-permissions.md
│   ├── task-b-repositories.md
│   ├── task-c-communication-channels.md
│   ├── task-d-services.md
│   ├── task-e-repo-tests.md
│   ├── task-f-graphql-pothos.md
│   ├── task-g-frontend-documents.md
│   ├── task-h-type-extraction.md
│   ├── task-i-graphql-tests.md
│   ├── task-j-storybook-migration.md
│   ├── task-k-frontend-stores.md
│   ├── task-l-frontend-views.md
│   ├── task-m-system-settings.md
│   └── task-n-i18n.md
├── section-7-final-verification.md
└── appendix.md
```
