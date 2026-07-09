import { expect } from "bun:test";
import type { OperationVariables, TypedDocumentNode } from "@apollo/client";
import { IanaTimezone } from "@/frontend/graphql/generated/gql/graphql-types";
import { ClassType, type CreateRecurringClassInput, type ManagerAccountType } from "../generated/gql/graphql-types";
import { demoLoginMutationDocument, loginMutationDocument } from "../sharedDocuments/auth.documents";
import { createManagerMutationDocument } from "../sharedDocuments/manager-onboarding.documents";
import { createRecurringClassMutationDocument } from "../sharedDocuments/recurring-class.documents";
import { createTeacherManualClassEntryMutationDocument } from "../sharedDocuments/teacher-dashboard.documents";
import {
  cleanupTestEntitiesMutationDocument,
  cleanupTestManagerMutationDocument,
  cleanupTestSuperAdminMutationDocument,
  createTestEntitiesMutationDocument,
  createTestSuperAdminMutationDocument,
} from "../sharedDocuments/test-helper.documents";
import { teacherWeeklyScheduleGridQueryDocument } from "../sharedDocuments/weekly-schedule.documents";
import { testClient } from "./testClient";

/** Shared test password — all provisioned test users use this value. */
// eslint-disable-next-line sonarjs/no-hardcoded-passwords
const TEST_USER_PASSWORD = "Test_Pass1!";

