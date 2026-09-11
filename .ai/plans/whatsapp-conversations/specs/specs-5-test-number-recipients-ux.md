# Specs 5 — Test-number recipients UX (phase 2)

Continuation of `/whatsapp` conversations. Builds on the recipients registry (already
shipped). All criteria EARS.

## Phone-input-based entry

1. WHEN the recipients add dialog opens on `/whatsapp` THEN the phone field SHALL use the
   shared PhoneInput component (country prefix picker + national input), not a free-text
   field.
2. WHEN the admin enters a number THEN it SHALL be normalized to digits-only via the
   shared phone normalization before the mutation input is formed.
3. IF the entered number is invalid for the selected country THEN the dialog's submit
   button SHALL be disabled and the invalid-phone helper shall render.
4. WHEN the composer's recipient is free-text (non-test-number accounts) THEN the same
   PhoneInput SHALL replace the raw text field.

## Conversation initiation

5. WHEN the conversation list is empty or the admin wants a new thread THEN a
   translated "New conversation" action SHALL be available on `/whatsapp`.
6. WHEN the active account `isTestNumber` THEN the new-conversation target picker SHALL
   accept ONLY registry recipients (hard block otherwise; the PENDING warning applies).
7. WHEN initiating a brand-new conversation THEN the composer SHALL be locked to TEMPLATE
   mode (no 24h window exists yet) with template name + language required.
8. WHEN the send succeeds THEN the new thread SHALL be selected and the list re-queried.
9. IF the admin tries text mode on a brand-new thread THEN the action SHALL be disabled
   with the translated template-required hint.

## Settings entry point

10. WHEN a number card on `/settings/whatsapp` corresponds to a Meta test number THEN it
    SHALL show the "Test number" chip (exists) AND expose a manage-recipients affordance
    (icon button next to the existing actions) that opens the recipients management
    surface for that account without leaving settings.
11. WHEN the affordance opens THEN the panel SHALL load that account's recipients and
    allow add/verify/remove (same shared component as `/whatsapp`).

## Consistency

12. Both surfaces SHALL read the same GraphQL data (`whatsappTestRecipients`) and share
    the same translated labels (no duplicated strings between settings and `/whatsapp`).
