import { describe, expect, test } from "bun:test";
import { AppPermission, ProfileAudience, ProfileScope } from "@/backend/enum";
import {
  canEditProfileFieldGroup,
  canEditStudentFieldGroup,
  filterProfileByFieldGroups,
} from "@/backend/services/profile/profile-field-filter";

type OwnViewCase = {
  audience: ProfileAudience;
  permission: AppPermission;
  userId: string;
};

const ownViewCases: OwnViewCase[] = [
  {
    audience: ProfileAudience.TEACHER,
    permission: AppPermission.PROFILE_CORE_IDENTITY_VIEW_OWN,
    userId: "teacher-1",
  },
  {
    audience: ProfileAudience.PARENT,
    permission: AppPermission.PROFILE_CORE_IDENTITY_VIEW_OWN,
    userId: "parent-1",
  },
];

const buildOwnFilterCtx = (c: OwnViewCase, perms: Set<AppPermission>) => ({
  actorUserId: c.userId,
  targetUserId: c.userId,
  scope: ProfileScope.OWN,
  audience: c.audience,
  permissions: perms,
});

const buildEditCtx = (targetUserId: string, audience: ProfileAudience, permission: AppPermission) => ({
  actorUserId: "admin-1",
  targetUserId,
  scope: ProfileScope.OTHER,
  audience,
  permissions: new Set<AppPermission>([permission]),
});

