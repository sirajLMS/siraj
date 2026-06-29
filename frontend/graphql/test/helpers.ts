import { expect } from "bun:test";
import type { OperationVariables, TypedDocumentNode } from "@apollo/client";
import type { CreateRecurringClassInput } from "../generated/gql/graphql-types";
import { teachers as demoTeachers } from "@/shared/demo-users";
import { demoLoginMutationDocument, loginMutationDocument } from "../sharedDocuments/auth.documents";
import { createRecurringClassMutationDocument } from "../sharedDocuments/recurring-class.documents";
import { dailyScheduleListQueryDocument } from "../sharedDocuments/schedule.documents";
import { teachersQueryDocument } from "../sharedDocuments/teacher.documents";
import { teacherWeeklyScheduleGridQueryDocument } from "../sharedDocuments/weekly-schedule.documents";
import { createTestEntitiesMutationDocument } from "../sharedDocuments/test-helper.documents";
import { testClient } from "./testClient";

async function executeLogin<TData, TVars>(
  mutation: TypedDocumentNode<TData, TVars>,
  variables: TVars,
  extractToken: (data: TData | null | undefined) => string | null | undefined,
  errorLabel: string
): Promise<string> {
  const result = await testClient.mutate({ mutation, variables } as unknown as Parameters<typeof testClient.mutate>[0]);
  const token = extractToken(result.data as TData | null | undefined);
  if (!token) {
    throw new Error(`Failed to login: ${errorLabel}`);
  }
  return token;
}

export async function loginDemoUser(groupSlug: string): Promise<string> {
  return executeLogin(demoLoginMutationDocument, { input: { groupSlug } }, data => data?.demoLogin?.token, groupSlug);
}

/**
 * Logs in as the specified role and asserts that a GraphQL operation is denied.
 * Centralizes the common denial-test pattern to avoid duplication across test files.
 */
export async function assertOperationDenied<TData = unknown, TVars extends OperationVariables = OperationVariables>(
  roleGroupSlug: string,
  type: "query" | "mutate",
  document: TypedDocumentNode<TData, TVars>,
  variables: TVars
): Promise<void> {
  const token = await loginDemoUser(roleGroupSlug);
  const context = { headers: { Authorization: `Bearer ${token}` } };

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

  expect(result.error).toBeDefined();
}

/**
 * Logs in a standard user using email and password, returning their auth token.
 */
export async function loginUser(email: string, password = "password"): Promise<string> {
  return executeLogin(loginMutationDocument, { input: { email, password } }, data => data?.login?.token, email);
}

/**
 * Provisions isolated test entities via the admin token, then logs in as the
 * created teacher. Returns all entity IDs plus the teacher's auth token.
 */
export async function provisionTestEntities(adminToken: string, prefix: string, classesRemaining = 10) {
  const setupRes = await authenticatedRequest(adminToken, "mutate", createTestEntitiesMutationDocument, {
    prefix,
    classesRemaining,
  });
  const entities = setupRes.createTestEntities;
  if (!entities) throw new Error("Failed to create test entities");

  if (!entities.teacherUserEmail) throw new Error("Teacher email not returned");
  const teacherToken = await loginUser(entities.teacherUserEmail, "password");

  return {
    studentId: entities.studentId,
    teacherId: entities.teacherId,
    studentUserId: entities.studentUserId,
    teacherUserId: entities.teacherUserId,
    parentUserId: entities.parentUserId,
    parentId: entities.parentId,
    parentUserEmail: entities.parentUserEmail,
    teacherToken,
  };
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
export async function loginAndProvision(prefix: string) {
  const adminToken = await loginDemoUser("academy_admin");
  expect(adminToken).not.toBeNull();
  const result = await provisionTestEntities(adminToken, prefix);
  expect(result.teacherToken).not.toBeNull();
  return {
    adminToken,
    teacherToken: result.teacherToken,
    studentId: result.studentId,
    teacherId: result.teacherId,
    studentUserId: result.studentUserId,
    teacherUserId: result.teacherUserId,
    parentUserId: result.parentUserId,
    parentId: result.parentId,
    parentUserEmail: result.parentUserEmail,
  };
}

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
      metricFilter: null,
    },
    context: {
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    },
  });

  const list = result.data?.dailyScheduleList;
  if (Array.isArray(list)) {
    const found = list.find(item => item?.student?.id && item?.teacher?.id);
    if (found?.student?.id && found?.teacher?.id) {
      return {
        studentId: found.student.id,
        teacherId: found.teacher.id,
      };
    }
  }

  throw new Error("Could not find matching student/teacher pair");
}

