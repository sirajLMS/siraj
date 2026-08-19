import { describe, expect, test } from "bun:test";
import { settingsAuditLogsQueryDocument } from "@/frontend/common/graphql/sharedDocuments/settings/settings-audit.documents";
import { authenticatedRequest, loginAndProvision, setupTestServerLifecycle } from "@/test/helpers";

describe("GraphQL Settings Audit Integration Tests", () => {
  setupTestServerLifecycle();

  let superAdminToken = "";

  test("provision super admin for settings audit tests", async () => {
    const provisioned = await loginAndProvision("SettingsAuditTest");
    superAdminToken = provisioned.superAdminToken;
    expect(superAdminToken).not.toBe("");
  });

  test("super admin can query settings audit logs", async () => {
    const data = await authenticatedRequest(superAdminToken, "query", settingsAuditLogsQueryDocument, {
      filter: {
        action: null,
        actorUserId: null,
        endDate: null,
        entityType: null,
        limit: 10,
        offset: 0,
        startDate: null,
      },
    });

    const result = data.settingsAuditLogs;
    expect(result?.id).toBe("settings-audit-logs");
    expect(typeof result?.total).toBe("number");
    expect(typeof result?.hasMore).toBe("boolean");
    expect(Array.isArray(result?.logs)).toBeTrue();
  });
});
