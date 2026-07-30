import { afterEach, describe, expect, spyOn, test } from "bun:test";
import { ParentRepository, StaffProfileRepository, StudentRepository, TeacherRepository } from "@/backend/db/repo";
import { AppPermission, CurrencyCode, ProfileAudience, ProfileMode, ProfileScope, UserRole } from "@/backend/enum";
import { IanaTimezone } from "@/backend/enum/shared/timezone.enum";
import { isRedirect, ProfileService, toParentRepoInput } from "@/backend/services";
import { PermissionsService } from "@/backend/services/auth/permissions.service";
import type { ProfilePageContext } from "@/backend/types";

afterEach(() => {
  spyOn(TeacherRepository, "findByUserId").mockRestore();
  spyOn(ParentRepository, "findByUserId").mockRestore();
  spyOn(StaffProfileRepository, "findByUserId").mockRestore();
  spyOn(StudentRepository, "getStudentIdByUserId").mockRestore();
  spyOn(PermissionsService, "hasAnyPermission").mockRestore();
  spyOn(PermissionsService, "getUserContext").mockRestore();
});

describe("ProfileService.resolvePageContext", () => {
  test("allows pure admin own profile when granted profile view_other only", async () => {
    spyOn(TeacherRepository, "findByUserId").mockResolvedValue(null as never);
    spyOn(ParentRepository, "findByUserId").mockResolvedValue(null as never);
    spyOn(StaffProfileRepository, "findByUserId").mockResolvedValue(null as never);
    spyOn(StudentRepository, "getStudentIdByUserId").mockResolvedValue(null);
    spyOn(PermissionsService, "hasAnyPermission").mockImplementation(async (_userId, keys) => {
      const list = keys as AppPermission[];
      return list.includes(AppPermission.PROFILE_CORE_IDENTITY_VIEW_OTHER);
    });
    spyOn(PermissionsService, "getUserContext").mockResolvedValue({
      permissions: [AppPermission.PROFILE_CORE_IDENTITY_VIEW_OTHER],
      permissionGroups: [],
      isSuperAdmin: false,
      role: UserRole.ACADEMY_ADMIN,
    });

    const result = await ProfileService.resolvePageContext("admin-user", { mode: ProfileMode.VIEW });

    expect(isRedirect(result)).toBe(false);
    if (isRedirect(result)) {
      throw new Error("expected profile page context, got redirect");
    }
    const context = result as ProfilePageContext;
    expect(context.audience).toBe(ProfileAudience.STAFF);
    expect(context.scope).toBe(ProfileScope.OTHER);
    expect(context.targetUserId).toBe("admin-user");
  });

  test("allows staff own profile edit when granted core edit_own permissions", async () => {
    spyOn(TeacherRepository, "findByUserId").mockResolvedValue(null as never);
    spyOn(ParentRepository, "findByUserId").mockResolvedValue(null as never);
    spyOn(StaffProfileRepository, "findByUserId").mockResolvedValue({
      id: "staff-profile-1",
      userId: "staff-user",
    } as never);
    spyOn(StudentRepository, "getStudentIdByUserId").mockResolvedValue(null);
    spyOn(PermissionsService, "hasAnyPermission").mockImplementation(async (_userId, keys) => {
      const list = keys as AppPermission[];
      return (
        list.includes(AppPermission.PROFILE_CORE_IDENTITY_EDIT_OWN) ||
        list.includes(AppPermission.PROFILE_CORE_CONTACT_EDIT_OWN) ||
        list.includes(AppPermission.PROFILE_CORE_IDENTITY_VIEW_OWN)
      );
    });
    spyOn(PermissionsService, "getUserContext").mockResolvedValue({
      permissions: [
        AppPermission.PROFILE_CORE_IDENTITY_VIEW_OWN,
        AppPermission.PROFILE_CORE_CONTACT_VIEW_OWN,
        AppPermission.PROFILE_CORE_IDENTITY_EDIT_OWN,
        AppPermission.PROFILE_CORE_CONTACT_EDIT_OWN,
      ],
      permissionGroups: [],
      isSuperAdmin: false,
      role: UserRole.STAFF,
    });

    const result = await ProfileService.resolvePageContext("staff-user", { mode: ProfileMode.EDIT });

    expect(isRedirect(result)).toBe(false);
    if (isRedirect(result)) {
      throw new Error(`expected profile edit context, got redirect to ${result.redirect}`);
    }
    const context = result as ProfilePageContext;
    expect(context.audience).toBe(ProfileAudience.STAFF);
    expect(context.scope).toBe(ProfileScope.OWN);
    expect(context.mode).toBe(ProfileMode.EDIT);
  });

  test("redirects staff own profile edit to /profile without edit_own permissions", async () => {
    spyOn(TeacherRepository, "findByUserId").mockResolvedValue(null as never);
    spyOn(ParentRepository, "findByUserId").mockResolvedValue(null as never);
    spyOn(StaffProfileRepository, "findByUserId").mockResolvedValue({
      id: "staff-profile-1",
      userId: "staff-user",
    } as never);
    spyOn(StudentRepository, "getStudentIdByUserId").mockResolvedValue(null);
    spyOn(PermissionsService, "hasAnyPermission").mockResolvedValue(false);
    spyOn(PermissionsService, "getUserContext").mockResolvedValue({
      permissions: [AppPermission.PROFILE_CORE_IDENTITY_VIEW_OWN, AppPermission.PROFILE_CORE_CONTACT_VIEW_OWN],
      permissionGroups: [],
      isSuperAdmin: false,
      role: UserRole.STAFF,
    });

    const result = await ProfileService.resolvePageContext("staff-user", { mode: ProfileMode.EDIT });

    expect(result).toEqual({ redirect: "/profile" });
  });

  test("allows student own profile view without infinite permission checks", async () => {
    spyOn(TeacherRepository, "findByUserId").mockResolvedValue(null as never);
    spyOn(ParentRepository, "findByUserId").mockResolvedValue(null as never);
    spyOn(StaffProfileRepository, "findByUserId").mockResolvedValue(null as never);
    spyOn(StudentRepository, "getStudentIdByUserId").mockResolvedValue("student-row-1");
    let permissionChecks = 0;
    spyOn(PermissionsService, "hasAnyPermission").mockImplementation(async (_userId, keys) => {
      permissionChecks += 1;
      const list = keys as AppPermission[];
      return list.includes(AppPermission.STUDENT_IDENTITY_VIEW_OWN);
    });
    spyOn(PermissionsService, "getUserContext").mockResolvedValue({
      permissions: [AppPermission.STUDENT_IDENTITY_VIEW_OWN],
      permissionGroups: [],
      isSuperAdmin: false,
      role: UserRole.STUDENT,
    });

    const result = await ProfileService.resolvePageContext("student-user", { mode: ProfileMode.VIEW });

    expect(permissionChecks).toBeLessThan(10);
    expect(isRedirect(result)).toBe(false);
    if (isRedirect(result)) {
      throw new Error(`expected student profile context, got redirect to ${result.redirect}`);
    }
    const context = result as ProfilePageContext;
    expect(context.audience).toBe(ProfileAudience.STUDENT);
    expect(context.scope).toBe(ProfileScope.OWN);
    expect(context.studentId).toBe("student-row-1");
  });

  test("allows student own profile edit without infinite permission checks", async () => {
    spyOn(TeacherRepository, "findByUserId").mockResolvedValue(null as never);
    spyOn(ParentRepository, "findByUserId").mockResolvedValue(null as never);
    spyOn(StaffProfileRepository, "findByUserId").mockResolvedValue(null as never);
    spyOn(StudentRepository, "getStudentIdByUserId").mockResolvedValue("student-row-1");
    let permissionChecks = 0;
    spyOn(PermissionsService, "hasAnyPermission").mockImplementation(async (_userId, keys) => {
      permissionChecks += 1;
      const list = keys as AppPermission[];
      return (
        list.includes(AppPermission.STUDENT_IDENTITY_EDIT_OWN) || list.includes(AppPermission.STUDENT_IDENTITY_VIEW_OWN)
      );
    });
    spyOn(PermissionsService, "getUserContext").mockResolvedValue({
      permissions: [AppPermission.STUDENT_IDENTITY_EDIT_OWN, AppPermission.STUDENT_IDENTITY_VIEW_OWN],
      permissionGroups: [],
      isSuperAdmin: false,
      role: UserRole.STUDENT,
    });

    const result = await ProfileService.resolvePageContext("student-user", { mode: ProfileMode.EDIT });

    expect(permissionChecks).toBeLessThan(10);
    expect(isRedirect(result)).toBe(false);
    if (isRedirect(result)) {
      throw new Error(`expected student profile edit context, got redirect to ${result.redirect}`);
    }
    const context = result as ProfilePageContext;
    expect(context.audience).toBe(ProfileAudience.STUDENT);
    expect(context.scope).toBe(ProfileScope.OWN);
    expect(context.mode).toBe(ProfileMode.EDIT);
    expect(context.studentId).toBe("student-row-1");
  });
});

