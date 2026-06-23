# Meta-Plan: Story 12 Implementation Plan Creation

**Story:** Siraj LMS - Permissions & Permission Groups (Part 13: 00:00 - 01:56)  
**Meta-Plan Created:** 2026-06-23  
**Purpose:** Define the strategy and research steps needed to create the complete implementation plan for Story 12.

---

## 1. Story Summary & Scope Analysis

### 1.1 Core Features
Story 12 introduces two distinct feature domains:

1. **Resource Lifecycle Management (Extended)**
   - Executes existing `resource.upload` permission (from Part 12)
   - Adds new `resource.delete` permission for destructive file removal
   - UI: Delete button with confirmation dialog
   - Backend: Hard deletion from storage + database

2. **Custom Reporting & Aggregation (New Domain)**
   - New `report.generate_custom` permission (query engine access)
   - New `report.view_financials` permission (financial column visibility)
   - Dynamic query interface: date range, teacher filter, grouping mode
   - Output: Aggregated attendance data (Taken, Absent, Leave, Pending)
   - Financial metrics: Hours worked, Paid (EGP), Paid (USD)

### 1.2 Permission Breakdown
| Permission Key | Domain | Action | Target Role |
|---|---|---|---|
| `resource.upload` | resource | upload | Academy Admin (execution) |
| `resource.delete` | resource | delete | Academy Admin (NEW) |
| `report.generate_custom` | report | generate_custom | Academy Admin (NEW) |
| `report.view_financials` | report | view_financials | Academy Admin (NEW) |

**Note:** Only 3 NEW permissions need to be added to the system (resource.delete, report.generate_custom, report.view_financials). The `resource.upload` permission already exists from Part 12 — this story implements its **execution**.

### 1.3 Security Model
- **Destructive Operations**: `resource.delete` performs hard deletion (permanent file removal)
- **Financial Data Exposure**: `report.view_financials` gates highly sensitive payroll data
- **Separation of Concerns**: Operational reporting vs financial viewing can be split across roles
- **Confirmation Friction**: UI requires explicit confirmation prompt for resource deletion

---

## 2. Critical Research & Investigation Steps

Before writing the full implementation plan, the following investigations MUST be completed:

### 2.1 Resource Domain Investigation
- [ ] **Verify existing `resource.upload` permission**
  - Check `backend/db/migration/3-system_permissions_and_groups.sql` for existing entry
  - Check `shared/lib/enum.ts` for `RESOURCE_UPLOAD` enum value
  - Determine status: ✅ exists or ❌ needs creation

- [ ] **Locate resource upload implementation (Part 12)**
  - Find: `backend/db/repo/*` — resource repository methods
  - Find: `backend/services/*` — resource service layer
  - Find: `backend/graphql/pothos/*` — resource GraphQL types/mutations
  - Find: `frontend/views/dashboard/*` — resource UI components
  - **Purpose:** Understand existing patterns to match for delete implementation

- [ ] **Verify resource schema**
  - Check `backend/db/schema/*` for resource/document table structure
  - Identify columns: `id`, `docName`, `filePath`, `uploadedBy`, `createdAt`, etc.
  - Verify foreign key relationships and cascade rules

- [ ] **Locate file storage infrastructure**
  - Find storage abstraction: `backend/services/storage/*` or similar
  - Identify methods: `uploadFile()`, `deleteFile()`, `getFileUrl()`
  - Check if S3/local storage deletion is already implemented

### 2.2 Reporting Domain Investigation
- [ ] **Verify attendance/session data model**
  - Check schema for attendance records table
  - Identify columns: teacher, date, status (Taken/Absent/Leave/Pending), hours
  - Verify teacher-student-session relationships

- [ ] **Verify billing/payroll calculation logic**
  - Find existing payroll rate calculation (hourly rate, currency conversion)
  - Check if `Paid (EGP)` and `Paid (USD)` calculations already exist
  - Identify rate storage: teacher profile, global config, or billing records

- [ ] **Check for existing reporting infrastructure**
  - Search for any existing report generation services
  - Look for query builder patterns or aggregation helpers
  - Identify if dynamic date-range queries already exist elsewhere

- [ ] **Verify report entity structure**
  - Does a `reports` table exist, or is this ad-hoc query-only?
  - Should reports be persisted (saved for audit trail) or ephemeral?
  - **Decision point:** Store report metadata or just execute queries on-demand?

### 2.3 Frontend State Investigation
- [ ] **Locate existing resource management UI**
  - Find: `frontend/views/dashboard/resources/*` or similar
  - Check if resource cards/list already exist with upload functionality
  - Verify if mock stores are used or real GraphQL

