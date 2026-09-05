# WhatsApp v2 — Trackable Tasks

## Document Information

- **Feature Name**: WhatsApp Multi-Number + Coexistence
- **Target Directory**: `.ai/plans/whatsapp2`
- **Outcome Directory**: `.ai/plans/whatsapp2/outcome/`
- **Version**: 1.0 · **Date**: 2026-09-04
- **Related**: [specs.md](./specs.md) · [implementation.md](./implementation.md) · [deferred-items.md](./deferred-items.md)

## Non-Negotiable Execution Protocol

1. **Pre-Execution Outcome Read** — read ALL of `.ai/plans/whatsapp2/outcome/` before any task (Meta constraints live there; do not re-derive from training data).
2. **Per-File Verification** — after editing any file: `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` (tsgo → oxlint → biome → lint → duplicates → codescene), exit 0 required.
3. **Semantic Review** — race conditions, env-config registration, cache invalidation completeness, deferred-items logging before marking `[x]`.
4. **Global Health Check** — all modified files pass sub-loop before a task closes.
5. **Outcome File** — write `.ai/plans/whatsapp2/outcome/<task-id>-outcome.md` per completed task.
6. **Checkbox Tracking** — flip `[ ] → [x]` on completion; parent task `[x]` only when all subtasks are `[x]`.

## Task Status Legend

| `[ ]` not started | `[-]` in progress | `[x]` done |
|---|---|---|

## Mandatory Pipeline Subtask Shapes (referenced by every implementation task)

- **X.Y.QL — Quality Loop**: `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` per modified file until exit 0.
- **X.Y.TE — Test Engineering** (4-tier): T1 100% branch coverage of new logic; T2 boundary (empty/unicode/timestamps/limits); T3 chaos (`Promise.allSettled` concurrent upserts, out-of-order webhook frames); T4 abuse (IDOR, permission denial, wildcard injection). Layer rules: repo tests in `runInRollback` with full `tx` propagation; service tests mock Meta fetch/Redis; GraphQL tests via `testClient`; journeys in `test/workflows/` with committed fixtures, no `runInRollback`.
- **X.Y.SEC — Security & Tenancy Audit**: identity from ctx/session only; receiver↔account binding checks; permission gates at resolver+service; HMAC/replay semantics intact; webhook payload sanitized.
- **X.Y.SR — Semantic Review**: no client-supplied ID without ownership check; no unvalidated `...input` spread; no read-then-write without lock; no unbounded module state; env-config keys registered + `environment.d.ts` / `.env.example` updated for every new key + `resetWhatsappChannel` invalidates all; enums value-imported; replay/idempotency gaps logged into `deferred-items.md`.
- **X.Y.IV — Instruction Verification**: read files printed by sub-loop (AGENTS.md + `.agents/instructions/*.md` for each touched file) and validate compliance.

**Sequence per subtask**: QL → TE → SEC → SR → IV → mark `[x]`.

## Phase 0: Baseline

- [x] **0. Pre-implementation baseline + ledger init**
  - [x] 0.1 Record baselines: `bun tsgo 2>&1 | grep -c "error TS"`; `bun biome:check` warn count; `bun run scripts/lint-service.ts --json --id baseline` → saved under `.ai/plans/whatsapp2/outcome/0-baseline-outcome.md`.
  - [x] 0.2 Confirm `deferred-items.md` (authored with the plan) lists the pre-existing v1 gaps with `📋` statuses (plan will NOT fix): templates query/opt-in audit resolvers, apiVersion inconsistency NOTE (this plan DOES fix it — defer only if descoped), Groups API, Marketing Messages API, free-text send BL4, inbox composer.
  - [x] 0.3 Re-read all four `outcome/*.md` research files; confirm no Meta fact needed that is missing — if missing, query docs MCP (`search_docs`, library `whatsapp`) and APPEND to the relevant outcome doc.
  - _Requirements: REQ-0_

## Phase 1: Schema, Enums, Permissions

