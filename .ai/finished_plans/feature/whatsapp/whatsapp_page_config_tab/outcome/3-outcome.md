# Task 3 — Service Layer, Resiliency & Env Gating Outcome

- **Task ID:** 3 (subtasks 3.1–3.7)
- **Date:** 2026-09-07
- **Branch:** `feat/whatsapp-page-config-tab`
- **Pickup state:** service + tests + D2 seed wiring already written by a prior agent; this agent verified coherence (service ↔ repo ↔ seed seams), ran tests (green on first run), applied one biome format fix to the test file, ran the quality loop, performed the semantic spot-check, and wrote artifacts. No logic fixes were required.

## Summary

`WhatsappConfigService` (namespace export, mirroring the repo-layer convention) delivers DB-first credential resolution with env fallback, outage-resilient reads, gated writes, a fast verify-token generator, and a Meta Graph API connection check — exactly the 3.1–3.4 contract. Resolution never throws (DB outage → `logger.warn`/`error` + `WHATSAPP_*` env fallback); writes map any DB failure to the localized-safe `DatabaseUnavailableError` and never leak credential values into thrown messages or logs (token travels only in the `Authorization` header, never the URL). The **D2 seed-persist seam is now wired**: `backend/db/seeds/index.ts` passes `persist: input => WhatsappConfigService.saveConfiguration(input, { actorUserId })`, and `saveConfiguration` delegates to the repository's advisory-lock-serialized idempotent `upsertWhatsappConfig` — so a seed re-run refreshes the singleton row instead of duplicating it.

## Files created / modified (final state)

**Created:**
- `backend/services/whatsapp/whatsapp-config.service.ts` — `export namespace WhatsappConfigService` with `resolveConfiguration` / `saveConfiguration` / `generateVerifyToken` / `testConnection`
- `backend/services/whatsapp/test/whatsapp-config.service.test.ts` — 25-test 4-Tier suite

**Modified:**
- `backend/db/seeds/index.ts` — `seedWhatsappConfig` now registers the D2 `persist` handler → `WhatsappConfigService.saveConfiguration(input, { actorUserId: context.actorUserId })`
- `backend/services/whatsapp/index.ts` — added `export * from "./whatsapp-config.service";` (alphabetical)
- `backend/types/whatsapp/whatsapp-config.types.ts` — added `WhatsappConfigSource`, `WhatsappConfigResolvedType`, `WhatsappConnectionTestResult` (exported via `backend/types/whatsapp/index.ts` → `backend/types/index.ts`)
- `shared/locale/en/errors/index.ts`, `shared/locale/ar/errors/index.ts`, `shared/locale/types/errors/index.ts` — 3 new keys in all three (key parity): `whatsappPhoneNumberIdNotConfigured`, `whatsappConnectionTestSucceeded`, `whatsappConnectionTestFailed`

**Reviewed, not modified:** `backend/db/seeds/whatsapp/seed-whatsapp-config.ts` (defines `WhatsappConfigSeedOptions.persist?: (input: WhatsappConfigSeedInput) => Promise<WhatsappConfigSelectType>` — signature matches `saveConfiguration` exactly; warns when no handler is registered). `git status` = the 7 files above (+ pre-existing baseline: `bun.lock`, `Caddyfile`, `.ai/plans/*`). No commit made (per instructions).

## Verification results

### Test run

- Command: **`bun run test/scripts/run-test.ts backend/services/whatsapp/test/whatsapp-config.service.test.ts`**
- Result: **exit 0 — 25 pass, 0 fail, 133 expect() calls, ~1.56 s** (green on first run).
- Coverage map: DB-success/env-fallback/outage-fallback/row-authoritative-as-a-whole (resolve, ×4); upsert delegation + actor attribution, null-clears/absent-untouched, DB failure → `DatabaseUnavailableError` (`code === "DATABASE_UNAVAILABLE"`) (save, ×3); 48-char hex + uniqueness (token, ×2); success+display number, missing token/phone-ID short-circuits, malformed phone-ID, HTTP error, non-JSON body, 2xx-without-number (connection, ×7); boundary tier ×3 (blank env = unset, whitespace save rejected pre-DB, malformed actor rejected pre-DB); concurrency tier ×2 (25 concurrent outage-resilient reads, 20 concurrent saves); no-leak tier ×4 (logs/results never contain secrets, token, or `Bearer`).
- Post-fix re-run (after biome format): **exit 0, 25/0/133** — unchanged.
- Fixes required: **one format-only fix** — `bunx biome check --write` on the test file (2 line-wrapping spots); zero logic edits anywhere.

