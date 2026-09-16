# WhatsApp Docs Verification — Coexistence & Embedded Signup Claims

- **Scope**: Every Meta-platform factual claim in the coexistence / Embedded Signup (ES) domain from
  `.ai/plans/whatsapp2/specs.md` and `.ai/plans/whatsapp2/implementation.md`, cross-checked against the
  indexed `whatsapp` library in the docs MCP server (Meta WhatsApp Business Platform docs).
- **Cross-referenced against**: `.ai/plans/whatsapp2/outcome/docs-research-coexistence.md` (flagged where it
  diverges from the indexed docs).
- **Method**: `mcp__docs__search_docs` queries against the indexed `whatsapp` library; citations are the
  indexed doc filenames (e.g. `embedded-signup_onboarding-business-app-users.md`).
- **Date**: 2026-09-04.
- **Statuses**: CONFIRMED / CONTRADICTED / NOT-FOUND-IN-DOCS.

## Summary

- Total claims checked: **82** (sections A–L below)
- **CONFIRMED: 78**
- **CONTRADICTED: 2** — (A4) `extras.version: 'v4'` in `FB.login`; (F9) media asset IDs "fetchable for at most 14 days (Meta retention)"
- **NOT-FOUND-IN-DOCS: 2** — (L8) "per-number API versions are not a Meta concept" (unfalsifiable by docs; per-request versioning is what's documented); (E10) documented error codes for repeat/expired `smb_app_data` calls (none documented — this absence supports the plan's design, see note)

## A. ES versions & extras config

