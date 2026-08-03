# Telegram Integration — Trackable Tasks

## Document Information

- **Feature Name**: Telegram Bot API integration for Siraj
- **Version**: 1.2
- **Date**: 2026-08-01
- **Status**: Research-confirmed (Bot API 10.2) — execution **BLOCKED** until [WhatsApp plan](../whatsapp/trackable-tasks.md) reaches 100%
- **Target Directory**: `.ai/plans/telegram`
- **Outcome Directory**: `.ai/plans/telegram/outcome`
- **Related Documents**:
  - [Requirements (Specs)](./specs.md)
  - [Implementation Guide](./implementation.md)

## Prerequisite Gate

**DO NOT begin Task 1 until** the WhatsApp plan Progress Summary shows **100%**. Read `outcome/0-research-confirmation-outcome.md` before starting — it consolidates findings from 7 parallel research subagents (Bot API 10.2 verified 2026-08-01).

---

## Non-Negotiable Execution Protocol for All Tasks

1. **Pre-Execution Outcome Knowledge Read:**  
   Before executing ANY task, the executing agent MUST read ALL existing files in `.ai/plans/telegram/outcome/` **and** relevant WhatsApp outcome files in `../whatsapp/outcome/` to absorb prior research, search results, docs, and pitfalls so analysis is not repeated.
2. **Per-File Quality Verification Loop (Immediate post-edit):**  
   Whenever a file is modified, execute per-file verification (`bun tsgo` + `bun biome:check` + lint queue for target file) BEFORE moving to another file or subtask.
3. **Global Health Check (Completion Gate):**  
   Before marking any subtask as complete, run full global checks: `bun tsgo`, `bun biome:check`, and `bun run lint` globally. All MUST exit with **zero errors and zero warnings**.
4. **Post-Execution Outcome File Creation:**  
   Upon completing the task implementation and quality checks, write a new outcome document under `.ai/plans/telegram/outcome/<task-id>-outcome.md` summarizing research, analysis, changes, and carry-over knowledge.
5. **Task Progress Tracking:**  
   The executing agent MUST update the task checkbox `[ ]` → `[x]` in this `trackable-tasks.md` file upon successful completion.

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
- Reference requirements as `REQ-TG-N` from [specs.md](./specs.md)
- Design-decision tags (TG1..TG12) reference [implementation.md](./implementation.md)

---

## Phase 1: Channel Foundations

- [ ] **1. Enum and type extension with forced compile fixes (REQ-TG1)**
  - [ ] 1.1 Edit `backend/enum/notifications/notificationDeliveries.enum.ts` — `TELEGRAM = "TELEGRAM"`
  - [ ] 1.2 Edit `backend/db/schema/enums.ts` — Drizzle `notificationChannel` enum value **(AUTO: `createPgEnumFromEnum` picks up new value)**
  - [ ] 1.3 Edit `backend/graphql/pothos/shared/enum.pothos.ts` — register `NotificationChannel.TELEGRAM` **(AUTO: `gqlSchemaBuilder.enumType(NotificationChannel, ...)` picks up new value)**
  - [ ] 1.4 **Edit `backend/services/communication/utils.ts`** — add `telegram: "Telegram"` to `CHANNEL_LABELS` and `deliveryFailedMessage` label map (forced compile fix; mirrors WhatsApp C1)
  - [ ] 1.5 Create custom SQL `9c-telegram-channel-enum.sql` — `ALTER TYPE notification_channel ADD VALUE 'TELEGRAM'` (split from data migration per `check_safe_enum_use`)
  - [ ] 1.6 Run `bun run generate:gqlSchema && bun codegen`
  - [ ] 1.7 Verify forced errors exist pre-dispatch: `communication.service.ts` missing `case NotificationChannel.TELEGRAM`; then resolve in task 6
  - [ ] 1.8 Quality loop per file
  - [ ] 1.9 **AGENTS.md/instruction compliance** for enum, schema, Pothos, utils files

- [ ] **2. Env-config registry (REQ-TG3)**
  - [ ] 2.1 Edit `backend/lib/env-config-keys.ts` — `telegram` category: `TELEGRAM_API_BASE_URL`, `TELEGRAM_WEBHOOK_BASE_URL`, `TELEGRAM_WEBHOOK_SECRET`, `TELEGRAM_DEFAULT_BOT_ID`
  - [ ] 2.2 Edit `backend/types/shared/env-config.types.ts` — `telegram` in `EnvConfigCategory`
  - [ ] 2.3 Edit `environment.d.ts` — document new env vars
  - [ ] 2.4 Quality loop per file
  - [ ] 2.5 **AGENTS.md/instruction compliance** for env-config files

