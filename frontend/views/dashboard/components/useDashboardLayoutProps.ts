"use client";

import { usePathname, useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import type { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import { useLayoutStore } from "@/frontend/stores/layoutStore";
import { getNavItemsForPermissions } from "@/frontend/views/dashboard/config/navigationConfig";
import type { NavItem } from "@/frontend/views/dashboard/types/dashboard";

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
  const locale = useLocale();

  const { sidebarOpen, mobileDrawerOpen, toggleSidebar, toggleMobileDrawer, closeMobileDrawer } = useLayoutStore();

  const sidebarItems = getNavItemsForPermissions(sidebarNavItems, permissions);
  const filteredBottomNavItems = getNavItemsForPermissions(bottomNavItems, permissions);

  const pathWithoutLocale = pathname.replace(`/${locale}`, "") || "/dashboard";
  const activeNavKey = sidebarItems.find(item => pathWithoutLocale.startsWith(item.href))?.key ?? "home";

  const handleNavigate = (href: string) => {
    router.push(`/${locale}${href}`);
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
