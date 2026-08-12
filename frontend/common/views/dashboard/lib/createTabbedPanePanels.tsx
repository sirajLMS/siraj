"use client";

import { Box } from "@mui/material";
import { type ComponentType, Suspense } from "react";
import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import type { PAGE_PERMISSIONS } from "@/frontend/common/types/page-permissions.types";
import { TabPanelFallback } from "@/frontend/common/views/dashboard/lib/TabPanelFallback";

/**
 * Generic tab pane panels — absorbs shared logic from per-domain
 * TabPanels files (PaymentCatalogs, Billing, ScheduleTracking,
 * FeedbackManage, UsersDirectory). Usage:
 *
 *   export const BillingTabPanels = createTabbedPanePanels<BillingTabId>({
 *     useVisitedTabs: () => useBillingTabsStore(s => s.visitedTabs),
 *     ariaIdPrefix: "billing",
 *     panels: [
 *       { id: "overview", permissions: PAGE_PERMISSIONS.billingOverview, Component: LazyOverviewTab },
 *       { id: "invoices", permissions: PAGE_PERMISSIONS.billingInvoices, Component: LazyInvoicesTab },
 *       ...
 *     ],
 *   });
 *
 * Visited tabs stay mounted without `display:none` (so DataGrid widths
 * persist) — the active panel is rendered normally, inactive ones are
 * hidden via `visibility:hidden + height:0 + position:absolute`.
 */

export type PagePermission = (typeof PAGE_PERMISSIONS)[keyof typeof PAGE_PERMISSIONS];

export interface TabbedPaneDefinition<TabId extends string> {
  readonly id: TabId;
  /** Already-lazy component (via `next/dynamic`). Rendered when this tab has been visited. */
  readonly Component: ComponentType;
  /**
   * Optional inline permission gate — when it returns false the panel is
   * suppressed (renders null) without unmounting previously-visited state.
   * Use this when the panel must be lazily rendered but also gated by a
   * permission that may not match the permission filter applied to the tab
   * nav (e.g. cross-cutting dashboard-level permissions).
   */
  readonly canRender?: () => boolean;
  /**
   * Optional permission key from `PAGE_PERMISSIONS` — when provided, the
   * panel content is wrapped in `<RequirePermission>` with `fallback={null}`.
   */
  readonly permissions?: PagePermission;
}

interface CreateTabbedPanePanelsOptions<TabId extends string> {
  /**
   * Per-domain "visitedTabs" store hook. The caller passes a function that
   * reads the typed `visitedTabs` record out of their per-domain Zustand
   * store (created via `createTabbedPaneStore`).
   */
  readonly useVisitedTabs: () => Record<TabId, boolean>;
  readonly panels: readonly TabbedPaneDefinition<TabId>[];
  /**
   * Prefix for aria id generation. When provided, ids become
   * `{ariaIdPrefix}-tabpanel-{id}` and `{ariaIdPrefix}-tab-{id}`.
   * Defaults to `"tabpanel"` which produces `tabpanel-{id}` / `tabpanel-tab-{id}`.
   */
  readonly ariaIdPrefix?: string;
}

function getTabPanelSx(isActive: boolean) {
  if (isActive) {
    return {
      position: "relative" as const,
      width: "100%",
      visibility: "visible" as const,
      overflow: "visible" as const,
      pointerEvents: "auto" as const,
    };
  }

  return {
    position: "absolute" as const,
    top: 0,
    left: 0,
    width: "100%",
    visibility: "hidden" as const,
    height: 0,
    overflow: "hidden" as const,
    pointerEvents: "none" as const,
  };
}

export interface TabbedPanePanelsProps<TabId extends string> {
  readonly activeTab: TabId;
}

export function createTabbedPanePanels<TabId extends string>(
  options: CreateTabbedPanePanelsOptions<TabId>
): ComponentType<TabbedPanePanelsProps<TabId>> {
  const { useVisitedTabs, panels, ariaIdPrefix = "tabpanel" } = options;
  const panelIdPrefix = `${ariaIdPrefix}-tabpanel`;
  const tabIdPrefix = `${ariaIdPrefix}-tab`;

  function TabbedPanePanels({ activeTab }: Readonly<TabbedPanePanelsProps<TabId>>) {
    const visitedTabs = useVisitedTabs();

    return (
      <Box sx={{ position: "relative", width: "100%" }}>
        {panels.map(({ id, Component, canRender, permissions }) => {
          if (!visitedTabs[id]) {
            return null;
          }
          if (canRender && !canRender()) {
            return null;
          }

          const isActive = activeTab === id;

          return (
            <Box
              key={id}
              role="tabpanel"
              id={`${panelIdPrefix}-${id}`}
              aria-labelledby={`${tabIdPrefix}-${id}`}
              aria-hidden={!isActive}
              sx={getTabPanelSx(isActive)}
            >
              <Suspense fallback={<TabPanelFallback />}>
                {permissions ? (
                  <RequirePermission permissions={permissions} fallback={null}>
                    <Component />
                  </RequirePermission>
                ) : (
                  <Component />
                )}
              </Suspense>
            </Box>
          );
        })}
      </Box>
    );
  }

  return TabbedPanePanels;
}