- [ ] **3. Telegram channel interface and factory (TG4)**
  - [ ] 3.1 Create `backend/services/communication/channels/telegram/ITelegramChannel.ts` — `TelegramPayload` with `text`, `parseMode`, `replyMarkup` (no template indirection — TG3)
  - [ ] 3.2 Create `backend/services/communication/channels/telegram/TelegramChannelFactory.ts` — includes exported `resetTelegramChannel()` (drops singleton + invalidates `TELEGRAM_*` env-config cache keys on token rotation)
  - [ ] 3.3 Create `backend/services/communication/channels/telegram/index.ts`
  - [ ] 3.4 Quality loop per file
  - [ ] 3.5 **AGENTS.md/instruction compliance** for channel interface, factory, index

- [ ] **4. Typed Bot API request builders — v1 core set (REQ-TG9)**
  - [ ] 4.1 Create `bot-api/telegram-bot-api.types.ts` + shared `buildBotApiUrl` / auth helpers
  - [ ] 4.2 Create `send-message.request.ts` — POST `/sendMessage`
  - [ ] 4.3 Create `get-me.request.ts` — GET `/getMe`
  - [ ] 4.4 Create `set-my-commands.request.ts` — POST `/setMyCommands`
  - [ ] 4.5 Create `get-my-commands.request.ts` — GET `/getMyCommands`
  - [ ] 4.6 Create `set-webhook.request.ts` — POST `/setWebhook` (with `secret_token`)
  - [ ] 4.7 Create `delete-webhook.request.ts` — POST `/deleteWebhook`
  - [ ] 4.8 Create `get-webhook-info.request.ts` — GET `/getWebhookInfo`
  - [ ] 4.9 Create `answer-callback-query.request.ts` — POST `/answerCallbackQuery`
  - [ ] 4.10 Create `get-updates.request.ts` — GET `/getUpdates` (long-polling)
  - [ ] 4.11 Quality loop per file
  - [ ] 4.12 **AGENTS.md/instruction compliance** for all request builder files

- [ ] **5. TelegramBotApiAdapter (REQ-TG2, TG5, TG6, REQ-TG19)**
  - [ ] 5.1 Create `bot-api/TelegramBotApiAdapter.ts`:
    - `AbortSignal.timeout(10_000)` on all fetches
    - **Explicit `User-Agent` header** (`Siraj-TelegramBot/1.0`) — Bun auto-UA triggers ISP throttling
    - **Decrypt bot token per send call**; zeroize plaintext after use; never cache on instance (TG4)
    - **Per-chat Redis lock**: key `telegram:chat:<chatId>`, TTL 1s; defer when lock held (TG5)
    - **Global ~30/sec + group ~20/min token buckets** in addition to per-chat lock
    - HTTP 429: parse `parameters.retry_after` from JSON **body**; LINEAR backoff + propagate to global pause semaphore (TG6)
    - On `403 bot was blocked` → deactivate chat link (REQ-TG17 fallback)
    - Terminal failure → `updateDeliveryStatus(FAILED)` + `deliveryFailedMessage(NotificationChannel.TELEGRAM, locale)`
    - Use `escapeTelegramHtml()` for templated HTML content (REQ-TG19)
  - [ ] 5.2 Create `bot-api/index.ts`
  - [ ] 5.3 Quality loop per file
  - [ ] 5.4 **AGENTS.md/instruction compliance** for adapter, index

- [ ] **6. Notification dispatch wiring (REQ-TG1, REQ-TG10)**
  - [ ] 6.1 Edit `notification-dispatch.helpers.ts` — `EVENT_CHANNEL_ALLOWLIST` adds `TELEGRAM` for same events as WhatsApp; `recipientAddressForChannel` returns `user.telegramChatId` (or batch lookup via chat links)
  - [ ] 6.2 Edit `notification-payloads.builders.ts` — `ALL_CHANNELS` + Telegram branch stamps `metadata.telegramParseMode: "HTML"`; consult per-user opt-in gate (`telegramEnabled`) so opted-out users get no Telegram payload (REQ-TG10)
  - [ ] 6.3 Edit `communication.service.ts` — **dedicated `dispatchTelegram` branch** → `ITelegramChannel.send` (never route through email/sms-shaped `dispatchRecipientChannel`); fails fast if `text` missing
  - [ ] 6.4 Quality loop per file
  - [ ] 6.5 **AGENTS.md/instruction compliance** for dispatch helpers, payload builders, communication service

---

## Phase 2: Bots Backend

