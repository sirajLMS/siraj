import { describe, expect, test } from "bun:test";
import { ClassType } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { classInstanceQueryDocument } from "@/frontend/common/graphql/sharedDocuments/scheduling/class-session.documents";
import { createTeacherManualClassEntryMutationDocument } from "@/frontend/common/graphql/sharedDocuments/teachers/teacher-dashboard.documents";
import {
  assertOperationDenied,
  authenticatedRequest,
  ensureTestSubjectId,
  loginAndProvision,
  loginUser,
} from "@/frontend/common/graphql/test/helpers";
import { setupTestServerLifecycle } from "@/frontend/common/graphql/test/lifecycle";

describe("GraphQL Class Instance Detail Query", () => {
  setupTestServerLifecycle();

  let adminToken: string | null = null;
  let teacherToken: string | null = null;
  let parentToken: string | null = null;
  let studentId: string | null = null;
  let teacherId: string | null = null;
  let classInstanceId: string | null = null;

  test("provision test entities, create class, and login parent", async () => {
    const r = await loginAndProvision("ClassDetailQuery");
    adminToken = r.adminToken;
    teacherToken = r.teacherToken;
    studentId = r.studentId;
    teacherId = r.teacherId;

    if (!teacherToken || !studentId || !teacherId) throw new Error("Missing test context");
    const subjectId = await ensureTestSubjectId(adminToken!);
    if (!r.parentUserEmail) throw new Error("Parent email not returned");
    parentToken = await loginUser(r.parentUserEmail, "Test_Pass1!");

    const createRes = await authenticatedRequest(
      teacherToken,
      "mutate",
      createTeacherManualClassEntryMutationDocument,
      {
        input: {
          studentId,
          teacherId,
          subjectId,
          scheduledStartAt: new Date().toISOString(),
          scheduledEndAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
          durationMinutes: 60,
          classType: ClassType.Regular,
        },
      }
    );

    classInstanceId = createRes.createTeacherManualClassEntry?.id ?? null;
    expect(classInstanceId).toBeDefined();
  });

  test("admin can read class instance detail", async () => {
    if (!adminToken || !classInstanceId) throw new Error("Missing test context");

    const data = await authenticatedRequest(adminToken, "query", classInstanceQueryDocument, {
      id: classInstanceId,
    });

    const instance = data.classInstance;
    expect(instance?.id).toBe(classInstanceId);
    expect(instance?.classType).toBe(ClassType.Regular);
    expect(instance?.courseName).toBeTruthy();
    expect(instance?.subjectId).toBeTruthy();
    expect(instance?.subjectName).toBeTruthy();
    expect(instance).toHaveProperty("subjectAvatarUrl");
    expect(instance?.student?.id).toBe(studentId);
    expect(instance?.teacher?.id).toBe(teacherId);
  });

  test("teacher can read assigned class instance detail", async () => {
    if (!teacherToken || !classInstanceId) throw new Error("Missing test context");

    const data = await authenticatedRequest(teacherToken, "query", classInstanceQueryDocument, {
      id: classInstanceId,
    });

    expect(data.classInstance?.id).toBe(classInstanceId);
  });

  test("parent can read child class instance detail", async () => {
    if (!parentToken || !classInstanceId) throw new Error("Missing parent context");

    const data = await authenticatedRequest(parentToken, "query", classInstanceQueryDocument, {
      id: classInstanceId,
    });

    expect(data.classInstance?.id).toBe(classInstanceId);
  });

  test("unrelated teacher_default user is denied", async () => {
    if (!classInstanceId) throw new Error("Missing class instance");

    const denied = await assertOperationDenied("teacher_default", "query", classInstanceQueryDocument, {
      id: classInstanceId,
    });
    expect(denied).toBe(true);
  });
});
