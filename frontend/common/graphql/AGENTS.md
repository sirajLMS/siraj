# Frontend GraphQL & Apollo Layer Rules

## Framework
- We use Apollo Client with GraphQL for data fetching and state management on the frontend.
- Generated types are created using GraphQL Code Generator and stored in `frontend/graphql/generated/gql/`.

## Document Organization
- GraphQL documents (queries, mutations, subscriptions) are organized by domain in `frontend/graphql/sharedDocuments/`
- Each domain has its own file named `<domain>.documents.ts` (e.g., `auth.documents.ts`, `schedule.documents.ts`)
- All documents are exported from `frontend/graphql/sharedDocuments/index.ts`

## Type Safety
- All GraphQL operations must be strongly typed using generated types from `frontend/graphql/generated/gql/`
- Use `TypedDocumentNode` with proper typing: `TypedDocumentNode<Operations.QueryType, Types.QueryArgsType>`
- Follow the standardized naming convention for document constants as outlined in `frontend/graphql/sharedDocuments/AGENTS.md`

## Code Generation
- After modifying any GraphQL documents or backend schema, run:
  ```bash
  bun run generate:gqlSchema
  bun codegen
  ```
- This regenerates all typed operations and types for consistent frontend-backend integration

## Apollo Client Usage
- Use the shared Apollo Client instance configured in `frontend/graphql/`
- Import Apollo hooks from `"@apollo/client/react"` (e.g., `import { useQuery, useApolloClient } from "@apollo/client/react";`)
- Include `id` fields in all query selections for proper Apollo cache normalization
- Avoid `useLazyQuery` - use stateful `useQuery` exclusively for consistent loading/error state management

## Integration Testing
- GraphQL integration tests are located in `frontend/graphql/test/`
- Follow the testing rules documented in `frontend/graphql/test/AGENTS.md`
- Use the shared test client and lifecycle management for proper test execution

## Document Structure
- Organize queries and mutations by functional domain
- Use descriptive names that align with backend GraphQL operations
- Maintain consistency with backend naming patterns for easier maintenance

## Type Usage Patterns

### Positive Pattern (Required):
- Use generated types from the backend with generic patterns: `Operations.{Entity}Query`, `Types.Query{Entity}Args`
- Follow the standardized naming convention for document constants generically: `<entityName>QueryDocument`, `<entityName>MutationDocument`
- Apply consistent patterns across all entities without creating ad-hoc type definitions

### Negative Pattern (Prohibited):
- Creating custom inline type definitions instead of using generated types
- Defining custom types that duplicate the functionality of generated operations
- Hardcoding type names instead of following the established naming patterns

### Example of Proper Pattern:
```typescript
// Use generic naming patterns that apply to any entity
const {entityName}QueryDocument = gql`
  query {EntityName}($id: String!) {
    {entityName}(id: $id) {
      id
      # ... other fields
    }
  }
` as TypedDocumentNode<Operations.{EntityName}Query, Types.Query{EntityName}Args>;

// Or for mutations
const {entityName}MutationDocument = gql`
  mutation {EntityName}Mutation($input: {EntityName}Input!) {
    {entityName}(input: $input) {
      id
      # ... other fields
    }
  }
` as TypedDocumentNode<Operations.{EntityName}Mutation, Types.Mutation{EntityName}Args>;