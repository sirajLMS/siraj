import { afterEach, describe, expect, mock, test } from "bun:test";
import { cleanup, screen } from "@testing-library/react";
import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import { useUserStore } from "@/frontend/stores/userStore";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";
import { ProfileTabNav } from "./ProfileTabNav";

// Mock next/navigation hooks
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

afterEach(() => {
  cleanup();
  useUserStore.setState({ permissions: [] }, false);
  mockNavigation();
});

describe("ProfileTabNav", () => {
  test("hides Banking tab for teacher in own scope", () => {
    mockNavigation();
    renderWithWrapper(<ProfileTabNav audience="teacher" scope="own" />, {
      permissions: [AppPermission.AuthViewOwnProfile],
    });

    expect(screen.queryByText("profile.shell.tabs.banking")).not.toBeInTheDocument();
    expect(screen.getByText("profile.shell.tabs.notifications")).toBeInTheDocument();
  });

  test("shows Permissions tab for staff admin in other scope", () => {
    mockNavigation();
    renderWithWrapper(<ProfileTabNav audience="staff" scope="other" />, {
      permissions: [AppPermission.AuthViewOwnProfile, AppPermission.UserEditProfile],
    });

    expect(screen.getByText("profile.shell.tabs.permissions")).toBeInTheDocument();
  });

  test("hides Permissions tab for non-admin staff in other scope", () => {
    mockNavigation();
    renderWithWrapper(<ProfileTabNav audience="staff" scope="other" />, {
      permissions: [AppPermission.AuthViewOwnProfile],
    });

    expect(screen.queryByText("profile.shell.tabs.permissions")).not.toBeInTheDocument();
  });

  test("syncs query param with tab selection", () => {
    const testParams = new URLSearchParams("tab=notifications");
    mockNavigation({ useSearchParams: () => testParams });

    renderWithWrapper(<ProfileTabNav audience="teacher" scope="own" />, {
      permissions: [AppPermission.AuthViewOwnProfile],
    });

    expect(mockRouterReplace).toHaveBeenCalledWith("/profile?tab=notifications", { scroll: false });
  });

  test("shows mobile chips and hides desktop tabs on small screens", () => {
    mockNavigation();
    window.innerWidth = 400; // Simulate mobile
    renderWithWrapper(<ProfileTabNav audience="teacher" scope="own" />, {
      permissions: [AppPermission.AuthViewOwnProfile],
    });

    expect(screen.getByText("profile.shell.tabs.notifications")).toBeVisible();
    expect(screen.queryByRole("tablist")).not.toBeInTheDocument();
  });

  test("shows desktop tabs and hides mobile chips on large screens", () => {
    mockNavigation();
    window.innerWidth = 1200; // Simulate desktop
    renderWithWrapper(<ProfileTabNav audience="teacher" scope="own" />, {
      permissions: [AppPermission.AuthViewOwnProfile],
    });

    expect(screen.getByRole("tablist")).toBeVisible();
    expect(screen.queryByText("profile.shell.tabs.notifications")).toBeInTheDocument();
  });
});
