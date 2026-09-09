# Task 2 — Database Repository & Repository Tests Outcome

- **Task ID:** 2 (subtasks 2.1–2.4)
- **Date:** 2026-09-07
- **Branch:** `feat/whatsapp-page-config-tab`
- **Pickup state:** repository, domain barrel, and 4-Tier test file already existed and were reviewed once; no code changes were required this round — this agent ran the test suite (green on first run, zero fixes), ran the quality loop, performed the semantic spot-check, and wrote artifacts.

## Summary

`WhatsappConfigRepository` implements race-safe singleton upsert over `whatsapp_configs` (advisory lock + `FOR UPDATE` inside a real transaction — the table has no unique constraint, so this is the only duplicate guard) plus `queryDb(tx)`-based bare reads. The 16-test 4-Tier suite passes **green on first run: 16 pass / 0 fail / 71 expect() calls, exit 0**, covering create/get/merge/patch semantics, tx propagation, boundaries (null-clear, empty-string, unicode, column limit + savepoint error), real-connection concurrency (both parallel writers and parallel first-saves from empty table — exactly one row survives), encryption at rest + re-encryption on rotation, and SQL-injection parameterization.

## Files created / modified (final state)

- `backend/db/repo/whatsapp/whatsapp-config.repository.ts` — `export namespace WhatsappConfigRepository` with `getWhatsappConfig` / `upsertWhatsappConfig` (+ private `runWithTx` / `applySingletonUpsert` helpers, `UPSERT_LOCK_KEY`)
- `backend/db/repo/whatsapp/index.ts` — modified: added `export * from "./whatsapp-config.repository";` (alphabetical, between `whatsapp-account` and `whatsapp-contact`)
- `backend/db/test/repo/whatsapp/whatsapp-config.repository.test.ts` — 4-Tier suite (Tier 1 behavior ×4, Tier 2 boundaries ×7, Tier 3 concurrency ×2, Tier 4 encryption/injection ×3)

**Not modified:** nothing else. `git status` after all work = the 3 task-2 files (+ pre-existing baseline: `bun.lock`, `Caddyfile`, `.ai/plans/*`, `outcome/`). No commit made (per instructions).

## Verification results

### Test run

