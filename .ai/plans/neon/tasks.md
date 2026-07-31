# Task Breakdown: Neon Database Performance Optimization

**Target Directory:** `.ai/plans/neon`  
**Outcome Directory:** `.ai/plans/neon/outcome`  
**Repo Rollout Tracker:** `.ai/plans/neon/repo-rollout-tracker.json`  
**GraphQL Rollout Tracker:** `.ai/plans/neon/graphql-rollout-tracker.json`  
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
    - _Requirements: Spec 8, 9, 17, 18, 19_
  - [x] 1.2 Neon HTTP Single-Fetch Helper
    - Read all existing files in `.ai/plans/neon/outcome/`.
    - Create `backend/db/http-client.ts` implementing `getNeonHttpClient()` for zero-pool HTTP single-fetch queries.
    - Run per-file quality verification on `backend/db/http-client.ts`.
    - Run global check: `bun tsgo`, `bun biome:check`, `bun run lint` (0 errors, 0 warnings).
    - Write outcome file: `.ai/plans/neon/outcome/1.2-neon-http-client-outcome.md`.
    - Update progress: Mark task 1.2 as `[x]` in `tasks.md`.
    - _Requirements: Spec 1, 2, 17, 18, 19_

- [x] 2. **Prepared Statements 2.0 (Repository Layer)**
  - [x] 2.1 **Pilot Candidate Refactor (`user.repository.ts`)**
    - Read all existing files in `.ai/plans/neon/outcome/`.
    - Refactor pilot candidate repository `backend/db/repo/users/user.repository.ts` to implement Drizzle prepared statements using `sql.placeholder(...)`.
    - Run per-file quality verification on `backend/db/repo/users/user.repository.ts`.
    - Run targeted unit test: `bun run scripts/run-test/run-test.ts backend/db/test/repo/users/user.repository.test.ts`.
    - Run global check: `bun tsgo`, `bun biome:check`, `bun run lint` (0 errors, 0 warnings).
    - Write outcome file: `.ai/plans/neon/outcome/2.1-prepared-statements-pilot-outcome.md`.
    - Update progress: Mark task 2.1 as `[x]` in `tasks.md`.
    - _Requirements: Spec 3, 4, 15, 16, 17, 18, 19_
  - [x] 2.2 **Repository Layer Rollout & Test Verification (Dynamic 16-Worker Pool Watcher)**
    - Read all existing files in `.ai/plans/neon/outcome/`.
    - Gather context from `backend/db/repo/AGENTS.md` and `.github/instructions/backend.instructions.md`.
    - Spawn **Parent Orchestration Subagent** to manage the rollout across `backend/db/repo/`.
    - Parent Orchestrator creates and manages tracking state file `.ai/plans/neon/repo-rollout-tracker.json`.
    - Parent Orchestrator maintains a **continuous watcher loop** to maximize concurrency at **exactly 16 running subagents**:
      - Monitors running subagent status and immediately spawns a new subagent whenever a worker completes or a slot opens up.
      - Each nested subagent is assigned a **single repository file** from `backend/db/repo/`.
      - Each nested subagent receives full absolute plan file paths (`spec.md`, `design.md`, `tasks.md`), parent task context, and relevant `AGENTS.md` / instruction rules.
      - Each nested subagent is strictly restricted to its assigned single repository file (MUST NOT modify any other file).
      - Each nested subagent reads all existing files in `.ai/plans/neon/outcome/` before starting.
      - Each nested subagent refactors its assigned file to use Drizzle prepared statements (`sql.placeholder(...)`).
      - Each nested subagent runs per-file quality verification (`tsgo` + `biome` + `lint-queue`) on its assigned file.
      - Each nested subagent writes its file outcome document `.ai/plans/neon/outcome/2.2-<repo-name>-outcome.md`.
      - Parent Orchestrator updates `.ai/plans/neon/repo-rollout-tracker.json` with completed file status and subagent IDs.
    - Upon completion of all nested worker subagents, run full repository test suites:
      - `bun test:db` (Database repository tests)
      - `bun test:services` (Backend services integration tests)
    - Run global check: `bun tsgo`, `bun biome:check`, `bun run lint` (0 errors, 0 warnings).
    - Write rollout summary outcome file: `.ai/plans/neon/outcome/2.2-prepared-statements-rollout-outcome.md`.
    - Update progress: Mark task 2.2 as `[x]` in `tasks.md`.
    - _Requirements: Spec 3, 4, 5, 6, 7, 15, 16, 17, 18, 19_

