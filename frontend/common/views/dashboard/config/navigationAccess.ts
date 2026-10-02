import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql";
import type { NavGroup, NavItem } from "@/frontend/common/views/dashboard/types/dashboard";

export function hasItemPermission(item: NavItem, permissions: readonly AppPermission[]): boolean {
  if (!item.permission) {
    return true;
  }
  if (typeof item.permission === "string") {
    return permissions.includes(item.permission);
  }
  return item.permission.some(p => permissions.includes(p));
}

/**
 * Detects whether the current user is a SUPERADMIN (the `super_admin`
 * permission group). SUPERADMIN holds `PermissionGroupsManage`, granted only
 * to that group by the seed migration, so this is a stable discriminator.
 * Used to relax the supervisor audience gate so SUPERADMIN inherits every
 * supervisor-only nav item (`pending-reviews`, `teacher-dues`,
 * `monthly-reports`) — `supervisor-home` is excluded
 * by [`skipSuperAdminKeysForSupervisorItems`] below because the admin `home`
 * item already serves `/dashboard` for them (user decision: consolidate).
 */
export function isSuperAdminNavUser(permissions: readonly AppPermission[]): boolean {
  return permissions.includes(AppPermission.PermissionGroupsManage);
}

/** Supervisor-audience keys that should remain hidden for SUPERADMIN. */
export const SUPERADMIN_HIDDEN_SUPERVISOR_KEYS = new Set<string>(["supervisor-home"]);

/**
 * Type guards for the union-typed parameters of
 * `getNavItemsForPermissions`. The active overload is selected by the third
 * argument (`maybePermissionsOrFlags`); these guards narrow the correlated
 * array parameters so the implementation can avoid unsafe type assertions.
 * `NavItem` carries a required `href` (absent on `NavGroup`), and
 * `AppPermission` is a string enum — so a single element check is enough to
 * classify a homogeneous array. Empty arrays match either branch, which is
 * safe because filtering an empty array is a no-op.
 */
type NavEntryArray = readonly NavGroup[] | readonly NavItem[] | readonly AppPermission[];

export const isNavItemArray = (arr: NavEntryArray): arr is readonly NavItem[] =>
  arr.length === 0 || (typeof arr[0] === "object" && arr[0] !== null && "href" in arr[0]);

export const isNavGroupArray = (arr: NavEntryArray): arr is readonly NavGroup[] =>
  arr.length === 0 || (typeof arr[0] === "object" && arr[0] !== null && !("href" in arr[0]));

export const isAppPermissionArray = (arr: NavEntryArray): arr is readonly AppPermission[] =>
  arr.length === 0 || typeof arr[0] === "string";

export function isParentPortalUser(permissions: readonly AppPermission[]): boolean {
  return (
    permissions.includes(AppPermission.ScheduleViewFamily) && !permissions.includes(AppPermission.DashboardViewMetrics)
  );
}

export function isTeacherPortalUser(permissions: readonly AppPermission[]): boolean {
  return (
    permissions.includes(AppPermission.TeacherViewDashboard) &&
    !permissions.includes(AppPermission.DashboardViewMetrics)
  );
}

export function isStudentPortalUser(permissions: readonly AppPermission[]): boolean {
  return (
    permissions.includes(AppPermission.StudentViewOwnDashboard) &&
    !permissions.includes(AppPermission.DashboardViewMetrics)
  );
}

export function isSupervisorPortalUser(permissions: readonly AppPermission[]): boolean {
  return (
    permissions.includes(AppPermission.SupervisorViewDashboard) &&
    !permissions.includes(AppPermission.DashboardViewMetrics)
  );
}
