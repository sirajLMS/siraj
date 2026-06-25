"use client";

import { useLocale, useTranslations } from "next-intl";
import type { NavItem } from "@/frontend/views/dashboard/types/dashboard";
import { SidebarShell, type TranslatedNavItem } from "./client/SidebarShell";

interface SidebarProps {
  readonly navItems: readonly NavItem[];
  readonly activeKey: string;
  readonly sidebarWidth: string;
}

export function Sidebar({ navItems, activeKey, sidebarWidth }: SidebarProps) {
  const t = useTranslations();
  const locale = useLocale();

  const translatedNavItems: TranslatedNavItem[] = navItems.map(item => ({
    ...item,
    label: t(item.labelKey),
  }));

  return (
    <SidebarShell navItems={translatedNavItems} activeKey={activeKey} locale={locale} sidebarWidth={sidebarWidth} />
  );
}
