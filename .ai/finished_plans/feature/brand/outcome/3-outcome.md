# Task 3 — Regenerate GraphQL Schema + Frontend Types

## Summary

Ran `bun run generate:gqlSchema && bun codegen` to regenerate the GraphQL SDL
(`frontend/common/graphql/generated/schema.graphql`) and the typed frontend
operations (`frontend/common/graphql/generated/gql/graphql.ts`) from the
Pothos schema added in Task 2.4.

**Discovered gap:** the codegen config (`codegen.ts`) uses the
`typescript-operations` + `typed-document-node` plugins with `documents:`
pointing at `frontend/common/graphql/sharedDocuments/**/*.ts` and
`frontend/views/**/*.documents.ts`. With `onlyOperationTypes: false`, schema
types are emitted **only when reachable from at least one operation document**.
Task 2.4 added the Pothos resolvers but no frontend `.documents.ts` file, so
the first codegen pass emitted only the `SettingsAppearanceManage` enum value
(because `AppPermission` is referenced by existing user/permission queries)
and the SDL — none of the `AppearanceSettings*` operation types or
`*Document` constants were generated.

**Fix:** created `frontend/common/graphql/sharedDocuments/settings/site-appearance-settings.documents.ts`
mirroring the sibling `site-content-settings.documents.ts` pattern, then
re-ran `bun codegen`. All 4 operations + their types + 2 fragments now exist.

## Files Created/Modified

- **Created**: `frontend/common/graphql/sharedDocuments/settings/site-appearance-settings.documents.ts`
  (~110 lines) — exports 4 `TypedDocumentNode` constants + 2 reusable fragments:
  - `appearanceSettingsQueryDocument` (`TypedDocumentNode<AppearanceSettingsQuery, AppearanceSettingsQueryVariables>`)
  - `saveAppearanceDraftMutationDocument` (`TypedDocumentNode<SaveAppearanceDraftMutation, SaveAppearanceDraftMutationVariables>`)
  - `publishAppearanceMutationDocument` (`TypedDocumentNode<PublishAppearanceMutation>` — no args, second type param omitted)
  - `resetAppearanceDraftMutationDocument` (`TypedDocumentNode<ResetAppearanceDraftMutation>` — no args)
  - `AppearanceFieldsSelectionFragmentDoc` (fragment on `AppearanceFields`)
  - `AppearanceSettingsFieldsSelectionFragmentDoc` (fragment on `AppearanceSettings`, spreads the fields fragment into `draftFields`)
- **Modified**: `frontend/common/graphql/sharedDocuments/settings/index.ts` (+1 barrel export)
- **Regenerated** (by codegen, not hand-edited):
  - `frontend/common/graphql/generated/schema.graphql` (now contains `type AppearanceSettings`, `type AppearanceFields`, `type AppearanceColors`, `type AppearanceColorPair`, `input AppearanceDraftInput`, `input AppearanceColorsInput`, `input AppearanceColorPairInput`, plus the `Query.appearanceSettings` field and 3 `Mutation.*` fields)
  - `frontend/common/graphql/generated/gql/graphql.ts` (now contains the `SettingsAppearanceManage` enum value, the `AppearanceDraftInput` input type, the 4 operation type families + their variable types, the 2 fragment docs, and the 4 operation `*Document` constants)

## Verification Results

### 1. `bun run generate:gqlSchema` — ✅ PASS
```
[LOG] 📜 Schema generated at /home/ahmed/Projects/siraj/frontend/common/graphql/generated/schema.graphql
[STARTED] Generate outputs
[STARTED] Generate to ./frontend/common/graphql/generated/gql/graphql.ts
[COMPLETED] Generate to ./frontend/common/graphql/generated/gql/graphql.ts
[COMPLETED] Generate outputs
[LOG] ✅ GraphQL Code Generation completed successfully!
```
Note: `generate:gqlSchema` invokes `backend/graphql/generateGqlSchema.ts` which
runs `bun run graphql-codegen --config codegen.ts` as a child process, so the
single command regenerates both the SDL and the TypeScript types.

