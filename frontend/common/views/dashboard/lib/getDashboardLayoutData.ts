import type { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql";
import {
  BOTTOM_NAV_ITEMS,
  DEFAULT_NAV_FEATURE_FLAGS,
  getNavItemsForPermissions,
  type NavFeatureFlags,
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
/** Stable nav key for account-footer profile routes (not present in filtered sidebar items). */
export const PROFILE_NAV_KEY = "own-profile";

/** True when the pathname is the account footer profile route (`/profile` or a sub-route). */
export function isProfileRouteActive(pathname: string): boolean {
  const stripped = stripLocaleFromPath(pathname);
  return stripped === "/profile" || stripped.startsWith("/profile/");
}

export function getActiveNavKey(pathname: string, sidebarItems: readonly NavItem[]): string | null {
  if (isProfileRouteActive(pathname)) {
    return PROFILE_NAV_KEY;
  }

  const stripped = stripLocaleFromPath(pathname);
  if (stripped === "/dashboard") {
    // The home/supervisor-home/teacher-today/etc. items all share
    // `href: "/dashboard"`, so they're handled by the matcher below.
  }
  const match = sidebarItems
    .filter(item => stripped.startsWith(item.href))
    .toSorted((a, b) => b.href.length - a.href.length)[0];

  return match?.key ?? null;
}

export function getDashboardLayoutData(
  permissions: readonly AppPermission[],
  featureFlags: NavFeatureFlags = DEFAULT_NAV_FEATURE_FLAGS
): {
  readonly sidebarGroups: readonly NavGroup[];
  readonly sidebarItems: NavItem[];
  readonly bottomNavItems: NavItem[];
} {
  const sidebarGroups = getNavItemsForPermissions(SIDEBAR_NAV_GROUPS, SIDEBAR_NAV_ITEMS, permissions, featureFlags);
  const sidebarItems = getNavItemsForPermissions(SIDEBAR_NAV_ITEMS, permissions, featureFlags);
  const bottomNavItems = getNavItemsForPermissions(BOTTOM_NAV_ITEMS, permissions, featureFlags);

  return { sidebarGroups, sidebarItems, bottomNavItems };
}
