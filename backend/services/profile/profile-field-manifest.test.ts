import { describe, expect, test } from "bun:test";
import { AppPermission, ProfileAudience, ProfileScope } from "@/backend/enum";
import {
  getProfileEditPermission,
  getProfileViewPermission,
  PROFILE_FIELD_GROUP_BY_KEY,
  PROFILE_FIELD_GROUPS,
} from "@/backend/services/profile/profile-field-manifest";
import type { ProfileFieldGroupDefinition } from "@/backend/types";

interface PermissionResolverCase {
  readonly kind: "view" | "edit";
  readonly resolver: typeof getProfileViewPermission;
  readonly ownField: "viewOwn" | "editOwn";
  readonly otherField: "viewOther" | "editOther";
  readonly ownPermission: AppPermission;
  readonly otherPermission: AppPermission;
}

const PERMISSION_RESOLVER_CASES: readonly PermissionResolverCase[] = [
  {
    resolver: getProfileViewPermission,
    kind: "view",
    ownField: "viewOwn",
    otherField: "viewOther",
    ownPermission: AppPermission.PROFILE_CORE_IDENTITY_VIEW_OWN,
    otherPermission: AppPermission.PROFILE_CORE_IDENTITY_VIEW_OTHER,
  },
  {
    resolver: getProfileEditPermission,
    kind: "edit",
    ownField: "editOwn",
    otherField: "editOther",
    ownPermission: AppPermission.PROFILE_CORE_IDENTITY_EDIT_OWN,
    otherPermission: AppPermission.PROFILE_CORE_IDENTITY_EDIT_OTHER,
  },
];

for (const { kind, resolver, ownField, otherField, ownPermission, otherPermission } of PERMISSION_RESOLVER_CASES) {
  describe(`profile permission resolver (${kind})`, () => {
    test(`returns ${ownField} permission when scope is OWN`, () => {
      const coreIdentity = PROFILE_FIELD_GROUP_BY_KEY.core_identity;
      const permission = resolver(coreIdentity, ProfileScope.OWN);
      expect(permission).toBe(ownPermission);
      expect(permission).toBe(coreIdentity[ownField]);
    });

    test(`returns ${otherField} permission when scope is OTHER`, () => {
      const coreIdentity = PROFILE_FIELD_GROUP_BY_KEY.core_identity;
      const permission = resolver(coreIdentity, ProfileScope.OTHER);
      expect(permission).toBe(otherPermission);
      expect(permission).toBe(coreIdentity[otherField]);
    });

    test("resolves permissions for an arbitrary custom group definition", () => {
      const customGroup: ProfileFieldGroupDefinition = {
        groupKey: "core_identity",
        paths: ["name"],
        audiences: [ProfileAudience.TEACHER],
        scopes: [ProfileScope.OWN, ProfileScope.OTHER],
        viewOwn: AppPermission.PROFILE_CORE_IDENTITY_VIEW_OWN,
        viewOther: AppPermission.PROFILE_CORE_IDENTITY_VIEW_OTHER,
        editOwn: AppPermission.PROFILE_CORE_IDENTITY_EDIT_OWN,
        editOther: AppPermission.PROFILE_CORE_IDENTITY_EDIT_OTHER,
      };

      expect(resolver(customGroup, ProfileScope.OWN)).toBe(ownPermission);
      expect(resolver(customGroup, ProfileScope.OTHER)).toBe(otherPermission);
    });
  });
}

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
