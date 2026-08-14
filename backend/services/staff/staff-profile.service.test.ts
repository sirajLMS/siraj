import { afterEach, describe, expect, spyOn, test } from "bun:test";
import { TeacherRepository } from "@/backend/db/repo/teachers";
import { AccountStatus, AppPermission } from "@/backend/enum";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { StaffProfileService } from "@/backend/services/staff/staff-profile.service";
import type { TeacherProfileReturnType } from "@/backend/types";
import { IanaTimezone } from "@/shared/constants/iana-timezone.enum";

const MOCK_TEACHER_PROFILE: TeacherProfileReturnType = {
  id: "teacher-1",
  userId: "user-1",
  name: "Test Teacher",
  email: "teacher@example.com",
  nationalId: "1234567890",
  phone: null,
  status: AccountStatus.ACTIVATED,
  gender: null,
  nationality: null,
  countryCode: null,
  dateOfBirth: null,
  address: null,
  qualifications: null,
  hourlyRate: null,
  rateCurrency: null,
  updatedAt: "2025-01-01T00:00:00.000Z",
  timezone: IanaTimezone.Asia_Riyadh,
  totalClasses: 0,
  avgEngagementScore: 0,
};

afterEach(() => {
  spyOn(PermissionsService, "hasAnyPermission").mockRestore();
  spyOn(TeacherRepository, "getTeacherProfileForEdit").mockRestore();
});

describe("StaffProfileService.getTeacherProfileForView", () => {
  test("allows staff with any profile view_other permission", async () => {
    spyOn(PermissionsService, "hasAnyPermission").mockImplementation(async (_userId, keys) => {
      return keys.includes(AppPermission.PROFILE_CORE_IDENTITY_VIEW_OTHER);
    });
    spyOn(TeacherRepository, "getTeacherProfileForEdit").mockResolvedValue(MOCK_TEACHER_PROFILE);

    const profile = await StaffProfileService.getTeacherProfileForView("staff-actor", "teacher-1", "en");

    expect(profile.id).toBe("teacher-1");
    expect(profile.nationalId).toBe("******7890");
  });

  test("rejects actors without profile view_other permissions", async () => {
    spyOn(PermissionsService, "hasAnyPermission").mockResolvedValue(false);

    return expect(StaffProfileService.getTeacherProfileForView("staff-actor", "teacher-1", "en")).rejects.toThrow();
  });
});
