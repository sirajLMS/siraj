"use client";

import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { useUserStore } from "@/frontend/common/stores/userStore";

function shouldShowParentDashboard(permissions: readonly AppPermission[]): boolean {
  return (
    permissions.includes(AppPermission.ScheduleViewFamily) && !permissions.includes(AppPermission.DashboardViewMetrics)
  );
}

function shouldShowTeacherDashboard(permissions: readonly AppPermission[]): boolean {
  return (
    permissions.includes(AppPermission.TeacherViewDashboard) &&
    !permissions.includes(AppPermission.DashboardViewMetrics)
  );
}

function shouldShowStudentDashboard(permissions: readonly AppPermission[]): boolean {
  return (
    permissions.includes(AppPermission.StudentViewOwnDashboard) &&
    !permissions.includes(AppPermission.DashboardViewMetrics)
  );
}

function shouldShowSupervisorDashboard(permissions: readonly AppPermission[]): boolean {
  return (
    permissions.includes(AppPermission.SupervisorViewDashboard) &&
    !permissions.includes(AppPermission.DashboardViewMetrics)
  );
}

export type DashboardRole = "parent" | "teacher" | "student" | "supervisor" | "admin";

export interface DashboardContainerViewModel {
  readonly role: DashboardRole;
  readonly userName: string;
  readonly loading: boolean;
}

export interface UseDashboardContainerViewModelProps {
  readonly onRetry?: () => void;
}

export function useDashboardContainerViewModel(
  _props: Readonly<UseDashboardContainerViewModelProps>
): DashboardContainerViewModel {
  /**
   * The user store is seeded by UserStoreInitializer (rendered in
   * DashboardClientBridge) before this component mounts, so `user` is already
   * populated on first render — no Apollo query needed here.
   */
  const { user } = useUserStore();

  const permissions = user?.permissions ?? [];
  const userName = user?.name ?? "";

  let role: DashboardRole = "admin";

  if (shouldShowParentDashboard(permissions)) {
    role = "parent";
  } else if (shouldShowTeacherDashboard(permissions)) {
    role = "teacher";
  } else if (shouldShowStudentDashboard(permissions)) {
    role = "student";
  } else if (shouldShowSupervisorDashboard(permissions)) {
    role = "supervisor";
  }

  return {
    role,
    userName,
    // No async loading — role is derived synchronously from the user store
    loading: false,
  };
}
