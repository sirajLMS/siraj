# GraphQL Integration Testing Rules

Integration tests for GraphQL queries/mutations under `frontend/common/graphql/test/` must adhere strictly to these rules:

## Layout

Tests are organized **by domain** into sub-directories mirroring the `frontend/common/graphql/sharedDocuments/` taxonomy. Shared infrastructure files live in the root `test/helpers/` directory and are all exported via the `@/test/helpers` barrel.

### Import conventions for test files

| Target | Recommended import pattern | Notes |
|---|---|---|
| Test Helpers & Lifecycle | `import { setupTestServerLifecycle, loginAndProvision, testClient } from "@/test/helpers";` | **Preferred alias** — canonical shared test helpers. |
| Documents | `import { fooQueryDocument } from "@/frontend/common/graphql/sharedDocuments/<subdir>/foo.documents";` | Always use the full deep alias, including the `sharedDocuments` sub-directory segment. See `frontend/common/graphql/sharedDocuments/AGENTS.md`. |
| Generated types & enums | `import { … } from "@/frontend/common/graphql/generated/gql/graphql";` | Single file — all types and enums. Never hardcode enum string literals (see rule 7). |

When adding a **new** test:
1. Identify the matching sub-directory (or create a new one following the conventions above).
2. Create `<scenario>.test.ts` in that sub-directory.
3. Import shared helpers from `@/test/helpers`.
4. For mutations: look up `Mutation<Name>Args` in generated types and pass ALL args (required + optional) as `variables` — see rule 7.
5. Run `bun tsgo` and `bun biome:check` on the new file before considering it done.

---

1. **Next.js Server Lifecycle Management**:
   - Import the reusable dev server setup lifecycle helper and call it at the root of your `describe` block:
     ```typescript
     import { setupTestServerLifecycle } from "@/test/helpers";

     describe("My GraphQL Tests", () => {
       setupTestServerLifecycle();
       // ...
     });
     ```
   - This handles hooking into Bun's `beforeAll`/`afterAll` to spawn the Next.js dev server on the fixed test port (`3066`) using `.next-dev`, poll until ready, and kill only this process's server tree on suite completion.
   - Optional env override: `GRAPHQL_TEST_PORT=<port>` pins the port for debugging.
   - For REST endpoints outside GraphQL (e.g. storage upload), use `getTestApiUrl("/api/...")` — never hardcode port numbers.

2. **Apollo Shared Client**:
   - Use the shared, cache-disabled test client (`testClient` from `@/test/helpers`) to perform all GraphQL operations.

3. **Type-Safe GraphQL Execution**:
   - Do **NOT** write raw string queries in tests or use raw HTTP `fetch` POST requests.
   - Define queries as `TypedDocumentNode` in `frontend/common/graphql/sharedDocuments/<subdir>/` files, run `bun run generate:gqlSchema` and `bun codegen`, and pass the imported document node directly to the query call.

4. **Dynamic Header & Locale Testing**:
   - Dynamically change headers (such as `Accept-Language` or cookie authentication values) on a per-query basis using Apollo's request `context.headers`.

5. **Handling Query Errors & Non-Null Checks**:
   - Since the test client is configured with `errorPolicy: "all"`, GraphQL errors (like unauthorized access) do not throw. Assert against the `result.error` property (type `ApolloError | undefined`) rather than `result.errors`.
   - Always verify that target query properties (e.g., `result.data?.teachers`) are defined and not null before asserting on them. Use guards (e.g., `if (!teachers) throw new Error("...")`) to narrow the type cleanly.

6. **Align Test Data with Provisioned Entities**:
   - Avoid hardcoding search strings or expected names. Instead, use provisioned test entity names via `loginAndProvision(prefix)` — the prefix argument is injected into entity names. Use these names in both search parameters and assertions. For super_admin-only operations, use `provisionTestSuperAdmin(adminToken, prefix)`.
   - Never import from `@/shared/demo-users` in integration tests — all test data should be provisioned via `loginAndProvision` or `provisionTestEntities`.

7. **Mutation Argument Coverage (CRITICAL)**:
   - **Core Rule**: Every mutation call site MUST pass ALL input arguments (both required AND optional) as `variables` — no field may be silently omitted. Optional fields must explicitly appear as `null` even when not exercised by that call site.
   - **Discovering Arguments**: Look up the mutation's variables type in `frontend/common/graphql/generated/gql/graphql.ts` (search `{MutationName}Variables`). For `input` object mutations, also look up the input type and include ALL its fields. Fields without `InputMaybe` are required; fields with `InputMaybe` are optional.
   - **Testing Matrix**: For each optional field, have at least one test case with a meaningful non-null value (real enum values, realistic strings — never empty strings for required fields) and one with `null` explicitly.
   - **Enum Values**: Import and use generated enum values — never hardcode string literals.
   - **Nested Input Types**: For input objects containing nested input types, populate ALL fields at every nesting level.
   - **Builder Pattern**: For mutations with many optional fields, centralize variable construction in a typed builder helper that defaults optional fields to `null` and accepts `Partial<T>` overrides.
   - **Cleanup Guards**: When tests provision multiple entities used in cleanup mutations, guard against `null` IDs for ALL required arguments — a missing guard can silently pass an empty string into a required `String!` field.

8. **Test Duplication Prevention**:
   - Never duplicate standard test setup routines (login mutations, basic entity lookups) across multiple test files.
   - Centralize all reusable test logic in the shared helpers exported from `@/test/helpers`.
   - Use `authenticatedRequest` when performing authenticated queries/mutations instead of manually setting authorization headers and assertions on each call.

9. **Helper Size (CodeScene Compliance)**:
   - Keep helper functions modular and concise. If a helper or seeder exceeds ~70–80 lines, refactor by extracting distinct steps into smaller functions.

10. **Strict Interface Layer Separation**:
    - Integration tests under `frontend/common/graphql/test/` must interact with the application *exclusively* via the GraphQL API (using `testClient`). Under no circumstances should backend repositories (`db/repo/`), Drizzle schemas directly (other than in seed files), or service layers (`backend/services/`) be imported or invoked directly inside integration test files.

11. **Optional Chaining (Linter & TS Compliance)**:
    - Prefer optional chaining (`?.`) over verbose logical checks: use `if (!result.data?.field)` instead of `if (!result.data || !result.data.field)` (`@typescript-eslint/prefer-optional-chain`).

## Linting Rules

- NEVER use `oxlint-disable` comments — fix the root cause.
