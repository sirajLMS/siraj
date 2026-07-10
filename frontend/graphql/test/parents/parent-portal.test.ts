import { describe, expect, test } from "bun:test";
import type { OperationVariables, TypedDocumentNode } from "@apollo/client";
import {
  parentAssignedStudentsQueryDocument,
  parentHandbookUrlQueryDocument,
  parentOwnProfileQueryDocument,
} from "@/frontend/graphql/sharedDocuments";
import { loginDemoUser } from "@/frontend/graphql/test/helpers";
import { setupTestServerLifecycle } from "@/frontend/graphql/test/lifecycle";
import { testClient } from "@/frontend/graphql/test/testClient";

/**
 * Executes an authenticated query for a demo user and returns the result,
 * centralizing login + query setup to avoid duplication across test cases.
 */
async function queryAsDemoUser<TData, TVars extends OperationVariables = OperationVariables>(
  groupSlug: string,
  document: TypedDocumentNode<TData, TVars>
) {
  const token = await loginDemoUser(groupSlug);
  return testClient.query({
    query: document,
    context: { headers: { Authorization: `Bearer ${token}` } },
  } as Parameters<typeof testClient.query>[0]);
}

/**
 * Asserts that a query is denied for the given role: result.error is defined
 * and result.data is null.
 */
async function expectQueryDenied<TData, TVars extends OperationVariables = OperationVariables>(
  groupSlug: string,
  document: TypedDocumentNode<TData, TVars>,
  dataKey: keyof TData
) {
  const result = await queryAsDemoUser(groupSlug, document);
  expect(result.error).toBeDefined();
  expect(result.data?.[dataKey]).toBeNull();
}

describe("GraphQL Parent Portal Integration Tests", () => {
  setupTestServerLifecycle();

  test("parentAssignedStudents — allowed for parent_default", async () => {
    const result = await queryAsDemoUser("parent_default", parentAssignedStudentsQueryDocument);

    expect(result.error).toBeUndefined();
    expect(result.data?.parentAssignedStudents).toBeDefined();
    expect(Array.isArray(result.data?.parentAssignedStudents?.rows)).toBeTrue();
  });

  test("parentOwnProfile — allowed for parent_default", async () => {
    const result = await queryAsDemoUser("parent_default", parentOwnProfileQueryDocument);

    expect(result.error).toBeUndefined();
    expect(result.data?.parentOwnProfile?.id).toBeDefined();
    expect(result.data?.parentOwnProfile?.name).toBeDefined();
  });

  test("parentHandbookUrl — allowed for parent_default", async () => {
    const result = await queryAsDemoUser("parent_default", parentHandbookUrlQueryDocument);

    expect(result.error).toBeUndefined();
    expect(result.data?.parentHandbookUrl?.url).toBeDefined();
  });

  test("parentAssignedStudents — denied for teacher_default", async () => {
    await expectQueryDenied("teacher_default", parentAssignedStudentsQueryDocument, "parentAssignedStudents");
  });

  test("parentOwnProfile — denied for teacher_default", async () => {
    await expectQueryDenied("teacher_default", parentOwnProfileQueryDocument, "parentOwnProfile");
  });

  test("parentHandbookUrl — denied for teacher_default", async () => {
    await expectQueryDenied("teacher_default", parentHandbookUrlQueryDocument, "parentHandbookUrl");
  });
});