- [ ] **Determine if reporting UI exists**
  - Search for any existing reporting dashboard or query interface
  - Check if this is a completely new UI domain
  - **If new:** Plan for full Container → Form → View composition

- [ ] **Verify MUI Dialog patterns**
  - Check existing codebase for confirmation dialog examples
  - Ensure pattern matches project conventions (no `globalThis.confirm()`)

### 2.4 Permission Group Assignment Investigation
- [ ] **Verify `academy_admin` permission group exists**
  - Check `backend/db/migration/3-system_permissions_and_groups.sql`
  - Confirm slug: `academy_admin` or similar

- [ ] **Check if Teacher/Parent/Student groups need any new assignments**
  - Story 12 spec says "None applicable" for non-admin roles
  - Verify this is correct based on business requirements

---

## 3. Prerequisite Verification Plan

### 3.1 Database & Schema
- [ ] Run `bun db cleanGenerate` to ensure schema is up-to-date
- [ ] Verify existing migrations are applied
- [ ] Check that Part 12 (resource upload) is fully implemented and tested
- [ ] Run `bun run test:db` — all existing tests must pass (0 failures)

### 3.2 GraphQL & Codegen
- [ ] Run `bun run generate:gqlSchema` — verify schema generation works
- [ ] Run `bun codegen` — verify codegen produces types
- [ ] Check `frontend/graphql/generated/gql/graphql-types.ts` exists

### 3.3 Test Suite Baseline
- [ ] Run `bun run test` — establish baseline (all tests pass)
- [ ] Run `bun run test:graphql` — verify GraphQL tests pass
- [ ] Run `bun run test:ui:components` — verify UI tests pass

### 3.4 Quality Gates Baseline
- [ ] Run `bun tsgo` — 0 errors, 0 warnings
- [ ] Run `bun biome:check` — 0 errors, 0 warnings
- [ ] Run `bun lint` — 0 errors, 0 warnings
- [ ] Run `bun codescene` — 0 errors, 0 warnings

---

## 4. Planned Section Breakdown

Following the mandatory split-file format, the implementation plan will consist of:

### Section Files (Root Level)
- `section-0-metadata.md` — Story metadata, business objectives, scope boundaries
- `section-1-core-principles.md` — Mandatory checklist, zero incomplete implementation policy
- `section-2-rbac-permissions.md` — Permission mapping, group assignments, self-scoping (if applicable)
- `section-3-state-machine.md` — **OMIT** (no state machine in this story)
- `section-4-security-threats.md` — IDOR, destructive action safeguards, financial data exposure
- `section-5-prerequisites.md` — Verification checklist with ✅/❌ markers
- `section-7-final-verification.md` — Quality gate loop, test suite commands
- `appendix.md` — File creation summary, dependency graph

### Task Files (section-6-tasks/ Directory)
Preliminary task list (subject to refinement after investigation):

- `task-a-migration-enum.md` — Add 3 new permissions to migration SQL + enum
- `task-b-resource-repository.md` — Implement `ResourceRepository.deleteResource()`
- `task-c-resource-repo-tests.md` — Test resource deletion with IDOR protection
- `task-d-resource-service.md` — Implement `ResourceService.deleteResource()` with permission check
- `task-e-reporting-repository.md` — Implement `ReportRepository.generateAttendanceReport()`
- `task-f-reporting-repo-tests.md` — Test reporting queries with date ranges and teacher filters
- `task-g-reporting-service.md` — Implement `ReportService.generateCustomReport()` and `ReportService.applyFinancialColumns()`
- `task-h-graphql-pothos.md` — Define Report types, resource delete mutation, report queries
- `task-i-frontend-documents.md` — Create Apollo TypedDocumentNodes for delete + report queries
- `task-j-type-extraction.md` — Extract types from mock stores (if applicable)
- `task-k-graphql-tests.md` — Test resource delete mutation + report queries
- `task-l-storybook-migration.md` — Update stories to use MockedProvider (if applicable)
- `task-m-frontend-stores.md` — Create/update Zustand stores for resource + reporting
- `task-n-resource-delete-ui.md` — Add delete button + MUI confirmation dialog to resource cards
- `task-o-reporting-ui.md` — Create ReportContainer → ReportForm → ReportView → ReportGrid composition
- `task-p-i18n.md` — Add translation keys for delete confirmation, report UI, error messages

**Note:** Task letters and count may change after investigation phase reveals actual scope.

---

## 5. Key Decision Points & Questions

### 5.1 Resource Deletion Scope
**Question:** Does `resource.delete` only delete the database record, or also the physical file from storage?

