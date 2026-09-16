# Round R4 (Iteration-4) Review Outcome — Aggregated Findings & Fixes

- **Task ID:** round-R4-fix (iteration-4 fix subagent)
- **Branch:** `feat/whatsapp_page_config_tab` — HEAD at task start `ed508136c`
- **Scope:** Fixed the aggregated iteration-4 findings (1 CRITICAL build-break, 2 LOW). Surgical changes only — **no commits, no branch switches, no plan-artifact references in source files.**

---

## 0. Verification-integrity lesson (R3 carry-forward)

The CRITICAL finding below was introduced by the R3 F-3 edit and survived R3's verification because the per-file biome gate was **claimed but not actually run on that file** (or its failure was not read): the edited file did not even parse (`TS1005: ':' expected` at 352:8 / biome `expected ':' but instead found '}'`), which any real `--lifecycle biome` run would have caught in seconds.

R4 found a **second instance of the same lesson**: at HEAD, `backend/services/system/test/environment-config.service.test.ts` (an R3-modified file, B-1/B-4) also failed the gate on pre-existing lines — an unused `makeTransientError` import (R3 residue) and a type-aware `TS2769` on `expect(result.updatedAt).toEqual(inTx?.updatedAt)` — both confirmed present at `HEAD~` via `git show HEAD:` before any R4 edit. R3's per-file gate claim for this file was likewise unsubstantiated.

**Process rule going forward:** every per-file biome gate claim must include the actual sub-loop exit code for THAT file in the same session as the edit; a claimed-but-unrun gate is a defect of the same severity as the finding it hides.

---

## 1. Aggregated findings — per-finding status

