# Task Breakdown: Neon HTTP Single-Fetch Client Rollout

**Target Directory:** `.ai/plans/neon_http`
**Outcome Directory:** `.ai/plans/neon_http/outcome`
**Phase:** 3 — Actionable Task Breakdown
**Parent Plan:** `.ai/plans/neon/` (Task 1.2 — Neon HTTP Single-Fetch Helper)
**Related Spec:** `.ai/plans/neon/spec.md`
**Related Design:** `.ai/plans/neon/design.md`

---

## Context

Task 1.2 of the Neon plan implemented `backend/db/http-client.ts` with `getNeonHttpClient()` and `getNeonHttpDb()` singletons for zero-pool HTTP single-fetch queries via `@neondatabase/serverless` (`neon(url)`) + `drizzle-orm/neon-http`. The helpers are exported from `backend/db/index.ts` and `backend/db/drizzleDb.ts` but **zero consumers exist outside `backend/db/`**.

This plan rolls out `getNeonHttpDb()` to **8 purely read-only service/lib files** that currently use the stateful `db` singleton for simple SELECT queries. Each file uses `db` exclusively for reads — no writes, no transactions — making them ideal candidates.

### Files Deferred (Mixed Read/Write)

These files have both reads and writes and are deferred to a follow-up plan:
- `backend/services/auth/permission-management.service.ts` (6 reads + 6 DDL writes)
- `backend/services/auth/permission-group-simulation.service.ts` (3 reads + 1 write)
- `backend/services/classes/lesson-report.service.ts` (3 reads + 1 transaction)
- `backend/services/billing/billing-management.service.ts` (2 reads + 1 transaction)
- `backend/services/billing/credit.service.ts` (3 reads via repo + 2 transactions)
- `backend/services/schedule/recurring-class.service.ts` (1 read + 1 transaction)
- `backend/services/teacher/teacher-dashboard.service.ts` (1 read via repo + 1 transaction)
- `backend/services/teacher/teacher-due.service.ts` (1 read as tx fallback + writes)

### Files Skipped
- `backend/services/system/test-helper.service.ts` — test utility, not a hot path
- `scripts/baseline-drizzle-migrations.ts` — CLI migration script, not a hot path

---

## Non-Negotiable Execution Protocol for All Tasks

1. **Pre-Execution Outcome Knowledge Read:**
   Before executing ANY task, the executing agent MUST read ALL existing files in `.ai/plans/neon_http/outcome/` AND `.ai/plans/neon/outcome/` to absorb prior research, search results, docs, and pitfalls so analysis is not repeated.
2. **Per-File Quality Verification Loop (Immediate post-edit):**
   Whenever a file is modified, execute per-file verification (`bun tsgo` + `bun biome:check` + lint queue for target file) BEFORE moving to another file or subtask.
3. **Global Health Check (Completion Gate):**
   Before marking any subtask as complete, run full global checks: `bun tsgo`, `bun biome:check`, and `bun run lint` globally. All MUST exit with **zero errors and zero warnings**.
4. **Post-Execution Outcome File Creation:**
   Upon completing the task implementation and quality checks, write a new outcome document under `.ai/plans/neon_http/outcome/<task-id>-outcome.md` summarizing research, analysis, changes, and carry-over knowledge.
5. **Task Progress Tracking:**
   The executing agent MUST update the task checkbox `[ ]` -> `[x]` in this `tasks.md` file upon successful completion.

---

## Refactoring Pattern

For each file, the change is:

```typescript
// BEFORE
import { db } from "@/backend/db/drizzleDb";
// ... db.select(...).from(...).where(...)

// AFTER
import { getNeonHttpDb } from "@/backend/db";
const httpDb = getNeonHttpDb();
// ... httpDb.select(...).from(...).where(...)
```

**Key rules:**
- Replace `db` with `httpDb` for ALL `db.select()`, `db.execute()`, and `db.query.*.findMany()` calls in the file
- Remove the `import { db } from "@/backend/db/drizzleDb"` import if no other `db` usage remains
- Do NOT change any other logic, error handling, or function signatures
- The `httpDb` instance is a module-level singleton — it's safe to call `getNeonHttpDb()` at the top of the file

---

## Task List

### Phase 1: Foundation

