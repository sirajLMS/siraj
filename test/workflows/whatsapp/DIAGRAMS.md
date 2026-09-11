# WhatsApp workflow journey diagrams

Mermaid diagrams for the WhatsApp multi-number + coexistence journey suite in this directory. Each section maps to one test file; actor and step names mirror the real service calls in the suite.

## coexistence-routing.test.ts

The admin actor assigns purposes through the real account service; a routed CLASS_REMINDER lands on the students number with delivery attribution while an ads payload uses its own number and its own pair-limit key. Meta lifecycle webhooks offboard the students number (routing and direct sends fail fast) and later re-arm it on reconnect. The coexistence account's onboarding enqueues both one-shot syncs, history/state-sync/echo webhook chunks land in the inbox tables, staff read the thread through the inbox service, an actor without `whatsapp.inbox_view` is denied by real permission rows, and an app-side revoke echo marks the original message revoked.

```mermaid
sequenceDiagram
  autonumber
  participant admin as "admin actor (academy_admin + config grant)"
  participant notify as "dispatchWithPreferences (spied, calls through)"
  participant comm as "CommunicationService.dispatchWhatsapp"
  participant factory as "getChannelForPurpose"
  participant adapter as "MetaCloudApiAdapter (per account)"
  participant meta as "Meta Graph API (stubbed fetch)"
  participant worker as "WhatsappWebhookHandler.processPendingWebhookEvents"
  participant inbox as "WhatsappInboxService"
  participant staff as "staff actor (staff_default)"
  participant intruder as "intruder actor (teacher_default)"

  admin->>admin: updateAccountPurpose(studentsAccount, STUDENTS)
  admin->>admin: updateAccountPurpose(adsAccount, ADVERTISING)
  notify->>comm: CLASS_REMINDER whatsapp payload (purpose STUDENTS)
  comm->>factory: resolve sender for STUDENTS
  factory-->>comm: students account channel
  comm->>adapter: send template with senderAccountId
  adapter->>meta: POST /studentsPhoneNumberId/messages
  meta-->>adapter: 200 + wamid
  comm-->>notify: SENT + delivery row attributed to students account
  notify->>comm: ads payload (purpose ADVERTISING)
  comm->>adapter: send template via ads account
  adapter->>meta: POST /adsPhoneNumberId/messages
  comm->>adapter: immediate second send on same students pair
  adapter-->>comm: deferred by pair rate limit (no send attempted)

  meta->>worker: account_update ACCOUNT_OFFBOARDED (students, WABA scoped)
  worker-->>worker: deactivate + offboardedAt + adapter evicted
  comm->>adapter: send to offboarded number
  adapter-->>comm: fail-fast whatsapp.accountOffboarded (no Graph call)
  meta->>worker: account_update ACCOUNT_RECONNECTED (students)
  worker-->>worker: reactivate + offboardedAt cleared
  comm->>factory: resolve STUDENTS again
  factory-->>comm: students account channel restored

  admin->>meta: enqueuePostOnboardingSync - POST /coexistPnId/smb_app_data both types
  meta-->>admin: request_id per type (rows REQUESTED, deadline stamped)
  meta->>worker: smb_app_state_sync (contact add)
  meta->>worker: history chunk (phase 0, chunk 0, progress 100)
  meta->>worker: smb_message_echoes (staff echo from companion app)
  meta->>worker: messages inbound (peer reply)
  worker-->>worker: contact, conversation, messages persisted, account COMPLETE
  staff->>inbox: listConversations + listConversationMessages
  inbox-->>staff: thread carries history + echo + inbound wamids
  intruder->>inbox: listConversations
  inbox-->>intruder: ForbiddenError insufficientPermissions
  meta->>worker: smb_message_echoes revoke of the echo wamid
  worker-->>worker: original message marked revokedAt
```

## conversations.test.ts

The admin actor (academy_admin + per-run config grant) syncs a Meta TEST number via `syncFromMeta` (stubbed Graph list/detail/templates calls), then drives the conversations workspace through `WhatsappConversationsService`: registry `addRecipient` (PENDING + audit), `verifyRecipient` hello_world accept (ALLOWED), a TEMPLATE `hello_world` send persisted as API_OUTBOUND, a TEXT send refused outside the 24h window until a real inbound webhook opens it, the six-recipient cap error, and a view-only staff actor denied by real permission rows while a view-only read still lists the thread.

```mermaid
sequenceDiagram
  autonumber
  participant admin as "admin actor (academy_admin + whatsapp.config_manage)"
  participant svc as "WhatsappConversationsService"
  participant acct as "WhatsappAccountService.syncFromMeta"
  participant meta as "Meta Graph API (stubbed fetch)"
  participant worker as "WhatsappWebhookHandler.processPendingWebhookEvents"
  participant staff as "staff actor (staff_default, view-only)"

  admin->>acct: syncFromMeta
  acct->>meta: GET /{waba}/phone_numbers + GET /{pnId}?fields=... + GET /{waba}/message_templates
  meta-->>acct: test number (verified_name Test Number, NOT_VERIFIED, 1555 digits)
  acct-->>admin: account row with isTestNumber = true

  admin->>svc: addRecipient(recipientOne)
  svc-->>admin: PENDING row + audit CREATE (WHATSAPP_ACCOUNT)
  admin->>svc: verifyRecipient(recipientId)
  svc->>meta: POST /{pnId}/messages template hello_world
  meta-->>svc: 200 wamid
  svc-->>admin: ALLOWED (lastErrorCode null)

  admin->>svc: sendMessage TEMPLATE hello_world
  svc->>meta: POST /{pnId}/messages
  meta-->>svc: 200 wamid
  svc-->>admin: message API_OUTBOUND persisted, thread preview [template] hello_world
  admin->>svc: sendMessage TEXT (no inbound yet)
  svc-->>admin: DomainError whatsappOutsideServiceWindow
  meta->>worker: messages inbound from recipientOne (durable webhook ingest)
  worker-->>worker: conversation lastInboundMessageAt stamped (window open)
  admin->>svc: sendMessage TEXT inside window
  svc->>meta: POST /{pnId}/messages type text
  svc-->>admin: API_OUTBOUND text row persisted

  admin->>svc: addRecipient second + fill registry to 5
  svc-->>admin: rows 2-5 PENDING
  admin->>svc: addRecipient sixth
  svc-->>admin: DomainError whatsappRecipientLimitReached

  staff->>svc: sendMessage TEMPLATE
  svc-->>staff: ForbiddenError insufficientPermissions (no Graph call)
  staff->>svc: listConversations + listConversationMessages
  svc-->>staff: thread carries template + text + inbound rows
```
