# Task 3.2: GraphQL Layer Rollout & Integration Verification (Dynamic 16-Worker Pool Watcher)

**Plan File:** `.ai/plans/neon/gql_loadable/tasks_deepseek4pro.md`
**Parent Task:** `.ai/plans/neon/tasks.md` § 3.2
**Pilot Reference:** `.ai/plans/neon/outcome/3.1-graphql-dataloader-pilot-outcome.md`
**Canonical Pattern Doc:** `docs/graphql/dataloader-batching.md`
**Rollout Tracker:** `.ai/plans/neon/graphql-rollout-tracker.json` (to be created)

---

## 1. Context & Prior Art

### 1.1 What Task 3.1 (Pilot) Established

The `users` domain pilot (`backend/graphql/pothos/users/user.pothos.ts`) demonstrated three DataLoader patterns:

- **Pattern A — `loadableObject`**: Top-level entity type with `load: (ids) => Repository.loadByIds(ids)`, `sort: entity => entity.id`
- **Pattern B — `t.loadable()` for scalars**: `{ type: "String", load: (ids) => batchService(ids), resolve: parent => parent.id }`
- **Pattern C — `t.loadable()` for cross-type refs**: `{ type: OtherPothosObject, load: (ids, ctx) => OtherPothosObject.getDataloader(ctx).loadMany(ids), resolve: parent => parent.otherId }`

Batch infrastructure created:
- `TeacherRepository.findByUserIds(userIds, tx?)` → `Map<string, string | null>`
- `ParentRepository.findByUserIds(userIds, tx?)` → `Map<string, string | null>`
- `PermissionsService.getUserContexts(userIds)` → `Map<string, UserPermissionContext>`
- `TeacherPortalService.resolveTeacherIdsForUsers(userIds)` → `Map<string, string | null>`
- `ParentPortalService.resolveParentIdsForUsers(userIds)` → `Map<string, string | null>`

### 1.2 Known Limitations (from pilot)

1. **`t.loadable()` does NOT support list-typed returns** — use `t.field()` for array fields
2. **`inArray` + `sql.placeholder` in prepared statements fails** — batch repo methods MUST use dynamic queries, not prepared statements
3. **Dynamic `await import()` in resolvers breaks Bun ESM** — use top-level static imports only

### 1.3 Task 2.2 Rollout Pattern (to replicate)

The repo rollout used a parent orchestrator with a dynamic 16-worker pool. Each subagent:
- Was assigned a single file
- Read all outcome files before starting
- Refactored its file, ran per-file quality verification, wrote an outcome file
- The orchestrator tracked state in `repo-rollout-tracker.json` and replenished the pool

---

## 2. Domain Inventory (19 Domains)

All domains under `backend/graphql/pothos/` (excluding `shared/` which has no N+1 issues):

| # | Domain | Files | N+1 Fields | Enum Violations | Already DataLoader? |
|---|--------|-------|-----------|-----------------|---------------------|
| 1 | `auth/` | 2 | `targetUser`, `actorUser` on `ImpersonationStatus` | None | `targetUser` on `StartImpersonationResponse` |
| 2 | `billing/` | 10 | `displayAmount` (4 files), `paymentMethodSnapshot` (1 file) | `InvoicePaymentSubmissionStatus`, `FxProviderConfigSource` | None |
| 3 | `books/` | 2 | `displayAmount` on `AttendanceReportPaidAmount` | None | None |
| 4 | `classes/` | 7 | `effectiveMeeting`/`meetingJoinUrl` (4), `completedInstance`/`rescheduledInstance` (2), `resources` (1) | None | `class-category` (loadableObjectRef), `class-subject.category` (t.loadable) |
| 5 | `complaints/` | 2 | None | None | None |
| 6 | `meeting/` | 2 | `provider` (2 fields) | None | None |
| 7 | `notifications/` | 2 | None | None | None |
| 8 | `parents/` | 8 | `displayAmount` (1), `effectiveMeeting`/`meetingJoinUrl` (2) | None | None |
| 9 | `permissions/` | 3 | `assignedUsers` (cached, low priority) | None | None |
| 10 | `profile/` | 1 | None | None | None |
| 11 | `reports/` | 1 | None | None | None |
| 12 | `scheduling/` | 4 | None | None | None |
| 13 | `storage/` | 2 | None | None | None |
| 14 | `students/` | 7 | None | None | `student` (loadableObjectRef) |
| 15 | `supervisor/` | 1 | None | None | None |
| 16 | `system/` | 6 | None | None | None |
| 17 | `teachers/` | 9 | `displayAmount` (3), `effectiveMeeting`/`meetingJoinUrl` (2) | `TeacherProgressFeedEventKind` | None |
| 18 | `users/` | 1 | None (pilot complete) | None | Fully DataLoader |

