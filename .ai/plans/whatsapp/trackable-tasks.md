# WhatsApp Integration — Trackable Tasks

## Document Information

- **Feature Name**: WhatsApp Business Cloud API (Meta direct)
- **Version**: 1.2
- **Date**: 2026-07-30
- **Status**: Post-review; all C/B/S/P/BL/Q findings applied
- **Target Directory**: `.ai/plans/whatsapp`
- **Outcome Directory**: `.ai/plans/whatsapp/outcome`
- **Related Documents**:
  - [Requirements (Specs)](./specs.md)
  - [Implementation Guide](./implementation.md)

## Non-Negotiable Execution Protocol for All Tasks

1. **Pre-Execution Outcome Knowledge Read:**  
   Before executing ANY task, the executing agent MUST read ALL existing files in `.ai/plans/whatsapp/outcome/` to absorb prior research, search results, docs, and pitfalls so analysis is not repeated.
2. **Per-File Quality Verification Loop (Immediate post-edit):**  
   Whenever a file is modified, execute per-file verification (`bun tsgo` + `bun biome:check` + lint queue for target file) BEFORE moving to another file or subtask.
3. **Global Health Check (Completion Gate):**  
   Before marking any subtask as complete, run full global checks: `bun tsgo`, `bun biome:check`, and `bun run lint` globally. All MUST exit with **zero errors and zero warnings**.
4. **Post-Execution Outcome File Creation:**  
   Upon completing the task implementation and quality checks, write a new outcome document under `.ai/plans/whatsapp/outcome/<task-id>-outcome.md` summarizing research, analysis, changes, and carry-over knowledge.
5. **Task Progress Tracking:**  
   The executing agent MUST update the task checkbox `[ ]` -> `[x]` in this `trackable-tasks.md` file upon successful completion.

## Task Status Legend

| Marker | Meaning |
|--------|---------|
| `[ ]` | Not started |
| `[-]` | In progress |
| `[x]` | Completed |

**Rules:**
- Mark a parent task `[-]` when any sub-task is in progress
- Mark a parent task `[x]` only when ALL sub-tasks are `[x]`
- Update this file as you work — single source of truth for execution progress
- Reference requirements as `REQ-N` from [specs.md](./specs.md)
- Review-finding tags (C1..Q5) reference the review at the top of [implementation.md](./implementation.md)

---

## Phase 1: Channel Foundations

- [x] **1. Enum and type extension with both forced compile fixes (REQ-1, C1)**
  - [x] 1.1 Edit `backend/types/notifications/communications.types.ts` — add `"whatsapp"` to `CommunicationChannelType`
  - [x] 1.2 Edit `backend/enum/notifications/notificationDeliveries.enum.ts` — `WHATSAPP = "WHATSAPP"`
  - [x] 1.3 Edit `backend/db/schema/enums.ts` — Drizzle `notificationChannel` enum value **(AUTO: `createPgEnumFromEnum` picks up new value)**
  - [x] 1.4 Edit `backend/graphql/pothos/shared/enum.pothos.ts` — register `NotificationChannel.WHATSAPP` **(AUTO: `gqlSchemaBuilder.enumType(NotificationChannel, ...)` picks up new value)**
  - [x] 1.5 **Edit `backend/services/communication/utils.ts`** — add `whatsapp: "WhatsApp"` to `CHANNEL_LABELS` (C1; without this the enum change breaks `Record<DeliveryChannel, string>` totality)
  - [x] 1.6 Run `bun run generate:gqlSchema && bun codegen`
  - [x] 1.7 Verify forced errors exist pre-Phase-6: `communication.service.ts` missing `case "whatsapp"`; then resolve them (task 6)
  - [x] 1.8 **Quality loop per file**: run `bun tsgo && bun biome:check && lint-queue-client` on each modified file
  - [x] 1.9 **AGENTS.md/instruction compliance**: read and fix violations against:
      - `backend/types/AGENTS.md`, `backend/AGENTS.md` + `.agents/instructions/backend.instructions.md` (types/enum files)
      - `backend/db/schema/AGENTS.md`, `backend/AGENTS.md` + `.agents/instructions/backend.instructions.md` (schema enum)
      - `backend/graphql/AGENTS.md`, `backend/AGENTS.md` + `.agents/instructions/backend.instructions.md` (Pothos enum)
      - `backend/services/AGENTS.md`, `backend/AGENTS.md` + `.agents/instructions/backend.instructions.md` (utils.ts)

- [x] **2. Env-config registry (REQ-3)**
  - [x] 2.1 Edit `backend/lib/env-config-keys.ts` — `whatsapp` category with 6 keys
  - [x] 2.2 Edit `backend/types/shared/env-config.types.ts` — `whatsapp` in `EnvConfigCategory`
  - [x] 2.3 Quality loop per file: run `bun tsgo && bun biome:check && lint-queue-client` on each modified file
  - [x] 2.4 **AGENTS.md/instruction compliance**: read and fix violations against:
      - `backend/lib/AGENTS.md` (or `backend/AGENTS.md`) + `.agents/instructions/backend.instructions.md` (env-config files)
      - `backend/types/AGENTS.md`, `backend/AGENTS.md` + `.agents/instructions/backend.instructions.md` (env-config types)

