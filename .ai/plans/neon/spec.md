# Specification: Neon Database Performance Optimization

**Target Directory:** `.ai/plans/neon`  
**Outcome Directory:** `.ai/plans/neon/outcome`  
**Repo Rollout Tracker:** `.ai/plans/neon/repo-rollout-tracker.json`  
**GraphQL Rollout Tracker:** `.ai/plans/neon/graphql-rollout-tracker.json`  
**Methodology:** Spec-Driven Development  
**Feature:** Advanced Neon Database Performance & Latency Optimization  

---

## 1. Executive Summary

This document specifies the requirements for optimizing the Neon PostgreSQL database performance across Siraj's stack (Next.js 16, Drizzle ORM, Pothos GraphQL, and Vercel serverless runtime). Building on the connection pool and SSL baseline fixes, this feature targets query-level latency, network RTT, cold-start query overhead, and N+1 query prevention.

---

## 2. User Stories

### Story 1: Fast Page & API Response Times
As a user of Siraj, I want dashboard pages and GraphQL requests to load rapidly (< 150ms TTFB), so that the application feels instant and responsive.

### Story 2: High Concurrency Stability
As a system administrator, I want the database connection layer to handle concurrent user traffic without hitting Neon connection limits, timeouts, or DNS failures.

### Story 3: Efficient GraphQL Query Execution
As a developer, I want nested GraphQL query fields to fetch data in bulk rather than executing separate database queries per node (preventing N+1 queries).

---

## 3. Acceptance Criteria (EARS Format)

### Feature 1: Neon Single-Fetch HTTP Mode (`neon()`)
1. **WHEN** a read-only query requires single-roundtrip execution **THEN** system **SHALL** execute the query using `@neondatabase/serverless` HTTP fetch (`neon(url)`) instead of establishing a WebSocket connection pool.
2. **IF** the database operation involves an active multi-statement transaction (`runInTransaction`) **THEN** system **SHALL** execute the operation using the WebSocket/pooled client (`neon-serverless` / `pg-pooled`).

### Feature 2: Drizzle Prepared Statements 2.0 (Pilot & Dynamic 16-Pool Subagent Rollout)
3. **WHEN** frequent repository queries (starting with single pilot candidate `backend/db/repo/users/user.repository.ts`) are executed **THEN** system **SHALL** execute pre-compiled Drizzle prepared statements using `sql.placeholder(...)`.
4. **WHEN** executing Task 2.2 (Repository Layer Rollout) **THEN** system **SHALL** spawn a parent orchestrator subagent that continuously monitors nested subagents and immediately spawns new subagents whenever slots free up to maintain **exactly 16 running subagents** concurrently until all repository files are refactored.
5. **WHEN** a nested repository subagent is spawned **THEN** system **SHALL** restrict it strictly to its assigned single repository file, provide full plan paths (`spec.md`, `design.md`, `tasks.md`), enforce pre-execution outcome reading, and mandate per-file quality verification (`tsgo` + `biome` + `lint-queue`).
6. **WHEN** orchestrating Task 2.2 **THEN** system **SHALL** maintain a tracking state file at `.ai/plans/neon/repo-rollout-tracker.json` to track assigned files, active subagent IDs, and completion status to prevent duplication.
7. **WHEN** all repository files are refactored **THEN** system **SHALL** run `bun test:db` and `bun test:services`.

### Feature 3: Vercel & Neon Regional Alignment
8. **WHEN** deploying serverless functions to Vercel **THEN** system **SHALL** configure function deployment regions in `vercel.json` matching the physical AWS region of the Neon database host (e.g. `fra1` / `iad1`).
9. **IF** `process.env.VERCEL` is active **AND** database queries are executed **THEN** physical network round-trip time (RTT) between serverless lambdas and Neon **SHALL** be < 15ms.

### Feature 4: GraphQL DataLoader Batching (Pilot & Dynamic 16-Pool Subagent Rollout)
10. **WHEN** nested GraphQL field resolvers request related entities **THEN** system **SHALL** batch the requests using Pothos DataLoader plugins (starting with single pilot domain `users`).
11. **WHEN** executing Task 3.2 (GraphQL Layer Rollout) **THEN** system **SHALL** spawn a parent orchestrator subagent that continuously monitors nested subagents and immediately spawns new subagents whenever slots free up to maintain **exactly 16 running subagents** concurrently until all GraphQL domains are refactored.
12. **WHEN** a nested GraphQL subagent is spawned **THEN** system **SHALL** restrict it strictly to its assigned GraphQL domain folder, provide full plan paths (`spec.md`, `design.md`, `tasks.md`), enforce pre-execution outcome reading, and mandate per-file quality verification (`tsgo` + `biome` + `lint-queue`).
13. **WHEN** orchestrating Task 3.2 **THEN** system **SHALL** maintain a tracking state file at `.ai/plans/neon/graphql-rollout-tracker.json` to track assigned domains, active subagent IDs, and completion status to prevent duplication.
14. **WHEN** all GraphQL domains are refactored **THEN** system **SHALL** run `bun generate:gqlSchema`, `bun codegen`, and `bun test:graphql`.

### Feature 5: Strict Quality & Test Verification
15. **WHEN** any file is modified **THEN** system **SHALL** execute the per-file quality verification loop on that specific file.
16. **WHEN** any subtask is completed **THEN** system **SHALL** execute `bun tsgo`, `bun biome:check`, and `bun run lint` globally, exiting with zero errors and zero warnings.

### Feature 6: Execution Outcome Protocol & Task Progress Tracking
17. **WHEN** an executing agent starts any task **THEN** system **SHALL** read ALL existing outcome files in `.ai/plans/neon/outcome/` to absorb prior research, analysis, and pitfalls without re-doing existing work.
18. **WHEN** an executing agent completes any task **THEN** system **SHALL** write a new outcome document under `.ai/plans/neon/outcome/<task-id>-outcome.md` detailing research findings, docs/web search results, misunderstandings, and carry-over points.
19. **WHEN** an executing agent completes any subtask **THEN** system **SHALL** update the corresponding task checkbox `[ ]` -> `[x]` in `tasks.md`.

---

## 4. Edge Cases & Constraints

- **Dynamic Pool Replenishment:** The parent orchestrator subagent MUST actively monitor running subagents and spawn new worker subagents immediately upon completion of any running worker to maximize throughput at 16 active subagents.
- **Strict File/Domain Scoping:** Each nested worker subagent in Task 2.2 and Task 3.2 MUST only modify its assigned file or domain. It MUST NOT touch any other file in the codebase.
- **Knowledge Continuity:** All agents executing tasks must consult `.ai/plans/neon/outcome/` before performing work.
- **Transaction Safety:** HTTP fetch mode (`neon()`) cannot maintain multi-query transactions; transactions MUST remain on pool/WebSocket connections.
