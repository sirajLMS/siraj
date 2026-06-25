"use client";

import { type ReactNode, useEffect } from "react";
import type { CurrentUserProfile } from "@/backend/types";
import type { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import { useUserStore } from "@/frontend/stores/userStore";
import { BOTTOM_NAV_ITEMS, SIDEBAR_NAV_ITEMS } from "@/frontend/views/dashboard/config/navigationConfig";
import { DashboardLayout } from "./DashboardLayout";
import { useDashboardLayoutProps } from "./useDashboardLayoutProps";

interface DashboardClientBridgeProps {
  readonly children: ReactNode;
  readonly userProfile: CurrentUserProfile;
  readonly roleLabel: string;
}

export function DashboardClientBridge({ children, userProfile, roleLabel }: DashboardClientBridgeProps) {
  const { setUser } = useUserStore();

  const permissions = userProfile.permissions as unknown as AppPermission[];

  useEffect(() => {
    setUser({
      id: userProfile.id,
      name: userProfile.name,
      email: userProfile.email,
      avatarUrl: userProfile.avatarUrl,
      permissions,
      notificationCount: userProfile.notificationCount,
      createdAt: userProfile.createdAt?.toISOString() ?? null,
      updatedAt: userProfile.updatedAt?.toISOString() ?? null,
      emailVerifiedAt: userProfile.emailVerifiedAt?.toISOString() ?? null,
      role: null,
    });
  }, [userProfile, setUser, permissions]);

  const {
    sidebarItems,
    bottomNavItems,
    activeNavKey,
    sidebarOpen,
    mobileDrawerOpen,
    toggleSidebar,
    toggleMobileDrawer,
    closeMobileDrawer,
    handleNavigate,
  } = useDashboardLayoutProps({
    sidebarNavItems: SIDEBAR_NAV_ITEMS,
    bottomNavItems: BOTTOM_NAV_ITEMS,
    permissions,
  });

  return (
    <DashboardLayout
      sidebarItems={sidebarItems}
      bottomNavItems={bottomNavItems}
      activeNavKey={activeNavKey}
      userName={userProfile.name}
      userEmail={userProfile.email}
      userRole=""
      roleLabel={roleLabel}
      avatarUrl={userProfile.avatarUrl || ""}
      notificationCount={userProfile.notificationCount}
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
