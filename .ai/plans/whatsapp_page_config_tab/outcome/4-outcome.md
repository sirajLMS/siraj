# Task 4 — Backend GraphQL (Pothos) & Code Generation Outcome

- **Task ID:** 4 (subtasks 4.1–4.6)
- **Date:** 2026-09-07
- **Branch:** `feat/whatsapp-page-config-tab`
- **Scope:** four new root fields (3 queries + 1 mutation) over `WhatsappConfigService`, canonical masked-view type, schema + codegen regeneration, quality loop, semantic/instruction review. No commits made.

## Summary

Registered the WhatsApp configuration API surface following the **actual repo organization** (not the plan manifest's literal paths — see "Naming deviations"): object/input types in `backend/graphql/pothos/whatsapp/whatsapp-config.pothos.ts`, query root fields in `backend/graphql/query/whatsapp/whatsapp-config.query.ts`, the mutation in `backend/graphql/mutation/whatsapp/whatsapp-config.mutation.ts`, each wired through the whatsapp sub-barrels (which the top-level pothos/query/mutation barrels already import). The query returns a **client-safe masked view** (`appSecret`/`accessToken` through the canonical `maskSecretValue` masked-tail helper, `verifyToken` visible, `webhookUrl` derived per read); the mutation saves with per-field merge semantics and returns the same masked view so stored secrets are never echoed. Both codegen steps exit 0 and the generated SDL contains all four root fields.

## Files created / modified

**Created:**
- `backend/graphql/pothos/whatsapp/whatsapp-config.pothos.ts` — `WhatsappConfigurationPothosObject` (ref over `WhatsappConfigMaskedViewType`), `WhatsappConnectionTestResultPothosObject` (ref over `WhatsappConnectionTestResult`), `WhatsappConfigUpdateInputPothosObject` (string-named `inputType`, 7 optional/nullable fields with `maxLength` constraints matching DB columns), plus helpers `toWhatsappConfigMaskedView(config, source)`, `canViewWhatsappConfig(ctx)` / `assertCanViewWhatsappConfig(ctx, tErrors)` (dual-permission read gate), and private `deriveWhatsappWebhookUrl()`.
- `backend/graphql/query/whatsapp/whatsapp-config.query.ts` — `whatsappConfiguration`, `generateWhatsappVerifyToken`, `testWhatsappConnection`.
- `backend/graphql/mutation/whatsapp/whatsapp-config.mutation.ts` — `updateWhatsappConfiguration`.

**Modified:**
- `backend/types/whatsapp/whatsapp-config.types.ts` — added `WhatsappConfigMaskedViewType` (exported via existing `whatsapp/index.ts` → `backend/types/index.ts` chain; no barrel edits needed).
- `backend/graphql/pothos/whatsapp/index.ts` — `export * from "./whatsapp-config.pothos";`
- `backend/graphql/query/whatsapp/index.ts` — side-effect import of the new query file.
- `backend/graphql/mutation/whatsapp/index.ts` — side-effect import of the new mutation file.
- `frontend/common/graphql/generated/schema.graphql` — regenerated (+98 lines; only the new types/fields). `frontend/common/graphql/generated/gql/graphql.ts` is unchanged because `ignoreNoDocuments: true` and no frontend documents reference the new fields yet — operation types materialize in Task 5 when `whatsappConfig.documents.ts` lands.

`git status` = the 8 files above (+ pre-existing baseline: `bun.lock`, `Caddyfile`, `.ai/plans/*`). Throwaway smoke-test files were deleted after use; the smoke row in `whatsapp_configs` was removed (table back to 0 rows).

## Verification results

### Codegen (4.5)

| Command | Exit | Result |
|---|---|---|
| `bun run generate:gqlSchema` | **0** | Schema printed to `frontend/common/graphql/generated/schema.graphql`, then the script itself re-runs graphql-codegen ("✅ GraphQL Code Generation completed successfully!"). Building the executable schema also proves the new Pothos files register cleanly (no duplicate typenames). |
| `bun codegen` | **0** | graphql-codegen over the fresh schema; documents step completes (`ignoreNoDocuments: true`). |

**Schema grep proof** (all in `frontend/common/graphql/generated/schema.graphql`):
- `Query.whatsappConfiguration: WhatsappConfiguration` (line 4525)
- `Query.generateWhatsappVerifyToken: String!` (line 4212)
- `Query.testWhatsappConnection: WhatsappConnectionTestResult` (line 4497)
- `Mutation.updateWhatsappConfiguration(input: WhatsappConfigUpdateInput!): WhatsappConfiguration` (line 3360)
- `input WhatsappConfigUpdateInput` (line 6598) — all 7 fields nullable/optional (e.g. `appId: String`, no `!`), so explicit `null` clears and omission preserves
- `type WhatsappConfiguration` (line 6621): `id: String!`, `source: String!`, `appId/verifyToken/phoneNumberId/wabaId/esConfigId` nullable, `appSecret/accessToken` nullable (masked), `webhookUrl: String!`
- `type WhatsappConnectionTestResult` (line 6659): `id: String!`, `success: Boolean!`, `message: String!`, `phoneNumber: String` nullable
- `git diff --stat` on the generated dir: exactly 1 file, +98/-0.

### Runtime smoke check (throwaway, deleted after run)

Executed via the sanctioned runner (`bun run test/scripts/run-test.ts backend/graphql/test/tmp-whatsapp-config-view.test.ts`, then file deleted): **exit 0, 3 pass / 0 fail**.
- Read path (empty table, no `WHATSAPP_*` env): `{"source":"env","appId":null,…,"webhookUrl":"http://localhost:3000/api/webhooks/whatsapp"}` — env-fallback + derived URL proven.
- Save→map round trip: persisted row maps to `{"source":"db","appId":"app-1","appSecret":"••••••••9876","verifyToken":"tok-1",…}`; assertion `JSON.stringify(view)` does **not** contain the plaintext secret → masking leak-check PASS. Row deleted afterwards (table 0 rows).

### Quality Loop (4.6) — `bun run scripts/health/sub-loop.ts <file> --lifecycle biome`

`--lifecycle codescene` is environmentally unavailable in this sandbox (CodeScene CLI not executable — consistent with Tasks 1/2/3 and the phase-0 baseline); biome is the highest-completing lifecycle (full-repo tsgo/tsgolint OOM per D1). All 7 touched source files pass — exit 0 each: the 3 new graphql files, the 3 sub-barrels, and `backend/types/whatsapp/whatsapp-config.types.ts`.

## Semantic review — explicit results

1. **No dead branches:** webhook derivation has two live branches (env-config base set vs. `NEXT_PUBLIC_BASE_URL` fallback) plus a live verbatim branch (configured value already ends with the webhook path — both the "base URL" and "full URL" conventions are documented in `docs/services/whatsapp-env-setup-guide.md`/`.env.example`); the dual-permission OR has three live conditions; the mutation catch has two live paths (`invalidInput` → `ValidationError`, everything else re-thrown — `DatabaseUnavailableError` arrives from the service and propagates unchanged).
2. **No cross-layer imports:** grep `@/backend/db|@/frontend|from "../` across the 3 new files → **0 matches**. Imports are: `graphql`, `@/backend/enum`, `@/backend/graphql/*`, `@/backend/lib` (`maskSecretValue`), `@/backend/lib/server` (`NEXT_PUBLIC_BASE_URL` — same module the storage adapters import), `@/backend/services` / `@/backend/services/system`, `@/backend/types`, `@/shared/locale`. Resolvers delegate to `WhatsappConfigService`; masking + webhook-URL derivation are presentation/view concerns placed in the pothos file, mirroring the environment-config surface's helper pattern.
3. **No manual ReturnType construction:** both object refs are typed from `@/backend/types` (`WhatsappConfigMaskedViewType`, `WhatsappConnectionTestResult`); no local type definitions in Pothos files (the mapper parameter is an inline `Pick<WhatsappConfigResolvedType, …>` on the canonical type). The input uses the WhatsApp-surface `inputType(string-named)` convention (per `backend/graphql/AGENTS.md` — avoids LocalizedString null incompatibility; input types are an allowed separate definition).
4. **Clean comments / zero plan artifacts:** grep `REQ-|Task [0-9]|Phase [0-9]|.ai/plans` across all 7 touched files → **0 matches**.
5. **Masking matches project convention exactly:** the codebase's canonical `maskSecretValue` (`backend/lib/env-config.helpers.ts`) is a masked-tail style — `••••••••` + last 4 chars (plan example `••••••••1234` matches); reused verbatim rather than reimplemented. Runtime leak-check passed. `verifyToken` is intentionally visible (shared with Meta's webhook subscription — documented in the schema JSDoc). The mutation response is the masked view, so saved secrets are never echoed.
6. **Enums value-imported at runtime:** no new GraphQL enums registered. `AppPermission` is a runtime value import in the query/pothos files (needed by `authScopes` and `ctx.permissions.includes`); no enum value arrays hardcoded.
7. **Task-scope-only diff:** 8 files listed above; no unrelated source touched.
8. **Input nullability semantics:** `required: false` Pothos input fields → SDL `String` (nullable+optional); the resolver passes values through unmapped (`undefined` = absent → service keeps stored value; `null` = explicit clear) — exactly the service's merge contract (verified by the service's Task 3 tests and the mapper smoke run).
9. **Permission enforcement on every new root field:** `whatsappConfiguration` → `authScopes: { loggedIn: true }` + `assertCanViewWhatsappConfig` (superAdmin ∨ `WHATSAPP_VIEW` ∨ `WHATSAPP_CONFIG_MANAGE`); `updateWhatsappConfiguration`, `generateWhatsappVerifyToken`, `testWhatsappConnection` → `authScopes: { permission: AppPermission.WHATSAPP_CONFIG_MANAGE }` (the `permission` scope itself grants superadmins).
10. **Locale propagation:** mutation passes `ctx.locale` into `saveConfiguration`; `testConnection` receives `ctx.locale` via `withAuthResult`'s 4th parameter; the direct FORBIDDEN error uses `ctx.t().errorsTranslations.insufficientPermissions`.
11. **Apollo cache `id` on every object:** both new objects expose a constant-resolved `id` (`whatsapp-configuration`, `whatsapp-connection-test`) — the established singleton/result-wrapper pattern (`WhatsappAccountSyncOverviewPothosObject`, `EnvConfigUpsertResultPothosObject`).
12. **No dynamic imports / no console.*/ no nested ternaries / no oxlint-disables** in the new files (grep + biome pass).