**Total: 18 domains** (19 minus `shared/`). 16-worker pool means all can run concurrently with 2 slots to spare.

---

## 3. N+1 Hotspots by Root Cause

### Group A: `displayAmount` via `FxDisplayService.convertForDisplay()` — 9 occurrences

| File | Field | Parent Type |
|------|-------|-------------|
| `billing/billing-alerts.pothos.ts` | `displayAmount` | `UnpaidInvoiceItem` |
| `billing/billing-history.pothos.ts` | `displayAmount` | `ParentInvoiceRow` |
| `billing/billing-history.pothos.ts` | `displayAmount` | `BillingCurrencyTotal` |
| `billing/billing-management.pothos.ts` | `displayAmount` | `ManualInvoiceResult` |
| `billing/billing-payments.pothos.ts` | `displayAmount` | `Payment` |
| `billing/fx-display.pothos.ts` | `resolveDisplayAmountField()` | (root cause helper) |
| `books/report.pothos.ts` | `displayAmount` | `AttendanceReportPaidAmount` |
| `parents/parent-profile.pothos.ts` | `displayAmount` | `ParentProfile` |
| `teachers/teacher-portal.pothos.ts` | `displayAmount` | `TeacherOwnProfile` |
| `teachers/staff-profile.pothos.ts` | `displayAmount` | `TeacherProfileResult` |
| `teachers/staff-directory.pothos.ts` | `displayAmount` | `ManagerDirectoryRow` |

**Root cause:** `resolveDisplayAmountField()` in `fx-display.pothos.ts` calls `FxDisplayService.convertForDisplay(lockedAmount, lockedCurrency, displayCurrency, entityId)` per parent.

**Batch solution:** Create `FxDisplayService.convertForDisplayBatch(items)` that groups by `(lockedCurrency, displayCurrency)` pairs, resolves exchange rates once per pair, then computes each item. Returns `Map<entityId, DisplayAmountReturnType | null>`.

### Group B: `effectiveMeeting` / `meetingJoinUrl` (6 occurrences across 3 files)

| File | Field | Parent Type |
|------|-------|-------------|
| `classes/class-session.pothos.ts` | `effectiveMeeting` | `ClassInstanceDetail` |
| `classes/class-session.pothos.ts` | `meetingJoinUrl` | `ClassInstanceDetail` |
| `classes/class-session.pothos.ts` | `effectiveMeeting` | `FutureClass` |
| `classes/class-session.pothos.ts` | `meetingJoinUrl` | `FutureClass` |
| `teachers/teacher-dashboard.pothos.ts` | `effectiveMeeting` | `TeacherDashboardScheduleRow` |
| `teachers/teacher-dashboard.pothos.ts` | `meetingJoinUrl` | `TeacherDashboardScheduleRow` |
| `parents/parent-dashboard.pothos.ts` | `effectiveMeeting` | `ParentDashboardScheduleRow` |
| `parents/parent-dashboard.pothos.ts` | `meetingJoinUrl` | `ParentDashboardScheduleRow` |

**Root cause:** `resolveEffectiveMeetingForClassInstanceFromContext()` calls `EffectiveMeetingService.resolveForClassInstance(classInstanceId, tErrors)` per parent. Each call does 3-5 DB queries (class config, class instance, recurring schedule, teacher user, user meeting config).

**Batch solution:** Create `EffectiveMeetingService.resolveForClassInstances(instanceIds: string[], tErrors, tx?)` returning `Map<string, EffectiveMeetingReturnType>`.

### Group C: `completedInstance` / `rescheduledInstance` (2 occurrences)

| File | Field | Parent Type |
|------|-------|-------------|
| `classes/class-session.pothos.ts` | `completedInstance` | `LeaveProcessResult` |
| `classes/class-session.pothos.ts` | `rescheduledInstance` | `LeaveProcessResult` |