- Direct `bun test <file>` is blocked by the repo's test runner (approved-runners guard); used the sanctioned single-file runner with log capture + process lock.
- Command: **`bun run test/scripts/run-test.ts backend/db/test/repo/whatsapp/whatsapp-config.repository.test.ts`** (equivalent of the requested `scripts/run-test/run-test.ts` — that path does not exist; `test/scripts/run-test.ts` is the repo's single-file runner per the block message and package.json conventions)
- Result: **exit 0 — 16 pass, 0 fail, 71 expect() calls, ~1.3 s**, Tier 3 concurrency tests executed (postgres backend, not skipped). Tier 2 includes a savepoint-error case (`expectSavepointError`, 256-char verify token → "value too long", row intact).
- Fixes required: **none** (no implementation or test edits made).

### Quality Loop (`bun run scripts/health/sub-loop.ts <file> --lifecycle <stage>`)

`--lifecycle codescene` attempted first on the repository file: failed environmentally — CodeScene CLI installed by the sub-loop is not executable in this sandbox (`Executable not found in $PATH: "cs"`, exit 1, not a code finding). Fell back to **`--lifecycle biome`** for all 3 files (consistent with the phase0/Task 1 OOM ceiling; tsgo/tsgolint full-repo type-aware lint remains N/A in this 4 GB sandbox).

| File | tsgo (file-scoped) | oxlint | biome:check | Final lifecycle | Exit |
|---|---|---|---|---|---|
| `backend/db/repo/whatsapp/whatsapp-config.repository.ts` | no diagnostics | pass | pass | biome | 0 |
| `backend/db/repo/whatsapp/index.ts` | no diagnostics | pass | pass | biome | 0 |
| `backend/db/test/repo/whatsapp/whatsapp-config.repository.test.ts` | no diagnostics | pass | pass | biome | 0 |

Same caveat as Task 1: sub-loop tsgo is file-scoped only; full type-check stays deferred to Task 7 / CI (deferred-items D1). No lint fixes were needed.

## Semantic spot-check — explicit results

1. **No cross-layer imports:** 0 matches for `@/backend/(services|graphql)`, `@/frontend`, locale imports across the 3 files. Repo file imports only `@/backend/db` (`db`, `queryDb`, `withForUpdate`), `@/backend/db/repo/shared` (`acquireAdvisoryLock`), `@/backend/db/schema` (`whatsappConfigs`), `@/backend/types` (types only). Test file imports only `@/backend/db`, `@/backend/db/repo/whatsapp`, `@/backend/db/schema`, `@/backend/db/test/test-utils`, `@/backend/types`. Repo-layer rules honored (`queryDb(tx)` for the bare read — Neon-HTTP eligible; no business logic; namespace export `{Entity}Repository`; types from `@/backend/types`).
2. **Upsert race-safety confirmed present:** every write goes through `runWithTx` (guarantees a real `DBTransaction` — opens `db.transaction` when the caller passes none) → `applySingletonUpsert` → `acquireAdvisoryLock(t, "whatsapp-config-upsert")` → `withForUpdate(t.select()…orderBy(createdAt asc)).limit(1)` → update-or-insert, all inside the transaction so both locks are held to commit. The empty-table phantom-insert window is closed by the advisory lock (FOR UPDATE alone has no row to lock). Empirically validated by the passing Tier 3 tests on **separate real connections** (including the parallel-first-save-from-empty-table case).
3. **Zero plan-artifact references:** grep `REQ-|Task [0-9]|Phase [0-9]|.ai/plans` over the 3 files → **0 matches**. All JSDoc describes domain behavior (lock rationale, merge semantics, decryption boundary) only.
4. **Task-scope-only git status:** only `whatsapp-config.repository.ts` (new), `whatsapp-config.repository.test.ts` (new), `repo/whatsapp/index.ts` (modified) + pre-existing baseline. ✓
5. **Naming deviation vs plan text (deliberate):** tasks.md 2.1/2.2 say `whatsapp-config.repo.ts` / `backend/db/test/whatsapp-config.repo.test.ts`; actual files follow the binding repo/test conventions instead (`<entity>.repository.ts` in a domain subdirectory; tests mirror `backend/db/test/repo/<domain>/` like every sibling repo test). Function names match the plan exactly.

## Carry-forward knowledge for Task 3

- **Exact export signatures** (via `export namespace WhatsappConfigRepository`):
  - `WhatsappConfigRepository.getWhatsappConfig(tx?: DBQueryExecutor): Promise<WhatsappConfigSelectType | null>` — returns decrypted `appSecret`/`accessToken` (driver-boundary), `null` when never configured. Note: `get` takes a **`DBQueryExecutor`**, not `DBTransaction`.
  - `WhatsappConfigRepository.upsertWhatsappConfig(input: WhatsappConfigSeedInput, tx?: DBTransaction): Promise<WhatsappConfigSelectType>` — merge semantics: present fields written (explicit `null` clears the column), absent fields untouched; opens its own transaction when `tx` is omitted; plaintext in, ciphertext at rest handled by `encryptedText` (`DATABASE_ENCRYPTION_KEY`).
- **Import paths:** recommended top-level barrel `import { WhatsappConfigRepository } from "@/backend/db/repo";` (or domain barrel `@/backend/db/repo/whatsapp`, also valid).
- **D2 seed-persist seam (resolve in Phase 3):** `backend/db/seeds/index.ts` still calls `seedOrGetWhatsappConfig` with **no `persist`** handler, so env-detected credentials are warned about but not persisted. When `WhatsappConfigService` exists, wire `persist: input => WhatsappConfigService.<bootstrap/upsert>(input)` where the handler must call **`upsertWhatsappConfig`** (it is already the idempotent single-row upsert the seeds AGENTS.md requires — advisory-lock serialized, never creates a second row). Input is `WhatsappConfigSeedInput` (no `id`/timestamps) — hand it through unchanged.
- **Env/DB facts (verified this task):** `.env` still `DB_PROVIDER=postgres`, `DATABASE_URL=postgresql://postgres@127.0.0.1:5432/app_data`; `.env.test` points at the same DB; `whatsapp_configs` table exists, 0 rows (all test writes rolled back; Tier 3 committed rows cleaned up in `finally`).
- **Environment gotchas unchanged:** tsgolint/tsgo full-repo type-aware lint OOM (4 GB cgroup) → biome ceiling per file; `codescene` CLI additionally not executable in this sandbox; direct `bun test` invocation blocked → `bun run test/scripts/run-test.ts <file>`.

## Deferred items

- No new deferred items from Task 2. D1 (full type-check in CI) and D2 (seed persist wiring) remain open, both targeting later tasks (7 and 3 respectively).
