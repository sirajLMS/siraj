import type { ReactNode } from "react";
import type { NavItem } from "@/frontend/common/views/dashboard/types/dashboard";

/**
 * Props shared by both the mobile and desktop DashboardLayout variants.
 *
 * Dispatched by {@link DashboardLayout} (the common switcher) into the tier
 * variants via `ResponsiveViewSwitch`. The orchestrator
 * (`DashboardClientBridge`) is responsible for assembling these props from
 * the user profile + nav data; the variants consume them verbatim.
 */
export interface DashboardLayoutProps {
  readonly children: ReactNode;
  readonly sidebarItems: readonly NavItem[];
  readonly bottomNavItems: readonly NavItem[];
  readonly userName: string;
  readonly userEmail: string;
  readonly userRole: string;
  readonly roleLabel: string;
  readonly avatarUrl: string;
  readonly notificationCount: number;
  readonly sidebarWidth?: string;
  readonly navbarHeight?: string;
}