- [ ] 1.1 **Create `docs/drizzle/neon-http-client.md`**
  - Read all existing files in `.ai/plans/neon_http/outcome/` and `.ai/plans/neon/outcome/`.
  - Create canonical reference doc `docs/drizzle/neon-http-client.md` following the docs file structure:
    - **Why**: Motivation — zero WebSocket overhead, fast cold starts, connection limit protection
    - **The Pattern**: Code examples for `getNeonHttpClient()` and `getNeonHttpDb()`
    - **Rules / Conventions**: When to use HTTP vs WebSocket pool, transaction prohibition
    - **What NOT to Do**: Anti-patterns (transactions, multi-statement writes, sequential pipelines)
    - **Rollout Summary**: Table of files modified (to be filled after rollout)
    - **Related Documents**: Links to `backend/db/http-client.ts`, `.ai/plans/neon/`, `docs/drizzle/prepared-statements.md`
  - Run per-file quality verification on `docs/drizzle/neon-http-client.md`.
  - Run global check: `bun tsgo`, `bun biome:check`, `bun run lint` (0 errors, 0 warnings).
  - Write outcome file: `.ai/plans/neon_http/outcome/1.1-neon-http-client-doc-outcome.md`.
  - Update progress: Mark task 1.1 as `[x]` in `tasks.md`.
  - _Requirements: Neon Spec 1, 2, 17, 18, 19_

### Phase 2: Pure Read-Only Service Rollout (Dynamic 8-Worker Pool)

- [ ] 2. **Pure Read-Only Service Refactoring (Dynamic 8-Worker Pool Watcher)**
  - Read all existing files in `.ai/plans/neon_http/outcome/` and `.ai/plans/neon/outcome/`.
  - Gather context from `backend/services/AGENTS.md`, `backend/AGENTS.md`, and `.agents/instructions/backend.instructions.md`.
  - Spawn **Parent Orchestration Subagent** to manage the rollout across the 8 target files.
  - Parent Orchestrator creates and manages tracking state file `.ai/plans/neon_http/rollout-tracker.json`.
  - Parent Orchestrator maintains a **continuous watcher loop** to maximize concurrency at **exactly 8 running subagents**:
    - Monitors running subagent status and immediately spawns a new subagent whenever a worker completes or a slot opens up.
    - Each nested subagent is assigned a **single file** from the target list below.
    - Each nested subagent receives full absolute plan file paths, parent task context, and relevant `AGENTS.md` / instruction rules.
    - Each nested subagent is strictly restricted to its assigned single file (MUST NOT modify any other file).
    - Each nested subagent reads all existing files in `.ai/plans/neon_http/outcome/` and `.ai/plans/neon/outcome/` before starting.
    - Each nested subagent refactors its assigned file to use `getNeonHttpDb()` for all read-only queries.
    - Each nested subagent runs per-file quality verification (`tsgo` + `biome` + `lint-queue`) on its assigned file.
    - Each nested subagent writes its file outcome document `.ai/plans/neon_http/outcome/2-<file-slug>-outcome.md`.
    - Parent Orchestrator updates `.ai/plans/neon_http/rollout-tracker.json` with completed file status and subagent IDs.
  - **Target Files (8 files, ordered by impact):**

    | # | File | Read Queries | Impact |
    |---|------|-------------|--------|
    | 1 | `backend/services/auth/permissions.service.ts` | 11 `db.select()` | **Highest** — called on every request |
    | 2 | `backend/lib/auth/permissions.ts` | 4 `db.select()` | **Highest** — called on every request |
    | 3 | `backend/services/auth/demo-auth.service.ts` | 5 (`db.query.*.findMany()` + `db.select()`) | High — demo login path |
    | 4 | `backend/services/report/student-monthly-report.service.ts` | 5 `db.select()` | Medium — monthly reports |
    | 5 | `backend/services/notification/notification-alerts.service.ts` | 4 `db.select()` | Medium — notification polling |
    | 6 | `backend/services/meeting/class-meeting-config.service.ts` | 2 `db.select()` (tx fallback) | Medium — meeting config |
    | 7 | `backend/services/system/system-settings.service.ts` | 1 `db.select()` (tx fallback) | Low — settings lookup |
    | 8 | `backend/services/system/reference-data.service.ts` | 1 `db.execute()` | Low — admin reference data |

  - Upon completion of all nested worker subagents, run full test suites:
    - `bun test:db` (Database repository tests)
    - `bun test:services` (Backend services integration tests)
    - `bun test:graphql` (GraphQL integration tests)
  - Run global check: `bun tsgo`, `bun biome:check`, `bun run lint` (0 errors, 0 warnings).
  - Write rollout summary outcome file: `.ai/plans/neon_http/outcome/2-rollout-summary-outcome.md`.
  - Update progress: Mark task 2 as `[x]` in `tasks.md`.
  - _Requirements: Neon Spec 1, 2, 15, 16, 17, 18, 19_

