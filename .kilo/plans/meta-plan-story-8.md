# Meta-Plan: Strategy for Generating the Story 8 Implementation Plan

## The Challenge & Constraints
According to `AGENTS_STORY_PLANNING.md`, the final implementation plan must be a **hyper-detailed, 2,500+ line document** where each task in Section 6 is **300-600+ lines** with zero placeholder code (`...`). AI context windows and output limits make it impossible to generate this massive document in a single shot. 

Therefore, we must **"plan to plan"**. We will generate the `story_8_implementation_plan.md` in incremental phases, appending to the final file or compiling it from chunks.

## The Generation Roadmap

This meta-plan outlines the step-by-step sequence we will follow to generate the final, bulletproof plan.

### Phase 1: Context, Rules & Prerequisites (Sections 0 to 5)
**Goal:** Generate the foundational sections that define the boundaries, security, and prerequisites.
**Output Target:** ~300-400 lines of markdown.
- **Section 0:** Metadata, Business Objectives (Separation of duties for quota editing, destructive actions).
- **Section 1:** Core Principles (No monolithic services, no DB imports in services, zero incomplete implementation).
- **Section 2:** RBAC Permissions (Mapping `parent.manage_status`, `student.edit_quota`, etc. to Academy Admin).
- **Section 3:** State Machine & Threat Alignment (Mermaid diagram for Parent Deactivation flow and Student Quota lifecycle).
- **Section 4:** Security Threat Remediation (IDOR scoping for parent viewing, Admin-only quota overrides).
- **Section 5:** Prerequisites Verification (Fact-checking the current codebase state we analyzed).

### Phase 2: Database, Repo & Tests (Section 6 - Task A)
**Goal:** Generate Task A (300-600 lines) with complete code for schemas and repositories.
**Target Files to plan:**
- `backend/db/migration/<N>-story_8_permissions.sql` (Add new permissions)
- `shared/lib/enum.ts` (AppPermission enum updates)
- `backend/db/repo/parent.repository.ts` (Update status method)
- `backend/db/repo/student.repository.ts` (Update quota method)
- `backend/db/test/repo/*` (100% coverage tests)
- **Protocol:** Include the mandatory DB migration execution protocol (`bun db cleanGenerate -> reset -> seed -> test:db`) and Quality Gate checklists.

### Phase 3: Service Layer & Tests (Section 6 - Task B)
**Goal:** Generate Task B (300-600 lines) ensuring STRICT architectural compliance (NO Drizzle imports).
**Target Files to plan:**
- `backend/services/parent/parent-profile.service.ts` (Deactivate account logic, permission gated)
- `backend/services/student/student-quota.service.ts` (Edit quota logic, gated to Academy Admin)
- `backend/services/storage/parent-document.service.ts` (Document linking)
- `backend/db/test/logic/*` (Service layer integration tests)
- **Protocol:** Include Quality Gate checklists.

### Phase 4: Backend GraphQL & Schema Gen (Section 6 - Task C)
**Goal:** Generate Task C (300-600 lines) ensuring resolvers ONLY depend on the service layer.
**Target Files to plan:**
- `backend/graphql/pothos/parent-profile.pothos.ts` (Mutations for status updates)
- `backend/graphql/pothos/student-quota.pothos.ts` (Mutations for quota updates)
- **Protocol:** Define execution of `bun run generate:gqlSchema` and `bun codegen`, plus Quality Gate.

### Phase 5: Frontend GraphQL & Stores (Section 6 - Tasks D & E)
**Goal:** Generate Tasks D & E (400+ lines). No `useLazyQuery`, exact `TypedDocumentNode` creation.
**Target Files to plan:**
- `frontend/graphql/sharedDocuments/parent-profile.documents.ts`
- `frontend/graphql/sharedDocuments/student-quota.documents.ts`
- `frontend/stores/parentProfileStore.ts` (Zustand strictly typed to GraphQL output)
- **Protocol:** Define `bun run test:graphql` execution and Quality Gate.

### Phase 6: Frontend Views, Composition & RBAC (Section 6 - Task F)
**Goal:** Generate Task F (500+ lines). Apply the **Container → Form → View → Detail** composition pattern and UI implementations.
**Target Files to plan:**
- `frontend/views/dashboard/parents/profile/ParentProfileContainer.tsx` (Add `useQuery`, remove mocks)
- `frontend/views/dashboard/parents/profile/ParentProfileActions.tsx` (Add MUI `<Dialog>` for deactivation, drop browser `confirm()`)
- `frontend/views/dashboard/parents/profile/ParentStudentsDataGrid.tsx` (Wire edit quota handler)
- UI wrapped in `<RequirePermission>` for `parent.manage_status`, etc.
- **Protocol:** Define `bun run test:ui:components` execution and Quality Gate.

### Phase 7: i18n Translations (Section 6 - Task G)
**Goal:** Generate Task G (200 lines). No hardcoded strings.
**Target Files to plan:**
- `shared/messages/en.ts`
- `shared/messages/ar/dashboard/parents/profile.ts`
- `shared/messages/types/dashboard/parents/profile.ts`

### Phase 8: Final Verification & Compilation (Section 7 & Appendices)
**Goal:** Generate the Final Integrity Protocol and Appendix tracking.
- Compile all generated phases into the final `story_8_implementation_plan.md` file (or equivalent).
- Add the mandatory 15-step check command list (tsgo, biome, lint, codescene, etc.).

## Execution Instructions
We will execute this Meta-Plan by generating each Phase one by one. Once a Phase is generated and validated against the `AGENTS_STORY_PLANNING.md` rules (e.g., checking for placeholder code or forward dependencies), we will write it to the final plan document and move to the next phase.
