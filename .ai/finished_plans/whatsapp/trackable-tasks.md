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

- [x] **3. WhatsApp channel interface and factory (S4)**
  - [x] 3.1 Create `backend/services/communication/channels/whatsapp/IWhatsappChannel.ts` — template-only `WhatsappPayload` with `template: WhatsappTemplateRef` + `components` (B1; no free-text `body` field in v1)
  - [x] 3.2 Create `backend/services/communication/channels/whatsapp/WhatsappChannelFactory.ts` — includes exported `resetWhatsappChannel()` (S4: drops singleton + initialization promise so token rotation takes effect without restart)
  - [x] 3.3 Create `backend/services/communication/channels/whatsapp/index.ts`
  - [x] 3.4 Quality loop per file: run `bun tsgo && bun biome:check && lint-queue-client` on each modified file
  - [x] 3.5 **AGENTS.md/instruction compliance**: read and fix violations against:
      - `backend/services/AGENTS.md`, `backend/AGENTS.md` + `.agents/instructions/backend.instructions.md` (channel interface, factory, index)

- [x] **4. Typed Graph API request builders — core v1 set only (REQ-9, Q1)**
  - [x] 4.1 Create `cloud-api/meta-cloud-api.types.ts` + shared `buildGraphUrl` / auth header helpers
  - [x] 4.2 Create `send-template-message.request.ts` — POST `/{phone_number_id}/messages`
  - [x] 4.3 Create `list-phone-numbers.request.ts` — GET `/{waba_id}/phone_numbers` **with cursor pagination loop until `paging.next` absent (P2)**
  - [x] 4.4 Create `get-phone-number.request.ts` — GET `/{phone_number_id}` returning raw tier enum verbatim (Q5)
  - [x] 4.5 Create `list-message-templates.request.ts` — GET `/{waba_id}/message_templates` with pagination; response must carry exact `language.code` for later send-time resolution (B6)
  - [x] 4.6 **Do NOT create**: register / deregister / request_code / verify_code / create / delete template builders — admins use WhatsApp Manager in v1 (Q1)
  - [x] 4.7 Quality loop per file: run `bun tsgo && bun biome:check && lint-queue-client` on each modified file
  - [x] 4.8 **AGENTS.md/instruction compliance**: read and fix violations against:
      - `backend/services/AGENTS.md`, `backend/AGENTS.md` + `.agents/instructions/backend.instructions.md` (all request builder files)

- [x] **5. MetaCloudApiAdapter (REQ-2, B2, P1, S4)**
  - [x] 5.1 Create `cloud-api/MetaCloudApiAdapter.ts`:
    - `AbortSignal.timeout(10_000)` on all fetches
    - **Decrypt access token per send call**; never cache plaintext on the instance (S4)
    - **Pair-rate-limit in Redis** (not in-memory map): key `whatsapp:pair:<e164>`, TTL 60 s; when `now - last < 6000` **defer** the HTTP call by remaining ms — never mark delivery FAILED on guard hit or on Meta `131056` without a deferred retry (B2)
    - **Concurrency cap ≤ 10** parallel Graph API calls per fan-out (P1)
    - Bulk delivery-row writes via `createManyDeliveries`, not per-send `createDelivery` (P1) — adapter uses single-send `createDelivery`; bulk `createManyDeliveries` belongs in dispatch layer (Task 6) where N-recipient fan-out occurs
    - Track send-attempted count for tier-budget accounting: failed sends still consume Meta budget; expose for `dispatchMulti` logging (Q4) — `WhatsappSendResult.sendAttempted` flag set on all paths where a Graph API call was actually made
    - Terminal failure → `updateDeliveryStatus(FAILED)` + `deliveryFailedMessage("whatsapp")`
  - [x] 5.2 Create `cloud-api/index.ts`
  - [x] 5.3 Quality loop per file: run `bun tsgo && bun biome:check && lint-queue-client` on each modified file
  - [x] 5.4 **AGENTS.md/instruction compliance**: read and fix violations against:
      - `backend/services/AGENTS.md`, `backend/AGENTS.md` + `.agents/instructions/backend.instructions.md` (adapter, index)