export async function fetchDemoTeacherId(adminToken: string): Promise<string> {
  const demoTeacher = demoTeachers[0];
  if (!demoTeacher) throw new Error("No demo teachers configured");

  const result = await testClient.query({
    query: teachersQueryDocument,
    variables: { search: demoTeacher.name, limit: 1 },
    context: { headers: { Authorization: `Bearer ${adminToken}` } },
  });

  const teacherId = result.data?.teachers?.[0]?.id;
  if (!teacherId) throw new Error("Could not find demo teacher via teachers query");
  return teacherId;
}

export async function fetchNonDefaultTeacherId(adminToken: string): Promise<string | null> {
  const result = await testClient.query({
    query: teachersQueryDocument,
    variables: { search: "", limit: 10 },
    context: { headers: { Authorization: `Bearer ${adminToken}` } },
  });

  const defaultTeacher = demoTeachers[0];
  const teachers = result.data?.teachers;
  if (!teachers || teachers.length < 2) return null;
  const other = teachers.find(t => t.name !== defaultTeacher?.name && t.id);
  return other?.id ?? null;
}

export async function fetchFirstClassInstanceId(
  adminToken: string,
  date: string
): Promise<string> {
  const result = await testClient.query({
    query: dailyScheduleListQueryDocument,
    variables: { date, teacherId: null, search: null, metricFilter: null },
    context: { headers: { Authorization: `Bearer ${adminToken}` } },
  });

  const list = result.data?.dailyScheduleList;
  if (Array.isArray(list) && list.length > 0 && list[0]?.id) {
    return list[0].id;
  }

  const entities = await provisionTestEntities(adminToken, "sched-del", 5);
  
  const d = new Date(date);
  const days = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
  const dayOfWeek = days[d.getUTCDay()] || "MONDAY";

  await mutateCreateRecurringClass(adminToken, {
    studentId: entities.studentId,
    teacherId: entities.teacherId,
    durationMinutes: 60,
    defaultStartTime: "10:00:00",
    timezone: "UTC",
    days: [{ dayOfWeek, startTime: "10:00:00", isActive: true }],
    classType: "REGULAR",
    generateInstancesForWeeks: 2,
    effectiveFrom: date,
    effectiveUntil: null,
    timezoneId: null,
  });

  const gridResult = await testClient.query({
    query: teacherWeeklyScheduleGridQueryDocument,
    variables: { teacherId: entities.teacherId, weekDate: date },
    context: { headers: { Authorization: `Bearer ${adminToken}` } },
  });
  const classItem = gridResult.data?.teacherWeeklyScheduleGrid?.classes?.[0];
  if (classItem?.id) return classItem.id;

  throw new Error("No class instance found in daily schedule list or weekly grid");
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
  if (expectedTeacherId === undefined) {
    expect(schedule.teacherId).toBeDefined();
  } else {
    expect(schedule.teacherId).toBe(expectedTeacherId);
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
export async function expectMutationError<TData, TVars extends OperationVariables>(
  token: string,
  document: TypedDocumentNode<TData, TVars>,
  variables: TVars
): Promise<void> {
  const result = await testClient.mutate({
    mutation: document,
    variables,
    context: { headers: { Authorization: `Bearer ${token}` } },
  } as Parameters<typeof testClient.mutate>[0]);
  expect(result.error).toBeDefined();
}

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
