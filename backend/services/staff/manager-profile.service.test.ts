import { beforeEach, describe, expect, spyOn, test } from "bun:test";
import { StaffProfileRepository, UserRepository } from "@/backend/db/repo";
import { AccountStatus } from "@/backend/enum";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { ManagerProfileService } from "@/backend/services/staff/manager-profile.service";

const targetRow = {
  id: "target-user-1",
  staffProfileId: "staff-profile-1",
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

describe("ManagerProfileService admin update", () => {
  beforeEach(() => {
    spyOn(PermissionsService, "hasPermission").mockResolvedValue(true);
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
    const updateProfileFieldsSpy = spyOn(UserRepository, "updateProfileFields").mockResolvedValue({
      id: targetRow.id,
      name: targetRow.name,
      email: targetRow.email,
      status: AccountStatus.DEACTIVATED,
    } as never);
    const updateStatusSpy = spyOn(UserRepository, "updateStatus").mockResolvedValue({
      id: targetRow.id,
      status: AccountStatus.DEACTIVATED,
    } as never);

    const result = await ManagerProfileService.updateManagerProfile("actor-user-1", "staff-profile-1", {
      phone: "+966500000000",
      status: AccountStatus.DEACTIVATED,
    });

    expect(updateProfileFieldsSpy).toHaveBeenCalledWith(targetRow.id, { phone: "+966500000000" }, undefined);
    expect(updateStatusSpy).toHaveBeenCalledWith(targetRow.id, AccountStatus.DEACTIVATED, undefined, undefined);
    expect(result.status).toBe(AccountStatus.DEACTIVATED);
  });
});
