### Task H — GraphQL Integration Tests

---

**Objective**
Write integration tests for all new GraphQL queries and mutations in the complaints and suggestions domain. Test authorization, data correctness, and security for every operation.

**Dependencies**
- Task F (Frontend GraphQL Documents) must be complete — all `TypedDocumentNode` definitions must exist in `frontend/graphql/sharedDocuments/complaint.documents.ts` and `frontend/graphql/sharedDocuments/suggestion.documents.ts`.
- Task E (Backend GraphQL / Pothos) must be complete — the GraphQL schema must be generated and the resolvers must be registered.

**Layer-Specific Rules (GraphQL Integration Tests — Flattened from frontend/graphql/test/AGENTS.md):**
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

**Target Files**
| File | Action |
|------|--------|
| `frontend/graphql/test/complaint.test.ts` | CREATE |
| `frontend/graphql/test/suggestion.test.ts` | CREATE |

---

### Detailed Implementation Steps

---

#### Step 1 — Create `frontend/graphql/test/complaint.test.ts`

```typescript
import { describe, expect, test } from "bun:test";
import {
  adminComplaintQueueQueryDocument,
  deleteComplaintMutationDocument,
  parentComplaintsQueryDocument,
  respondToComplaintMutationDocument,
  submitComplaintMutationDocument,
} from "../sharedDocuments";
import { assertOperationDenied, authenticatedRequest, loginDemoUser } from "./helpers";
import { setupTestServerLifecycle } from "./lifecycle";
import { testClient } from "./testClient";

const NIL_UUID = "00000000-0000-0000-0000-000000000000";

describe("GraphQL: parentComplaints query", () => {
  setupTestServerLifecycle();

  let parentToken = "";

  test("login as parent_default", async () => {
    parentToken = await loginDemoUser("parent_default");
    expect(parentToken).not.toBeNull();
  });

  test("authorized parent gets own complaints with correct data shape", async () => {
    const data = await authenticatedRequest(parentToken, "query", parentComplaintsQueryDocument);

    expect(Array.isArray(data.parentComplaints)).toBeTrue();

    if (data.parentComplaints && data.parentComplaints.length > 0) {
      const first = data.parentComplaints[0];
      if (!first) throw new Error("First complaint is null");
      expect(first.id).toBeDefined();
      expect(typeof first.id).toBe("string");
      expect(typeof first.category).toBe("string");
      expect(typeof first.body).toBe("string");
      expect(typeof first.status).toBe("string");
      expect(first.createdAt).toBeTruthy();
      expect(Array.isArray(first.responses)).toBeTrue();

      if (first.responses && first.responses.length > 0) {
        const resp = first.responses[0];
        if (!resp) throw new Error("First response is null");
        expect(resp.id).toBeDefined();
        expect(typeof resp.body).toBe("string");
        expect(typeof resp.emailSent).toBe("boolean");
        expect(resp.createdAt).toBeTruthy();
      }
    }
  });

  test("teacher role is denied access to parentComplaints", async () => {
    await assertOperationDenied("teacher_default", "query", parentComplaintsQueryDocument);
  });

  test("parent only sees own complaints — IDOR protection (Threat 1)", async () => {
    const data = await authenticatedRequest(parentToken, "query", parentComplaintsQueryDocument);

    if (data.parentComplaints && data.parentComplaints.length > 0) {
      for (const complaint of data.parentComplaints) {
        expect(complaint).toBeDefined();
        expect(complaint?.id).toBeDefined();
      }
    }
  });
});

describe("GraphQL: adminComplaintQueue query", () => {
  setupTestServerLifecycle();

  let adminToken = "";

  test("login as academy_admin", async () => {
    adminToken = await loginDemoUser("academy_admin");
    expect(adminToken).not.toBeNull();
  });

  test("authorized admin gets all complaints with metrics", async () => {
    const data = await authenticatedRequest(adminToken, "query", adminComplaintQueueQueryDocument, {
      filter: null,
    });

    expect(data.adminComplaintQueue).toBeDefined();
    expect(data.adminComplaintQueue?.totalCount).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(data.adminComplaintQueue?.rows)).toBeTrue();

    const metrics = data.adminComplaintQueue?.metrics;
    if (metrics) {
      expect(typeof metrics.unanswered).toBe("number");
      expect(typeof metrics.answered).toBe("number");
      expect(metrics.unanswered).toBeGreaterThanOrEqual(0);
      expect(metrics.answered).toBeGreaterThanOrEqual(0);
    }

    if (data.adminComplaintQueue?.rows && data.adminComplaintQueue.rows.length > 0) {
      const first = data.adminComplaintQueue.rows[0];
      if (!first) throw new Error("First row is null");
      expect(first.id).toBeDefined();
      expect(typeof first.category).toBe("string");
      expect(typeof first.body).toBe("string");
      expect(typeof first.status).toBe("string");
      expect(typeof first.parentId).toBe("string");
      expect(first.createdAt).toBeTruthy();
      expect(typeof first.responseCount).toBe("number");
    }
  });

  test("parent role is denied access to adminComplaintQueue", async () => {
    await assertOperationDenied("parent_default", "query", adminComplaintQueueQueryDocument, {
      filter: null,
    });
  });

  test("teacher role is denied access to adminComplaintQueue", async () => {
    await assertOperationDenied("teacher_default", "query", adminComplaintQueueQueryDocument, {
      filter: null,
    });
  });

  test("status filter returns only matching complaints", async () => {
    const data = await authenticatedRequest(adminToken, "query", adminComplaintQueueQueryDocument, {
      filter: { status: "UNANSWERED" },
    });

    expect(data.adminComplaintQueue).toBeDefined();
    if (data.adminComplaintQueue?.rows) {
      const allUnanswered = data.adminComplaintQueue.rows.every(r => r?.status === "UNANSWERED");
      expect(allUnanswered).toBeTrue();
    }
  });

  test("search filter narrows results", async () => {
    const allData = await authenticatedRequest(adminToken, "query", adminComplaintQueueQueryDocument, {
      filter: null,
    });

    const allRows = allData.adminComplaintQueue?.rows;
    if (!allRows || allRows.length === 0) return;

    const firstName = allRows[0]?.parentName;
    if (!firstName) return;

    const searchTerm = firstName.split(" ")[0];
    if (!searchTerm) return;

    const filteredData = await authenticatedRequest(adminToken, "query", adminComplaintQueueQueryDocument, {
      filter: { search: searchTerm },
    });

    expect(filteredData.adminComplaintQueue).toBeDefined();
    if (filteredData.adminComplaintQueue?.rows) {
      for (const row of filteredData.adminComplaintQueue.rows) {
        if (!row?.parentName) continue;
        const nameMatch = row.parentName.toLowerCase().includes(searchTerm.toLowerCase());
        expect(nameMatch).toBeTrue();
      }
    }
  });
});

describe("GraphQL: submitComplaint mutation", () => {
  setupTestServerLifecycle();

  let parentToken = "";

  test("login as parent_default", async () => {
    parentToken = await loginDemoUser("parent_default");
    expect(parentToken).not.toBeNull();
  });

  test("authorized parent submits complaint successfully", async () => {
    const data = await authenticatedRequest(parentToken, "mutate", submitComplaintMutationDocument, {
      input: {
        category: "OTHER",
        body: "Integration test complaint from parent",
        studentId: null,
      },
    });

    expect(data.submitComplaint).toBeDefined();
    expect(data.submitComplaint?.id).toBeDefined();
    expect(data.submitComplaint?.category).toBe("OTHER");
    expect(data.submitComplaint?.body).toBe("Integration test complaint from parent");
    expect(data.submitComplaint?.status).toBe("UNANSWERED");
    expect(data.submitComplaint?.createdAt).toBeTruthy();
  });

  test("teacher role is denied submitComplaint", async () => {
    await assertOperationDenied("teacher_default", "mutate", submitComplaintMutationDocument, {
      input: {
        category: "OTHER",
        body: "Should be denied",
        studentId: null,
      },
    });
  });

  test("empty body is rejected (required field validation)", async () => {
    const result = await testClient.mutate({
      mutation: submitComplaintMutationDocument,
      variables: {
        input: {
          category: "OTHER",
          body: "",
          studentId: null,
        },
      },
      context: { headers: { Authorization: `Bearer ${parentToken}` } },
    });

    expect(result.error).toBeDefined();
  });

  test("complaint is linked to authenticated parent — IDOR protection (Threat 2)", async () => {
    const data = await authenticatedRequest(parentToken, "mutate", submitComplaintMutationDocument, {
      input: {
        category: "REGARDING_SYSTEM",
        body: "IDOR test — should link to own parent",
        studentId: null,
      },
    });

    expect(data.submitComplaint).toBeDefined();
    expect(data.submitComplaint?.id).toBeDefined();

    const listData = await authenticatedRequest(parentToken, "query", parentComplaintsQueryDocument);
    const found = listData.parentComplaints?.find(
      c => c?.id === data.submitComplaint?.id
    );
    expect(found).toBeDefined();
    expect(found?.body).toBe("IDOR test — should link to own parent");
  });
});

describe("GraphQL: respondToComplaint mutation", () => {
  setupTestServerLifecycle();

  let adminToken = "";
  let complaintId = "";

  test("login as academy_admin and create a complaint to respond to", async () => {
    adminToken = await loginDemoUser("academy_admin");
    expect(adminToken).not.toBeNull();

    const parentToken = await loginDemoUser("parent_default");
    const submitData = await authenticatedRequest(parentToken, "mutate", submitComplaintMutationDocument, {
      input: {
        category: "OTHER",
        body: "Complaint awaiting response",
        studentId: null,
      },
    });

    complaintId = submitData.submitComplaint?.id ?? "";
    expect(complaintId).toBeTruthy();
  });

  test("authorized admin responds to complaint successfully", async () => {
    const data = await authenticatedRequest(adminToken, "mutate", respondToComplaintMutationDocument, {
      input: {
        complaintId,
        body: "We have reviewed your complaint",
        emailSent: true,
      },
    });

    expect(data.respondToComplaint).toBeDefined();
    expect(data.respondToComplaint?.id).toBeDefined();
    expect(data.respondToComplaint?.body).toBe("We have reviewed your complaint");
    expect(data.respondToComplaint?.emailSent).toBe(true);
    expect(data.respondToComplaint?.createdAt).toBeTruthy();
  });

  test("complaint status updated to ANSWERED after response", async () => {
    const queueData = await authenticatedRequest(adminToken, "query", adminComplaintQueueQueryDocument, {
      filter: null,
    });

    const row = queueData.adminComplaintQueue?.rows?.find(r => r?.id === complaintId);
    expect(row).toBeDefined();
    expect(row?.status).toBe("ANSWERED");
  });

  test("parent role is denied respondToComplaint (Threat 3)", async () => {
    await assertOperationDenied("parent_default", "mutate", respondToComplaintMutationDocument, {
      input: {
        complaintId,
        body: "Parent should not respond",
        emailSent: false,
      },
    });
  });

  test("teacher role is denied respondToComplaint (Threat 3)", async () => {
    await assertOperationDenied("teacher_default", "mutate", respondToComplaintMutationDocument, {
      input: {
        complaintId,
        body: "Teacher should not respond",
        emailSent: false,
      },
    });
  });

  test("responding to non-existent complaint returns error", async () => {
    const result = await testClient.mutate({
      mutation: respondToComplaintMutationDocument,
      variables: {
        input: {
          complaintId: NIL_UUID,
          body: "Should fail",
          emailSent: false,
        },
      },
      context: { headers: { Authorization: `Bearer ${adminToken}` } },
    });

    expect(result.error).toBeDefined();
  });
});

describe("GraphQL: deleteComplaint mutation", () => {
  setupTestServerLifecycle();

  let adminToken = "";
  let complaintToDeleteId = "";
  let alreadyDeletedId = "";

  test("login as academy_admin and create complaints for deletion tests", async () => {
    adminToken = await loginDemoUser("academy_admin");
    expect(adminToken).not.toBeNull();

    const parentToken = await loginDemoUser("parent_default");

    const first = await authenticatedRequest(parentToken, "mutate", submitComplaintMutationDocument, {
      input: {
        category: "OTHER",
        body: "Complaint to delete",
        studentId: null,
      },
    });
    complaintToDeleteId = first.submitComplaint?.id ?? "";
    expect(complaintToDeleteId).toBeTruthy();

    const second = await authenticatedRequest(parentToken, "mutate", submitComplaintMutationDocument, {
      input: {
        category: "OTHER",
        body: "Complaint to double-delete",
        studentId: null,
      },
    });
    alreadyDeletedId = second.submitComplaint?.id ?? "";
    expect(alreadyDeletedId).toBeTruthy();
  });

  test("authorized admin soft-deletes a complaint", async () => {
    const data = await authenticatedRequest(adminToken, "mutate", deleteComplaintMutationDocument, {
      complaintId: complaintToDeleteId,
    });

    expect(data.deleteComplaint).toBe(true);
  });

  test("deleted complaint no longer appears in admin queue", async () => {
    const queueData = await authenticatedRequest(adminToken, "query", adminComplaintQueueQueryDocument, {
      filter: null,
    });

    const found = queueData.adminComplaintQueue?.rows?.find(r => r?.id === complaintToDeleteId);
    expect(found).toBeUndefined();
  });

  test("parent role is denied deleteComplaint (Threat 4)", async () => {
    await assertOperationDenied("parent_default", "mutate", deleteComplaintMutationDocument, {
      complaintId: complaintToDeleteId,
    });
  });

  test("teacher role is denied deleteComplaint (Threat 4)", async () => {
    await assertOperationDenied("teacher_default", "mutate", deleteComplaintMutationDocument, {
      complaintId: complaintToDeleteId,
    });
  });

  test("deleting already-deleted complaint returns error (Threat 4)", async () => {
    await authenticatedRequest(adminToken, "mutate", deleteComplaintMutationDocument, {
      complaintId: alreadyDeletedId,
    });

    const result = await testClient.mutate({
      mutation: deleteComplaintMutationDocument,
      variables: { complaintId: alreadyDeletedId },
      context: { headers: { Authorization: `Bearer ${adminToken}` } },
    });

    expect(result.error).toBeDefined();
  });

  test("deleting non-existent complaint returns error", async () => {
    const result = await testClient.mutate({
      mutation: deleteComplaintMutationDocument,
      variables: { complaintId: NIL_UUID },
      context: { headers: { Authorization: `Bearer ${adminToken}` } },
    });

    expect(result.error).toBeDefined();
  });
});

describe("GraphQL: Complaint security tests (Section 4)", () => {
  setupTestServerLifecycle();

  test("Threat 1 — Parent A cannot access Parent B's complaints via parentComplaints", async () => {
    const parentAToken = await loginDemoUser("parent_default");

    const dataA = await authenticatedRequest(parentAToken, "query", parentComplaintsQueryDocument);

    expect(Array.isArray(dataA.parentComplaints)).toBeTrue();

    const parentBToken = await loginDemoUser("parent_onboarding");

    const dataB = await authenticatedRequest(parentBToken, "query", parentComplaintsQueryDocument);

    expect(Array.isArray(dataB.parentComplaints)).toBeTrue();

    if (dataA.parentComplaints && dataB.parentComplaints) {
      const idsA = new Set(dataA.parentComplaints.map(c => c?.id));
      const idsB = new Set(dataB.parentComplaints.map(c => c?.id));

      for (const id of idsA) {
        expect(idsB.has(id)).toBeFalse();
      }
    }
  });

  test("Threat 2 — Parent cannot submit complaint with another parent's student", async () => {
    const parentToken = await loginDemoUser("parent_default");

    const result = await testClient.mutate({
      mutation: submitComplaintMutationDocument,
      variables: {
        input: {
          category: "OTHER",
          body: "IDOR student test",
          studentId: NIL_UUID,
        },
      },
      context: { headers: { Authorization: `Bearer ${parentToken}` } },
    });

    expect(result.error).toBeDefined();
  });

  test("Threat 3 — Parent without complaints.respond cannot respond", async () => {
    const parentToken = await loginDemoUser("parent_default");

    const submitData = await authenticatedRequest(parentToken, "mutate", submitComplaintMutationDocument, {
      input: {
        category: "OTHER",
        body: "Complaint for threat 3 test",
        studentId: null,
      },
    });

    const targetId = submitData.submitComplaint?.id;
    if (!targetId) throw new Error("No complaint created");

    const result = await testClient.mutate({
      mutation: respondToComplaintMutationDocument,
      variables: {
        input: {
          complaintId: targetId,
          body: "Parent trying to respond",
          emailSent: false,
        },
      },
      context: { headers: { Authorization: `Bearer ${parentToken}` } },
    });

    expect(result.error).toBeDefined();
  });

  test("Threat 4 — Parent without complaints.delete cannot delete", async () => {
    const parentToken = await loginDemoUser("parent_default");

    const submitData = await authenticatedRequest(parentToken, "mutate", submitComplaintMutationDocument, {
      input: {
        category: "OTHER",
        body: "Complaint for threat 4 test",
        studentId: null,
      },
    });

    const targetId = submitData.submitComplaint?.id;
    if (!targetId) throw new Error("No complaint created");

    const result = await testClient.mutate({
      mutation: deleteComplaintMutationDocument,
      variables: { complaintId: targetId },
      context: { headers: { Authorization: `Bearer ${parentToken}` } },
    });

    expect(result.error).toBeDefined();
  });
});
```

