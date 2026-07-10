import { describe, expect, test } from "bun:test";
import { AppPermission, ProfileAudience, ProfileScope } from "@/backend/enum";
import { filterProfileByFieldGroups } from "@/backend/services/profile/profile-field-filter";

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
});
