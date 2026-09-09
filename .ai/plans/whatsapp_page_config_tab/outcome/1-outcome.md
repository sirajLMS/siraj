# Task 1 — Database Schema, Migration & Seeding Outcome

- **Task ID:** 1 (subtasks 1.1–1.4)
- **Date:** 2026-09-07
- **Branch:** `feat/whatsapp-page-config-tab`
- **Previous agent state on pickup:** schema file, migration folder, seed files, types file, and all index registrations already created; DB table already pushed (106 public tables). Outcome file, tasks.md checkboxes, and worklog entry were missing; quality loop, seed run, and semantic/instruction verification not yet done. This agent verified everything, fixed 2 convention/typing issues, ran the seed, and completed the loop.

## Summary

`whatsapp_configs` table implemented per plan Phase 1 and verified live in `app_data`. Migration folder `backend/drizzle/20260907094511_small_blazing_skull/` contains the `CREATE TABLE whatsapp_configs` + FK + index statements (combined with the other pending WhatsApp/expenses DDL — table creation verified in the DB). Seeder carries `WHATSAPP_*` env vars into the row **only when a persist handler is provided**; with no `WHATSAPP_*` env vars present (current `.env` has none) the seeder is a correct no-op. Seed run exits 0 with row count 0.

## Files created / modified (final state)

**Created (by previous agent, reviewed + fixed by this agent):**
- `backend/db/schema/whatsapp/whatsapp-config.schema.ts` — `whatsappConfigs` table
- `backend/db/seeds/whatsapp/seed-whatsapp-config.ts` — `seedOrGet` seeder
- `backend/db/seeds/whatsapp/index.ts` — domain barrel
- `backend/types/whatsapp/whatsapp-config.types.ts` — canonical types
- `backend/drizzle/20260907094511_small_blazing_skull/` — migration (generated)

**Modified:**
- `backend/db/schema/whatsapp/index.ts` — added `export * from "./whatsapp-config.schema"` (alphabetical order kept)
- `backend/db/seeds/index.ts` — import + `seedWhatsappConfig` step placed after `seedUsersAndActor` (so `context.actorUserId` is available), before teacher/parent seeds
- `backend/types/whatsapp/index.ts` — added `export * from "./whatsapp-config.types"`

**Not modified (verified via `git status` after all work):** everything else. `bun.lock` was modified during env setup (pre-existing, per phase0 baseline); `Caddyfile`, `.ai/plans/*` untracked baseline files. No out-of-scope source files touched.

## Fixes applied by this agent (2)

1. **Seeder naming convention** (`backend/db/seeds/whatsapp/seed-whatsapp-config.ts` + `index.ts`): the previous agent exported `seedOrGetWhatsappConfig` directly from the seed file. Per `backend/db/seeds/AGENTS.md`, every seeder MUST export a function named **`seedOrGet`**, and the sub-directory barrel re-exports it under the domain-qualified alias. Renamed file export to `seedOrGet`; barrel is now `export { seedOrGet as seedOrGetWhatsappConfig } from "./seed-whatsapp-config";`. Controller import unchanged.
2. **Seed input typing** (`backend/types/whatsapp/whatsapp-config.types.ts` + seed file): `const payload: WhatsappConfigInsertType = {}` triggered oxlint/tsgolint `TS2739` (checker resolves `createdAt`/`updatedAt` as required on the inferred insert type even though the columns have `defaultNow()` — runtime probe confirmed `hasDefault=true`; real tsc/tsgo report no error). Fixed properly instead of suppressing: added **`WhatsappConfigSeedInput = Omit<WhatsappConfigInsertType, "id" | "createdAt" | "updatedAt">`** to the canonical types file and typed the seed payload + `WhatsappConfigSeedPersist` contract with it. This is also the domain-correct contract (DB-managed columns never belong in a seed payload).

## Verification results

### Quality Loop (`bun run scripts/health/sub-loop.ts <file> --lifecycle <stage>`)

