import { describe, expect, test } from "bun:test";
import {
  deleteEnvConfigEntryMutationDocument,
  envConfigEntriesQueryDocument,
  upsertEnvConfigEntryMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments/settings/environment-config.documents";
import { HIDDEN_ENV_CONFIG_KEYS } from "@/shared/constants/env-config-keys";
import { authenticatedRequest, loginAndProvision, setupTestServerLifecycle } from "@/test/helpers";

const TEST_ENV_KEY = "STORAGE_PROVIDER";
const TEST_ENV_VALUE = "gcp";

describe("GraphQL Environment Config Integration Tests", () => {
  setupTestServerLifecycle();

  let superAdminToken = "";

  test("provision super admin for environment config tests", async () => {
    const provisioned = await loginAndProvision("EnvConfigTest");
    superAdminToken = provisioned.superAdminToken;
    expect(superAdminToken).not.toBe("");
  });

  test("super admin can list env config entries", async () => {
    const data = await authenticatedRequest(superAdminToken, "query", envConfigEntriesQueryDocument);
    const entries = data.envConfigEntries;
    expect(Array.isArray(entries)).toBeTrue();
    expect(entries?.some(entry => entry?.key === TEST_ENV_KEY)).toBeTrue();
  });

  test("env-only keys are not exposed via GraphQL", async () => {
    const data = await authenticatedRequest(superAdminToken, "query", envConfigEntriesQueryDocument);
    const keys = (data.envConfigEntries ?? []).map(entry => entry?.key);
    for (const hiddenKey of HIDDEN_ENV_CONFIG_KEYS) {
      expect(keys).not.toContain(hiddenKey);
    }
    for (const entry of data.envConfigEntries ?? []) {
      expect(entry?.excludeFromDb).not.toBeTrue();
    }
  });

  test("super admin can upsert and delete an env config override", async () => {
    const upsertData = await authenticatedRequest(superAdminToken, "mutate", upsertEnvConfigEntryMutationDocument, {
      input: {
        key: TEST_ENV_KEY,
        value: TEST_ENV_VALUE,
      },
    });

    const upserted = upsertData.upsertEnvConfigEntry;
    expect(upserted?.id).toBe(TEST_ENV_KEY);
    expect(upserted?.key).toBe(TEST_ENV_KEY);
    expect(upserted?.hasDbOverride).toBeTrue();

    const deleteData = await authenticatedRequest(superAdminToken, "mutate", deleteEnvConfigEntryMutationDocument, {
      key: TEST_ENV_KEY,
    });

    const deleted = deleteData.deleteEnvConfigEntry;
    expect(deleted?.id).toBe(TEST_ENV_KEY);
    expect(deleted?.deleted).toBeTrue();
  });
});
