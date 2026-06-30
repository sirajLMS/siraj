import { describe, expect, test } from "bun:test";
import type { OperationVariables, TypedDocumentNode } from "@apollo/client";
import type { StudentStatus as StudentStatusType } from "@/frontend/graphql/generated/gql/graphql-types";
import { StudentStatus } from "@/frontend/graphql/generated/gql/graphql-types";
import { changeStudentStatusMutationDocument, reassignStudentTeacherMutationDocument } from "../sharedDocuments";
import { assertOperationDenied, authenticatedRequest, loginDemoUser, provisionTestEntities } from "./helpers";
import { setupTestServerLifecycle } from "./lifecycle";
import { testClient } from "./testClient";

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
  } as Parameters<typeof testClient.mutate>[0]);
  expect(result.error).toBeDefined();
}

async function loginAndProvision(prefix: string) {
  const token = await loginDemoUser("academy_admin");
  expect(token).not.toBeNull();
  const entities = await provisionTestEntities(token, prefix);
  if (!entities.studentId) throw new Error("No studentId provisioned");
  if (!entities.teacherId) throw new Error("No teacherId provisioned");
  return { token, studentId: entities.studentId, teacherId: entities.teacherId };
}

describe("GraphQL: reassignStudentTeacher mutation", () => {
  setupTestServerLifecycle();

  let token = "";
  let studentId = "";
  let newTeacherId = "";

  test("login and provision two teacher sets", async () => {
    const first = await loginAndProvision("s9reassign");
    token = first.token;
    studentId = first.studentId;

    const second = await provisionTestEntities(token, "s9reassign2");
    if (!second.teacherId) throw new Error("No second teacherId provisioned");
    newTeacherId = second.teacherId;
  });

  test("admin reassigns student to a different teacher", async () => {
    const data = await authenticatedRequest(token, "mutate", reassignStudentTeacherMutationDocument, {
      studentId,
      newTeacherId,
      expectedVersion: null,
    });

    expect(data.reassignStudentTeacher?.id).toBe(studentId);
    expect(data.reassignStudentTeacher?.primaryTeacherId).toBe(newTeacherId);
  });

  test("teacher role is denied", async () => {
    await assertOperationDenied("teacher_default", "mutate", reassignStudentTeacherMutationDocument, {
      studentId: studentId || NIL_UUID,
      newTeacherId: newTeacherId || NIL_UUID,
      expectedVersion: null,
    });
  });

  test("parent role is denied", async () => {
    await assertOperationDenied("parent_default", "mutate", reassignStudentTeacherMutationDocument, {
      studentId: studentId || NIL_UUID,
      newTeacherId: newTeacherId || NIL_UUID,
      expectedVersion: null,
    });
  });

  test("Threat 4 — non-existent teacher returns teacherNotFound", async () => {
    await expectMutationError(token, reassignStudentTeacherMutationDocument, {
      studentId,
      newTeacherId: NIL_UUID,
      expectedVersion: null,
    });
  });

  test("non-existent student returns studentNotFound", async () => {
    await expectMutationError(token, reassignStudentTeacherMutationDocument, {
      studentId: "00000000-0000-0000-0000-000000000005",
      newTeacherId,
      expectedVersion: null,
    });
  });
});

describe("GraphQL: changeStudentStatus mutation", () => {
  setupTestServerLifecycle();

  let token = "";
  let studentId = "";

  test("login and provision test student", async () => {
    const setup = await loginAndProvision("s9status");
    token = setup.token;
    studentId = setup.studentId;
  });

  test("admin changes status from REGULAR to SUSPENDED", async () => {
    const data = await authenticatedRequest(token, "mutate", changeStudentStatusMutationDocument, {
      studentId,
      newStatus: StudentStatus.Suspended as StudentStatusType,
      expectedVersion: null,
    });

    expect(data.changeStudentStatus?.id).toBe(studentId);
    expect(data.changeStudentStatus?.status).toBe(StudentStatus.Suspended);
  });

  test("admin changes status from SUSPENDED back to REGULAR", async () => {
    const data = await authenticatedRequest(token, "mutate", changeStudentStatusMutationDocument, {
      studentId,
      newStatus: StudentStatus.Regular as StudentStatusType,
      expectedVersion: null,
    });

    expect(data.changeStudentStatus?.status).toBe(StudentStatus.Regular);
  });

  test("admin changes status from REGULAR to ON_LEAVE", async () => {
    const data = await authenticatedRequest(token, "mutate", changeStudentStatusMutationDocument, {
      studentId,
      newStatus: StudentStatus.OnLeave as StudentStatusType,
      expectedVersion: null,
    });

    expect(data.changeStudentStatus?.status).toBe(StudentStatus.OnLeave);
  });

  test("teacher role is denied", async () => {
    await assertOperationDenied("teacher_default", "mutate", changeStudentStatusMutationDocument, {
      studentId: studentId || NIL_UUID,
      newStatus: StudentStatus.Suspended as StudentStatusType,
      expectedVersion: null,
    });
  });

  test("parent role is denied", async () => {
    await assertOperationDenied("parent_default", "mutate", changeStudentStatusMutationDocument, {
      studentId: studentId || NIL_UUID,
      newStatus: StudentStatus.Suspended as StudentStatusType,
      expectedVersion: null,
    });
  });

  test("non-existent student returns studentNotFound", async () => {
    await expectMutationError(token, changeStudentStatusMutationDocument, {
      studentId: "00000000-0000-0000-0000-000000000006",
      newStatus: StudentStatus.Suspended as StudentStatusType,
      expectedVersion: null,
    });
  });
});
