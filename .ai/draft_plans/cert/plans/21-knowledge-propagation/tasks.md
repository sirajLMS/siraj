# Plan 21 — Knowledge Propagation: Tasks

## Document Info

| Field | Value |
|-------|-------|
| Feature | Certificate Knowledge Propagation |
| Plan # | 21 |
| Depends On | Plans 1–20 (all prior plans) |
| Related Docs | `MASTER_ARCHITECTURE.md`, `siraj_analysis/10-testing-quality-patterns.md`, `siraj_analysis/12-cron-config-infra.md`, `requirements.md`, `design.md` |

> **Execution Model**: Parallel subagents per independent task group (see dependency graph for parallelization points)
> **Execution order**: T1 → (T2, T3, T4, T5, T6 via parallel subagents after T1) → (T7, T8 via parallel subagents) → (T9, T10 via parallel subagents) → (T11, T12 via parallel subagents) → T13 → T14 → T15

---

## Task Summary

| Task # | Task Name | Est. Hours | Depends On |
|--------|-----------|------------|------------|
| T1 | Creating `docs/certificates/` directory and INDEX.md | 2 | Plans 1–20 |
| T2 | Writing ARCHITECTURE.md and DATABASE_PATTERNS.md | 3–4 | T1 |
| T3 | Writing SERVICE_PATTERNS.md and GRAPHQL_PATTERNS.md | 3–4 | T1 |
| T4 | Writing FRONTEND_PATTERNS.md and STORAGE_PATTERNS.md | 3–4 | T1 |
| T5 | Writing CRON_PATTERNS.md and TESTING_PATTERNS.md | 3–4 | T1, Plan 22 requirements |
| T6 | Writing I18N_PATTERNS.md, TEMPLATE_EDITOR.md, and VERIFICATION_SYSTEM.md | 3–4 | T1 |
| T7 | Updating backend-layer AGENTS.md files | 3–4 | T2, T3, T5 |
| T8 | Updating frontend-layer and app AGENTS.md files | 3–4 | T4, T6 |
| T9 | Updating root AGENTS.md and shared/AGENTS.md | 2 | T7, T8 |
| T10 | Updating instruction files | 2–3 | T7, T8 |
| T11 | Updating skills (review, quality gate, coding agent) | 2–3 | T10 |
| T12 | Adding knowledge sub-domain i18n keys to locale files | 1–2 | T9 |
| T13 | Cross-reference validation and documentation accuracy review | 2–3 | T2–T12 |
| T14 | Quality loop and verification | 2–3 | T1–T13 |
| T15 | Knowledge propagation finalization | 1–2 | T14 |

---

## Task Dependency Graph

```
T1 (docs dir + INDEX)
  ├── T2 (ARCHITECTURE + DATABASE)
  ├── T3 (SERVICE + GRAPHQL)
  ├── T4 (FRONTEND + STORAGE)
  └── T5 (CRON + TESTING) ← also depends on Plan 22 requirements
  └── T6 (I18N + TEMPLATE_EDITOR + VERIFICATION)
        │
        ├── T7 (backend AGENTS.md updates) ← depends on T2, T3, T5
        ├── T8 (frontend/app AGENTS.md updates) ← depends on T4, T6
        │
        └── T9 (root + shared AGENTS.md) ← depends on T7, T8
              │
              └── T10 (instruction files) ← depends on T7, T8
                    │
                    └── T11 (skills update) ← depends on T10
                          │
                          └── T12 (i18n knowledge sub-domain) ← depends on T9
                                │
                                └── T13 (cross-ref validation) ← depends on T2–T12
                                      │
                                      └── T14 (quality loop) ← depends on T13
                                            │
                                            └── T15 (finalization) ← depends on T14
```

---

## Parallel Subagent Strategy

Tasks grouped by wave (each wave runs as parallel subagents):

### Wave 1: T1
- Tasks: T1
- Rationale: Foundation task — creates the directory and INDEX.md that all subsequent documentation tasks depend on. Must complete before any other task can start.

### Wave 2: T2, T3, T4, T5, T6
- Tasks: T2, T3, T4, T5, T6
- Rationale: All five documentation-writing tasks depend only on T1 (and T5 also requires Plan 22 requirements.md, which already exists). Each writes independent documentation files with no interdependencies, so they can all run concurrently as separate subagents.

### Wave 3: T7, T8
- Tasks: T7, T8
- Rationale: T7 updates backend-layer AGENTS.md files (depends on T2, T3, T5) and T8 updates frontend/app AGENTS.md files (depends on T4, T6). Both depend only on already-completed Wave 2 tasks and touch different file sets, so they can run in parallel.

### Wave 4: T9, T10
- Tasks: T9, T10
- Rationale: T9 (root + shared AGENTS.md, depends on T7, T8) and T10 (instruction files, depends on T7, T8) both depend only on the completion of Wave 3. They modify different file sets (AGENTS.md files vs instruction files), so they can run in parallel.

### Wave 5: T11, T12
- Tasks: T11, T12
- Rationale: T11 (skills update, depends on T10) and T12 (i18n keys, depends on T9) have no interdependencies — each depends on a different Wave 4 task. They modify different file sets (skill definitions vs locale files), so they can run in parallel.

### Wave 6: T13
- Tasks: T13
- Rationale: Cross-reference validation depends on all prior tasks (T2–T12). Must run after all documentation, AGENTS.md, instruction, skills, and i18n tasks complete to validate cross-references and accuracy across all outputs.

### Wave 7: T14
- Tasks: T14
- Rationale: Quality loop and verification depends on T1–T13. Must run after all documentation and cross-reference validation is complete to perform the final quality gate pass.

