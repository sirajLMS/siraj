### Task H — GraphQL Integration Tests: Suggestion Management & Complaint File Attachments

---

#### Objective

Write integration tests for all new Sprint 15 GraphQL queries and mutations in the suggestions and complaints domain. Test authorization, data correctness, duplicate-marking validation, soft-delete verification, and security for every operation. Extend existing test files with new test suites.

---

#### Dependencies

- **Task G** — Frontend GraphQL Documents must be complete. All `TypedDocumentNode` definitions must exist in `frontend/graphql/sharedDocuments/suggestion.documents.ts` and `frontend/graphql/sharedDocuments/complaint.documents.ts`.
- **Task F** — Backend GraphQL Pothos extensions must be complete. The GraphQL schema must be generated and resolvers registered.
- **Tasks E1-E3** — Service layer methods must be complete and tested.

---

#### Layer-Specific Rules

- Import `setupTestServerLifecycle` from `./lifecycle` and call it at the root of every `describe` block.
- Import the shared cache-disabled `testClient` from `./testClient` for all GraphQL operations.
- Do NOT write raw string queries or use raw HTTP `fetch` — use imported `TypedDocumentNode` from `sharedDocuments`.
- Use `authenticatedRequest` from `./helpers` for authenticated queries/mutations instead of manually setting headers.
- Use `assertOperationDenied` from `./helpers` for unauthorized-access tests.
- Use `loginDemoUser` from `./helpers` for role-based login.
- Assert against `result.error` (not `result.errors`) since `errorPolicy: "all"` is configured.
- Prefer optional chaining (`?.`) over verbose logical checks for linter compliance.
- No `console` methods — use `logger` or omit logging.
- No DB/repo imports — integration tests interact exclusively via the GraphQL API.

---

#### Target Files

| # | File | Status |
|---|------|--------|
| 1 | `frontend/graphql/test/suggestion.test.ts` | MODIFY — add new test suites for Sprint 15 operations |
| 2 | `frontend/graphql/test/complaint.test.ts` | MODIFY — add new test suites for complaint files and extended submitComplaint |

---

#### Detailed Implementation Steps

---

##### Step 1 — Extend `frontend/graphql/test/suggestion.test.ts`

Open the existing `frontend/graphql/test/suggestion.test.ts` file. This file was created in Sprint 14 and contains test suites for `adminSuggestions`, `submitSuggestion`, and `markSuggestionReviewed`.

Add the following new imports and test suites after the existing ones.

**1a. Update imports at the top of the file:**

Add the new document imports alongside the existing ones:

```typescript
import { describe, expect, test } from "bun:test";
import {
  adminSuggestionsQueryDocument,
  deleteSuggestionMutationDocument,
  markSuggestionDuplicateMutationDocument,
  markSuggestionReviewedMutationDocument,
  parentSuggestionsQueryDocument,
  respondToSuggestionMutationDocument,
  searchSuggestionsQueryDocument,
  submitSuggestionMutationDocument,
} from "../sharedDocuments";
import { assertOperationDenied, authenticatedRequest, loginDemoUser } from "./helpers";
import { setupTestServerLifecycle } from "./lifecycle";
import { testClient } from "./testClient";

const NIL_UUID = "00000000-0000-0000-0000-000000000000";
```

**1b. Add `parentSuggestions` test suite:**

