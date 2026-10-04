import type { RefObject } from "react";
import type { NavGroup, NavItem } from "@/frontend/common/views/dashboard/types/dashboard";

export interface TranslatedNavItem extends NavItem {
  readonly label: string;
}

export interface TranslatedNavGroup extends NavGroup {
  readonly label: string;
}

export interface SidebarShellProps {
  readonly navGroups: readonly TranslatedNavGroup[];
  readonly navItems: readonly TranslatedNavItem[];
  readonly activeKey: string | null;
  readonly sidebarWidth: string;
  readonly initialSidebarOpen?: boolean;
  readonly userName: string;
  readonly avatarUrl: string;
  readonly logoutLabel: string;
  readonly toggleGroupAriaLabel: (label: string) => string;
  readonly expandSidebarLabel: string;
  readonly collapseSidebarLabel: string;
}

export interface SidebarNavItemProps {
  readonly item: TranslatedNavItem;
  readonly isActive?: boolean;
  readonly isCollapsed: boolean;
  readonly isFooter?: boolean;
}

export interface SidebarGroupHeaderProps {
  readonly group: TranslatedNavGroup;
  readonly isCollapsed: boolean;
  readonly collapsed: boolean;
  readonly onToggle: () => void;
  readonly toggleGroupAriaLabel: (label: string) => string;
}

export interface RenderedGroup {
  readonly group: TranslatedNavGroup;
  readonly items: readonly TranslatedNavItem[];
}

export interface SidebarGroupBlockProps {
  readonly entry: RenderedGroup;
  readonly activeKey: string | null;
  readonly isCollapsed: boolean;
  readonly showSeparator: boolean;
  readonly toggleGroupAriaLabel: (label: string) => string;
}

export interface GroupedNavListProps {
  readonly groups: readonly TranslatedNavGroup[];
  readonly items: readonly TranslatedNavItem[];
  readonly activeKey: string | null;
  readonly isCollapsed: boolean;
  readonly navListRef?: RefObject<HTMLElement | null>;
  readonly toggleGroupAriaLabel: (label: string) => string;
}

export interface SidebarAccountFooterProps {
  readonly userName: string;
  readonly avatarUrl: string;
  readonly logoutLabel: string;
  readonly isCollapsed: boolean;
  readonly activeKey: string | null;
}

export interface SidebarContentProps {
  readonly navGroups: readonly TranslatedNavGroup[];
  readonly navItems: readonly TranslatedNavItem[];
  readonly activeKey: string | null;
  readonly isCollapsed: boolean;
  readonly navListRef?: RefObject<HTMLElement | null>;
  readonly userName: string;
  readonly avatarUrl: string;
  readonly logoutLabel: string;
  readonly toggleGroupAriaLabel: (label: string) => string;
}

export interface SidebarMobileDrawerProps {
  readonly sidebarWidth: string;
  readonly navGroups: readonly TranslatedNavGroup[];
  readonly navItems: readonly TranslatedNavItem[];
  readonly activeKey: string | null;
  readonly userName: string;
  readonly avatarUrl: string;
  readonly logoutLabel: string;
  readonly toggleGroupAriaLabel: (label: string) => string;
}

export interface SidebarDesktopProps {
  readonly sidebarWidth: string;
  readonly navGroups: readonly TranslatedNavGroup[];
  readonly navItems: readonly TranslatedNavItem[];
  readonly activeKey: string | null;
  readonly initialSidebarOpen?: boolean;
  readonly userName: string;
  readonly avatarUrl: string;
  readonly logoutLabel: string;
  readonly toggleGroupAriaLabel: (label: string) => string;
  readonly expandSidebarLabel: string;
  readonly collapseSidebarLabel: string;
}

export interface SidebarCollapseToggleButtonProps {
  readonly isCollapsed: boolean;
  readonly expandSidebarLabel: string;
  readonly collapseSidebarLabel: string;
}
