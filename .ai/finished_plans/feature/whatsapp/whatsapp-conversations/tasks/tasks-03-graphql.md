# Tasks 3 — GraphQL layer

- [x] 3.1 Pothos objects: extend `WhatsappAccountPothosObject` with `isTestNumber` field;
  new `WhatsappTestRecipientPothosObject`; result wrappers (send mutation result);
  register enums (`WhatsappTestRecipientStatus`, send mode). File:
  `backend/graphql/pothos/whatsapp/whatsapp-conversations.pothos.ts` (+ field helpers if
  shared).
- [x] 3.2 Queries `backend/graphql/query/whatsapp/whatsapp-conversations.query.ts`:
  `whatsappConversationsList` (reuse inbox list via conversations service — view permission
  `WHATSAPP_CONVERSATIONS_VIEW`), `whatsappConversationThread`, `whatsappTestRecipients`.
- [x] 3.3 Mutations `backend/graphql/mutation/whatsapp/whatsapp-conversations.mutation.ts`:
  `whatsappSendConversationMessage`, `whatsappAddTestRecipient`,
  `whatsappRemoveTestRecipient`, `whatsappVerifyTestRecipient` — manage permission;
  `withAuthResult`; localized errors.
- [x] 3.4 Register pothos/query/mutation modules in the schema builders
  (imports-ordered per graphql barrel conventions).
- [x] 3.5 `bun run generate:gqlSchema` then `bun codegen`; confirm new fields/types in
  `frontend/common/graphql/generated/gql/graphql.ts` (AppPermission members camelized).
- [x] 3.6 Documents: new `frontend/common/graphql/sharedDocuments/whatsapp/whatsapp-conversations.documents.ts`
  (conversations list query, thread query, recipients query, send mutation, add/remove/
  verify mutations); extend `WhatsappAccountFields` fragment with `isTestNumber`.
  _Requirements: design-03, specs-2 #5, specs-3, specs-4_
- [x] 3.7 GraphQL tests: `frontend/common/graphql/test/whatsapp/whatsapp-conversations.test.ts`
  (auth scopes denied paths, happy paths, localized error code assertions).
