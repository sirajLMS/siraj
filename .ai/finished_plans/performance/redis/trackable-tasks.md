# Redis Caching Layer — Trackable Tasks

> Plan group: `.ai/plans/redis/`
> Companion docs: [specs.md](./specs.md), [implementation.md](./implementation.md)
> Tracking convention: `[ ]` = not started, `[-]` = in progress / blocked, `[x]` = complete.
> Standards followed: `.agents/spec-process-guide/templates/tasks-template.md` + `process/tasks-phase.md`.
> Hierarchy: parent tasks (`- [ ] N. Title`) + sub-tasks (`- [ ] N.M Sub-title` with bullets). Two-level maximum per spec-process-guide.
> Each sub-task ends with `_Requirements: ..._` tracing back to [specs.md](./specs.md).
> Execution: maintainers flip `[ ]` → `[-]` when starting; flip `[-]` → `[x]` once verified by the per-file loop (root AGENTS.md: `tsgo` + `biome:check` + lint queue client).

---

## Document Information

- **Feature Name**: Provider-Agnostic Caching Layer with Tag-Based Invalidation
- **Target Directory**: `.ai/plans/redis`
- **Outcome Directory**: `.ai/plans/redis/outcome`
- **Version**: 1.0
- **Date**: 2026-07-30
- **Strategy**: Hybrid — foundation-first then feature-slices (entity → directories → dashboards → mutations → tests → cleanup → docs → knowledge propagation).
- **Related Documents**: [specs.md](./specs.md), [implementation.md](./implementation.md)

---

## Non-Negotiable Execution Protocol for All Tasks

1. **Pre-Execution Outcome Knowledge Read:**
   Before executing ANY task, the executing agent MUST read ALL existing files in `.ai/plans/redis/outcome/` to absorb prior research, search results, docs, and pitfalls so analysis is not repeated.

2. **Per-File Quality Verification Loop (Immediate post-edit):**
   Whenever a file is modified, execute per-file verification (`bun tsgo` + `bun biome:check` + lint queue for target file) BEFORE moving to another file or subtask.

3. **Global Health Check (Completion Gate):**
   Before marking any subtask as complete, run full global checks: `bun tsgo`, `bun biome:check`, and `bun run lint` globally. All MUST exit with **zero errors and zero warnings**.

4. **Post-Execution Outcome File Creation:**
   Upon completing the task implementation and quality checks, write a new outcome document under `.ai/plans/redis/outcome/<task-id>-outcome.md` summarizing research, analysis, changes, and carry-over knowledge.

5. **Task Progress Tracking:**
   The executing agent MUST update the task checkbox `[ ]` -> `[x]` in this `tasks.md` file upon successful completion.

---

## MANDATORY Subtasks for Every Implementation Task

**EVERY implementation task (X.Y) MUST include these subtasks:**

### Quality Loop Subtask (X.Y.QL)
```markdown
- [ ] X.Y.QL **Quality Loop**: Per-file verification on `<file-path>`
  - Run: `bun tsgo`
  - Run: `bun biome:check`
  - Run: lint queue for target file
  - Fix all errors before proceeding
```

### Instruction Verification Subtask (X.Y.IV)
```markdown
- [ ] X.Y.IV **Instruction Verification**: Validate `<file-path>` against:
  - AGENTS.md: `/home/ahmed/Projects/siraj/AGENTS.md`, `/home/ahmed/Projects/siraj/<layer>/AGENTS.md`, ...
  - Instructions: `/home/ahmed/Projects/siraj/.agents/instructions/backend.instructions.md`, ...
  - (Use absolute paths from the Layer-to-Instructions mapping table below)
```

### Layer-to-Instructions Mapping (Reference for ALL Plans)

| Layer | AGENTS.md Files (absolute paths) | .agents/instructions Files (absolute paths) |
|-------|----------------------------------|---------------------------------------------|
| Root | `/home/ahmed/Projects/siraj/AGENTS.md` | — |
| Backend Schema | `/home/ahmed/Projects/siraj/backend/db/schema/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/AGENTS.md` | `/home/ahmed/Projects/siraj/.agents/instructions/backend.instructions.md` |
| Backend Repos | `/home/ahmed/Projects/siraj/backend/db/repo/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/AGENTS.md` | `/home/ahmed/Projects/siraj/.agents/instructions/backend.instructions.md` |
| Backend Tests | `/home/ahmed/Projects/siraj/backend/db/test/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/AGENTS.md` | `/home/ahmed/Projects/siraj/.agents/instructions/backend.instructions.md`, `/home/ahmed/Projects/siraj/.agents/instructions/tests.instructions.md` |
| Backend Services | `/home/ahmed/Projects/siraj/backend/services/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/AGENTS.md` | `/home/ahmed/Projects/siraj/.agents/instructions/backend.instructions.md` |
| Backend GraphQL | `/home/ahmed/Projects/siraj/backend/graphql/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/AGENTS.md` | `/home/ahmed/Projects/siraj/.agents/instructions/backend.instructions.md` |
| Backend Types | `/home/ahmed/Projects/siraj/backend/types/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/AGENTS.md` | `/home/ahmed/Projects/siraj/.agents/instructions/backend.instructions.md` |
| Backend Enums | `/home/ahmed/Projects/siraj/backend/enum/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/AGENTS.md` | `/home/ahmed/Projects/siraj/.agents/instructions/backend.instructions.md` |
| Scripts | `/home/ahmed/Projects/siraj/scripts/run-test/AGENTS.md` | `/home/ahmed/Projects/siraj/.agents/instructions/backend.instructions.md`, `/home/ahmed/Projects/siraj/.agents/instructions/tests.instructions.md` |
| Shared Locale | `/home/ahmed/Projects/siraj/shared/AGENTS.md` | (none) |
| App Router | `/home/ahmed/Projects/siraj/app/AGENTS.md` | `/home/ahmed/Projects/siraj/.agents/instructions/frontend.instructions.md` |
| Frontend Common | `/home/ahmed/Projects/siraj/frontend/common/views/AGENTS.md`, `/home/ahmed/Projects/siraj/frontend/common/graphql/AGENTS.md`, `/home/ahmed/Projects/siraj/frontend/common/stores/AGENTS.md`, `/home/ahmed/Projects/siraj/frontend/AGENTS.md` | `/home/ahmed/Projects/siraj/.agents/instructions/frontend.instructions.md` |
| Frontend Desktop | `/home/ahmed/Projects/siraj/frontend/desktop/AGENTS.md`, `/home/ahmed/Projects/siraj/frontend/views/AGENTS.md`, `/home/ahmed/Projects/siraj/frontend/AGENTS.md` | `/home/ahmed/Projects/siraj/.agents/instructions/frontend.instructions.md`, `/home/ahmed/Projects/siraj/.agents/instructions/mobile-desktop.instructions.md` |
| Frontend Mobile | `/home/ahmed/Projects/siraj/frontend/mobile/AGENTS.md`, `/home/ahmed/Projects/siraj/frontend/views/AGENTS.md`, `/home/ahmed/Projects/siraj/frontend/AGENTS.md` | `/home/ahmed/Projects/siraj/.agents/instructions/frontend.instructions.md`, `/home/ahmed/Projects/siraj/.agents/instructions/mobile-desktop.instructions.md` |
| Test UI | `/home/ahmed/Projects/siraj/test/ui/AGENTS.md` | `/home/ahmed/Projects/siraj/.agents/instructions/tests.instructions.md` |

### Drizzle Schema Convention (Reference)
- **Schema changes** (new tables, columns, indexes): `bun run db push` — creates schema automatically
- **Custom SQL migrations** (seed data, complex transforms): `bun db migrate` — for non-Drizzle SQL only

---

## Implementation Overview

### Implementation Strategy

1. **Foundation first**: tighten PG adapter/repository, build the `EntityCacheService` core with unit tests — no integrations yet.
2. **Feature-slices in identity+role scope order**: entity lookups → directories → dashboards. Each slice is testable on its own.
3. **Mutations wired last**: each mutation service gets a named invalidation helper wired in lockstep with the corresponding resolver read path, so cache freshness can be validated per phase.
4. **PG integration test + docs + dependency cleanup + final `bun quality-gate`** complete the rollout.