### Naming deviations from the plan manifest (deliberate, convention-following)

- Plan: `backend/graphql/types/whatsappConfig.pothos.ts` → actual: `backend/graphql/pothos/whatsapp/whatsapp-config.pothos.ts` (pothos types live under `pothos/<domain>/`, kebab-case).
- Plan: `backend/graphql/queries|mutations/…` → actual: `backend/graphql/query|mutation/whatsapp/…` (singular dirs, domain sub-barrels).
- Plan permission name `WHATSAPP_MANAGE` → actual enum: **`AppPermission.WHATSAPP_CONFIG_MANAGE`** (`"whatsapp.config_manage"`, `backend/enum/permissions/permission.enum.ts`), the exact permission every existing whatsapp config mutation uses; `WHATSAPP_VIEW` exists verbatim.
- Webhook URL derivation: no existing helper built `…/api/webhooks/whatsapp` anywhere, so the resolver prefers the registered `WHATSAPP_WEBHOOK_BASE_URL` env-config key (resolvable via `resolveEnvConfig`, DB-overridable through system settings) and falls back to `NEXT_PUBLIC_BASE_URL` (`backend/lib/server.ts`, the codebase's server-side base-URL helper).

## Carry-forward for Task 5 (frontend documents + integration tests)

**Exact root fields as generated (schema.graphql):**
- `whatsappConfiguration: WhatsappConfiguration` — fields: `id: String!`, `source: String!` (`"db" | "env"` string), `appId: String`, `appSecret: String` (masked, nullable), `verifyToken: String` (nullable), `phoneNumberId: String`, `wabaId: String`, `accessToken: String` (masked, nullable), `esConfigId: String`, `webhookUrl: String!`
- `generateWhatsappVerifyToken: String!`
- `testWhatsappConnection: WhatsappConnectionTestResult` — `id: String!`, `success: Boolean!`, `message: String!`, `phoneNumber: String`
- `updateWhatsappConfiguration(input: WhatsappConfigUpdateInput!): WhatsappConfiguration` — input fields (all optional/nullable): `appId`, `appSecret`, `verifyToken`, `phoneNumberId`, `wabaId`, `accessToken`, `esConfigId` (String each; `null` clears, omit preserves)

**Generated type names to expect after Task 5 adds documents** (codegen `typed-document-node`, operations named e.g. `WhatsappConfigurationQuery`): `WhatsappConfigurationQuery`, `WhatsappConfigurationQueryVariables`, `UpdateWhatsappConfigurationMutation(Variables)`, `TestWhatsappConnectionQuery(Variables)`, `GenerateWhatsappVerifyTokenQuery(Variables)` in `frontend/common/graphql/generated/gql/graphql.ts`. `bun codegen` currently leaves `graphql.ts` unchanged (no documents yet) — Task 5 must re-run `bun codegen` after writing `whatsappConfig.documents.ts`.

**Permissions:** read = `WHATSAPP_VIEW` **or** `WHATSAPP_CONFIG_MANAGE` (superadmin implied); generate-token / test-connection / update = `WHATSAPP_CONFIG_MANAGE` only. Integration tests asserting permission enforcement should cover the OR-behavior on `whatsappConfiguration` (managed via context assertion, so a GraphQL-error probe with a VIEW-less, MANAGE-less context yields `FORBIDDEN`).

**Semantics to test:** masking (`appSecret`/`accessToken` never equal stored plaintext; tail = last 4 chars per `maskSecretValue`), `source` hint, `webhookUrl` derivation, merge semantics of the mutation input (omit vs null), localized `message` from the connection test, `DATABASE_UNAVAILABLE` code propagation when the DB write path fails.

## Cross-file dependencies

- `whatsapp-config.query.ts` / `whatsapp-config.mutation.ts` → `whatsapp-config.pothos.ts` (objects, input, mapper, permission gate) → `@/backend/types` (`WhatsappConfigMaskedViewType`, `WhatsappConfigResolvedType`, `WhatsappConnectionTestResult`, `WhatsappConfigSeedInput`) + `@/backend/services` (`WhatsappConfigService`) + `@/backend/services/system` (`resolveEnvConfig`) + `@/backend/lib` (`maskSecretValue`, `ValidationError`) + `@/backend/lib/server` (`NEXT_PUBLIC_BASE_URL`).
- Registration chain: `gqlSchema.definitions.ts` → `pothos/index.ts` + `query/index.ts` + `mutation/index.ts` → `whatsapp/index.ts` barrels → new files (verified by successful schema build).
- `backend/types/whatsapp/whatsapp-config.types.ts` addition is consumed only by the graphql layer today; Task 5's generated operation types will mirror `WhatsappConfigMaskedViewType`.

## Deferred items

No new deferred items. D1 (full type-check deferred to Task 7/CI) unchanged. Environmental note (not a code deferral): standalone `bun <script>.ts` runs against the local postgres fail with `role "z" does not exist` (pre-existing `.env`/driver quirk); all DB access must go through the sanctioned `bun run test/scripts/run-test.ts` path, which is how the Task 4 smoke check ran.
