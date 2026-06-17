import { describe, expect, test } from "bun:test";
import ar from "@/shared/messages/ar";
import en from "@/shared/messages/en";
import { translatedMessageQueryDocument, welcomeMessageQueryDocument } from "../sharedDocuments/translation.documents";
import { testClient } from "./testClient";
import { setupTestServer } from "./testServer";

describe("GraphQL Translation Integration Tests", () => {
  setupTestServer();

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
        },
      },
    });
    expect(resultAr.data).toBeDefined();
    if (resultAr.data) {
      expect(resultAr.data.translatedMessage).toBe(ar.common.title);
    }
  });
});