### 2. `bun codegen` (re-run after adding the documents file) — ✅ PASS
```
$ graphql-codegen
✔ Parse Configuration
✔ Generate outputs
✔ Generate to ./frontend/common/graphql/generated/gql/graphql.ts
✔ Load GraphQL schemas
✔ Load GraphQL documents
✔ Generate
✔ Generate to ./frontend/common/graphql/generated/gql/graphql.ts
✔ Generate outputs
```

### 3. Generated artifacts verification

| Artifact | File | Line | Status |
|---|---|---|---|
| `AppPermission.SettingsAppearanceManage` enum value | `gql/graphql.ts` | 193 | ✅ |
| `type AppearanceSettings` (SDL) | `schema.graphql` | 382 | ✅ |
| `type AppearanceFields` (SDL) | `schema.graphql` | 372 | ✅ |
| `type AppearanceColors` (SDL) | `schema.graphql` | 350 | ✅ |
| `type AppearanceColorPair` (SDL) | `schema.graphql` | 338 | ✅ |
| `input AppearanceDraftInput` (SDL) | `schema.graphql` | 362 | ✅ |
| `input AppearanceColorsInput` (SDL) | `schema.graphql` | 356 | ✅ |
| `input AppearanceColorPairInput` (SDL) | `schema.graphql` | 344 | ✅ |
| `Query.appearanceSettings(draft: Boolean = false)` (SDL) | `schema.graphql` | 3274 | ✅ |
| `Mutation.saveAppearanceDraft(input: AppearanceDraftInput!)` (SDL) | `schema.graphql` | 2595 | ✅ |
| `Mutation.publishAppearance` (SDL) | `schema.graphql` | 2559 | ✅ |
| `Mutation.resetAppearanceDraft` (SDL) | `schema.graphql` | 2582 | ✅ |
| `AppearanceDraftInput` (TS input type) | `gql/graphql.ts` | 302 | ✅ |
| `AppearanceColorsInput` (TS input type) | `gql/graphql.ts` | 296 | ✅ |
| `AppearanceColorPairInput` (TS input type) | `gql/graphql.ts` | 290 | ✅ |
| `AppearanceSettingsQuery` (TS operation type) | `gql/graphql.ts` | 4434 | ✅ |
| `AppearanceSettingsQueryVariables` | `gql/graphql.ts` | 4437 | ✅ |
| `SaveAppearanceDraftMutation` | `gql/graphql.ts` | 4443 | ✅ |
| `SaveAppearanceDraftMutationVariables` | `gql/graphql.ts` | 4446 | ✅ |
| `PublishAppearanceMutation` | `gql/graphql.ts` | 4452 | ✅ |
| `PublishAppearanceMutationVariables` | `gql/graphql.ts` | 4455 | ✅ (empty `{ [key: string]: never }`) |
| `ResetAppearanceDraftMutation` | `gql/graphql.ts` | 4459 | ✅ |
| `ResetAppearanceDraftMutationVariables` | `gql/graphql.ts` | 4462 | ✅ (empty `{ [key: string]: never }`) |
| `AppearanceFieldsSelectionFragmentDoc` (fragment doc) | `gql/graphql.ts` | 5261 | ✅ |
| `AppearanceSettingsFieldsSelectionFragmentDoc` (fragment doc) | `gql/graphql.ts` | 5262 | ✅ |
| `AppearanceSettingsDocument` (query doc) | `gql/graphql.ts` | 5506 | ✅ |
| `SaveAppearanceDraftDocument` (mutation doc) | `gql/graphql.ts` | 5507 | ✅ |
| `PublishAppearanceDocument` (mutation doc) | `gql/graphql.ts` | 5508 | ✅ |
| `ResetAppearanceDraftDocument` (mutation doc) | `gql/graphql.ts` | 5509 | ✅ |

### 4. Project-wide `bun tsgo` — ✅ PASS (0 errors)
No TypeScript regression from the new documents file, the barrel export, or
the regenerated `graphql.ts`.

### 5. `sub-loop.ts --lifecycle codescene` on the new documents file — ✅ PASS
```
✅ tsgo passed
✅ oxlint passed
✅ biome:check passed
✅ lint:type-aware passed
✅ check:duplicates passed
✅ codescene passed
✅ All checks for lifecycle "codescene" passed
```