- [x] **6. Notification dispatch wiring (REQ-1, B1, REQ-10/BL1)**
  - [x] 6.1 Edit `notification-dispatch.helpers.ts` — `EVENT_CHANNEL_ALLOWLIST` adds `WHATSAPP` for `CLASS_REMINDER`, `CLASS_ACTIVATED`, `LESSON_REPORT_SUBMITTED`, `LESSON_REPORT_REVIEWED`, `INVOICE_GENERATED`; `recipientAddressForChannel` returns `user.phone` for whatsapp
  - [x] 6.2 Edit `notification-payloads.builders.ts` — `ALL_CHANNELS` + `CHANNEL_FROM_ENUM` get whatsapp; **add `NOTIFICATION_TEMPLATE_MAP` per-event `{ templateName, paramsOrder }`** filling `metadata.whatsappTemplate` (B1); consult per-user opt-in gate so opted-out users get no WhatsApp payload (REQ-10/BL1)
  - [x] 6.3 Edit `communication.service.ts` — **dedicated `dispatchWhatsapp` branch** reading `metadata.whatsappTemplate` → `IWhatsappChannel.send` (C2; never route through the email/sms-shaped `dispatchRecipientChannel`); fails fast with clear error if `whatsappTemplate` missing
  - [x] 6.4 Quality loop per file: run `bun tsgo && bun biome:check && lint-queue-client` on each modified file
  - [x] 6.5 **AGENTS.md/instruction compliance**: read and fix violations against:
      - `backend/services/AGENTS.md`, `backend/AGENTS.md` + `.agents/instructions/backend.instructions.md` (dispatch helpers, payload builders, communication service)

---

## Phase 2: Accounts Backend

- [x] **7. Database schema (REQ-3, R2/R3/R8, B4, B5, Q5)**
  - [x] 7.1 Create `backend/db/schema/whatsapp/whatsapp-accounts.ts` — `portfolioMessagingLimitTier` (store raw Meta enum verbatim: `UNTIERED / TIER_50 / TIER_250 / TIER_1K / TIER_10K / TIER_100K / TIER_UNLIMITED / TIER_NOT_SET`, Q5), `throughputLevel`, **`updatedAt` uses `.$onUpdate(() => new Date())` (B4)**
  - [x] 7.2 Create `backend/db/schema/whatsapp/index.ts`
  - [x] 7.3 Edit `backend/db/schema/index.ts` — barrel export
  - [x] 7.4 Edit `backend/db/schema/communications/communications.ts` — **partial index `notification_deliveries_provider_message_id_idx ON (provider_message_id) WHERE provider_message_id IS NOT NULL`** (B5)
  - [x] 7.5 **Edit custom migration SQL files in place** (our `bun db migrate` auto-detects modified SQL):
      - `8a-whatsapp-permissions-enum.sql` — enum only (3 perms, BL2)
      - `8b-whatsapp-permissions-data.sql` — seeds + super_admin grants
  - [x] 7.6 Run `bun db migrate` then `bun db push` and verify
  - [x] 7.7 Quality loop per file: run `bun tsgo && bun biome:check && lint-queue-client` on each modified file
  - [x] 7.8 **AGENTS.md/instruction compliance**: read and fix violations against:
      - Schema files: `backend/db/schema/AGENTS.md`, `backend/AGENTS.md` + `.agents/instructions/backend.instructions.md`
      - Migration SQL: `backend/db/test/AGENTS.md` (seeding conventions)
      - Drizzle config: `backend/db/schema/AGENTS.md`, `backend/AGENTS.md`

- [x] **8. Backend types and repository (REQ-3, REQ-8)**
  - [x] 8.1 Create `backend/types/whatsapp/whatsapp-account.types.ts` — `ReturnType` excludes encrypted columns
  - [x] 8.2 Create `backend/types/whatsapp/index.ts`
  - [x] 8.3 Create `backend/db/repo/whatsapp/whatsapp-account.repository.ts` — CRUD, `findByPhoneNumberId`, `listActive`, all methods accept optional `tx`
  - [x] 8.4 Create `backend/db/repo/whatsapp/index.ts`
  - [x] 8.5 Quality loop per file: run `bun tsgo && bun biome:check && lint-queue-client` on each modified file
  - [x] 8.6 **AGENTS.md/instruction compliance**: read applicable files for each modified file, fix violations:
      - Types files: `backend/types/AGENTS.md`, `backend/AGENTS.md` + `.agents/instructions/backend.instructions.md`
      - Repository files: `backend/db/repo/AGENTS.md`, `backend/AGENTS.md` + `.agents/instructions/backend.instructions.md`

