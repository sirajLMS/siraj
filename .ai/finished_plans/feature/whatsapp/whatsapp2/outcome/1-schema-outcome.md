# Phase 1 — Extend WhatsApp Schema + New Tables + Permissions

- **Date**: 2026-09-05
- **Plan**: `.ai/plans/whatsapp2/`
- **Tasks covered**: 1.1–1.7, 1.QL, 1.TE, 1.SEC, 1.SR, 1.IV

## Summary

Phase 1 landed end-to-end: `whatsapp_accounts` gained the eight multi-number/coexistence
columns; five new tables (`whatsapp_conversations`, `whatsapp_messages`, `whatsapp_contacts`,
`whatsapp_webhook_events`, `whatsapp_sync_requests`) reuse Meta-verified unique/identity
contracts; seven new TS enums are registered in the Drizzle enum registry AND the Pothos
enum registry; two new app permissions (`whatsapp.inbox_view`, `whatsapp.inbox_manage`)
exist in the TS enum, the DB enum, and the permission/group tables with the planned grants.
Both dev (`.env`) and test (`.env.test`, `siraj_test`) databases were pushed + migrated.

## Files created

| File | Task |
|---|---|
| `backend/enum/whatsapp/whatsapp-account.enum.ts` (Purpose/OnboardingMode/SyncStatus/SyncRequestStatus/SyncType) | 1.4 |
| `backend/enum/whatsapp/whatsapp-inbox.enum.ts` (MessageDirection/WebhookEventStatus) | 1.4 |
| `backend/db/schema/whatsapp/whatsapp-conversations.ts` (partial uniques `(accountId,waId)` & `(accountId,userId)` `{col} IS NOT NULL`) | 1.2 |
| `backend/db/schema/whatsapp/whatsapp-messages.ts` (global unique `wamid`; `(conversationId,sentAt)` + `(accountId,sentAt)` indexes) | 1.2 |
| `backend/db/schema/whatsapp/whatsapp-contacts.ts` (partial uniques on phone/userId; LWW `lastActionAt`; soft `removedAt`) | 1.2 |
| `backend/db/schema/whatsapp/whatsapp-webhook-events.ts` (PENDING default; `(status, receivedAt)` index; 1 row per webhook change) | 1.2 |
| `backend/db/schema/whatsapp/whatsapp-sync-requests.ts` (unique `(accountId, syncType)` one-shot guard; requestId nullable) | 1.2 |
| `backend/db/migration/41a-whatsapp-inbox-permissions-enum.sql` (dual `ALTER TYPE ... ADD VALUE IF NOT EXISTS`) | 1.6a |
| `backend/db/migration/41b-whatsapp-inbox-permissions-data.sql` (permission rows + grants: VIEW → super_admin/academy_admin/staff_default/supervisor_default; MANAGE → super_admin/academy_admin) | 1.6b |
| `backend/db/test/migrations/whatsapp-v2-schema.test.ts` (9 tests — columns/defaults, 7 enum round-trips, indexes incl. partials, wamid + (accountId,syncType) + sync-progress CHECK violations, null-identity coexistence) | 1.TE |
| `backend/drizzle/20260905024045_custom_41a-whatsapp-inbox-permissions-enum/` + `.../20260905024046_custom_41b-whatsapp-inbox-permissions-data/` | auto-bundled by `db migrate` |

## Files modified

| File | Task |
|---|---|
| `backend/db/schema/whatsapp/whatsapp-accounts.ts` — 8 columns: `purpose` (whatsapp_account_purpose, NOT NULL DEFAULT GENERAL), `onboarding_mode` (CLOUD_API), `sync_status` (NOT_STARTED), `sync_phase`, `sync_progress` (0, dialect-aware CHECK 0–100), `sync_deadline_at`, `sync_failure_reason`, `offboarded_at`; plan-tag comments scrubbed from the existing docblock (IV rule) | 1.1 |
| `backend/db/schema/whatsapp/index.ts` — barrel re-exports for the 5 new tables | 1.3 |
| `backend/db/schema/enums.ts` — 7 `createPgEnumFromEnum` registrations (whatsapp_account_purpose, whatsapp_onboarding_mode, whatsapp_sync_status, whatsapp_message_direction, whatsapp_webhook_event_status, whatsapp_sync_request_status, whatsapp_sync_type) | 1.4 |
| `backend/enum/whatsapp/index.ts` — re-export the two new enum files (deprecated `whatsapp.enum.ts` shim untouched) | 1.4 |
| `backend/graphql/pothos/shared/enum.pothos.ts` — 7 `enumType(...)` registrations | 1.5 |
| `backend/enum/permissions/permission.enum.ts` — `WHATSAPP_INBOX_VIEW` / `WHATSAPP_INBOX_MANAGE` next to the existing whatsapp.* entries (surgical 3-line edit amid foreign accounting edits) | 1.6 |
| `backend/services/communication/test/whatsapp-channel.test.ts` + `backend/services/whatsapp/test/whatsapp-webhook.handler.test.ts` — mock account factories extended with the 8 new NOT NULL/defaulted fields (new-column type breakage repair caused by 1.1) | 1.1 fallout |