- [ ] **3. WhatsApp channel interface and factory (S4)**
  - [ ] 3.1 Create `backend/services/communication/channels/whatsapp/IWhatsappChannel.ts` — template-only `WhatsappPayload` with `template: WhatsappTemplateRef` + `components` (B1; no free-text `body` field in v1)
  - [ ] 3.2 Create `backend/services/communication/channels/whatsapp/WhatsappChannelFactory.ts` — includes exported `resetWhatsappChannel()` (S4: drops singleton + initialization promise so token rotation takes effect without restart)
  - [ ] 3.3 Create `backend/services/communication/channels/whatsapp/index.ts`
  - [ ] 3.4 Quality loop per file: run `bun tsgo && bun biome:check && lint-queue-client` on each modified file
  - [ ] 3.5 **AGENTS.md/instruction compliance**: read and fix violations against:
      - `backend/services/AGENTS.md`, `backend/AGENTS.md` + `.agents/instructions/backend.instructions.md` (channel interface, factory, index)

- [ ] **4. Typed Graph API request builders — core v1 set only (REQ-9, Q1)**
  - [ ] 4.1 Create `cloud-api/meta-cloud-api.types.ts` + shared `buildGraphUrl` / auth header helpers
  - [ ] 4.2 Create `send-template-message.request.ts` — POST `/{phone_number_id}/messages`
  - [ ] 4.3 Create `list-phone-numbers.request.ts` — GET `/{waba_id}/phone_numbers` **with cursor pagination loop until `paging.next` absent (P2)**
  - [ ] 4.4 Create `get-phone-number.request.ts` — GET `/{phone_number_id}` returning raw tier enum verbatim (Q5)
  - [ ] 4.5 Create `list-message-templates.request.ts` — GET `/{waba_id}/message_templates` with pagination; response must carry exact `language.code` for later send-time resolution (B6)
  - [ ] 4.6 **Do NOT create**: register / deregister / request_code / verify_code / create / delete template builders — admins use WhatsApp Manager in v1 (Q1)
  - [ ] 4.7 Quality loop per file: run `bun tsgo && bun biome:check && lint-queue-client` on each modified file
  - [ ] 4.8 **AGENTS.md/instruction compliance**: read and fix violations against:
      - `backend/services/AGENTS.md`, `backend/AGENTS.md` + `.agents/instructions/backend.instructions.md` (all request builder files)

- [ ] **5. MetaCloudApiAdapter (REQ-2, B2, P1, S4)**
  - [ ] 5.1 Create `cloud-api/MetaCloudApiAdapter.ts`:
    - `AbortSignal.timeout(10_000)` on all fetches
    - **Decrypt access token per send call**; never cache plaintext on the instance (S4)
    - **Pair-rate-limit in Redis** (not in-memory map): key `whatsapp:pair:<e164>`, TTL 60 s; when `now - last < 6000` **defer** the HTTP call by remaining ms — never mark delivery FAILED on guard hit or on Meta `131056` without a deferred retry (B2)
    - **Concurrency cap ≤ 10** parallel Graph API calls per fan-out (P1)
    - Bulk delivery-row writes via `createManyDeliveries`, not per-send `createDelivery` (P1)
    - Track send-attempted count for tier-budget accounting: failed sends still consume Meta budget; expose for `dispatchMulti` logging (Q4)
    - Terminal failure → `updateDeliveryStatus(FAILED)` + `deliveryFailedMessage("whatsapp")`
  - [ ] 5.2 Create `cloud-api/index.ts`
  - [ ] 5.3 Quality loop per file: run `bun tsgo && bun biome:check && lint-queue-client` on each modified file
  - [ ] 5.4 **AGENTS.md/instruction compliance**: read and fix violations against:
      - `backend/services/AGENTS.md`, `backend/AGENTS.md` + `.agents/instructions/backend.instructions.md` (adapter, index)

- [ ] **6. Notification dispatch wiring (REQ-1, B1, REQ-10/BL1)**
  - [ ] 6.1 Edit `notification-dispatch.helpers.ts` — `EVENT_CHANNEL_ALLOWLIST` adds `WHATSAPP` for `CLASS_REMINDER`, `CLASS_ACTIVATED`, `LESSON_REPORT_SUBMITTED`, `LESSON_REPORT_REVIEWED`, `INVOICE_GENERATED`; `recipientAddressForChannel` returns `user.phone` for whatsapp
  - [ ] 6.2 Edit `notification-payloads.builders.ts` — `ALL_CHANNELS` + `CHANNEL_FROM_ENUM` get whatsapp; **add `NOTIFICATION_TEMPLATE_MAP` per-event `{ templateName, paramsOrder }`** filling `metadata.whatsappTemplate` (B1); consult per-user opt-in gate so opted-out users get no WhatsApp payload (REQ-10/BL1)
  - [ ] 6.3 Edit `communication.service.ts` — **dedicated `dispatchWhatsapp` branch** reading `metadata.whatsappTemplate` → `IWhatsappChannel.send` (C2; never route through the email/sms-shaped `dispatchRecipientChannel`); fails fast with clear error if `whatsappTemplate` missing
  - [ ] 6.4 Quality loop per file: run `bun tsgo && bun biome:check && lint-queue-client` on each modified file
  - [ ] 6.5 **AGENTS.md/instruction compliance**: read and fix violations against:
      - `backend/services/AGENTS.md`, `backend/AGENTS.md` + `.agents/instructions/backend.instructions.md` (dispatch helpers, payload builders, communication service)

---

## Phase 2: Accounts Backend

