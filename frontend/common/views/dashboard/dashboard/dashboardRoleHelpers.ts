import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";

export type DashboardRole = "parent" | "teacher" | "student" | "supervisor" | "admin";

export function shouldShowParentDashboard(permissions: readonly AppPermission[]): boolean {
  return (
    permissions.includes(AppPermission.ScheduleViewFamily) && !permissions.includes(AppPermission.DashboardViewMetrics)
  );
}

export function shouldShowTeacherDashboard(permissions: readonly AppPermission[]): boolean {
  return (
    permissions.includes(AppPermission.TeacherViewDashboard) &&
    !permissions.includes(AppPermission.DashboardViewMetrics)
  );
}

export function shouldShowStudentDashboard(permissions: readonly AppPermission[]): boolean {
  return (
    permissions.includes(AppPermission.StudentViewOwnDashboard) &&
    !permissions.includes(AppPermission.DashboardViewMetrics)
  );
}

export function shouldShowSupervisorDashboard(permissions: readonly AppPermission[]): boolean {
  return (
    permissions.includes(AppPermission.SupervisorViewDashboard) &&
    !permissions.includes(AppPermission.DashboardViewMetrics)
  );
}

export function resolveDashboardRole(permissions: readonly AppPermission[]): DashboardRole {
  if (shouldShowParentDashboard(permissions)) return "parent";
  if (shouldShowTeacherDashboard(permissions)) return "teacher";
  if (shouldShowStudentDashboard(permissions)) return "student";
  if (shouldShowSupervisorDashboard(permissions)) return "supervisor";
  return "admin";
}
