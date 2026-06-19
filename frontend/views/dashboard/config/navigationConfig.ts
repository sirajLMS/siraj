import { CalendarTodayOutlined, DashboardOutlined, SecurityOutlined } from "@mui/icons-material";
import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import type { NavItem } from "@/frontend/views/dashboard/types/dashboard";

/**
 * Fresh navigation items for the dashboard sidebar based on the current sprint constraints.
 * Items are filtered by the global user permissions.
 */
export const SIDEBAR_NAV_ITEMS: readonly NavItem[] = [
  {
    key: "home",
    labelKey: "dashboard.nav.home",
    icon: DashboardOutlined,
    href: "/dashboard",
    section: "main",
    permission: AppPermission.DashboardViewMetrics,
  },
  {
    key: "schedule",
    labelKey: "dashboard.nav.schedule",
    icon: CalendarTodayOutlined,
    href: "/schedule",
    section: "main",
    permission: AppPermission.ScheduleViewList,
  },
  {
    key: "permissions",
    labelKey: "dashboard.nav.permissions",
    icon: SecurityOutlined,
    href: "/permissions",
    section: "main",
    permission: AppPermission.PermissionGroupsManage,
  },
] as const;

/**
 * Bottom navigation items for mobile, condensed.
 */
export const BOTTOM_NAV_ITEMS: readonly NavItem[] = [
  {
    key: "home",
    labelKey: "dashboard.nav.home",
    icon: DashboardOutlined,
    href: "/dashboard",
    section: "main",
    permission: AppPermission.DashboardViewMetrics,
  },
  {
    key: "schedule",
    labelKey: "dashboard.nav.schedule",
    icon: CalendarTodayOutlined,
    href: "/schedule",
    section: "main",
    permission: AppPermission.ScheduleViewList,
  },
] as const;

/**
 * Filter navigation items based on real user permissions array.
 */
export function getNavItemsForPermissions(items: readonly NavItem[], permissions: readonly AppPermission[]): NavItem[] {
  return items.filter(item => {
    if (!item.permission) return true;
    if (typeof item.permission === "string") {
      return permissions.includes(item.permission);
    }
    return item.permission.some(p => permissions.includes(p));
  });
}
