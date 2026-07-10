import { describe, expect, test } from "bun:test";
import { ProfileScope } from "@/frontend/graphql/generated/gql/graphql-types";
import { meQueryDocument } from "@/frontend/graphql/sharedDocuments/auth/auth.documents";
import { profileByUserIdQueryDocument } from "@/frontend/graphql/sharedDocuments/profile/profile.documents";
import { authenticatedRequest, loginDemoUser } from "@/frontend/graphql/test/helpers";
import { setupTestServerLifecycle } from "@/frontend/graphql/test/lifecycle";
import { testClient } from "@/frontend/graphql/test/testClient";

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
