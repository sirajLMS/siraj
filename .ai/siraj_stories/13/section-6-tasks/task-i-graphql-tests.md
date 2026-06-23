### Task I — GraphQL Tests: Verify User Provisioning API Authorization

**Objective:** Implement GraphQL integration tests for all new mutations and queries, verifying authorized success and unauthorized denial for each role.

**Dependencies:** Task H — types are extracted and available. Depends on existing GraphQL test infrastructure (`testServer.ts`, `testClient.ts`, `lifecycle.ts`, `helpers.ts`).

**Layer-Specific Rules (GraphQL Tests - Flattened from frontend/graphql/test/ patterns):**
- All tests use `bun:test` framework.
- Server lifecycle managed by `setupTestServerLifecycle()`.
- Authentication via `loginDemoUser()` helper with role group slugs.
- Authorized requests use `authenticatedRequest()` helper which auto-asserts success.
- Unauthorized requests manually check `result.error` is defined.
- All queries/mutations use `TypedDocumentNode` from shared documents — no raw string queries.
- Strict interface separation: NEVER import backend repos, Drizzle schemas, or services directly.

**Target Files:**
- `frontend/graphql/test/teacher-onboarding.test.ts` — New file
- `frontend/graphql/test/parent-onboarding.test.ts` — New file
- `frontend/graphql/test/manager-onboarding.test.ts` — New file

**Detailed Implementation Steps:**

*Step 1: Create teacher onboarding GraphQL tests*

Create `frontend/graphql/test/teacher-onboarding.test.ts`:

```typescript
import { describe, test, expect } from "bun:test";
import { setupTestServerLifecycle } from "./lifecycle";
import { loginDemoUser, authenticatedRequest, assertOperationDenied } from "./helpers";
import { createTeacherMutationDocument } from "@/frontend/graphql/sharedDocuments/teacher-onboarding.documents";

describe("Teacher Onboarding GraphQL API", () => {
  setupTestServerLifecycle();

  test("Academy Admin can create teacher", async () => {
    const token = await loginDemoUser("academy_admin");
    
    const data = await authenticatedRequest(
      token,
      "mutate",
      createTeacherMutationDocument,
      {
        input: {
          name: "GraphQL Test Teacher",
          email: `graphql_teacher_${Date.now()}@test.com`,
          password: "TestPassword123!",
          timezone: "America/New_York",
          nationality: "US",
          phone: "+1234567890",
          gender: "MALE",
          hourlyRate: "25.00",
          rateCurrency: "USD",
        },
      }
    );

    expect(data.createTeacher).toBeDefined();
    expect(data.createTeacher.userId).toBeDefined();
    expect(data.createTeacher.teacherId).toBeDefined();
    expect(data.createTeacher.name).toBe("GraphQL Test Teacher");
    expect(data.createTeacher.status).toBe("ACTIVATED");
  });

  test("Super Admin can create teacher", async () => {
    const token = await loginDemoUser("super_admin");
    
    const data = await authenticatedRequest(
      token,
      "mutate",
      createTeacherMutationDocument,
      {
        input: {
          name: "Super Admin Teacher",
          email: `super_teacher_${Date.now()}@test.com`,
          password: "TestPassword123!",
          timezone: "Europe/London",
        },
      }
    );

    expect(data.createTeacher).toBeDefined();
    expect(data.createTeacher.userId).toBeDefined();
  });

  test("Teacher denied creating teacher", async () => {
    await assertOperationDenied(
      "teacher_default",
      "mutate",
      createTeacherMutationDocument,
      {
        input: {
          name: "Should Fail",
          email: `fail_teacher_${Date.now()}@test.com`,
          password: "TestPassword123!",
          timezone: "UTC",
        },
      }
    );
  });

  test("Parent denied creating teacher", async () => {
    await assertOperationDenied(
      "parent_default",
      "mutate",
      createTeacherMutationDocument,
      {
        input: {
          name: "Should Fail",
          email: `fail_teacher2_${Date.now()}@test.com`,
          password: "TestPassword123!",
          timezone: "UTC",
        },
      }
    );
  });

  test("Unauthenticated denied creating teacher", async () => {
    const { testClient } = await import("./testClient");
    
    const result = await testClient.mutate({
      mutation: createTeacherMutationDocument,
      variables: {
        input: {
          name: "Unauth Teacher",
          email: `unauth_teacher_${Date.now()}@test.com`,
          password: "TestPassword123!",
          timezone: "UTC",
        },
      },
      errorPolicy: "all",
    });

    expect(result.errors).toBeDefined();
  });
});
```

