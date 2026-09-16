# Docs-MCP Re-verification of whatsapp2 Plan (2026-09-14)

Scope: every Meta-platform fact the plan depends on, re-queried against the docs MCP `whatsapp` library.

## Confirmed (no plan change needed)

| Claim in plan | Docs confirmation |
|---|---|
| ES v4 + `featureType: 'whatsapp_business_app_onboarding'` (v3+ rename from `coexistence`) | confirmed; v2 deprecated 2026-10-15 |
| `smb_app_data` POST with `sync_type: smb_app_state_sync`/`history`, response `{request_id}`, acceptance ≠ delivery | confirmed verbatim |
| 24h post-onboarding window; each sync type exactly once; re-sync requires offboard + ES redo | confirmed verbatim |
| History webhooks: `phase` (0/1/2), `chunk_order` ordering, `progress` 100 = complete, phases day 0–1 / 1–90 / 90–180 | confirmed |
| Media messages: `media_placeholder` + separate follow-up webhook, asset IDs only ≤14 days from onboarding | confirmed |
| Declined history → error code `2593109` | confirmed (exact error payload) |
| `smb_app_state_sync` contacts: `add`/`remove` actions, `metadata.timestamp`, BSUID `user_id`/`username` additions | confirmed |
| `smb_message_echoes` for Business-app/companion sends; revoke/edit structures; mandate to display echoes in thread | confirmed |
| Coexistence confirm: `GET /<PHONE_ID>?fields=is_on_biz_app,platform_type` → `is_on_biz_app: true` AND `platform_type: "CLOUD_API"` | confirmed |
| Reconnect flow: `ACCOUNT_OFFBOARDED` → automatic reonboarding (pre-checked opt-in) → `ACCOUNT_RECONNECTED`; another partner during the window clears eligibility | confirmed |
| Webhook field subscription list (`messages`, `history`, `smb_app_state_sync`, `smb_message_echoes`, `account_update`) set in App Dashboard; WABA attach via `POST /<WABA_ID>/subscribed_apps` | confirmed |
| Portfolio cap 2 → 20 (verified or 2,000 limit), `business_capability_update.max_phone_numbers_per_business` | confirmed |
| Portfolio-level messaging limits live since 2025-10-07; new numbers inherit immediately; legacy per-phone fields removed Feb 2026 | confirmed |
| Pair rate limit 1 msg/6s per (number,user), error `131056`, burst 45/6s borrows quota, retry 4^X | confirmed verbatim |
| Registration/deregistration 10 per number per 72h, error `133016`; PIN required (two-step mandatory); ES numbers must register ≤14 days; `data_localization_region` irreversible | confirmed |
| Management endpoints rate limit 200/h (5,000/h active WABA) per app per WABA | confirmed |

## Amended by this pass

1. **Coexistence throughput is FIXED at 20 mps** (`throughput.md`: "WhatsApp Business app phone numbers… have a fixed throughput of 20 mps"), not the 80 mps default. Updated `specs.md` Technical Constraints + appended to `docs-research-multi-number.md`. Implication for journey/tests: coexistence account exceedance surfaces error `130429`, not 131056.
2. **Graph API default version**: docs examples now uniformly use **v25.0**, and `business_capability_update` portfolio fields are documented as v24.0+ behavior. Plan D6 annotated: implementation SHOULD target v25.0 (audit helpers parse logic); env-config key keeps it adjustable.

## Residual assumptions (no doc answer; stay as plan assumptions)

- No documented max history-chunk payload size → plan keeps 1MB route cap with batching.
- `request_id` not echoed in webhooks (only support handle) → idempotency via `(accountId, syncType)` unique + `wamid`/chunk keys, as designed.
