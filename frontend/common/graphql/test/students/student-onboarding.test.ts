import { afterAll, describe, expect, test } from "bun:test";
import { randomUUID } from "node:crypto";
import { IanaTimezone, StudentStatus } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { createParentMutationDocument, createStudentMutationDocument } from "@/frontend/common/graphql/sharedDocuments";
import {
  authenticatedRequest,
  cleanupTestSuperAdmin,
  loginAndProvision,
  loginDemoUser,
  provisionTestSuperAdmin,
} from "@/frontend/common/graphql/test/helpers";
import { setupTestServerLifecycle } from "@/frontend/common/graphql/test/lifecycle";

const createMinimalParentInput = (overrides?: Partial<{ name: string; email: string }>) => ({
  name: overrides?.name ?? "Student Onboard Parent",
  email: overrides?.email ?? `student_parent_${Date.now()}@test.com`,
  password: `Pwd_${randomUUID()}`,
  phone: null,
  invoiceType: null,
  feeAmount: null,
  initialPayinMethod: null,
  currency: null,
  timezone: IanaTimezone.Utc,
  address: null,
  facebook: null,
  nationality: null,
  twitter: null,
  whatsapp: null,
});

const createMinimalStudentInput = (
  parentId: string,
  overrides?: Partial<{ name: string; primaryTeacherId: string }>
) => ({
  parentId,
  name: overrides?.name ?? "GraphQL Test Student",
  dateOfBirth: null,
  gender: null,
  language: null,
  status: StudentStatus.OnTrial,
  primaryTeacherId: overrides?.primaryTeacherId ?? null,
  classesTotal: null,
  classesRemaining: null,
  email: null,
  password: null,
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
    const { testClient } = await import("@/frontend/common/graphql/test/testClient");

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
    const { testClient } = await import("@/frontend/common/graphql/test/testClient");

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
