# Tasks 1 — Foundation (permissions + schema)

> Standard pipeline for EVERY task line below:
> `sub-loop.ts <file> --lifecycle codescene` passes; tests interleaved (repo/service/
> graphql/UI as applicable); semantic self-review (authz, races, env-config, clean
> comments); verify instructions/AGENTS.md auto-printed by sub-loop.

- [~] 1.0 Plan-review gate: run `@plan-review` on `.ai/plans/whatsapp-conversations`
  chunks; fix findings; write `outcome/plan-review-R1.md`. __(blocks all tasks below)_
- [x] 1.1 `backend/enum/permissions/permission.enum.ts`: add `WHATSAPP_CONVERSATIONS_VIEW`
  (`whatsapp.conversations_view`) + `WHATSAPP_CONVERSATIONS_MANAGE`; extend enum tests.
- [x] 1.2 `backend/db/migration/46a-whatsapp-conversations-permissions-enum.sql` —
  idempotent enum adds; `46b-whatsapp-conversations-permissions-data.sql` — permission
  rows (ar/en jsonb) + group grants (view: super_admin, academy_admin, staff_default,
  supervisor_default; manage: super_admin, academy_admin). Then `bun db migrate`.
  _Requirements: specs-2 #1–5_
- [x] 1.3 `backend/db/schema/whatsapp/whatsapp-accounts.ts`: add `is_test_number` bool;
  `backend/db/schema/whatsapp/whatsapp-conversations.ts`: add `last_inbound_message_at`;
  new `backend/db/schema/whatsapp/whatsapp-test-recipients.ts` table per design-02;
  register barrels. Run `bun db generate` (PG + sqlite snapshots).
- [x] 1.4 Types: `backend/types/whatsapp/whatsapp-conversations.types.ts` (recipient types +
  send input/result); patch `whatsapp-account.types.ts` (ReturnType exposes
  `isTestNumber`; keep column out of submit/update inputs); update
  `whatsapp-inbox.types.ts` if conversation select needs no changes (verify).
- [x] 1.5 Enum: `backend/enum/whatsapp/whatsapp-conversations.enum.ts`
  (`WhatsappTestRecipientStatus`, `WhatsappConversationSendMode`) + barrels.
- [x] 1.6 Regression: existing whatsapp service/repo/UI tests still green.
  _Requirements: design-02, specs-2 #6–9_
