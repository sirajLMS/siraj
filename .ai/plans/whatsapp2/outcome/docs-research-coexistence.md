# WhatsApp Docs Research — Coexistence (WhatsApp Business app + Cloud API on one number)

Source: indexed `whatsapp` library in the docs MCP (Meta WhatsApp Business Platform docs, developers.facebook.com/documentation/business-messaging/whatsapp/...). Filename citations refer to the indexed files (e.g. `embedded-signup_onboarding-business-app-users.md`). Compiled 2026-09-04.

## 1. Embedded Signup v4 flow

### Versions & status (source: `embedded-signup_versions.md`, `embedded-signup_version-4.md`)
- **v2 is deprecated on 2026-10-15** — every ES doc page carries this warning. Target **v4** for all new work.
- Version table: `v4` released 2025-10-08 (no end date, "TBD"); `v4-public-preview` released 2026-05-12; `v3` (2025-05-29), `v2`, and both public previews all expire "October, 2026". The ES version is set in the `extras` object of the `FB.login` config: `version: 'v4'` (possible values: `v4-public-preview`, `v3-public-preview`, `v2-public-preview`, `v3`, `v2`).
- **v4 changes v. v3** (`embedded-signup_version-4.md`): asset selection, business info, and permissions are each consolidated onto a single page; asset admins can share assets from other business portfolios; auto-links phone numbers to Facebook Pages for CTWA via Marketing API; a new **Facebook Login for Business Configuration** (created in App Dashboard) selects the *products* enabled, which auto-selects required permissions — creating that config is what puts you on v4.
- v4 supported products: Cloud API (needs `whatsapp_business_management` + `whatsapp_business_messaging` Advanced Access), **WhatsApp Business app onboarding (coexistence) via the `feature_type` parameter**, Marketing Messages API, Partner-led Business Verification, Automatic Events API (not available in EU/UK/JP), CTWA/CTM/CTD + Conversions API.
- Feature-availability matrix (`embedded-signup_versions.md`): in v4 the only `featureType` is `whatsapp_business_app_onboarding`; `features` names are `app_only_install` (and `marketing_messages_lite` in v3/previews; v4 picks products via the Login config instead). In v3, the old `coexistence` featureType was **renamed to `whatsapp_business_app_onboarding`** (`embedded-signup_version-3.md`); `only_waba_sharing` and `marketing_messages_lite` featureTypes and pre-filled screen skipping were removed from v3+.

### Implementation mechanics (source: `embedded-signup_implementation.md`, `embedded-signup_onboarding-business-app-users.md`)
- Load facebook JS SDK (`connect.facebook.net/en_US/sdk.js`), `FB.init({appId, version: '<GRAPH_API_VERSION>'})` (docs currently use `v25.0`), then `FB.login(callback, { config_id, response_type: 'code', override_default_response_type: true, extras: { setup: {}, featureType: 'whatsapp_business_app_onboarding', version: 'v4' } })`.
- **Session-logging message event listener** on `window` (filter `event.origin` endsWith `facebook.com`, parse `data.type === 'WA_EMBEDDED_SIGNUP'`). On success it returns asset IDs:
  ```js
  { data: { phone_number_id, waba_id, business_id /* + optional ad_account_ids, page_ids, dataset_ids, catalog_ids, instagram_account_ids, waba_ids (multi-WABA) */ }, type: 'WA_EMBEDDED_SIGNUP', event: '<FLOW_FINISH_TYPE>' }
  ```
- `FLOW_FINISH_TYPE` values: `FINISH` (normal Cloud API), `FINISH_ONLY_WABA`, **`FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING` (coexistence — note this payload may contain only `waba_id`)**, `FINISH_OBO_MIGRATION`, `FINISH_GRANT_ONLY_API_ACCESS`, `ERROR`. Abandonments: `event: 'CANCEL'` with `data.current_step` (e.g. `PHONE_NUMBER_SETUP`); user-reported errors add `error_message`, `error_code`, `session_id`, `timestamp`. Both clicking **Finish** and closing the popup on the final screen count as success.
- **Response callback** (`fbLoginCallback`) receives `response.authResponse.code` — the exchangeable token code. Exchange server-to-server: `GET https://graph.facebook.com/v21.0/oauth/access_token?client_id=<APP_ID>&client_secret=<APP_SECRET>&code=<CODE>` → returns a **business integration system user access token** ("business token", scoped to that customer) (`embedded-signup_onboarding-customers-as-a-solution-partner.md`, `access-tokens.md`).
- Post-ES onboarding steps (as Solution Partner): exchange code → business token, register phone number, subscribe app to the WABA (`POST /<WABA_ID>/subscribed_apps`), share credit line. **For coexistence, skip the phone-number registration step — the number is already registered** (`embedded-signup_onboarding-business-app-users.md`).
- Confirm coexistence state on a number: `GET /<PHONE_NUMBER_ID>?fields=is_on_biz_app,platform_type` → coexistence is active when `is_on_biz_app: true` **and** `platform_type: "CLOUD_API"`.