### Phase 3: Knowledge Propagation

- [ ] 3. **Knowledge Propagation & Documentation**
  - Read all outcome files in `.ai/plans/neon_http/outcome/` and `.ai/plans/neon/outcome/` to synthesize all learnings.
  - Update `docs/drizzle/neon-http-client.md` with the rollout summary table from the completed rollout.
  - Update layer AGENTS.md files with HTTP client guidance:
    - `backend/services/AGENTS.md` — Add "Neon HTTP Client for Read-Only Queries" rule referencing `docs/drizzle/neon-http-client.md`
    - `backend/AGENTS.md` — Add HTTP client bullet to Service Layer section
  - Update `.agents/instructions/backend.instructions.md` — Add `docs/drizzle/neon-http-client.md` as required reading for backend service files
  - Update root `AGENTS.md` Important References section with `docs/drizzle/neon-http-client.md`
  - Run global check: `bun tsgo`, `bun biome:check`, `bun run lint` (0 errors, 0 warnings)
  - Write outcome file: `.ai/plans/neon_http/outcome/3-knowledge-propagation-outcome.md`
  - Update progress: Mark task 3 as `[x]` in `tasks.md`
  - _Requirements: Knowledge propagation protocol (Spec-Driven Development SKILL.md § Knowledge Propagation from Plan Outcomes)_

---

## Rollout Tracker Schema

```json
{
  "totalFiles": 8,
  "maxConcurrency": 8,
  "completedFiles": [],
  "activeSubagents": {},
  "failedFiles": [],
  "pendingFiles": [
    "backend/services/auth/permissions.service.ts",
    "backend/lib/auth/permissions.ts",
    "backend/services/auth/demo-auth.service.ts",
    "backend/services/report/student-monthly-report.service.ts",
    "backend/services/notification/notification-alerts.service.ts",
    "backend/services/meeting/class-meeting-config.service.ts",
    "backend/services/system/system-settings.service.ts",
    "backend/services/system/reference-data.service.ts"
  ]
}
```

---

## Layer-to-Instructions Mapping (for Subagents)

| Layer | AGENTS.md Files (absolute paths) | .agents/instructions Files (absolute paths) |
|-------|----------------------------------|---------------------------------------------|
| Root | `/home/ahmed/Projects/siraj/AGENTS.md` | — |
| Backend Services | `/home/ahmed/Projects/siraj/backend/services/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/AGENTS.md` | `/home/ahmed/Projects/siraj/.agents/instructions/backend.instructions.md` |
| Backend Lib | `/home/ahmed/Projects/siraj/backend/AGENTS.md` | `/home/ahmed/Projects/siraj/.agents/instructions/backend.instructions.md` |

---

## Testing & Verification Suite

| Layer | Test Command | Purpose |
|-------|-------------|---------|
| Database Repos | `bun test:db` | Verify repository tests still pass with HTTP client |
| Backend Services | `bun test:services` | Verify service integration tests still pass |
| GraphQL | `bun test:graphql` | Verify GraphQL integration tests still pass |
| Type Check | `bun tsgo` | Zero type errors |
| Format/Lint | `bun biome:check` | Zero biome errors |
| ESLint | `bun run lint` | Zero errors, zero warnings |

---

## Domain-to-Artifacts Mapping (Knowledge Propagation)

| Plan Domain | Docs Subdir | AGENTS.md to Update | Skills to Update | Instructions to Update |
|---|---|---|---|---|
| Drizzle / DB patterns | `docs/drizzle/` | `backend/services/AGENTS.md`, `backend/AGENTS.md` | — | `.agents/instructions/backend.instructions.md` |