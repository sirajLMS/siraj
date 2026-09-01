# Admin Impersonation Flow

A super admin can temporarily act as another user through an impersonation session started via the `startImpersonation` GraphQL mutation (guarded by `superAdmin`, `notImpersonating`, and `notSimulatingGroup` Pothos auth scopes). `ImpersonationService.assertCanImpersonate` rejects self-impersonation, missing, deleted, deactivated, or super-admin targets, and `assertSessionOwnership` ensures the actor owns the session before a row is inserted into `impersonation_sessions` — a partial unique index guarantees only one active session per actor. The service then mirrors an impersonation payload into the Redis session, signs an access token whose `userId` is the target (plus `actorUserId`, `impersonation: true`, and a 30-minute `impersonationExpiresAt`), writes an `IMPERSONATION_START` row to `admin_audit_logs`, and swaps the auth cookies. On every subsequent request, `gqlContextFactory` re-validates the token via `resolveAuthIdentityFromToken` against the session owner and the active DB row; expired rows are auto-ended and the Redis payload cleared. While impersonating, `createContext` builds the request context as the target user (target permissions apply), but the `superAdmin` auth scope still evaluates the real actor and `notImpersonating` scopes block sensitive mutations. Stopping via the `endImpersonation` mutation marks the DB row inactive, clears Redis, issues a normal actor token, writes an `IMPERSONATION_END` audit row, and restores cookies; attempting to end with no active session throws a localized `impersonationNotActive` error.

## Key sources

- `backend/services/auth/impersonation.service.ts` — `ImpersonationService` start/end/status, token identity resolution, Redis/DB sync, audit writes
- `backend/graphql/pothos/auth/impersonation.pothos.ts` — `startImpersonation` / `endImpersonation` mutations, `impersonationStatus` query, cookie handling
- `backend/graphql/gqlContextFactory.ts` — per-request identity resolution wiring
- `backend/graphql/gqlSchemaBuilder.ts` — `loggedIn` / `superAdmin` / `notImpersonating` / `notSimulatingGroup` auth scopes
- `backend/graphql/gqlContext.ts` — `createContext` building the impersonated request context
- `backend/services/auth/__shared__/simulationBase.ts` — `assertSessionOwnership`, `getSimulationExpiresAt`, `writeSimulationAuditLog` to `admin_audit_logs`
- `backend/db/schema/auth/impersonation.ts` — `impersonation_sessions` table with the one-active-per-actor partial unique index
- `backend/db/repo/auth/impersonation.repository.ts` — `ImpersonationRepository` create/find/end data access

## Diagram

```mermaid
flowchart TB
  START["Super admin triggers startImpersonation mutation with targetUserId and optional reason"] --> AUTH["Pothos authScopes: superAdmin, notImpersonating, notSimulatingGroup"]
  AUTH --> GUARD["Resolver rejects when ctx.isImpersonating or ctx.sessionId is missing"]
  GUARD --> CAN["ImpersonationService.assertCanImpersonate: actor is super admin, target exists, active, not deleted, not super admin, not self"]
  CAN --> OWN["assertSessionOwnership verifies the session belongs to the actor"]
  OWN --> ENDPRIOR["ImpersonationRepository.endActiveForActor ends any prior active session; group simulation cleared from Redis"]
  ENDPRIOR --> CREATE["ImpersonationRepository.createSession inserts impersonation_sessions row with hashed sessionId"]
  CREATE --> UIDX["Partial unique index impersonation_sessions_one_active_per_actor enforces one active session per actor"]
  CREATE --> REDIS["syncOptionalRedisImpersonation stores impersonation payload in the Redis session"]
  REDIS --> TOKEN["generateImpersonationAccessToken signs token: userId = target, actorUserId = actor, impersonation true, 30 minute expiry"]
  TOKEN --> AUDIT1["writeSimulationAuditLog writes IMPERSONATION_START to admin_audit_logs"]
  AUDIT1 --> COOKIE["setAuthCookies swaps the access token; returns StartImpersonationResponse"]

  COOKIE --> REQ["Next request: gqlContextFactory resolves identity via resolveAuthIdentityFromToken"]
  REQ --> CHK["Verify JWT impersonation claims, session owner matches actorUserId, active DB row target matches"]
  CHK --> EXPIRED["Expired row? endById and clear Redis impersonation, reject identity"]
  CHK --> CTX["createContext builds context as target user: ctx.user is target with target permissions, isImpersonating true, actorUserId recorded"]
  CTX --> SCOPE["superAdmin auth scope evaluates the real actor, notImpersonating scope blocks sensitive mutations during impersonation"]
  REQ --> STATUS["impersonationStatus query reports active state via getStatusForSession"]

  STOP["Super admin triggers endImpersonation mutation loggedIn scope"] --> ENDFIND["getActiveDbImpersonation finds active row; auto-ends expired rows"]
  ENDFIND --> ENDBY["ImpersonationRepository.endById sets isActive false and endedAt"]
  ENDBY --> CLEAR["clearOptionalRedisImpersonation removes impersonation data from Redis"]
  CLEAR --> ACTOKEN["generateAccessToken issues a normal actor token"]
  ACTOKEN --> AUDIT2["writeSimulationAuditLog writes IMPERSONATION_END to admin_audit_logs"]
  AUDIT2 --> COOKIE2["setAuthCookies restores the actor token"]
```

[Diagram source](./impersonation.mmd)
