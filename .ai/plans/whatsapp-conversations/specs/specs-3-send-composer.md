# Specs 3 — Conversations view + composer (EARS)

## Conversation list & thread

1. WHEN the page loads THEN the system SHALL list conversations across all active accounts
   (or filtered by an account selector), sorted by `lastMessageAt` desc, paginated (20).
2. WHEN a conversation is selected THEN the system SHALL load its messages (paged 50,
   30s polling preserved from the inbox VM) and render them read-only-first as today.
3. WHEN an account is not active OR is deactivated THEN the composer SHALL be disabled
   with a translated hint.

## Composer — modes

4. WHEN composer is TEXT AND the last inbound message is younger than 24h THEN sending
   SHALL be enabled (customer-service window open).
5. WHEN the window is closed (no inbound in 24h or no conversation exists) THEN text send
   SHALL be disabled and the UI SHALL offer template mode.
6. WHEN mode is TEMPLATE THEN the composer SHALL require a template pick (defaults
   `hello_world` when present) and MAY be sent any time.
7. WHEN a recipient `to` number is empty/invalid (E.164 digits) THEN send SHALL be blocked
   client-side with a translated validation message.

## Send behavior

8. WHEN send succeeds THEN the system SHALL persist the message (direction
   `API_OUTBOUND`, wamid from Meta) and show it in the thread + bump conversation preview.
9. WHEN Meta rejects with 131030 THEN the system SHALL surface the translated
   "recipient not in Meta allowlist" hint (not the raw OAuth error).
10. WHEN Meta rejects otherwise THEN the system SHALL surface a translated generic send
    error and log the Meta detail.

## Multi-account

11. WHEN multiple accounts exist THEN a top selector SHALL scope the list + composer to one
    account; switching accounts SHALL reset selection state.
12. IF the sender account has `isTestNumber` THEN the composer SHALL show the test-number
    banner and restrict targets per specs-4.
