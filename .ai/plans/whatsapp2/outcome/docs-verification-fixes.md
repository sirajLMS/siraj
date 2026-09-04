# WhatsApp Docs-Verification Fixes — Applied Corrections

- **Date**: 2026-09-04
- **Basis**: `docs-verification-coexistence.md` (A4, F9, O), `docs-verification-multi-number.md` (C2/C3/C7, D-table, B6, F2, E6), `docs-verification-webhooks.md` (W4, W5, W10, W11).
- **Files corrected**: `specs.md`, `implementation.md`, `trackable-tasks.md`, `deferred-items.md`, `outcome/docs-research-coexistence.md`, `outcome/docs-research-multi-number.md`. Verification reports themselves are historical records and were NOT modified.

## 1. Embedded Signup v4 activation (A4 / report §O)

`version: 'v4'` is not a valid `extras.version` value (allowed: `v4-public-preview, v3-public-preview, v2-public-preview, v3, v2`); v4 is activated by the v4 Facebook Login for Business Configuration (`config_id`). All `FB.login` snippets now use `extras: { setup: {}, featureType: 'whatsapp_business_app_onboarding' }` with no `version` key:

- `specs.md` Req 4.1 — extras rewritten + activation note.
- `implementation.md` Component 3 step 1 — same fix.
- `outcome/docs-research-coexistence.md` §1: version-table bullet (line 9) and "Implementation mechanics" snippet both corrected.

## 2. Media expiry: 7 days, not 14 (F9 / W11)

Webhook-delivered media asset IDs expire after **7 days** (`business-phone-numbers_media.md`); the 14-day figure is only the history follow-up eligibility window (media messages sent ≤14 days before onboarding receive a follow-up webhook; older media stays `media_placeholder` forever).

- `specs.md` Req 6.5 — fetch/store within 7 days of webhook receipt.
- `specs.md` Req 8.4 — expiry notice at >7 days since the media webhook.
- `specs.md` EC-8 / EC-9 — reframed to the eligibility vs fetch-window split.
- `specs.md` Technical Constraints — media bullet rewritten.
- `implementation.md` D8 — rewritten ("History media handling (7-day fetch window)"); Component 7 thread-view expiry wording updated.
- `trackable-tasks.md` 7.3 — semantics updated.
- `outcome/docs-research-coexistence.md` §3a media bullet + §Key-implications item 3 updated.

## 3. `business_capability_update` parsing (C2/C3/C7)

- `implementation.md` Component 6 — tolerant parsing: accept `max_daily_conversations_per_business` as `TIER_*` strings OR integer-style values; parse legacy `max_daily_conversation_per_phone` on webhooks <v24.0; `max_phone_numbers_per_business`/`max_phone_numbers_per_waba` are conditionally included — absence is not "no cap".
- `specs.md` Req 7.5 — same requirements expressed as EARS.
- `trackable-tasks.md` 7.5 — task text carries all three parsing mandates.

## 4. Graph API version default → v25.0 (F2)

- `implementation.md` decision-summary item 6, Component 1 `resolveGraphApiVersion`, and D6 — default is now `v25.0` (DB-overridable via `env::` settings; v23.0 remains valid). D6's stale "Re-verification (2026-09-14)" target note folded into a proper decision.
- `specs.md` Req 3.4 — default `v25.0`.
- `trackable-tasks.md` 4.2 — default `v25.0`.
- `outcome/docs-research-multi-number.md` implication 7 — updated to record the v25.0 plan default.

## 5. Additions

- **5a / 130429**: added to `implementation.md` Error Handling matrix (send above current per-number throughput ceiling → throttle/defer).
- **5b / coexistence 20 msg/s**: `implementation.md` Component 1 notes coexistence numbers are fixed at 20 msg/s (not the 80 msg/s default) per `throughput.md`; `specs.md` constraints already carried this note.
- **5c / account-model Phase 3**: `deferred-items.md` D11 — H1 2028 endpoints require WAAC IDs in URL paths; Phase 1/2 timeline + `paid_messaging_account_id` 2026-12-31 alias deadline recorded.
- **5d / `PARTNER_REMOVED`**: handled in-plan (not deferred): `implementation.md` Component 6 bullet + `specs.md` Req 7.6 — record `disconnection_info.reason` (`ACCOUNT_DISCONNECTED`, `BUSINESS_DOWNGRADE`, `CHANGE_NUMBER`, `COMPANION_INACTIVITY` ~30d, `PRIMARY_INACTIVITY` ~14d, `USER_RE_REGISTERED`), mark account inactive, audit + Numbers-tab warning; `trackable-tasks.md` 7.5 covers it.

## 6. Webhook ack-timing wording (W4)

No documented numeric ack timeout exists for messaging webhooks (the ~20s figure is calling-FAQ-only). `specs.md` NFR Performance and `implementation.md` Performance now state <1s/<200ms as OUR design targets, with Meta's documented retry policy (immediate, then decreasing frequency for up to 7 days) noted.

## 7. 1MB body-cap assumption (W5)

Kept as an explicitly-flagged assumption with the required mitigation ("verify against a real history sync during onboarding rehearsal; raise if a real chunk approaches it") in both `implementation.md` Component 5 notes and `specs.md` Assumptions.

## Consistency pass

Greps for `version: 'v4'`, `at most 14`, `14d`, `v23.0`, "Meta requires … ack" across the plan directory return only (a) the verification reports quoting the old claims (historical, intentionally untouched) and (b) corrected occurrences stating the new rules.
