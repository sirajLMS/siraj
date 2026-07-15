"use client";

import { SidebarShell, type TranslatedNavItem } from "@/frontend/common/views/dashboard/components/client/SidebarShell";
import { useNavLabels } from "@/frontend/common/views/dashboard/components/useNavLabels";
import type { NavItem } from "@/frontend/common/views/dashboard/types/dashboard";

interface SidebarProps {
  readonly navItems: readonly NavItem[];
  readonly activeKey: string;
  readonly sidebarWidth: string;
}

export function Sidebar({ navItems, activeKey, sidebarWidth }: SidebarProps) {
  const t = useNavLabels();

  const translatedNavItems: TranslatedNavItem[] = navItems.map(item => ({
    ...item,
    label: t(item.labelKey),
  }));

  return <SidebarShell navItems={translatedNavItems} activeKey={activeKey} sidebarWidth={sidebarWidth} />;
}
