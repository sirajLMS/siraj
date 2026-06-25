import { describe, expect, test } from "bun:test";
import {
  adminSuggestionsQueryDocument,
  markSuggestionReviewedMutationDocument,
  submitSuggestionMutationDocument,
} from "../sharedDocuments";
import { assertOperationDenied, authenticatedRequest, expectMutationError, loginDemoUser } from "./helpers";
import { setupTestServerLifecycle } from "./lifecycle";

const NIL_UUID = "00000000-0000-0000-0000-000000000000";

const DEFAULT_FILTER = { limit: 100, offset: 0, search: null, status: null };

async function submitTestSuggestion(token: string, body: string): Promise<string> {
  const data = await authenticatedRequest(token, "mutate", submitSuggestionMutationDocument, {
    input: {
      body,
      submitterName: "Test Parent",
    },
  });
  const id = data.submitSuggestion?.id;
  if (!id) throw new Error("No suggestion created");
  return id;
}

describe("GraphQL: adminSuggestions query", () => {
  setupTestServerLifecycle();

  let adminToken = "";

  test("login as academy_admin", async () => {
    adminToken = await loginDemoUser("academy_admin");
    expect(adminToken).not.toBeNull();
  });

  test("authorized admin gets all suggestions with metrics", async () => {
    const data = await authenticatedRequest(adminToken, "query", adminSuggestionsQueryDocument, {
      filter: DEFAULT_FILTER,
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

    if (data.adminSuggestions?.rows?.length) {
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
      filter: DEFAULT_FILTER,
    });
  });

  test("teacher role is denied access to adminSuggestions", async () => {
    await assertOperationDenied("teacher_default", "query", adminSuggestionsQueryDocument, {
      filter: DEFAULT_FILTER,
    });
  });

  test("super_admin can also access adminSuggestions", async () => {
    const superAdminToken = await loginDemoUser("super_admin");
    const data = await authenticatedRequest(superAdminToken, "query", adminSuggestionsQueryDocument, {
      filter: DEFAULT_FILTER,
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
        submitterName: "Default Parent",
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
        submitterName: "Teacher",
      },
    });
  });

  test("suggestion with empty body is accepted by GraphQL layer", async () => {
    const data = await authenticatedRequest(parentToken, "mutate", submitSuggestionMutationDocument, {
      input: {
        body: "",
        submitterName: "Default Parent",
      },
    });
    expect(data.submitSuggestion?.id).toBeDefined();
  });

  test("submitted suggestion appears in admin listing", async () => {
    const adminToken = await loginDemoUser("academy_admin");

    const suggestionId = await submitTestSuggestion(parentToken, "Visible in admin listing test");

    const listData = await authenticatedRequest(adminToken, "query", adminSuggestionsQueryDocument, {
      filter: DEFAULT_FILTER,
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
    suggestionToReviewId = await submitTestSuggestion(parentToken, "Suggestion awaiting review");
  });

  test("authorized admin marks suggestion as reviewed", async () => {
    const data = await authenticatedRequest(adminToken, "mutate", markSuggestionReviewedMutationDocument, {
      suggestionId: suggestionToReviewId,
    });

    expect(data.markSuggestionReviewed).toBeDefined();
    expect(data.markSuggestionReviewed?.id).toBe(suggestionToReviewId);
  });

  test("reviewed suggestion is reflected in admin listing", async () => {
    const listData = await authenticatedRequest(adminToken, "query", adminSuggestionsQueryDocument, {
      filter: DEFAULT_FILTER,
    });

    const found = listData.adminSuggestions?.rows?.find(r => r?.id === suggestionToReviewId);
    expect(found).toBeDefined();
    expect(found?.body).toBe("Suggestion awaiting review");
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
    await expectMutationError(adminToken, markSuggestionReviewedMutationDocument, {
      suggestionId: NIL_UUID,
    });
  });
});
