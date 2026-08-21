import { describe, expect, test } from "bun:test";
import { ProfileScope } from "@/frontend/common/graphql/generated/gql/graphql";
import { meQueryDocument } from "@/frontend/common/graphql/sharedDocuments/auth/auth.documents";
import { profileByUserIdQueryDocument } from "@/frontend/common/graphql/sharedDocuments/profile/profile.documents";
import { authenticatedRequest, loginDemoUser, setupTestServerLifecycle, testClient } from "@/test/helpers";

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
    const token = await loginDemoUser("teacher_default");
    const result = await testClient.query({
      query: profileByUserIdQueryDocument,
      variables: { userId: "00000000-0000-4000-8000-000000000099" },
      context: { headers: { Authorization: `Bearer ${token}` } },
    });

    expect(result.error).toBeDefined();
    expect(result.data?.profileByUserId).toBeNull();
  });
});
