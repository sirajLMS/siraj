# Shared GraphQL Documents Rules

## Layout

GraphQL documents are organized **by domain** into sub-directories, each with an `index.ts` barrel that re-exports its `.documents.ts` files. The top-level `index.ts` re-exports all sub-directory barrels.

### Barrel pattern

Each sub-directory has an `index.ts` that re-exports its documents:

```ts
export * from "./schedule.documents";
export * from "./weekly-schedule.documents";
// ...
```

The top-level `index.ts` re-exports sub-directory barrels:

```ts
export * from "./scheduling";
export * from "./teachers";
// ...
```

### Consumer import conventions

| Use case | Import pattern |
|---|---|
| **Preferred** (barrel) | `import { fooQueryDocument } from "@/frontend/common/graphql/sharedDocuments";` |
| **Deep import** (also valid) | `import { fooQueryDocument } from "@/frontend/common/graphql/sharedDocuments/<subdir>/foo.documents";` |
| **Never** (flat path) | `import { … } from "@/frontend/common/graphql/sharedDocuments/foo.documents";` |

Both barrel and deep-import paths resolve to the same exports. Prefer the barrel (`@/frontend/common/graphql/sharedDocuments`) in views/hooks unless you need to avoid pulling in the full barrel tree.

When adding a **new** document file:
1. Create `<domain>.documents.ts` in the matching sub-directory.
2. Add `export * from "./<domain>.documents";` to that sub-directory's `index.ts`.
3. Ensure the sub-directory is exported from the top-level `index.ts` (add `export * from "./<subdir>";` if it's a new sub-directory).
4. Run `bun run generate:gqlSchema && bun codegen`.

## File Naming
- One file per domain: `<domain>.documents.ts` (e.g., `auth.documents.ts`, `schedule.documents.ts`)
- Place files in the matching sub-directory; export all documents from the top-level `index.ts` via sub-directory barrels.

## Import Pattern
Always import from `"@apollo/client"` — **never** from `"@apollo/client/core"`:

```ts
import { gql, type TypedDocumentNode } from "@apollo/client";
import type { EntityNameQuery, EntityNameQueryVariables } from "@/frontend/common/graphql/generated/gql/graphql";
```

All types (operation results, variables, enums, extracted field types, inputs) live in the single `graphql.ts` file.

## TypedDocumentNode Convention
The naming follows a strict, predictable pattern derived from the operation name:

| Operation | Const name | TypedDocumentNode type |
|---|---|---|
| `query <entityName>` | `{entityName}QueryDocument` | `TypedDocumentNode<{EntityName}Query, {EntityName}QueryVariables>` |
| `mutation <entityName>` | `{entityName}MutationDocument` | `TypedDocumentNode<{EntityName}Mutation, {EntityName}MutationVariables>` |

**Rules:**
- Query const: `<camelCaseName>QueryDocument` → `TypedDocumentNode<{PascalCaseName}Query, {PascalCaseName}QueryVariables>`
- Mutation const: `<camelCaseName>MutationDocument` → `TypedDocumentNode<{PascalCaseName}Mutation, {PascalCaseName}MutationVariables>`
- No-arg queries: omit the second type parameter → `TypedDocumentNode<{EntityName}Query>`
- These types are **always** available after `bun run generate:gqlSchema && bun codegen` — **never** use inline type literals
- For nested field types, use compact extracted names: `{OperationName}_{field}` (e.g., `MeQuery_me`)
- **NO MAPPING**: No type mapping functions, no intermediate conversion layers, no indexed-access workarounds (e.g., `NonNullable<MeQuery["me"]>`). Use the exact codegen-generated type name directly.
- **NO SCHEMA TYPES**: No schema-level object types. Only operation-derived types from `graphql.ts`.

## Codegen
After modifying any `.documents.ts` file or any backend schema/pothos file, always run:
```bash
~/.bun/bin/bun run generate:gqlSchema
~/.bun/bin/bun codegen
```

## `id` Field Requirement
Every query/mutation selection set **must** include the `id` field on every named object type so Apollo Client can auto-update its cache.

## Frontend Client Queries and Hook Usage
- **NO Lazy Queries**: Do NOT use `useLazyQuery`. It is banned in this project. Use stateful `useQuery` exclusively, which automatically tracks data, loading, and error states.
- **Imports**: Always import Apollo hooks from `"@apollo/client/react"` (e.g., `import { useQuery, useApolloClient } from "@apollo/client/react";`).

## Linting Rules

- NEVER use `oxlint-disable` comments — fix the root cause instead.