- [ ] **7. Database schema (REQ-TG3, REQ-TG13, REQ-TG18)**
  - [ ] 7.1 Create `backend/db/schema/telegram/telegram-bots.ts` — `encryptedBotToken`, `updateMode`, `webhookSecret`, `lastUpdateId`, `webhookPendingUpdateCount`, `webhookLastErrorDate`, `webhookLastErrorMessage` (REQ-TG22), `.$onUpdate` on `updatedAt`
  - [ ] 7.2 Create `backend/db/schema/telegram/telegram-chat-links.ts` — unique `(userId, botId)`; `chatId` index; store `telegramUserId` as `bigint`-safe varchar
  - [ ] 7.3 Create `backend/db/schema/telegram/telegram-link-codes.ts` — unique `code`, TTL via `expiresAt` (**5 min default**), `consumedAt`
  - [ ] 7.4 Create `backend/db/schema/telegram/telegram-incoming-updates.ts` — `(bot_id, update_id) UNIQUE` for idempotency dedup (REQ-TG18)
  - [ ] 7.5 Extend `users` schema — nullable `telegramChatId` denormalized hot path
  - [ ] 7.6 Create `backend/db/schema/telegram/index.ts`; edit `backend/db/schema/index.ts` barrel
  - [ ] 7.7 Run `bun db push` and verify
  - [ ] 7.8 Quality loop per file
  - [ ] 7.9 **AGENTS.md/instruction compliance** for schema files

- [ ] **7b. Shared Telegram utilities (REQ-TG19)**
  - [ ] 7b.1 Create `shared/lib/escapeTelegramHtml.ts` — escape `<`, `>`, `&` for HTML parse_mode
  - [ ] 7b.2 Create `shared/lib/normalizeTelegramLanguageCode.ts` — lowercase → split `-` → first segment → fallback
  - [ ] 7b.3 Export from `shared/lib/index.ts` (or appropriate barrel)
  - [ ] 7b.4 Quality loop per file
  - [ ] 7b.5 **AGENTS.md/instruction compliance**: `shared/AGENTS.md`

- [ ] **8. Backend types and repositories (REQ-TG3, REQ-TG8)**
  - [ ] 8.1 Create `backend/types/telegram/telegram-bot.types.ts` — `ReturnType` excludes `encryptedBotToken`
  - [ ] 8.2 Create `backend/types/telegram/telegram-chat-link.types.ts` + `telegram-link-code.types.ts`
  - [ ] 8.3 Create `backend/types/telegram/index.ts`
  - [ ] 8.4 Create `TelegramBotRepository` — CRUD, `findByBotId`, `findByWebhookSecret`, `findRawById`, `listActive`, `findByUpdateMode`, all accept optional `tx`
  - [ ] 8.5 Create `TelegramChatLinkRepository` — `findByUserId`, `findByChatId`, `findByUserAndBot`, `findByUserIds` (batch Map), `create`, `deactivate`
  - [ ] 8.6 Create `TelegramLinkCodeRepository` — `create`, `findByCode`, `markConsumed`, `deleteExpired`
  - [ ] 8.7 Create `backend/db/repo/telegram/index.ts`
  - [ ] 8.8 Quality loop per file
  - [ ] 8.9 **AGENTS.md/instruction compliance** for types and repository files

- [ ] **9. Telegram bot service (REQ-TG4, REQ-TG10, TG4)**
  - [ ] 9.1 Create `backend/services/telegram/telegram-bot.service.ts`:
    - CRUD gated by `TELEGRAM_CONFIG_MANAGE` / `TELEGRAM_VIEW` / `TELEGRAM_BOTS_MANAGE`
    - `syncFromTelegram()` via `getMe`
    - `setBotToken` — encrypt, audit `***`, then call `resetTelegramChannel()` (TG4)
    - `setWebhook` / `deleteWebhook` / `setMyCommands` / `setUpdateMode`
    - Per-user opt-in helpers: `isUserTelegramOptIn`, `setUserTelegramOptIn` writing `telegram_opt_in` audit event
  - [ ] 9.2 Create `backend/services/telegram/index.ts`
  - [ ] 9.3 Extend notification-preference storage with `telegramEnabled` boolean defaulting **false** (REQ-TG10)
  - [ ] 9.4 Quality loop per file
  - [ ] 9.5 **AGENTS.md/instruction compliance** for service files

- [ ] **10. Telegram link service (REQ-TG13, REQ-TG21)**
  - [ ] 10.1 Create `backend/services/telegram/telegram-link.service.ts`:
    - `generateLinkCode(userId, botId?, createdByUserId)` — `crypto.randomBytes` → unpadded base64url, TTL **5 min**, returns `{ code, deepLinkUrl: "https://t.me/<bot>?start=<code>", expiresAt }`
    - `consumeLinkCode(code, telegramUserId, chatId, chatType)` — **atomic single-statement consume** (`UPDATE … WHERE consumed_at IS NULL AND expires_at > NOW() RETURNING …`); **reject if Telegram user already linked to different Siraj user** (REQ-TG13 critical)
    - `unlinkUser(userId, botId)` — deactivate link, clear `users.telegramChatId` if last link
    - `adminUnlinkChatLink(chatLinkId, adminUserId)` — SUPER_ADMIN override (REQ-TG21)
    - `pollLinkStatus(userId)` — return PENDING/CONSUMED/EXPIRED for profile card polling (REQ-TG20)
  - [ ] 10.2 Edit `backend/types/audit/audit.types.ts` — add `TELEGRAM_BOT`, `TELEGRAM_CHAT_LINK`
  - [ ] 10.3 Quality loop per file
  - [ ] 10.4 **AGENTS.md/instruction compliance** for link service and audit types

