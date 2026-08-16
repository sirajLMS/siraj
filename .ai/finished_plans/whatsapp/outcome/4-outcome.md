# Task 4 Outcome — Typed Graph API Request Builders (Core v1 Set, REQ-9, Q1)

## Summary

Implemented 4 typed Graph API request builders under `cloud-api/requests/`, plus shared types/helpers in `meta-cloud-api.types.ts`. Each builder exports `buildRequest(ctx)` → `{ url, init }` and `parseResponse(body)`, following the pattern specified in `implementation.md` §1.3. List endpoints (`list-phone-numbers`, `list-message-templates`) also export a `collectAll…` function that follows cursor pagination until `paging.cursors.after` is absent (P2).

**v1 core set only (Q1)**: No register/deregister/request_code/verify_code/create/delete template builders — those operations are performed by admins in WhatsApp Manager.

**No commits made** — all files are uncommitted per user request.

## Files Created

| File | Graph API Endpoint | Purpose |
|------|-------------------|---------|
| `cloud-api/meta-cloud-api.types.ts` | — | Shared types (`GraphApiRequestContext`, `GraphApiRequestInit`, `GraphApiPaginatedResponse<T>`, `GraphApiError`, `MetaErrorBody`) + helpers (`buildGraphUrl`, `buildAuthHeaders`). Default API version `"23.0"`. |
| `cloud-api/requests/send-template-message.request.ts` | POST `/{phone_number_id}/messages` | Builds template message send request. `parseResponse` extracts `providerMessageId` (wamid) + `recipientWaId`. Uses `WhatsappTemplateComponent` from `IWhatsappChannel`. |
| `cloud-api/requests/list-phone-numbers.request.ts` | GET `/{waba_id}/phone_numbers` | Lists WABA phone numbers. `collectAllPhoneNumbers()` follows cursor pagination (P2). Returns `WhatsappPhoneNumber[]` with `display_phone_number`, `quality_rating`, `throughput_level`, etc. |
| `cloud-api/requests/get-phone-number.request.ts` | GET `/{phone_number_id}` | Fetches single phone number detail. Returns `GetPhoneNumberResult` with `portfolio_messaging_limit_tier` **verbatim** (Q5 — no local mapping). |
| `cloud-api/requests/list-message-templates.request.ts` | GET `/{waba_id}/message_templates` | Lists WABA message templates. `collectAllTemplates()` follows cursor pagination (P2). Each template carries `language.code` **exactly** from Meta (B6 — no hardcoded locale mapping). |

## Spec Compliance

### Q1 — Core v1 Set Only
- Built exactly 4 request builders: `send-template-message`, `list-phone-numbers`, `get-phone-number`, `list-message-templates`
- Did NOT build: `register-phone-number`, `deregister-phone-number`, `request-verification-code`, `verify-phone-number`, `create-message-template`, `delete-message-template`, `send-text-message` (subtask 4.6 explicit exclusion)

### P2 — Cursor Pagination Until Exhausted
- `list-phone-numbers.request.ts`: `collectAllPhoneNumbers()` loops `buildRequest → fetchPage → parseResponse` following `paging.cursors.after` until cursor is `undefined`
- `list-message-templates.request.ts`: `collectAllTemplates()` follows the same pattern
- Both use injected `fetchPage` callback for purity and testability

### Q5 — Raw Tier Enum Verbatim
- `get-phone-number.request.ts` returns `portfolio_messaging_limit_tier` as-is from Meta's response
- `parseResponse` is an identity passthrough — no transformation, no mapping
- Values: `UNTIERED / TIER_50 / TIER_250 / TIER_1K / TIER_10K / TIER_100K / TIER_UNLIMITED / TIER_NOT_SET`

### B6 — Exact Language Code
- `list-message-templates.request.ts` returns each template's `language.code` exactly from Meta's payload (e.g. `ar`, `en_US`, `ar_AR`)
- No hardcoded locale mapping in the builder — the adapter resolves send-time `language.code` from the synced template list

### B1 — Template-Only (v1)
- `send-template-message.request.ts` only supports `type: "template"` — no free-text body field
- Uses `WhatsappTemplateComponent` from `IWhatsappChannel` for template variable bindings

### REQ-9 — Integration Test Coverage (Preparation)
- Each builder exports `buildRequest` + `parseResponse` (and `collectAll…` for list endpoints) for easy integration test pairing
- Task 5 adapter will wire these to real `fetch` calls; `@live-comm` integration tests (Task 5+) will use the same exports

## Design Decisions

### Builder Pattern
- `buildRequest(ctx, input)` → `{ url, init }` — pure, no side effects, no `fetch`
- `parseResponse(body)` — pure, extracts typed result from raw JSON
- List builders also export `collectAll…(ctx, input, fetchPage)` — the injected `fetchPage` keeps builders pure and testable without requiring real HTTP

### `fetchPage` Injection
- Rather than builders calling `fetch` directly, `collectAll…` functions accept a `fetchPage` callback
- The adapter (Task 5) supplies this callback with `AbortSignal.timeout(10_000)` and token decryption
- This decouples builder logic from transport concerns, enabling unit testing without HTTP mocks

### Import Paths
- All imports use `@/` path alias (AGENTS.md requirement)
- No relative `./` or `../` imports

## Non-Negotiable Execution Protocol Compliance