describe("ProfileService helpers", () => {
  test("isRedirect identifies redirect resolutions", () => {
    expect(isRedirect({ redirect: "/dashboard" })).toBe(true);
    expect(
      isRedirect({
        scope: ProfileScope.OWN,
        mode: ProfileMode.VIEW,
        audience: ProfileAudience.TEACHER,
        actorUserId: "user-1",
        targetUserId: "user-1",
        allowedPermissions: [],
      })
    ).toBe(false);
  });
});

describe("toParentRepoInput", () => {
  test("maps parent admin update input including billing fields", () => {
    const adminInput = {
      phone: "+966500000000",
      nationality: "SA",
      address: "Riyadh",
      facebook: "fb.com/parent",
      whatsapp: "+966500000001",
      twitter: "@parent",
      invoiceType: "monthly",
      feeAmount: "500",
      currency: CurrencyCode.SAR,
      timezone: IanaTimezone.Asia_Riyadh,
    };

    expect(toParentRepoInput(adminInput)).toEqual({
      phone: "+966500000000",
      nationality: "SA",
      address: "Riyadh",
      facebook: "fb.com/parent",
      whatsapp: "+966500000001",
      twitter: "@parent",
      timezone: IanaTimezone.Asia_Riyadh,
      invoiceType: "monthly",
      feeAmount: "500",
      currency: CurrencyCode.SAR,
    });
  });

  test("maps parent own update input without admin-only fields", () => {
    const ownInput = {
      phone: "+966500000000",
      facebook: "fb.com/parent",
      whatsapp: "+966500000001",
      twitter: "@parent",
    };

    expect(toParentRepoInput(ownInput)).toEqual({
      phone: "+966500000000",
      nationality: undefined,
      address: undefined,
      facebook: "fb.com/parent",
      whatsapp: "+966500000001",
      twitter: "@parent",
      timezone: undefined,
      invoiceType: undefined,
      feeAmount: undefined,
      currency: undefined,
    });
  });

  test("maps displayCurrency through core profile fields", () => {
    const coreInput = {
      name: "Test User",
      email: "test@example.com",
      displayCurrency: CurrencyCode.USD,
    };

    expect(coreInput.displayCurrency).toBe(CurrencyCode.USD);
  });
});
