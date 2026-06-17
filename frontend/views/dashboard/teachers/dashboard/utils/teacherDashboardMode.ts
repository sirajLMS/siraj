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
    permissions.includes(AppPermission.ClassesActivate) &&
    !permissions.includes(AppPermission.DashboardViewMetrics)
  ) {
    return "active";
  }
  if (
    permissions.includes(AppPermission.ScheduleViewAssigned) &&
    !permissions.includes(AppPermission.DashboardViewMetrics)
  ) {
    return "standard";
  }
  return null;
}

export function shouldRenderTeacherDashboard(permissions: readonly AppPermission[], modeParam: string | null): boolean {
  if (modeParam === "teacher" || modeParam === "teacher-active") {
    return (
      permissions.includes(AppPermission.ScheduleViewAssigned) || permissions.includes(AppPermission.ClassesActivate)
    );
  }
  return (
    permissions.includes(AppPermission.ScheduleViewAssigned) &&
    !permissions.includes(AppPermission.DashboardViewMetrics)
  );
}
