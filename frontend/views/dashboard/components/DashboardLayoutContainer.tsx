"use client";

import { usePathname, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { useLayoutStore } from "@/frontend/stores/layoutStore";
import { useUserStore } from "@/frontend/stores/userStore";
import {
  BOTTOM_NAV_ITEMS,
  getNavItemsForPermissions,
  SIDEBAR_NAV_ITEMS,
} from "@/frontend/views/dashboard/config/navigationConfig";
import { DashboardLayout } from "./DashboardLayout";

interface DashboardLayoutContainerProps {
  readonly children: ReactNode;
}

export function DashboardLayoutContainer({ children }: DashboardLayoutContainerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations("dashboard.admin");

  // Read Zustand stores
  const { sidebarOpen, mobileDrawerOpen, toggleSidebar, toggleMobileDrawer, closeMobileDrawer } = useLayoutStore();
  const { name, role, avatarUrl, permissions, notificationCount } = useUserStore();

  // Derive filtered nav items from permissions
  const sidebarItems = getNavItemsForPermissions(SIDEBAR_NAV_ITEMS, permissions);
  const bottomNavItems = getNavItemsForPermissions(BOTTOM_NAV_ITEMS, permissions);

  // Determine active nav key from current pathname
  const pathWithoutLocale = pathname.replace(`/${locale}`, "") || "/dashboard";
  const activeNavKey = sidebarItems.find(item => pathWithoutLocale.startsWith(item.href))?.key ?? "home";

  const handleNavigate = (href: string) => {
    router.push(`/${locale}${href}`);
  };

  return (
    <DashboardLayout
      sidebarItems={sidebarItems}
      bottomNavItems={bottomNavItems}
      activeNavKey={activeNavKey}
      userName={name}
      userRole={role}
      roleLabel={t("roleLabel")}
      avatarUrl={avatarUrl}
      notificationCount={notificationCount}
      sidebarWidth="260px"
      navbarHeight="64px"
      sidebarOpen={sidebarOpen}
      mobileDrawerOpen={mobileDrawerOpen}
      onToggleSidebar={toggleSidebar}
      onToggleMobileDrawer={toggleMobileDrawer}
      onCloseMobileDrawer={closeMobileDrawer}
      onNavigate={handleNavigate}
    >
      {children}
    </DashboardLayout>
  );
}
