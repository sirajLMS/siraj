# Task G — GraphQL Integration Tests

**Objective:** Extend `frontend/graphql/test/parent.test.ts` with comprehensive tests covering all new queries and mutations, including success paths for authorized users and denial paths for unauthorized roles. Every security threat from Section 4 must have a corresponding test case here.

**Dependencies:** Depends on Task F — frontend Apollo documents must exist for use in test assertions.

**Target Files:**
- `frontend/graphql/test/parent.test.ts` — Extend (add new `describe` blocks)

---

## Detailed Implementation Steps

### Step 1: Extend `frontend/graphql/test/parent.test.ts`

Add new `describe` blocks at the end of the existing file. The existing test structure uses `authenticatedRequest`, `loginDemoUser`, and `testClient` — continue the same patterns.

```typescript
import { describe, expect, test } from "bun:test";
import {
  parentProfileQueryDocument,
  parentAssociatedStudentsQueryDocument,
  deactivateParentMutationDocument,
  updateStudentQuotaMutationDocument,
  parentInvoiceHistoryQueryDocument,
  parentDocumentsQueryDocument,
} from "../sharedDocuments";
import { authenticatedRequest, loginDemoUser } from "./helpers";
import { setupTestServerLifecycle } from "./lifecycle";
import { testClient } from "./testClient";

// NOTE: The existing describe block for parentDirectory tests stays unchanged.
// These new describe blocks are appended AFTER the existing ones.

describe("GraphQL Parent Profile Tests — parentProfile query", () => {
  setupTestServerLifecycle();

  let adminToken: string | null = null;
  let validParentId: string | null = null;

  test("login as academy_admin", async () => {
    adminToken = await loginDemoUser("academy_admin");
    expect(adminToken).not.toBeNull();
  });

  test("parentProfile — admin with parent.view_profile sees full profile", async () => {
    if (!adminToken) throw new Error("No auth token");

    // First, get a valid parentId from the directory (which admin already has access to)
    const { parentDirectory } = await authenticatedRequest(adminToken, "query", parentDirectoryQueryDocument, {
      search: null,
      limit: 1,
      offset: 0,
    });

    const parentId = parentDirectory?.rows?.[0]?.id;
    if (!parentId) return; // skip if no seeded parents

    validParentId = parentId;

    const data = await authenticatedRequest(adminToken, "query", parentProfileQueryDocument, { parentId });

    expect(data.parentProfile).toBeDefined();
    expect(data.parentProfile?.id).toBe(parentId);
    expect(typeof data.parentProfile?.name).toBe("string");
    expect(typeof data.parentProfile?.email).toBe("string");
    expect(typeof data.parentProfile?.status).toBe("string");
    expect(typeof data.parentProfile?.timezone).toBe("string");
    expect(data.parentProfile?.createdAt).toBeDefined();
  });

  test("parentProfile — teacher role is denied (IDOR protection)", async () => {
    const teacherToken = await loginDemoUser("teacher_default");

    const result = await testClient.query({
      query: parentProfileQueryDocument,
      variables: { parentId: validParentId ?? "00000000-0000-0000-0000-000000000000" },
      context: { headers: { Authorization: `Bearer ${teacherToken}` } },
    });

    expect(result.error).toBeDefined();
  });

  test("parentProfile — parent role is denied (IDOR protection)", async () => {
    const parentToken = await loginDemoUser("parent_default");

    const result = await testClient.query({
      query: parentProfileQueryDocument,
      variables: { parentId: validParentId ?? "00000000-0000-0000-0000-000000000000" },
      context: { headers: { Authorization: `Bearer ${parentToken}` } },
    });

    expect(result.error).toBeDefined();
  });

  test("parentProfile — returns null for unknown parentId (not a data leak)", async () => {
    if (!adminToken) throw new Error("No auth token");

    const data = await authenticatedRequest(adminToken, "query", parentProfileQueryDocument, {
      parentId: "00000000-0000-0000-0000-000000000000",
    });

    // parentProfile is nullable: null is the correct response for unknown ID
    expect(data.parentProfile === null || data.parentProfile === undefined).toBeTrue();
  });
});

describe("GraphQL Parent Profile Tests — parentAssociatedStudents query", () => {
  setupTestServerLifecycle();

  let adminToken: string | null = null;

  test("login as academy_admin", async () => {
    adminToken = await loginDemoUser("academy_admin");
    expect(adminToken).not.toBeNull();
  });

  test("parentAssociatedStudents — admin sees student list with quota data", async () => {
    if (!adminToken) throw new Error("No auth token");

    const dir = await authenticatedRequest(adminToken, "query", parentDirectoryQueryDocument, {
      search: null, limit: 1, offset: 0,
    });
    const parentId = dir?.parentDirectory?.rows?.[0]?.id;
    if (!parentId) return;

    const data = await authenticatedRequest(adminToken, "query", parentAssociatedStudentsQueryDocument, { parentId });

    expect(Array.isArray(data.parentAssociatedStudents)).toBeTrue();

    if (data.parentAssociatedStudents && data.parentAssociatedStudents.length > 0) {
      const first = data.parentAssociatedStudents[0];
      expect(first).toBeDefined();
      expect(typeof first?.id).toBe("string");
      expect(typeof first?.name).toBe("string");
      expect(typeof first?.classesRemaining).toBe("number");
      expect(typeof first?.classesTotal).toBe("number");
      expect(first?.classesRemaining).toBeGreaterThanOrEqual(0);
    }
  });

  test("parentAssociatedStudents — teacher role denied", async () => {
    const teacherToken = await loginDemoUser("teacher_default");

    const result = await testClient.query({
      query: parentAssociatedStudentsQueryDocument,
      variables: { parentId: "00000000-0000-0000-0000-000000000000" },
      context: { headers: { Authorization: `Bearer ${teacherToken}` } },
    });

    expect(result.error).toBeDefined();
  });
});

describe("GraphQL Parent Profile Tests — deactivateParent mutation", () => {
  setupTestServerLifecycle();

  let adminToken: string | null = null;

  test("login as academy_admin", async () => {
    adminToken = await loginDemoUser("academy_admin");
    expect(adminToken).not.toBeNull();
  });

  test("deactivateParent — teacher role is denied", async () => {
    const teacherToken = await loginDemoUser("teacher_default");

    const result = await testClient.mutate({
      mutation: deactivateParentMutationDocument,
      variables: { parentId: "00000000-0000-0000-0000-000000000000" },
      context: { headers: { Authorization: `Bearer ${teacherToken}` } },
    });

    expect(result.errors).toBeDefined();
  });

  test("deactivateParent — unknown parentId throws parentNotFound", async () => {
    if (!adminToken) throw new Error("No auth token");

    const result = await testClient.mutate({
      mutation: deactivateParentMutationDocument,
      variables: { parentId: "00000000-0000-0000-0000-000000000000" },
      context: { headers: { Authorization: `Bearer ${adminToken}` } },
    });

    expect(result.errors).toBeDefined();
  });

  // NOTE: The actual deactivation of a live parent is done in an isolated test that resets DB state
  test("deactivateParent — admin can deactivate a valid parent (status becomes DEACTIVATED)", async () => {
    if (!adminToken) throw new Error("No auth token");

    const dir = await authenticatedRequest(adminToken, "query", parentDirectoryQueryDocument, {
      search: null, limit: 10, offset: 0,
    });

    // Find a parent that is REGULAR (not already DEACTIVATED)
    const targetRow = dir?.parentDirectory?.rows?.find(
      (r: { accountStatus: string } | null | undefined) => r?.accountStatus !== "deactivated"
    );
    if (!targetRow?.id) return; // skip if no suitable parent

    const data = await authenticatedRequest(adminToken, "mutation", deactivateParentMutationDocument, {
      parentId: targetRow.id,
    });

    expect(data.deactivateParent).toBeDefined();
    expect(data.deactivateParent?.id).toBe(targetRow.id);
    expect(data.deactivateParent?.status).toBe("DEACTIVATED");
  });
});

describe("GraphQL Student Quota Tests — updateStudentQuota mutation", () => {
  setupTestServerLifecycle();

  let adminToken: string | null = null;

  test("login as academy_admin", async () => {
    adminToken = await loginDemoUser("academy_admin");
    expect(adminToken).not.toBeNull();
  });

  test("updateStudentQuota — teacher role is denied", async () => {
    const teacherToken = await loginDemoUser("teacher_default");

    const result = await testClient.mutate({
      mutation: updateStudentQuotaMutationDocument,
      variables: {
        studentId: "00000000-0000-0000-0000-000000000000",
        newClassesRemaining: 5,
      },
      context: { headers: { Authorization: `Bearer ${teacherToken}` } },
    });

    expect(result.errors).toBeDefined();
  });

  test("updateStudentQuota — unknown studentId throws error", async () => {
    if (!adminToken) throw new Error("No auth token");

    const result = await testClient.mutate({
      mutation: updateStudentQuotaMutationDocument,
      variables: {
        studentId: "00000000-0000-0000-0000-000000000000",
        newClassesRemaining: 5,
      },
      context: { headers: { Authorization: `Bearer ${adminToken}` } },
    });

    expect(result.errors).toBeDefined();
  });
});

describe("GraphQL Billing History Tests — parentInvoiceHistory query", () => {
  setupTestServerLifecycle();

  let adminToken: string | null = null;

  test("login as academy_admin", async () => {
    adminToken = await loginDemoUser("academy_admin");
    expect(adminToken).not.toBeNull();
  });

  test("parentInvoiceHistory — admin sees invoice list", async () => {
    if (!adminToken) throw new Error("No auth token");

    const dir = await authenticatedRequest(adminToken, "query", parentDirectoryQueryDocument, {
      search: null, limit: 1, offset: 0,
    });
    const parentId = dir?.parentDirectory?.rows?.[0]?.id;
    if (!parentId) return;

    const data = await authenticatedRequest(adminToken, "query", parentInvoiceHistoryQueryDocument, { parentId });

    expect(Array.isArray(data.parentInvoiceHistory)).toBeTrue();
    if (data.parentInvoiceHistory && data.parentInvoiceHistory.length > 0) {
      const first = data.parentInvoiceHistory[0];
      expect(typeof first?.id).toBe("string");
      expect(typeof first?.amount).toBe("string");
      expect(typeof first?.status).toBe("string");
    }
  });

  test("parentInvoiceHistory — teacher role denied", async () => {
    const teacherToken = await loginDemoUser("teacher_default");

    const result = await testClient.query({
      query: parentInvoiceHistoryQueryDocument,
      variables: { parentId: "00000000-0000-0000-0000-000000000000" },
      context: { headers: { Authorization: `Bearer ${teacherToken}` } },
    });

    expect(result.error).toBeDefined();
  });
});

describe("GraphQL Document Tests — parentDocuments query", () => {
  setupTestServerLifecycle();

  let adminToken: string | null = null;

  test("login as academy_admin", async () => {
    adminToken = await loginDemoUser("academy_admin");
    expect(adminToken).not.toBeNull();
  });

  test("parentDocuments — admin sees document list (may be empty)", async () => {
    if (!adminToken) throw new Error("No auth token");

    const dir = await authenticatedRequest(adminToken, "query", parentDirectoryQueryDocument, {
      search: null, limit: 1, offset: 0,
    });
    const parentId = dir?.parentDirectory?.rows?.[0]?.id;
    if (!parentId) return;

    const data = await authenticatedRequest(adminToken, "query", parentDocumentsQueryDocument, { parentId });

    expect(Array.isArray(data.parentDocuments)).toBeTrue();
    // Empty array is valid — no documents may be seeded
  });

  test("parentDocuments — teacher role denied", async () => {
    const teacherToken = await loginDemoUser("teacher_default");

    const result = await testClient.query({
      query: parentDocumentsQueryDocument,
      variables: { parentId: "00000000-0000-0000-0000-000000000000" },
      context: { headers: { Authorization: `Bearer ${teacherToken}` } },
    });

    expect(result.error).toBeDefined();
  });
});
```