**Root cause:** `ClassSessionService.getClassInstanceDetail(userId, instanceId, ...)` per parent.

**Batch solution:** Create `ClassSessionService.getClassInstanceDetails(userId, instanceIds: string[], ...)` returning `Map<string, ClassInstanceDetailReturnType>`.

### Group D: `provider` on meeting configs (2 occurrences)

| File | Field | Parent Type |
|------|-------|-------------|
| `meeting/meeting.pothos.ts` | `provider` | `UserMeetingConfig` |
| `meeting/meeting.pothos.ts` | `provider` | `ClassMeetingConfig` |

**Root cause:** `MeetingProviderCatalogService.getProviderById(userId, providerId, tErrors)` per parent.

**Batch solution:** Create `MeetingProviderRepository.getByIds(ids, tx?)` → `Map<string, MeetingProviderSelectType>` and `MeetingProviderCatalogService.getProvidersByIds(userId, ids, tErrors)` → `Map<string, MeetingProviderReturnType>`.

### Group E: `targetUser` / `actorUser` on `ImpersonationStatus` (2 occurrences)

| File | Field | Parent Type |
|------|-------|-------------|
| `auth/impersonation.pothos.ts` | `targetUser` | `ImpersonationStatus` |
| `auth/impersonation.pothos.ts` | `actorUser` | `ImpersonationStatus` |

**Root cause:** `UserRepository.findById(parent.targetUserId)` and `UserRepository.findById(parent.actorUserId)` per parent.

**Batch solution:** Convert to `t.loadable` delegating to `UserPothosObject.getDataloader(ctx).loadMany(ids)`. No new batch methods needed — `UserPothosObject` is already a `loadableObject`.

### Group F: `resources` on `ClassSubject` (1 occurrence)

| File | Field | Parent Type |
|------|-------|-------------|
| `classes/class-subject.pothos.ts` | `resources` | `ClassSubject` |

**Root cause:** `ClassSubjectService.getSubjectResources(userId, subjectId, tErrors)` per parent.

**Batch solution:** Batch repo method `SubjectResourceRepository.loadResourcesBySubjectIds(subjectIds, tx?)` already exists. Create `ClassSubjectService.getSubjectResourcesBatch(userId, subjectIds, tErrors)` → `Map<string, SubjectResourceReturnType[]>`.

### Group G: `paymentMethodSnapshot` (2 occurrences)

| File | Field | Parent Type |
|------|-------|-------------|
| `billing/billing-payments.pothos.ts` | `paymentMethodSnapshot` | `Payment` |
| `billing/billing-payments.pothos.ts` | `paymentMethodSnapshot` | `TeacherPayment` |

**Root cause:** `shouldRevealPaymentSnapshot()` calls `PermissionsService.hasPermission()` per parent.

**Batch solution:** Create `PermissionsService.hasPermissionsBatch(userId, permissions[])` or convert to `t.loadable` with a batch permission check.

---

## 4. Enum Registration Violations

| # | File | Inline Enum | Values | Fix |
|---|------|-------------|--------|-----|
| 1 | `billing/billing-management.pothos.ts:122` | `InvoicePaymentSubmissionStatus` | `pending`, `approved`, `rejected` | Add enum to `backend/enum/billing/billing.enum.ts`, register in `shared/enum.pothos.ts`, import from there |
| 2 | `billing/fx-ingestion.pothos.ts:29` | `FxProviderConfigSource` | `env`, `database` | Add enum to `backend/enum/fx/fx-provider.enum.ts`, register in `shared/enum.pothos.ts`, import from there |
| 3 | `teachers/teacher-dashboard.pothos.ts:22` | `TeacherProgressFeedEventKind` | `auto_missed`, `marked_absent`, `activated`, `started`, `completed`, `leave`, `other` | Create `backend/enum/teachers/teacher-progress-feed.enum.ts`, register in `shared/enum.pothos.ts`, import from there |

---

## 5. Dependency Graph

