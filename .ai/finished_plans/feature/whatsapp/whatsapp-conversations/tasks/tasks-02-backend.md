# Tasks 2 — Backend service layer

- [x] 2.1 `whatsapp-test-recipient.repository.ts`: list/findByKey/count/create/delete/
  recordVerify; unique `(accountId, phoneNumber)` honored; all methods accept `tx`.
  Tests: `backend/db/test/repo/whatsapp/` repo test (runInRollback, entity-setup helpers).
- [x] 2.2 Webhook ingest: expand `whatsapp-webhook-inbox.helpers.ts` conversation touch to
  set `last_inbound_message_at` for INBOUND rows (single patch point `touchLastMessage`
  or sibling updater). Tests: extend existing ingest tests for the new column.
- [x] 2.3 `send-text-message.request.ts` builder (body `{ messaging_product, to, type:
  "text", text:{preview_url?, body} }`) + parse sharing with template builder; unit tests
  alongside `whatsapp-unit.test.ts` (URL, body, validation).
- [x] 2.4 `whatsapp-conversations.service.ts`: recipients CRUD + verify (hello_world
  test-send; 31-wide Meta error mapping 131030); per design-03 contract including audit
  and manage-permission asserts. Service tests: mocked fetch/adapter; limits; error table.
- [x] 2.5 `sendMessage` in `whatsapp-conversations.service.ts`: account resolution, digits
  normalization, test-number hard block, 24h window check, build+execute, persist
  `whatsapp_messages` (`API_OUTBOUND`, wamid), conversation touch, audit, GraphApiError →
  translated domain errors. Service tests cover the full matrix + transactionality.
- [x] 2.6 Sync path: `whatsapp-account.service.ts` sets `isTestNumber` during
  processPhoneNumber for BOTH create and update branches (maps from detail) — verified by
  unit test asserting the computation for `"Test Number"`/`NOT_VERIFIED`, and refugees to
  false otherwise.
- [x] 2.7 Errors: extend `errors` i18n namespace (en/ar/types) with the codes from
  design-05; `{ service, mutation }` use them. _Requirements: design-03, specs-3 #4–12,
  specs-4 #1–11_ (see `outcome/2.7-errors-i18n-outcome.md` for final key names)
