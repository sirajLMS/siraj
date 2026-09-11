# Design 06 — Test-number recipients UX

## Placement decision (design ruling)

The recipients registry's canonical surface stays `/whatsapp` (full page context:
templates, conversations, tier badges). Settings numbers cards get a **manage affordance**
(icon button beside existing card actions) that opens the recipients surface in a dialog
scoped to that account — no route switch needed to add a recipient to a test number.

Rationale: single component (`TestRecipientsPanel` content) shared by both surfaces;
settings admin doesn't navigate away mid-review; `/whatsapp` remains the operational home.

## Component changes

- `TestRecipientsPanel.tsx` → becomes dialog-embeddable: extract its inner content into
  `TestRecipientsContent` (list + add/remove/verify, no Dialog shell), then both the
  existing inline panel and a new `TestRecipientsManageDialog` wrap it. Desktop/mobile
  leaves: settings dialog opens the shared content inside the project's AppDialog-style
  container (follow the settings dialog patterns — check `WhatsappTabPanels` dialogs).
- `AddRecipientDialog`: replace phone `TextField` with the shared `PhoneInput`
  (`frontend/common/components/ui/input/phoneInput`) — drives E.164 output, `.join("")`-
  safe fixture pattern in tests; normalizing to digits happens in the VM/submit path via
  `shared/lib/phone/parse.ts`-adjacent helper (`normWhatsAppNumber` if it exists — check
  @/shared/lib or the digitsOnly helper used by the service-side input validation).
- `ComposerShared.tsx`: free-text recipient field (non-test accounts) also becomes
  PhoneInput.

## New-conversation flow

`/whatsapp` page header action ("New conversation"). Click → selects "start fresh" mode:
- non-test accounts → PhoneInput for any phone, TEXT or TEMPLATE (window-free only if no
  thread… actually TEXT is only legal within an open window; for a brand new thread the
  composer forces TEMPLATE and shows the template fields).
- test accounts → recipient picker restricted to registry (registry list query), TEMPLATE
  is the only available mode.
After a successful send: refetch `whatsappConversationThreads`, select the new conversation
(the response carries the message → its conversationId — the service already upserts the
conversation row by `accountId + to`).

Backend: nothing new required — `sendWhatsappConversationMessage` already accepts
`conversationId: null` and upserts the thread. Re-verified by a service test in this plan.

## i18n

New keys in `whatsappConversations` (en/ar/types + snapshots):
`newConversation`, `newConversationTitle`, `newConversationSubtitle` (hint that template is
required), `manageRecipients`, `manageRecipientsTitle`, `manageRecipientsHint`, plus any
"invalidPhone"/verified hint keys not already present (audit existing keys first).