```
Phase 1 — Shared Batch Infrastructure (3 subagents, must complete before Phase 2 consumers):
┌──────────────────────────────────────────────────────────────┐
│ billing/fx-display.pothos.ts                                 │
│   Creates: FxDisplayService.convertForDisplayBatch()         │
│   Consumed by: billing/*, books/, parents/, teachers/        │
├──────────────────────────────────────────────────────────────┤
│ classes/class-session.pothos.ts                              │
│   Creates: EffectiveMeetingService.resolveForClassInstances()│
│            ClassSessionService.getClassInstanceDetails()     │
│   Consumed by: teachers/, parents/                           │
├──────────────────────────────────────────────────────────────┤
│ meeting/meeting.pothos.ts                                    │
│   Creates: MeetingProviderRepository.getByIds()              │
│   Consumed by: (self-contained)                              │
└──────────────────────────────────────────────────────────────┘

Phase 2 — Domain Refactoring (15 subagents, can run in parallel after Phase 1):
  auth/          → uses UserPothosObject.getDataloader() (already exists)
  billing/*      → uses FxDisplayService.convertForDisplayBatch()
  books/         → uses FxDisplayService.convertForDisplayBatch()
  classes/*      → uses own batch methods from Phase 1
  complaints/    → quality check only
  notifications/ → quality check only
  parents/       → uses FxDisplayService + EffectiveMeetingService batch methods
  permissions/   → low priority (cached), quality check
  profile/       → quality check only
  reports/       → quality check only
  scheduling/    → quality check only
  storage/       → quality check only
  students/      → quality check only (already DataLoader)
  supervisor/    → quality check only
  system/        → quality check only
  teachers/      → uses FxDisplayService + EffectiveMeetingService batch methods
  users/         → quality check only (pilot complete)
```

---

## 6. Per-Domain Subagent Work Items

### 6.1 `auth/` Domain

**Files:** `auth.pothos.ts`, `impersonation.pothos.ts`, `index.ts`

**N+1 Fields to Fix:**
- `ImpersonationStatus.targetUser` (line 24-32): `UserRepository.findById(parent.targetUserId)` → `t.loadable` delegating to `UserPothosObject.getDataloader(ctx).loadMany(ids)`
- `ImpersonationStatus.actorUser` (line 33-41): `UserRepository.findById(parent.actorUserId)` → `t.loadable` delegating to `UserPothosObject.getDataloader(ctx).loadMany(ids)`

**Already DataLoader:** `StartImpersonationResponse.targetUser` (line 55-59) uses `t.loadable` correctly.

**Enum violations:** None.

**Batch methods needed:** None (reuses existing `UserPothosObject` DataLoader).

### 6.2 `billing/` Domain

**Files:** `billing-alerts.pothos.ts`, `billing-history.pothos.ts`, `billing-management.pothos.ts`, `billing-payments.pothos.ts`, `credit.pothos.ts`, `currency.pothos.ts`, `currency-hedge.pothos.ts`, `fx-display.pothos.ts`, `fx-ingestion.pothos.ts`, `payment-method.pothos.ts`, `index.ts`

**N+1 Fields to Fix:**
- `billing-alerts.pothos.ts`: `displayAmount` on `UnpaidInvoiceItem` → `t.loadable` using `FxDisplayService.convertForDisplayBatch()`
- `billing-history.pothos.ts`: `displayAmount` on `ParentInvoiceRow` and `BillingCurrencyTotal` → `t.loadable`
- `billing-management.pothos.ts`: `displayAmount` on `ManualInvoiceResult` → `t.loadable`
- `billing-payments.pothos.ts`: `displayAmount` on `Payment` → `t.loadable`; `paymentMethodSnapshot` on `Payment` and `TeacherPayment` → `t.loadable` with batch permission check
- `fx-display.pothos.ts`: Refactor `resolveDisplayAmountField()` to use batch version

**Enum violations:**
- `billing-management.pothos.ts:122`: Move `InvoicePaymentSubmissionStatus` to `backend/enum/billing/billing.enum.ts`, register in `shared/enum.pothos.ts`
- `fx-ingestion.pothos.ts:29`: Move `FxProviderConfigSource` to `backend/enum/fx/fx-provider.enum.ts`, register in `shared/enum.pothos.ts`

**Batch methods to create:**
- `FxDisplayService.convertForDisplayBatch(items, tx?, locale?)` → `Map<string, DisplayAmountReturnType | null>`
- `PermissionsService.hasPermissionsBatch(userIds: string[], permission: string)` → `Map<string, boolean>`

