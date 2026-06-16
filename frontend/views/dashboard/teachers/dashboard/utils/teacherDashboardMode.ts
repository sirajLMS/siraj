export type TeacherDashboardMode = "standard" | "active";

export function resolveTeacherDashboardMode(
  permissions: readonly string[],
  modeParam: string | null
): TeacherDashboardMode | null {
  if (modeParam === "teacher-active") {
    return "active";
  }
  if (modeParam === "teacher") {
    return "standard";
  }
  if (permissions.includes("teacher-dashboard-controls") && !permissions.includes("home")) {
    return "active";
  }
  if (permissions.includes("teacher-dashboard") && !permissions.includes("home")) {
    return "standard";
  }
  return null;
}

export function shouldRenderTeacherDashboard(permissions: readonly string[], modeParam: string | null): boolean {
  if (modeParam === "teacher" || modeParam === "teacher-active") {
    return permissions.includes("teacher-dashboard") || permissions.includes("teacher-dashboard-controls");
  }
  return permissions.includes("teacher-dashboard") && !permissions.includes("home");
}