describe("filterProfileByFieldGroups", () => {
  test("nulls core identity fields when view_own denied", () => {
    const payload = {
      name: "Ada",
      email: "ada@example.com",
      avatarUrl: "https://example.com/a.png",
      displayCurrency: "USD",
      teacherOwnProfile: null,
      teacherAdminProfile: null,
      parentOwnProfile: null,
      parentAdminProfile: null,
    };

    const filtered = filterProfileByFieldGroups(payload, {
      actorUserId: "actor-1",
      targetUserId: "actor-1",
      scope: ProfileScope.OWN,
      audience: ProfileAudience.TEACHER,
      permissions: new Set<AppPermission>(),
    });

    expect(filtered.name).toBeNull();
    expect(filtered.email).toBeNull();
    expect(filtered.avatarUrl).toBeNull();
    expect(filtered.displayCurrency).toBeNull();
  });

  test("keeps fields when matching view permission is granted", () => {
    const payload = {
      name: "Ada",
      email: "ada@example.com",
      avatarUrl: null,
      displayCurrency: "USD",
    };

    const filtered = filterProfileByFieldGroups(payload, {
      actorUserId: "actor-1",
      targetUserId: "actor-1",
      scope: ProfileScope.OWN,
      audience: ProfileAudience.PARENT,
      permissions: new Set<AppPermission>([AppPermission.PROFILE_CORE_IDENTITY_VIEW_OWN]),
    });

    expect(filtered.name).toBe("Ada");
    expect(filtered.email).toBe("ada@example.com");
  });

  test.each(
    ownViewCases
  )("allows viewing own core_contact (phone) with $audience fine-grained view_own permission", c => {
    const payload = {
      teacherOwnProfile: { phone: "+1234567890" },
      parentOwnProfile: { phone: "+1987654321" },
    };

    const filtered = filterProfileByFieldGroups(
      payload,
      buildOwnFilterCtx(c, new Set<AppPermission>([AppPermission.PROFILE_CORE_CONTACT_VIEW_OWN]))
    );

    const profileGroup =
      c.audience === ProfileAudience.TEACHER ? filtered.teacherOwnProfile : filtered.parentOwnProfile;
    const expectedPhone = c.audience === ProfileAudience.TEACHER ? "+1234567890" : "+1987654321";
    expect(profileGroup?.phone).toBe(expectedPhone);
  });

  test.each(ownViewCases)("allows viewing own core_identity with $audience fine-grained view_own permission", c => {
    const payload = {
      name: "Test User",
      email: "test@example.com",
      avatarUrl: "https://example.com/avatar.png",
      displayCurrency: "USD",
    };

    const filtered = filterProfileByFieldGroups(payload, buildOwnFilterCtx(c, new Set<AppPermission>([c.permission])));

    expect(filtered.name).toBe("Test User");
    expect(filtered.email).toBe("test@example.com");
  });

  test("nulls assignedStudents when teacher_students view_other denied", () => {
    const payload = {
      assignedStudents: { rows: [{ id: "s1" }], totalCount: 1 },
    };

    const filtered = filterProfileByFieldGroups(payload, {
      actorUserId: "admin-1",
      targetUserId: "teacher-1",
      scope: ProfileScope.OTHER,
      audience: ProfileAudience.TEACHER,
      permissions: new Set<AppPermission>(),
    });

    expect(filtered.assignedStudents).toBeNull();
  });

  test("fine-grained edit_other grants edit for matching groups only", () => {
    const ctx = buildEditCtx(
      "teacher-1",
      ProfileAudience.TEACHER,
      AppPermission.PROFILE_TEACHER_PROFESSIONAL_EDIT_OTHER
    );

    expect(canEditProfileFieldGroup(ctx, "teacher_professional")).toBe(true);
    expect(canEditProfileFieldGroup(ctx, "staff_permissions")).toBe(false);
  });

  test("fine-grained staff edit_other grants staff groups only", () => {
    const ctx = buildEditCtx("staff-1", ProfileAudience.STAFF, AppPermission.PROFILE_STAFF_ROLE_EDIT_OTHER);

    expect(canEditProfileFieldGroup(ctx, "staff_role")).toBe(true);
    expect(canEditProfileFieldGroup(ctx, "staff_permissions")).toBe(false);
    expect(canEditProfileFieldGroup(ctx, "core_identity")).toBe(false);
    expect(canEditProfileFieldGroup(ctx, "teacher_professional")).toBe(false);
  });

  test("legacy profile permissions do not grant field access", () => {
    const legacyViewCtx = {
      actorUserId: "teacher-1",
      targetUserId: "teacher-1",
      scope: ProfileScope.OWN,
      audience: ProfileAudience.TEACHER,
      permissions: new Set<AppPermission>(["teacher.view_own_profile" as AppPermission]),
    };

    const payload = { name: "Hidden", email: "hidden@example.com" };
    const filtered = filterProfileByFieldGroups(payload, legacyViewCtx);
    expect(filtered.name).toBeNull();
    expect(filtered.email).toBeNull();
  });

  test("fine-grained student edit_other grants matching groups only", () => {
    const baseStudentCtx = {
      actorUserId: "admin-1",
      studentId: "student-1",
      studentUserId: "student-user-1",
    };

    const academicCtx = {
      ...baseStudentCtx,
      permissions: new Set<AppPermission>([AppPermission.STUDENT_ACADEMIC_EDIT_OTHER]),
    };
    const quotaCtx = {
      ...baseStudentCtx,
      permissions: new Set<AppPermission>([AppPermission.STUDENT_QUOTA_EDIT_EDIT_OTHER]),
    };

    expect(canEditStudentFieldGroup(academicCtx, "student_academic")).toBe(true);
    expect(canEditStudentFieldGroup(academicCtx, "student_quota_edit")).toBe(false);
    expect(canEditStudentFieldGroup(quotaCtx, "student_quota_edit")).toBe(true);
  });

  test("parent actor uses edit_other when studentUserId differs from actorUserId", () => {
    const parentCtx = {
      actorUserId: "parent-user-1",
      studentId: "student-1",
      studentUserId: "student-user-1",
      permissions: new Set<AppPermission>([AppPermission.STUDENT_IDENTITY_EDIT_OTHER]),
    };

    expect(canEditStudentFieldGroup(parentCtx, "student_identity")).toBe(true);

    const parentWithOnlyOwn = {
      ...parentCtx,
      permissions: new Set<AppPermission>([AppPermission.STUDENT_IDENTITY_EDIT_OWN]),
    };
    expect(canEditStudentFieldGroup(parentWithOnlyOwn, "student_identity")).toBe(false);

    const studentCtx = {
      actorUserId: "student-user-1",
      studentId: "student-1",
      studentUserId: "student-user-1",
      permissions: new Set<AppPermission>([AppPermission.STUDENT_IDENTITY_EDIT_OWN]),
    };
    expect(canEditStudentFieldGroup(studentCtx, "student_identity")).toBe(true);
  });
});