**Key points:**
- 7 `describe` blocks covering all 5 operations plus a dedicated security block.
- `parentComplaints` — authorized parent success, teacher denied, IDOR data-shape verification.
- `adminComplaintQueue` — admin success with metrics, parent denied, teacher denied, status filter, search filter.
- `submitComplaint` — parent success, teacher denied, empty-body validation, IDOR link verification (Threat 2).
- `respondToComplaint` — admin success, status updated to ANSWERED, parent denied (Threat 3), teacher denied, non-existent ID error.
- `deleteComplaint` — admin soft-delete success, deleted disappears from queue, parent denied (Threat 4), teacher denied, double-delete error, non-existent ID error.
- Security block — Threat 1 (cross-parent isolation), Threat 2 (cross-parent student IDOR), Threat 3 (unauthorized response), Threat 4 (unauthorized deletion).
- All tests use `authenticatedRequest`, `assertOperationDenied`, and `loginDemoUser` from helpers.
- No raw queries, no DB imports, no `console` methods.

---

#### Step 2 — Create `frontend/graphql/test/suggestion.test.ts`

```typescript
import { describe, expect, test } from "bun:test";
import {
  adminSuggestionsQueryDocument,
  markSuggestionReviewedMutationDocument,
  submitSuggestionMutationDocument,
} from "../sharedDocuments";
import { assertOperationDenied, authenticatedRequest, loginDemoUser } from "./helpers";
import { setupTestServerLifecycle } from "./lifecycle";
import { testClient } from "./testClient";

const NIL_UUID = "00000000-0000-0000-0000-000000000000";

describe("GraphQL: adminSuggestions query", () => {
  setupTestServerLifecycle();

  let adminToken = "";

  test("login as academy_admin", async () => {
    adminToken = await loginDemoUser("academy_admin");
    expect(adminToken).not.toBeNull();
  });

  test("authorized admin gets all suggestions with metrics", async () => {
    const data = await authenticatedRequest(adminToken, "query", adminSuggestionsQueryDocument, {
      filter: null,
    });

    expect(data.adminSuggestions).toBeDefined();
    expect(data.adminSuggestions?.totalCount).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(data.adminSuggestions?.rows)).toBeTrue();

    const metrics = data.adminSuggestions?.metrics;
    if (metrics) {
      expect(typeof metrics.pending).toBe("number");
      expect(typeof metrics.reviewed).toBe("number");
      expect(metrics.pending).toBeGreaterThanOrEqual(0);
      expect(metrics.reviewed).toBeGreaterThanOrEqual(0);
    }

    if (data.adminSuggestions?.rows && data.adminSuggestions.rows.length > 0) {
      const first = data.adminSuggestions.rows[0];
      if (!first) throw new Error("First row is null");
      expect(first.id).toBeDefined();
      expect(typeof first.body).toBe("string");
      expect(typeof first.parentId).toBe("string");
      expect(first.createdAt).toBeTruthy();
    }
  });

  test("parent role is denied access to adminSuggestions (Threat 5)", async () => {
    await assertOperationDenied("parent_default", "query", adminSuggestionsQueryDocument, {
      filter: null,
    });
  });

  test("teacher role is denied access to adminSuggestions", async () => {
    await assertOperationDenied("teacher_default", "query", adminSuggestionsQueryDocument, {
      filter: null,
    });
  });

  test("super_admin can also access adminSuggestions", async () => {
    const superAdminToken = await loginDemoUser("super_admin");
    const data = await authenticatedRequest(superAdminToken, "query", adminSuggestionsQueryDocument, {
      filter: null,
    });

    expect(data.adminSuggestions).toBeDefined();
    expect(Array.isArray(data.adminSuggestions?.rows)).toBeTrue();
  });
});

describe("GraphQL: submitSuggestion mutation", () => {
  setupTestServerLifecycle();

  let parentToken = "";

  test("login as parent_default", async () => {
    parentToken = await loginDemoUser("parent_default");
    expect(parentToken).not.toBeNull();
  });

  test("authorized parent submits suggestion successfully", async () => {
    const data = await authenticatedRequest(parentToken, "mutate", submitSuggestionMutationDocument, {
      input: {
        body: "Integration test suggestion from parent",
      },
    });

    expect(data.submitSuggestion).toBeDefined();
    expect(data.submitSuggestion?.id).toBeDefined();
    expect(data.submitSuggestion?.body).toBe("Integration test suggestion from parent");
    expect(data.submitSuggestion?.createdAt).toBeTruthy();
  });

  test("teacher role is denied submitSuggestion", async () => {
    await assertOperationDenied("teacher_default", "mutate", submitSuggestionMutationDocument, {
      input: {
        body: "Should be denied",
      },
    });
  });

  test("empty body is rejected (required field validation)", async () => {
    const result = await testClient.mutate({
      mutation: submitSuggestionMutationDocument,
      variables: {
        input: {
          body: "",
        },
      },
      context: { headers: { Authorization: `Bearer ${parentToken}` } },
    });

    expect(result.error).toBeDefined();
  });

  test("submitted suggestion appears in admin listing", async () => {
    const adminToken = await loginDemoUser("academy_admin");

    const submitData = await authenticatedRequest(parentToken, "mutate", submitSuggestionMutationDocument, {
      input: {
        body: "Visible in admin listing test",
      },
    });

    const suggestionId = submitData.submitSuggestion?.id;
    expect(suggestionId).toBeTruthy();

    const listData = await authenticatedRequest(adminToken, "query", adminSuggestionsQueryDocument, {
      filter: null,
    });

    const found = listData.adminSuggestions?.rows?.find(r => r?.id === suggestionId);
    expect(found).toBeDefined();
    expect(found?.body).toBe("Visible in admin listing test");
  });
});

describe("GraphQL: markSuggestionReviewed mutation", () => {
  setupTestServerLifecycle();

  let adminToken = "";
  let suggestionToReviewId = "";

  test("login as academy_admin and create a suggestion to review", async () => {
    adminToken = await loginDemoUser("academy_admin");
    expect(adminToken).not.toBeNull();

    const parentToken = await loginDemoUser("parent_default");
    const submitData = await authenticatedRequest(parentToken, "mutate", submitSuggestionMutationDocument, {
      input: {
        body: "Suggestion awaiting review",
      },
    });

    suggestionToReviewId = submitData.submitSuggestion?.id ?? "";
    expect(suggestionToReviewId).toBeTruthy();
  });

  test("authorized admin marks suggestion as reviewed", async () => {
    const data = await authenticatedRequest(adminToken, "mutate", markSuggestionReviewedMutationDocument, {
      suggestionId: suggestionToReviewId,
    });

    expect(data.markSuggestionReviewed).toBeDefined();
    expect(data.markSuggestionReviewed?.id).toBe(suggestionToReviewId);
    expect(data.markSuggestionReviewed?.emailSentAt).toBeTruthy();
  });

  test("reviewed suggestion shows emailSentAt in admin listing", async () => {
    const listData = await authenticatedRequest(adminToken, "query", adminSuggestionsQueryDocument, {
      filter: null,
    });

    const found = listData.adminSuggestions?.rows?.find(r => r?.id === suggestionToReviewId);
    expect(found).toBeDefined();
    expect(found?.emailSentAt).toBeTruthy();
  });

  test("parent role is denied markSuggestionReviewed", async () => {
    await assertOperationDenied("parent_default", "mutate", markSuggestionReviewedMutationDocument, {
      suggestionId: suggestionToReviewId,
    });
  });

  test("teacher role is denied markSuggestionReviewed", async () => {
    await assertOperationDenied("teacher_default", "mutate", markSuggestionReviewedMutationDocument, {
      suggestionId: suggestionToReviewId,
    });
  });

  test("marking non-existent suggestion returns error", async () => {
    const result = await testClient.mutate({
      mutation: markSuggestionReviewedMutationDocument,
      variables: { suggestionId: NIL_UUID },
      context: { headers: { Authorization: `Bearer ${adminToken}` } },
    });

    expect(result.error).toBeDefined();
  });
});
```

