# Permission Group Simulation

Permission group simulation lets a super-admin preview the effective access of a permission group they do not belong to, without leaving their own identity behind. The flow starts with the `simulatablePermissionGroups` GraphQL query, which lists all `permissionGroups` rows minus the `system_automated` slug, the super-admin's own group, and (for non-super-admins) any group the actor already owns. Calling `startPermissionGroupSimulation(groupSlug)` runs `PermissionGroupSimulationService.startSimulation`: it guards that the actor is a super-admin who does not already hold the group, terminates any active impersonation (the two modes are mutually exclusive), writes a 30-minute session-scoped simulation record to Redis, and returns a special JWT embedding the simulated group slug that is also set as an auth cookie. On subsequent requests, `resolveGroupSimulationFromToken` re-validates the token against the server-side Redis record — mismatched slug, expired token (cleared lazily), or missing session ownership all cause the simulation to be dropped or the request rejected, so the client cannot claim a simulation the server does not confirm. Both start and end append `GROUP_SIMULATION_START`/`GROUP_SIMULATION_END` rows to `adminAuditLogs` with the actor's IP. The key difference from impersonation: impersonation adopts another *user's* identity via an impersonation JWT (`payload.impersonation` is explicitly excluded from simulation resolution), whereas group simulation keeps the admin's real identity and overlays only the permission group's access, so audit trails still attribute actions to the real admin.

## Key sources

- `backend/services/auth/permission-group-simulation.service.ts` — the service namespace (`listSimulatableGroups`, `startSimulation`, `endSimulation`, `resolveGroupSimulationFromToken`, `getStatusForSession`)
- `backend/graphql/pothos/permissions/permission-group-simulation.pothos.ts` — GraphQL queries/mutations, auth scopes (`superAdmin`, `notImpersonating`), and cookie wiring
- `backend/services/auth/__shared__/simulationBase.ts` — shared expiry/audit-log/session-ownership helpers
- `backend/graphql/gqlContextFactory.ts` — where `resolveGroupSimulationFromToken` feeds the per-request GraphQL context

```mermaid
%% Permission Group Simulation - admin previews another permission group's effective access
sequenceDiagram
    autonumber
    participant Admin as SuperAdmin
    participant GQL as "Pothos auth fields (permission-group-simulation.pothos)"
    participant SIM as "PermissionGroupSimulationService"
    participant PERM as "PermissionsService"
    participant SESS as "SessionRepository (Redis)"
    participant DB as "permissionGroups / adminAuditLogs"
    participant JWT as "lib/auth/jwt"

    Admin->>GQL: query simulatablePermissionGroups
    GQL->>SIM: listSimulatableGroups(actorUserId, locale)
    SIM->>PERM: getUserContext(actorUserId)
    SIM->>DB: select permissionGroups ordered by localized name
    SIM-->>GQL: groups minus owned slugs and system_automated
    GQL-->>Admin: list of simulatable groups

    Admin->>GQL: mutation startPermissionGroupSimulation(groupSlug)
    GQL->>SIM: startSimulation(actorUserId, groupSlug, sessionId)
    SIM->>PERM: guard superAdmin + not-own-group + group exists
    SIM->>SIM: end active impersonation for actor
    SIM->>SESS: clear impersonation, write groupSimulation (groupSlug, startedAt, expiresAt = 30min)
    SIM->>JWT: generateGroupSimulationAccessToken(userId, email, groupSlug, expiresAt)
    SIM->>DB: insert adminAuditLogs GROUP_SIMULATION_START
    SIM-->>GQL: token + expiresAt + groupSlug
    GQL->>GQL: setAuthCookies(sessionId, refreshToken, token)
    GQL-->>Admin: StartPermissionGroupSimulationResponse

    Note over Admin,JWT: Requests now carry a group-simulation JWT. Identity stays the real admin, only the permission group is overlaid. Contrast with impersonation, which asserts a different user identity and uses an impersonation JWT - simulation and impersonation are mutually exclusive.

    Admin->>GQL: any authorized query/mutation with simulation token
    GQL->>SIM: resolveGroupSimulationFromToken(payload, sessionId)
    SIM->>SESS: confirm server-side simulation matches payload slug
    alt token expired or session mismatch
        SIM->>SESS: clearOptionalRedisGroupSimulation
        SIM-->>GQL: null - request rejected or de-simulated
    else valid
        SIM-->>GQL: realUserId + isSimulatingGroup + simulatedGroupSlug
    end

    Admin->>GQL: mutation endPermissionGroupSimulation
    GQL->>SIM: endSimulation(actorUserId, sessionId)
    SIM->>SIM: assertSessionOwnership, require active groupSlug
    SIM->>SESS: clearOptionalRedisGroupSimulation
    SIM->>JWT: generateAccessToken(plain identity token)
    SIM->>DB: insert adminAuditLogs GROUP_SIMULATION_END
    SIM-->>GQL: plain token
    GQL-->>Admin: EndPermissionGroupSimulationResponse
```

Standalone diagram: [permission-group-simulation.mmd](./permission-group-simulation.mmd)
