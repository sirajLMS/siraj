import { describe, expect, test } from "bun:test";
import { AppPermission, ProfileAudience, ProfileScope } from "@/backend/enum";
import {
  getProfileEditPermission,
  getProfileViewPermission,
  PROFILE_FIELD_GROUP_BY_KEY,
  PROFILE_FIELD_GROUPS,
} from "@/backend/services/profile/profile-field-manifest";
import type { ProfileFieldGroupDefinition } from "@/backend/types";

describe("getProfileViewPermission", () => {
  test("returns viewOwn permission when scope is OWN", () => {
    const coreIdentity = PROFILE_FIELD_GROUP_BY_KEY.core_identity;
    const permission = getProfileViewPermission(coreIdentity, ProfileScope.OWN);
    expect(permission).toBe(AppPermission.PROFILE_CORE_IDENTITY_VIEW_OWN);
    expect(permission).toBe(coreIdentity.viewOwn);
  });

  test("returns viewOther permission when scope is OTHER", () => {
    const coreIdentity = PROFILE_FIELD_GROUP_BY_KEY.core_identity;
    const permission = getProfileViewPermission(coreIdentity, ProfileScope.OTHER);
    expect(permission).toBe(AppPermission.PROFILE_CORE_IDENTITY_VIEW_OTHER);
    expect(permission).toBe(coreIdentity.viewOther);
  });

  test("correctly resolves permissions for arbitrary custom group definition", () => {
    const mockGroup: ProfileFieldGroupDefinition = {
      groupKey: "core_identity",
      paths: ["name"],
      audiences: [ProfileAudience.TEACHER],
      scopes: [ProfileScope.OWN, ProfileScope.OTHER],
      viewOwn: AppPermission.PROFILE_CORE_IDENTITY_VIEW_OWN,
      viewOther: AppPermission.PROFILE_CORE_IDENTITY_VIEW_OTHER,
      editOwn: AppPermission.PROFILE_CORE_IDENTITY_EDIT_OWN,
      editOther: AppPermission.PROFILE_CORE_IDENTITY_EDIT_OTHER,
    };

    expect(getProfileViewPermission(mockGroup, ProfileScope.OWN)).toBe(AppPermission.PROFILE_CORE_IDENTITY_VIEW_OWN);
    expect(getProfileViewPermission(mockGroup, ProfileScope.OTHER)).toBe(
      AppPermission.PROFILE_CORE_IDENTITY_VIEW_OTHER
    );
  });
});

describe("getProfileEditPermission", () => {
  test("returns editOwn permission when scope is OWN", () => {
    const coreIdentity = PROFILE_FIELD_GROUP_BY_KEY.core_identity;
    const permission = getProfileEditPermission(coreIdentity, ProfileScope.OWN);
    expect(permission).toBe(AppPermission.PROFILE_CORE_IDENTITY_EDIT_OWN);
    expect(permission).toBe(coreIdentity.editOwn);
  });

  test("returns editOther permission when scope is OTHER", () => {
    const coreIdentity = PROFILE_FIELD_GROUP_BY_KEY.core_identity;
    const permission = getProfileEditPermission(coreIdentity, ProfileScope.OTHER);
    expect(permission).toBe(AppPermission.PROFILE_CORE_IDENTITY_EDIT_OTHER);
    expect(permission).toBe(coreIdentity.editOther);
  });

  test("correctly resolves permissions for arbitrary custom group definition", () => {
    const mockGroup: ProfileFieldGroupDefinition = {
      groupKey: "teacher_professional",
      paths: ["teacherOwnProfile.qualifications"],
      audiences: [ProfileAudience.TEACHER],
      scopes: [ProfileScope.OWN, ProfileScope.OTHER],
      viewOwn: AppPermission.PROFILE_TEACHER_PROFESSIONAL_VIEW_OWN,
      viewOther: AppPermission.PROFILE_TEACHER_PROFESSIONAL_VIEW_OTHER,
      editOwn: AppPermission.PROFILE_TEACHER_PROFESSIONAL_EDIT_OWN,
      editOther: AppPermission.PROFILE_TEACHER_PROFESSIONAL_EDIT_OTHER,
    };

    expect(getProfileEditPermission(mockGroup, ProfileScope.OWN)).toBe(
      AppPermission.PROFILE_TEACHER_PROFESSIONAL_EDIT_OWN
    );
    expect(getProfileEditPermission(mockGroup, ProfileScope.OTHER)).toBe(
      AppPermission.PROFILE_TEACHER_PROFESSIONAL_EDIT_OTHER
    );
  });
});

describe("PROFILE_FIELD_GROUPS integrity", () => {
  test("every profile field group maps correctly in PROFILE_FIELD_GROUP_BY_KEY", () => {
    for (const group of PROFILE_FIELD_GROUPS) {
      expect(PROFILE_FIELD_GROUP_BY_KEY[group.groupKey]).toBe(group);
      expect(getProfileViewPermission(group, ProfileScope.OWN)).toBe(group.viewOwn);
      expect(getProfileViewPermission(group, ProfileScope.OTHER)).toBe(group.viewOther);
      expect(getProfileEditPermission(group, ProfileScope.OWN)).toBe(group.editOwn);
      expect(getProfileEditPermission(group, ProfileScope.OTHER)).toBe(group.editOther);
    }
  });
});