- [ ] **7. Database schema (REQ-3, R2/R3/R8, B4, B5, Q5)**
  - [ ] 7.1 Create `backend/db/schema/whatsapp/whatsapp-accounts.ts` — `portfolioMessagingLimitTier` (store raw Meta enum verbatim: `UNTIERED / TIER_50 / TIER_250 / TIER_1K / TIER_10K / TIER_100K / TIER_UNLIMITED / TIER_NOT_SET`, Q5), `throughputLevel`, **`updatedAt` uses `.$onUpdate(() => new Date())` (B4)**
  - [ ] 7.2 Create `backend/db/schema/whatsapp/index.ts`
  - [ ] 7.3 Edit `backend/db/schema/index.ts` — barrel export
  - [ ] 7.4 Edit `backend/db/schema/communications/communications.ts` — **partial index `notification_deliveries_provider_message_id_idx ON (provider_message_id) WHERE provider_message_id IS NOT NULL`** (B5)
  - [ ] 7.5 **Edit custom migration SQL files in place** (our `bun db migrate` auto-detects modified SQL):
      - `8a-whatsapp-permissions-enum.sql` — enum only (3 perms, BL2)
      - `8b-whatsapp-permissions-data.sql` — seeds + super_admin grants
  - [ ] 7.6 Run `bun db migrate` then `bun db push` and verify
  - [ ] 7.7 Quality loop per file: run `bun tsgo && bun biome:check && lint-queue-client` on each modified file
  - [ ] 7.8 **AGENTS.md/instruction compliance**: read and fix violations against:
      - Schema files: `backend/db/schema/AGENTS.md`, `backend/AGENTS.md` + `.agents/instructions/backend.instructions.md`
      - Migration SQL: `backend/db/test/AGENTS.md` (seeding conventions)
      - Drizzle config: `backend/db/schema/AGENTS.md`, `backend/AGENTS.md`

- [ ] **8. Backend types and repository (REQ-3, REQ-8)**
  - [ ] 8.1 Create `backend/types/whatsapp/whatsapp-account.types.ts` — `ReturnType` excludes encrypted columns
  - [ ] 8.2 Create `backend/types/whatsapp/index.ts`
  - [ ] 8.3 Create `backend/db/repo/whatsapp/whatsapp-account.repository.ts` — CRUD, `findByPhoneNumberId`, `listActive`, all methods accept optional `tx`
  - [ ] 8.4 Create `backend/db/repo/whatsapp/index.ts`
  - [ ] 8.5 Quality loop per file: run `bun tsgo && bun biome:check && lint-queue-client` on each modified file
  - [ ] 8.6 **AGENTS.md/instruction compliance**: read applicable files for each modified file, fix violations:
      - Types files: `backend/types/AGENTS.md`, `backend/AGENTS.md` + `.agents/instructions/backend.instructions.md`
      - Repository files: `backend/db/repo/AGENTS.md`, `backend/AGENTS.md` + `.agents/instructions/backend.instructions.md`

- [ ] **9. WhatsApp account service (REQ-4, BL1, BL3, S4, P2, Q5)**
  - [ ] 9.1 Create `backend/services/whatsapp/whatsapp-account.service.ts`:
    - CRUD gated by `WHATSAPP_CONFIG_MANAGE` / `WHATSAPP_VIEW`
    - `syncFromMeta()` — cursor-paginated list (P2) + per-id get; store tier enum verbatim (Q5)
    - `syncFromMeta()` **also calls `list-message-templates` and snapshots `{ name, language, category, status }` onto audit entry `metadata` (BL3 — required, not optional)**
    - `setAccessToken` / `setTwoStepPin` — encrypt, audit `***`, then call `resetWhatsappChannel()` (S4)
    - **Per-user opt-in helpers (REQ-10/BL1)**: `isUserWhatsappOptIn(userId)`, `setUserWhatsappOptIn(userId, enabled, source)` writing `whatsapp_opt_in` audit event
  - [ ] 9.2 Create `backend/services/whatsapp/index.ts`
  - [ ] 9.3 Edit `backend/types/audit/audit.types.ts` — `WHATSAPP_ACCOUNT`
  - [ ] 9.4 Per-user opt-in storage: extend existing notification-preference storage with `whatsappEnabled` flag defaulting to **false** (REQ-10)
  - [ ] 9.5 Quality loop per file: run `bun tsgo && bun biome:check && lint-queue-client` on each modified file
  - [ ] 9.6 **AGENTS.md/instruction compliance**: read applicable files for each modified file, fix violations:
      - Service files: `backend/services/AGENTS.md`, `backend/AGENTS.md` + `.agents/instructions/backend.instructions.md`
      - Types file: `backend/types/AGENTS.md`, `backend/AGENTS.md` + `.agents/instructions/backend.instructions.md`

