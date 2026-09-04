# Docs Verification — Webhook Delivery Semantics & Ingestion Assumptions

- **Verifier**: docs-verification agent (webhooks domain)
- **Date**: 2026-09-04
- **Method**: claims extracted from `specs.md` + `implementation.md`, checked against the indexed `whatsapp` docs corpus (mcp__docs__search_docs; files cited as `webhooks_*.md` etc., per the MCP server's `file:///data/whatsapp_docs/` index).
- **Scope**: webhook delivery semantics only. Plan files were NOT modified.

## Scorecard

| Status | Count |
|---|---|
| CONFIRMED | 15 |
| CONTRADICTED | 1 |
| NOT-FOUND-IN-DOCS | 2 |
| CONFIRMED-WITH-CAVEAT | 2 |

(19 sections, 20 verdicts — W5 carries one CONFIRMED and one NOT-FOUND.)

---

## W1 — Meta retries failed webhook deliveries (plan D2/D5 foundation) — CONFIRMED

**Plan claim** (D2/D5 rationale, EC-5/EC-6): Meta retries on non-200/timeout and legitimately redelivers identical bodies, so persist-before-200 plus idempotent dedup is required.

**Docs** (`webhooks_create-webhook-endpoint.md`, "Batching"):
> "If any POST request sent to your server fails, delivery is retried immediately, then a few more times with decreasing frequency over the next 7 days. Your server should handle deduplication in these cases. Unacknowledged responses will be dropped after 7 days."

Corroborated by `no-storage.md`: "Normally, Cloud API retries undelivered webhooks (such as incoming messages or receipts) for up to 7 days" and by `calling_faq.md`: "Existing messaging related webhooks are retried for up to 7 days" (linking `webhooks/overview#webhook-delivery-failure`).

**Detail corrections/notes**: the documented cadence is "immediately, then a few more times with decreasing frequency over 7 days" — no documented attempt count or backoff schedule. The plan's assumption that retries happen is correct; removal of the v1 24h reject-identical-bodies policy is CORRECT per docs ("Your server should handle deduplication"). Nothing in docs supports any exact-time-based replay rejection of Meta traffic at 4xx.

## W2 — Duplicates occur even without your server erroring — CONFIRMED

**Plan claim** (D5, Concurrency table): duplicate deliveries beyond simple retries.

**Docs** (`calling_faq.md`, explicitly generalized to all webhooks): "Does Meta guarantee exactly one delivery for webhooks? No. Be prepared to handle duplicate webhooks. Due to the distributed nature of Meta's architecture, exactly-once delivery cannot be guaranteed for any webhooks including even messaging related webhooks." Documented duplicate causes include: (1) Meta's HTTPS request to your webhook timing out after **~20s** (your server thinks it succeeded; Meta retries → duplicate), (2) multi-app dispatch retry fan-out (calls-specific, being fixed), (3) Meta queueing-infrastructure failure recovery, (4) unknown causes.

**Implication for D5**: an identical body CAN re-arrive after you returned 200 (cause #1). The 5-min exact-hash window + entity-level idempotency design covers this. Note: the ~20s timeout figure appears ONLY in the calling FAQ, not in the messaging webhooks docs.

## W3 — No delivery ordering guarantees — CONFIRMED

**Plan claim** (Concurrency: "Echo revoke vs original upsert order", "Contact add/remove ordering", chunk ordering via `chunk_order`).

**Docs** (`embedded-signup_onboarding-business-app-users.md`): "you can use the `chunk_order` parameter value to arrange these chunks in their sequential order, **as they may not be delivered sequentially**". `calling_faq.md`: "Ordering is not guaranteed due to the distributed nature of Meta's architecture and retries" (calling context, with the same architectural rationale). The plan's out-of-order-tolerant design (stub rows, LWW timestamps, chunk_order keying) is required by docs, not optional.

## W4 — Webhook response time limit (~10s/20s) — NOT-FOUND-IN-DOCS

**Plan claim** (Non-Functional/Performance, Req 6.9): "ingest SHALL ack within the webhook timeout target (<1s)"; `implementation.md` Performance: "Webhook ack < 200ms (single insert)".

**Docs**: the indexed WhatsApp webhook docs contain **no numeric response-time requirement** for messaging webhooks. The only numeric figure anywhere in the corpus is the calling FAQ's "~20s" Meta-side HTTP timeout (`calling_faq.md`). The create-endpoint doc only says respond 200 (or anything else = failure → retried, dropped after 7 days).

**Verdict**: the plan's <1s/<200ms targets are safe (far inside the only documented ~20s ceiling) but no documented 10s/20s limit exists for messaging webhooks — treat "<20s" as the only docs-adjacent ceiling. Do NOT cite a "Meta requires response within N seconds" rule in code comments; it is not documented for messaging.

## W5 — Payload size: "a single webhook could potentially describe thousands of messages" — CONFIRMED; 1MB cap NOT-FOUND

**Plan claims**: (a) "history bursts up to thousands of messages" (D2, Req 6.9, EC-7); (b) "the 1MB body cap stays at the route because Meta's chunking already splits history payloads… (Outcome research found no documented max; recorded as an assumption)" (`implementation.md` Component 5, Implementation Notes).

**Docs** (`embedded-signup_onboarding-business-app-users.md`, Chat history contents): "For efficiency purposes, **a single webhook could potentially describe thousands of messages, so capture its contents first, then process the contents asynchronously.**" — this is a direct Meta endorsement of the plan's persist-fast/process-async design (D2).

Additionally, `webhooks_create-webhook-endpoint.md` "Batching": "POST requests are aggregated and sent in a batch with a **maximum of 1000 updates**. However, batching cannot be guaranteed so be sure to adjust your servers to handle each POST request individually."

**Verdict**: (a) CONFIRMED verbatim. (b) NOT-FOUND — no byte-size limit or guidance (1MB, 10MB, etc.) appears anywhere in the corpus; the plan's self-labeling as an ASSUMPTION is correct and should stay. Note: a single "update" ≠ a single message, so "max 1000 updates per batch" does NOT cap total messages per POST; a history chunk with thousands of messages can still be one update. The 1MB cap therefore remains an unrisk-rated guess — consider raising it or testing against a real ~180-day history before launch (risk: Meta history chunks for a busy SMB number could plausibly exceed 1MB; docs give no protection).

## W6 — Inbound `messages` webhook shape (contacts[] + messages[]) — CONFIRMED

**Plan claim** (Req 6.8): inbound user→business events arrive in `value.messages[]` on field `messages` while statuses share the same field.

**Docs** (`webhooks_reference_messages.md`): inbound text example shows `value.contacts[]` (profile.name, wa_id) + `value.messages[]` (from, id=wamid, timestamp, type, text.body), `field: "messages"`. And: "Messages webhooks describing a message sent by a business to a WhatsApp user… include a `statuses` array… each outgoing message can have up to three separate webhooks (sent, delivered, read)." CONFIRMED. Also confirmed: edit/revoke of user messages arrive on `field: messages` with `type: "edit"|"revoke"` and `original_message_id` (so the inbound `messages` handler must tolerate non-content types).

## W7 — Status webhooks carry a `pricing` block — CONFIRMED

**Plan claim** (implicit in existing v1 status pipeline; task listed for verification).

**Docs** (`webhooks_reference_messages_status.md`): status objects include `"pricing": { billable, pricing_model, type, category }` — "only included with sent status, and one of either delivered or read status"; and `"conversation": { id, expiration_timestamp, origin.type }` — "**Omitted entirely for v24.0+ unless webhook is for a free entry point conversation**". `errors` array included only on failure statuses.

**Plan-relevant caveat**: the plan defaults the Graph API version to **v23.0**; since `conversation`/`pricing` emission changes at v24.0, any billing/analytics code keyed off `conversation` must tolerate its absence — the plan's status-pipeline retention is compatible, but note the version-sensitivity if the version is later bumped.

## W8 — Signature verification (X-Hub-Signature-256 + app secret) — CONFIRMED

**Plan claim** (Req 6.1, Security): HMAC-SHA256 over raw body with app secret, `X-Hub-Signature-256` header, 401 on mismatch.

**Docs** (`webhooks_create-webhook-endpoint.md`): POST syntax `X-Hub-Signature-256: sha256=<SHA256_PAYLOAD_HASH>`; "HMAC-SHA256 hash, calculated using the post body payload and your **app secret** as the secret key"; validate by comparing everything after `sha256=`; mismatch → "consider the payload invalid". Response rule: valid → 200; invalid → "a 400-level HTTP status, or anything other than status 200". Also documented: GET verification via `hub.mode/hub.challenge/hub.verify_token` (plan's GET-verify retained) and optional **mTLS** support. "There are no APIs for fetching historical webhook data, so capture and store webhook payloads accordingly" — directly endorses D2's persist-first design.

**Note**: docs say respond non-200/4xx for *invalid* payloads; the plan 401s on bad HMAC. A 401 against Meta triggers the documented 7-day retry storm on every forged/failed request — harmless but noisy; 4xx is literally what docs prescribe, so this is fine (no contradiction).

## W9 — Webhook field subscription: Dashboard vs API (D7) — CONFIRMED-WITH-CAVEAT

**Plan claim** (D7, Req 4 "Depends on"): field selection (`messages`, `history`, `smb_app_state_sync`, `smb_message_echoes`, `account_update`) is App-Dashboard-managed; "Meta provides no per-field subscription API; dashboard state is authoritative"; WABA attachment via `POST /<WABA_ID>/subscribed_apps`.

**Docs**: `embedded-signup_onboarding-business-app-users.md` Step 1: "Navigate to the **App Dashboard > WhatsApp > Configuration** panel and subscribe your app to … `history`, `smb_app_state_sync`, `smb_message_echoes`". `solution-providers_get-started-for-solution-partners.md`: Configuration panel → "click the **Manage** button and subscribe to individual webhook fields… subscribe to the **messages** webhook field". `subscribed_apps` is documented as attaching the *app* to the WABA ("all Webhook events for the phone numbers under this account will be sent"), not per-field selection.

**Caveat**: no per-field subscription API appears anywhere in the indexed WhatsApp corpus, so D7 is consistent with everything documented here. However "Meta provides no per-field subscription API" cannot be proven from absence — treat as "not documented in the WhatsApp corpus"; the runtime-validation + warning design is the right hedge regardless.

## W10 — `account_update` event values for offboard/reconnect — CONFIRMED + one gap

**Plan claims** (Req 7, Component 6): `ACCOUNT_OFFBOARDED`, `ACCOUNT_RECONNECTED`, `PARTNER_APP_UNINSTALLED`, `DISABLED_UPDATE` with `ban_info.waba_ban_state`.

**Docs** (`webhooks_reference_account_update.md`):
- `ACCOUNT_OFFBOARDED` — "WABA has been offboarded due to a device change or phone number reregistration" (marked "New"). CONFIRMED.
- `ACCOUNT_RECONNECTED` — "reconnected after a device change or phone number reregistration". CONFIRMED. `embedded-signup_reconnect-offboarded-coexistence-clients.md` adds operational guidance the plan mirrors: on OFFBOARDED "Pause any pending Cloud API message sends… they fail while reonboarding is in progress" and "Monitor for the ACCOUNT_RECONNECTED webhook, which typically arrives once your client completes registration" — supports the plan's fail-fast + wait (not poll) behavior.
- `PARTNER_APP_UNINSTALLED` — "business customer deauthenticated or uninstalled the app"; payload carries `waba_info` (waba_id, owner_business_id, partner_app_id). CONFIRMED.
- `DISABLED_UPDATE` — carries `ban_info: { waba_ban_state, waba_ban_date }` with states `DISABLE` | `REINSTATE` | `SCHEDULE_FOR_DISABLE`. CONFIRMED.

**Gap (not a contradiction)**: the plan does NOT handle `PARTNER_REMOVED`, which for coexistence clients carries `disconnection_info` with `reason` values: `ACCOUNT_DISCONNECTED`, `BUSINESS_DOWNGRADE` (reregistered on consumer app), `CHANGE_NUMBER`, `COMPANION_INACTIVITY` (~30 days inactive), `PRIMARY_INACTIVITY` (~14 days inactive), `USER_RE_REGISTERED` — exactly the "staff device reinstall" class Req 7 cares about. If the app is unshared rather than uninstalled, the plan currently has no handler. Recommend adding `PARTNER_REMOVED` (with disconnection_info) to Component 6, or logging it as a deferred item.

## W11 — Media retention: "media asset IDs fetchable for at most 14 days" — CONTRADICTED

**Plan claim** (Req 6.5, D8, EC-9, glossary/edge cases): "media asset IDs SHALL be treated as fetchable for at most 14 days (Meta retention)"; UI shows expiry notice "after 14d".

**Docs** (`business-phone-numbers_media.md`): "**Media IDs returned by the API expire after 30 days. Media IDs in webhooks expire after 7 days.**" / "when retrieving a media from a media ID received via webhook, the media ID will only be available to download for **7 days**". Media **URLs** expire after **5 minutes** (re-query the ID for a fresh URL).

The 14-day number in the corpus is a **different** rule: in coexistence history sync, placeholder-to-media follow-up webhooks are sent "only if the message was sent within **the last two weeks**" of the sync request (`webhooks_reference_history.md`, `embedded-signup_onboarding-business-app-users.md`). I.e., 14 days governs *whether you ever receive a media follow-up for an old history message*, not how long an ID stays fetchable.

**Correction required**: for media received via webhook (inbound messages, echo media, history media follow-ups), the fetchable window is **7 days**, not 14; the ≥14-day rendering fallback triggers too late to be conservative — expired media at day 8 would hit errors the UI attributes to a 14-day rule. Fix: treat webhook-delivered media as fetchable for 7 days (fetch-and-store eagerly inside 7 days, or render "unavailable" after 7 days); keep the separate 14-day rule only for "will a history media follow-up ever arrive". (Side note: `no-storage.md` indicates standard message content at rest is "30 days" on Cloud API, consistent with the 30-day API-uploaded ID expiry.)

## W12 — history chunk structure (phase / chunk_order / progress semantics) — CONFIRMED-WITH-CAVEAT

**Plan claim** (Req 5.4): track `phase` (0: day 0→1; 1: day 1→90; 2: day 90→180), `chunk_order` for ordering/dedupe, `progress` 100 = complete; transition COMPLETE at progress 100.

**Docs** (`webhooks_reference_history.md`, `embedded-signup_onboarding-business-app-users.md`): phases exactly as the plan states (0: day0→1, 1: day1→90, 2: day90→180, measured from onboarding time); `chunk_order` "to order sets of webhooks sequentially"; `progress` min 0 max 100, "A value of `100` indicates that synchronization is complete"; `history_context.status` values DELIVERED/ERROR/PENDING/PLAYED/READ/SENT (matches the plan's status column intent); "If there is no chat history available for a given phase, no corresponding webhooks will be sent."

**Caveat (doc oddity, not a plan error)**: the onboarding guide states "`phase` — A value of `2` indicates that the current phase is complete" — that sentence is self-contradictory in Meta's own doc (phase already *is* a 0/1/2 value, not a completion flag). The plan reads it correctly as an index; rely on `progress` 100 for completion as the plan does. Also note the completion edge: since phases with no history send no webhooks, a progress-100 chunk is the only completion signal — the plan handles this correctly.

## W13 — History shape details the plan relies on — CONFIRMED

`media_placeholder` type: CONFIRMED — "If this value is set to `media_placeholder`, the message object describes a message that contained a media asset… a separate history webhook will follow, describing the content of the message and the media asset ID, but only if the message was sent within the last two weeks" (see W11 for the 7-day fetchable caveat). The follow-up media webhook arrives on `field: history` with a normal `messages[]` media object matching by wamid — CONFIRMED by the example in `webhooks_reference_history.md`. Groups excluded from history: CONFIRMED ("messages that are part of a group chat will not be included"). `timestamp` is a **device** timestamp ("when the message was received by the recipient's device") — the plan stores it as `sentAt`; the label is approximately right for inbound but the doc's definition is recipient-side. Username/BSUID rollout omits `to`/phone fields — CONFIRMED (`business-scoped-user-ids.md`), validating EC-12's wa_id → user_id(BSUID) → username fallback chain.

## W14 — smb_app_state_sync payload (contacts, action, metadata.timestamp) — CONFIRMED

**Plan claim** (Req 6.6): contacts upsert honoring `action: add | remove` and `metadata.timestamp` LWW.

**Docs** (`webhooks_reference_smb_app_state_sync.md`, onboarding guide): `state_sync[]` entries with `type: "contact"`, `contact: { full_name, first_name, phone_number }`, `action: <ACTION>`, `metadata: { timestamp }`. BSUID rollout adds `user_id`/`parent_user_id`/`username` and makes `phone_number` omittable — matching the plan's `(accountId, phoneNumber)` / `(accountId, userId)` dual-unique design. The docs corpus excerpt did not enumerate the literal string values of `action` (`add`/`remove` appear in Meta's payload-table descriptions per the onboarding guide's payload-contents section, but the enumerated list was not in the retrieved excerpt) — value list treated as CONFIRMED-in-substance, flagged for a spot-check during implementation against the live reference page.

## W15 — smb_message_echoes revoke/edit shapes — CONFIRMED

**Plan claim** (Req 6.7): echoes upserted direction `echo`; `type: 'revoke'` soft-marks original; `type: 'edit'` stores new content keyed by `original_message_id`.

**Docs** (`webhooks_reference_smb_message_echoes.md`): revoke echo = `message_echoes[]` with `type: "revoke"`, `revoke: { original_message_id }`; edit echo = `type: "edit"`, `edit: { original_message_id, message: {...} }`. CONFIRMED exactly as the plan models it. The plan's "revoke upserts a stub row if original not yet seen" is needed because of W3 (no ordering).

## W16 — One-shot 24h sync window, request_id semantics (D9) — CONFIRMED

**Plan claims** (Req 4.5, Req 5.1–5.3, D9): sync must be POSTed within 24h of onboarding or offboard+re-onboard is the only recovery; each `sync_type` exactly once; success response only means acceptance; `request_id` stored for support and NOT echoed in webhooks.

**Docs** (`embedded-signup_onboarding-business-app-users.md`): "After you onboard the business customer, you have **24 hours** to synchronize their contacts and messaging history, otherwise they must be offboarded and complete the flow again"; per step: "**You can only perform this step once.** If you need to perform it again, the customer must first offboard"; success payload `{messaging_product, request_id}` — "This response only indicates successful acceptance of the request; it does not indicate whether the business shared their messaging history"; "**Store the `request_id` value in case you need to contact support**." Decline path: history webhook with error code `2593109` — CONFIRMED verbatim, and the docs show it nested at `value.history[].errors[]` (plan handlers must read errors inside the history array, not at top level).

**Note**: docs never state whether `request_id` is echoed in webhooks — the plan's "NOT echoed" (D9) is consistent with absence of any such field in every documented history/sync payload, and treating it as support-only is what the docs prescribe. CONFIRMED by construction.

## W17 — Delivery guarantees: no "at least once" promise either — CONFIRMED (strengthens D2)

Docs guarantee neither exactly-once nor at-least-once: after 7 days of failed retries "unacknowledged responses will be dropped" (W1); with No Storage config the retry window shrinks to 1 hour (`no-storage.md`). There is **no SLA**: "We do not currently offer commercially available product service level agreements for uptime and/or latency" (`support.md` FAQ). Additionally: multi-app delivery is fan-out with no primary/secondary (all subscribed apps get all webhooks). **Implication**: D2's persist-before-200 is the only loss-control point; the sweeper remains necessary; the plan should also note there is no Meta SLA behind webhook delivery so monitoring (sweep lag) is the observability substitute — the plan already does this (Monitoring section).

## W18 — IP allowlisting & TLS — CONFIRMED (not currently in plan; optional addition)

The plan makes no claim about sender IP allowlisting or TLS. For the record: docs maintain a Meta IP prefix list at `webhooks/overview#ip-addresses` (~23 IPv4 prefixes derived from AS32934, subject to change — `calling_faq.md`, `calling_sip.md` reference it); webhooks ride HTTPS/TLS; mTLS for webhooks is supported optionally (`webhooks_create-webhook-endpoint.md`). If hardening is desired, allowlisting Meta prefixes at the edge is docs-supported, but HMAC (W8) already provides authentication; no plan change required.

## W19 — Explicit "Meta redelivers *identical history chunks*" — CONFIRMED (general), wording note

The v1-removal justification ("Meta legitimately redelivers identical history chunks", EC-5/D5): docs confirm retries redeliver the same failed POST (`webhooks_create-webhook-endpoint.md`: failure → retried → "handle deduplication") and confirm chunked history may arrive out of order and in multiple redeliveries; no doc explicitly says "history chunks are byte-identical on redelivery", but redelivery replays the same payload by construction (retries of the same POST). The D5 design (short exact-hash window → entity-level wamid / (accountId, phase, chunk_order) idempotent upserts) satisfies every documented duplicate/ordering/retry scenario enumerated in W1–W3. No changes needed.

## Impact summary on D2 / D5

- **D2 (persist-before-200 + sweeper)**: fully supported — Meta itself instructs "capture its contents first, then process the contents asynchronously" for history bursts; retries up to 7 days and "no APIs for fetching historical webhook data" make persist-first mandatory. No contradiction found.
- **D5 (5-min exact-hash replay window + wamid idempotent upserts)**: fully supported — duplicates can occur even after a 200 was returned (W2), retries replay identical bodies over 7 days (W1), and ordering is never guaranteed (W3). Removing the 24h identical-body rejection is the *correct* reading of the docs.
- **Single real correction required**: W11 (media fetchability is 7 days for webhook-delivered media, not 14; the 14-day rule is the history follow-up eligibility window).
- **Gaps worth recording (non-blocking)**: W10 PARTNER_REMOVED/`disconnection_info` handling; W5 1MB cap is an unverifiable assumption against possibly >1MB history chunks; W14 `action` enum literal spot-check at implementation time.
