import { describe, expect, test } from "bun:test";
import {
  parentAssignedStudentsQueryDocument,
  parentHandbookUrlQueryDocument,
  parentOwnProfileQueryDocument,
} from "../sharedDocuments/parent-portal.documents";
import { assertOperationDenied, loginDemoUser } from "./helpers";
import { setupTestServerLifecycle } from "./lifecycle";
import { testClient } from "./testClient";

describe("GraphQL Parent Portal Integration Tests", () => {
  setupTestServerLifecycle();

  test("parentAssignedStudents — allowed for parent_default", async () => {
    const token = await loginDemoUser("parent_default");
    const result = await testClient.query({
      query: parentAssignedStudentsQueryDocument,
      context: { headers: { Authorization: `Bearer ${token}` } },
    });

    expect(result.error).toBeUndefined();
    expect(result.data?.parentAssignedStudents).toBeDefined();
    expect(Array.isArray(result.data?.parentAssignedStudents?.rows)).toBeTrue();
  });

  test("parentOwnProfile — allowed for parent_default", async () => {
    const token = await loginDemoUser("parent_default");
    const result = await testClient.query({
      query: parentOwnProfileQueryDocument,
      context: { headers: { Authorization: `Bearer ${token}` } },
    });

    expect(result.error).toBeUndefined();
    expect(result.data?.parentOwnProfile?.id).toBeDefined();
    expect(result.data?.parentOwnProfile?.name).toBeDefined();
  });

  test("parentHandbookUrl — allowed for parent_default", async () => {
    const token = await loginDemoUser("parent_default");
    const result = await testClient.query({
      query: parentHandbookUrlQueryDocument,
      context: { headers: { Authorization: `Bearer ${token}` } },
    });

    expect(result.error).toBeUndefined();
    expect(result.data?.parentHandbookUrl?.url).toBeDefined();
  });

  test("parentAssignedStudents — denied for teacher_default", async () => {
    await assertOperationDenied("teacher_default", "query", parentAssignedStudentsQueryDocument, {});
  });

  test("parentOwnProfile — denied for teacher_default", async () => {
    await assertOperationDenied("teacher_default", "query", parentOwnProfileQueryDocument, {});
  });

  test("parentHandbookUrl — denied for teacher_default", async () => {
    await assertOperationDenied("teacher_default", "query", parentHandbookUrlQueryDocument, {});
  });
});