- [x] **1. Extend whatsapp schema + new tables + permissions**
  - [x] 1.1 Edit `backend/db/schema/whatsapp/whatsapp-accounts.ts` — add `purpose`, `onboardingMode`, `syncStatus`, `syncPhase`, `syncProgress`, `syncDeadlineAt`, `syncFailureReason`, `offboardedAt`; defaults preserve v1 (`GENERAL`/`CLOUD_API`/`NOT_STARTED`). Meta `request_id` values live on `whatsapp_sync_requests` (per sync type), NOT on the account row.
  - [x] 1.2 Create `backend/db/schema/whatsapp/whatsapp-conversations.ts`, `whatsapp-messages.ts`, `whatsapp-contacts.ts`, `whatsapp-webhook-events.ts`, `whatsapp-sync-requests.ts` — per implementation.md; `wamid` unique; `(accountId, syncType)` unique; partial uniques for waId/userId keys; dialect-aware `checkConstraint` only.
  - [x] 1.3 Edit `backend/db/schema/whatsapp/index.ts` barrel + confirm top-level `backend/db/schema/index.ts` re-export.
  - [x] 1.4 Add new `<entity>.enum.ts` files under the existing `backend/enum/whatsapp/` subdir (its `index.ts` barrel already exists and keeps the deprecated shared-constants re-export untouched): `WhatsappAccountPurpose`, `WhatsappOnboardingMode`, `WhatsappSyncStatus`, `WhatsappMessageDirection`, `WhatsappWebhookEventStatus`, `WhatsappSyncRequestStatus` (`PENDING/REQUESTED/STREAMING/COMPLETE/FAILED`), `WhatsappSyncType`; register all seven in `backend/db/schema/enums.ts` via `createPgEnumFromEnum`.
  - [x] 1.5 Edit `backend/graphql/pothos/shared/enum.pothos.ts` — register the seven enums.
  - [x] 1.6 Edit `backend/enum/permissions/permission.enum.ts` (existing entries at lines 276–278) — add `WHATSAPP_INBOX_VIEW = "whatsapp.inbox_view"` + `WHATSAPP_INBOX_MANAGE = "whatsapp.inbox_manage"` (string style matches existing `whatsapp.view`/`whatsapp.config_manage`); create two-phase SQL migrations in `backend/db/migration/`: (a) `ALTER TYPE app_permission ADD VALUE ...` (phase 1), (b) INSERT permission rows + grant to `super_admin`, `academy_admin`, `staff_default`/`supervisor_default` for VIEW only (phase 2, separate migration — AppPermission enum gotcha).
  - [x] 1.7 Run `bun run db push` + `bun run db migrate`; verify columns/enums exist.
  - [x] 1.QL — sub-loop on each schema/enum file (codescene).
  - [x] 1.TE — schema smoke via repo boot test (migration applies, enums round-trip).
  - [x] 1.SEC — confirm no `encryptedText` misuse; unique indexes correct.
  - [x] 1.SR — semantic list (see header).
  - [x] 1.IV — `backend/db/schema/AGENTS.md`, `backend/AGENTS.md`, `backend.instructions.md`.
  - Outcome: `outcome/1-schema-outcome.md` · _Requirements: REQ-1, REQ-6_

## Phase 2: Backend Types

- [x] **2. Types in `backend/types/whatsapp/`**
  - [x] 2.1 Create `whatsapp-inbox.types.ts` — Conversation/Message/Contact Select/Insert/Return types + pagination inputs.
  - [x] 2.2 Create `whatsapp-sync.types.ts` + `whatsapp-webhook-event.types.ts`.
  - [x] 2.3 Edit `whatsapp-account.types.ts` — purpose/onboarding/sync fields in Select/Insert/Submit.
  - [x] 2.4 Edit `whatsapp-channel.types.ts` — `WhatsappPayload.senderAccountId` + `purpose`.
  - [x] 2.5 Extend `whatsapp-webhook.types.ts` — typed unions for `history`, `smb_app_state_sync`, `smb_message_echoes`, `account_update` payloads (mirror shapes in `docs-research-coexistence.md`).
  - [x] 2.6 Edit `backend/types/whatsapp/index.ts` barrel.
  - [x] 2.QL / 2.TE (type-only: tsgo + compile check) / 2.SEC / 2.SR / 2.IV — `backend/types/AGENTS.md`.
  - Outcome: `outcome/2-types-outcome.md` · _Requirements: REQ-1, REQ-2, REQ-6, REQ-8_