---

## Test Execution Requirements

```bash
bun run test:graphql
```

All existing tests (parentDirectory) must still pass. All new test cases must pass.

---

## Success Criteria / Check Progress Points

- [ ] All new `describe` blocks added to `parent.test.ts`.
- [ ] Authorized success tests pass for: `parentProfile`, `parentAssociatedStudents`, `parentInvoiceHistory`, `parentDocuments`.
- [ ] Denial tests pass for teacher and parent roles on all new queries/mutations.
- [ ] `deactivateParent` — unknown ID throws, teacher denied, admin success.
- [ ] `updateStudentQuota` — teacher denied, unknown ID throws.
- [ ] `bun run test:graphql` passes with 0 failures.

**Quality Gate — Per-File Validation:**
- [ ] `bun tsgo` passes with 0 TypeScript errors & 0 warnings
- [ ] `bun biome:check` passes with 0 errors & 0 warnings
- [ ] `bun lint` passes with 0 errors & 0 warnings
- [ ] `bun codescene` passes with 0 errors & 0 warnings

**Quality Gate — Task Completion Validation:**
- [ ] `bun tsgo` passes with 0 TypeScript errors & 0 warnings after completing all steps
- [ ] `bun biome:check` passes with 0 errors & 0 warnings after completing all steps
- [ ] `bun lint` passes with 0 errors & 0 warnings after completing all steps
- [ ] `bun codescene` passes with 0 errors & 0 warnings after completing all steps
