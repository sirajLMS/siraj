import { describe, expect, test } from "bun:test";
import { AppPermission, ProfileAudience, ProfileScope } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { getVisibleProfileTabs, resolveProfileTab } from "@/frontend/common/views/dashboard/profile/core/profileTabs";

function hasPermissions(permissions: readonly AppPermission[]) {
  const set = new Set(permissions);
  return (permission: AppPermission) => set.has(permission);
}

describe("getVisibleProfileTabs", () => {
  test("hides permissions tab for teacher other scope even with legacy edit", () => {
    const tabs = getVisibleProfileTabs({
      audience: ProfileAudience.Teacher,
      scope: ProfileScope.Other,
      hasPermission: hasPermissions([AppPermission.ProfileStaffPermissionsEditOther, AppPermission.ProfileCoreIdentityViewOwn]),
    });

    expect(tabs.some(tab => tab.id === "permissions")).toBe(false);
  });

  test("shows permissions tab for staff other scope with staff permissions view", () => {
    const tabs = getVisibleProfileTabs({
      audience: ProfileAudience.Staff,
      scope: ProfileScope.Other,
      hasPermission: hasPermissions([AppPermission.ProfileStaffPermissionsViewOther, AppPermission.ProfileCoreIdentityViewOwn]),
    });

    expect(tabs.some(tab => tab.id === "permissions")).toBe(true);
  });

  test("shows payment methods tab when view permission is granted", () => {
    const tabs = getVisibleProfileTabs({
      audience: ProfileAudience.Parent,
      scope: ProfileScope.Own,
      hasPermission: hasPermissions([AppPermission.ProfilePaymentMethodsViewOwn, AppPermission.ProfileCoreIdentityViewOwn]),
    });

    expect(tabs.some(tab => tab.id === "paymentMethods")).toBe(true);
  });

  test("shows meeting tab with view permission without manage permission", () => {
    const tabs = getVisibleProfileTabs({
      audience: ProfileAudience.Teacher,
      scope: ProfileScope.Own,
      hasPermission: hasPermissions([AppPermission.ProfileMeetingConfigsViewOwn, AppPermission.ProfileCoreIdentityViewOwn]),
    });

    expect(tabs.some(tab => tab.id === "meeting")).toBe(true);
  });

  test("shows notifications tab for student own scope", () => {
    const tabs = getVisibleProfileTabs({
      audience: "STUDENT" as ProfileAudience,
      scope: ProfileScope.Own,
      hasPermission: hasPermissions([AppPermission.ProfileCoreIdentityViewOwn]),
    });

    expect(tabs.some(tab => tab.id === "notifications")).toBe(true);
    expect(tabs.some(tab => tab.id === "profile")).toBe(true);
    expect(tabs.some(tab => tab.id === "paymentMethods")).toBe(false);
  });
});

describe("resolveProfileTab", () => {
  const tabs = getVisibleProfileTabs({
    audience: ProfileAudience.Teacher,
    scope: ProfileScope.Own,
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
