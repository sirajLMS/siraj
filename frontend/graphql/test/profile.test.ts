import { describe, expect, test } from "bun:test";
import { ProfileScope } from "@/frontend/graphql/generated/gql/graphql-types";
import { meQueryDocument } from "../sharedDocuments/auth.documents";
import { profileByUserIdQueryDocument } from "../sharedDocuments/profile.documents";
import { assertOperationDenied, authenticatedRequest, loginDemoUser } from "./helpers";
import { setupTestServerLifecycle } from "./lifecycle";

describe("GraphQL Profile Integration Tests", () => {
  setupTestServerLifecycle();

  test("profileByUserId — allowed for teacher_default own profile", async () => {
    const token = await loginDemoUser("teacher_default");
    const meData = await authenticatedRequest(token, "query", meQueryDocument);
    const userId = meData.me?.id;
    expect(userId).toBeDefined();

    const profileData = await authenticatedRequest(token, "query", profileByUserIdQueryDocument, {
      userId,
    });

    expect(profileData.profileByUserId?.scope).toBe(ProfileScope.Own);
    expect(profileData.profileByUserId?.teacherOwnProfile?.id).toBeDefined();
  });

  test("profileByUserId — denied for teacher_default viewing another user", async () => {
    await assertOperationDenied("teacher_default", "query", profileByUserIdQueryDocument, {
      userId: "00000000-0000-4000-8000-000000000099",
    });
  });
});
