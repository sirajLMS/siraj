import { expect } from "bun:test";
import type { OperationVariables, TypedDocumentNode } from "@apollo/client";
import type { CreateRecurringClassInput } from "../generated/gql/graphql-types";
import { demoLoginMutationDocument, loginMutationDocument } from "../sharedDocuments/auth.documents";
import { createRecurringClassMutationDocument } from "../sharedDocuments/recurring-class.documents";
import { dailyScheduleListQueryDocument } from "../sharedDocuments/schedule.documents";
import { testClient } from "./testClient";

/**
 * Logs in a demo user using their group slug and returns the auth token.
 */
export async function loginDemoUser(groupSlug: string): Promise<string> {
  const result = await testClient.mutate({
    mutation: demoLoginMutationDocument,
    variables: {
      input: {
        groupSlug,
      },
    },
  });
  const token = result.data?.demoLogin?.token;
  if (!token) {
    throw new Error(`Failed to login demo user: ${groupSlug}`);
  }
  return token;
}

/**
 * Logs in a standard user using email and password, returning their auth token.
 */
export async function loginUser(email: string, password = "password"): Promise<string> {
  const result = await testClient.mutate({
    mutation: loginMutationDocument,
    variables: {
      input: {
        email,
        password,
      },
    },
  });
  const token = result.data?.login?.token;
  if (!token) {
    throw new Error(`Failed to login user: ${email}`);
  }
  return token;
}

/**
 * Helper to perform an authenticated GraphQL request (query or mutation) with a Bearer token.
 * Automatically handles standard assertions for result data presence and lack of errors.
 *
 * @param token - The Bearer token to include in the Authorization header.
 * @param type - The type of operation, either "query" or "mutate".
 * @param document - The typed GraphQL document node representing the query or mutation.
 * @param variables - Optional variables required for the GraphQL operation.
 * @returns A promise resolving to the data returned by the GraphQL operation.
 */
export async function authenticatedRequest<TData, TVariables extends OperationVariables = OperationVariables>(
  token: string,
  type: "query" | "mutate",
  document: TypedDocumentNode<TData, TVariables>,
  variables?: TVariables
): Promise<TData> {
  const context = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const result =
    type === "query"
      ? await testClient.query({
          query: document,
          variables,
          context,
        } as Parameters<typeof testClient.query>[0])
      : await testClient.mutate({
          mutation: document,
          variables,
          context,
        } as Parameters<typeof testClient.mutate>[0]);

  expect(result.data).toBeDefined();
  expect(result.error).toBeUndefined();
  if (!result.data) throw new Error("No data");
  return result.data as TData;
}

/**
 * Fetches the daily schedule list and returns the first student and teacher ID pair.
 */
export async function fetchFirstStudentTeacherPair(
  adminToken: string,
  date: string
): Promise<{ studentId: string; teacherId: string }> {
  const result = await testClient.query({
    query: dailyScheduleListQueryDocument,
    variables: {
      date,
      teacherId: null,
      search: null,
    },
    context: {
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    },
  });

  const list = result.data?.dailyScheduleList;
  if (!Array.isArray(list)) {
    throw new TypeError("No daily schedule list returned");
  }

  const found = list.find(item => item?.student?.id && item?.teacher?.id);
  if (!found?.student?.id || !found?.teacher?.id) {
    throw new Error("Could not find matching student/teacher pair");
  }

  return {
    studentId: found.student.id,
    teacherId: found.teacher.id,
  };
}

/**
 * Verifies that the weekly schedule grid structure has valid shape and correct teacher ID.
 */
export function verifyWeeklyScheduleGrid(
  schedule: { id: string | null; teacherId?: string | null; classes?: unknown[] | null } | null | undefined,
  expectedTeacherId?: string | null
): void {
  expect(schedule).toBeDefined();
  if (!schedule) throw new Error("No schedule returned");
  expect(schedule.id).toBeDefined();
  if (expectedTeacherId !== undefined) {
    expect(schedule.teacherId).toBe(expectedTeacherId);
  } else {
    expect(schedule.teacherId).toBeDefined();
  }
  expect(Array.isArray(schedule.classes)).toBeTrue();
}

/**
 * Verifies that workload metrics structure is valid.
 */
export function verifyWorkloadMetrics(
  metrics: { id: string | null; weeklyHoursWorked?: unknown } | null | undefined
): void {
  expect(metrics).toBeDefined();
  if (!metrics) throw new Error("No metrics returned");
  expect(metrics.id).toBeDefined();
  expect(metrics.weeklyHoursWorked).toBeDefined();
}

/**
 * Sends a mutation to create a recurring class.
 */
export async function mutateCreateRecurringClass(token: string, input: CreateRecurringClassInput) {
  return await testClient.mutate({
    mutation: createRecurringClassMutationDocument,
    variables: {
      input,
    },
    errorPolicy: "all",
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });
}

/**
 * Asserts that a recurring class creation request is denied (raises error).
 */
export async function assertRecurringClassDenied(
  token: string,
  days: { dayOfWeek: string; startTime: string; isActive: boolean }[]
): Promise<void> {
  const result = await mutateCreateRecurringClass(token, {
    studentId: "fake-student-id",
    teacherId: "fake-teacher-id",
    durationMinutes: 60,
    defaultStartTime: "10:00:00",
    timezone: "UTC",
    days,
    classType: "REGULAR",
    generateInstancesForWeeks: 4,
    effectiveFrom: null,
    effectiveUntil: null,
    timezoneId: null,
  });
  expect(result.error).toBeDefined();
}
