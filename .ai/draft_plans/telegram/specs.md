# Telegram Integration — Requirements (Specs)

**Feature**: Telegram Bot API integration for Siraj
**Version**: 1.2
**Date**: 2026-08-01
**Status**: Research-confirmed (Bot API 10.2, July 14 2026) — execution blocked until [WhatsApp plan](../whatsapp/trackable-tasks.md) reaches 100% completion
**Target Directory**: `.ai/plans/telegram`
**Outcome Directory**: `.ai/plans/telegram/outcome`
**Related**: [Implementation Guide](./implementation.md) · [Trackable Tasks](./trackable-tasks.md)

**Process**: [.agents/spec-process-guide](../../.agents/spec-process-guide/NAVIGATION.md) — Requirements → Design (`implementation.md`) → Tasks (`trackable-tasks.md`)

---

## Introduction

Siraj currently supports five notification channels (on-app, email, SMS, push, WhatsApp — the latter is in flight under [`.ai/plans/whatsapp`](../whatsapp/trackable-tasks.md)). This plan adds Telegram as the **sixth** channel and goes beyond WhatsApp by introducing full **bot capabilities** — bidirectional interactions where the bot both pushes notifications TO users AND receives/handles inbound commands, chat messages, and callback queries FROM users.

Telegram differs from WhatsApp in three key ways that shape this plan:

1. **No 24-hour service window / template-only restriction** — Telegram Bot API allows free-text `sendMessage` calls any time; there is no Meta-equivalent template approval requirement.
2. **Interactive bot UX** — Telegram supports `reply_markup` (inline keyboards, reply keyboards), `callback_query` updates from button taps, and `/commands` discovered via `setMyCommands`.
3. **Two update mechanisms** — Telegram bots receive updates via either HTTPS webhook (`setWebhook`, with a `secret_token` header signature) OR long polling (`getUpdates`); these are mutually exclusive per bot.

### Feature summary

Add Telegram outbound notifications (free text + HTML/Markdown `parse_mode` + optional `reply_markup`), inbound bot message handling (`/start`, `/help`, `/link`, `/unlink`, `/optin`, `/optout` plus arbitrary callback queries), a **unique account-linking flow** where an admin/user opens a UI view that generates a one-time code which the user submits to the bot via `/start <code>` (linking is rejected if the Telegram account is already linked to a different Siraj user), configurable webhooks vs long-polling per bot, hybrid credentials (global env-config + per-bot encrypted token), admin UX (Bots / Link Codes / Opt-in Management tabs under the Integrations NavGroup established by WhatsApp Phase 7), and per-user opt-in defaulting OFF.

### Business value

- Reach parents and students on Telegram — a widely used messaging platform, especially in markets where Telegram dominates (CIS, MENA, parts of Europe).
- Interactive bot capabilities — users can self-link their account via a one-time code, manage their own opt-in via `/optin`/`/optout`, request help, and (in v2) trigger workflows via callback buttons.
- Delivery lifecycle (`sent` → `delivered`; no `read` for bots) visible in the existing notification audit trail.
- Administrators register bots via @BotFather, paste the token into Siraj (encrypted at rest), toggle webhook/polling per bot, sync commands, and watch delivery status — all without a third-party SDK.

### Scope (v1)

| In scope | Out of scope (v2) |
|----------|-------------------|
| `TELEGRAM` notification channel in `CommunicationService` | Telegram Login Widget (web-based auth) |
| Outbound `sendMessage` with free text + `parse_mode` + `reply_markup` | Telegram Stars / payments |
| Bot API via raw `fetch` (no third-party SDK — mirror WhatsApp approach) | grammY / Telegraf adoption (evaluated; deferred) |
| Reuse `notification_deliveries` for delivery rows (channel-agnostic) | Dedicated `telegram_messages` table |
| Hybrid creds: env-config (global) + `telegram_bots` (per-bot, encrypted) | Multi-tenant bot isolation |
| Webhook receiver (secret-token header validation) | HMAC-over-body (Telegram uses secret header, not HMAC) |
| Long-polling worker (configurable per bot, Redis-locked for safe multi-instance) | Edge function deployment |
| Bot commands: `/start`, `/help`, `/link`, `/unlink`, `/optin`, `/optout` | Arbitrary NLP/AI reply routing |
| `callback_query` handling via `answerCallbackQuery` + dispatch by `callback_data` | Inline-mode bots |
| **Per-user account linking via one-time code** (unique to Telegram) | Channel posting / broadcast channels |
| Three tables: `telegram_bots`, `telegram_chat_links`, `telegram_link_codes` | Per-academy bot routing (single default bot only in v1) |
| Integrations NavGroup entry (occupied alongside WhatsApp) | Mini Apps / Web Apps |
| Three tabs: Bots + Link Codes + Opt-in Management | Bot analytics dashboard |
| Per-user Telegram opt-in preference (default OFF) | Opt-in via inbound `contact` message parsing |
| Per-user self-service "Link Telegram Account" card (profile page) | QR-only linking (deep-link + manual `/start <code>` both supported) |
| AR/EN `telegram` locale namespace | |
| `TELEGRAM_DISPATCH` permission (forward-compat for v2 send-mutation) | Bot broadcasting UI (v2) |

### Confirmed decisions (stakeholder + research-driven)

1. **Scope**: Full bidirectional — push notifications + bot abilities. Resolved in plan-mode `AskQuestion` (2026-08-01).
2. **Update mechanism**: Both webhook AND long-polling, configurable per bot via `telegram_bots.updateMode`; admin UI toggles the mode. Resolved.
3. **Recipient routing**: All three resolution strategies plus one-time-code linking:
   - `telegram_chat_links` table (per-user ↔ bot ↔ `chat_id` mapping)
   - Denormalized `users.telegramChatId` for hot-path fan-out (set when first chat link is established)
   - Phone-based fallback via `sendContact` (in-bot sharing — only when a user shares a verified phone)
   - **One-time-code linking flow** — UI view presents code, user enters it into the bot via `/start <code>`; linking rejected if the Telegram account is already linked to a different Siraj user.
