# WhatsApp Cloud API Integration Reference

This document consolidates patterns, rules, and gotchas from the WhatsApp Cloud API integration (Tasks 1–29, with knowledge propagation captured by Task 30 per `.ai/plans/whatsapp-plan-fixes/`). It serves as the canonical reference for the **v1 single-number** WhatsApp integration.

> **v2 update (2026-09)**: Multi-number purpose routing, coexistence onboarding, and durable webhook ingest supersede several sections here (the factory is now per-account rather than a lazy singleton, `apiVersion` resolves from `WHATSAPP_GRAPH_API_VERSION`, `stripInboundMessages` was removed, and claim processing is durable). Read **`docs/services/whatsapp-coexistence-multi.md`** alongside this document — it is the canonical reference for v2 behavior. For step-by-step credentials and Meta developer portal onboarding, see **`docs/services/whatsapp-env-setup-guide.md`**.

---

## Architecture Overview

```
MetaCloudApiAdapter → Graph API (send, templates, phone numbers)
WhatsappChannelFactory → lazy singleton + reset (S4)
WhatsappChannel interface → send(), resolveTemplateLanguage()
Webhook route (app/api/webhooks/whatsapp) → GET verify + POST events
Notification dispatch → dispatchWhatsapp branch (dedicated, not shared with email/SMS)
Per-user opt-in → userNotificationPreferences (NotificationChannel.WHATSAPP)
Admin UI → Settings > WhatsApp (3 tabs: Numbers, Templates, Opt-in)
```

## Spec Code Conventions

