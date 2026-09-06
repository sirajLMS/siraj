# Mid-Point Review R1 — whatsapp2 (post Phases 0–10, pre-frontend)

Three parallel reviews (backend, types, config) over the Phase 1–10 backend surface.
Verdicts: backend **PASS-WITH-FIXES**, types **PASS-WITH-FIXES**, config **PASS-WITH-FIXES**.

## Backend review findings → dispositions

| # | Sev | Finding | Disposition |
|---|---|---|---|
| 1 | HIGH | `setUserWhatsappOptIn` allowlist filter always false → whatsapp opt-in no-op since v1 | **FIXED** (absent allowlist entry ⇒ all-channels; tests prove suppression) — pre-existing v1 bug, fixed in-plan, no deferral |
| 2 | LOW | Dead template allowlist entries (CLASS_ACTIVATED, LESSON_REPORT_*) | Documented v1 carryover (5-routing-outcome); left |
| 3 | MEDIUM | `claimBatch` claim race (stays PENDING → re-claim) | **FIXED** — new `PROCESSING` status, claim flips atomically, stale-PROCESSING reclaim via backoff sweeper; migration `43-whatsapp-webhook-event-processing.sql` applied dev+test |
| 4 | MEDIUM | `batchResolveEventTypes` swallows DB failure → silent status loss | **FIXED** — lookup failure propagates/retries; "no row" still skips |
| 5 | LOW | payloadHash check-then-act without unique constraint | Deferred **D12** (app-side window + idempotent downstream upserts) |
| 6 | LOW | `// __NEXT2__/3__` scaffold markers | **FIXED** (swept at fix time; one known leftover in `whatsapp-embedded-signup.test.ts` — owned by Phase 14 cleanup) |
| 7 | MEDIUM | `enqueuePostOnboardingSync` tx accepted → Meta POST inside tx | **FIXED** — tx param removed; POSTs never inside a tx |
| 8 | LOW | Concurrent enqueue double-POST | Hardened/documented; `recordRequestId` `IS NULL` guard + unique `(accountId,syncType)` net verified |
| 9 | LOW | `completeEmbeddedSignup` 23505 raw Drizzle error | **FIXED** — wrapped into localized `WhatsappEmbeddedSignupError` |
| 10 | LOW | `getServerTranslations("en")` hardcode in sync service | Partially fixed: caller locale plumbed from signup; sweeper keeps `"en"` default → deferred **D13** |
| 11 | LOW | `decryptField` double-decrypt on `encryptedText` columns | **FIXED** — single convention (fromDriver decrypts; no extra decryptField calls) |
| 12 | LOW | deep import bypassing services barrel | **FIXED** |
| 13 | LOW | dead `deletedAt` on conversations | **FIXED** — `notDeleted()` filter on all reads + `softDelete()` repo method |
| 14 | LOW | `hasChunk` probe unindexed | **FIXED** — composite `(account_id, phase, chunk_order)` index, pushed to dev+test |

## Types review findings

- [MEDIUM] `WhatsappAccount` pothos object doesn't expose purpose/syncStatus and the purpose mutation result doesn't return purpose → **intentional phase deferral** (9-graphql-outcome carry-forward); **Phase 11.1 owns the fix** (fragment extension + one-line pothos exposes + schema/codegen).
- [LOW] `"add"|"remove"` contact-sync action union duplicated 3× → consolidate on canonical type later (non-blocking).
- [LOW] some exported webhook unions currently unused (documentation value) — accepted.
- All naming/barrel/coercion/enum checks clean.

## Config review findings

- [MEDIUM] `WHATSAPP_WEBHOOK_BASE_URL` missing from `WHATSAPP_ENV_CONFIG_KEYS` reset invalidation → **FIXED** + regression test.
- Everything else (env pairing, migration two-phase shape + grants, cron registration, route auth, dialect-aware schema) verified clean.

## Fix-wave verification

Cluster A (webhook): 13/13 repo, 45/45 handler, 24/24 route, 17/17 ingest, 9/9 schema. Cluster B (account/sync): 16/16 optin, 26/26 coexistence, 15/15 embedded-signup, 32/32 channel, 14/14 pair-rate-limit. Cluster C (repos/schema): 15/15 conversation repo, 9/9 schema. Cluster D (env-config): 32/32 channel. All sub-loop codescene exit 0.

## Deferred ledger after R1

D12 (payloadHash unique constraint), D13 (sweeper locale propagation). All others remain 📋 backlog/future as authored.
