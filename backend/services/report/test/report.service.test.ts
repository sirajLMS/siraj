import { describe, expect, spyOn, test } from "bun:test";
import { ReportGroupingMode, ReportRepository } from "@/backend/db/repo/books/report.repository";
import { AppPermission } from "@/backend/enum";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { ReportService } from "@/backend/services/report/report.service";

describe("ReportService — generateAttendanceReport", () => {
  const dummyFilters = {
    fromDate: new Date("2026-05-01"),
    toDate: new Date("2026-05-31"),
    groupBy: ReportGroupingMode.DATE,
  };
  const dummyActorId = "user-uuid-1234";

  const mockRepoResults = [
    {
      groupKey: "2026-05-10",
      groupLabel: "2026-05-10",
      takenClasses: 1,
      absentClasses: 0,
      leaveClasses: 0,
      pendingClasses: 0,
      totalHours: 1,
      paidEGP: 100,
      paidUSD: 0,
      engagementGrowth: null,
    },
  ];

  test("throws unauthorized error if actor lacks base execution permission", async () => {
    const hasPermissionSpy = spyOn(PermissionsService, "hasPermission").mockResolvedValue(false);

    let errorCaught: Error | null = null;
    try {
      await ReportService.generateAttendanceReport(dummyFilters, dummyActorId);
    } catch (e) {
      errorCaught = e as Error;
    }

    expect(errorCaught).not.toBeNull();
    if (errorCaught) {
      expect(errorCaught.message.toLowerCase()).toContain("unauthorized");
    }
    expect(hasPermissionSpy).toHaveBeenCalledWith(dummyActorId, AppPermission.REPORT_GENERATE_CUSTOM);

    hasPermissionSpy.mockRestore();
  });

  test("masks financial data if actor lacks REPORT_VIEW_FINANCIALS", async () => {
    const hasPermissionSpy = spyOn(PermissionsService, "hasPermission").mockImplementation(
      async (_userId, permission) => {
        if (permission === AppPermission.REPORT_GENERATE_CUSTOM) return true;
        if (permission === AppPermission.REPORT_VIEW_FINANCIALS) return false;
        return false;
      }
    );
    const repoSpy = spyOn(ReportRepository, "generateAttendanceReport").mockResolvedValue(mockRepoResults);
    const growthSpy = spyOn(ReportRepository, "calculateEngagementGrowth").mockResolvedValue(null);

    const result = await ReportService.generateAttendanceReport(dummyFilters, dummyActorId);

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].takenClasses).toBe(1);
    expect(result.rows[0].groupLabel).toBe("2026-05-10");

    expect(result.rows[0].totalHours).toBe(0);
    expect(result.rows[0].paidEGP).toBe(0);
    expect(result.rows[0].paidUSD).toBe(0);
    expect(result.engagementGrowth).toBeNull();

    expect(hasPermissionSpy).toHaveBeenCalledWith(dummyActorId, AppPermission.REPORT_GENERATE_CUSTOM);
    expect(hasPermissionSpy).toHaveBeenCalledWith(dummyActorId, AppPermission.REPORT_VIEW_FINANCIALS);

    hasPermissionSpy.mockRestore();
    repoSpy.mockRestore();
    growthSpy.mockRestore();
  });

  test("returns unmasked data if actor has both permissions", async () => {
    const hasPermissionSpy = spyOn(PermissionsService, "hasPermission").mockResolvedValue(true);
    const repoSpy = spyOn(ReportRepository, "generateAttendanceReport").mockResolvedValue(mockRepoResults);
    const growthSpy = spyOn(ReportRepository, "calculateEngagementGrowth").mockResolvedValue(5.2);

    const result = await ReportService.generateAttendanceReport(dummyFilters, dummyActorId);

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].takenClasses).toBe(1);
    expect(result.rows[0].groupLabel).toBe("2026-05-10");

    expect(result.rows[0].totalHours).toBe(1);
    expect(result.rows[0].paidEGP).toBe(100);
    expect(result.rows[0].paidUSD).toBe(0);
    expect(result.engagementGrowth).toBeCloseTo(5.2, 5);

    hasPermissionSpy.mockRestore();
    repoSpy.mockRestore();
    growthSpy.mockRestore();
  });

  test("wraps repository failure with permissionDenied error and preserves cause", async () => {
    const hasPermissionSpy = spyOn(PermissionsService, "hasPermission").mockResolvedValue(true);
    const repoError = new Error("Database Timeout");
    const repoSpy = spyOn(ReportRepository, "generateAttendanceReport").mockRejectedValue(repoError);

    let errorCaught: Error | null = null;
    try {
      await ReportService.generateAttendanceReport(dummyFilters, dummyActorId);
    } catch (e) {
      errorCaught = e as Error;
    }

    expect(errorCaught).not.toBeNull();
    if (errorCaught) {
      expect(errorCaught.message.toLowerCase()).toContain("permission to perform this action");
      expect(errorCaught.cause).toBe(repoError);
    }

    hasPermissionSpy.mockRestore();
    repoSpy.mockRestore();
  });
});
