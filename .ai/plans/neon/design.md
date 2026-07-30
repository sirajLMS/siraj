# Technical Design: Neon Database Performance Optimization

**Target Directory:** `.ai/plans/neon`  
**Phase:** 2 — Technical Design Document  
**Related Spec:** [spec.md](file://.ai/plans/neon/spec.md)  

---

## 1. Architectural Overview

This design details the technical architecture for optimizing Neon database performance across Siraj's stack. The optimization spans 4 key layers with explicit **Pilot Candidate Isolation** to verify each pattern on a single file/domain before full repo rollout.

```
[ Client Request ]
       │
       ▼
[ Vercel Edge / Lambda ] (Region aligned with Neon DB, e.g. fra1 / iad1)
       │
       ▼
[ Pothos GraphQL Layer ] ──► Pilot Domain: `users` (DataLoader batching for nested relations)
       │                    Commands: `bun generate:gqlSchema` ➔ `bun codegen` ➔ `bun test:graphql`
       │
       ▼
[ Repository Layer ]     ──► Pilot Repo: `backend/db/repo/users/user.repository.ts`
       │                    Commands: `bun test:db` ➔ `bun test:services`
       │
  ┌────┴──────────────────────────┐
  │ Mode Switcher                 │
  ├───────────────────────────────┤
  │ Read-only single query:       │ ──► HTTP Fetch Client (`neon(url)`) — Fast 0-pool RTT
  │ Multi-query / Transaction:    │ ──► Serverless Pool Client (`NeonPool`) — WebSocket pool
  └───────────────────────────────┘
       │
       ▼
[ Neon Serverless PostgreSQL ]
```

---

## 2. Component Design & Interfaces

### 2.1 Dual Client Helper (`backend/db/http-client.ts`)
Helper for stateless single read queries using Neon's HTTP driver:

```typescript
import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import { getEnvironmentConfig } from "@/backend/lib/env";

let httpQueryClient: NeonQueryFunction<boolean, boolean> | null = null;

export function getNeonHttpClient() {
  if (!httpQueryClient) {
    httpQueryClient = neon(getEnvironmentConfig().databaseUrl);
  }
  return httpQueryClient;
}
```

### 2.2 Prepared Statements 2.0 (Pilot Candidate: `user.repository.ts`)
Pilot implementation on `backend/db/repo/users/user.repository.ts`:

```typescript
import { eq, sql } from "drizzle-orm";
import { db } from "@/backend/db/factory";
import { users } from "@/backend/db/schema";

// Prepared statement for single user lookup by ID
export const findUserByIdPrepared = db
  .select()
  .from(users)
  .where(eq(users.id, sql.placeholder("userId")))
  .prepare("find_user_by_id");
```

- **Targeted Test Command:**  
  `bun run scripts/run-test/run-test.ts backend/db/test/repo/users/user.repository.test.ts`
- **Suite Verification Commands:**  
  `bun test:db` and `bun test:services`

### 2.3 GraphQL DataLoader Integration (Pilot Candidate: `users` Domain)
Pilot implementation on `backend/graphql/pothos/users/`:

```typescript
// Pothos DataLoader batching for users relation
t.loadable({
  type: UserType,
  load: async (keys: string[], ctx) => {
    const usersList = await userService.findManyByIds(keys);
    return keys.map((id) => usersList.find((u) => u.id === id) || null);
  },
  resolve: (parent) => parent.userId,
});
```

- **GraphQL Codegen Commands:**  
  `bun generate:gqlSchema` and `bun codegen`
- **Suite Verification Command:**  
  `bun test:graphql`

---

## 3. Strict Quality Verification Loop

Every task step MUST strictly adhere to the project's non-negotiable verification loop:

### 3.1 Per-File Quality Loop (Immediate post-edit)
Immediately after modifying any file, execute per-file verification before editing other files:
1. `bun tsgo`
2. `bun biome:check`
3. Lint queue check via client for target file:
   ```bash
   curl -s -X POST http://localhost:4777/lint -H "Content-Type: application/json" -d '{"id":"verify","files":["<edited-file>"]}'
   ```

### 3.2 Global Subtask Health Check (Completion gate)
Before marking any subtask as complete, run full global checks:
- `bun tsgo` — MUST exit 0
- `bun biome:check` — MUST exit 0
- `bun run lint` — MUST exit 0 (zero errors, zero warnings across repository)

---

## 4. Decision Log

### Decision 1: Single Candidate Pilot Validation
- **Context:** Refactoring all repositories or GraphQL domains simultaneously risks widespread regression.
- **Decision:** Validate pattern on candidate files (`user.repository.ts` for DB, `users` for GraphQL). Run schema generation, codegen, and targeted test suites. Only expand to remaining repos/domains after clean verification.

---

## 5. Testing & Verification Suite Table

| Layer | Candidate File / Domain | Targeted Test / Generator Command | Full Suite Verification |
|---|---|---|---|
| Repository | `backend/db/repo/users/user.repository.ts` | `bun run scripts/run-test/run-test.ts backend/db/test/repo/users/user.repository.test.ts` | `bun test:db` <br> `bun test:services` |
| GraphQL | `backend/graphql/pothos/users/` | `bun generate:gqlSchema` <br> `bun codegen` | `bun test:graphql` |
| Quality | Any modified file | Per-file sub-loop (`tsgo` + `biome` + `lint-queue`) | `bun tsgo` <br> `bun biome:check` <br> `bun run lint` |