### Quality Loop (`bun run scripts/health/sub-loop.ts <file> --lifecycle <stage>`)

`--lifecycle codescene` probed on the service file: **environmental failure** (script `codescene` exit 1 — CodeScene CLI `cs` not executable in this sandbox; consistent with Task 1/2). Fell back to **`--lifecycle biome`** for all files (tsgo/tsgolint full-repo OOM ceiling unchanged, per D1).

| File | Final lifecycle | Exit | Notes |
|---|---|---|---|
| `backend/services/whatsapp/whatsapp-config.service.ts` | biome | 0 | clean |
| `backend/services/whatsapp/test/whatsapp-config.service.test.ts` | biome | 0 | 1 format warning auto-fixed, re-ran clean |
| `backend/db/seeds/index.ts` | biome | 0 | clean |
| `backend/services/whatsapp/index.ts` | biome | 0 | clean |
| `backend/types/whatsapp/whatsapp-config.types.ts` | biome | 0 | clean |
| `shared/locale/en/errors/index.ts` | biome | 0 | clean |
| `shared/locale/ar/errors/index.ts` | biome | 0 | clean |
| `shared/locale/types/errors/index.ts` | biome | 0 | clean |

## Semantic spot-check — explicit results

1. **No cross-layer imports:** 0 matches for `@/frontend` / `backend/graphql` / graphql in the service and types files. Service imports only repo (`@/backend/db/repo/whatsapp/whatsapp-config.repository`), lib (`@/backend/lib`, `logger`, `whatsapp-constants`), sibling backend services (cloud-api helpers, `resolveEnvConfigMany` from system), `@/backend/types` (types only), `@/shared/locale`. Business logic stays in the service; no GraphQL/frontend coupling.
2. **Locale key parity:** the 3 new error keys exist in **all three** of en / ar / `ErrorsLabels` (verified in diffs); the also-used `whatsappAccessTokenNotConfigured` + `invalidInput` were pre-existing in all three. No key drift.
3. **D2 seam verified (type- and behavior-checked):** seed handler type `(input: WhatsappConfigSeedInput) => Promise<WhatsappConfigSelectType>` ≡ `saveConfiguration` signature; `saveConfiguration` → `WhatsappConfigRepository.upsertWhatsappConfig` (advisory-lock + FOR UPDATE singleton upsert — the idempotency guarantee D2 demands); import chain `seeds/index.ts → @/backend/services → ./whatsapp → whatsapp-config.service` intact; behavior proven by the passing "persists through the repository upsert with actor attribution" test + repo Tier 3 single-row-concurrency tests. No WHATSAPP_* vars in this `.env`, so the seeder is a no-op locally (nothing persisted to dev DB).
4. **Zero plan-artifact references:** grep `REQ-|Task [0-9]|Phase [0-9]|.ai/plans` across all 9 touched/reviewed files → **0 matches**.
5. **No secrets logged:** every log call inspected — DB-outage logs carry only driver messages; save-failure log is a static string; connection-test log contains only the phone number ID (not a secret); token is sent via `Authorization` header (test asserts it never appears in the URL); the generated token is returned, never persisted or logged. Backed by the 4 Tier 4 leak-scan tests.
6. **Task-scope-only git status:** only the 7 task-3 files + pre-existing baseline. ✓
7. **Naming note:** tests live at `backend/services/whatsapp/test/whatsapp-config.service.test.ts` (tasks.md 3.5 says `test/services/...`) — matches the actual service-test directory convention used by sibling services (same deliberate deviation pattern as Task 2).

