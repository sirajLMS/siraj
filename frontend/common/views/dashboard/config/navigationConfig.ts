import type { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql";
import {
  isAppPermissionArray,
  isNavGroupArray,
  isNavItemArray,
} from "@/frontend/common/views/dashboard/config/navigationAccess";
import {
  type NavFeatureFlags,
  resolveNavFeatureFlags,
} from "@/frontend/common/views/dashboard/config/navigationFeatureFlags";
import {
  filterNavGroupsForPermissions,
  filterNavItemsForPermissions,
} from "@/frontend/common/views/dashboard/config/navigationFiltering";
import type { NavGroup, NavItem } from "@/frontend/common/views/dashboard/types/dashboard";

export type { NavFeatureFlags } from "@/frontend/common/views/dashboard/config/navigationFeatureFlags";
export { DEFAULT_NAV_FEATURE_FLAGS } from "@/frontend/common/views/dashboard/config/navigationFeatureFlags";
export { SIDEBAR_NAV_GROUPS } from "@/frontend/common/views/dashboard/config/navigationGroups";
export { BOTTOM_NAV_ITEMS, SIDEBAR_NAV_ITEMS } from "@/frontend/common/views/dashboard/config/navigationItems";

/** Nav items pinned to the bottom of the sidebar (above the account footer). */
export const SIDEBAR_END_NAV_ITEM_KEYS = new Set(["teacher-rules", "parent-rules"]);

/**
 * Returns the subset of NAV ITEMS (or NAV GROUPS) that survive the user's
 * permission + audience gate + per-portal overrides. The active overload is
 * selected by the third argument (`maybePermissionsOrFlags`).
 */
export function getNavItemsForPermissions(
  items: readonly NavItem[],
  permissions: readonly AppPermission[],
  featureFlags?: NavFeatureFlags
): NavItem[];
export function getNavItemsForPermissions(
  groups: readonly NavGroup[],
  items: readonly NavItem[],
  permissions: readonly AppPermission[],
  featureFlags?: NavFeatureFlags
): NavGroup[];
export function getNavItemsForPermissions(
  groupsOrItems: readonly NavGroup[] | readonly NavItem[],
  itemsOrPermissions: readonly NavItem[] | readonly AppPermission[],
  maybePermissionsOrFlags?: readonly AppPermission[] | NavFeatureFlags,
  maybeFeatureFlags?: NavFeatureFlags
): NavItem[] | NavGroup[] {
  // Overload 1: (items, permissions[, featureFlags]) => NavItem[]
  if (maybePermissionsOrFlags === undefined || !Array.isArray(maybePermissionsOrFlags)) {
    const items = isNavItemArray(groupsOrItems) ? groupsOrItems : [];
    const permissions = isAppPermissionArray(itemsOrPermissions) ? itemsOrPermissions : [];
    const featureFlags = resolveNavFeatureFlags(maybePermissionsOrFlags);
    return filterNavItemsForPermissions(items, permissions, featureFlags);
  }

  // Overload 2: (groups, items, permissions[, featureFlags]) => NavGroup[]
  const groups = isNavGroupArray(groupsOrItems) ? groupsOrItems : [];
  const items = isNavItemArray(itemsOrPermissions) ? itemsOrPermissions : [];
  const permissions = Array.isArray(maybePermissionsOrFlags) ? maybePermissionsOrFlags : [];
  const featureFlags = resolveNavFeatureFlags(undefined, maybeFeatureFlags);
  return filterNavGroupsForPermissions(groups, items, permissions, featureFlags);
}
