import { describe, expect, test } from "bun:test";
import type { OperationVariables, TypedDocumentNode } from "@apollo/client";
import { StudentStatus } from "@/frontend/graphql/generated/gql/graphql-types";
import {
  changeStudentStatusMutationDocument,
  reassignStudentTeacherMutationDocument,
} from "@/frontend/graphql/sharedDocuments";
import {
  assertOperationDenied,
  authenticatedRequest,
  loginDemoUser,
  provisionTestEntities,
} from "@/frontend/graphql/test/helpers";
import { setupTestServerLifecycle } from "@/frontend/graphql/test/lifecycle";
import { testClient } from "@/frontend/graphql/test/testClient";

const NIL_UUID = "00000000-0000-0000-0000-000000000000";

async function expectMutationError<TData, TVars extends OperationVariables>(
  token: string,
  mutation: TypedDocumentNode<TData, TVars>,
  variables: TVars
): Promise<void> {
  const result = await testClient.mutate({
    mutation,
    variables,
    context: { headers: { Authorization: `Bearer ${token}` } },
  });
  expect(result.error).toBeDefined();
}

async function loginAndProvisionAsSuperAdmin(prefix: string) {
  const superAdminToken = await loginDemoUser("super_admin");
  expect(superAdminToken).not.toBeNull();
  const entities = await provisionTestEntities(superAdminToken, prefix);
  if (!entities.studentId) throw new Error("No studentId provisioned");
  if (!entities.teacherId) throw new Error("No teacherId provisioned");
  return { superAdminToken, studentId: entities.studentId, teacherId: entities.teacherId };
}

describe("GraphQL: reassignStudentTeacher mutation", () => {
  setupTestServerLifecycle();

  let superAdminToken = "";
  let studentId = "";
  let newTeacherId = "";

  test("login and provision two teacher sets", async () => {
    const first = await loginAndProvisionAsSuperAdmin("s9reassign");
    superAdminToken = first.superAdminToken;
    studentId = first.studentId;

    const second = await provisionTestEntities(superAdminToken, "s9reassign2");
    if (!second.teacherId) throw new Error("No second teacherId provisioned");
    newTeacherId = second.teacherId;
  });

  test("super admin reassigns student to a different teacher", async () => {
    const data = await authenticatedRequest(superAdminToken, "mutate", reassignStudentTeacherMutationDocument, {
      studentId,
      newTeacherId,
      expectedVersion: null,
    });

    expect(data.reassignStudentTeacher?.id).toBe(studentId);
    expect(data.reassignStudentTeacher?.primaryTeacherId).toBe(newTeacherId);
  });

  test("teacher role is denied", async () => {
    const denied = await assertOperationDenied("teacher_default", "mutate", reassignStudentTeacherMutationDocument, {
      studentId: studentId || NIL_UUID,
      newTeacherId: newTeacherId || NIL_UUID,
      expectedVersion: null,
    });
    expect(denied).toBe(true);
  });

  test("parent role is denied", async () => {
    const denied = await assertOperationDenied("parent_default", "mutate", reassignStudentTeacherMutationDocument, {
      studentId: studentId || NIL_UUID,
      newTeacherId: newTeacherId || NIL_UUID,
      expectedVersion: null,
    });
    expect(denied).toBe(true);
  });

  test("academy admin (non-superAdmin) is denied", async () => {
    const academyAdminToken = await loginDemoUser("academy_admin");
    await expectMutationError(academyAdminToken, reassignStudentTeacherMutationDocument, {
      studentId: studentId || NIL_UUID,
      newTeacherId: newTeacherId || NIL_UUID,
      expectedVersion: null,
    });
  });

  test("Threat 4 — non-existent teacher returns teacherNotFound", async () => {
    await expectMutationError(superAdminToken, reassignStudentTeacherMutationDocument, {
      studentId,
      newTeacherId: NIL_UUID,
      expectedVersion: null,
    });
  });

  test("non-existent student returns studentNotFound", async () => {
    await expectMutationError(superAdminToken, reassignStudentTeacherMutationDocument, {
      studentId: "00000000-0000-0000-0000-000000000005",
      newTeacherId,
      expectedVersion: null,
    });
  });
});

describe("GraphQL: changeStudentStatus mutation", () => {
  setupTestServerLifecycle();

  let superAdminToken = "";
  let studentId = "";

  test("login and provision test student", async () => {
    const setup = await loginAndProvisionAsSuperAdmin("s9status");
    superAdminToken = setup.superAdminToken;
    studentId = setup.studentId;
  });

  test("super admin changes status from REGULAR to SUSPENDED", async () => {
    const data = await authenticatedRequest(superAdminToken, "mutate", changeStudentStatusMutationDocument, {
      studentId,
      newStatus: StudentStatus.Suspended,
      expectedVersion: null,
    });

    expect(data.changeStudentStatus?.id).toBe(studentId);
    expect(data.changeStudentStatus?.status).toBe(StudentStatus.Suspended);
  });

  test("super admin changes status from SUSPENDED back to REGULAR", async () => {
    const data = await authenticatedRequest(superAdminToken, "mutate", changeStudentStatusMutationDocument, {
      studentId,
      newStatus: StudentStatus.Regular,
      expectedVersion: null,
    });

    expect(data.changeStudentStatus?.status).toBe(StudentStatus.Regular);
  });

  test("super admin changes status from REGULAR to ON_LEAVE", async () => {
    const data = await authenticatedRequest(superAdminToken, "mutate", changeStudentStatusMutationDocument, {
      studentId,
      newStatus: StudentStatus.OnLeave,
      expectedVersion: null,
    });

    expect(data.changeStudentStatus?.status).toBe(StudentStatus.OnLeave);
  });

  test("teacher role is denied", async () => {
    const denied = await assertOperationDenied("teacher_default", "mutate", changeStudentStatusMutationDocument, {
      studentId: studentId || NIL_UUID,
      newStatus: StudentStatus.Suspended,
      expectedVersion: null,
    });
    expect(denied).toBe(true);
  });

  test("parent role is denied", async () => {
    const denied = await assertOperationDenied("parent_default", "mutate", changeStudentStatusMutationDocument, {
      studentId: studentId || NIL_UUID,
      newStatus: StudentStatus.Suspended,
      expectedVersion: null,
    });
    expect(denied).toBe(true);
  });

  test("academy admin (non-superAdmin) is denied", async () => {
    const academyAdminToken = await loginDemoUser("academy_admin");
    await expectMutationError(academyAdminToken, changeStudentStatusMutationDocument, {
      studentId: studentId || NIL_UUID,
      newStatus: StudentStatus.Suspended,
      expectedVersion: null,
    });
    expect(academyAdminToken).toBeTruthy();
  });

  test("non-existent student returns studentNotFound", async () => {
    await expectMutationError(superAdminToken, changeStudentStatusMutationDocument, {
      studentId: "00000000-0000-0000-0000-000000000006",
      newStatus: StudentStatus.Suspended,
      expectedVersion: null,
    });
    expect(superAdminToken).toBeTruthy();
  });
});
