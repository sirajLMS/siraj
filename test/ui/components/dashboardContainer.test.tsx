import { afterEach, describe, expect, mock, test } from "bun:test";

// Mock the role-specific dashboard containers as simple divs with data-testid.
// DashboardContainerView uses next/dynamic to lazy-load these. The next/dynamic
// mock resolves the importer asynchronously, so tests use findByTestId.
await mock.module("@/frontend/common/views/dashboard/admin/home/AdminDashboardContainer", () => ({
  AdminDashboardContainer: () => <div data-testid="admin-dashboard">Admin Dashboard</div>,
}));
await mock.module("@/frontend/common/views/dashboard/parent/dashboard/ParentDashboardContainer", () => ({
  ParentDashboardContainer: () => <div data-testid="parent-dashboard">Parent Dashboard</div>,
}));
await mock.module("@/frontend/common/views/dashboard/student/dashboard/StudentDashboardContainer", () => ({
  StudentDashboardContainer: () => <div data-testid="student-dashboard">Student Dashboard</div>,
}));
await mock.module("@/frontend/common/views/dashboard/supervisor/dashboard/SupervisorDashboardContainer", () => ({
  SupervisorDashboardContainer: () => <div data-testid="supervisor-dashboard">Supervisor Dashboard</div>,
}));
await mock.module("@/frontend/common/views/dashboard/teachers/dashboard/TeacherDashboardContainer", () => ({
  TeacherDashboardContainer: () => <div data-testid="teacher-dashboard">Teacher Dashboard</div>,
}));

import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup, screen } from "@testing-library/react";

expect.extend(matchers);

import { AppPermission, type MeQuery_me as User } from "@/frontend/common/graphql/generated/gql/graphql";
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
  test("renders ParentDashboardContainer when parent permission present and metrics absent", async () => {
    const permissions = [AppPermission.ScheduleViewFamily];
    useUserStore.getState().setUser(createUser(permissions, "PARENT"));

    renderWithWrapper(<DashboardContainer />, { permissions });

    expect(await screen.findByTestId("parent-dashboard")).toBeVisible();
  });

  test("renders TeacherDashboardContainer when teacher permission present and metrics absent", async () => {
    const permissions = [AppPermission.TeacherViewDashboard];
    useUserStore.getState().setUser(createUser(permissions, "TEACHER"));

    renderWithWrapper(<DashboardContainer />, { permissions });

    expect(await screen.findByTestId("teacher-dashboard")).toBeVisible();
  });

  test("renders StudentDashboardContainer when student permission present and metrics absent", async () => {
    const permissions = [AppPermission.StudentViewOwnDashboard];
    useUserStore.getState().setUser(createUser(permissions, "STUDENT"));

    renderWithWrapper(<DashboardContainer />, { permissions });

    expect(await screen.findByTestId("student-dashboard")).toBeVisible();
  });

  test("renders SupervisorDashboardContainer when supervisor permission present and metrics absent", async () => {
    const permissions = [AppPermission.SupervisorViewDashboard];
    useUserStore.getState().setUser(createUser(permissions, "SUPERVISOR"));

    renderWithWrapper(<DashboardContainer />, { permissions });

    expect(await screen.findByTestId("supervisor-dashboard")).toBeVisible();
  });

  test("renders AdminDashboardContainer when no special permission matches (default)", async () => {
    const permissions: AppPermission[] = [];
    useUserStore.getState().setUser(createUser(permissions, "ADMIN"));

    renderWithWrapper(<DashboardContainer />, { permissions });

    expect(await screen.findByTestId("admin-dashboard")).toBeVisible();
  });

  test("renders AdminDashboardContainer when DashboardViewMetrics present (beats parent)", async () => {
    const permissions = [AppPermission.ScheduleViewFamily, AppPermission.DashboardViewMetrics];
    useUserStore.getState().setUser(createUser(permissions, "ADMIN"));

    renderWithWrapper(<DashboardContainer />, { permissions });

    expect(await screen.findByTestId("admin-dashboard")).toBeVisible();
  });

  test("renders AdminDashboardContainer when DashboardViewMetrics present (beats teacher)", async () => {
    const permissions = [AppPermission.TeacherViewDashboard, AppPermission.DashboardViewMetrics];
    useUserStore.getState().setUser(createUser(permissions, "ADMIN"));

    renderWithWrapper(<DashboardContainer />, { permissions });

    expect(await screen.findByTestId("admin-dashboard")).toBeVisible();
  });

  test("renders AdminDashboardContainer when DashboardViewMetrics present (beats student)", async () => {
    const permissions = [AppPermission.StudentViewOwnDashboard, AppPermission.DashboardViewMetrics];
    useUserStore.getState().setUser(createUser(permissions, "ADMIN"));

    renderWithWrapper(<DashboardContainer />, { permissions });

    expect(await screen.findByTestId("admin-dashboard")).toBeVisible();
  });

  test("renders AdminDashboardContainer when DashboardViewMetrics present (beats supervisor)", async () => {
    const permissions = [AppPermission.SupervisorViewDashboard, AppPermission.DashboardViewMetrics];
    useUserStore.getState().setUser(createUser(permissions, "ADMIN"));

    renderWithWrapper(<DashboardContainer />, { permissions });

    expect(await screen.findByTestId("admin-dashboard")).toBeVisible();
  });

  test("parent beats teacher when parent permission present (priority order)", async () => {
    const permissions = [AppPermission.ScheduleViewFamily, AppPermission.TeacherViewDashboard];
    useUserStore.getState().setUser(createUser(permissions, "PARENT"));

    renderWithWrapper(<DashboardContainer />, { permissions });

    expect(await screen.findByTestId("parent-dashboard")).toBeVisible();
  });

  test("teacher beats student when teacher and student permissions present", async () => {
    const permissions = [AppPermission.TeacherViewDashboard, AppPermission.StudentViewOwnDashboard];
    useUserStore.getState().setUser(createUser(permissions, "TEACHER"));

    renderWithWrapper(<DashboardContainer />, { permissions });

    expect(await screen.findByTestId("teacher-dashboard")).toBeVisible();
  });

  test("student beats supervisor when student and supervisor permissions present", async () => {
    const permissions = [AppPermission.StudentViewOwnDashboard, AppPermission.SupervisorViewDashboard];
    useUserStore.getState().setUser(createUser(permissions, "STUDENT"));

    renderWithWrapper(<DashboardContainer />, { permissions });

    expect(await screen.findByTestId("student-dashboard")).toBeVisible();
  });

  test("supervisor beats admin default when supervisor permission present", async () => {
    const permissions = [AppPermission.SupervisorViewDashboard];
    useUserStore.getState().setUser(createUser(permissions, "SUPERVISOR"));

    renderWithWrapper(<DashboardContainer />, { permissions });

    expect(await screen.findByTestId("supervisor-dashboard")).toBeVisible();
  });
});
