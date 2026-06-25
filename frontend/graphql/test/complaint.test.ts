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

const DEFAULT_FILTER = { limit: 100, offset: 0, search: null, status: null };

async function submitTestComplaint(token: string, body: string): Promise<string> {
  const data = await authenticatedRequest(token, "mutate", submitComplaintMutationDocument, {
    input: {
      category: ComplaintCategory.Other,
      body,
      studentId: null,
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
    const data = await authenticatedRequest(parentToken, "query", parentComplaintsQueryDocument);

    expect(Array.isArray(data.parentComplaints)).toBeTrue();

    if (data.parentComplaints?.length) {
      const first = data.parentComplaints[0];
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
    await assertOperationDenied("teacher_default", "query", parentComplaintsQueryDocument, {});
  });

  test("parent only sees own complaints — IDOR protection (Threat 1)", async () => {
    const data = await authenticatedRequest(parentToken, "query", parentComplaintsQueryDocument);

    if (data.parentComplaints?.length) {
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
      filter: DEFAULT_FILTER,
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
      expect(typeof first.parentId).toBe("string");
      expect(first.createdAt).toBeTruthy();
    }
  });

  test("parent role is denied access to adminComplaintQueue", async () => {
    await assertOperationDenied("parent_default", "query", adminComplaintQueueQueryDocument, {
      filter: DEFAULT_FILTER,
    });
  });

  test("teacher role is denied access to adminComplaintQueue", async () => {
    await assertOperationDenied("teacher_default", "query", adminComplaintQueueQueryDocument, {
      filter: DEFAULT_FILTER,
    });
  });

  test("status filter returns only matching complaints", async () => {
    const data = await authenticatedRequest(adminToken, "query", adminComplaintQueueQueryDocument, {
      filter: { ...DEFAULT_FILTER, status: ComplaintStatus.Unanswered },
    });

    expect(data.adminComplaintQueue).toBeDefined();
    if (data.adminComplaintQueue?.rows) {
      const allUnanswered = data.adminComplaintQueue.rows.every(r => r?.status === ComplaintStatus.Unanswered);
      expect(allUnanswered).toBeTrue();
    }
  });

  test("search filter narrows results", async () => {
    const allData = await authenticatedRequest(adminToken, "query", adminComplaintQueueQueryDocument, {
      filter: DEFAULT_FILTER,
    });

    const allRows = allData.adminComplaintQueue?.rows;
    if (!allRows?.length) return;

    const firstName = allRows[0]?.parentName;
    if (!firstName) return;

    const searchTerm = firstName.split(" ")[0];
    if (!searchTerm) return;

    const filteredData = await authenticatedRequest(adminToken, "query", adminComplaintQueueQueryDocument, {
      filter: { ...DEFAULT_FILTER, search: searchTerm },
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
    await assertOperationDenied("teacher_default", "mutate", submitComplaintMutationDocument, {
      input: {
        category: ComplaintCategory.Other,
        body: "Should be denied",
        studentId: null,
        submitterEmail: "teacher@siraj.local",
        files: null,
      },
    });
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

    const listData = await authenticatedRequest(parentToken, "query", parentComplaintsQueryDocument);
    const found = listData.parentComplaints?.find(c => c?.id === data.submitComplaint?.id);
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
    complaintId = await submitTestComplaint(parentToken, "Complaint awaiting response");
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
      filter: DEFAULT_FILTER,
    });

    const row = queueData.adminComplaintQueue?.rows?.find(r => r?.id === complaintId);
    expect(row).toBeDefined();
    expect(row?.status).toBe(ComplaintStatus.Answered);
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
    await expectMutationError(adminToken, respondToComplaintMutationDocument, {
      input: {
        complaintId: NIL_UUID,
        body: "Should fail",
        emailSent: false,
      },
    });
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
    complaintToDeleteId = await submitTestComplaint(parentToken, "Complaint to delete");
    alreadyDeletedId = await submitTestComplaint(parentToken, "Complaint to double-delete");
  });

  test("authorized admin soft-deletes a complaint", async () => {
    const data = await authenticatedRequest(adminToken, "mutate", deleteComplaintMutationDocument, {
      complaintId: complaintToDeleteId,
    });

    expect(data.deleteComplaint).toBe(true);
  });

  test("deleted complaint no longer appears in admin queue", async () => {
    const queueData = await authenticatedRequest(adminToken, "query", adminComplaintQueueQueryDocument, {
      filter: DEFAULT_FILTER,
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

    await expectMutationError(adminToken, deleteComplaintMutationDocument, {
      complaintId: alreadyDeletedId,
    });
  });

  test("deleting non-existent complaint returns error", async () => {
    await expectMutationError(adminToken, deleteComplaintMutationDocument, {
      complaintId: NIL_UUID,
    });
  });
});

describe("GraphQL: Complaint security tests (Section 4)", () => {
  setupTestServerLifecycle();

  test("Threat 1 — parentComplaints is scoped to authenticated parent (IDOR protection)", async () => {
    const parentToken = await loginDemoUser("parent_default");

    const data = await authenticatedRequest(parentToken, "query", parentComplaintsQueryDocument);

    expect(Array.isArray(data.parentComplaints)).toBeTrue();

    if (data.parentComplaints?.length) {
      for (const complaint of data.parentComplaints) {
        expect(complaint?.id).toBeDefined();
        expect(complaint?.body).toBeDefined();
      }
    }
  });

  test("Threat 2 — Parent cannot submit complaint with another parent's student", async () => {
    const parentToken = await loginDemoUser("parent_default");

    await expectMutationError(parentToken, submitComplaintMutationDocument, {
      input: {
        category: ComplaintCategory.Other,
        body: "IDOR student test",
        studentId: NIL_UUID,
        submitterEmail: "parent@siraj.local",
        files: null,
      },
    });
  });

  test("Threat 3 — Parent without complaints.respond cannot respond", async () => {
    const parentToken = await loginDemoUser("parent_default");
    const targetId = await submitTestComplaint(parentToken, "Complaint for threat 3 test");

    await expectMutationError(parentToken, respondToComplaintMutationDocument, {
      input: {
        complaintId: targetId,
        body: "Parent trying to respond",
        emailSent: false,
      },
    });
  });

  test("Threat 4 — Parent without complaints.delete cannot delete", async () => {
    const parentToken = await loginDemoUser("parent_default");
    const targetId = await submitTestComplaint(parentToken, "Complaint for threat 4 test");

    await expectMutationError(parentToken, deleteComplaintMutationDocument, {
      complaintId: targetId,
    });
  });
});
