# GraphQL Integration Testing Rules

Integration tests for GraphQL queries/mutations under `frontend/graphql/test/` must adhere strictly to these rules:

## Layout

Tests are organized **by domain** into sub-directories mirroring the `frontend/graphql/sharedDocuments/` taxonomy. Shared infrastructure files stay at the top level:

```
frontend/graphql/test/
├── AGENTS.md             ← this file
├── helpers.ts            ← shared test helpers (loginAndProvision, authenticatedRequest, etc.)
├── lifecycle.ts          ← setupTestServerLifecycle
├── testClient.ts         ← Apollo test client + clearCookies
├── testPort.ts           ← dynamic port allocation + URL helpers
├── testServer.ts         ← Next.js dev server spawn/kill (used by lifecycle.ts)
│
├── auth/                 auth, impersonation
├── billing/              billing-management, payment-method
├── classes/              group-class, class-instance-detail, class-session
├── complaints/           complaint
├── meeting/              meeting-config
├── notifications/        notification-preferences
├── parents/              parent, parent-onboarding, parent-portal
├── permissions/          permission-group-simulation
├── profile/              profile
├── reports/              report
├── resources/            learning-resource-graphql
├── scheduling/           schedule
├── students/             student-directory-graphql, student-history, student-lifecycle, student-onboarding, status-tracking
├── suggestions/          suggestion
├── teachers/             teacher, teacher-dashboard, teacher-onboarding, teacher-portal, manager-directory-graphql, manager-onboarding
└── translations/         translation
```

### Infra files (MUST stay flat)

The infra files `helpers.ts`, `lifecycle.ts`, `testClient.ts`, `testPort.ts`, and `testServer.ts` MUST stay flat at `frontend/graphql/test/`. They form the shared harness imported by virtually every test; moving them into a sub-directory would break the alias `@/frontend/graphql/test/<infra>` used across all tests.

### No `index.ts` barrels in sub-directories

Sub-directories contain only `*.test.ts` files. They are NOT imported by anything outside this directory — the bun test runner discovers tests by glob (`frontend/graphql/test/**/*.test.ts`), so **no `index.ts` barrel is needed** in sub-directories. They exist purely for organization.

### Import conventions for test files

| Target | Recommended import pattern | Notes |
|---|---|---|
| `helpers.ts` | `import { loginAndProvision } from "@/frontend/graphql/test/helpers";` | **Preferred alias** — works from any sub-directory unchanged. |
| `lifecycle.ts` | `import { setupTestServerLifecycle } from "@/frontend/graphql/test/lifecycle";` | **Preferred alias** — works from any sub-directory unchanged. |
| `testClient.ts` | `import { testClient, clearCookies, getTestApiUrl } from "@/frontend/graphql/test/testClient";` | **Preferred alias** — works from any sub-directory unchanged. |
| `testPort.ts` | `import { getTestBaseUrl, getTestGraphqlUrl } from "@/frontend/graphql/test/testPort";` | Use for non-GraphQL REST endpoints or E2E `baseURL`. |
| Documents | `import { fooQueryDocument } from "@/frontend/graphql/sharedDocuments/<subdir>/foo.documents";` | Always use the full deep alias, including the `sharedDocuments` sub-directory segment. See `frontend/graphql/sharedDocuments/AGENTS.md`. |
| Generated types | `import { … } from "@/frontend/graphql/generated/gql/graphql-types";` or `Operations` | Unchanged. |
| Relative `../helpers` etc. | `import { … } from "../helpers";` | Tolerated in legacy files. Files in a sub-directory are one level deeper than the old flat layout, so infra resolves as `../helpers` / `../lifecycle` / `../testClient`. Prefer the `@/` alias for new tests. |

When adding a **new** test:
1. Identify the matching sub-directory (or create a new one following the conventions above).
2. Create `<scenario>.test.ts` in that sub-directory.
3. Use the alias form `@/frontend/graphql/test/(helpers|lifecycle|testClient)` — it keeps the test portable across sub-directory moves.
4. If a new sub-directory is created, document it under **Layout** above.
5. Run `bun tsgo` and `bun biome:check` on the new file before considering it done.

---

