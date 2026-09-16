# WhatsApp Docs Verification — Multi-Number / Routing / Rate Limits / API Versioning

Independent re-check of `specs.md` + `implementation.md` + `docs-research-multi-number.md` against the indexed `whatsapp` docs library (Meta WhatsApp Business Platform docs). Compiled 2026-09-04. Verdicts: CONFIRMED / CONTRADICTED / NOT-FOUND-IN-DOCS.

## A. Registered-number limits, add/verify/register, deadlines

| # | Claim (plan/research) | Verdict | Evidence |
|---|---|---|---|
| A1 | New portfolios capped at **2** registered numbers; raised to **20** when business is verified or messaging limit 2,000 is reached; signalled via Meta Business Suite notification + `business_capability_update` webhook with `max_phone_numbers_per_business` | CONFIRMED | `business-phone-numbers_phone-numbers.md` ("Registered number cap" — verbatim); also `whatsapp-business-accounts.md` Limitations |
| A2 | Partner docs also say "no limit to the amount of business phone numbers that can be onboarded to the Cloud API" | CONFIRMED | `solution-providers_get-started-for-solution-partners.md` (verbatim quote in the Business Phone Number asset row) |
| A3 | `POST /<PHONE_NUMBER_ID>/request_code` with `code_method` SMS/VOICE + `language`; system-user token; Advanced Access `whatsapp_business_management` for other businesses | CONFIRMED | `business-phone-numbers_phone-numbers.md` (Request Code API table). Note: docs describe `language` as two-character code ("en") but examples use `en_US` |
| A4 | `POST /<PHONE_NUMBER_ID>/verify_code` with `code` → `{success:true}` | CONFIRMED | `business-phone-numbers_phone-numbers.md` (Verify Code API) |
| A5 | Already-verified number → `request_code` returns HTTP 400, error **136024**; check `code_verification_status` first | CONFIRMED | `business-phone-numbers_phone-numbers.md` (verbatim) |
| A6 | Register via API only (`POST /<PHONE_NUMBER_ID>/register`, `{messaging_product:'whatsapp', pin}`); optional `data_localization_region`; not via WhatsApp Manager/App Dashboard | CONFIRMED | `business-phone-numbers_registration.md`; `local-storage.md` (register example with `data_localization_region: "IN"`) |
| A7 | **10 registration requests per number per 72-hour moving window**; 11th → error **133016** + number blocked from registering 72h; same limit and error for **deregister** | CONFIRMED | `business-phone-numbers_registration.md` Limitations (register and deregister sections, verbatim) |
| A8 | Deregister: cannot deregister a coexistence number; needs `whatsapp_business_management` else error **200**; does not delete number/history | CONFIRMED | `business-phone-numbers_registration.md` deregister limitations (verbatim) |
| A9 | Two-step verification mandatory for Cloud API (missing PIN = onboarding failure); PIN change via API `POST /<PHONE_NUMBER_ID> {pin}`; **no API to disable** 2FA (WhatsApp Manager only, sends email link) | CONFIRMED | `solution-providers_get-started-for-solution-partners.md` Step 5 warning; `business-phone-numbers_phone-numbers.md` "Disabling two-step verification" |
| A10 | Re-registering an already-registered number succeeds silently without resetting the PIN | CONFIRMED | `account-model-evolution.md` ("What stays the same", verbatim) |
| A11 | ES numbers **must be registered within 14 days** of the flow, else ES must be repeated | CONFIRMED | `solution-providers_get-started-for-solution-partners.md` "Embedded Signup users" note (verbatim) |
| A12 | (Addendum) After display-name approval you also have **14 days** to re-register the number; display names changeable 10×/30 days | CONFIRMED (extra) | `display-names.md` — plan doesn't use this; useful for Numbers-tab copy |

## B. Scoping: templates / messaging limits / quality / throughput / rate limits

