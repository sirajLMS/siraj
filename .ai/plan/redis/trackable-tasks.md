# Redis Caching Layer — Trackable Tasks

> Plan group: `.ai/plan/redis/`
> Companion docs: [specs.md](./specs.md), [implementation.md](./implementation.md)
> Tracking convention: `[ ]` = not started, `[-]` = in progress / blocked, `[x]` = complete.
> Standards followed: `.agents/spec-process-guide/templates/tasks-template.md` + `process/tasks-phase.md`.
> Hierarchy: parent tasks (`- [ ] N. Title`) + sub-tasks (`- [ ] N.M Sub-title` with bullets). Two-level maximum per spec-process-guide.
> Each sub-task ends with `_Requirements: ..._` tracing back to [specs.md](./specs.md).
> Execution: maintainers flip `[ ]` → `[-]` when starting; flip `[-]` → `[x]` once verified by the per-file loop (root AGENTS.md: `tsgo` + `biome:check` + lint queue client).

---

## Document Information

- **Feature Name**: Provider-Agnostic Caching Layer with Tag-Based Invalidation
- **Version**: 1.0
- **Date**: 2026-07-30
- **Strategy**: Hybrid — foundation-first then feature-slices (entity → directories → dashboards → mutations → tests → cleanup → final QA).
- **Related Documents**: [specs.md](./specs.md), [implementation.md](./implementation.md)

---

## Implementation Overview

### Implementation Strategy

1. **Foundation first**: tighten PG adapter/repository, build the `EntityCacheService` core with unit tests — no integrations yet.
2. **Feature-slices in identity+role scope order**: entity lookups → directories → dashboards. Each slice is testable on its own.
3. **Mutations wired last**: each mutation service gets a named invalidation helper wired in lockstep with the corresponding resolver read path, so cache freshness can be validated per phase.
4. **PG integration test + docs + dependency cleanup + final `bun quality-gate`** complete the rollout.

### Development Approach

- **Testing Strategy**: unit tests in `backend/services/cache/test/EntityCacheService.test.ts` (mocked `cacheService`) + PG integration test in `backend/db/test/logic/shared/cache_tag_invalidation.test.ts` (real PG, `runInRollback`).
- **Integration Strategy**: incremental — each phase's read paths are wired only after the previous phase is verified.
- **Verification**: per-file loop (`tsgo` + `biome:check` + lint queue client) BEFORE importing any new file elsewhere; PG integration test via `bun run scripts/run-test/run-test.ts`; final `bun quality-gate`.

---

## Implementation Plan

### Phase 1: PG Adapter & Repository Tightening (foundation, no behavior change)

- [ ] 1. Tighten `PostgresCacheAdapter` + `CacheDbRepository` for atomicity and SQL-level expiry
  - [ ] 1.1 Single-statement atomic `incr` in `backend/db/repo/shared/cache.repository.ts`
    - Rewrite `incr(key, windowSeconds)` as a single `INSERT ... ON CONFLICT (key) DO UPDATE SET value = (table.value::int + 1)::text, expiresAt = excluded.expiresAt RETURNING value` (Drizzle SQL template) — no read-then-update loop.
    - Keep the `getTable(key)` routing dispatcher intact (extended separately in task 1.4).
    - Verify via existing `backend/db/test/logic/shared/cache_split_routing.test.ts` — no regressions.
    - _Requirements: 5.1, 5.4 (specs §2 Req 5)_
  - [ ] 1.2 Add `CacheDbRepository.setExpiry(key, expiresAt)` in `backend/db/repo/shared/cache.repository.ts`
    - New method: single atomic `UPDATE {table} SET expires_at = $2 WHERE key = $1`.
    - Returns the number of rows affected (Drizzle `returning` not needed for UPDATE — use `.execute()` row count).
    - _Requirements: 5.2_
  - [ ] 1.3 Tighten `CacheDbRepository.get(key)` SQL-level expiry filter (drop inline `await del`)
    - Underlying SELECT filters `expiresAt >= now()` at SQL level (Drizzle `gte(sessionCache.expiresAt, new Date())`).
    - Remove the existing JS-side `if (expiresAt < now()) await del(key); return null;` block — dead rows get reclaimed by the existing 5-minute sweep only.
    - _Requirements: 5.3, 5.4_
  - [ ] 1.4 Extend `CacheDbRepository.getTable` to explicitly route `ec:` and `tag:` keys
    - Add explicit branch: `if (key.startsWith("ec:") || key.startsWith("tag:")) return sessionCache;` BEFORE the existing `ratelimit:` / `auth:` checks.
    - Add a unit extension in `backend/db/test/logic/shared/cache_split_routing.test.ts` covering `ec:user:123:admin`, `tag:teacher:42`, `ec:parent:dir:...` cases (use `runInRollback`).
    - _Requirements: 7.1, 7.2_
  - [ ] 1.5 Wire `PostgresCacheAdapter.expire` to the new `CacheDbRepository.setExpiry`
    - Replace the read-then-write `get` + `set` implementation in `PostgresCacheAdapter.expire` with `cacheRepo.setExpiry(key, expiresAtDate)`.
    - _Requirements: 5.2_

