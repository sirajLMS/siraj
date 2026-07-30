# Task Breakdown: Neon Database Performance Optimization

**Target Directory:** `.ai/plans/neon`  
**Outcome Directory:** `.ai/plans/neon/outcome`  
**Phase:** 3 — Actionable Task Breakdown  
**Related Spec:** [spec.md](file://.ai/plans/neon/spec.md)  
**Related Design:** [design.md](file://.ai/plans/neon/design.md)  

---

## Non-Negotiable Execution Protocol for All Tasks

1. **Pre-Execution Outcome Knowledge Read:**  
   Before executing ANY task, the executing agent MUST read ALL existing files in `.ai/plans/neon/outcome/` to absorb prior research, search results, docs, and pitfalls so analysis is not repeated.
2. **Per-File Quality Verification Loop (Immediate post-edit):**  
   Whenever a file is modified, execute per-file verification (`bun tsgo` + `bun biome:check` + lint queue for target file) BEFORE moving to another file or subtask.
3. **Global Health Check (Completion Gate):**  
   Before marking any subtask as complete, run full global checks: `bun tsgo`, `bun biome:check`, and `bun run lint` globally. All MUST exit with **zero errors and zero warnings**.
4. **Post-Execution Outcome File Creation:**  
   Upon completing the task implementation and quality checks, write a new outcome document under `.ai/plans/neon/outcome/<task-id>-outcome.md` summarizing research, analysis, changes, and carry-over knowledge.
5. **Task Progress Tracking:**  
   The executing agent MUST update the task checkbox `[ ]` -> `[x]` in this `tasks.md` file upon successful completion.

---

## Task List

- [ ] 1. **Foundation & Environment Setup**
  - [ ] 1.1 Region Alignment in `vercel.json`
    - Read all existing files in `.ai/plans/neon/outcome/`.
    - Update `vercel.json` to include `"regions": ["iad1"]` (or matching Neon host region) alongside `"fluid": true`.
    - Run per-file quality verification on `vercel.json`.
    - Run global check: `bun tsgo`, `bun biome:check`, `bun run lint` (0 errors, 0 warnings).
    - Write outcome file: `.ai/plans/neon/outcome/1.1-region-alignment-outcome.md`.
    - Update progress: Mark task 1.1 as `[x]` in `tasks.md`.
    - _Requirements: Spec 5, 6, 11, 12, 13_
  - [ ] 1.2 Neon HTTP Single-Fetch Helper
    - Read all existing files in `.ai/plans/neon/outcome/`.
    - Create `backend/db/http-client.ts` implementing `getNeonHttpClient()` for zero-pool HTTP single-fetch queries.
    - Run per-file quality verification on `backend/db/http-client.ts`.
    - Run global check: `bun tsgo`, `bun biome:check`, `bun run lint` (0 errors, 0 warnings).
    - Write outcome file: `.ai/plans/neon/outcome/1.2-neon-http-client-outcome.md`.
    - Update progress: Mark task 1.2 as `[x]` in `tasks.md`.
    - _Requirements: Spec 1, 2, 11, 12, 13_

- [x] 2. **Prepared Statements 2.0 (Repository Layer)**
  - [x] 2.1 **Pilot Candidate Refactor (`user.repository.ts`)**
    - Read all existing files in `.ai/plans/neon/outcome/`.
    - Refactor pilot candidate repository `backend/db/repo/users/user.repository.ts` to implement Drizzle prepared statements using `sql.placeholder(...)`.
    - Run per-file quality verification on `backend/db/repo/users/user.repository.ts`.
    - Run targeted unit test: `bun run scripts/run-test/run-test.ts backend/db/test/repo/users/user.repository.test.ts`.
    - Run global check: `bun tsgo`, `bun biome:check`, `bun run lint` (0 errors, 0 warnings).
    - Write outcome file: `.ai/plans/neon/outcome/2.1-prepared-statements-pilot-outcome.md`.
    - Update progress: Mark task 2.1 as `[x]` in `tasks.md`.
    - _Requirements: Spec 3, 4, 9, 10, 11, 12, 13_
  - [ ] 2.2 **Repository Layer Rollout & Test Verification**
    - Read all existing files in `.ai/plans/neon/outcome/`.
    - Rollout prepared statements to remaining repositories in `backend/db/repo/` (e.g. `auth`, `classes`, `scheduling`, `students`).
    - Run per-file quality verification on each modified file.
    - Run full repository test suites:
      - `bun test:db` (Database repository tests)
      - `bun test:services` (Backend services integration tests)
    - Run global check: `bun tsgo`, `bun biome:check`, `bun run lint` (0 errors, 0 warnings).
    - Write outcome file: `.ai/plans/neon/outcome/2.2-prepared-statements-rollout-outcome.md`.
    - Update progress: Mark task 2.2 as `[x]` in `tasks.md`.
    - _Requirements: Spec 3, 4, 9, 10, 11, 12, 13_

- [ ] 3. **GraphQL DataLoader Integration (GraphQL Layer)**
  - [ ] 3.1 **Pilot Candidate Domain (`users` Domain)**
    - Read all existing files in `.ai/plans/neon/outcome/`.
    - Configure Pothos DataLoader plugin on pilot domain `backend/graphql/pothos/users/`.
    - Run per-file quality verification on modified GraphQL files.
    - Run GraphQL schema generation and codegen:
      - `bun generate:gqlSchema`
      - `bun codegen`
    - Run targeted frontend/GraphQL tests for `users` domain: `bun run test frontend/common/graphql/sharedDocuments/users/`.
    - Run global check: `bun tsgo`, `bun biome:check`, `bun run lint` (0 errors, 0 warnings).
    - Write outcome file: `.ai/plans/neon/outcome/3.1-graphql-dataloader-pilot-outcome.md`.
    - Update progress: Mark task 3.1 as `[x]` in `tasks.md`.
    - _Requirements: Spec 7, 8, 9, 10, 11, 12, 13_
  - [ ] 3.2 **GraphQL Layer Rollout & Integration Verification**
    - Read all existing files in `.ai/plans/neon/outcome/`.
    - Rollout DataLoader batching to remaining GraphQL domains in `backend/graphql/pothos/`.
    - Run per-file quality verification on each modified file.
    - Run GraphQL schema generation and codegen:
      - `bun generate:gqlSchema`
      - `bun codegen`
    - Run full GraphQL integration test suite:
      - `bun test:graphql`
    - Run global check: `bun tsgo`, `bun biome:check`, `bun run lint` (0 errors, 0 warnings).
    - Write outcome file: `.ai/plans/neon/outcome/3.2-graphql-dataloader-rollout-outcome.md`.
    - Update progress: Mark task 3.2 as `[x]` in `tasks.md`.
    - _Requirements: Spec 7, 8, 9, 10, 11, 12, 13_

- [ ] 4. **Schema Indexing Audit**
  - [ ] 4.1 Schema Index Review
    - Read all existing files in `.ai/plans/neon/outcome/`.
    - Audit `backend/db/schema/` definitions for missing indexes on foreign key relationships and multi-tenant filter columns.
    - Run per-file quality verification on any edited schema files.
    - Run global check: `bun tsgo`, `bun biome:check`, `bun run lint` (0 errors, 0 warnings).
    - Write outcome file: `.ai/plans/neon/outcome/4.1-schema-indexing-audit-outcome.md`.
    - Update progress: Mark task 4.1 as `[x]` in `tasks.md`.
    - _Requirements: Spec 9, 10, 11, 12, 13_

- [ ] 5. **Final Comprehensive Quality Gate & Test Verification**
  - [ ] 5.1 Full Suite Execution & Final Outcome Documentation
    - Read all existing files in `.ai/plans/neon/outcome/`.
    - Execute `bun test:db`
    - Execute `bun test:services`
    - Execute `bun test:graphql`
    - Execute global health checks: `bun tsgo`, `bun biome:check`, `bun run lint` (0 errors, 0 warnings across full repository).
    - Write comprehensive final outcome summary: `.ai/plans/neon/outcome/5.1-final-verification-outcome.md`.
    - Update progress: Mark task 5.1 as `[x]` in `tasks.md`.
    - _Requirements: Spec 1–13_