### Final Wave: Knowledge Propagation
- Task: T15
- Rationale: Must run after all other tasks complete. Finalizes the knowledge propagation by performing a last review pass over all documentation, AGENTS.md updates, instruction files, and skills.

> **Subagent dispatch**: Each task in a wave is dispatched as a separate subagent. The orchestrator waits for all subagents in a wave to complete before starting the next wave.

---

## T1: Creating `docs/certificates/` Directory and INDEX.md

**Estimated**: 2 hours | **Depends On**: Plans 1–20 | **Refs**: REQ-21.1, REQ-21.13, design.md §2.1–2.2

### Subtasks

- **T1.1**: Create the `docs/certificates/` directory at the project root
  - Verify the directory does not already exist
  - Create empty placeholder files for all 13 documentation files listed in design.md §2.1

- **T1.2**: Write `docs/certificates/INDEX.md`
  - Include title: "Certificate Feature Documentation"
  - Include one-paragraph overview of certificate feature and documentation purpose
  - Include architecture layer index table: Layer | Documentation File | Keywords
  - Include quick reference table: Common Task | Documentation File | Section
  - Include cross-references table: documentation file ↔ AGENTS.md file
  - Include keyword index (alphabetical): Keyword | Documentation File

### Quality Check
- Verify `docs/certificates/` directory exists
- Verify `INDEX.md` exists and links to all 13 documentation files (even if they are placeholders)
- Verify no code snippets in INDEX.md
- Verify all listed file paths are correct
- [ ] Run per-file quality loop for each file created/modified (full progressive chain: tsgo → biome → lint → codescene):
  ```bash
  bun run scripts/health/sub-loop.ts docs/certificates/INDEX.md --lifecycle codescene
  ```

---

## T2: Writing ARCHITECTURE.md and DATABASE_PATTERNS.md

**Estimated**: 3–4 hours | **Depends On**: T1 | **Refs**: REQ-21.2, REQ-21.3, design.md §2.3–2.4

> **Parallelizable**: This task runs as a subagent in Wave 2 alongside T3, T4, T5, T6.

### Subtasks

- **T2.1**: Write `docs/certificates/ARCHITECTURE.md`
  - **Read before writing**: Root `AGENTS.md`, Plan 1 schema plan, Plan 3 design.md, Plan 4 design.md
  - Section 1: Feature overview (what certificate feature does, its role in Siraj platform)
  - Section 2: Architecture layer position — table with Layer | File Path Pattern | Description
  - Section 3: Entity model — entity table with Entity | Table Name | Key Fields | Relationships
  - Section 4: Data flow — client (ASCII diagram: Client → Apollo → GraphQL → Pothos → Service → Repo → DB)
  - Section 5: Data flow — server (ASCII diagram: Server Component → Cached Wrapper → Service → Repo → DB)
  - Section 6: Layer boundary rules (no frontend imports in repos, no service logic in Pothos, shared restrictions)
  - Section 7: Related documentation cross-references
  - Include table of contents at top

- **T2.2**: Write `docs/certificates/DATABASE_PATTERNS.md`
  - **Read before writing**: `backend/db/repo/AGENTS.md`, `backend/db/seeds/AGENTS.md`, `backend/types/AGENTS.md`, Plan 3 design.md
  - Section 1: Schema barrel structure — table with Table | File | Columns (summary) | Indexes
  - Section 2: Repository pattern — one repo per entity, method signatures in tables (Method | Params | Returns)
  - Section 3: Entity cache service — cache key naming table, TTL table, invalidation triggers table
  - Section 4: Prepared statements — verification lookup method signature table, usage description
  - Section 5: Seed data — seed file description table, demo entity descriptions
  - Section 6: Cross-references to AGENTS.md files
  - Include table of contents at top

### Quality Check
- Verify no code snippets exceeding 3 lines
- Verify all cross-references are valid file paths
- Verify entity descriptions match Plan 1 schema
- Verify repository method descriptions match Plan 3
- Verify table of contents present
- [ ] Run per-file quality loop for each file created/modified (full progressive chain: tsgo → biome → lint → codescene):
  ```bash
  bun run scripts/health/sub-loop.ts docs/certificates/ARCHITECTURE.md --lifecycle codescene
  bun run scripts/health/sub-loop.ts docs/certificates/DATABASE_PATTERNS.md --lifecycle codescene
  ```

---

## T3: Writing SERVICE_PATTERNS.md and GRAPHQL_PATTERNS.md

**Estimated**: 3–4 hours | **Depends On**: T1 | **Refs**: REQ-21.4, REQ-21.5, design.md §2.5–2.6

> **Parallelizable**: This task runs as a subagent in Wave 2 alongside T2, T4, T5, T6.

### Subtasks

- **T3.1**: Write `docs/certificates/SERVICE_PATTERNS.md`
  - **Read before writing**: `backend/services/AGENTS.md`, Plan 4 design.md, Plan 17 design.md
  - Section 1: Namespace structure — table with Service | File | Responsibility
  - Section 2: Generation pipeline — flow description in prose, step table (Step | Description | Error Handling)
  - Section 3: Verification service — description in prose, method table (Method | Params | Returns | Audit)
  - Section 4: Template management — state transition table (From State | Trigger | To State), version bumping description
  - Section 5: Entity cache service — TTL table, tag naming table, invalidation trigger table
  - Section 6: Cross-references to `backend/services/AGENTS.md`
  - Include table of contents at top

