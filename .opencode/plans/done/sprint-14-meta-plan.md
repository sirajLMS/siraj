# Sprint 14 — Meta Plan (Orchestration & Data Collection)

> **Purpose**: This meta plan defines the sequence of tasks to collect, analyze, and verify all data required before authoring the split-file implementation plan for Story 14 (`.ai/siraj_stories/14.md`). Every intermediate outcome is saved under `.ai/siraj_stories/14/temp/` for reuse by the individual plan files. **Nothing is added to the plan without explicit user confirmation.**

---

## Meta Rules (Mandatory)

1. **User Confirmation Required**: Before adding any task, permission, schema change, or architectural decision to the final plan files, the agent MUST present findings to the user and await explicit approval.
2. **Temp File References**: All intermediate analysis results, data extractions, and draft content are saved under `.ai/siraj_stories/14/temp/`. Each task below specifies which temp file(s) it produces.
3. **Conflict Resolution**: If analysis reveals conflicts with existing code (e.g., enum values already exist, tables already have columns, permissions already seeded), the agent MUST flag them and ask the user how to proceed.
4. **No Assumptions**: Do not assume implementation completeness. Verify every fact against the actual codebase.
5. **Plan Format Compliance**: The final plan MUST follow the split-file format defined in `AGENTS_STORY_PLANNING.md` (Section 2, Split-File Output Format).
6. **Permission Naming Convention**: All permissions follow `<domain>.action` format (e.g., `complaints.list`, `support.submit_complaint`). No `support.admin.action` or role-based naming.
7. **Reuse Existing Permissions**: Existing permissions are reused where valid, correct, and secure. New permissions are only created when no existing equivalent covers the required access.

---

## Temp File Index

| Temp File | Purpose |
|---|---|
| `temp/schema-analysis.md` | Analysis of existing `communications.ts` schema (complaints, complaintResponses, suggestions tables) |
| `temp/permission-gap-analysis.md` | Gap analysis: 3 existing `complaints.*` + 4 new permissions vs story requirements |
| `temp/existing-frontend-analysis.md` | Analysis of existing complaint/suggestion UI components, stores, and containers |
| `temp/existing-backend-analysis.md` | Analysis of existing backend services, repos, and GraphQL for communications domain |
| `temp/i18n-audit.md` | Audit of existing i18n keys in `shared/messages/` for communications domain |
| `temp/dependency-graph.md` | Task dependency graph and build order |
| `temp/user-confirmed-decisions.md` | Log of all user-confirmed decisions before plan authoring |

---

## Permission Strategy (Pre-Confirmed)

### Existing Permissions (Keep As-Is — Already in Migration + Assigned to Admin)

| Permission Key | Purpose | Group Assignment |
|---|---|---|
| `complaints.list` | Admin view complaint queue | Super Admin, Admin |
| `complaints.delete` | Admin delete complaint | Super Admin, Admin |
| `complaints.respond` | Admin answer/respond to complaint | Super Admin, Admin |

### New Permissions (Add to Enum + Migration + Group Assignments)

| Permission Key | Purpose | Group Assignment |
|---|---|---|
| `support.submit_complaint` | Parent submit formal complaint (tracked) | Parent |
| `support.view_history` | Parent view own complaint history | Parent |
| `communication.submit_suggestion` | Parent submit untracked suggestion | Parent |
| `system.dispatch_email` | System automated email dispatch trigger | System Automated |

---

## Meta Tasks (Execution Order)

### Task M1 — Schema Analysis

**Objective**: Analyze the existing `communications.ts` schema to understand what tables, columns, enums, and relations already exist for complaints, complaint responses, and suggestions.

**Actions**:
1. Read `backend/db/schema/communications.ts` — extract table definitions for `complaints`, `complaintResponses`, `suggestions`
2. Read `backend/db/schema/enums.ts` — extract `complaintCategoryEnum`, `complaintStatusEnum`
3. Read `shared/lib/enum.ts` — extract `ComplaintCategory`, `ComplaintStatus` enum values
4. Compare story requirements against existing schema:
   - Story requires: complaint with `Student ID` linkage, `Un-answered`/`Answered` status, response text, email tracking
   - Existing: `complaints` has `parentId`, `studentId` (FK), `category`, `status`, `body`, `soft-delete`; `complaintResponses` has `complaintId`, `responderUserId`, `body`, `emailSent`; `suggestions` has `parentId`, `submitterName`, `body`, `emailSentAt`
5. Identify gaps or mismatches

**Output**: `temp/schema-analysis.md`

**User Confirmation Point**: Present schema analysis findings. Ask user: "Does the existing schema cover all story requirements, or are new columns/tables needed?"

---

### Task M2 — Permission Gap Analysis

**Objective**: Confirm the permission strategy — 3 existing `complaints.*` permissions reused for admin, 4 new permissions added for parent/client and system.

