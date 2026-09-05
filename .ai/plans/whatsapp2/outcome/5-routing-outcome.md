# Phase 5 — Purpose Routing (NOTIFICATION_TEMPLATE_MAP → dispatch)

- **Date**: 2026-09-05
- **Plan**: `.ai/plans/whatsapp2/`
- **Tasks covered**: 5.1, 5.2, 5.3, 5.QL, 5.TE, 5.SEC, 5.SR, 5.IV

## Summary

Template events now carry a routing purpose end to end: the pure builders stamp
`purpose` into `metadata.whatsappTemplate`, the dispatch helpers pass it through
untouched (metadata spreads), and `dispatchWhatsapp` resolves the sending
account via `getChannelForPurpose(purpose)` with GENERAL fallback (warn) and the
`whatsapp.noSenderForPurpose` domain fail-fast when no account qualifies. The
resolved account is attached to the send payload (`senderAccountId`, `purpose`)
and into the delivery-row metadata for attribution.

## Files modified

| File | Task | Change |
|---|---|---|
| `backend/services/notification/notification-payloads.builders.ts` | 5.1 | `NOTIFICATION_TEMPLATE_MAP` entries gain `purpose: WhatsappAccountPurpose.STUDENTS` (all 5 v1 events); map type carries it; `buildPerChannel` stamps `purpose` on `metadata.whatsappTemplate`. Enum value-imported from `@/backend/enum/whatsapp/whatsapp-account.enum` |
| `backend/services/notification/notification-dispatch.helpers.ts` | 5.2 | No functional change needed — `stampRecipientAddress`/dispatch flows spread `payload.metadata`, so `whatsappTemplate` (incl. `purpose`) passes through structurally. Hardened: module JSDoc now states the carry-through contract; covered by a barrel test (below) |
| `backend/services/communication/communication.service.ts` | 5.3 | `dispatchWhatsapp`: purpose guard `isWhatsappAccountPurposeValue` + extended `isWhatsappTemplateMetadata` (an unknown purpose string invalidates the template → existing `whatsappTemplateMissing` fail-fast); purpose default `GENERAL`; `getChannelForPurpose` resolution; fail-fast result with `WhatsappNoSenderForPurposeError` (`whatsapp.noSenderForPurpose`), `sendAttempted: false`, `logDomainError`; audit `logger.info` per routed send (purpose + accountId); send goes directly to the resolved channel with `senderAccountId`/`purpose` and metadata stamped with `senderAccountId`; return now propagates `errorCode`. Legacy `whatsappChannel` proxy import dropped (no longer used) |
| `backend/services/communication/channels/whatsapp/WhatsappChannelFactory.ts` | 5.3 support | `getChannelForPurpose` now logs `logger.warn` when a purpose has no active account and routing falls back to the GENERAL account (only place that knows which branch resolved); GENERAL itself never warns |

## New / supporting files