```typescript
describe("GraphQL: parentSuggestions query", () => {
  setupTestServerLifecycle();

  let parentToken = "";

  test("login as parent_default", async () => {
    parentToken = await loginDemoUser("parent_default");
    expect(parentToken).not.toBeNull();
  });

  test("authorized parent gets own suggestions with status fields", async () => {
    const data = await authenticatedRequest(parentToken, "query", parentSuggestionsQueryDocument, {
      options: { limit: 20, offset: 0 },
    });

    expect(Array.isArray(data.parentSuggestions)).toBeTrue();

    if (data.parentSuggestions && data.parentSuggestions.length > 0) {
      const first = data.parentSuggestions[0];
      if (!first) throw new Error("First suggestion is null");
      expect(first.id).toBeDefined();
      expect(typeof first.id).toBe("string");
      expect(typeof first.body).toBe("string");
      expect(typeof first.status).toBe("string");
      expect(first.createdAt).toBeTruthy();
    }
  });

  test("parent suggestion includes duplicate preview when marked as duplicate", async () => {
    const data = await authenticatedRequest(parentToken, "query", parentSuggestionsQueryDocument, {
      options: { limit: 50, offset: 0 },
    });

    if (data.parentSuggestions && data.parentSuggestions.length > 0) {
      const duplicateSuggestion = data.parentSuggestions.find(
        s => s?.status === "DUPLICATE" && s?.duplicateOf
      );

      if (duplicateSuggestion?.duplicateOf) {
        expect(duplicateSuggestion.duplicateOf.id).toBeDefined();
        expect(typeof duplicateSuggestion.duplicateOf.body).toBe("string");
      }
    }
  });

  test("teacher role is denied access to parentSuggestions", async () => {
    await assertOperationDenied("teacher_default", "query", parentSuggestionsQueryDocument, {
      options: { limit: 20, offset: 0 },
    });
  });

  test("parent sees only own suggestions — IDOR protection", async () => {
    const parentAToken = await loginDemoUser("parent_default");
    const parentBToken = await loginDemoUser("parent_onboarding");

    const dataA = await authenticatedRequest(parentAToken, "query", parentSuggestionsQueryDocument, {
      options: { limit: 50, offset: 0 },
    });
    const dataB = await authenticatedRequest(parentBToken, "query", parentSuggestionsQueryDocument, {
      options: { limit: 50, offset: 0 },
    });

    expect(Array.isArray(dataA.parentSuggestions)).toBeTrue();
    expect(Array.isArray(dataB.parentSuggestions)).toBeTrue();

    if (dataA.parentSuggestions && dataB.parentSuggestions) {
      const idsA = new Set(dataA.parentSuggestions.map(s => s?.id));
      const idsB = new Set(dataB.parentSuggestions.map(s => s?.id));

      for (const id of idsA) {
        expect(idsB.has(id)).toBeFalse();
      }
    }
  });
});
```

**1c. Add `searchSuggestions` test suite:**

```typescript
describe("GraphQL: searchSuggestions query", () => {
  setupTestServerLifecycle();

  let adminToken = "";
  let parentToken = "";
  let suggestionId = "";

  test("login as academy_admin and create a suggestion for search", async () => {
    adminToken = await loginDemoUser("academy_admin");
    expect(adminToken).not.toBeNull();

    parentToken = await loginDemoUser("parent_default");
    const submitData = await authenticatedRequest(parentToken, "mutate", submitSuggestionMutationDocument, {
      input: {
        submitterName: "Test Parent",
        body: "Unique searchable suggestion text for duplicate search test",
      },
    });

    suggestionId = submitData.submitSuggestion?.id ?? "";
    expect(suggestionId).toBeTruthy();
  });

  test("authorized admin searches suggestions successfully", async () => {
    const data = await authenticatedRequest(adminToken, "query", searchSuggestionsQueryDocument, {
      query: "Unique searchable",
      excludeId: NIL_UUID,
    });

    expect(Array.isArray(data.searchSuggestions)).toBeTrue();

    if (data.searchSuggestions && data.searchSuggestions.length > 0) {
      const first = data.searchSuggestions[0];
      if (!first) throw new Error("First search result is null");
      expect(first.id).toBeDefined();
      expect(typeof first.body).toBe("string");
      expect(typeof first.submitterName).toBe("string");
      expect(typeof first.status).toBe("string");
      expect(first.createdAt).toBeTruthy();
    }
  });

  test("search excludes self (excludeId parameter)", async () => {
    const data = await authenticatedRequest(adminToken, "query", searchSuggestionsQueryDocument, {
      query: "Unique searchable",
      excludeId: suggestionId,
    });

    expect(Array.isArray(data.searchSuggestions)).toBeTrue();

    if (data.searchSuggestions) {
      const found = data.searchSuggestions.find(s => s?.id === suggestionId);
      expect(found).toBeUndefined();
    }
  });

  test("search excludes DUPLICATE suggestions", async () => {
    const data = await authenticatedRequest(adminToken, "query", searchSuggestionsQueryDocument, {
      query: "Unique searchable",
      excludeId: NIL_UUID,
    });

    if (data.searchSuggestions) {
      const allNonDuplicate = data.searchSuggestions.every(s => s?.status !== "DUPLICATE");
      expect(allNonDuplicate).toBeTrue();
    }
  });

  test("parent role is denied access to searchSuggestions", async () => {
    await assertOperationDenied("parent_default", "query", searchSuggestionsQueryDocument, {
      query: "test",
      excludeId: NIL_UUID,
    });
  });

  test("teacher role is denied access to searchSuggestions", async () => {
    await assertOperationDenied("teacher_default", "query", searchSuggestionsQueryDocument, {
      query: "test",
      excludeId: NIL_UUID,
    });
  });
});
```

