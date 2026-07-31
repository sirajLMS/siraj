# Entity Cache Service (`EntityCacheService`)

## Why

Siraj uses a dual-adapter caching architecture (`PostgresCacheAdapter` for zero-infra local/dev/CI and `RedisCacheAdapter` for high-throughput production) wrapped by `EntityCacheService` to provide high-performance, single-flight, identity+role-scoped caching for hot resolvers, entity lookups, directories, and dashboards.

## Architecture & Data Flow

```
Client Component → Apollo Hook → GraphQL API → Pothos Resolver
                                                    │
                                            cachedRead()
                                                    │
                                     ┌──────────────┴──────────────┐
                                     ▼                             ▼
                            Cache Hit (0 DB ops)          Cache Miss / Outage
                                                                   │
                                                           Loader Execution
                                                                   │
                                                           DB / Repo Query
```

- **Fail-Open Design**: Any failure (network timeout, Redis outage, DB cache table error) falls through gracefully to the loader and returns live data to the caller without raising exceptions or breaking GraphQL requests.
- **Single-Flight Execution**: `cachedReadSingleFlight` collapses concurrent requests for the same key within a single node into a single loader execution, preventing cache stampedes.
- **Tag Indexing**: Cached entries are indexed under tag keys (`tag:<tagName>`). Invalidation helpers pipeline key deletions based on tag index lookups.

## Key Naming Conventions

All cache keys must follow strict identity+role-scoped formats to prevent cross-user data leaks and privilege escalation:

| Purpose | Key Pattern | TTL | Tags |
|---------|-------------|-----|------|
| Current User Profile | `ec:user:${userId}:${roleId}` | 300s | `["user:${userId}"]` |
| Teacher by User ID | `ec:teacher:byUserId:${userId}:${roleId}` | 300s | `["teacher:byUserId:${userId}"]` |
| Parent by User ID | `ec:parent:byUserId:${userId}:${roleId}` | 300s | `["parent:byUserId:${userId}"]` |
| Staff Directory | `ec:teacher:dir:${roleId}:${stableStringify(queryArgs)}` | 30s | `["teacherDirectory"]` |
| Parent Directory | `ec:parent:dir:${roleId}:${stableStringify(queryArgs)}` | 30s | `["parentDirectory"]` |
| Parent Dashboard Metrics | `ec:parent:dash:metrics:${parentId}` | 60s | `["parent:dash:metrics:${parentId}", "dashboard:parent"]` |
| Supervisor Dashboard | `ec:supervisor:dash:${actorUserId}` | 30s | `["dashboard:supervisor"]` |

## Rules

1. **Permission Check Ordering**: Permission and authorization checks (e.g. `assertDirectoryAccess`, `hasPermission`) MUST execute BEFORE entering `cachedRead`. Never perform permission checks inside the `cachedRead` loader function.
2. **Deterministic Query Parameters**: Always use `stableStringify` for parameter objects in cache keys to ensure key stability regardless of object property ordering.
3. **Mutation Invalidation**: Every write/mutation path that updates an entity MUST invoke the corresponding named invalidation helper (`invalidateParentWrite`, `invalidateTeacherWrite`, `invalidateClassLifecycle`, `invalidateRoleChange`) inside a `try/catch` block.
4. **TTL Bounds**: Upper bound TTL is 86,400 seconds (24 hours). Directory cache TTL is 30s, dashboard TTL is 30s–60s, entity lookup TTL is 300s.
5. **No Direct `console.*`**: Always use `@/backend/lib/logger` for logging cache events and error fallbacks.

## Anti-Patterns

- ❌ **Inline Permission Gating inside `cachedRead`**: Would allow cached responses to skip authorization checks or leak unauthorized payloads across roles.
- ❌ **Unscoped Cache Keys**: Using `ec:user:${userId}` without `${roleId}` — risk of role escalation when a user's role or permissions change.
- ❌ **Throwing Cache Errors**: Throwing errors when Redis or Postgres cache operations fail — cache must be strictly fail-open.
- ❌ **Hardcoded Colors or Direct Console**: Using `console.log` in cache services instead of `@/backend/lib/logger`.

## Invalidation Helpers Reference

- `invalidateParentWrite(parentId, userId)`: Invalidates `parent:${parentId}`, `parent:byUserId:${userId}`, `parentDirectory`, `dashboard:parent`, and `parent:dash:metrics:${parentId}`.
- `invalidateTeacherWrite(teacherId, userId)`: Invalidates `teacher:${teacherId}`, `teacher:byUserId:${userId}`, `teacherDirectory`, and `dashboard:supervisor`.
- `invalidateClassLifecycle(teacherId?, parentId?)`: Invalidates `dashboard:parent`, `dashboard:supervisor`, `teacherDirectory`, `parentDirectory`, and target teacher/parent tags.
- `invalidateRoleChange(userId)`: Invalidates `user:${userId}`, `teacherDirectory`, `parentDirectory`, and `dashboard:supervisor`.

## Related Documents

- `backend/services/AGENTS.md` — Service layer conventions and caching rules
- `backend/db/repo/shared/cache.repository.ts` — SQL-backed cache repository for Postgres
- `backend/services/cache/EntityCacheService.ts` — Core entity caching service implementation