### Coexistence trigger difference (source: `embedded-signup_onboarding-business-app-users.md`)
- The only trigger is `featureType: 'whatsapp_business_app_onboarding'` (v3+; was `featureType: 'coexistence'` in v2). Verification the feature is enabled: the ES WABA-selection screen is replaced by a screen offering **"connect your existing WhatsApp Business account"**.
- In-flow: customer enters their WhatsApp Business app number → WhatsApp shows a verification code → customer receives a message from the official Facebook Business Account in the Business app → taps **Connect to the Business Platform** → taps **Confirm** (this is the point where they opt in/out of **chat-history sharing**) → pastes the verification code → completes the flow. Requires WhatsApp Business app **2.24.17+**; partner must be Solution Partner / Tech Provider; session logging is mandatory; `app_only_install` CANNOT be combined with coexistence.

## 2. SMB App Data API (one-shot sync)

Source: `embedded-signup_onboarding-business-app-users.md` (links to Graph reference `whats-app-business-account-to-number-current-status/smb_app_data`).

- **Endpoint:** `POST https://graph.facebook.com/<API_VERSION>/<BUSINESS_PHONE_NUMBER_ID>/smb_app_data`
- **Body:** `{ "messaging_product": "whatsapp", "sync_type": "smb_app_state_sync" | "history" }` — two enum values only.
- **Response (acceptance only):** `{ "messaging_product": "whatsapp", "request_id": "<REQUEST_ID>" }` — a `200` + `request_id` means the request was *accepted*, NOT that data will arrive (e.g. history can still come back declined). **Store `request_id`** — Meta support asks for it; it is also the only correlation handle for the sync request (the follow-up webhooks do not echo it, so it is NOT a full idempotency key).
- **Hard constraints:**
  - Must be called **within 24 hours of onboarding**, otherwise the customer "must be offboarded and complete the flow again".
  - **Each sync_type can be requested exactly once per onboarding.** Re-doing it requires full offboard + Embedded Signup again.
  - Prereqs: app already subscribed to the customer's WABA (`POST /<WABA_ID>/subscribed_apps`) and subscribed to the `history`, `smb_app_state_sync`, `smb_message_echoes` webhook fields *before* calling, or webhooks are missed.
  - Results are delivered **asynchronously via webhooks** (`smb_app_state_sync` / `history`), never in the API response. Customers are advised to **keep the Business app open** during sync.
  - No documented error codes specific to a repeat/expired call are published in the indexed docs — treat any second call as unreliable and key our own state machine on "sync requested within 24h per phone_number_id".

## 3. Webhook payloads

Sources: `embedded-signup_onboarding-business-app-users.md`, `webhooks_reference_history.md`, `webhooks_reference_smb_app_state_sync.md`, `webhooks_reference_smb_message_echoes.md`, `business-scoped-user-ids.md`.

### 3a. `history` webhook (field: `history`)
Envelope: `{ object: 'whatsapp_business_account', entry: [{ id: <WABA_ID>, changes: [{ field: 'history', value: {...} }] }] }`. `value` has `metadata: { display_phone_number, phone_number_id }` plus `history: [{ metadata: { phase, chunk_order, progress }, threads: [...] }]`.

- `metadata.phase` — int: `0` = day 0→1 (onboarding time), `1` = day 1→90, `2` = day 90→180.
- `metadata.chunk_order` — int: **the ordering guarantee** — use it to reassemble webhooks sequentially (no delivery-order promise is stated otherwise).
- `metadata.progress` — int 0–100; **100 = sync complete**.
- `threads[]` — `{ id: <user phone> (may be omitted under usernames rollout), context: { wa_id, user_id /* BSUID */, parent_user_id?, username? }, messages: [...] }`.
- Thread `messages[]` items: `from` (business number = outbound, user number = inbound; may be omitted), `from_user_id`/`from_parent_user_id` (BSUID), `to` (**only present on SMB echoes** — business→user), `id` (**`wamid.*` — dedupe key**), `timestamp` (device time), `type` + same-named content object, and `history_context.status` ∈ `DELIVERED | ERROR | PENDING | PLAYED | READ | SENT`.
- **Media rules:** media messages in threads appear as `type: "media_placeholder"` with contents omitted; a **separate `history` webhook** follows carrying the real content — sent in `value.messages[]` (user→business) or `value.message_echoes[]` (business→user) — with e.g. `image: { id, caption, mime_type, sha256 }`. **Media asset IDs are only included for messages ≤14 days old**; correlate the media webhook to its thread message by `id`.
- **Declined:** history webhook with `errors: [{ code: 2593109, title: "History sync is turned off by the business from the WhatsApp Business App", error_data: { details: "History sharing is turned off by the business" } }]`.
- Groups are excluded; only 1:1 chats, last 180 days. `entry.id` = customer WABA ID.
- **Idempotency:** message `id` (wamid) for message-level dedupe; `(phase, chunk_order)` for chunk-level replay safety. `request_id` is NOT present in webhooks.