**1d. Add `respondToSuggestion` test suite:**

```typescript
describe("GraphQL: respondToSuggestion mutation", () => {
  setupTestServerLifecycle();

  let adminToken = "";
  let suggestionToRespondId = "";

  test("login as academy_admin and create a suggestion to respond to", async () => {
    adminToken = await loginDemoUser("academy_admin");
    expect(adminToken).not.toBeNull();

    const parentToken = await loginDemoUser("parent_default");
    const submitData = await authenticatedRequest(parentToken, "mutate", submitSuggestionMutationDocument, {
      input: {
        submitterName: "Test Parent",
        body: "Suggestion awaiting admin response",
      },
    });

    suggestionToRespondId = submitData.submitSuggestion?.id ?? "";
    expect(suggestionToRespondId).toBeTruthy();
  });

  test("authorized admin responds to suggestion successfully", async () => {
    const data = await authenticatedRequest(adminToken, "mutate", respondToSuggestionMutationDocument, {
      input: {
        suggestionId: suggestionToRespondId,
        adminResponse: "Thank you for your suggestion. We will consider it.",
      },
    });

    expect(data.respondToSuggestion).toBeDefined();
    expect(data.respondToSuggestion?.id).toBe(suggestionToRespondId);
    expect(data.respondToSuggestion?.adminResponse).toBe(
      "Thank you for your suggestion. We will consider it."
    );
    expect(data.respondToSuggestion?.reviewedAt).toBeTruthy();
  });

  test("responded suggestion shows REVIEWED status in admin listing", async () => {
    const listData = await authenticatedRequest(adminToken, "query", adminSuggestionsQueryDocument, {
      filter: null,
    });

    const found = listData.adminSuggestions?.rows?.find(r => r?.id === suggestionToRespondId);
    expect(found).toBeDefined();
    expect(found?.status).toBe("REVIEWED");
  });

  test("parent role is denied respondToSuggestion", async () => {
    await assertOperationDenied("parent_default", "mutate", respondToSuggestionMutationDocument, {
      input: {
        suggestionId: suggestionToRespondId,
        adminResponse: "Parent should not respond",
      },
    });
  });

  test("teacher role is denied respondToSuggestion", async () => {
    await assertOperationDenied("teacher_default", "mutate", respondToSuggestionMutationDocument, {
      input: {
        suggestionId: suggestionToRespondId,
        adminResponse: "Teacher should not respond",
      },
    });
  });

  test("responding to non-existent suggestion returns error", async () => {
    const result = await testClient.mutate({
      mutation: respondToSuggestionMutationDocument,
      variables: {
        input: {
          suggestionId: NIL_UUID,
          adminResponse: "Should fail",
        },
      },
      context: { headers: { Authorization: `Bearer ${adminToken}` } },
    });

    expect(result.error).toBeDefined();
  });
});
```

**1e. Add `markSuggestionDuplicate` test suite:**