## Phase 3: Repositories

- [x] **3. WhatsApp repos (`backend/db/repo/whatsapp/`)**
  - [x] 3.1 Create `whatsapp-conversation.repository.ts` — upsert by account+waId/userId; update `lastMessageAt`/`lastMessagePreview` atomically; paginated list per account.
  - [x] 3.2 Create `whatsapp-message.repository.ts` — upsert by `wamid`; `markRevoked`, `applyEdit`, `attachMedia`; paginated thread query.
  - [x] 3.3 Create `whatsapp-contact.repository.ts` — upsert with LWW on `lastActionAt`; remove handling.
  - [x] 3.4 Create `whatsapp-webhook-event.repository.ts` — insert, claimBatch (`SELECT FOR UPDATE SKIP LOCKED`), markProcessed/Failed, stale requeue.
  - [x] 3.5 Create `whatsapp-sync-request.repository.ts` — insert unique (accountId, syncType), recordRequestId, status transitions.
  - [x] 3.6 Edit `whatsapp-account.repository.ts` — add `findActiveByPurpose(purpose)`, `findActiveGeneral()`, remove reliance on `findFirstActiveForCredentials` for sends (keep for legacy fallback until Task 4), sync-status mutators.
  - [x] 3.7 Update `backend/db/repo/whatsapp/index.ts` barrel.
  - [x] 3.8 Repo-layer mandates (`backend/db/repo/AGENTS.md`): all non-transactional reads use `queryDb(tx)` (Neon HTTP rule); NEVER `inArray(col, sql.placeholder(...))` with prepared statements (PG protocol limitation); expose DataLoader batch lookup methods where GraphQL field resolvers need them; repositories contain data access only (no permission/business logic).
  - [x] 3.QL / 3.TE — repo tests live in `backend/db/test/repo/whatsapp/` (runInRollback + full `tx` propagation, 100% line/branch coverage per `backend/db/test/AGENTS.md`, `bun run test/scripts/run-test.ts`; duplicate wamid no-op; chunk dedupe; LWW timestamps; SKIP LOCKED claiming) / 3.SEC / 3.SR / 3.IV — `backend/db/repo/AGENTS.md`.
  - Outcome: `outcome/3-repos-outcome.md` · _Requirements: REQ-2, REQ-5, REQ-6_

## Phase 4: Per-Account Adapter & Factory

- [x] **4. Factory + adapter multi-numberization**
  - [x] 4.1 Edit `WhatsappChannelFactory.ts` — per-account instance map, `getWhatsappChannel(accountId)`, `getChannelForPurpose(purpose)` (resolution helper), reset per-account; keep legacy default path for `syncFromMeta` admin flow until Task 4.4.
  - [x] 4.2 Edit `MetaCloudApiAdapter.ts` — constructor takes accountId; `resolveCredentials` per account; remove first-active fallback for sends; pair rate-limit key `whatsapp:pair:<sender>:<recipient>`; remove hardcoded `v20.0` → env-config default `v25.0` (current docs example version) (register key `WHATSAPP_GRAPH_API_VERSION` in `backend/lib/env-config-keys.ts` under the `whatsapp` category, DB-overridable via `env::` settings; NOT in the `shared/constants/env-config-keys.ts` hidden list — it is not a secret).
  - [x] 4.2a Register key `WHATSAPP_ES_CONFIG_ID` in `backend/lib/env-config-keys.ts` under the `whatsapp` category (the v4 Facebook Login for Business configuration ID — NOT a secret, DB-overridable; resolves server-side and is passed to the ES dialog client component via props from the settings server page, never hardcoded client-side).
  - [x] 4.2b Update `.env.example` and `environment.d.ts` for BOTH new keys — mandatory whenever entries are added to `ENV_CONFIG_KEYS` (v1 env-typing gotcha); keep declarations grouped with the existing WHATSAPP_* block.
  - [x] 4.3 Offboarded accounts: adapter eviction + `whatsapp.accountOffboarded` error before Graph call.
  - [x] 4.4 Migrate `syncFromMeta` to per-account credentials (remove env-global token path for DB-managed accounts); keep env path only for bootstrapping first account, documented.
  - [x] 4.5 Aggregate `isWhatsappConfigured`/`validateConfig`; add per-account health resolver hook.
  - [x] 4.QL / 4.TE — service tests: mocked fetch, per-account cache isolation, rate-limit keying, offboard fail-fast, version resolution / 4.SEC / 4.SR (reset invalidates ALL keys incl. new version key) / 4.IV.
  - Outcome: `outcome/4-adapter-outcome.md` · _Requirements: REQ-3_