- [ ] **11. Permissions migration (REQ-TG6, REQ-TG12)**
  - [ ] 11.1 Edit `backend/enum/permissions/permission.enum.ts` — four permissions: `TELEGRAM_VIEW`, `TELEGRAM_CONFIG_MANAGE`, `TELEGRAM_BOTS_MANAGE`, `TELEGRAM_DISPATCH`
  - [ ] 11.2 Create `backend/db/migration/9a-telegram-permissions-enum.sql` — enum values only
  - [ ] 11.3 Create `backend/db/migration/9b-telegram-permissions-data.sql` — seed rows + `super_admin` grants; mirror `8a/8b` with `trg_protect_system_permissions` wrap
  - [ ] 11.4 Wire into `backend/drizzle/.custom-migrations.json`
  - [ ] 11.5 Run `bun db migrate` then verify
  - [ ] 11.6 Quality loop per file
  - [ ] 11.7 **AGENTS.md/instruction compliance** for enum and migration files

- [ ] **12. GraphQL layer (REQ-TG8, TG4)**
  - [ ] 12.1 Create `backend/graphql/pothos/telegram/telegram-bot.pothos.ts` + chat link + link code types
  - [ ] 12.2 Create `backend/graphql/pothos/telegram/index.ts`
  - [ ] 12.3 Create mutations: `createTelegramBot`, `updateTelegramBot`, `deleteTelegramBot`, `setTelegramBotToken`, `syncTelegramBotFromApi`, `setTelegramBotWebhook`, `deleteTelegramBotWebhook`, `setTelegramBotCommands`, `setTelegramBotUpdateMode`, `generateTelegramLinkCode`, `setUserTelegramOptIn`, `unlinkTelegramChatLink` (admin override, REQ-TG21) — token mutations call `resetTelegramChannel()` on success (TG4)
  - [ ] 12.4 Create queries: `telegramBots`, `telegramBot`, `telegramChatLinks`, `isUserTelegramOptIn`, `pollTelegramLinkStatus` (REQ-TG20)
  - [ ] 12.5 Edit GraphQL index barrels (pothos, query, mutation)
  - [ ] 12.6 Run `bun run generate:gqlSchema && bun codegen`
  - [ ] 12.7 Quality loop per file
  - [ ] 12.8 **AGENTS.md/instruction compliance** for Pothos, mutation, query files

---

## Phase 3: Webhook Receiver + Long-Polling Worker

- [ ] **13. Webhook route (REQ-TG5, REQ-TG18)**
  - [ ] 13.1 Create `app/api/webhooks/telegram/route.ts`:
    - **`export const maxDuration = 30`** — Telegram waits up to 60s for 2xx; return within ~1s
    - **POST only** — Telegram has no GET verification handshake
    - Pre-check `content-length` header → reject >1 MB with 413 before reading body
    - `await req.text()`; defensive `Buffer.byteLength(raw) > 1_000_000` → 413 (byte-accurate; Vercel hard limit 4.5 MB)
    - Read `req.headers.get('x-telegram-bot-api-secret-token')` (**lowercase**); compare via `crypto.timingSafeEqual` with **length pre-check guard** (bearer header, NOT HMAC-over-body)
    - On mismatch: log only `(ip, userAgent, contentLength)` — never body
    - **Redis SETNX** `telegram:{botId}:seen:<update_id> EX 3600` — if exists, return 200 and skip (REQ-TG18 multi-replica safety)
    - Strip deep-link codes from `message.text` before logging
    - **Always return `NextResponse.json({ ok: true })` immediately** — even on downstream processing errors; defer handler via **`after(async () => …)` from `next/server`** (cap ~30s; Vercel Queues offload deferred to v2)
  - [ ] 13.2 Quality loop per file
  - [ ] 13.3 **AGENTS.md/instruction compliance** for App Router route

