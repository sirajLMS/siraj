import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import {
  deleteSessionConfigMutationDocument,
  sessionConfigQueryDocument,
  sessionConfigsQueryDocument,
  upsertSessionConfigMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments/settings/session-config.documents";
import { authenticatedRequest, loginAndProvision, setupTestServerLifecycle } from "@/test/helpers";

describe("GraphQL Session Config Integration Tests", () => {
  setupTestServerLifecycle();

  let superAdminToken = "";
  const testRoleName = `settings_test_role_${randomUUID().replaceAll("-", "").slice(0, 8)}`;

  test("provision super admin for session config tests", async () => {
    const provisioned = await loginAndProvision("SessionConfigTest");
    superAdminToken = provisioned.superAdminToken;
    expect(superAdminToken).not.toBe("");
  });

  test("super admin can list session configs", async () => {
    const data = await authenticatedRequest(superAdminToken, "query", sessionConfigsQueryDocument);
    expect(Array.isArray(data.sessionConfigs)).toBeTrue();
  });

  test("super admin can upsert, fetch, and delete a session config", async () => {
    const upsertData = await authenticatedRequest(superAdminToken, "mutate", upsertSessionConfigMutationDocument, {
      input: {
        roleName: testRoleName,
        ttlSeconds: 3600,
        maxConcurrentSessions: 3,
      },
    });

    const upserted = upsertData.upsertSessionConfig;
    expect(upserted?.id).toBeDefined();
    expect(upserted?.roleName).toBe(testRoleName);
    expect(upserted?.ttlSeconds).toBe(3600);
    expect(upserted?.maxConcurrentSessions).toBe(3);

    const queryData = await authenticatedRequest(superAdminToken, "query", sessionConfigQueryDocument, {
      roleName: testRoleName,
    });
    expect(queryData.sessionConfig?.roleName).toBe(testRoleName);

    const deleteData = await authenticatedRequest(superAdminToken, "mutate", deleteSessionConfigMutationDocument, {
      roleName: testRoleName,
    });
    expect(deleteData.deleteSessionConfig).toBeTrue();
  });
});
