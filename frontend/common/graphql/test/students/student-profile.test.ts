import { describe, expect, test } from "bun:test";
import { studentProfileQueryDocument } from "@/frontend/common/graphql/sharedDocuments/students/student-profile.documents";
import {
  authenticatedRequest,
  loginAndProvision,
  loginUser,
  setupTestServerLifecycle,
  TEST_USER_PASSWORD,
} from "@/test/helpers";

describe("GraphQL Student Profile Integration Tests", () => {
  setupTestServerLifecycle();

  test("studentProfile — associated parent can load their student profile", async () => {
    const provision = await loginAndProvision("StudentProfileTest");
    if (!provision.parentUserEmail) throw new Error("Parent email not returned");
    // The provisioned student belongs to the provisioned parent — log in as
    // that parent; an unrelated parent (e.g. the demo `parent_default`) is
    // correctly denied by assertStudentReadAccess.
    const parentToken = await loginUser(provision.parentUserEmail, TEST_USER_PASSWORD);

    const data = await authenticatedRequest(parentToken, "query", studentProfileQueryDocument, {
      studentId: provision.studentId,
      year: null,
      month: null,
      includeUpcomingClasses: true,
    });

    expect(data.studentProfile?.id).toBe(provision.studentId);
    expect(data.studentProfile?.name).toBeDefined();
  });
});
