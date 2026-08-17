# Task 11 Outcome — GraphQL Layer

## Summary

Created the complete GraphQL layer for WhatsApp accounts: Pothos object/input types, mutations, and queries. Schema generation and codegen succeeded. All quality gates pass.

## Files Created

### 11.1 — Pothos Object & Input Types
`backend/graphql/pothos/whatsapp/whatsapp-account.pothos.ts`
- `WhatsappAccountPothosObject` — object type exposing all `WhatsappAccountReturnType` fields (id, wabaId, phoneNumberId, displayPhoneNumber, displayName, qualityRating, portfolioMessagingLimitTier, throughputLevel, isActive, lastWebhookAt, createdAt, updatedAt)
- `WhatsappAccountCreateInputPothosObject` — input type for create mutation (includes credential fields for initial setup)
- `WhatsappAccountUpdateInputPothosObject` — input type for update mutation (excludes credentials — dedicated mutations handle those)
- `WhatsappTemplateSnapshotPothosObject` — BL3 template snapshot object (id, name, language, status, category)
- `WhatsappSyncFromMetaResultPothosObject` — sync result wrapper (id, accounts[], templates[])
- Exported types: `WhatsappTemplateSnapshot`, `WhatsappSyncFromMetaReturnType`

### 11.2 — Pothos Barrel
`backend/graphql/pothos/whatsapp/index.ts`
- `export * from "@/backend/graphql/pothos/whatsapp/whatsapp-account.pothos";`

### 11.3 — Mutations
`backend/graphql/mutation/whatsapp/whatsapp-account.mutation.ts`
- `createWhatsappAccount` — creates account, cleans LocalizedString nulls, defaults credentials to ""
- `updateWhatsappAccount` — updates account, service calls `resetWhatsappChannel()` (S4)
- `deleteWhatsappAccount` — deactivates account, service calls `resetWhatsappChannel()` (S4)
- `setWhatsappAccessToken` — sets credential, service calls `resetWhatsappChannel()` (S4)
- `setWhatsappTwoStepPin` — sets credential, service calls `resetWhatsappChannel()` (S4)
- `syncWhatsappAccountsFromMeta` — syncs from Meta Graph API, includes template snapshot (BL3)
- `setUserWhatsappOptIn` — per-user opt-in toggle (REQ-10/BL1)
- All mutations use `requireAuth(ctx)` and `ctx.t().errorsTranslations` for i18n

### 11.4 — Queries
`backend/graphql/query/whatsapp/whatsapp-account.query.ts`
- `whatsappAccounts` — list all active accounts
- `whatsappAccount` — fetch single account by ID
- `isUserWhatsappOptIn` — check user opt-in status (REQ-10/BL1)

### 11.5 — Barrel Updates
- `backend/graphql/pothos/index.ts` — added `export * from "@/backend/graphql/pothos/whatsapp";`
- `backend/graphql/mutation/index.ts` — added `import "./whatsapp";`
- `backend/graphql/query/index.ts` — added `import "./whatsapp";`

### 11.6 — Schema Generation
- `bun run generate:gqlSchema` — succeeded
- `bun codegen` — succeeded, 38 WhatsApp types in `graphql-types.ts`

### 11.7 — Quality Results
- `bun tsgo` ✅ (exit 0)
- `bun biome:check` ✅ (fixed 2 files, passed)
- `bun run lint` (full repo via queue) ✅ (exit 0)

### 11.8 — AGENTS.md Compliance
- Used `gqlSchemaBuilder` (not `builder`) from `@/backend/graphql/gqlSchemaBuilder`
- Used `requireAuth(ctx)` for auth, `ctx.t().errorsTranslations` for i18n
- Types imported from `@/backend/types` (`WhatsappAccountReturnType`)
- `id` field exposed on all object types for Apollo cache normalization
- Used `inputType` (string-named) pattern instead of `inputRef<BackendType>` to avoid LocalizedString null incompatibility (same pattern as `permission-management.pothos.ts`)
- Null-cleaning in resolvers: `displayName` filtered for nulls before passing to service
- No hardcoded enum values — no enums needed (all fields are scalars)
- Side-effect import barrels (`import "./whatsapp-account.mutation";`)
- No local type definitions for entity shapes — used `backend/types` + wrapper types for sync result
