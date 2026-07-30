# Task Breakdown: Neon Database Performance Optimization

**Target Directory:** `.ai/plans/neon`  
**Phase:** 3 — Actionable Task Breakdown  
**Related Spec:** [spec.md](file://.ai/plans/neon/spec.md)  
**Related Design:** [design.md](file://.ai/plans/neon/design.md)  

---

## Non-Negotiable Execution Rules for All Tasks

1. **Per-File Quality Verification Loop (Immediate post-edit):**  
   Whenever a file is modified, execute per-file verification (`bun tsgo` + `bun biome:check` + lint queue for target file) BEFORE moving to another file or subtask.
2. **Global Health Check (Completion Gate):**  
   Before marking any subtask as complete, run full global checks: `bun tsgo`, `bun biome:check`, and `bun run lint` globally. All MUST exit with **zero errors and zero warnings**.

---

## Task List

- [ ] 1. **Foundation & Environment Setup**
  - [ ] 1.1 Region Alignment in `vercel.json`
    - Update `vercel.json` to include `"regions": ["iad1"]` (or matching Neon host region) alongside `"fluid": true`.
    - Run per-file quality verification on `vercel.json`.
    - Run global check: `bun tsgo`, `bun biome:check`, `bun run lint` (0 errors, 0 warnings).
    - _Requirements: Spec 5, 6_
  - [ ] 1.2 Neon HTTP Single-Fetch Helper
    - Create `backend/db/http-client.ts` implementing `getNeonHttpClient()` for zero-pool HTTP single-fetch queries.
    - Run per-file quality verification on `backend/db/http-client.ts`.
    - Run global check: `bun tsgo`, `bun biome:check`, `bun run lint` (0 errors, 0 warnings).
    - _Requirements: Spec 1, 2_

- [ ] 2. **Prepared Statements 2.0 (Repository Layer)**
  - [ ] 2.1 **Pilot Candidate Refactor (`user.repository.ts`)**
    - Refactor pilot candidate repository `backend/db/repo/users/user.repository.ts` to implement Drizzle prepared statements using `sql.placeholder(...)`.
    - Run per-file quality verification on `backend/db/repo/users/user.repository.ts`.
    - Run targeted unit test: `bun run scripts/run-test/run-test.ts backend/db/test/repo/users/user.repository.test.ts`.
    - Run global check: `bun tsgo`, `bun biome:check`, `bun run lint` (0 errors, 0 warnings).
    - _Requirements: Spec 3, 4, 9, 10_
  - [ ] 2.2 **Repository Layer Rollout & Test Verification**
    - Rollout prepared statements to remaining repositories in `backend/db/repo/` (e.g. `auth`, `classes`, `scheduling`, `students`).
    - Run per-file quality verification on each modified file.
    - Run full repository test suites:
      - `bun test:db` (Database repository tests)
      - `bun test:services` (Backend services integration tests)
    - Run global check: `bun tsgo`, `bun biome:check`, `bun run lint` (0 errors, 0 warnings).
    - _Requirements: Spec 3, 4, 9, 10_

- [ ] 3. **GraphQL DataLoader Integration (GraphQL Layer)**
  - [ ] 3.1 **Pilot Candidate Domain (`users` Domain)**
    - Configure Pothos DataLoader plugin on pilot domain `backend/graphql/pothos/users/`.
    - Run per-file quality verification on modified GraphQL files.
    - Run GraphQL schema generation and codegen:
      - `bun generate:gqlSchema`
      - `bun codegen`
    - Run targeted frontend/GraphQL tests for `users` domain: `bun run test frontend/common/graphql/sharedDocuments/users/`.
    - Run global check: `bun tsgo`, `bun biome:check`, `bun run lint` (0 errors, 0 warnings).
    - _Requirements: Spec 7, 8, 9, 10_
  - [ ] 3.2 **GraphQL Layer Rollout & Integration Verification**
    - Rollout DataLoader batching to remaining GraphQL domains in `backend/graphql/pothos/`.
    - Run per-file quality verification on each modified file.
    - Run GraphQL schema generation and codegen:
      - `bun generate:gqlSchema`
      - `bun codegen`
    - Run full GraphQL integration test suite:
      - `bun test:graphql`
    - Run global check: `bun tsgo`, `bun biome:check`, `bun run lint` (0 errors, 0 warnings).
    - _Requirements: Spec 7, 8, 9, 10_

- [ ] 4. **Schema Indexing Audit**
  - [ ] 4.1 Schema Index Review
    - Audit `backend/db/schema/` definitions for missing indexes on foreign key relationships and multi-tenant filter columns.
    - Run per-file quality verification on any edited schema files.
    - Run global check: `bun tsgo`, `bun biome:check`, `bun run lint` (0 errors, 0 warnings).
    - _Requirements: Spec 9, 10_

- [ ] 5. **Final Comprehensive Quality Gate & Test Verification**
  - [ ] 5.1 Full Suite Execution
    - Execute `bun test:db`
    - Execute `bun test:services`
    - Execute `bun test:graphql`
  - [ ] 5.2 Repository Health Verification
    - Execute `bun tsgo`
    - Execute `bun biome:check`
    - Execute `bun run lint`
    - Verify 0 errors and 0 warnings across full repository.
    - _Requirements: Spec 1–10_