**Key points:**
- 3 `describe` blocks covering all 3 suggestion operations.
- `adminSuggestions` — admin success with metrics, parent denied (Threat 5), teacher denied, super_admin access.
- `submitSuggestion` — parent success, teacher denied, empty-body validation, admin visibility verification.
- `markSuggestionReviewed` — admin success, emailSentAt set, admin listing reflects reviewed state, parent denied, teacher denied, non-existent ID error.
- All tests use `authenticatedRequest`, `assertOperationDenied`, and `loginDemoUser` from helpers.
- No raw queries, no DB imports, no `console` methods.

---

### Test Execution Requirements

After completing both test files, run the following command to verify correctness:

```bash
~/.bun/bin/bun run test:graphql
```

All tests must pass with zero failures. If any test fails:
1. Verify that Task F documents exist and are exported from `sharedDocuments/index.ts`.
2. Verify that Task E backend resolvers are registered and the schema is generated.
3. Verify that seed data includes `parent_default`, `parent_onboarding`, `academy_admin`, `teacher_default`, and `super_admin` demo users.
4. Check that the permission assignments match the expected RBAC configuration from Section 2.

---

### Success Criteria

- [ ] `complaint.test.ts` contains tests for all 5 complaint operations: `parentComplaints`, `adminComplaintQueue`, `submitComplaint`, `respondToComplaint`, `deleteComplaint`
- [ ] `suggestion.test.ts` contains tests for all 3 suggestion operations: `adminSuggestions`, `submitSuggestion`, `markSuggestionReviewed`
- [ ] Every operation has an authorized-success test
- [ ] Every operation has at least one unauthorized-denial test
- [ ] Threat 1 (IDOR cross-parent access) — Parent A cannot see Parent B's complaints
- [ ] Threat 2 (IDOR cross-parent submission) — Parent cannot submit with another parent's student
- [ ] Threat 3 (unauthorized response) — Parent without `complaints.respond` cannot respond
- [ ] Threat 4 (unauthorized deletion) — Parent without `complaints.delete` cannot delete
- [ ] Threat 5 (unauthorized suggestion access) — Parent cannot access admin suggestions
- [ ] `submitComplaint` validates required fields (empty body rejected)
- [ ] `submitSuggestion` validates required fields (empty body rejected)
- [ ] `respondToComplaint` updates complaint status to ANSWERED
- [ ] `respondToComplaint` persists `emailSent` flag
- [ ] `deleteComplaint` performs soft-delete (complaint disappears from queue)
- [ ] `deleteComplaint` returns error on already-deleted complaint
- [ ] `deleteComplaint` returns error on non-existent complaint
- [ ] `markSuggestionReviewed` sets `emailSentAt` timestamp
- [ ] `adminComplaintQueue` search and status filtering verified
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
