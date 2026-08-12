# Move `.types.ts` Files to `backend/types/` Module

## Goal

Move all `.types.ts` files that live outside `backend/types/` into the `backend/types/` module. After moving, **no re-export shims** remain in the original locations — all consumers import directly from `@/backend/types` (the shortest allowed import path). Files containing runtime code (not just types) are split: types move to `backend/types/`, runtime code stays in the service layer in a new non-`.types` file.

Additionally, normalize all `backend/types/**/index.ts` barrel files to:
- Use `./` relative paths (not `@/` path aliases)
- Use `export * from "./..."` (wildcard re-exports, not explicit per-export `export type { ... }`)
- No `../` or `./../` (no parent traversal)
- No more than one `/` in any export/import path segment

## Decisions (confirmed with user)

1. **`backend/db/db.types.ts`** — MOVE to `backend/types/`. It has ~180 consumers; all updated to import from `@/backend/types`.
2. **`meta-cloud-api.types.ts`** — SPLIT. Types are already in `backend/types/whatsapp/whatsapp-cloud-api.types.ts`. The service file's type re-export shim is removed. Runtime code (`buildGraphUrl`, `buildAuthHeaders`, `GraphApiError`, `extractMetaErrorCode`, `extractMetaErrorMessage`) moves to a new `meta-cloud-api.helpers.ts` in the service layer. The `.types.ts` file is deleted.
3. **Target directory structure** — Domain subdirs mirroring the service layout:
   - `backend/types/fx/` — `fixer.types.ts`, `openexchangerates.types.ts`
   - `backend/types/communication/` — `resend.types.ts`, `fcm.types.ts`, `twilio.types.ts` + existing `communication.types.ts` moved in
   - `backend/types/meeting/channels/` — `google-meet.types.ts`, `microsoft-teams.types.ts`, `zoom.types.ts`
4. **No re-export shims** — After moving, the original `.types.ts` files are deleted. Provider `index.ts` files that currently `export * from "./xxx.types"` have those lines removed. Consumers import from `@/backend/types` only.
5. **`backend/types/meeting/index.ts`** — Convert from `@/` + explicit `export type { ... }` to `./` + `export * from "./..."`. Add `export * from "./channels"` for the new channels subdir.

## Files to Move (10 total)

| # | Source | Target | Type-only? | Consumers |
|---|--------|--------|-----------|-----------|
| 1 | `backend/db/db.types.ts` | `backend/types/db.types.ts` | Yes | ~180 |
| 2 | `backend/services/communication/channels/email/resend/resend.types.ts` | `backend/types/communication/resend.types.ts` | Yes | 2 |
| 3 | `backend/services/communication/channels/push/fcm/fcm.types.ts` | `backend/types/communication/fcm.types.ts` | Yes | 1 |
| 4 | `backend/services/communication/channels/sms/twilio/twilio.types.ts` | `backend/types/communication/twilio.types.ts` | Yes | 1 |
| 5 | `backend/services/communication/channels/whatsapp/cloud-api/meta-cloud-api.types.ts` | **SPLIT** (see below) | No (runtime) | 15 |
| 6 | `backend/services/fx/providers/fixer/fixer.types.ts` | `backend/types/fx/fixer.types.ts` | Yes | 1 |
| 7 | `backend/services/fx/providers/openexchangerates/openexchangerates.types.ts` | `backend/types/fx/openexchangerates.types.ts` | Yes | 1 |
| 8 | `backend/services/meeting/channels/google-meet/google-meet.types.ts` | `backend/types/meeting/channels/google-meet.types.ts` | Yes | 1 |
| 9 | `backend/services/meeting/channels/microsoft-teams/microsoft-teams.types.ts` | `backend/types/meeting/channels/microsoft-teams.types.ts` | Yes | 1 |
| 10 | `backend/services/meeting/channels/zoom/zoom.types.ts` | `backend/types/meeting/channels/zoom.types.ts` | Yes | 1 |

### Special case: `meta-cloud-api.types.ts` (file #5)

This file is NOT pure types. It contains:
- **Types** (re-export shim, lines 23-27): `GraphApiPaginatedResponse`, `GraphApiRequestContext`, `GraphApiRequestInit` — already canonical in `backend/types/whatsapp/whatsapp-cloud-api.types.ts`
- **Runtime** (lines 30-202): `buildGraphUrl`, `buildAuthHeaders`, `GraphApiError` class, `extractMetaErrorCode`, `extractMetaErrorMessage`, plus private helpers `extractMetaErrorFields` and `MetaErrorFields` interface