## Carry-forward knowledge for Task 4 (GraphQL resolvers)

- **Import:** `import { WhatsappConfigService } from "@/backend/services";` (re-exported through `backend/services/whatsapp/index.ts`). Types from `@/backend/types`.
- **Exact method signatures:**
  - `WhatsappConfigService.resolveConfiguration(): Promise<WhatsappConfigResolvedType>` — no args; never throws; `{ source: "db" | "env", appId, appSecret, verifyToken, phoneNumberId, wabaId, accessToken, esConfigId }` with **decrypted** `appSecret`/`accessToken` (plaintext at the driver boundary).
  - `WhatsappConfigService.saveConfiguration(input: WhatsappConfigSeedInput, options?: { actorUserId?: string; locale?: string }): Promise<WhatsappConfigSelectType>` — merge semantics (present fields written, explicit `null` clears, absent untouched, strings trimmed); returns the **stored entity with plaintext secrets**; throws plain `Error(errorsTranslations.invalidInput)` for blank/whitespace values or a malformed actor UUID (validation happens before any DB access); throws `DatabaseUnavailableError` on any DB failure.
  - `WhatsappConfigService.generateVerifyToken(): string` — **synchronous**; 48-char lowercase hex (`[0-9a-f]{48}`); not persisted, not logged — the mutation just returns it.
  - `WhatsappConfigService.testConnection(locale?: string): Promise<WhatsappConnectionTestResult>` — **never throws**; `{ success: boolean; message: string; phoneNumber?: string }` where `message` is already localized user-facing copy.
- **Error handling for resolvers:** catch `DatabaseUnavailableError` (from `@/backend/lib`, `.code === "DATABASE_UNAVAILABLE"`) → surface "temporarily unavailable" copy; catch generic `Error` with `message === errorsTranslations.invalidInput` for validation (or pre-validate in the resolver and skip relying on the message). Pass `locale` into `saveConfiguration`/`testConnection` from the GraphQL context.
- **Locale keys now available** (all in `ErrorsLabels`, en+ar): `whatsappAccessTokenNotConfigured`, `whatsappPhoneNumberIdNotConfigured`, `whatsappConnectionTestSucceeded`, `whatsappConnectionTestFailed`.
- **Masking is the resolver's job, not the service's:** the service deliberately returns full plaintext (it is the integration's own credential source — the webhook handler and connection test need real values). Per the `WhatsappConfigResolvedType` JSDoc, "API layers must only ever expose masked views." For `whatsappConfiguration` (4.1): mask `appSecret`/`accessToken` with a fixed sentinel (e.g. `••••••••`) when non-null, `null` when absent; `verifyToken` visible as-is; derive `webhookUrl` at the resolver; for `updateWhatsappConfiguration` (4.2) do **not** echo the stored secrets back in the response payload.
- **Env gating:** reads degrade to env silently (surface `source: "env"` in the masked view if the UI should hint at it); writes are the only gated path (`DatabaseUnavailableError`).

## Cross-file dependencies

- `whatsapp-config.service.ts` → `@/backend/db/repo/whatsapp/whatsapp-config.repository` (Task 2 signatures, mocked at direct path in tests so no real DB opens) → `@/backend/types` → `@/shared/locale`.
- `seeds/index.ts` → `@/backend/services` (new `WhatsappConfigService` import) + `@/backend/db/seeds/whatsapp` (pre-existing `seedOrGetWhatsappConfig` alias of `seedOrGet`).
- Types file additions are consumed by the service and (in Task 4+) by resolvers; locale additions are consumed by the service and validated by key parity with `ErrorsLabels`.

## Deferred items

- **D2 resolved** (seed persist handler wired + tested — see deferred-items.md, updated to ✅ with reference to this file). **D1 unchanged** (full type-check stays deferred to Task 7/CI); no new deferred items from Task 3.