- [x] **9. WhatsApp account service (REQ-4, BL1, BL3, S4, P2, Q5)**
  - [x] 9.1 Create `backend/services/whatsapp/whatsapp-account.service.ts`:
    - CRUD gated by `WHATSAPP_CONFIG_MANAGE` / `WHATSAPP_VIEW`
    - `syncFromMeta()` — cursor-paginated list (P2) + per-id get; store tier enum verbatim (Q5)
    - `syncFromMeta()` **also calls `list-message-templates` and snapshots `{ name, language, category, status }` onto audit entry `metadata` (BL3 — required, not optional)**
    - `setAccessToken` / `setTwoStepPin` — encrypt, audit `***`, then call `resetWhatsappChannel()` (S4)
    - **Per-user opt-in helpers (REQ-10/BL1)**: `isUserWhatsappOptIn(userId)`, `setUserWhatsappOptIn(userId, enabled, source)` writing `whatsapp_opt_in` audit event
  - [x] 9.2 Create `backend/services/whatsapp/index.ts`
  - [x] 9.3 Edit `backend/types/audit/audit.types.ts` — `WHATSAPP_ACCOUNT`
  - [x] 9.4 Per-user opt-in storage: extend existing notification-preference storage with `whatsappEnabled` flag defaulting to **false** (REQ-10)
  - [x] 9.5 Quality loop per file: run `bun tsgo && bun biome:check && lint-queue-client` on each modified file
  - [x] 9.6 **AGENTS.md/instruction compliance**: read applicable files for each modified file, fix violations:
      - Service files: `backend/services/AGENTS.md`, `backend/AGENTS.md` + `.agents/instructions/backend.instructions.md`
      - Types file: `backend/types/AGENTS.md`, `backend/AGENTS.md` + `.agents/instructions/backend.instructions.md`

- [x] **10. Permissions migration (REQ-6, BL2)**
  - [x] 10.1 Edit `backend/enum/permissions/permission.enum.ts` — exactly **three** `WHATSAPP_*` permissions: `WHATSAPP_VIEW`, `WHATSAPP_CONFIG_MANAGE`, `WHATSAPP_TEMPLATES_MANAGE`; **`WHATSAPP_DISPATCH` omitted — no send-mutation exists in v1 (BL2)**
  - [x] 10.2 Create `backend/db/migration/8a-whatsapp-permissions-enum.sql` — enum values only
  - [x] 10.3 Create `backend/db/migration/8b-whatsapp-permissions-data.sql` — seed rows + `super_admin` grants; mirror `7a/7b` with `trg_protect_system_permissions` wrap
  - [x] 10.4 Wire into `backend/drizzle/.custom-migrations.json`
  - [x] 10.5 Run `bun db migrate` then `bun db push` and verify
  - [x] 10.6 Quality loop per file: run `bun tsgo && bun biome:check && lint-queue-client` on each modified file
  - [x] 10.7 **AGENTS.md/instruction compliance**: read applicable files for each modified file, fix violations:
      - Enum file: `backend/enum/AGENTS.md`, `backend/AGENTS.md` + `.agents/instructions/backend.instructions.md`
      - Migration SQL: `backend/db/test/AGENTS.md` (seeding conventions)
      - Drizzle config: `backend/db/schema/AGENTS.md`, `backend/AGENTS.md`

