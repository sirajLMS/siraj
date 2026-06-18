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

5. **Handling Query Errors & Non-Null Checks**:
   - Since the test client is configured with `errorPolicy: "all"`, GraphQL errors (like unauthorized access) do not throw. Instead, assert against the `result.error` property (type `ApolloError | undefined`) rather than `result.errors`.
   - Always verify that target query properties (e.g., `result.data?.teachers`) are defined and not null before performing assertions on them, to satisfy TypeScript's strict null checking. Use guards (e.g., `if (!teachers) throw new Error("...")`) to narrow the type cleanly.

6. **Align Test Data with Shared Constants**:
   - Avoid hardcoding search strings or expected names (e.g., `"Default Teacher"`). Instead, import the shared demo users definition from `@/shared/demo-users` (e.g., `teachers as demoTeachers`) and use these values dynamically in both search parameters and assertions to ensure test and database seed consistency.

7. **Optional Chaining Preference (Linter & TS Compliance)**:
   - Prefer optional chain expressions (`?.`) over verbose logical checks. Avoid code structures like `if (!result.data || !result.data.field)`. Instead, use `if (!result.data?.field)`. This complies with the `@typescript-eslint/prefer-optional-chain` lint rule.

8. **Test Duplication Prevention (SonarQube Compliance)**:
   - Never duplicate standard test setup routines—such as demo user login mutations or querying/extracting basic database entities (e.g., matching student/teacher ID pairs)—across multiple test files.
   - Centralize all reusable test logic in a shared helpers file (e.g., [helpers.ts](file:///C:/Users/PC/Projects/siraj/frontend/graphql/test/helpers.ts)) using helper functions like `loginDemoUser(groupSlug)` and `fetchFirstStudentTeacherPair(adminToken, date)`.

9. **Large Method Remediation (CodeScene Compliance)**:
   - Keep helper functions and database seeders modular and concise. If a function or seeder (such as `seedOrGet` in `seed-students.ts`) exceeds ~70–80 lines, refactor it by extracting distinct steps into smaller helper functions (e.g., `upsertStudent(...)`, `ensureTeacherAssignments(...)`).

10. **Strict Interface Layer Separation**:
    - Integration tests under `frontend/graphql/test/` must interact with the application *exclusively* via the GraphQL API (using `testClient`). Under no circumstances should backend repositories (`db/repo/`), drizzle schemas directly (other than for checking in seed files), or service layers (`backend/services/`) be imported or invoked directly inside integration test files.

