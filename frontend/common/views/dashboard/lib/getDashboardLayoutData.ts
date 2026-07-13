import type { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import {
  BOTTOM_NAV_ITEMS,
  getNavItemsForPermissions,
  SIDEBAR_NAV_ITEMS,
} from "@/frontend/common/views/dashboard/config/navigationConfig";
import type { NavItem } from "@/frontend/common/views/dashboard/types/dashboard";
import { locales } from "@/shared/i18n/routing";

export function getActiveNavKey(pathname: string, sidebarItems: readonly NavItem[]): string {
  for (const loc of locales) {
    if (pathname.startsWith(`/${loc}/`) || pathname === `/${loc}`) {
      pathname = pathname.slice(`/${loc}`.length) || "/dashboard";
      break;
    }
  }

  const match = sidebarItems
    .filter(item => pathname.startsWith(item.href))
    .sort((a, b) => b.href.length - a.href.length)[0];

  return match?.key ?? "home";
}

export function getDashboardLayoutData(permissions: readonly AppPermission[]): {
  readonly sidebarItems: NavItem[];
  readonly bottomNavItems: NavItem[];
} {
  const sidebarItems = getNavItemsForPermissions(SIDEBAR_NAV_ITEMS, permissions);
  const bottomNavItems = getNavItemsForPermissions(BOTTOM_NAV_ITEMS, permissions);

  return { sidebarItems, bottomNavItems };
}