| # | Claim | Verdict | Evidence |
|---|---|---|---|
| B1 | Templates are **WABA-scoped** (`GET/POST/DELETE /<WABA_ID>/message_templates`); no per-number template list | CONFIRMED | `templates_template-management.md`, `account-model-evolution.md` ("Template management endpoints remain on the Messaging Account"). WABA templates are sendable from any of the WABA's numbers via per-number `POST /<PHONE_NUMBER_ID>/messages` — this exact sentence is NOT stated verbatim in docs, but it is the structural consequence of WABA-scoped storage + per-number send endpoint; treated as CONFIRMED-by-design |
| B2 | Messaging limits **business-portfolio-level since 2025-10-07**; all numbers in a portfolio share one limit; tiers 250 → 2,000 → 10,000 → 100,000 → Unlimited; new (now-live) doc supersedes per-number limits | CONFIRMED | `messaging-limits.md` (portfolio-level, 250 start, tier ladder); `upcoming-messaging-limits-changes.md` ("Starting October 7, 2025… now live", changes table) |
| B3 | Legacy `max_daily_conversation_per_phone` / `messaging_limit_tier` / `current_limit` deprecated and **removed February 2026** | CONFIRMED | `messaging-limits.md` (deprecation of `messaging_limit_tier`); `webhooks_reference_business_capability_update.md` + `webhooks_reference_phone_number_quality_update.md` ("This parameter will be removed in February, 2026") |
| B4 | Quality rating is **per phone number**; values `GREEN`/`YELLOW`/`RED`/`NA`/`UNKNOWN`; legacy `Flagged` state removed; low quality no longer lowers the limit; portfolio scaling requires high quality across all numbers | CONFIRMED | `business-phone-numbers_phone-numbers.md` (`quality_rating` per number; examples show GREEN/NA/UNKNOWN); `upcoming-messaging-limits-changes.md` ("Flagged state is no longer possible… limit will not be downgraded"; automatic-scaling criterion "high-quality messages across all of your business phone numbers"); `solution-providers_get-started-for-solution-partners.md` |
| B5 | Throughput is **per phone number**: 80 msg/s default; auto-upgrade to 1,000 msg/s when portfolio limit is Unlimited + 100K unique users/24h + Medium+ quality; upgrade window ~1 min; API returns **131057** during it; webhook `phone_number_quality_update` `event: THROUGHPUT_UPGRADE` with `max_daily_conversations_per_business: TIER_UNLIMITED` | CONFIRMED | `throughput.md` (80/1000 mps, "upgrade can take up to 1 minute… returns error code 131057", webhook with `THROUGHPUT_UPGRADE`); `upcoming-messaging-limits-changes.md` (eligibility criteria) |
| B6 | (Addendum) **Coexistence numbers have fixed 20 mps** throughput | CONFIRMED (extra) | `throughput.md` "WhatsApp Business app phone numbers… fixed throughput of 20 mps" — relevant to v2: the coexistence number cannot burst at 80 msg/s; plan's routing implicitly assumes 80 msg/s only for pure Cloud API numbers |
| B7 | API rate limits **per app per WABA**: 200 req/h default → 5,000 req/h for active WABAs with ≥1 registered number, on the listed management endpoints (`/<WABA_ID>`, `assigned_users`, `phone_numbers`, `message_templates`, `subscribed_apps`, `CURRENT_STATUS_ID`) | CONFIRMED | `about-the-platform.md` Rate limits (verbatim figures) |
| B8 | **Pair rate limit** 1 msg/6s per (business number, user) pair (≈600/h); burst up to 45 messages per 6s "borrowing" future quota; violation → error **131056**; retry with 4^X backoff (X starts 0, +1 per failure) | CONFIRMED | `about-the-platform.md` "Pair rate limits" (verbatim 1 msg/6s, 45-message burst, 131056, 4^X) |
| B9 | Billing per WABA / Messaging Account; one payment method per Messaging Account serves all numbers; per-message pricing via status-webhook `pricing.pricing_model: 'PMP'` + `category` | CONFIRMED | `account-model-evolution.md` ("Each Messaging Account has its own payment method"; WABA ID = Messaging Account ID); `pricing.md` + `marketing-messages_pricing.md` (`pricing.pricing_model "PMP"` verbatim) |
| B10 | Display names are **per phone number** (`phone_number_name_update` webhook carries approval per number); OBA per number | CONFIRMED | `display-names.md` (webhook `decision: APPROVED` then re-register); `official-business-accounts.md` |
| B11 | Portfolios limited to **20 WABAs** | CONFIRMED (extra) | `whatsapp-business-accounts.md` Limitations |

## C. `business_capability_update` + `account_alerts` webhooks