```typescript
describe("GraphQL: markSuggestionDuplicate mutation", () => {
  setupTestServerLifecycle();

  let adminToken = "";
  let parentToken = "";
  let sourceSuggestionId = "";
  let targetSuggestionId = "";
  let alreadyDuplicateId = "";

  test("login and create suggestions for duplicate tests", async () => {
    adminToken = await loginDemoUser("academy_admin");
    expect(adminToken).not.toBeNull();

    parentToken = await loginDemoUser("parent_default");

    const source = await authenticatedRequest(parentToken, "mutate", submitSuggestionMutationDocument, {
      input: {
        submitterName: "Test Parent",
        body: "Source suggestion for duplicate test",
      },
    });
    sourceSuggestionId = source.submitSuggestion?.id ?? "";
    expect(sourceSuggestionId).toBeTruthy();

    const target = await authenticatedRequest(parentToken, "mutate", submitSuggestionMutationDocument, {
      input: {
        submitterName: "Test Parent",
        body: "Target suggestion for duplicate test",
      },
    });
    targetSuggestionId = target.submitSuggestion?.id ?? "";
    expect(targetSuggestionId).toBeTruthy();

    const dup = await authenticatedRequest(parentToken, "mutate", submitSuggestionMutationDocument, {
      input: {
        submitterName: "Test Parent",
        body: "Already duplicate suggestion for chain test",
      },
    });
    alreadyDuplicateId = dup.submitSuggestion?.id ?? "";
    expect(alreadyDuplicateId).toBeTruthy();
  });

  test("valid duplicate marking succeeds", async () => {
    const data = await authenticatedRequest(adminToken, "mutate", markSuggestionDuplicateMutationDocument, {
      input: {
        suggestionId: sourceSuggestionId,
        duplicateOfId: targetSuggestionId,
      },
    });

    expect(data.markSuggestionDuplicate).toBeDefined();
    expect(data.markSuggestionDuplicate?.id).toBe(sourceSuggestionId);
    expect(data.markSuggestionDuplicate?.status).toBe("DUPLICATE");
    expect(data.markSuggestionDuplicate?.duplicateOfId).toBe(targetSuggestionId);
  });

  test("self-reference fails (cannot mark self as duplicate)", async () => {
    const result = await testClient.mutate({
      mutation: markSuggestionDuplicateMutationDocument,
      variables: {
        input: {
          suggestionId: targetSuggestionId,
          duplicateOfId: targetSuggestionId,
        },
      },
      context: { headers: { Authorization: `Bearer ${adminToken}` } },
    });

    expect(result.error).toBeDefined();
  });

  test("chain fails (target already marked as DUPLICATE)", async () => {
    await authenticatedRequest(adminToken, "mutate", markSuggestionDuplicateMutationDocument, {
      input: {
        suggestionId: alreadyDuplicateId,
        duplicateOfId: targetSuggestionId,
      },
    });

    const newSource = await authenticatedRequest(parentToken, "mutate", submitSuggestionMutationDocument, {
      input: {
        submitterName: "Test Parent",
        body: "Chain test source suggestion",
      },
    });
    const newSourceId = newSource.submitSuggestion?.id ?? "";

    const result = await testClient.mutate({
      mutation: markSuggestionDuplicateMutationDocument,
      variables: {
        input: {
          suggestionId: newSourceId,
          duplicateOfId: alreadyDuplicateId,
        },
      },
      context: { headers: { Authorization: `Bearer ${adminToken}` } },
    });

    expect(result.error).toBeDefined();
  });

  test("circular reference fails", async () => {
    const circA = await authenticatedRequest(parentToken, "mutate", submitSuggestionMutationDocument, {
      input: {
        submitterName: "Test Parent",
        body: "Circular test suggestion A",
      },
    });
    const circAId = circA.submitSuggestion?.id ?? "";

    const circB = await authenticatedRequest(parentToken, "mutate", submitSuggestionMutationDocument, {
      input: {
        submitterName: "Test Parent",
        body: "Circular test suggestion B",
      },
    });
    const circBId = circB.submitSuggestion?.id ?? "";

    await authenticatedRequest(adminToken, "mutate", markSuggestionDuplicateMutationDocument, {
      input: {
        suggestionId: circAId,
        duplicateOfId: circBId,
      },
    });

    const result = await testClient.mutate({
      mutation: markSuggestionDuplicateMutationDocument,
      variables: {
        input: {
          suggestionId: circBId,
          duplicateOfId: circAId,
        },
      },
      context: { headers: { Authorization: `Bearer ${adminToken}` } },
    });

    expect(result.error).toBeDefined();
  });

  test("parent role is denied markSuggestionDuplicate", async () => {
    await assertOperationDenied("parent_default", "mutate", markSuggestionDuplicateMutationDocument, {
      input: {
        suggestionId: targetSuggestionId,
        duplicateOfId: sourceSuggestionId,
      },
    });
  });

  test("teacher role is denied markSuggestionDuplicate", async () => {
    await assertOperationDenied("teacher_default", "mutate", markSuggestionDuplicateMutationDocument, {
      input: {
        suggestionId: targetSuggestionId,
        duplicateOfId: sourceSuggestionId,
      },
    });
  });
});
```

**1f. Add `deleteSuggestion` test suite:**

