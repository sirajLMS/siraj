import { describe, expect, test } from "bun:test";
import {
  activateClassMutationDocument,
  deleteClassInstanceMutationDocument,
  forceActivateClassMutationDocument,
} from "../sharedDocuments/class-session.documents";
import { dailyScheduleListQueryDocument } from "../sharedDocuments/schedule.documents";
import {
  createTeacherManualClassEntryMutationDocument,
  teacherDashboardQueryDocument,
} from "../sharedDocuments/teacher-dashboard.documents";
import { fetchFirstStudentTeacherPair, loginDemoUser } from "./helpers";
import { setupTestServerLifecycle } from "./lifecycle";
import { testClient } from "./testClient";

describe("GraphQL Class Session Integration Tests", () => {
  setupTestServerLifecycle();

  let adminToken: string | null = null;
  let teacherToken: string | null = null;
  let studentId: string | null = null;
  let teacherId: string | null = null;
  let outsideClassInstanceId: string | null = null;
  const testDate = new Date().toISOString().split("T")[0]; // "YYYY-MM-DD"

  test("login as academy_admin and teacher", async () => {
    adminToken = await loginDemoUser("academy_admin");
    teacherToken = await loginDemoUser("teacher_default");
    expect(adminToken).not.toBeNull();
    expect(teacherToken).not.toBeNull();
  });

  test("find student and teacher IDs, then clear today's classes to avoid overlaps", async () => {
    if (!adminToken) throw new Error("No admin token");

    // 1. Query today's list to get the student and teacher IDs
    const pair = await fetchFirstStudentTeacherPair(adminToken, testDate);
    studentId = pair.studentId;
    teacherId = pair.teacherId;

    // 2. Delete all of today's classes via GraphQL mutation to avoid scheduling conflicts/overlaps
    const result = await testClient.query({
      query: dailyScheduleListQueryDocument,
      variables: {
        date: testDate,
        teacherId: null,
        search: null,
      },
      context: {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      },
    });

    const list = result.data?.dailyScheduleList || [];
    for (const item of list) {
      if (!item.id) continue;
      const deleteRes = await testClient.mutate({
        mutation: deleteClassInstanceMutationDocument,
        variables: {
          classInstanceId: item.id,
        },
        errorPolicy: "all",
        context: {
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        },
      });
      expect(deleteRes.error).toBeUndefined();
    }
  });

  test("teacher activates class within window successfully", async () => {
    if (!teacherToken || !studentId || !teacherId) throw new Error("Missing test context");

    // 1. Create a new class instance within window (start = now, end = now + 1 hour)
    const now = new Date();
    const end = new Date(now.getTime() + 60 * 60 * 1000);

    const createRes = await testClient.mutate({
      mutation: createTeacherManualClassEntryMutationDocument,
      variables: {
        input: {
          studentId,
          teacherId,
          scheduledStartAt: now.toISOString(),
          scheduledEndAt: end.toISOString(),
          durationMinutes: 60,
          classType: "REGULAR",
        },
      },
      errorPolicy: "all",
      context: {
        headers: {
          Authorization: `Bearer ${teacherToken}`,
        },
      },
    });

    expect(createRes.data).toBeDefined();
    expect(createRes.error).toBeUndefined();
    const classInstanceId = createRes.data?.createTeacherManualClassEntry?.id;
    expect(classInstanceId).toBeDefined();
    if (!classInstanceId) throw new Error("No classInstanceId created");

    // 2. Activate as teacher
    const activateRes = await testClient.mutate({
      mutation: activateClassMutationDocument,
      variables: {
        classInstanceId,
      },
      errorPolicy: "all",
      context: {
        headers: {
          Authorization: `Bearer ${teacherToken}`,
        },
      },
    });

    expect(activateRes.data).toBeDefined();
    expect(activateRes.error).toBeUndefined();

    // 3. Verify executionState changes to ACTIVATED via teacher dashboard query
    const dashboardResult = await testClient.query({
      query: teacherDashboardQueryDocument,
      variables: {
        date: testDate,
      },
      context: {
        headers: {
          Authorization: `Bearer ${teacherToken}`,
        },
      },
    });

    expect(dashboardResult.data).toBeDefined();
    const rows = dashboardResult.data?.teacherDashboard?.scheduleRows || [];
    const activatedRow = rows.find(r => r?.id === classInstanceId);
    expect(activatedRow).toBeDefined();
    if (!activatedRow) throw new Error("No activatedRow found");
    expect(activatedRow.executionState).toBe("ACTIVATED");
  });

  test("teacher activation outside window fails with YOU MISSED THE CLASS TIME message", async () => {
    if (!teacherToken || !studentId || !teacherId) throw new Error("Missing test context");

    // 1. Create a new class instance outside window (start = now + 2 hours, end = now + 3 hours)
    const now = new Date();
    const startOutside = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const endOutside = new Date(now.getTime() + 3 * 60 * 60 * 1000);

    const createRes = await testClient.mutate({
      mutation: createTeacherManualClassEntryMutationDocument,
      variables: {
        input: {
          studentId,
          teacherId,
          scheduledStartAt: startOutside.toISOString(),
          scheduledEndAt: endOutside.toISOString(),
          durationMinutes: 60,
          classType: "REGULAR",
        },
      },
      errorPolicy: "all",
      context: {
        headers: {
          Authorization: `Bearer ${teacherToken}`,
        },
      },
    });

    expect(createRes.data).toBeDefined();
    expect(createRes.error).toBeUndefined();
    const createdId = createRes.data?.createTeacherManualClassEntry?.id;
    if (!createdId) throw new Error("Failed to create outside manual entry");
    outsideClassInstanceId = createdId;

    // 2. Attempt activation as teacher - should fail
    const activateRes = await testClient.mutate({
      mutation: activateClassMutationDocument,
      variables: {
        classInstanceId: outsideClassInstanceId,
      },
      errorPolicy: "all",
      context: {
        headers: {
          Authorization: `Bearer ${teacherToken}`,
        },
      },
    });

    expect(activateRes.error).toBeDefined();
    expect(activateRes.error?.message).toContain("لقد فات وقت الحصة"); // Localized error returned by backend in test env
  });

  test("academy admin forceActivateClass outside window succeeds", async () => {
    if (!adminToken || !teacherToken || !outsideClassInstanceId) throw new Error("Missing test context");

    // Call forceActivateClass as academy admin on the class instance created in the previous test
    const forceRes = await testClient.mutate({
      mutation: forceActivateClassMutationDocument,
      variables: {
        classInstanceId: outsideClassInstanceId,
      },
      errorPolicy: "all",
      context: {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      },
    });

    expect(forceRes.data).toBeDefined();
    expect(forceRes.error).toBeUndefined();

    // Verify executionState changes to ACTIVATED via teacher dashboard query
    const dashboardResult = await testClient.query({
      query: teacherDashboardQueryDocument,
      variables: {
        date: testDate,
      },
      context: {
        headers: {
          Authorization: `Bearer ${teacherToken}`,
        },
      },
    });

    expect(dashboardResult.data).toBeDefined();
    const rows = dashboardResult.data?.teacherDashboard?.scheduleRows || [];
    const activatedRow = rows.find(r => r?.id === outsideClassInstanceId);
    expect(activatedRow).toBeDefined();
    if (!activatedRow) throw new Error("No activatedRow found");
    expect(activatedRow.executionState).toBe("ACTIVATED");
  });
});
