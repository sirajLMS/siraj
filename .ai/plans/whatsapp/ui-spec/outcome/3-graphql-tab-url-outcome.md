# Task 3 Outcome: GraphQL Document Additions & URL Tab Helper

## Summary

Created the `useWhatsappTab()` hook for URL-synced tab state (Pattern A — `?tab=templates` in the URL), added `TAB_PERMISSIONS` and `TAB_URL_VALUES` constants to `whatsappConfig.constants.ts`, and stubbed out two new GraphQL query documents (`whatsappTemplatesQueryDocument` and `whatsappOptInAuditQueryDocument`) as commented-out templates ready to activate once backend resolvers are created (Task 9 cross-file dependency). Re-exported `WhatsappConfigTab` from the constants barrel so consumers don't need to import from the view file.

## Files Created (1)

### 1. `frontend/common/views/dashboard/settings/whatsapp/whatsappTabUrl.ts`

- **`useWhatsappTab()` hook**: Returns `[activeTab, setActiveTab]` tuple.
  - `activeTab: WhatsappConfigTab` — current tab from URL `?tab=` param, validated against `TAB_IDS` allowlist; falls back to `TAB_IDS[0]` ("numbers") for invalid/missing param.
  - `setActiveTab(tab)`: Updates URL via `router.replace()` with `{ scroll: false }` to avoid scroll jumps.
- **Type guard `isWhatsappConfigTab(value)`**: Validates that a string matches one of the `TAB_IDS` entries; `null` returns `false`. Uses `value is WhatsappConfigTab` return type narrowing.
- **"use client" directive**: Required since `useSearchParams` and `useRouter` from `next/navigation` are client-side hooks.
- **No unsafe type assertions**: `TAB_IDS as readonly string[]` is safe (widening, not narrowing); the `value !== null` guard before `.includes(value)` avoids `no-unsafe-type-assertion`.

## Files Modified (2)

### 2. `frontend/common/views/dashboard/settings/whatsapp/whatsappConfig.constants.ts`

- Added `AppPermission` import from `@/frontend/common/graphql/generated/gql/graphql-types`
- Re-exported `WhatsappConfigTab` type (originally defined in `WhatsappConfigView.tsx`, imported but not re-exported by constants — now `export type { WhatsappConfigTab }`)
- Added `TAB_PERMISSIONS: Record<WhatsappConfigTab, readonly AppPermission[]>`:
  - `numbers` → `[AppPermission.WhatsappConfigManage]`
  - `templates` → `[AppPermission.WhatsappTemplatesManage]`
  - `optin` → `[AppPermission.WhatsappView]`
- Added `TAB_URL_VALUES: readonly WhatsappConfigTab[]` — alias of `TAB_IDS` for URL serialization use cases

### 3. `frontend/common/graphql/sharedDocuments/whatsapp/whatsapp.documents.ts`

- Added commented-out stub GraphQL documents at the end of the file with detailed cross-file dependency documentation:
  - `whatsappTemplatesQueryDocument` — targets a `whatsappTemplates` query (does NOT exist in backend yet)
  - `whatsappOptInAuditQueryDocument` — targets a `whatsappOptInAudit` query (does NOT exist in backend yet)
- Stubs are commented out because the backend Pothos schema has no `whatsappTemplates` or `whatsappOptInAudit` query root fields. Activating them would cause `bun run generate:gqlSchema` to fail with "Cannot query field X on type Query" errors.
- Each stub includes `id` field on the returned object type (per Apollo cache normalization requirement).
- The `WhatsappTemplateSnapshot` type in the existing schema only has: `id`, `name`, `language`, `status`, `category`, `lastSyncedAt` — fields like `body`, `buttonStructure`, `createdAt`, `updatedAt` do NOT exist. The stub documents use only the fields available in the current schema.

## GraphQL Code Generation Results

- `bun run generate:gqlSchema` — exit 0 ✅ (succeeded with stubs commented out)
- `bun codegen` — exit 0 ✅ (no generated files changed, since no new active documents were added)
- No changes to `frontend/common/graphql/generated/` directory

## AppPermission Enum Verification

- **Source**: `@/frontend/common/graphql/generated/gql/graphql-types` (auto-generated from backend schema)
- **Available WhatsApp permissions** (actual enum values):
  - `AppPermission.WhatsappView`
  - `AppPermission.WhatsappConfigManage`
  - `AppPermission.WhatsappTemplatesManage`