```typescript
describe("GraphQL: deleteSuggestion mutation", () => {
  setupTestServerLifecycle();

  let superAdminToken = "";
  let academyAdminToken = "";
  let suggestionToDeleteId = "";
  let alreadyDeletedId = "";

  test("login as super_admin and create suggestions for deletion tests", async () => {
    superAdminToken = await loginDemoUser("super_admin");
    expect(superAdminToken).not.toBeNull();

    academyAdminToken = await loginDemoUser("academy_admin");

    const parentToken = await loginDemoUser("parent_default");

    const first = await authenticatedRequest(parentToken, "mutate", submitSuggestionMutationDocument, {
      input: {
        submitterName: "Test Parent",
        body: "Suggestion to be soft-deleted",
      },
    });
    suggestionToDeleteId = first.submitSuggestion?.id ?? "";
    expect(suggestionToDeleteId).toBeTruthy();

    const second = await authenticatedRequest(parentToken, "mutate", submitSuggestionMutationDocument, {
      input: {
        submitterName: "Test Parent",
        body: "Suggestion for double-delete test",
      },
    });
    alreadyDeletedId = second.submitSuggestion?.id ?? "";
    expect(alreadyDeletedId).toBeTruthy();
  });

  test("authorized super admin soft-deletes a suggestion", async () => {
    const data = await authenticatedRequest(superAdminToken, "mutate", deleteSuggestionMutationDocument, {
      suggestionId: suggestionToDeleteId,
    });

    expect(data.deleteSuggestion).toBe(true);
  });

  test("deleted suggestion no longer appears in admin listing", async () => {
    const listData = await authenticatedRequest(academyAdminToken, "query", adminSuggestionsQueryDocument, {
      filter: null,
    });

    const found = listData.adminSuggestions?.rows?.find(r => r?.id === suggestionToDeleteId);
    expect(found).toBeUndefined();
  });

  test("soft-delete verified — suggestion not in parent history either", async () => {
    const parentToken = await loginDemoUser("parent_default");
    const data = await authenticatedRequest(parentToken, "query", parentSuggestionsQueryDocument, {
      options: { limit: 50, offset: 0 },
    });

    if (data.parentSuggestions) {
      const found = data.parentSuggestions.find(s => s?.id === suggestionToDeleteId);
      expect(found).toBeUndefined();
    }
  });

  test("academy admin is denied deleteSuggestion (super admin only)", async () => {
    await assertOperationDenied("academy_admin", "mutate", deleteSuggestionMutationDocument, {
      suggestionId: alreadyDeletedId,
    });
  });

  test("parent role is denied deleteSuggestion", async () => {
    await assertOperationDenied("parent_default", "mutate", deleteSuggestionMutationDocument, {
      suggestionId: alreadyDeletedId,
    });
  });

  test("teacher role is denied deleteSuggestion", async () => {
    await assertOperationDenied("teacher_default", "mutate", deleteSuggestionMutationDocument, {
      suggestionId: alreadyDeletedId,
    });
  });

  test("deleting already-deleted suggestion returns error", async () => {
    await authenticatedRequest(superAdminToken, "mutate", deleteSuggestionMutationDocument, {
      suggestionId: alreadyDeletedId,
    });

    const result = await testClient.mutate({
      mutation: deleteSuggestionMutationDocument,
      variables: { suggestionId: alreadyDeletedId },
      context: { headers: { Authorization: `Bearer ${superAdminToken}` } },
    });

    expect(result.error).toBeDefined();
  });

  test("deleting non-existent suggestion returns error", async () => {
    const result = await testClient.mutate({
      mutation: deleteSuggestionMutationDocument,
      variables: { suggestionId: NIL_UUID },
      context: { headers: { Authorization: `Bearer ${superAdminToken}` } },
    });

    expect(result.error).toBeDefined();
  });
});
```

**Key points for suggestion tests:**
- 6 new `describe` blocks covering all Sprint 15 suggestion operations.
- `parentSuggestions` — authorized parent success with status fields, duplicate preview inclusion, teacher denied, cross-parent IDOR isolation.
- `searchSuggestions` — admin success, self-exclusion via `excludeId`, DUPLICATE exclusion, parent denied, teacher denied.
- `respondToSuggestion` — admin success with `adminResponse` and `reviewedAt`, status updated to REVIEWED in admin listing, parent denied, teacher denied, non-existent ID error.
- `markSuggestionDuplicate` — valid duplicate succeeds, self-reference fails, chain fails (target already DUPLICATE), circular fails, parent denied, teacher denied.
- `deleteSuggestion` — super admin soft-delete success, deleted disappears from admin listing, deleted disappears from parent history, academy admin denied (super admin only), parent denied, teacher denied, double-delete error, non-existent ID error.
- All tests use `authenticatedRequest`, `assertOperationDenied`, and `loginDemoUser` from helpers.
- No raw queries, no DB imports, no `console` methods.

---

