import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import {
  createMeetingProviderMutationDocument,
  createUserMeetingConfigMutationDocument,
  meetingProvidersQueryDocument,
  setDefaultMeetingConfigMutationDocument,
  userMeetingConfigQueryDocument,
  userMeetingConfigsQueryDocument,
} from "@/frontend/graphql/sharedDocuments/meeting/meeting.documents";
import { authenticatedRequest, cleanupTestEntities, loginAndProvision } from "@/frontend/graphql/test/helpers";
import { setupTestServerLifecycle } from "@/frontend/graphql/test/lifecycle";
import { testClient } from "@/frontend/graphql/test/testClient";

function buildProviderInput(slug: string) {
  return {
    slug,
    name: { en: "Zoom", ar: "زووم" },
    description: { en: "Zoom video conferencing", ar: "مؤتمرات زووم" },
    instructions: null,
    logoUrl: null,
    urlAllowlist: ["zoom.us", "*.zoom.us"],
    urlExample: "https://zoom.us/j/123456789",
    fieldSchema: {
      requiresMeetingUrl: true,
      supportsPassword: true,
      supportsUsername: null,
      supportsTenantId: null,
    },
    isActive: true,
  };
}

describe("GraphQL Meeting Config Integration Tests", () => {
  setupTestServerLifecycle();

  let superAdminToken = "";
  let teacherToken = "";
  let teacherUserId = "";
  let parentUserId = "";
  let providerId = "";
  let configId = "";

  const entityIds = {
    studentId: "",
    teacherId: "",
    studentUserId: "",
    teacherUserId: "",
    parentUserId: "",
    parentId: "",
  };

  test("provision test entities and login", async () => {
    const result = await loginAndProvision("MeetingConfigTest");
    superAdminToken = result.superAdminToken;
    teacherToken = result.teacherToken;
    teacherUserId = result.teacherUserId;
    parentUserId = result.parentUserId;

    entityIds.studentId = result.studentId;
    entityIds.teacherId = result.teacherId;
    entityIds.studentUserId = result.studentUserId;
    entityIds.teacherUserId = result.teacherUserId;
    entityIds.parentUserId = result.parentUserId;
    entityIds.parentId = result.parentId;

    expect(superAdminToken).not.toBe("");
    expect(teacherToken).not.toBe("");
    expect(teacherUserId).not.toBe("");
    expect(parentUserId).not.toBe("");
  });

  test("super admin can create a meeting provider", async () => {
    const slug = `zoom-${randomUUID().slice(0, 8)}`;
    const data = await authenticatedRequest(superAdminToken, "mutate", createMeetingProviderMutationDocument, {
      input: buildProviderInput(slug),
    });

    const provider = data.createMeetingProvider;
    expect(provider).toBeDefined();
    expect(provider?.id).toBeDefined();
    expect(provider?.slug).toBe(slug);
    expect(provider?.isActive).toBe(true);

    providerId = provider?.id ?? "";
    expect(providerId).not.toBe("");
  });

  test("authenticated user can list active meeting providers", async () => {
    const data = await authenticatedRequest(teacherToken, "query", meetingProvidersQueryDocument, {
      activeOnly: true,
    });

    const providers = data.meetingProviders;
    expect(Array.isArray(providers)).toBeTrue();
    expect(providers?.some(provider => provider?.id === providerId)).toBeTrue();
  });

  test("super admin can create a user meeting config for teacher", async () => {
    const data = await authenticatedRequest(superAdminToken, "mutate", createUserMeetingConfigMutationDocument, {
      input: {
        userId: teacherUserId,
        providerId,
        label: "Teacher Zoom",
        isDefault: true,
        password: null,
        details: {
          meetingUrl: "https://zoom.us/j/555666777",
          username: null,
          tenantId: null,
        },
      },
    });

    const config = data.createUserMeetingConfig;
    expect(config).toBeDefined();
    expect(config?.id).toBeDefined();
    expect(config?.userId).toBe(teacherUserId);
    expect(config?.providerId).toBe(providerId);
    expect(config?.isDefault).toBe(true);
    expect(config?.details?.meetingUrl).toBe("https://zoom.us/j/555666777");

    configId = config?.id ?? "";
    expect(configId).not.toBe("");
  });

  test("setDefaultMeetingConfig switches the default config for the user", async () => {
    const secondConfigData = await authenticatedRequest(
      superAdminToken,
      "mutate",
      createUserMeetingConfigMutationDocument,
      {
        input: {
          userId: teacherUserId,
          providerId,
          label: "Teacher Backup Zoom",
          isDefault: false,
          password: null,
          details: { meetingUrl: "https://zoom.us/j/888999000", username: null, tenantId: null },
        },
      }
    );

    const secondConfigId = secondConfigData.createUserMeetingConfig?.id;
    expect(secondConfigId).toBeDefined();

    const defaultData = await authenticatedRequest(superAdminToken, "mutate", setDefaultMeetingConfigMutationDocument, {
      id: secondConfigId ?? "",
    });

    const defaulted = defaultData.setDefaultMeetingConfig;
    expect(defaulted?.id).toBe(secondConfigId);
    expect(defaulted?.isDefault).toBe(true);

    const listData = await authenticatedRequest(superAdminToken, "query", userMeetingConfigsQueryDocument, {
      userId: teacherUserId,
    });
    const configs = listData.userMeetingConfigs ?? [];
    const defaultCount = configs.filter(config => config?.isDefault).length;
    expect(defaultCount).toBe(1);
    expect(configs.find(config => config?.id === secondConfigId)?.isDefault).toBe(true);
    expect(configs.find(config => config?.id === configId)?.isDefault).toBe(false);
  });

  test("teacher cannot read another user's meeting config (IDOR)", async () => {
    const parentConfigData = await authenticatedRequest(
      superAdminToken,
      "mutate",
      createUserMeetingConfigMutationDocument,
      {
        input: {
          userId: parentUserId,
          providerId,
          label: "Parent Zoom",
          isDefault: true,
          password: null,
          details: { meetingUrl: "https://zoom.us/j/444555666", username: null, tenantId: null },
        },
      }
    );

    const parentConfigId = parentConfigData.createUserMeetingConfig?.id;
    expect(parentConfigId).toBeDefined();

    const result = await testClient.query({
      query: userMeetingConfigQueryDocument,
      variables: { id: parentConfigId ?? "" },
      context: { headers: { Authorization: `Bearer ${teacherToken}` } },
    });

    expect(result.error).toBeDefined();
  });

  test("teacher cannot list another user's meeting configs (IDOR)", async () => {
    const result = await testClient.query({
      query: userMeetingConfigsQueryDocument,
      variables: { userId: parentUserId },
      context: { headers: { Authorization: `Bearer ${teacherToken}` } },
    });

    expect(result.error).toBeDefined();
  });

  test("cleanup test entities", async () => {
    await cleanupTestEntities(superAdminToken, entityIds);
  });
});