- **NOT available** (task spec mentioned these but they don't exist):
  - `AppPermission.WHATSAPP_MANAGE` — does NOT exist; the correct name is `WhatsappConfigManage`
  - `AppPermission.WHATSAPP_VIEW` — does NOT exist; the correct name is `WhatsappView` (no `WHATSAPP_` prefix in the generated enum)
  - `AppPermission.WHATSAPP_TEMPLATES_MANAGE` — correct name is `WhatsappTemplatesManage`
  - `AppPermission.WHATSAPP_OPT_IN_MANAGE` — does NOT exist at all
- **Tab type**: `WhatsappConfigTab = "numbers" | "templates" | "optin"` (NOT `TabId`); defined in `WhatsappConfigView.tsx`

## Verification Results

### Per-File Sub-Loop (all `--lifecycle codescene`)

| File | tsgo | oxlint | biome | lint:type-aware | duplicates | codescene |
|------|------|--------|-------|-----------------|-----------|-----------|
| `whatsapp.documents.ts` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `whatsappTabUrl.ts` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `whatsappConfig.constants.ts` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

### Global Checks

- `bun tsgo` — exit 0 ✅
- `bun biome:check` — exit 0 ✅ (5347 files, no fixes applied)
- `bun run lint` — exit 0 ✅

## Semantic Review Checklist

- [x] GraphQL documents include `id` field on all object types (stub documents have `id`)
- [x] Exported constant names are camelCase (not PascalCase) — `whatsappTemplatesQueryDocument`, `whatsappOptInAuditQueryDocument` (PascalCase is only for generated `Operations` types)
- [x] `useWhatsappTab` hook uses client-side `useSearchParams` (not server-side searchParams) — "use client" directive + `useSearchParams()` from `next/navigation`
- [x] Tab validation uses allowlist (`TAB_IDS`) — type guard `isWhatsappConfigTab` checks against `TAB_IDS`
- [x] Invalid tab param falls back to first tab — `TAB_IDS[0]` ("numbers")
- [x] `TAB_PERMISSIONS` maps to correct `AppPermission` enum values (verified against generated types)
- [x] No cross-layer imports (shared importing from frontend/backend)
- [x] Only files in task scope were modified
- [x] No `oxlint-disable` comments
- [x] No `console.*` usage
- [x] No hardcoded colors or MUI style prop violations (no UI rendering code in this task)

## Backend Resolver Status (CRITICAL for Task 9)

### Missing Resolvers

| Query | Status | Location Needed |
|-------|--------|----------------|
| `whatsappTemplates` | ❌ Does NOT exist | `backend/graphql/query/whatsapp/whatsapp-account.query.ts` |
| `whatsappOptInAudit` | ❌ Does NOT exist | `backend/graphql/query/whatsapp/whatsapp-account.query.ts` (or new file) |

### Current Backend WhatsApp Queries (in schema)

- `whatsappAccounts` — returns `[WhatsappAccount!]!`
- `isUserWhatsappOptIn(userId: String!)` — returns `Boolean!`
- `isWhatsappConfigured` — returns `Boolean!`

### WhatsappTemplateSnapshot Type Fields (current)

Only: `id`, `name`, `language`, `status`, `category`, `lastSyncedAt`

Fields in the task spec (body, buttonStructure, createdAt, updatedAt) do NOT exist on this type. Task 9 will need to either:
1. Extend `WhatsappTemplateSnapshot` with these fields, OR
2. Create a new `WhatsappTemplate` object type for persisted templates (vs. snapshot from Meta sync)

### Activation Steps for Task 9

1. Create backend Pothos resolvers for `whatsappTemplates` and `whatsappOptInAudit`
2. Create or extend GraphQL object types:
   - `WhatsappTemplate` (or extend `WhatsappTemplateSnapshot`) with `body`, `buttonStructure`, `createdAt`, `updatedAt`
   - `WhatsappOptInAuditEntry` with `id`, `optedIn`, `optedInAt`, `changedBy`, `createdAt`
3. Run `bun run generate:gqlSchema && bun codegen`
4. Uncomment the stub documents in `whatsapp.documents.ts` and add `TypedDocumentNode` type annotations
5. Verify barrel `whatsapp/index.ts` (`export *` already covers new exports)

## Cross-File Dependencies Discovered

1. **`WhatsappConfigTab` type export chain**: Type is defined in `WhatsappConfigView.tsx` (line 10), imported by `whatsappConfig.constants.ts`. Now re-exported from constants barrel so `whatsappTabUrl.ts` imports from constants (single source). Other future consumers should also import from `whatsappConfig.constants.ts` to avoid reaching into the view file.

2. **`AppPermission` enum location**: Frontend imports from `@/frontend/common/graphql/generated/gql/graphql-types` (auto-generated). Backend source is `@/backend/lib/auth` (the `AppPermission` enum is defined there and appears in the GraphQL schema, which codegen surfaces to the frontend types file).

3. **`syncWhatsappAccountsFromMeta` mutation already returns templates**: The `syncWhatsappAccountsFromMeta` mutation returns a `templates` field of type `[WhatsappTemplateSnapshot!]!` — for the initial templates view, Task 4 can use this data instead of a new `whatsappTemplates` query. The standalone `whatsappTemplates` query is needed for cases where templates are fetched without a full Meta sync.

## Carry-Forward Knowledge for Future Subtasks

1. **`useWhatsappTab` hook is ready for use**: Task 4 (tab components) and Task 5 (mobile view) can replace `useState` in `WhatsappConfigView.tsx` (line 30) with `useWhatsappTab()` to enable URL-synced tab state. The hook returns the same tuple shape `[activeTab, setActiveTab]` so it's a drop-in replacement.

2. **`TAB_PERMISSIONS` is ready for access control**: Tasks 4 and 5 can use this map to gate tab visibility — render tabs only if the current user has the required `AppPermission` values. This enables fine-grained access control per tab.

3. **`TAB_URL_VALUES` is an alias of `TAB_IDS`**: Provided for code that wants to denote "URL string values" vs "tab identifiers" semantically. They point to the same array.

4. **GraphQL stubs are documented but inactive**: Task 9 must uncomment the stub documents in `whatsapp.documents.ts` after creating backend resolvers. The comment block (lines 145-185) contains the exact activation instructions.

5. **`isWhatsappConfiguredQueryDocument` was already present**: The existing file (line 139) already had this query document — it was added in an earlier task and doesn't need re-adding.

6. **`codegens.ts` must NOT have `skipDocumentsValidation`**: The `skipDocumentsValidation: { skipValidationAgainstSchema: true }` option in codegen.ts does NOT suppress validation errors — the graphql-codegen CLI validates documents before passing them to the core plugin. The only way to avoid "Cannot query field X" errors is to not include invalid documents (hence the commented-out approach).
