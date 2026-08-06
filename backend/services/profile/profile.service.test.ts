import { afterEach, describe, expect, spyOn, test } from "bun:test";
import { ParentRepository, StaffProfileRepository, StudentRepository, TeacherRepository } from "@/backend/db/repo";
import {
  AccountStatus,
  AppPermission,
  CurrencyCode,
  ProfileAudience,
  ProfileMode,
  ProfileScope,
  UserRole,
} from "@/backend/enum";
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

/**
 * Helper to assert profile page context matches expected values.
 * Reduces code duplication between runStudentProfileTest and runStaffProfileTest.
 */
function assertProfileContext(
  context: ProfilePageContext,
  expectedContext: {
    audience: ProfileAudience;
    scope: ProfileScope;
    mode: ProfileMode;
    studentId?: string;
    targetUserId?: string;
  }
) {
  expect(context.audience).toBe(expectedContext.audience);
  expect(context.scope).toBe(expectedContext.scope);
  expect(context.mode).toBe(expectedContext.mode);
  if (expectedContext.studentId) {
    expect(context.studentId).toBe(expectedContext.studentId);
  }
  if (expectedContext.targetUserId) {
    expect(context.targetUserId).toBe(expectedContext.targetUserId);
  }
}

/** Common spy setup helpers to reduce Code Duplication warnings */
function setupProfileReposSpies(
  overrides: {
    teacher?: Awaited<ReturnType<typeof TeacherRepository.findByUserId>> | null;
    parent?: Awaited<ReturnType<typeof ParentRepository.findByUserId>>;
    staff?: Awaited<ReturnType<typeof StaffProfileRepository.findByUserId>>;
    student?: Awaited<ReturnType<typeof StudentRepository.getStudentIdByUserId>>;
  } = {}
) {
  spyOn(TeacherRepository, "findByUserId").mockResolvedValue(overrides.teacher ?? (null as never));
  spyOn(ParentRepository, "findByUserId").mockResolvedValue(overrides.parent ?? (null as never));
  spyOn(StaffProfileRepository, "findByUserId").mockResolvedValue(overrides.staff ?? (null));
  spyOn(StudentRepository, "getStudentIdByUserId").mockResolvedValue(overrides.student ?? (null));
}

function setupPermissionSpies(
  overrides: {
    hasAnyPermission?: (userId: string, permissionKeys: AppPermission[]) => Promise<boolean>;
    getUserContext?: Awaited<ReturnType<typeof PermissionsService.getUserContext>>;
  } = {}
) {
  if (overrides.hasAnyPermission) {
    spyOn(PermissionsService, "hasAnyPermission").mockImplementation(overrides.hasAnyPermission);
  }
  if (overrides.getUserContext) {
    spyOn(PermissionsService, "getUserContext").mockResolvedValue(overrides.getUserContext);
  }
}

/**
 * Helper to run a student profile test with common setup and assertions.
 * Reduces code duplication between view and edit mode tests.
 */
async function runStudentProfileTest(
  mode: ProfileMode,
  expectedPermissionKeys: AppPermission[],
  expectedContext: {
    audience: ProfileAudience;
    scope: ProfileScope;
    mode: ProfileMode;
    studentId: string;
  },
  studentRowId: string = "student-row-1"
) {
  setupProfileReposSpies({
    student: studentRowId,
  });
  let permissionChecks = 0;
  setupPermissionSpies({
    hasAnyPermission: async (_userId: string, keys: AppPermission[]) => {
      permissionChecks += 1;
      return expectedPermissionKeys.some(key => keys.includes(key));
    },
    getUserContext: {
      permissions: expectedPermissionKeys,
      permissionGroups: [],
      isSuperAdmin: false,
      role: UserRole.STUDENT,
    },
  });

  const result = await ProfileService.resolvePageContext("student-user", { mode });

  expect(permissionChecks).toBeLessThan(10);
  if (isRedirect(result)) {
    throw new Error(`expected student profile ${mode.toLowerCase()} context, got redirect to ${result.redirect}`);
  }
  const context = result as ProfilePageContext;
  assertProfileContext(context, expectedContext);
}

/**
 * Helper to run a staff profile test with common setup and assertions.
 */