4. **SDK decision**: No third-party SDK in v1 — typed `fetch` builders per Bot API method + `@live-comm` integration tests, mirroring WhatsApp. grammY is the recommended framework if we later adopt one ([grammY comparison](https://grammy.dev/resources/comparison)) — explicitly deferred to v2.
5. **Webhook signature**: Compare `X-Telegram-Bot-Api-Secret-Token` header via `crypto.timingSafeEqual` with a **length pre-check guard** (S5-equivalent). Telegram uses a **bearer-style header token**, NOT HMAC-over-body — there is no equivalent of Meta's `X-Hub-Signature-256`. If `secret_token` was omitted on `setWebhook`, Telegram does NOT send the header — admin UI MUST require `secret_token` (generate via base64url-without-padding of `crypto.randomBytes(32)`).
6. **Rate limits**: HTTP 429 with `parameters.retry_after` (seconds) in the JSON **body** (not a header) — defer via `setTimeout(retry_after * 1000 + 100)`, do not mark `FAILED` on first 429 without deferred retry. Implement per-`chat_id` (~1/sec burst ≤3) + global (~30/sec) + group (~20/min) token buckets. Use **LINEAR** backoff on 429 (`retry_after + jitter`), NOT exponential (exponential reserved for 409/5xx). Propagate `retry_after` to a global pause semaphore.
7. **Per-chat concurrency**: Single in-flight send per `chat_id` to respect ~1 msg/sec limit — Redis key `telegram:chat:<chatId>` TTL 1s.
8. **No budget accounting**: Telegram has no equivalent of Meta's `portfolioMessagingLimitTier` consumed on failure — `ChannelDispatchResult.sendAttempted` stays `undefined` for Telegram.
9. **Free-text sends**: `TelegramPayload.text` field directly — no `template` indirection (unlike WhatsApp B1).
10. **Default opt-in OFF**: All users start with `telegramEnabled: false`. Admins can toggle in Opt-in tab; users can opt-in via profile settings or `/optin` bot command (after linking).
11. **Long-polling deployment**: Vercel Cron route (`app/api/cron/telegram-polling/route.ts`) with `maxDuration = 60` — **heartbeat only** (webhook is primary ingestion). Cron polls `long_polling` bots or webhook-degraded bots; registered in `vercel.json` as `*/1 * * * *`. NOT inline `setInterval` in the Next.js server process (serverless incompatible). Vercel Hobby Cron = once-per-day only → polling requires **Pro** (or external scheduler). Redis lock TTL = `routeMaxDurationSeconds + 30` (90s with `maxDuration=60`), token-bearing with Lua compare-and-delete release.
12. **Webhook routing**: Single shared route `app/api/webhooks/telegram/route.ts` — bot lookup by secret token (NOT per-bot URL path). `max_connections: 1` default for v1 (in-order delivery). HTTPS ports: 443, 80, 88, 8443 (TLS 1.2+).
13. **`TELEGRAM_DISPATCH` permission**: Included in v1 for forward-compat with a future bot-initiated broadcast mutation; unused in v1.
14. **`recipientAddressForChannel` hot path**: Use batch lookup via `TelegramChatLinkRepository.findByUserIds(userIds)` returning `Map<userId, link>` — DataLoader-friendly.
15. **Inbound free-text**: v1 replies with a simple acknowledgment ("Sorry, I only understand commands right now. Try /help"); v2 may route to a supervisor reply UI.
16. **Command parsing**: Use `message.entities` (`bot_command` at offset 0), NOT `text.startsWith("/")` — handles `/start@BotName code` correctly.
17. **Link code TTL**: **5 minutes** (industry standard). Charset base64url `[A-Za-z0-9_-]`, max 64 chars on deep-link parameter. Canonical URL: `https://t.me/<bot>?start=<code>` (NOT `tg://msg?to=…`).
18. **Idempotency**: Webhook mode — Redis `SETNX telegram:{botId}:seen:<update_id> EX 3600` at top of handler. Long-polling — advance `lastUpdateId` AFTER handler commits, OUTSIDE handler transaction. `incoming_update(bot_id, update_id) UNIQUE` table.
19. **SDK v2 path**: grammY 1.45.1 (tracks Bot API 10.2, `auto-retry` plugin). Telegraf excluded (maintenance mode). v1 = raw `fetch` + explicit `User-Agent` header (Bun auto-UA triggers ISP throttling).
20. **i18n for bot replies**: Siraj DB `user.preferredLocale` wins; `from.language_code` only as first-contact hint. `parse_mode: "HTML"` with `escapeTelegramHtml()` util.

### Official integration path

Telegram Bot API is the official HTTP interface at `https://api.telegram.org/bot<token>/<method>`. No official Node SDK exists (community libraries include grammY, Telegraf, node-telegram-bot-api — none endorsed).

References (researched 2026-08-01 against Bot API 10.2, July 14 2026):
- [Bot API home](https://core.telegram.org/bots/api)
- [Bot API changelog](https://core.telegram.org/bots/api-changelog)
- [Bot Features (commands, deep linking, keyboards)](https://core.telegram.org/bots/features)
- [Bots FAQ (webhook secret token)](https://core.telegram.org/bots/faq)
- [setWebhook](https://core.telegram.org/bots/api#setwebhook)
- [sendMessage](https://core.telegram.org/bots/api#sendmessage)
- [Deep links (`t.me/<bot>?start=<parameter>`)](https://core.telegram.org/api/links)
- [Long Polling vs Webhook (GramIO)](https://gramio.dev/updates/webhook)
- [Flood limits & retry_after (grammY)](https://grammy.dev/advanced/flood)
- [Avoiding flood limits (python-telegram-bot wiki)](https://github-wiki-see.page/m/python-telegram-bot/python-telegram-bot/wiki/Avoiding-flood-limits)

---

## Requirements

### REQ-TG0: Execution outcome protocol & task progress tracking

**User story:** As an AI agent or developer, I want persistent task outcome tracking and progress updates, so that subsequent tasks do not repeat past research or analysis.

#### Acceptance criteria

1. WHEN an executing agent starts any task THEN the system SHALL read ALL existing files in `.ai/plans/telegram/outcome/` before doing any other work.
2. WHEN an executing agent completes any task THEN the system SHALL write a new outcome document under `.ai/plans/telegram/outcome/<task-id>-outcome.md` detailing research findings, Bot API web search results, implementation details, and carry-over points.
3. WHEN an executing agent completes any subtask THEN the system SHALL update the corresponding task checkbox `[ ]` → `[x]` in `trackable-tasks.md`.
4. WHEN any file is modified THEN the system SHALL execute per-file verification (`bun tsgo` + `bun biome:check` + lint-queue for target file) before moving on.
5. WHEN any subtask is completed THEN the system SHALL execute `bun tsgo`, `bun biome:check`, and `bun run lint` globally, exiting with zero errors and zero warnings.

**Priority**: High | **Complexity**: Low

---

### REQ-TG1: Telegram as notification channel

**User story:** As a system operator, I want Siraj to send Telegram messages when notification events allow Telegram, so that users receive class and billing updates on Telegram.

#### Acceptance criteria

1. WHEN `CommunicationService.dispatch` receives a payload with `channel: NotificationChannel.TELEGRAM` THEN Siraj SHALL route it to a **dedicated `dispatchTelegram` branch** that builds a `TelegramPayload.text` from the notification body (not the email/sms-shaped `dispatchRecipientChannel`).
2. WHEN a notification is built for an event in `EVENT_CHANNEL_ALLOWLIST` with `TELEGRAM` THEN Siraj SHALL include a Telegram payload in the fan-out from `notification-payloads.builders`, carrying free text (with optional `parseMode: "HTML"`) and optional `replyMarkup` in `metadata.telegramPayload`.
3. WHEN resolving recipient address for `telegram` THEN Siraj SHALL look up `user.telegramChatId` via `TelegramChatLinkRepository.findByUserIds` batch finder (DataLoader pattern); IF no chat link exists for the user THEN Siraj SHALL skip the payload silently (no error — user has not linked Telegram yet).
4. IF `NotificationChannel` is extended with `TELEGRAM` THEN the exhaustive `default: never` branch in `dispatch` SHALL compile only after `case "telegram"` exists AND `CHANNEL_LABELS` in `backend/services/communication/utils.ts` SHALL compile only after a `telegram: "Telegram"` entry is added (both are forced by the same enum change — Phase 1 Task 1 follows WhatsApp's Task 1 forced-error workflow).
5. WHEN `dispatchMulti` aggregates results for Telegram THEN Siraj SHALL NOT compute any `sendAttempted`/budget accounting — Telegram has no equivalent of Meta's `portfolioMessagingLimitTier` consumed on failure; `ChannelDispatchResult.sendAttempted` SHALL stay `undefined` for Telegram.

**Priority**: High | **Complexity**: Medium
**Dependencies**: `NotificationChannel.TELEGRAM`, Drizzle enum, Pothos enum, codegen, WhatsApp plan completion (for `dispatch` switch + `notification_deliveries` partial index)

---

### REQ-TG2: Send text messages via Bot API

**User story:** As the notification system, I want to send free-text Telegram messages via the Bot API, so that notifications reach users on Telegram at any time without a template-approval constraint.

#### Acceptance criteria

1. WHEN the adapter sends a message THEN Siraj SHALL `POST` to `https://api.telegram.org/bot<token>/sendMessage` with required `chat_id` and `text` (1-4096 chars), and optional `parse_mode` (one of `HTML`, `MarkdownV2`), `reply_markup` (InlineKeyboardMarkup JSON), `disable_notification`, `protect_content`, and `reply_parameters`.
2. WHEN Telegram returns HTTP 200 with `ok: true` THEN Siraj SHALL persist `providerMessageId` (the returned `message_id`) on the `notification_deliveries` row and set status to `SENT`.
3. IF Telegram returns HTTP 429 THEN Siraj SHALL parse `parameters.retry_after` (seconds) from the JSON **body** (NOT a header — `retry_after` lives inside `parameters` of the response envelope), defer the send via `setTimeout(retry_after * 1000 + 100)`, and SHALL NOT mark the delivery as `FAILED` on the first 429 without a deferred retry (analogous to WhatsApp B2 but driven by `retry_after`). The `retry_after` value SHALL be propagated to a global pause semaphore so concurrent in-flight calls don't extend the cooldown.
4. IF multiple sends target the same `chat_id` within 1 second THEN Siraj SHALL serialize them via a Redis lock `telegram:chat:<chatId>` TTL 1s (per-chat concurrency — Telegram ~1 msg/sec limit per chat). For groups, an additional ~20 msg/min token bucket SHALL apply. A global ~30 msg/sec token bucket SHALL cap all outbound sends.
5. IF Telegram returns a non-2xx error (other than 429) AFTER retries THEN Siraj SHALL update delivery status to `FAILED` with `failureReason` and SHALL use `deliveryFailedMessage("telegram")`.
6. WHEN the adapter runs THEN Siraj SHALL decrypt the bot token **per send call**, cache only the ciphertext on the instance, zeroize the decrypted plaintext bytewise after use, and never hold plaintext on the factory singleton (S4 — equivalent to WhatsApp's per-call token decryption).
7. WHEN `setBotToken` mutation completes THEN Siraj SHALL call `resetTelegramChannel()` to drop the factory singleton so the new token takes effect without a process restart (S4).
8. WHEN builds fan out to N recipients THEN Siraj SHALL cap concurrent Bot API calls at 10 (mirror WhatsApp P1) and use `createManyDeliveries` for bulk delivery-row writes.
9. WHEN the Bot API send is attempted THEN Siraj SHALL use `AbortSignal.timeout(10_000)` on all fetches AND SHALL set an explicit `User-Agent` header (Bun auto-injects `Bun/<version>` which has triggered ISP throttling on sustained Telegram traffic).
10. WHEN the adapter builds the `sendMessage` payload THEN the type SHALL include Bot API 10.x fields: `business_connection_id`, `message_thread_id`, `direct_messages_topic_id`, `receiver_user_id`, `callback_query_id`, `entities`, `link_preview_options`, `protect_content`, `allow_paid_broadcast`, `message_effect_id`, `suggested_post_parameters`, `reply_parameters` (replaces deprecated `reply_to_message_id`). The `parse_mode` field SHALL type as `"HTML" | "MarkdownV2" | "Markdown"` (legacy `Markdown` retained for back-compat — v1 stays on `"HTML"`).

**Priority**: High | **Complexity**: High
**Dependencies**: REQ-TG1, REQ-TG3 (credentials), typed request builders (REQ-TG9)

---

### REQ-TG3: Hybrid credential storage

**User story:** As an administrator, I want global webhook secrets in env-config and per-bot tokens in the database, so that secrets are manageable and rotatable without exposing them in GraphQL responses.

#### Acceptance criteria

1. WHEN reading global Telegram config THEN Siraj SHALL resolve keys from env-config category `telegram`: `TELEGRAM_API_BASE_URL` (plain, default `https://api.telegram.org`), `TELEGRAM_WEBHOOK_BASE_URL` (plain), `TELEGRAM_WEBHOOK_SECRET` (secret; `db_with_mask_only` display), `TELEGRAM_DEFAULT_BOT_ID` (plain; optional default bot id).
2. WHEN storing per-bot credentials THEN Siraj SHALL encrypt `botToken` via the `encryptedText` custom Drizzle type in `telegram_bots.encryptedBotToken` (transparent encrypt/decrypt at the driver boundary — mirrors WhatsApp pattern).
3. IF a GraphQL client queries `TelegramBot` THEN Siraj SHALL never expose the raw token; the `ReturnType` SHALL `Omit<typeof telegramBots.$inferSelect, "encryptedBotToken">`.
4. WHEN an admin updates bot token THEN Siraj SHALL emit an audit log with secrets masked as `***`, encrypt before persist, and call `resetTelegramChannel()` (S4).
5. WHEN the adapter resolves credentials THEN Siraj SHALL decrypt the bot token per send call using `decryptField()` from `field-encryption.ts`; IF the token is already plaintext (legacy/non-encrypted), `decryptField` SHALL fall back to returning it as-is.
6. WHEN `environment.d.ts` is synced THEN Siraj SHALL include all `TELEGRAM_*` env vars in the `NodeJS.ProcessEnv` interface (per the header directive in `env-config-keys.ts`).

**Priority**: High | **Complexity**: Medium
**Dependencies**: `field-encryption.ts`, `encryptedText` custom Drizzle type, env-config registry

---

### REQ-TG4: Telegram bots admin (Bots tab)

**User story:** As an admin with `telegram.config_manage`, I want to register bots, validate tokens via `getMe`, set webhook or polling mode, sync commands via `setMyCommands`, and rotate tokens, so that the channel can send and receive without env edits.

#### Acceptance criteria

1. WHEN admin opens Telegram settings THEN Siraj SHALL show bot cards with `username`, `displayName`, `updateMode` badge (`webhook`/`long_polling`/`disabled`), `isActive` toggle, `lastWebhookAt`, and "Sync from Telegram" / "Edit Token" / "Edit Webhook" / "Set Commands" actions.
2. WHEN admin invokes `syncTelegramBotFromApi` THEN Siraj SHALL call `getMe` to validate the token + fetch bot metadata (`id`, `username`, `first_name`), and persist the returned `id` as `botId` plus update `displayName` and `username`.
3. WHEN admin invokes `setTelegramBotWebhook(botId)` THEN Siraj SHALL:
   - Call `setWebhook({ url: TELEGRAM_WEBHOOK_BASE_URL + "/api/webhooks/telegram", secret_token: per-bot OR global, allowed_updates: bot.allowedUpdates ?? ["message", "callback_query", "my_chat_member"], max_connections: 1 }).` Calling `setWebhook` with a URL implicitly stops `getUpdates` delivery on Telegram's side — no prior `deleteWebhook` is needed when going polling→webhook. Use `drop_pending_updates: true` to avoid replaying stale `/link` commands across the transition.
   - HTTPS webhook URL is mandatory (Telegram refuses HTTP). Ports allowed: **443, 80, 88, 8443** (TLS 1.2+). Optional `ip_address` parameter lets Telegram skip DNS for production reliability.
   - Persist `webhookUrl` + set `updateMode = "webhook"` on the bot row.
4. WHEN admin invokes `deleteTelegramBotWebhook(botId)` THEN Siraj SHALL call `deleteWebhook({ drop_pending_updates: true })` (this is the documented removal path that switches the bot back to `getUpdates` delivery) and set `updateMode = "long_polling"` (or `"disabled"`).
5. WHEN admin invokes `setTelegramBotCommands(botId, commands)` THEN Siraj SHALL call `setMyCommands` with the array of `{ command, description }` objects (name 1–32 chars lowercase `[a-z0-9_]` starting with a letter; description 1–256 chars; max **100** per `{scope, language_code}` pair — NOT 32) and persist the requested commands on the bot row. For v1 register commands 3× at startup — `en`, `ar`, fallback — with `scope: { type: "all_private_chats" }` + per-locale descriptions from `shared/locale/<locale>/telegram.commands`.
6. WHEN admin edits the bot token THEN Siraj SHALL validate permission `TELEGRAM_BOTS_MANAGE`, encrypt the new token via `encryptField()`, persist, audit with `***` masking, and call `resetTelegramChannel()` (S4).
7. IF the bot's webhook URL needs a fixed IP (Telegram optional `ip_address` parameter) THEN Siraj SHALL allow the admin to set it on the bot row.

**Priority**: High | **Complexity**: High
**Dependencies**: REQ-TG3, REQ-TG8 (GraphQL)

---

### REQ-TG5: Webhook receiver (secret-token verification)

**User story:** As the platform, I want to receive Telegram updates securely, so that inbound bot messages and callback queries are processed reliably and not spoofable by third parties.

#### Acceptance criteria

1. WHEN Telegram sends POST to `/api/webhooks/telegram` THEN Siraj SHALL set `export const maxDuration = 30` on the route (Telegram waits up to **60s** for 2xx; return within ~1s). Pre-check `content-length` header → reject >1 MB with 413 before reading body; then `await req.text()` and defensively reject `Buffer.byteLength(raw) > 1_000_000` (byte-accurate; Vercel hard limit is 4.5 MB).
2. WHEN verifying authenticity THEN Siraj SHALL read `req.headers.get('x-telegram-bot-api-secret-token')` (**lowercase** per HTTP/2 conventions) and compare against the per-bot `webhookSecret` (looked up by secret→bot map) OR the global `TELEGRAM_WEBHOOK_SECRET` env-config, using `crypto.timingSafeEqual` over equal-length buffers WITH a length pre-check guard (S5-equivalent). Telegram uses a bearer-style header token, NOT HMAC-over-body — there is no equivalent of Meta's `X-Hub-Signature-256` and we MUST NOT hash the body.
3. IF the secret token header is missing OR mismatches THEN Siraj SHALL return HTTP 401 and SHALL log only `(ip, userAgent, contentLength)` — never the raw body (S2-equivalent). Note: if `secret_token` was omitted on `setWebhook`, Telegram does NOT send the header at all — admin UI MUST force `secret_token` to be required (generate via base64url-without-padding of `crypto.randomBytes(32)`).
4. WHEN the secret token matches THEN Siraj SHALL look up the bot by the secret (the bot that received the update is implicit in the secret); IF the bot is not found AND the secret matches the global, the handler SHALL attempt routing by `message.from.id` → active bot lookup. **BUT FIRST** Siraj SHALL execute a Redis `SETNX telegram:{botId}:seen:<update_id> EX 3600` idempotency guard — if the key already exists (Telegram retry of a previously-processed update), Siraj SHALL respond 200 immediately and skip business logic. This is REQUIRED for multi-replica deployments where an in-process `lastUpdateId` variable would race. Telegram provides no signature/timestamp/nonce, so `update_id` monotonicity + Redis SETNX is the only replay defense.
5. WHEN the POST handler completes verification + Redis SETNX guard THEN Siraj SHALL return HTTP 200 immediately and defer DB work via **`after(async () => …)` from `next/server`** (C3-equivalent — verified available per WhatsApp plan; `queueMicrotask` is forbidden since it is dropped by serverless runtimes). Cap deferred work at ~30s; offload heavy processing to Vercel Queues in v2. **Always return 2xx** even when downstream processing fails — prevents Telegram retry storms and webhook disablement.
6. WHEN the body fails to parse as JSON OR lacks `update_id` THEN Siraj SHALL return 400 and log the structural error (no body content in logs).
7. WHERE inbound `message.text` contains potentially sensitive tokens (deep-link codes, opt-in secrets) THEN Siraj SHALL strip those segments before audit logging — keep the command verb + chat metadata, drop the free-text payload unless audit-flagged for that command.
8. WHEN `updateType` contains a `callback_query` THEN Siraj SHALL call `answerCallbackQuery({ callback_query_id })` FIRST (before any DB work) — Telegram documents ~10s server-side expiry on `callback_query_id`; missing/late call leaves a stuck loading spinner on the user's client and returns `400 query is too old` on the next attempt. Pattern: answer synchronously first (optional transient `text: "Processing..."`), THEN run DB consume transaction, THEN `editMessageText` to show the result.
9. WHEN `update_id` arrives but no bot has processed updates for ≥1 week THEN Siraj SHALL NOT assume strict `previous + 1` sequencing — Telegram picks the next `update_id` randomly after ≥1 week of silence. Persist the last-seen `update_id` per bot for dedup; treat it as strictly-increasing only WITHIN a live stream.

**Priority**: High | **Complexity**: High
**Dependencies**: REQ-TG3 (env-config `TELEGRAM_WEBHOOK_SECRET`), app route `app/api/webhooks/telegram/route.ts`, WhatsApp plan completion (C3 `after()` pattern)

---

### REQ-TG6: Permissions and audit

**User story:** As a security administrator, I want Telegram operations gated by explicit permissions, so that only authorized staff manage bots, sync commands, and rotate secrets.

#### Acceptance criteria

1. WHEN permissions are seeded THEN Siraj SHALL add exactly four permissions via two-phase custom SQL migration (`9a-telegram-permissions-enum.sql` / `9b-telegram-permissions-data.sql`, mirroring WhatsApp `8a`/`8b`): `telegram.view`, `telegram.config_manage`, `telegram.bots_manage`, `telegram.dispatch`.
   - Rationale for `TELEGRAM_DISPATCH`: unlike WhatsApp (which deferred all sends to the notification pipeline), Telegram bot-initiated broadcast is feasible mid-term — include now for forward-compat, leave unused in v1.
2. WHEN `super_admin` group is seeded THEN Siraj SHALL grant all four Telegram permissions.
3. WHEN Telegram bot, env-config, or chat link is mutated THEN Siraj SHALL write audit logs with `AuditEntityType` including `TELEGRAM_BOT` and `TELEGRAM_CHAT_LINK`.
4. WHEN `setTelegramBotCommands` runs THEN the audit entry SHALL include the requested `commands` array in `metadata` (so future template-lifecycle events can reconcile locally).
5. WHEN a chat link is created OR deactivated OR a link code is consumed THEN Siraj SHALL write an audit entry with `actorUserId`, `action: "CREATE" | "UPDATE" | "DELETE"`, `previousValue`, `newValue`.
6. WHEN `syncTelegramBotFromApi` runs THEN the audit entry SHALL include the fetched bot metadata (`id`, `username`, `first_name`) in `metadata`.

**Priority**: High | **Complexity**: Medium
**Dependencies**: existing permission system, `backend/db/migration/` two-phase pattern, `backend/enum/permissions/permission.enum.ts`, `backend/types/audit/audit.types.ts`

---

### REQ-TG7: Internationalization (AR/EN)

**User story:** As an Arabic or English user, I want Telegram settings, bot reply copy, and delivery errors localized, so that the admin UI and bot interactions are understandable in both languages.

#### Acceptance criteria

1. WHEN rendering Telegram admin UI THEN Siraj SHALL use namespace `telegram` in `shared/locale/types`, `en`, and `ar`, registered in `shared/locale/types/message.ts` (added to `Translations`) and assembled in `en/messages.ts` + `ar/messages.ts`.
2. WHEN the bot replies to a command (/start, /help, /link, /unlink, /optin, /optout) THEN Siraj SHALL reply in the user's **Siraj DB `preferredLocale`** (looked up via chat link or link code's `userId`). `from.language_code` (Telegram IETF tag) is used only as a first-contact hint when no Siraj locale is known — normalize via `normalizeTelegramLanguageCode()` (lowercase → split `-` → first segment → fallback). Bot command descriptions registered via `setMyCommands` 3× per locale (`en`, `ar`, fallback) with `scope: { type: "all_private_chats" }`.
3. WHEN Telegram delivery fails THEN Siraj SHALL use keys in the existing `notifications` namespace for channel-specific failure labels (add `telegramChannelLabel`).
4. WHEN i18n strings include Telegram-specific concepts (callback_data, chat_id, deep link) THEN the `TelegramLabels` interface SHALL group keys by section (`shell`, `bots`, `linkCodes`, `optIn`, `commands`, `warnings`, `audit`) following the `labelsBySection` pattern from `frontend/common/views/AGENTS.md` Rule 7.

**Priority**: Medium | **Complexity**: Low
**Dependencies**: existing compile-time TypeScript i18n system in `shared/locale/`

---

### REQ-TG8: GraphQL API for bots + chat links + link codes

**User story:** As the frontend admin UI, I want GraphQL queries and mutations for Telegram bots, chat links, and link codes, so that the Bots tab, Link Codes tab, and Opt-in tab can load and mutate data.

#### Acceptance criteria

1. WHEN defining Pothos objects THEN Siraj SHALL import types from `backend/types/telegram` only (no local Pothos type defs — single canonical object per entity).
2. WHEN exposing bot objects THEN Siraj SHALL always include `id` for Apollo cache normalization.
3. WHEN mutations run THEN Siraj SHALL use `withAuthResult` / `withAuthVoid` and delegate to `TelegramBotService` (bots) / `TelegramLinkService` (links + codes).
4. WHEN `setTelegramBotToken` succeeds THEN the mutation SHALL also call `resetTelegramChannel()` server-side (S4).
5. WHEN generating a link code via `generateTelegramLinkCode(userId, botId?)` mutation THEN Siraj SHALL return `{ code, deepLinkUrl, expiresAt }` so the UI can display a QR code + copyable URL + TTL countdown.
6. WHEN `setTelegramBotWebhook` mutation succeeds THEN the mutation SHALL also call `resetTelegramChannel()` (so the new webhook secret takes effect on the next inbound).

**Priority**: High | **Complexity**: Medium
**Dependencies**: `backend/graphql/pothos/`, `backend/graphql/mutation/`, `backend/graphql/query/`, WhatsApp plan (whatsapp.mutation.ts as pattern reference)

---

### REQ-TG9: Integration tests for every Bot API call

**User story:** As a developer, I want each Bot API method wrapped in a typed builder with a `@live-comm` integration test, so that API contract regressions are caught before production.

#### Acceptance criteria

1. WHEN a new `*.request.ts` builder is added under `bot-api/requests/` THEN a matching `*.integration.test.ts` SHALL exist under `test/integration/communication/`.
   - v1 builder set (request builders REQ-TG9.2 references this exact list):
     - `send-message.request.ts` → POST `/bot<token>/sendMessage`
     - `get-me.request.ts` → GET `/bot<token>/getMe`
     - `set-my-commands.request.ts` → POST `/bot<token>/setMyCommands`
     - `get-my-commands.request.ts` → GET `/bot<token>/getMyCommands`
     - `set-webhook.request.ts` → POST `/bot<token>/setWebhook`
     - `delete-webhook.request.ts` → POST `/bot<token>/deleteWebhook`
     - `get-webhook-info.request.ts` → GET `/bot<token>/getWebhookInfo`
     - `answer-callback-query.request.ts` → POST `/bot<token>/answerCallbackQuery`
     - `get-updates.request.ts` → GET `/bot<token>/getUpdates`
2. WHEN CI runs without `TELEGRAM_BOT_TOKEN`, `TELEGRAM_TEST_CHAT_ID` THEN integration tests SHALL skip (not fail) via `describeLiveWhen(hasKeys, label)`.
3. WHEN `bun run test:live-comm` runs with credentials THEN tests SHALL hit real Bot API for: `sendMessage` (single message to test chat → assert `message_id` returned), `getMe` (assert bot username returned), `setMyCommands` + `getMyCommands` round-trip, `setWebhook` to invalid URL (assert rejection), `getUpdates` with short timeout (assert shape).
4. WHEN `whatsapp-api-call-coverage.test.ts` is updated to be channel-agnostic THEN a parallel `telegram-api-call-coverage.test.ts` SHALL fail if any request builder lacks a paired integration test.
5. WHEN rate-limit integration test runs THEN it SHALL send 2 messages to the same chat within 1 second and assert the **second is deferred via Redis lock** (NOT failed) — analogous to WhatsApp B2.

**Priority**: High | **Complexity**: High
**Dependencies**: WhatsApp integration test pattern (`test/integration/helpers/describe-live.ts`), `@live-comm` script, db-test.infrastructure

---

### REQ-TG10: Per-user opt-in (legal/compliance)

**User story:** As a compliance owner, I want Telegram to default OFF per user until explicit opt-in, so that Siraj never sends unsolicited Telegram messages to users who haven't consented.

#### Acceptance criteria

1. WHEN `notification-payloads.builders.ts` fans out a Telegram payload for a user THEN Siraj SHALL check the per-user channel preference and skip the Telegram payload if `telegramEnabled !== true` (BL1-equivalent).
2. WHEN a user opts in THEN a `telegram_opt_in` audit event SHALL be recorded to the audit log with `userId`, `timestamp`, and `source` (e.g. `bot_command`, `profile_settings`, `admin_override`).
3. WHERE the notification-preferences UI lists channels THEN Telegram SHALL appear with copy explaining that opting in requires linking a Telegram account first (so the user has a `chat_id` to receive at).
4. WHEN `EVENT_CHANNEL_ALLOWLIST` includes `TELEGRAM` for an event THEN the fan-out SHALL still respect the per-user opt-in gate — allowlist is event → channel policy, opt-in is user → channel policy; both must pass.
5. WHEN a user has not linked a Telegram chat_id THEN the opt-in toggle SHALL still be settable (legal opt-in), but no payloads SHALL be produced until a chat link exists (REQ-TG3 chat link requirement stacks with opt-in).

**Priority**: High | **Complexity**: Medium
**Dependencies**: REQ-TG1, REQ-TG13, user notification-preference storage (extend existing schema)

---

### REQ-TG11: Admin Integrations Navigation & Telegram Configuration UX

**User story:** As a SUPER_ADMIN / ACADEMY_ADMIN / STAFF_DEFAULT / SUPERVISOR_DEFAULT with `TELEGRAM_VIEW` permission, I want a dedicated Integrations section in the sidebar with Telegram configuration, so I can manage bots, link codes, and user opt-ins from one place.

#### Acceptance criteria

1. WHEN a user with `TELEGRAM_VIEW` permission logs in THEN the sidebar SHALL show the **Integrations** NavGroup (created by WhatsApp Phase 7) containing **WhatsApp** (if built) AND **Telegram** NavItems linking to `/settings/telegram`.
2. WHEN a user WITHOUT `TELEGRAM_VIEW` permission (including all portal users: teachers, parents, students) logs in THEN the Integrations NavGroup SHALL NOT appear; portal nav overrides (`applyTeacherNavOverrides`, `applyParentNavOverrides`, `applyStudentNavOverrides`) SHALL hide it.
3. WHEN a SUPER_ADMIN logs in THEN they SHALL see the full Integrations group including all bot management actions.
4. The Telegram config page SHALL use the existing tier-isolated pattern: `ResponsiveViewSwitch` with `createLazyView` importing desktop/mobile variants.
5. The Telegram config page SHALL have **three tabs** with independent permission gates:
   - **Bots** — List/sync bots, edit token, set webhook, set commands, toggle update mode. View: `TELEGRAM_VIEW`. Mutate non-secret: `TELEGRAM_CONFIG_MANAGE`. Mutate token: `TELEGRAM_BOTS_MANAGE`. Sync from Telegram: `TELEGRAM_CONFIG_MANAGE`.
   - **Link Codes** — Generate one-time codes for users; view code history (PENDING / CONSUMED / EXPIRED). View: `TELEGRAM_VIEW`. Generate: `TELEGRAM_CONFIG_MANAGE`.
   - **Opt-in Management** — Table of all users (parents, students) with `telegramEnabled` flag, search/filter, bulk toggle. View: `TELEGRAM_VIEW`. Bulk mutate: `SUPER_ADMIN` only. Per-row toggle: `SUPER_ADMIN` only. Audit trail per change.
6. WHEN on Bots tab THEN show bot cards with: username, display name, update mode badge, active toggle, last webhook timestamp, "Sync from Telegram", "Edit Token", "Set Webhook", "Set Commands", "Switch to Polling" menu actions.
7. WHEN on Link Codes tab THEN show a "Generate Link Code" workflow (select a Siraj user → click "Generate" → modal shows code + QR + Deep Link URL + TTL countdown + copy/open buttons); below: a table of codes with `code`, `user`, `status` (PENDING/CONSUMED/EXPIRED), `generatedAt`, `consumedAt`, `consumedBy (telegram username)`, "View" action.
8. WHEN on Opt-in Management tab THEN show paginated table with columns: User (name + role), Telegram status (Linked/Not Linked), Opt-in status (toggle), Last Change, Changed By. Filters: role, opt-in status, search by name. Bulk actions: Enable/Disable selected (SUPER_ADMIN only). Row actions: View audit trail.
9. All tabs SHALL use tier-isolated components: desktop cards / mobile lists, no `useMediaQuery` in tier files.
10. i18n namespace `telegram` SHALL cover all tab labels, column headers, action buttons, warning copy, bot reply templates (`/help` text variants), opt-in consent copy.

**Priority**: High | **Complexity**: High
**Dependencies**: REQ-TG3, REQ-TG4, REQ-TG8, REQ-TG10, WhatsApp Phase 7 (Integrations NavGroup), navigationConfig.ts extension, tier-isolated view components

---

### REQ-TG12: Permission Matrix for Telegram Admin UX

**User story:** As a security administrator, I want a clear permission matrix for every Telegram admin action, so that only authorized roles perform sensitive operations.

#### Acceptance criteria

| Action | Required Permission(s) | Roles Allowed |
|--------|------------------------|---------------|
| View Integrations NavGroup / Telegram NavItem | `TELEGRAM_VIEW` | SUPER_ADMIN, ACADEMY_ADMIN, STAFF_DEFAULT, SUPERVISOR_DEFAULT |
| View Bots tab | `TELEGRAM_VIEW` | Same as above |
| Sync from Telegram (`getMe`) | `TELEGRAM_CONFIG_MANAGE` | SUPER_ADMIN, ACADEMY_ADMIN, STAFF_DEFAULT, SUPERVISOR_DEFAULT |
| Set Webhook / Delete Webhook / Set Commands / Toggle Update Mode | `TELEGRAM_CONFIG_MANAGE` | SUPER_ADMIN, ACADEMY_ADMIN, STAFF_DEFAULT, SUPERVISOR_DEFAULT |
| Create/Edit/Delete Bot | `TELEGRAM_BOTS_MANAGE` | SUPER_ADMIN only |
| Edit Bot Token (rotation) | `TELEGRAM_BOTS_MANAGE` | SUPER_ADMIN only |
| View Link Codes tab | `TELEGRAM_VIEW` | SUPER_ADMIN, ACADEMY_ADMIN, STAFF_DEFAULT, SUPERVISOR_DEFAULT |
| Generate Link Code (admin-side for any user) | `TELEGRAM_CONFIG_MANAGE` | SUPER_ADMIN, ACADEMY_ADMIN, STAFF_DEFAULT, SUPERVISOR_DEFAULT |
| Generate Link Code (self-service in profile) | n/a (any authenticated user for self) | All authenticated users |
| Consume Link Code (in-bot) | n/a (any Telegram user) | External — gated by uniqueness check (REQ-TG13) |
| View Opt-in Management tab | `TELEGRAM_VIEW` | Same as Bots tab |
| Toggle Single User Opt-in | `SUPER_ADMIN` | SUPER_ADMIN only |
| Bulk Toggle Opt-in | `SUPER_ADMIN` | SUPER_ADMIN only |
| View Opt-in Audit Trail | `TELEGRAM_VIEW` | SUPER_ADMIN, ACADEMY_ADMIN, STAFF_DEFAULT, SUPERVISOR_DEFAULT |
| Unlink own Telegram (profile self-service) | n/a (self) | All authenticated users |
| Telegram dispatch (programmatic send-mutation, future) | `TELEGRAM_DISPATCH` | System / service-layer only (v2) |

1. Portal users (Teacher, Parent, Student) SHALL NEVER see the Integrations NavGroup regardless of permissions.
2. `TELEGRAM_DISPATCH` is unused in v1 (no bot-initiated broadcast mutation) — included for forward-compat; super_admin grant for future ease.
3. All mutations modifying secrets (`setTelegramBotToken`) or bulk opt-in SHALL call `resetTelegramChannel()` server-side and emit audit with `changedBy`, `previousValue`, `newValue`.
4. Navigation filtering SHALL use existing `getNavItemsForPermissions()` + `apply*NavOverrides()` pattern — Integrations group filtered by `TELEGRAM_VIEW` OR `WHATSAPP_VIEW` (whichever the user has); portal overrides hide for teacher/parent/student portals.

**Priority**: High | **Complexity**: Medium
**Dependencies**: REQ-TG6, REQ-TG11, navigationConfig.ts, existing permission system

---

### REQ-TG13: Per-user account linking via one-time code (UNIQUE TO TELEGRAM)

**User story:** As a Siraj user, I want to link my Telegram account to my Siraj profile by entering a one-time code into the bot, so that I can receive Telegram notifications — but the linking SHALL be rejected if my Telegram account is already linked to a different Siraj user.

#### Acceptance criteria

1. WHEN an admin (with `TELEGRAM_CONFIG_MANAGE`) OR a user (self-service from their profile "Link Telegram Account" card) requests a link code THEN Siraj SHALL generate a random short code via cryptographically-secure `crypto.randomBytes` (Bun), encoded as **unpadded base64url** (`[A-Za-z0-9_-]` charset — required by Telegram deep-link spec; NO `+` or `=`; target 8–12 chars comfortably under the 64-char deep-link cap), persist it in `telegram_link_codes` with `userId` (the Siraj user being linked), optional `botId` (the bot to receive the code; null = any active bot), `expiresAt = now + 5 minutes` (industry-standard TTL per remnawave, Emre Yilmaz, msgr-authkit), `createdByUserId = the requesting admin OR self`, and SHALL return `{ code, deepLinkUrl: "https://t.me/<bot_username>?start=<code>", expiresAt }`. Defensive `encodeURIComponent` on the code when building the URL. Treat the payload as untrusted user input (validate format + length + charset before lookup at consume time).
2. WHEN the user submits `/start <code>` to the bot THEN Siraj SHALL call `TelegramLinkService.consumeLinkCode(code, telegramUserId, chatId, chatType)` atomically via a single SQL statement to prevent replay/double-claim from parallel Start taps:
   ```sql
   UPDATE telegram_link_codes
     SET consumed_at = NOW(),
         consumed_by_telegram_user_id = $1
   WHERE code = $2
     AND consumed_at IS NULL
     AND expires_at > NOW()
   RETURNING user_id, bot_id;
   ```
   - 2.1 If the UPDATE returns no row → reject with localized `telegramLinkCodeExpired` or `telegramLinkCodeConsumed` error.
   - 2.2 **Uniqueness guard (USER-CONFIRMED CRITICAL REQUIREMENT)** — Query `telegram_chat_links` for `chatId` matching the incoming `telegramUserId` (persistent Telegram user identifier from `update.message.from.id` — 64-bit integer; use `bigint` since the spec warns 32-bit ints are unsafe):
     - IF an active link exists for that `chatId` AND its `userId` matches the code's `userId` → reply "Already linked to your account" (idempotent success, no new row written).
     - IF an active link exists for that `chatId` AND its `userId` is DIFFERENT from the code's `userId` → **REJECT** with localized `telegramAccountAlreadyLinked` error and reply to the chat explaining the Telegram account is bound to another Siraj user. Admin override: SUPER_ADMIN with `TELEGRAM_CONFIG_MANAGE` may invoke the `unlinkTelegramChatLink(chatLinkId)` mutation (REQ-TG21) to manually unlink before the user can proceed.
   - 2.3 IF `code.botId IS NULL` ("any bot") THEN use the bot that received the `/start` command (passed as `botId` argument) for the link target.
   - 2.4 INSERT new row into `telegram_chat_links` with `userId = code.userId`, `botId = resolved botId`, `chatId = incoming telegramUserId`, `chatType`, `linkedByUserId = code.userId`, `linkSource = "bot_start_code"`, `linkedAt = now`, `isActive = true`.
   - 2.5 Emit `telegram_link` audit event with `entityType: TELEGRAM_CHAT_LINK`, `action: CREATE`, `metadata: { userId, botId, chatId, code, source }`.
   - 2.6 Set `users.telegramChatId` (denormalized hot-path column) to the new `chatId` IF this is the user's first (or only) active link.
3. WHEN the consume succeeds THEN the bot SHALL reply with a localized success message in the chat including the user's name: `"Welcome <first_name>, your Telegram account is now linked to your Siraj profile."`.
4. WHEN the consume fails (any reason) THEN the bot SHALL reply with the localized error AND NO database rows SHALL be modified (atomic rollback via `db.transaction`).
5. WHEN a code is consumed OR expires THEN no future `/start <same code>` SHALL succeed — `consumedAt` and `expiresAt` are terminal guards.
6. WHEN an admin views the Link Codes tab THEN Siraj SHALL show codes with status PENDING (not consumed, not expired), CONSUMED (consumedAt != null, shows consumedByTelegramUserId), EXPIRED (now > expiresAt AND consumedAt IS NULL).
7. WHERE the code's `botId` is set AND a user submits the code to a DIFFERENT bot THEN Siraj SHALL reject with `telegramLinkCodeWrongBot` error (the code is bot-bound).
8. WHEN admin or user generates a self-service code from the profile "Link Telegram Account" card THEN the UI SHALL display: (a) the code text, (b) a QR code encoding `deepLinkUrl`, (c) an "Open in Telegram" button linking to `deepLinkUrl`, (d) a "Copy" button, (e) a TTL countdown.

**Priority**: High | **Complexity**: High
**Dependencies**: REQ-TG8 (GraphQL `generateTelegramLinkCode` mutation), REQ-TG5 (webhook receiver), REQ-TG14 (command handler), `telegram_link_codes` + `telegram_chat_links` tables

---

### REQ-TG14: Bot command handling (inbound)

**User story:** As a Telegram user who has started a chat with the bot, I want to interact via bot commands (`/start`, `/help`, `/link`, `/unlink`, `/optin`, `/optout`) and inline buttons (`callback_query`), so that I can self-manage my Siraj integration.

#### Acceptance criteria

1. WHEN the bot receives a `message` update THEN Siraj SHALL parse the command via the `message.entities` array (NOT `text.startsWith("/")` — Telegram pre-tokenizes `bot_command` entities with UTF-16 offsets):
   - Find the first entity with `type === "bot_command"` AND `offset === 0`.
   - `cmdToken = text.substring(0, entity.length)` (JavaScript UTF-16 substring is correct — Telegram entities use UTF-16 code-unit offsets/lengths).
   - `[name] = cmdToken.slice(1).split("@", 1)` — strip leading `/`, split on `@botname` (handles targeted form `/start@MySirajBot code`).
   - `args = text.substring(entity.length).trim()`.
   - Lowercase `name` for routing (case-insensitive). If no `bot_command` entity at offset 0, treat as free-text (criterion 9).
   - Register specific prefix handlers (e.g. `link_`, `order_`) BEFORE the generic `/start` handler so they win the routing race.
2. WHEN the bot receives `/start` (no args OR empty payload) THEN the bot SHALL reply:
   - IF the chat is linked → `"Welcome back, <first_name>. You're already linked."` + tip on `/help`.
   - ELSE → `"Hello! To link your Siraj account, ask your academy admin for a link code, then send '/start <code>' here. Or tap the deep link your admin shared."`. Note: some clients deliver bare `/start` (no payload) on cold reopen — handler must gracefully handle `payload === ""`/`null` as the welcome path, NOT as a linking attempt.
3. WHEN the bot receives `/start <code>` THEN Siraj SHALL execute REQ-TG13 consume-link-code flow and reply success or error. Note: "even if the user has already started the bot" — re-clicking the deep-link Start re-fires the same parameter (NOT first-start-only); the handler is idempotent.
4. WHEN the bot receives `/help` THEN Siraj SHALL reply with a list of registered commands (built dynamically from `setMyCommands` data, localized to user locale if determinable).
5. WHEN the bot receives `/link` THEN Siraj SHALL reply `"Ask your academy admin to generate a link code, then send '/start <code>' here."` (v1 — no inline code generation for non-admin users via the bot; admins use the UI).
6. WHEN the bot receives `/unlink` THEN Siraj SHALL:
   - Find the chat link by `chatId = update.message.from.id`; IF exists AND `userId` matches the requester's Telegram id → call `TelegramLinkService.unlinkUser(userId, botId)` and reply "Your Telegram account is unlinked."
   - ELSE reply "Your Telegram account is not linked to any Siraj user."
7. WHEN the bot receives `/optin` THEN Siraj SHALL call `setUserTelegramOptIn(userId, true, source: "bot_command")` (IF chat linked; ELSE reply with instructions to `/start <code>` first) and reply confirmation.
8. WHEN the bot receives `/optout` THEN Siraj SHALL call `setUserTelegramOptIn(userId, false, source: "bot_command")` and reply confirmation.
9. WHEN the bot receives an unknown command OR free text (not starting with `/`) THEN Siraj SHALL reply with `"Sorry, I only understand commands right now. Try /help."` (v1 acknowledgement; v2 may route to supervisor reply UI).
10. WHEN the bot receives a `callback_query` update THEN Siraj SHALL:
    - Call `answerCallbackQuery({ callback_query_id: query.id })` FIRST (mandatory — ~10s server-side expiry on `callback_query_id`; missing/late call leaves a stuck loading spinner on the user's client and returns `400 query is too old` on the next attempt). Optionally pass a transient `text: "Processing..."`; then run the DB consume transaction; then `editMessageText` to show the result.
    - Parse `callback_data` (≤64 UTF-8 BYTES — not chars; multibyte emoji counts) and validate as untrusted input, then route by namespace opcode prefix:
      - `l:<id>` (`link` opcode) → invoke the same consume-link-code flow as `/start <code>`, looking up the short opaque ID server-side (NEVER pass the raw linking code as `callback_data`).
      - `o:<id>` (`optin` opcode) → toggle opt-in for the linked user.
      - `h:<name>` (`help/menu` opcode) → respond with the named menu's help text.
      - Unknown prefix → audit + edit the message reply markup to remove the unknown button.
    - Handler MUST be idempotent: two quick button taps can arrive out of order and multi-finger taps can spawn parallel queries. Include a serial in `callback_data` if ordering matters. Use the Redis SETNX `update_id` dedup layer (REQ-TG5) to absorb duplicate deliveries.
    - Note: `message` on a CallbackQuery can be an `InaccessibleMessage` (when original message is very old) — don't assume `message.text` or `message.message_id` are usable for editing; for v1 just rely on `chat_instance` / `from.id` / `data`.
11. WHEN the bot receives an `edited_message` OR `channel_post` OR `poll` OR other update type THEN Siraj SHALL audit log only (no user-facing reply, no persistence in v1). These update types are explicitly excluded from the `allowed_updates` whitelist `["message", "callback_query", "my_chat_member"]` so they should not arrive at all in v1 — handler is defensive.
12. WHEN the same `update_id` arrives twice (Telegram retries on non-2xx — at-least-once delivery is the platform default; Telegram retains unconfirmed updates for 24h) THEN Siraj SHALL be idempotent via the Redis SETNX `telegram:{botId}:seen:<update_id> EX 3600` guard at the top of the webhook handler (REQ-TG5.4) — silently skip already-processed updates. Note: `update_id` is unique per-bot's update stream only (NOT globally unique across bots) and may be discontinuous after ≥1 week of silence (next `update_id` chosen randomly) — don't assume strict `previous + 1`.

**Priority**: High | **Complexity**: High
**Dependencies**: REQ-TG5, REQ-TG13, registered command registry pattern, `answer-callback-query.request.ts`

---

### REQ-TG15: Long-polling worker (alternative update mechanism)

**User story:** As an administrator with bots in environments where a public HTTPS webhook is unavailable, I want to receive bot updates via long-polling instead of webhook, so the bot works without a public URL.

#### Acceptance criteria

1. WHEN a bot's `updateMode === "long_polling"` THEN Siraj SHALL run a long-polling worker that iteratively calls `getUpdates({ offset, timeout: 30 (≤50 practical ceiling), allowed_updates: bot.allowedUpdates ?? ["message", "callback_query", "my_chat_member"] })`. Note: Telegram docs explicitly state `timeout=0` is "for testing purposes only" — v1 worker uses `timeout=30` to honour this and allow Telegram to long-poll server-side.
2. WHEN each `getUpdates` call returns THEN Siraj SHALL iterate the `Update[]` (up to 100 per response, `limit` range 1–100), dispatch each to `TelegramWebhookHandler.processUpdate(update, bot)` (same handler path as webhook mode), and advance `offset = last_update_id + 1` to confirm processing on Telegram's side (Telegram deletes confirmed updates on its server queue). `last_update_id` persist occurs AFTER the per-update handler commits and OUTSIDE the handler transaction, in a single short write after the batch's per-update transactions all commit. Rationale: advance-before-handle = message loss on crash; advance-inside-tx = tx commit but response lost = message loss. Crash-recovery window: Telegram retains unconfirmed updates for 24h.
3. WHEN two worker instances attempt to poll the same bot simultaneously THEN Telegram returns HTTP 409 Conflict; Siraj SHALL use a **token-bearing Redis lock** (`SET telegram:polling:lock:<botId> <uuid> NX PX <lockTtlMs>`) with `lockTTL = routeMaxDurationSeconds + 30` (NOT `long_poll_timeout + 30` — the binding constraint is the Vercel function's `maxDuration`, not Telegram's long-poll timeout). For the polling cron route set `export const maxDuration = 60` → `lockTTL = 90s`. Release via a Lua compare-and-delete script on the UUID (so a slow-expired lock isn't released by a different invocation that later acquires it). Single-instance Upstash Redis is sufficient — Redlock (5 independent masters) is overkill. IF the lock is unavailable THEN the worker SHALL silently exit 200 OK (do NOT pile up — Vercel explicitly does not prevent cron overlap, and the Redis lock is the documented prevention).
4. WHEN `getUpdates` returns HTTP 429 with `retry_after` (parsed from `parameters.retry_after` in the JSON body) THEN Siraj SHALL use LINEAR backoff (`retry_after + 0.1` seconds + jitter) — NOT exponential backoff, which is reserved for 409/5xx/timeouts. The `retry_after` value SHALL be propagated to a global pause semaphore so concurrent in-flight calls don't extend the cooldown (grammY recommendation).
5. WHEN `getUpdates` returns HTTP 409 (concurrent polling / webhook still set) THEN Siraj SHALL await 60s, re-fetch `getWebhookInfo` to ensure mode is still polling, and retry IF so. On persistent 409, surface a metric + alert (indicates orphaned process holding the token elsewhere) — do NOT auto-spawn a new poller immediately.
6. WHEN the worker fails to acquire the Redis lock for >5 consecutive cron invocations THEN Siraj SHALL alert via logs (and admin UI status badge shows "polling-unhealthy").
7. WHEN admin invokes `setTelegramBotWebhook(botId)` mutation for a bot currently in `long_polling` THEN Siraj SHALL call `setWebhook(...)` directly (no prior `deleteWebhook` needed — `setWebhook` implicitly stops polling). Use `drop_pending_updates: true` to avoid replaying stale `/link` commands. Then flip `updateMode = "webhook"` on the bot row (next cron tick no-ops by reading the row mode before acquiring the lock).
8. WHEN admin invokes `deleteTelegramBotWebhook(botId)` AND the bot's `updateMode` becomes `long_polling` THEN Siraj SHALL call `deleteWebhook({ drop_pending_updates: true })` (this is the documented removal path that switches back to `getUpdates` delivery) then flip `updateMode = "long_polling"` — the next cron poll picks up.
9. WHEN graceful shutdown or bot deletion THEN the worker SHALL release the Redis lock (Lua compare-and-delete on the UUID) and stop polling.
10. WHERE the project is deployed on Vercel THEN long-polling worker invocations SHALL be triggered by a Cron Job route (`app/api/cron/telegram-polling/route.ts` with `export const maxDuration = 60` and a verified `Authorization: Bearer $CRON_SECRET` header), registered in `vercel.json` as `*/1 * * * *` → `/api/cron/telegram-polling`. Vercel Hobby plan Cron Jobs = once-per-day only → polling mode requires **Pro** (or an external scheduler like QStash schedule / cron-job.org hitting the same endpoint — document in env-config + README). Minimum Pro interval is 1 minute.
11. WHEN the cron route runs THEN Siraj SHALL treat it as a **heartbeat** (not primary ingestion — webhook mode delivers sub-second latency). Only poll bots where `updateMode === "long_polling"` OR webhook-degraded (`getWebhookInfo.pending_update_count > 0` OR `last_error_date` within 5 minutes). For degraded webhook bots, long-poll reconciles missed updates without replacing webhook as the primary path.
12. WHEN the cron route runs for webhook-mode bots THEN Siraj SHALL call `getWebhookInfo` and persist `webhookPendingUpdateCount`, `webhookLastErrorDate`, `webhookLastErrorMessage` on the bot row (REQ-TG22). Recommended pattern for long-poll execution: "cron as trigger, not executor" — cron enqueues a QStash job that performs a single `getUpdates(timeout=30..50)` long-poll inside an extended-duration function, honouring Telegram's "testing purposes only" caveat for `timeout=0`.

**Priority**: High | **Complexity**: High
**Dependencies**: REQ-TG5 (handler), Redis (`@upstash/redis`), separate Bun script invoked by cron for serverless compatibility

---

### REQ-TG16: Per-user self-service link flow (frontend)

**User story:** As a parent or student, I want to link my Telegram account from my profile page, so that I can receive notifications on Telegram without involving an admin.

#### Acceptance criteria

1. WHEN an authenticated user (parent, student, teacher, supervisor) opens their Profile → Notification Preferences THEN Siraj SHALL show a "Link Telegram Account" card (permission-gated; visible to all portal users) showing current link status (linked to `@BotUsername` / not linked).
2. WHEN the user clicks "Link Telegram Account" THEN Siraj SHALL:
   - Open a dialog asking the user to select a bot (dropdown of active bots — there may be a single default, or the academy may publish multiple bots).
   - On "Generate Link Code" click, call `generateTelegramLinkCode(userId, botId)` GraphQL mutation.
   - Display the returned `{ code, deepLinkUrl, expiresAt }` with:
     - A QR code encoding `deepLinkUrl` (use existing QR component if available; otherwise simple text-with-image).
     - An "Open in Telegram" button linking to `deepLinkUrl` (Telegram opens the bot chat with the Start button pre-filled with the code).
     - A "Copy code" button.
     - A live TTL countdown (**5 minutes** from `expiresAt`).
   - Below the QR: poll `pollTelegramLinkStatus(userId)` GraphQL query every **2 seconds** after code generation until status is `CONSUMED` or `EXPIRED` → auto-close dialog with confirmation toast (poll-for-completion pattern — no manual refresh required).
3. WHEN the user is already linked THEN the card SHALL show "Linked to @BotUsername" + an "Unlink" button which calls `unlinkTelegram(userId, botId)` mutation.
4. WHEN the user is not opted in to Telegram THEN the card SHALL explain that opting in requires a verified phone on file AND a linked Telegram account (copy in `telegram` i18n namespace).
5. WHEN the user unlinks THEN the corresponding `telegram_chat_links` row SHALL be deactivated, `users.telegramChatId` SHALL be cleared (unless the user has other active links), and an audit event SHALL be written.
6. WHEN a teacher or supervisor (not just admins) attempts to use the card THEN Siraj SHALL apply the same rules — any authenticated user may link their own Telegram account; portal users do NOT need `TELEGRAM_VIEW` permission for self-service linking.

**Priority**: Medium | **Complexity**: Medium
**Dependencies**: REQ-TG8 (mutations), REQ-TG11 (Integrations NavGroup), REQ-TG13 (linking flow), tier-isolated profile layout

---

### REQ-TG17: `my_chat_member` block/unblock handling (research-confirmed)

**User story:** As the platform, I want to detect when a user blocks or unblocks the bot in a private chat, so that Siraj stops sending to blocked chats and avoids `403 Forbidden: bot was blocked by the user` errors.

#### Acceptance criteria

1. WHEN `allowed_updates` is set on webhook or polling THEN Siraj SHALL explicitly include `"my_chat_member"` alongside `"message"` and `"callback_query"` (do NOT rely on default-include when using a narrow allowlist).
2. WHEN the bot receives `my_chat_member` in a **private chat** with `old_chat_member.status === "member"` and `new_chat_member.status` in `("kicked", "left")` THEN Siraj SHALL deactivate the corresponding `telegram_chat_links` row and clear `users.telegramChatId` if no other active links remain.
3. WHEN `old_chat_member.status` in `("kicked", "left")` and `new_chat_member.status === "member"` (unblock) THEN Siraj SHALL optionally re-activate the chat link OR wait for the user to `/start` again (v1: wait for `/start` — do not silently re-activate opt-in).
4. WHEN a send attempt returns `403` with "bot was blocked by the user" THEN the adapter SHALL deactivate the chat link as a defensive fallback (in case `my_chat_member` was missed).

**Priority**: High | **Complexity**: Medium
**Dependencies**: REQ-TG5, REQ-TG14, `telegram_chat_links` table

---

### REQ-TG18: Update idempotency (`incoming_update` table + Redis SETNX)

**User story:** As the platform, I want at-least-once-safe update processing across multi-replica deployments, so that Telegram webhook retries and cron duplicate invocations never double-process business logic.

#### Acceptance criteria

1. WHEN a webhook POST arrives THEN Siraj SHALL execute `Redis SETNX telegram:{botId}:seen:<update_id> EX 3600` BEFORE any DB writes; if key exists → return 200 and skip business logic.
2. WHEN processing long-polling batches THEN Siraj SHALL insert into `incoming_update(bot_id, update_id)` with `ON CONFLICT DO NOTHING`; only continue handler if insert succeeds.
3. WHEN advancing `lastUpdateId` on the bot row THEN Siraj SHALL use forward-only semantics: `SET lastUpdateId = GREATEST(lastUpdateId, $newUpdateId)` — parallel webhook delivery (default `max_connections=40`; v1 sets `max_connections=1`) and retries can arrive out-of-order. Long-polling: advance AFTER per-update handler commits, OUTSIDE the handler transaction, in a single short write after the batch's per-update transactions all commit.
4. WHEN `update_id` has not been seen for ≥1 week THEN Siraj SHALL NOT assume strict `previous + 1` sequencing (Telegram may choose the next `update_id` randomly after long silence).

**Priority**: High | **Complexity**: Medium
**Dependencies**: REQ-TG5, REQ-TG15, Redis, `telegram_bots` schema

---

### REQ-TG19: Shared Telegram utilities (`escapeTelegramHtml`, `normalizeTelegramLanguageCode`)

**User story:** As a developer, I want shared utilities for HTML escaping and Telegram language-code normalization, so that bot replies and locale routing are consistent across backend and frontend.

#### Acceptance criteria

1. WHEN building templated `sendMessage` text with `parse_mode: "HTML"` THEN Siraj SHALL escape user-supplied content via `escapeTelegramHtml()` in `shared/lib/` (escape only `<`, `>`, `&`).
2. WHEN resolving bot reply locale from `from.language_code` THEN Siraj SHALL normalize via `normalizeTelegramLanguageCode()` in `shared/lib/` (lowercase → split on `-` → first segment → fallback to academy default).
3. WHEN the adapter sends Bot API requests THEN Siraj SHALL set an explicit `User-Agent` header (`Siraj-TelegramBot/1.0 (+https://<domain>)`) — Bun auto-injects `Bun/<version>` which has triggered ISP throttling on sustained Telegram traffic.

**Priority**: Medium | **Complexity**: Low
**Dependencies**: `shared/AGENTS.md`, adapter layer

---

### REQ-TG20: Poll-for-completion link status (frontend)

**User story:** As a user linking Telegram from my profile, I want the UI to automatically detect when I've completed linking in the Telegram app, so I don't have to manually refresh.

#### Acceptance criteria

1. WHEN the profile "Link Telegram Account" dialog displays a generated code THEN Siraj SHALL poll `pollTelegramLinkStatus(userId)` every 2 seconds until status is `CONSUMED` or `EXPIRED` (or dialog is closed).
2. WHEN status transitions to `CONSUMED` THEN the dialog SHALL auto-close with a success toast and the profile card SHALL show "Linked to @BotUsername".
3. WHEN status transitions to `EXPIRED` THEN the dialog SHALL show an expiry message with a "Generate new code" action.

**Priority**: Medium | **Complexity**: Low
**Dependencies**: REQ-TG8 (GraphQL query), REQ-TG13, REQ-TG16

---

### REQ-TG21: Admin override unlink

**User story:** As a SUPER_ADMIN, I want to manually unlink a Telegram account from a Siraj user, so that rare shared-device cases can be resolved without database intervention.

#### Acceptance criteria

1. WHEN a SUPER_ADMIN with `TELEGRAM_CONFIG_MANAGE` invokes `unlinkTelegramChatLink(chatLinkId)` THEN Siraj SHALL deactivate the chat link, clear `users.telegramChatId` if no other active links, and write an audit event with `changedBy`, `previousValue`, `newValue`.
2. WHEN the uniqueness guard blocks a link because the Telegram account is bound to another Siraj user THEN the error message SHALL suggest contacting an admin for manual unlink (REQ-TG13).

**Priority**: Low | **Complexity**: Low
**Dependencies**: REQ-TG6, REQ-TG8, REQ-TG13

---

### REQ-TG22: Webhook health monitoring and operational recovery

**User story:** As an administrator, I want visibility into Telegram webhook delivery health, so that degraded bots are detected and recoverable without silent message loss.

#### Acceptance criteria

1. WHEN the heartbeat cron runs `getWebhookInfo` for webhook-mode bots THEN Siraj SHALL persist `webhookPendingUpdateCount`, `webhookLastErrorDate`, and `webhookLastErrorMessage` on `telegram_bots`.
2. WHEN `webhookPendingUpdateCount > 0` OR `webhookLastErrorDate` is within the last 5 minutes THEN Siraj SHALL surface a degraded status badge in the admin UI and include the bot in the cron heartbeat long-poll reconciliation set (REQ-TG15.11).
3. WHEN an admin invokes `setTelegramBotWebhook(botId, { dropPendingUpdates: true })` after an incident THEN Siraj SHALL re-register the webhook and clear stale pending updates.
4. WHERE v2 heavy processing offload is adopted THEN Siraj MAY publish Updates to a Vercel Queue consumer (`experimentalTriggers: queue/v2beta`) — v1 uses `after()` for light handler work only.

**Priority**: Medium | **Complexity**: Medium
**Dependencies**: REQ-TG4, REQ-TG5, REQ-TG15

---

## UX/Navigation Requirements (MANDATORY)

### New Routes & Role-Based Access

| Route | Purpose | Permission | Roles with Access |
|-------|---------|------------|-------------------|
| `/settings/telegram` | Telegram admin config (3-tab) | `TELEGRAM_VIEW` | SUPER_ADMIN, ACADEMY_ADMIN, STAFF_DEFAULT, SUPERVISOR_DEFAULT |
| `/profile` (existing) — "Link Telegram Account" card | Per-user self-service linking | n/a (any authenticated user for self) | All authenticated users |
| `/api/webhooks/telegram` | Telegram Bot API webhook receiver (no UI) | n/a (Telegram server → token-gated) | External |
| `/api/cron/telegram-polling` | Heartbeat cron — reconciles missed updates for `long_polling` or webhook-degraded bots (no UI) | n/a (cron-secret-gated) | Internal |

### Sidebar Navigation Placement

Telegram appears under the **Integrations** NavGroup (established by WhatsApp Phase 7) in the sidebar:

```
Integrations (grp_integrations)
├── WhatsApp    (href: /settings/whatsapp)  [WHATSAPP_VIEW]
└── Telegram    (href: /settings/telegram)   [TELEGRAM_VIEW]
```

In mobile: appears in the drawer / bottom-nav variants of Integrations group (whichever the WhatsApp Phase 7 established — mirror it).

**Order**: WhatsApp first (the predecessor plan), Telegram second — alphabetical-or-chronological order can be revisited via nav config edit; latest item wins in chronological plans.

### Per-Audience Rendering

| Audience | Prominent Content |
|----------|-------------------|
| Student | None (Integrations nav hidden). Profile → Notification Preferences → "Link Telegram Account" card only. |
| Parent | Same as Student. |
| Teacher | Same as Student — teachers do NOT see Integrations nav (portal override). |
| Supervisor | Same as Teacher for nav. Profile card still available. |
| Admin / Staff | Full `/settings/telegram` admin config; can also self-link as a regular user via Profile card (admins can opt-out of Telegram-gated UIs — they should not be forced to link their own account). |

### Mobile vs Desktop Variants

| Aspect | Desktop | Mobile |
|--------|---------|--------|
| Navigation | Sidebar item under Integrations group | Drawer / bottom-nav variant (mirror WhatsApp Phase 7) |
| Bots tab | Bot cards in a grid (2-3 per row); action menu per card | Stacked card list; action menu per row |
| Link Codes tab | Generate-code modal with QR (large, copy-friendly); table below | Generate-code modal with QR (large enough to scan on another device); list below |
| Opt-in tab | `AppDataGrid` with bulk-select checkboxes | `MobileCardList` with per-card toggle + drawer for bulk actions |
| Profile Link card | Inline card in right rail or below notification preferences | Stacked card in mobile content area |

### Permission Mapping

| Component/Route | Required Permission | Source |
|-----------------|---------------------|--------|
| Integrations NavGroup visibility | Any of `WHATSAPP_VIEW`, `TELEGRAM_VIEW` | `getNavItemsForPermissions()` |
| Telegram NavItem | `TELEGRAM_VIEW` | `navigationConfig.ts` |
| `/settings/telegram` page Server Component | `TELEGRAM_VIEW` | `requirePermissionForPage` |
| `TelegramSettingsContainer` client wrapper | `TELEGRAM_VIEW` | `<RequirePermission>` |
| Bots tab — view | `TELEGRAM_VIEW` | `<RequirePermission>` per tab |
| Bots tab — sync/edit non-secret mutations | `TELEGRAM_CONFIG_MANAGE` | mutation resolver |
| Bots tab — token rotation, bot CRUD | `TELEGRAM_BOTS_MANAGE` | mutation resolver |
| Link Codes tab — view | `TELEGRAM_VIEW` | `<RequirePermission>` |
| Link Codes tab — generate code (for any user) | `TELEGRAM_CONFIG_MANAGE` | mutation resolver |
| Opt-in tab — view | `TELEGRAM_VIEW` | `<RequirePermission>` |
| Opt-in tab — single/bulk toggle | `SUPER_ADMIN` only | mutation resolver (claude level gating) |
| Profile Link Telegram card (self-service) | n/a | any authenticated user |
| `/api/webhooks/telegram` POST | n/a | external (Telegram → secret-token verification) |
| `/api/cron/telegram-polling` | cron-secret | header check |

---

## Non-Functional Requirements

### Performance

- WHEN sending via adapter THEN Siraj SHALL use `AbortSignal.timeout(10_000)` on Bot API `fetch` calls.
- WHEN fanning out to N recipients THEN Siraj SHALL cap concurrent Bot API calls at 10 and use `createManyDeliveries` for bulk delivery-row writes (P1-equivalent).
- WHEN syncing bot metadata OR polling for updates THEN Siraj SHALL respect Bot API rate limits (~30 msgs/sec overall, ~20 msgs/min/group).
- WHEN webhook handler looks up deliveries by `message_id` THEN Siraj SHALL use the partial index on `notification_deliveries(provider_message_id) WHERE provider_message_id IS NOT NULL` (already created by WhatsApp Task 7.4).
- WHEN long-polling worker calls `getUpdates(timeout: 30)` THEN the worker SHALL avoid unnecessary CPU churn (use long-polling timeout, not short-polling).

### Security

- WHEN verifying webhooks THEN Siraj SHALL compare `X-Telegram-Bot-Api-Secret-Token` header via `crypto.timingSafeEqual` over equal-length buffers (NEVER `===` — constant-time comparison required).
- WHEN secret-token mismatch occurs THEN Siraj SHALL log only `(ip, userAgent, contentLength)` — never the body, never the full token (S2-equivalent).
- WHEN receiving inbound `message.text` THEN Siraj SHALL strip deep-link codes / sensitive payloads from audit logs (the `link:<code>` payload is short-lived and tied to user identity — never log raw codes).
- WHEN comparing `secret_token` values from DB THEN Siraj SHALL decrypt the per-bot `webhookSecret` per-request, not cache plaintext on the handler singleton.
- WHEN storing bot tokens THEN Siraj SHALL use AES-256-GCM via `field-encryption.ts` (the `encryptedText` custom Drizzle type).
- WHEN logging audit entries for secrets THEN Siraj SHALL mask values as `***`.
- WHEN admins generate link codes THEN the codes SHALL be cryptographically random (8 chars base32 — 40 bits entropy) AND time-limited (10-minute TTL) AND single-use.
- WHEN link code uniqueness check fails (Telegram user already linked to a different Siraj user) THEN Siraj SHALL NOT leak the linked user's identity to the requester — reply with a generic localized error `telegramAccountAlreadyLinked`.

### Reliability

- WHEN webhook delivery is at-least-once THEN status updates SHALL be upsert by `message_id` (`INSERT … ON CONFLICT DO UPDATE`, P3-equivalent) so out-of-order arrival is safe.
- WHEN status events arrive out of order THEN forward-only state machine (rank map: `sent: 0 → delivered: 1`) SHALL prevent regression. (Telegram has only `sent` and `delivered` for bot messages — no `read`.)
- WHEN deferring webhook work THEN Siraj SHALL use `after()` from `next/server`, never `queueMicrotask` (C3-equivalent).
- WHEN per-chat rate-limiting THEN state SHALL live in Redis (`@upstash/redis`), not an in-memory map (B2-equivalent — shared across process instances).
- WHEN bot `updatedAt` is needed THEN column SHALL use `.$onUpdate(() => new Date())` so repository updates need not set it manually (B4-equivalent).
- WHEN long-polling worker accumulates `offset` THEN Siraj SHALL persist `lastUpdateId` to Redis (`telegram:bot:<id>:lastUpdateId`) so worker restarts resume without reprocessing.
- WHEN link code consume is attempted THEN the entire flow SHALL execute in a single `db.transaction(runner)` so atomic rollback on any failure.

### Usability

- WHERE admin Telegram settings page is shown THEN Siraj SHALL provide desktop and mobile tier-isolated views via `ResponsiveViewSwitch` without `useMediaQuery` in tier files (mirror WhatsApp REQ-11).
- WHERE bot replies are sent THEN Siraj SHALL prefer HTML `parse_mode` for richer formatting (links, bold) and escape user-supplied content via a small HTML-escape helper.

---

## Constraints and assumptions

### Technical constraints

- No new npm dependencies for Telegram SDK; use `fetch`, `libphonenumber-js` (for phone-fallback resolution only), existing `jose`/`crypto` for timingSafeEqual, existing `@upstash/redis` for shared rate-limit + offset + lock state.
- Bot API version: **Bot API 10.2 (July 14, 2026)** per [changelog](https://core.telegram.org/bots/api-changelog).
- Vercel Hobby plan: Cron Jobs = once-per-day only → long-polling mode requires **Pro** (document in env-config + README).
- Drizzle migrations: `db push` for new tables; `bun db migrate` for custom SQL only (permissions enum + data).
- PostgreSQL enum additions: split `9a` (enum only, including `notification_channel ADD VALUE 'TELEGRAM'` and `app_permission ADD VALUE 'telegram.*'`) and `9b` (data — seed rows + super_admin grants), mirroring WhatsApp `8a`/`8b`. `check_safe_enum_use` constraint applies.
- Next.js `after()` verified available per WhatsApp plan.
- Long-polling worker MUST run as a separate Bun script invoked by cron — NOT inline `setInterval` in the Next.js server process (serverless incompatible).

### Business constraints

- Bot token authoring in v1: admins paste tokens obtained from @BotFather in the UI; no in-app token generation.
- Telegram default limit is ~30 msgs/sec overall + ~1 msg/sec per chat + ~20 msgs/min per group — Siraj MUST respect via Redis-backed per-chat lock + 429 retry_after handling.
- Telegram does NOT require per-user opt-in for receiving messages technically, BUT Siraj defaults `telegramEnabled: false` per user until opt-in (REQ-TG10) to mirror WhatsApp's compliance posture and to allow users to fully opt out.
- v1 only ONE default bot is operational at a time per academy (single-bot deployment); multi-bot routing per academy or per audience is v2.

### Assumptions

- Users have valid Telegram accounts reachable via their Telegram username or chat_id.
- Production webhook URL (`TELEGRAM_WEBHOOK_BASE_URL`) is public HTTPS reachable by Telegram (`api.telegram.org`).
- The academy admin has registered a bot with @BotFather and obtained a token + knows the bot username before adding it to Siraj.
- The default bot for self-service link flow is determined via `TELEGRAM_DEFAULT_BOT_ID` env-config OR (if not set) by the first active bot encountered.

---

## Success Criteria

### Definition of done

- [ ] All REQ-TG acceptance criteria satisfied (including REQ-TG13 uniqueness guard)
- [ ] Quality loop (tsgo + biome + lint) passes on all modified files
- [ ] `@live-comm` matrix complete (REQ-TG9) + coverage guard test green
- [ ] `trackable-tasks.md` all phases marked complete
- [ ] GraphQL schema + frontend codegen updated
- [ ] Inbound `message.text` containing deep-link codes is provably not logged anywhere (strip at route — checked via webhook unit test asserting logger receives only sanitized fields)
- [ ] Webhook secret-token rejection returns 401 for mismatched tokens, with logs containing only metadata (S2-equivalent)
- [ ] Per-user opt-in gate blocks sends to opted-out users (REQ-TG10)
- [ ] **Uniqueness guard**: a Telegram user linked to Siraj user A who tries `/start <code>` for Siraj user B gets a rejection (REQ-TG13 acceptance criterion 2.2 verified via unit test)
- [ ] Long-polling worker acquires Redis lock; second concurrent instance detects lock and sleeps (REQ-TG15.3 verified via integration test)
- [ ] Knowledge propagation complete: canonical doc created under `docs/services/telegram-bot-api.md`, AGENTS.md files updated, skills/instructions updated, root AGENTS.md updated

### Acceptance metrics

- Successful `sendMessage` to test chat returns `message_id` and webhook (if any) advances delivery status to `delivered` (no `read` for bots).
- Second send to the same chat within 1 second is deferred via Redis lock, not failed.
- Webhook secret-token rejection returns 401 for tampered header value, with logs containing only `(ip, userAgent, contentLength)`.
- Inbound `message.text` containing a deep-link code produces HTTP 200 with zero PII in logs (code stripped at route).
- `/start <valid_code>` for an unlinked Telegram user → bot replies "Welcome <first_name>, your Telegram account is now linked"; `telegram_chat_links` row exists.
- `/start <valid_code>` for a Telegram user **already linked to a different Siraj user** → bot replies with `telegramAccountAlreadyLinked` error; no DB row created.
- `/start <expired_code>` → bot replies `telegramLinkCodeExpired`; no DB row modified.
- `/optin` (post-link) → `telegramEnabled` flag flips to `true` on the user; subsequent notifications reach that chat.
- Long-polling worker picks up an inbound `/help` command → bot replies with command list → `update_id` advances on next iteration.
- Admin can sync bot metadata from Telegram (`getMe`) and see `username`/`id`/`displayName` updated; audit entry contains the snapshot.
- Multi-instance deployment: only one worker polls each bot (Redis lock acquired by instance A → instance B sleeps).

---

## Glossary

| Term | Definition |
|------|------------|
| Bot API | Telegram's HTTP interface at `https://api.telegram.org/bot<token>/<method>` |
| Update | Inbound event from Telegram (message, edited_message, callback_query, channel_post, etc.) |
| `chat_id` | Telegram chat identifier — integer for users/groups OR `@username` for channels/supergroups |
| Deep link | `https://t.me/<bot_username>?start=<parameter>` — canonical form. `tg://resolve?domain=<bot>&start=<param>` is the correct `tg:` alternative (NOT `tg://msg?to=…`). Parameter: base64url `[A-Za-z0-9_-]`, max 64 chars |
| Secret token | Per-bot or global string passed to `setWebhook`; sent in `X-Telegram-Bot-Api-Secret-Token` HTTP header (1-256 chars, `A-Z a-z 0-9 _ -`) — bearer token, NOT HMAC over body |
| Long polling | `getUpdates` with `timeout` (30-50 recommended; `timeout=0` is testing-only per Telegram docs). Advance `offset` AFTER handler commits |
| 429 retry_after | Inside `parameters.retry_after` in JSON body (seconds) — LINEAR backoff, propagate to global semaphore |
| Inline keyboard | `callback_data` ≤64 **UTF-8 bytes** (not chars). Use opaque opcode tokens (`l:<id>`, `o:<id>`) — never raw linking codes |
| Callback query | MUST call `answerCallbackQuery` FIRST (~10s expiry). Then DB work, then `editMessageText` |
| Link code | Cryptographically random base64url string; TTL **5 minutes**; atomic consume SQL prevents replay |
| `my_chat_member` | Fires on block/unblock in private chats — deactivate chat link on `member→kicked/left` |
| `incoming_update` | Dedup table `(bot_id, update_id) UNIQUE` + Redis SETNX for webhook multi-replica safety |
| `setMyCommands` | Max **100** commands per `{scope, language_code}` pair; command name 1-32 chars `[a-z0-9_]` |
| Uniqueness guard | REJECT a link code consume IF the incoming Telegram account is already linked to a DIFFERENT Siraj user (REQ-TG13). Admin override via `unlinkTelegramChatLink` (REQ-TG21) |
| `after()` | `next/server` API for deferred post-response work; replaces `queueMicrotask` (C3) |
| `@live-comm` | Integration tests gated by env credentials; skipped in CI without secrets |
| Opt-in | Per-user Telegram consent flag; Siraj defaults OFF (REQ-TG10) |
| Tier-isolated | `ResponsiveViewSwitch` + `createLazyView`; no `useMediaQuery` in tier files |
| Default bot | Single operational bot per academy in v1 — `TELEGRAM_DEFAULT_BOT_ID` env-config OR first active bot |

---