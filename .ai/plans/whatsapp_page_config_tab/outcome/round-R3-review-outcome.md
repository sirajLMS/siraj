# Round R3 (Iteration-3) Review Outcome — Aggregated Findings & Fixes

- **Task ID:** round-R3-fix (iteration-3 fix subagent)
- **Branch:** `feat/whatsapp-page-config-tab` — HEAD at task start `83684b765`
- **Scope:** Fixed the aggregated iteration-3 findings (1 HIGH chain, 7 LOW, 3 INFO/SUGGESTION) from the independent reviewers. Surgical changes only — **no commits, no branch switches, no plan-artifact references in source files.**

> STATUS: SKELETON — per-finding sections finalized as fixes land.

---

## 1. Aggregated findings — per-finding status

| # | Severity | Finding | Status | Approach / Resolution |
|---|----------|---------|--------|----------------------|
| H-1 | HIGH (chain) | `upsertEnvConfigEntry` + `deleteEnvConfigEntry` authScopes are bare `{ permission, notImpersonating: true }` maps — under the builder's default "any" strategy the permission scope is dead (runtime-confirmed: zero-permission context executes the resolver). | FIXED | Both env-config mutations $all-wrapped: `$all: { permission: AppPermission.SETTINGS_EDIT_ENV, notImpersonating: true }`. No tests asserted the buggy any-semantics; env-config suites green. |
| H-2 | LOW | Runtime PoC not pinned as regression tests. | FIXED | auth-scopes test extended 1 -> 6 semantic tests executing the real schema (zero-permission -> FORBIDDEN; impersonating super-admin -> FORBIDDEN; env-config denial). 6/6 green. |
| H-3 | INFO | Control-char regex only covers `\p{Cc}` — bidi overrides, zero-width, and line separators (`\p{Cf}`, U+2028/9) still pass. | FIXED | Control-char rejection extended to Cc + Cf + U+2028/U+2029 (bidi overrides, zero-width, line separators); boundary test updated. |
| B-1 | LOW | Tx-aware variants (`upsertEnvConfigOverride`/`deleteEnvConfigOverride`/`auditEnvConfigChange` with `tx`) untested. | FIXED | env-config service tests 6 -> 9: tx-aware variants pinned (in-tx visibility, rollback-proof semantics for override upsert/delete + audit). |
| B-2 | LOW | `propagateEnvConfigOverrides` audits with `priorValue: undefined` — prior-override state not recorded. | FIXED | Prior override value read in-tx and passed as priorValue (env-tab parity: created vs overwrote distinguishable); masking unchanged; test updated. |
| B-3 | LOW | `auditEnvConfigChange` JSDoc claims best-effort parity on the tx path, but an in-tx audit failure aborts the caller's tx. | FIXED | auditEnvConfigChange JSDoc now states the real in-tx contract (failure aborts caller tx -> save fails safe). |
| B-4 | INFO | `upsertEnvConfigOverride` fabricates `updatedAt: new Date()` instead of the `.returning()` row's value. | FIXED | upsertSetting timestamp restored from .returning() row; env-config tests green. |
| T-1 | LOW | `normalizeConfigInput` silently ignores unknown keys in the patch. | FIXED | normalizeConfigInput iterates patch keys generically; unknown key -> ValidationError; DB untouched. Test-pinned. |
| T-2 | SUGGESTION | `WhatsappConfigResolvedType` hand-writes the 7-field projection. | FIXED | WhatsappConfigResolvedType credential fields Pick-derived from $inferSelect; downstream derivations unchanged. |
| F-1 | LOW | `SecretTextField` Omits `slotProps` — no way to pass `maxLength` to the inner input. | FIXED | SecretTextField accepts htmlInput slot pass-through; ConfigSecretField wires maxLength 512 via frontend caps mirror. |
| F-2 | LOW | `useWhatsappConfigViewModel.onRetry` refetch rejection is unhandled (unhandled rejection). | FIXED | onRetry refetch rejection-safe (consistent with onSave). |
| F-3 | LOW | On `queryError && !loading && !config` the editable form still renders with an empty baseline. | FIXED | Failed initial load renders only error alert + Retry; editable form gated on config presence. |

---

