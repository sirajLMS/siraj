# Types Consolidation: Moving `.types.ts` to `backend/types/`

## Overview

All `.types.ts` files MUST live in `backend/types/`. Service-layer files must not define or re-export types — they import from `@/backend/types` instead. This document describes the migration pattern, rules, and the completed rollout.

## Rules

### 1. Types-only in the types module

`backend/types/` is the single home for all TypeScript type definitions (interfaces, type aliases, Zod schemas used purely for validation typing). Service-layer `.types.ts` files are prohibited.

### 2. Split runtime code out

If a service file contains both types and runtime code (functions, classes, constants, Zod schemas used at runtime), split it:
- **Types** (interfaces, type aliases) → `backend/types/<domain>/<entity>.types.ts`
- **Runtime** (functions, classes, const values, Zod schemas) → stays in the service layer with a non-`.types` filename (e.g., `.helpers.ts`, `.constants.ts`)

### 3. Barrel conventions

`backend/types/**/index.ts` barrels MUST:
- Use `./` relative paths (not `@/` path aliases)
- Use `export * from "./..."` (wildcard re-exports, not explicit per-export `export type { ... }`)
- No `../` or `./../` (no parent traversal)
- No more than one `/` in any export path segment

### 4. Shortest import path

Consumers import from the highest available barrel: `@/backend/types` (not `@/backend/types/fx/fixer.types` or a service-layer path).

## Migration Pattern

1. **Create** the new `.types.ts` file in `backend/types/<domain>/` containing only type definitions.
2. **Create** a runtime helper file (`.helpers.ts` or `.constants.ts`) in the service layer for any runtime code (Zod schemas, const values, functions, classes).
3. **Create/update** the `index.ts` barrel in the new `backend/types/<domain>/` directory.
4. **Update** the root `backend/types/index.ts` to re-export the new domain directory.
5. **Delete** the old service-layer `.types.ts` file.
6. **Update** the provider `index.ts` to remove the `.types` re-export and add the `.helpers` re-export if applicable.
7. **Update** all consumers: types from `@/backend/types`, runtime from the service-layer barrel or `.helpers` file.

## Completed Rollout

| Source (deleted) | Types → `backend/types/` | Runtime → service layer |
|---|---|---|
| `backend/db/db.types.ts` | `backend/types/db.types.ts` (`DBTransaction`, `DBQueryExecutor`) | None |
| `backend/services/fx/providers/fixer/fixer.types.ts` | `backend/types/fx/fixer.types.ts` (`FixerLatestResponse`) | `fixer.helpers.ts` (`fixerResponseSchema`) |
| `backend/services/fx/providers/openexchangerates/openexchangerates.types.ts` | `backend/types/fx/openexchangerates.types.ts` (`OpenExchangeRatesResponse`) | None |
| `backend/services/communication/channels/email/resend/resend.types.ts` | `backend/types/communication/resend.types.ts` | None |
| `backend/services/communication/channels/push/fcm/fcm.types.ts` | `backend/types/communication/fcm.types.ts` (interfaces) | `fcm.helpers.ts` (`FCM_TOKEN_EXPIRED_ERROR`, `FCM_INVALID_TOKEN_ERROR`) |
| `backend/services/communication/channels/sms/twilio/twilio.types.ts` | `backend/types/communication/twilio.types.ts` | None |
| `backend/services/communication/channels/whatsapp/cloud-api/meta-cloud-api.types.ts` | (types already in `backend/types/whatsapp/`) | `meta-cloud-api.helpers.ts` (`buildGraphUrl`, `buildAuthHeaders`, `GraphApiError`, `extractMetaErrorCode`, `extractMetaErrorMessage`) |
| `backend/services/meeting/channels/google-meet/google-meet.types.ts` | `backend/types/meeting/channels/google-meet.types.ts` | None |
| `backend/services/meeting/channels/microsoft-teams/microsoft-teams.types.ts` | `backend/types/meeting/channels/microsoft-teams.types.ts` | None |
| `backend/services/meeting/channels/zoom/zoom.types.ts` | `backend/types/meeting/channels/zoom.types.ts` | None |

### New barrel files created

- `backend/types/fx/index.ts`
- `backend/types/communication/index.ts`
- `backend/types/meeting/channels/index.ts`

### Barrel files updated

- `backend/types/index.ts` — added `./fx`, `./db.types`; changed `./communication.types` → `./communication` (dir)
- `backend/types/meeting/index.ts` — converted from `@/` + explicit `export type { ... }` to `./` + `export * from "./..."`; added `./channels`
- `backend/db/index.ts` — removed `export * from "./db.types"` (moved to `backend/types/`)
