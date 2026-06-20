import { afterEach, describe, expect, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { screen } from "@testing-library/react";

expect.extend(matchers);

import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import { useUserStore } from "@/frontend/stores/userStore";
import { renderWithWrapper } from "./TestWrapper";

afterEach(() => {
  useUserStore.setState({ permissions: [] }, false);
});

describe("RequirePermission", () => {
  test("renders children when user has permission", () => {
    renderWithWrapper(
      <RequirePermission permissions={[AppPermission.DashboardSearch]}>Protected Content</RequirePermission>,
      { permissions: [AppPermission.DashboardSearch] }
    );

    expect(screen.getByText("Protected Content")).toBeVisible();
  });

  test("renders nothing when user lacks permission", () => {
    renderWithWrapper(
      <RequirePermission permissions={[AppPermission.DashboardSearch]}>Protected Content</RequirePermission>,
      { permissions: [] }
    );

    expect(screen.queryByText("Protected Content")).toBeNull();
  });

  test("renders children when at least one permission matches (array)", () => {
    renderWithWrapper(
      <RequirePermission permissions={[AppPermission.DashboardSearch, AppPermission.ScheduleViewList]}>
        Protected Content
      </RequirePermission>,
      { permissions: [AppPermission.ScheduleViewList] }
    );

    expect(screen.getByText("Protected Content")).toBeVisible();
  });

  test("renders fallback when provided and permission missing", () => {
    renderWithWrapper(
      <RequirePermission permissions={[AppPermission.DashboardSearch]} fallback={<span>Access Denied</span>}>
        Protected Content
      </RequirePermission>,
      { permissions: [] }
    );

    expect(screen.getByText("Access Denied")).toBeVisible();
  });

  test("renders children (not fallback) when permission exists", () => {
    renderWithWrapper(
      <RequirePermission permissions={[AppPermission.DashboardSearch]} fallback={<span>Access Denied</span>}>
        Protected Content
      </RequirePermission>,
      { permissions: [AppPermission.DashboardSearch] }
    );

    expect(screen.getByText("Protected Content")).toBeVisible();
    expect(screen.queryByText("Access Denied")).toBeNull();
  });
});