## 2. Files modified

backend/graphql/mutation/system/environment-config.mutation.ts (H-1 $all-wrap), backend/graphql/test/whatsapp-config.auth-scopes.test.ts (H-2 semantic tests, 1 -> 6), backend/lib/whatsapp-constants.ts (H-3 pattern constant), backend/services/system/environment-config.service.ts (B-2 prior read, B-3 JSDoc, B-4 timestamp), backend/services/system/test/environment-config.service.test.ts (B-1, 6 -> 9), backend/services/whatsapp/whatsapp-config.service.ts (B-2 wiring, T-1 unknown-key, H-3), backend/services/whatsapp/test/whatsapp-config.service.test.ts (52 -> 53), backend/types/whatsapp/whatsapp-config.types.ts (T-2 Pick derivation), frontend/common/components/ui/input/secretTextField/SecretTextField.tsx (F-1 slot pass-through), frontend/common/views/dashboard/settings/whatsapp/tabs/shared/WhatsappConfigTabContent.tsx (F-1 wiring, F-3 form gate), frontend/common/views/dashboard/settings/whatsapp/useWhatsappConfigViewModel.ts (F-2), app/api/webhooks/whatsapp/route.test.ts (mock-surface sync: toEnvSettingDbKey).

---

## 3. Verification

| Suite | Result |
|---|---|
| backend/services/whatsapp/test/whatsapp-config.service.test.ts | exit 0 — 53 pass / 0 fail |
| backend/db/test/repo/whatsapp/whatsapp-config.repository.test.ts | exit 0 — 19 pass / 0 fail |
| backend/graphql/test/whatsapp-config.auth-scopes.test.ts (semantic) | exit 0 — 6 pass / 0 fail |
| backend/services/system/test/environment-config.service.test.ts | exit 0 — 9 pass / 0 fail |
| backend/services/system/test/environment-config-cold-start.test.ts | exit 0 — 5 pass / 0 fail |
| backend/services/whatsapp/test/whatsapp-coexistence-sync.test.ts | exit 0 — 26 pass / 0 fail |
| app/api/webhooks/whatsapp/route.test.ts | exit 0 — 24 pass / 0 fail (after toEnvSettingDbKey mock sync) |
| frontend/common/graphql/test/whatsapp/whatsapp-config.test.ts | exit 0 — 10 pass / 0 fail |
| backend/lib/env-config-keys.test.ts | exit 0 — 3 pass / 0 fail |

Total: 155 pass / 0 fail across 9 suites. Quality loop: biome-lifecycle fallback on all modified files (CodeScene/tsgolint environmental ceiling) — pass. One transient breakage found and fixed during verification: webhook route test's partial mock of @/backend/services/system lacked the new toEnvSettingDbKey export (mock-surface sync, same idiom as prior rounds).

---

## 4. Left as-is (recorded)

- **Repo-wide `scopeAuth.defaultStrategy: "any"` pre-existing architectural issue** — the schema builder never sets `defaultStrategy`, so every bare multi-key `authScopes` map across the repo (~45 sibling fields) grants on the first truthy scope. NOT fixed on this branch to avoid a repo-wide auth-semantics blast radius; logged as deferred row D7 (see deferred-items.md) targeting a repo-level security audit with the round-R3 pentest evidence.
- Symmetry INFO notes left as-is: generateWhatsappVerifyToken/testWhatsappConnection carry only WHATSAPP_CONFIG_MANAGE without notImpersonating — read-only operations, consistent with the query surface (recorded, no change).

---

## 5. Verdict

The HIGH-severity chain (pre-existing repo-wide 'any' default strategy letting any authenticated user write env::WHATSAPP_* overrides via the sibling env-config mutations) is CLOSED for this feature's credential surface: both env-config mutations are now $all-wrapped and runtime-verified FORBIDDEN for zero-permission contexts. All 12 R3 findings fixed (1 HIGH-chain, 6 LOW, 2 INFO + 2 frontend LOW + 1 suggestion); the repo-wide architectural issue is logged as deferred D7 for a dedicated security-audit task with runtime PoC evidence. 155/155 tests green across 9 suites. Feature-specific findings at HEAD are now documentation/hardening-class only.
