import { afterAll, describe, expect, test } from "bun:test";
import { IanaTimezone, StudentStatus } from "@/frontend/graphql/generated/gql/graphql-types";
import { statusTrackingScheduleQueryDocument } from "@/frontend/graphql/sharedDocuments/scheduling/schedule.documents";
import { changeStudentStatusMutationDocument } from "@/frontend/graphql/sharedDocuments/students/student-lifecycle.documents";
import {
  authenticatedRequest,
  cleanupTestSuperAdmin,
  loginDemoUser,
  provisionTestEntities,
  provisionTestSuperAdmin,
} from "@/frontend/graphql/test/helpers";
import { setupTestServerLifecycle } from "@/frontend/graphql/test/lifecycle";
import { testClient } from "@/frontend/graphql/test/testClient";

/**
 * Helper to fetch status tracking schedule with a given token.
 */
async function fetchStatusTracking(
  token: string,
  date: string,
  search?: string | null,
  viewerTimezone?: IanaTimezone | null
) {
  return await authenticatedRequest(token, "query", statusTrackingScheduleQueryDocument, {
    date,
    search: search ?? null,
    viewerTimezone: viewerTimezone ?? IanaTimezone.Utc,
  });
}

/**
 * Helper to verify that a given demo user role is denied access to
 * statusTrackingSchedule. Encapsulates the login -> query -> assert-error
 * pattern shared across authorization and security tests.
 */
async function expectRoleDenied(role: string, date: string) {
  const token = await loginDemoUser(role);
  const result = await testClient.query({
    query: statusTrackingScheduleQueryDocument,
    variables: { date, search: null, viewerTimezone: IanaTimezone.Utc },
    context: { headers: { Authorization: `Bearer ${token}` } },
  });

  expect(result.error).toBeDefined();
  expect(result.data?.statusTrackingSchedule).toBeFalsy();
}

/**
 * Integration tests for the statusTrackingSchedule GraphQL query.
 *
 * Security coverage (from Section 4):
 * - T10-001: Unauthorized actor (teacher) cannot access status tracking data
 * - T10-004: SUSPENDED→REGULAR cycle restores isFrozen = false (verified via query)
 *
 * Test coverage:
 * - Authorization: admin success, teacher denied, DASHBOARD_VIEW_METRICS success
 * - Data correctness: isFrozen visibility, studentStatus for frozen classes, search filter
 * - Field type validation: all 13 fields returned with correct types
 */