Top-level `backend/db/schema/index.ts` already re-exported `./whatsapp` — no change needed.

## Files NOT modified (and why)

- `frontend/common/graphql/generated/**`, `frontend/common/graphql/sharedDocuments/**` — codegen regen deferred to Phase 9 (task 9.4) per plan; baseline flags generated files as foreign mid-edit. The new Pothos enums are schema-registered and compile, but don't appear in the generated GraphQL types until then.
- `backend/types/whatsapp/whatsapp-account.types.ts` — Phase 2 scope; adding columns is type-compatible (defaults on insert, so existing repos compile unchanged; verified by tsgo).
- `backend/enum/permissions/permission.enum.test.ts` + `frontend/common/types/page-permissions.types.ts` — foreign-owned in-flight files; also out of Phase 1 scope (permission test is per-domain additive, not count-based; page-permissions wiring is Phase 12).
- `backend/db/migration/40-accounting-carryover-permissions.sql`, `backend/drizzle/.custom-migrations.json`, `backend/drizzle/20260904223645_custom_40-*` — foreign in-flight; the auto-bundler updated the shared sidecar (`.custom-migrations.json`) as designed.
- `defered env-config keys` (WHATSAPP_GRAPH_API_VERSION / WHATSAPP_ES_CONFIG_ID) — Phase 4 tasks, not Phase 1.

## Sub-loop (1.QL) results

`bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` — exit 0 (all six stages: tsgo, oxlint, biome, lint, duplicates, codescene) for every file:

- `backend/enum/whatsapp/whatsapp-account.enum.ts`, `whatsapp-inbox.enum.ts`, `index.ts`
- `backend/db/schema/enums.ts`
- `backend/db/schema/whatsapp/whatsapp-accounts.ts`, `whatsapp-conversations.ts`, `whatsapp-messages.ts`, `whatsapp-contacts.ts`, `whatsapp-webhook-events.ts`, `whatsapp-sync-requests.ts`, `index.ts`
- `backend/graphql/pothos/shared/enum.pothos.ts`
- `backend/enum/permissions/permission.enum.ts`
- `backend/db/test/migrations/whatsapp-v2-schema.test.ts`
- `backend/services/communication/test/whatsapp-channel.test.ts`, `backend/services/whatsapp/test/whatsapp-webhook.handler.test.ts`

First-pass lint failure (fixed): sibling imports in the new schema files used `./whatsapp-accounts`; ESLint requires `@/` aliases — corrected before QL passed.

## Test results (1.TE)

`bun run test/scripts/run-test.ts backend/db/test/migrations/whatsapp-v2-schema.test.ts` → **9 pass / 0 fail** (runInRollback; skipIf sqlite). Re-run of the two repaired whatsapp suites: `whatsapp-channel.test.ts` 13 pass / 0 fail; `whatsapp-webhook.handler.test.ts` 43 pass / 0 fail.

Full-tree `bun tsgo` → **11 errors, all foreign**: 9 carry the exact baseline from `0-baseline-outcome.md` (teacher/notification/accounting carryover), plus `test/ui/components/classes/classDetailsAdminView.test.tsx` + `test/ui/components/fixtures/classDetailsFixtures.tsx` (carryover/payroll `classInstances` field additions in flight). **Zero whatsapp-domain tsgo errors.**
- Fix-or-report: the 2 whatsapp test failures MY schema change introduced (`TS2322` on account mocks) were fixed inside whatsapp-domain files (same scope). The classDetails ones belong to the other agents' carryover work — reported, not touched.

## db push / db migrate outcome (1.7)