**Action:**
- Create `backend/services/communication/channels/whatsapp/cloud-api/meta-cloud-api.helpers.ts` containing ALL the runtime code (functions, class, private helpers)
- Delete `backend/services/communication/channels/whatsapp/cloud-api/meta-cloud-api.types.ts`
- The types are already in `backend/types/whatsapp/whatsapp-cloud-api.types.ts` — no move needed for types
- Update the 15 consumers: types from `@/backend/types`, runtime helpers from the new `meta-cloud-api.helpers.ts` (or the cloud-api `index.ts` barrel)

## New `index.ts` Files to Create

### `backend/types/fx/index.ts`
```ts
export * from "./fixer.types";
export * from "./openexchangerates.types";
```

### `backend/types/communication/index.ts`
```ts
export * from "./communication.types";
export * from "./fcm.types";
export * from "./resend.types";
export * from "./twilio.types";
```

### `backend/types/meeting/channels/index.ts`
```ts
export * from "./google-meet.types";
export * from "./microsoft-teams.types";
export * from "./zoom.types";
```

## `index.ts` Files to Update

### `backend/types/index.ts` (root barrel)
- Add: `export * from "./fx";`
- Change: `export * from "./communication.types";` → `export * from "./communication";` (dir instead of file)
- Add: `export * from "./db.types";` (for moved db.types)

### `backend/types/meeting/index.ts`
- Convert ALL entries from `export type { ... } from "@/backend/types/meeting/..."` → `export * from "./..."`
- Add: `export * from "./channels";`
- Final content:
```ts
export * from "./channels";
export * from "./class-meeting-config.types";
export * from "./meeting-config-base.types";
export * from "./meeting-config.types";
export * from "./meeting-integrations.types";
export * from "./meeting-provider-token.types";
export * from "./meeting-provider.types";
```
- **Verified**: no export name collisions across these files (checked all export names)

### Provider `index.ts` files — remove `.types` re-exports
- `backend/services/communication/channels/email/resend/index.ts` — remove `export type { ... } from "./resend.types"`
- `backend/services/communication/channels/push/fcm/index.ts` — remove both `export * from "./fcm.types"` lines (duplicate)
- `backend/services/communication/channels/sms/twilio/index.ts` — remove `export * from "./twilio.types"`
- `backend/services/fx/providers/fixer/index.ts` — remove `export * from "./fixer.types"`
- `backend/services/fx/providers/openexchangerates/index.ts` — remove `export * from "./openexchangerates.types"`
- `backend/services/communication/channels/whatsapp/cloud-api/index.ts` — remove `export * from "@/backend/types/whatsapp/whatsapp-cloud-api.types"` (types come from `@/backend/types` barrel); change `export { ... } from "./meta-cloud-api.types"` → `export { ... } from "./meta-cloud-api.helpers"`

### `backend/db/index.ts`
- Remove `export * from "./db.types";` (moved to `backend/types/`)
- Keep comment but update: db.types now lives in `backend/types/`

## Consumer Updates

### File #1: `db.types.ts` (~180 consumers)
All files importing `DBTransaction` or `DBQueryExecutor` from `@/backend/db/db.types` change to:
```ts
import type { DBTransaction } from "@/backend/types";
```
Use `rg -l "db\.types" --glob '!**/node_modules/**' --glob '!**/*.md'` to find all consumers.