### Development Approach

- **Testing Strategy**: unit tests in `backend/services/cache/test/EntityCacheService.test.ts` (mocked `cacheService`) + PG integration test in `backend/db/test/logic/shared/cache_tag_invalidation.test.ts` (real PG, `runInRollback`) + provider smokes in `test/integration/redis/` (one test per provider; `bun run test:integration`).
- **Integration Strategy**: incremental — each phase's read paths are wired only after the previous phase is verified.
- **Verification**: per-file loop (`tsgo` + `biome:check` + lint queue client) BEFORE importing any new file elsewhere; PG integration test via `bun run scripts/run-test/run-test.ts`; final `bun quality-gate`.

---

## Implementation Plan

### Phase 1: PG Adapter & Repository Tightening (foundation, no behavior change)

- [x] 1. Tighten `PostgresCacheAdapter` + `CacheDbRepository` for atomicity and SQL-level expiry
  - [x] 1.1 Single-statement atomic `incr` in `backend/db/repo/shared/cache.repository.ts`
    - Rewrite `incr(key, windowSeconds)` as a single `INSERT ... ON CONFLICT (key) DO UPDATE SET value = (table.value::int + 1)::text, expiresAt = excluded.expiresAt RETURNING value` (Drizzle SQL template) — no read-then-update loop.
    - Keep the `getTable(key)` routing dispatcher intact (extended separately in task 1.4).
    - Verify via existing `backend/db/test/logic/shared/cache_split_routing.test.ts` — no regressions.
    - _Requirements: 5.1, 5.4 (specs §2 Req 5)_
  - [x] 1.1.QL **Quality Loop**: Per-file verification on `backend/db/repo/shared/cache.repository.ts`
    - Run: `bun tsgo`
    - Run: `bun biome:check`
    - Run: lint queue for target file
    - Fix all errors before proceeding
  - [x] 1.1.IV **Instruction Verification**: Validate `backend/db/repo/shared/cache.repository.ts` against:
    - AGENTS.md: `/home/ahmed/Projects/siraj/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/db/repo/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/AGENTS.md`
    - Instructions: `/home/ahmed/Projects/siraj/.agents/instructions/backend.instructions.md`
  - [x] 1.2 Add `CacheDbRepository.setExpiry(key, expiresAt)` in `backend/db/repo/shared/cache.repository.ts`
    - New method: single atomic `UPDATE {table} SET expires_at = $2 WHERE key = $1`.
    - Returns the number of rows affected (Drizzle `returning` not needed for UPDATE — use `.execute()` row count).
    - _Requirements: 5.2_
  - [x] 1.2.QL **Quality Loop**: Per-file verification on `backend/db/repo/shared/cache.repository.ts`
    - Run: `bun tsgo`
    - Run: `bun biome:check`
    - Run: lint queue for target file
    - Fix all errors before proceeding
  - [x] 1.2.IV **Instruction Verification**: Validate `backend/db/repo/shared/cache.repository.ts` against:
    - AGENTS.md: `/home/ahmed/Projects/siraj/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/db/repo/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/AGENTS.md`
    - Instructions: `/home/ahmed/Projects/siraj/.agents/instructions/backend.instructions.md`
  - [x] 1.3 Tighten `CacheDbRepository.get(key)` SQL-level expiry filter (drop inline `await del`)
    - Underlying SELECT filters `expiresAt >= now()` at SQL level (Drizzle `gte(sessionCache.expiresAt, new Date())`).
    - Remove the existing JS-side `if (expiresAt < now()) await del(key); return null;` block — dead rows get reclaimed by the existing 5-minute sweep only.
    - _Requirements: 5.3, 5.4_
  - [x] 1.3.QL **Quality Loop**: Per-file verification on `backend/db/repo/shared/cache.repository.ts`
    - Run: `bun tsgo`
    - Run: `bun biome:check`
    - Run: lint queue for target file
    - Fix all errors before proceeding
  - [x] 1.3.IV **Instruction Verification**: Validate `backend/db/repo/shared/cache.repository.ts` against:
    - AGENTS.md: `/home/ahmed/Projects/siraj/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/db/repo/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/AGENTS.md`
    - Instructions: `/home/ahmed/Projects/siraj/.agents/instructions/backend.instructions.md`
  - [x] 1.4 Extend `CacheDbRepository.getTable` to explicitly route `ec:` and `tag:` keys
    - Add explicit branch: `if (key.startsWith("ec:") || key.startsWith("tag:")) return sessionCache;` BEFORE the existing `ratelimit:` / `auth:` checks.
    - Add a unit extension in `backend/db/test/logic/shared/cache_split_routing.test.ts` covering `ec:user:123:admin`, `tag:teacher:42`, `ec:parent:dir:...` cases (use `runInRollback`).
    - _Requirements: 7.1, 7.2_
  - [x] 1.4.QL **Quality Loop**: Per-file verification on `backend/db/repo/shared/cache.repository.ts` and `backend/db/test/logic/shared/cache_split_routing.test.ts`
    - Run: `bun tsgo`
    - Run: `bun biome:check`
    - Run: lint queue for target files
    - Fix all errors before proceeding
  - [x] 1.4.IV **Instruction Verification**: Validate modified files against:
    - AGENTS.md: `/home/ahmed/Projects/siraj/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/db/repo/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/db/test/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/AGENTS.md`
    - Instructions: `/home/ahmed/Projects/siraj/.agents/instructions/backend.instructions.md`, `/home/ahmed/Projects/siraj/.agents/instructions/tests.instructions.md`
  - [x] 1.5 Wire `PostgresCacheAdapter.expire` to the new `CacheDbRepository.setExpiry`
    - Replace the read-then-write `get` + `set` implementation in `PostgresCacheAdapter.expire` with `cacheRepo.setExpiry(key, expiresAtDate)`.
    - _Requirements: 5.2_
  - [x] 1.5.QL **Quality Loop**: Per-file verification on `backend/services/cache/PostgresCacheAdapter.ts`
    - Run: `bun tsgo`
    - Run: `bun biome:check`
    - Run: lint queue for target file
    - Fix all errors before proceeding
  - [x] 1.5.IV **Instruction Verification**: Validate `backend/services/cache/PostgresCacheAdapter.ts` against:
    - AGENTS.md: `/home/ahmed/Projects/siraj/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/services/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/AGENTS.md`
    - Instructions: `/home/ahmed/Projects/siraj/.agents/instructions/backend.instructions.md`

### Phase 2: `EntityCacheService` Core + Unit Tests (foundation, no integrations)

