import { afterAll, describe, expect, test } from "bun:test";
import {
  activateClassMutationDocument,
  activateOverrideClassMutationDocument,
  deleteClassInstanceMutationDocument,
  resetClassMutationDocument,
  updateSessionStatusAbsentMutationDocument,
  updateSessionStatusLeaveMutationDocument,
  updateSessionStatusStartMutationDocument,
} from "../sharedDocuments/class-session.documents";
import { dailyScheduleListQueryDocument } from "../sharedDocuments/schedule.documents";
import {
  createTeacherManualClassEntryMutationDocument,
  teacherDashboardQueryDocument,
} from "../sharedDocuments/teacher-dashboard.documents";
import { cleanupTestEntitiesMutationDocument } from "../sharedDocuments/test-helper.documents";
import { authenticatedRequest, loginAndProvision } from "./helpers";
import { setupTestServerLifecycle } from "./lifecycle";
import { testClient } from "./testClient";

const testDate = new Date().toISOString().split("T")[0]; // "YYYY-MM-DD"

async function clearClassesOnDate(token: string, dateVal: string) {
  const result = await testClient.query({
    query: dailyScheduleListQueryDocument,
    variables: {
      date: dateVal,
      teacherId: null,
      search: null,
      metricFilter: null,
    },
    context: {
      headers: {
        Authorization: `Bearer ${token}`,
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
          Authorization: `Bearer ${token}`,
        },
      },
    });
    expect(deleteRes.error).toBeUndefined();
  }
}

describe("GraphQL Class Session Integration Tests", () => {
  setupTestServerLifecycle();

  let adminToken: string | null = null;
  let teacherToken: string | null = null;
  let studentId: string | null = null;
  let teacherId: string | null = null;
  let studentUserId: string | null = null;
  let teacherUserId: string | null = null;
  let parentUserId: string | null = null;
  let parentId: string | null = null;
  let outsideClassInstanceId: string | null = null;
  let outsideDate: string | null = null;

  test("login as academy_admin and teacher", async () => {
    const r = await loginAndProvision("SessionIntTest");
    adminToken = r.adminToken;
    teacherToken = r.teacherToken;
    studentId = r.studentId;
    teacherId = r.teacherId;
    studentUserId = r.studentUserId;
    teacherUserId = r.teacherUserId;
    parentUserId = r.parentUserId;
    parentId = r.parentId;
  });

  test("find student and teacher IDs, then clear schedule range to avoid overlaps", async () => {
    if (!adminToken) throw new Error("No admin token");

    // 1. Delete all classes in range of [-1, 12] days to avoid scheduling conflicts/overlaps
    for (let i = -1; i <= 12; i++) {
      const d = new Date(Date.now() + i * 24 * 60 * 60 * 1000);
      const dateStr = d.toISOString().split("T")[0];
      await clearClassesOnDate(adminToken, dateStr);
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
        pagination: null,
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
    outsideDate = startOutside.toISOString().split("T")[0];

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
      mutation: activateOverrideClassMutationDocument,
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
        date: outsideDate || testDate,
        pagination: null,
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

  test("session lifecycle: start, reset, restart, and leave flow", async () => {
    if (!adminToken || !teacherToken || !outsideClassInstanceId) throw new Error("Missing test context");

    // 1. Teacher starts the activated session successfully
    const startData = await authenticatedRequest(teacherToken, "mutate", updateSessionStatusStartMutationDocument, {
      classInstanceId: outsideClassInstanceId,
    });
    expect(startData.updateSessionStatusStart?.executionState).toBe("RUNNING");

    // 2. Academy admin resets the running session successfully
    const resetData = await authenticatedRequest(adminToken, "mutate", resetClassMutationDocument, {
      classInstanceId: outsideClassInstanceId,
    });
    expect(resetData.resetClass).toBe(true);

    // 3. Force activate it again as admin (since it's outside window)
    const forceData = await authenticatedRequest(adminToken, "mutate", activateOverrideClassMutationDocument, {
      classInstanceId: outsideClassInstanceId,
    });
    expect(forceData.activateOverrideClass?.executionState).toBe("ACTIVATED");

    // 4. Start it again as teacher
    const restartData = await authenticatedRequest(teacherToken, "mutate", updateSessionStatusStartMutationDocument, {
      classInstanceId: outsideClassInstanceId,
    });
    expect(restartData.updateSessionStatusStart?.executionState).toBe("RUNNING");

    // 5. Teacher processes leave on the running session
    const leaveData = await authenticatedRequest(teacherToken, "mutate", updateSessionStatusLeaveMutationDocument, {
      classInstanceId: outsideClassInstanceId,
      leaveReason: "Teacher has an emergency",
    });
    expect(leaveData.updateSessionStatusLeave?.completedInstanceId).toBe(outsideClassInstanceId);
    expect(leaveData.updateSessionStatusLeave?.completedInstance?.outcome).toBe("LEAVE");
    expect(leaveData.updateSessionStatusLeave?.completedInstance?.isRescheduled).toBe(true);
    expect(leaveData.updateSessionStatusLeave?.rescheduledInstanceId).toBeDefined();
  });

  test("teacher marks a class past waiting period as absent", async () => {
    if (!teacherToken || !adminToken || !studentId || !teacherId) throw new Error("Missing test context");

    // Clear today's classes to avoid any overlaps with previously run tests
    await clearClassesOnDate(adminToken, testDate);

    // Create a class instance starting 40 minutes ago and ending 20 minutes in the future
    const now = new Date();
    const startAbsent = new Date(now.getTime() - 40 * 60 * 1000);
    const endAbsent = new Date(now.getTime() + 20 * 60 * 1000);

    const createData = await authenticatedRequest(
      teacherToken,
      "mutate",
      createTeacherManualClassEntryMutationDocument,
      {
        input: {
          studentId,
          teacherId,
          scheduledStartAt: startAbsent.toISOString(),
          scheduledEndAt: endAbsent.toISOString(),
          durationMinutes: 60,
          classType: "REGULAR",
        },
      }
    );

    const instanceId = createData.createTeacherManualClassEntry?.id;
    expect(instanceId).toBeDefined();
    if (!instanceId) throw new Error("Failed to create class for absent test");

    // Activate the class
    await authenticatedRequest(teacherToken, "mutate", activateClassMutationDocument, { classInstanceId: instanceId });

    // Mark it absent
    const absentData = await authenticatedRequest(teacherToken, "mutate", updateSessionStatusAbsentMutationDocument, {
      classInstanceId: instanceId,
    });

    expect(absentData.updateSessionStatusAbsent?.executionState).toBe("COMPLETED");
    expect(absentData.updateSessionStatusAbsent?.outcome).toBe("ABSENT");
    expect(absentData.updateSessionStatusAbsent?.payrollCredited).toBe(true);
  });

  afterAll(async () => {
    if (adminToken && studentUserId && teacherUserId && parentUserId) {
      await authenticatedRequest(adminToken, "mutate", cleanupTestEntitiesMutationDocument, {
        studentUserId,
        teacherUserId,
        parentUserId,
        studentId: studentId || "",
        teacherId: teacherId || "",
        parentId: parentId || "",
      });
    }
  });
});
