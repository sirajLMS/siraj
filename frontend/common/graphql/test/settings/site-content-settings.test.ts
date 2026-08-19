import { describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import {
  deleteSiteContentMutationDocument,
  siteContentEntriesQueryDocument,
  siteContentEntryQueryDocument,
  upsertSiteContentMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments/settings/site-content-settings.documents";
import { authenticatedRequest, loginAndProvision, setupTestServerLifecycle } from "@/test/helpers";

describe("GraphQL Site Content Settings Integration Tests", () => {
  setupTestServerLifecycle();

  let superAdminToken = "";
  let createdContentId = "";
  const testSlug = `settings-test-${randomUUID().replaceAll("-", "").slice(0, 8)}`;

  test("provision super admin for site content settings tests", async () => {
    const provisioned = await loginAndProvision("SiteContentSettingsTest");
    superAdminToken = provisioned.superAdminToken;
    expect(superAdminToken).not.toBe("");
  });

  test("super admin can list site content entries", async () => {
    const data = await authenticatedRequest(superAdminToken, "query", siteContentEntriesQueryDocument);
    const entries = data.siteContentEntries;
    expect(Array.isArray(entries)).toBeTrue();
  });

  test("super admin can upsert, fetch, and delete site content", async () => {
    const upsertData = await authenticatedRequest(superAdminToken, "mutate", upsertSiteContentMutationDocument, {
      input: {
        slug: testSlug,
        title: "Settings Test Page",
        body: "<p>GraphQL integration test content</p>",
        contentType: "page",
        isPublished: false,
      },
    });

    const upserted = upsertData.upsertSiteContent;
    expect(upserted?.id).toBeDefined();
    expect(upserted?.slug).toBe(testSlug);
    expect(upserted?.title).toBe("Settings Test Page");
    expect(upserted?.isPublished).toBeFalse();

    createdContentId = upserted?.id ?? "";
    expect(createdContentId).not.toBe("");

    const queryData = await authenticatedRequest(superAdminToken, "query", siteContentEntryQueryDocument, {
      id: createdContentId,
    });
    expect(queryData.siteContentEntry?.slug).toBe(testSlug);

    const deleteData = await authenticatedRequest(superAdminToken, "mutate", deleteSiteContentMutationDocument, {
      id: createdContentId,
    });
    expect(deleteData.deleteSiteContent).toBeTrue();
  });
});