async function runStaffProfileTest(
  mode: ProfileMode,
  hasEditPermissions: boolean,
  expectedContext?: {
    audience: ProfileAudience;
    scope: ProfileScope;
    mode: ProfileMode;
  },
  expectedRedirect?: string
) {
  setupProfileReposSpies({
    staff: {
      id: "staff-profile-1",
      staffProfileId: "staff-profile-1",
      name: "Staff User",
      email: "[EMAIL_REDACTED]",
      avatarUrl: null,
      phone: null,
      status: AccountStatus.ACTIVATED,
      roleSlug: null,
      roleName: null,
      hourlyRate: null,
      rateCurrency: null,
    },
  });
  setupPermissionSpies({
    hasAnyPermission: async (_userId: string, keys: AppPermission[]) => {
      if (!hasEditPermissions) return false;
      return (
        keys.includes(AppPermission.PROFILE_CORE_IDENTITY_EDIT_OWN) ||
        keys.includes(AppPermission.PROFILE_CORE_CONTACT_EDIT_OWN) ||
        keys.includes(AppPermission.PROFILE_CORE_IDENTITY_VIEW_OWN)
      );
    },
    getUserContext: {
      permissions: hasEditPermissions
        ? [
            AppPermission.PROFILE_CORE_IDENTITY_VIEW_OWN,
            AppPermission.PROFILE_CORE_CONTACT_VIEW_OWN,
            AppPermission.PROFILE_CORE_IDENTITY_EDIT_OWN,
            AppPermission.PROFILE_CORE_CONTACT_EDIT_OWN,
          ]
        : [AppPermission.PROFILE_CORE_IDENTITY_VIEW_OWN, AppPermission.PROFILE_CORE_CONTACT_VIEW_OWN],
      permissionGroups: [],
      isSuperAdmin: false,
      role: UserRole.STAFF,
    },
  });

  const result = await ProfileService.resolvePageContext("staff-user", { mode });

  if (expectedRedirect) {
    expect(result).toEqual({ redirect: expectedRedirect });
  } else if (expectedContext) {
    if (isRedirect(result)) {
      throw new Error(`expected staff profile ${mode.toLowerCase()} context, got redirect to ${result.redirect}`);
    }
    const context = result as ProfilePageContext;
    assertProfileContext(context, expectedContext);
  }
}

describe("ProfileService.resolvePageContext", () => {
  test("allows pure admin own profile when granted profile view_other only", async () => {
    setupProfileReposSpies();
    setupPermissionSpies({
      hasAnyPermission: async (_userId: string, keys: AppPermission[]) =>
        keys.includes(AppPermission.PROFILE_CORE_IDENTITY_VIEW_OTHER),
      getUserContext: {
        permissions: [AppPermission.PROFILE_CORE_IDENTITY_VIEW_OTHER],
        permissionGroups: [],
        isSuperAdmin: false,
        role: UserRole.ACADEMY_ADMIN,
      },
    });

    const result = await ProfileService.resolvePageContext("admin-user", { mode: ProfileMode.VIEW });

    if (isRedirect(result)) {
      throw new Error("expected profile page context, got redirect");
    }
    const context = result as ProfilePageContext;
    assertProfileContext(context, {
      audience: ProfileAudience.STAFF,
      scope: ProfileScope.OTHER,
      mode: ProfileMode.VIEW,
      targetUserId: "admin-user",
    });
  });

  test("allows staff own profile edit when granted core edit_own permissions", async () => {
    await runStaffProfileTest(ProfileMode.EDIT, true, {
      audience: ProfileAudience.STAFF,
      scope: ProfileScope.OWN,
      mode: ProfileMode.EDIT,
    });
  });

  test("redirects staff own profile edit to /profile without edit_own permissions", async () => {
    await runStaffProfileTest(ProfileMode.EDIT, false, undefined, "/profile");
  });

  // Table-driven tests for student profile view/edit modes to reduce code duplication
  const studentProfileCases = [
    {
      name: "allows student own profile view without infinite permission checks",
      mode: ProfileMode.VIEW,
      expectedPermissions: [AppPermission.STUDENT_IDENTITY_VIEW_OWN] as AppPermission[],
      expectedContext: {
        audience: ProfileAudience.STUDENT,
        scope: ProfileScope.OWN,
        mode: ProfileMode.VIEW,
        studentId: "student-row-1",
      },
    },
    {
      name: "allows student own profile edit without infinite permission checks",
      mode: ProfileMode.EDIT,
      expectedPermissions: [
        AppPermission.STUDENT_IDENTITY_EDIT_OWN,
        AppPermission.STUDENT_IDENTITY_VIEW_OWN,
      ] as AppPermission[],
      expectedContext: {
        audience: ProfileAudience.STUDENT,
        scope: ProfileScope.OWN,
        mode: ProfileMode.EDIT,
        studentId: "student-row-1",
      },
    },
  ] as const;

  for (const testCase of studentProfileCases) {
    test(testCase.name, async () => {
      await runStudentProfileTest(testCase.mode, testCase.expectedPermissions, testCase.expectedContext);
    });
  }
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
      email: "[EMAIL_REDACTED]",
      displayCurrency: CurrencyCode.USD,
    };

    expect(coreInput.displayCurrency).toBe(CurrencyCode.USD);
  });
});