- **T3.2**: Write `docs/certificates/GRAPHQL_PATTERNS.md`
  - **Read before writing**: `backend/graphql/AGENTS.md`, `frontend/common/graphql/AGENTS.md`, Plan 5 design.md
  - Section 1: Pothos builders — type table (Type Name | Kind | Auth Scope | Fields)
  - Section 2: Auth scope pattern — role table (Mutation | Required Role)
  - Section 3: DataLoader batching — loader table (Loader | Key Type | Batch Fn | Cache)
  - Section 4: Document conventions — document file table, naming rules in bullet list
  - Section 5: Manual trigger mutations — pattern description in prose, mutation table
  - Section 6: Cross-references to `backend/graphql/AGENTS.md`, `frontend/common/graphql/AGENTS.md`
  - Include table of contents at top

### Quality Check
- Verify no code snippets exceeding 3 lines
- Verify service descriptions match Plan 4 implementation
- Verify GraphQL type descriptions match Plan 5
- Verify auth scope descriptions match existing Siraj patterns
- Verify DataLoader descriptions follow existing patterns
- [ ] Run per-file quality loop for each file created/modified (full progressive chain: tsgo → biome → lint → codescene):
  ```bash
  bun run scripts/health/sub-loop.ts docs/certificates/SERVICE_PATTERNS.md --lifecycle codescene
  bun run scripts/health/sub-loop.ts docs/certificates/GRAPHQL_PATTERNS.md --lifecycle codescene
  ```

---

## T4: Writing FRONTEND_PATTERNS.md and STORAGE_PATTERNS.md

**Estimated**: 3–4 hours | **Depends On**: T1 | **Refs**: REQ-21.6, REQ-21.7, design.md §2.7–2.8

> **Parallelizable**: This task runs as a subagent in Wave 2 alongside T2, T3, T5, T6.

### Subtasks

- **T4.1**: Write `docs/certificates/FRONTEND_PATTERNS.md`
  - **Read before writing**: `frontend/AGENTS.md`, `frontend/views/AGENTS.md`, `frontend/common/stores/AGENTS.md`, `frontend/common/graphql/AGENTS.md`, Plan 8 design.md, Plan 16 design.md
  - Section 1: View organization — table with View | File | Props | Composition
  - Section 2: Apollo hooks — hook table (Hook | Document | Return Type | Cache Update)
  - Section 3: Zustand stores — store table (Store | State Shape | Actions | Selectors)
  - Section 4: MUI v9 components — component description in prose (DataGrid, dialog, editor canvas)
  - Section 5: i18n usage — usage description in prose, sub-domain table
  - Section 6: Cross-references to frontend AGENTS.md files
  - Include table of contents at top

- **T4.2**: Write `docs/certificates/STORAGE_PATTERNS.md`
  - **Read before writing**: Plan 7 design.md, Plan 22 requirements.md
  - Section 1: Storage adapter — adapter description in prose, type table (Asset Type | Directory | Adapter)
  - Section 2: Signed URLs — generation pattern, cleanup strategy table (Strategy | Description | Trigger)
  - Section 3: Orphan detection — detection flow in prose, grace period table, deletion flow table
  - Section 4: Storage quota — quota check description, threshold table, notification description
  - Section 5: Render cache — tag naming table, invalidation trigger table, retention table
  - Section 6: Cross-references to Plan 7 docs, `CRON_PATTERNS.md`
  - Include table of contents at top

### Quality Check
- Verify no code snippets exceeding 3 lines
- Verify view organization matches Plan 8/16 implementation
- Verify store descriptions match existing Zustand patterns
- Verify MUI descriptions follow v9 conventions (sx prop, no style props)
- Verify storage patterns match Plan 7 and Plan 22 requirements
- [ ] Run per-file quality loop for each file created/modified (full progressive chain: tsgo → biome → lint → codescene):
  ```bash
  bun run scripts/health/sub-loop.ts docs/certificates/FRONTEND_PATTERNS.md --lifecycle codescene
  bun run scripts/health/sub-loop.ts docs/certificates/STORAGE_PATTERNS.md --lifecycle codescene
  ```

---

## T5: Writing CRON_PATTERNS.md and TESTING_PATTERNS.md

**Estimated**: 3–4 hours | **Depends On**: T1, Plan 22 requirements.md | **Refs**: REQ-21.8, REQ-21.9, design.md §2.9–2.10

> **Parallelizable**: This task runs as a subagent in Wave 2 alongside T2, T3, T4, T6.

### Subtasks

- **T5.1**: Write `docs/certificates/CRON_PATTERNS.md`
  - **Read before writing**: `siraj_analysis/12-cron-config-infra.md`, Plan 22 requirements.md, existing cron routes (`app/api/cron/class-reminders/route.ts`, `app/api/fx/refresh/route.ts`)
  - Section 1: Vercel Cron overview — registration table (Job | Path | Schedule | Env Var)
  - Section 2: Route pattern — route description in prose (GET, verifyCronSecretAuth, logger, NextResponse.json)
  - Section 3: Redis single-flight lock — lock description in prose, key naming table, flow table (Step | Action | On Failure)
  - Section 4: Per-item failure isolation — pattern description in prose, error handling table
  - Section 5: UTC-date idempotency — key construction table, uniqueness guarantee description
  - Section 6: Env config registration — registration table (File | Var Name | Purpose)
  - Section 7: Certificate cron jobs — full table of all cert cron routes with path, schedule, service, description
  - Section 8: Cross-references to `app/AGENTS.md`, `backend/services/AGENTS.md`, Plan 22 requirements
  - Include table of contents at top