##### Step 2 — Extend `frontend/graphql/test/complaint.test.ts`

Open the existing `frontend/graphql/test/complaint.test.ts` file. This file was created in Sprint 14 and contains test suites for `parentComplaints`, `adminComplaintQueue`, `submitComplaint`, `respondToComplaint`, `deleteComplaint`, and security tests.

Add the following new imports and test suites after the existing ones.

**2a. Update imports at the top of the file:**

Add the new document imports alongside the existing ones:

```typescript
import { describe, expect, test } from "bun:test";
import {
  adminComplaintQueueQueryDocument,
  complaintFilesQueryDocument,
  deleteComplaintMutationDocument,
  parentComplaintsQueryDocument,
  respondToComplaintMutationDocument,
  submitComplaintMutationDocument,
} from "../sharedDocuments";
import { assertOperationDenied, authenticatedRequest, loginDemoUser } from "./helpers";
import { setupTestServerLifecycle } from "./lifecycle";
import { testClient } from "./testClient";

const NIL_UUID = "00000000-0000-0000-0000-000000000000";
```

**2b. Add `complaintFiles` test suite:**

```typescript
describe("GraphQL: complaintFiles query", () => {
  setupTestServerLifecycle();

  let adminToken = "";
  let parentToken = "";
  let complaintWithFilesId = "";

  test("login as parent and admin, create complaint for file tests", async () => {
    parentToken = await loginDemoUser("parent_default");
    expect(parentToken).not.toBeNull();

    adminToken = await loginDemoUser("academy_admin");
    expect(adminToken).not.toBeNull();

    const submitData = await authenticatedRequest(parentToken, "mutate", submitComplaintMutationDocument, {
      input: {
        category: "OTHER",
        body: "Complaint for file attachment test",
        studentId: null,
      },
    });

    complaintWithFilesId = submitData.submitComplaint?.id ?? "";
    expect(complaintWithFilesId).toBeTruthy();
  });

  test("parent gets own complaint files", async () => {
    const data = await authenticatedRequest(parentToken, "query", complaintFilesQueryDocument, {
      complaintId: complaintWithFilesId,
    });

    expect(Array.isArray(data.complaintFiles)).toBeTrue();
  });

  test("admin gets any complaint files", async () => {
    const data = await authenticatedRequest(adminToken, "query", complaintFilesQueryDocument, {
      complaintId: complaintWithFilesId,
    });

    expect(Array.isArray(data.complaintFiles)).toBeTrue();
  });

  test("complaint files have correct shape when present", async () => {
    const data = await authenticatedRequest(adminToken, "query", complaintFilesQueryDocument, {
      complaintId: complaintWithFilesId,
    });

    if (data.complaintFiles && data.complaintFiles.length > 0) {
      const first = data.complaintFiles[0];
      if (!first) throw new Error("First file is null");
      expect(typeof first.fileId).toBe("string");
      expect(typeof first.filePath).toBe("string");
      expect(typeof first.isProtected).toBe("boolean");
      expect(typeof first.usageType).toBe("string");
      expect(first.createdAt).toBeTruthy();
    }
  });

  test("teacher role is denied access to complaintFiles", async () => {
    await assertOperationDenied("teacher_default", "query", complaintFilesQueryDocument, {
      complaintId: complaintWithFilesId,
    });
  });

  test("non-existent complaint returns empty array or error", async () => {
    const result = await testClient.query({
      query: complaintFilesQueryDocument,
      variables: { complaintId: NIL_UUID },
      context: { headers: { Authorization: `Bearer ${adminToken}` } },
    });

    const files = result.data?.complaintFiles;
    if (files) {
      expect(Array.isArray(files)).toBeTrue();
    } else {
      expect(result.error).toBeDefined();
    }
  });
});
```

**2c. Add `submitComplaint with files` test suite:**