**Note:** `backend/types/communication.types.ts` currently imports `DBTransaction` from `@/backend/db/db.types` — update to `@/backend/types` (self-referential barrel is fine since it's re-exported).

### Files #2-4, #6-10: provider types (1-2 consumers each)
Each adapter file that imports from its local `.types.ts` changes to import from `@/backend/types`:
- `ResendEmailAdapter.ts` — `import type { ResendEmailContext, ... } from "@/backend/types"`
- `FcmPushAdapter.ts` — `import { FcmPushContext, FCM_TOKEN_EXPIRED_ERROR, ... } from "@/backend/types"` (note: `FCM_*` constants are runtime values, not type-only)
- `TwilioSmsAdapter.ts` — `import type { TwilioSmsContext, ... } from "@/backend/types"`
- `FixerAdapter.ts` — `import { FixerLatestResponse, fixerResponseSchema } from "@/backend/types"` (note: `fixerResponseSchema` is a runtime value)
- `OpenExchangeRatesAdapter.ts` — `import type { OpenExchangeRatesResponse } from "@/backend/types"`
- `GoogleMeetAdapter.ts` — `import type { ... } from "@/backend/types"`
- `MicrosoftTeamsAdapter.ts` — `import type { ... } from "@/backend/types"`
- `ZoomAdapter.ts` — `import type { ... } from "@/backend/types"`

### File #5: `meta-cloud-api` (15 consumers)
Split imports:
- **Types** (`GraphApiPaginatedResponse`, `GraphApiRequestContext`, `GraphApiRequestInit`, `MetaErrorBody`, etc.) → `@/backend/types`
- **Runtime** (`buildGraphUrl`, `buildAuthHeaders`, `GraphApiError`, `extractMetaErrorCode`, `extractMetaErrorMessage`) → `@/backend/services/communication/channels/whatsapp/cloud-api` (barrel) or `./meta-cloud-api.helpers` (direct)

Consumer files:
- `backend/services/communication/channels/whatsapp/cloud-api/MetaCloudApiAdapter.ts`
- `backend/services/communication/channels/whatsapp/cloud-api/requests/build-paginated-list-request.ts`
- `backend/services/communication/channels/whatsapp/cloud-api/requests/collect-all-pages.ts`
- `backend/services/communication/channels/whatsapp/cloud-api/requests/get-phone-number.request.ts`
- `backend/services/communication/channels/whatsapp/cloud-api/requests/list-message-templates.request.ts`
- `backend/services/communication/channels/whatsapp/cloud-api/requests/list-phone-numbers.request.ts`
- `backend/services/communication/channels/whatsapp/cloud-api/requests/send-template-message.request.ts`
- `backend/services/whatsapp/whatsapp-account.service.ts`
- `backend/services/whatsapp/test/whatsapp-optin.test.ts`
- `test/integration/communication/whatsapp/*.integration.test.ts` (4 files)
- `test/integration/communication/whatsapp/whatsapp-unit.test.ts`

## Config Updates

### `eslint.config.mjs` (line 366)
- Remove `"@/backend/db/db.types"` from the seeders `no-restricted-imports` group (file no longer exists at that path)
- The rule blocks `backend/db/seeds/**/*.ts` from importing db-layer modules. Since `DBTransaction` now lives in `@/backend/types`, seeders could import it — but seed services (in `backend/services/seed/`) are the actual consumers, not `backend/db/seeds/` files. Verify no `backend/db/seeds/*.ts` file imports `DBTransaction` directly (confirmed: only `AGENTS.md` mentions it).

### `backend/db/index.ts`
- Remove `export * from "./db.types";` line
- Update the comment to reflect that db.types moved to `backend/types/`

## AGENTS.md & Instructions Updates

### `backend/types/AGENTS.md`
- Add rule: "All `.types.ts` files MUST live in `backend/types/`. Service-layer files must not define or re-export types — import from `@/backend/types` instead."
- Add rule: "If a service file contains both types and runtime code, split: types → `backend/types/`, runtime → stays in service layer with a non-`.types` filename (e.g., `.helpers.ts`)."
- Add rule: "`backend/types/**/index.ts` barrels MUST use `./` relative paths and `export * from "./..."`. No `@/` aliases, no `../` parent traversal, no explicit per-export `export type { ... }`."
- Document the completed migration (list of moved files)

### `backend/AGENTS.md`
- Update the "Type Definition Pattern" section: types imported from `@/backend/types` only — no service-layer `.types.ts` files
- Add note: `DBTransaction` / `DBQueryExecutor` now live in `@/backend/types` (moved from `@/backend/db/db.types`)

### `backend/services/AGENTS.md`
- Update "Type Definition Pattern" bullet: "Services should import and use types from `@/backend/types` (e.g., `{Entity}ReturnType`, `{Entity}SubmitInput`, `DBTransaction`) rather than creating ad-hoc type definitions or directly referencing schema types."
- Add rule: "Service-layer `.types.ts` files are prohibited. All types live in `backend/types/`. Provider-specific types (e.g., `FixerLatestResponse`, `ZoomTokenResponse`) are in `backend/types/<domain>/`."

### `.github/instructions/backend.instructions.md`
- Add rule about types living only in `backend/types/`, no service-layer `.types.ts`

### `AGENTS.md` (root)
- Update "Type Definition Pattern (CRITICAL)" section to mention `DBTransaction` is now in `@/backend/types`
- Add to Important References: `docs/backend/types-consolidation.md` (new doc)

### New doc: `docs/backend/types-consolidation.md`
- Document the migration pattern: moving `.types.ts` from service layer to `backend/types/`
- Rules: types-only in types module, split runtime code, barrel conventions (`./` + `export *`)
- Rollout summary table of moved files

## Risks & Edge Cases

1. **`fixerResponseSchema` and `FCM_*` constants are runtime values** — these are `export const`, not types. They move to `backend/types/` but consumers must use regular `import { ... }` (not `import type { ... }`). The `backend/types/` module already contains runtime values (e.g., `fixerResponseSchema` is a Zod schema). This is acceptable — `backend/types/` is a types+schema module, not strictly type-only. **However**, the user said "only types can exist in module types". Need to verify: should Zod schemas and const values move to `backend/types/` or stay in the service layer?

   → **Resolution**: Zod schemas (`fixerResponseSchema`) and const values (`FCM_TOKEN_EXPIRED_ERROR`, `FCM_INVALID_TOKEN_ERROR`) are runtime code. Per the user's rule ("only types can exist in module types"), these should NOT move to `backend/types/`. They stay in the service layer in a non-`.types` file. The `.types.ts` file is split: interfaces/types → `backend/types/`, runtime consts/schemas → new `.helpers.ts` or `.constants.ts` in the service layer.

   **Revised split for `fixer.types.ts`:**
   - Types (`FixerLatestResponse` interface) → `backend/types/fx/fixer.types.ts`
   - Runtime (`fixerResponseSchema` Zod schema) → `backend/services/fx/providers/fixer/fixer.helpers.ts` (new file)

   **Revised split for `fcm.types.ts`:**
   - Types (`FcmPushContext`, `FcmMulticastResult`, `FcmSendResponse`, `FcmErrorInfo` interfaces) → `backend/types/communication/fcm.types.ts`
   - Runtime (`FCM_TOKEN_EXPIRED_ERROR`, `FCM_INVALID_TOKEN_ERROR` consts) → `backend/services/communication/channels/push/fcm/fcm.helpers.ts` (new file)

2. **`backend/types/communication.types.ts`** — existing single file with `BaseEntity`, `BaseRepo`, `DBTx`, `ResolutionResult`. It imports `DBTransaction` from `@/backend/db/db.types`. When creating `backend/types/communication/` dir, this file moves into it. Update its import to `@/backend/types` (self-barrel) or `../db.types` (relative within types module). Prefer `../db.types` to avoid circular barrel import.

3. **Circular import risk**: `backend/types/communication.types.ts` imports `DBTransaction`. If `DBTransaction` moves to `backend/types/db.types.ts`, and `backend/types/index.ts` re-exports both `./communication` and `./db.types`, there's no circular dependency (db.types doesn't import from communication). Safe.

