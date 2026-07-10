import { describe, expect, test } from "bun:test";
import { studentProfileQueryDocument } from "@/frontend/graphql/sharedDocuments/students/student-profile.documents";
import { authenticatedRequest, loginAndProvision, loginDemoUser } from "@/frontend/graphql/test/helpers";
import { setupTestServerLifecycle } from "@/frontend/graphql/test/lifecycle";

describe("GraphQL Student Profile Integration Tests", () => {
  setupTestServerLifecycle();

  test("studentProfile — parent_default can load associated student profile", async () => {
    const provision = await loginAndProvision("StudentProfileTest");
    const parentToken = await loginDemoUser("parent_default");

    const data = await authenticatedRequest(parentToken, "query", studentProfileQueryDocument, {
      studentId: provision.studentId,
    });

    expect(data.studentProfile?.id).toBe(provision.studentId);
    expect(data.studentProfile?.name).toBeDefined();
  });
});