| # | Claim | Verdict | Evidence / correction |
|---|---|---|---|
| C1 | Webhook carries `max_daily_conversations_per_business`, `max_phone_numbers_per_business`, `max_phone_numbers_per_waba`; `max_daily_conversation_per_phone` deprecated (removal announced Feb 2026) | CONFIRMED | `webhooks_reference_business_capability_update.md` syntax + parameters |
| C2 | (Research doc) `max_daily_conversations_per_business` values are `2000\|10000\|100000\|UNLIMITED` | CONFIRMED **with correction** | Docs are internally inconsistent: `messaging-limits.md` + `upcoming-messaging-limits-changes.md` describe integer-ish limit values (2000/10000/100000/UNLIMITED), but `webhooks_reference_business_capability_update.md` lists the field's values as **`TIER_250`/`TIER_2K`/`TIER_10K`/`TIER_100K`/`TIER_UNLIMITED`** (strings), while the deprecated `max_daily_conversation_per_phone` uses integers (`250/2000/10000/100000/-1`, -1 = unlimited). **Parser must accept both shapes.** |
| C3 | (Nuance) `max_phone_numbers_per_business` is only included when the portfolio's messaging limit is at the **initial 250**; `max_phone_numbers_per_waba` only when it is not 250 (example value 25) | CONFIRMED nuance | `webhooks_reference_business_capability_update.md` parameter rows. Plan's Component 6 ("store `max_phone_numbers_per_business`") is correct but must tolerate the field being **absent** once the portfolio leaves the 250 tier; don't interpret absence as "no cap change" |
| C4 | Triggers: WABA creation, WABA/portfolio capability increases **and decreases** | CONFIRMED | `webhooks_reference_business_capability_update.md` |
| C5 | Messaging-limit denials trigger `account_alerts` with `alert_type` ∈ `INCREASED_CAPABILITIES_ELIGIBILITY_DEFERRED`/`_FAILED`/`_NEED_MORE_INFO` | CONFIRMED | `messaging-limits.md` Denials table; `webhooks_reference_account_alerts.md` (same three types + `OBA_APPROVED`/`OBA_REJECTED`/`PROFILE_PICTURE_LOST`) |
| C6 | `phone_number_quality_update` carries `max_daily_conversations_per_business`; legacy `current_limit` values `TIER_50…TIER_UNLIMITED`/`TIER_NOT_SET` and `event` `ONBOARDING`/`THROUGHPUT_UPGRADE`; deprecated fields removed Feb 2026 | CONFIRMED | `webhooks_reference_phone_number_quality_update.md` (fetched full file) |
| C7 | (Version gating) `max_daily_conversations_per_business` arrives on **webhooks v24.0 and newer**; `max_daily_conversation_per_phone` is used for v23.0 and older until Feb 2026 | CONFIRMED + correction input | `messaging-limits.md` Approvals paragraph. Implication for plan D6: if Siraj runs webhooks at <24.0 the **new field may not arrive** — the plan's parser should read both fields, not assume the new one |

## D. Per-number send endpoint and error codes used in the plan

| Code | Claimed meaning in plan/research | Verdict | Evidence |
|---|---|---|---|
| — | Send: `POST https://graph.facebook.com/<VERSION>/<PHONE_NUMBER_ID>/messages` — per-number; no per-number API versions | CONFIRMED | `account-model-evolution.md` ("Messages API… continues to work the same"); every doc uses a single `<API_VERSION>` placeholder |
| 131056 | Pair rate limit exceeded (>1 msg/6s per number↔user) | CONFIRMED | `about-the-platform.md` Pair rate limits |
| 131057 | Number unavailable during throughput upgrade (~1 min) | CONFIRMED | `throughput.md` Higher throughput |
| 131026 | Message not deliverable (e.g., user on old app version); arrives via error/status webhook on the sending number | CONFIRMED | `calling_call-button-messages-deep-links.md` error note |
| 131047 | Re-engagement required (no 24h customer-service window) | CONFIRMED | `block-users.md` (`code: 131047`, "Re-engagement required", "User has not messaged in the last 24 hours") |
| 130472 | Marketing-experiment suppression: message not sent, not billed; `status: failed` webhook | CONFIRMED | `support_experiments.md` |
| 131036 | No-Storage delivery failure after retry TTL (devices) | CONFIRMED | `no-storage.md` Error webhooks |
| 133016 | 10-per-72h register/deregister limit exceeded; number locked 72h | CONFIRMED | `business-phone-numbers_registration.md` |
| 136024 | verification code already verified (request_code on verified number) | CONFIRMED | `business-phone-numbers_phone-numbers.md` |
| 200 | permission missing (e.g., no Advanced Access / lost `whatsapp_business_management`) | CONFIRMED | `solution-providers_get-started-for-solution-partners.md`, `solution-providers_manage-accounts.md`, `business-phone-numbers_registration.md` |
| 130429 | (Plan omits) throttle at current throughput level | CONFIRMED (extra; recommend adding) | `throughput.md` — sending above current throughput returns **130429**; plan tracks 131056 (pair) and 131057 (upgrade) but not 130429 (throughput ceiling) |

