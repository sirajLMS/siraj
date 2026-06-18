import { describe, expect, test } from "bun:test";
import { demoLoginMutationDocument } from "../sharedDocuments/auth.documents";
import {
  dailyScheduleListQueryDocument,
  dailyScheduleMetricsQueryDocument,
} from "../sharedDocuments/schedule.documents";
import { setupTestServerLifecycle } from "./lifecycle";
import { testClient } from "./testClient";

describe("GraphQL Schedule Integration Tests", () => {
  setupTestServerLifecycle();

  let authToken: string | null = null;
  const testDate = new Date().toISOString().split("T")[0]; // "YYYY-MM-DD"

  test("login as super_admin to perform schedule queries", async () => {
    const result = await testClient.mutate({
      mutation: demoLoginMutationDocument,
      variables: {
        input: {
          groupSlug: "super_admin",
        },
      },
    });

    expect(result.data).toBeDefined();
    expect(result.error).toBeUndefined();
    authToken = result.data?.demoLogin?.token || null;
    if (!authToken) throw new Error("No auth token");
  });

  test("returns daily schedule metrics", async () => {
    const result = await testClient.query({
      query: dailyScheduleMetricsQueryDocument,
      variables: {
        date: testDate,
        teacherId: null,
      },
      context: {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      },
    });

    expect(result.data).toBeDefined();
    expect(result.error).toBeUndefined();
    if (!result.data) throw new Error("No data");
    expect(result.data.dailyScheduleMetrics).toBeDefined();
    if (result.data.dailyScheduleMetrics) {
      expect(result.data.dailyScheduleMetrics.total).toBeGreaterThanOrEqual(0);
    }
  });

  test("returns daily schedule list", async () => {
    const result = await testClient.query({
      query: dailyScheduleListQueryDocument,
      variables: {
        date: testDate,
        teacherId: null,
        search: null,
      },
      context: {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      },
    });

    expect(result.data).toBeDefined();
    expect(result.error).toBeUndefined();
    if (!result.data) throw new Error("No data");
    expect(Array.isArray(result.data.dailyScheduleList)).toBeTrue();
  });
});