*Step 2: Create parent onboarding GraphQL tests*

Create `frontend/graphql/test/parent-onboarding.test.ts`:

```typescript
import { describe, test, expect } from "bun:test";
import { setupTestServerLifecycle } from "./lifecycle";
import { loginDemoUser, authenticatedRequest, assertOperationDenied } from "./helpers";
import { createParentMutationDocument } from "@/frontend/graphql/sharedDocuments/parent-onboarding.documents";

describe("Parent Onboarding GraphQL API", () => {
  setupTestServerLifecycle();

  test("Academy Admin can create parent with billing", async () => {
    const token = await loginDemoUser("academy_admin");
    
    const data = await authenticatedRequest(
      token,
      "mutate",
      createParentMutationDocument,
      {
        input: {
          name: "GraphQL Test Parent",
          email: `graphql_parent_${Date.now()}@test.com`,
          password: "TestPassword123!",
          phone: "+1234567890",
          invoiceType: "MONTHLY",
          feeAmount: "500.00",
          paymentMethod: "BANK_ACCOUNT",
          currency: "USD",
          timezone: "America/Chicago",
        },
      }
    );

    expect(data.createParent).toBeDefined();
    expect(data.createParent.userId).toBeDefined();
    expect(data.createParent.parentId).toBeDefined();
    expect(data.createParent.invoiceType).toBe("MONTHLY");
    expect(data.createParent.currency).toBe("USD");
  });

  test("Super Admin can create parent", async () => {
    const token = await loginDemoUser("super_admin");
    
    const data = await authenticatedRequest(
      token,
      "mutate",
      createParentMutationDocument,
      {
        input: {
          name: "Super Admin Parent",
          email: `super_parent_${Date.now()}@test.com`,
          password: "TestPassword123!",
        },
      }
    );

    expect(data.createParent).toBeDefined();
  });

  test("Teacher denied creating parent", async () => {
    await assertOperationDenied(
      "teacher_default",
      "mutate",
      createParentMutationDocument,
      {
        input: {
          name: "Should Fail",
          email: `fail_parent_${Date.now()}@test.com`,
          password: "TestPassword123!",
        },
      }
    );
  });

  test("Unauthenticated denied creating parent", async () => {
    const { testClient } = await import("./testClient");
    
    const result = await testClient.mutate({
      mutation: createParentMutationDocument,
      variables: {
        input: {
          name: "Unauth Parent",
          email: `unauth_parent_${Date.now()}@test.com`,
          password: "TestPassword123!",
        },
      },
      errorPolicy: "all",
    });

    expect(result.errors).toBeDefined();
  });
});
```

*Step 3: Create manager onboarding GraphQL tests*

Create `frontend/graphql/test/manager-onboarding.test.ts`:

