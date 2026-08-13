import { expect } from "bun:test";
import { randomUUID } from "node:crypto";
import type { OperationVariables, TypedDocumentNode } from "@apollo/client";
import {
  ClassType,
  type CreateRecurringClassInput,
  DayOfWeek,
  IanaTimezone,
  type ManagerAccountType,
} from "@/frontend/common/graphql/generated/gql/graphql-types";
import {
  demoLoginMutationDocument,
  loginMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments/auth/auth.documents";
import { createClassCategoryMutationDocument } from "@/frontend/common/graphql/sharedDocuments/classes/class-category.documents";
import {
  classSubjectsQueryDocument,
  createClassSubjectMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments/classes/class-subject.documents";
import { createRecurringClassMutationDocument } from "@/frontend/common/graphql/sharedDocuments/scheduling/recurring-class.documents";
import { teacherWeeklyScheduleGridQueryDocument } from "@/frontend/common/graphql/sharedDocuments/scheduling/weekly-schedule.documents";
import {
  cleanupTestEntitiesMutationDocument,
  cleanupTestManagerMutationDocument,
  cleanupTestSuperAdminMutationDocument,
  createTestEntitiesMutationDocument,
  createTestSuperAdminMutationDocument,
  ensureDemoUsersMutationDocument,
} from "@/frontend/common/graphql/sharedDocuments/shared/test-helper.documents";
import { createManagerMutationDocument } from "@/frontend/common/graphql/sharedDocuments/teachers/staff-onboarding.documents";
import { createTeacherManualClassEntryMutationDocument } from "@/frontend/common/graphql/sharedDocuments/teachers/teacher-dashboard.documents";
import { testClient } from "@/frontend/common/graphql/test/testClient";
import { isTestServerRunning } from "@/frontend/common/graphql/test/testServer";

import { DEFAULT_SEED_ADMIN_PASSWORD } from "@/shared/demo-users";

export const TEST_USER_PASSWORD = DEFAULT_SEED_ADMIN_PASSWORD;

let demoUsersReadyPromise: Promise<void> | null = null;

async function pollServerRecovery(wait: number): Promise<void> {
  if (wait >= 60) return;
  if (await isTestServerRunning()) return;
  await new Promise(resolve => setTimeout(resolve, 3_000));
  return pollServerRecovery(wait + 1);
}

async function waitForServerRecovery(): Promise<void> {
  return pollServerRecovery(0);
}

async function attemptEnsureDemoUsers(attempt: number, maxAttempts: number): Promise<boolean> {
  const result = await testClient.mutate({
    mutation: ensureDemoUsersMutationDocument,
  });

  if (!result.error) {
    if (!result.data?.ensureDemoUsers) {
      throw new Error("ensureDemoUsers returned false");
    }
    return true;
  }

  const errorMsg = `ensureDemoUsers failed: ${result.error.message ?? "unknown GraphQL error"}`;
  if (attempt >= maxAttempts) {
    throw new Error(errorMsg);
  }

  await waitForServerRecovery();
  await new Promise(resolve => setTimeout(resolve, 5_000 * attempt));
  return false;
}

async function provisionDemoUsers(): Promise<void> {
  const maxAttempts = 5;
  const retry = async (attempt: number): Promise<void> => {
    if (attempt > maxAttempts) {
      throw new Error("ensureDemoUsers failed after all retries");
    }
    const success = await attemptEnsureDemoUsers(attempt, maxAttempts);
    if (success) return;
    return retry(attempt + 1);
  };
  return retry(1);
}

/**
 * Idempotently provisions canonical demo login users via the test-helper mutation.
 * Safe to call from every suite's beforeAll — concurrent callers share one in-flight request.
 */
export async function ensureDemoUsersForTests(): Promise<void> {
  demoUsersReadyPromise ??= provisionDemoUsers();
  await demoUsersReadyPromise;
}

/**
 * Returns an existing class subject id, or creates a category + subject when the catalog is empty.
 */
export async function ensureTestSubjectId(token: string): Promise<string> {
  const listResult = await testClient.query({
    query: classSubjectsQueryDocument,
    variables: { categoryId: null },
    context: { headers: { Authorization: `Bearer ${token}` } },
  });
  const existing = listResult.data?.classSubjects?.find(s => s?.id && s.isActive !== false)?.id;
  if (existing) {
    return existing;
  }

  const slugSuffix = Date.now().toString(36);
  const categoryResult = await authenticatedRequest(token, "mutate", createClassCategoryMutationDocument, {
    input: {
      name: `Test Category ${slugSuffix}`,
      slug: `test-cat-${slugSuffix}`,
      description: null,
      isActive: true,
      sortOrder: 0,
    },
  });
  const categoryId = categoryResult.createClassCategory?.id;
  if (!categoryId) {
    throw new Error("Failed to create test class category for subjectId");
  }

  const subjectResult = await authenticatedRequest(token, "mutate", createClassSubjectMutationDocument, {
    input: {
      categoryId,
      name: `Test Subject ${slugSuffix}`,
      slug: `test-subj-${slugSuffix}`,
      description: null,
      avatarUrl: null,
      isActive: true,
      sortOrder: 0,
      hourlyRate: null,
      rateCurrency: null,
    },
  });
  const subjectId = subjectResult.createClassSubject?.id;
  if (!subjectId) {
    throw new Error("Failed to create test class subject");
  }
  return subjectId;
}

async function executeLogin<TData, TVars extends OperationVariables>(
  mutation: TypedDocumentNode<TData, TVars>,
  variables: TVars,
  extractToken: (data: TData | null | undefined) => string | null | undefined,
  errorLabel: string
): Promise<string> {
  const result = await testClient.mutate({ mutation, variables });
  const token = extractToken(result.data);
  if (!token) {
    const gqlErrors = result.error?.message ?? "unknown";
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
  studentUserEmail: string;
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
  studentUserEmail: string;
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

  const teacherEmail = entities.teacherUserEmail;
  if (!teacherEmail) throw new Error("Teacher email not returned");

  // Retry login to handle race condition where the DB transaction creating
  // the user may not yet be visible when the login query fires.
  const loginWithRetry = async (attempt: number): Promise<string> => {
    try {
      return await loginUser(teacherEmail, TEST_USER_PASSWORD);
    } catch (err) {
      if (attempt >= 3) {
        throw new Error("Failed to login teacher after 3 attempts", { cause: err });
      }
      await new Promise(resolve => setTimeout(resolve, 500));
      return loginWithRetry(attempt + 1);
    }
  };
  const teacherToken = await loginWithRetry(1);

  return {
    studentId: entities.studentId ?? "",
    teacherId: entities.teacherId ?? "",
    studentUserId: entities.studentUserId ?? "",
    studentUserEmail: entities.studentUserEmail ?? "",
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
    studentUserEmail: result.studentUserEmail,
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

  if (type === "query") {
    const options = Object.assign({ query: document, context }, variables !== undefined ? { variables } : undefined);
    const result = await testClient.query(options);
    expect(result.data).toBeDefined();
    expect(result.error).toBeUndefined();
    if (!result.data) throw new Error("No data");
    return result.data;
  }

  const options = Object.assign({ mutation: document, context }, variables !== undefined ? { variables } : undefined);
  const result = await testClient.mutate(options);
  expect(result.data).toBeDefined();
  expect(result.error).toBeUndefined();
  if (!result.data) throw new Error("No data");
  return result.data;
}

export async function fetchFirstClassInstanceId(token: string, date: string): Promise<string> {
  const entities = await provisionTestEntities(token, "sched-del", 5);
  const subjectId = await ensureTestSubjectId(token);

  const d = new Date(date);
  const days = [
    DayOfWeek.Sunday,
    DayOfWeek.Monday,
    DayOfWeek.Tuesday,
    DayOfWeek.Wednesday,
    DayOfWeek.Thursday,
    DayOfWeek.Friday,
    DayOfWeek.Saturday,
  ];
  const dayOfWeek = days[d.getUTCDay()] ?? DayOfWeek.Monday;

  await mutateCreateRecurringClass(token, {
    studentId: entities.studentId,
    teacherId: entities.teacherId,
    subjectId,
    durationMinutes: 60,
    defaultStartTime: "10:00:00",
    timezone: IanaTimezone.Utc,
    days: [{ dayOfWeek, startTime: "10:00:00", isActive: true }],
    classType: ClassType.Regular,
    generateInstancesForWeeks: 2,
    effectiveFrom: date,
    effectiveUntil: null,
    hourlyRate: null,
    rateCurrency: null,
    quotaId: null,
    earmarkedClasses: null,
    schedulingMode: null,
    generationHorizonWeeks: null,
    ondemandNoCreditsOutcome: null,
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
  endAt: string,
  subjectId?: string
) {
  const resolvedSubjectId = subjectId ?? (await ensureTestSubjectId(token));
  return testClient.mutate({
    mutation: createTeacherManualClassEntryMutationDocument,
    variables: {
      input: {
        studentId,
        teacherId,
        subjectId: resolvedSubjectId,
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
 * Creates a manual class entry scheduled from `startOffsetMs` to `endOffsetMs`
 * (milliseconds relative to now), performs the standard data/error assertions,
 * and returns the created class instance ID. Throws when the entry isn't created.
 *
 * @param token - The Bearer token to include in the Authorization header.
 * @param studentId - The student ID for the manual class entry.
 * @param teacherId - The teacher ID for the manual class entry.
 * @param startOffsetMs - Start time offset in ms from now (default 0 = now).
 * @param endOffsetMs - End time offset in ms from now (default 60 minutes).
 * @returns The created class instance ID.
 */
export async function createManualClassEntryWithAssertions(
  token: string,
  studentId: string,
  teacherId: string,
  startOffsetMs = 0,
  endOffsetMs = 60 * 60 * 1000,
  subjectId?: string
): Promise<string> {
  const start = new Date(Date.now() + startOffsetMs);
  const end = new Date(Date.now() + endOffsetMs);

  const createRes = await createManualClassEntry(
    token,
    studentId,
    teacherId,
    start.toISOString(),
    end.toISOString(),
    subjectId
  );

  expect(createRes.data).toBeDefined();
  expect(createRes.error).toBeUndefined();

  const classInstanceId = createRes.data?.createTeacherManualClassEntry?.id;
  expect(classInstanceId).toBeDefined();
  if (!classInstanceId) throw new Error("No classInstanceId created");
  return classInstanceId;
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
  // Email must be unique per call: deterministic `${prefix}-manager@test.com`
  // collided with prior runs whose `cleanupTestEntities` left the row behind
  // (e.g. the teacher-denied test does not clean up its provision batch),
  // which made `createManager`'s email-uniqueness check fail and cascade into
  // the whole `managerDirectory` suite failing.
  const emailUnique = `${prefix}-manager-${randomUUID().slice(0, 8)}@test.com`;
  const result = await testClient.mutate({
    mutation: createManagerMutationDocument,
    variables: {
      input: {
        name: `${prefix}-manager`,
        email: emailUnique,
        avatarUrl: null,
        password: TEST_USER_PASSWORD,
        accountType,
        phone: null,
        displayCurrency: null,
        timezone: IanaTimezone.Utc,
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
  try {
    await authenticatedRequest(superAdminToken, "mutate", cleanupTestManagerMutationDocument, { userId });
  } catch {
    // Best-effort cleanup
  }
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
  try {
    await authenticatedRequest(superAdminToken, "mutate", cleanupTestEntitiesMutationDocument, ids);
  } catch {
    // Best-effort cleanup
  }
}

export async function provisionTestSuperAdmin(
  superAdminToken: string,
  prefix: string
): Promise<{ token: string; userId: string }> {
  const createRes = await authenticatedRequest(superAdminToken, "mutate", createTestSuperAdminMutationDocument, {
    prefix,
  });
  const sa = createRes.createTestSuperAdmin;
  const saEmail = sa?.email;
  const saUserId = sa?.userId;
  if (!saEmail || !saUserId) throw new Error("Failed to create test super admin");

  // Retry login to handle race condition where the DB transaction creating
  // the user may not yet be visible when the login query fires (common in
  // parallel test suites sharing the same DB connection pool).
  const maxAttempts = 3;
  const delayMs = 500;
  const attemptLogin = async (attempt: number): Promise<{ token: string; userId: string }> => {
    try {
      const token = await loginUser(saEmail, TEST_USER_PASSWORD);
      return { token, userId: saUserId };
    } catch (err) {
      const lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt >= maxAttempts) {
        throw lastError;
      }
      await new Promise(resolve => setTimeout(resolve, delayMs));
      return attemptLogin(attempt + 1);
    }
  };
  return attemptLogin(1);
}

export async function cleanupTestSuperAdmin(superAdminToken: string, userId: string): Promise<void> {
  try {
    await authenticatedRequest(superAdminToken, "mutate", cleanupTestSuperAdminMutationDocument, { userId });
  } catch {
    // Best-effort cleanup
  }
}

export async function assertRecurringClassDenied(
  token: string,
  days: { dayOfWeek: DayOfWeek; startTime: string; isActive: boolean }[]
): Promise<void> {
  const subjectId = await ensureTestSubjectId(token).catch(() => "00000000-0000-0000-0000-000000000000");
  const result = await mutateCreateRecurringClass(token, {
    studentId: "fake-student-id",
    teacherId: "fake-teacher-id",
    subjectId,
    durationMinutes: 60,
    defaultStartTime: "10:00:00",
    timezone: IanaTimezone.Utc,
    days,
    classType: ClassType.Regular,
    generateInstancesForWeeks: 4,
    effectiveFrom: null,
    effectiveUntil: null,
    hourlyRate: null,
    rateCurrency: null,
    quotaId: null,
    earmarkedClasses: null,
    schedulingMode: null,
    generationHorizonWeeks: null,
    ondemandNoCreditsOutcome: null,
  });

  expect(result.error).toBeDefined();
}
