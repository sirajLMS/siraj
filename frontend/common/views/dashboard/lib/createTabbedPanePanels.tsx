"use client";

import { Box } from "@mui/material";
import { type ComponentType, Suspense } from "react";
import { TabPanelFallback } from "@/frontend/common/views/dashboard/lib/TabPanelFallback";

/**
 * Generic tab pane panels — replicates `SettingsTabPanels` for any tabbed
 * parent page. Usage:
 *
 *   export const BillingTabPanels = createTabbedPanePanels<BillingTabId>({
 *     useVisitedTabs: () => useBillingTabsStore(s => s.visitedTabs),
 *     markTabVisited: useBillingTabsStore.getState().markTabVisited, // optional
 *     panels: [
 *       { id: "overview", Component: LazyOverviewTab },
 *       { id: "invoices", Component: LazyInvoicesTab },
 *       ...
 *     ],
 *   });
 *
 * Visited tabs stay mounted without `display:none` (so DataGrid widths
 * persist) — the active panel is rendered normally, inactive ones are
 * hidden via `visibility:hidden + height:0 + position:absolute`.
 *
 * The `markTabVisited` action is wired by the Caller's ViewModel hook (it
 * already knows the active tab from URL resolution), not by this component.
 */

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
}

interface CreateTabbedPanePanelsOptions<TabId extends string> {
  /**
   * Per-domain "visitedTabs" store hook. The caller passes a function that
   * reads the typed `visitedTabs` record out of their per-domain Zustand
   * store (created via `createTabbedPaneStore`). This factory wires it into
   * a `useState`-backed subscriber via the standard React hook contract.
   */
  readonly useVisitedTabs: () => Record<TabId, boolean>;
  readonly panels: readonly TabbedPaneDefinition<TabId>[];
  /** Optional aria prefix for tabpanel ids — defaults to "tabpanel". */
  readonly ariaPrefix?: string;
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
  const { useVisitedTabs, panels, ariaPrefix = "tabpanel" } = options;

  function TabbedPanePanels({ activeTab }: Readonly<TabbedPanePanelsProps<TabId>>) {
    const visitedTabs = useVisitedTabs();

    return (
      <Box sx={{ position: "relative", width: "100%" }}>
        {panels.map(({ id, Component, canRender }) => {
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
              id={`${ariaPrefix}-${id}`}
              aria-labelledby={`${ariaPrefix}-tab-${id}`}
              aria-hidden={!isActive}
              sx={getTabPanelSx(isActive)}
            >
              <Suspense fallback={<TabPanelFallback />}>
                <Component />
              </Suspense>
            </Box>
          );
        })}
      </Box>
    );
  }

  return TabbedPanePanels;
}