- `drizzle-kit push` (dev DB): all 6 whatsapp tables, 8 new columns, 7 new enum types, and the two new `app_permission` values applied. Non-destructive adds only.
- `bun run scripts/dbActions/index.ts --env-file .env.test push` — same for `siraj_test`.
- `bun run scripts/dbActions/index.ts migrate` (both envs): auto-bundled `41a`/`41b` into `20260905024045_custom_41a-whatsapp-inbox-permissions-enum` / `20260905024046_custom_41b-whatsapp-inbox-permissions-data`; applied sequentially (transaction per folder → the two-phase enum-before-insert guarantee holds). Grant rows verified live: `whatsapp.inbox_view` → super_admin, academy_admin, staff_default, supervisor_default; `whatsapp.inbox_manage` → super_admin, academy_admin.
- **Shared-tree caveat**: drip of `db push` is whole-schema, so any foreign schema in the tree that was not yet pushed also applies. The dev DB already contained the foreign carryover tables before/after push (probe confirmed both prior and post states; nothing dropped, no renames, no interaction prompts). `ensureIdempotentMigrations()` also rewrote the foreign `20260904064952_custom_39-accounting-reports-permissions/migration.sql` into DO-guarded form as a side effect of `db migrate` — semantics-preserving; flagged for the accounting agents to acknowledge.

## 1.SEC audit

- No `encryptedText` misuse: token/pin columns keep the dialect-aware encrypted type; no new sensitive value added in plaintext; message payloads are tenant-internal JSONB per design.
- Unique indexes verified live + in test: global `whatsapp_messages_wamid_unique` (Meta wamid is globally unique; cross-account duplicate rejected), `(account_id, sync_type)` unique, partial uniques reject duplicates only where the identity column is non-null.
- No comments inside Drizzle `sql` templates.

## 1.SR review checklist

- No client-supplied IDs / `...input` spreads introduced (schema + enum phase).
- Enum defaults use **value imports** (`default(WhatsappAccountPurpose.GENERAL)`, etc.), never string literals.
- No new env-config keys in this phase (Phase 4 owns WHATSAPP_GRAPH_API_VERSION / WHATSAPP_ES_CONFIG_ID).
- No new module-level mutable state.
- No replay/idempotency gap discovered beyond plan-known ones → nothing new to log in `deferred-items.md`.

## 1.IV instruction verification

Read + complied with: root `AGENTS.md`, `backend/AGENTS.md`, `backend/db/schema/AGENTS.md`, `backend/db/test/AGENTS.md`, `backend/enum/AGENTS.md`, `backend/graphql/AGENTS.md`, `backend/graphql/pothos/AGENTS.md`, `.agents/instructions/backend.instructions.md`, `.agents/instructions/tests.instructions.md`, `docs/drizzle/dialect-aware-constraints.md`. Notable enforced rules: dialect-aware `checkConstraint` (no raw `check()`), value-imported enums, barrels `export *`-only, sub-loop AGENTS prints matched expectations.

## Carry-forward knowledge for later phases

1. **`drizzle-kit push` is whole-schema.** Foreign in-flight schema edits ride along. Phase agents should re-probe the DB before pushing and record the outcome.
2. **Two-phase enum migrations work through the auto-bundler**: separate `backend/db/migration/NNa-*-enum.sql` / `NNb-*-data.sql` files → each becomes its own drizzle folder (its own transaction) → PG never sees a new enum value inside its creation transaction.
3. **`ensureIdempotentMigrations` rewrites foreign custom migration folders** during `db migrate` (DO-guarded enum adds). Safe, but noisy in shared diffs.
4. **Sub-loop's ESLint forbids relative sibling imports** (`./whatsapp-accounts`) inside `backend/db/schema/` despite the AGENTS.md prose permitting them — always use `@/backend/db/schema/...` aliases.
5. **Drizzle error wrapping**: constraint-violation assertions must walk `error.cause` — the outer `DrizzleError` message is `Failed query: ...` without the constraint name (helper lives in `whatsapp-v2-schema.test.ts`).
6. **New `whatsapp_accounts` NOT NULL/defaults columns break literal account mocks** in service tests — later phases changing this table must grep for `WhatsappAccountSelectType`/`WhatsappAccountReturnType` object literals.
7. Enum labels confirmed live on both DBs: `GENERAL/ADVERTISING/STUDENTS`, `CLOUD_API/COEXISTENCE`, `NOT_STARTED/REQUESTED/SYNCING/COMPLETE/FAILED`, `INBOUND/ECHO/API_OUTBOUND`, webhook `PENDING/PROCESSED/FAILED`, sync-request `PENDING/REQUESTED/STREAMING/COMPLETE/FAILED`, `SMB_APP_STATE_SYNC/HISTORY`.

## Cross-file dependencies

CROSS-FILE DEPENDENCY:
- Target file: `test/ui/components/classes/classDetailsAdminView.test.tsx`, `test/ui/components/fixtures/classDetailsFixtures.tsx` (still failing tsgo)
- Blocked by: `backend/types/**` class-instance payroll/carryover fields added by the foreign carryover work
- Required fix: carried by those agents (baseline tsgo delta understanding); NOT whatsapp2 scope.
