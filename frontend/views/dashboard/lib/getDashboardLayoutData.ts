import type { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import {
  BOTTOM_NAV_ITEMS,
  getNavItemsForPermissions,
  SIDEBAR_NAV_ITEMS,
} from "@/frontend/views/dashboard/config/navigationConfig";
import type { NavItem } from "@/frontend/views/dashboard/types/dashboard";

export function getActiveNavKey(pathname: string, sidebarItems: readonly NavItem[], locale: string): string {
  const pathWithoutLocale = pathname.replace(`/${locale}`, "") || "/dashboard";

  return sidebarItems.find(item => pathWithoutLocale.startsWith(item.href))?.key ?? "home";
}

export function getDashboardLayoutData(
  pathname: string,
  permissions: readonly AppPermission[],
  locale: string
): {
  readonly sidebarItems: NavItem[];
  readonly bottomNavItems: NavItem[];
  readonly activeNavKey: string;
} {
  const sidebarItems = getNavItemsForPermissions(SIDEBAR_NAV_ITEMS, permissions);
  const bottomNavItems = getNavItemsForPermissions(BOTTOM_NAV_ITEMS, permissions);
  const activeNavKey = getActiveNavKey(pathname, sidebarItems, locale);

  return { sidebarItems, bottomNavItems, activeNavKey };
}
