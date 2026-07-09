"use client";

import { useTranslations } from "next-intl";
import { SidebarShell, type TranslatedNavItem } from "@/frontend/views/dashboard/components/client/SidebarShell";
import type { NavItem } from "@/frontend/views/dashboard/types/dashboard";

interface SidebarProps {
  readonly navItems: readonly NavItem[];
  readonly activeKey: string;
  readonly sidebarWidth: string;
}

export function Sidebar({ navItems, activeKey, sidebarWidth }: SidebarProps) {
  const t = useTranslations();

  const translatedNavItems: TranslatedNavItem[] = navItems.map(item => ({
    ...item,
    label: t(item.labelKey),
  }));

  return <SidebarShell navItems={translatedNavItems} activeKey={activeKey} sidebarWidth={sidebarWidth} />;
}
