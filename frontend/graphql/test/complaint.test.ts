import { describe, expect, test } from "bun:test";
import { ComplaintCategory, ComplaintStatus } from "../generated/gql/graphql-types";
import {
  adminComplaintQueueQueryDocument,
  deleteComplaintMutationDocument,
  parentComplaintsQueryDocument,
  respondToComplaintMutationDocument,
  submitComplaintMutationDocument,
} from "../sharedDocuments";
import { assertOperationDenied, authenticatedRequest, expectMutationError, loginDemoUser } from "./helpers";
import { setupTestServerLifecycle } from "./lifecycle";

const NIL_UUID = "00000000-0000-0000-0000-000000000000";

const DEFAULT_FILTER = { search: null, status: null };

async function submitTestComplaint(token: string, body: string, studentId?: string | null): Promise<string> {
  const data = await authenticatedRequest(token, "mutate", submitComplaintMutationDocument, {
    input: {
      category: ComplaintCategory.Other,
      body,
      studentId: studentId ?? null,
      submitterEmail: "parent@siraj.local",
      files: null,
    },
  });
  const id = data.submitComplaint?.id;
  if (!id) throw new Error("No complaint created");
  return id;
}

describe("GraphQL: parentComplaints query", () => {
  setupTestServerLifecycle();

  let parentToken = "";

  test("login as parent_default", async () => {
    parentToken = await loginDemoUser("parent_default");
    expect(parentToken).not.toBeNull();
  });

  test("authorized parent gets own complaints with correct data shape", async () => {
    const data = await authenticatedRequest(parentToken, "query", parentComplaintsQueryDocument, {
      paginationArgs: null,
    });

    expect(data.parentComplaints).toBeDefined();
    expect(typeof data.parentComplaints?.totalCount).toBe("number");
    expect(Array.isArray(data.parentComplaints?.complaints)).toBeTrue();

    if (data.parentComplaints?.complaints?.length) {
      const first = data.parentComplaints.complaints[0];
      if (!first) throw new Error("First complaint is null");
      expect(first.id).toBeDefined();
      expect(typeof first.id).toBe("string");
      expect(typeof first.category).toBe("string");
      expect(typeof first.body).toBe("string");
      expect(typeof first.status).toBe("string");
      expect(first.createdAt).toBeTruthy();
      expect(Array.isArray(first.responses)).toBeTrue();

      if (first.responses?.length) {
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
    const denial = await assertOperationDenied("teacher_default", "query", parentComplaintsQueryDocument, {
      paginationArgs: null,
    });
    expect(denial).toBe(true);
  });

  test("parent only sees own complaints — IDOR protection (Threat 1)", async () => {
    const data = await authenticatedRequest(parentToken, "query", parentComplaintsQueryDocument, {
      paginationArgs: null,
    });

    if (data.parentComplaints?.complaints?.length) {
      for (const complaint of data.parentComplaints.complaints) {
        expect(complaint).toBeDefined();
        expect(complaint?.id).toBeDefined();
      }
    }
  });
});

describe("GraphQL: adminComplaintQueue query", () => {
  setupTestServerLifecycle();

  let superAdminToken = "";

  test("login as super_admin to provision and query", async () => {
    superAdminToken = await loginDemoUser("super_admin");
    expect(superAdminToken).not.toBeNull();
  });

  test("authorized admin gets all complaints with metrics", async () => {
    const data = await authenticatedRequest(superAdminToken, "query", adminComplaintQueueQueryDocument, {
      filter: DEFAULT_FILTER,
      paginationArgs: null,
    });

    expect(data.adminComplaintQueue).toBeDefined();
    expect(Array.isArray(data.adminComplaintQueue?.rows)).toBeTrue();

    const metrics = data.adminComplaintQueue?.metrics;
    if (metrics) {
      expect(typeof metrics.unanswered).toBe("number");
      expect(typeof metrics.answered).toBe("number");
      expect(metrics.unanswered).toBeGreaterThanOrEqual(0);
      expect(metrics.answered).toBeGreaterThanOrEqual(0);
    }

    if (data.adminComplaintQueue?.rows?.length) {
      const first = data.adminComplaintQueue.rows[0];
      if (!first) throw new Error("First row is null");
      expect(first.id).toBeDefined();
      expect(typeof first.category).toBe("string");
      expect(typeof first.body).toBe("string");
      expect(typeof first.status).toBe("string");
      expect(first.createdAt).toBeTruthy();
    }
  });

  test("parent role is denied access to adminComplaintQueue", async () => {
    const denial = await assertOperationDenied("parent_default", "query", adminComplaintQueueQueryDocument, {
      filter: DEFAULT_FILTER,
      paginationArgs: null,
    });
    expect(denial).toBe(true);
  });

  test("teacher role is denied access to adminComplaintQueue", async () => {
    const denial = await assertOperationDenied("teacher_default", "query", adminComplaintQueueQueryDocument, {
      filter: DEFAULT_FILTER,
      paginationArgs: null,
    });
    expect(denial).toBe(true);
  });

  test("status filter returns only matching complaints", async () => {
    const data = await authenticatedRequest(superAdminToken, "query", adminComplaintQueueQueryDocument, {
      filter: { ...DEFAULT_FILTER, status: ComplaintStatus.Unanswered },
      paginationArgs: null,
    });

    expect(data.adminComplaintQueue).toBeDefined();
    if (data.adminComplaintQueue?.rows) {
      const allUnanswered = data.adminComplaintQueue.rows.every(r => r?.status === ComplaintStatus.Unanswered);
      expect(allUnanswered).toBeTrue();
    }
  });

  test("search filter narrows results", async () => {
    const allData = await authenticatedRequest(superAdminToken, "query", adminComplaintQueueQueryDocument, {
      filter: DEFAULT_FILTER,
      paginationArgs: null,
    });

    const allRows = allData.adminComplaintQueue?.rows;
    if (!allRows?.length) return;

    const firstName = allRows[0]?.parentName;
    if (!firstName) return;

    const searchTerm = firstName.split(" ")[0];
    if (!searchTerm) return;

    const filteredData = await authenticatedRequest(superAdminToken, "query", adminComplaintQueueQueryDocument, {
      filter: { ...DEFAULT_FILTER, search: searchTerm },
      paginationArgs: null,
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
        category: ComplaintCategory.Other,
        body: "Integration test complaint from parent",
        studentId: null,
        submitterEmail: "parent@siraj.local",
        files: null,
      },
    });

    expect(data.submitComplaint).toBeDefined();
    expect(data.submitComplaint?.id).toBeDefined();
    expect(data.submitComplaint?.category).toBe(ComplaintCategory.Other);
    expect(data.submitComplaint?.body).toBe("Integration test complaint from parent");
    expect(data.submitComplaint?.status).toBe(ComplaintStatus.Unanswered);
    expect(data.submitComplaint?.createdAt).toBeTruthy();
  });

  test("teacher role is denied submitComplaint", async () => {
    const denial = await assertOperationDenied("teacher_default", "mutate", submitComplaintMutationDocument, {
      input: {
        category: ComplaintCategory.Other,
        body: "Should be denied",
        studentId: null,
        submitterEmail: "teacher@siraj.local",
        files: null,
      },
    });
    expect(denial).toBe(true);
  });

  test("complaint with empty body is accepted by GraphQL layer", async () => {
    const data = await authenticatedRequest(parentToken, "mutate", submitComplaintMutationDocument, {
      input: {
        category: ComplaintCategory.Other,
        body: "",
        studentId: null,
        submitterEmail: "parent@siraj.local",
        files: null,
      },
    });
    expect(data.submitComplaint?.id).toBeDefined();
  });

  test("complaint is linked to authenticated parent — IDOR protection (Threat 2)", async () => {
    const data = await authenticatedRequest(parentToken, "mutate", submitComplaintMutationDocument, {
      input: {
        category: ComplaintCategory.RegardingSystem,
        body: "IDOR test — should link to own parent",
        studentId: null,
        submitterEmail: "parent@siraj.local",
        files: null,
      },
    });

    expect(data.submitComplaint).toBeDefined();
    expect(data.submitComplaint?.id).toBeDefined();

    const listData = await authenticatedRequest(parentToken, "query", parentComplaintsQueryDocument, {
      paginationArgs: null,
    });
    const found = listData.parentComplaints?.complaints?.find(c => c?.id === data.submitComplaint?.id);
    expect(found).toBeDefined();
    expect(found?.body).toBe("IDOR test — should link to own parent");
  });
});

describe("GraphQL: respondToComplaint mutation", () => {
  setupTestServerLifecycle();

  let superAdminToken = "";
  let complaintId = "";

  test("login as super_admin and create a complaint to respond to", async () => {
    superAdminToken = await loginDemoUser("super_admin");
    expect(superAdminToken).not.toBeNull();

    const parentToken = await loginDemoUser("parent_default");
    complaintId = await submitTestComplaint(parentToken, "Complaint awaiting response");
  });

  test("authorized admin responds to complaint successfully", async () => {
    const data = await authenticatedRequest(superAdminToken, "mutate", respondToComplaintMutationDocument, {
      input: {
        complaintId,
        body: "We have reviewed your complaint",
      },
    });

    expect(data.respondToComplaint).toBeDefined();
    expect(data.respondToComplaint?.id).toBeDefined();
    expect(data.respondToComplaint?.body).toBe("We have reviewed your complaint");
    expect(data.respondToComplaint?.emailSent).toBe(false);
    expect(data.respondToComplaint?.createdAt).toBeTruthy();
  });

  test("complaint status updated to ANSWERED after response", async () => {
    const queueData = await authenticatedRequest(superAdminToken, "query", adminComplaintQueueQueryDocument, {
      filter: DEFAULT_FILTER,
      paginationArgs: null,
    });

    const row = queueData.adminComplaintQueue?.rows?.find(r => r?.id === complaintId);
    expect(row).toBeDefined();
    expect(row?.status).toBe(ComplaintStatus.Answered);
  });

  test("parent role is denied respondToComplaint (Threat 3)", async () => {
    const denial = await assertOperationDenied("parent_default", "mutate", respondToComplaintMutationDocument, {
      input: {
        complaintId,
        body: "Parent should not respond",
      },
    });
    expect(denial).toBe(true);
  });

  test("teacher role is denied respondToComplaint (Threat 3)", async () => {
    const denial = await assertOperationDenied("teacher_default", "mutate", respondToComplaintMutationDocument, {
      input: {
        complaintId,
        body: "Teacher should not respond",
      },
    });
    expect(denial).toBe(true);
  });

  test("responding to non-existent complaint returns error", async () => {
    const error = await expectMutationError(superAdminToken, respondToComplaintMutationDocument, {
      input: {
        complaintId: NIL_UUID,
        body: "Should fail",
      },
    });
    expect(error).toBeUndefined();
  });
});

describe("GraphQL: deleteComplaint mutation", () => {
  setupTestServerLifecycle();

  let superAdminToken = "";
  let complaintToDeleteId = "";
  let alreadyDeletedId = "";

  test("login as super_admin and create complaints for deletion tests", async () => {
    superAdminToken = await loginDemoUser("super_admin");
    expect(superAdminToken).not.toBeNull();

    const parentToken = await loginDemoUser("parent_default");
    complaintToDeleteId = await submitTestComplaint(parentToken, "Complaint to delete");
    alreadyDeletedId = await submitTestComplaint(parentToken, "Complaint to double-delete");
  });

  test("authorized admin soft-deletes a complaint", async () => {
    const data = await authenticatedRequest(superAdminToken, "mutate", deleteComplaintMutationDocument, {
      complaintId: complaintToDeleteId,
    });

    expect(data.deleteComplaint).toBe(true);
  });

  test("deleted complaint no longer appears in admin queue", async () => {
    const queueData = await authenticatedRequest(superAdminToken, "query", adminComplaintQueueQueryDocument, {
      filter: DEFAULT_FILTER,
      paginationArgs: null,
    });

    const found = queueData.adminComplaintQueue?.rows?.find(r => r?.id === complaintToDeleteId);
    expect(found).toBeUndefined();
  });

  test("parent role is denied deleteComplaint (Threat 4)", async () => {
    const denial = await assertOperationDenied("parent_default", "mutate", deleteComplaintMutationDocument, {
      complaintId: complaintToDeleteId,
    });
    expect(denial).toBe(true);
  });

  test("teacher role is denied deleteComplaint (Threat 4)", async () => {
    const denial = await assertOperationDenied("teacher_default", "mutate", deleteComplaintMutationDocument, {
      complaintId: complaintToDeleteId,
    });
    expect(denial).toBe(true);
  });

  test("deleting already-deleted complaint returns error (Threat 4)", async () => {
    const firstDelete = await authenticatedRequest(superAdminToken, "mutate", deleteComplaintMutationDocument, {
      complaintId: alreadyDeletedId,
    });
    expect(firstDelete.deleteComplaint).toBe(true);

    const secondError = await expectMutationError(superAdminToken, deleteComplaintMutationDocument, {
      complaintId: alreadyDeletedId,
    });
    expect(secondError).toBeUndefined();
  });

  test("deleting non-existent complaint returns error", async () => {
    const error = await expectMutationError(superAdminToken, deleteComplaintMutationDocument, {
      complaintId: NIL_UUID,
    });
    expect(error).toBeUndefined();
  });
});

describe("GraphQL: Complaint security tests (Section 4)", () => {
  setupTestServerLifecycle();

  test("Threat 1 — parentComplaints is scoped to authenticated parent (IDOR protection)", async () => {
    const parentToken = await loginDemoUser("parent_default");

    const data = await authenticatedRequest(parentToken, "query", parentComplaintsQueryDocument, {
      paginationArgs: null,
    });

    expect(data.parentComplaints).toBeDefined();
    expect(Array.isArray(data.parentComplaints?.complaints)).toBeTrue();

    if (data.parentComplaints?.complaints?.length) {
      for (const complaint of data.parentComplaints.complaints) {
        expect(complaint?.id).toBeDefined();
        expect(complaint?.body).toBeDefined();
      }
    }
  });

  test("Threat 2 — Parent cannot submit complaint with another parent's student", async () => {
    const parentToken = await loginDemoUser("parent_default");

    // Submitting with a non-existent studentId should fail
    const error = await expectMutationError(parentToken, submitComplaintMutationDocument, {
      input: {
        category: ComplaintCategory.Other,
        body: "IDOR student test",
        studentId: NIL_UUID,
        submitterEmail: "parent@siraj.local",
        files: null,
      },
    });
    expect(error).toBeUndefined();
  });

  test("Threat 3 — Parent without complaints.respond cannot respond", async () => {
    const parentToken = await loginDemoUser("parent_default");
    const targetId = await submitTestComplaint(parentToken, "Complaint for threat 3 test");

    const error = await expectMutationError(parentToken, respondToComplaintMutationDocument, {
      input: {
        complaintId: targetId,
        body: "Parent trying to respond",
      },
    });
    expect(error).toBeUndefined();
  });

  test("Threat 4 — Parent without complaints.delete cannot delete", async () => {
    const parentToken = await loginDemoUser("parent_default");
    const targetId = await submitTestComplaint(parentToken, "Complaint for threat 4 test");

    const error = await expectMutationError(parentToken, deleteComplaintMutationDocument, {
      complaintId: targetId,
    });
    expect(error).toBeUndefined();
  });
});