### 3b. `smb_app_state_sync` webhook (field: `smb_app_state_sync`)
`value` = `messaging_product`, `metadata { display_phone_number, phone_number_id }`, and `state_sync: [ { type: 'contact', contact: {...}, action, metadata: { timestamp } }, ... ]`.

- `contact` fields: `full_name`, `first_name` (both as in the business's phone address book; **omitted when the contact was removed**), `phone_number`, plus `user_id` (BSUID), optional `parent_user_id`, and `username` when the user enabled usernames.
- `action` values: **`add`** (covers both added and *edited* contacts) | **`remove`**.
- `metadata.timestamp`: Unix timestamp of the contact change.
- Triggers: the initial contacts sync (step 1, above) AND **every later add/edit/remove** the business makes in the Business app address book — this is the ongoing contacts-mirror feed for our inbox.
- Only one contact `type` exists in docs (`contact`); batch multiple contacts per webhook.

### 3c. `smb_message_echoes` webhook (field: `smb_message_echoes`)
Fires for every message the business sends from the Business app or a **companion (linked) device** after onboarding; also for **revoke** (delete) and **edit** of previously sent messages.

- `value` = `messaging_product`, `metadata`, optional new `contacts[]` array (`profile {name, username?}`, `wa_id`, `user_id`, `parent_user_id?`), and `message_echoes: [ { from: <business display number>, to: <user phone> (omittable), to_user_id, to_parent_user_id?, id: <wamid — dedupe key>, timestamp, type: <MESSAGE_TYPE>, '<MESSAGE_TYPE>': {...} } ]`.
- **Revoke:** `type: 'revoke'`, `revoke: { original_message_id }`. **Edit:** `type: 'edit'`, `edit: { original_message_id, message: { context, type, <type>: {...} } }` (edited content nested under `message`).
- Docs mandate we "digest and display [each echo] in the contact message thread history in your app".
- Inbound user messages (user→business) still arrive via the normal **`messages`** webhook field (with `contacts[]` + `messages[]` + `statuses[]`), same as non-coexistence numbers.

### Webhook subscription mechanics (source: `embedded-signup_onboarding-business-app-users.md`, `solution-providers_manage-webhooks.md`, `solution-providers_get-started-for-solution-partners.md`)
- Field subscriptions are set in **App Dashboard → WhatsApp → Configuration → Manage** (or the Webhooks override flow); must subscribe to: `messages`, `history`, `smb_app_state_sync`, `smb_message_echoes`, plus `account_update` (required for reconnect flow).
- Then subscribe the app to each customer WABA: `POST /<WABA_ID>/subscribed_apps` (Bearer business/system token) → `{ "success": true }`. No per-field API — field selection is dashboard-level, WABA attachment is API-level.
- `account_update` events relevant to lifecycle: `PARTNER_ADDED` / `PARTNER_APP_INSTALLED`, `PARTNER_APP_UNINSTALLED` (customer removed the app via Meta Business Suite), `ACCOUNT_OFFBOARDED`, `ACCOUNT_RECONNECTED`, `DISABLED_UPDATE` (ban: `ban_info.waba_ban_state` ∈ `SCHEDULE_FOR_DISABLE | DISABLE | REINSTATE`), `VERIFIED_ACCOUNT`.

## 4. Reconnect / offboarded coexistence clients

Source: `embedded-signup_reconnect-offboarded-coexistence-clients.md`.

- **Trigger:** client changes device, reinstalls the Business app, or re-registers their number → Cloud API companion is **automatically offboarded** → we receive `account_update` webhook with `value.event: 'ACCOUNT_OFFBOARDED'`.
- **Automatic reonboarding:** during Business-app re-registration the client sees previously connected Cloud API products **pre-checked**; if they don't opt out, reonboarding runs in the background and completes in minutes → `account_update` with `event: 'ACCOUNT_RECONNECTED'`. No action needed from partner or client.
- **Prereqs / eligibility clearing:** client must have been onboarded via coexistence; app must be subscribed to `account_update`; **if another partner (or another coexistence product) onboards the WABA during the reconnection window, Meta clears reonboarding eligibility.**
- On `ACCOUNT_OFFBOARDED`: pause Cloud API message sends (they fail mid-reonboarding); watch for `ACCOUNT_RECONNECTED`. Capability states during reonboarding: Cloud API messaging **suspended**; partner WABA Graph access retained; webhook subscriptions retained; Business-app messaging briefly unavailable; chat history **not synced** during the gap (small, since reonboarding is minutes). After reconnect: Cloud API resumes automatically, but **companion devices (WhatsApp Web etc.) are NOT re-linked automatically** — the client must re-link manually.
- Note: template/history sync can never be re-requested after an explicit client offboard — full re-onboarding (ES again) is required (see §2 constraints).

## 5. Business-app feature restrictions under coexistence

Source: `embedded-signup_onboarding-business-app-users.md` (feature-comparison table), `groups.md`.

| WhatsApp Business app feature | After Cloud API coexistence onboarding | On Cloud API? |
|---|---|---|
| Individual (1:1) chats | Edit/Revoke now supported; messages mirrored both ways | **Supported** — up to 6 months of chat history synchronizable |
| Contacts | No change | **Supported** — all contacts with WhatsApp numbers sync |
| Group chats | No change in app | **Not supported** — never synchronized (Groups API unavailable on coexistence numbers) |
| Disappearing messages | **Turned off** for all 1:1 chats | Not supported |
| View-once messages | **Disabled** for all 1:1 chats | Not supported |
| Live location | **Disabled** for all 1:1 chats | Not supported |
| Broadcast lists | **Disabled** — cannot create new; existing become read-only | Not supported |
| Voice/video calls | No change | Not supported (separately: SIP/Calling API exists but is unrelated to coexistence in doc) |
| Business tools (catalog, orders, status) | No change | Not supported |
| Messaging tools (greeting, away, quick replies, labels, marketing messages in-app) | No change | Not supported |
| Business profile (name, address, website) | No change | Not supported |
| Channels | No change | Not supported |

Also: **Groups API explicitly unavailable** on WhatsApp-Business-app-onboarded numbers (`groups.md`: "Groups are not available for WhatsApp Business app phone numbers") — matters for the multi-number plan: an ads-leads number on coexistence can never use Groups.

## 6. Messaging window rules under coexistence

Sources: `embedded-signup_onboarding-business-app-users.md` (Customer service window section), `messages_send-messages.md`, `pricing.md`.

- The 24h **customer service window (CSW)** opens only when a user messages a business **already onboarded** to Cloud API. If a user messaged the business just *before* coexistence onboarding, no CSW exists → Cloud API can only reply with a template.
- **The 24h CSW restriction applies only to Cloud API sends.** Messages sent from the WhatsApp Business app are **not** subject to the window, and Business-app sends **do not create, extend, or affect Cloud API conversation windows or Cloud API pricing**.
- While a CSW is open: free-form (service) messages via `POST /<PHONE_NUMBER_ID>/messages`; outside it: only approved templates. (General docs note a known issue where a CSW reply can rarely fail.)
- Free Entry Point (FEP) windows: user messaging via a CTWA ad or FB Page CTA (Android/iOS only) opens a CSW; if we respond within 24h, a 72h free FEP window opens — all message types free while open, but the CSW still independently gates free-form vs template.
- Implications for Siraj inbox: **Business-app and Cloud-API sends each follow their own window rules** — our UI must not assume a Business-app send opened a Cloud API CSW. Track CSW openness only from `messages` webhook inbound events.

## Key implications for the whatsapp2 plan
1. Target ES **v4** with `featureType: 'whatsapp_business_app_onboarding'` (v2 deprecated 2026-10-15); capture `FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING` (payload may contain only `waba_id`).
2. Sync contacts+history **immediately** post-onboarding (24h hard deadline; one shot each; store `request_id`).
3. Ingest webhooks idempotently: key on `wamid` for messages, `(phone_number_id, phone_number/contact, action, timestamp)` for contact sync, `(phase, chunk_order)` for history chunks; handle `media_placeholder` + follow-up media webhook (≤14 days only); handle error `2593109`.
4. Subscribe fields in Dashboard (`history`, `smb_app_state_sync`, `smb_message_echoes`, `messages`, `account_update`) + `POST /<WABA_ID>/subscribed_apps` per number's WABA.
5. Handle `ACCOUNT_OFFBOARDED`/`ACCOUNT_RECONNECTED`; note that a second partner wins the number permanently.
6. Expect Business-app restrictions above to confuse staff — surface them in onboarding UX.