### 6.3 `books/` Domain

**Files:** `book.pothos.ts`, `report.pothos.ts`, `index.ts`

**N+1 Fields to Fix:**
- `report.pothos.ts`: `displayAmount` on `AttendanceReportPaidAmount` → `t.loadable` using `FxDisplayService.convertForDisplayBatch()`

**Enum violations:** None.

**Batch methods needed:** None (reuses `FxDisplayService.convertForDisplayBatch()`).

### 6.4 `classes/` Domain

**Files:** `class-category.pothos.ts`, `class-session.pothos.ts`, `class-subject.pothos.ts`, `dst-migration.pothos.ts`, `group-class.pothos.ts`, `lesson-report.pothos.ts`, `recurring-class.pothos.ts`, `index.ts`

**N+1 Fields to Fix:**
- `class-session.pothos.ts`: `effectiveMeeting` and `meetingJoinUrl` on `ClassInstanceDetail` → `t.loadable` using `EffectiveMeetingService.resolveForClassInstances()`
- `class-session.pothos.ts`: `effectiveMeeting` and `meetingJoinUrl` on `FutureClass` → `t.loadable`
- `class-session.pothos.ts`: `completedInstance` and `rescheduledInstance` on `LeaveProcessResult` → `t.loadable` using `ClassSessionService.getClassInstanceDetails()`
- `class-subject.pothos.ts`: `resources` on `ClassSubject` → `t.loadable` using `ClassSubjectService.getSubjectResourcesBatch()`

**Already DataLoader:** `class-category.pothos.ts` (loadableObjectRef), `class-subject.pothos.ts` `category` field (t.loadable).

**Enum violations:** None.

**Batch methods to create:**
- `EffectiveMeetingService.resolveForClassInstances(instanceIds: string[], tErrors, tx?)` → `Map<string, EffectiveMeetingReturnType>`
- `ClassSessionService.getClassInstanceDetails(userId: string, instanceIds: string[], tErrors, tx?)` → `Map<string, ClassInstanceDetailReturnType>`
- `ClassSubjectService.getSubjectResourcesBatch(userId: string, subjectIds: string[], tErrors)` → `Map<string, SubjectResourceReturnType[]>`

### 6.5 `complaints/` Domain

**Files:** `complaint.pothos.ts`, `complaintResponses.pothos.ts`, `index.ts`

**N+1 Fields:** None (all `t.expose`).

**Enum violations:** None.

**Work:** Quality verification only. Verify no N+1 patterns were missed.

### 6.6 `meeting/` Domain

**Files:** `effective-meeting.pothos.ts`, `meeting.pothos.ts`, `index.ts`

**N+1 Fields to Fix:**
- `meeting.pothos.ts`: `provider` on `UserMeetingConfig` → `t.loadable` using `MeetingProviderCatalogService.getProvidersByIds()`
- `meeting.pothos.ts`: `provider` on `ClassMeetingConfig` → `t.loadable`

**Enum violations:** None.

**Batch methods to create:**
- `MeetingProviderRepository.getByIds(ids: string[], tx?)` → `Map<string, MeetingProviderSelectType>`
- `MeetingProviderCatalogService.getProvidersByIds(userId: string, ids: string[], tErrors)` → `Map<string, MeetingProviderReturnType>`

### 6.7 `notifications/` Domain

**No N+1 issues.** Quality verification only.

### 6.8 `parents/` Domain

**Files:** `parent-dashboard.pothos.ts`, `parent-directory.pothos.ts`, `parent-document.pothos.ts`, `parent-lifecycle.pothos.ts`, `parent-onboarding.pothos.ts`, `parent-portal.pothos.ts`, `parent-profile.pothos.ts`, `suggestion.pothos.ts`, `index.ts`

**N+1 Fields to Fix:**
- `parent-dashboard.pothos.ts`: `effectiveMeeting` and `meetingJoinUrl` on `ParentDashboardScheduleRow` → `t.loadable` using `EffectiveMeetingService.resolveForClassInstances()`
- `parent-profile.pothos.ts`: `displayAmount` on `ParentProfile` → `t.loadable` using `FxDisplayService.convertForDisplayBatch()`

**Enum violations:** None.

**Batch methods needed:** None (reuses batch methods from `classes/` and `billing/`).

