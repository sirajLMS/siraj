import { describe, expect, test } from "bun:test";
import { SystemSettingCategory, SystemSettingDataType } from "@/frontend/common/graphql/generated/gql/graphql-types";
import {
  systemSettingQueryDocument,
  systemSettingsQueryDocument,
  upsertSystemSettingMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments/settings/general-settings.documents";
import { authenticatedRequest, loginAndProvision, setupTestServerLifecycle } from "@/test/helpers";

describe("GraphQL General Settings Integration Tests", () => {
  setupTestServerLifecycle();

  let superAdminToken = "";
  const testSettingCode = "maintenance_mode";

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
    expect(setting?.dataType).toBe(SystemSettingDataType.Integer);
    expect(setting?.category).toBe(SystemSettingCategory.Security);
  });

  test("super admin can upsert a known general system setting value", async () => {
    const beforeData = await authenticatedRequest(superAdminToken, "query", systemSettingQueryDocument, {
      key: testSettingCode,
    });
    const originalValue = beforeData.systemSetting?.value ?? "false";

    const upsertData = await authenticatedRequest(superAdminToken, "mutate", upsertSystemSettingMutationDocument, {
      input: {
        key: testSettingCode,
        value: "true",
        dataType: SystemSettingDataType.Boolean,
        description: "Enable maintenance mode",
        category: SystemSettingCategory.System,
      },
    });

    const upserted = upsertData.upsertSystemSetting;
    expect(upserted?.id).toBe(testSettingCode);
    expect(upserted?.key).toBe(testSettingCode);
    expect(upserted?.value).toBe("true");
    expect(upserted?.dataType).toBe(SystemSettingDataType.Boolean);
    expect(upserted?.category).toBe(SystemSettingCategory.System);

    const restoreData = await authenticatedRequest(superAdminToken, "mutate", upsertSystemSettingMutationDocument, {
      input: {
        key: testSettingCode,
        value: originalValue,
        dataType: SystemSettingDataType.Boolean,
        description: "Enable maintenance mode",
        category: SystemSettingCategory.System,
      },
    });
    expect(restoreData.upsertSystemSetting?.value).toBe(originalValue);
  });
});
