# WhatsApp Docs Research — Multi-Number Support (multiple business numbers in one WABA)

Source: indexed `whatsapp` library in the docs MCP (Meta WhatsApp Business Platform docs). Filename citations refer to indexed files. Compiled 2026-09-04.

## 1. Number limits, adding, verifying, registering

### Registered-number cap (source: `business-phone-numbers_phone-numbers.md`)
- New business portfolios start capped at **2 registered business phone numbers**.
- Cap auto-raises to **20** when the business is verified, or when a messaging limit of 2,000 is reached; signalled via Meta Business Suite notification **and** a `business_capability_update` webhook with `max_phone_numbers_per_business` set to the new cap.
- Note (`solution-providers_get-started-for-solution-partners.md`): docs also state "no limit to the amount of business phone numbers that can be onboarded to the Cloud API" in the partner-assets section — the per-portfolio cap above is the operative constraint for our one-WABA/multi-number model.

### Add / verify (sources: `business-phone-numbers_registration.md`, `business-phone-numbers_phone-numbers.md`)
Flow: **Add** number to the WABA (WhatsApp Manager UI, or programmatically per `solution-providers/registering-phone-numbers`) → **Verify** → **Register** (API only — cannot register via WhatsApp Manager or App Dashboard).
- **Request verification code:** `POST /<PHONE_NUMBER_ID>/request_code` — params `code_method` (`SMS`|`VOICE`), `language` (e.g. `en_US`); requires system-user token (Advanced Access `whatsapp_business_management` for other-business numbers).
- **Submit code:** `POST /<PHONE_NUMBER_ID>/verify_code` — param `code` → `{ "success": true }`.
- If already verified, `request_code` returns HTTP 400, error **`136024`** — check `code_verification_status` field first.

### Register / limits / two-step PIN (source: `business-phone-numbers_registration.md`, `business-phone-numbers_two-step-verification.md`)
- **Register:** `POST /<PHONE_NUMBER_ID>/register` — body `{ "messaging_product": "whatsapp", "pin": "<6-digit>" }`; optional `data_localization_region` (2-letter ISO code, irreversible without deregister). If two-step verification already exists, `pin` must be the existing PIN; otherwise this call **sets** it.
- **Rate limit: 10 registration requests per number per 72-hour moving window**; on the 11th, error **`133016`** and the number is blocked from registration for 72h. Same limit applies to **deregister** (`POST /<PHONE_NUMBER_ID>/deregister`).
- Deregister caveats: cannot deregister a number in coexistence use (Cloud API + Business app); needs `whatsapp_business_management` else error **200**; deregistration does not delete the number/history.
- Two-step verification is **mandatory** for Cloud API (missing PIN = onboarding failure). Change PIN via `POST /<PHONE_NUMBER_ID>` with `{ "pin": "..." }` (no API to *disable* 2FA — only WhatsApp Manager). Re-registering an already-registered number **succeeds silently without resetting the PIN** (`account-model-evolution.md`).
- Embedded-Signup numbers **must be registered within 14 days** of the flow, else ES must be repeated.

## 2. Scoping matrix: per-number vs per-WABA vs per-portfolio

Sources: `upcoming-messaging-limits-changes.md` (now-live portfolio changes), `account-model-evolution.md`, `about-the-platform.md`, `throughput.md`, `messaging-limits.md`, `webhooks_reference_phone_number_quality_update.md`.

