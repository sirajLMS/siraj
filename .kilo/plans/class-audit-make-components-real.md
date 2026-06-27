# Class Audit Page — Make Components Real

## Overview

The `/classes/[id]/audit` page currently renders from a Zustand store (`classAuditStore`) that is **never populated** — `audit` is always `null` and all actions are stubs. This plan covers the full stack implementation to make every component real: new DB tables, GraphQL API, backend services, and frontend wiring.

---

## User Decisions

| Decision | Choice |
|----------|--------|
| Data model | **1:N group class model** — new DB tables needed |
| Resend Notifications | **Build full backend mutation** |
| Admin Note UI | **Dialog with TextField** |
| Venue | **All online, no physical venues** — replace VenueLocationCard with online meeting info |
| Communication Log | **Both** notification_deliveries + class_status_events |
| Scope | **Full stack**: DB tables + schema, GraphQL, services, frontend |

---

## Phase 1: Database Schema

### 1.1 New tables in `backend/db/schema/`

**`group_classes` table:**
- `id` (uuid, PK)
- `classInstanceId` (uuid, FK → classInstances.id, ON DELETE CASCADE)
- `courseName` (varchar 255, not null)
- `teacherName` (varchar 255, not null)
- `classType` (classTypeEnum, not null)
- `originalDate` (timestamp, nullable) — if rescheduled
- `rescheduledDate` (timestamp, nullable) — new date
- `timeSlot` (varchar 100, not null) — display string
- `status` (varchar 50, not null) — e.g. "regular_rescheduled"
- `auditRemark` (text, nullable)
- `auditLoggedAt` (timestamp, not null)
- `createdAt` / `updatedAt` (timestamps)

**`group_class_enrollments` table:**
- `id` (uuid, PK)
- `groupClassId` (uuid, FK → group_classes.id, ON DELETE CASCADE)
- `studentId` (uuid, FK → students.id, ON DELETE RESTRICT)
- `studentIdNumber` (varchar 50, nullable) — display ID
- `attendanceStatus` (varchar 20, not null, default "pending") — pending/present/absent
- `createdAt` / `updatedAt` (timestamps)
- Unique index on (groupClassId, studentId)

**`class_communications` table:**
- `id` (uuid, PK)
- `groupClassId` (uuid, FK → group_classes.id, ON DELETE CASCADE)
- `type` (varchar 20, not null) — email / sms / system
- `title` (varchar 255, not null)
- `description` (text, nullable)
- `isActive` (boolean, not null, default true)
- `isDelivered` (boolean, nullable)
- `notificationDeliveryId` (uuid, nullable, FK → notificationDeliveries.id)
- `classStatusEventId` (uuid, nullable, FK → classStatusEvents.id)
- `timestamp` (timestamp, nullable)
- `createdAt` (timestamp, not null)

### 1.2 Update `backend/db/schema/index.ts`
- Export new tables

### 1.3 Update `backend/types/`
- Create `group-class.types.ts` with `GroupClassSelectType`, `GroupClassInsertType`, `GroupClassEnrollmentSelectType`, `GroupClassReturnType`, `GroupClassAuditReturnType`
- Export from `backend/types/index.ts`

### 1.4 Generate migration
- `bun run db` to generate and apply the migration

---

## Phase 2: Repository Layer

### 2.1 `backend/db/repo/group-class.repository.ts`
- `getById(id)` — fetch group class with enrollments and communications
- `getByClassInstanceId(classInstanceId)` — fetch group class by linked class instance
- `create(data)` — insert group class with enrollments
- `updateAdminNote(id, adminNoteText)` — update adminNotes on linked classInstance
- `getCommunications(groupClassId)` — fetch communications
- `getEnrollments(groupClassId)` — fetch student enrollments with student details

### 2.2 Tests in `backend/db/test/repo/group-class.repository.test.ts`
- 100% coverage per project standards
- Use `runInRollback` wrapper
- Import types from `@/backend/types`

