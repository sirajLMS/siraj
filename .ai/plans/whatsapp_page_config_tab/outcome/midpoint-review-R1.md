# Mid-Point Review Gate R1 — Aggregated Outcome (fix + verification)

- **Task ID:** midpoint-R1-fix (finisher)
- **Date:** 2026-09-07
- **Branch:** `feat/whatsapp-page-config-tab`
- **Scope:** completed the interrupted fix pass for the three-reviewer mid-point gate (R1): re-verified and finished the 7 uncommitted modified files, ran both test suites, sanity greps, per-file quality loop, and wrote this artifact. **No commits, no branch switches.**

**Files in scope (all uncommitted):** `backend/db/seeds/whatsapp/seed-whatsapp-config.ts`, `backend/db/test/repo/whatsapp/whatsapp-config.repository.test.ts`, `backend/graphql/mutation/whatsapp/whatsapp-config.mutation.ts`, `backend/lib/whatsapp-constants.ts`, `backend/services/whatsapp/whatsapp-config.service.ts`, `backend/services/whatsapp/test/whatsapp-config.service.test.ts`, `backend/types/whatsapp/whatsapp-config.types.ts`

---

## 1. R1 aggregated findings (3 reviewers)

### MEDIUM

| # | Finding | Status | Resolution |
|---|---------|--------|------------|
| M1 | **Empty-patch rejection missing** — `saveConfiguration({})` (or a null-only patch) reached the repository; on an empty table it would insert an all-null singleton row and permanently shadow the `WHATSAPP_*` env fallback. | **FIXED** | Service guard added: after normalization, a patch with no string-valued credential field (`!WHATSAPP_CONFIG_ENV_SOURCES.some(({ field }) => typeof payload[field] === "string")`) throws `ValidationError(invalidInput)` **before any DB access** (`whatsapp-config.service.ts`, `saveConfiguration`). New service test `a patch with no credential value is rejected without touching the DB` asserts `ValidationError` for both `{}` and `{ appId: null }` and that the repository upsert is never called. Doc comment on the service method updated. |
| M2 | **Env-mapping duplicated** — the field↔`WHATSAPP_*` key table existed twice (service-local `CONFIG_ENV_SOURCES`, seeder-local `WHATSAPP_CONFIG_ENV_SOURCES`) and could drift. | **FIXED** | Single source of truth in `backend/lib/whatsapp-constants.ts`: `WHATSAPP_CONFIG_ENV_SOURCES` (+ `WhatsappConfigCredentialField` type derived from `WhatsappConfigResolvedType`). Consumption: **seeder** imports the shared constant and iterates it for the carry-over loop (`{ field, envKey }`, blank-env trim → unset); **service** imports it for (a) the env-key list passed to `resolveEnvConfigMany`, (b) the blank→null env resolution loop, (c) the patch-normalization field set, (d) the M1 empty-patch guard. Repo-wide grep: no local `const *CONFIG_ENV_SOURCES` duplicates remain. |
| M3 | **Tier-3 repo tests risked wiping the shared table** — committed separate-connection rows were cleaned with a table-wide delete, so a failure mid-test could destroy the shared dev DB's credential store. | **FIXED** | Repo test now uses snapshot + by-id isolation: `snapshotConfigRows()` captures the committed singleton store; `deleteConfigRowsById()` deletes **only by primary key** (never table-wide) for the test window; `restoreConfigRows()` re-inserts exactly the snapshotted rows (`onConflictDoNothing`, plaintext re-encrypts at the driver boundary). Sanity grep (a) confirms the old `sql\`TRUE\`` wipe marker is gone from the file (count 0); the only remaining delete-all is the *rollback-protected* in-tx baseline reset (`tx.delete(...).where(isNotNull(whatsappConfigs.id))` — intentional, restored by the rollback). |

### LOW