- **T5.2**: Write `docs/certificates/TESTING_PATTERNS.md`
  - **Read before writing**: `siraj_analysis/10-testing-quality-patterns.md`, `backend/db/test/AGENTS.md`, Plan 20 design.md and tasks.md
  - Section 1: Entity-setup helpers — helper table (Helper | Params | Returns | Notes)
  - Section 2: Repository tests — runInRollback description, tx propagation description, coverage requirement, file location table
  - Section 3: Service tests — mocked repos vs real DB description, parallel runner description
  - Section 4: GraphQL integration tests — testClient description, auth scope setup table, file locations
  - Section 5: Cross-references to `.agents/instructions/tests.instructions.md`
  - Include table of contents at top

### Quality Check
- Verify no code snippets exceeding 3 lines
- Verify cron patterns match existing Siraj cron routes and Plan 22 requirements
- Verify testing patterns match Plan 20 design
- Verify entity-setup helper table matches Plan 20 design
- Verify env config table matches `siraj_analysis/12-cron-config-infra.md`
- [ ] Run per-file quality loop for each file created/modified (full progressive chain: tsgo → biome → lint → codescene):
  ```bash
  bun run scripts/health/sub-loop.ts docs/certificates/CRON_PATTERNS.md --lifecycle codescene
  bun run scripts/health/sub-loop.ts docs/certificates/TESTING_PATTERNS.md --lifecycle codescene
  ```

---

## T6: Writing I18N_PATTERNS.md, TEMPLATE_EDITOR.md, and VERIFICATION_SYSTEM.md

**Estimated**: 3–4 hours | **Depends On**: T1 | **Refs**: REQ-21.10, REQ-21.11, REQ-21.12, design.md §2.11–2.13

> **Parallelizable**: This task runs as a subagent in Wave 2 alongside T2, T3, T4, T5.

### Subtasks

- **T6.1**: Write `docs/certificates/I18N_PATTERNS.md`
  - **Read before writing**: `shared/AGENTS.md`, `shared/locale/` directory structure, Plan 3 requirements.md i18n section, Plan 22 requirements.md i18n section
  - Section 1: Namespace structure — namespace description, sub-domain list table (Sub-Domain | Key Count | Purpose)
  - Section 2: Sub-domains — detailed sub-domain tables (Sub-Domain | Key Examples | Usage Context)
  - Section 3: Type schema — type schema location, definition pattern description (prose), interpolation type table
  - Section 4: Locale implementation — file location table, implementation pattern description (prose)
  - Section 5: Arabic pluralization — rule table (Count | Rule | Example), implementation description
  - Section 6: Key naming convention — convention description, example table (Key | Structure | Sub-Domain)
  - Section 7: Anti-patterns — bullet list of prohibited patterns (hardcoded strings, next-intl, shared/messages/)
  - Section 8: Cross-references to `shared/AGENTS.md`
  - Include table of contents at top

- **T6.2**: Write `docs/certificates/TEMPLATE_EDITOR.md`
  - **Read before writing**: `frontend/views/AGENTS.md`, Plan 10 design.md, Plan 12 design.md, Plan 15 design.md
  - Section 1: Canvas architecture — drag-and-drop description (prose), element positioning table, zIndex management description
  - Section 2: Element types — type table (Type | Properties | Rendering Behavior)
  - Section 3: Variable system — variable type table (Type | Binding | Default | Required)
  - Section 4: Preview workflow — draft preview description, published preview description, render pipeline flow table
  - Section 5: Version bumping — version increment description, old version retention description
  - Section 6: Cross-references to `frontend/views/AGENTS.md`, `FRONTEND_PATTERNS.md`
  - Include table of contents at top

- **T6.3**: Write `docs/certificates/VERIFICATION_SYSTEM.md`
  - **Read before writing**: `app/AGENTS.md`, Plan 18 design.md, Plan 19 design.md, Plan 22 requirements.md
  - Section 1: Code generation — generation pattern description (prose), code format table, uniqueness guarantee description
  - Section 2: Public verification page — route description, server component pattern, no-auth description, data flow description
  - Section 3: Verification log — field table (Field | Type | Description), entry pattern description
  - Section 4: Log retention — retention period table, aggregation description, cron schedule table
  - Section 5: QR code embedding — generation description, embedding description, verification URL format table
  - Section 6: Cross-references to `CRON_PATTERNS.md`, `app/AGENTS.md`
  - Include table of contents at top

### Quality Check
- Verify no code snippets exceeding 3 lines
- Verify i18n patterns match `shared/locale/` structure and all plan requirements sections
- Verify Arabic pluralization rules are correct
- Verify Arabic translations cited in documentation are accurate
- Verify template editor description matches Plans 10, 12, 15
- Verify verification system description matches Plans 18, 19, 22
- [ ] Run per-file quality loop for each file created/modified (full progressive chain: tsgo → biome → lint → codescene):
  ```bash
  bun run scripts/health/sub-loop.ts docs/certificates/I18N_PATTERNS.md --lifecycle codescene
  bun run scripts/health/sub-loop.ts docs/certificates/TEMPLATE_EDITOR.md --lifecycle codescene
  bun run scripts/health/sub-loop.ts docs/certificates/VERIFICATION_SYSTEM.md --lifecycle codescene
  ```

---

## T7: Updating Backend-Layer AGENTS.md Files

**Estimated**: 3–4 hours | **Depends On**: T2, T3, T5 | **Refs**: REQ-21.16, design.md §3.3–3.8

> **Parallelizable**: This task runs as a subagent in Wave 3 alongside T8.

### Subtasks

