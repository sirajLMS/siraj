# Design 1 — Architecture & decisions

## Overview

New page `app/(dashboard)/whatsapp/page.tsx` renders a conversations workspace that reuses
the existing inbox read path (`WhatsappInboxService` + queries + ViewModel patterns) and
adds a send path (conversation service + request builders) plus a test-recipient registry.

## Key design decisions

### D1 — Local recipient registry (forced)

Meta exposes no endpoint to read or append the test-number allowlist (confirmed live).
Decision: our DB keeps a per-account registry; "Verify" makes an empirical hello_world
test-send. Rationale: only possible approach; keeps UI honest about Meta 131030 failures.

### D2 — isTestNumber derived at sync time

Computed in `whatsapp-account.service` sync/identity paths from response fields already
fetched (`verified_name`, `code_verification_status`, `display_phone_number`), stored as a
column so every consumer (GraphQL/UI/components) reads it directly. Rationale: single
source of truth, no per-request recomputation; survives webhook-only flows.

### D3 — Separate conversations service, reuse inbox reads

`WhatsappConversationsService` orchestrates sends + registry and delegates listing to the
existing inbox service. No duplication of list queries / polling logic. Rationale: inbox
stays untouched (settings tab unaffected), conversations gets its own write surface with
new permissions.

### D4 — Text-send builds on existing send-template pattern

New `send-text-message.request.ts` mirrors `send-template-message.request.ts`, executed via
the same Graph API plumbing as `syncWhatsappAccountsFromMeta` detail fetches
(`executeGraphApiFetch` + per-account credentials), NOT the notification delivery path
(conversation sends must not create `notification_deliveries` rows).

### D5 — 24h window via conversation column

`whatsapp_conversations.last_inbound_message_at` (nullable ts) updated during inbound
webhook ingest; window check = `now - last_inbound < 24h`. Rationale: O(1) read, no
message-scan.

## Alternatives considered

- Template-only composer — rejected: no real chat UX.
- Reusing `whatsapp.inbox_*` permissions — rejected: conflates read-only view with send.
