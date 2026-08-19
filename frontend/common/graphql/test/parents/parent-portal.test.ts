import { describe, expect, test } from "bun:test";
import type { ApolloClient, DefaultContext, TypedDocumentNode } from "@apollo/client";
import {
  parentAssignedStudentsQueryDocument,
  parentHandbookUrlQueryDocument,
  parentOwnProfileQueryDocument,
} from "@/frontend/common/graphql/sharedDocuments";
import { loginDemoUser, setupTestServerLifecycle, testClient } from "@/test/helpers";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Executes an authenticated query for a demo user and returns the result,
 * centralizing login + query setup to avoid duplication across test cases.
 */
async function queryAsDemoUser<TData, TVars = Record<string, unknown>>(
  groupSlug: string,
  document: TypedDocumentNode<TData, TVars>
): Promise<ApolloClient.QueryResult<TData>> {
  const token = await loginDemoUser(groupSlug);
  const context: DefaultContext = { headers: { Authorization: `Bearer ${token}` } };
  return testClient.query({ query: document, context });
}

/**
 * Asserts that a query is denied for the given role: result.error is defined
 * and result.data is null.
 */
async function expectQueryDenied<TData, TVars = Record<string, unknown>>(
  groupSlug: string,
  document: TypedDocumentNode<TData, TVars>,
  dataKey: keyof TData
) {
  const result = await queryAsDemoUser(groupSlug, document);
  expect(result.error).toBeDefined();
  const data: unknown = result.data;
  expect(isRecord(data) ? data[String(dataKey)] : undefined).toBeNull();
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
