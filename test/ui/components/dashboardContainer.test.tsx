import { mock } from "bun:test";

mock.module("@/frontend/common/views/dashboard/admin/home/AdminDashboardContainer", () => ({
  AdminDashboardContainer: () => <div data-testid="admin-dashboard">Admin Dashboard</div>,
}));
mock.module("@/frontend/common/views/dashboard/parent/dashboard/ParentDashboardContainer", () => ({
  ParentDashboardContainer: () => <div data-testid="parent-dashboard">Parent Dashboard</div>,
}));
mock.module("@/frontend/common/views/dashboard/student/dashboard/StudentDashboardContainer", () => ({
  StudentDashboardContainer: () => <div data-testid="student-dashboard">Student Dashboard</div>,
}));
mock.module("@/frontend/common/views/dashboard/supervisor/dashboard/SupervisorDashboardContainer", () => ({
  SupervisorDashboardContainer: () => <div data-testid="supervisor-dashboard">Supervisor Dashboard</div>,
}));
mock.module("@/frontend/common/views/dashboard/teachers/dashboard/TeacherDashboardContainer", () => ({
  TeacherDashboardContainer: () => <div data-testid="teacher-dashboard">Teacher Dashboard</div>,
}));

import { afterEach, describe, expect, test } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, screen } from "@testing-library/react";

expect.extend(matchers);

import { AppPermission, type User } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { DashboardContainer } from "@/frontend/common/views/dashboard/dashboard/DashboardContainer";
import { renderWithWrapper } from "@/test/ui/components/TestWrapper";

function createUser(permissions: AppPermission[], role: string): User {
  return {
    id: "test-user-id",
    name: "Test User",
    role,
    permissions,
    avatarUrl: null,
    createdAt: null,
    displayCurrency: null,
    email: null,
    emailVerifiedAt: null,
    notificationCount: 0,
    parentId: null,
    phone: null,
    status: null,
    teacherId: null,
    updatedAt: null,
  };
}

afterEach(() => {
  cleanup();
  useUserStore.setState({ user: null, permissions: [] }, false);
});

describe("DashboardContainer permission routing", () => {
  test("renders ParentDashboardContainer when parent permission present and metrics absent", () => {
    const permissions = [AppPermission.ScheduleViewFamily];
    useUserStore.getState().setUser(createUser(permissions, "PARENT"));

    renderWithWrapper(<DashboardContainer />, { permissions });

    expect(screen.getByTestId("parent-dashboard")).toBeVisible();
  });

  test("renders TeacherDashboardContainer when teacher permission present and metrics absent", () => {
    const permissions = [AppPermission.TeacherViewDashboard];
    useUserStore.getState().setUser(createUser(permissions, "TEACHER"));

    renderWithWrapper(<DashboardContainer />, { permissions });

    expect(screen.getByTestId("teacher-dashboard")).toBeVisible();
  });

  test("renders StudentDashboardContainer when student permission present and metrics absent", () => {
    const permissions = [AppPermission.StudentViewOwnDashboard];
    useUserStore.getState().setUser(createUser(permissions, "STUDENT"));

    renderWithWrapper(<DashboardContainer />, { permissions });

    expect(screen.getByTestId("student-dashboard")).toBeVisible();
  });

  test("renders SupervisorDashboardContainer when supervisor permission present and metrics absent", () => {
    const permissions = [AppPermission.SupervisorViewDashboard];
    useUserStore.getState().setUser(createUser(permissions, "SUPERVISOR"));

    renderWithWrapper(<DashboardContainer />, { permissions });

    expect(screen.getByTestId("supervisor-dashboard")).toBeVisible();
  });

  test("renders AdminDashboardContainer when no special permission matches (default)", () => {
    const permissions: AppPermission[] = [];
    useUserStore.getState().setUser(createUser(permissions, "ADMIN"));

    renderWithWrapper(<DashboardContainer />, { permissions });

    expect(screen.getByTestId("admin-dashboard")).toBeVisible();
  });

  test("renders AdminDashboardContainer when DashboardViewMetrics present (beats parent)", () => {
    const permissions = [AppPermission.ScheduleViewFamily, AppPermission.DashboardViewMetrics];
    useUserStore.getState().setUser(createUser(permissions, "ADMIN"));

    renderWithWrapper(<DashboardContainer />, { permissions });

    expect(screen.getByTestId("admin-dashboard")).toBeVisible();
  });

  test("renders AdminDashboardContainer when DashboardViewMetrics present (beats teacher)", () => {
    const permissions = [AppPermission.TeacherViewDashboard, AppPermission.DashboardViewMetrics];
    useUserStore.getState().setUser(createUser(permissions, "ADMIN"));

    renderWithWrapper(<DashboardContainer />, { permissions });

    expect(screen.getByTestId("admin-dashboard")).toBeVisible();
  });

  test("renders AdminDashboardContainer when DashboardViewMetrics present (beats student)", () => {
    const permissions = [AppPermission.StudentViewOwnDashboard, AppPermission.DashboardViewMetrics];
    useUserStore.getState().setUser(createUser(permissions, "ADMIN"));

    renderWithWrapper(<DashboardContainer />, { permissions });

    expect(screen.getByTestId("admin-dashboard")).toBeVisible();
  });

  test("renders AdminDashboardContainer when DashboardViewMetrics present (beats supervisor)", () => {
    const permissions = [AppPermission.SupervisorViewDashboard, AppPermission.DashboardViewMetrics];
    useUserStore.getState().setUser(createUser(permissions, "ADMIN"));

    renderWithWrapper(<DashboardContainer />, { permissions });

    expect(screen.getByTestId("admin-dashboard")).toBeVisible();
  });

  test("parent beats teacher when parent permission present (priority order)", () => {
    const permissions = [AppPermission.ScheduleViewFamily, AppPermission.TeacherViewDashboard];
    useUserStore.getState().setUser(createUser(permissions, "PARENT"));

    renderWithWrapper(<DashboardContainer />, { permissions });

    expect(screen.getByTestId("parent-dashboard")).toBeVisible();
  });

  test("teacher beats student when teacher and student permissions present", () => {
    const permissions = [AppPermission.TeacherViewDashboard, AppPermission.StudentViewOwnDashboard];
    useUserStore.getState().setUser(createUser(permissions, "TEACHER"));

    renderWithWrapper(<DashboardContainer />, { permissions });

    expect(screen.getByTestId("teacher-dashboard")).toBeVisible();
  });

  test("student beats supervisor when student and supervisor permissions present", () => {
    const permissions = [AppPermission.StudentViewOwnDashboard, AppPermission.SupervisorViewDashboard];
    useUserStore.getState().setUser(createUser(permissions, "STUDENT"));

    renderWithWrapper(<DashboardContainer />, { permissions });

    expect(screen.getByTestId("student-dashboard")).toBeVisible();
  });

  test("supervisor beats admin default when supervisor permission present", () => {
    const permissions = [AppPermission.SupervisorViewDashboard];
    useUserStore.getState().setUser(createUser(permissions, "SUPERVISOR"));

    renderWithWrapper(<DashboardContainer />, { permissions });

    expect(screen.getByTestId("supervisor-dashboard")).toBeVisible();
  });
});
