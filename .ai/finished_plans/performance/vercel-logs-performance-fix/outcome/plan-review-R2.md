# Plan Review — Round 2 Addendum (deep-analysis-R2.md)

> **Reviewer:** plan-review skill (mandatory Phase 1.5 gate)
> **Input:** `.ai/plans/vercel-logs-performance-fix/deep-analysis-R2.md` (new addendum proposing 3 new requirements + refinements to existing requirements)
> **Date:** 2026-08-18
> **Verdict:** ✅ PASS with 2 minor remediations applied below

## Affected Layers

| Path prefix | Layer AGENTS.md | Touched by new requirements? |
|---|---|---|
| `backend/graphql/` | `backend/graphql/AGENTS.md` | Yes — Req 1.5 (gqlSchemaBuilder.ts), Req 3.6 (gqlContextFactory.ts), Req 1 (notification-alerts.query.ts), Req 3 (auth.mutation.ts) |
| `backend/services/` | `backend/services/AGENTS.md` | Yes — Req 3.6 (impersonation.service.ts, permission-group-simulation.service.ts), Req 1 (notification-alerts.service.ts, permissions.service.ts overload) |
| `frontend/common/` | `frontend/AGENTS.md` | Yes — Req 3.5 (AppApolloProvider.tsx, usePermissionManagementData.ts) |
| `frontend/views/` | `frontend/views/AGENTS.md` | Yes — Req 3.5 (usePermissionManagementData.ts) |
| `app/` | `app/AGENTS.md` | Yes — Req 3.5 (app/api/graphql/route.ts verification) |

## Cross-Cutting Rule Checks

### ✅ Type imports — PASS
- The addendum reuses the existing `UserPermissionContext` type from `@/backend/types/permissions/permission.types.ts` for Requirement 1 (confirmed in the type shape at lines 5-10). No new local type definitions are proposed in Pothos or service files.
- The `SessionSelectType` referenced for the session-dedup overload (Req 3.6) is imported from `@/backend/types` — confirmed in `auth.mutation.ts` line 30.

### ✅ Service boundaries — PASS
- The addendum correctly preserves the data flow: Client Components use Apollo hooks; the GraphQL context builder is the single source of permission truth that services consume via parameter. No Server Component is proposed to call a service directly here.

### ✅ i18n — PASS (with note)
- The addendum does **not** propose any new user-facing strings. The scopeAuth evaluator (Req 1.5) and the auth-resolution path (Req 3.6) are infrastructure — no error messages, no translations.
- **Note for the implementer:** if the eventual `refreshToken` AC#3 ("skip rotation when access token is still valid") surfaces a user-facing warning when a token is near expiry, that string will need to be added to `shared/locale/` — flag this in the implementation phase. Not a plan-level violation now.

### ✅ Logging — PASS
- The addendum proposes no new `console.*` calls. All proposed changes operate at the DB-query layer; logging behavior is preserved.

### ✅ GraphQL documents — PASS
- Req 3.5 (batching) may require adding a new `permissionsPageDataQueryDocument` if option (B) is chosen. The addendum correctly notes the `{Entity}QueryDocument` naming convention applies. The implementer should include the `id` field on every object type in the merged query.
- Existing `meQueryDocument`, `notificationAlertsQueryDocument`, etc. remain unchanged.

### ✅ Pothos enum registration — PASS
- No new enums proposed.

### ✅ Test conventions — PASS
- The addendum does not propose tests. The implementation phase will add tests for the new `UserPermissionContext` overloads and the scopeAuth short-circuit. Database tests must use `runInRollback` and pass `tx` — flagged here for the implementer.

### ✅ MUI v9 — N/A
- No UI component changes proposed in the addendum (Req 3.5 alters Apollo link configuration, not JSX).

### ✅ React 19 — N/A
- No form or event handler changes.

### ⚠️ Batch Service Methods for DataLoader (backend/services/AGENTS.md line 10) — REMEDIATION NEEDED
**Violation:** The addendum's Requirement 1 overload (`PermissionsService.hasPermission` accepting `UserPermissionContext`) is fine. **However**, the addendum does not address the service-layer rule that "services called from GraphQL field resolvers MUST expose batch versions of single-entity lookup methods to support Pothos DataLoader batching."

**Expected:** When the `getAlerts` signature changes to accept `UserPermissionContext`, the existing single-`userId` overloads should remain for non-GraphQL callers (SSR, scripts). The batch pattern (`resolve{Entity}IdsForUsers`) is not directly triggered by this plan's changes, but if the implementer removes the single-`userId` overload in favor of the context-based overload, they will break SSR callers (`getServerUserContext`) that do not have a GraphQL `ctx`.

**Required fix in the plan:** Add an AC to Requirement 1 stating: "The `userId`-based overload of `NotificationAlertsService.getAlerts` SHALL remain for non-GraphQL callers (`getServerUserContext`, scripts); the context-based overload is additive, not a replacement." This is already implicit in AC#6 ("an overload that accepts `UserPermissionContext` directly") but should be made explicit to prevent the implementer from deleting the original signature.

**Status:** Applied as a clarification to `deep-analysis-R2.md` §10 — see the updated "Refinements to existing requirements" bullet for Req 1.

### ⚠️ Apollo `PersistedQueryLink` Interactions — REMEDIATION NEEDED
**Violation:** Req 3.5 proposes `BatchHttpLink` but does not address the existing `PersistedQueryLink` in the chain. `PersistedQueryLink` sends a `hash` probe via `HEAD /api/graphql` before falling back to a full POST. The log shows **6 `HEAD /api/graphql` misses** — meaning the APQ hash is missing on the server and every batched POST will still pay a HEAD round-trip first.

**Expected:** If `BatchHttpLink` is adopted, the implementer must verify that `PersistedQueryLink` composes correctly with batched operations (Apollo's docs note that APQ + batch can interact: the hash probe is sent per-operation, not per-batch). The plan should add an AC: "WHEN `BatchHttpLink` is adopted THEN system SHALL verify `PersistedQueryLink` does not un-batch the APQ hash probes, or SHALL disable APQ if the composition is incompatible."

**Status:** Applied as a new AC under Req 3.5 in `deep-analysis-R2.md` §10.

## Summary

| Dimension | Result |
|---|---|
| Type imports | ✅ |
| Service boundaries | ✅ |
| i18n | ✅ |
| Logging | ✅ |
| GraphQL documents | ✅ |
| Pothos enums | ✅ |
| Test conventions | ✅ |
| MUI v9 | N/A |
| React 19 | N/A |
| DataLoader batch rule | ⚠️ fixed (AC clarification) |
| APQ + batch interaction | ⚠️ fixed (new AC) |

**Total violations found:** 2
**Total violations fixed:** 2
**Remaining:** 0

The addendum is approved for inclusion in the plan. The two remediations have been applied to `deep-analysis-R2.md` §10 as clarifications to Req 1 and a new AC for Req 3.5.