Attempted `--lifecycle codescene` first on `whatsapp-config.schema.ts`: tsgo/oxlint/biome passed, then **`lint:type-aware` failed** — in-process lint service child (`tsgolint headless`) dies with empty output, `durationMs` 4–7 ms, exit 1 (dmesg confirms fresh `tsgo`/`tsgolint` OOM kills at ~3.6 GB RSS during these runs). This matches the phase0 baseline signature exactly (environmental 4 GB cgroup limit, reproducible on untouched master) → **`lint:type-aware`, `check:duplicates`, `codescene` are N/A in this sandbox**; per plan, fell back to **`--lifecycle biome`** (the highest completing lifecycle) for every file.

| File | tsgo (file-scoped diagnostics) | oxlint | biome:check | lint:type-aware | Final lifecycle | Exit |
|---|---|---|---|---|---|---|
| `backend/db/schema/whatsapp/whatsapp-config.schema.ts` | none | pass | pass | N/A (tsgolint OOM) | biome | 0 |
| `backend/db/schema/whatsapp/index.ts` | none | pass | pass | N/A | biome | 0 |
| `backend/db/seeds/whatsapp/seed-whatsapp-config.ts` | none | **fail → fixed** (TS2739, see fix #2) → pass | pass | N/A | biome | 0 |
| `backend/db/seeds/whatsapp/index.ts` | none | pass | pass | N/A | biome | 0 |
| `backend/db/seeds/index.ts` | none | pass | pass | N/A | biome | 0 |
| `backend/types/whatsapp/whatsapp-config.types.ts` | none | pass | pass | N/A | biome | 0 |
| `backend/types/whatsapp/index.ts` | none | pass | pass | N/A | biome | 0 |

Note on the sub-loop's "tsgo passed": the sub-loop only checks for file-scoped diagnostics (exit code ignored); dmesg shows the project-wide tsgo run itself is OOM-killed mid-run in this sandbox (consistent with phase0 D1). "No errors for file" is therefore a bounded signal, not a full type-check. Full type-check remains deferred to Task 7 / CI (deferred-items.md D1).

### DB evidence

- Seed command discovered: **`bun run db seed`** → `scripts/dbActions/index.ts` → `runAllSeeds` (`backend/db/scripts/drizzleSeed.ts` runner). `db reset`/`db cleanGenerate` unused (repo policy).
- `bun run db seed` (no `WHATSAPP_*` vars): **exit 0**; log line `WhatsApp config seed skipped — no WHATSAPP_* environment variables are set.`; overall "Database seed completed successfully". One unrelated step fails environmentally: `system-settings` (`Invalid STORAGE_PROVIDER` — sandbox env, pre-existing, not in task scope).
- Row count via psql: **0 rows** in `whatsapp_configs` — correct: `.env` contains NO `WHATSAPP_*` variables, so seeding 0 rows is the designed behavior (service layer will keep resolving from env until an admin saves config).
- Re-ran seed twice more: (a) after fixes → identical result; (b) with `WHATSAPP_APP_ID` + `WHATSAPP_VERIFY_TOKEN` set in the shell → exit 0, warn branch exercised: `WhatsApp config env vars detected (appId, verifyToken) but no persistence handler is registered — keeping env as the config source.`, still 0 rows (expected — persist seam not wired yet, see deferred D2).
- **Encryption path proven end-to-end** (throwaway script, deleted afterwards): called `seedOrGetWhatsappConfig` with a persist handler doing a real drizzle insert → captured SQL shows `app_secret` param as ciphertext `9122c9c1…:a982730f…:b67a5c1b…` (`iv:ct:tag`, AES-256-GCM via `encryptedText` → `backend/lib/field-encryption.ts`, key `DATABASE_ENCRYPTION_KEY`); reading the row back through Drizzle returned the decrypted plaintext (`DRIVER_DECRYPT_OK: true`); raw `SELECT` confirmed ciphertext at rest (`RAW_IS_CIPHERTEXT: true`). Verification row deleted afterwards; table back to 0 rows.

## Semantic review — explicit checklist

1. **No dead branches:** all seeder branches are reachable and were exercised: no-env branch (runs 1–2), env-detected-without-persist branch (run 3, warn), env+persist branch (throwaway verification). The `persist` seam is intentionally unwired in the controller because `WhatsappConfigService` does not exist until Phase 3 — tracked as **deferred item D2** so it cannot be lost.
2. **No cross-layer imports:** seeder imports only `@/backend/lib/logger` + `@/backend/types` (both allowed in `backend/db/seeds/**`; logger usage matches `shared/system-settings.ts` precedent). **No** `@/backend/db/**` / `drizzle-orm` imports in any seeder file (rule + enforced by ESLint `no-restricted-imports`). Schema file imports only schema-layer modules + `users` table.
3. **No manual ReturnType construction:** types are `typeof whatsappConfigs.$inferSelect` / `$inferInsert` / `Omit<InsertType, …>` (input variation, allowed by the canonical-type pattern).
4. **Clean comments:** grep for `REQ-`, `Task N`, `Phase N`, `.ai/plans` across all touched files → **0 matches**. JSDocs describe domain behavior (env→DB precedence, encryption boundary, attribution semantics) only.
5. **Schema columns match plan names:** `id` uuid PK default `gen_random_uuid()`, `app_id` varchar(64) null, `app_secret` text (encrypted) null, `verify_token` varchar(255) null, `phone_number_id` varchar(64) null, `waba_id` varchar(64) null, `access_token` text (encrypted) null, `es_config_id` varchar(64) null, `updated_by_user_id` uuid FK→`users.id` ON DELETE SET NULL, `created_at`/`updated_at` timestamptz(3) NOT NULL DEFAULT now(), index `whatsapp_configs_updated_by_user_id_idx` — matches plan Phase 1 item-for-item.
6. **Enums value-imported at runtime:** N/A — the table has no enum columns (only `varchar`, `text`, `uuid`, `timestamptz`); nothing to value-import.
7. **Only task-scope files modified:** final `git status` = the 3 modified indexes + 4 new file groups + migration folder (+ baseline `bun.lock`, `Caddyfile`, `.ai/plans/*`, `outcome/`). No other source files.
8. **No secrets logged in plaintext by seed:** seeder logs only env-var **detection** (generic message), carried **column names** (`appId, verifyToken…`), and a field **count** — never values. Verified in all three seed-run logs.

## Instruction verification — explicit

- `backend/db/schema/AGENTS.md`: domain subdir + barrel registration ✓; dialect-aware builders (`createTable`, `uuidColumn`, `varcharColumn`, `encryptedText`, `index`) ✓; `timestampColumns` shared helper ✓; cross-domain `users` import via `@/` alias ✓; top-level `backend/db/schema/index.ts` untouched (no new subdir) ✓; `db push` (not reset) was the apply mechanism ✓.
- `backend/db/seeds/AGENTS.md`: `seedOrGet` naming (fixed to comply) ✓; one seeder per table, whatsapp domain subdir ✓; no DB/schema/repo imports in seeder ✓; service-only persistence rule honored via the `persist` contract (service bootstrap method arrives in Phase 3 — D2) ✓; idempotency: no-env and no-persist runs are trivially idempotent; **persist-mode idempotency is delegated to the persist handler (must upsert)** — flagged in D2 because `whatsapp_configs` has **no unique constraint**; return seeded entity ✓; no permission rows touched ✓; enums N/A ✓.
- `backend/AGENTS.md` + `.agents/instructions/backend.instructions.md`: 6-layer flow respected (schema → types only, no repo/service created ahead of scope) ✓; types in `backend/types/` with `$inferSelect`/`$inferInsert` foundation, index updated ✓; barrel rules (`export *`, relative `./` paths, no imports in barrels, ≤1 `/` per path) ✓; `logger` (never `console.*`) ✓; clean-comments rule ✓; seeds rules as above ✓.
- Encryption convention (backend instructions: "per-user OAuth tokens encrypted at rest via `encryptedText`… never store raw tokens"): same mechanism chosen for `app_secret`/`access_token`; seeder hands **plaintext** to the driver — the `encryptedText` custom type encrypts via `encryptField` (AES-256-GCM, `DATABASE_ENCRYPTION_KEY`); **no manual encryption calls needed in the seed** (verified live, see DB evidence).

## Carry-forward knowledge for Tasks 2–6

- **Schema export name:** `whatsappConfigs` in `backend/db/schema/whatsapp/whatsapp-config.schema.ts`; import via barrel `@/backend/db/schema` (deep path also valid).
- **TS column keys (camelCase):** `id`, `appId`, `appSecret`, `verifyToken`, `phoneNumberId`, `wabaId`, `accessToken`, `esConfigId`, `updatedByUserId`, `createdAt`, `updatedAt`.
- **Canonical types (`@/backend/types`):** `WhatsappConfigSelectType`, `WhatsappConfigInsertType`, `WhatsappConfigSeedInput` (= `Omit<InsertType, "id" | "createdAt" | "updatedAt">`).
- **Encryption:** columns `appSecret`/`accessToken` are `encryptedText` — repositories/services pass **plaintext**; encrypt/decrypt happens at the driver boundary (`@/backend/db/schema/__shared__/dialectAwareBuilder.ts` → `@/backend/lib/field-encryption.ts`, env `DATABASE_ENCRYPTION_KEY`). Never encrypt manually, never log these values.
- **Repo layer for Task 2:** non-transactional reads must use `queryDb(tx?)` from `@/backend/db`; transaction param type is **`DBQueryExecutor`** imported from **`@/backend/types`** (moved out of `@/backend/db/db.types`). Upsert must be idempotent (no unique constraint on the table — `getWhatsappConfig` look-before-create or a single-row guard is required; "seed or get" services must not create duplicates).
- **Seed runner:** `bun run db seed` (master controller `backend/db/seeds/index.ts`; whatsapp step runs right after `seedUsersAndActor`, receives `context.actorUserId`). Seeder file contract: export `seedOrGet`; barrel alias `seedOrGetWhatsappConfig` from `@/backend/db/seeds/whatsapp`.
- **Persist seam (resolve in Phase 3):** controller currently calls `seedOrGetWhatsappConfig({ actorUserId: context.actorUserId })` with **no `persist`** → env vars are detected but not persisted (warn logged). When `WhatsappConfigService` exists, pass `persist: input => WhatsappConfigService.<upsert/bootstrap>(input)`; the handler MUST be an idempotent upsert (see D2).
- **Migration folder:** `backend/drizzle/20260907094511_small_blazing_skull/` (contains `whatsapp_configs` DDL among other queued DDL; FK `whatsapp_configs_updated_by_user_id_users_id_fkey`).
- **Environment gotchas (unchanged from phase0):** `bun tsgo` / `lint:type-aware` / `oxlint` full-repo OOM → use per-file sub-loop with `--lifecycle biome` ceiling; `bun` is at `/usr/local/bin/bun` (not `~/.bun/bin/bun`); `STORAGE_PROVIDER` unset in `.env` makes the `system-settings` seed step fail (pre-existing, unrelated).
- **GraphQL phase note (Task 4):** `WhatsappConfigSelectType` returns **decrypted** `appSecret`/`accessToken` — the masking requirement applies at the GraphQL layer; never expose these fields raw.

## Deferred items

- **D2 added** (deferred-items.md): wire `persist` handler in `backend/db/seeds/index.ts` to the Phase 3 `WhatsappConfigService` bootstrap method with idempotent upsert semantics. Source task 1, target task 3.
