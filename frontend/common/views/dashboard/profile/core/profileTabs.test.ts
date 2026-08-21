import { describe, expect, test } from "bun:test";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql";
import { getVisibleProfileTabs, resolveProfileTab } from "@/frontend/common/views/dashboard/profile/core/profileTabs";
import { ProfileAudience, ProfileScope } from "@/shared/constants/profile.enum";

function hasPermissions(permissions: readonly AppPermission[]) {
  const set = new Set(permissions);
  return (permission: AppPermission) => set.has(permission);
}

function createTabs(audience: ProfileAudience, scope: ProfileScope, permissions: readonly AppPermission[]) {
  return getVisibleProfileTabs({
    audience,
    scope,
    hasPermission: hasPermissions(permissions),
  });
}

function expectTab(tabs: ReturnType<typeof getVisibleProfileTabs>, tabId: string, expected: boolean) {
  expect(tabs.some(tab => tab.id === tabId)).toBe(expected);
}

describe("getVisibleProfileTabs", () => {
  test("hides permissions tab for teacher other scope even with legacy edit", () => {
    const tabs = createTabs(ProfileAudience.TEACHER, ProfileScope.OTHER, [
      AppPermission.ProfileStaffPermissionsEditOther,
      AppPermission.ProfileCoreIdentityViewOwn,
    ]);

    expectTab(tabs, "permissions", false);
  });

  test("shows permissions tab for staff other scope with staff permissions view", () => {
    const tabs = createTabs(ProfileAudience.STAFF, ProfileScope.OTHER, [
      AppPermission.ProfileStaffPermissionsViewOther,
      AppPermission.ProfileCoreIdentityViewOwn,
    ]);

    expectTab(tabs, "permissions", true);
  });

  test("shows payment methods tab when view permission is granted", () => {
    const tabs = createTabs(ProfileAudience.PARENT, ProfileScope.OWN, [
      AppPermission.ProfilePaymentMethodsViewOwn,
      AppPermission.ProfileCoreIdentityViewOwn,
    ]);

    expectTab(tabs, "paymentMethods", true);
  });

  test("shows meeting tab with view permission without manage permission", () => {
    const tabs = createTabs(ProfileAudience.TEACHER, ProfileScope.OWN, [
      AppPermission.ProfileMeetingConfigsViewOwn,
      AppPermission.ProfileCoreIdentityViewOwn,
    ]);

    expectTab(tabs, "meeting", true);
  });

  test("shows notifications tab for student own scope", () => {
    const tabs = createTabs(ProfileAudience.STUDENT, ProfileScope.OWN, [AppPermission.ProfileCoreIdentityViewOwn]);

    expectTab(tabs, "notifications", true);
    expectTab(tabs, "profile", true);
    expectTab(tabs, "paymentMethods", false);
  });
});

describe("resolveProfileTab", () => {
  const tabs = getVisibleProfileTabs({
    audience: ProfileAudience.TEACHER,
    scope: ProfileScope.OWN,
    hasPermission: hasPermissions([AppPermission.ProfileCoreIdentityViewOwn]),
  });

  test("keeps a valid tab param", () => {
    expect(resolveProfileTab("notifications", tabs)).toBe("notifications");
  });

  test("falls back to the first visible tab when param is missing", () => {
    expect(resolveProfileTab(null, tabs)).toBe("profile");
  });

  test("falls back when param is not visible", () => {
    expect(resolveProfileTab("permissions", tabs)).toBe("profile");
  });
});
