import { afterEach, describe, expect, spyOn, test } from "bun:test";
import { TeacherRepository } from "@/backend/db/repo/teachers";
import { UserRepository } from "@/backend/db/repo/users";
import { AccountStatus, AppPermission } from "@/backend/enum";
import { CurrencyCode } from "@/shared/constants/currency.enum";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import { StaffProfileService } from "@/backend/services/staff/staff-profile.service";
import { TeacherPortalService } from "@/backend/services/teacher/teacher-portal.service";
import type { TeacherProfileReturnType, TeacherSelectType } from "@/backend/types/teachers/teacher.types";
import { IanaTimezone } from "@/shared/constants/iana-timezone.enum";
import { getServerTranslations } from "@/shared/locale";

const baseProfile: TeacherProfileReturnType = {
  id: "teacher-1",
  userId: "user-1",
  name: "Ahmed Hassan",
  email: "ahmed@example.com",
  phone: "+966500000000",
  nationalId: "1234567890",
  nationality: "Saudi Arabian",
  countryCode: "SA",
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

// Minimal `TeacherSelectType` fixture used to satisfy the full row shape that
// `TeacherRepository.findByUserId` returns. Individual tests spread this and
// override only the fields relevant to the scenario under test.
const baseTeacher: TeacherSelectType = {
  id: "teacher-1",
  userId: "user-1",
  nationality: null,
  nationalId: null,
  phone: null,
  dateOfBirth: null,
  gender: null,
  address: null,
  qualifications: null,
  countryCode: null,
  hourlyRate: null,
  rateCurrency: null,
  createdAt: new Date("2024-01-01T00:00:00.000Z"),
  updatedAt: new Date("2024-01-01T00:00:00.000Z"),
};

// Utility to normalize a value or promise-returning call into a Promise so tests can
// safely `await` regardless of whether the implementation is synchronous or async.
const toPromise = async <T>(fn: () => T | Promise<T>): Promise<T> => {
  return fn();
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
  const ownProfileSetup = () => {
    const tErrors = getServerTranslations("en").errorsTranslations;
    spyOn(PermissionsService, "hasPermission").mockImplementation(
      async (_userId, permission) => permission === AppPermission.PROFILE_CORE_IDENTITY_VIEW_OWN
    );
    spyOn(TeacherRepository, "findByUserId").mockResolvedValue(baseTeacher);
    spyOn(TeacherRepository, "getTeacherProfileForEdit").mockResolvedValue(baseProfile);
    return tErrors;
  };

  test("includes totalClasses from teacher profile", async () => {
    const tErrors = ownProfileSetup();

    const profile = await TeacherPortalService.getOwnProfile("user-1", tErrors);
    expect(profile.totalClasses).toBe(10);
  });

  test("returns nationalId unmasked for the owner", async () => {
    const tErrors = ownProfileSetup();

    const profile = await TeacherPortalService.getOwnProfile("user-1", tErrors);
    // Owner sees the full value — NOT the masked "******7890" admin view.
    expect(profile.nationalId).toBe("1234567890");
  });
});

describe("TeacherPortalService.updateOwnProfile nationalId validation", () => {
  const tErrors = getServerTranslations("en").errorsTranslations;

  afterEach(() => {
    spyOn(PermissionsService, "hasPermission").mockRestore();
    spyOn(PermissionsService, "hasAnyPermission").mockRestore();
    spyOn(TeacherRepository, "findByUserId").mockRestore();
    spyOn(TeacherRepository, "getTeacherProfileForEdit").mockRestore();
    spyOn(TeacherRepository, "updateTeacherProfile").mockRestore();
    spyOn(UserRepository, "updateTimezone").mockRestore();
  });

  test("accepts a valid Egyptian national ID with EG nationality", async () => {
    // 2960123 → century 2 (1996), month 01, day 23; check digit computed by Luhn.
    const validEgId = "29601234567818";
    spyOn(PermissionsService, "hasAnyPermission").mockResolvedValue(true);
    spyOn(PermissionsService, "hasPermission").mockResolvedValue(true);
    spyOn(TeacherRepository, "findByUserId").mockResolvedValue({
      ...baseTeacher,
      nationality: "EG",
    });
    spyOn(TeacherRepository, "updateTeacherProfile").mockResolvedValue(true);
    spyOn(TeacherRepository, "getTeacherProfileForEdit").mockResolvedValue(baseProfile);

    await toPromise(() =>
      TeacherPortalService.updateOwnProfile("user-1", "teacher-1", { nationalId: validEgId }, tErrors)
    );
    expect(TeacherRepository.updateTeacherProfile).toHaveBeenCalledWith(
      "teacher-1",
      expect.objectContaining({ nationalId: validEgId })
    );
  });

  test("rejects an invalid national ID format", async () => {
    spyOn(PermissionsService, "hasAnyPermission").mockResolvedValue(true);
    spyOn(TeacherRepository, "findByUserId").mockResolvedValue({
      ...baseTeacher,
      nationality: "EG",
    });
    spyOn(TeacherRepository, "updateTeacherProfile").mockResolvedValue(true);

    let caughtErr: Error | undefined;
    try {
      await toPromise(() =>
        TeacherPortalService.updateOwnProfile("user-1", "teacher-1", { nationalId: "not-a-valid-id" }, tErrors)
      );
      throw new Error("Expected updateOwnProfile to throw");
    } catch (err) {
      caughtErr = err instanceof Error ? err : new Error(String(err));
    }
    expect(caughtErr?.message).toContain(tErrors.invalidNationalId);
    expect(TeacherRepository.updateTeacherProfile).not.toHaveBeenCalled();
  });

  test("falls back to the teacher's existing nationality when input omits it", async () => {
    const validEgId = "29601234567818";
    spyOn(PermissionsService, "hasAnyPermission").mockResolvedValue(true);
    spyOn(PermissionsService, "hasPermission").mockResolvedValue(true);
    // Existing teacher nationality is EG; input does not pass nationality.
    spyOn(TeacherRepository, "findByUserId").mockResolvedValue({
      ...baseTeacher,
      nationality: "EG",
    });
    spyOn(TeacherRepository, "updateTeacherProfile").mockResolvedValue(true);
    spyOn(TeacherRepository, "getTeacherProfileForEdit").mockResolvedValue(baseProfile);

    const result = await toPromise(() =>
      TeacherPortalService.updateOwnProfile("user-1", "teacher-1", { nationalId: validEgId }, tErrors)
    );
    expect(result).toBeDefined();
  });
});
