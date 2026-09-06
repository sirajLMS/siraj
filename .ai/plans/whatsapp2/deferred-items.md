# Deferred Items Ledger — whatsapp2

**Feature:** whatsapp2 (Multi-Number + Coexistence)
**Plan:** `.ai/plans/whatsapp2/`
**Created:** 2026-09-04

## Purpose

Pre-existing gaps and stakeholder-excluded scope that this plan will NOT fix. Items use 📋 when intentionally out of scope for this plan (not blocking); ❌/⚠️ are reserved for in-plan deferrals (none at authoring time).

## Ledger Table

| ID | Deferred Item | Source | Target | Status | Notes |
|---|---|---|---|---|---|
| D1 | `whatsappTemplates` query resolver (templates tab reads sync-mutation transient snapshot only) | inventory-frontend §7 | future plan | 📋 Pre-existing | v1 gap; not caused or worsened by whatsapp2 |
| D2 | Opt-in audit/history resolvers (hardcoded placeholder arrays in `WhatsappTabPanels.tsx:163-172`) | inventory-frontend §3/§7 | future plan | 📋 Pre-existing | independent of inbox work |
| D3 | Groups API support | stakeholder non-goal | none (Meta-blocked for coexistence numbers) | 📋 Backlog | Meta: "Groups are not available for WhatsApp Business app phone numbers" |
| D4 | Marketing Messages API | stakeholder non-goal | future plan | 📋 Backlog | |
| D5 | Calling / SIP | stakeholder non-goal | none | 📋 Backlog | |
| D6 | Free-text (non-template) outbound v2 / BL4 | stakeholder non-goal | future plan | 📋 Backlog | 24h CSW rules documented in docs-research-coexistence §6 for later |
| D7 | Inbox reply composer (`WHATSAPP_INBOX_MANAGE` reserved) | stakeholder "eventually" | future plan | 📋 Backlog | Inbox ships read-only; CSW tracking hook (`messages` inbound timestamps) already persisted to enable it later |
| D8 | Polling vs realtime inbox updates (WebSocket/subscriptions) | implementation D-note | future plan | 📋 Backlog | v1 uses refetch-on-focus + interval polling |
| D9 | Per-process concurrency guard is process-local (MAX_CONCURRENT_CALLS not cluster-wide) | implementation Component 1 | future plan | 📋 Backlog | Meta per-number throughput is authoritative; documented limitation |
| D10 | Stale table in `docs/services/whatsapp-cloud-api.md` (r3 2-HIGH note already fixed in code) | inventory-frontend §7 | Task 15.2 | 🔄 In Progress | Doc-only reconciliation, part of knowledge propagation |
| D11 | Account-model evolution Phase 3 (H1 2028): Meta endpoints will require WAAC IDs (not phone-number IDs) in URL paths | docs-research-multi-number / `account-model-evolution.md` | future plan | 📋 Backlog | Phase 1 GA H2 2026 (`messaging_account_id` optional); Phase 2 (H1 2027) requires it in multi-Messaging-Account scenarios; `paid_messaging_account_id` alias must be migrated by 2026-12-31 |
| D12 | Schema-level partial unique on recent `payloadHash` (`whatsapp_webhook_events`) | mid-point review of 7-webhook | future plan | 📋 Backlog | The 5-minute exact-replay window is guarded app-side (route skip via `existsRecentByHash`); concurrent same-body POSTs are theoretically possible but downstream upserts (wamid / contact LWW / chunk keys) are idempotent, so a duplicate row is processed harmlessly. A declarative DB-level unique over a sliding time window is not expressible; deferred rather than shipped as a mis-fitting migration |
| D13 | Sweeper-context locale for `enqueuePostOnboardingSync` NotFoundError stays English | mid-point review fix (findings 2/5) | future plan | 📋 Backlog | Onboarding call sites now pass the caller's localized `ErrorsLabels`; the cron sweeper has no request locale so its (log-only) NotFoundError falls back to `getServerTranslations("en")`. If a future caller surfaces this error to a user, thread `ctx.tErrors` through the resolver at that point |
| D14 | Template-map reachability gap: `buildClassLifecyclePayloads` gates on `CLASS_LIFECYCLE_EVENTS` (which omits `CLASS_REMINDER`), and every other template-mapped event is dropped from the WhatsApp channel by `EVENT_CHANNEL_ALLOWLIST` | discovered while authoring Phase 13 journey (needed a real map-driven dense payload) | future plan | 📋 Pre-existing | Net effect: no template-map event currently reaches real WhatsApp sends via the cron fan-out path (CLASS_REMINDER returns `[]`). Routing itself is fully proven by the journey driving the real template map through `dispatchWithPreferences`; closing the gap is a builders/allowlist fix, not a routing fix |

## Enforcement

Final gate (Task 14.1) re-counts ❌/⚠️ (must be 0). 📋 items are deliberately out of scope and remain.
