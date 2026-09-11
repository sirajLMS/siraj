# Specs 2 — Routes, nav, permissions, test-number detection (EARS)

## Navigation & permissions

1. WHEN an admin navigates to `/whatsapp` THEN the system SHALL render the Conversations
   page if they hold `whatsapp.conversations_view`, else redirect/403 per `withPageAuth`.
2. WHEN the nav renders THEN the system SHALL show "WhatsApp Conversations" under the
   Integrations group only for users with `whatsapp.conversations_view`.
3. IF the user lacks the view permission THEN the item SHALL be hidden from sidebar and
   breadcrumbs fail naturally (page already gated).
4. WHEN permissions are seeded THEN `whatsapp.conversations_view` SHALL be granted to
   super_admin, academy_admin, staff_default, supervisor_default; `conversations_manage`
   to super_admin and academy_admin only.
5. WHEN GraphQL resolvers run THEN view scope SHALL gate list/read fields and manage scope
   SHALL gate send/recipient mutations.

## Test-number detection

6. WHEN WhatsApp accounts sync from Meta THEN the system SHALL set `isTestNumber = true`
   when `verified_name === "Test Number"` OR (`code_verification_status !== "VERIFIED"`
   AND display phone is in the `+1 555-` test range); otherwise `false`.
7. WHEN the account detail lacks detectable fields THEN `isTestNumber` SHALL remain/`false`
   (fail-open; non-test numbers stay unrestricted).
8. WHEN Numbers settings renders a card THEN it SHALL show a "Test number" badge iff
   `isTestNumber === true`.
9. WHEN the conversations page loads THEN each account in the selector SHALL reflect
   `isTestNumber` and its messaging tier remains correct (`TIER_250` for the test number).

## UX/Navigation matrix (roles)

| Role | Nav item | Page | Send |
|---|---|---|---|
| super_admin | ✓ | ✓ | ✓ (manage) |
| academy_admin | ✓ | ✓ | ✓ (manage) |
| staff_default | ✓ | ✓ | ✗ (view only) |
| supervisor_default | ✓ | ✓ | ✗ |
| teacher/parent/student | ✗ | redirect | ✗ |