**Story 12 text says:** "permanently drops the file from server storage, removes the relational record from the database"

**Decision:** Both. The implementation must:
1. Delete physical file via storage service
2. Delete database record via repository
3. Wrap both in a transaction (or handle rollback if storage fails)

### 5.2 Report Persistence
**Question:** Should generated reports be saved to a `reports` table, or are they ephemeral (query-on-demand)?

**Story 12 text says:** "allows the user to pass ... parameters to the backend. The system evaluates these parameters to fetch and render an aggregated data table"

**Interpretation:** Sounds like ephemeral query execution, NOT persisted reports. The "Reports interface" is a UI that triggers dynamic queries, not a report storage system.

**Decision (preliminary):** No `reports` table. Implement as a GraphQL query that aggregates attendance data on-demand. The repository method returns computed results, not stored records.

### 5.3 Financial Column Gating Implementation
**Question:** How should `report.view_financials` permission work?

**Options:**
- **A. Backend field-level nulling:** GraphQL resolver checks permission, nulls out `hours`/`paidEGP`/`paidUSD` fields if denied
- **B. Frontend conditional rendering:** GraphQL always returns financial fields, UI conditionally shows/hides based on permission
- **C. Separate GraphQL queries:** One query without financials, one query with financials

**Story 12 text says:** "Authorizes the query engine to calculate and render the highly sensitive financial columns"

**Interpretation:** The permission gates the **calculation** (backend), not just visibility (frontend).

**Decision (preliminary):** Option A. The resolver checks `report.view_financials` and conditionally includes/excludes financial fields in the response. If denied, those fields return `null` or are omitted entirely.

### 5.4 Report Grouping Modes
**Story 12 text says:** "Group by Date" and "Group by Teacher"

**Question:** Are these two separate GraphQL queries, or one query with a `groupBy` enum parameter?

**Decision (preliminary):** One query with `groupBy: ReportGroupingMode` enum parameter. Backend repository aggregates data accordingly.

---

## 6. Estimated Task Complexity

### High Complexity (300-600+ lines per task)
- **Reporting Repository** — Complex aggregation logic, multiple JOIN operations, date range filtering, grouping modes
- **Reporting UI** — Full Container → Form → View composition, date pickers, teacher selector, group-by toggle, data grid
- **GraphQL Pothos** — Report types with conditional financial fields, input types for query parameters

### Medium Complexity (200-400 lines per task)
- **Resource Service** — Permission check + storage deletion + DB deletion coordination
- **Reporting Service** — Permission-based financial field gating logic
- **Frontend Documents** — Multiple TypedDocumentNodes for delete mutation + report query variants
- **i18n** — Many UI strings (report form labels, confirmation dialog, error messages, column headers)

### Low Complexity (100-200 lines per task)
- **Migration & Enum** — Add 3 permissions to SQL + enum
- **Resource Repository** — Single delete method with CASCADE or manual cleanup
- **Repo Tests** — Standard CRUD test patterns
- **GraphQL Tests** — Permission-based query/mutation testing
- **Type Extraction** — Extract types from mock stores (if mocks exist)
- **Storybook Migration** — Update stories to use MockedProvider (if containers use mocks)

---

## 7. Layer-Specific Agent Rules to Integrate

The following layer-specific AGENTS.md files MUST be read and incorporated into task instructions:

- **Database / Repositories**: `backend/db/repo/AGENTS.md`
- **Backend Services**: `backend/services/AGENTS.md`
- **Backend GraphQL / Pothos**: `backend/graphql/AGENTS.md`
- **Frontend GraphQL Documents / Apollo**: `frontend\graphql\sharedDocuments\AGENTS.md`
- **Frontend GraphQL Tests / Apollo**: `frontend\graphql\test\AGENTS.md`
- **Frontend Views / UI**: `frontend/views/AGENTS.md`
- **Frontend Stores / Zustand**: `frontend/stores/AGENTS.md`

Each task in Section 6 MUST include a "Layer-Specific Rules (Flattened from ...)" section with the relevant constraints.

---

## 8. Security Threat Catalog (Preliminary)

### Threat 1: IDOR on Resource Deletion
**Risk:** User A could delete User B's resources by manipulating `resourceId` parameter.

**Mitigation:**
- Repository method: `ResourceRepository.deleteResource(resourceId, actorUserId)`
- Check ownership: `resource.uploadedBy === actorUserId` OR actor has admin override permission
- If check fails, throw localized `unauthorized` error

### Threat 2: Financial Data Leakage
**Risk:** Users without `report.view_financials` could access financial columns via direct GraphQL query manipulation.

