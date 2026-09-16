# Research outcome — Meta (WhatsApp Cloud API) capability evidence

Date: 2026-09-10. All findings confirmed with scratch scripts against the live Graph API
using the repo `.env` credentials (effective version `v26.0`).

## Confirmed facts

1. **Test-number detection signals exist on `GET /{phone_number_id}`.**
   Live test number returns: `verified_name: "Test Number"`,
   `code_verification_status: "NOT_VERIFIED"`, `display_phone_number: "+1 555-…"`,
   `platform_type: "CLOUD_API"`, `account_mode: "LIVE"`, `quality_rating: "GREEN"`,
   `messaging_limit_tier: "TIER_250"` (also new field
   `whatsapp_business_manager_messaging_limit`).
   → Detection rule: test number iff `verified_name === "Test Number"` OR
   (`code_verification_status !== "VERIFIED"` AND display number is a `+1 555-` test range).

2. **Allowlist enforcement confirmed (Meta error 131030).** Sending a `hello_world`
   template AND a free-text message from the test number to a dummy recipient both fail:
   `{"error":{"message":"(#131030) Recipient phone number not in allowed list","code":131030}}`.

3. **Sending to an allowlisted recipient works end-to-end.**
   `POST /{phone_number_id}/messages` (hello_world template) → `200`, `message_status:
   "accepted"`, wamid returned.

4. **NO API to fetch the test-number allowlist.** Probed GET edges on the phone-number node:
   `test_recipients`, `test-recipients`, `recipients`, `verified_recipients`,
   `allowed_recipients`, `message_allowlist`, `phone_recipients`, `blocked_recipients` —
   all return `(#2500) Unknown path components`.

5. **NO API to add/verify recipients programmatically.** POST probes to
   `test_recipients`, `test-recipients`, `recipients`, `allowed_recipients`,
   `message_recipients` — all `(#2500) Unknown path components`. Recipient list is managed
   only in App Dashboard → WhatsApp → API Setup.

6. WhatsApp docs (docs MCP `whatsapp` library): test numbers are auto-created with the
   test WABA; message errors reference `131030` as allowlist violation; portfolio-tier
   field migration notes (`whatsapp_business_manager_messaging_limit` post-Oct-2025).

## Consequence for design

Local per-account recipient registry + verify-by-test-send (hello_world) is the only
available approach. Meta side stays the source of truth; our registry is an advisory gate
with empirical verification.