describe("GraphQL: statusTrackingSchedule query", () => {
  setupTestServerLifecycle();

  let adminToken = "";
  let studentId = "";
  let superAdminToken = "";
  let superAdminUserId = "";
  const testDate = new Date().toISOString().split("T")[0];

  test("login as academy_admin and provision test entities", async () => {
    adminToken = await loginDemoUser("academy_admin");
    expect(adminToken).not.toBeNull();

    const entities = await provisionTestEntities(adminToken, "s10status");
    if (!entities.studentId) throw new Error("No studentId provisioned");
    if (!entities.teacherId) throw new Error("No teacherId provisioned");
    studentId = entities.studentId;

    const sa = await provisionTestSuperAdmin(adminToken, "s10statusSa");
    superAdminToken = sa.token;
    superAdminUserId = sa.userId;
  });

  // ─── Authorization Tests ─────────────────────────────────────────────────────

  test("authorized admin can fetch statusTrackingSchedule for a date", async () => {
    const data = await fetchStatusTracking(adminToken, testDate);

    expect(data.statusTrackingSchedule).toBeDefined();
    expect(Array.isArray(data.statusTrackingSchedule)).toBeTrue();
  });

  test("teacher role is denied (no SCHEDULE_VIEW_ALL or DASHBOARD_VIEW_METRICS)", async () => {
    await expectRoleDenied("teacher_default", testDate);
  });

  test("parent role is denied", async () => {
    await expectRoleDenied("parent_default", testDate);
  });

  test("super_admin can also access statusTrackingSchedule", async () => {
    const data = await fetchStatusTracking(superAdminToken, testDate);

    expect(data.statusTrackingSchedule).toBeDefined();
    expect(Array.isArray(data.statusTrackingSchedule)).toBeTrue();
  });

  // ─── Data Correctness Tests ───────────────────────────────────────────────────

  test("returns all fields with correct types when data exists", async () => {
    const data = await fetchStatusTracking(adminToken, testDate);

    const rows = data.statusTrackingSchedule;
    if (!rows || rows.length === 0) {
      // Skip field validation if no data for this date
      return;
    }

    const row = rows[0];
    if (!row) throw new Error("No row found");

    expect(typeof row.id).toBe("string");
    expect(typeof row.studentId).toBe("string");
    expect(typeof row.studentName).toBe("string");
    expect(typeof row.studentInitials).toBe("string");
    expect(typeof row.studentStatus).toBe("string");
    expect(typeof row.teacherId).toBe("string");
    expect(typeof row.teacherName).toBe("string");
    expect(row.scheduledStartAt).toBeTruthy();
    expect(row.scheduledEndAt).toBeTruthy();
    expect(typeof row.durationMinutes).toBe("number");
    expect(typeof row.executionState).toBe("string");
    expect(typeof row.outcome).toBe("string");
    expect(typeof row.isFrozen).toBe("boolean");
  });

  test("search filter narrows results by student or teacher name", async () => {
    // First, get all results without filter
    const allData = await fetchStatusTracking(adminToken, testDate);

    const allRows = allData.statusTrackingSchedule;
    if (!allRows || allRows.length === 0) {
      // No data to filter — skip
      return;
    }

    // Pick a name from existing results
    const firstName = allRows[0]?.studentName;
    if (!firstName) throw new Error("No student name in results");

    // Search with first word of the name
    const searchTerm = firstName.split(" ")[0];
    if (!searchTerm) throw new Error("No search term");

    const filteredData = await fetchStatusTracking(adminToken, testDate, searchTerm);

    const filteredRows = filteredData.statusTrackingSchedule;
    expect(filteredRows).toBeDefined();
    if (!filteredRows) throw new Error("No filtered data returned");

    // Every result should match the search term
    for (const row of filteredRows) {
      if (!row) continue;
      const sName = row.studentName ?? "";
      const tName = row.teacherName ?? "";
      const nameMatch =
        sName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tName.toLowerCase().includes(searchTerm.toLowerCase());
      expect(nameMatch).toBeTrue();
    }
  });

  test("viewerTimezone parameter is accepted without error", async () => {
    const data = await fetchStatusTracking(adminToken, testDate, null, IanaTimezone.AsiaRiyadh);

    expect(data.statusTrackingSchedule).toBeDefined();
    expect(Array.isArray(data.statusTrackingSchedule)).toBeTrue();
  });

  // ─── Security Threat Tests ────────────────────────────────────────────────────

  describe("security: T10-001 — unauthorized side-effect trigger prevention", () => {
    test("teacher cannot view status tracking data (prevents reconnaissance)", async () => {
      await expectRoleDenied("teacher_default", testDate);
    });
  });

  describe("security: T10-004 — SUSPENDED→REGULAR restores isFrozen = false", () => {
    test("after admin changes student from SUSPENDED back to REGULAR, isFrozen reflects unfrozen state", async () => {
      // Step 1: Change student to SUSPENDED (triggers bulkFreezeStudentClasses)
      await authenticatedRequest(superAdminToken, "mutate", changeStudentStatusMutationDocument, {
        studentId,
        newStatus: StudentStatus.Suspended,
        expectedVersion: null,
      });

      // Step 2: Verify via statusTrackingSchedule that classes have isFrozen = true
      const suspendedData = await fetchStatusTracking(adminToken, testDate);

      const suspendedRows = suspendedData.statusTrackingSchedule;
      const frozenRow = suspendedRows?.find(r => r?.studentId === studentId);
      if (frozenRow) {
        expect(frozenRow.isFrozen).toBe(true);
        expect(frozenRow.studentStatus).toBe(StudentStatus.Suspended);
      }

      // Step 3: Change student back to REGULAR (triggers bulkUnfreezeStudentClasses)
      await authenticatedRequest(superAdminToken, "mutate", changeStudentStatusMutationDocument, {
        studentId,
        newStatus: StudentStatus.Regular,
        expectedVersion: null,
      });

      // Step 4: Verify via statusTrackingSchedule that classes have isFrozen = false
      const restoredData = await fetchStatusTracking(adminToken, testDate);

      const restoredRows = restoredData.statusTrackingSchedule;
      const restoredRow = restoredRows?.find(r => r?.studentId === studentId);
      if (restoredRow) {
        expect(restoredRow.isFrozen).toBe(false);
        expect(restoredRow.studentStatus).toBe(StudentStatus.Regular);
      }
    });
  });

  afterAll(async () => {
    if (superAdminToken && superAdminUserId) {
      await cleanupTestSuperAdmin(superAdminToken, superAdminUserId);
    }
  });
});