4. **`backend/types/meeting/index.ts` conversion** — verified no export name collisions across all 6 existing meeting type files + 3 new channel type files. `export *` is safe.

5. **Seeders eslint rule** — `backend/db/seeds/**/*.ts` blocked from `@/backend/db/db.types`. After move, remove this entry. Verify no `backend/db/seeds/*.ts` file imports `DBTransaction` (confirmed: only `AGENTS.md` references it, no `.ts` seed file imports it directly).

6. **`backend/types/whatsapp/whatsapp-cloud-api.types.ts` comment** (lines 9-11) says runtime helpers "remain in the service layer at `backend/services/communication/channels/whatsapp/cloud-api/meta-cloud-api.types.ts`". Update this comment to point to `meta-cloud-api.helpers.ts`.

## Revised File Splits (runtime vs types)

| Source file | Types → `backend/types/` | Runtime → service layer |
|---|---|---|
| `fixer.types.ts` | `FixerLatestResponse` interface → `backend/types/fx/fixer.types.ts` | `fixerResponseSchema` (Zod) → `backend/services/fx/providers/fixer/fixer.helpers.ts` |
| `fcm.types.ts` | `FcmPushContext`, `FcmMulticastResult`, `FcmSendResponse`, `FcmErrorInfo` → `backend/types/communication/fcm.types.ts` | `FCM_TOKEN_EXPIRED_ERROR`, `FCM_INVALID_TOKEN_ERROR` → `backend/services/communication/channels/push/fcm/fcm.helpers.ts` |
| `meta-cloud-api.types.ts` | (already in `backend/types/whatsapp/`) | `buildGraphUrl`, `buildAuthHeaders`, `GraphApiError`, `extractMetaErrorCode`, `extractMetaErrorMessage`, `extractMetaErrorFields`, `MetaErrorFields` → `backend/services/communication/channels/whatsapp/cloud-api/meta-cloud-api.helpers.ts` |
| `resend.types.ts` | All (interfaces only) → `backend/types/communication/resend.types.ts` | None |
| `twilio.types.ts` | All (interfaces only) → `backend/types/communication/twilio.types.ts` | None |
| `openexchangerates.types.ts` | All (interface only) → `backend/types/fx/openexchangerates.types.ts` | None |
| `google-meet.types.ts` | All (interfaces only) → `backend/types/meeting/channels/google-meet.types.ts` | None |
| `microsoft-teams.types.ts` | All (interfaces only) → `backend/types/meeting/channels/microsoft-teams.types.ts` | None |
| `zoom.types.ts` | All (interfaces only) → `backend/types/meeting/channels/zoom.types.ts` | None |
| `db.types.ts` | All (type aliases only) → `backend/types/db.types.ts` | None |

