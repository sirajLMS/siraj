import type {
  TranslatedNavGroup,
  TranslatedNavItem,
} from "@/frontend/common/views/dashboard/components/client/SidebarShell";
import type { NavGroup, NavItem } from "@/frontend/common/views/dashboard/types/dashboard";
import type { DashboardNavigationLabels } from "@/shared/locale/types/dashboard/core/nav";

export function buildTranslatedNavGroups(
  navGroups: readonly NavGroup[],
  t: (key: keyof DashboardNavigationLabels) => string
): TranslatedNavGroup[] {
  return navGroups.map(group => ({ ...group, label: t(group.labelKey) }));
}

export function buildTranslatedNavItems(
  navItems: readonly NavItem[],
  t: (key: keyof DashboardNavigationLabels) => string
): TranslatedNavItem[] {
  return navItems.map(item => ({ ...item, label: t(item.labelKey) }));
}