- **T7.1**: Update `backend/services/AGENTS.md`
  - **Read before writing**: existing `backend/services/AGENTS.md`, `docs/certificates/SERVICE_PATTERNS.md`
  - Add "Certificate Services" section with subsections: namespace structure, generation pipeline, verification, template management, entity cache
  - Add cross-reference to `docs/certificates/SERVICE_PATTERNS.md`
  - Ensure no duplication of root AGENTS.md content
  - Ensure no duplication of docs content — summarize, reference, don't copy

- **T7.2**: Update `backend/graphql/AGENTS.md`
  - **Read before writing**: existing `backend/graphql/AGENTS.md`, `docs/certificates/GRAPHQL_PATTERNS.md`
  - Add "Certificate Pothos Types" section with subsections: type list, auth scopes, DataLoader, manual trigger mutations
  - Add cross-reference to `docs/certificates/GRAPHQL_PATTERNS.md`

- **T7.3**: Update `backend/db/repo/AGENTS.md`
  - **Read before writing**: existing `backend/db/repo/AGENTS.md`, `docs/certificates/DATABASE_PATTERNS.md`
  - Add "Certificate Repositories" section with subsections: barrel structure, entity cache integration, prepared statements, test requirements
  - Add cross-reference to `docs/certificates/DATABASE_PATTERNS.md`

- **T7.4**: Update `backend/db/seeds/AGENTS.md`
  - **Read before writing**: existing `backend/db/seeds/AGENTS.md`, `docs/certificates/DATABASE_PATTERNS.md`
  - Add "Certificate Seeds" section describing seed data structure
  - Add cross-reference to `docs/certificates/DATABASE_PATTERNS.md`

- **T7.5**: Update `backend/types/AGENTS.md`
  - **Read before writing**: existing `backend/types/AGENTS.md`, `docs/certificates/DATABASE_PATTERNS.md`
  - Add "Certificate Types" section listing all cert entity type names
  - Reinforce import-from-types rule for Pothos files
  - Add cross-reference to `docs/certificates/DATABASE_PATTERNS.md`

- **T7.6**: Update `backend/enum/AGENTS.md`
  - **Read before writing**: existing `backend/enum/AGENTS.md`
  - Add "Certificate Enums" section listing all cert enum names and values
  - Add cross-reference to `docs/certificates/ARCHITECTURE.md`

### Quality Check
- Verify each AGENTS.md file receives certificate-specific content
- Verify no duplication of root AGENTS.md or docs content
- Verify all cross-references are bidirectional (docs → AGENTS.md and AGENTS.md → docs)
- Verify backend AGENTS.md sections are concise summaries with links to detailed docs
- [ ] Run per-file quality loop for each file created/modified (full progressive chain: tsgo → biome → lint → codescene):
  ```bash
  bun run scripts/health/sub-loop.ts backend/services/AGENTS.md --lifecycle codescene
  bun run scripts/health/sub-loop.ts backend/graphql/AGENTS.md --lifecycle codescene
  bun run scripts/health/sub-loop.ts backend/db/repo/AGENTS.md --lifecycle codescene
  bun run scripts/health/sub-loop.ts backend/db/seeds/AGENTS.md --lifecycle codescene
  bun run scripts/health/sub-loop.ts backend/types/AGENTS.md --lifecycle codescene
  bun run scripts/health/sub-loop.ts backend/enum/AGENTS.md --lifecycle codescene
  ```

---

## T8: Updating Frontend-Layer and App AGENTS.md Files

**Estimated**: 3–4 hours | **Depends On**: T4, T6 | **Refs**: REQ-21.17, REQ-21.18, design.md §3.9–3.13

> **Parallelizable**: This task runs as a subagent in Wave 3 alongside T7.

### Subtasks

- **T8.1**: Update `frontend/AGENTS.md`
  - **Read before writing**: existing `frontend/AGENTS.md`, `docs/certificates/FRONTEND_PATTERNS.md`
  - Add "Certificate Views" section with subsections: view organization, Apollo hooks, Zustand stores, MUI patterns, i18n
  - Add cross-reference to `docs/certificates/FRONTEND_PATTERNS.md`

- **T8.2**: Update `frontend/views/AGENTS.md`
  - **Read before writing**: existing `frontend/views/AGENTS.md`, `docs/certificates/TEMPLATE_EDITOR.md`, `docs/certificates/FRONTEND_PATTERNS.md`
  - Add "Certificate Page Components" section with subsections: page list, DataGrid config, template editor
  - Add cross-references to `docs/certificates/TEMPLATE_EDITOR.md`, `docs/certificates/FRONTEND_PATTERNS.md`

- **T8.3**: Update `frontend/common/stores/AGENTS.md`
  - **Read before writing**: existing `frontend/common/stores/AGENTS.md`, `docs/certificates/FRONTEND_PATTERNS.md`
  - Add "Certificate Stores" section with subsections: store list, naming
  - Add cross-reference to `docs/certificates/FRONTEND_PATTERNS.md`

- **T8.4**: Update `frontend/common/graphql/AGENTS.md`
  - **Read before writing**: existing `frontend/common/graphql/AGENTS.md`, `docs/certificates/GRAPHQL_PATTERNS.md`
  - Add "Certificate GraphQL Documents" section
  - Reinforce naming, id inclusion, no lazy query, import path rules for cert documents
  - Add cross-reference to `docs/certificates/GRAPHQL_PATTERNS.md`

- **T8.5**: Update `app/AGENTS.md`
  - **Read before writing**: existing `app/AGENTS.md`, `docs/certificates/CRON_PATTERNS.md`, `docs/certificates/VERIFICATION_SYSTEM.md`
  - Add "Certificate Routes" section with subsections: public verification, admin dashboard, cron routes
  - Add Server Component data flow description for verification page
  - Add cron route pattern description
  - Add cross-references to `docs/certificates/CRON_PATTERNS.md`, `docs/certificates/VERIFICATION_SYSTEM.md`