### Phase 2: `EntityCacheService` Core + Unit Tests (foundation, no integrations)

- [ ] 2. Create `backend/services/cache/EntityCacheService.ts` and unit tests
  - [ ] 2.1 Scaffold file + constants + types
    - Define `CACHE_VERSION = 1`, `CACHE_TAG_INDEX_TTL = 86400`, `CACHE_KEY_PREFIX_ENTITY = "ec:"`, `CACHE_KEY_PREFIX_TAG = "tag:"`.
    - Define `interface CacheEntry<T> { version: number; data: T; cachedAt: number; }`.
    - Define `interface CacheStats { provider: string; size: number; hitsByPrefix: Record<string, { hits: number; misses: number; }>; }`.
    - Define `function validateEntry(entry: unknown): entry is CacheEntry<unknown>` shape guard (object, not array, `version === CACHE_VERSION`).
    - _Requirements: 3.1, 3.2_
  - [ ] 2.2 Implement `stableStringify(value)` canonical JSON
    - Recursive key-sort: arrays stringified element-wise; objects stringified with `Object.keys().sort()`; primitives via `JSON.stringify`.
    - Add unit assertion in `EntityCacheService.test.ts`: `{a:1,b:2}` and `{b:2,a:1}` produce identical strings.
    - _Requirements: 4.1, 4.2, 4.3_
  - [ ] 2.3 Implement `cachedRead<T>(key, ttlSeconds, loader, tags = [])`
    - TTL guard: `if (ttlSeconds > CACHE_TAG_INDEX_TTL) throw new Error("cache TTL exceeds tag index TTL")`.
    - `try { raw = await cacheService.get(key) } catch (err) { logger.error; fall through }`.
    - On hit: `JSON.parse(raw)`; if `validateEntry(parsed)` → re-indexTags (desync self-heal) → record hit → return `parsed.data`; else fall through to loader.
    - On miss or invalid: `await loader()` → build `CacheEntry<T>` → `try { await cacheService.set(key, JSON.stringify(entry), { ex: ttlSeconds }); indexTags } catch {}` → record miss → return data.
    - Never throws to caller (except TTL guard — defensive invariant).
    - _Requirements: 1.1, 3.1, 3.2, 3.4, 3.5_
  - [ ] 2.4 Implement `safeIndexTags(key, tags)` helper
    - For each tag: `try { raw = await cacheService.get("tag:"+tag) } catch { return }`; `arr = JSON.parse(raw) ?? []`; if `!arr.includes(key)` `arr.push(key)`; `await cacheService.set("tag:"+tag, JSON.stringify(arr), { ex: CACHE_TAG_INDEX_TTL })`.
    - Wrap the entire body in `try/catch` — index failure is non-fatal; log via `logger.error`.
    - Dedup: never push `key` if already in `arr`.
    - _Requirements: 2.3, 2.5_
  - [ ] 2.5 Implement `invalidateTag(tag)` pipelined fan-out
    - Read tag index: `try { raw = await cacheService.get("tag:"+tag) } catch { raw = null }`.
    - `keys = JSON.parse(raw ?? "[]"); if (!Array.isArray(keys)) keys = []` (malformed-fallback).
    - Issue one `cacheService.pipeline([{ command: "del", args: [...keys] }, { command: "del", args: ["tag:"+tag] }])`.
    - On success, reset tag key to `"[]"` with TTL 86400s (self-heal: concurrent writers re-register on next cachedRead).
    - Wrap body in `try/catch` — invalidation failure never throws to mutation caller; `logger.error`.
    - _Requirements: 2.2, 2.3, 2.4_
  - [ ] 2.6 Implement `invalidateTags(tags)` + named invalidation helpers
    - `invalidateTags(tags)` = `Promise.all(tags.map(invalidateTag))`.
    - Implement `invalidateParentWrite`, `invalidateTeacherWrite`, `invalidateClassLifecycle`, `invalidateRoleChange` per the fixed tag-set map in implementation.md §4.1.
    - _Requirements: 2.1_
  - [ ] 2.7 Implement `cachedReadSingleFlight<T>(...)` for concurrent-miss dedup
    - Same signature and shape as `cachedRead`.
    - On miss, instead of writing back via plain `cacheService.set`, branch by provider:
      - PG: delegate to a new `CacheDbRepository.insertIfNotExists(key, value, expiresAt)` (Drizzle `INSERT ... ON CONFLICT (key) DO NOTHING`); only write if row created.
      - Redis/Upstash: `cacheService.pipeline([{ command: "set", args: [key, value, "EX", ttl, "NX"] }])`.
    - Read path identical to `cachedRead` (winner commits → loser's next read hits the cache).
    - _Requirements: 3.3_
  - [ ] 2.8 Add `CacheDbRepository.insertIfNotExists(key, value, expiresAt)` support
    - New method in `backend/db/repo/shared/cache.repository.ts` using Drizzle `INSERT ... ON CONFLICT (key) DO NOTHING` on the correct `getTable(key)` target.
    - Returns `true` if inserted, `false` if conflict (caller branches on this).
    - _Requirements: 3.3_
  - [ ] 2.9 Add `stats()` + in-memory hit/miss counter
    - Maintain `Map<prefix, { hits, misses }>` keyed by key prefix (token between colons, e.g. `user`, `parent`, `teacher`, `parent:dash:metrics`).
    - `recordHit(prefix)` / `recordMiss(prefix)` update the map; called inside `cachedRead`.
    - Export `getEntityCacheStats()` returning the counter snapshot.
    - _Requirements: 6.1, 6.3_
  - [ ] 2.10 Write unit tests in `backend/services/cache/test/EntityCacheService.test.ts`
    - Tests: cache miss → loader invoked → write-back with expected key + TTL + tag pipeline called; cache hit → loader NOT invoked → `indexTags` re-registered on hit; `invalidateTag` issues exactly one `cacheService.pipeline([{command:"del", args:[...keys]}, {command:"del",args:["tag:"+tag]}])`; `invalidateTag` with malformed JSON tag index returns cleanly with zero `del`s and no caller exception; `cachedRead` with malformed entry value falls back to loader no throw; `indexTags` dedupes same key twice; `stableStringify` key-order stability; `CACHE_VERSION` mismatch re-fetches loader; concurrent-miss single-flight: PG `insertIfNotExists` returns false on second concurrent attempt / Redis `SET NX EX` pipeline arg shape; TTL guard throws at >86400s; tag key TTL is exactly 86400s on re-index.
    - Mock `cacheService.get/set/del/pipeline` with a stub object.
    - Run via `bun test backend/services/cache/test/EntityCacheService.test.ts`.
    - _Requirements: 1.1, 2.2, 2.3, 3.1, 3.3, 3.5, 4.1, 4.2_

### Phase 3: Barrel Export + `ICacheService` `stats()` interface (foundation wiring)

- [ ] 3. Wire `EntityCacheService` exports + add `stats()` interface contract
  - [ ] 3.1 Re-export new public helpers from `backend/services/cache/index.ts`
    - Export `cachedRead`, `cachedReadSingleFlight`, `invalidateTag`, `invalidateTags`, `invalidateParentWrite`, `invalidateTeacherWrite`, `invalidateClassLifecycle`, `invalidateRoleChange`, `stableStringify`, `getEntityCacheStats`.
    - Do NOT export `safeIndexTags` (internal helper).
    - _Requirements: 2.1, 6.1_
  - [ ] 3.2 Add `stats(): Promise<CacheStats>` to `ICacheServiceBase` in `backend/services/cache/ICacheService.ts`
    - Define `interface CacheStats { provider: string; size: number; hitsByPrefix: Record<string, { hits: number; misses: number; }>; }`.
    - _Requirements: 6.1_
  - [ ] 3.3 Implement `stats()` on `PostgresCacheAdapter`
    - `provider = "postgres"`; `size = await cacheRepo.count(sessionCache)` (Drizzle `SELECT count(*) FROM session_cache` — add to repository if not present); `hitsByPrefix` pulled from `getEntityCacheStats()`.
    - _Requirements: 6.1_
  - [ ] 3.4 Implement `stats()` on `RedisCacheAdapter`
    - `provider = redisService.providerName()`; `size = await redisService.dbsize()`; `hitsByPrefix` from `getEntityCacheStats()`.
    - Add `dbsize()` and `providerName()` to `IRedisService` and `LocalRedisAdapter` + `UpstashRedisAdapter` if missing.
    - _Requirements: 6.1_

### Phase 4: Entity Lookups (Phase 1 of the cache rollout)

- [ ] 4. Wire `getCurrentUser` + `TeacherRepository.findByUserId` + `ParentRepository.findByUserId` through `cachedRead`
  - [ ] 4.1 Wrap `backend/lib/auth/cached-user.ts` inner call with `cachedRead` (300s TTL)
    - Compute `roleId` from `permissionContext` (or `"anonymous"` if null) — pass it as part of the cache key.
    - Cache key: `ec:user:${userId}:${roleId}`, TTL 300s, tags `["user:"${userId}"]`.
    - Keep the existing `React.cache()` outer wrapper — `cachedRead` sits INSIDE the per-request `React.cache` memoization, not outside it.
    - Verify the `cachedRead` factory call respects the fail-open contract: any cache outage falls through to the existing loader.
    - _Requirements: 1.1, 1.2, 1.4_
  - [ ] 4.2 Wrap `TeacherRepository.findByUserId` in a new `backend/lib/auth/cached-teacher-by-user-id.ts`
    - Export `cachedTeacherByUserId(userId, roleId, loader)` that calls `cachedRead(ecTeacherByUserIdKey(userId, roleId), 300, loader, ["teacher:byUserId:"${userId}])`.
    - Re-export from `backend/lib/index.ts`.
    - Update call sites in `backend/graphql/pothos/` teacher resolvers to import the cached variant.
    - _Requirements: 1.1, 1.3_
  - [ ] 4.3 Wrap `ParentRepository.findByUserId` in a new `backend/lib/auth/cached-parent-by-user-id.ts`
    - Mirror task 4.2 for parents: `cachedRead(ecParentByUserIdKey, 300s, loader, ["parent:byUserId:"${userId}])`.
    - Re-export from `backend/lib/index.ts`.
    - Update POTHOS parent resolver call sites.
    - _Requirements: 1.1, 1.3_
  - [ ] 4.4 Run unit tests + tsgo + biome for Phase 4 files
    - `bun tsgo` and `bun biome:check` on the three new/modified files.
    - Run lint queue client on each: `curl -s -X POST http://localhost:4777/lint -H "Content-Type: application/json" -d '{"id":"phase4","files":["backend/lib/auth/cached-user.ts","backend/lib/auth/cached-teacher-by-user-id.ts","backend/lib/auth/cached-parent-by-user-id.ts"]}'`.
    - _Requirements: 1.1_

### Phase 5: Directories (Phase 2 of the cache rollout)

- [ ] 5. Wrap `StaffDirectoryService.getDirectory` + `ParentDirectoryService.getParentDirectory` with `cachedRead` (30s TTL)
  - [ ] 5.1 Wrap `backend/services/teacher/staff-directory.service.ts` `getDirectory` body with `cachedRead`
    - Permission check (e.g. `assertCanReadStaffDirectory(ctx)`) stays OUTSIDE the cache wrapper — never re-authorize inside `cachedRead`.
    - Cache key: `ec:teacher:dir:${roleId}:${stableStringify({ search, paginationArgs })}`, TTL 30s, tags `["teacherDirectory"]`.
    - Pass `roleId` from `ctx.permissionContext` (must be computed before entering `cachedRead`).
    - _Requirements: 1.1, 1.2_
  - [ ] 5.2 Wrap `backend/services/parent/parent-directory.service.ts` `getParentDirectory` body with `cachedRead`
    - Permission check stays outside; cache key `ec:parent:dir:${roleId}:${stableStringify({ search, pagination, lifecycleStatus })}`, TTL 30s, tags `["parentDirectory"]`.
    - _Requirements: 1.1, 1.2_
  - [ ] 5.3 Per-file verification loop on Phase 5 files
    - `bun tsgo` + `bun biome:check` + lint queue client on the two modified service files.
    - _Requirements: 1.1_

### Phase 6: Dashboards (Phase 3 of the cache rollout)

- [ ] 6. Wrap `ParentDashboardService.getDashboardMetrics` (60s) + `SupervisorDashboardService.getDashboard` (30s) with `cachedRead`
  - [ ] 6.1 Wrap `backend/services/parent/parent-dashboard.service.ts` `getDashboardMetrics`
    - Cache key `ec:parent:dash:metrics:${parent.id}` (actor-scoped — no `roleId` because the parent IS the actor identity here), TTL 60s, tags `["parent:dash:metrics:${parent.id}", "dashboard:parent"]`.
    - _Requirements: 1.1_
  - [ ] 6.2 Wrap `backend/services/supervisor/supervisor-dashboard.service.ts` `getDashboard`
    - Cache key `ec:supervisor:dash:${actorUserId}`, TTL 30s, tags `["dashboard:supervisor"]`.
    - _Requirements: 1.1_
  - [ ] 6.3 Per-file verification loop on Phase 6 files
    - `bun tsgo` + `bun biome:check` + lint queue client on the two modified dashboard service files.
    - _Requirements: 1.1_

### Phase 7: Mutation Wiring — Named Invalidation Helpers (lockstep with resolvers)

- [ ] 7. Wire mutations to `invalidateTag(s)` across parent/teacher/dues/class-lifecycle/role-change
  - [ ] 7.1 Wire `backend/services/parent/parent-profile.service.ts` writes to `invalidateParentWrite(parentId, userId)`
    - After each `update` / `deactivate` / `reactivate` mutation, `await invalidateParentWrite(parent.id, parent.userId)` inside a `try/catch` — log on failure, never throw to caller.
    - Keep the existing session invalidation logic intact (separate concern).
    - _Requirements: 1.3, 2.4_
  - [ ] 7.2 Wire teacher profile mutation services to `invalidateTeacherWrite(teacherId, userId)`
    - Identify the teacher profile mutation service file(s): `backend/services/teacher/teacher-portal.service.ts` (and any sibling profile mutation service).
    - After each teacher profile update, `await invalidateTeacherWrite(teacher.id, teacher.userId)` in `try/catch`.
    - _Requirements: 1.3, 2.4_
  - [ ] 7.3 Wire `backend/services/teacher/teacher-due.service.ts` writes to `invalidateClassLifecycle(undefined, parentId)`
    - On each dues mutation affecting a parent, `await invalidateClassLifecycle(undefined, parentId)` to invalidate dashboard:parent + parentDirectory + parent tags.
    - _Requirements: 1.3, 2.4_
  - [ ] 7.4 Wire class-lifecycle services to `invalidateClassLifecycle(teacherId, parentId)`
    - Identify class/session lifecycle services: `backend/services/session/class-session.service.ts`, `backend/services/session/class-instance-expiry.service.ts`, plus `backend/services/schedule/schedule.service.ts` for class lifecycle mutations (create/cancel/complete class).
    - On each mutation, `await invalidateClassLifecycle(teacherId, parentId)` covering both dashboards + both directories.
    - _Requirements: 1.3, 2.4_
  - [ ] 7.5 Wire role/permission mutation services to `invalidateRoleChange(userId)`
    - Identify role mutation services in `backend/services/auth/`: `permissions.service.ts` and `permission-management.service.ts`.
    - On each role/permission write, `await invalidateRoleChange(userId)` to drop stale `user:${userId}` + directory + supervisor-dashboard tags.
    - _Requirements: 1.3, 2.4_
  - [ ] 7.6 Per-file verification loop on Phase 7 mutation-wired files
    - For each mutated service file: `bun tsgo` + `bun biome:check` + `curl -s -X POST http://localhost:4777/lint -d '{"id":"phase7","files":["<path>"]}'`.
    - _Requirements: 2.4_

### Phase 8: PG Integration Test for Tag Invalidation

- [ ] 8. Add `backend/db/test/logic/shared/cache_tag_invalidation.test.ts`
  - [ ] 8.1 Scaffold the test file with `runInRollback` setup
    - Import `runInRollback` from `backend/db/test/` per `backend/db/test/AGENTS.md`.
    - Import `cacheService` from `backend/services/cache/CacheServiceFactory.ts`.
    - Import `invalidateTag` from `backend/services/cache/EntityCacheService.ts`.
    - _Requirements: 2.2, 2.3_
  - [ ] 8.2 Write test: write entries via `cacheService.set` + `safeIndexTags` under tag `"teacher:42"`
    - Set 3 cache entries with keys `ec:teacher:42:x`, `ec:teacher:42:y`, `ec:teacher:42:z` with TTL 60s.
    - Index all three under tag `"teacher:42"` via `safeIndexTags` (each call appends to the tag key).
    - Verify via `tx.select(sessionCache).where(eq(sessionCache.key, "tag:teacher:42"))` that the tag key array contains exactly those three cache keys.
    - _Requirements: 2.3_
  - [ ] 8.3 Write test: call `invalidateTag("teacher:42")` and assert via `tx.select` that all 3 entries are gone
    - After `await invalidateTag("teacher:42")`, run `tx.select(sessionCache).where(inArray(sessionCache.key, [...3keys]))` and assert result length === 0.
    - Also assert the tag key `tag:teacher:42` is now `"[]"` (reset behavior).
    - No `expect().rejects.toThrow()` — use try/catch helper pattern per `backend/db/test/AGENTS.md`.
    - _Requirements: 2.2, 2.3, 2.4_
  - [ ] 8.4 Run the PG integration test via `bun run scripts/run-test/run-test.ts`
    - `bun run scripts/run-test/run-test.ts backend/db/test/logic/shared/cache_tag_invalidation.test.ts`.
    - Inspect `--last` output for any transaction deadlock (mandatory per `backend/db/test/AGENTS.md`).
    - _Requirements: 2.2, 2.3_

### Phase 9: Documentation (AGENTS.md "Hot-resolver caching" subsection)

- [ ] 9. Add `backend/services/AGENTS.md` "Hot-resolver caching" subsection (≤10 lines)
  - [ ] 9.1 Write the subsection summarizing the cache layer usage rules
    - Cover: (a) when to use `cachedRead` vs `cachedReadSingleFlight`, (b) every cache key MUST include `userId` + `roleId` (exception: actor-scoped dashboards), (c) every mutation that invalidates cached read paths MUST call the matching named invalidation helper in `try/catch`, (d) TTL cap is 86400s, (e) `stats()` is internal-only — never expose on HTTP.
    - Cross-link to `backend/services/cache/EntityCacheService.ts` as the canonical impl.
    - _Requirements: 1.1, 2.4, 6.2_

### Phase 10: Drop Unused `@upstash/ratelimit` Dependency

- [ ] 10. Remove `@upstash/ratelimit` and verify
  - [ ] 10.1 Remove the line from `package.json` `dependencies`
    - Open `package.json`, delete the `@upstash/ratelimit` entry.
    - _Requirements: 8.1_
  - [ ] 10.2 Run `bun install` to update `bun.lock`
    - Ensure the lockfile no longer contains `@upstash/ratelimit`.
    - _Requirements: 8.1_
  - [ ] 10.3 Search the codebase for any lingering imports
    - `rg "@upstash/ratelimit" backend/ frontend/ shared/ app/ scripts/` — must return no matches.
    - If any are found, replace with the existing custom `backend/lib/ratelimit.ts` logic.
    - _Requirements: 8.2_
  - [ ] 10.4 Run `bun tsgo` to confirm no new type errors from the removal
    - _Requirements: 8.3_

### Phase 11: Final Quality Gate

- [ ] 11. Run `bun quality-gate` to verify the whole change passes tsgo + biome + lint + codescene + sonar stages
  - [ ] 11.1 Start the lint queue server if not running: `~/.bun/bin/bun run scripts/lint-queue-server.ts`
    - Verify health: `curl -s http://localhost:4777/status` returns `{ running: true, ... }`.
    - _Requirements: 11 (gate)_
  - [ ] 11.2 Run `bun quality-gate`
    - Follow up on any failing stage using root `AGENTS.md` guidance: if CODESCENE fails run `bun run codescene --file <path>`; if SONAR_RESULTS fails use `bun scripts/sonar-manager.ts`; re-run `bun quality-gate` to resume from last failed stage.
    - SonarQube scan is orchestrator-only — subagents must NEVER run `bun sonar-scan` or `bun scripts/sonar-manager.ts`.
    - _Requirements: 11 (gate)_
  - [ ] 11.3 If `bun quality-gate:fresh` is needed (clean-slate), run it as the final verification
    - Only after all stage fixes have landed.
    - _Requirements: 11 (gate)_

---

## Task Execution Checklist (read before starting each task)

### Before Starting
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
- [ ] Per-file verification loop run: `bun tsgo` + `bun biome:check` + lint queue client on the new/modified file(s).
- [ ] All references to the task's files are updated (barrels, call sites).
- [ ] Tests pass: PG tests via `bun run scripts/run-test/run-test.ts`; unit tests via `bun test`.

### Completion
- [ ] Flip the task's checkbox from `[-]` to `[x]`.
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

---

## Notes for Executors

- The sequence of Phases 1-11 is the single recommended rollout order — each Phase's verification gates into the next.
- Sub-agents working in parallel on Phase 5/6/7 tasks MUST follow the lint-queue-server pattern from root `AGENTS.md` (`curl -s -X POST http://localhost:4777/lint ...`) — never run raw eslint directly.
- SonarQube scan is orchestrator-only — subagents must NEVER run `bun sonar-scan` or `bun scripts/sonar-manager.ts`.
- PG integration tests (`Phase 8`) MUST use `runInRollback` and the `bun run scripts/run-test/run-test.ts` runner.
