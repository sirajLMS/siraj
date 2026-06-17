import { CalendarTodayOutlined, DashboardOutlined } from "@mui/icons-material";
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
    permission: "dashboard.view_metrics",
  },
  {
    key: "schedule",
    labelKey: "dashboard.nav.schedule",
    icon: CalendarTodayOutlined,
    href: "/schedule",
    section: "main",
    permission: "schedule.view_list",
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
    permission: "dashboard.view_metrics",
  },
  {
    key: "schedule",
    labelKey: "dashboard.nav.schedule",
    icon: CalendarTodayOutlined,
    href: "/schedule",
    section: "main",
    permission: "schedule.view_list",
  },
] as const;

/**
 * Filter navigation items based on real user permissions array.
 */
export function getNavItemsForPermissions(items: readonly NavItem[], permissions: readonly string[]): NavItem[] {
  return items.filter(item => {
    if (!item.permission) return true;
    if (Array.isArray(item.permission)) {
      return (item.permission as readonly string[]).some(p => permissions.includes(p));
    }
    return permissions.includes(item.permission as string);
  });
}
