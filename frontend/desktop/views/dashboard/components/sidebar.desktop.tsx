"use client";

import {
  SidebarShell,
  type TranslatedNavGroup,
  type TranslatedNavItem,
} from "@/frontend/common/views/dashboard/components/client/SidebarShell";
import { useNavLabels } from "@/frontend/common/views/dashboard/components/useNavLabels";
import type { NavGroup, NavItem } from "@/frontend/common/views/dashboard/types/dashboard";
import { Translation, useAppTranslation } from "@/shared/locale";

interface SidebarDesktopProps {
  readonly navGroups: readonly NavGroup[];
  readonly navItems: readonly NavItem[];
  readonly activeKey: string | null;
  readonly sidebarWidth: string;
  readonly initialSidebarOpen?: boolean;
  readonly userName: string;
  readonly avatarUrl: string;
}

export function SidebarDesktop({
  navGroups,
  navItems,
  activeKey,
  sidebarWidth,
  initialSidebarOpen,
  userName,
  avatarUrl,
}: Readonly<SidebarDesktopProps>) {
  const t = useNavLabels();
  const navLabels = useAppTranslation(Translation.Dashboard.CoreNav);

  const translatedNavGroups: TranslatedNavGroup[] = navGroups.map(group => ({
    ...group,
    label: t(group.labelKey),
  }));
  const translatedNavItems: TranslatedNavItem[] = navItems.map(item => ({
    ...item,
    label: t(item.labelKey),
  }));

  return (
    <SidebarShell
      navGroups={translatedNavGroups}
      navItems={translatedNavItems}
      activeKey={activeKey}
      sidebarWidth={sidebarWidth}
      initialSidebarOpen={initialSidebarOpen}
      userName={userName}
      avatarUrl={avatarUrl}
      logoutLabel={navLabels.nav.logout}
      toggleGroupAriaLabel={navLabels.toggleGroupAriaLabel}
    />
  );
}