### 6.9 `permissions/` Domain

**Files:** `permission-group-simulation.pothos.ts`, `permission-group-simulation.objects.pothos.ts`, `permission-management.pothos.ts`, `index.ts`

**N+1 Fields:**
- `permission-management.pothos.ts`: `assignedUsers` on `PermissionGroup` — uses module-level cache (`groupUsersCache`), fetched once per request. Low priority.

**Enum violations:** None.

**Work:** Quality verification. Optionally convert `assignedUsers` cache to DataLoader pattern.

### 6.10 `profile/` Domain

**No N+1 fields.** Quality verification only.

### 6.11 `reports/` Domain

**No N+1 fields.** Quality verification only.

### 6.12 `scheduling/` Domain

**No N+1 fields.** Quality verification only.

### 6.13 `storage/` Domain

**No N+1 fields.** Quality verification only.

### 6.14 `students/` Domain

**Already DataLoader** (`student.pothos.ts` uses `loadableObjectRef`). Quality verification only.

### 6.15 `supervisor/` Domain

**No N+1 fields.** Quality verification only.

### 6.16 `system/` Domain

**No N+1 fields.** Quality verification only.

### 6.17 `teachers/` Domain

**Files:** `manager-onboarding.pothos.ts`, `staff-directory.pothos.ts`, `staff-profile.pothos.ts`, `teacher.pothos.ts`, `teacher-dashboard.pothos.ts`, `teacher-due.pothos.ts`, `teacher-notes.pothos.ts`, `teacher-onboarding.pothos.ts`, `teacher-portal.pothos.ts`, `index.ts`

**N+1 Fields to Fix:**
- `teacher-dashboard.pothos.ts`: `effectiveMeeting` and `meetingJoinUrl` on `TeacherDashboardScheduleRow` → `t.loadable` using `EffectiveMeetingService.resolveForClassInstances()`
- `teacher-portal.pothos.ts`: `displayAmount` on `TeacherOwnProfile` → `t.loadable` using `FxDisplayService.convertForDisplayBatch()`
- `staff-profile.pothos.ts`: `displayAmount` on `TeacherProfileResult` → `t.loadable`
- `staff-directory.pothos.ts`: `displayAmount` on `ManagerDirectoryRow` → `t.loadable`

**Enum violations:**
- `teacher-dashboard.pothos.ts:22`: Move `TeacherProgressFeedEventKind` to new `backend/enum/teachers/teacher-progress-feed.enum.ts`, register in `shared/enum.pothos.ts`

**Batch methods needed:** None (reuses batch methods from `classes/` and `billing/`).

### 6.18 `users/` Domain

**Pilot complete.** Quality verification only.

---

## 7. Execution Protocol

### 7.1 Pre-Execution (All Subagents)

Every subagent MUST:
1. Read ALL files in `.ai/plans/neon/outcome/`
2. Read `docs/graphql/dataloader-batching.md`
3. Read `backend/graphql/AGENTS.md` and `backend/graphql/pothos/AGENTS.md`
4. Read `.github/instructions/backend.instructions.md`

### 7.2 Per-File Quality Verification (After Every Edit)

```bash
bun tsgo
bun biome:check
curl -s -X POST http://localhost:4777/lint \
  -H "Content-Type: application/json" \
  -d '{"id":"3.2-<domain>","files":["<modified files>"]}'
```

### 7.3 Outcome File Template

Each subagent writes `.ai/plans/neon/outcome/3.2-<domain>-outcome.md`:

```markdown
# Task 3.2 Outcome: <Domain> DataLoader Refactoring

**Date:** YYYY-MM-DD
**Task:** 3.2 GraphQL Layer Rollout — <domain> Domain
**Status:** ✅ Completed / ❌ Failed

## Summary
...

## N+1 Fields Refactored
| Field | Parent Type | Before | After |
|-------|-------------|--------|-------|
| ... | ... | N queries | 1 batched query |

## Batch Methods Created
| Layer | File | Method |
|-------|------|--------|
| ... | ... | ... |

## Enum Violations Fixed
| Enum | Fix |
|------|-----|
| ... | ... |

## Quality Verification
- [ ] bun tsgo (0 errors)
- [ ] bun biome:check (0 errors)
- [ ] lint queue (0 errors, 0 warnings)

## Files Modified
- ...
```