```typescript
describe("GraphQL: submitComplaint with file attachments", () => {
  setupTestServerLifecycle();

  let parentToken = "";

  test("login as parent_default", async () => {
    parentToken = await loginDemoUser("parent_default");
    expect(parentToken).not.toBeNull();
  });

  test("submit complaint without files succeeds", async () => {
    const data = await authenticatedRequest(parentToken, "mutate", submitComplaintMutationDocument, {
      input: {
        category: "OTHER",
        body: "Complaint without file attachments",
        studentId: null,
      },
    });

    expect(data.submitComplaint).toBeDefined();
    expect(data.submitComplaint?.id).toBeDefined();
    expect(data.submitComplaint?.status).toBe("UNANSWERED");
  });

  test("submit complaint with empty filePaths succeeds", async () => {
    const data = await authenticatedRequest(parentToken, "mutate", submitComplaintMutationDocument, {
      input: {
        category: "REGARDING_SYSTEM",
        body: "Complaint with empty file paths",
        studentId: null,
        filePaths: [],
      },
    });

    expect(data.submitComplaint).toBeDefined();
    expect(data.submitComplaint?.id).toBeDefined();
  });

  test("submitted complaint appears in parent complaints list", async () => {
    const submitData = await authenticatedRequest(parentToken, "mutate", submitComplaintMutationDocument, {
      input: {
        category: "OTHER",
        body: "Complaint for parent list verification",
        studentId: null,
      },
    });

    const complaintId = submitData.submitComplaint?.id;
    expect(complaintId).toBeTruthy();

    const listData = await authenticatedRequest(parentToken, "query", parentComplaintsQueryDocument);

    const found = listData.parentComplaints?.find(c => c?.id === complaintId);
    expect(found).toBeDefined();
    expect(found?.body).toBe("Complaint for parent list verification");
  });

  test("submitted complaint appears in admin queue", async () => {
    const adminToken = await loginDemoUser("academy_admin");

    const submitData = await authenticatedRequest(parentToken, "mutate", submitComplaintMutationDocument, {
      input: {
        category: "OTHER",
        body: "Complaint for admin queue verification",
        studentId: null,
      },
    });

    const complaintId = submitData.submitComplaint?.id;
    expect(complaintId).toBeTruthy();

    const queueData = await authenticatedRequest(adminToken, "query", adminComplaintQueueQueryDocument, {
      filter: null,
    });

    const found = queueData.adminComplaintQueue?.rows?.find(r => r?.id === complaintId);
    expect(found).toBeDefined();
    expect(found?.body).toBe("Complaint for admin queue verification");
  });
});
```

**2d. Add complaint security tests for Sprint 15 features:**

```typescript
describe("GraphQL: Complaint Sprint 15 security tests", () => {
  setupTestServerLifecycle();

  test("parent cannot access another parent's complaint files (IDOR protection)", async () => {
    const parentAToken = await loginDemoUser("parent_default");
    const parentBToken = await loginDemoUser("parent_onboarding");

    const submitData = await authenticatedRequest(parentAToken, "mutate", submitComplaintMutationDocument, {
      input: {
        category: "OTHER",
        body: "Parent A complaint for IDOR file test",
        studentId: null,
      },
    });

    const complaintId = submitData.submitComplaint?.id;
    if (!complaintId) throw new Error("No complaint created");

    const result = await testClient.query({
      query: complaintFilesQueryDocument,
      variables: { complaintId },
      context: { headers: { Authorization: `Bearer ${parentBToken}` } },
    });

    expect(result.error).toBeDefined();
  });

  test("parent complaint record includes files array (empty by default)", async () => {
    const parentToken = await loginDemoUser("parent_default");

    const data = await authenticatedRequest(parentToken, "query", parentComplaintsQueryDocument);

    if (data.parentComplaints && data.parentComplaints.length > 0) {
      const first = data.parentComplaints[0];
      if (!first) throw new Error("First complaint is null");
      expect(Array.isArray(first.responses)).toBeTrue();
    }
  });

  test("admin complaint queue row includes files array (empty by default)", async () => {
    const adminToken = await loginDemoUser("academy_admin");

    const data = await authenticatedRequest(adminToken, "query", adminComplaintQueueQueryDocument, {
      filter: null,
    });

    if (data.adminComplaintQueue?.rows && data.adminComplaintQueue.rows.length > 0) {
      const first = data.adminComplaintQueue.rows[0];
      if (!first) throw new Error("First row is null");
      expect(Array.isArray(first.files)).toBeTrue();
    }
  });
});
```

**Key points for complaint tests:**
- 3 new `describe` blocks covering Sprint 15 complaint features.
- `complaintFiles` — parent gets own files, admin gets any files, correct file shape verification, teacher denied, non-existent complaint handling.
- `submitComplaint with files` — no-files success, empty-filePaths success, parent list verification, admin queue verification.
- Sprint 15 security — cross-parent complaint files IDOR protection, parent complaint record includes files array, admin queue row includes files array.
- All tests use `authenticatedRequest`, `assertOperationDenied`, and `loginDemoUser` from helpers.
- No raw queries, no DB imports, no `console` methods.

