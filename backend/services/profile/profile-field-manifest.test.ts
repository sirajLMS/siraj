import { describe, expect, test } from "bun:test";
import { AppPermission, ProfileScope } from "@/backend/enum";
import {
  getProfileEditPermission,
  getProfileViewPermission,
  PROFILE_FIELD_GROUP_BY_KEY,
  PROFILE_FIELD_GROUPS,
} from "@/backend/services/profile/profile-field-manifest";
import type { ProfileFieldGroupDefinition } from "@/backend/types";

describe("profile-field-manifest", () => {
  describe("getProfileEditPermission", () => {
    test("returns editOwn permission when scope is OWN", () => {
      const mockGroup: ProfileFieldGroupDefinition = {
        groupKey: "core_identity",
        paths: ["name"],
        audiences: [],
        scopes: [ProfileScope.OWN, ProfileScope.OTHER],
        viewOwn: AppPermission.PROFILE_CORE_IDENTITY_VIEW_OWN,
        viewOther: AppPermission.PROFILE_CORE_IDENTITY_VIEW_OTHER,
        editOwn: AppPermission.PROFILE_CORE_IDENTITY_EDIT_OWN,
        editOther: AppPermission.PROFILE_CORE_IDENTITY_EDIT_OTHER,
      };

      const perm = getProfileEditPermission(mockGroup, ProfileScope.OWN);
      expect(perm).toBe(AppPermission.PROFILE_CORE_IDENTITY_EDIT_OWN);
    });

    test("returns editOther permission when scope is OTHER", () => {
      const mockGroup: ProfileFieldGroupDefinition = {
        groupKey: "core_identity",
        paths: ["name"],
        audiences: [],
        scopes: [ProfileScope.OWN, ProfileScope.OTHER],
        viewOwn: AppPermission.PROFILE_CORE_IDENTITY_VIEW_OWN,
        viewOther: AppPermission.PROFILE_CORE_IDENTITY_VIEW_OTHER,
        editOwn: AppPermission.PROFILE_CORE_IDENTITY_EDIT_OWN,
        editOther: AppPermission.PROFILE_CORE_IDENTITY_EDIT_OTHER,
      };

      const perm = getProfileEditPermission(mockGroup, ProfileScope.OTHER);
      expect(perm).toBe(AppPermission.PROFILE_CORE_IDENTITY_EDIT_OTHER);
    });

    test("correctly selects edit permissions across all actual PROFILE_FIELD_GROUPS", () => {
      for (const group of PROFILE_FIELD_GROUPS) {
        expect(getProfileEditPermission(group, ProfileScope.OWN)).toBe(group.editOwn);
        expect(getProfileEditPermission(group, ProfileScope.OTHER)).toBe(group.editOther);
      }
    });
  });

  describe("getProfileViewPermission", () => {
    test("returns viewOwn permission when scope is OWN", () => {
      const mockGroup: ProfileFieldGroupDefinition = {
        groupKey: "core_contact",
        paths: ["phone"],
        audiences: [],
        scopes: [ProfileScope.OWN, ProfileScope.OTHER],
        viewOwn: AppPermission.PROFILE_CORE_CONTACT_VIEW_OWN,
        viewOther: AppPermission.PROFILE_CORE_CONTACT_VIEW_OTHER,
        editOwn: AppPermission.PROFILE_CORE_CONTACT_EDIT_OWN,
        editOther: AppPermission.PROFILE_CORE_CONTACT_EDIT_OTHER,
      };

      const perm = getProfileViewPermission(mockGroup, ProfileScope.OWN);
      expect(perm).toBe(AppPermission.PROFILE_CORE_CONTACT_VIEW_OWN);
    });

    test("returns viewOther permission when scope is OTHER", () => {
      const mockGroup: ProfileFieldGroupDefinition = {
        groupKey: "core_contact",
        paths: ["phone"],
        audiences: [],
        scopes: [ProfileScope.OWN, ProfileScope.OTHER],
        viewOwn: AppPermission.PROFILE_CORE_CONTACT_VIEW_OWN,
        viewOther: AppPermission.PROFILE_CORE_CONTACT_VIEW_OTHER,
        editOwn: AppPermission.PROFILE_CORE_CONTACT_EDIT_OWN,
        editOther: AppPermission.PROFILE_CORE_CONTACT_EDIT_OTHER,
      };

      const perm = getProfileViewPermission(mockGroup, ProfileScope.OTHER);
      expect(perm).toBe(AppPermission.PROFILE_CORE_CONTACT_VIEW_OTHER);
    });

    test("correctly selects view permissions across all actual PROFILE_FIELD_GROUPS", () => {
      for (const group of PROFILE_FIELD_GROUPS) {
        expect(getProfileViewPermission(group, ProfileScope.OWN)).toBe(group.viewOwn);
        expect(getProfileViewPermission(group, ProfileScope.OTHER)).toBe(group.viewOther);
      }
    });
  });

  describe("PROFILE_FIELD_GROUP_BY_KEY", () => {
    test("contains every group in PROFILE_FIELD_GROUPS keyed by groupKey", () => {
      for (const group of PROFILE_FIELD_GROUPS) {
        const keyedGroup = PROFILE_FIELD_GROUP_BY_KEY[group.groupKey];
        expect(keyedGroup).toBeDefined();
        expect(keyedGroup).toBe(group);
      }
    });
  });
});