| Step | Protocol Requirement | Status |
|------|---------------------|--------|
| 1 | Pre-Execution Outcome Read — read ALL outcome files | ✅ Read `task-1-outcome.md`, `2-outcome.md`, `3-outcome.md` |
| 2 | Per-File Quality Verification Loop — tsgo + biome + lint after each edit | ✅ Each file verified individually; biome auto-fixed formatting; lint caught relative import errors (fixed) |
| 3 | Global Health Check — tsgo + biome + lint globally, zero errors | ✅ All three passed with zero errors/warnings |
| 4 | Post-Execution Outcome File — write outcome doc | ✅ This document |
| 5 | Task Progress Tracking — update checkboxes in trackable-tasks.md | ✅ (updated below) |

## AGENTS.md / Instruction Compliance

- **`backend/services/AGENTS.md`**: ✅ Domain-driven service file naming, no user-facing hardcoded strings, types imported from interface file
- **`backend/AGENTS.md`** (via `backend.instructions.md`): ✅ Layer separation, `@/*` path aliases (lint caught and fixed relative imports), no `console.*` (no logging in builders — pure functions), no local type definitions in wrong layers
- **`shared/AGENTS.md`**: ✅ No shared layer files touched

## Quality Gate Results

| Check | Result |
|-------|--------|
| `bun tsgo` (global) | ✅ Zero errors |
| `bun biome:check` (global) | ✅ Zero errors, zero warnings |
| `bun run lint` (global, via queue) | ✅ Zero errors, zero warnings |

Per-file results:
| File | tsgo | biome | lint |
|------|------|-------|------|
| `meta-cloud-api.types.ts` | ✅ | ✅ | ✅ |
| `send-template-message.request.ts` | ✅ | ✅ | ✅ |
| `list-phone-numbers.request.ts` | ✅ | ✅ | ✅ |
| `get-phone-number.request.ts` | ✅ | ✅ | ✅ |
| `list-message-templates.request.ts` | ✅ | ✅ | ✅ |

## Carry-Over Knowledge for Task 5

1. **Request builder exports**: Each `*.request.ts` exports `buildRequest(ctx, input)` → `{ url, init }` and `parseResponse(body)`. List endpoints also export `collectAll…(ctx, input, fetchPage)`. Task 5 adapter calls these to build and execute fetches.
2. **`GraphApiRequestContext`**: `{ accessToken, apiVersion? }` — adapter must resolve `accessToken` (decrypted per send, S4) and `apiVersion` (from `WHATSAPP_API_VERSION` env-config key, defaults to `"23.0"`) before calling `buildRequest`.
3. **`fetchPage` callback**: List endpoints' `collectAll…` functions accept a `fetchPage: (request: GraphApiRequestInit) => Promise<…ResponseBody>` callback. Adapter supplies this with `AbortSignal.timeout(10_000)` on the `fetch`.
4. **`send-template-message` input**: `SendTemplateMessageInput` = `{ phoneNumberId, to, templateName, languageCode, components? }`. Adapter resolves `phoneNumberId` from DB account record, `languageCode` from synced template list (B6).
5. **`list-phone-numbers` input**: `ListPhoneNumbersInput` = `{ wabaId }`. Adapter resolves `wabaId` from `WHATSAPP_WABA_ID` env-config key or DB.
6. **`get-phone-number` input**: `GetPhoneNumberInput` = `{ phoneNumberId }`. Returns `GetPhoneNumberResult` with raw `portfolio_messaging_limit_tier` (Q5 — store verbatim, no conversion).
7. **`list-message-templates` input**: `ListMessageTemplatesInput` = `{ wabaId }`. Returns `WhatsappMessageTemplate[]` with exact `language.code` (B6 — use this for send-time `template.language.code`).
8. **Pagination helper**: `collectAllPhoneNumbers` and `collectAllTemplates` already handle cursor following (P2). Adapter just calls them with a `fetchPage` callback — no manual cursor loop needed.
9. **Pair-rate-limit (B2)**: Adapter must enforce 6s pair-rate-limit per E.164 recipient BEFORE calling `send-template-message.request.ts`'s `buildRequest`. The builder itself is agnostic to rate limiting.
10. **No `send-text-message.request.ts`**: Q1 excludes free-text sends from v1. If v2 adds free-text (BL4), create a separate `send-text-message.request.ts` builder.
11. **Error handling**: `parseResponse` functions throw on unexpected shapes (e.g. missing `messages[0].id`). Adapter should wrap these in `GraphApiError` when the HTTP status is non-2xx.

## Subtask Checklist

- [x] 4.1 — Created `meta-cloud-api.types.ts` + `buildGraphUrl` + `buildAuthHeaders` helpers
- [x] 4.2 — Created `send-template-message.request.ts` (POST `/{phone_number_id}/messages`)
- [x] 4.3 — Created `list-phone-numbers.request.ts` (GET `/{waba_id}/phone_numbers` with cursor pagination, P2)
- [x] 4.4 — Created `get-phone-number.request.ts` (GET `/{phone_number_id}` with raw tier enum, Q5)
- [x] 4.5 — Created `list-message-templates.request.ts` (GET `/{waba_id}/message_templates` with pagination + exact `language.code`, B6)
- [x] 4.6 — Did NOT create register/deregister/request_code/verify_code/create/delete template builders (Q1)
- [x] 4.7 — Per-file quality loop on all 5 files (tsgo ✅, biome ✅, lint ✅)
- [x] 4.8 — AGENTS.md / instruction compliance verified
- [x] 4.9 — Global health check passed (tsgo ✅, biome ✅, lint ✅)
- [x] 4.10 — Outcome doc written, checkboxes updated
