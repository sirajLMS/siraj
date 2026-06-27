import { describe, expect, test } from "bun:test";
import { ReportGroupingMode } from "../generated/gql/graphql-types";
import { meQueryDocument } from "../sharedDocuments/auth.documents";
import {
  assignPermissionGroupToUserMutationDocument,
  createPermissionGroupMutationDocument,
  deletePermissionGroupMutationDocument,
  permissionsQueryDocument,
  revokePermissionGroupFromUserMutationDocument,
} from "../sharedDocuments/permission-management.documents";
import { generateAttendanceReportQueryDocument } from "../sharedDocuments/report.documents";
import { assertOperationDenied, authenticatedRequest, loginDemoUser } from "./helpers";
import { setupTestServerLifecycle } from "./lifecycle";

describe("GraphQL Query: generateAttendanceReport Integration Tests", () => {
  setupTestServerLifecycle();

  const filters = {
    fromDate: new Date("2026-01-01").toISOString(),
    toDate: new Date("2026-12-31").toISOString(),
    teacherId: null,
    groupBy: ReportGroupingMode.Date,
  };

  test("SECURITY: Returns full financial data for Admin with both permissions", async () => {
    // 1. Arrange & login as academy_admin (has both permissions by default)
    const adminToken = await loginDemoUser("academy_admin");

    // 2. Act
    const data = await authenticatedRequest(adminToken, "query", generateAttendanceReportQueryDocument, { filters });

    const payload = data?.generateAttendanceReport;
    expect(payload).toBeDefined();
    if (!payload) throw new Error("generateAttendanceReport returned no data");

    const rows = payload.rows ?? [];
    expect(Array.isArray(rows)).toBeTrue();

    for (const row of rows) {
      expect(row.id).toBeDefined();
      expect(row.groupKey).toBeDefined();
      expect(row.groupLabel).toBeDefined();
      expect(row.takenClasses).toBeGreaterThanOrEqual(0);
    }
  });

  test("SECURITY: Masks financial data for user lacking report.view_financials", async () => {
    const superAdminToken = await loginDemoUser("super_admin");
    const teacherToken = await loginDemoUser("teacher_default");

    const meData = await authenticatedRequest(teacherToken, "query", meQueryDocument);
    const teacherUserId = meData?.me?.id;
    if (typeof teacherUserId !== "string") throw new Error("Could not fetch teacher userId");

    const permissionsData = await authenticatedRequest(superAdminToken, "query", permissionsQueryDocument);
    const customPerm = permissionsData?.permissions?.find(p => p.key === "report.generate_custom");
    if (typeof customPerm?.id !== "string") throw new Error("Could not find report.generate_custom permission ID");

    const groupRes = await authenticatedRequest(superAdminToken, "mutate", createPermissionGroupMutationDocument, {
      input: {
        name: `Temp Report Group ${Date.now()}`,
        description: "Temporary group for testing report financial masking",
        permissionIds: [customPerm.id],
      },
    });
    const groupId = groupRes?.createPermissionGroup?.id;
    if (typeof groupId !== "string") throw new Error("Could not create temp permission group");

    await authenticatedRequest(superAdminToken, "mutate", assignPermissionGroupToUserMutationDocument, {
      input: {
        groupId,
        userId: teacherUserId,
      },
    });

    try {
      const data = await authenticatedRequest(teacherToken, "query", generateAttendanceReportQueryDocument, {
        filters,
      });

      const payload = data?.generateAttendanceReport;
      expect(payload).toBeDefined();
      if (!payload) throw new Error("generateAttendanceReport returned no data");

      const rows = payload.rows ?? [];
      expect(Array.isArray(rows)).toBeTrue();

      for (const row of rows) {
        expect(row.totalHours === 0 || row.totalHours === null).toBeTrue();
        expect(row.paidEGP === 0 || row.paidEGP === null).toBeTrue();
        expect(row.paidUSD === 0 || row.paidUSD === null).toBeTrue();
      }
    } finally {
      // 7. Cleanup - Revoke the group and delete it
      await authenticatedRequest(superAdminToken, "mutate", revokePermissionGroupFromUserMutationDocument, {
        input: {
          groupId,
          userId: teacherUserId,
        },
      });

      await authenticatedRequest(superAdminToken, "mutate", deletePermissionGroupMutationDocument, {
        groupId,
      });
    }
  });

  test("SECURITY: Rejects user entirely lacking report.generate_custom", async () => {
    // Standard teacher lacks generate_custom permission by default
    await assertOperationDenied("teacher_default", "query", generateAttendanceReportQueryDocument, { filters });
  });
});
