import { afterEach, describe, expect, mock, test } from "bun:test";
import { cleanup, screen } from "@testing-library/react";
import { AppPermission, ProfileAudience, ProfileScope } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { ProfileTabNav } from "@/frontend/views/dashboard/profile/core/ProfileTabNav";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

const mockRouterPush = mock(() => {});
const mockRouterReplace = mock(() => {});
const mockRouterBack = mock(() => {});

function mockNavigation(moduleOverrides = {}) {
  mock.module("next/navigation", () => ({
    useRouter: () => ({
      push: mockRouterPush,
      replace: mockRouterReplace,
      back: mockRouterBack,
    }),
    usePathname: () => "/profile",
    useSearchParams: () => new URLSearchParams(),
    ...moduleOverrides,
  }));
}

const enLocale = { locale: "en" as const };

type TabNavOptions = {
  audience: ProfileAudience;
  scope: ProfileScope;
  permissions: AppPermission[];
  currentTab?: string;
  onTabChange?: (tab: string) => void;
  moduleOverrides?: Parameters<typeof mockNavigation>[0];
};

function renderTabNav({
  audience,
  scope,
  permissions,
  currentTab = "profile",
  onTabChange = () => {},
  moduleOverrides,
}: TabNavOptions) {
  mockNavigation(moduleOverrides);
  renderWithWrapper(
    <ProfileTabNav audience={audience} scope={scope} currentTab={currentTab} onTabChange={onTabChange} />,
    { ...enLocale, permissions }
  );
}

function expectTabVisible(label: string) {
  expect(screen.getAllByText(label).length).toBeGreaterThan(0);
}

function expectTabHidden(label: string) {
  expect(screen.queryByText(label)).toBeNull();
}

afterEach(() => {
  cleanup();
  useUserStore.setState({ permissions: [] }, false);
  mockNavigation();
  mockRouterReplace.mockClear();
});

describe("ProfileTabNav", () => {
  test("shows Meeting tab for teacher in own scope with view_own permission", () => {
    renderTabNav({
      audience: ProfileAudience.Teacher,
      scope: ProfileScope.Own,
      permissions: [AppPermission.AuthViewOwnProfile, AppPermission.ProfileMeetingConfigsViewOwn],
    });

    expectTabVisible("Meeting");
  });

  test("shows Meeting tab for teacher in own scope with manage_own permission", () => {
    renderTabNav({
      audience: ProfileAudience.Teacher,
      scope: ProfileScope.Own,
      permissions: [AppPermission.AuthViewOwnProfile, AppPermission.MeetingConfigsManageOwn],
    });

    expectTabVisible("Meeting");
    expectTabHidden("Students");
    expectTabVisible("Notifications");
  });

  test("hides Meeting tab for teacher in own scope without manage_own permission", () => {
    renderTabNav({
      audience: ProfileAudience.Teacher,
      scope: ProfileScope.Own,
      permissions: [AppPermission.AuthViewOwnProfile],
    });

    expectTabHidden("Meeting");
  });

  test("hides Students tab for teacher admin without edit permission", () => {
    renderTabNav({
      audience: ProfileAudience.Teacher,
      scope: ProfileScope.Other,
      permissions: [AppPermission.AuthViewOwnProfile],
    });

    expectTabHidden("Students");
  });

  test("shows Students tab for teacher admin with manage_other permission", () => {
    renderTabNav({
      audience: ProfileAudience.Teacher,
      scope: ProfileScope.Other,
      permissions: [
        AppPermission.AuthViewOwnProfile,
        AppPermission.UserEditProfile,
        AppPermission.MeetingConfigsManageOther,
      ],
    });

    expectTabVisible("Students");
    expectTabVisible("Meeting");
  });

  test("hides Permissions tab for teacher admin with legacy edit only", () => {
    renderTabNav({
      audience: ProfileAudience.Teacher,
      scope: ProfileScope.Other,
      permissions: [AppPermission.AuthViewOwnProfile, AppPermission.UserEditProfile],
    });

    expectTabHidden("Permissions");
  });

  test("shows Payment Methods tab when view permission granted", () => {
    renderTabNav({
      audience: ProfileAudience.Parent,
      scope: ProfileScope.Own,
      permissions: [AppPermission.AuthViewOwnProfile, AppPermission.ProfilePaymentMethodsViewOwn],
    });

    expectTabVisible("Payment Methods");
  });

  test("hides Payment Methods tab without view permission", () => {
    renderTabNav({
      audience: ProfileAudience.Parent,
      scope: ProfileScope.Own,
      permissions: [AppPermission.AuthViewOwnProfile],
    });

    expectTabHidden("Payment Methods");
  });

  test("shows Permissions tab for staff admin in other scope", () => {
    renderTabNav({
      audience: ProfileAudience.Staff,
      scope: ProfileScope.Other,
      permissions: [AppPermission.AuthViewOwnProfile, AppPermission.UserEditProfile],
    });

    expectTabVisible("Permissions");
  });

  test("hides Permissions tab for non-admin staff in other scope", () => {
    renderTabNav({
      audience: ProfileAudience.Staff,
      scope: ProfileScope.Other,
      permissions: [AppPermission.AuthViewOwnProfile],
    });

    expectTabHidden("Permissions");
  });

  test("reads tab from query param on mount", () => {
    const onTabChange = mock(() => {});
    renderTabNav({
      audience: ProfileAudience.Teacher,
      scope: ProfileScope.Own,
      permissions: [AppPermission.AuthViewOwnProfile],
      onTabChange,
      moduleOverrides: { useSearchParams: () => new URLSearchParams("tab=notifications") },
    });

    expect(onTabChange).toHaveBeenCalledWith("notifications");
  });

  test("renders chip labels alongside desktop tabs", () => {
    renderTabNav({
      audience: ProfileAudience.Teacher,
      scope: ProfileScope.Own,
      permissions: [AppPermission.AuthViewOwnProfile],
    });

    expect(screen.getAllByText("Notifications")).toHaveLength(2);
  });

  test("renders tablist for desktop layout", () => {
    renderTabNav({
      audience: ProfileAudience.Teacher,
      scope: ProfileScope.Own,
      permissions: [AppPermission.AuthViewOwnProfile],
    });

    expect(screen.getByRole("tablist")).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Notifications" })).toBeTruthy();
  });
});