## Phase 5: Purpose Routing

- [x] **5. NOTIFICATION_TEMPLATE_MAP → dispatch routing**
  - [x] 5.1 Edit `notification-payloads.builders.ts` — add `purpose` per event in `NOTIFICATION_TEMPLATE_MAP` (5 v1 events → `STUDENTS`).
  - [x] 5.2 Edit `notification-dispatch.helpers.ts` — carry purpose through `metadata.whatsappTemplate`.
  - [x] 5.3 Edit `communication.service.ts` `dispatchWhatsapp` — resolve account by purpose with GENERAL fallback + `logger.warn`; attach `senderAccountId` on payload + delivery row attribution; error `whatsapp.noSenderForPurpose` when none.
  - [x] 5.QL / 5.TE — service tests: each event routes to correct account; deactivated purpose fallback; no-purpose default; 5.SEC; 5.SR; 5.IV.
  - Outcome: `outcome/5-routing-outcome.md` · _Requirements: REQ-2_

## Phase 6: Coexistence Sync Orchestrator

- [x] **6. `whatsapp-coexistence-sync.service.ts` + request builder**
  - [x] 6.1 Create `cloud-api/requests/request-smb-app-data.request.ts` (build/parse `POST /<PHONE_NUMBER_ID>/smb_app_data`; sync types from docs-research-coexistence §2).
  - [x] 6.2 Create `backend/services/whatsapp/whatsapp-coexistence-sync.service.ts` — `enqueuePostOnboardingSync` (tx: insert 2 sync_requests rows, POST each, store requestId, set account sync REQUESTED + deadlineAt), retry-safe (requestId-guard), decline/deadline transitions, `getSyncStatus`.
  - [x] 6.3 Deadline sweeper hook (registration in cron service; flips expired PENDING to FAILED).
  - [x] 6.QL / 6.TE — service tests: one-shot enforced (unique violation on second POST attempt w/ existing requestId), deadline sweep, decline transition, progress updates. 6.SEC. 6.SR. 6.IV.
  - Outcome: `outcome/6-sync-outcome.md` · _Requirements: REQ-5_

## Phase 7: Durable Webhook Ingest