---

## Phase 3: Service Layer

### 3.1 `backend/services/group-class/group-class.service.ts`
- `getGroupClassAudit(userId, classInstanceId, locale?)` — permission-gated fetch that assembles the full audit data (group class + enrollments + communications + admin note + meeting info)
- `updateAdminNote(userId, classInstanceId, noteContent, locale?)` — permission-gated update of classInstances.adminNotes
- `resendNotifications(userId, classInstanceId, locale?)` — resend notifications for class participants

### 3.2 `backend/services/group-class/notification-resend.service.ts`
- Per `AGENTS.md` services rules: domain-driven, not monolithic
- Uses notification infrastructure from `notification-sync.service.ts` / `notification-alerts.service.ts`
- Creates new `notificationDeliveries` entries for class participants
- Localized error messages via `getBackendTranslations`

---

## Phase 4: GraphQL / Pothos Layer

### 4.1 `backend/graphql/pothos/group-class.pothos.ts`

**Object types** (using types from `@/backend/types`):
- `GroupClassAudit` — main audit object with:
  - id, className, courseCode, teacherName, originalDate, rescheduledDate, timeSlot, status, auditRemark, auditLoggedAt
  - `registeredStudentCount`, `totalStudentCount`
  - `students: [GroupClassStudent]`
  - `meetingInfo: OnlineMeetingInfo` — replaces venue
  - `communications: [CommunicationLogEntry]`
  - `adminNote: AdminNoteInfo`
- `GroupClassStudent` — student enrollment with attendance
- `OnlineMeetingInfo` — zoomMeetingUrl, platform, meetingId, joinUrl
- `CommunicationLogEntry` — from class_communications
- `AdminNoteInfo` — content + lastUpdated
- `GroupClassEnrollmentInput` — for resending notifications

**Queries:**
- `groupClassAudit(classInstanceId: ID!): GroupClassAudit` — fetches all audit data

**Mutations:**
- `updateClassAdminNote(classInstanceId: ID!, content: String!): ClassInstanceDetail` — updates adminNotes on classInstance
- `resendClassNotifications(classInstanceId: ID!): SupportRequestResult` — resends notifications

### 4.2 Export from `backend/graphql/pothos/index.ts`

### 4.3 Run codegen
- `bun run generate:gqlSchema && bun codegen`

---

## Phase 5: Frontend GraphQL Documents

### 5.1 `frontend/graphql/sharedDocuments/group-class.documents.ts`

```ts
// Query
export const groupClassAuditQueryDocument = gql`
  query groupClassAudit($classInstanceId: ID!) {
    groupClassAudit(classInstanceId: $classInstanceId) {
      id
      className
      courseCode
      teacherName
      originalDate
      rescheduledDate
      timeSlot
      status
      auditRemark
      auditLoggedAt
      registeredStudentCount
      totalStudentCount
      students { id name studentId initials attendanceStatus avatarUrl }
      meetingInfo { platform zoomMeetingUrl meetingId joinUrl }
      communications { id type title description isActive isDelivered timestamp }
      adminNote { content lastUpdated }
    }
  }
`;

// Mutations
export const updateClassAdminNoteMutationDocument = gql`
  mutation updateClassAdminNote($classInstanceId: ID!, $content: String!) {
    updateClassAdminNote(classInstanceId: $classInstanceId, content: $content) {
      id
      adminNotes
    }
  }
`;

export const resendClassNotificationsMutationDocument = gql`
  mutation resendClassNotifications($classInstanceId: ID!) {
    resendClassNotifications(classInstanceId: $classInstanceId) {
      id
      success
    }
  }
`;
```

### 5.2 Export from `frontend/graphql/sharedDocuments/index.ts`

### 5.3 Re-run codegen

---

## Phase 6: Frontend Changes

### 6.1 Remove `classAuditStore`
- Delete `frontend/stores/classAuditStore.ts` (or keep only for local UI state like dialog open/close)
- Per `frontend/stores/AGENTS.md`: stores should use GraphQL generated types, not custom types