| # | Finding | Status | Resolution / Reason |
|---|---------|--------|---------------------|
| L1 | **Logger serializer** — leak scans collapsed nested logger objects to `"[object Object]"`, so nested content was never actually scanned. | **FIXED** (+ 1 leak it exposed, fixed) | Test helper `serializeForScan()` deep-JSON-serializes logger args with a circular-reference guard and a `"[unserializable]"` fallback (never invokes an arbitrary object's `toString()`). Making the scan real **exposed a genuine leak**: the service logged the raw `GraphApiError`, whose `errorBody` carries Meta's response body — Meta echoes truncated tokens back in its invalid-token messages. Fixed in `whatsapp-config.service.ts`: the connection-test failure path now logs only stable, non-sensitive metadata (`name`, `statusCode`, `code`, `type`, `fbtrace_id`, `error_subcode`); non-Meta errors (network/timeouts) pass through unchanged. Tier-4 test `connection-test results and logs never leak the token or Meta internals` now passes (it failed on first run — see §2). |
| L2 | **`ValidationError` instanceof** — the service threw plain `Error(tErrors.invalidInput)` and the mutation re-wrapped it by string-matching the localized message. | **FIXED** | Service throws typed `ValidationError` (imported from `@/backend/lib`); mutation droped the try/catch string-match re-wrap entirely — typed `DomainError`s (`ValidationError`, `DatabaseUnavailableError`) propagate with `extensions.code` unchanged. Tests assert `toBeInstanceOf(ValidationError)` for blank-value, malformed-actor, and empty-patch rejections. |
| L3 | **`MaskedViewType` derivation** — the masked-view type re-declared the seven credential fields by hand, drifting risk vs `WhatsappConfigResolvedType`. | **FIXED** | `WhatsappConfigMaskedViewType = WhatsappConfigResolvedType & { readonly webhookUrl: string }` — single-source derivation; doc comment states it carries the resolved credential shape as-is with the webhook URL derived on top. |
| L4 | **Seeder blank-env trim** — seeder treated any truthy env value (including whitespace-only) as configured, disagreeing with the service's env resolution. | **FIXED** | Seeder trims and treats blank as unset (`process.env[envKey]?.trim() ?? ""`), mirroring the service's blank→null semantics; doc comment updated. |
| L5a | **`canViewWhatsappConfig` export** (noted-as-acceptable) | **LEFT-AS-IS** | Exported intentionally: it is the non-throwing read gate consumed by `whatsapp-config.query.ts` (and by `assertCanViewWhatsappConfig` internally) — the query needs a boolean check for viewer-tailored errors rather than an exception-only path. Export mirrors the existing pothos-helper pattern; removal would force duplication. |
| L5b | **Schema filename suffix** (noted-as-acceptable) | **LEFT-AS-IS** | Generated SDL/codegen filenames follow the repo's existing codegen output naming convention; renaming would churn generated artifacts and the codegen config with zero functional benefit. |
| L5c | **Nullable SDL default** (noted-as-acceptable) | **LEFT-AS-IS** | Intentional semantics, not an accident: `required: false` Pothos inputs → nullable SDL fields is exactly the omit-preserves / null-clears merge contract (documented in `4-outcome.md` §carry-forward item 8 and verified by service tests). Making fields `!` would break "omit = keep stored value". |
| L5d | **`outcome/4-outcome.md` SDL nullability doc note** (noted-as-acceptable) | **LEFT-AS-IS** | Documentation-only nuance in a historical, already-written outcome artifact; retro-editing past outcome docs would falsify the worklog record. The authoritative semantics are restated in L5c above and in `4-outcome.md` item 8 itself. |

---

## 2. Verification results

### 2.1 Service tests — `backend/services/whatsapp/test/whatsapp-config.service.test.ts`

- **First run: exit 1 — 25 pass / 1 fail** (`Tier 4 — no credential leakage > connection-test results and logs never leak the token or Meta internals`, 140 expect calls): the L1 serializer fix made the scan real and caught the raw `GraphApiError` (with Meta's `errorBody`, mock message containing `booooo`) being logged. **Fixed in the service** (see L1).
- **Final run: exit 0 — 26 pass / 0 fail, 140 expect() calls** (includes the new M1 empty-patch rejection test, run 3× total across fixes; ~1.7 s).

### 2.2 Repo tests — `backend/db/test/repo/whatsapp/whatsapp-config.repository.test.ts`

- **Final run: exit 0 — 16 pass / 0 fail, 71 expect() calls** (~1.4–1.75 s; re-run after each lint fix). By-id cleanup verified in-source; no full-table wipe outside the rolled-back tx.

### 2.3 Sanity greps

| Grep | Expected | Result |
|------|----------|--------|
| (a) `grep -c 'sql\`TRUE\`'` on repo test | 0 | **0** ✅ (wipe marker gone; only rollback-protected `isNotNull(id)` baseline reset remains, commented) |
| (b) `REQ-\|Task \|Phase \|\.ai/plans` across all 7 modified files | 0 matches | **0 matches in every file** ✅ (re-verified after all finisher edits) |
| (c) env-mapping single source | no local duplicates | **Service + seeder both import `WHATSAPP_CONFIG_ENV_SOURCES` from `@/backend/lib/whatsapp-constants`** ✅; repo-wide grep for local `const CONFIG_ENV_SOURCES` / `const WHATSAPP_CONFIG_ENV_SOURCES`: only the constants definition remains. Consumption recorded in M2. |

### 2.4 Quality loop — per-file lifecycle (`scripts/health/sub-loop.ts`)

Environmental note: **CodeScene step fails on every file with `Executable not found in $PATH: "cs"`** (CLI installer reports success but the binary is never linked) — confirmed environmental, matching prior tasks' history; per instruction the `--lifecycle biome` fallback is the recorded pass.

| File | codescene lifecycle (tsgo → oxlint → biome:check → lint:type-aware → duplicates → cs) | biome fallback (tsgo → oxlint → biome:check) |
|------|--------------------------------------------------------------------------------------|-------------------------------|
| `backend/lib/whatsapp-constants.ts` | 5/6 ✅, cs ✗ (env) | ✅ exit 0 |
| `backend/db/seeds/whatsapp/seed-whatsapp-config.ts` | 5/6 ✅, cs ✗ (env) | ✅ exit 0 |
| `backend/graphql/mutation/whatsapp/whatsapp-config.mutation.ts` | 5/6 ✅, cs ✗ (env) | ✅ exit 0 |
| `backend/types/whatsapp/whatsapp-config.types.ts` | 5/6 ✅, cs ✗ (env) | ✅ exit 0 |
| `backend/services/whatsapp/whatsapp-config.service.ts` | 5/6 ✅, cs ✗ (env) | ✅ exit 0 |
| `backend/db/test/repo/whatsapp/whatsapp-config.repository.test.ts` | 5/6 ✅, cs ✗ (env) — after fixes (was: 3 oxlint warnings → 1 type-aware error) | ✅ exit 0 |
| `backend/services/whatsapp/test/whatsapp-config.service.test.ts` | 5/6 ✅, cs ✗ (env) — after fixes (was: 2 oxlint warnings + 2 errors, 2 type-aware errors) | ✅ exit 0 |

**Real issues found and fixed during the loop (finisher):**

1. `whatsapp-config.repository.test.ts` — oxlint: `no-await-in-loop` ×2 (by-id delete / snapshot-restore loops → `Promise.all`, safe: distinct PKs, `onConflictDoNothing`), `unicorn/consistent-function-scoping` ×1 (`snapshotConfigRows` hoisted to module scope). Type-aware: `drizzle/enforce-delete-with-where` on the rollback-protected baseline reset → explicit `.where(isNotNull(whatsappConfigs.id))` with rationale comment (chose `isNotNull` over the legacy `sql\`TRUE\`` marker so sanity grep (a) stays 0).
2. `whatsapp-config.service.test.ts` — oxlint: `no-unnecessary-type-assertion` ×2 + `no-base-to-string` ×2 in `serializeForScan` (dropped redundant `as object` casts; `String(value)` fallbacks → `"[unserializable]"` marker). Type-aware: `sonarjs/no-nested-conditional` (fetch-mock URL ternary → `requestUrlOf()` helper), `sonarjs/prefer-specific-assertions` (`expect(token).toHaveLength(48)`).
3. `whatsapp-config.service.ts` — the Tier-4 leak fix described in L1 (loggable-error projection for `GraphApiError`).

Both suites were re-run green after every code change (§2.1/§2.2 final counts are post-fix).

---

## 3. Verdict

**R1 gate: PASS (with 1 environmental exception).** All 3 MEDIUM findings fixed and covered by tests; 4 of 5 LOW findings fixed; the 4 remaining items are the explicitly noted-as-acceptable set (L5a–L5d) with reasons recorded above. Both test suites exit 0 (service 26/0, repo 16/0), all three sanity greps clean, and all 7 files pass tsgo + oxlint + biome:check + lint:type-aware + duplicates; only the CodeScene CLI step is blocked by the environment (`cs` missing from PATH — pre-existing across tasks 4–6, not introduced by this work). No secrets leak through results or logs (Tier-4 suite green after the loggable-error projection). Uncommitted diff remains in place; no commits, no branch switches, no plan-artifact references in source files.
