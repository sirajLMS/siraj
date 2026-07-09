import { beforeEach, describe, expect, spyOn, test } from "bun:test";
import { StaffProfileRepository } from "@/backend/db/repo/teachers/staff-profile.repository";
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
  });

  test("passes status to repository on admin staff profile update", async () => {
    const updateSpy = spyOn(StaffProfileRepository, "updateManagerProfile").mockResolvedValue(updatedRow);

    const result = await ManagerProfileService.updateManagerProfile("actor-user-1", "staff-profile-1", {
      phone: "+966500000000",
      status: AccountStatus.DEACTIVATED,
    });

    expect(updateSpy).toHaveBeenCalledWith(
      "staff-profile-1",
      expect.objectContaining({
        status: AccountStatus.DEACTIVATED,
        statusIsSet: true,
      }),
      undefined
    );
    expect(result.status).toBe(AccountStatus.DEACTIVATED);
  });
});
