import { afterEach, describe, expect, mock, test } from "bun:test";
import { cleanup, screen } from "@testing-library/react";
import { AppPermission, ProfileAudience, ProfileScope } from "@/frontend/graphql/generated/gql/graphql-types";
import { useUserStore } from "@/frontend/stores/userStore";
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

afterEach(() => {
  cleanup();
  useUserStore.setState({ permissions: [] }, false);
  mockNavigation();
  mockRouterReplace.mockClear();
});

describe("ProfileTabNav", () => {
  test("shows Meeting tab for teacher in own scope with manage_own permission", () => {
    mockNavigation();
    renderWithWrapper(
      <ProfileTabNav
        audience={ProfileAudience.Teacher}
        scope={ProfileScope.Own}
        currentTab="profile"
        onTabChange={() => {}}
      />,
      {
        ...enLocale,
        permissions: [AppPermission.AuthViewOwnProfile, AppPermission.MeetingConfigsManageOwn],
      }
    );

    expect(screen.getAllByText("Meeting").length).toBeGreaterThan(0);
    expect(screen.queryByText("Students")).toBeNull();
    expect(screen.getAllByText("Notifications").length).toBeGreaterThan(0);
  });

  test("hides Meeting tab for teacher in own scope without manage_own permission", () => {
    mockNavigation();
    renderWithWrapper(
      <ProfileTabNav
        audience={ProfileAudience.Teacher}
        scope={ProfileScope.Own}
        currentTab="profile"
        onTabChange={() => {}}
      />,
      {
        ...enLocale,
        permissions: [AppPermission.AuthViewOwnProfile],
      }
    );

    expect(screen.queryByText("Meeting")).toBeNull();
  });

  test("hides Students tab for teacher admin without edit permission", () => {
    mockNavigation();
    renderWithWrapper(
      <ProfileTabNav
        audience={ProfileAudience.Teacher}
        scope={ProfileScope.Other}
        currentTab="profile"
        onTabChange={() => {}}
      />,
      {
        ...enLocale,
        permissions: [AppPermission.AuthViewOwnProfile],
      }
    );

    expect(screen.queryByText("Students")).toBeNull();
  });

  test("shows Students tab for teacher admin with manage_other permission", () => {
    mockNavigation();
    renderWithWrapper(
      <ProfileTabNav
        audience={ProfileAudience.Teacher}
        scope={ProfileScope.Other}
        currentTab="profile"
        onTabChange={() => {}}
      />,
      {
        ...enLocale,
        permissions: [
          AppPermission.AuthViewOwnProfile,
          AppPermission.UserEditProfile,
          AppPermission.MeetingConfigsManageOther,
        ],
      }
    );

    expect(screen.getAllByText("Students").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Meeting").length).toBeGreaterThan(0);
  });

  test("shows Permissions tab for staff admin in other scope", () => {
    mockNavigation();
    renderWithWrapper(
      <ProfileTabNav
        audience={ProfileAudience.Staff}
        scope={ProfileScope.Other}
        currentTab="profile"
        onTabChange={() => {}}
      />,
      {
        ...enLocale,
        permissions: [AppPermission.AuthViewOwnProfile, AppPermission.UserEditProfile],
      }
    );

    expect(screen.getAllByText("Permissions").length).toBeGreaterThan(0);
  });

  test("hides Permissions tab for non-admin staff in other scope", () => {
    mockNavigation();
    renderWithWrapper(
      <ProfileTabNav
        audience={ProfileAudience.Staff}
        scope={ProfileScope.Other}
        currentTab="profile"
        onTabChange={() => {}}
      />,
      {
        ...enLocale,
        permissions: [AppPermission.AuthViewOwnProfile],
      }
    );

    expect(screen.queryByText("Permissions")).toBeNull();
  });

  test("reads tab from query param on mount", () => {
    const testParams = new URLSearchParams("tab=notifications");
    const onTabChange = mock(() => {});
    mockNavigation({ useSearchParams: () => testParams });

    renderWithWrapper(
      <ProfileTabNav
        audience={ProfileAudience.Teacher}
        scope={ProfileScope.Own}
        currentTab="profile"
        onTabChange={onTabChange}
      />,
      {
        ...enLocale,
        permissions: [AppPermission.AuthViewOwnProfile],
      }
    );

    expect(onTabChange).toHaveBeenCalledWith("notifications");
  });

  test("renders chip labels alongside desktop tabs", () => {
    mockNavigation();
    renderWithWrapper(
      <ProfileTabNav
        audience={ProfileAudience.Teacher}
        scope={ProfileScope.Own}
        currentTab="profile"
        onTabChange={() => {}}
      />,
      {
        ...enLocale,
        permissions: [AppPermission.AuthViewOwnProfile],
      }
    );

    expect(screen.getAllByText("Notifications")).toHaveLength(2);
  });

  test("renders tablist for desktop layout", () => {
    mockNavigation();
    renderWithWrapper(
      <ProfileTabNav
        audience={ProfileAudience.Teacher}
        scope={ProfileScope.Own}
        currentTab="profile"
        onTabChange={() => {}}
      />,
      {
        ...enLocale,
        permissions: [AppPermission.AuthViewOwnProfile],
      }
    );

    expect(screen.getByRole("tablist")).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Notifications" })).toBeTruthy();
  });
});
