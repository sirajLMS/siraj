import { afterEach, describe, expect, mock, test } from "bun:test";
import { cleanup, screen } from "@testing-library/react";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { ProfileTabNav } from "@/frontend/common/views/dashboard/profile/core/ProfileTabNav";
import { ProfileAudience, ProfileScope } from "@/shared/constants/profile.enum";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

const mockRouterPush = mock(() => {});
const mockRouterReplace = mock(() => {});
const mockRouterBack = mock(() => {});

function mockNavigation(moduleOverrides: Record<string, unknown> = {}) {
  void mock.module("next/navigation", () => ({
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
  moduleOverrides?: Record<string, unknown>;
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
      audience: ProfileAudience.TEACHER,
      scope: ProfileScope.OWN,
      permissions: [AppPermission.ProfileCoreIdentityViewOwn, AppPermission.ProfileMeetingConfigsViewOwn],
    });

    expectTabVisible("Meeting");
  });

  test("shows Meeting tab for teacher in own scope with manage_own permission", () => {
    renderTabNav({
      audience: ProfileAudience.TEACHER,
      scope: ProfileScope.OWN,
      permissions: [AppPermission.ProfileCoreIdentityViewOwn, AppPermission.MeetingConfigsManageOwn],
    });

    expectTabVisible("Meeting");
    expectTabHidden("Students");
    expectTabVisible("Notifications");
  });

  test("hides Meeting tab for teacher in own scope without manage_own permission", () => {
    renderTabNav({
      audience: ProfileAudience.TEACHER,
      scope: ProfileScope.OWN,
      permissions: [AppPermission.ProfileCoreIdentityViewOwn],
    });

    expectTabHidden("Meeting");
  });

  test("hides Students tab for teacher admin without edit permission", () => {
    renderTabNav({
      audience: ProfileAudience.TEACHER,
      scope: ProfileScope.OTHER,
      permissions: [AppPermission.ProfileCoreIdentityViewOwn],
    });

    expectTabHidden("Students");
  });

  test("shows Students tab for teacher admin with manage_other permission", () => {
    renderTabNav({
      audience: ProfileAudience.TEACHER,
      scope: ProfileScope.OTHER,
      permissions: [
        AppPermission.ProfileCoreIdentityViewOwn,
        AppPermission.ProfileStaffPermissionsEditOther,
        AppPermission.MeetingConfigsManageOther,
      ],
    });

    expectTabVisible("Students");
    expectTabVisible("Meeting");
  });

  test("hides Permissions tab for teacher admin with legacy edit only", () => {
    renderTabNav({
      audience: ProfileAudience.TEACHER,
      scope: ProfileScope.OTHER,
      permissions: [AppPermission.ProfileCoreIdentityViewOwn, AppPermission.ProfileStaffPermissionsEditOther],
    });

    expectTabHidden("Permissions");
  });

  test("shows Payment Methods tab when view permission granted", () => {
    renderTabNav({
      audience: ProfileAudience.PARENT,
      scope: ProfileScope.OWN,
      permissions: [AppPermission.ProfileCoreIdentityViewOwn, AppPermission.ProfilePaymentMethodsViewOwn],
    });

    expectTabVisible("Payment Methods");
  });

  test("hides Payment Methods tab without view permission", () => {
    renderTabNav({
      audience: ProfileAudience.PARENT,
      scope: ProfileScope.OWN,
      permissions: [AppPermission.ProfileCoreIdentityViewOwn],
    });

    expectTabHidden("Payment Methods");
  });

  test("shows Permissions tab for staff admin in other scope", () => {
    renderTabNav({
      audience: ProfileAudience.STAFF,
      scope: ProfileScope.OTHER,
      permissions: [AppPermission.ProfileCoreIdentityViewOwn, AppPermission.ProfileStaffPermissionsEditOther],
    });

    expectTabVisible("Permissions");
  });

  test("hides Permissions tab for non-admin staff in other scope", () => {
    renderTabNav({
      audience: ProfileAudience.STAFF,
      scope: ProfileScope.OTHER,
      permissions: [AppPermission.ProfileCoreIdentityViewOwn],
    });

    expectTabHidden("Permissions");
  });

  test("reads tab from query param on mount", () => {
    const onTabChange = mock(() => {});
    renderTabNav({
      audience: ProfileAudience.TEACHER,
      scope: ProfileScope.OWN,
      permissions: [AppPermission.ProfileCoreIdentityViewOwn],
      currentTab: "profile",
      onTabChange,
      moduleOverrides: { useSearchParams: () => new URLSearchParams("tab=notifications") },
    });

    expect(onTabChange).toHaveBeenCalledWith("notifications");
    expect(mockRouterReplace).not.toHaveBeenCalled();
  });

  test("does not rewrite URL when tab param already matches resolved tab", () => {
    renderTabNav({
      audience: ProfileAudience.TEACHER,
      scope: ProfileScope.OWN,
      permissions: [AppPermission.ProfileCoreIdentityViewOwn],
      currentTab: "notifications",
      moduleOverrides: { useSearchParams: () => new URLSearchParams("tab=notifications") },
    });

    expect(mockRouterReplace).not.toHaveBeenCalled();
  });

  test("normalizes missing tab param to first visible tab", () => {
    renderTabNav({
      audience: ProfileAudience.TEACHER,
      scope: ProfileScope.OWN,
      permissions: [AppPermission.ProfileCoreIdentityViewOwn],
      currentTab: "profile",
      moduleOverrides: { useSearchParams: () => new URLSearchParams() },
    });

    expect(mockRouterReplace).toHaveBeenCalledWith("/profile?tab=profile", { scroll: false });
  });

  test("renders chip labels alongside desktop tabs", () => {
    renderTabNav({
      audience: ProfileAudience.TEACHER,
      scope: ProfileScope.OWN,
      permissions: [AppPermission.ProfileCoreIdentityViewOwn],
    });

    expect(screen.getAllByText("Notifications")).toHaveLength(2);
  });

  test("renders tablist for desktop layout", () => {
    renderTabNav({
      audience: ProfileAudience.TEACHER,
      scope: ProfileScope.OWN,
      permissions: [AppPermission.ProfileCoreIdentityViewOwn],
    });

    expect(screen.getByRole("tablist")).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Notifications" })).toBeTruthy();
  });
});