**Mitigation:**
- Resolver checks `ctx.permissions.includes('report.view_financials')`
- If denied, financial fields (`hours`, `paidEGP`, `paidUSD`) return `null` or are omitted
- Service layer enforces the same check (defense in depth)

### Threat 3: Destructive Action Without Confirmation
**Risk:** Accidental resource deletion due to misclick or UI confusion.

**Mitigation:**
- UI shows confirmation dialog with explicit message: "Are you sure that you want to delete this resource?"
- User must click "Confirm" button to proceed
- Cancel button or click-outside dismisses dialog with no action

### Threat 4: File Storage Orphaning
**Risk:** Database record deleted, but physical file remains in storage (wasted space).

**Mitigation:**
- Service method calls `StorageService.deleteFile(filePath)` BEFORE database deletion
- If storage deletion fails, service throws error and database transaction rolls back
- No partial deletion state

### Threat 5: SQL Injection in Report Queries
**Risk:** User-provided `fromDate`, `toDate`, `teacherId` parameters could be exploited for SQL injection.

**Mitigation:**
- Use Drizzle ORM parameterized queries (NOT raw SQL string concatenation)
- Validate date formats and teacher ID format before passing to repository
- Repository uses `.where(and(gte(...), lte(...)))` with bound parameters

---

## 9. Next Steps (Meta-Plan Execution)

### Phase 1: Investigation (Blocking)
Execute all research tasks in Section 2. Document findings with exact file paths and line numbers. Update this meta-plan with ✅ (verified) or ❌ (not verified — needs creation) markers.

### Phase 2: Prerequisite Verification (Blocking)
Execute all prerequisite checks in Section 3. If any fail, resolve blocking issues before proceeding to plan writing.

### Phase 3: Section Writing (Sequential)
Write sections in order:
1. Section 0 (Metadata) — Use investigation findings
2. Section 1 (Core Principles) — Use standard template with story-specific additions
3. Section 2 (RBAC Permissions) — Use investigation findings for permission mapping
4. Section 4 (Security Threats) — Expand preliminary catalog from Section 8 above
5. Section 5 (Prerequisites) — Use verification results from Phase 2
6. Section 7 (Final Verification) — Use standard template
7. Appendix — Generate from task list

### Phase 4: Task Writing (Sequential, Dependency-Ordered)
Write tasks in dependency order:
- Database/Schema → Repository → Service → Tests → GraphQL → Frontend Documents → Type Extraction → GraphQL Tests → Storybook → Stores → Views → i18n

Each task MUST:
- Be 300-600+ lines (detailed, exhaustive, no placeholders)
- Include complete code blocks (no `...`)
- Include Layer-Specific Rules section
- Include Quality Gate checklists
- Declare dependencies explicitly

### Phase 5: Review & Finalization
- Verify all cross-references between files work
- Ensure task dependency graph is acyclic
- Check that file creation summary in Appendix matches tasks
- Validate total plan length meets 2,500+ line requirement

---

## 10. Plan File Structure (Final Output)

```
.ai/siraj_stories/12/
├── section-0-metadata.md
├── section-1-core-principles.md
├── section-2-rbac-permissions.md
├── section-4-security-threats.md
├── section-5-prerequisites.md
├── section-6-tasks/
│   ├── task-a-migration-enum.md
│   ├── task-b-resource-repository.md
│   ├── task-c-resource-repo-tests.md
│   ├── task-d-resource-service.md
│   ├── task-e-reporting-repository.md
│   ├── task-f-reporting-repo-tests.md
│   ├── task-g-reporting-service.md
│   ├── task-h-graphql-pothos.md
│   ├── task-i-frontend-documents.md
│   ├── task-j-type-extraction.md (if applicable)
│   ├── task-k-graphql-tests.md
│   ├── task-l-storybook-migration.md (if applicable)
│   ├── task-m-frontend-stores.md
│   ├── task-n-resource-delete-ui.md
│   ├── task-o-reporting-ui.md
│   └── task-p-i18n.md
├── section-7-final-verification.md
└── appendix.md
```

**Note:** Section 3 (State Machine) is omitted — no state transitions in this story.

---

## 11. Success Criteria for Meta-Plan Completion

This meta-plan is complete when:
- [ ] All investigation tasks in Section 2 are executed and documented
- [ ] All prerequisite verifications in Section 3 pass
- [ ] All decision points in Section 5 are resolved
- [ ] Task list in Section 4 is finalized with accurate letter assignments
- [ ] Security threat catalog in Section 8 is expanded and validated
- [ ] User has approved the meta-plan and authorized plan writing to begin

---

**Status:** Meta-plan ready for review. Awaiting user approval to proceed with Phase 1 (Investigation).
