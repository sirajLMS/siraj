import { afterEach, describe, expect, spyOn, test } from "bun:test";
import { TeacherRepository } from "@/backend/db/repo";
import { AccountStatus, AppPermission, CurrencyCode } from "@/backend/enum";
import { IanaTimezone } from "@/backend/enum/shared/timezone.enum";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { StaffProfileService } from "@/backend/services/staff/staff-profile.service";
import { TeacherPortalService } from "@/backend/services/teacher/teacher-portal.service";
import type { TeacherProfileReturnType } from "@/backend/types/teachers/teacher.types";
import { getServerTranslations } from "@/shared/locale/server-graphql";

const baseProfile: TeacherProfileReturnType = {
  id: "teacher-1",
  userId: "user-1",
  name: "Ahmed Hassan",
  email: "ahmed@example.com",
  phone: "+966500000000",
  nationalId: "1234567890",
  dateOfBirth: "1990-01-01T00:00:00.000Z",
  gender: null,
  address: "Riyadh",
  qualifications: "BA",
  timezone: IanaTimezone.Asia_Riyadh,
  hourlyRate: "50",
  rateCurrency: CurrencyCode.USD,
  status: AccountStatus.ACTIVATED,
  updatedAt: "2024-01-01T00:00:00.000Z",
  totalClasses: 10,
  avgEngagementScore: 4.5,
};

afterEach(() => {
  spyOn(PermissionsService, "hasPermission").mockRestore();
  spyOn(TeacherRepository, "getTeacherProfileForEdit").mockRestore();
  spyOn(TeacherRepository, "findByUserId").mockRestore();
});

describe("StaffProfileService teacher profile masking", () => {
  test("masks nationalId in getTeacherProfileForEdit response", async () => {
    spyOn(PermissionsService, "hasPermission").mockResolvedValue(true);
    spyOn(TeacherRepository, "getTeacherProfileForEdit").mockResolvedValue(baseProfile);

    const profile = await StaffProfileService.getTeacherProfileForEdit("actor-1", "teacher-1");
    expect(profile.nationalId).toBe("******7890");
  });
});

describe("TeacherPortalService own profile", () => {
  test("includes totalClasses from teacher profile", async () => {
    const tErrors = await getServerTranslations("en", "errors");
    spyOn(PermissionsService, "hasPermission").mockImplementation(
      async (_userId, permission) => permission === AppPermission.TEACHER_VIEW_OWN_PROFILE
    );
    spyOn(TeacherRepository, "findByUserId").mockResolvedValue({ id: "teacher-1", userId: "user-1" } as never);
    spyOn(TeacherRepository, "getTeacherProfileForEdit").mockResolvedValue(baseProfile);

    const profile = await TeacherPortalService.getOwnProfile("user-1", tErrors);
    expect(profile.totalClasses).toBe(10);
  });
});
