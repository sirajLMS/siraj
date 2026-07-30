# Technical Design: Neon Database Performance Optimization

**Target Directory:** `.ai/plans/neon`  
**Outcome Directory:** `.ai/plans/neon/outcome`  
**Repo Rollout Tracker:** `.ai/plans/neon/repo-rollout-tracker.json`  
**GraphQL Rollout Tracker:** `.ai/plans/neon/graphql-rollout-tracker.json`  
**Phase:** 2 — Technical Design Document  
**Related Spec:** [spec.md](file://.ai/plans/neon/spec.md)  

---

## 1. Architectural Overview

This design details the technical architecture for optimizing Neon database performance across Siraj's stack. The optimization spans 4 key layers with explicit **Dynamic 16-Worker Pool Orchestration** for both the Repository Rollout (Task 2.2) and the GraphQL Rollout (Task 3.2).

```
 ═════════════════════════════════════════════════════════════════════════════════
  DYNAMIC 16-WORKER POOL WATCHER ARCHITECTURE (Task 2.2 & Task 3.2)
 ═════════════════════════════════════════════════════════════════════════════════
                       ┌──────────────────────────────┐
                       │  Parent Orchestrator Agent   │
                       └──────────────┬───────────────┘
                                      │ Continuous Watcher Loop:
                                      │ 1. Monitors active subagent status & completion
                                      │ 2. Updates rollout tracker JSON state
                                      │ 3. Immediately spawns new worker whenever a slot frees up
                                      │    to maintain EXACTLY 16 active subagents until queue empty
        ┌─────────────────────────────┼─────────────────────────────┐
        ▼                             ▼                             ▼
┌──────────────┐              ┌──────────────┐              ┌──────────────┐
│  Worker 1    │              │  Worker 2    │ ... up to 16 │  Worker N    │
│  (Target 1)  │              │  (Target 2)  │              │  (Target Z)  │
└──────┬───────┘              └──────┬───────┘              └──────┬───────┘
       │ Reads outcome/               │ Reads outcome/               │ Reads outcome/
       │ Edits Assigned Scope         │ Edits Assigned Scope         │ Edits Assigned Scope
       │ Per-file sub-loop            │ Per-file sub-loop            │ Per-file sub-loop
       │ Writes outcome file          │ Writes outcome file          │ Writes outcome file
       ▼                              ▼                              ▼
 ═════════════════════════════════════════════════════════════════════════════════
```

---

## 2. Component Design & Interfaces

### 2.1 Parent Orchestrator Watcher Loop
The Parent Orchestrator maintains a dynamic pool of **exactly 16 running subagents**:
- **Initialization:** Spawns 16 worker subagents for the first 16 pending targets in the queue.
- **Monitoring Loop:** As soon as any worker subagent finishes, the orchestrator updates `repo-rollout-tracker.json` / `graphql-rollout-tracker.json` and immediately spawns a new subagent for the next pending target.
- **Completion Criteria:** When all targets in the queue are completed, the orchestrator triggers layer-wide test execution (`bun test:db`, `bun test:services`, `bun generate:gqlSchema`, `bun codegen`, `bun test:graphql`).

### 2.2 Rollout Trackers
State tracking files created and updated by parent orchestrator subagents during rollout tasks:

1. **Repository Rollout Tracker (`.ai/plans/neon/repo-rollout-tracker.json`)**:
```json
{
  "totalFiles": 18,
  "maxConcurrency": 16,
  "completedFiles": [],
  "activeSubagents": {
    "backend/db/repo/auth/auth.repository.ts": {
      "conversationId": "subagent-uuid-1",
      "status": "in_progress",
      "startedAt": "2026-07-30T21:00:00Z"
    }
  },
  "failedFiles": []
}
```

2. **GraphQL Rollout Tracker (`.ai/plans/neon/graphql-rollout-tracker.json`)**:
```json
{
  "totalDomains": 16,
  "maxConcurrency": 16,
  "completedDomains": [],
  "activeSubagents": {
    "backend/graphql/pothos/classes/": {
      "conversationId": "subagent-uuid-2",
      "status": "in_progress",
      "startedAt": "2026-07-30T21:05:00Z"
    }
  },
  "failedDomains": []
}
```

### 2.3 Dual Client Helper (`backend/db/http-client.ts`)
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

---

## 3. Strict Quality Verification Loop & Outcome Protocol

1. **Pre-Execution Knowledge Read:** Read ALL files in `.ai/plans/neon/outcome/`.
2. **Per-File Quality Loop:** Execute per-file verification (`tsgo` + `biome` + `lint-queue`) immediately after modifying any file.
3. **Global Subtask Health Check:** Execute `bun tsgo`, `bun biome:check`, `bun run lint` (0 errors, 0 warnings).
4. **Outcome Documentation & Task Checkbox Update:**
   - Create `.ai/plans/neon/outcome/<task-id>-outcome.md`.
   - Update `[ ]` -> `[x]` in `tasks.md`.

---

## 4. Decision Log

### Decision 1: Dynamic 16-Worker Pool Replenishment
- **Context:** Fixed batching leaves slots idle when some subagents finish earlier than others.
- **Decision:** The parent orchestrator continuously monitors active subagent status and immediately spawns a new subagent whenever a worker finishes, keeping throughput maximized at 16 active subagents until the queue is exhausted.

---

## 5. Testing & Verification Suite Table

| Layer | Candidate File / Domain | Targeted Test / Generator Command | Full Suite Verification |
|---|---|---|---|
| Repository Pilot | `backend/db/repo/users/user.repository.ts` | `bun run scripts/run-test/run-test.ts backend/db/test/repo/users/user.repository.test.ts` | `bun test:db` <br> `bun test:services` |
| Repository Rollout (Task 2.2) | All files in `backend/db/repo/` (Dynamic 16-pool watcher subagents) | Per-file sub-loop (`tsgo` + `biome` + `lint-queue`) per assigned file | `bun test:db` <br> `bun test:services` |
| GraphQL Pilot | `backend/graphql/pothos/users/` | `bun generate:gqlSchema` <br> `bun codegen` | `bun test:graphql` |
| GraphQL Rollout (Task 3.2) | All domains in `backend/graphql/pothos/` (Dynamic 16-pool watcher subagents) | `bun generate:gqlSchema` <br> `bun codegen` | `bun test:graphql` |
