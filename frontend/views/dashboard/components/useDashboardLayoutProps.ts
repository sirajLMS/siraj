"use client";

import type { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { useLayoutStore } from "@/frontend/common/stores/layoutStore";
import { getNavItemsForPermissions } from "@/frontend/views/dashboard/config/navigationConfig";
import { getActiveNavKey } from "@/frontend/views/dashboard/lib/getDashboardLayoutData";
import type { NavItem } from "@/frontend/views/dashboard/types/dashboard";
import { usePathname, useRouter } from "@/shared/i18n/routing";

interface UseDashboardLayoutPropsInput {
  readonly sidebarNavItems: readonly NavItem[];
  readonly bottomNavItems: readonly NavItem[];
  readonly permissions: readonly AppPermission[];
}

export function useDashboardLayoutProps({
  sidebarNavItems,
  bottomNavItems,
  permissions,
}: UseDashboardLayoutPropsInput) {
  const router = useRouter();
  const pathname = usePathname();

  const { sidebarOpen, mobileDrawerOpen, toggleSidebar, toggleMobileDrawer, closeMobileDrawer } = useLayoutStore();

  const sidebarItems = getNavItemsForPermissions(sidebarNavItems, permissions);
  const filteredBottomNavItems = getNavItemsForPermissions(bottomNavItems, permissions);

  const activeNavKey = getActiveNavKey(pathname, sidebarItems);

  const handleNavigate = (href: string) => {
    router.push(href);
  };

  return {
    sidebarItems,
    bottomNavItems: filteredBottomNavItems,
    activeNavKey,
    sidebarOpen,
    mobileDrawerOpen,
    toggleSidebar,
    toggleMobileDrawer,
    closeMobileDrawer,
    handleNavigate,
  };
}