| # | Severity | Finding | Status | Approach / Resolution |
|---|----------|---------|--------|----------------------|
| C-1 | CRITICAL (build-breaking) | `WhatsappConfigTabContent.tsx` (~173 + closing ~352): the R3 F-3 edit changed the render gate to `) : config ? (` but never added the terminating else branch — `TS1005: ':' expected` at 352:8 / biome `expected ':' but instead found '}'`; the file did not compile. | FIXED | Minimal one-token fix at line 352: `)}` → `) : null}`. The ternary chain is now `vm.loading && !config ? (spinner) : config ? (form) : null` — form renders ONLY when `config` is present; the alert+retry block (`vm.queryError && !vm.loading`) remains its own conditional above the chain, so the alert-only state (`queryError && !loading && !config` → alert, nothing else) is preserved exactly as R3 F-3 intended. Verified: `--lifecycle biome` exit 0 (tsgo parse/type pass = compile smoke, oxlint ✅, biome:check ✅). |
| L-1 | LOW (documented contract not real) | `environment-config.service.ts` `auditEnvConfigChange`: the R3 B-3 JSDoc claimed an in-tx audit failure aborts the caller's tx, but the code swallowed on BOTH paths (runtime-verified). The documented fail-safe ("audited mutation commits with its audit row or not at all") was false. | FIXED | In the catch: log, then `if (tx !== undefined) throw error;` — in-tx audits now rethrow into the caller and abort the transaction (fail-safe is real); the no-tx path stays best-effort (logged, swallowed). JSDoc rewritten to state BOTH modes precisely (WITHOUT tx: logged + swallowed, post-hoc side effect; WITH tx: logged + rethrown, aborts the caller tx). Sibling JSDoc in `whatsapp-config.service.ts` `propagateEnvConfigOverrides` (~218-229) updated: propagation ALWAYS passes the save tx, so the in-tx abort contract applies there (old text wrongly said "best-effort, never thrown"); only the sibling env-tab no-tx path is best-effort. Tests added (see §2). |
| L-2 | LOW (pre-existing surface, R3-relevant) | `environment-config.pothos.ts` `handleEnvConfigServiceError`: unknown errors were rethrown raw (`throw error;`); drizzle `DrizzleQueryError.message` embeds bound params (plaintext override value on an `upsertSetting` failure) → secret echo through the GraphQL error response. | FIXED | Unknown/unrecognized errors are now projected before rethrow (mirroring the whatsapp service's `toLoggableDbError` philosophy): new `toSafeErrorProjection` keeps ONLY stable identifiers — error class `name` + first string `code` from the error or its driver `cause` — and unconditionally drops message/params/detail. The resolver throws the existing localized convention (`GraphQLError(tErrors.internalServerError, { extensions: { code: "INTERNAL_SERVER_ERROR", errorName, errorCode? } })`) and the raw error is deliberately NOT attached as `originalError`/`cause` so it cannot leak through error serializers. `EnvConfigServiceError` pass-through unchanged (localized message + stable domain code). Projection logged via `logger` (`@/backend/lib/logger` — the standard sibling-imported logger; the file had none before, so the import was added) with NO params. Test added (see §2). |

### Incidental gate repairs (same files, required to make the gate real)

- `environment-config.service.test.ts`: removed the R3-residue unused `makeTransientError` import; reflowed the pre-existing R3 B-4 assertion to `expect(inTx?.updatedAt).toEqual(result.updatedAt)` (same symmetric equality, type-clean); rejection/resolution assertions use the repo idiom (`expectRejection`/`messageOf` helpers) instead of `await expect(...).rejects/.resolves` (type-aware `await-thenable` violations).

---

## 2. Files modified

- `frontend/common/views/dashboard/settings/whatsapp/tabs/shared/WhatsappConfigTabContent.tsx` (C-1 — one token)
- `backend/services/system/environment-config.service.ts` (L-1 — tx-aware rethrow + both-mode JSDoc)
- `backend/services/whatsapp/whatsapp-config.service.ts` (L-1 — sibling JSDoc alignment only; no logic change)
- `backend/services/system/test/environment-config.service.test.ts` (L-1 — 2 new tests; incidental gate repairs)
- `backend/graphql/pothos/system/environment-config.pothos.ts` (L-2 — unknown-error projection + logger)
- `backend/graphql/test/environment-config.error-mapping.test.ts` (NEW — L-2 suite, 4 tests)

---

## 3. Verification

### Quality gate — `bun run scripts/health/sub-loop.ts <file> --lifecycle biome` (tsgo + oxlint + biome:check per file)

| File | Result |
|---|---|
| frontend/common/views/dashboard/settings/whatsapp/tabs/shared/WhatsappConfigTabContent.tsx | exit 0 (first run at HEAD: exit 1, TS1005 352:8 — the C-1 break, reproduced then fixed) |
| backend/services/system/environment-config.service.ts | exit 0 |
| backend/services/system/test/environment-config.service.test.ts | exit 0 (first run: exit 1 — 5 errors, 3 pre-existing at HEAD, fixed in-file) |
| backend/services/whatsapp/whatsapp-config.service.ts | exit 0 |
| backend/graphql/pothos/system/environment-config.pothos.ts | exit 0 |
| backend/graphql/test/environment-config.error-mapping.test.ts | exit 0 (first run: exit 1 — 4 no-unsafe-type-assertion warnings, fixed via instanceof guard) |

CodeScene remains an environmental ceiling (`cs` executable not in $PATH — same as every prior round).

### Suites — `bun run test/scripts/run-test.ts`

| Suite | Result |
|---|---|
| backend/services/system/test/environment-config.service.test.ts | exit 0 — **11 pass / 0 fail** (9 prior + 2 new audit-contract tests), 30 expect() |
| backend/graphql/test/environment-config.error-mapping.test.ts (NEW) | exit 0 — **4 pass / 0 fail**, 24 expect() |
| backend/services/whatsapp/test/whatsapp-config.service.test.ts | exit 0 — **53 pass / 0 fail** |
| backend/graphql/test/whatsapp-config.auth-scopes.test.ts | exit 0 — **6 pass / 0 fail** |
| frontend/common/graphql/test/whatsapp/whatsapp-config.test.ts | exit 0 — **10 pass / 0 fail** |
| app/api/webhooks/whatsapp/route.test.ts | exit 0 — **24 pass / 0 fail** |
| backend/services/system/test/environment-config-cold-start.test.ts (bonus regression, imports the modified service) | exit 0 — **5 pass / 0 fail** |

Total: 109 pass / 0 fail across 7 suites (incl. the bonus regression).

### New test pins

- L-1: `auditEnvConfigChange` with tx, audit write rejecting → **rejects** ("audit write failed" surfaces into the caller; aborted tx persisted nothing — fail-safe "or not at all"); without tx, audit write rejecting → **resolves** (swallowed, best-effort). The pre-existing in-tx success/rollback test remains green against the real AuditService.
- L-2: service-shaped drizzle error (`DrizzleQueryError` with `params: [SECRET_MARKER]`, wrapper message embedding the marker, cause code `23505`) → thrown `GraphQLError.message === tErrors.internalServerError`, **no marker** in message/extensions/serialized surface, no `originalError`/`cause` attachment, extensions carry only `errorName`/`errorCode`, and the logger line contains the projection but **not** the marker. Plus: `EnvConfigServiceError` pass-through pinned for both codes; non-Error primitive → stable `UnknownError` projection.

### Sanity

- Plan-artifact grep (`REQ-|Task [0-9]|Phase [0-9]|.ai/plans|round-R`) over all 6 touched files: **0 matches**.
- `git status`: only the 6 files above (5 modified + 1 new) plus the pre-existing baseline (`bun.lock`, `Caddyfile`, `.ai/plans/*`) — `bun.lock` untouched by R4.

---

## 4. Left as-is (recorded)

- None new. Deferred rows D1–D7 from prior rounds unchanged. Note: `executeEnvConfigMutation` audits WITHOUT tx (post-hoc side effect, swallow contract — intended for the env-tab path); the in-tx fail-safe applies to the whatsapp write-through, which passes its save tx.

---

## 5. Verdict

The CRITICAL build-break is closed: the frontend tab file parses, type-checks, and renders per the intended R3 F-3 semantics (form only with config; alert-only state preserved). Both LOWs are closed with their contracts now enforced AND test-pinned: the audit fail-safe is real (in-tx audit failure aborts the caller's transaction; no-tx stays best-effort), and the env-config resolver can no longer echo drizzle-bound parameters (secrets) through GraphQL errors. 6/6 touched files pass the full biome lifecycle; 109/109 tests green across 7 suites. The R3 verification-integrity lesson is recorded in §0 with its second instance documented — per-file gate claims must be backed by actual exit codes in the edit session. Diff remains uncommitted.