- [ ] **10. Permissions migration (REQ-6, BL2)**
  - [ ] 10.1 Edit `backend/enum/permissions/permission.enum.ts` — exactly **three** `WHATSAPP_*` permissions: `WHATSAPP_VIEW`, `WHATSAPP_CONFIG_MANAGE`, `WHATSAPP_TEMPLATES_MANAGE`; **`WHATSAPP_DISPATCH` omitted — no send-mutation exists in v1 (BL2)**
  - [ ] 10.2 Create `backend/db/migration/8a-whatsapp-permissions-enum.sql` — enum values only
  - [ ] 10.3 Create `backend/db/migration/8b-whatsapp-permissions-data.sql` — seed rows + `super_admin` grants; mirror `7a/7b` with `trg_protect_system_permissions` wrap
  - [ ] 10.4 Wire into `backend/drizzle/.custom-migrations.json`
  - [ ] 10.5 Run `bun db migrate` then `bun db push` and verify
  - [ ] 10.6 Quality loop per file: run `bun tsgo && bun biome:check && lint-queue-client` on each modified file
  - [ ] 10.7 **AGENTS.md/instruction compliance**: read applicable files for each modified file, fix violations:
      - Enum file: `backend/enum/AGENTS.md`, `backend/AGENTS.md` + `.agents/instructions/backend.instructions.md`
      - Migration SQL: `backend/db/test/AGENTS.md` (seeding conventions)
      - Drizzle config: `backend/db/schema/AGENTS.md`, `backend/AGENTS.md`

- [ ] **11. GraphQL layer (REQ-8, S4, BL3)**
  - [ ] 11.1 Create `backend/graphql/pothos/whatsapp/whatsapp.pothos.ts`
  - [ ] 11.2 Create `backend/graphql/pothos/whatsapp/index.ts`
  - [ ] 11.3 Create `backend/graphql/mutation/whatsapp/whatsapp.mutation.ts` — `updateWhatsappAccount`, `setWhatsappAccessToken`, `setWhatsappTwoStepPin` each call `resetWhatsappChannel()` on success (S4); `syncWhatsappAccountsFromMeta` includes template snapshot (BL3)
  - [ ] 11.4 Create `backend/graphql/query/whatsapp/whatsapp.query.ts`
  - [ ] 11.5 Edit GraphQL index barrels (pothos, query, mutation)
  - [ ] 11.6 Run `bun run generate:gqlSchema && bun codegen`
  - [ ] 11.7 Quality loop per file: run `bun tsgo && bun biome:check && lint-queue-client` on each modified file
  - [ ] 11.8 **AGENTS.md/instruction compliance**: read applicable files for each modified file, fix violations:
      - Pothos files: `backend/graphql/pothos/AGENTS.md`, `backend/graphql/AGENTS.md`, `backend/AGENTS.md` + `.agents/instructions/backend.instructions.md`
      - Mutation/Query files: `backend/graphql/mutation/AGENTS.md`, `backend/graphql/query/AGENTS.md`, `backend/graphql/AGENTS.md`, `backend/AGENTS.md` + `.agents/instructions/backend.instructions.md`

---

## Phase 3: Webhook Receiver

- [ ] **12. Webhook route (REQ-5, C3, S1, S2, S3, S5)**
  - [ ] 12.1 Create `app/api/webhooks/whatsapp/route.ts`:
    - GET: per-IP rate-limit on mismatches (S1); `hub.verify_token` compared via `crypto.timingSafeEqual` over equal-length buffers (S5); 403 on mismatch
    - POST: `await req.text()` first; **body-size cap ~1 MB → 413**; HMAC-SHA256 verify with `timingSafeEqual`; **on mismatch log only `(ip, userAgent, contentLength, signaturePrefix)` — never the body (S2)**; 401 on mismatch
    - Reject `body.object !== "whatsapp_business_account"` with 404
    - **Strip `value.messages[]` from every change entry before anything else touches the event (S3)**
    - Return 200 immediately, defer handler via **`after(async () => …)` from `next/server` (C3)** — verified exported from `node_modules/next/server.d.ts`; `queueMicrotask` forbidden
  - [ ] 12.2 Quality loop per file: run `bun tsgo && bun biome:check && lint-queue-client` on each modified file
  - [ ] 12.3 **AGENTS.md/instruction compliance**: read applicable files for each modified file, fix violations:
      - App Router route: `app/AGENTS.md` + `.agents/instructions/frontend.instructions.md` (Next.js App Router conventions)
      - Backend handler service: `backend/services/AGENTS.md`, `backend/AGENTS.md` + `.agents/instructions/backend.instructions.md`

