# Task 3 Outcome — WhatsApp Channel Interface and Factory (S4)

## Summary

Implemented the WhatsApp channel interface (`IWhatsappChannel`), lazy singleton factory (`WhatsappChannelFactory`) with `resetWhatsappChannel()` (S4), barrel exports (`index.ts`), and a minimal `MetaCloudApiAdapter` stub to satisfy the factory's dynamic import.

**No commits made** — all files are uncommitted per user request.

## Files Created

| File | Purpose |
|------|---------|
| `backend/services/communication/channels/whatsapp/IWhatsappChannel.ts` | Channel interface, payload/result types, template ref types, `WhatsappProvider` type |
| `backend/services/communication/channels/whatsapp/WhatsappChannelFactory.ts` | Lazy singleton factory: `getWhatsappChannel()`, `resetWhatsappChannel()` (S4), `whatsappChannel` facade |
| `backend/services/communication/channels/whatsapp/index.ts` | Barrel exports for types + factory functions |
| `backend/services/communication/channels/whatsapp/cloud-api/MetaCloudApiAdapter.ts` | Minimal stub implementing `IWhatsappChannel` — Task 5 replaces with full Graph API adapter |

## Spec Compliance

### REQ-2 (Template-Only Sends, B1)
- `WhatsappPayload` has **no free-text `body` field** — only `template: WhatsappTemplateRef` + `components: WhatsappTemplateComponent[]`
- Free-text sends are deferred to v2 (BL4)

### S4 (resetWhatsappChannel)
- `resetWhatsappChannel()` drops singleton `instance` + `initializationPromise` so token rotation takes effect without restart
- Invalidates env-config cache for all 6 WhatsApp keys: `WHATSAPP_PROVIDER`, `WHATSAPP_API_VERSION`, `WHATSAPP_BUSINESS_ACCOUNT_ID`, `WHATSAPP_DEFAULT_ACCOUNT_ID`, `WHATSAPP_APP_SECRET`, `WHATSAPP_WEBHOOK_VERIFY_TOKEN`

### Factory Pattern (Mirrors Email/SMS/Push)
- `let instance` + `let initializationPromise` with `??=` lazy assignment
- `getWhatsappChannel()` returns memoized promise
- `whatsappChannel` facade object wraps `get`/`reset` for ergonomic imports
- Validates `WHATSAPP_PROVIDER === "cloud_api"` — warns + falls back otherwise

### MetaCloudApiAdapter Stub
- Implements `IWhatsappChannel` minimally
- `send()` throws "not yet implemented" (Task 5 replaces)
- `validateConfig()` returns `false`
- `disconnect()` is a no-op
- Dynamic import keeps it out of the hot path until Task 5

## Pattern References

- `backend/services/communication/channels/email/EmailChannelFactory.ts` — primary pattern source
- `backend/services/communication/channels/sms/SmsChannelFactory.ts` — secondary pattern source
- `backend/services/communication/channels/push/PushChannelFactory.ts` — tertiary pattern source

## Non-Negotiable Execution Protocol Compliance

| Step | Protocol Requirement | Status |
|------|---------------------|--------|
| 1 | Pre-Execution Outcome Read — read ALL outcome files | ✅ Read `task-1-outcome.md`, `2-outcome.md` |
| 2 | Per-File Quality Verification Loop — tsgo + biome + lint after each edit | ✅ Each file verified individually before moving on |
| 3 | Global Health Check — tsgo + biome + lint globally, zero errors | ✅ All three passed with zero errors/warnings |
| 4 | Post-Execution Outcome File — write outcome doc | ✅ This document |
| 5 | Task Progress Tracking — update checkboxes in trackable-tasks.md | ✅ (to be updated below) |

## AGENTS.md / Instruction Compliance

- **`backend/services/AGENTS.md`**: ✅ Domain-driven service, not monolithic; no user-facing hardcoded strings; types imported from `@/backend/types` and interface file
- **`backend/AGENTS.md`** (via `backend.instructions.md`): ✅ Layer separation, `@/*` path aliases, `logger` from `@/backend/lib/logger` (no `console.*`), no local type definitions in wrong layers
- **`shared/AGENTS.md`**: ✅ No imports from `@/frontend/**`, `@/backend/**`, or `@/app/**` in shared layer (no shared layer files touched)

## Quality Gate Results

| Check | Result |
|-------|--------|
| `bun tsgo` (global) | ✅ Zero errors |
| `bun biome:check` (global) | ✅ Zero errors, zero warnings |
| `bun run lint` (global, via queue) | ✅ Zero errors, zero warnings |

## Carry-Over Knowledge for Task 5

1. **MetaCloudApiAdapter stub location**: `backend/services/communication/channels/whatsapp/cloud-api/MetaCloudApiAdapter.ts` — Task 5 replaces the stub body with full Graph API v23.0 implementation
2. **Stub current behavior**: `send()` throws "not yet implemented", `validateConfig()` returns `false`, `disconnect()` is no-op
3. **Factory dynamic import**: `await import("./cloud-api/MetaCloudApiAdapter")` — the import path is already wired; Task 5 just needs to implement the adapter body
4. **Env config keys to resolve in adapter**: `WHATSAPP_API_VERSION`, `WHATSAPP_BUSINESS_ACCOUNT_ID`, `WHATSAPP_DEFAULT_ACCOUNT_ID` (global config); per-account token/phone-number-id come from DB (decrypted per send call per S4)
5. **WhatsappPayload is template-only** — Task 5 must NOT add a free-text body field (B1 constraint, deferred to v2/BL4)
6. **WhatsappSendResult has `rateLimited: boolean`** — Task 5 adapter must set this flag when Meta API returns HTTP 429 or rate-limit header
7. **Channel interface methods**: `send()`, `validateConfig()`, `disconnect()` — Task 5 must implement all three properly

## Subtask Checklist

- [x] 3.1 — Created `IWhatsappChannel.ts` (interface, payload/result types, provider type)
- [x] 3.2 — Created `WhatsappChannelFactory.ts` (lazy singleton, `resetWhatsappChannel()`, facade)
- [x] 3.3 — Created `index.ts` barrel exports
- [x] 3.4 — Per-file quality loop on all files (tsgo + biome + lint passed)
- [x] 3.5 — AGENTS.md / instruction compliance verified
- [x] 3.6 — Global health check passed (tsgo ✅, biome ✅, lint ✅)
- [x] 3.7 — Outcome doc written, checkboxes updated
