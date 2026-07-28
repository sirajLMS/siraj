import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import {
  deleteSystemSettingMutationDocument,
  systemSettingQueryDocument,
  systemSettingsQueryDocument,
  upsertSystemSettingMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments/settings/general-settings.documents";
import { authenticatedRequest, loginAndProvision } from "@/frontend/common/graphql/test/helpers";
import { setupTestServerLifecycle } from "@/frontend/common/graphql/test/lifecycle";

describe("GraphQL General Settings Integration Tests", () => {
  setupTestServerLifecycle();

  let superAdminToken = "";
  const testSettingKey = `test_general_setting_${randomUUID().replaceAll("-", "").slice(0, 8)}`;

  test("provision super admin for general settings tests", async () => {
    const provisioned = await loginAndProvision("GeneralSettingsTest");
    superAdminToken = provisioned.superAdminToken;
    expect(superAdminToken).not.toBe("");
  });

  test("super admin can list system settings", async () => {
    const data = await authenticatedRequest(superAdminToken, "query", systemSettingsQueryDocument);
    const settings = data.systemSettings;
    expect(Array.isArray(settings)).toBeTrue();
    expect(settings?.some(setting => setting?.key === "auth_max_attempts")).toBeTrue();
  });

  test("super admin can fetch a seeded system setting by key", async () => {
    const data = await authenticatedRequest(superAdminToken, "query", systemSettingQueryDocument, {
      key: "auth_max_attempts",
    });
    const setting = data.systemSetting;
    expect(setting?.id).toBe("auth_max_attempts");
    expect(setting?.key).toBe("auth_max_attempts");
    expect(setting?.value).toBeDefined();
  });

  test("super admin can upsert and delete a general system setting", async () => {
    const upsertData = await authenticatedRequest(superAdminToken, "mutate", upsertSystemSettingMutationDocument, {
      input: {
        key: testSettingKey,
        value: "42",
        dataType: "integer",
        description: "GraphQL integration test setting",
        category: "system",
      },
    });

    const upserted = upsertData.upsertSystemSetting;
    expect(upserted?.id).toBe(testSettingKey);
    expect(upserted?.key).toBe(testSettingKey);
    expect(upserted?.value).toBe("42");

    const deleteData = await authenticatedRequest(superAdminToken, "mutate", deleteSystemSettingMutationDocument, {
      key: testSettingKey,
    });
    expect(deleteData.deleteSystemSetting).toBeTrue();
  });
});
