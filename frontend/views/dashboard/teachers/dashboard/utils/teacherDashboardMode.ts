import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";

export type TeacherDashboardMode = "standard" | "active";

export function resolveTeacherDashboardMode(
  permissions: readonly AppPermission[],
  modeParam: string | null
): TeacherDashboardMode | null {
  if (modeParam === "teacher-active") {
    return "active";
  }
  if (modeParam === "teacher") {
    return "standard";
  }
  if (
    permissions.includes(AppPermission.SessionActivateClass) &&
    !permissions.includes(AppPermission.DashboardViewMetrics)
  ) {
    return "active";
  }
  if (
    permissions.includes(AppPermission.TeacherViewDashboard) &&
    !permissions.includes(AppPermission.DashboardViewMetrics)
  ) {
    return "standard";
  }
  return null;
}

export function shouldRenderTeacherDashboard(permissions: readonly AppPermission[], modeParam: string | null): boolean {
  if (modeParam === "teacher" || modeParam === "teacher-active") {
    return (
      permissions.includes(AppPermission.TeacherViewDashboard) ||
      permissions.includes(AppPermission.SessionActivateClass)
    );
  }
  return (
    permissions.includes(AppPermission.TeacherViewDashboard) &&
    !permissions.includes(AppPermission.DashboardViewMetrics)
  );
}
