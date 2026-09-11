# Design 2 — Data model

## `whatsapp_accounts` — add `is_test_number`

- `bool` notNull default `false` (schema helper `booleanColumn`, per dialect-aware builders
  in `backend/db/schema/__shared__/dialectAwareBuilder`).
- Migration: modify `backend/db/schema/whatsapp/whatsapp-accounts.ts` then
  `bun run db generate`; verify generated PG + sqlite mirror migrations.
- The column is excluded from all client submit inputs; set only by the sync path.
- Existing rows (incl. the seeded test number) become accurate after the next
  sync-from-meta (or a one-off re-evaluation script is NOT needed — sync suffices).

## New table `whatsapp_test_recipients`

| column | type | notes |
|---|---|---|
| id | uuid pk | gen_random_uuid |
| account_id | uuid → whatsapp_accounts | ON DELETE CASCADE, notNull |
| phone_number | varchar(32) | digits only, normalized |
| status | varchar(16) | `PENDING` \| `ALLOWED`, default PENDING |
| last_checked_at | timestamp tz | null until verify |
| last_error_code | varchar(24) | e.g. `131030`, null when clean |
| note | varchar(200) | optional operator note |
| created_by_user_id | uuid → users | notNull (audit) |
| created_at / updated_at | ts notNull | standard |

- Constraints/indexes: UNIQUE `(account_id, phone_number)`; index on `(account_id)`.
- PG-dialect table via drizzle per existing whatsapp table modules; enum kept as varchar
  (small closed set — matches tier/quality style) with TS enum
  `WhatsappTestRecipientStatus` in `backend/enum/whatsapp/whatsapp-conversations.enum.ts`.

## `whatsapp_conversations` — add `last_inbound_message_at`

- timestamp tz nullable; backfill from messages not required (fresh sends only need
  forward-looking correctness; ingest updates it from now on).
- Update `touchLastMessage` caller path (webhook inbox helpers) to also set it when the
  incoming message direction is `INBOUND`.

## Follow-on propagation checklist (standard column flow)

schema → `bun run db generate` → repo types auto ($inferSelect) → adjust Omit/exclusions in
`backend/types/whatsapp/whatsapp-account.types.ts` (keep `isTestNumber` in ReturnType;
exclude from SubmitInput/UpdateInput) → Pothos field → `generate:gqlSchema` + `codegen` →
fragment `WhatsappAccountFields` (+`isTestNumber`) → Row type.