1. **Next.js Server Lifecycle Management**:
   - Import the reusable dev server setup lifecycle helper from `lifecycle.ts` and call it at the root of your `describe` block:
     ```typescript
     import { setupTestServerLifecycle } from "@/frontend/graphql/test/lifecycle";

     describe("My GraphQL Tests", () => {
       setupTestServerLifecycle();
       // ...
     });
     ```
   - This automatically handles hooking into Bun's `beforeAll` and `afterAll` lifecycles to spawn the Next.js dev server on a **dynamically allocated port** (prefers `3001` when free, otherwise scans `3020–3199`), poll until ready, and kill only this process's server tree upon test suite completion. Each run uses an isolated `NEXT_DIST_DIR` (`.next-test-<port>`) so multiple agents can run tests concurrently without port or build-lock conflicts.
   - Optional env override: `GRAPHQL_TEST_PORT=<port>` pins the port for debugging. The harness does **not** kill existing listeners on startup.
   - For REST endpoints outside GraphQL (e.g. storage upload), use `getTestApiUrl("/api/...")` from `testClient.ts` or `testPort.ts` — never hardcode `localhost:3001`.
   - The process logic itself is defined separately in `testServer.ts` and `testPort.ts`.

2. **Apollo Shared Client**:
   - Import the shared, cache-disabled test client from `testClient.ts` to perform all GraphQL operations:
     ```typescript
     import { testClient } from "@/frontend/graphql/test/testClient";
     ```

3. **Type-Safe GraphQL Execution**:
   - Do **NOT** write raw string queries in tests or use raw HTTP `fetch` POST requests.
   - Define queries as `TypedDocumentNode` in `frontend/graphql/sharedDocuments/<subdir>/` files, run `bun run generate:gqlSchema` and `bun codegen`, and pass the imported document node directly to the query call:
     ```typescript
     const result = await testClient.query({
       query: {entityName}QueryDocument,
     });
     ```

4. **Dynamic Header & Locale Testing**:
   - Dynamically change headers (such as `Accept-Language` or cookie authentication values) on a per-query basis using Apollo's request context:
     ```typescript
     const result = await testClient.query({
       query: {entityName}QueryDocument,
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

6. **Align Test Data with Provisioned Entities**:
   - Avoid hardcoding search strings or expected names (e.g., `"Default Teacher"`). Instead, use provisioned test entity names via `loginAndProvision(prefix)` from `helpers.ts` — the prefix argument is injected into entity names (e.g., `"TeacherTest"` → teacher named `"TeacherTest Teacher"`). Use these names in both search parameters and assertions. For super_admin-only operations, use `provisionTestSuperAdmin(adminToken, prefix)`.
   - Never import from `@/shared/demo-users` in integration tests — all test data should be provisioned via `loginAndProvision` or `provisionTestEntities`.

7. **Optional Chaining Preference (Linter & TS Compliance)**:
   - Prefer optional chain expressions (`?.`) over verbose logical checks. Avoid code structures like `if (!result.data || !result.data.field)`. Instead, use `if (!result.data?.field)`. This complies with the `@typescript-eslint/prefer-optional-chain` lint rule.

8. **Test Duplication Prevention (SonarQube Compliance)**:
   - Never duplicate standard test setup routines—such as demo user login mutations or querying/extracting basic database entities (e.g., matching student/teacher ID pairs)—across multiple test files.
   - Centralize all reusable test logic in the shared helpers file at `frontend/graphql/test/helpers.ts`.
   - Use `authenticatedRequest` from `helpers.ts` when performing authenticated queries/mutations in tests instead of manually setting authorization headers and assertions on each call.

9. **Large Method Remediation (CodeScene Compliance)**:
   - Keep helper functions and database seeders modular and concise. If a function or seeder (such as `seedOrGet` in `seed-students.ts`) exceeds ~70–80 lines, refactor it by extracting distinct steps into smaller helper functions (e.g., `upsertStudent(...)`, `ensureTeacherAssignments(...)`).

10. **Strict Interface Layer Separation**:
    - Integration tests under `frontend/graphql/test/` must interact with the application *exclusively* via the GraphQL API (using `testClient`). Under no circumstances should backend repositories (`db/repo/`), drizzle schemas directly (other than for checking in seed files), or service layers (`backend/services/`) be imported or invoked directly inside integration test files.
