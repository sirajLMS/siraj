import { describe, expect, test } from "bun:test";
import { translatedMessageQueryDocument, welcomeMessageQueryDocument } from "@/frontend/common/graphql/sharedDocuments";
import { arMessages } from "@/shared/locale/ar/messages";
import { enMessages } from "@/shared/locale/en/messages";
import { loginDemoUser, setupTestServerLifecycle, testClient } from "@/test/helpers";

const ar = arMessages;
const en = enMessages;

describe("GraphQL Translation Integration Tests", () => {
  setupTestServerLifecycle();

  let adminToken = "";

  test("login as academy_admin for authenticated translation queries", async () => {
    adminToken = await loginDemoUser("academy_admin");
    expect(adminToken).toBeTruthy();
  });

  test("returns welcomeMessage in Arabic by default", async () => {
    const result = await testClient.query({
      query: welcomeMessageQueryDocument,
    });
    expect(result.data).toBeDefined();
    if (result.data) {
      expect(result.data.welcomeMessage).toBe(ar.commonTranslations.welcome);
    }
  });

  test("returns welcomeMessage in English with Accept-Language header", async () => {
    const result = await testClient.query({
      query: welcomeMessageQueryDocument,
      context: {
        headers: {
          "Accept-Language": "en",
        },
      },
    });
    expect(result.data).toBeDefined();
    if (result.data) {
      expect(result.data.welcomeMessage).toBe(en.commonTranslations.welcome);
    }
  });

  test("returns welcomeMessage in Arabic with Accept-Language header", async () => {
    const result = await testClient.query({
      query: welcomeMessageQueryDocument,
      context: {
        headers: {
          "Accept-Language": "ar",
        },
      },
    });
    expect(result.data).toBeDefined();
    if (result.data) {
      expect(result.data.welcomeMessage).toBe(ar.commonTranslations.welcome);
    }
  });

  test("returns welcomeMessage in English using NEXT_LOCALE cookie", async () => {
    const result = await testClient.query({
      query: welcomeMessageQueryDocument,
      context: {
        headers: {
          Cookie: "NEXT_LOCALE=en",
        },
      },
    });
    expect(result.data).toBeDefined();
    if (result.data) {
      expect(result.data.welcomeMessage).toBe(en.commonTranslations.welcome);
    }
  });

  test("returns translatedMessage for common.title dynamically", async () => {
    const resultEn = await testClient.query({
      query: translatedMessageQueryDocument,
      variables: {
        key: "title",
        namespace: "commonTranslations",
      },
      context: {
        headers: {
          "Accept-Language": "en",
          Authorization: `Bearer ${adminToken}`,
        },
      },
    });
    expect(resultEn.data).toBeDefined();
    if (resultEn.data) {
      expect(resultEn.data.translatedMessage).toBe(en.commonTranslations.title);
    }

    const resultAr = await testClient.query({
      query: translatedMessageQueryDocument,
      variables: {
        key: "title",
        namespace: "commonTranslations",
      },
      context: {
        headers: {
          "Accept-Language": "ar",
          Authorization: `Bearer ${adminToken}`,
        },
      },
    });
    expect(resultAr.data).toBeDefined();
    if (resultAr.data) {
      expect(resultAr.data.translatedMessage).toBe(ar.commonTranslations.title);
    }
  });
});