### 7.4 Orchestrator Protocol

1. Create `graphql-rollout-tracker.json` with all 18 domains as pending
2. Phase 1: Spawn 3 subagents for shared infrastructure (billing/fx-display, classes/class-session, meeting/)
3. Wait for Phase 1 completion
4. Phase 2: Spawn remaining 15 subagents, maintaining exactly 16 active workers
5. Monitor and replenish pool until all domains complete
6. Run integration verification

### 7.5 Rollout Tracker Schema

```json
{
  "totalDomains": 18,
  "maxConcurrency": 16,
  "phase": "1|2|complete",
  "completedDomains": [],
  "activeSubagents": {
    "backend/graphql/pothos/classes/": {
      "conversationId": "subagent-uuid",
      "status": "in_progress",
      "startedAt": "ISO timestamp"
    }
  },
  "failedDomains": [],
  "pendingDomains": []
}
```

---

## 8. Integration Verification Gates

After all domains complete:

```bash
# 1. Schema regeneration
bun generate:gqlSchema
bun codegen

# 2. GraphQL integration tests
bun test:graphql

# 3. Global quality checks
bun tsgo
bun biome:check
bun run lint
```

All MUST exit with 0 errors, 0 warnings.

---

## 9. DataLoader Pattern Reference (Quick Reference for Subagents)

### Pattern A: `loadableObject` (already done for User, Student, ClassCategory)

```typescript
const Ref = gqlSchemaBuilder.objectRef<EntityReturnType>("Entity");
export const EntityPothosObject = gqlSchemaBuilder.loadableObject<
  EntityReturnType | Error, string, [], typeof Ref
>(Ref, {
  load: async (ids: string[]) => Repository.loadByIds(ids),
  sort: entity => entity.id,
  fields: t => ({ /* ... */ }),
});
```

### Pattern B: `t.loadable()` for scalar fields

```typescript
fieldName: t.loadable({
  type: "String",           // or "Int", "Float", "Boolean"
  nullable: true,           // if the field can be null
  load: async (ids: string[]) => {
    const results = await BatchService.batchMethod(ids);
    return ids.map(id => results.get(id) ?? null);
  },
  resolve: parent => parent.id,
}),
```

### Pattern C: `t.loadable()` for cross-type object references

```typescript
relatedEntity: t.loadable({
  type: RelatedEntityPothosObject,
  load: (ids: string[], ctx) => RelatedEntityPothosObject.getDataloader(ctx).loadMany(ids),
  resolve: parent => parent.relatedEntityId,
}),
```

### Batch Repository Method Pattern

```typescript
// ✅ CORRECT — dynamic query for inArray batch lookups
export const findByXxxIds = async (ids: string[], tx?: DBTransaction): Promise<Map<string, T | null>> => {
  if (ids.length === 0) return new Map();
  const queryDb = tx ?? db;
  const rows = await queryDb
    .select({ key: table.keyColumn, value: table.valueColumn })
    .from(table)
    .where(inArray(table.keyColumn, ids));
  const map = new Map<string, T | null>(ids.map(id => [id, null]));
  for (const row of rows) map.set(row.key, row.value);
  return map;
};
```

### Batch Service Method Pattern

```typescript
export async function resolveXxxForEntities(ids: string[]): Promise<Map<string, T | null>> {
  return Repository.findByXxxIds(ids);
}
```

---

## 10. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| `EffectiveMeetingService` batch refactoring is complex (3-5 DB queries per call) | High | High | Phase 1 subagent handles this in isolation; other domains only consume the result |
| `FxDisplayService.convertForDisplayBatch()` needs exchange rate batching | Medium | Medium | Group by (lockedCurrency, displayCurrency) pairs, resolve rates once per pair |
| GraphQL schema changes break existing tests | Medium | High | Run `bun test:graphql` after all domains complete; fix any regressions |
| Enum migration breaks type references | Low | Medium | Run `bun generate:gqlSchema && bun codegen` after enum changes |
| `t.loadable` doesn't support list types (known limitation) | N/A | Low | `resources` field on `ClassSubject` returns array — use `t.field()` with batch service call instead |
| Cross-domain dependency ordering | Medium | Medium | Phase 1 creates shared infra first; Phase 2 consumers wait for Phase 1 |