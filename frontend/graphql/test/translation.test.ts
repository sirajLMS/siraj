import { describe, expect, test } from "bun:test";
import {
  translatedMessageQueryDocument,
  welcomeMessageQueryDocument,
} from "@/frontend/graphql/sharedDocuments/translation.documents";
import { loginDemoUser } from "@/frontend/graphql/test/helpers";
import { setupTestServerLifecycle } from "@/frontend/graphql/test/lifecycle";
import { testClient } from "@/frontend/graphql/test/testClient";
import ar from "@/shared/messages/ar";
import en from "@/shared/messages/en";

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
      expect(result.data.welcomeMessage).toBe(ar.common.welcome);
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
      expect(result.data.welcomeMessage).toBe(en.common.welcome);
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
      expect(result.data.welcomeMessage).toBe(ar.common.welcome);
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
      expect(result.data.welcomeMessage).toBe(en.common.welcome);
    }
  });

  test("returns translatedMessage for common.title dynamically", async () => {
    const resultEn = await testClient.query({
      query: translatedMessageQueryDocument,
      variables: {
        key: "title",
        namespace: "common",
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
      expect(resultEn.data.translatedMessage).toBe(en.common.title);
    }

    const resultAr = await testClient.query({
      query: translatedMessageQueryDocument,
      variables: {
        key: "title",
        namespace: "common",
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
      expect(resultAr.data.translatedMessage).toBe(ar.common.title);
    }
  });
});
