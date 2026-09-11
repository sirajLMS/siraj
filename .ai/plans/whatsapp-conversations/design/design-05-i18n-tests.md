# Design 5 — i18n + tests

## i18n

- New namespace **whatsappConversations**: keys in
  `shared/locale/types/whatsappConversations/index.ts` (labels), leaves
  `shared/locale/en/whatsappConversations/index.ts` + `ar/...`, namespace module
  `shared/locale/namespaces/whatsappConversations/whatsappConversations.namespace.ts`,
  register in `shared/locale/namespaces/translation.ts`, wire en/ar `messages.ts`.
- Run `bun run locale:snapshots` →
  `public/static/locale-snapshots/{en,ar}/whatsappConversations.whatsappConversations.json`.
- Nav label keys live in `dashboard/core/nav` (existing coreNav namespace): add
  `whatsappConversations` en/ar + type entry.
- Error strings in `errors` namespace: `whatsapp.recipientNotAllowed`,
  `whatsapp.recipientNotAllowedMetaHint`, `whatsapp.outsideServiceWindow`,
  `whatsapp.sendFailed`, `whatsapp.recipientLimitReached`, `whatsapp.recipientConflict`,
  `whatsapp.templateRequired`, `whatsapp.messageRequired` (+ ar). Used via `ctx.t`/
  `tErrors` and GraphQL extensions.code.
- Never hardcode user-visible strings; test-code reads via `readTranslation`/`getServerTranslations`.

## Tests

| Layer | Where | What |
|---|---|---|
| Repo | `backend/db/test/repo/whatsapp/` | recipients repo CRUD/unique/recordCheck; conversation `lastInboundAt` touch in webhook helpers |
| Backend services | `backend/services/whatsapp/test/` | conversations send gating matrix (test × registry × window × mode), error mapping 131030, message persist; registry service limits |
| Request builder | `test/integration/communication/whatsapp/whatsapp-unit.test.ts` | text builder URL/body/parse; template reuse |
| GraphQL | `frontend/common/graphql/test/whatsapp/whatsapp-conversations.test.ts` | auth scopes, happy-path send + mutations, localized error codes |
| UI components | `test/ui/components/whatsapp-conversations/` | composer window states, recipients panel, badge, empty states (namespace added to `test/ui/components/translation-preload.ts`) |
| Journey | `test/workflows/whatsapp/conversations.test.ts` | admin: sync → badge → registry add/verify → send text (mocked Meta + real DB) |

Rules: repo tests `runInRollback` + tx everywhere; services mock outbound HTTP; GraphQL tests
via `setupTestServerLifecycle` + `testClient` with `errorPolicy:"all"`; UI tests mock Apollo
documents; journey uses committed helpers, no rollback.