### Quality Check
- Verify each AGENTS.md file receives certificate-specific content
- Verify no duplication of root AGENTS.md or docs content
- Verify all cross-references are bidirectional
- Verify frontend AGENTS.md sections follow existing section formatting conventions
- Verify app AGENTS.md cron route description matches existing cron patterns
- [ ] Run per-file quality loop for each file created/modified (full progressive chain: tsgo → biome → lint → codescene):
  ```bash
  bun run scripts/health/sub-loop.ts frontend/AGENTS.md --lifecycle codescene
  bun run scripts/health/sub-loop.ts frontend/views/AGENTS.md --lifecycle codescene
  bun run scripts/health/sub-loop.ts frontend/common/stores/AGENTS.md --lifecycle codescene
  bun run scripts/health/sub-loop.ts frontend/common/graphql/AGENTS.md --lifecycle codescene
  bun run scripts/health/sub-loop.ts app/AGENTS.md --lifecycle codescene
  ```

---

## T9: Updating Root AGENTS.md and shared/AGENTS.md

**Estimated**: 2 hours | **Depends On**: T7, T8 | **Refs**: REQ-21.14, REQ-21.15, design.md §3.1–3.2

> **Parallelizable**: This task runs as a subagent in Wave 4 alongside T10.

### Subtasks

- **T9.1**: Update root `AGENTS.md`
  - **Read before writing**: existing root `AGENTS.md`
  - Add "Certificate Feature" section: docs directory pointer, namespace, cron routes, env vars, storage naming, cache tags
  - Update "File Organization" section with certificate paths
  - Update "Important References" section with `docs/certificates/INDEX.md`
  - Ensure no duplication of layer AGENTS.md content — reference and summarize only

- **T9.2**: Update `shared/AGENTS.md`
  - **Read before writing**: existing `shared/AGENTS.md`, `docs/certificates/I18N_PATTERNS.md`
  - Add "Certificate Namespace" section: namespace name, sub-domain list, type schema location, locale implementation locations
  - Add "Certificate Shared Types" section: shared types, constants, utilities locations
  - Reinforce import rules (no frontend/backend/app imports from shared layer)
  - Add cross-reference to `docs/certificates/I18N_PATTERNS.md`

### Quality Check
- Verify root AGENTS.md certificate section is concise and cross-references layer AGENTS.md files
- Verify shared AGENTS.md includes certificate namespace and shared types sections
- Verify no duplication of layer AGENTS.md content in root AGENTS.md
- Verify docs/certificates/INDEX.md is added to Important References
- [ ] Run per-file quality loop for each file created/modified (full progressive chain: tsgo → biome → lint → codescene):
  ```bash
  bun run scripts/health/sub-loop.ts AGENTS.md --lifecycle codescene
  bun run scripts/health/sub-loop.ts shared/AGENTS.md --lifecycle codescene
  ```

---

## T10: Updating Instruction Files

**Estimated**: 2–3 hours | **Depends On**: T7, T8 | **Refs**: REQ-21.19, REQ-21.20, REQ-21.21, design.md §4

> **Parallelizable**: This task runs as a subagent in Wave 4 alongside T9.

### Subtasks

- **T10.1**: Update `.agents/instructions/frontend.instructions.md`
  - **Read before writing**: existing `.agents/instructions/frontend.instructions.md`
  - Add certificate subsections: component naming, Apollo hooks, Zustand stores, GraphQL documents, MUI notes, i18n notes, gotchas
  - Ensure subsections are additive — do not modify non-certificate content
  - Use table and bullet list format for all additions

- **T10.2**: Update `.agents/instructions/backend.instructions.md`
  - **Read before writing**: existing `.agents/instructions/backend.instructions.md`
  - Add certificate subsections: service naming, repository naming, type naming, Pothos naming, enum naming, cron route naming, env var naming, cache tag naming, gotchas
  - Ensure subsections are additive

- **T10.3**: Update `.agents/instructions/tests.instructions.md`
  - **Read before writing**: existing `.agents/instructions/tests.instructions.md`
  - Add certificate subsections: entity-setup helpers, repo tests, GraphQL tests, gotchas
  - Ensure subsections are additive

### Quality Check
- Verify instruction file additions are additive (non-destructive)
- Verify certificate subsections use tables and bullet lists
- Verify naming conventions match AGENTS.md files and docs
- Verify no code snippets in instruction file additions
- [ ] Run per-file quality loop for each file created/modified (full progressive chain: tsgo → biome → lint → codescene):
  ```bash
  bun run scripts/health/sub-loop.ts .agents/instructions/frontend.instructions.md --lifecycle codescene
  bun run scripts/health/sub-loop.ts .agents/instructions/backend.instructions.md --lifecycle codescene
  bun run scripts/health/sub-loop.ts .agents/instructions/tests.instructions.md --lifecycle codescene
  ```

---

## T11: Updating Skills

**Estimated**: 2–3 hours | **Depends On**: T10 | **Refs**: REQ-21.22, REQ-21.23, REQ-21.24, design.md §5

> **Parallelizable**: This task runs as a subagent in Wave 5 alongside T12.

### Subtasks

- **T11.1**: Update review workflow skills
  - Review existing review skill definitions (review-frontend, review-backend, review-types, review-config, review-uncommitted)
  - Add certificate-specific checklist items to each review skill as described in design.md §5.1
  - Ensure additions are integrated into existing checklist structure
  - Test that updated skills correctly surface certificate checklist items

