# Specs 1 — Overview & user stories

## Problem statement

Admins manage WhatsApp config under `/settings/whatsapp`, but there is no place to have a
real conversation from our WhatsApp numbers: the existing Inbox tab is read-only. Test
numbers can only message Meta-allowlisted recipients; the UI neither detects test numbers
nor enforces this, so sends fail with a cryptic Meta error.

## Scope

IN: new `/whatsapp` page listing conversations; composive send (text/template); test-number
detection + badge; per-account recipient registry for test numbers; new permissions; i18n.
OUT: inbound webhook delivery to the UI exists already (unchanged except a new
`last_inbound_message_at` column); recipient management inside Meta dashboard stays user-run.

## User stories

1. As a **super admin**, I want a Conversations page under Integrations so I can read and
   reply to WhatsApp threads without leaving the platform.
2. As an **admin**, I want to see which WhatsApp number is a Meta test number so I know
   its sending limits.
3. As an **admin using a test number**, I want to pick only allowlisted recipients, with a
   way to verify a recipient (test-send), so my messages don't silently fail.
4. As an **admin**, I want to send a free-text reply within the 24h window and a template
   at any time, with clear translated errors when Meta rejects.
5. As a **staff/supervisor with view permission**, I want read-only access to
   conversations without the ability to send.
6. As a **developer**, I want `isTestNumber` on the account GraphQL type so any UI can
   branch on it.

## Non-goals (v1)

- Recipient PIN/verification managed by Meta Dashboard only (no API exists).
- No media upload/composer attachments.
- No API_OUTBOUND live status webhooks (sent-time status only).