- [ ] **13. Webhook handler (REQ-5, R1, R2, R6, B3, P3, Q5, S3)**
  - [ ] 13.1 Create `backend/services/whatsapp/whatsapp-webhook.handler.ts`
  - [ ] 13.2 Status transitions: **upsert** `notification_deliveries` by `providerMessageId === wamid` (`INSERT … ON CONFLICT DO UPDATE`, P3 — safe when webhook outruns adapter's row insert)
  - [ ] 13.3 Forward-only rank map `{ accepted: 0, sent: 1, delivered: 2, read: 3, failed: -1 }`; apply iff `newRank > currentRank` **or** (`currentRank === -1` and `newRank > 0`) so delayed `delivered` resurrects transient `failed` (B3); tolerate `deliveredAt` null when `read` arrives first (B3)
  - [ ] 13.4 Four template lifecycle events → audit log only (extracted fields; never raw body)
  - [ ] 13.5 `phone_number_quality_update` → `portfolioMessagingLimitTier` from `max_daily_conversations_per_business`, stored verbatim (Q5)
  - [ ] 13.6 `business_capability_update` → account fields + audit
  - [ ] 13.7 Inbound `messages[]` already stripped at route (S3); handler defensively drops if encountered
  - [ ] 13.8 Update `whatsapp_accounts.lastWebhookAt` on account-scoped events (`$onUpdate` handles `updatedAt`, B4)
  - [ ] 13.9 Quality loop per file: run `bun tsgo && bun biome:check && lint-queue-client` on each modified file
  - [ ] 13.10 **AGENTS.md/instruction compliance**: read applicable files for each modified file, fix violations:
      - Handler service: `backend/services/AGENTS.md`, `backend/AGENTS.md` + `.agents/instructions/backend.instructions.md`

---

## Phase 4: Admin WhatsApp Configuration (Frontend) — REPLACED BY PHASE 7

The original Phase 4 (Tasks 14-17) defined a single Numbers page. This has been superseded by the expanded UX in **Phase 7** (Tasks 21-29) which adds:
- Integrations NavGroup in sidebar
- Three-tab WhatsApp config (Numbers, Templates, Opt-in)
- Opt-in schema extension
- Per-role permission matrix

Tasks 14-17 below are kept for i18n and GraphQL documents which are still needed, but the view tasks (16-17) are replaced by Phase 7 tasks 24-26.

- [ ] **14. i18n (REQ-7, R7, B6, REQ-11)**
  - [ ] 14.1 Create `shared/locale/types/whatsapp/index.ts`
  - [ ] 14.2 Create `shared/locale/en/whatsapp/index.ts`
  - [ ] 14.3 Create `shared/locale/ar/whatsapp/index.ts`
  - [ ] 14.4 Register namespace in `shared/locale/types/message.ts` and `shared/locale/server.ts`
  - [ ] 14.5 Add WhatsApp delivery-failure keys to `notifications` locale (types/en/ar)
  - [ ] 14.6 Coexistence warning (Business App vs Cloud API, 20 mps cap) + unverified 2-slot warning strings (R7)
  - [ ] 14.7 **Opt-in toggle + consent copy** strings (REQ-10)
  - [ ] 14.8 Tier-label captions map raw Meta enum → localized strings (Q5); template `language.code` is data-driven from synced rows, never a hardcoded locale mapping (B6)
  - [ ] 14.9 Quality loop per file
  - [ ] 14.10 **AGENTS.md/instruction compliance**: `shared/AGENTS.md` + `.agents/instructions/backend.instructions.md`

- [ ] **15. Frontend GraphQL documents (REQ-8, REQ-11)**
  - [ ] 15.1 Create `frontend/common/graphql/sharedDocuments/whatsapp/whatsapp.documents.ts` — every object includes `id`
  - [ ] 15.2 Run `bun codegen` if schema already generated in task 11
  - [ ] 15.3 Quality loop per file
  - [ ] 15.4 **AGENTS.md/instruction compliance**: `frontend/common/graphql/sharedDocuments/AGENTS.md`, `frontend/common/graphql/AGENTS.md`, `frontend/AGENTS.md` + `.agents/instructions/frontend.instructions.md`

- [ ] **16. ViewModel & Types for WhatsApp Settings (REQ-11)**
  - [ ] 16.1 Create `frontend/common/views/dashboard/settings/whatsapp/types/whatsappSettingsTypes.ts`
  - [ ] 16.2 Create `frontend/common/views/dashboard/settings/whatsapp/useWhatsappSettingsViewModel.ts`
  - [ ] 16.3 Quality loop per file
  - [ ] 16.4 **AGENTS.md/instruction compliance**: `frontend/common/views/AGENTS.md`, `frontend/AGENTS.md` + `.agents/instructions/frontend.instructions.md`

- [ ] **17. REMOVED** — Replaced by Phase 7 tasks 24-26 (Numbers/Templates/Opt-in tabs with tier isolation)

---

## Phase 5: Tests

- [ ] **18. @live-comm integration tests — aligned to v1 core builder set (REQ-9, Q1, B2)**
  - [ ] 18.1 `send-template-message.integration.test.ts`
  - [ ] 18.2 `list-phone-numbers.integration.test.ts` — asserts pagination loop terminates with full result set (P2)
  - [ ] 18.3 `get-phone-number.integration.test.ts`
  - [ ] 18.4 `list-message-templates.integration.test.ts`
  - [ ] 18.5 `pair-rate-limit.integration.test.ts` — two template sends to same recipient < 6 s apart; assert **second is deferred (not failed)** and Meta receives both ≥ 6 s apart (B2)
  - [ ] 18.6 `whatsapp-api-call-coverage.test.ts` — fails if any file under `cloud-api/requests/` lacks a paired integration test (4 builders are required to have pairs; nothing else may exist in the folder, Q1)
  - [ ] 18.7 Verify skip behavior when env creds missing (`WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_TEST_TO_PHONE`, `WHATSAPP_WABA_ID`)
  - [ ] 18.8 Quality loop per file: run `bun tsgo && bun biome:check && lint-queue-client` on each modified file
  - [ ] 18.9 **AGENTS.md/instruction compliance**: read applicable files for each modified file, fix violations:
      - Integration tests: `scripts/run-test/AGENTS.md`, `backend/db/test/AGENTS.md`, `backend/AGENTS.md` + `.agents/instructions/tests.instructions.md`

- [ ] **19. Unit tests (C3, B2, B3, P3, S2, S3, Q3, REQ-10)**
  - [ ] 19.1 Create `whatsapp-channel.test.ts` — factory singleton, `resetWhatsappChannel()` actually drops instance (S4), validateConfig, missing creds
  - [ ] 19.2 Create `whatsapp-webhook.handler.test.ts`:
    - HMAC positive + negative; mismatch logs contain **only** `(ip, userAgent, contentLength, signaturePrefix)` — assert logger never receives body (S2)
    - Body-size cap returns 413 (S-adjacent robustness)
    - **Route-level strip test**: payload containing `messages[]` arrives at handler with `messages` removed (S3); assert logger receives no PII fields
    - Forward-only with `read` before `delivered` → final state `read`, `deliveredAt` null tolerated (B3)
    - Transient `failed` followed by `delivered` → final state `delivered` (B3)
    - Idempotency by `wamid`: duplicate callbacks via `ON CONFLICT DO UPDATE` don't double-update (P3)
    - Webhook arriving before adapter row insert → upsert still converges (P3)
    - Batched-event iteration (multiple `entry`/`changes`)
    - Template lifecycle events → audit entries with extracted fields only
    - `business_capability_update` + `phone_number_quality_update` → account rows updated with verbatim enum (Q5)
  - [ ] 19.3 Create `whatsapp-optin.test.ts` — default OFF; gate blocks fan-out for opted-out users (REQ-10); toggle writes `whatsapp_opt_in` audit event with `(userId, timestamp, source)`
  - [ ] 19.4 Create `pair-rate-limit.test.ts` (pure unit) — defer math, Redis key shape, TTL; no Meta call on guard hit (B2)
  - [ ] 19.5 Create `test/ui/components/useWhatsappAccountsViewModel.test.tsx` (Q3) — mocked Apollo; fetchPolicy, mapping, error path
  - [ ] 19.6 Run DB-backed tests via `bun run scripts/run-test/run-test.ts` where applicable
  - [ ] 19.7 Quality loop per file: run `bun tsgo && bun biome:check && lint-queue-client` on each modified file
  - [ ] 19.8 **AGENTS.md/instruction compliance**: read applicable files for each modified file, fix violations:
      - Unit tests: `scripts/run-test/AGENTS.md`, `backend/db/test/AGENTS.md`, `backend/AGENTS.md` + `.agents/instructions/tests.instructions.md`
      - Frontend test: `test/ui/AGENTS.md`, `frontend/AGENTS.md` + `.agents/instructions/tests.instructions.md`, `.agents/instructions/frontend.instructions.md`

- [ ] 19.7 Quality loop per file: run `bun tsgo && bun biome:check && lint-queue-client` on each modified file
  - [ ] 19.8 **AGENTS.md/instruction compliance**: read applicable files for each modified file, fix violations:
      - Unit tests: `scripts/run-test/AGENTS.md`, `backend/db/test/AGENTS.md`, `backend/AGENTS.md` + `.agents/instructions/tests.instructions.md`
      - Frontend test: `test/ui/AGENTS.md`, `frontend/AGENTS.md` + `.agents/instructions/tests.instructions.md`, `.agents/instructions/frontend.instructions.md`

---

## Phase 7: Integrations Navigation & Admin UX (NEW)

- [ ] **21. NavigationConfig extension (REQ-11, REQ-12)**
  - [ ] 21.1 Edit `frontend/common/views/dashboard/config/navigationConfig.ts` — add `Integrations` NavGroup after `Admin` with `WHATSAPP_VIEW` permission gate
  - [ ] 21.2 Add WhatsApp NavItem: `href: "/settings/whatsapp"`, icon, permission: `WHATSAPP_VIEW`
  - [ ] 21.3 Ensure `applyTeacherNavOverrides` / `applyParentNavOverrides` / `applyStudentNavOverrides` hide Integrations group for portal users
  - [ ] 21.4 Quality loop per file: run `bun tsgo && bun biome:check && lint-queue-client` on modified file
  - [ ] 21.5 **AGENTS.md/instruction compliance**: `frontend/common/views/AGENTS.md`, `frontend/AGENTS.md` + `.agents/instructions/frontend.instructions.md`, `.agents/instructions/mobile-desktop.instructions.md`

- [ ] **22. Settings route for WhatsApp (REQ-11)**
  - [ ] 22.1 Create `app/(dashboard)/settings/whatsapp/page.tsx` — Server Component with `requirePermissionForPage` checking `WHATSAPP_VIEW`
  - [ ] 22.2 Create `app/(dashboard)/settings/whatsapp/WhatsappSettingsContainer.tsx` — Client Component with `RequirePermission` wrapper
  - [ ] 22.3 Quality loop per file
  - [ ] 22.4 **AGENTS.md/instruction compliance**: `app/AGENTS.md`, `frontend/common/views/AGENTS.md`, `frontend/AGENTS.md` + `.agents/instructions/frontend.instructions.md`

- [ ] **23. WhatsApp Settings Three-Tab UI (REQ-11)**
  - [ ] 23.1 Create `frontend/common/views/dashboard/settings/whatsapp/WhatsappConfigView.tsx` — `ResponsiveViewSwitch` + `createLazyView`
  - [ ] 23.2 Create `frontend/common/views/dashboard/settings/whatsapp/useWhatsappSettingsViewModel.ts` — ViewModel with three tab states, data fetching
  - [ ] 23.3 Create `frontend/common/views/dashboard/settings/whatsapp/types/whatsappSettingsTypes.ts` — shared types
  - [ ] 23.4 Quality loop per file
  - [ ] 23.5 **AGENTS.md/instruction compliance**: `frontend/common/views/AGENTS.md`, `frontend/AGENTS.md` + `.agents/instructions/frontend.instructions.md`, `.agents/instructions/mobile-desktop.instructions.md`

- [ ] **24. Numbers Tab (REQ-11, REQ-4)**
  - [ ] 24.1 Create `frontend/common/views/dashboard/settings/whatsapp/tabs/NumbersTab.tsx` — shared tab component
  - [ ] 24.2 Create `frontend/desktop/views/dashboard/settings/whatsapp/tabs/NumbersTab.desktop.tsx` — account cards, sync button, token/PIN dialogs
  - [ ] 24.3 Create `frontend/mobile/views/dashboard/settings/whatsapp/tabs/NumbersTab.mobile.tsx` — account list, sync, dialogs
  - [ ] 24.4 Quality loop per file
  - [ ] 24.5 **AGENTS.md/instruction compliance**: desktop tier → `frontend/desktop/AGENTS.md`, `frontend/views/AGENTS.md`, `frontend/AGENTS.md` + `.agents/instructions/mobile-desktop.instructions.md`; mobile tier → `frontend/mobile/AGENTS.md`, `frontend/views/AGENTS.md`, `frontend/AGENTS.md` + `.agents/instructions/mobile-desktop.instructions.md`

- [ ] **25. Templates Tab (Read-Only Sync) (REQ-11, REQ-4)**
  - [ ] 25.1 Create shared + desktop + mobile template tab components
  - [ ] 25.2 Template list with name, language (exact from Meta), category, status, last synced
  - [ ] 25.3 "Sync Templates" button → `syncTemplates` mutation
  - [ ] 25.4 Quality loop per file
  - [ ] 25.5 **AGENTS.md/instruction compliance**: same tier mapping as above

- [ ] **26. Opt-in Management Tab (REQ-11, REQ-10)**
  - [ ] 26.1 Create shared + desktop + mobile opt-in tab components
  - [ ] 26.2 Paginated table: User (name + role), Phone (E.164), Opt-in Status (toggle), Last Change, Changed By
  - [ ] 26.3 Filters: role (parent/student), opt-in status, search by name/phone
  - [ ] 26.4 Bulk actions: Enable/Disable selected (SUPER_ADMIN only, confirmed dialog)
  - [ ] 26.5 Row action: "View Audit Trail" → opens drawer with opt-in change history (user, timestamp, from→to, changed by)
  - [ ] 26.6 Quality loop per file
  - [ ] 26.7 **AGENTS.md/instruction compliance**: same tier mapping

- [ ] **27. Shared WhatsApp Settings Types & Hooks (REQ-11)**
  - [ ] 27.1 Create `frontend/common/views/dashboard/settings/whatsapp/types/whatsappSettingsTypes.ts`
  - [ ] 27.2 Create `frontend/common/views/dashboard/settings/whatsapp/useWhatsappSettingsViewModel.ts`
  - [ ] 27.3 Create `frontend/common/stores/whatsappSettingsStore.ts` (if needed for cross-tab state)
  - [ ] 27.4 Quality loop per file
  - [ ] 27.5 **AGENTS.md/instruction compliance**: `frontend/common/views/AGENTS.md`, `frontend/common/stores/AGENTS.md`, `frontend/AGENTS.md` + `.agents/instructions/frontend.instructions.md`

- [ ] **28. i18n for WhatsApp Admin UX (REQ-11, REQ-7)**
  - [ ] 28.1 Add tab labels, column headers, action buttons, warnings to `shared/locale/{types,en,ar}/whatsapp/index.ts`
  - [ ] 28.2 Add opt-in consent copy, coexistence warnings, unverified slot warnings
  - [ ] 28.3 Quality loop per file
  - [ ] 28.4 **AGENTS.md/instruction compliance**: `shared/AGENTS.md` + `.agents/instructions/backend.instructions.md` (shared layer)

- [ ] **29. Per-user opt-in schema extension (REQ-10)**
  - [ ] 29.1 Extend existing notification-preference storage with `whatsappEnabled` boolean default false
  - [ ] 29.2 Add `whatsapp_opt_in` audit event type to `AuditEntityType` / audit service
  - [ ] 29.3 Quality loop per file
  - [ ] 29.4 **AGENTS.md/instruction compliance**: `backend/db/schema/AGENTS.md`, `backend/services/AGENTS.md`, `backend/AGENTS.md` + `.agents/instructions/backend.instructions.md`

---

## Phase 8: Quality Loop (renamed from Quality Gates)

- [ ] **20. Final verification**
  - [ ] 20.1 All REQ acceptance criteria checked against [specs.md](./specs.md) — including REQ-10 opt-in and REQ-9 core-set alignment (Q1)
  - [ ] 20.2 Confirm no Plan-review regressions: grep for `queueMicrotask` in webhook route (C3), `dispatchRecipientChannel` handling whatsapp (C2), missing `CHANNEL_LABELS.whatsapp` (C1), in-memory rate-limit maps (B2), `whatsapp.dispatch` permission (BL2), Zustand whatsapp store (Q2)
  - [ ] 20.3 Run **quality loop** on all modified files: `bun tsgo && bun biome:check && lint-queue-client` (no codescene/sonar)
  - [ ] 20.4 Fix tsgo / biome / lint failures
  - [ ] 20.5 Re-run quality loop until all stages pass
  - [ ] 20.6 Quality loop on any remaining modified files: run `bun tsgo && bun biome:check && lint-queue-client`
  - [ ] 20.7 **AGENTS.md/instruction compliance**: read all applicable AGENTS.md + `.agents/instructions/*.md` for any final modified files, fix violations
  - [ ] 20.8 Update Progress Summary below

---

## Phase 9: Knowledge Propagation (MANDATORY Final Task)

- [ ] **30. Knowledge Propagation & Documentation**
  - [ ] 30.1 Read all outcome files in `.ai/plans/whatsapp/outcome/` to synthesize all learnings
  - [ ] 30.2 Create canonical reference doc under `docs/services/whatsapp-cloud-api.md` consolidating patterns, rules, and gotchas from all outcome files
  - [ ] 30.3 Update `backend/services/AGENTS.md` with WhatsApp channel patterns and reference to the new doc
  - [ ] 30.4 Update `backend/AGENTS.md` with WhatsApp integration reference
  - [ ] 30.5 Update `backend/graphql/AGENTS.md` if GraphQL patterns were introduced
  - [ ] 30.6 Update `.agents/instructions/backend.instructions.md` if new conventions should be enforced
  - [ ] 30.7 Update root `AGENTS.md` Important References section with the new doc
  - [ ] 30.8 Run global check: `bun tsgo`, `bun biome:check`, `bun run lint` (0 errors, 0 warnings)
  - [ ] 30.9 Write outcome file: `.ai/plans/whatsapp/outcome/30.1-knowledge-propagation-outcome.md`
  - [ ] 30.10 Update progress: Mark task 30 as `[x]` in `trackable-tasks.md`
  - _Requirements: Knowledge propagation protocol_

---

## Blocker Log

| Date | Task | Blocker | Resolution | Status |
|------|------|---------|------------|--------|
| — | — | — | — | — |

_Add rows when blocked. Remove or mark resolved when unblocked._

---

## Progress Summary

| Phase | Parent Tasks | Completed | Status |
|-------|-------------|-----------|--------|
| 1. Channel Foundations | 6 | 0 | `[ ]` |
| 2. Accounts Backend | 5 | 0 | `[ ]` |
| 3. Webhook Receiver | 2 | 0 | `[ ]` |
| 4. Admin WhatsApp Config (Frontend) | 4 | 0 | `[ ]` |
| 5. Tests | 2 | 0 | `[ ]` |
| 6. Integrations Nav & UX | 9 | 0 | `[ ]` |
| 7. Quality Loop | 1 | 0 | `[ ]` |
| 8. Knowledge Propagation | 1 | 0 | `[ ]` |
| **Total** | **30** | **0** | **0%** |

_Update the Progress Summary table as tasks are completed._

---

## Requirements Traceability

| Requirement | Primary tasks |
|-------------|---------------|
| REQ-1 Channel | 1, 6 |
| REQ-2 Send template messages | 4, 5, 18 |
| REQ-3 Credentials | 2, 7, 8, 9 |
| REQ-4 Numbers admin | 9, 24, 25, 26 |
| REQ-5 Webhooks | 12, 13, 19.2 |
| REQ-6 Permissions | 10 |
| REQ-7 i18n | 14, 28 |
| REQ-8 GraphQL | 11, 15 |
| REQ-9 Integration tests | 4, 18 |
| REQ-10 Opt-in | 9.4, 14.7, 17.5, 19.3, 26, 29 |
| REQ-11 Admin Integrations Nav & WhatsApp Config UX | 22, 23, 24, 25, 26, 27, 28 |
| REQ-12 Permission Matrix for WhatsApp Admin UX | 10, 22, 23, 24, 25, 26 |

## Review-Finding Traceability

| Finding | Where addressed |
|---------|-----------------|
| C1 `CHANNEL_LABELS.whatsapp` | 1.5 |
| C2 dedicated `dispatchWhatsapp` | 6.3 |
| C3 `after()` not `queueMicrotask` | 12.1 |
| B1 template mapping | 3.1, 6.2 |
| B2 pair-limit defer + shared state | 5.1, 18.5, 19.4 |
| B3 forward-only incl. failed→recovered | 13.3, 19.2 |
| B4 `$onUpdate` on updatedAt | 7.1, 13.8 |
| B5 provider_message_id index | 7.4 |
| B6 exact language code | 4.5, 14.8 |
| S1 GET verify rate-limit | 12.1 |
| S2 metadata-only failure logs | 12.1, 19.2 |
| S3 route-level inbound strip | 12.1, 13.7, 19.2 |
| S4 decrypt per call + reset factory | 3.2, 5.1, 9.1, 11.3, 19.1 |
| S5 timingSafeEqual on verify token | 12.1 |
| P1 concurrency cap + bulk writes | 5.1 |
| P2 pagination loop | 4.3, 4.5, 9.1, 18.2 |
| P3 upsert by wamid | 13.2, 19.2 |
| BL1 opt-in gate | 9.4, 14.7, 17.5, 19.3 |
| BL2 drop whatsapp.dispatch | 10.1, 20.2 |
| BL3 template snapshot in sync | 9.1, 11.3 |
| BL4 24h-window defer to v2 (template-only v1) | specs scope table |
| Q1 core builder set | 4.6, 18.6 |
| Q2 no Zustand store | 16.3, 20.2 |
| Q3 ViewModel unit test | 19.5 |
| Q4 failed sends consume budget | 5.1 |
| Q5 raw tier enum verbatim | 7.1, 9.1, 13.5, 14.8, 19.2 |
| UX1 Integrations nav group + tabbed config | 22, 23, 24, 25, 26, 27 |
| UX2 Per-role permission matrix | 10, 20.2 |
| UX3 Opt-in admin management | 26, 29 |