```typescript
import { describe, test, expect } from "bun:test";
import { setupTestServerLifecycle } from "./lifecycle";
import { loginDemoUser, authenticatedRequest, assertOperationDenied } from "./helpers";
import { createManagerMutationDocument } from "@/frontend/graphql/sharedDocuments/manager-onboarding.documents";

describe("Manager Onboarding GraphQL API", () => {
  setupTestServerLifecycle();

  test("Super Admin can create manager with admin type", async () => {
    const token = await loginDemoUser("super_admin");
    
    const data = await authenticatedRequest(
      token,
      "mutate",
      createManagerMutationDocument,
      {
        input: {
          name: "GraphQL Test Admin",
          email: `graphql_admin_${Date.now()}@test.com`,
          password: "TestPassword123!",
          accountType: "admin",
        },
      }
    );

    expect(data.createManager).toBeDefined();
    expect(data.createManager.userId).toBeDefined();
    expect(data.createManager.staffProfileId).toBeDefined();
    expect(data.createManager.assignedGroupSlug).toBe("academy_admin");
  });

  test("Super Admin can create manager with manager type", async () => {
    const token = await loginDemoUser("super_admin");
    
    const data = await authenticatedRequest(
      token,
      "mutate",
      createManagerMutationDocument,
      {
        input: {
          name: "GraphQL Test Manager",
          email: `graphql_manager_${Date.now()}@test.com`,
          password: "TestPassword123!",
          accountType: "manager",
        },
      }
    );

    expect(data.createManager).toBeDefined();
    expect(data.createManager.assignedGroupSlug).toBe("staff_default");
  });

  test("Academy Admin denied creating manager", async () => {
    await assertOperationDenied(
      "academy_admin",
      "mutate",
      createManagerMutationDocument,
      {
        input: {
          name: "Should Fail",
          email: `fail_manager_${Date.now()}@test.com`,
          password: "TestPassword123!",
          accountType: "manager",
        },
      }
    );
  });

  test("Teacher denied creating manager", async () => {
    await assertOperationDenied(
      "teacher_default",
      "mutate",
      createManagerMutationDocument,
      {
        input: {
          name: "Should Fail",
          email: `fail_manager2_${Date.now()}@test.com`,
          password: "TestPassword123!",
          accountType: "admin",
        },
      }
    );
  });

  test("Unauthenticated denied creating manager", async () => {
    const { testClient } = await import("./testClient");
    
    const result = await testClient.mutate({
      mutation: createManagerMutationDocument,
      variables: {
        input: {
          name: "Unauth Manager",
          email: `unauth_manager_${Date.now()}@test.com`,
          password: "TestPassword123!",
          accountType: "manager",
        },
      },
      errorPolicy: "all",
    });

    expect(result.errors).toBeDefined();
  });
});
```



```bash
bun run test:graphql
```

All tests must pass. Verify:
- Authorized roles can execute mutations
- Unauthorized roles are denied
- Unauthenticated users are denied
- Auth validation correctly scopes by role tab

**Test Execution Requirements:**
- Run GraphQL integration tests:
  ```bash
  bun run test:graphql
  ```
- Verify TypeScript compilation:
  ```bash
  bun tsgo
  ```

**Success Criteria / Check Progress Points:**
- [ ] Teacher onboarding tests pass (Academy Admin success, Super Admin success, Teacher denied, Parent denied, Unauthenticated denied)
- [ ] Parent onboarding tests pass (Academy Admin success, Super Admin success, Teacher denied, Unauthenticated denied)
- [ ] Manager onboarding tests pass (Super Admin admin-type success, Super Admin manager-type success, Academy Admin denied, Teacher denied, Unauthenticated denied)
- [ ] All tests use `TypedDocumentNode` from shared documents
- [ ] All tests use `setupTestServerLifecycle()` for server management
- [ ] All tests use `loginDemoUser()` for authentication
- [ ] Authorized tests use `authenticatedRequest()` helper
- [ ] Unauthorized tests verify `result.errors` is defined
- [ ] `bun run test:graphql` passes with zero failures
- [ ] `bun tsgo` passes with zero TypeScript errors

**Quality Gate — Per-File Validation:**
- [ ] `bun tsgo` on working files passes with 0 TypeScript errors & 0 warnings, after creating/modifying a single file
- [ ] `bun biome:check` on working files passes with 0 errors & 0 warnings, after creating/modifying a single file
- [ ] `bun lint` on working files passes with 0 errors & 0 warnings, after creating/modifying a single file
- [ ] `bun codescene` on working files passes with 0 errors & 0 warnings, after creating/modifying a single file
- [ ] `loop over tsgo, biome:check, lint, codescene` on working files till no issues at all, after creating/modifying a single file

**Quality Gate — Task Completion Validation:**
- [ ] `bun tsgo` on working files passes with 0 TypeScript errors & 0 warnings, after completing all steps
- [ ] `bun biome:check` on working files passes with 0 errors & 0 warnings, after completing all steps
- [ ] `bun lint` on working files passes with 0 errors & 0 warnings, after completing all steps
- [ ] `bun codescene` on working files passes with 0 errors & 0 warnings, after completing all steps
- [ ] `loop over tsgo, biome:check, lint, codescene` on working files till no issues at all, after completing all steps
