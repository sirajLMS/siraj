import type { ReactNode } from "react";
import type { NavGroup, NavItem } from "@/frontend/common/views/dashboard/types/dashboard";

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
  /**
   * Filtered, permission-respecting sidebar groups. Each tier's sidebar shell
   * renders them as collapsible sections (desktop permanent + mobile drawer);
   * the mobile bottom nav ignores them entirely. Empty groups are dropped
   * upstream by `getNavItemsForPermissions` so portals never see empty
   * headers.
   */
  readonly sidebarGroups: readonly NavGroup[];
  readonly sidebarItems: readonly NavItem[];
  readonly bottomNavItems: readonly NavItem[];
  readonly userName: string;
  readonly userEmail: string;
  readonly userRole: string;
  readonly roleLabel: string;
  /**
   * Application title for the navbar brand. Resolved server-side: the
   * published appearance `siteName` when an appearance row exists,
   * otherwise the localized `dashboard.core.layout.appTitle`. Threaded
   * through the bridge+switcher so the desktop shell can render
   * `<NavbarStaticShell appTitle={appTitle} />` before hydration.
   */
  readonly appTitle: string;
  /**
   * Published brand logo URL (appearance settings). Rendered in the brand
   * block instead of the default icon when set; `null`/absent keeps the
   * default icon.
   */
  readonly appLogoUrl?: string | null;
  /**
   * Accessibility label for the brand logo icon. Currently reused as the
   * app title for parity with the existing navbar chrome.
   */
  readonly logoAriaLabel: string;
  readonly avatarUrl: string;
  readonly notificationCount: number;
  readonly sidebarWidth?: string;
  readonly navbarHeight?: string;
  readonly initialSidebarOpen?: boolean;
  /** When true, hide sidebar, drawer, and bottom nav (teacher profile completion gate). */
  readonly hideSidebarNavigation?: boolean;
}
