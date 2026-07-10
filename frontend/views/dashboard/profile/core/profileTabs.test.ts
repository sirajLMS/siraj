import { describe, expect, test } from "bun:test";
import { AppPermission, ProfileAudience, ProfileScope } from "@/frontend/graphql/generated/gql/graphql-types";
import { getVisibleProfileTabs } from "@/frontend/views/dashboard/profile/core/profileTabs";

function hasPermissions(permissions: readonly AppPermission[]) {
  const set = new Set(permissions);
  return (permission: AppPermission) => set.has(permission);
}

describe("getVisibleProfileTabs", () => {
  test("hides permissions tab for teacher other scope even with legacy edit", () => {
    const tabs = getVisibleProfileTabs({
      audience: ProfileAudience.Teacher,
      scope: ProfileScope.Other,
      hasPermission: hasPermissions([AppPermission.UserEditProfile, AppPermission.AuthViewOwnProfile]),
    });

    expect(tabs.some(tab => tab.id === "permissions")).toBe(false);
  });

  test("shows permissions tab for staff other scope with staff permissions view", () => {
    const tabs = getVisibleProfileTabs({
      audience: ProfileAudience.Staff,
      scope: ProfileScope.Other,
      hasPermission: hasPermissions([AppPermission.ProfileStaffPermissionsViewOther, AppPermission.AuthViewOwnProfile]),
    });

    expect(tabs.some(tab => tab.id === "permissions")).toBe(true);
  });

  test("shows payment methods tab when view permission is granted", () => {
    const tabs = getVisibleProfileTabs({
      audience: ProfileAudience.Parent,
      scope: ProfileScope.Own,
      hasPermission: hasPermissions([AppPermission.ProfilePaymentMethodsViewOwn, AppPermission.AuthViewOwnProfile]),
    });

    expect(tabs.some(tab => tab.id === "paymentMethods")).toBe(true);
  });

  test("shows meeting tab with view permission without manage permission", () => {
    const tabs = getVisibleProfileTabs({
      audience: ProfileAudience.Teacher,
      scope: ProfileScope.Own,
      hasPermission: hasPermissions([AppPermission.ProfileMeetingConfigsViewOwn, AppPermission.AuthViewOwnProfile]),
    });

    expect(tabs.some(tab => tab.id === "meeting")).toBe(true);
  });

  test("hides meeting tab without view or manage permission", () => {
    const tabs = getVisibleProfileTabs({
      audience: ProfileAudience.Teacher,
      scope: ProfileScope.Own,
      hasPermission: hasPermissions([AppPermission.AuthViewOwnProfile]),
    });

    expect(tabs.some(tab => tab.id === "meeting")).toBe(false);
  });
});
