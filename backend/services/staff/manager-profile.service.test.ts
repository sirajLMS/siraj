import { beforeEach, describe, expect, spyOn, test } from "bun:test";
import { StaffProfileRepository, UserRepository } from "@/backend/db/repo";
import { AccountStatus, UserRole } from "@/backend/enum";
import { IanaTimezone } from "@/backend/enum/shared/timezone.enum";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { ManagerProfileService } from "@/backend/services/staff/manager-profile.service";
import type { UserReturnType, UserSelectType } from "@/backend/types";

const targetRow = {
  id: "00000000-0000-0000-0000-000000000002",
  staffProfileId: "00000000-0000-0000-0000-000000000003",
  name: "Target Staff",
  email: "target@example.com",
  avatarUrl: null,
  phone: null,
  status: AccountStatus.ACTIVATED,
  roleSlug: "staff",
  roleName: "Staff",
  hourlyRate: null,
  rateCurrency: null,
};

const updatedRow = {
  ...targetRow,
  phone: "+966500000000",
  status: AccountStatus.DEACTIVATED,
};

const mockTimestamp = new Date("2024-01-01T00:00:00.000Z");

const updateProfileFieldsResult: UserReturnType = {
  id: targetRow.id,
  name: targetRow.name,
  email: targetRow.email,
  emailVerifiedAt: null,
  password: "redacted",
  rememberTokenHash: null,
  avatarFilePath: null,
  avatarUrl: null,
  phone: "+966500000000",
  status: AccountStatus.DEACTIVATED,
  isSuperAdmin: false,
  timezone: IanaTimezone.UTC,
  displayCurrency: null,
  lastLoginAt: null,
  createdAt: mockTimestamp,
  updatedAt: mockTimestamp,
  role: UserRole.STAFF,
  teacherId: null,
  parentId: null,
};

const updateStatusResult: UserSelectType = {
  id: targetRow.id,
  name: targetRow.name,
  email: targetRow.email,
  emailVerifiedAt: null,
  password: "redacted",
  rememberTokenHash: null,
  avatarFilePath: null,
  avatarUrl: null,
  phone: "+966500000000",
  status: AccountStatus.DEACTIVATED,
  isSuperAdmin: false,
  timezone: IanaTimezone.UTC,
  displayCurrency: null,
  lastLoginAt: null,
  createdAt: mockTimestamp,
  updatedAt: mockTimestamp,
  deletedAt: null,
};

describe("ManagerProfileService admin update", () => {
  beforeEach(() => {
    spyOn(PermissionsService, "hasPermission").mockResolvedValue(true);
    spyOn(PermissionsService, "hasAnyPermission").mockResolvedValue(true);
    spyOn(StaffProfileRepository, "getUserPermissionGroupSlugs").mockResolvedValue(["academy-admin"]);
    spyOn(StaffProfileRepository, "getManagerDirectory").mockResolvedValue({
      id: "manager-directory",
      metrics: {
        id: "metrics",
        totalAdmin: 1,
        systemStaff: 1,
        activeNow: 1,
        alerts: 0,
      },
      rows: [targetRow],
      totalCount: 1,
      pageInfo: null,
    });
    spyOn(StaffProfileRepository, "findByStaffProfileId").mockResolvedValue(updatedRow);
  });

  test("routes phone and status updates through UserRepository", async () => {
    const updateProfileFieldsSpy = spyOn(UserRepository, "updateProfileFields").mockResolvedValue(
      updateProfileFieldsResult
    );
    const updateStatusSpy = spyOn(UserRepository, "updateStatus").mockResolvedValue(updateStatusResult);

    const result = await ManagerProfileService.updateManagerProfile(
      "00000000-0000-0000-0000-000000000001",
      "00000000-0000-0000-0000-000000000003",
      {
        phone: "+966500000000",
        status: AccountStatus.DEACTIVATED,
      }
    );

    expect(updateProfileFieldsSpy).toHaveBeenCalledWith(targetRow.id, { phone: "+966500000000" }, undefined);
    expect(updateStatusSpy).toHaveBeenCalledWith(targetRow.id, AccountStatus.DEACTIVATED, undefined, undefined);
    expect(result.status).toBe(AccountStatus.DEACTIVATED);
  });
});