## Task List

### Phase 1: Create new types files in `backend/types/`

- [ ] 1.1 Create `backend/types/fx/` dir with `fixer.types.ts` (interface only) and `openexchangerates.types.ts`
- [ ] 1.2 Create `backend/types/communication/` dir; move `backend/types/communication.types.ts` into it; add `resend.types.ts`, `fcm.types.ts` (interfaces only), `twilio.types.ts`
- [ ] 1.3 Create `backend/types/meeting/channels/` dir with `google-meet.types.ts`, `microsoft-teams.types.ts`, `zoom.types.ts`
- [ ] 1.4 Move `backend/db/db.types.ts` → `backend/types/db.types.ts` (update internal imports: `@/backend/db/drizzleDb` and `@/backend/db/drizzleRelations` stay as-is since they're db-layer modules)

### Phase 2: Create new runtime helper files in service layer

- [ ] 2.1 Create `backend/services/fx/providers/fixer/fixer.helpers.ts` with `fixerResponseSchema` (Zod schema)
- [ ] 2.2 Create `backend/services/communication/channels/push/fcm/fcm.helpers.ts` with `FCM_TOKEN_EXPIRED_ERROR`, `FCM_INVALID_TOKEN_ERROR`
- [ ] 2.3 Create `backend/services/communication/channels/whatsapp/cloud-api/meta-cloud-api.helpers.ts` with all runtime code from `meta-cloud-api.types.ts` (functions, class, private helpers)

### Phase 3: Create/update `index.ts` barrels

- [ ] 3.1 Create `backend/types/fx/index.ts` (`export * from "./fixer.types"; export * from "./openexchangerates.types"`)
- [ ] 3.2 Create `backend/types/communication/index.ts` (`export * from "./communication.types"; export * from "./fcm.types"; export * from "./resend.types"; export * from "./twilio.types"`)
- [ ] 3.3 Create `backend/types/meeting/channels/index.ts` (`export * from "./google-meet.types"; export * from "./microsoft-teams.types"; export * from "./zoom.types"`)
- [ ] 3.4 Update `backend/types/index.ts`: add `export * from "./fx"`, change `./communication.types` → `./communication`, add `export * from "./db.types"`
- [ ] 3.5 Rewrite `backend/types/meeting/index.ts`: convert all to `export * from "./..."` + add `export * from "./channels"`

### Phase 4: Delete old `.types.ts` files and update provider `index.ts`

- [ ] 4.1 Delete `backend/services/fx/providers/fixer/fixer.types.ts`; update `fixer/index.ts` (remove types re-export, add helpers re-export)
- [ ] 4.2 Delete `backend/services/fx/providers/openexchangerates/openexchangerates.types.ts`; update `openexchangerates/index.ts`
- [ ] 4.3 Delete `backend/services/communication/channels/email/resend/resend.types.ts`; update `resend/index.ts`
- [ ] 4.4 Delete `backend/services/communication/channels/push/fcm/fcm.types.ts`; update `fcm/index.ts` (remove duplicate types re-export, add helpers re-export)
- [ ] 4.5 Delete `backend/services/communication/channels/sms/twilio/twilio.types.ts`; update `twilio/index.ts`
- [ ] 4.6 Delete `backend/services/communication/channels/whatsapp/cloud-api/meta-cloud-api.types.ts`; update `cloud-api/index.ts` (change to helpers, remove types re-export)
- [ ] 4.7 Delete `backend/services/meeting/channels/google-meet/google-meet.types.ts`
- [ ] 4.8 Delete `backend/services/meeting/channels/microsoft-teams/microsoft-teams.types.ts`
- [ ] 4.9 Delete `backend/services/meeting/channels/zoom/zoom.types.ts`
- [ ] 4.10 Delete `backend/db/db.types.ts`; update `backend/db/index.ts` (remove `export * from "./db.types"`)

### Phase 5: Update all consumers

- [ ] 5.1 Update `db.types` consumers (~180 files): `@/backend/db/db.types` → `@/backend/types`
- [ ] 5.2 Update `fixer.types` consumers: `FixerLatestResponse` from `@/backend/types`, `fixerResponseSchema` from `@/backend/services/fx/providers/fixer` or `./fixer.helpers`
- [ ] 5.3 Update `fcm.types` consumers: interfaces from `@/backend/types`, `FCM_*` consts from `@/backend/services/communication/channels/push/fcm` or `./fcm.helpers`
- [ ] 5.4 Update `twilio.types` consumers: from `@/backend/types`
- [ ] 5.5 Update `resend.types` consumers: from `@/backend/types`
- [ ] 5.6 Update `openexchangerates.types` consumers: from `@/backend/types`
- [ ] 5.7 Update `google-meet.types` consumers: from `@/backend/types`
- [ ] 5.8 Update `microsoft-teams.types` consumers: from `@/backend/types`
- [ ] 5.9 Update `zoom.types` consumers: from `@/backend/types`
- [ ] 5.10 Update `meta-cloud-api` consumers (15 files): types from `@/backend/types`, runtime from `@/backend/services/communication/channels/whatsapp/cloud-api` barrel
- [ ] 5.11 Update `backend/types/communication.types.ts` internal import: `@/backend/db/db.types` → `../db.types` (relative within types module)

### Phase 6: Config & docs updates

- [ ] 6.1 Update `eslint.config.mjs`: remove `"@/backend/db/db.types"` from seeders no-restricted-imports (line 366)
- [ ] 6.2 Update `backend/types/whatsapp/whatsapp-cloud-api.types.ts` comment (lines 9-11): point to `meta-cloud-api.helpers.ts`
- [ ] 6.3 Update `backend/types/AGENTS.md`: add types-location rules, barrel conventions, migration record
- [ ] 6.4 Update `backend/AGENTS.md`: update Type Definition Pattern, note DBTransaction moved
- [ ] 6.5 Update `backend/services/AGENTS.md`: prohibit service-layer `.types.ts`, import from `@/backend/types`
- [ ] 6.6 Update `.github/instructions/backend.instructions.md`: add types-location rule
- [ ] 6.7 Update root `AGENTS.md`: update Type Definition Pattern section, add new doc to Important References
- [ ] 6.8 Create `docs/backend/types-consolidation.md`: migration pattern, rules, rollout summary

### Phase 7: Verification

- [ ] 7.1 Run `bun tsgo` — zero type errors
- [ ] 7.2 Run `bun run oxlint` — zero warnings
- [ ] 7.3 Run `bun biome:check` — zero issues
- [ ] 7.4 Run `bun run lint` — zero errors
- [ ] 7.5 Run `bun run scripts/health/sub-loop.ts <file> --lifecycle codescene` on each new/modified file
- [ ] 7.6 Verify no stale imports: `rg "db\.types" --glob '!**/*.md'` returns nothing; `rg "fixer\.types|fcm\.types|twilio\.types|resend\.types|meta-cloud-api\.types|openexchangerates\.types|google-meet\.types|microsoft-teams\.types|zoom\.types" --glob '!backend/types/**' --glob '!**/*.md'` returns nothing
- [ ] 7.7 Run `bun run test:services` — verify service tests pass
- [ ] 7.8 Run `bun run test:db` — verify db tests pass (DBTransaction consumers)

## Validation

- **tsgo**: zero errors (catches broken imports)
- **oxlint**: zero warnings (catches import path issues, type assertion issues)
- **lint**: zero errors (catches import grouping violations)
- **grep verification**: no remaining references to old `.types.ts` paths outside `backend/types/` and docs
- **test:services**: service tests pass (adapter tests that use the moved types)
- **test:db**: db tests pass (DBTransaction consumers)