- **T11.2**: Update quality gate skill file path recognition
  - Review `scripts/health/sub-loop.ts` file path → instruction file mapping
  - Add certificate file path patterns as described in design.md §5.2
  - Ensure mapping is additive — existing patterns must continue to work
  - Test that certificate file paths correctly resolve to instruction files

- **T11.3**: Update coding agent skills
  - Review existing coding-agent skill definition
  - Add certificate documentation references as described in design.md §5.3
  - Ensure references point to `docs/certificates/INDEX.md` and layer-specific files
  - Test that coding agent correctly reads documentation when assigned certificate files

### Quality Check
- Verify skills are updated additively (no removal of existing skill items)
- Verify quality gate dry run correctly maps certificate file paths
- Verify coding agent references resolve to existing documentation files
- Verify no code snippets in skill definition updates
- [ ] Run per-file quality loop for each file created/modified (full progressive chain: tsgo → biome → lint → codescene):
  ```bash
  bun run scripts/health/sub-loop.ts scripts/health/sub-loop.ts --lifecycle codescene
  # Also run on each updated skill definition file as applicable
  ```

---

## T12: Adding Knowledge Sub-Domain i18n Keys

**Estimated**: 1–2 hours | **Depends On**: T9 | **Refs**: REQ-21.28, design.md §7

> **Parallelizable**: This task runs as a subagent in Wave 5 alongside T11.

### Subtasks

- **T12.1**: Add `knowledge` sub-domain to type schema
  - **Read before writing**: existing `shared/locale/certificates.ts` (or equivalent type schema file)
  - Add `knowledge` object to the `certificates` namespace type with 12 keys as defined in requirements.md §3
  - Each key defined as `() => string` (simple return type, no interpolation)
  - Verify type compiles via `bun tsgo`

- **T12.2**: Add English implementations
  - **Read before writing**: existing `shared/locale/en/certificates.ts`
  - Add `knowledge` sub-domain object with 12 English string values as defined in requirements.md §3
  - Verify implementation matches type schema

- **T12.3**: Add Arabic implementations
  - **Read before writing**: existing `shared/locale/ar/certificates.ts`
  - Add `knowledge` sub-domain object with 12 Arabic string values as defined in requirements.md §3
  - Verify Arabic translations are accurate and contextually appropriate
  - Verify implementation matches type schema

### Quality Check
- Run `bun tsgo` to verify type compilation
- Verify both English and Arabic implementations match the type schema
- Verify all 12 keys are implemented in both locales
- Verify no hardcoded strings in documentation-related code surfaces
- Run lint on modified locale files

---

## T13: Cross-Reference Validation and Documentation Accuracy Review

**Estimated**: 2–3 hours | **Depends On**: T2–T12 | **Refs**: REQ-21.25, REQ-21.26, REQ-21.32

### Subtasks

- **T13.1**: Validate all cross-references
  - Read each documentation file in `docs/certificates/` and verify all referenced AGENTS.md files exist and contain the corresponding certificate section
  - Read each updated AGENTS.md file and verify all referenced documentation files exist
  - Read instruction files and verify AGENTS.md references are valid
  - Catalog any broken cross-references

- **T13.2**: Validate documentation accuracy against implementation
  - Compare `ARCHITECTURE.md` entity model against Plan 1 schema definitions
  - Compare `DATABASE_PATTERNS.md` repository methods against Plan 3 implementation
  - Compare `SERVICE_PATTERNS.md` service descriptions against Plan 4 implementation
  - Compare `GRAPHQL_PATTERNS.md` type descriptions against Plan 5 implementation
  - Compare `FRONTEND_PATTERNS.md` view organization against Plans 8, 16 implementation
  - Compare `CRON_PATTERNS.md` against Plan 22 requirements and existing cron routes
  - Compare `TESTING_PATTERNS.md` against Plan 20 implementation
  - Catalog any discrepancies

- **T13.3**: Fix discrepancies
  - For each discrepancy found in T13.1 or T13.2, update the documentation to match the implementation
  - If the implementation deviates from planned design, document the deviation in the relevant docs file as a "Deviation Note" rather than silently updating the docs
  - Re-validate fixed cross-references

### Quality Check
- All cross-references are bidirectional and valid
- All documentation accurately describes the actual implementation
- All deviations from plan are documented as deviation notes
- No broken links remain

---

## T14: Quality Loop and Verification

**Estimated**: 2–3 hours | **Depends On**: T1–T13 | **Refs**: design.md §12

### Subtasks

- **T14.1**: Run quality gate verification
  - Run `bun tsgo` to verify all modified TypeScript files (locale files) type-check cleanly
  - Run `bun biome:check` to verify formatting of modified files
  - Start lint queue server and run lint on modified locale files
  - Address any issues found

- **T14.2**: Verify documentation completeness
  - Verify all 13 documentation files exist in `docs/certificates/`
  - Verify `INDEX.md` links to all 13 files
  - Verify each documentation file has a table of contents
  - Verify no documentation file contains code snippets exceeding 3 lines
  - Verify all required sections (per requirements.md) are present in each file

- **T14.3**: Verify AGENTS.md completeness
  - Verify all 13 AGENTS.md files listed in design.md §3 are updated
  - Verify each updated AGENTS.md file contains a certificate-specific section
  - Verify no AGENTS.md file duplicates root AGENTS.md content
  - Verify all cross-references are bidirectional (from T13)

- **T14.4**: Verify instruction file completeness
  - Verify all 3 instruction files are updated
  - Verify additions are additive (non-destructive)
  - Verify certificate subsections exist with required content

