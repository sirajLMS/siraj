"use client";

import { SidebarMobileDrawer } from "@/frontend/common/views/dashboard/components/client/SidebarShell.content.parts";
import { SidebarDesktop } from "@/frontend/common/views/dashboard/components/client/SidebarShell.desktop.parts";
import type { SidebarShellProps } from "@/frontend/common/views/dashboard/components/client/SidebarShell.types";

export type {
  TranslatedNavGroup,
  TranslatedNavItem,
} from "@/frontend/common/views/dashboard/components/client/SidebarShell.types";

export function SidebarShell({
  navGroups,
  navItems,
  activeKey,
  sidebarWidth,
  initialSidebarOpen,
  userName,
  avatarUrl,
  logoutLabel,
  toggleGroupAriaLabel,
  expandSidebarLabel,
  collapseSidebarLabel,
}: SidebarShellProps) {
  return (
    <>
      <SidebarMobileDrawer
        sidebarWidth={sidebarWidth}
        navGroups={navGroups}
        navItems={navItems}
        activeKey={activeKey}
        userName={userName}
        avatarUrl={avatarUrl}
        logoutLabel={logoutLabel}
        toggleGroupAriaLabel={toggleGroupAriaLabel}
      />
      <SidebarDesktop
        sidebarWidth={sidebarWidth}
        navGroups={navGroups}
        navItems={navItems}
        activeKey={activeKey}
        initialSidebarOpen={initialSidebarOpen}
        userName={userName}
        avatarUrl={avatarUrl}
        logoutLabel={logoutLabel}
        toggleGroupAriaLabel={toggleGroupAriaLabel}
        expandSidebarLabel={expandSidebarLabel}
        collapseSidebarLabel={collapseSidebarLabel}
      />
    </>
  );
}