- [x] 2. Create `backend/services/cache/EntityCacheService.ts` and unit tests
  - [x] 2.1 Scaffold file + constants + types
    - Define `CACHE_VERSION = 1`, `CACHE_TAG_INDEX_TTL = 86400`, `CACHE_KEY_PREFIX_ENTITY = "ec:"`, `CACHE_KEY_PREFIX_TAG = "tag:"`.
    - Define `interface CacheEntry<T> { version: number; data: T; cachedAt: number; }`.
    - Define `interface CacheStats { provider: string; size: number; hitsByPrefix: Record<string, { hits: number; misses: number; }>; }`.
    - Define `function validateEntry(entry: unknown): entry is CacheEntry<unknown>` shape guard (object, not array, `version === CACHE_VERSION`).
    - _Requirements: 3.1, 3.2_
  - [x] 2.1.QL **Quality Loop**: Per-file verification on `backend/services/cache/EntityCacheService.ts`
    - Run: `bun tsgo`
    - Run: `bun biome:check`
    - Run: lint queue for target file
    - Fix all errors before proceeding
  - [x] 2.1.IV **Instruction Verification**: Validate `backend/services/cache/EntityCacheService.ts` against:
    - AGENTS.md: `/home/ahmed/Projects/siraj/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/services/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/AGENTS.md`
    - Instructions: `/home/ahmed/Projects/siraj/.agents/instructions/backend.instructions.md`
  - [x] 2.2 Implement `stableStringify(value)` canonical JSON
    - Recursive key-sort: arrays stringified element-wise; objects stringified with `Object.keys().sort()`; primitives via `JSON.stringify`.
    - Add unit assertion in `EntityCacheService.test.ts`: `{a:1,b:2}` and `{b:2,a:1}` produce identical strings.
    - _Requirements: 4.1, 4.2, 4.3_
  - [x] 2.2.QL **Quality Loop**: Per-file verification on `backend/services/cache/EntityCacheService.ts`
    - Run: `bun tsgo`
    - Run: `bun biome:check`
    - Run: lint queue for target file
    - Fix all errors before proceeding
  - [x] 2.2.IV **Instruction Verification**: Validate `backend/services/cache/EntityCacheService.ts` against:
    - AGENTS.md: `/home/ahmed/Projects/siraj/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/services/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/AGENTS.md`
    - Instructions: `/home/ahmed/Projects/siraj/.agents/instructions/backend.instructions.md`
  - [x] 2.3 Implement `cachedRead<T>(key, ttlSeconds, loader, tags = [])`
    - TTL guard: `if (ttlSeconds > CACHE_TAG_INDEX_TTL) throw new Error("cache TTL exceeds tag index TTL")`.
    - `try { raw = await cacheService.get(key) } catch (err) { logger.error; fall through }`.
    - On hit: `JSON.parse(raw)`; if `validateEntry(parsed)` → re-indexTags (desync self-heal) → record hit → return `parsed.data`; else fall through to loader.
    - On miss or invalid: `await loader()` → build `CacheEntry<T>` → `try { await cacheService.set(key, JSON.stringify(entry), { ex: ttlSeconds }); indexTags } catch {}` → record miss → return data.
    - Never throws to caller (except TTL guard — defensive invariant).
    - _Requirements: 1.1, 3.1, 3.2, 3.4, 3.5_
  - [x] 2.3.QL **Quality Loop**: Per-file verification on `backend/services/cache/EntityCacheService.ts`
    - Run: `bun tsgo`
    - Run: `bun biome:check`
    - Run: lint queue for target file
    - Fix all errors before proceeding
  - [x] 2.3.IV **Instruction Verification**: Validate `backend/services/cache/EntityCacheService.ts` against:
    - AGENTS.md: `/home/ahmed/Projects/siraj/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/services/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/AGENTS.md`
    - Instructions: `/home/ahmed/Projects/siraj/.agents/instructions/backend.instructions.md`
  - [x] 2.4 Implement `safeIndexTags(key, tags)` helper
    - For each tag: `try { raw = await cacheService.get("tag:"+tag) } catch { return }`; `arr = JSON.parse(raw) ?? []`; if `!arr.includes(key)` `arr.push(key)`; `await cacheService.set("tag:"+tag, JSON.stringify(arr), { ex: CACHE_TAG_INDEX_TTL })`.
    - Wrap the entire body in `try/catch` — index failure is non-fatal; log via `logger.error`.
    - Dedup: never push `key` if already in `arr`.
    - _Requirements: 2.3, 2.5_
  - [x] 2.4.QL **Quality Loop**: Per-file verification on `backend/services/cache/EntityCacheService.ts`
    - Run: `bun tsgo`
    - Run: `bun biome:check`
    - Run: lint queue for target file
    - Fix all errors before proceeding
  - [x] 2.4.IV **Instruction Verification**: Validate `backend/services/cache/EntityCacheService.ts` against:
    - AGENTS.md: `/home/ahmed/Projects/siraj/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/services/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/AGENTS.md`
    - Instructions: `/home/ahmed/Projects/siraj/.agents/instructions/backend.instructions.md`
  - [x] 2.5 Implement `invalidateTag(tag)` pipelined fan-out
    - Read tag index: `try { raw = await cacheService.get("tag:"+tag) } catch { raw = null }`.
    - `keys = JSON.parse(raw ?? "[]"); if (!Array.isArray(keys)) keys = []` (malformed-fallback).
    - Issue one `cacheService.pipeline([{ command: "del", args: [...keys] }, { command: "del", args: ["tag:"+tag] }])`.
    - On success, reset tag key to `"[]"` with TTL 86400s (self-heal: concurrent writers re-register on next cachedRead).
    - Wrap body in `try/catch` — invalidation failure never throws to mutation caller; `logger.error`.
    - _Requirements: 2.2, 2.3, 2.4_
  - [x] 2.5.QL **Quality Loop**: Per-file verification on `backend/services/cache/EntityCacheService.ts`
    - Run: `bun tsgo`
    - Run: `bun biome:check`
    - Run: lint queue for target file
    - Fix all errors before proceeding
  - [x] 2.5.IV **Instruction Verification**: Validate `backend/services/cache/EntityCacheService.ts` against:
    - AGENTS.md: `/home/ahmed/Projects/siraj/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/services/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/AGENTS.md`
    - Instructions: `/home/ahmed/Projects/siraj/.agents/instructions/backend.instructions.md`
  - [x] 2.6 Implement `invalidateTags(tags)` + named invalidation helpers
    - `invalidateTags(tags)` = `Promise.all(tags.map(invalidateTag))`.
    - Implement `invalidateParentWrite`, `invalidateTeacherWrite`, `invalidateClassLifecycle`, `invalidateRoleChange` per the fixed tag-set map in implementation.md §4.1.
    - _Requirements: 2.1_
  - [x] 2.6.QL **Quality Loop**: Per-file verification on `backend/services/cache/EntityCacheService.ts`
    - Run: `bun tsgo`
    - Run: `bun biome:check`
    - Run: lint queue for target file
    - Fix all errors before proceeding
  - [x] 2.6.IV **Instruction Verification**: Validate `backend/services/cache/EntityCacheService.ts` against:
    - AGENTS.md: `/home/ahmed/Projects/siraj/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/services/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/AGENTS.md`
    - Instructions: `/home/ahmed/Projects/siraj/.agents/instructions/backend.instructions.md`
  - [x] 2.7 Implement `cachedReadSingleFlight<T>(...)` for concurrent-miss dedup
    - Same signature and shape as `cachedRead`.
    - On miss, instead of writing back via plain `cacheService.set`, branch by provider:
      - PG: delegate to a new `CacheDbRepository.insertIfNotExists(key, value, expiresAt)` (Drizzle `INSERT ... ON CONFLICT (key) DO NOTHING`); only write if row created.
      - Redis/Upstash: `cacheService.pipeline([{ command: "set", args: [key, value, "EX", ttl, "NX"] }])`.
    - Read path identical to `cachedRead` (winner commits → loser's next read hits the cache).
    - _Requirements: 3.3_
  - [x] 2.7.QL **Quality Loop**: Per-file verification on `backend/services/cache/EntityCacheService.ts`
    - Run: `bun tsgo`
    - Run: `bun biome:check`
    - Run: lint queue for target file
    - Fix all errors before proceeding
  - [x] 2.7.IV **Instruction Verification**: Validate `backend/services/cache/EntityCacheService.ts` against:
    - AGENTS.md: `/home/ahmed/Projects/siraj/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/services/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/AGENTS.md`
    - Instructions: `/home/ahmed/Projects/siraj/.agents/instructions/backend.instructions.md`
  - [x] 2.8 Add `CacheDbRepository.insertIfNotExists(key, value, expiresAt)` support
    - New method in `backend/db/repo/shared/cache.repository.ts` using Drizzle `INSERT ... ON CONFLICT (key) DO NOTHING` on the correct `getTable(key)` target.
    - Returns `true` if inserted, `false` if conflict (caller branches on this).
    - _Requirements: 3.3_
  - [x] 2.8.QL **Quality Loop**: Per-file verification on `backend/db/repo/shared/cache.repository.ts`
    - Run: `bun tsgo`
    - Run: `bun biome:check`
    - Run: lint queue for target file
    - Fix all errors before proceeding
  - [x] 2.8.IV **Instruction Verification**: Validate `backend/db/repo/shared/cache.repository.ts` against:
    - AGENTS.md: `/home/ahmed/Projects/siraj/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/db/repo/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/AGENTS.md`
    - Instructions: `/home/ahmed/Projects/siraj/.agents/instructions/backend.instructions.md`
  - [x] 2.9 Add `stats()` + in-memory hit/miss counter
    - Maintain `Map<prefix, { hits, misses }>` keyed by key prefix (token between colons, e.g. `user`, `parent`, `teacher`, `parent:dash:metrics`).
    - `recordHit(prefix)` / `recordMiss(prefix)` update the map; called inside `cachedRead`.
    - Export `getEntityCacheStats()` returning the counter snapshot.
    - _Requirements: 6.1, 6.3_
  - [x] 2.9.QL **Quality Loop**: Per-file verification on `backend/services/cache/EntityCacheService.ts`
    - Run: `bun tsgo`
    - Run: `bun biome:check`
    - Run: lint queue for target file
    - Fix all errors before proceeding
  - [x] 2.9.IV **Instruction Verification**: Validate `backend/services/cache/EntityCacheService.ts` against:
    - AGENTS.md: `/home/ahmed/Projects/siraj/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/services/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/AGENTS.md`
    - Instructions: `/home/ahmed/Projects/siraj/.agents/instructions/backend.instructions.md`
  - [x] 2.10 Write unit tests in `backend/services/cache/test/EntityCacheService.test.ts`
    - Tests: cache miss → loader invoked → write-back with expected key + TTL + tag pipeline called; cache hit → loader NOT invoked → `indexTags` re-registered on hit; `invalidateTag` issues exactly one `cacheService.pipeline([{command:"del", args:[...keys]}, {command:"del",args:["tag:"+tag]}])`; `invalidateTag` with malformed JSON tag index returns cleanly with zero `del`s and no caller exception; `cachedRead` with malformed entry value falls back to loader no throw; `indexTags` dedupes same key twice; `stableStringify` key-order stability; `CACHE_VERSION` mismatch re-fetches loader; concurrent-miss single-flight: PG `insertIfNotExists` returns false on second concurrent attempt / Redis `SET NX EX` pipeline arg shape; TTL guard throws at >86400s; tag key TTL is exactly 86400s on re-index.
    - Mock `cacheService.get/set/del/pipeline` with a stub object.
    - Run via `bun test backend/services/cache/test/EntityCacheService.test.ts`.
    - _Requirements: 1.1, 2.2, 2.3, 3.1, 3.3, 3.5, 4.1, 4.2_
  - [x] 2.10.QL **Quality Loop**: Per-file verification on `backend/services/cache/test/EntityCacheService.test.ts`
    - Run: `bun tsgo`
    - Run: `bun biome:check`
    - Run: lint queue for target file
    - Fix all errors before proceeding
  - [x] 2.10.IV **Instruction Verification**: Validate `backend/services/cache/test/EntityCacheService.test.ts` against:
    - AGENTS.md: `/home/ahmed/Projects/siraj/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/services/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/AGENTS.md`
    - Instructions: `/home/ahmed/Projects/siraj/.agents/instructions/backend.instructions.md`, `/home/ahmed/Projects/siraj/.agents/instructions/tests.instructions.md`

### Phase 3: Barrel Export + `ICacheService` `stats()` interface (foundation wiring)

- [x] 3. Wire `EntityCacheService` exports + add `stats()` interface contract
  - [x] 3.1 Re-export new public helpers from `backend/services/cache/index.ts`
    - Export `cachedRead`, `cachedReadSingleFlight`, `invalidateTag`, `invalidateTags`, `invalidateParentWrite`, `invalidateTeacherWrite`, `invalidateClassLifecycle`, `invalidateRoleChange`, `stableStringify`, `getEntityCacheStats`.
    - Do NOT export `safeIndexTags` (internal helper).
    - _Requirements: 2.1, 6.1_
  - [x] 3.1.QL **Quality Loop**: Per-file verification on `backend/services/cache/index.ts`
    - Run: `bun tsgo`
    - Run: `bun biome:check`
    - Run: lint queue for target file
    - Fix all errors before proceeding
  - [x] 3.1.IV **Instruction Verification**: Validate `backend/services/cache/index.ts` against:
    - AGENTS.md: `/home/ahmed/Projects/siraj/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/services/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/AGENTS.md`
    - Instructions: `/home/ahmed/Projects/siraj/.agents/instructions/backend.instructions.md`
  - [x] 3.2 Add `stats(): Promise<CacheStats>` to `ICacheServiceBase` in `backend/services/cache/ICacheService.ts`
    - Define `interface CacheStats { provider: string; size: number; hitsByPrefix: Record<string, { hits: number; misses: number; }>; }`.
    - _Requirements: 6.1_
  - [x] 3.2.QL **Quality Loop**: Per-file verification on `backend/services/cache/ICacheService.ts`
    - Run: `bun tsgo`
    - Run: `bun biome:check`
    - Run: lint queue for target file
    - Fix all errors before proceeding
  - [x] 3.2.IV **Instruction Verification**: Validate `backend/services/cache/ICacheService.ts` against:
    - AGENTS.md: `/home/ahmed/Projects/siraj/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/services/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/AGENTS.md`
    - Instructions: `/home/ahmed/Projects/siraj/.agents/instructions/backend.instructions.md`
  - [x] 3.3 Implement `stats()` on `PostgresCacheAdapter`
    - `provider = "postgres"`; `size = await cacheRepo.count(sessionCache)` (Drizzle `SELECT count(*) FROM session_cache` — add to repository if not present); `hitsByPrefix` pulled from `getEntityCacheStats()`.
    - _Requirements: 6.1_
  - [x] 3.3.QL **Quality Loop**: Per-file verification on `backend/services/cache/PostgresCacheAdapter.ts`
    - Run: `bun tsgo`
    - Run: `bun biome:check`
    - Run: lint queue for target file
    - Fix all errors before proceeding
  - [x] 3.3.IV **Instruction Verification**: Validate `backend/services/cache/PostgresCacheAdapter.ts` against:
    - AGENTS.md: `/home/ahmed/Projects/siraj/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/services/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/AGENTS.md`
    - Instructions: `/home/ahmed/Projects/siraj/.agents/instructions/backend.instructions.md`
  - [x] 3.4 Implement `stats()` on `RedisCacheAdapter`
    - `provider = redisService.providerName()`; `size = await redisService.dbsize()`; `hitsByPrefix` from `getEntityCacheStats()`.
    - Add `dbsize()` and `providerName()` to `IRedisService` and `LocalRedisAdapter` + `UpstashRedisAdapter` if missing.
    - _Requirements: 6.1_
  - [x] 3.4.QL **Quality Loop**: Per-file verification on `backend/services/cache/RedisCacheAdapter.ts`
    - Run: `bun tsgo`
    - Run: `bun biome:check`
    - Run: lint queue for target file
    - Fix all errors before proceeding
  - [x] 3.4.IV **Instruction Verification**: Validate `backend/services/cache/RedisCacheAdapter.ts` against:
    - AGENTS.md: `/home/ahmed/Projects/siraj/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/services/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/AGENTS.md`
    - Instructions: `/home/ahmed/Projects/siraj/.agents/instructions/backend.instructions.md`

### Phase 4: Entity Lookups (Phase 1 of the cache rollout)

- [x] 4. Wire `getCurrentUser` + `TeacherRepository.findByUserId` + `ParentRepository.findByUserId` through `cachedRead`
  - [x] 4.1 Wrap `backend/lib/auth/cached-user.ts` inner call with `cachedRead` (300s TTL)
    - Compute `roleId` from `permissionContext` (or `"anonymous"` if null) — pass it as part of the cache key.
    - Cache key: `ec:user:${userId}:${roleId}`, TTL 300s, tags `["user:"${userId}"]`.
    - Keep the existing `React.cache()` outer wrapper — `cachedRead` sits INSIDE the per-request `React.cache` memoization, not outside it.
    - Verify the `cachedRead` factory call respects the fail-open contract: any cache outage falls through to the existing loader.
    - _Requirements: 1.1, 1.2, 1.4_
  - [x] 4.1.QL **Quality Loop**: Per-file verification on `backend/lib/auth/cached-user.ts`
    - Run: `bun tsgo`
    - Run: `bun biome:check`
    - Run: lint queue for target file
    - Fix all errors before proceeding
  - [x] 4.1.IV **Instruction Verification**: Validate `backend/lib/auth/cached-user.ts` against:
    - AGENTS.md: `/home/ahmed/Projects/siraj/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/services/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/AGENTS.md`
    - Instructions: `/home/ahmed/Projects/siraj/.agents/instructions/backend.instructions.md`
  - [x] 4.2 Wrap `TeacherRepository.findByUserId` in a new `backend/lib/auth/cached-teacher-by-user-id.ts`
    - Export `cachedTeacherByUserId(userId, roleId, loader)` that calls `cachedRead(ecTeacherByUserIdKey(userId, roleId), 300, loader, ["teacher:byUserId:"${userId}])`.
    - Re-export from `backend/lib/index.ts`.
    - Update call sites in `backend/graphql/pothos/` teacher resolvers to import the cached variant.
    - _Requirements: 1.1, 1.3_
  - [x] 4.2.QL **Quality Loop**: Per-file verification on `backend/lib/auth/cached-teacher-by-user-id.ts` and `backend/lib/index.ts`
    - Run: `bun tsgo`
    - Run: `bun biome:check`
    - Run: lint queue for target files
    - Fix all errors before proceeding
  - [x] 4.2.IV **Instruction Verification**: Validate modified files against:
    - AGENTS.md: `/home/ahmed/Projects/siraj/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/services/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/graphql/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/AGENTS.md`
    - Instructions: `/home/ahmed/Projects/siraj/.agents/instructions/backend.instructions.md`
  - [x] 4.3 Wrap `ParentRepository.findByUserId` in a new `backend/lib/auth/cached-parent-by-user-id.ts`
    - Mirror task 4.2 for parents: `cachedRead(ecParentByUserIdKey, 300s, loader, ["parent:byUserId:"${userId}])`.
    - Re-export from `backend/lib/index.ts`.
    - Update POTHOS parent resolver call sites.
    - _Requirements: 1.1, 1.3_
  - [x] 4.3.QL **Quality Loop**: Per-file verification on `backend/lib/auth/cached-parent-by-user-id.ts` and `backend/lib/index.ts`
    - Run: `bun tsgo`
    - Run: `bun biome:check`
    - Run: lint queue for target files
    - Fix all errors before proceeding
  - [x] 4.3.IV **Instruction Verification**: Validate modified files against:
    - AGENTS.md: `/home/ahmed/Projects/siraj/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/services/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/graphql/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/AGENTS.md`
    - Instructions: `/home/ahmed/Projects/siraj/.agents/instructions/backend.instructions.md`
  - [x] 4.4 Run unit tests + tsgo + biome for Phase 4 files
    - `bun tsgo` and `bun biome:check` on the three new/modified files.
    - Run lint queue client on each: `curl -s -X POST http://localhost:${LINT_QUEUE_PORT}/lint -H "Content-Type: application/json" -d '{"id":"phase4","files":["backend/lib/auth/cached-user.ts","backend/lib/auth/cached-teacher-by-user-id.ts","backend/lib/auth/cached-parent-by-user-id.ts"]}'`.
    - _Requirements: 1.1_
  - [x] 4.4.QL **Quality Loop**: Per-file verification on all Phase 4 files
    - Run: `bun tsgo`
    - Run: `bun biome:check`
    - Run: lint queue for target files
    - Fix all errors before proceeding
  - [x] 4.4.IV **Instruction Verification**: Validate all Phase 4 files against:
    - AGENTS.md: `/home/ahmed/Projects/siraj/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/services/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/AGENTS.md`
    - Instructions: `/home/ahmed/Projects/siraj/.agents/instructions/backend.instructions.md`

### Phase 5: Directories (Phase 2 of the cache rollout)

- [x] 5. Wrap `StaffDirectoryService.getDirectory` + `ParentDirectoryService.getParentDirectory` with `cachedRead` (30s TTL)
  - [x] 5.1 Wrap `backend/services/teacher/staff-directory.service.ts` `getDirectory` body with `cachedRead`
    - Permission check (e.g. `assertCanReadStaffDirectory(ctx)`) stays OUTSIDE the cache wrapper — never re-authorize inside `cachedRead`.
    - Cache key: `ec:teacher:dir:${roleId}:${stableStringify({ search, paginationArgs })}`, TTL 30s, tags `["teacherDirectory"]`.
    - Pass `roleId` from `ctx.permissionContext` (must be computed before entering `cachedRead`).
    - _Requirements: 1.1, 1.2_
  - [x] 5.1.QL **Quality Loop**: Per-file verification on `backend/services/teacher/staff-directory.service.ts`
    - Run: `bun tsgo`
    - Run: `bun biome:check`
    - Run: lint queue for target file
    - Fix all errors before proceeding
  - [x] 5.1.IV **Instruction Verification**: Validate `backend/services/teacher/staff-directory.service.ts` against:
    - AGENTS.md: `/home/ahmed/Projects/siraj/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/services/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/AGENTS.md`
    - Instructions: `/home/ahmed/Projects/siraj/.agents/instructions/backend.instructions.md`
  - [x] 5.2 Wrap `backend/services/parent/parent-directory.service.ts` `getParentDirectory` body with `cachedRead`
    - Permission check stays outside; cache key `ec:parent:dir:${roleId}:${stableStringify({ search, pagination, lifecycleStatus })}`, TTL 30s, tags `["parentDirectory"]`.
    - _Requirements: 1.1, 1.2_
  - [x] 5.2.QL **Quality Loop**: Per-file verification on `backend/services/parent/parent-directory.service.ts`
    - Run: `bun tsgo`
    - Run: `bun biome:check`
    - Run: lint queue for target file
    - Fix all errors before proceeding
  - [x] 5.2.IV **Instruction Verification**: Validate `backend/services/parent/parent-directory.service.ts` against:
    - AGENTS.md: `/home/ahmed/Projects/siraj/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/services/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/AGENTS.md`
    - Instructions: `/home/ahmed/Projects/siraj/.agents/instructions/backend.instructions.md`
  - [x] 5.3 Per-file verification loop on Phase 5 files
    - `bun tsgo` + `bun biome:check` + lint queue client on the two modified service files.
    - _Requirements: 1.1_
  - [x] 5.3.QL **Quality Loop**: Per-file verification on all Phase 5 files
    - Run: `bun tsgo`
    - Run: `bun biome:check`
    - Run: lint queue for target files
    - Fix all errors before proceeding
  - [x] 5.3.IV **Instruction Verification**: Validate all Phase 5 files against:
    - AGENTS.md: `/home/ahmed/Projects/siraj/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/services/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/AGENTS.md`
    - Instructions: `/home/ahmed/Projects/siraj/.agents/instructions/backend.instructions.md`

### Phase 6: Dashboards (Phase 3 of the cache rollout)

- [x] 6. Wrap `ParentDashboardService.getDashboardMetrics` (60s) + `SupervisorDashboardService.getDashboard` (30s) with `cachedRead`
  - [x] 6.1 Wrap `backend/services/parent/parent-dashboard.service.ts` `getDashboardMetrics`
    - Cache key `ec:parent:dash:metrics:${parent.id}` (actor-scoped — no `roleId` because the parent IS the actor identity here), TTL 60s, tags `["parent:dash:metrics:${parent.id}", "dashboard:parent"]`.
    - _Requirements: 1.1_
  - [x] 6.1.QL **Quality Loop**: Per-file verification on `backend/services/parent/parent-dashboard.service.ts`
    - Run: `bun tsgo`
    - Run: `bun biome:check`
    - Run: lint queue for target file
    - Fix all errors before proceeding
  - [x] 6.1.IV **Instruction Verification**: Validate `backend/services/parent/parent-dashboard.service.ts` against:
    - AGENTS.md: `/home/ahmed/Projects/siraj/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/services/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/AGENTS.md`
    - Instructions: `/home/ahmed/Projects/siraj/.agents/instructions/backend.instructions.md`
  - [x] 6.2 Wrap `backend/services/supervisor/supervisor-dashboard.service.ts` `getDashboard`
    - Cache key `ec:supervisor:dash:${actorUserId}`, TTL 30s, tags `["dashboard:supervisor"]`.
    - _Requirements: 1.1_
  - [x] 6.2.QL **Quality Loop**: Per-file verification on `backend/services/supervisor/supervisor-dashboard.service.ts`
    - Run: `bun tsgo`
    - Run: `bun biome:check`
    - Run: lint queue for target file
    - Fix all errors before proceeding
  - [x] 6.2.IV **Instruction Verification**: Validate `backend/services/supervisor/supervisor-dashboard.service.ts` against:
    - AGENTS.md: `/home/ahmed/Projects/siraj/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/services/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/AGENTS.md`
    - Instructions: `/home/ahmed/Projects/siraj/.agents/instructions/backend.instructions.md`
  - [x] 6.3 Per-file verification loop on Phase 6 files
    - `bun tsgo` + `bun biome:check` + lint queue client on the two modified dashboard service files.
    - _Requirements: 1.1_
  - [x] 6.3.QL **Quality Loop**: Per-file verification on all Phase 6 files
    - Run: `bun tsgo`
    - Run: `bun biome:check`
    - Run: lint queue for target files
    - Fix all errors before proceeding
  - [x] 6.3.IV **Instruction Verification**: Validate all Phase 6 files against:
    - AGENTS.md: `/home/ahmed/Projects/siraj/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/services/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/AGENTS.md`
    - Instructions: `/home/ahmed/Projects/siraj/.agents/instructions/backend.instructions.md`

### Phase 7: Mutation Wiring — Named Invalidation Helpers (lockstep with resolvers)

- [x] 7. Wire mutations to `invalidateTag(s)` across parent/teacher/dues/class-lifecycle/role-change
  - [x] 7.1 Wire `backend/services/parent/parent-profile.service.ts` writes to `invalidateParentWrite(parentId, userId)`
    - After each `update` / `deactivate` / `reactivate` mutation, `await invalidateParentWrite(parent.id, parent.userId)` inside a `try/catch` — log on failure, never throw to caller.
    - Keep the existing session invalidation logic intact (separate concern).
    - _Requirements: 1.3, 2.4_
  - [x] 7.1.QL **Quality Loop**: Per-file verification on `backend/services/parent/parent-profile.service.ts`
    - Run: `bun tsgo`
    - Run: `bun biome:check`
    - Run: lint queue for target file
    - Fix all errors before proceeding
  - [x] 7.1.IV **Instruction Verification**: Validate `backend/services/parent/parent-profile.service.ts` against:
    - AGENTS.md: `/home/ahmed/Projects/siraj/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/services/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/AGENTS.md`
    - Instructions: `/home/ahmed/Projects/siraj/.agents/instructions/backend.instructions.md`
  - [x] 7.2 Wire teacher profile mutation services to `invalidateTeacherWrite(teacherId, userId)`
    - Identify the teacher profile mutation service file(s): `backend/services/teacher/teacher-portal.service.ts` (and any sibling profile mutation service).
    - After each teacher profile update, `await invalidateTeacherWrite(teacher.id, teacher.userId)` in `try/catch`.
    - _Requirements: 1.3, 2.4_
  - [x] 7.2.QL **Quality Loop**: Per-file verification on teacher profile mutation service files
    - Run: `bun tsgo`
    - Run: `bun biome:check`
    - Run: lint queue for target files
    - Fix all errors before proceeding
  - [x] 7.2.IV **Instruction Verification**: Validate teacher profile mutation service files against:
    - AGENTS.md: `/home/ahmed/Projects/siraj/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/services/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/AGENTS.md`
    - Instructions: `/home/ahmed/Projects/siraj/.agents/instructions/backend.instructions.md`
  - [x] 7.3 Wire `backend/services/teacher/teacher-due.service.ts` writes to `invalidateClassLifecycle(undefined, parentId)`
    - On each dues mutation affecting a parent, `await invalidateClassLifecycle(undefined, parentId)` to invalidate dashboard:parent + parentDirectory + parent tags.
    - _Requirements: 1.3, 2.4_
  - [x] 7.3.QL **Quality Loop**: Per-file verification on `backend/services/teacher/teacher-due.service.ts`
    - Run: `bun tsgo`
    - Run: `bun biome:check`
    - Run: lint queue for target file
    - Fix all errors before proceeding
  - [x] 7.3.IV **Instruction Verification**: Validate `backend/services/teacher/teacher-due.service.ts` against:
    - AGENTS.md: `/home/ahmed/Projects/siraj/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/services/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/AGENTS.md`
    - Instructions: `/home/ahmed/Projects/siraj/.agents/instructions/backend.instructions.md`
  - [x] 7.4 Wire class-lifecycle services to `invalidateClassLifecycle(teacherId, parentId)`
    - Identify class/session lifecycle services: `backend/services/session/class-session.service.ts`, `backend/services/session/class-instance-expiry.service.ts`, plus `backend/services/schedule/schedule.service.ts` for class lifecycle mutations (create/cancel/complete class).
    - On each mutation, `await invalidateClassLifecycle(teacherId, parentId)` covering both dashboards + both directories.
    - _Requirements: 1.3, 2.4_
  - [x] 7.4.QL **Quality Loop**: Per-file verification on class-lifecycle service files
    - Run: `bun tsgo`
    - Run: `bun biome:check`
    - Run: lint queue for target files
    - Fix all errors before proceeding
  - [x] 7.4.IV **Instruction Verification**: Validate class-lifecycle service files against:
    - AGENTS.md: `/home/ahmed/Projects/siraj/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/services/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/AGENTS.md`
    - Instructions: `/home/ahmed/Projects/siraj/.agents/instructions/backend.instructions.md`
  - [x] 7.5 Wire role/permission mutation services to `invalidateRoleChange(userId)`
    - Identify role mutation services in `backend/services/auth/`: `permissions.service.ts` and `permission-management.service.ts`.
    - On each role/permission write, `await invalidateRoleChange(userId)` to drop stale `user:${userId}` + directory + supervisor-dashboard tags.
    - _Requirements: 1.3, 2.4_
  - [x] 7.5.QL **Quality Loop**: Per-file verification on role/permission mutation service files
    - Run: `bun tsgo`
    - Run: `bun biome:check`
    - Run: lint queue for target files
    - Fix all errors before proceeding
  - [x] 7.5.IV **Instruction Verification**: Validate role/permission mutation service files against:
    - AGENTS.md: `/home/ahmed/Projects/siraj/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/services/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/AGENTS.md`
    - Instructions: `/home/ahmed/Projects/siraj/.agents/instructions/backend.instructions.md`
  - [x] 7.6 Per-file verification loop on Phase 7 mutation-wired files
    - For each mutated service file: `bun tsgo` + `bun biome:check` + `curl -s -X POST http://localhost:${LINT_QUEUE_PORT}/lint -d '{"id":"phase7","files":["<path>"]}'`.
    - _Requirements: 2.4_
  - [x] 7.6.QL **Quality Loop**: Per-file verification on all Phase 7 files
    - Run: `bun tsgo`
    - Run: `bun biome:check`
    - Run: lint queue for target files
    - Fix all errors before proceeding
  - [x] 7.6.IV **Instruction Verification**: Validate all Phase 7 files against:
    - AGENTS.md: `/home/ahmed/Projects/siraj/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/services/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/AGENTS.md`
    - Instructions: `/home/ahmed/Projects/siraj/.agents/instructions/backend.instructions.md`

### Phase 8: PG Integration Test for Tag Invalidation

- [x] 8. Add `backend/db/test/logic/shared/cache_tag_invalidation.test.ts`
  - [x] 8.1 Scaffold the test file with `runInRollback` setup
    - Import `runInRollback` from `backend/db/test/` per `backend/db/test/AGENTS.md`.
    - Import `cacheService` from `backend/services/cache/CacheServiceFactory.ts`.
    - Import `invalidateTag` from `backend/services/cache/EntityCacheService.ts`.
    - _Requirements: 2.2, 2.3_
  - [x] 8.1.QL **Quality Loop**: Per-file verification on `backend/db/test/logic/shared/cache_tag_invalidation.test.ts`
    - Run: `bun tsgo`
    - Run: `bun biome:check`
    - Run: lint queue for target file
    - Fix all errors before proceeding
  - [x] 8.1.IV **Instruction Verification**: Validate `backend/db/test/logic/shared/cache_tag_invalidation.test.ts` against:
    - AGENTS.md: `/home/ahmed/Projects/siraj/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/db/test/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/AGENTS.md`
    - Instructions: `/home/ahmed/Projects/siraj/.agents/instructions/backend.instructions.md`, `/home/ahmed/Projects/siraj/.agents/instructions/tests.instructions.md`
  - [x] 8.2 Write test: write entries via `cacheService.set` + `safeIndexTags` under tag `"teacher:42"`
    - Set 3 cache entries with keys `ec:teacher:42:x`, `ec:teacher:42:y`, `ec:teacher:42:z` with TTL 60s.
    - Index all three under tag `"teacher:42"` via `safeIndexTags` (each call appends to the tag key).
    - Verify via `tx.select(sessionCache).where(eq(sessionCache.key, "tag:teacher:42"))` that the tag key array contains exactly those three cache keys.
    - _Requirements: 2.3_
  - [x] 8.2.QL **Quality Loop**: Per-file verification on `backend/db/test/logic/shared/cache_tag_invalidation.test.ts`
    - Run: `bun tsgo`
    - Run: `bun biome:check`
    - Run: lint queue for target file
    - Fix all errors before proceeding
  - [x] 8.2.IV **Instruction Verification**: Validate `backend/db/test/logic/shared/cache_tag_invalidation.test.ts` against:
    - AGENTS.md: `/home/ahmed/Projects/siraj/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/db/test/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/AGENTS.md`
    - Instructions: `/home/ahmed/Projects/siraj/.agents/instructions/backend.instructions.md`, `/home/ahmed/Projects/siraj/.agents/instructions/tests.instructions.md`
  - [x] 8.3 Write test: call `invalidateTag("teacher:42")` and assert via `tx.select` that all 3 entries are gone
    - After `await invalidateTag("teacher:42")`, run `tx.select(sessionCache).where(inArray(sessionCache.key, [...3keys]))` and assert result length === 0.
    - Also assert the tag key `tag:teacher:42` is now `"[]"` (reset behavior).
    - No `expect().rejects.toThrow()` — use try/catch helper pattern per `backend/db/test/AGENTS.md`.
    - _Requirements: 2.2, 2.3, 2.4_
  - [x] 8.3.QL **Quality Loop**: Per-file verification on `backend/db/test/logic/shared/cache_tag_invalidation.test.ts`
    - Run: `bun tsgo`
    - Run: `bun biome:check`
    - Run: lint queue for target file
    - Fix all errors before proceeding
  - [x] 8.3.IV **Instruction Verification**: Validate `backend/db/test/logic/shared/cache_tag_invalidation.test.ts` against:
    - AGENTS.md: `/home/ahmed/Projects/siraj/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/db/test/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/AGENTS.md`
    - Instructions: `/home/ahmed/Projects/siraj/.agents/instructions/backend.instructions.md`, `/home/ahmed/Projects/siraj/.agents/instructions/tests.instructions.md`
  - [x] 8.4 Run the PG integration test via `bun run scripts/run-test/run-test.ts`
    - `bun run scripts/run-test/run-test.ts backend/db/test/logic/shared/cache_tag_invalidation.test.ts`.
    - Inspect `--last` output for any transaction deadlock (mandatory per `backend/db/test/AGENTS.md`).
    - _Requirements: 2.2, 2.3_
  - [x] 8.4.QL **Quality Loop**: Per-file verification on `backend/db/test/logic/shared/cache_tag_invalidation.test.ts`
    - Run: `bun tsgo`
    - Run: `bun biome:check`
    - Run: lint queue for target file
    - Fix all errors before proceeding
  - [x] 8.4.IV **Instruction Verification**: Validate `backend/db/test/logic/shared/cache_tag_invalidation.test.ts` against:
    - AGENTS.md: `/home/ahmed/Projects/siraj/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/db/test/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/AGENTS.md`
    - Instructions: `/home/ahmed/Projects/siraj/.agents/instructions/backend.instructions.md`, `/home/ahmed/Projects/siraj/.agents/instructions/tests.instructions.md`
  - [x] 8.5 Add Redis provider smokes under `test/integration/redis/` (Upstash, Redis Cloud, local)
    - `test/integration/redis/redis_adapter.integration.test.ts` — one SET/GET smoke when `REDIS_URL` / `UPSTASH_REDIS_REST_URL` are set.
    - `test/integration/redis/redis_factory_fallback.integration.test.ts` — fallback smoke for `cacheService`.
    - Use `describeLiveWhen` from `test/integration/helpers/describe-live.ts`; skip cleanly when keys are absent.
  - Run via `bun run test:integration test/integration/redis/`.
    - **Do not** place provider integration tests under `backend/db/test/` or `backend/services/` (see layer AGENTS.md).
    - _Requirements: 2.2, 2.3, 3.4_
  - [x] 8.5.QL **Quality Loop**: Per-file verification on each `test/integration/redis/*.integration.test.ts`
    - Run: `bun tsgo`
    - Run: `bun biome:check`
    - Run: lint queue for target file
    - Fix all errors before proceeding
  - [x] 8.5.IV **Instruction Verification**: Validate each `test/integration/redis/*.integration.test.ts` against:
    - AGENTS.md: `/home/ahmed/Projects/siraj/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/services/AGENTS.md`
    - Instructions: `/home/ahmed/Projects/siraj/.agents/instructions/tests.instructions.md`

### Phase 9: Documentation (AGENTS.md "Hot-resolver caching" subsection)

- [x] 9. Add `backend/services/AGENTS.md` "Hot-resolver caching" subsection (≤10 lines)
  - [x] 9.1 Write the subsection summarizing the cache layer usage rules
    - Cover: (a) when to use `cachedRead` vs `cachedReadSingleFlight`, (b) every cache key MUST include `userId` + `roleId` (exception: actor-scoped dashboards), (c) every mutation that invalidates cached read paths MUST call the matching named invalidation helper in `try/catch`, (d) TTL cap is 86400s, (e) `stats()` is internal-only — never expose on HTTP.
    - Cross-link to `backend/services/cache/EntityCacheService.ts` as the canonical impl.
    - _Requirements: 1.1, 2.4, 6.2_
  - [x] 9.1.QL **Quality Loop**: Per-file verification on `backend/services/AGENTS.md`
    - Run: `bun tsgo`
    - Run: `bun biome:check`
    - Run: lint queue for target file
    - Fix all errors before proceeding
  - [x] 9.1.IV **Instruction Verification**: Validate `backend/services/AGENTS.md` against:
    - AGENTS.md: `/home/ahmed/Projects/siraj/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/services/AGENTS.md`, `/home/ahmed/Projects/siraj/backend/AGENTS.md`
    - Instructions: `/home/ahmed/Projects/siraj/.agents/instructions/backend.instructions.md`

### Phase 10: Drop Unused `@upstash/ratelimit` Dependency

- [x] 10. Remove `@upstash/ratelimit` and verify
  - [x] 10.1 Remove the line from `package.json` `dependencies`
    - Open `package.json`, delete the `@upstash/ratelimit` entry.
    - _Requirements: 8.1_
  - [x] 10.1.QL **Quality Loop**: Per-file verification on `package.json`
    - Run: `bun tsgo`
    - Run: `bun biome:check`
    - Run: lint queue for target file
    - Fix all errors before proceeding
  - [x] 10.1.IV **Instruction Verification**: Validate `package.json` against:
    - AGENTS.md: `/home/ahmed/Projects/siraj/AGENTS.md`
  - [x] 10.2 Run `bun install` to update `bun.lock`
    - Ensure the lockfile no longer contains `@upstash/ratelimit`.
    - _Requirements: 8.1_
  - [x] 10.3 Search the codebase for any lingering imports
    - `rg "@upstash/ratelimit" backend/ frontend/ shared/ app/ scripts/` — must return no matches.
    - If any are found, replace with the existing custom `backend/lib/ratelimit.ts` logic.
    - _Requirements: 8.2_
  - [x] 10.4 Run `bun tsgo` to confirm no new type errors from the removal
    - _Requirements: 8.3_
  - [x] 10.4.QL **Quality Loop**: Global verification
    - Run: `bun tsgo`
    - Run: `bun biome:check`
    - Run: `bun run lint`
    - Fix all errors before proceeding

### Phase 11: Final Quality Gate

- [x] 11. Run `bun quality-gate` to verify the whole change passes tsgo + biome + lint + codescene + sonar stages
  - [x] 11.1 Start the lint queue server if not running: `~/.bun/bin/bun run scripts/lint-queue-server.ts`
    - Verify health: `curl -s http://localhost:${LINT_QUEUE_PORT}/status` returns `{ running: true, ... }`.
    - _Requirements: 11 (gate)_
  - [x] 11.2 Run `bun quality-gate`
    - Follow up on any failing stage using root `AGENTS.md` guidance: if CODESCENE fails run `bun run codescene --file <path>`; if SONAR_RESULTS fails use `bun scripts/sonar-manager.ts`; re-run `bun quality-gate` to resume from last failed stage.
    - SonarQube scan is orchestrator-only — subagents must NEVER run `bun sonar-scan` or `bun scripts/sonar-manager.ts`.
    - _Requirements: 11 (gate)_
  - [x] 11.3 If `bun quality-gate:fresh` is needed (clean-slate), run it as the final verification
    - Only after all stage fixes have landed.
    - _Requirements: 11 (gate)_

### Phase 12: Knowledge Propagation & Documentation (MANDATORY Final Task)

- [x] 12. **Knowledge Propagation & Documentation**
  - Read all outcome files in `.ai/plans/redis/outcome/` to synthesize all learnings
  - Create canonical reference doc under `docs/services/entity-cache-service.md` consolidating patterns, rules, and gotchas from all outcome files
    - If `docs/services/` does not exist, create it: `mkdir -p docs/services/`
    - Follow the docs file structure: Why → Pattern → Rules → Anti-patterns → Rollout Summary → Related Documents
  - Update layer AGENTS.md files with new rules/patterns discovered during implementation:
    - `backend/services/AGENTS.md` — add "Hot-resolver caching" subsection with reference to `docs/services/entity-cache-service.md`
    - `backend/AGENTS.md` — add caching bullet to Services section referencing the new doc
  - Update `.agents/skills/` if new patterns affect a skill's domain:
    - `.agents/skills/fix-db-tests/SKILL.md` — if PG integration test patterns for cache were introduced
  - Update `.agents/instructions/backend.instructions.md` if new conventions should be enforced
  - Update root `AGENTS.md` Important References section with `docs/services/entity-cache-service.md`
  - Run global check: `bun tsgo`, `bun biome:check`, `bun run lint` (0 errors, 0 warnings)
  - Write outcome file: `.ai/plans/redis/outcome/12.1-knowledge-propagation-outcome.md`
  - Update progress: Mark task 12.1 as `[x]` in `tasks.md`
  - _Requirements: Knowledge propagation protocol_

---

## Task Execution Checklist (read before starting each task)

### Before Starting
- [ ] Read ALL existing files in `.ai/plans/redis/outcome/` (Non-Negotiable Protocol Rule 1).
- [ ] Requirements and design documents reviewed for this task.
- [ ] Dependencies (previous tasks) are marked `[x]`.
- [ ] All applicable `AGENTS.md` + instruction files read (root, `backend/services/AGENTS.md`, `backend/services/cache/*` if present, `.agents/instructions/backend.instructions.md`, `.agents/instructions/tests.instructions.md` for test files).
- [ ] Task scope and acceptance criteria are clear.

### During Implementation
- [ ] Code follows established patterns & standards.
- [ ] Unit/PG integration tests are written alongside implementation.
- [ ] Error handling & edge cases are considered (cache fails open; invalidation failure is logged not thrown).
- [ ] No `console.log` / `console.error` — use `@/backend/lib/logger` or `@/frontend/utils/logger` per root `AGENTS.md`.

### Before Completion
- [ ] Per-file Quality Loop run: `bun tsgo` + `bun biome:check` + lint queue client on the new/modified file(s) (Non-Negotiable Protocol Rule 2).
- [ ] Instruction Verification: validated against all applicable AGENTS.md and .agents/instructions files.
- [ ] Global Health Check: `bun tsgo`, `bun biome:check`, `bun run lint` — all exit with zero errors and zero warnings (Non-Negotiable Protocol Rule 3).
- [ ] All references to the task's files are updated (barrels, call sites).
- [ ] Tests pass: PG tests via `bun run scripts/run-test/run-test.ts`; unit tests via `bun test`.

### Completion
- [ ] Flip the task's checkbox from `[-]` to `[x]` (Non-Negotiable Protocol Rule 5).
- [ ] Write outcome file to `.ai/plans/redis/outcome/<task-id>-outcome.md` (Non-Negotiable Protocol Rule 4).
- [ ] No regressions in existing functionality (run any directly affected existing test, e.g. `cache_split_routing.test.ts` for tasks 1.1/1.4).
- [ ] Documentation updated if behavior changed (Phase 9 covers the `AGENTS.md` update).

---

## Cross-Cutting Reminders (do not belong to a single task)

- **Cache outage fails open**: every `cacheService.*` call inside `EntityCacheService` is wrapped in `try/catch` + `logger.error`. Never surface cache errors to resolver callers.
- **`stats()` is internal-only**: never expose on `HEAD /api/graphql` or any unauthenticated HTTP route (review finding).
- **Tag set drift is impossible**: the named invalidation helpers in `EntityCacheService.ts` are the ONLY place tag sets are defined.
- **TTL upper bound**: `cachedRead(..., ttlSeconds, ...)` with `ttlSeconds > 86400` throws — defensive invariant to keep payloads from outliving tag index entries.
- **`roleId` always computed**: pass the resolved role string (or `"anonymous"` when `permissionContext` is null) — never leave it undefined in a cache key.
- **PG tests under `runInRollback`**: never `expect().rejects.toThrow()` inside `runInRollback`; never query seed data — always create test entities via helpers.

---

## Progress Tracking Conventions

- Status mapping: `[ ]` = not started, `[-]` = in progress or blocked, `[x]` = complete.
- Update the parent task status to mirror its sub-tasks: `[ ]` while any sub-task is `[ ]`, `[-]` once any sub-task is `[-]`, `[x]` only when ALL sub-tasks are `[x]`.
- When blocked on a cross-file dependency per root `AGENTS.md`, add a note immediately under the affected task:
  ```
  CROSS-FILE DEPENDENCY:
  Target file: <this file>
  Blocked by: <other file>
  Rule violated: <rule>
  Required fix: <description>
  ```
- When all parent tasks under a Phase are `[x]`, the Phase is complete; the next Phase may begin.
- **Non-Negotiable Protocol Rule 4**: After completing a task, write an outcome file to `.ai/plans/redis/outcome/<task-id>-outcome.md`.
- **Non-Negotiable Protocol Rule 5**: Update the task checkbox `[ ]` -> `[x]` upon successful completion.

---

## Notes for Executors

- The sequence of Phases 1-11 is the single recommended rollout order — each Phase's verification gates into the next.
- Sub-agents working in parallel on Phase 5/6/7 tasks MUST follow the lint-queue-server pattern from root `AGENTS.md` (`curl -s -X POST http://localhost:${LINT_QUEUE_PORT}/lint ...`) — never run raw eslint directly.
- SonarQube scan is orchestrator-only — subagents must NEVER run `bun sonar-scan` or `bun scripts/sonar-manager.ts`.
- PG integration tests (`Phase 8`, `cache_tag_invalidation.test.ts`) MUST use `runInRollback` and the `bun run scripts/run-test/run-test.ts` runner.
- Redis provider smokes (`Phase 8.5`, `test/integration/redis/`) MUST use `bun run test:integration` — one smoke per provider file, no live provider tests under `backend/db/test/` or `backend/services/`.