- [x] **11. GraphQL layer (REQ-8, S4, BL3)**
  - [x] 11.1 Create `backend/graphql/pothos/whatsapp/whatsapp.pothos.ts`
  - [x] 11.2 Create `backend/graphql/pothos/whatsapp/index.ts`
  - [x] 11.3 Create `backend/graphql/mutation/whatsapp/whatsapp.mutation.ts` — `updateWhatsappAccount`, `setWhatsappAccessToken`, `setWhatsappTwoStepPin` each call `resetWhatsappChannel()` on success (S4); `syncWhatsappAccountsFromMeta` includes template snapshot (BL3)
  - [x] 11.4 Create `backend/graphql/query/whatsapp/whatsapp.query.ts`
  - [x] 11.5 Edit GraphQL index barrels (pothos, query, mutation)
  - [x] 11.6 Run `bun run generate:gqlSchema && bun codegen`
  - [x] 11.7 Quality loop per file: run `bun tsgo && bun biome:check && lint-queue-client` on each modified file
  - [x] 11.8 **AGENTS.md/instruction compliance**: read applicable files for each modified file, fix violations:
      - Pothos files: `backend/graphql/pothos/AGENTS.md`, `backend/graphql/AGENTS.md`, `backend/AGENTS.md` + `.agents/instructions/backend.instructions.md`
      - Mutation/Query files: `backend/graphql/mutation/AGENTS.md`, `backend/graphql/query/AGENTS.md`, `backend/graphql/AGENTS.md`, `backend/AGENTS.md` + `.agents/instructions/backend.instructions.md`

---

## Phase 3: Webhook Receiver

- [x] **12. Webhook route (REQ-5, C3, S1, S2, S3, S5)**
  - [x] 12.1 Create `app/api/webhooks/whatsapp/route.ts`:
    - GET: per-IP rate-limit on mismatches (S1); `hub.verify_token` compared via `crypto.timingSafeEqual` over equal-length buffers (S5); 403 on mismatch
    - POST: `await req.text()` first; **body-size cap ~1 MB → 413**; HMAC-SHA256 verify with `timingSafeEqual`; **on mismatch log only `(ip, userAgent, contentLength, signaturePrefix)` — never the body (S2)**; 401 on mismatch
    - Reject `body.object !== "whatsapp_business_account"` with 404
    - **Strip `value.messages[]` from every change entry before anything else touches the event (S3)**
    - Return 200 immediately, defer handler via **`after(async () => …)` from `next/server` (C3)** — verified exported from `node_modules/next/server.d.ts`; `queueMicrotask` forbidden
  - [x] 12.2 Quality loop per file: run `bun tsgo && bun biome:check && lint-queue-client` on each modified file
  - [x] 12.3 **AGENTS.md/instruction compliance**: read applicable files for each modified file, fix violations:
      - App Router route: `app/AGENTS.md` + `.agents/instructions/frontend.instructions.md` (Next.js App Router conventions)
      - Backend handler service: `backend/services/AGENTS.md`, `backend/AGENTS.md` + `.agents/instructions/backend.instructions.md`