- [ ] **14. Webhook handler (REQ-TG5, REQ-TG14, REQ-TG17, REQ-TG18)**
  - [ ] 14.1 Create `backend/services/telegram/telegram-webhook.handler.ts`:
    - Discriminated union dispatch on Update (at most one optional field per Update)
    - Insert `incoming_update(bot_id, update_id)` with `ON CONFLICT DO NOTHING` — skip if duplicate (REQ-TG18)
    - Route `message` with `bot_command` entity at offset 0 → `TelegramBotCommandHandler` (entities-based parsing, NOT `text.startsWith`)
    - Route `callback_query` → handler answers FIRST, then dispatches by opcode prefix (`l:`, `o:`, `h:`)
    - Route `my_chat_member` → block/unblock handler: `member→kicked/left` deactivate link; `kicked→member` wait for `/start` (REQ-TG17)
    - Free-text messages → acknowledgment reply (v1)
    - Update `telegram_bots.lastWebhookAt`; advance `lastUpdateId` via **`GREATEST(current, new)`** forward-only semantics (REQ-TG18)
  - [ ] 14.2 Quality loop per file
  - [ ] 14.3 **AGENTS.md/instruction compliance** for handler service

- [ ] **15. Bot command handler (REQ-TG13, REQ-TG14)**
  - [ ] 15.1 Create `backend/services/telegram/telegram-bot-command-handler.ts`:
    - Parse commands via `message.entities` (`bot_command` at offset 0): `cmdToken = text.substring(0, entity.length)`; `[name] = cmdToken.slice(1).split("@", 1)`; `args = text.substring(entity.length).trim()`
    - `/start [code]` → link flow; empty payload → welcome path (cold-reopen edge case)
    - `/help`, `/link`, `/unlink`, `/optin`, `/optout` per REQ-TG14
    - `callback_data` routing: opaque opcode tokens (`l:<id>`, `o:<id>`, `h:<name>`) — NEVER raw linking code
    - All replies use Siraj DB `user.preferredLocale` via `normalizeTelegramLanguageCode()` fallback
  - [ ] 15.2 Quality loop per file
  - [ ] 15.3 **AGENTS.md/instruction compliance** for command handler

- [ ] **16. Long-polling worker + heartbeat cron (REQ-TG15, REQ-TG22)**
  - [ ] 16.1 Create `backend/services/telegram/telegram-polling.worker.ts`:
    - Token-bearing Redis lock: `SET telegram:polling:lock:<botId> <uuid> NX PX <lockTtlMs>` where `lockTtlMs = (maxDuration + 30) * 1000` (90s with `maxDuration=60`)
    - Lua compare-and-delete release on UUID
    - Only poll bots in `long_polling` mode OR webhook-degraded (`pending_update_count > 0` / recent `last_error_date`)
    - `getUpdates({ offset, timeout: 30, allowed_updates: ["message","callback_query","my_chat_member"] })`
    - Advance `lastUpdateId` AFTER handler commits, OUTSIDE handler transaction (`GREATEST` semantics)
    - 429: LINEAR `retry_after` backoff; 409: back off 60s, alert on persistent 409
    - `getWebhookInfo` sweep → persist `webhookPendingUpdateCount`, `webhookLastErrorDate`, `webhookLastErrorMessage` on bot row
  - [ ] 16.2 Create `scripts/telegram-polling-worker.ts` — Bun entry point (NOT inline in Next.js)
  - [ ] 16.3 Create `app/api/cron/telegram-polling/route.ts` — `export const maxDuration = 60`; verify `Authorization: Bearer $CRON_SECRET`; `export const dynamic = "force-dynamic"`. Add `vercel.json` cron `*/1 * * * *` → `/api/cron/telegram-polling`. Document Hobby plan limitation (once-per-day — polling requires Pro). Optional: enqueue QStash job for single long-poll (cron as trigger, not executor)
  - [ ] 16.4 Quality loop per file
  - [ ] 16.5 **AGENTS.md/instruction compliance** for worker, script, cron route

---

## Phase 4: i18n & GraphQL Documents

- [ ] **17. i18n (REQ-TG7, REQ-TG19)**
  - [ ] 17.1 Create `shared/locale/types/telegram/index.ts` — include `commands` section for `setMyCommands` descriptions
  - [ ] 17.2 Create `shared/locale/en/telegram/index.ts`
  - [ ] 17.3 Create `shared/locale/ar/telegram/index.ts`
  - [ ] 17.4 Register namespace in `shared/locale/types/message.ts` and assembler files
  - [ ] 17.5 Add Telegram delivery-failure keys to `errors` locale (types/en/ar)
  - [ ] 17.6 Bot command reply templates, webhook/polling warnings, opt-in consent copy, Hobby-plan polling limitation note
  - [ ] 17.7 Quality loop per file
  - [ ] 17.8 **AGENTS.md/instruction compliance**: `shared/AGENTS.md`

- [ ] **18. Frontend GraphQL documents (REQ-TG8)**
  - [ ] 18.1 Create `frontend/common/graphql/sharedDocuments/telegram/telegram.documents.ts` — every object includes `id`
  - [ ] 18.2 Edit `frontend/common/graphql/sharedDocuments/index.ts` barrel
  - [ ] 18.3 Run `bun codegen` if schema already generated in task 12
  - [ ] 18.4 Quality loop per file
  - [ ] 18.5 **AGENTS.md/instruction compliance**: `frontend/common/graphql/sharedDocuments/AGENTS.md`, `frontend/common/graphql/AGENTS.md`, `frontend/AGENTS.md`

