import { describe, expect, test } from "bun:test";
import { settingsTimezonesQueryDocument } from "@/frontend/common/graphql/sharedDocuments/settings/timezones-settings.documents";
import { authenticatedRequest, loginAndProvision, setupTestServerLifecycle } from "@/test/helpers";

describe("GraphQL Settings Timezones Integration Tests", () => {
  setupTestServerLifecycle();

  let superAdminToken = "";

  test("provision super admin for settings timezones tests", async () => {
    const provisioned = await loginAndProvision("SettingsTimezonesTest");
    superAdminToken = provisioned.superAdminToken;
    expect(superAdminToken).not.toBe("");
  });

  test("super admin can query paginated settings timezones", async () => {
    const data = await authenticatedRequest(superAdminToken, "query", settingsTimezonesQueryDocument, {
      paginationArgs: {
        after: null,
        before: null,
        first: null,
        last: null,
        maxCount: 10,
        page: 1,
        skip: null,
      },
    });

    const result = data.settingsTimezones;
    expect(result?.id).toBeDefined();
    expect(typeof result?.totalCount).toBe("number");
    expect(result?.totalCount).toBeGreaterThan(0);
    expect(Array.isArray(result?.rows)).toBeTrue();
    expect(result?.rows?.[0]?.id).toBeDefined();
    expect(result?.rows?.[0]?.ianaId).toBeDefined();
    expect(result?.pageInfo?.currentPage).toBe(1);
  });
});
