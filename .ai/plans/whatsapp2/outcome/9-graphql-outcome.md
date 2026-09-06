# Phase 9 — GraphQL Inbox Surface

- **Date**: 2026-09-06
- **Plan**: `.ai/plans/whatsapp2/`
- **Tasks covered**: 9.1–9.4, 9.QL, 9.TE, 9.SEC, 9.SR, 9.IV

## Deliverables

| Task | File | State |
|---|---|---|
| 9.1 | `backend/graphql/pothos/whatsapp/whatsapp-inbox.pothos.ts` | new — `WhatsappConversation`, `WhatsappMessage` (content via `JSON` scalar, direction via enum), `WhatsappContact`, `WhatsappSyncRequest`, `WhatsappAccountSyncOverview` (id resolved from accountId), plus paginated wrappers `WhatsappConversationsResult` / `WhatsappConversationMessagesResult` (`rows`/`totalCount`/`pageInfo` via shared `PageInfoObject`) |
| 9.1 aux | `backend/types/whatsapp/whatsapp-inbox.types.ts` | `WhatsappConversationsPaginatedResult` / `WhatsappConversationMessagesPaginatedResult` wrapper types with cache-scoped `id` keys |
| 9.2 | `backend/graphql/query/whatsapp/whatsapp-inbox.query.ts` | new — `whatsappConversations(accountId?, pagination)`, `whatsappConversationMessages(conversationId, pagination)`, `whatsappSyncStatus(accountId)` |
| 9.2 svc | `backend/services/whatsapp/whatsapp-inbox.service.ts` | new — `WhatsappInboxService` namespace; every entry point takes `UserPermissionContext` and calls `PermissionsService.hasPermission(context, WHATSAPP_INBOX_VIEW)` (never re-queries `getUserContext`); errors are DomainError subclasses (`ForbiddenError`, `NotFoundError`) |
| 9.3 | `backend/graphql/mutation/whatsapp/whatsapp-account.mutation.ts` | `updateWhatsappAccountPurpose(accountId, purpose: WhatsappAccountPurpose!)` gated `WHATSAPP_CONFIG_MANAGE`, passes ctx permission context; `completeWhatsappEmbeddedSignup` confirmed still wired (Phase 8) |
| 9.3 svc | `backend/services/whatsapp/whatsapp-account.service.ts` `updateAccountPurpose` | context-based permission check, not-found → `WHATSAPP_ACCOUNT_NOT_FOUND`, inactive → new `WhatsappPurposeRequiresActiveError` (`whatsapp.purposeRequiresActive`), audit + `resetWhatsappChannel(id)` |
| 9.3 err | `backend/lib/errors.ts` | `WHATSAPP_PURPOSE_REQUIRES_ACTIVE_CODE` + `WhatsappPurposeRequiresActiveError` DomainError subclass |
| 9.4 | barrels: `backend/graphql/query/whatsapp/index.ts`, `backend/graphql/pothos/whatsapp/index.ts`, `backend/services/whatsapp/index.ts` | registered; `generate:gqlSchema` + `codegen` rerun (schema + generated types contain all three queries, the mutation, and the new object/enum types) |
| 9.TE docs | `frontend/common/graphql/sharedDocuments/whatsapp/whatsapp-inbox.documents.ts` + sub-barrel | 3 query documents + `updateWhatsappAccountPurposeMutationDocument`; `id` on every object selection (fragments shared) |
| 9.TE | `frontend/common/graphql/test/whatsapp/whatsapp-inbox.test.ts` | new — 9 tests, all pass |

## Test results (9.TE)

`bun run scripts/lib/run-locked-cmd.ts test:graphql bun run test/scripts/run-server-tests.ts frontend/common/graphql/test/whatsapp/whatsapp-inbox.test.ts --bail`
→ **9 passed / 0 failed**, 36 assertions, 39.6s (real dev server, real DB):

- Permission denial (`teacher_default` lacks `WHATSAPP_INBOX_VIEW`): `whatsappConversations`, `whatsappSyncStatus`, `updateWhatsappAccountPurpose` all rejected at resolver + service.
- Pagination envelope: fresh account → `rows: []`, `totalCount: 0`, `pageInfo{ total: 0, currentPage: 1, hasMorePages: false }`.
- IDOR/ownership guard: unknown `conversationId` → `WHATSAPP_CONVERSATION_NOT_FOUND` (conversation row is verified before any message rows are read).
- `whatsappSyncStatus` overview: `syncStatus: NOT_STARTED`, `syncProgress: 0`, `requests: []`.
- Purpose mutation: inactive account → `whatsapp.purposeRequiresActive`; missing → `WHATSAPP_ACCOUNT_NOT_FOUND`; token-set + activated account → success (`isActive: true` round-trip). All test flows run exclusively through GraphQL documents (accounts provisioned via `createWhatsappAccount`, activated via `setWhatsappAccessToken` + `updateWhatsappAccount`).