---

## Phase 5: Admin Telegram Configuration (Frontend)

- [ ] **19. NavigationConfig extension (REQ-TG11)**
  - [ ] 19.1 Edit `frontend/common/views/dashboard/config/navigationConfig.ts` — add Telegram NavItem under existing Integrations NavGroup (from WhatsApp Phase 7)
  - [ ] 19.2 NavItem: `href: "/settings/telegram"`, icon, permission: `TELEGRAM_VIEW`
  - [ ] 19.3 Edit `navIconKeys.ts` + `navIconRegistry.tsx` — Telegram icon
  - [ ] 19.4 Edit `shared/locale/{types,en,ar}/dashboard/core/nav.ts` — Telegram nav label
  - [ ] 19.5 Quality loop per file
  - [ ] 19.6 **AGENTS.md/instruction compliance**: `frontend/common/views/AGENTS.md`, `frontend/AGENTS.md`, mobile-desktop instructions

- [ ] **20. Settings route (REQ-TG11, REQ-TG12)**
  - [ ] 20.1 Create `app/(dashboard)/settings/telegram/page.tsx` — Server Component with `requirePermissionForPage` checking `TELEGRAM_VIEW`
  - [ ] 20.2 Create `frontend/common/views/dashboard/settings/telegram/TelegramSettingsContainer.tsx` — Client Component with `RequirePermission` wrapper
  - [ ] 20.3 Quality loop per file
  - [ ] 20.4 **AGENTS.md/instruction compliance**: `app/AGENTS.md`, `frontend/common/views/AGENTS.md`, `frontend/AGENTS.md`

- [ ] **21. Three-tab UI shell (REQ-TG11)**
  - [ ] 21.1 Create `frontend/common/views/dashboard/settings/telegram/types/telegramSettingsTypes.ts`
  - [ ] 21.2 Create `frontend/common/views/dashboard/settings/telegram/useTelegramSettingsViewModel.ts` — three tab states, data fetching; **NO `useLazyQuery`**
  - [ ] 21.3 Create `frontend/common/views/dashboard/settings/telegram/TelegramConfigView.tsx` — `ResponsiveViewSwitch` + `createLazyView`
  - [ ] 21.4 Create `frontend/desktop/views/dashboard/settings/telegram/telegramConfig.desktop.tsx`
  - [ ] 21.5 Create `frontend/mobile/views/dashboard/settings/telegram/telegramConfig.mobile.tsx`
  - [ ] 21.6 Quality loop per file
  - [ ] 21.7 **AGENTS.md/instruction compliance**: `frontend/common/views/AGENTS.md`, `frontend/AGENTS.md`, mobile-desktop instructions

- [ ] **22. Bots Tab (REQ-TG4, REQ-TG11)**
  - [ ] 22.1 Create shared + desktop + mobile Bots tab components
  - [ ] 22.2 Bot cards: username, display name, update mode badge, active toggle, last webhook, Sync / Edit Token / Set Webhook / Set Commands / Switch to Polling actions
  - [ ] 22.3 Quality loop per file
  - [ ] 22.4 **AGENTS.md/instruction compliance**: desktop/mobile tier AGENTS.md files

- [ ] **23. Link Codes Tab (REQ-TG11, REQ-TG13)**
  - [ ] 23.1 Create shared + desktop + mobile Link Codes tab components
  - [ ] 23.2 Generate code for a user → modal with code + QR + deep link + TTL countdown + copy/open buttons
  - [ ] 23.3 History table: code, user, status (PENDING/CONSUMED/EXPIRED)
  - [ ] 23.4 Quality loop per file
  - [ ] 23.5 **AGENTS.md/instruction compliance**: desktop/mobile tier AGENTS.md files

- [ ] **24. Opt-in Management Tab (REQ-TG10, REQ-TG11)**
  - [ ] 24.1 Create shared + desktop + mobile Opt-in tab components
  - [ ] 24.2 Paginated table: User, Telegram status, Opt-in toggle, Last Change, Changed By
  - [ ] 24.3 Bulk toggle (SUPER_ADMIN only, confirmed dialog)
  - [ ] 24.4 Quality loop per file
  - [ ] 24.5 **AGENTS.md/instruction compliance**: desktop/mobile tier AGENTS.md files