- [x] **7. Route + event queue + handler**
  - [x] 7.1 Edit `app/api/webhooks/whatsapp/route.ts` — remove `stripInboundMessages` call + strip fn + 24h identical-body rejection; insert per-change event rows pre-200; 5-minute payloadHash replay window (accept-but-skip); keep HMAC/1MB/per-IP.
  - [x] 7.2 Edit `whatsapp-webhook.handler.ts` — `processPendingWebhookEvents(claim)` + field dispatch: `history` (phases/chunk_order/progress, threads→messages upsert, media_placeholder), `smb_app_state_sync` (contacts LWW add/remove), `smb_message_echoes` (echo/revoke/edit), `messages` inbound branch; statuses preserve existing `handleDeliveryWebhook` path; remove analytics CLASS_REMINDER fallback for pure inbound.
  - [x] 7.3 Media follow-up correlation: `mediaPlaceholder` flip + asset id persistence (7-day fetch window after the media webhook; 14 days is only the history follow-up eligibility cutoff — see implementation D8).
  - [x] 7.4 Sweeper cron registration (stale-PENDING reclaim with retry/backoff; poison park) in existing cron service.
  - [x] 7.5 `account_update` lifecycle handling (offboard/reconnect/partner-uninstall/disable; `PARTNER_REMOVED` with `disconnection_info.reason`; capability update) per implementation Component 6 — the `business_capability_update` parser MUST accept `max_daily_conversations_per_business` as both `TIER_*` strings and integer-style values, MUST also parse the legacy `max_daily_conversation_per_phone` (the only field Meta sends on webhooks <v24.0), and MUST tolerate absent `max_phone_numbers_per_business`/`max_phone_numbers_per_waba` (conditional inclusion — absence ≠ no cap).
  - [x] 7.QL / 7.TE — handler tests: burst chunk ingest (batched), identical-body retry accepted + deduped, short-window replay skip, revoke-before-original, media placeholder→media arrival, 2593109 decline mapping, offboard eviction. Extend `backend/services/whatsapp/test/whatsapp-webhook.handler.test.ts`; mirror route changes in `app/api/webhooks/whatsapp/route.test.ts`. 7.SEC (HMAC fail → 401 + no insert; sanitize logging). 7.SR. 7.IV.
  - Outcome: `outcome/7-webhook-outcome.md` · _Requirements: REQ-6, REQ-7_

## Phase 8: Embedded Signup Onboarding

- [ ] **8. ES v4 client + server complete**
  - [ ] 8.1 Server: token exchange helper + `GET /<WABA_ID>?fields=phone_numbers` resolution (reuse `list-phone-numbers.request.ts`); `subscribed_apps` request builder; coexistence confirm (`is_on_biz_app && platform_type`) in `whatsapp-account.service.ts` (`completeEmbeddedSignup`).
  - [ ] 8.2 GraphQL mutation `completeWhatsappEmbeddedSignup` (+ account creation with onboardingMode + immediate sync enqueue).
  - [ ] 8.3 Frontend: ES dialog component (FB SDK loader, session-logging listener, CANCEL/ERROR surfaces) on Numbers tab (`frontend/common/views/dashboard/settings/whatsapp/` + desktop/mobile variants).
  - [ ] 8.QL / 8.TE — mocked FB SDK session events; token exchange mocked; decline path; only-waba_id payload. 8.SEC (code single-use; `config_id` from `WHATSAPP_ES_CONFIG_ID` env-config, never client input). 8.SR. 8.IV.
  - Outcome: `outcome/8-signup-outcome.md` · _Requirements: REQ-4_

## Phase 9: GraphQL Inbox Surface

- [ ] **9. Inbox queries + purpose mutation + codegen**
  - [ ] 9.1 `backend/graphql/pothos/whatsapp/whatsapp-inbox.pothos.ts` — object types only.
  - [ ] 9.2 `backend/graphql/query/whatsapp/whatsapp-inbox.query.ts` — `whatsappConversations`, `whatsappConversationMessages`, `whatsappSyncStatus`. Permission checks MUST pass `UserPermissionContext` from `ctx` (`{ permissions, permissionGroups, isSuperAdmin, role }`) into the service's `hasPermission(...)` — never re-query via `PermissionsService.getUserContext(userId)` (cold-start rule). Resolver errors MUST be DomainError subclasses (`ForbiddenError` etc.). Pothos enum types reference the real `backend/enum/whatsapp/` enums (no literal arrays).
  - [ ] 9.3 Edit `whatsapp-account.mutation.ts` — `updateWhatsappAccountPurpose` (WHATSAPP_CONFIG_MANAGE) + register `completeWhatsappEmbeddedSignup` (from Task 8).
  - [ ] 9.4 Barrels (`query/whatsapp/index.ts`, pothos index) + `bun run generate:gqlSchema && bun run codegen`.
  - [ ] 9.QL / 9.TE — GraphQL integration tests via testClient (permission denial, pagination). 9.SEC (IDOR: conversationId belongs to tenant account). 9.SR. 9.IV.
  - Outcome: `outcome/9-graphql-outcome.md` · _Requirements: REQ-8_