| # | Plan claim (source) | Status | Citation / correction |
|---|---|---|---|
| A1 | ES **v2 is deprecated 2026-10-15** (specs.md:33, 547; implementation.md migration section) | CONFIRMED | `embedded-signup_errors.md` warning banner: "Embedded signup v2 will be deprecated on October 15, 2026." |
| A2 | ES **v4 is current**; new work targets v4 (specs.md:33) | CONFIRMED | `embedded-signup_version-4.md` (release 2025-10-08, no end date); `embedded-signup_versions.md` |
| A3 | Coexistence trigger is `featureType: 'whatsapp_business_app_onboarding'` (v3+; renamed from v2's `coexistence`) (specs.md:123, 332; research doc §1) | CONFIRMED | `embedded-signup_version-3.md` ("Removing `coexistence`"); `embedded-signup_version-4.md` (coexistence "continues to be supported through the feature_type parameter") |
| A4 | `FB.login(..., { extras: { featureType: 'whatsapp_business_app_onboarding', version: 'v4' } })` (specs.md:123, implementation.md:196 Component 3) | **CONTRADICTED** | `embedded-signup_versions.md`: for **v4, `extras: {} // The extras object is purposely empty for v4`**; the documented `<VERSION>` enum is `v4-public-preview, v3-public-preview, v2-public-preview, v3, v2` — **plain `'v4'` is not a valid extras value**. v4 is activated automatically by the Facebook Login for Business **Configuration** (config_id) product selection, not by an extras version string. Correction: pass `featureType` (still valid in v4 per `embedded-signup_version-4.md`) but **omit `version: 'v4'`**; ensure the Login configuration selects the WhatsApp Business app onboarding product. |
| A5 | What puts you on v4 is creating a Facebook Login for Business Configuration that selects products (research doc §1) | CONFIRMED | `embedded-signup_version-4.md`: "Selecting the products will automatically set you to v4." |

## B. Session-logging (`WA_EMBEDDED_SIGNUP`) events & returned data

| # | Plan claim (source) | Status | Citation / note |
|---|---|---|---|
| B1 | Session-logging listener: `window` message event filtered by `event.origin` ending `facebook.com` and `data.type === 'WA_EMBEDDED_SIGNUP'` (specs.md Req4.1) | CONFIRMED | `embedded-signup_implementation.md` (Session logging message event listener snippet) |
| B2 | Success payload carries asset IDs `phone_number_id`, `waba_id`, `business_id` (plus optional ad accounts/pages/datasets/catalogs/IG/multi-WABA ids) | CONFIRMED | `embedded-signup_implementation.md` "Successful flow completion structure" |
| B3 | `FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING` payload **may contain only `waba_id`** (no `phone_number_id`) (specs.md:124) | CONFIRMED | `embedded-signup_onboarding-business-app-users.md` — success example shows `data: { waba_id }` only |
| B4 | `event` values: `FINISH`, `FINISH_ONLY_WABA`, `FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING`, `FINISH_OBO_MIGRATION`, `FINISH_GRANT_ONLY_API_ACCESS`, `ERROR` (specs.md Req4.2) | CONFIRMED | `embedded-signup_implementation.md` `<FLOW_FINISH_TYPE>` table |
| B5 | Abandonment = `event: 'CANCEL'` with `data.current_step` (e.g. `PHONE_NUMBER_SETUP`); user-reported errors add `error_message`, `error_code`, `session_id`, `timestamp` (specs.md Req4.2, EC-16) | CONFIRMED | `embedded-signup_implementation.md`; `embedded-signup_errors.md` (current_step screen table) |
| B6 | Both clicking **Finish** and **closing the popup on the final screen** count as success (specs.md CB, Req4.2) | CONFIRMED | `embedded-signup_implementation.md`: "both clicking Finish and closing the popup … are considered successful onboarding" |

## C. Token exchange & app review permissions

| # | Plan claim | Status | Citation / note |
|---|---|---|---|
| C1 | Server exchanges auth `code` via `GET https://graph.facebook.com/<ver>/oauth/access_token?client_id&client_secret&code` (specs.md Req4.3) | CONFIRMED | `embedded-signup_onboarding-customers-as-a-solution-partner.md`, `embedded-signup_onboarding-customers-as-a-tech-provider.md` |
| C2 | Result is a **business integration system user access token** ("business token") scoped to that customer (specs.md Req4.3) | CONFIRMED | `access-tokens.md` (Business integration system user access tokens section) |
| C3 | Partner app needs Advanced Access (App Review) for `whatsapp_business_management` + `whatsapp_business_messaging` | CONFIRMED | `solution-providers_app-review.md` (permissions table + Advanced access requirement for apps serving other businesses); `solution-providers_get-started-for-solution-partners.md` |
| C4 | Prerequisites: WhatsApp Business app **≥ 2.24.17**; partner must be **Solution Partner or Tech Provider**; **session logging mandatory**; `app_only_install` cannot be combined with coexistence (specs.md:335, research doc §1) | CONFIRMED | `embedded-signup_onboarding-business-app-users.md` (Requirements); `embedded-signup_app-only-install.md` ("App-Only Install can't be used to onboard WhatsApp Business app users") |

## D. Post-onboarding steps & coexistence confirmation

| # | Plan claim | Status | Citation / note |
|---|---|---|---|
| D1 | **Skip phone-number registration** — coexistence numbers are already registered (specs.md Req4.3; implementation.md Component 3) | CONFIRMED | `embedded-signup_onboarding-business-app-users.md` ("skip the phone number registration step, as the number is already registered") |
| D2 | `POST /<WABA_ID>/subscribed_apps` subscribes the app to the customer's WABA (specs.md Req4.4) | CONFIRMED | `solution-providers_get-started-for-solution-partners.md`; endpoint also listed in `about-the-platform.md` rate-limit table |
| D3 | Confirmation check `GET /<PHONE_NUMBER_ID>?fields=is_on_biz_app,platform_type`; coexistence active iff `is_on_biz_app: true` AND `platform_type: "CLOUD_API"` (specs.md Req4.4) | CONFIRMED | `embedded-signup_onboarding-business-app-users.md` "Check onboarding status" |
| D4 | Resolve missing `phone_number_id` server-side via `GET /<WABA>?fields=phone_numbers` when ES returned only `waba_id` (implementation.md:206) | CONFIRMED | Endpoint documented (`GET /<WABA>/phone_numbers` also listed in `about-the-platform.md`) |
| D5 | Webhook field subscriptions (`messages`, `history`, `smb_app_state_sync`, `smb_message_echoes`, `account_update`) are **App-Dashboard-level**; WABA attachment is API-level (specs.md:131; implementation.md D7) | CONFIRMED | `embedded-signup_onboarding-business-app-users.md` Step 1 ("App Dashboard > WhatsApp > Configuration panel"); no per-field subscription API documented |

## E. `smb_app_data` endpoint (one-shot sync)

| # | Plan claim | Status | Citation / correction |
|---|---|---|---|
| E1 | `POST /<PHONE_NUMBER_ID>/smb_app_data` with `{ "messaging_product": "whatsapp", "sync_type": ... }` (specs.md Req5.1) | CONFIRMED | `embedded-signup_onboarding-business-app-users.md` Steps 1–2 example requests |
| E2 | `sync_type` values shown: `smb_app_state_sync` and `history` (specs.md Req5.1) | CONFIRMED | same source — both example requests use exactly these values |
| E3 | Success response `{ messaging_product, request_id }`; 200 = **acceptance only**, not delivery (specs.md Req5.1; research doc §2) | CONFIRMED | same source ("response only indicates successful acceptance of the request") |
| E4 | `request_id` is for Meta support correlation; **not echoed in webhooks**; not an idempotency key (specs.md:336; implementation.md D9) | CONFIRMED | same source ("Store the request_id value in case you need to contact support"); webhook payload references contain no `request_id` |
| E5 | **Hard 24-hour window**: sync must be requested within 24h of onboarding, else customer must be offboarded and re-run ES (specs.md Req4.5, Req5.2, EC-2) | CONFIRMED | same source: "you have 24 hours to synchronize their contacts and messaging history, otherwise they must be offboarded and complete the flow again" |
| E6 | **Each sync_type exactly once per onboarding**; redo requires full offboard + ES (specs.md Req5.2/5.3) | CONFIRMED | same source: "You can only perform this step once. If you need to perform it again, the customer must first offboard, then complete the Embedded Signup flow again" |
| E7 | Decline = history webhook carrying error **2593109** ("History sync is turned off by the business from the WhatsApp Business App") (specs.md Req5.5, EC-3) | CONFIRMED | same source (declined-history example payload) |
| E8 | A declined history request leaves contacts sync independent (specs.md Req5.5: "contacts sync MAY still complete") | CONFIRMED | Two separate sync_type requests/webhook streams in `embedded-signup_onboarding-business-app-users.md` Steps 1/2 |
| E9 | Prereq before calling: app subscribed to the WABA AND to `history`/`smb_app_state_sync`/`smb_message_echoes` fields, else webhooks missed (research doc §2) | CONFIRMED | same source ("make sure that you subscribed to the business's WABA… and that you are subscribed to the additional webhook fields") |
| E10 | "No documented error codes specific to a repeat/expired call are published" (research doc §2) | **NOT-FOUND-IN-DOCS** | The indexed docs indeed publish **no** error code for repeat/expired `smb_app_data` calls, but this is an absence-based statement, not a doc assertion. Plan's hedge (own unique `(account_id, sync_type)` + 24h state machine) is correctly justified. |
| E11 | Advise customer to keep the WhatsApp Business app open during sync (research doc §2) | CONFIRMED | `embedded-signup_onboarding-business-app-users.md` Step-3 guidance |

## F. `history` webhook

| # | Plan claim | Status | Citation / correction |
|---|---|---|---|
| F1 | Envelope: `field: 'history'`; `value.history[]` items carry `metadata: { phase, chunk_order, progress }` and `threads[]` (specs.md Req6.4) | CONFIRMED | `webhooks_reference_history.md` syntax block |
| F2 | Phases: **0** = day 0→1, **1** = day 1→90, **2** = day 90→180 (day 0 = onboarding time); docs also note `phase` value 2 marks the phase complete (specs.md Req5.4) | CONFIRMED | `webhooks_reference_history.md` "Phases and chunks" |
| F3 | `chunk_order` is the sequential ordering key; chunks "may not be delivered sequentially" (specs.md Req5.4) | CONFIRMED | same |
| F4 | `progress` int 0–100; **100 = sync complete** (specs.md Req5.4, implementation.md state machine) | CONFIRMED | same |
| F5 | History covers messages sent/received **within 180 days** of onboarding (specs.md:34; implementation.md D8 context) | CONFIRMED | same ("within 180 days of the time when the business was onboarded onto Cloud API") |
| F6 | **Group chats are never included** in history sync (specs.md Req5 notes, EC; out-of-scope note) | CONFIRMED | same ("Messages that are part of a group chat will not be included") |
| F7 | Media messages appear as `type: "media_placeholder"` with **contents omitted**; a **separate follow-up history webhook** carries the real media (in `value.messages[]` for user→business or `value.message_echoes[]` for business→user), correlated by message `id` (specs.md Req6.5) | CONFIRMED | `webhooks_reference_history.md` `<MESSAGE_TYPE>` description + media-asset example payload |
| F8 | Docs' 14-day rule: media **asset IDs are only included for media messages sent within 14 days of onboarding** | CONFIRMED | `webhooks_reference_history.md` / `embedded-signup_onboarding-business-app-users.md` chat-history-contents bullet |
| F9 | Plan's reinterpretation: "media asset IDs SHALL be treated as **fetchable for at most 14 days (Meta retention)**" (specs.md Req6.5; EC-8/EC-9; implementation.md D8 "Meta only guarantees the id ≤14d") | **CONTRADICTED** | `webhooks_reference_history.md`: the 14-day figure is the **cutoff for which media asset IDs are included in the sync at all** ("media asset IDs … only for media messages sent within 14 days of onboarding") — it is **not** a retention/expiry SLA for fetching asset IDs. Docs state no 14-day fetch-retention guarantee. Correction: after a media follow-up webhook arrives, fetch promptly; do not rely on a documented 14-day fetch window; treat older-than-sync media as absent (placeholder stays), not "fetchable for 14 days". |
| F10 | `history_context.status` ∈ `DELIVERED \| ERROR \| PENDING \| PLAYED \| READ \| SENT` (specs.md data model; research doc §3a) | CONFIRMED | `webhooks_reference_history.md` `<MESSAGE_STATUS>` parameter table |
| F11 | Thread `id` = user's phone number, **omittable under usernames rollout**; `context` carries `wa_id`, `user_id` (BSUID), optional `parent_user_id`, `username` (specs.md EC-12) | CONFIRMED | `business-scoped-user-ids.md` history-webhooks section |
| F12 | `to` on a history message is present **only for SMB echoes** (business→user) (research doc §3a; used by implementation.md Component 5) | CONFIRMED | `webhooks_reference_history.md` syntax comment "// only included if SMB message echo" |
| F13 | Message `id` is `wamid.*` — dedupe key; `(phase, chunk_order)` for chunk-level replay safety (specs.md Req6.4) | CONFIRMED | `webhooks_reference_history.md` parameters (wamid examples; chunk_order sequencing note) |
| F14 | A single webhook can contain **thousands of messages**; capture first, process asynchronously (specs.md Req6.9, NFR Performance) | CONFIRMED | `webhooks_reference_history.md` ("a single webhook could potentially describe thousands of messages… capture its contents first, then process the contents asynchronously") |
| F15 | If a phase has no history, **no webhooks are sent** for that phase (edge-case awareness) | CONFIRMED | `webhooks_reference_history.md` "If there is no chat history available for a given phase, no corresponding webhooks will be sent" |

## G. `smb_app_state_sync` (contacts)

| # | Plan claim | Status | Citation |
|---|---|---|---|
| G1 | Payload: `value.state_sync[]` items `{ type: 'contact', contact: { full_name, first_name, phone_number, user_id, parent_user_id?, username? }, action, metadata: { timestamp } }` (specs.md Req6.6) | CONFIRMED | `webhooks_reference_smb_app_state_sync.md` (via `embedded-signup_onboarding-business-app-users.md` payload syntax); BSUID additions in `business-scoped-user-ids.md` |
| G2 | `action`: `add` (covers added **and edited**) | `remove`; `full_name`/`first_name` **omitted on remove** (specs.md Req6.6; EC-13) | CONFIRMED | `embedded-signup_onboarding-business-app-users.md` `<ACTION>` parameter ("add — the business added or edited a contact…") and contact-field notes |
| G3 | Triggers: initial contacts sync AND **every later add/edit/remove** the business makes in the app address book (research doc §3b) | CONFIRMED | `embedded-signup_onboarding-business-app-users.md` Trigger events list |

## H. `smb_message_echoes` & inbound messages

| # | Plan claim | Status | Citation |
|---|---|---|---|
| H1 | Echoes fire for messages sent from the WhatsApp Business app OR a **companion (linked) device** (specs.md Journey J3) | CONFIRMED | `webhooks_reference_smb_message_echoes.md` Triggers |
| H2 | Revoke = `type: 'revoke'`, `revoke: { original_message_id }` (specs.md Req6.7) | CONFIRMED | `webhooks_reference_smb_message_echoes.md` revoke example |
| H3 | Edit = `type: 'edit'`, `edit: { original_message_id, message: { context, type, <type>: {...} } }` — edited content nested under `message` (specs.md Req6.7) | CONFIRMED | `webhooks_reference_smb_message_echoes.md` edit example |
| H4 | Inbound user→business messages still arrive via the normal **`messages`** field (`value.messages[]` + `contacts[]` + `statuses[]`) (specs.md Req6.8) | CONFIRMED | `embedded-signup_onboarding-business-app-users.md` step-3 note; `business-scoped-user-ids.md` |
| H5 | Echoes carry `from` (business display number), `to`/`to_user_id`/`to_parent_user_id`, `id` (wamid dedupe key), `timestamp` (specs.md Req6.7) | CONFIRMED | `webhooks_reference_smb_message_echoes.md` payload syntax |

## I. `account_update` lifecycle events

| # | Plan claim | Status | Citation |
|---|---|---|---|
| I1 | Device change / app reinstall / number re-registration → `ACCOUNT_OFFBOARDED` on `account_update` (specs.md Req7.1) | CONFIRMED | `embedded-signup_reconnect-offboarded-coexistence-clients.md` "Detect offboarding" |
| I2 | Automatic reonboarding: pre-checked opt-in during re-registration, completes in minutes, emits `ACCOUNT_RECONNECTED`, no partner action needed (specs.md Req7.2) | CONFIRMED | `embedded-signup_reconnect-offboarded-coexistence-clients.md` "How it works" |
| I3 | Sends during the reonboarding window fail → pause/fail-fast Cloud API sends between the two events (specs.md Req7.1; implementation.md Component 6) | CONFIRMED | same doc ("Pause any pending Cloud API message sends… as they fail while reonboarding is in progress") |
| I4 | Another partner/coexistence product onboarding the WABA during the window **clears reonboarding eligibility** ("second partner wins") (specs.md Req4.7) | CONFIRMED | same doc Prerequisites |
| I5 | Post-reconnect: Cloud API resumes automatically; **companion devices (e.g. WhatsApp Web) are NOT auto re-linked** (implementation.md Component 6 note) | CONFIRMED | same doc Limitations |
| I6 | Chat-history gap during reonboarding is not backfilled (specs.md Req7.1) | CONFIRMED | same doc (reonboarding completes within minutes; gap is transient) + one-shot sync rule |
| I7 | Sync cannot be re-requested after offboard — full offboard + ES rerun only (specs.md Req7.2) | CONFIRMED | `embedded-signup_onboarding-business-app-users.md` one-shot constraint applies |
| I8 | `PARTNER_APP_UNINSTALLED` when the customer removes the app via Meta Business Suite (specs.md Req7.3) | CONFIRMED | `webhooks_reference_account_update.md` event enum + `embedded-signup_app-only-install.md` example |
| I9 | `PARTNER_ADDED` fires when a client completes ES (specs.md / research doc §3) | CONFIRMED | `solution-providers_manage-webhooks.md` "Onboarded client" example |
| I10 | `DISABLED_UPDATE` carries `ban_info.waba_ban_state` ∈ `SCHEDULE_FOR_DISABLE \| DISABLE \| REINSTATE` (specs.md Req7.4) | CONFIRMED | `webhooks_reference_account_update.md` parameter table (`SCHEDULE_FOR_DISABLE` spelled exactly so) |
| I11 | `business_capability_update` webhook carries `max_phone_numbers_per_business` (specs.md Req7.5; scope intro) | CONFIRMED | `webhooks_reference_business_capability_update.md` syntax |
| I12 | Portfolio number cap: **2 initially → 20** after business verification or reaching a 2,000 messaging limit (specs.md:30, EC-11) | CONFIRMED | `business-phone-numbers_phone-numbers.md` "Registered number cap" |

## J. Coexistence feature restrictions

| # | Plan claim | Status | Citation |
|---|---|---|---|
| J1 | Coexistence onboarding **turns off disappearing messages** for all 1:1 chats (specs.md constraints hint, UI `coexistenceRestrictionsHint`) | CONFIRMED | `embedded-signup_onboarding-business-app-users.md` Feature comparison table |
| J2 | **View-once** messages and **live location** disabled for all 1:1 chats (research doc §5) | CONFIRMED | same table |
| J3 | **Broadcast lists disabled** — cannot create new; existing become read-only (research doc §5) | CONFIRMED | same table |
| J4 | **Groups** not supported/synced on coexistence numbers; Groups API "not available for WhatsApp Business app phone numbers" (specs.md non-goal, J-actor table) | CONFIRMED | same table + `groups.md` Limits |
| J5 | Edit/Revoke of messages becomes supported and mirrored between app and Cloud API (research doc §5) | CONFIRMED | same table (Individual chats row) |
| J6 | Up to **6 months (~180 days)** of chat history synchronizable; all contacts with WhatsApp numbers sync (research doc §5) | CONFIRMED | same table |

## K. Messaging-window (24h CSW) rules under coexistence

| # | Plan claim | Status | Citation |
|---|---|---|---|
| K1 | CSW opens only when a user messages a business **already onboarded** to Cloud API; a user message just before onboarding → business can only reply with templates (research doc §6) | CONFIRMED | `embedded-signup_onboarding-business-app-users.md` "Customer service window" |
| K2 | The 24h CSW restriction applies **only to Cloud API sends**; Business-app sends are not subject to the window and **do not create/extend/affect Cloud API conversation windows or pricing** (research doc §6; spec constraint) | CONFIRMED | same source |

## L. Related Meta limits referenced by the plan

| # | Plan claim | Status | Citation / note |
|---|---|---|---|
| L1 | Pair rate limit: **1 msg/6 s per (business number, user)**; error `131056`; retry backoff `4^X` starting X=0 (specs.md Req2.4, EC-1, glossary) | CONFIRMED | `about-the-platform.md` "Pair rate limits" |
| L2 | Default throughput **80 msg/s per business number** (specs.md:334; implementation.md Component 1) | CONFIRMED | `about-the-platform.md` Throughput |
| L3 | Registration endpoint limit: **10 requests / 72 h per number**, error `133016` (specs.md:334) | CONFIRMED | `business-phone-numbers_registration.md` Limitations |
| L4 | Messaging-limit scaling raises cap to 2,000 and fires `business_capability_update` (specs.md business-value/EC-11 context) | CONFIRMED | `messaging-limits.md`; `webhooks_reference_business_capability_update.md` |
| L5 | `history`/`smb_*` webhook bursts should be ingested before acking — "capture contents first, then process asynchronously" (specs.md Req6.1/6.9) | CONFIRMED | `webhooks_reference_history.md` |
| L6 | Business app **≥ 2.24.17** required for coexistence onboarding (specs.md:335) | CONFIRMED | `embedded-signup_onboarding-business-app-users.md` Requirements |
| L7 | Partner must be Solution Partner / Tech Provider (specs.md Req4.6, constraints) | CONFIRMED | same |
| L8 | "Per-number API versions are not a Meta concept" (implementation.md D6) | **NOT-FOUND-IN-DOCS** | The API version is a **per-request path prefix** (`/v21.0/…`); docs neither define nor forbid per-number pinning in SO many words. The claim's substance (use one configured version globally) is consistent with how `/v25.0/<PHONE_NUMBER_ID>/…` appears in docs, but the exact phrasing is not doc-sourced. |

## M. Full detail on CONTRADICTED claims

### M1 — A4: `extras: { featureType: 'whatsapp_business_app_onboarding', version: 'v4' }` (specs.md:123; implementation.md Component 3 step 1)

- `embedded-signup_versions.md` — Version 4 section: `extras: {}`: "**The extras object is purposely empty for v4.**" v4 is activated by creating a Facebook Login for Business **Configuration** and selecting products ("Selecting the products will automatically set you to v4"); the documented `<VERSION>` enum is `v4-public-preview`, `v3-public-preview`, `v2-public-preview`, `v3`, `v2` — plain `'v4'` is **not listed**.
- `embedded-signup_version-4.md` — v4 supported products include WhatsApp Business app onboarding "through the **feature_type** parameter" (`embedded-signup_onboarding-business-app-users.md#step-2--customize-embedded-signup`), so `featureType: 'whatsapp_business_app_onboarding'` is still correct at v4.
- **Correction**: create the v4 Login-for-Business configuration (selecting the WhatsApp Business app onboarding product) and pass `extras: { setup: {}, featureType: 'whatsapp_business_app_onboarding' }`; **omit `version: 'v4'`** (or use `version: 'v4-public-preview'` only if explicitly opting into the preview). Note this also affects `docs-research-coexistence.md` §1 "Implementation mechanics", which quotes the `version: 'v4'` extras snippet — indexed docs do not contain that snippet on any version page; the research doc should be corrected too.

### M2 — F9: media asset IDs "fetchable for at most 14 days (Meta retention)" (specs.md Req6.5, EC-8/EC-9; implementation.md D8; research doc §3a "media ≤14 days")

- `webhooks_reference_history.md` / `embedded-signup_onboarding-business-app-users.md`: "media messages will not include media asset IDs; instead, additional history webhooks containing media message asset IDs will be sent separately, **but only for media messages sent within 14 days of onboarding**." The **14 days is the sync-coverage cutoff for inclusion of asset IDs**, measured from onboarding — it is NOT a retention SLA for fetching an asset ID.
- **Correction**: reframe the rule as "media asset IDs exist only for messages ≤14 days old relative to onboarding; once an asset ID arrives via the follow-up webhook, fetch promptly — no documented fetch-retention window applies." EC-8 ("placeholder now, media webhook never arrives") remains coherent under this correction. Do not promise users an "available for 14 days" window after receipt of the asset ID.

## N. NOT-FOUND-IN-DOCS detail

- **E10** — No documented error codes exist for repeat/expired `smb_app_data` calls. The indexed docs simply never enumerate any; the research doc's own wording ("treat any second call as unreliable") remains the right stance. This is verified-by-absence, not a doc statement.
- **L8** — "Per-number API versions are not a Meta concept": docs prefix a version per request (`https://graph.facebook.com/v25.0/<PHONE_NUMBER_ID>/…`) and nothing documents per-number version semantics; the plan's single-version env-config design is sound either way.

## O. One residual research-doc inconsistency

- `docs-research-coexistence.md` §1 asserts the onboarding doc shows `FB.login(..., extras: { setup: {}, featureType: 'whatsapp_business_app_onboarding', version: 'v4' })`. That exact snippet does not appear in the indexed copies of `embedded-signup_implementation.md` / `embedded-signup_onboarding-business-app-users.md`, and it directly conflicts with `embedded-signup_versions.md` ("extras purposely empty for v4"; `'v4'` not among documented `<VERSION>` values). Recommend amending the research doc alongside the plan pages. (Nothing else in the research doc contradicts the indexed docs.)

## P. Verification notes

- Sources queried: `embedded-signup_versions.md`, `embedded-signup_version-4.md`, `embedded-signup_version-3.md`, `embedded-signup_implementation.md`, `embedded-signup_errors.md`, `embedded-signup_onboarding-business-app-users.md`, `embedded-signup_reconnect-offboarded-coexistence-clients.md`, `embedded-signup_app-only-install.md`, `embedded-signup_onboarding-customers-as-a-solution-partner.md`, `embedded-signup_onboarding-customers-as-a-tech-provider.md`, `access-tokens.md`, `webhooks_reference_history.md`, `webhooks_reference_smb_message_echoes.md`, `webhooks_reference_account_update.md`, `webhooks_reference_business_capability_update.md` (+ `webhooks_reference_smb_app_state_sync.md` payload as surfaced via `embedded-signup_onboarding-business-app-users.md` and `business-scoped-user-ids.md`), `solution-providers_app-review.md`, `solution-providers_manage-webhooks.md`, `solution-providers_get-started-for-solution-partners.md`, `business-phone-numbers_phone-numbers.md`, `business-phone-numbers_registration.md`, `about-the-platform.md`, `messaging-limits.md`, `groups.md`, `business-scoped-user-ids.md`.
- No files under `specs.md` / `implementation.md` were modified; this report is additive-only.
