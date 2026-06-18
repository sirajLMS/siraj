# Shared GraphQL Documents Rules

## File Naming
- One file per domain: `<domain>.documents.ts` (e.g., `auth.documents.ts`, `schedule.documents.ts`)
- Export all documents from `index.ts`

## Import Pattern
Always import from `"@apollo/client"` — **never** from `"@apollo/client/core"`:

```ts
import { gql, type TypedDocumentNode } from "@apollo/client";
import type * as Types from "@/frontend/graphql/generated/gql/graphql-types";
import type * as Operations from "@/frontend/graphql/generated/gql/operations";
```

## TypedDocumentNode Convention
The naming follows a strict, predictable pattern derived from the operation name:

| Operation | Const name | TypedDocumentNode type |
|---|---|---|
| `query classInstance` | `classInstanceQueryDocument` | `TypedDocumentNode<Operations.ClassInstanceQuery, Types.QueryClassInstanceArgs>` |
| `query teacherDashboard` | `teacherDashboardQueryDocument` | `TypedDocumentNode<Operations.TeacherDashboardQuery, Types.QueryTeacherDashboardArgs>` |
| `mutation activateClass` | `activateClassMutationDocument` | `TypedDocumentNode<Operations.ActivateClassMutation, Types.MutationActivateClassArgs>` |
| `mutation logTeacherSupportRequest` | `logTeacherSupportRequestMutationDocument` | `TypedDocumentNode<Operations.LogTeacherSupportRequestMutation, Types.MutationLogTeacherSupportRequestArgs>` |

**Rules:**
- Query const: `<camelCaseName>QueryDocument` → `TypedDocumentNode<Operations.<PascalCaseName>Query, Types.Query<PascalCaseName>Args>`
- Mutation const: `<camelCaseName>MutationDocument` → `TypedDocumentNode<Operations.<PascalCaseName>Mutation, Types.Mutation<PascalCaseName>Args>`
- No-arg queries (e.g., `teacherHandbookUrl`): omit the second type parameter → `TypedDocumentNode<Operations.TeacherHandbookUrlQuery>`
- These types are **always** available after `bun run generate:gqlSchema && bun codegen` — **never** use inline type literals

## Codegen
After modifying any `.documents.ts` file or any backend schema/pothos file, always run:
```bash
~/.bun/bin/bun run generate:gqlSchema
~/.bun/bin/bun codegen
```

## `id` Field Requirement
Every query/mutation selection set **must** include the `id` field on every named object type so Apollo Client can auto-update its cache.