## Phase 10: i18n

- [ ] **10. `whatsappInbox` namespace + whatsapp additions (EN + AR)**
  - [ ] 10.1 Create `shared/locale/types/whatsappInbox/index.ts` + leaves en/ar; wire both surfaces (`en/messages.ts` + `ar/messages.ts` + `namespaces/whatsappInbox/whatsappInbox.namespace.ts` via `defineNamespace` with a stable string id); register `whatsappInboxTranslations` in `shared/locale/types/message.ts`; add a `WhatsappInbox` handle entry to the `Translation` registry in `shared/locale/namespaces/translation.ts`.
  - [ ] 10.2 Extend `shared/locale/types/whatsapp/index.ts` (+ en/ar leaves): purpose labels, sync statuses, onboarding strings, new errors (`noSenderForPurpose`, `purposeRequiresActive`, `accountOffboarded`, `coexistenceTakenByOtherPartner`, `embeddedSignupFailed`, `syncDeadlineExpired`, `historyDeclined`, `webhookProcessingFailed`).
  - [ ] 10.3 `bun run locale:snapshots`; verify both locales.
  - [ ] 10.QL / 10.TE (snapshot + key parity) / 10.SEC / 10.SR / 10.IV — `shared/AGENTS.md`, `shared/locale/AGENTS.md`.
  - Outcome: `outcome/10-i18n-outcome.md` · _Requirements: REQ-0.5, REQ-8_

## Phase 11: Frontend — Numbers Tab Extensions

- [ ] **11. Purpose + coexistence surfaces**
  - [ ] 11.1 Extend `WhatsappAccountFields` fragment + `whatsapp.documents.ts` (purpose, onboardingMode, sync status fields).
  - [ ] 11.2 Create/edit dialogs: purpose select (`createAccountDialog/`, `editNameDialog/`), `whatsappFormValidation.ts` purpose validator.
  - [ ] 11.3 `NumberCard` — purpose chip + coexistence sync status (`whatsappStatusBadge` category extension) + sync % + `coexistenceRestrictionsHint` tooltip.
  - [ ] 11.4 `whatsappTabSharedProps.ts` prop-contract update across tabs/__shared__ scaffolds + desktop/mobile tab files.
  - [ ] 11.QL / 11.TE — component tests for card + dialogs. 11.SEC. 11.SR. 11.IV.
  - Outcome: `outcome/11-numbers-ui-outcome.md` · _Requirements: REQ-1_

## Phase 12: Frontend — Inbox Tab

- [ ] **12. Inbox tab end-to-end**
  - [ ] 12.1 `whatsappConfig.constants.ts` (`TAB_IDS`/`TAB_LABELS`/`TAB_PERMISSIONS` inbox entry), `WhatsappConfigView.tsx` union, `whatsappTabUrl.ts`.
  - [ ] 12.2 Create `frontend/common/graphql/sharedDocuments/whatsapp/whatsapp-inbox.documents.ts` (`whatsappConversationsQueryDocument`, `whatsappConversationMessagesQueryDocument` — `id` on every object type per sharedDocuments rules) + `useWhatsappInboxViewModel.ts` (queries, account filter, pagination, refetch-on-focus polling).
  - [ ] 12.3 `tabs/shared/InboxTabContent.tsx` + `tabs/shared/ConversationThread.tsx` (AppDataGrid/MobileCardList, thread bubbles, media placeholder/expiry rendering, revoke/edit markers).
  - [ ] 12.4 Desktop + mobile lazy tab files; `WhatsappTabPanels.tsx` wiring with `RequirePermission`.
  - [ ] 12.QL / 12.TE — component tests: gating (no-permission hides tab), list/thread render, empty state, RTL. 12.SEC. 12.SR. 12.IV — `frontend/AGENTS.md`, `frontend/common/views/AGENTS.md`, `frontend.instructions.md`, `mobile-desktop.instructions.md`.
  - Outcome: `outcome/12-inbox-ui-outcome.md` · _Requirements: REQ-8_