## Implementation Details

### Why the documents file was needed

The codegen config (`codegen.ts`):
```ts
plugins: ["typescript-operations", "typed-document-node"],
config: { onlyOperationTypes: false, /* … */ },
documents: ["./frontend/common/graphql/sharedDocuments/**/*.ts", "./frontend/views/**/*.documents.ts"],
```

- `typescript-operations` emits types for **operations** found in the `documents` glob.
- `onlyOperationTypes: false` widens this to also emit the schema types that are **transitively reachable** from those operations.
- There is no base `typescript` plugin in the config, so schema types with no operation referencing them are **not** emitted.

Result: without a `.documents.ts` file declaring `query appearanceSettings` / `mutation saveAppearanceDraft` / etc., the codegen produced only the SDL (via `printSchema` in `generateGqlSchema.ts`) and the `SettingsAppearanceManage` enum value (already referenced by existing user/permission documents).

This matches the `AGENTS.md` rule:
> **NO SCHEMA TYPES**: No schema-level object types (e.g., `User`, `Quota`). Only operation-derived types from `graphql.ts`.

So creating the documents file is the canonical way to surface appearance types on the frontend — exactly what the sibling `site-content-settings.documents.ts` does for `SiteContentEntry`.

### Fragment naming

The inner fragment uses the name `AppearanceFieldsSelection` (not
`AppearanceFieldsFields`) to avoid the awkward doubled "Fields" suffix while
still describing what it selects. The outer fragment is
`AppearanceSettingsFieldsSelection`. Both follow the codegen-extracted-type
convention `{OperationName}_{field}` (e.g., `AppearanceSettingsFieldsSelectionFragment_draftFields`).

### `id` field on every named type

Per `sharedDocuments/AGENTS.md` → "`id` Field Requirement", the
`AppearanceSettingsFieldsSelection` fragment includes `id` on
`AppearanceSettings`. The nested value types (`AppearanceFields`,
`AppearanceColors`, `AppearanceColorPair`) have no `id` field in the schema
(they are value bundles, not entities), so no `id` is requested there.

### Mutation return shape

All 3 mutations select `...AppearanceSettingsFieldsSelection` on their return
value, so the frontend Apollo cache can normalize the entity by `id` and
update the cached `appearanceSettings` query result in-place after a
successful mutation (no manual `writeQuery` needed). This matches the
sibling `upsertSiteContent` pattern (Task 2.4 carry-forward).

### No-arg mutations

`publishAppearance` and `resetAppearanceDraft` take no variables, so the
`TypedDocumentNode` type parameter list omits the second argument per
`AGENTS.md` → "No-arg queries: omit the second type parameter". The codegen
still emits a `*MutationVariables = Exact<{ [key: string]: never; }>` type
for consistency, but consumers don't need to pass it.

## Carry-Forward Knowledge

### For Task 4 (appearancePreviewStore — Zustand)
- The store's `draft` shape should use the codegen `AppearanceDraftInput` type from `@/frontend/common/graphql/generated/gql/graphql` (per `frontend/common/stores/AGENTS.md`). Import path:
  ```ts
  import type { AppearanceDraftInput } from "@/frontend/common/graphql/generated/gql/graphql";
  ```
- The store can call `saveAppearanceDraftMutationDocument` directly with the draft — the resolver (Task 2.4) handles `logoUrl: undefined → null` normalization and `defaultColorScheme: string → PaletteMode` coercion.
- Import the mutation document via the barrel:
  ```ts
  import { saveAppearanceDraftMutationDocument } from "@/frontend/common/graphql/sharedDocuments";
  ```

### For Task 5 (Settings Appearance tab + customizer UI)
- Use `appearanceSettingsQueryDocument` with `variables: { draft: true }` to fetch the row (requires `SETTINGS_APPEARANCE_MANAGE`).
- Use `useQuery(appearanceSettingsQueryDocument, { variables: { draft: true } })` — **do NOT use `useLazyQuery`** (banned per `sharedDocuments/AGENTS.md`).
- After `saveAppearanceDraft` / `publishAppearance` / `resetAppearanceDraft`, Apollo will auto-update the cache because all operations share the same `id`-normalized `AppearanceSettings` entity.
- For the customizer form, derive the local edit state from `data.appearanceSettings.draftFields` (an `AppearanceSettingsFieldsSelectionFragment_draftFields` shape).