- [ ] **25. Profile Link Telegram card (REQ-TG16, REQ-TG20)**
  - [ ] 25.1 Create `frontend/common/views/dashboard/profile/telegram/LinkTelegramCard.tsx` + tier variants
  - [ ] 25.2 Self-service: link status, generate code dialog, unlink button
  - [ ] 25.3 Poll `pollTelegramLinkStatus(userId)` every 2s after code generation until CONSUMED/EXPIRED (auto-flip UI)
  - [ ] 25.4 Integrate into notification preferences / profile layout
  - [ ] 25.4 Quality loop per file
  - [ ] 25.5 **AGENTS.md/instruction compliance**: `frontend/common/views/AGENTS.md`, `frontend/AGENTS.md`, mobile-desktop instructions

---

## Phase 6: Tests

- [ ] **26. @live-comm integration tests (REQ-TG9)**
  - [ ] 26.1 `send-message.integration.test.ts`
  - [ ] 26.2 `get-me.integration.test.ts`
  - [ ] 26.3 `set-my-commands.integration.test.ts` + `get-my-commands.integration.test.ts` round-trip
  - [ ] 26.4 `set-webhook.integration.test.ts` (invalid URL rejection)
  - [ ] 26.5 `get-updates.integration.test.ts` (short timeout, assert shape)
  - [ ] 26.6 `per-chat-rate-limit.integration.test.ts` — two sends to same chat < 1s apart; assert **second is deferred (not failed)** (TG5)
  - [ ] 26.7 `telegram-api-call-coverage.test.ts` — fails if any builder under `bot-api/requests/` lacks paired integration test (9 builders required)
  - [ ] 26.8 Verify skip behavior when env creds missing (`TELEGRAM_BOT_TOKEN`, `TELEGRAM_TEST_CHAT_ID`)
  - [ ] 26.9 Quality loop per file
  - [ ] 26.10 **AGENTS.md/instruction compliance**: `scripts/run-test/AGENTS.md`, tests.instructions.md

- [ ] **27. Unit tests (REQ-TG5, REQ-TG10, REQ-TG13, REQ-TG14, REQ-TG15, REQ-TG17, REQ-TG18)**
  - [ ] 27.1 Create `telegram-channel.test.ts` — factory singleton, `resetTelegramChannel()`, validateConfig, explicit User-Agent
  - [ ] 27.2 Create `telegram-webhook.handler.test.ts` — secret-token +/- with length guard; Redis SETNX dedup; `my_chat_member` block/unblock
  - [ ] 27.3 Create `telegram-link.service.test.ts` — 5-min TTL, atomic consume SQL, **uniqueness guard**, expired/consumed
  - [ ] 27.4 Create `telegram-optin.test.ts` — default OFF; gate blocks fan-out
  - [ ] 27.5 Create `telegram-polling.worker.test.ts` — token-bearing lock TTL formula, offset advance timing, 429/409 backoff
  - [ ] 27.6 Create `telegram-bot-command-handler.test.ts` — entities-based `/start@BotName code` parsing; `answerCallbackQuery` called before DB work
  - [ ] 27.7 Create `shared/lib/test/escapeTelegramHtml.test.ts` + `normalizeTelegramLanguageCode.test.ts`
  - [ ] 27.7 Create `test/ui/components/useTelegramSettingsViewModel.test.tsx` — mocked Apollo
  - [ ] 27.8 Run DB-backed tests via `bun run scripts/run-test/run-test.ts` where applicable
  - [ ] 27.9 Quality loop per file
  - [ ] 27.10 **AGENTS.md/instruction compliance** for all test files

---

## Phase 7: Quality Loop

- [ ] **28. Final verification**
  - [ ] 28.1 All REQ-TG acceptance criteria checked against [specs.md](./specs.md) — including REQ-TG13 uniqueness guard and REQ-TG9 builder coverage
  - [ ] 28.2 Confirm no plan regressions: grep for `queueMicrotask` in webhook route (TG10); `dispatchRecipientChannel` handling telegram; missing `CHANNEL_LABELS.telegram`; in-memory rate-limit maps (TG5); webhook+HMAC body verify (must NOT exist — TG7)
  - [ ] 28.3 Run **quality loop** on all modified files: `bun tsgo && bun biome:check && lint-queue-client`
  - [ ] 28.4 Fix tsgo / biome / lint failures
  - [ ] 28.5 Re-run quality loop until all stages pass
  - [ ] 28.6 **AGENTS.md/instruction compliance** for any final modified files
  - [ ] 28.7 Update Progress Summary below

---

## Phase 8: Knowledge Propagation (MANDATORY Final Task)