| Prefix | Domain |
|--------|--------|
| REQ-* | Requirements |
| B1–B6 | Business rules |
| P1–P3 | Performance |
| S1–S5 | Security |
| C1–C3 | Code conventions |
| Q1–Q5 | Quality (`Q6` was reserved but never populated — see this doc's footnote)| R1–R8 | Runtime |
| BL1–BL4 | Backlog (deferred) |

**Q6 footnote:** `Q6` was reserved in earlier drafts for a possible "quality" reviewer comment block but was never populated. All post-review findings map to `Q1–Q5` only — see `.ai/analysis/whatsapp/doc-gaps.md` DG1 and parent `specs.md:406`.

---

## 1. Type System & Enum (Task 1)

- `NotificationChannel` enum (`backend/enum/notifications/notificationDeliveries.enum.ts`) is the **single source of truth** for channel types.
- The redundant `CommunicationChannelType` string union was **removed entirely**. All dispatch code, helpers, and builders reference `NotificationChannel` enum values directly.
- Drizzle `createPgEnumFromEnum` and Pothos `enumType` auto-pick up new enum values — no manual schema edits needed when adding a variant.
- **Gotcha**: Adding `WHATSAPP` to the enum forces errors in frontend `Record<NotificationChannel, ...>` mapped types (`ICON_MAP`, `ACCENT_MAP`, `PAGE_KEYS`, `TAB_LABELS`). These are expected and resolved in downstream tasks.

## 2. Channel Factory & Singleton (Task 3, S4)

- `WhatsappChannelFactory.ts`: lazy singleton with `resetWhatsappChannel()` invalidating 7 env-config cache keys.
- Dynamic import (`await import("./cloud-api/MetaCloudApiAdapter")`) keeps the stub out of the hot path until first use.
- `getWhatsappChannel()` returns memoized promise; `whatsappChannel` facade object wraps `get`/`reset`.
- `resetWhatsappChannel()` drops singleton + invalidates env-config cache for all 7 WhatsApp keys — enables token rotation without restart.
- Validates `WHATSAPP_PROVIDER === "cloud_api"` — `getWhatsappProvider()` throws on unsupported value.

## 3. MetaCloudApiAdapter (Task 5)

### Request Builder Pattern (Pure Functions, Injected Fetch)
- Each `*.request.ts` exports `buildRequest(ctx, input)` → `{ url, init }` (pure, no side effects) and `parseResponse(body)` (pure).
- List endpoints also export `collectAll…(ctx, input, fetchPage)` with cursor pagination (P2). The **`fetchPage` callback is injected** — decouples builder logic from transport, enabling unit testing without HTTP mocks.

### Send Flow
`empty-recipient guard → createDelivery → resolveCredentials → checkPairRateLimit → executeWithConcurrencyLimit → executeSend → fetch with AbortSignal.timeout(10_000) → parse response → updateDeliveryStatus(SENT/FAILED)`

### Rate Limiting (B2 + P1)
- **Pair-rate-limit (B2)**: Redis key `whatsapp:pair:<e164>`, TTL 60s. Before each send, checks last-send timestamp; if `now - last < 6000ms`, defers via `setTimeout` by remaining ms. **Never marks FAILED on guard hit** — only defers. State shared across process instances via Redis (not in-memory).
- On Meta error code `131056` (recipient rate limit): returns `rateLimited: true` without FAILED — caller schedules deferred retry. **Redis fail-open**: if unavailable, logs warning and proceeds without guard.
- **Concurrency cap (P1)**: Simple semaphore — `activeCalls` counter on adapter instance; while `>= 10`, waits 10ms and rechecks; increments before `fetch`, decrements in `finally`.
- All `fetch()` calls use `AbortSignal.timeout(FETCH_TIMEOUT_MS=10_000)`.

### Credential Resolution
- `resolveCredentials()` resolves `WHATSAPP_ACCESS_TOKEN` via env-config (DB-first/env-fallback); calls `decryptField(rawToken)` per send — if plaintext, returns as-is (legacy fallback). **Never holds plaintext token on singleton**.

### Q4 Tier Budget Accounting (`sendAttempted` flag)
- `sendAttempted: boolean` added to `WhatsappSendResult` and propagated through `ChannelDispatchResult`. Adapter sets `true` on **all** paths where a Graph API fetch was actually executed (success, HTTP error, fetch exception — including rate-limited 131056). Sets `false` on empty-recipient guard and credential resolution failure.
- `dispatchMulti` counts `channel === WHATSAPP && sendAttempted === true` and logs `whatsappBudgetConsumed` — captures failed sends that still consumed Meta tier budget.

### Hybrid Credential Storage
- `encryptedAccessToken` / `encryptedTwoStepPin` use the custom `encryptedText` Drizzle type — **auto-encrypts on write, auto-decrypts on read** at the driver boundary via `field-encryption.ts`.
- `ReturnType` types `Omit` the encrypted columns so they never leak to API responses (REQ-8).
- Global webhook secrets (app secret, verify token) stay in env-config, **not** per-account.

## 4. Notification Dispatch Wiring (Task 6)

### Template-Only Sends (B1, v1)
- `WhatsappPayload` has **no free-text `body` field** — only `template: WhatsappTemplateRef` + `components[]`. Free-text sends deferred to v2 (BL4).

### `NOTIFICATION_TEMPLATE_MAP` (B1)
- Per-event template registry maps 5 utility events → `{ templateName, paramsOrder }`:
  - `CLASS_REMINDER` → `class_reminder_utility_v1`
  - `CLASS_ACTIVATED` → `class_activated_utility_v1`
  - `LESSON_REPORT_SUBMITTED` → `lesson_report_submitted_utility_v1`
  - `LESSON_REPORT_REVIEWED` → `lesson_report_reviewed_utility_v1`
  - `INVOICE_GENERATED` → `invoice_generated_utility_v1`
- `buildPerChannel` stamps `metadata.whatsappTemplate` on payloads. **If an event has no entry, the WhatsApp payload is skipped entirely** (no error, just no payload).

### Dedicated `dispatchWhatsapp` Branch (C2)
- WhatsApp has its **own dispatch path** — never routed through email/SMS-shaped `dispatchRecipientChannel`. It extracts `whatsappTemplate` from `payload.metadata`, **fails fast** with `whatsappTemplateMissing` error if absent, constructs `WhatsappPayload`, and maps result to `ChannelDispatchResult`.

### Opt-in Gate Applied Downstream (REQ-10/BL1)
- Builders are pure (no I/O) and **cannot** check per-user `whatsappEnabled`. Opt-in gate applied in `dispatchWithPreferences` → `dispatchForUser` via `NotificationPreferencesRepository.getByUserId()`. Per-user opt-in stored in existing `userNotificationPreferences` table across **all** `NotificationEventType` values (no schema change).

## 5. Database Schema (Task 7)

### `whatsapp_accounts` Table
- `encryptedAccessToken` / `encryptedTwoStepPin` — auto-encrypted via `encryptedText` Drizzle type.
- `portfolioMessagingLimitTier` and `throughputLevel` stored as **`varchar` verbatim** (no PostgreSQL enum, no local mapping). Values: `UNTIERED / TIER_50 / TIER_250 / TIER_1K / TIER_10K / TIER_100K / TIER_UNLIMITED / TIER_NOT_SET` and `STANDARD / COEXISTENCE / HIGH`.
- `.$onUpdate(() => new Date())` — repository never sets `updatedAt` manually.
- `lastWebhookAt` set explicitly by webhook handlers.
- Soft delete via `isActive` boolean (no `deletedAt` column).

### Partial Index (B5)
- `notification_deliveries_provider_message_id_idx` is a **partial index** `WHERE provider_message_id IS NOT NULL` — most deliveries have no provider message ID.

### Two-Phase Custom Migrations for Enum Values
- Split into 8a (enum `ALTER TYPE ... ADD VALUE`) + 8b (data INSERT) to satisfy PostgreSQL's `check_safe_enum_use` constraint.
- Migrations are **idempotent** (`IF NOT EXISTS`, `ON CONFLICT DO UPDATE/NOTHING`) with trigger disable/enable wrapped in `DO $$ ... EXCEPTION` blocks.

### `AppPermission` TS Enum Must Match DB Enum
- Without adding new values to the TypeScript `AppPermission` enum, `bun db push` fails with `invalid input value for enum`. Drizzle-kit's schema-derived enum values must include new ones.

### Permissions (Task 10)
- 3 admin permissions: `WHATSAPP_VIEW`, `WHATSAPP_CONFIG_MANAGE`, `WHATSAPP_TEMPLATES_MANAGE`.
- `WHATSAPP_DISPATCH` **intentionally omitted** — no send-mutation exists in v1.

## 6. Repository Layer (Task 8)

- Namespace pattern: `WhatsappAccountRepository`.
- Data-access only, accepts optional `tx`.
- Reads use `queryDb(tx)` (HTTP-eligible); writes use `db.transaction(runner)`.
- **Gotcha**: `listActive` initially referenced `whatsappAccounts.deletedAt` which doesn't exist — WhatsApp accounts use `isActive` boolean. Fixed to `eq(whatsappAccounts.isActive, true)`.

## 7. Service Layer (Task 9)

- Namespace pattern: `WhatsappAccountService`.
- i18n via typed `tErrors: ErrorsLabels` parameter and `deliveryFailedMessage()` helper.
- `isUserWhatsappOptIn()`: checks if all WHATSAPP channel prefs are enabled.
- `setUserWhatsappOptIn()`: batch-upserts WHATSAPP channel prefs for all event types. Audit uses existing `STATUS_CHANGE` action type with metadata `whatsappEnabled: boolean`.
- **Gotcha**: Internal `failureReason` values (e.g. "empty recipient address") are audit-trail only — never user-facing.

## 8. GraphQL Layer (Task 11)

### Pothos Object Types
- `WhatsappAccountPothosObject` exposes all `WhatsappAccountReturnType` fields. `id` field **always exposed** for Apollo cache normalization.
- Input types split: `WhatsappAccountCreateInputPothosObject` (includes credentials) vs `WhatsappAccountUpdateInputPothosObject` (excludes credentials).
- `WhatsappTemplateSnapshotPothosObject` (BL3): id, name, language, status, category.
- `WhatsappSyncFromMetaResultPothosObject` wrapper for sync results.

### inputType Pattern
- Used **`inputType(string-named)` pattern** instead of `inputRef<BackendType>` to avoid LocalizedString null incompatibility.

### Mutations & Queries
- All mutations use `requireAuth(ctx)` and `ctx.t().errorsTranslations` for i18n.
- **All credential/config mutations call `resetWhatsappChannel()` (S4)** — token rotation takes effect without restart.
- `createWhatsappAccount` cleans LocalizedString nulls; `localDeactivateWhatsappAccount` **locally deactivates** (does not hard-delete, keeps the number on Meta); `syncWhatsappAccountsFromMeta` includes template snapshot.
- Side-effect import barrels: `import "./whatsapp-account.mutation";` (registers resolvers).

## 9. Webhook Handler (Tasks 12–13)

### GET Verification (S1/S5)
- Validates `hub.mode=subscribe`, `hub.verify_token`, `hub.challenge`.
- Per-IP rate limiting via `checkRateLimit()` (S1).
- `hub.verify_token` compared via `crypto.timingSafeEqual` over equal-length buffers (S5).

### POST Events
- Body-size cap (Content-Length + actual, both >1MB → 413).
- `await req.text()` for raw body → HMAC-SHA256 with appSecret, compared with `timingSafeEqual`.
- On HMAC mismatch, logs **only** `(ip, userAgent, contentLength, signaturePrefix)` — never body (S2). 401 on HMAC mismatch, 400 on invalid JSON, 404 on `body.object !== "whatsapp_business_account"`.
- `stripInboundMessages()` removes `value.messages[]` before anything else (S3).
- Returns **200 immediately**, defers handler via `after()` from `next/server` (C3, not `queueMicrotask`).

### Webhook HTTP Status Code Table

| Method | Code | Meaning | When |
|--------|------|---------|------|
| GET | 200 | Returns `hub.challenge` as plain text | `hub.mode=subscribe`, `hub.verify_token` matches (S5) |
| GET | 403 | Verification failed | `hub.verify_token` mismatch, or rate-limit triggered (S1) |
| GET | 429 | Rate-limited | Per-IP rate limit exceeded (S1) |
| POST | 200 | Event accepted, handler deferred | Successful HMAC, valid `body.object`, schema dispatch |
| POST | 401 | HMAC mismatch | `X-Hub-Signature-256` verification fails — logs `(ip, userAgent, contentLength, signaturePrefix)` only (S2) |
| POST | 400 | Invalid JSON | `req.text()` parses to non-JSON body |
| POST | 404 | Not a WABA event | `body.object !== "whatsapp_business_account"` |
| POST | 413 | Body too large | **Both** `Content-Length` header **and** actual `rawBody.length > 1_000_000` bytes (conjunction — D7) |
- Handler processes by `field`. The complete lifecycle-event set (audit-only, R6) and their effects:
  - **`message_template_status_update`** — audit log entry (`entityType: WHATSAPP_ACCOUNT`); no local template persistence in v1.
  - **`template_category_update`** — audit log entry only.
  - **`message_template_quality_update`** — audit log entry only; read `max_daily_conversations_per_business` (Q5).
  - **`message_template_components_update`** — audit log entry only.
  - **`phone_number_quality_update`** — read `max_daily_conversations_per_business` (NOT deprecated `old_limit` / `current_limit`) and update `portfolioMessagingLimitTier` on matching accounts (Q5). Value MUST be the raw Meta enum string verbatim (`UNTIERED / TIER_50 / TIER_250 / TIER_1K / TIER_10K / TIER_100K / TIER_UNLIMITED / TIER_NOT_SET`) — no transformation.
  - **`business_capability_update`** — process `max_phone_numbers_per_business` and messaging limit updates (R6).
  - **Status field** (`value.statuses[]`) — handled via `NotificationRepository.handleDeliveryWebhook()` (see B3 below).

### B3 Forward-Only Status Rank — With Resurrection Edge Case
- `STATUS_RANK = { accepted: 0, sent: 1, delivered: 2, read: 3, failed: -1 }`.
- `shouldApplyTransition()`: `newRank > currentRank OR (currentRank === -1 && newRank > 0)`.
- When standard repo transition fails (e.g. FAILED → DELIVERED), `tryB3Resurrection()` does a direct DB update (intentional exception to the service→repo→DB flow).

### Gotcha: Webhook Can Outrun the Adapter
- Webhook status updates can arrive **before** the adapter creates the delivery row. Handler **silently skips** if delivery not found — a subsequent webhook will update. Never mark FAILED in this case.

## 10. Frontend Patterns (Tasks 22–29)

### Responsive View Pattern
- `WhatsappConfigView.tsx` (common) → `createLazyView` (ssr: false) + `ResponsiveViewSwitch`.
- `activeTab` state managed via `useState` in the switcher — no Zustand store needed (Q2).
- Mobile/desktop loaders: `import("...").then(m => ({ default: m.Component }))`.
- Tab components are NOT lazy-loaded — direct imports in desktop/mobile shell files.

### Three-Tab Structure
- **Numbers**: Account cards with metadata chips, sync button, delete (deactivate).
- **Templates**: Template list with status chips, sync from Meta button.
- **Opt-in**: Toggle switch with consent body text.

### MUI Typography Variants (Custom Theme)
- Valid variants ONLY: `display`, `headlineLg`, `headlineMd`, `titleLg`, `bodyLg`, `bodyMd`, `labelMd`.
- NO `titleMd`, `titleSm`, `bodySm`, `labelLg` — these cause tsgo TS2769 errors.

### GraphQL Fragment Null-Safety
- ALL fields in generated fragments are `string | null` even when schema marks them as `String!`.
- Must use `?? ""` or `?? "—"` for display and widen function parameter types to `string | null`.

### i18n (Task 28)
- Locale files in `shared/locale/{types,en,ar}/whatsapp/` — 82 entries each.
- Server Components: `getTranslations(locale, "whatsapp")` from `@/shared/locale/server`.
- Client Components: `useAppTranslation("whatsapp")` from `@/shared/locale/client`.

---

## Cross-Cutting Gotchas

### `environment.d.ts` Sync Directive
- **MUST** be updated whenever new env keys are added to `ENV_CONFIG_KEYS` (per the header directive). 6 `WHATSAPP_*` declarations added.

### `isSecret` ↔ `displayStrategy` Pairing Rule
- `isSecret: true` must always pair with `displayStrategy: "db_with_mask_only"`.
- `excludeFromDb: true` keys must also be added to `HIDDEN_ENV_CONFIG_KEYS` in `shared/constants/env-config-keys.ts`.

### Env-Config Keys NOT Yet Registered
- `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_API_VERSION` are resolved from env vars only (not yet registered in `env-config-keys.ts`). Resolver falls back to `process.env` for unregistered keys. Per-account credentials come from DB.

### Pair-Rate-Limit Timestamp Set Before Fetch
- Redis key `whatsapp:pair:<e164>` (TTL 60s) timestamp is set in `checkPairRateLimit` **before** the fetch. If fetch fails, the pre-check timestamp remains — preventing immediate retry to the same recipient.

### `messages[]` Stripped Defensively
- Route already strips `value.messages[]` (S3) but the handler also defensively checks/deletes it (belt-and-suspenders).

### Exact Language Code (B6)
- Template `language.code` returned **exactly from Meta** (e.g. `ar`, `en_US`, `ar_AR`) — no hardcoded locale mapping. Adapter resolves send-time language code from the synced template list.

---

## Known Open Issues (from r3 Comprehensive Review)

Tracked in `.ai/finished_plans/whatsapp/r3-comprehensive-review.md`. **Both HIGH findings are FIXED in current code** (verified against the code during the whatsapp2 inventory — `backend/db/repo/notifications/notification.repository.ts` `handleDeliveryWebhook` now runs `SELECT FOR UPDATE` + dual advisory locks inside a rank-guard, and `handleMessagesStatus` passes `userId`/`channel`/`eventType` through, so the upsert path is live; see `.ai/plans/whatsapp2/outcome/inventory-backend.md` §4).

| Severity | Track | File | Issue | Status |
|----------|-------|------|-------|--------|
| HIGH | business-logic | `backend/db/repo/notifications/notification.repository.ts` | TOCTOU race in UPDATE branch | **FIXED** — row lock + advisory locks + rank-guard |
| HIGH | business-logic | `backend/services/whatsapp/whatsapp-webhook.handler.ts` | `handleMessagesStatus` dropped `userId`/`channel`/`eventType`; INSERT upsert path dead | **FIXED** — args plumbed through; v2 additionally uses durable ingest (see `docs/services/whatsapp-coexistence-multi.md`) |

The remaining 21 MEDIUM / LOW findings (schema drift, env-config gaps, dead code, duplication, types) are listed in full in `r3-comprehensive-review.md`. Many were superseded or resolved by the whatsapp2 plan (`.ai/plans/whatsapp2/`).

