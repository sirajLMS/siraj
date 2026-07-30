# Specification: Neon Database Performance Optimization

**Target Directory:** `.ai/plans/neon`  
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

### Feature 2: Drizzle Prepared Statements 2.0 (Pilot & Rollout)
3. **WHEN** frequent repository queries (starting with single pilot candidate `backend/db/repo/users/user.repository.ts`) are executed **THEN** system **SHALL** execute pre-compiled Drizzle prepared statements using `sql.placeholder(...)`.
4. **WHEN** a repository file is refactored **THEN** system **SHALL** run its targeted database unit test first before rolling out to remaining repositories, and pass `bun test:db` and `bun test:services`.

### Feature 3: Vercel & Neon Regional Alignment
5. **WHEN** deploying serverless functions to Vercel **THEN** system **SHALL** configure function deployment regions in `vercel.json` matching the physical AWS region of the Neon database host (e.g. `fra1` / `iad1`).
6. **IF** `process.env.VERCEL` is active **AND** database queries are executed **THEN** physical network round-trip time (RTT) between serverless lambdas and Neon **SHALL** be < 15ms.

### Feature 4: GraphQL DataLoader Batching (Pilot & Rollout)
7. **WHEN** nested GraphQL field resolvers request related entities **THEN** system **SHALL** batch the requests using Pothos DataLoader plugins (starting with single pilot domain `users`), execute `bun generate:gqlSchema`, `bun codegen`, and pass `bun test:graphql`.
8. **WHEN** duplicate keys are requested in the same GraphQL request tick **THEN** DataLoader **SHALL** return cached in-memory results for that request lifecycle without querying the database again.

### Feature 5: Strict Quality & Test Verification
9. **WHEN** any file is modified **THEN** system **SHALL** execute the per-file quality verification loop on that specific file.
10. **WHEN** any subtask is completed **THEN** system **SHALL** execute `bun tsgo`, `bun biome:check`, and `bun run lint` globally, exiting with zero errors and zero warnings.

---

## 4. Edge Cases & Constraints

- **Single Pilot Validation:** Always validate pilot candidates (`user.repository.ts` for repositories and `users` for GraphQL) with their specific targeted tests before expanding to other modules.
- **Transaction Safety:** HTTP fetch mode (`neon()`) cannot maintain multi-query transactions; transactions MUST remain on pool/WebSocket connections.
- **Serverless Isolation:** In-memory caches (such as DataLoader) MUST be scoped per-request to prevent data leakage between different users.
- **Environment Parity:** Local development using PostgreSQL (`DB_PROVIDER=postgres`) MUST continue functioning seamlessly without breaking local `pg-pooled` drivers.

---

## 5. Requirements Quality Checklist

- [x] Pilot candidates specified for single-repo and single-domain validation
- [x] All test commands (`bun test:db`, `bun test:services`, `bun generate:gqlSchema`, `bun codegen`, `bun test:graphql`) explicitly integrated
- [x] Per-file quality verification loop required on file modification
- [x] Global quality verification (`tsgo`, `biome:check`, `lint`) required with zero errors and warnings
- [x] EARS format used consistently for all acceptance criteria
