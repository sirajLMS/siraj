# Design 3 — Backend

## New files

- `backend/db/repo/whatsapp/whatsapp-test-recipient.repository.ts`
  `listByAccount`, `findByKey(accountId, phoneNumber)`, `countByAccount`, `create`,
  `deleteById`, `recordVerify(id, allowed, errorCode)` — all take `tx`; follow repo
  conventions (toReturnType, runWithTx, prepared statements where they help).
- `backend/types/whatsapp/whatsapp-conversations.types.ts` — Select/Insert/Return types for
  recipients; send input/results (`WhatsappConversationSendInput`, mode enum TEXT|TEMPLATE,
  `WhatsappConversationSendResult { message: WhatsappMessageReturnType }`).
- `backend/services/communication/channels/whatsapp/cloud-api/requests/send-text-message.request.ts`
  `buildSendTextMessageRequest(ctx, { phoneNumberId, to, body })` +
  `parseSendTextMessageResponse` (same `{ contacts, messages }` envelope; can reuse
  `parseSendTemplateResponse` shape if identical — verify and share).
- `backend/services/whatsapp/whatsapp-conversations.service.ts` — see below.

## Service contract (thin orchestrator)

- `listConversations` / `listConversationMessages`: delegate to WhatsappInboxService
  (permission-enforcing), unchanged behavior.
- `sendMessage(ctx may pass permissionContext)`:
  1. assert `WHATSAPP_CONVERSATIONS_MANAGE`; resolve account (NotFound → translated).
  2. resolve/normalize recipient (digits only); TEMPLATE mode requires template name;
     TEXT mode requires body 1..4096 chars.
  3. If `account.isTestNumber`: recipient must exist in registry → else throw
     `WhatsappRecipientNotAllowedError` (code `whatsapp.recipientNotAllowed`).
  4. TEXT mode: conversation `lastInboundAt` within 24h → else `whatsapp.outsideServiceWindow`.
  5. Build request (text or template builder) → `executeGraphApiFetch`-style single call
     with account credentials; catch `GraphApiError` → map 131030 to
     `whatsapp.recipientNotAllowedWithMetaHint`, others to `whatsapp.sendFailed`.
  6. On success: persist message row (`direction: API_OUTBOUND`, `type: "text"` or
     `"template"`, `status: sent`,`wamid`), `touchLastMessage`; audit `SEND`.
  7. Return `{ message }` (return type with content jsonb).

## Registry methods (service-side)

- `listRecipients`, `addRecipient` (count < 5 for test numbers → else
  `whatsapp.recipientLimitReached`; audit CREATE), `removeRecipient` (audit DELETE),
  `verifyRecipient` (hello_world test-send → `recordVerify`; manage permission).

## Errors

Domain errors extend `WhatsappConversationDomainError` (`DomainError`) in a new module or
`backend/lib/errors.ts` additions; messages built with `tErrors` (i18n keys in `errors`
namespace, en+ar). extensions.code flows per `docs/graphql/domain-error-extensions-code.md`.