async function executeLogin<TData, TVars>(
  mutation: TypedDocumentNode<TData, TVars>,
  variables: TVars,
  extractToken: (data: TData | null | undefined) => string | null | undefined,
  errorLabel: string
): Promise<string> {
  const result = await testClient.mutate({ mutation, variables } as unknown as Parameters<typeof testClient.mutate>[0]);
  const token = extractToken(result.data as TData | null | undefined);
  if (!token) {
    const gqlErrors =
      (result as { errors?: Array<{ message: string }> }).errors?.map(e => e.message).join("; ") ?? "unknown";
    throw new Error(`Failed to login: ${errorLabel} (${gqlErrors})`);
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
): Promise<boolean> {
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
  return true;
}

/**
 * Logs in a standard user using email and password, returning their auth token.
 */
export async function loginUser(email: string, password = "password"): Promise<string> {
  return executeLogin(loginMutationDocument, { input: { email, password } }, data => data?.login?.token, email);
}

export interface TestEntitiesResult {
  studentId: string;
  teacherId: string;
  studentUserId: string;
  teacherUserId: string;
  parentUserId: string;
  parentId: string;
  parentUserEmail: string;
  teacherName: string;
  parentName: string;
  studentName: string;
  teacherToken: string;
}

export interface LoginAndProvisionResult {
  adminToken: string;
  superAdminToken: string;
  teacherToken: string;
  studentId: string;
  teacherId: string;
  studentUserId: string;
  teacherUserId: string;
  parentUserId: string;
  parentId: string;
  parentUserEmail: string;
  teacherName: string;
  parentName: string;
  studentName: string;
}

/**
 * Provisions isolated test entities via the admin token, then logs in as the
 * created teacher. Returns all entity IDs plus the teacher's auth token.
 */
export async function provisionTestEntities(
  superAdminToken: string,
  prefix: string,
  classesRemaining = 10
): Promise<TestEntitiesResult> {
  const setupRes = await authenticatedRequest(superAdminToken, "mutate", createTestEntitiesMutationDocument, {
    prefix,
    classesRemaining,
  });
  const entities = setupRes.createTestEntities;
  if (!entities) throw new Error("Failed to create test entities");

  if (!entities.teacherUserEmail) throw new Error("Teacher email not returned");
  if (!entities.studentId) throw new Error("Student ID not returned");
  if (!entities.teacherId) throw new Error("Teacher ID not returned");

  // Retry login to handle race condition where the DB transaction creating
  // the user may not yet be visible when the login query fires.
  let teacherToken!: string;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      teacherToken = await loginUser(entities.teacherUserEmail, TEST_USER_PASSWORD);
      break;
    } catch {
      if (attempt < 3) await new Promise(resolve => setTimeout(resolve, 500));
      else throw new Error("Failed to login teacher after 3 attempts");
    }
  }

  return {
    studentId: entities.studentId ?? "",
    teacherId: entities.teacherId ?? "",
    studentUserId: entities.studentUserId ?? "",
    teacherUserId: entities.teacherUserId ?? "",
    parentUserId: entities.parentUserId ?? "",
    parentId: entities.parentId ?? "",
    parentUserEmail: entities.parentUserEmail ?? "",
    teacherName: entities.teacherName ?? "",
    parentName: entities.parentName ?? "",
    studentName: entities.studentName ?? "",
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
export async function loginAndProvision(prefix: string): Promise<LoginAndProvisionResult> {
  const superAdminToken = await loginDemoUser("super_admin");
  expect(superAdminToken).not.toBeNull();
  const result = await provisionTestEntities(superAdminToken, prefix);
  expect(result.teacherToken).not.toBeNull();
  const adminToken = await loginDemoUser("academy_admin");
  expect(adminToken).not.toBeNull();
  return {
    adminToken,
    superAdminToken,
    teacherToken: result.teacherToken,
    studentId: result.studentId,
    teacherId: result.teacherId,
    studentUserId: result.studentUserId,
    teacherUserId: result.teacherUserId,
    parentUserId: result.parentUserId,
    parentId: result.parentId,
    parentUserEmail: result.parentUserEmail,
    teacherName: result.teacherName,
    parentName: result.parentName,
    studentName: result.studentName,
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

export async function fetchFirstClassInstanceId(token: string, date: string): Promise<string> {
  const entities = await provisionTestEntities(token, "sched-del", 5);

  const d = new Date(date);
  const days = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
  const dayOfWeek = days[d.getUTCDay()] || "MONDAY";

  await mutateCreateRecurringClass(token, {
    studentId: entities.studentId,
    teacherId: entities.teacherId,
    durationMinutes: 60,
    defaultStartTime: "10:00:00",
    timezone: IanaTimezone.Utc,
    days: [{ dayOfWeek, startTime: "10:00:00", isActive: true }],
    classType: "REGULAR",
    generateInstancesForWeeks: 2,
    effectiveFrom: date,
    effectiveUntil: null,
  });

  const gridResult = await testClient.query({
    query: teacherWeeklyScheduleGridQueryDocument,
    variables: { teacherId: entities.teacherId, weekDate: date },
    context: { headers: { Authorization: `Bearer ${token}` } },
  });
  const classItem = gridResult.data?.teacherWeeklyScheduleGrid?.classes?.[0];
  if (classItem?.id) return classItem.id;

  throw new Error("No class instance found in weekly grid");
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
 * Creates a teacher manual class entry via the GraphQL API with `errorPolicy: "all"`.
 * Returns the raw Apollo mutation result so callers can assert on `.data` / `.error`.
 *
 * @param token - The Bearer token to include in the Authorization header.
 * @param studentId - The student ID for the manual class entry.
 * @param teacherId - The teacher ID for the manual class entry.
 * @param startAt - The scheduled start time as an ISO string.
 * @param endAt - The scheduled end time as an ISO string.
 */
export async function createManualClassEntry(
  token: string,
  studentId: string,
  teacherId: string,
  startAt: string,
  endAt: string
) {
  return testClient.mutate({
    mutation: createTeacherManualClassEntryMutationDocument,
    variables: {
      input: {
        studentId,
        teacherId,
        scheduledStartAt: startAt,
        scheduledEndAt: endAt,
        durationMinutes: 60,
        classType: ClassType.Regular,
      },
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

export async function provisionTestManager(
  superAdminToken: string,
  prefix: string,
  accountType: ManagerAccountType
): Promise<{ userId: string; staffProfileId: string; name: string; assignedGroupSlug: string }> {
  const result = await testClient.mutate({
    mutation: createManagerMutationDocument,
    variables: {
      input: {
        name: `${prefix}-manager`,
        email: `${prefix}-manager@test.com`,
        password: TEST_USER_PASSWORD,
        accountType,
        phone: null,
      },
    },
    context: { headers: { Authorization: `Bearer ${superAdminToken}` } },
  });

  const manager = result.data?.createManager;
  if (!manager?.userId) throw new Error("Manager creation failed: no userId");
  if (!manager.staffProfileId) throw new Error("Manager creation failed: no staffProfileId");
  if (!manager.name) throw new Error("Manager creation failed: no name");
  if (!manager.assignedGroupSlug) throw new Error("Manager creation failed: no assignedGroupSlug");

  return {
    userId: manager.userId,
    staffProfileId: manager.staffProfileId,
    name: manager.name,
    assignedGroupSlug: manager.assignedGroupSlug,
  };
}

export async function cleanupTestManager(superAdminToken: string, userId: string): Promise<void> {
  await authenticatedRequest(superAdminToken, "mutate", cleanupTestManagerMutationDocument, { userId });
}

export async function cleanupTestEntities(
  superAdminToken: string,
  ids: {
    studentUserId: string;
    teacherUserId: string;
    parentUserId: string;
    studentId: string;
    teacherId: string;
    parentId: string;
  }
): Promise<void> {
  await authenticatedRequest(superAdminToken, "mutate", cleanupTestEntitiesMutationDocument, ids);
}

export async function provisionTestSuperAdmin(
  superAdminToken: string,
  prefix: string
): Promise<{ token: string; userId: string }> {
  const createRes = await authenticatedRequest(superAdminToken, "mutate", createTestSuperAdminMutationDocument, {
    prefix,
  });
  const sa = createRes.createTestSuperAdmin;
  if (!sa?.email || !sa?.userId) throw new Error("Failed to create test super admin");

  // Retry login to handle race condition where the DB transaction creating
  // the user may not yet be visible when the login query fires (common in
  // parallel test suites sharing the same DB connection pool).
  const maxAttempts = 3;
  const delayMs = 500;
  let lastError: Error | undefined;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const token = await loginUser(sa.email, TEST_USER_PASSWORD);
      return { token, userId: sa.userId };
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }
  throw lastError;
}

export async function cleanupTestSuperAdmin(superAdminToken: string, userId: string): Promise<void> {
  await authenticatedRequest(superAdminToken, "mutate", cleanupTestSuperAdminMutationDocument, { userId });
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
    timezone: IanaTimezone.Utc,
    days,
    classType: "REGULAR",
    generateInstancesForWeeks: 4,
    effectiveFrom: null,
    effectiveUntil: null,
  });
  expect(result.error).toBeDefined();
}
