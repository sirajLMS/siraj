# Frontend GraphQL & Apollo Layer Rules

- **Typed Documents**: Always write queries/mutations in `.documents.ts` files using `gql` and `TypedDocumentNode`.
- **Code Generation**: Whenever you modify backend GraphQL schemas or frontend `.documents.ts` files, you MUST run `bun run generate:gqlSchema` and `bun codegen` to update the generated Typescript types.
- **Auto Cache Updates**: All queries and mutations MUST include the `id` field for objects so that Apollo Client automatically caches and updates them.
- **NO Lazy Queries**: Do NOT use `useLazyQuery`. It is banned in this project. Use stateful `useQuery` exclusively, which automatically tracks data, loading, and error states.
- **Imports**: Always import Apollo hooks from `"@apollo/client/react"` (e.g., `import { useQuery, useApolloClient } from "@apollo/client/react";`).

---

## GraphQL Integration Testing Guidelines

When writing integration tests for GraphQL queries/mutations under `frontend/graphql/test/`, adhere strictly to these rules:

1. **Next.js Server Lifecycle Management**:
   - Import the reusable dev server setup lifecycle helper from `lifecycle.ts` and call it at the root of your `describe` block:
     ```typescript
     import { setupTestServerLifecycle } from "./lifecycle";

     describe("My GraphQL Tests", () => {
       setupTestServerLifecycle();
       // ...
     });
     ```
   - This automatically handles hooking into Bun's `beforeAll` and `afterAll` lifecycles to spawn the Next.js dev server on port 3001, poll until ready, and kill the process cleanly upon test suite completion. The process logic itself is defined separately in `testServer.ts`.

2. **Apollo Shared Client**:
   - Import the shared, cache-disabled test client from `testClient.ts` to perform all GraphQL operations:
     ```typescript
     import { testClient } from "./testClient";
     ```

3. **Type-Safe GraphQL Execution**:
   - Do **NOT** write raw string queries in tests or use raw HTTP `fetch` POST requests.
   - Define queries as `TypedDocumentNode` in `frontend/graphql/sharedDocuments/` files, run `bun run generate:gqlSchema` and `bun codegen`, and pass the imported document node directly to the query call:
     ```typescript
     const result = await testClient.query({
       query: welcomeMessageQueryDocument,
     });
     ```

4. **Dynamic Header & Locale Testing**:
   - Dynamically change headers (such as `Accept-Language` or cookie authentication values) on a per-query basis using Apollo's request context:
     ```typescript
     const result = await testClient.query({
       query: welcomeMessageQueryDocument,
       context: {
         headers: {
           "Accept-Language": "en",
           "Cookie": "NEXT_LOCALE=en",
         },
       },
     });
     ```
