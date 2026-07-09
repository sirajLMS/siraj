import { describe, expect, test } from "bun:test";
import {
  parentAssignedStudentsQueryDocument,
  parentHandbookUrlQueryDocument,
  parentOwnProfileQueryDocument,
} from "@/frontend/graphql/sharedDocuments/parent-portal.documents";
import { loginDemoUser } from "@/frontend/graphql/test/helpers";
import { setupTestServerLifecycle } from "@/frontend/graphql/test/lifecycle";
import { testClient } from "@/frontend/graphql/test/testClient";

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
    const token = await loginDemoUser("teacher_default");
    const result = await testClient.query({
      query: parentAssignedStudentsQueryDocument,
      context: { headers: { Authorization: `Bearer ${token}` } },
    });

    expect(result.error).toBeDefined();
    expect(result.data?.parentAssignedStudents).toBeNull();
  });

  test("parentOwnProfile — denied for teacher_default", async () => {
    const token = await loginDemoUser("teacher_default");
    const result = await testClient.query({
      query: parentOwnProfileQueryDocument,
      context: { headers: { Authorization: `Bearer ${token}` } },
    });

    expect(result.error).toBeDefined();
    expect(result.data?.parentOwnProfile).toBeNull();
  });

  test("parentHandbookUrl — denied for teacher_default", async () => {
    const token = await loginDemoUser("teacher_default");
    const result = await testClient.query({
      query: parentHandbookUrlQueryDocument,
      context: { headers: { Authorization: `Bearer ${token}` } },
    });

    expect(result.error).toBeDefined();
    expect(result.data?.parentHandbookUrl).toBeNull();
  });
});