| File | Change |
|---|---|
| `backend/types/whatsapp/whatsapp-account.types.ts` | `WhatsappTemplateMetadata` gains `purpose?: WhatsappAccountPurpose \| null` (absent = GENERAL) |
| `backend/types/notifications/communications.types.ts` | `ChannelDispatchResult` gains optional `errorCode` so pre-flight domain codes (`whatsapp.noSenderForPurpose`, and the adapter's `whatsapp.accountOffboarded`, previously dropped) survive into dispatch results |
| `shared/types/notification-alerts.types.ts` | `NotificationMetadataBase` gains `senderAccountId?: string \| null` — the delivery-row attribution channel (adapter writes `payload.metadata` into `notification_deliveries.metadata`) |
| `backend/lib/errors.ts` | `WHATSAPP_NO_SENDER_FOR_PURPOSE_CODE` + `WhatsappNoSenderForPurposeError` (DomainError, mirrors the `WhatsappAccountOffboardedError` precedent) |
| `shared/locale/types/errors/index.ts`, `{en,ar}/errors/index.ts` | `whatsappNoSenderForPurpose` key (types + both locales). Pre-seeds part of the Phase 10.2 error set — when Phase 10 runs, these keys already exist |
| `backend/services/communication/test/whatsapp-purpose-routing.test.ts` | NEW — 9 tests |
| `backend/services/communication/test/whatsapp-channel.test.ts` | +2 tests in `getChannelForPurpose resolution`: fallback logs `logger.warn`, direct purpose hit does not |

## Verification

### 5.QL

Sub-loop `--lifecycle codescene` exit 0 for every touched file:
builders, dispatch helpers, factory, communication.service, the two types files,
`shared/types/notification-alerts.types.ts`, `backend/lib/errors.ts`, the three query locale files
(`shared/locale/{types,en,ar}/errors/index.ts`), and both test files.

### 5.TE — service tests

`whatsapp-purpose-routing.test.ts` (9 tests, full-mock factory via `mock.module`,
real builders, repos via `spyOn`):
- purpose `STUDENTS` routes to the purpose account; payload carries `senderAccountId` + `purpose`; result propagates providerMessageId/sendAttempted;
- no-purpose template defaults to `GENERAL`;
- deactivated-purpose fallback: factory returns the GENERAL account → send uses it;
- no account resolves → `success: false`, `errorCode === whatsapp.noSenderForPurpose`, `sendAttempted: false`, channel never called;
- unknown purpose string ("BOGUS") → template guard rejects → `whatsappTemplateMissing` path (no send, no resolution);
- delivery attribution: metadata carries `senderAccountId` + original `entityId`;
- `dispatchWithPreferences` end-to-end carry: purpose reaches the resolver (CLASS_REMINDER — not allowlist-restricted);
- all 5 map entries → STUDENTS; builder stamps purpose into whatsapp metadata.

Regression suites via `run-test`: whatsapp-channel 31/31, communication.service 9/9,
notification-dispatch.helpers 14/14, accounting-notification.builders 5/5,
notification-preferences 5/5, student-lifecycle 3/3, billing-management 8/8,
pair-rate-limit 14/14, whatsapp-webhook.handler 60/60.

**Known interference (not this phase)**: `whatsapp-optin.test.ts` currently fails with
`SyntaxError: Export named 'WhatsappContactRepository' not found in module '.../repo/whatsapp/index.ts'`
because Phase 7's in-flight `whatsapp-webhook.handler.ts` → `whatsapp-webhook-inbox.helpers.ts`
imports `WhatsappContactRepository` while the optin test mocks the repo barrel with a subset.
Chain contains no Phase 5 file; left for the Phase 7 agent (its module graph).

## 5.SEC / 5.SR / 5.IV

- **SEC**: routing purpose originates only from the server-side `NOTIFICATION_TEMPLATE_MAP`;
  free-form metadata purposes are enum-validated (invalid ⇒ template rejected, never routed
  to an arbitrary account). accountId is resolved server-side from the accounts repo, never from
  caller input. No secrets/tokens touched; misconfiguration uses `logger.logDomainError`.
- **SR**: no new env-config keys (none needed); no unbounded module state; enums value-imported;
  fallback warn only fires on actual fallback; send resolution re-reads repo state per dispatch
  (factory instances are per-account cached, credentials 5s TTL — offboard race still fail-fasts in
  the adapter). Nothing to append to `deferred-items.md`.
  Pre-existing v1 note (not changed, not in scope): the allowlist drops WhatsApp for
  CLASS_ACTIVATED/LESSON_REPORT_SUBMITTED/LESSON_REPORT_REVIEWED, and address stamping stamps
  `to` only for email/sms — left as-is to avoid v1 behavior changes.
- **IV**: read root/backend/backend-services/backend-types/backend-enum/backend-repo AGENTS.md,
  shared/AGENTS.md, shared/locale/AGENTS.md, `backend.instructions.md`, `tests.instructions.md`.
  Enforced: no plan tags in new comments (rewrote the tagged dispatch JSDoc into clean terms),
  no `as`-casts in tests (Reflect guards), services-layer i18n via `getServerTranslations`, deep
  enum import, sub-loop green.

## Carry-forward for Phase 13 (journey)

- Journey can assert purpose routing by spying/mocking `getChannelForPurpose` from the factory
  module path `@/backend/services/communication/channels/whatsapp/WhatsappChannelFactory`
  (the dispatch layer's import) or by seeding accounts with different purposes and asserting
  delivery metadata `senderAccountId`.