### For Task 6 (Customize overlay)
- `publishAppearanceMutationDocument` and `resetAppearanceDraftMutationDocument` have no variables — call `useMutation(publishAppearanceMutationDocument)` directly.
- The `AppearanceSettingsQuery_appearanceSettings` type has all fields nullable (the schema SDL marks them nullable because the Pothos `expose*` calls defer to the underlying TS return type's nullability, and the service return type `AppearanceSettingsReturnType` permits nulls). Consumers should null-guard or use the `draftFields` sub-tree which mirrors the same shape.

### For Task 10.2 (GraphQL integration tests)
- The `testClient` can import the `*Document` constants directly from `@/frontend/common/graphql/sharedDocuments` to exercise the operations end-to-end.
- Test the `draft: true` vs `draft: false` permission escalation by passing different variables to `appearanceSettingsQueryDocument`.

### Follow-up — field nullability in SDL

The SDL currently marks all `AppearanceSettings` / `AppearanceFields` fields
as nullable (e.g., `id: String`, `siteName: String`), even though the DB
schema (Task 2) declares them `NOT NULL`. This is because the Pothos
`AppearanceSettingsPothosObject` uses `t.exposeString("siteName")` etc.,
which inherits nullability from the underlying TypeScript return type
`AppearanceSettingsReturnType` (where fields are `string | null`).

This does not block any downstream task — the frontend types correctly
reflect `string | null` and consumers should null-guard. But if stricter
non-null types are desired later, a follow-up could either:
1. Tighten the `AppearanceSettingsReturnType` field types (require service-level non-null guarantees), OR
2. Use `t.exposeString("siteName", { nullable: false })` in the Pothos object (will fail typecheck if the underlying type permits null — option 1 is the prerequisite).

This is the same family of follow-ups as the `PaletteMode` enum migration
noted in Task 2.4's outcome. Both can be batched into a single follow-up
task if desired.

## Cross-File Dependencies Discovered

- Depends on Task 2.4 (Pothos resolvers) — without the `appearanceSettings` query and 3 mutations in the schema, the documents file would fail codegen validation.
- Depends on Task 1 (`SETTINGS_APPEARANCE_MANAGE` enum value) — the enum value flows from `backend/enum/permissions/permission.enum.ts` → Pothos `AppPermission` enum → SDL → TS `AppPermission` enum in `graphql.ts`. Verified at line 193.
- Enables Task 4 (preview store can import `AppearanceDraftInput` + `saveAppearanceDraftMutationDocument`).
- Enables Task 5 (tab can import `appearanceSettingsQueryDocument` + the mutation documents).
- Enables Task 10.2 (GraphQL integration tests can import the documents for the test client).

## Issues Encountered

- **Codegen emitted only enum value, not operation types, on first pass**: as described above, the codegen config requires operation documents to surface operation-derived types. Created `site-appearance-settings.documents.ts` to fix. This was not explicitly called out in `tasks.md` task 3 (which only said "run codegen + verify"), but was necessary to satisfy the verification step ("query/mutation documents exist in `frontend/common/graphql/generated/`"). The carry-forward note from Task 2.4 had assumed the types would be generated automatically; this was a faulty assumption.
- **No other issues**: no TypeScript errors, no lint errors, no codescene warnings. The new documents file passed all 6 sub-loop checks on the first run.

## AC Coverage

- **AC-3** (frontend `AppPermission.SettingsAppearanceManage` enum value exists for type-safe permission checks) — ✅ enum value generated at `graphql.ts:193`. The `appearanceSettings` query + 3 mutations + their typed documents are also available for the tab/overlay to consume.

## Files NOT Modified

- No backend files touched. Task 2 / 2.1 / 2.2 / 2.3 / 2.4 already produced the schema/types/repo/service/pothos resolvers; this task only ran the codegen against them.
- No existing frontend files modified except the `settings/index.ts` barrel (single new `export *` line).
- The `schema.graphql` and `gql/graphql.ts` files are regenerated artifacts — they are not hand-edited.