**Actions**:
1. Verify existing `complaints.list`, `complaints.delete`, `complaints.respond` are in `shared/lib/enum.ts` and migration SQL
2. Verify group assignments in migration SQL (Super Admin, Admin)
3. Confirm 4 new permissions don't conflict with any existing keys
4. Determine exact enum values, migration INSERT statements, and group permission assignments

**Output**: `temp/permission-gap-analysis.md`

**User Confirmation Point**: Present the full permission list with group assignments. Ask user to confirm before proceeding.

---

### Task M3 — Existing Frontend Analysis

**Objective**: Audit all existing frontend components, stores, containers, and stories related to complaints and suggestions.

**Actions**:
1. List all complaint/suggestion-related files in `frontend/views/dashboard/complaints/` and `frontend/views/dashboard/suggestions/`
2. Read container files: `ParentComplaintsContainer.tsx`, `AdminComplaintsContainer.tsx`
3. Check mock stores: `mockParentComplaintsStore.ts`, `mockAdminComplaintsStore.ts`, `mockParentSuggestionsStore.ts`, `mockAdminSuggestionsStore.ts`
4. Check for existing GraphQL documents in `frontend/graphql/sharedDocuments/`
5. Check for existing backend GraphQL pothos files in `backend/graphql/pothos/`
6. Check for existing backend services and repositories

**Output**: `temp/existing-frontend-analysis.md`

**User Confirmation Point**: Present findings on what exists vs. what's missing. Confirm scope of migration vs. new creation.

---

### Task M4 — Existing Backend Analysis

**Objective**: Audit all existing backend services, repositories, and GraphQL for the communications domain.

**Actions**:
1. Check `backend/db/repo/` for complaint/suggestion/communication repositories
2. Check `backend/services/` for complaint/suggestion/communication services
3. Check `backend/graphql/pothos/` for complaint/suggestion/communication pothos files
4. Read `parent.repository.ts` for any complaint/suggestion methods
5. Check notification/email dispatch infrastructure

**Output**: `temp/existing-backend-analysis.md`

**User Confirmation Point**: Present findings. Confirm which backend layers need new files vs. modifications.

---

### Task M5 — i18n Audit

**Objective**: Audit existing i18n keys for the communications domain.

**Actions**:
1. Read `shared/messages/en.ts` — search for complaint, support, communication, suggestion keys
2. List `shared/messages/ar/` — check for Arabic translation files
3. Search for type files in `shared/messages/types/`
4. Identify all new UI strings from the story needing translation

**Output**: `temp/i18n-audit.md`

**User Confirmation Point**: Present new i18n keys needed. Confirm key names and translations.

---

### Task M6 — Dependency Graph & Build Order

**Objective**: Construct the task dependency graph and build order.

**Actions**:
1. Synthesize findings from M1–M5
2. Determine task sequence: Migration → Repository → Service → Tests → GraphQL → Documents → Types → Stores → Views → i18n
3. Map each task to target files

**Output**: `temp/dependency-graph.md`

**User Confirmation Point**: Present full task list with dependencies. Confirm build order.

---

### Task M7 — User Decision Log

**Objective**: Consolidate all user-confirmed decisions.

**Actions**:
1. Compile all confirmations from M1–M6
2. Document each decision with rationale and affected tasks

**Output**: `temp/user-confirmed-decisions.md`

---

## Post-Collection: Plan Authoring

After all meta tasks complete and user-confirmed, author split plan files:

```
.ai/siraj_stories/14/
├── section-0-metadata.md
├── section-1-core-principles.md
├── section-2-rbac-permissions.md
├── section-4-security-threats.md
├── section-5-prerequisites.md
├── section-6-tasks/
│   ├── task-a-migration-permissions.md
│   ├── task-b-repositories.md
│   ├── task-c-services.md
│   ├── task-d-repo-tests.md
│   ├── task-e-graphql-pothos.md
│   ├── task-f-frontend-documents.md
│   ├── task-g-type-extraction.md
│   ├── task-h-graphql-tests.md
│   ├── task-i-storybook-migration.md
│   ├── task-j-frontend-stores.md
│   ├── task-k-frontend-views.md
│   └── task-l-i18n.md
├── section-7-final-verification.md
└── appendix.md
```

Each plan file references temp files for collected data.

---

## Execution Protocol

1. Execute M1 → present findings → **await user confirmation**
2. Execute M2 → present findings → **await user confirmation**
3. Execute M3 → present findings → **await user confirmation**
4. Execute M4 → present findings → **await user confirmation**
5. Execute M5 → present findings → **await user confirmation**
6. Execute M6 → present findings → **await user confirmation**
7. Execute M7 → compile decision log
8. Author split plan files → present directory tree → **await user confirmation**
