# Research Confirmation Outcome (Pre-Implementation)

## Summary

Six parallel research subagents verified the Telegram integration plan against the latest official Telegram Bot API documentation (Bot API 10.2, July 14 2026) and reputable community sources. A seventh subagent (`f28008cd`) verified webhook deployment on Next.js 16 / Vercel (Fluid Compute, Cron, body-size limits). The structural assumptions of the plan all hold: free-text sends without template approval, secret-token header auth (not HMAC), webhook/long-polling mutual exclusivity, deep-link `?start=<parameter>` flow, 429 + `retry_after` rate-limit semantics, attributed `from.id` identity, and `update_id` idempotency. The plan needs targeted refinements — no major rewrites.

## Verified Foundations (no change needed)

| Claim | Status | Source |
|-------|--------|--------|
| Bot API 10.x latest | ✅ (10.2, July 14 2026) | [api-changelog](https://core.telegram.org/bots/api-changelog) |
| Free-text `sendMessage` (no template approval) | ✅ | [sendmessage](https://core.telegram.org/bots/api#sendmessage) |
| `setWebhook` + webhook/long-polling mutually exclusive | ✅ | [setwebhook](https://core.telegram.org/bots/api#setwebhook) notes #1 |
| No official Node SDK | ✅ | (community SDKs only — grammY, Telegraf, node-telegram-bot-api) |
| `answerCallbackQuery` mandatory for `callback_query` | ✅ | [answercallbackquery](https://core.telegram.org/bots/api#answercallbackquery) + CallbackQuery note |
| Deep-link start param max 64 chars, base64url alphabet | ✅ | [api/links](https://core.telegram.org/api/links) |
| `allowed_updates` whitelisting supports our `["message","callback_query","my_chat_member"]` set | ✅ | [update](https://core.telegram.org/bots/api#update) |
| Telegram user identity = `from.id` (64-bit, persistent across bots) | ✅ | [user](https://core.telegram.org/bots/api#user) |
| Webhook `secret_token` charset `[A-Za-z0-9_-]`, 1–256 chars | ✅ | [setwebhook](https://core.telegram.org/bots/api#setwebhook) |
| Webhook is the production-recommended mode for Vercel serverless | ✅ | grammY + Vercel `@vercel/chat` adapter + community consensus |
| Hybrid per-bot `updateMode` toggle is the right architecture | ✅ | (mirrors `vercel/chat` `mode: "auto"`) |

## Required Plan Corrections (applied to specs / implementation / tasks)

### Correction 1: Bot API version pin

The current plan says "Bot API 10.x". The latest stable is **Bot API 10.2 (July 14, 2026)** per the changelog. Pin references explicitly so SDK/codegen decisions stay grounded.

### Correction 2: Webhook auth is bearer-header, NOT HMAC

Confirmed via `setWebhook` docs: Telegram's ONLY webhook authentication is the `X-Telegram-Bot-Api-Secret-Token` header — there is NO HMAC-over-body (unlike Meta/WhatsApp's `X-Hub-Signature-256`). The plan must:

- Use `crypto.timingSafeEqual` over equal-length buffers (length pre-check the comparison since `timingSafeEqual` would throw on length mismatch — leaking length otherwise)
- If `secret_token` was omitted on `setWebhook`, Telegram does NOT send the header at all — admin UI should force `secret_token` to be required (generate via base64url-without-padding, ≥ 32 bytes entropy)
- Document that there is no replay protection from Telegram themselves — must add `update_id` monotonicity check + Redis SETNX dedup on our side, and optionally allowlist Telegram source IPs `[91.108.4.0/22]` + `[149.154.160.0/20]` at the edge WAF

### Correction 3: Rate limits are UNDOCUMENTED and SOFT — design for observable failure

Only `~30 msg/sec overall` is in the official FAQ; per-chat ~1/sec and group ~20/min are `@BotSupport`-confirmed but NOT in API docs. The plan must:

- Implement two token buckets: per-`chat_id` (~1/sec, burst ≤3) + global (~30/sec). Add a third (~20/min) for group `chat_id`s
- Parse `parameters.retry_after` from the 429 JSON **body** (not a header)
- Use LINEAR backoff = `retry_after` seconds + jitter (NOT exponential — exponential backoff is for 409/5xx/timeouts)
- Propagate `retry_after` to a global pause semaphore so concurrent in-flight calls don't extend the cooldown
- Document the `allow_paid_broadcast=true` escaper hatch (0.1 Stars/msg, requires 100k Stars + 100k MAU — almost certainly out of scope for v1)

### Correction 4: `sendMessage` / `setWebhook` parameter sets updated for Bot API 10.x

Current plan's type definitions are missing newer fields. Add to types:

**`sendMessage`** (from `core.telegram.org/bots/api#sendmessage`, Bot API 10.2):
- `business_connection_id`, `message_thread_id`, `direct_messages_topic_id`, `receiver_user_id`, `callback_query_id`, `entities`, `link_preview_options`, `allow_paid_broadcast`, `message_effect_id`, `suggested_post_parameters`, `reply_parameters` (replaces deprecated `reply_to_message_id`), `protect_content`
- `parse_mode` accepts `"HTML"` | `"MarkdownV2"` | `"Markdown"` (the legacy Markdown is retained for back-compat but deprecated — v1 stays on `"HTML"`)

**`setWebhook`** — add `ip_address` (optional DNS-pin) plus existing `url`, `certificate`, `max_connections` (1-100, default 40), `allowed_updates`, `drop_pending_updates`, `secret_token`

### Correction 5: Mode-switch sequence — `deleteWebhook` NOT required before `setWebhook`

`setWebhook` with a URL explicitly stops `getUpdates` delivery (per docs note #1 on both methods). The plan's task 9.1 says `deleteWebhook first IF long_polling mode` — this is unnecessary. Correct sequence:

- **webhook → polling**: call `deleteWebhook({ drop_pending_updates: <bool> })` then flip `updateMode = "long_polling"`. Wait — actually this IS correct (you must explicitly remove webhook to switch BACK to polling).
- **polling → webhook**: just call `setWebhook(...)` — it implicitly stops polling. No prior `deleteWebhook` needed.
- **BOTH** transitions must use `drop_pending_updates: true` to avoid replaying stale `/link` commands across mode switch

### Correction 6: HTTPS webhook ports restricted to 443, 80, 88, 8443

Telegram refuses webhook URLs on other ports and requires HTTPS (TLS 1.2+). Add this constraint to env-config docs (`TELEGRAM_WEBHOOK_BASE_URL`).

### Correction 7: `answerCallbackQuery` MUST be called FIRST (~10s expiry)

Per the `CallbackQuery` note + community observation: ~10s server-side expiry on `callback_query_id`; if not answered, user sees stuck loading spinner + Telegram returns `400 query is too old` on later attempt. Handler pattern must be:

1. Call `answerCallbackQuery({ callback_query_id })` SYNCHRONOUSLY FIRST with optional transient `text: "Processing..."` 
2. Then perform the slow DB consume transaction
3. Then `editMessageText` to show the result

### Correction 8: Long-polling `timeout=0` is testing-only

Telegram docs explicitly state `timeout=0` (default, "usual short polling") is "for testing purposes only". For production polling, recommend enqueuing a QStash job from the cron route (`<mode> = "cron as trigger, not executor"`) that performs a single `getUpdates(timeout=30..50)` long-poll inside an extended-duration function. If we retain `timeout=0` in-route for simplicity, document the Telegram-side rate-limit friction trade-off.

### Correction 9: Redis lock TTL formula + token-bearing release

The plan's `lockTTL = long_poll_timeout_seconds + 30` is WRONG for a Vercel cron-driven worker. The binding constraint is the Vercel function's `maxDuration`, not Telegram's long-poll timeout. Correct:

```
lockTTL = routeMaxDurationSeconds + 30
```

- Set `export const maxDuration = 60` on the polling cron route
- `lockTTL = 90s` — short enough that a crashed function releases within ~1.5 min, long enough to outlive the function
- Acquire with random UUID value: `SET telegram:polling:lock:<botId> <uuid> NX PX <ttlMs>`
- Release via Lua compare-and-delete script so a slow-expired lock isn't released by a different invocation
- Use single-instance Upstash Redis — Redlock (5 independent masters) is overkill

### Correction 10: Idempotency mandate + offset advance timing

At-least-once is the platform default (Vercel Cron can fire twice; Telegram retains unconfirmed updates for 24h). Mitigations:

- **Webhook mode**: Redis `SET telegram:{botId}:seen:<update_id> NX EX 3600` at the very top of the handler. If already set → return 200 immediately and skip. (Required for multi-replica deployments where in-process `lastUpdateId` would race.)
- **Long-polling mode**: persist `lastUpdateId` on the bot row; load on cold start with `offset = lastUpdateId + 1`. **Advance `lastUpdateId` AFTER per-update handler commits, OUTSIDE the handler transaction**, in a single short write after the batch's per-update transactions all commit. Otherwise: advance before handler → message loss on crash; advance inside handler tx → tx commit but response lost → message loss.
- Add an `incoming_update(bot_id, update_id) UNIQUE` table; insert with `ON CONFLICT DO NOTHING` so a duplicate batch from a race is absorbed.
- Telegram retains unconfirmed updates for **24 hours** — provides crash-recovery window.

### Correction 11: Hobby plan limitation

Vercel Hobby plan Cron Jobs = once-per-day only. Telegram chat polling on Hobby is unusable. Document this in env-config docs and the README — polling requires **Pro** (or an external scheduler like QStash schedule / cron-job.org hitting the same endpoint).

### Correction 12: `User-Agent` header required in Bun fetch

Bun auto-injects `User-Agent: Bun/<version>` which has caused ISP throttling on sustained Telegram traffic. Adapter must explicitly set a custom UA like `Siraj-TelegramBot/1.0 (+https://siraj.example.com)`.

### Correction 13: `parse_mode: "HTML"` confirmed safer than MarkdownV2

MarkdownV2 requires escaping 18 reserved chars across 4 distinct regions (text, inside bold/italic, inside code, inside links) — error-prone. HTML only requires escaping `<`, `>`, `&`. Plan stays on HTML for templated content. Add `escapeTelegramHtml()` util to `shared/lib/`.

### Correction 14: i18n source-of-truth for bot replies

Siraj DB `user.preferredLocale` wins. `from.language_code` (Telegram's IETF tag — unreliable; normalize lowercase → split `-` → first segment → fallback to academy default) is only a first-contact hint. `/start <code>` consume uses the Siraj user's locale (looked up via the link code's `userId`).

Add `normalizeTelegramLanguageCode()` util to `shared/lib/`.

### Correction 15: `setMyCommands` — 100 commands per scope+language pair (NOT 32)

32 is the max command NAME length, not the count. Validation:
- Command name: 1–32 chars, lowercase `[a-z0-9_]`, must start with a letter
- Description: 1–256 chars (≤22 recommended for mobile)
- Max 100 commands per `{scope, language_code}` combination
- `language_code` must be 2-letter ISO 639-1 lowercase (e.g., `en`, `ar`)

For v1: call `setMyCommands` 3× at startup — once per locale (`en`, `ar`, fallback to default) with `scope: { type: "all_private_chats" }` + per-locale descriptions from `shared/locale/<locale>/telegram.commands`. (Note: `all_private_chats` preferred over `default` for the Siraj bot since it doesn't need group menus.)

### Correction 16: Deep-link URL — `tg://msg` is invalid; use `t.me` or `tg://resolve`

The plan's `tg://msg?to=<bot_username>&start=<parameter>` alternative is WRONG. The correct `tg:` form is `tg://resolve?domain=<bot_username>&start=<parameter>`. The `t.me/<bot>?start=<payload>` form has better cross-platform support — use it.

Requirements:
- Charset `[A-Za-z0-9_-]` (base64url — NO `+`, NO `=`)
- Max 64 chars on the parameter (so ≤ 48 raw bytes when base64url-encoded)
- `encodeURIComponent` defensively when building the URL
- Treat the payload as **untrusted user input** — validate format + length + charset before lookup
- Bot receives `message.text === "/start <parameter>"` (single space, no quotes)
- "Even if the user has already started the bot" — re-clicking Start re-fires the same parameter (not first-start-only)
- macOS desktop reliably re-shows the Start button; some iOS clients auto-fire without button press and have a known second-deeplink bug requiring app relaunch — **don't assume "first start only" semantics**
- Cold-reopen edge case: some clients deliver bare `/start` (no payload) on cold reopen — bot handler must gracefully handle `payload === ""`/`null` as the welcome path

### Correction 17: `/start` command parsing — use `entities`, not `text.startsWith("/")`

Telegram already tokenizes commands via `message.entities`. Robust parse:

```ts
const cmdEntity = (message.entities ?? []).find(
  e => e.type === "bot_command" && e.offset === 0
);
if (!cmdEntity) return; // not a command

const cmdToken = message.text!.substring(0, cmdEntity.length); // UTF-16 substring (Telegram entities use UTF-16 offsets)
const [name] = cmdToken.slice(1).split("@", 1); // strip `/`, split on `@botname`
const args = message.text!.substring(cmdEntity.length).trim();
```

This correctly handles `/start@MySirajBot ABC123`, multi-space edge cases, and bypasses regex pitfalls.

### Correction 18: `callback_data` — opaque token, opcode prefix, ≤64 bytes, NEVER the raw linking code

Telegram reserves no prefix but does impose **1-64 UTF-8 bytes** (not chars — a 🎉 emoji = 4 bytes; count bytes). Plan:

- Use namespaced opaque token format: `<opcode>:<shortId>` (opcodes 1-2 lowercase chars — `l:` = link action, `o:` = opt-in toggle, `h:` = help)
- Store payload server-side keyed by short ID; `callback_data` is **never** the raw linking code
- `message` field on `CallbackQuery` can be `InaccessibleMessage` (when original message is very old) — don't assume `message.text` or `message.message_id` are usable for editing; for v1 just rely on `chat_instance` / `from.id` / `data`
- `callback_data` is untrusted user input — validate opcode + shortId format before dispatch
- Two quick taps can arrive out of order; multi-finger taps spawn parallel queries → handler MUST be idempotent (use the Redis SETNX `update_id` dedup)

### Correction 19: Linking-code TTL = 5 minutes (industry standard)

Multiple production references converge on 5 minutes for the login-link TTL (remnawave, Emre Yilmaz Next.js magic link, msgr-authkit `DefaultLoginLinkTTL = 5m`). The plan's current 10 minutes is too long.

Also: 15 minutes is fine for an INTENT/session but 5 minutes is right for the link CODE itself. Persist as `expiresAt = now + 5 minutes` in `telegram_link_codes`.

### Correction 20: Atomic consume SQL — prevent replay / double-claim from parallel taps

Multiple users can tap Start in parallel; the consume MUST be atomic to prevent replay:

```sql
UPDATE telegram_link_codes
  SET consumed_at = NOW(),
      consumed_by_telegram_user_id = $1
WHERE code = $2
  AND consumed_at IS NULL
  AND expires_at > NOW()
RETURNING user_id, bot_id;
```

Returns `null` if already consumed or expired — clean single-statement consume.

### Correction 21: Bot token format + regex validation

Bot tokens match `/^\d{8,10}:[A-Za-z0-9_-]{35}$/` (43-46 chars total). The bot ID portion (before `:`) is public (visible in `getMe`); the 35-char part after `:` is the secret. Validate on settings form input to catch copy errors.

Encryption: AES-256-GCM with 12-byte IV (auth tag → tamper detection). Decrypt per use, zeroize after. Token never expires — proactive rotation hygiene + token rotation ≠ encryption key rotation (independent cadences). Revocation via @BotFather is instant and permanent.

### Correction 22: `max_connections: 1` for v1; in-order delivery

With `max_connections: 1` on `setWebhook`, Telegram guarantees in-order `update_id` delivery over HTTP. The Redis SETNX dedup layer still protects against retries. Scale up to `max_connections: 2-5` only if we observe Telegram-side timeouts.

### Correction 23: `my_chat_member` handler — NEW explicit task

Currently implied but not surfaced as a task. The bot receives `my_chat_member` updates ONLY in private chats when the user blocks/unblocks the bot. Required handler:

- `member` → `kicked` (or `left`): user blocked the bot → deactivate `telegram_chat_links` row for that chat_id, stop sending further messages (avoids `403 Forbidden: bot was blocked by the user` on next send)
- `kicked` → `member`: user unblocked the bot → optionally re-activate chat_link (or wait for next `/start` to re-establish)

This is the ONLY event that fires when a user blocks/unblocks in private chats. Whitelist `["message", "callback_query", "my_chat_member"]` explicitly — `my_chat_member` is in the default-included set but if a narrow allowlist is set, it must be explicit.

### Correction 24: Poll-for-completion pattern in profile Link Telegram card

From remnawave community pattern: after the user taps Start in the Telegram app, the web UI polls a `/deeplink/poll` endpoint (or subscribes via GraphQL subscription) so the card auto-flips to "Linked" without manual refresh. The current plan's "live-refresh (or polling)" wording should be made more concrete — implement a GraphQL `pollTelegramLinkStatus(userId)` query invoked by the profile card every 2 seconds after code generation until CONSUMED or expired.

### Correction 25: Admin-override path for shared Telegram accounts

The uniqueness guard (one Telegram account → at most one Siraj user) is required. But in rare cases (e.g., shared family device), an admin needs to unlink/force-reassign. The plan must explicitly provide an admin mutation `unlinkTelegramChatLink(chatLinkId)` (gated by `TELEGRAM_CONFIG_MANAGE` — SUPER_ADMIN only). Currently the unlink flow exists for the user themselves but not for admin override.

### Correction 26: `update_id` discontinuity after ≥1 week of silence

Per docs: "If there are no new updates for at least a week, then identifier of the next update will be chosen randomly instead of sequentially." Don't rely on `update_id` being strictly `previous + 1` forever — treat as strictly-increasing identifier `within a live stream` and persist the last-seen value for idempotency dedup.

### Correction 27: SDK decision reaffirmed

v1 = no third-party SDK (typed `fetch` builders + `@live-comm` integration tests), mirroring WhatsApp. v2 = grammY 1.45.1 (TS-native, tracks Bot API 10.2, has `auto-retry` plugin handling `retry_after` + Redis-backed rate limiter). Telegraf is in maintenance mode — explicitly exclude as a v2 candidate.

### Correction 28–35: Webhook deployment on Next.js 16 / Vercel (subagent `f28008cd`)

Research source: Telegram webhook docs + Vercel Cron/Functions/Fluid Compute docs (Aug 2026).

| # | Finding | Plan impact |
|---|---------|-------------|
| 28 | Webhook route `export const maxDuration = 30` — Telegram waits up to 60s for 2xx | §3.1, REQ-TG5, task 13 |
| 29 | Body cap: pre-check `content-length`, then `Buffer.byteLength(raw) > 1_000_000` (Vercel hard limit 4.5 MB) | §3.1, REQ-TG5, task 13 |
| 30 | Read `x-telegram-bot-api-secret-token` header lowercase | §3.1, REQ-TG5, task 13 |
| 31 | `lastUpdateId` writeback uses `GREATEST(current, new)` — out-of-order parallel delivery | §3.2, REQ-TG18, task 14 |
| 32 | Cron route is **heartbeat** — only `long_polling` or webhook-degraded bots | §3.4, REQ-TG15.11, task 16 |
| 33 | `vercel.json` cron `*/1 * * * *` → `/api/cron/telegram-polling`; `Authorization: Bearer $CRON_SECRET` | §3.4, REQ-TG15.10, task 16 |
| 34 | Vercel Queues consumer for heavy offload — **v2 scope**; v1 uses `after()` for light work | REQ-TG22.4 |
| 35 | Webhook health columns: `webhookPendingUpdateCount`, `webhookLastErrorDate`, `webhookLastErrorMessage` | §2.1, REQ-TG22, task 7 |

## Files Updated

This outcome documents the research basis. Targeted corrections have been applied to:

- `.ai/plans/telegram/specs.md` — REQ-TG5 (maxDuration, byte-accurate body cap, lowercase header, always-2xx), REQ-TG15 (heartbeat cron, vercel.json, degraded-bot polling), REQ-TG18 (`GREATEST` lastUpdateId), added REQ-TG22 (webhook health monitoring)
- `.ai/plans/telegram/implementation.md` — Phase 3 reconciled (§3.1–3.4), schema health columns, addendum rows 28–35, Common Pitfalls 23–28
- `.ai/plans/telegram/trackable-tasks.md` — tasks 7, 13, 14, 16 updated; REQ-TG22 mapping added

## Carry-Over Knowledge

- These findings supersede earlier assumptions in the lettered TG-tagged design decisions where they conflict (notably TG7 HMAC assumption is replaced — Telegram never used HMAC).
- The plan's structural skeleton (3 tables + `incoming_update`, 9 builders, 4 permissions, webhook+polling hybrid) all hold; the corrections are additive refinements, not architectural pivots.
- All seven research subagent transcripts are archived under `.ai/plans/telegram/_research/` (linked above) for future-executing agents to consult verbatim.
