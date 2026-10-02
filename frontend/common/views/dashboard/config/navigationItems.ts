import { SIDEBAR_ADMIN_NAV_ITEMS } from "@/frontend/common/views/dashboard/config/navigationItems.admin";
import { BOTTOM_NAV_ITEMS } from "@/frontend/common/views/dashboard/config/navigationItems.bottom";
import { SIDEBAR_DIRECTORY_NAV_ITEMS } from "@/frontend/common/views/dashboard/config/navigationItems.directory";
import { SIDEBAR_FINANCE_NAV_ITEMS } from "@/frontend/common/views/dashboard/config/navigationItems.finance";
import { SIDEBAR_PORTAL_NAV_ITEMS } from "@/frontend/common/views/dashboard/config/navigationItems.portal";
import type { NavItem } from "@/frontend/common/views/dashboard/types/dashboard";

/**
 * Full navigation items for the dashboard sidebar, concatenated from the
 * domain partial arrays (portal → directory → finance → admin; order
 * preserved). Items are filtered at runtime by the user's permissions.
 */
export const SIDEBAR_NAV_ITEMS: readonly NavItem[] = [
  ...SIDEBAR_PORTAL_NAV_ITEMS,
  ...SIDEBAR_DIRECTORY_NAV_ITEMS,
  ...SIDEBAR_FINANCE_NAV_ITEMS,
  ...SIDEBAR_ADMIN_NAV_ITEMS,
];

export { BOTTOM_NAV_ITEMS };