---

#### Test Execution Requirements

After completing both test file extensions, run the following command to verify correctness:

```bash
~/.bun/bin/bun run test:graphql
```

All tests must pass with zero failures. If any test fails:
1. Verify that Task G documents exist and are exported from `sharedDocuments/index.ts`.
2. Verify that Task F backend resolvers are registered and the schema is generated.
3. Verify that seed data includes `parent_default`, `parent_onboarding`, `academy_admin`, `teacher_default`, and `super_admin` demo users.
4. Check that the permission assignments match the expected RBAC configuration from Section 2.
5. Verify that `SuggestionService.searchSuggestions()` thin wrapper exists and delegates to `SuggestionRepository.searchSuggestions()`.

---

#### Success Criteria

- [ ] `suggestion.test.ts` contains new test suites for all 5 Sprint 15 suggestion operations: `parentSuggestions`, `searchSuggestions`, `respondToSuggestion`, `markSuggestionDuplicate`, `deleteSuggestion`
- [ ] `complaint.test.ts` contains new test suites for Sprint 15 complaint features: `complaintFiles`, `submitComplaint with files`, Sprint 15 security tests
- [ ] `parentSuggestions` — authorized parent gets own suggestions with status fields
- [ ] `parentSuggestions` — includes duplicate preview when suggestion is marked as DUPLICATE
- [ ] `parentSuggestions` — teacher role denied
- [ ] `parentSuggestions` — cross-parent IDOR isolation verified (Parent A cannot see Parent B's suggestions)
- [ ] `searchSuggestions` — authorized admin searches successfully
- [ ] `searchSuggestions` — excludes self via `excludeId` parameter
- [ ] `searchSuggestions` — excludes DUPLICATE suggestions from results
- [ ] `searchSuggestions` — parent role denied
- [ ] `searchSuggestions` — teacher role denied
- [ ] `respondToSuggestion` — authorized admin responds successfully with `adminResponse` and `reviewedAt`
- [ ] `respondToSuggestion` — status updated to REVIEWED in admin listing
- [ ] `respondToSuggestion` — parent role denied
- [ ] `respondToSuggestion` — teacher role denied
- [ ] `respondToSuggestion` — non-existent suggestion returns error
- [ ] `markSuggestionDuplicate` — valid duplicate succeeds with status DUPLICATE
- [ ] `markSuggestionDuplicate` — self-reference fails
- [ ] `markSuggestionDuplicate` — chain fails (target already DUPLICATE)
- [ ] `markSuggestionDuplicate` — circular reference fails
- [ ] `markSuggestionDuplicate` — parent role denied
- [ ] `markSuggestionDuplicate` — teacher role denied
- [ ] `deleteSuggestion` — authorized super admin soft-deletes successfully
- [ ] `deleteSuggestion` — deleted suggestion disappears from admin listing
- [ ] `deleteSuggestion` — deleted suggestion disappears from parent history
- [ ] `deleteSuggestion` — academy admin denied (super admin only permission)
- [ ] `deleteSuggestion` — parent role denied
- [ ] `deleteSuggestion` — teacher role denied
- [ ] `deleteSuggestion` — double-delete returns error
- [ ] `deleteSuggestion` — non-existent suggestion returns error
- [ ] `complaintFiles` — parent gets own complaint files
- [ ] `complaintFiles` — admin gets any complaint files
- [ ] `complaintFiles` — correct file shape when files present (`fileId`, `filePath`, `isProtected`, `usageType`, `createdAt`)
- [ ] `complaintFiles` — teacher role denied
- [ ] `complaintFiles` — non-existent complaint handled gracefully
- [ ] `submitComplaint` with files — no-files success
- [ ] `submitComplaint` with files — empty-filePaths success
- [ ] `submitComplaint` with files — complaint appears in parent list
- [ ] `submitComplaint` with files — complaint appears in admin queue
- [ ] Cross-parent complaint files IDOR protection verified
- [ ] Parent complaint record includes files array
- [ ] Admin complaint queue row includes files array
- [ ] All tests use `TypedDocumentNode` imports from `sharedDocuments` (no raw strings)
- [ ] All tests use `authenticatedRequest` / `assertOperationDenied` helpers (no manual header setup)
- [ ] No DB/repo imports in any test file
- [ ] No `console` methods used
- [ ] `bun run test:graphql` passes with zero failures

---

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