- [ ] **29. Knowledge Propagation & Documentation**
  - [ ] 29.1 Read all outcome files in `.ai/plans/telegram/outcome/` to synthesize all learnings
  - [ ] 29.2 Create canonical reference doc under `docs/services/telegram-bot-api.md` consolidating patterns, rules, and gotchas
  - [ ] 29.3 Update `backend/services/AGENTS.md` with Telegram channel patterns and reference to the new doc
  - [ ] 29.4 Update `backend/AGENTS.md` with Telegram integration reference
  - [ ] 29.5 Update `backend/graphql/AGENTS.md` if GraphQL patterns were introduced
  - [ ] 29.6 Update `.agents/instructions/backend.instructions.md` if new conventions should be enforced
  - [ ] 29.7 Update root `AGENTS.md` Important References section with the new doc
  - [ ] 29.8 Run global check: `bun tsgo`, `bun biome:check`, `bun run lint` (0 errors, 0 warnings)
  - [ ] 29.9 Write outcome file: `.ai/plans/telegram/outcome/29-knowledge-propagation-outcome.md`
  - [ ] 29.10 Update progress: Mark task 29 as `[x]` in `trackable-tasks.md`
  - _Requirements: REQ-TG0 knowledge propagation protocol_

---

## Blocker Log

| Date | Task | Blocker | Resolution | Status |
|------|------|---------|------------|--------|
| 2026-08-01 | All | WhatsApp plan not yet 100% complete | Wait for WhatsApp tasks 22–30 | **ACTIVE** |

_Add rows when blocked. Remove or mark resolved when unblocked._

---

## Progress Summary

| Phase | Parent Tasks | Completed | Status |
|-------|-------------|-----------|--------|
| 1. Channel Foundations | 6 | 0 | `[ ]` |
| 2. Bots Backend | 7 | 0 | `[ ]` |
| 3. Webhook + Polling | 4 | 0 | `[ ]` |
| 4. i18n & GraphQL Docs | 2 | 0 | `[ ]` |
| 5. Admin Telegram Config (Frontend) | 7 | 0 | `[ ]` |
| 6. Tests | 2 | 0 | `[ ]` |
| 7. Quality Loop | 1 | 0 | `[ ]` |
| 8. Knowledge Propagation | 1 | 0 | `[ ]` |
| **Total** | **30** | **0** | **0%** |

_Update the Progress Summary table as tasks are completed._

---

## Requirements Traceability

| Requirement | Primary tasks |
|-------------|---------------|
| REQ-TG0 Outcome protocol | All tasks, 29 |
| REQ-TG1 Channel | 1, 6 |
| REQ-TG2 Send messages | 4, 5, 26 |
| REQ-TG3 Credentials | 2, 7, 8, 9 |
| REQ-TG4 Bots admin | 9, 22 |
| REQ-TG5 Webhooks | 13, 14, 27.2 |
| REQ-TG6 Permissions | 11 |
| REQ-TG7 i18n | 17 |
| REQ-TG8 GraphQL | 12, 18 |
| REQ-TG9 Integration tests | 4, 26 |
| REQ-TG10 Opt-in | 6.2, 9.3, 24, 27.4 |
| REQ-TG11 Admin UX | 19, 20, 21, 22, 23, 24 |
| REQ-TG12 Permission matrix | 11, 20, 22, 23, 24 |
| REQ-TG13 Link codes | 7, 10, 15, 23, 27.3 |
| REQ-TG14 Bot commands | 15, 27.6 |
| REQ-TG15 Long polling | 16, 27.5 |
| REQ-TG16 Profile self-service | 25 |
| REQ-TG17 my_chat_member handler | 14 |
| REQ-TG18 Idempotency (incoming_update + SETNX) | 7, 13, 14 |
| REQ-TG19 Shared utils (escapeHtml, normalizeLang, UA) | 5, 7b, 17 |
| REQ-TG20 Poll-for-completion | 10, 12, 25 |
| REQ-TG21 Admin override unlink | 10, 12 |
| REQ-TG22 Webhook health monitoring | 7, 16 |

## Design-Decision Traceability

| Tag | Description | Where addressed |
|-----|-------------|-----------------|
| TG1 | Free-text sends (no template map) | 3.1, 6.2 |
| TG2 | Header secret-token auth (not HMAC body) | 13.1, 28.2 |
| TG3 | No third-party SDK | 4.*, implementation.md |
| TG4 | `resetTelegramChannel()` on token change | 3.2, 5.1, 9.1, 12.3 |
| TG5 | Per-chat Redis defer (not FAILED) | 5.1, 26.6, 27.1 |
| TG6 | HTTP 429 `retry_after` defer | 5.1 |
| TG7 | Secret header verification | 13.1 |
| TG8 | Metadata-only failure logs | 13.1, 27.2 |
| TG9 | Strip deep-link codes from logs | 13.1 |
| TG10 | `after()` not `queueMicrotask` | 13.1, 28.2 |
| TG11 | Webhook vs polling mutually exclusive | 9.1, 16.*, implementation.md pitfalls |
| TG12 | `TELEGRAM_DISPATCH` included (forward-compat) | 11.1 |
