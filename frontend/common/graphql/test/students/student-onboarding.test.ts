import { afterAll, describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { generateTestPassword } from "@/backend/db/test/test-utils";
import { StudentStatus } from "@/frontend/common/graphql/generated/gql/graphql";
import { createParentMutationDocument, createStudentMutationDocument } from "@/frontend/common/graphql/sharedDocuments";
import { IanaTimezone } from "@/shared/constants/iana-timezone.enum";
import {
  authenticatedRequest,
  cleanupTestSuperAdmin,
  loginAndProvision,
  loginDemoUser,
  provisionTestSuperAdmin,
  setupTestServerLifecycle,
  testClient,
} from "@/test/helpers";

const createMinimalParentInput = (overrides?: Partial<{ name: string; email: string }>) => ({
  name: overrides?.name ?? "Student Onboard Parent",
  email: overrides?.email ?? `student_parent_${Date.now()}@test.com`,
  avatarUrl: null,
  password: generateTestPassword(),
  phone: null,
  displayCurrency: null,
  invoiceType: null,
  feeAmount: null,
  initialPayinMethod: null,
  currency: null,
  timezone: IanaTimezone.UTC,
  address: null,
  facebook: null,
  nationality: null,
  twitter: null,
  whatsapp: null,
});

const createMinimalStudentInput = (
  parentId: string,
  overrides?: Partial<{ name: string; primaryTeacherId: string; email: string; password: string }>
) => ({
  parentId,
  name: overrides?.name ?? "GraphQL Test Student",
  avatarUrl: null,
  dateOfBirth: null,
  gender: null,
  language: null,
  status: StudentStatus.OnTrial,
  primaryTeacherId: overrides?.primaryTeacherId ?? null,
  classesTotal: null,
  classesRemaining: null,
  email: overrides?.email ?? `stu_${Date.now()}_${randomUUID().slice(0, 8)}@test.com`,
  password: overrides?.password ?? generateTestPassword(),
  phone: null,
  displayCurrency: null,
  timezone: null,
});

describe("Student Onboarding GraphQL API", () => {
  setupTestServerLifecycle();

  let superAdminToken = "";
  let superAdminUserId = "";

  test("provision super admin for student onboarding tests", async () => {
    const existingSaToken = await loginDemoUser("super_admin");
    const sa = await provisionTestSuperAdmin(existingSaToken, "stuOnboard");
    superAdminToken = sa.token;
    superAdminUserId = sa.userId;
    expect(superAdminToken).toBeTruthy();
    expect(superAdminUserId).toBeTruthy();
  });

  test("Academy admin can create student under parent", async () => {
    const adminToken = await loginDemoUser("academy_admin");
    const parentResult = await authenticatedRequest(adminToken, "mutate", createParentMutationDocument, {
      input: createMinimalParentInput({
        email: `stu_onboard_parent_${Date.now()}@test.com`,
      }),
    });
    if (!parentResult.createParent?.parentId) throw new Error("createParent returned no parentId");

    const result = await authenticatedRequest(adminToken, "mutate", createStudentMutationDocument, {
      input: createMinimalStudentInput(parentResult.createParent.parentId),
    });

    if (!result.createStudent) throw new Error("createStudent is null");
    expect(result.createStudent.studentId).toBeDefined();
    expect(result.createStudent.parentId).toBe(parentResult.createParent.parentId);
    expect(result.createStudent.status).toBe(StudentStatus.OnTrial);
  });

  test("Super admin can create student with teacher assignment", async () => {
    const { parentId, teacherId } = await loginAndProvision(`stu_teacher_${Date.now()}`);

    const result = await authenticatedRequest(superAdminToken, "mutate", createStudentMutationDocument, {
      input: createMinimalStudentInput(parentId, {
        name: "Assigned Student",
        primaryTeacherId: teacherId,
      }),
    });

    if (!result.createStudent) throw new Error("createStudent is null");
    expect(result.createStudent.studentId).toBeDefined();
    expect(result.createStudent.primaryTeacherId).toBe(teacherId);
  });

  test("Teacher denied creating student", async () => {
    const token = await loginDemoUser("teacher_default");

    const result = await testClient.mutate({
      mutation: createStudentMutationDocument,
      variables: {
        input: createMinimalStudentInput(randomUUID()),
      },
      context: { headers: { Authorization: `Bearer ${token}` } },
      errorPolicy: "all",
    });

    expect(result.error).toBeDefined();
  });

  test("Unauthenticated denied creating student", async () => {
    const result = await testClient.mutate({
      mutation: createStudentMutationDocument,
      variables: {
        input: createMinimalStudentInput(randomUUID()),
      },
      errorPolicy: "all",
    });

    expect(result.error).toBeDefined();
  });

  afterAll(async () => {
    if (superAdminToken && superAdminUserId) {
      await cleanupTestSuperAdmin(superAdminToken, superAdminUserId);
    }
  });
});