- **T14.5**: Verify skill completeness
  - Verify quality gate `sub-loop.ts` maps certificate file paths correctly
  - Verify review skills include certificate checklist items
  - Verify coding agent skills include certificate documentation references

- **T14.6**: Verify i18n completeness
  - Verify `knowledge` sub-domain exists in type schema
  - Verify English and Arabic implementations exist with all 12 keys
  - Verify no hardcoded strings in documentation-related code

### Quality Check
- `bun tsgo` passes cleanly
- `bun biome:check` passes on modified files
- Lint passes on modified locale files
- All verification subtasks pass

---

## T15: Knowledge Propagation Finalization

**Estimated**: 1–2 hours | **Depends On**: T14 | **Refs**: All

### Subtasks

- **T15.1**: Final review of all documentation
  - Read through `docs/certificates/INDEX.md` one final time to ensure navigational completeness
  - Verify keyword index covers all major topics
  - Verify quick reference table maps common tasks to documentation sections

- **T15.2**: Final review of all AGENTS.md updates
  - Overview scan of all 13 updated AGENTS.md files to ensure consistency in formatting
  - Verify all certificate sections use the same heading level and structure conventions

- **T15.3**: Final review of instruction file updates
  - Verify instruction file certificate subsections are discoverable by `sub-loop.ts`
  - Verify subsection content is concise and references AGENTS.md and docs for details

- **T15.4**: Documentation handoff
  - Verify that the documentation is ready for consumption by:
    - Developers (searchable, navigable, accurate)
    - AI agents (AGENTS.md files updated, instruction files updated, skills updated)
    - Code reviewers (checklist items in review skills)
  - No further action needed — documentation is self-maintaining through cross-references

### Quality Check
- All documentation files are complete and accurate
- All AGENTS.md files are updated with consistent formatting
- All instruction files are updated with discoverable subsections
- All skills are updated with certificate-specific guidance
- The knowledge propagation plan is complete

---

## Execution Order

The tasks execute in the following order, with parallel subagent dispatch where noted:

1. **T1** (docs dir + INDEX.md) — sequential, blocking
2. **T2, T3, T4, T5, T6** (writing all 12 documentation files) — via parallel subagents after T1
   - T5 also requires Plan 22 requirements.md (already exists)
3. **T7** (backend AGENTS.md updates) — after T2, T3, T5
4. **T8** (frontend/app AGENTS.md updates) — after T4, T6
   - T7 and T8 run via parallel subagents (Wave 3)
5. **T9** (root + shared AGENTS.md) — after T7 and T8
6. **T10** (instruction files) — after T7 and T8 (runs via parallel subagents with T9)
7. **T11** (skills) — after T10
8. **T12** (i18n knowledge sub-domain) — after T9 (runs via parallel subagents with T11)
9. **T13** (cross-reference validation) — after T2–T12
10. **T14** (quality loop) — after T13
11. **T15** (finalization) — after T14

### Parallel Subagent Opportunities

| Subagent Group | Tasks |
|----------------|-------|
| Wave 1 (after T1) | T2, T3, T4, T5, T6 |
| Wave 2 (after T2, T3, T4, T5, T6) | T7, T8 |
| Wave 3 (after T7, T8) | T9, T10 |
| Wave 4 (after T9) | T11, T12 |

### Total Estimated Hours

| Phase | Tasks | Hours |
|-------|-------|-------|
| Documentation writing | T1–T6 | 15–22 |
| AGENTS.md updates | T7–T9 | 8–12 |
| Instruction files | T10 | 2–3 |
| Skills | T11 | 2–3 |
| i18n | T12 | 1–2 |
| Validation | T13 | 2–3 |
| Quality | T14 | 2–3 |
| Finalization | T15 | 1–2 |
| **Total** | | **33–50** |

---

## AGENTS.md and Instruction File Read References

### Per-Task Read Requirements

| Task | AGENTS.md Files to Read | Instruction Files to Read | Analysis Files to Read |
|------|------------------------|--------------------------|------------------------|
| T1 | Root AGENTS.md | — | — |
| T2 | Root, `backend/db/repo/AGENTS.md` | — | Plan 1, Plan 3 docs |
| T3 | `backend/services/AGENTS.md`, `backend/graphql/AGENTS.md` | — | Plan 4, Plan 5 docs |
| T4 | `frontend/AGENTS.md`, `frontend/views/AGENTS.md`, `frontend/common/stores/AGENTS.md` | — | Plan 7, Plan 8, Plan 16 docs |
| T5 | `app/AGENTS.md`, `backend/db/test/AGENTS.md` | — | `siraj_analysis/12-cron-config-infra.md`, `siraj_analysis/10-testing-quality-patterns.md` |
| T6 | `shared/AGENTS.md`, `app/AGENTS.md` | — | Plan 10, 12, 15, 18, 19 docs |
| T7 | All backend `AGENTS.md` files | `.agents/instructions/backend.instructions.md` | — |
| T8 | All frontend `AGENTS.md` files + `app/AGENTS.md` | `.agents/instructions/frontend.instructions.md` | — |
| T9 | Root AGENTS.md, `shared/AGENTS.md` | — | — |
| T10 | — | All 3 instruction files | — |
| T11 | — | — | Existing skill definitions |
| T12 | `shared/AGENTS.md` | — | `shared/locale/` structure |
| T13 | All updated AGENTS.md files | All updated instruction files | All implementation docs |
| T14 | All AGENTS.md files | All instruction files | — |
| T15 | All AGENTS.md files | All instruction files | — |