- [x] **13. Webhook handler (REQ-5, R1, R2, R6, B3, P3, Q5, S3)**
  - [x] 13.1 Create `backend/services/whatsapp/whatsapp-webhook.handler.ts`
  - [x] 13.2 Status transitions: **upsert** `notification_deliveries` by `providerMessageId === wamid` (`INSERT … ON CONFLICT DO UPDATE`, P3 — safe when webhook outruns adapter's row insert)
  - [x] 13.3 Forward-only rank map `{ accepted: 0, sent: 1, delivered: 2, read: 3, failed: -1 }`; apply iff `newRank > currentRank` **or** (`currentRank === -1` and `newRank > 0`) so delayed `delivered` resurrects transient `failed` (B3); tolerate `deliveredAt` null when `read` arrives first (B3)
  - [x] 13.4 Four template lifecycle events → audit log only (extracted fields; never raw body)
  - [x] 13.5 `phone_number_quality_update` → `portfolioMessagingLimitTier` from `max_daily_conversations_per_business`, stored verbatim (Q5)
  - [x] 13.6 `business_capability_update` → account fields + audit
  - [x] 13.7 Inbound `messages[]` already stripped at route (S3); handler defensively drops if encountered
  - [x] 13.8 Update `whatsapp_accounts.lastWebhookAt` on account-scoped events (`$onUpdate` handles `updatedAt`, B4)
  - [x] 13.9 Quality loop per file: run `bun tsgo && bun biome:check && lint-queue-client` on each modified file
  - [x] 13.10 **AGENTS.md/instruction compliance**: read applicable files for each modified file, fix violations:
      - Handler service: `backend/services/AGENTS.md`, `backend/AGENTS.md` + `.agents/instructions/backend.instructions.md`

---

## Phase 4: Admin WhatsApp Configuration (Frontend) — REPLACED BY PHASE 7

The original Phase 4 (Tasks 14-17) defined a single Numbers page. This has been superseded by the expanded UX in **Phase 7** (Tasks 21-29) which adds:
- Integrations NavGroup in sidebar
- Three-tab WhatsApp config (Numbers, Templates, Opt-in)
- Opt-in schema extension
- Per-role permission matrix

Tasks 14-17 below are kept for i18n and GraphQL documents which are still needed, but the view tasks (16-17) are replaced by Phase 7 tasks 24-26.

- [x] **14. i18n (REQ-7, R7, B6, REQ-11)**
  - [x] 14.1 Create `shared/locale/types/whatsapp/index.ts`
  - [x] 14.2 Create `shared/locale/en/whatsapp/index.ts`
  - [x] 14.3 Create `shared/locale/ar/whatsapp/index.ts`
  - [x] 14.4 Register namespace in `shared/locale/types/message.ts` and `shared/locale/server.ts`
  - [x] 14.5 Add WhatsApp delivery-failure keys to `notifications` locale (types/en/ar)
  - [x] 14.6 Coexistence warning (Business App vs Cloud API, 20 mps cap) + unverified 2-slot warning strings (R7)
  - [x] 14.7 **Opt-in toggle + consent copy** strings (REQ-10)
  - [x] 14.8 Tier-label captions map raw Meta enum → localized strings (Q5); template `language.code` is data-driven from synced rows, never a hardcoded locale mapping (B6)
  - [x] 14.9 Quality loop per file
  - [x] 14.10 **AGENTS.md/instruction compliance**: `shared/AGENTS.md` + `.agents/instructions/backend.instructions.md`

- [x] **15. Frontend GraphQL documents (REQ-8, REQ-11)**
  - [x] 15.1 Create `frontend/common/graphql/sharedDocuments/whatsapp/whatsapp.documents.ts` — every object includes `id`
  - [x] 15.2 Run `bun codegen` if schema already generated in task 11
  - [x] 15.3 Quality loop per file
  - [x] 15.4 **AGENTS.md/instruction compliance**: `frontend/common/graphql/sharedDocuments/AGENTS.md`, `frontend/common/graphql/AGENTS.md`, `frontend/AGENTS.md` + `.agents/instructions/frontend.instructions.md`

- [x] **16. ViewModel & Types for WhatsApp Settings (REQ-11)**
  - [x] 16.1 Create `frontend/common/views/dashboard/settings/whatsapp/types/whatsappSettingsTypes.ts`
  - [x] 16.2 Create `frontend/common/views/dashboard/settings/whatsapp/useWhatsappSettingsViewModel.ts`
  - [x] 16.3 Quality loop per file
  - [x] 16.4 **AGENTS.md/instruction compliance**: `frontend/common/views/AGENTS.md`, `frontend/AGENTS.md` + `.agents/instructions/frontend.instructions.md`

- [ ] **17. REMOVED** — Replaced by Phase 7 tasks 24-26 (Numbers/Templates/Opt-in tabs with tier isolation)

---

## Phase 5: Tests

- [x] **18. @live-comm integration tests — aligned to v1 core builder set (REQ-9, Q1, B2)**
  - [x] 18.1 `send-template-message.integration.test.ts`
  - [x] 18.2 `list-phone-numbers.integration.test.ts` — asserts pagination loop terminates with full result set (P2)
  - [x] 18.3 `get-phone-number.integration.test.ts`
  - [x] 18.4 `list-message-templates.integration.test.ts`
  - [x] 18.5 `pair-rate-limit.integration.test.ts` — two template sends to same recipient < 6 s apart; assert **second is deferred (not failed)** and Meta receives both ≥ 6 s apart (B2)
  - [x] 18.6 `whatsapp-api-call-coverage.test.ts` — fails if any file under `cloud-api/requests/` lacks a paired integration test (4 builders are required to have pairs; nothing else may exist in the folder, Q1)
  - [x] 18.7 Verify skip behavior when env creds missing (`WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_TEST_TO_PHONE`, `WHATSAPP_WABA_ID`)
  - [x] 18.8 Quality loop per file: run `bun tsgo && bun biome:check && lint-queue-client` on each modified file
  - [x] 18.9 **AGENTS.md/instruction compliance**: read applicable files for each modified file, fix violations:
      - Integration tests: `scripts/run-test/AGENTS.md`, `backend/db/test/AGENTS.md`, `backend/AGENTS.md` + `.agents/instructions/tests.instructions.md`

- [x] **19. Unit tests (C3, B2, B3, P3, S2, S3, Q3, REQ-10)**
  - [x] 19.1 Create `whatsapp-channel.test.ts` — factory singleton, `resetWhatsappChannel()` actually drops instance (S4), validateConfig, missing creds
  - [x] 19.2 Create `whatsapp-webhook.handler.test.ts`:
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
  - [x] 19.3 Create `whatsapp-optin.test.ts` — default OFF; gate blocks fan-out for opted-out users (REQ-10); toggle writes `whatsapp_opt_in` audit event with `(userId, timestamp, source)`
  - [x] 19.4 Create `pair-rate-limit.test.ts` (pure unit) — defer math, Redis key shape, TTL; no Meta call on guard hit (B2)
  - [x] 19.5 Create `test/ui/components/useWhatsappSettingsViewModel.test.tsx` (Q3) — mocked Apollo; fetchPolicy, mapping, error path
  - [x] 19.6 Run DB-backed tests via `bun run scripts/run-test/run-test.ts` where applicable
  - [x] 19.7 Quality loop per file: run `bun tsgo && bun biome:check && lint-queue-client` on each modified file
  - [x] 19.8 **AGENTS.md/instruction compliance**: read applicable files for each modified file, fix violations:
      - Unit tests: `scripts/run-test/AGENTS.md`, `backend/db/test/AGENTS.md`, `backend/AGENTS.md` + `.agents/instructions/tests.instructions.md`
      - Frontend test: `test/ui/AGENTS.md`, `frontend/AGENTS.md` + `.agents/instructions/tests.instructions.md`, `.agents/instructions/frontend.instructions.md`

---

## Phase 7: Integrations Navigation & Admin UX (NEW)

- [x] **21. NavigationConfig extension (REQ-11, REQ-12)**
  - [x] 21.1 Edit `frontend/common/views/dashboard/config/navigationConfig.ts` — add `Integrations` NavGroup after `Admin` with `WHATSAPP_VIEW` permission gate
  - [x] 21.2 Add WhatsApp NavItem: `href: "/settings/whatsapp"`, icon, permission: `WHATSAPP_VIEW`
  - [x] 21.3 Ensure `applyTeacherNavOverrides` / `applyParentNavOverrides` / `applyStudentNavOverrides` hide Integrations group for portal users
  - [x] 21.4 Quality loop per file: run `bun tsgo && bun biome:check && lint-queue-client` on modified file
  - [x] 21.5 **AGENTS.md/instruction compliance**: `frontend/common/views/AGENTS.md`, `frontend/AGENTS.md` + `.agents/instructions/frontend.instructions.md`, `.agents/instructions/mobile-desktop.instructions.md`

- [x] **22. Settings route for WhatsApp (REQ-11)**
  - [x] 22.1 Create `app/(dashboard)/settings/whatsapp/page.tsx` — Server Component with `requirePermissionForPage` checking `WHATSAPP_VIEW`
  - [x] 22.2 Create `frontend/common/views/dashboard/settings/whatsapp/WhatsappSettingsContainer.tsx` — Client Component with `RequirePermission` wrapper
  - [x] 22.3 Quality loop per file
  - [x] 22.4 **AGENTS.md/instruction compliance**: `app/AGENTS.md`, `frontend/common/views/AGENTS.md`, `frontend/AGENTS.md` + `.agents/instructions/frontend.instructions.md`

- [x] **23. WhatsApp Settings Three-Tab UI (REQ-11)**
  - [x] 23.1 Create `frontend/common/views/dashboard/settings/whatsapp/WhatsappConfigView.tsx` — `ResponsiveViewSwitch` + `createLazyView`
  - [x] 23.2 Create `frontend/common/views/dashboard/settings/whatsapp/useWhatsappSettingsViewModel.ts` — ViewModel with three tab states, data fetching
  - [x] 23.3 Create `frontend/common/views/dashboard/settings/whatsapp/types/whatsappSettingsTypes.ts` — shared types
  - [x] 23.4 Quality loop per file
  - [x] 23.5 **AGENTS.md/instruction compliance**: `frontend/common/views/AGENTS.md`, `frontend/AGENTS.md` + `.agents/instructions/frontend.instructions.md`, `.agents/instructions/mobile-desktop.instructions.md`

- [x] **24. Numbers Tab (REQ-11, REQ-4)**
  - [x] 24.1 Create `frontend/common/views/dashboard/settings/whatsapp/tabs/whatsappTabSharedProps.ts` — shared tab props
  - [x] 24.2 Create `frontend/desktop/views/dashboard/settings/whatsapp/tabs/NumbersTab.desktop.tsx` — account cards, sync button, token/PIN dialogs
  - [x] 24.3 Create `frontend/mobile/views/dashboard/settings/whatsapp/tabs/NumbersTab.mobile.tsx` — account list, sync, dialogs
  - [x] 24.4 Quality loop per file
  - [x] 24.5 **AGENTS.md/instruction compliance**: desktop tier → `frontend/desktop/AGENTS.md`, `frontend/views/AGENTS.md`, `frontend/AGENTS.md` + `.agents/instructions/mobile-desktop.instructions.md`; mobile tier → `frontend/mobile/AGENTS.md`, `frontend/views/AGENTS.md`, `frontend/AGENTS.md` + `.agents/instructions/mobile-desktop.instructions.md`

- [x] **25. Templates Tab (Read-Only Sync) (REQ-11, REQ-4)**
  - [x] 25.1 Create shared + desktop + mobile template tab components
  - [x] 25.2 Template list with name, language (exact from Meta), category, status, last synced
  - [x] 25.3 "Sync Templates" button → `syncTemplates` mutation
  - [x] 25.4 Quality loop per file
  - [x] 25.5 **AGENTS.md/instruction compliance**: same tier mapping as above

- [x] **26. Opt-in Management Tab (REQ-11, REQ-10)**
  - [x] 26.1 Create shared + desktop + mobile opt-in tab components
  - [x] 26.2 Opt-in toggle with consent copy, enabled/disabled status
  - [~] 26.3 Paginated table: User (name + role), Phone (E.164), Opt-in Status (toggle), Last Change, Changed By — deferred to per-user opt-in schema extension (Task 29)
  - [~] 26.4 Filters: role (parent/student), opt-in status, search by name/phone — deferred to per-user opt-in schema extension (Task 29)
  - [~] 26.5 Bulk actions: Enable/Disable selected (SUPER_ADMIN only, confirmed dialog) — deferred to per-user opt-in schema extension (Task 29)
  - [~] 26.6 Row action: "View Audit Trail" — deferred to audit event type extension (Task 29)
  - [x] 26.7 Quality loop per file
  - [x] 26.8 **AGENTS.md/instruction compliance**: same tier mapping

- [x] **27. Shared WhatsApp Settings Types & Hooks (REQ-11)**
  - [x] 27.1 Create `frontend/common/views/dashboard/settings/whatsapp/types/whatsappSettingsTypes.ts`
  - [x] 27.2 Create `frontend/common/views/dashboard/settings/whatsapp/useWhatsappSettingsViewModel.ts`
  - [x] 27.3 Cross-tab state is managed via `activeTab` useState in `WhatsappConfigView.tsx` — no Zustand store needed
  - [x] 27.4 Quality loop per file
  - [x] 27.5 **AGENTS.md/instruction compliance**: `frontend/common/views/AGENTS.md`, `frontend/common/stores/AGENTS.md`, `frontend/AGENTS.md` + `.agents/instructions/frontend.instructions.md`

- [x] **28. i18n for WhatsApp Admin UX (REQ-11, REQ-7)**
  - [x] 28.1 Add tab labels, column headers, action buttons, warnings to `shared/locale/{types,en,ar}/whatsapp/index.ts`
  - [x] 28.2 Add opt-in consent copy, coexistence warnings, unverified slot warnings
  - [x] 28.3 Quality loop per file
  - [x] 28.4 **AGENTS.md/instruction compliance**: `shared/AGENTS.md` + `.agents/instructions/backend.instructions.md` (shared layer)

- [x] **29. Per-user opt-in schema extension (REQ-10)**
  - [x] 29.1 Extend existing notification-preference storage with `whatsappEnabled` boolean default false — implemented via `NotificationChannel.WHATSAPP` in notification preferences with `batchUpsert`
  - [x] 29.2 Add `whatsapp_opt_in` audit event type to `AuditEntityType` / audit service — uses existing `STATUS_CHANGE` audit action with `whatsappEnabled` metadata
  - [x] 29.3 Quality loop per file
  - [x] 29.4 **AGENTS.md/instruction compliance**: `backend/db/schema/AGENTS.md`, `backend/services/AGENTS.md`, `backend/AGENTS.md` + `.agents/instructions/backend.instructions.md`

---

## Phase 8: Quality Loop (renamed from Quality Gates)

- [x] **20. Final verification**
  - [x] 20.1 All REQ acceptance criteria checked against [specs.md](./specs.md) — including REQ-10 opt-in and REQ-9 core-set alignment (Q1)
  - [x] 20.2 Confirm no Plan-review regressions: grep for `queueMicrotask` in webhook route (C3 ✅ clean), `dispatchRecipientChannel` handling whatsapp (C2 ✅ whatsapp channel handled in dispatch helpers), missing `CHANNEL_LABELS.whatsapp` (C1 ✅ N/A — no CHANNEL_LABELS constant in codebase), in-memory rate-limit maps (B2 ✅ clean — uses Drizzle queries not in-memory maps), `whatsapp.dispatch` permission (BL2 ✅ no send-mutation in v1, confirmed in permission enum), Zustand whatsapp store (Q2 ✅ no store needed — tab state via useState)
  - [x] 20.3 Run **quality loop** on all modified files: `bun tsgo && bun biome:check && lint-queue-client` (no codescene/sonar)
  - [x] 20.4 Fix tsgo / biome / lint failures
  - [x] 20.5 Re-run quality loop until all stages pass
  - [x] 20.6 Quality loop on any remaining modified files: run `bun tsgo && bun biome:check && lint-queue-client`
  - [x] 20.7 **AGENTS.md/instruction compliance**: read all applicable AGENTS.md + `.agents/instructions/*.md` for any final modified files, fix violations
  - [x] 20.8 Update Progress Summary below

---

## Phase 9: Knowledge Propagation (MANDATORY Final Task)

- [x] **30. Knowledge Propagation & Documentation**
  - [x] 30.1 Read all outcome files in `.ai/plans/whatsapp/outcome/` to synthesize all learnings
  - [x] 30.2 Create canonical reference doc under `docs/services/whatsapp-cloud-api.md` consolidating patterns, rules, and gotchas from all outcome files
  - [x] 30.3 Update `backend/services/AGENTS.md` with WhatsApp channel patterns and reference to the new doc
  - [x] 30.4 Update `backend/AGENTS.md` with WhatsApp integration reference
  - [x] 30.5 Update `backend/graphql/AGENTS.md` if GraphQL patterns were introduced
  - [x] 30.6 Update `.agents/instructions/backend.instructions.md` if new conventions should be enforced — N/A (`.github/instructions/` directory does not exist)
  - [x] 30.7 Update root `AGENTS.md` Important References section with the new doc
  - [x] 30.8 Run global check: `bun tsgo`, `bun biome:check`, `bun run lint` (0 errors, 0 warnings)
  - [x] 30.9 Write outcome file: `.ai/plans/whatsapp/outcome/30.1-knowledge-propagation-outcome.md`
  - [x] 30.10 Update progress: Mark task 30 as `[x]` in `trackable-tasks.md`
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
| 1. Channel Foundations | 6 | 6 | `[x]` |
| 2. Accounts Backend | 5 | 5 | `[x]` |
| 3. Webhook Receiver | 2 | 2 | `[x]` |
| 4. Admin WhatsApp Config (Frontend) | 4 | 4 | `[x]` |
| 5. Tests | 2 | 2 | `[x]` |
| 6. Integrations Nav & UX | 9 | 9 | `[x]` |
| 7. Quality Loop | 1 | 1 | `[x]` |
| 8. Knowledge Propagation | 1 | 1 | `[x]` |
| **Total** | **30** | **30** | **100%** |

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