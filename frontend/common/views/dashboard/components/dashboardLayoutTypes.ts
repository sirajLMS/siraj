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
  /**
   * Localized application title (e.g. "Siraj LMS"). Resolved server-side by
   * the layout container from `dashboard.core.layout.appTitle` and threaded
   * through the bridge+switcher so the desktop Server Component can render
   * `<NavbarStaticShell appTitle={appTitle} />` before hydration.
   */
  readonly appTitle: string;
  /**
   * Accessibility label for the brand logo icon. Currently reused as the
   * app title for parity with the existing navbar chrome.
   */
  readonly logoAriaLabel: string;
  readonly avatarUrl: string;
  readonly notificationCount: number;
  readonly sidebarWidth?: string;
  readonly navbarHeight?: string;
}
