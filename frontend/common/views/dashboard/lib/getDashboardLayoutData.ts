import type { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import {
  BOTTOM_NAV_ITEMS,
  getNavItemsForPermissions,
  SIDEBAR_NAV_GROUPS,
  SIDEBAR_NAV_ITEMS,
} from "@/frontend/common/views/dashboard/config/navigationConfig";
import { stripLocaleFromPath } from "@/frontend/common/views/dashboard/lib/stripLocaleFromPath";
import type { NavGroup, NavItem } from "@/frontend/common/views/dashboard/types/dashboard";

/**
 * Returns the `key` of the sidebar item whose `href` is the longest prefix
 * of `pathname`, or `null` when no item matches. `null` is the correct
 * behaviour on a page that has nothing to do with the dashboard home —
 * previously the code fell back to `"home"` and silently highlighted Home on
 * every orphan page. Callers should pass `null` straight to the renderer
 * (no item highlighted) rather than substituting a default.
 */
export function getActiveNavKey(pathname: string, sidebarItems: readonly NavItem[]): string | null {
  const stripped = stripLocaleFromPath(pathname);
  if (stripped === "/dashboard") {
    // The home/supervisor-home/teacher-today/etc. items all share
    // `href: "/dashboard"`, so they're handled by the matcher below.
  }
  const match = sidebarItems
    .filter(item => stripped.startsWith(item.href))
    .sort((a, b) => b.href.length - a.href.length)[0];

  return match?.key ?? null;
}

export function getDashboardLayoutData(permissions: readonly AppPermission[]): {
  readonly sidebarGroups: readonly NavGroup[];
  readonly sidebarItems: NavItem[];
  readonly bottomNavItems: NavItem[];
} {
  const sidebarGroups = getNavItemsForPermissions(SIDEBAR_NAV_GROUPS, SIDEBAR_NAV_ITEMS, permissions);
  const sidebarItems = getNavItemsForPermissions(SIDEBAR_NAV_ITEMS, permissions);
  const bottomNavItems = getNavItemsForPermissions(BOTTOM_NAV_ITEMS, permissions);

  return { sidebarGroups, sidebarItems, bottomNavItems };
}
