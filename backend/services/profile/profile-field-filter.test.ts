import { describe, expect, test } from "bun:test";
import { AppPermission, ProfileAudience, ProfileScope } from "@/backend/enum";
import {
  canEditProfileFieldGroup,
  canEditStudentFieldGroup,
  filterProfileByFieldGroups,
} from "@/backend/services/profile/profile-field-filter";

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

  test("legacy USER_EDIT_PROFILE grants edit for applicable other-scope groups", () => {
    const ctx = {
      actorUserId: "admin-1",
      targetUserId: "teacher-1",
      scope: ProfileScope.OTHER,
      audience: ProfileAudience.TEACHER,
      permissions: new Set<AppPermission>([AppPermission.USER_EDIT_PROFILE]),
    };

    expect(canEditProfileFieldGroup(ctx, "core_identity")).toBe(true);
    expect(canEditProfileFieldGroup(ctx, "teacher_professional")).toBe(true);
    expect(canEditProfileFieldGroup(ctx, "staff_permissions")).toBe(false);
  });

  test("legacy STAFF_EDIT_PROFILE grants staff edit groups only", () => {
    const ctx = {
      actorUserId: "admin-1",
      targetUserId: "staff-1",
      scope: ProfileScope.OTHER,
      audience: ProfileAudience.STAFF,
      permissions: new Set<AppPermission>([AppPermission.STAFF_EDIT_PROFILE]),
    };

    expect(canEditProfileFieldGroup(ctx, "staff_role")).toBe(true);
    expect(canEditProfileFieldGroup(ctx, "staff_permissions")).toBe(true);
    expect(canEditProfileFieldGroup(ctx, "core_identity")).toBe(true);
    expect(canEditProfileFieldGroup(ctx, "teacher_professional")).toBe(false);
  });

  test("legacy student permissions grant edit for matching groups", () => {
    const academicCtx = {
      actorUserId: "admin-1",
      studentId: "student-1",
      isAssociatedViewer: false,
      permissions: new Set<AppPermission>([AppPermission.STUDENT_MANAGE_STATUS]),
    };
    const quotaCtx = {
      actorUserId: "admin-1",
      studentId: "student-1",
      isAssociatedViewer: false,
      permissions: new Set<AppPermission>([AppPermission.STUDENT_EDIT_QUOTA]),
    };

    expect(canEditStudentFieldGroup(academicCtx, "student_academic")).toBe(true);
    expect(canEditStudentFieldGroup(academicCtx, "student_quota_edit")).toBe(false);
    expect(canEditStudentFieldGroup(quotaCtx, "student_quota_edit")).toBe(true);
  });
});
