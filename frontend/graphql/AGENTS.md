# Frontend GraphQL & Apollo Layer Rules

- **Typed Documents**: Always write queries/mutations in `.documents.ts` files using `gql` and `TypedDocumentNode`.
- **Code Generation**: Whenever you modify backend GraphQL schemas or frontend `.documents.ts` files, you MUST run `bun run generate:gqlSchema` and `bun codegen` to update the generated Typescript types.
- **Auto Cache Updates**: All queries and mutations MUST include the `id` field for objects so that Apollo Client automatically caches and updates them.
- **NO Lazy Queries**: Do NOT use `useLazyQuery`. It is banned in this project. Use stateful `useQuery` exclusively, which automatically tracks data, loading, and error states.
- **Imports**: Always import Apollo hooks from `"@apollo/client/react"` (e.g., `import { useQuery, useApolloClient } from "@apollo/client/react";`).