Regression sanity: `whatsapp-embedded-signup.test.ts` 13/13 and `whatsapp-optin.test.ts` 16/16 pass via `run-test.ts` after the `whatsapp-account.service.ts` edit.

**Scope note on conversations/messages fixtures**: integration-test rules forbid importing backend repos/services/drizzle, and no GraphQL write path creates conversations (webhook-only), so thread rows can't be seeded from the test layer. Positive thread reads (real messages, chunk pages) are covered by Phase 7 ingest tests and Phase 13 journeys; this suite covers the envelope, gating, and ownership contract at the GraphQL boundary.

## Quality loop (9.QL)

`sub-loop.ts --lifecycle codescene` exit 0 for every touched file: inbox pothos, inbox query, mutation edit, inbox service, account service, types file, errors.ts, three backend barrels, documents file + barrel, test file. One fix driven by the loop: `import-x/no-duplicates` (split `@/backend/types` imports merged into a single mixed value/type import).

## 9.SEC — security & tenancy

- Resolver `authScopes: { permission: WHATSAPP_INBOX_VIEW }` AND service-level `hasPermission(context, …)` (defense in depth); context always from `ctx` (`{ permissions, permissionGroups, isSuperAdmin, role }`) — no `PermissionsService.getUserContext` re-query.
- `conversationId`/`accountId` are client-supplied and verified by existence before reads; unknown ids → `NotFoundError` (IDOR-safe: nothing is fetched through an unverified id).
- No credential/secret columns exposed (message/contact/conversation types carry no token fields); no payload logging added.
- Purpose mutation requires `WHATSAPP_CONFIG_MANAGE` at resolver and service; inactive-assignment rejected; audit row written; channel cache reset.

## 9.SR — semantic review

- No `...input` spread into service calls (mapping is explicit); pagination bounded by `PaginationArgs.MAX_COUNT`; no module-level mutable state; no new env-config keys; Pothos enums reference the real `backend/enum/whatsapp/` enums via `shared/enum.pothos` (no literal arrays). No new replay/idempotency gaps → nothing appended to `deferred-items.md`.

## 9.IV — instruction verification

Complied with: root `AGENTS.md`; `backend/AGENTS.md`; `backend/graphql(/{pothos,query,mutation})/AGENTS.md` (single canonical object types from `@/backend/types` — no local defs; `id` on every object incl. cache-scoped wrapper ids; side-effect barrels; enum registration pattern); `backend/services/AGENTS.md` (types from `backend/types/`, no service `.types.ts`); `frontend/common/graphql/test/AGENTS.md` (documents not raw strings, full mutation variables, generated enums, `@/test/helpers`); `frontend/common/graphql/sharedDocuments/AGENTS.md` (document naming convention, `id` on every selection, barrel wiring); `.agents/instructions/{backend,tests,frontend}.instructions.md` (barrel rules, DomainError pattern).

## Carry-forward for later phases

1. **Phase 11/12**: types + documents already expose everything needed — `whatsapp-inbox.documents.ts` holds the shared conversation/message fragments and both list queries + purpose mutation; Phase 12.2 should EXTEND this file (view-model extras), not recreate it.
2. **`updateWhatsappAccountPurpose` resolves through `activate-then-assign`**: credentials must exist before purpose can be assigned (inactive → `whatsapp.purposeRequiresActive`) — the Numbers UI should surface that flow.
3. **Wrapper result ids** are cache-scoped (`whatsapp-conversations:<accountId|all>`, `whatsapp-messages:<conversationId>`) so Apollo normalizes per filter.
4. `WhatsappAccountPothosObject` deliberately does NOT expose `purpose`/`onboardingMode`/sync fields yet — if Phase 11.1's fragment needs them for the Numbers tab, that's a one-line-per-field `t.expose` addition to `whatsapp-account.pothos.ts` (backend enums already registered).

## Cross-file dependencies

None outstanding.