## Phase 13: Journey Test

- [ ] **13. `test/workflows/whatsapp/coexistence-routing.test.ts`** (test-first)
  - [ ] 13.1 Cast helper additions in `test/workflows/helpers/` (whatsapp admin/staff actors via `assignSystemGroup`).
  - [ ] 13.2 Journey: purpose config → template dispatch lands on correct account; offboard → fail-fast; reconnect → active; onboarding sync enqueue → history/echo chunks ingested → staff reads inbox; unauthorized user denied; notification dispatch spied via `dispatchWithPreferences`.
  - [ ] 13.3 `test/workflows/whatsapp/DIAGRAMS.md` mermaid + `bun run validate:mermaid`.
  - [ ] 13.QL / 13.TE / 13.SEC / 13.SR / 13.IV — `test/workflows/AGENTS.md` committed fixtures (no runInRollback).
  - Outcome: `outcome/13-journey-outcome.md` · _Requirements: J1, J2, J3, cross-actor EARS_

## Phase 14: Final Quality Gate

- [ ] **14. Global health + deferred enforcement + v1 regression**
  - [ ] 14.1 `grep -c "❌\|⚠️" .ai/plans/whatsapp2/deferred-items.md` → 0 unresolved-blocking (📋 Future entries are accepted).
  - [ ] 14.2 `bun tsgo && bun biome:check && bun run lint` vs baseline (record deltas).
  - [ ] 14.3 Run suites: `bun run test/scripts/run-test.ts` for each new/edited repo+service+handler test file; `bun run test:workflows`; `bun run test:ui:components` (inbox/numbers tests).
  - [ ] 14.4 v1 regression smoke: single-account tenant sends template end-to-end (adapter path unchanged externally); existing `whatsapp-webhook.handler.test.ts` status-delivery assertions green without `stripInboundMessages`.
  - [ ] 14.5 Update `trackable-tasks.md` all `[x]`.
  - Outcome: `outcome/14-quality-outcome.md` · _Requirements: REQ-0_

## Phase 15: Knowledge Propagation

- [ ] **15. Canonical docs + AGENTS/skill updates**
  - [ ] 15.1 Create `docs/services/whatsapp-coexistence-multi.md` — multi-number routing, coexistence onboarding/sync lifecycle, durable ingest + replay/idempotency policy, per-pair limits, error codes, ops checklist (Dashboard field subscriptions).
  - [ ] 15.2 Update `docs/services/whatsapp-cloud-api.md` — mark r3 "2 HIGH fixed" notes correct per inventory; add v2 cross-link.
  - [ ] 15.3 Update `docs/frontend/whatsapp-ui-patterns.md` — inbox tab + purpose surfaces.
  - [ ] 15.4 Update AGENTS.md: `backend/services/AGENTS.md` (per-account channel pattern + durable ingest rule), root `AGENTS.md` Important References (new docs link), `shared/locale/AGENTS.md` only if new convention emerged.
  - [ ] 15.5 Update `.agents/skills/` (e.g. write-tests journey notes) if new patterns emerged.
  - [ ] 15.6 Final sub-loop on edited docs-adjacent files (docs are markdown — lint only).
  - Outcome: `outcome/15-knowledge-outcome.md` · _Requirements: Knowledge propagation protocol_

## Dependencies

- 1 → 2 → 3 (schema → types → repos)
- 3 → 4 → 5 (repos → adapter → routing)
- 1 → 6 (schema → sync orchestrator); 3 → 7 (repos → ingest)
- 6 + 7 → 8 (orchestrator used by signup completion)
- 3 → 9 → 10 → 11 → 12 (repos → GraphQL → i18n → frontend)
- 5 + 7 + 9 → 13 (journey needs routing + ingest + GraphQL)
- 13 → 14 → 15

## Phase 1.5: Plan Review Gate (run before implementation starts)

- [x] PR-1 Run @plan-review over `specs.md`, `implementation.md`, `trackable-tasks.md`; fix violations; write `outcome/plan-review-R1.md`.