## E. Template sharing within a WABA + display-name + migration caveats

| # | Claim | Verdict | Evidence |
|---|---|---|---|
| E1 | Templates in one WABA are sendable from any number in that WABA; no per-number template duplication needed when adding a second number | CONFIRMED (by design; no verbatim sentence) | WABA-scoped template endpoints (`templates_template-management.md`) + per-number send. Docs never literally state "template usable from any number in the WABA", but nothing per-number exists |
| E2 | Template feedback webhooks (`message_template_status_update`/`_quality_update`/`_components_update`, `template_category_update`) are WABA-level | CONFIRMED | `solution-providers_manage-webhooks.md` subscription-fields table |
| E3 | Display-name approval is per number; after approval the number must be **re-registered** (before approval has no effect); `phone_number_name_update` webhook with `decision: APPROVED` | CONFIRMED | `display-names.md` Re-register section (verbatim) |
| E4 | Moving numbers between WABAs: only templates with `status: APPROVED` + `quality_score: GREEN` are duplicated to the destination WABA; duplicated templates start at `UNKNOWN` rating for the first 24h; un-duplicated templates must be re-created | CONFIRMED | `solution-providers_support_migrating-customers-off-solutions-via-embedded-signup.md` and `…-via-meta-business-suite.md` (verbatim) |
| E5 | Template limits per WABA: 250 (unverified portfolio) → 6,000 (verified + approved display name) | CONFIRMED | `templates_overview.md` Template limits. Note `whatsapp-business-accounts.md` stale line says "max 250 message templates per WABA" — overview doc supersedes |
| E6 | Account-model evolution: WAAC (per phone number) + Messaging Account (templates/billing, per partner); WABA IDs become Messaging Account IDs; `messaging_account_id` param optional at Phase 1 (GA H2 2026), required in multi-Messaging-Account scenarios at Phase 2 (H1 2027, new Graph API version), all Messages API versions require it at Phase 3 (H1 2028); `paid_messaging_account_id` deprecated alias — migrate by **2026-12-31**; Phase 3 also forces WAAC IDs in URL paths | CONFIRMED — plan is missing the Phase-3 path-ID cutover nuance | `account-model-evolution.md` (fetched full doc, incl. rollout table). Plan correctly notes the 2026-12-31 alias deadline but does not mention that at Phase 3 (H1 2028) **all endpoints targeting a phone-number ID path must use WAAC IDs** — worth tracking as a future migration item |
| E7 | Sending endpoint unchanged across versions (same paths/payloads); a number shared with multiple partners shares its throughput and messaging-limit across partners | CONFIRMED | `account-model-evolution.md` "What stays the same" |
| E8 | ("no limit" caveat) partner doc says no per-app onboarding limit, but per-portfolio cap (2 → 20) is the operative constraint for one WABA | CONFIRMED (research doc's qualification is accurate) | A1 + A2 |

## F. Graph API versioning (plan D6: hardcoded `v20.0` → env-config default `v23.0`)

| # | Claim | Verdict | Evidence / correction |
|---|---|---|---|
| F1 | `v23.0` exists and is a valid Graph API version to pin in the adapter | CONFIRMED | Docs actively use `v23.0` in live examples (`templates_template-management.md`, `catalogs_mpm-template-messages.md`, `pricing_change-billing-currency.md`) |
| F2 | Latest referenced version in the index | NOTES TO PLAN | Most current docs use **`v25.0`** as their example version (`about-the-platform.md`, `display-names.md`, `in-app-signup.md` with a dated 2026-06 sample, `qr-codes.md`); `v24.0` also appears (`marketing-messages_onboarding.md`). So v23.0 works but is ~2 majors behind the docs' current surface. Consider defaulting `WHATSAPP_GRAPH_API_VERSION` to **v25.0** unless helpers were validated against v23.0 specifically |
| F3 | No per-number/per-WABA API versioning — version is per-request from one app's Graph version | CONFIRMED (nothing per-number exists; version is `<API_VERSION>` placeholder in every URL) | consistent across all indexed docs |
| F4 | ES v2 deprecated **2026-10-15** → migrate to v4 | CONFIRMED | warning banner in `embedded-signup_bypass-phone-addition.md`, `embedded-signup_pre-verified-numbers.md`, `solution-providers_manage-accounts.md`, `solution-providers_manage-webhooks.md`, `embedded-signup_default-flow.md` |
| F5 | Webhook-format version gating: `max_daily_conversations_per_business` appears on **webhooks v24.0+**; v23.0 webhooks still send `max_daily_conversation_per_phone` | CONFIRMED — correction for D6/D7 | `messaging-limits.md` Approvals. Bumping the *send* version to v23.0 alone does not guarantee the new webhook field; parse both fields |

## G. Webhook subscription mechanics (plan D7: "field selection stays App-Dashboard-managed")

| # | Claim | Verdict | Evidence |
|---|---|---|---|
| G1 | Per-field subscription (`messages`, `history`, `smb_app_state_sync`, `smb_message_echoes`, `account_update`, …) is performed in the App Dashboard | CONFIRMED | `solution-providers_get-started-for-solution-partners.md` ("In the App Dashboard… click Manage… subscribe to individual webhook fields"); `embedded-signup_onboarding-business-app-users.md` Step 1 ("Navigate to the App Dashboard > WhatsApp > Configuration panel and subscribe your app to the following webhook topic fields") — coexistence doc is explicit and matches the plan's operational-prerequisite framing |
| G2 | `POST /<WABA_ID>/subscribed_apps` only attaches the app to the WABA (subscribe-to-event-stream); DELETE unsubscribes | CONFIRMED | `solution-providers_manage-webhooks.md`, `embedded-signup_onboarding-customers-as-a-solution-partner.md` |
| G3 | No documented API to subscribe to individual **fields** per WABA/app | NOT-FOUND-IN-DOCS for a per-field API (i.e., plan's claim that none exists holds) | No per-field subscription endpoint appears in the indexed docs; the Graph-level mechanism exposed for customization is **callback-URL override** (`webhook_configuration.override_callback_uri`) at WABA/phone-number level (`webhooks_override.md`), which changes *where* events are sent, not *which* fields |
| G4 | Available subscription fields include `history`, `smb_app_state_sync`, `smb_message_echoes`, `account_update`, `account_alerts`, `business_capability_update`, `phone_number_name_update`, `phone_number_quality_update`, `messages`, `message_template_*`, etc. | CONFIRMED | `solution-providers_manage-webhooks.md` full list (verbatim) |
| G5 | (Addendum) Duplicate webhook delivery is expected; exactly-once is not guaranteed | CONFIRMED (extra, supports ingest design) | `calling_faq.md`: "No. Be prepared to handle duplicate webhooks"; webhooks retried up to 7 days (`no-storage.md`) |
| G6 | (Addendum) Phone-number-level `webhook_configuration` field is readable via API (`GET /<PHONE_NUMBER_ID>?fields=webhook_configuration`) — supports plan's "validate at runtime, surface gaps" idea indirectly | CONFIRMED (extra) | `webhooks_override.md` Get phone number alternate callback |

## Summary counts

- **CONFIRMED: 34 claims** (A1–A12, B1–B11, C1, C3–C6, all 11 D-table rows, E1–E8, F1, F3, F4, G1–G6)
- **CONFIRMED-with-correction: 2** (C2 value-shape inconsistency → parser must accept `TIER_*` strings *and* integers; F5 webhook-version gating → parse old and new fields)
- **Advisory notes: 1** (F2 — v25.0 is the docs' current example version; v23.0 is valid but older)
- **CONTRADICTED: 0**
- **NOT-FOUND-IN-DOCS: 1** (G3: no per-field webhook-subscription API is documented — which *supports* plan D7's dashboard-only assumption rather than refuting it)

## Net corrections worth folding back into specs/implementation

1. **`business_capability_update.max_daily_conversations_per_business` shape** — accept both integer limits and `TIER_*` strings; Meta's own docs disagree (`messaging-limits.md` vs `webhooks_reference_business_capability_update.md`).
2. **Conditional field inclusion** — `max_phone_numbers_per_business` is documented as only present while the portfolio is on the 250-limit tier; don't treat absence as no-cap-change (C3).
3. **Webhook version ≥ v24.0** is required for the new `max_daily_conversations_per_business` field; the code should parse both old and new fields regardless of `WHATSAPP_GRAPH_API_VERSION` (C7/F5).
4. **Add 130429** (per-number throughput ceiling exceeded) to the error-handling matrix alongside 131056/131057 (D-table).
5. **Coexistence numbers have a fixed 20 msg/s throughput** (B6) — worth stating in the sync/throughput notes so admins don't expect 80 msg/s on coexistence numbers.
6. **v25.0 is the docs' current example version** (F2): default `v23.0` works, but consider v25.0 for the env default.
7. **Account-model evolution Phase 3 (H1 2028)** will require WAAC IDs (not phone-number IDs) in endpoint paths — add to deferred/future roadmap awareness (E6).
