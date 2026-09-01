# Session Lifecycle & Redis Session Config

Sessions in Siraj are created by the Pothos auth mutations (`login`, `demoLogin`, `refreshToken`) in `auth.mutation.ts`, which call `SessionService.createSession` → `SessionRepository.create`. When Redis sessions are enabled (i.e. `cacheProvider !== "postgres"`), the raw session ID is HMAC-hashed, a per-role config row is read from the `session_config` table (fallback: 7-day TTL, 5 concurrent sessions), the concurrent limit is enforced by evicting the oldest Redis sessions, and the session is stored under `session:<hashedId>` with an `EX` TTL while a durable `session_metadata` row records device info and `expiresAt` in Postgres. Every authenticated request re-validates the session: `SessionService.validateSession` looks it up by HMAC hash (transparently migrating legacy SHA-256 hash records to HMAC), then `SessionRepository.validate` touches the session — refreshing `lastActivity` and re-arming the TTL in Redis and Postgres. Logout (`SessionService.logoutUser`) validates the session, best-effort ends any active impersonation, and deletes *all* of the owner's sessions from Redis plus the `session_metadata` rows, orphaned sessions whose user was deleted are purged on validation. Expiration is layered: Redis TTL auto-expires keys, and a cron-driven `cleanupExpiredSessions` removes stale metadata rows. Admins adjust per-role TTLs and concurrency caps through `SessionConfigService`, guarded by the `SETTINGS_EDIT_SESSION` permission with range validation (60 s–28 days, 1–50 sessions) and best-effort audit logging.

## Key sources

- `backend/services/auth/session.service.ts` — `SessionService.validateSession`, `createSession`, `logoutUser`, orphan purge
- `backend/services/redis/SessionRedisService.ts` — Redis key layout (`session:`, `user_sessions:`), `setSession`/`touchSession`/`deleteSession`/`enforceConcurrentLimit`
- `backend/services/redis/RedisServiceFactory.ts` — singleton `IRedisService` (local vs Upstash, DB-first env overrides)
- `backend/services/users/session-config.service.ts` — `SessionConfigService` guard, validation, audit for per-role configs
- `backend/db/repo/shared/session.repository.ts` — `SessionRepository` bridging Redis + `sessions`/`session_metadata`/`session_config` tables, defaults, legacy hash rehash
- `backend/graphql/mutation/auth/auth.mutation.ts` — `login`, `demoLogin`, `refreshToken`, `logout` resolvers
- `backend/graphql/gqlContext.ts` — per-request context carrying `sessionId`

## Diagram

```mermaid
%% Session Lifecycle & Redis Session Config — auth/session-management
sequenceDiagram
    autonumber
    participant C as Client
    participant GQL as auth.mutation.ts
    participant SS as SessionService
    participant SR as SessionRepository
    participant SRS as SessionRedisService
    participant R as Redis
    participant DB as PostgreSQL

    Note over SR,DB: Per-role ttlSeconds and maxConcurrentSessions come from the session_config table (defaults: 7 days, 5). Admins manage them via SessionConfigService, guarded by SETTINGS_EDIT_SESSION with best-effort audit logging.

    Note over C,DB: 1. Login — create session
    C->>GQL: login / demoLogin / refreshToken
    GQL->>SS: createSession(input, roleName)
    SS->>SR: create(input)
    SR->>SR: hashSessionId with HMAC
    alt Redis sessions enabled
        SR->>DB: acquire advisory lock session_user_userId
        SR->>DB: getSessionConfig(roleName)
        SR->>SRS: enforceConcurrentLimit(userId, max)
        SRS->>R: SMEMBERS user_sessions:userId, DEL oldest overflow keys
        SR->>SRS: setSession(data, ttlSeconds)
        SRS->>R: SET session:hashedId EX ttl, SADD user_sessions:userId
        SR->>DB: INSERT session_metadata with expiresAt
    else Postgres-only fallback
        SR->>DB: INSERT INTO sessions
    end
    GQL-->>C: set session_id, accessToken, refreshToken cookies

    Note over C,DB: 2. Validate and transparently refresh per request
    C->>GQL: any request with session_id cookie
    GQL->>SS: validateSession(sessionId)
    SS->>SR: findByHmacHash(hmac)
    SR->>SRS: getSession(session:hashedId)
    alt HMAC hit
        SRS-->>SR: RedisSessionData
    else legacy SHA-256 hit
        SS->>SR: findByLegacyHash, then rehashSession to HMAC
    else not found or TTL expired
        SS-->>GQL: null
    end
    SS->>SR: validate(sessionId)
    SR->>SRS: touchSession(hashedId, ttl)
    SRS->>R: refresh lastActivityAt and EX ttl
    SR->>DB: UPDATE session_metadata lastActivityAt, expiresAt
    opt user no longer exists
        SS->>SR: deleteSessionById to purge orphan
    end

    Note over C,DB: 3. Logout — invalidate everywhere
    C->>GQL: logout(sessionId, accessToken)
    GQL->>SS: logoutUser(input)
    SS->>SS: validateSession(sessionId)
    opt impersonating
        SS->>GQL: ImpersonationService.endImpersonation (best-effort)
    end
    SS->>SR: deleteByUserId(sessionOwnerId)
    SR->>SRS: deleteUserSessions(userId)
    SRS->>R: DEL all session keys and user_sessions:userId
    SR->>DB: DELETE FROM session_metadata
    GQL-->>C: clear auth cookies

    Note over R,DB: Expiry: Redis TTL auto-expires session keys, cron runs cleanupExpiredSessions to purge stale session_metadata rows.
```

Machine-checkable copy: [session-management.mmd](./session-management.mmd)
