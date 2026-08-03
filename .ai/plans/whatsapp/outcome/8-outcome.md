# Task 8 Outcome — Backend types and repository (REQ-3, REQ-8)

## Subtasks completed

| # | Subtask | Status |
|---|---------|--------|
| 8.1 | Create `backend/types/whatsapp/whatsapp-account.types.ts` — `ReturnType` excludes encrypted columns | ✅ |
| 8.2 | Create `backend/types/whatsapp/index.ts` barrel | ✅ |
| 8.3 | Create `backend/db/repo/whatsapp/whatsapp-account.repository.ts` — CRUD, `findByPhoneNumberId`, `listActive`, all methods accept optional `tx` | ✅ |
| 8.4 | Create `backend/db/repo/whatsapp/index.ts` barrel | ✅ |
| 8.5 | Quality loop per file: `bun tsgo && bun biome:check && lint-queue-client` | ✅ |
| 8.6 | AGENTS.md/instruction compliance check | ✅ |

## Files created

### `backend/types/whatsapp/whatsapp-account.types.ts`

Defines canonical types for the WhatsApp account entity:

- `WhatsappAccountSelectType` — inferred from schema via `typeof whatsappAccounts.$inferSelect`
- `WhatsappAccountInsertType` — inferred from schema via `typeof whatsappAccounts.$inferInsert`
- `WhatsappAccountReturnType` — `Omit<SelectType, "encryptedAccessToken" | "encryptedTwoStepPin">` — safe for API responses (encrypted credentials stripped)
- `WhatsappAccountSubmitInput` — `Omit<InsertType, "id" | "createdAt" | "updatedAt" | "isActive">` — input for creating accounts
- `WhatsappAccountUpdateInput` — partial of SubmitInput — input for updating accounts
- `SetWhatsappAccessTokenInput` — `{ id: string; encryptedAccessToken: string }`
- `SetWhatsappTwoStepPinInput` — `{ id: string; encryptedTwoStepPin: string }`

### `backend/types/whatsapp/index.ts`

Barrel export using absolute path: `export * from "@/backend/types/whatsapp/whatsapp-account.types"`

### `backend/db/repo/whatsapp/whatsapp-account.repository.ts`

Namespace `WhatsappAccountRepository` with the following methods (all accept optional `tx` for transaction support):

**Reads (use `queryDb(tx)` — HTTP-eligible):**
- `findById(id, tx?)` — returns `ReturnType` (stripped encrypted credentials) or null
- `findByPhoneNumberId(phoneNumberId, tx?)` — returns `ReturnType` or null (used for webhook routing)
- `findByWabaId(wabaId, tx?)` — returns `ReturnType[]`
- `listActive(tx?)` — returns `ReturnType[]` filtered by `isActive = true`
- `findRawById(id, tx?)` — returns full `SelectType` including decrypted credentials (for service layer)
- `findRawByPhoneNumberId(phoneNumberId, tx?)` — returns full `SelectType` including decrypted credentials

**Writes (use `db.transaction(runner)`):**
- `create(input, tx?)` — inserts new account, returns `ReturnType`
- `update(id, input, tx?)` — updates account fields, returns `ReturnType` or null
- `setAccessToken(id, encryptedAccessToken, tx?)` — updates credential, returns `ReturnType` or null
- `setTwoStepPin(id, encryptedTwoStepPin, tx?)` — updates credential, returns `ReturnType` or null
- `deleteById(id, tx?)` — hard delete, returns void

**Helper:**
- `toReturnType(row)` — strips `encryptedAccessToken` and `encryptedTwoStepPin` from select row

### `backend/db/repo/whatsapp/index.ts`

Barrel export using absolute path: `export { WhatsappAccountRepository } from "@/backend/db/repo/whatsapp/whatsapp-account.repository"`

## Files modified

### `backend/types/index.ts`

Added `export * from "./whatsapp";` after `export * from "./users";`

### `backend/db/repo/index.ts`

Added `export { WhatsappAccountRepository } from "@/backend/db/repo/whatsapp";`

## Quality verification

| Check | Result |
|-------|--------|
| `bun tsgo` | ✅ exit 0 — no type errors |
| `bun biome:check` | ✅ exit 0 — fixed 2 files (formatting) |
| `bun lint` (full repo via queue) | ✅ exit 0 — no lint errors |

## Bug fixed during implementation

- `listActive` method initially referenced `whatsappAccounts.deletedAt` which doesn't exist in the schema (WhatsApp accounts use `isActive` boolean for soft delete, no `deletedAt` column). Fixed by changing where clause to `eq(whatsappAccounts.isActive, true)` and removing unused `isNull`/`and` imports.

## AGENTS.md compliance

- ✅ `backend/types/AGENTS.md` — types follow `$inferSelect`/`Omit` pattern, canonical naming
- ✅ `backend/db/repo/AGENTS.md` — namespace pattern, `queryDb(tx)` for reads, `db.transaction(runner)` for writes
- ✅ `backend/AGENTS.md` — layer separation, no logic in repo (data access only)
- ✅ No `console.*` usage (uses `logger` from `@/backend/lib` where needed)
- ✅ All imports use `@/` path alias
- ✅ ReturnType omits encrypted credentials per REQ-8 security requirement