### 6.2 Remove local `types.ts`
- Delete `frontend/views/dashboard/classes/audit/types.ts`
- Use generated `Operations.GroupClassAuditQuery` types instead
- Per `backend/types/AGENTS.md` and `frontend/graphql/AGENTS.md`: no local type definitions

### 6.3 Rewrite `ClassAuditContainer.tsx`
- Read `id` from `useParams()` (same pattern as `ClassDetailsContainer`)
- Use `useQuery(groupClassAuditQueryDocument, { variables: { classInstanceId: id } })`
- Use `useMutation(updateClassAdminNoteMutationDocument)` for admin note
- Use `useMutation(resendClassNotificationsMutationDocument)` for notifications
- Wire `onGenerateReport` → client-side CSV/Blob download
- Wire `onEditClass` → `router.push(\`/${locale}/reschedule?classInstanceId=${id}\`)`
- Wire `onExportStudents` → client-side CSV download from students data
- Wire `onViewStudent` → `router.push(\`/${locale}/students/${studentId}/status\`)`
- Wire `onViewMap` → replaced with "Join Meeting" → `window.open(zoomMeetingUrl, '_blank')`
- Wire `onResendNotifications` → call mutation
- Wire `onUpdateAdminNote` / `onEditAdminNote` → open dialog, submit mutation on save
- Add loading/error states (CircularProgress + Alert, same pattern as ClassDetailsContainer)

### 6.4 Update `ClassAuditView.tsx`
- Change prop types from `ClassAuditData` to generated query type
- Change `VenueInfo` prop → `OnlineMeetingInfo` prop
- Rename `onViewMap` → `onJoinMeeting`
- Add `onOpenAdminNoteDialog` for the admin note edit flow

### 6.5 Replace `VenueLocationCard.tsx` → `OnlineMeetingCard.tsx`
- Remove MeetingRoomOutlined / map icon
- Show meeting platform icon (Zoom), meeting URL, meeting ID
- Replace "View Map" button → "Join Meeting" button (opens zoomMeetingUrl)
- Remove capacity badge (not relevant for online)
- Keep mobile/desktop responsive variants

### 6.6 Update `AdminNoteCard.tsx`
- Add Dialog state management for note editing
- "Update"/"Edit" → opens `<Dialog>` with `<TextField>` pre-filled with current note
- Save button → calls `updateClassAdminNote` mutation
- Refetch query on completion
- Show loading spinner during mutation

### 6.7 Update `CommunicationLogCard.tsx`
- Data now comes from merged notifications + status events (via `class_communications` table)
- "Resend Notifications" → calls `resendClassNotifications` mutation
- Show success/error feedback after mutation

### 6.8 Update `RegisteredStudentsSection.tsx`
- Data from `GroupClassStudent` type (generated)
- Export button → CSV download
- View student → router navigation

### 6.9 Update `ClassAuditDetailsCard.tsx`
- Data from generated query type

### 6.10 Update `ClassAuditContainer.stories.tsx`
- Provide mock GraphQL data via Storybook Apollo mock provider

---

## Phase 7: Seed Data

### 7.1 `backend/db/seeds/group-class.seed.ts`
- Create sample group classes linked to existing class instances
- Create enrollments linking students
- Create sample communication entries
- Per `backend/db/seeds/AGENTS.md` rules

---

## Phase 8: Quality

- Run `bun quality-gate`
- Fix any lint/biome/sonar/tsgo issues
- Run DB tests: `bun run test:db`
- Run GraphQL tests: `bun run test:graphql`

---

## Execution Order

1. DB schema (tables, types, migration)
2. Repository layer + tests
3. Service layer
4. Pothos/GraphQL definitions
5. Codegen
6. Frontend GraphQL documents
7. Frontend component updates (container → view → sub-components)
8. Seed data
9. Quality gate
