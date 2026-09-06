# Post-Implementation Review — whatsapp2 (post Phases 0–14 + frontend wave)

- **Date**: 2026-09-06
- **Task recording**: written during Phase 15 (knowledge propagation); source: the post-implementation review wave over the frontend surface + `midpoint-review-R1.md`.

## Frontend review (Numbers/Inbox/ES surfaces)

**Verdict: PASS-WITH-FIXES** — 1 HIGH + 7 MEDIUM/LOW, **ALL FIXED** in the wave.

| Sev | Finding | Fix landed |
|---|---|---|
| HIGH | Raw GraphQL enum strings rendered as user-facing labels for purposes (untranslated `STUDENTS`/`ADVERTISING`/`GENERAL`) | Localized via shared helper: `getPurposeLabel` / `getPurposeLabelKey` / `getPurposeOptions` in `frontend/common/views/dashboard/settings/whatsapp/whatsappPurposeOptions.ts`, consumed by the purpose chip, selects, and inbox account filters |
| MEDIUM | Dialog retry/back affordances missing localized keys | New i18n keys: `embeddedSignupRetry` (whatsapp namespace), `retry` + `back` (whatsappInbox namespace), en+ar, snapshots regenerated |
| MEDIUM | Stale plan-reference comments left in shipped components | Swept — comments now describe behavior, not plan tasks |
| MEDIUM | Sync badge had an unsafe/failing fallback for unknown values | `getWhatsappSyncStatusBadgeConfig`/`getSyncStatusLabelKey` default to the neutral `syncStatusNotStarted` state |
| MEDIUM | Back arrow in the mobile thread pane points the wrong way under RTL | `ConversationThread.tsx` flips `ArrowBackOutlined` via `transform: scaleX(-1)` when `theme.direction === "rtl"` |
| MEDIUM | ES session-message listener accepted messages from any origin | `useEmbeddedSignupSession.ts` gates on `event.origin === "https://www.facebook.com"` before parsing `WA_EMBEDDED_SIGNUP` payloads |
| LOW | Inbox polling kept firing on hidden backgrounds tabs | `useWhatsappInboxViewModel.ts` tracks `document.hidden` (`visibilitychange`) and passes `pollInterval: 0` while hidden |
| LOW | Minor label/record-lookup nits | Folded into the same wave (Record-based label maps, no enum casts) |

## Mid-point R1 confirmation (backend/types/config, post Phases 0–10)

Verdicts were `PASS-WITH-FIXES` in all three tracks; every fix reported there is
verified landed (see `midpoint-review-R1.md` + Phase 14 green evidence):

- [x] **Opt-in allowlist no-op (HIGH)** — absent allowlist entry now means all-channels; suppression proven by tests.
- [x] **claimBatch race (MEDIUM)** — PROCESSING status flips atomically on claim; stale reclaim via backoff sweeper; migration `43-whatsapp-webhook-event-processing.sql`.
- [x] **Meta POST inside tx (MEDIUM)** — tx param removed from `enqueuePostOnboardingSync`; POSTs run outside transactions.
- [x] **`batchResolveEventTypes` swallowed DB failures** — propagate/retry; "no row" still skips.
- [x] **23505 raw drizzle error from `completeEmbeddedSignup`** — wrapped in `WhatsappEmbeddedSignupError`.
- [x] **double-decrypt on encryptedText**, **deep import bypass**, **dead `deletedAt` on conversations** (+ `notDeleted()` filters), **`hasChunk` unindexed probe** (composite index), **scaffold markers swept** — all fixed.
- [x] **Config**: `WHATSAPP_WEBHOOK_BASE_URL` added to the reset-invalidation set + regression test.
- **Deferred by decision (not lost)**: D12 (payloadHash unique constraint), D13 (sweeper locale English fallback for request-locale-less cron), D14 (template-map reachability gap) — all logged in `deferred-items.md` with rationale.

## Residual state after the wave

- No open review findings; `deferred-items.md` carries only 📋/D-items with rationale (Phase 14 verified zero blocking markers).
- Journey + 306-suite quality gate (`14-quality-outcome.md`) green after all fixes.
