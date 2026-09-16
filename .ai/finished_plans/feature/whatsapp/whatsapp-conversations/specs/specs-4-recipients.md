# Specs 4 — Test-number recipient registry (EARS)

## Registry (local source of truth)

1. WHEN `isTestNumber` is true for the selected account THEN the conversations page SHALL
   show a recipient registry panel listing registered numbers with their state.
2. WHEN an admin adds a recipient THEN the system SHALL persist `{ accountId, phoneNumber }`
   with status `PENDING` and prevent duplicates per account (unique constraint →
   translated conflict error).
3. WHEN an admin removes a recipient THEN the row SHALL be deleted (hard delete) after
   confirmation.
4. WHEN an admin clicks Verify on a recipient THEN the system SHALL send a `hello_world`
   template to that number; on Meta `200+accepted` mark the row `ALLOWED` with
   `lastCheckedAt`; on failure keep `PENDING` and store `lastErrorCode`.

## Send gating on test numbers

5. WHEN `isTestNumber` AND the recipient is NOT in the local registry THEN the system SHALL
   hard-block the send client-side AND server-side with `whatsapp.recipientNotAllowed`.
6. WHEN `isTestNumber` AND the registry marks the recipient `PENDING` THEN the UI SHALL
   allow the attempt but display a "not yet verified" warning (Meta may still 131030).
7. IF `isTestNumber` is false THEN the registry panel SHALL be hidden and the composer is
   unrestricted (only window/template rules from specs-3 apply).

## Limits & Meta parity

8. WHEN a registry contains ≥ 5 recipients for a test number THEN adding another SHALL be
   blocked with a translated hint (Meta test numbers allow up to 5 recipients).
9. WHEN the panel renders THEN it SHALL show a help hint that the authoritative list lives
   in Meta App Dashboard → WhatsApp → API Setup.

## Data integrity

10. `whatsapp_test_recipients` rows SHALL cascade-delete when the account row is deleted.
11. Registry mutations SHALL write an audit log entry (AUDIT `CREATE`/`DELETE` on
    `WHATSAPP_TEST_RECIPIENT`) with the actor id.
