# Frontend GraphQL & Apollo Layer Rules

## Framework
- We use Apollo Client with GraphQL for data fetching and state management on the frontend.
- Generated types are created using GraphQL Code Generator and stored in `frontend/common/graphql/generated/gql/`.

## Document Organization
- GraphQL documents (queries, mutations, subscriptions) are organized by domain in `frontend/common/graphql/sharedDocuments/`
- Each domain has its own file named `<domain>.documents.ts` (e.g., `auth.documents.ts`, `schedule.documents.ts`)
- All documents are exported from `frontend/common/graphql/sharedDocuments/index.ts`

## Type Safety
- All GraphQL operations must be strongly typed using generated types from `frontend/common/graphql/generated/gql/graphql`
- Use `TypedDocumentNode` with proper typing: `TypedDocumentNode<{EntityName}Query, {EntityName}QueryVariables>`
- All types (operation results, variables, enums, extracted field types) live in the single `graphql.ts` file
- No schema-level object types are generated — only operation-derived types (the docs say "Object types should never be used")
- Follow the standardized naming convention for document constants as outlined in `frontend/common/graphql/sharedDocuments/AGENTS.md`

## Code Generation
- After modifying any GraphQL documents or backend schema, run:
  ```bash
  bun run generate:gqlSchema
  bun codegen
  ```
- This regenerates all typed operations and types for consistent frontend-backend integration

## Apollo Client Usage
- Use the shared Apollo Client instance configured in `frontend/common/graphql/`
- Import Apollo hooks from `"@apollo/client/react"` (e.g., `import { useQuery, useApolloClient } from "@apollo/client/react";`)
- Include `id` fields in all query selections for proper Apollo cache normalization
- Avoid `useLazyQuery` - use stateful `useQuery` exclusively for consistent loading/error state management

## Integration Testing
- GraphQL integration tests are located in `frontend/common/graphql/test/`
- Follow the testing rules documented in `frontend/common/graphql/test/AGENTS.md`
- Use the shared test client and lifecycle management for proper test execution

## Document Structure
- Organize queries and mutations by functional domain
- Use descriptive names that align with backend GraphQL operations
- Maintain consistency with backend naming patterns for easier maintenance

## Type Usage Patterns

### Positive Pattern (Required):
- Use generated types from the single `graphql.ts` file: `{EntityName}Query`, `{EntityName}QueryVariables`, `{EntityName}Mutation`, `{EntityName}MutationVariables`
- For extracted field types (nested object selections), use the compact naming convention: `{OperationName}_{field}_{subField}` (e.g., `MeQuery_me`, `QuotaQuery_quota`, `GroupClassAuditQuery_groupClassAudit_adminNote`)
- Follow the standardized naming convention for document constants: `<entityName>QueryDocument`, `<entityName>MutationDocument`
- Apply consistent patterns across all entities without creating ad-hoc type definitions

### Negative Pattern (Prohibited):
- Creating custom inline type definitions instead of using generated types
- Defining custom types that duplicate the functionality of generated operations
- Hardcoding type names instead of following the established naming patterns
- Importing from `graphql-types.ts` or `operations.ts` — these files no longer exist; all types are in `graphql.ts`
- **Type mapping functions** — no intermediate conversion layers between types. Use codegen types directly.
- **Indexed-access type workarounds** — no `NonNullable<MeQuery["me"]>`. Use the named extracted type (e.g., `MeQuery_me`).
- **Schema-level object types** — no `User`, `Quota`, etc. Only operation-derived types from `graphql.ts`.

### Example of Proper Pattern:
```typescript
// Import from the single graphql.ts file
import type { EntityNameQuery, EntityNameQueryVariables } from "@/frontend/common/graphql/generated/gql/graphql";

const entityNameQueryDocument = gql`
  query EntityName($id: String!) {
    entityName(id: $id) {
      id
      # ... other fields
    }
  }
` as TypedDocumentNode<EntityNameQuery, EntityNameQueryVariables>;

// Or for mutations
import type { EntityNameMutation, EntityNameMutationVariables } from "@/frontend/common/graphql/generated/gql/graphql";

const entityNameMutationDocument = gql`
  mutation EntityName($input: EntityNameInput!) {
    entityName(input: $input) {
      id
      # ... other fields
    }
  }
` as TypedDocumentNode<EntityNameMutation, EntityNameMutationVariables>;

## Linting Rules

- See `docs/quality/linting-rules.md` for Oxlint & ESLint/sonarjs fix recipes. NEVER use `oxlint-disable` comments.