| Concern | Scope (docs' answer) | Notes for whatsapp2 |
|---|---|---|
| **Message templates** | **WABA-scoped** (`GET/POST/DELETE /<WABA_ID>/message_templates`); one WABA's templates usable from any of its numbers | A shared template library serves both our ads-leads and student-notifications numbers; no per-number duplication needed |
| **Messaging limits / tiers** | **Business-portfolio-level since 2025-10-07** — all numbers in a portfolio share one limit (250 start → 2,000 → 10K → 100K → Unlimited). Legacy param `max_daily_conversation_per_phone`/`messaging_limit_tier` deprecated, removed Feb 2026 | New numbers inherit portfolio limit immediately (no re-ramping!) — big win for adding a second number |
| **Quality rating** | **Per phone number** — `quality_rating` per number (`GREEN`/`YELLOW`/`RED`/`NA`/`UNKNOWN`), surfaced via `GET /<WABA_ID>/phone_numbers` and `phone_number_quality_update` webhook. Legacy "Flagged" state removed; low quality no longer drops limits, but portfolio scaling requires high quality **across all numbers** | One spammy number degrades the whole portfolio's scaling eligibility |
| **Throughput** | **Per phone number** — 80 msg/s default; automatic upgrade to 1,000 msg/s when portfolio limit is Unlimited + 100K unique users/24h + Medium+ quality (webhook `phone_number_quality_update`, `event: 'THROUGHPUT_UPGRADE'`); returns error `131057` during upgrade (~1 min) | Throughput does NOT share across numbers — plans that burst must consider per-number pacing |
| **API rate limits** | **Per app + per WABA** for management endpoints (`/<WABA_ID>`, `.../phone_numbers`, `.../message_templates`, `.../subscribed_apps`: 200 req/h default, 5,000 req/h for active WABAs with ≥1 registered number); **per phone number** "business phone rate limit"; **pair rate limit per (business number, user)**: 1 msg per 6s (≈600/h), burst ≤45/6s, violation → error `131056`, retry 4^X backoff | Pair-rate applies per number × user, so splitting notifications across numbers does not multiply per-user rate |
| **Billing** | Per **WABA / Messaging Account** (conversation-based); each Messaging Account has its own payment method; one payment method serves all numbers in the WABA | Multi-number in one WABA = one bill to reconcile; per-message pricing on status webhooks (`pricing.pricing_model: 'PMP'`, `category`) |
| **Display name / OBA** | **Per phone number** — `phone_number_name_update` webhook carries approval per display number; OBA is per-number | Each of our numbers needs its own display-name approval |

Also relevant (`account-model-evolution.md`): the platform is migrating WABA → (WAAC per phone number) + (Messaging Account per partner) in phases; existing IDs keep working; `messaging_account_id` param becomes available on Messages API calls (optional in Phase 1, required in multi-MA scenarios at Phase 2); `paid_messaging_account_id` alias deprecated — migrate by **2026-12-31**. Templates remain Messaging-Account-scoped.

## 3. `business_capability_update` webhook

Source: `webhooks_reference_business_capability_update.md`, `messaging-limits.md`.

- Triggers: WABA creation; WABA/portfolio capability increases or decreases (messaging limits, phone-number limits).
- Payload:
```json
{
  "entry": [{ "id": "<WABA_ID>", "time": <ts>, "changes": [{
    "field": "business_capability_update",
    "value": {
      "max_daily_conversation_per_phone": <...>,        // DEPRECATED — removal announced for Feb 2026
      "max_daily_conversations_per_business": <...>,    // portfolio limit: 2000 | 10000 | 100000 | UNLIMITED
      "max_phone_numbers_per_business": <n>,            // portfolio registered-number cap (2 → 20)
      "max_phone_numbers_per_waba": <n>                 // per-WABA number cap
    }
  }]}],
  "object": "whatsapp_business_account"
}
```
- `phone_number_quality_update` (companion, per-number) now also carries `max_daily_conversations_per_business`; its legacy `current_limit` field (values `TIER_50|TIER_250|TIER_2K|TIER_10K|TIER_100K|TIER_NOT_SET|TIER_UNLIMITED`) + `event` (`ONBOARDING`, `THROUGHPUT_UPGRADE`) — deprecated fields removed Feb 2026 per docs.
- Messaging-limit increase approvals also trigger `business_capability_update`; denials trigger an `account_alerts` webhook with `alert_type` ∈ `INCREASED_CAPABILITIES_ELIGIBILITY_DEFERRED | _FAILED | _NEED_MORE_INFO`.

## 4. Sending per number + per-number error codes

Sources: `about-the-platform.md`, `callings/calling error table`, `support_experiments.md`, `block-users.md`, `upcoming-messaging-limits-changes.md`, `throughput.md`.

- Send: `POST https://graph.facebook.com/<API_VERSION>/<PHONE_NUMBER_ID>/messages` — per-number endpoint; no per-number API version differences; (`recipient` BSUID field now supported alongside `to`; `messaging_account_id` param per account-model migration — optional Phase 1, required in multi-Messaging-Account setups from Phase 2).
- Per-number / per-pair error codes relevant to multi-number ops:
  - **131056** — pair rate limit: >1 msg/6s per (business number, user) pair; retry with 4^X backoff (~10 msg/min, burst 45/6s borrows from future quota).
  - **131057** — number throughput upgrade in progress (~1 min unavailability).
  - **131026** — message not deliverable (e.g. recipient on old app version); delivered via error webhook on the sending number.
  - **131047** — re-engagement required (no 24h window); seen per-number on `block_users` and sends.
  - **130472** — marketing-template experiment suppression: message not sent, not billed; `status: 'failed'` webhook with this code.
  - **131036** — No-Storage-number delivery failure after TTL.
  - **133016** — 10-per-72h register/deregister limit exceeded; number locked 72h.
  - **136024** — verification code already verified (request_code).
  - Error **200** — permission missing (e.g. lost `whatsapp_business_management`).
- Status webhooks per send include `pricing: { billable, pricing_model: 'PMP', category: 'marketing'|'utility'|'authentication'|'service', type: 'regular'|'free_customer_service'|'free_entry_point' }` on `delivered`/etc — use these for per-number billing attribution (`business-scoped-user-ids.md` example).

## 5. Templates with multiple numbers in one WABA

Sources: `upcoming-messaging-limits-changes.md`, `catalogs_catalog-template-messages.md`, `business-phone-numbers_registration.md`, `solution-providers_support_migrating-phone-numbers-among-solution-partners-via-embedded-signup.md`, `account-model-evolution.md`.

- Management endpoints `GET/POST/DELETE /<WABA_ID>/message_templates` are WABA-global — a template created once is sendable from **any** number in that WABA; per-number template selection = call `POST /<PHONE_NUMBER_ID>/messages` with the template name from that number. No per-number template list exists.
- Template status/quality feedback arrives via webhooks `message_template_status_update` (`event: APPROVED`, plus `message_template_id/name/language`), `message_template_quality_update`, `message_template_components_update`, `template_category_update` — WABA-level, not per-number.
- **Display names are per-number**: each number's name needs its own approval (`phone_number_name_update` webhook, `decision: APPROVED`, `requested_verified_name`); after approval, re-register that number. So an "ads-leads" number and a "notifications" number can carry different display names.
- Template/messaging-limit note for the portfolio model: the portfolio's numbers share the limit once set — new numbers inherit immediately; newly-added numbers thus need **no template replication, but do need their own display-name approval + registration**.
- Metrics/analytics endpoints are WABA-scoped with per-number filters — treat per-number reporting as derived, not native objects.
- Migration note: if a number is later moved between WABAs, only `APPROVED` + GREEN templates duplicate to the new WABA (and ratings reset to UNKNOWN for 24h) — irrelevant within one WABA but matters if Siraj splits into multiple WABAs later.

## Key implications for the whatsapp2 plan
1. One WABA → up to 20 numbers (2 initially, raise via verification or 2K limit; watch `max_phone_numbers_per_business`).
2. New numbers share the portfolio messaging limit immediately, but quality is per-number — segregate risky traffic (ads) vs trust traffic (student notifications) cognizant that one number's bad quality harms portfolio scaling.
3. Templates are shared; only per-number bits are display name, registration/PIN, throughput, and pair rate limits.
4. Enforce the 10-registrations-per-72h budget when building re-onboarding retry UX.
5. Handle deprecation dates: legacy `max_daily_conversation_per_phone`/`current_limit` fields gone Feb 2026 (already past as of plan); ES v2 deprecated 2026-10-15; `paid_messaging_account_id` alias remove by 2026-12-31 in favor of `messaging_account_id`.
6. **Coexistence throughput override (re-verified 2026-09-14):** numbers used with BOTH the WhatsApp Business app and Cloud API have a FIXED throughput of **20 mps** (not the 80 mps default) — `throughput.md`: "WhatsApp Business app phone numbers… have a fixed throughput of 20 mps." Non-coexistence numbers: 80 mps default, up to 1,000 by upgrade (error `130429` when exceeded).
7. **Graph API version:** current docs examples across registration/subscribed_apps/confirm endpoints use **v25.0**; `messaging-limits.md` notes `max_daily_conversations_per_business` appears on `business_capability_update` for webhooks v24.0+ (v23.0 and older got the legacy field until Feb 2026 removal). Plan default for `WHATSAPP_GRAPH_API_VERSION` is now **v25.0** (env-config, DB-overridable); audit the helpers-default parse paths against v25.0 responses at implementation time.
