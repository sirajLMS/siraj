import { afterEach, describe, expect, spyOn, test } from "bun:test";
import { TeacherRepository } from "@/backend/db/repo";
import { AppPermission } from "@/backend/enum";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { StaffProfileService } from "@/backend/services/staff/staff-profile.service";

afterEach(() => {
  spyOn(PermissionsService, "hasAnyPermission").mockRestore();
  spyOn(TeacherRepository, "getTeacherProfileForEdit").mockRestore();
});

describe("StaffProfileService.getTeacherProfileForView", () => {
  test("allows staff with any profile view_other permission", async () => {
    spyOn(PermissionsService, "hasAnyPermission").mockImplementation(async (_userId, keys) => {
      return keys.includes(AppPermission.PROFILE_CORE_IDENTITY_VIEW_OTHER);
    });
    spyOn(TeacherRepository, "getTeacherProfileForEdit").mockResolvedValue({
      id: "teacher-1",
      nationalId: "1234567890",
    } as never);

    const profile = await StaffProfileService.getTeacherProfileForView("staff-actor", "teacher-1", "en");

    expect(profile.id).toBe("teacher-1");
    expect(profile.nationalId).toBe("******7890");
  });

  test("rejects actors without profile view_other permissions", async () => {
    spyOn(PermissionsService, "hasAnyPermission").mockResolvedValue(false);

    return expect(StaffProfileService.getTeacherProfileForView("staff-actor", "teacher-1", "en")).rejects.toThrow();
  });
});