- [ ] 3. **GraphQL DataLoader Integration (GraphQL Layer)**
  - [x] 3.1 **Pilot Candidate Domain (`users` Domain)**
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
    - _Requirements: Spec 10, 11, 15, 16, 17, 18, 19_
  - [x] 3.2 **GraphQL Layer Rollout & Integration Verification (Dynamic 16-Worker Pool Watcher)**
    - Read all existing files in `.ai/plans/neon/outcome/`.
    - Gather context from `backend/graphql/AGENTS.md` and `.github/instructions/backend.instructions.md`.
    - Spawn **Parent Orchestration Subagent** to manage the GraphQL rollout across `backend/graphql/pothos/`.
    - Parent Orchestrator creates and manages tracking state file `.ai/plans/neon/graphql-rollout-tracker.json`.
    - Parent Orchestrator maintains a **continuous watcher loop** to maximize concurrency at **exactly 16 running subagents**:
      - Monitors running subagent status and immediately spawns a new subagent whenever a worker completes or a slot opens up.
      - Each nested subagent is assigned a **single GraphQL domain folder** from `backend/graphql/pothos/`.
      - Each nested subagent receives full absolute plan file paths (`spec.md`, `design.md`, `tasks.md`), parent task context, and relevant `AGENTS.md` / instruction rules.
      - Each nested subagent is strictly restricted to its assigned single GraphQL domain folder (MUST NOT modify any other file in the codebase).
      - Each nested subagent reads all existing files in `.ai/plans/neon/outcome/` before starting.
      - Each nested subagent refactors its assigned domain to implement Pothos DataLoader batching for relations.
      - Each nested subagent runs per-file quality verification (`tsgo` + `biome` + `lint-queue`) on its modified files.
      - Each nested subagent writes its domain outcome document `.ai/plans/neon/outcome/3.2-<domain-name>-outcome.md`.
      - Parent Orchestrator updates `.ai/plans/neon/graphql-rollout-tracker.json` with completed domain status and subagent IDs.
    - Upon completion of all nested worker subagents, run GraphQL schema generation, codegen, and test suite:
      - `bun generate:gqlSchema`
      - `bun codegen`
      - `bun test:graphql` (GraphQL integration tests)
    - Run global check: `bun tsgo`, `bun biome:check`, `bun run lint` (0 errors, 0 warnings).
    - Write rollout summary outcome file: `.ai/plans/neon/outcome/3.2-graphql-dataloader-rollout-outcome.md`.
    - Update progress: Mark task 3.2 as `[x]` in `tasks.md`.
    - _Requirements: Spec 10, 11, 12, 13, 14, 15, 16, 17, 18, 19_

- [ ] 4. **Schema Indexing Audit**
  - [ ] 4.1 Schema Index Review
    - Read all existing files in `.ai/plans/neon/outcome/`.
    - Audit `backend/db/schema/` definitions for missing indexes on foreign key relationships and multi-tenant filter columns.
    - Run per-file quality verification on any edited schema files.
    - Run global check: `bun tsgo`, `bun biome:check`, `bun run lint` (0 errors, 0 warnings).
    - Write outcome file: `.ai/plans/neon/outcome/4.1-schema-indexing-audit-outcome.md`.
    - Update progress: Mark task 4.1 as `[x]` in `tasks.md`.
    - _Requirements: Spec 15, 16, 17, 18, 19_

- [ ] 5. **Final Comprehensive Quality Gate & Test Verification**
  - [ ] 5.1 Full Suite Execution & Final Outcome Documentation
    - Read all existing files in `.ai/plans/neon/outcome/`.
    - Execute `bun test:db`
    - Execute `bun test:services`
    - Execute `bun test:graphql`
    - Execute global health checks: `bun tsgo`, `bun biome:check`, `bun run lint` (0 errors, 0 warnings across full repository).
    - Write comprehensive final outcome summary: `.ai/plans/neon/outcome/5.1-final-verification-outcome.md`.
    - Update progress: Mark task 5.1 as `[x]` in `tasks.md`.
    - _Requirements: Spec 1–19_

- [x] 6. **Knowledge Propagation & Documentation (MANDATORY Final Task)**
  - Read all outcome files in `.ai/plans/neon/outcome/` to synthesize all learnings from the plan
  - Create canonical reference docs under `docs/drizzle/` consolidating patterns, rules, and gotchas from all outcome files:
    - `docs/drizzle/prepared-statements.md` — Drizzle Prepared Statements 2.0 pattern, rules, anti-patterns, rollout summary
    - `docs/drizzle/neon-http-client.md` — Neon HTTP single-fetch client pattern, when to use vs WebSocket pool
    - If `docs/drizzle/` does not exist, create it: `mkdir -p docs/drizzle/`
    - Follow the docs file structure: Why → Pattern → Rules → Anti-patterns → Rollout Summary → Related Documents
  - Create canonical reference doc under `docs/graphql/` consolidating GraphQL DataLoader patterns:
    - `docs/graphql/dataloader-batching.md` — Pothos DataLoader batching pattern, rules, anti-patterns, rollout summary
    - If `docs/graphql/` does not exist, create it: `mkdir -p docs/graphql/`
  - Update layer AGENTS.md files with new rules/patterns discovered during implementation:
    - `backend/db/repo/AGENTS.md` — Add "Prepared Statements (CRITICAL)" rule referencing `docs/drizzle/prepared-statements.md`
    - `backend/AGENTS.md` — Add prepared statements bullet to Repository Layer section, add Neon HTTP client reference
    - `backend/graphql/AGENTS.md` — Add DataLoader batching rule referencing `docs/graphql/dataloader-batching.md`
  - Update `.agents/skills/drizzle/SKILL.md` — Add "Prepared Statements" section with key rules and reference to `docs/drizzle/prepared-statements.md`
  - Update `.agents/instructions/backend.instructions.md` — Add prepared statements and DataLoader batching as required reading for backend files
  - Update root `AGENTS.md` Important References section with the new docs:
    - `docs/drizzle/prepared-statements.md` — Drizzle Prepared Statements 2.0 pattern reference
    - `docs/drizzle/neon-http-client.md` — Neon HTTP single-fetch client pattern
    - `docs/graphql/dataloader-batching.md` — Pothos DataLoader batching pattern
  - Run global check: `bun tsgo`, `bun biome:check`, `bun run lint` (0 errors, 0 warnings)
  - Write outcome file: `.ai/plans/neon/outcome/6.1-knowledge-propagation-outcome.md`
  - Update progress: Mark task 6.1 as `[x]` in `tasks.md`
  - _Requirements: Knowledge propagation protocol (Spec-Driven Development SKILL.md § Knowledge Propagation from Plan Outcomes)_
