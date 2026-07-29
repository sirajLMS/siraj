"use client";

import { Box } from "@mui/material";
import type { ComponentType, ReactNode } from "react";
import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import { GenericTabNav } from "@/frontend/common/views/dashboard/components/GenericTabNav";
import type { TabbedPaneViewModel } from "@/frontend/common/views/dashboard/lib/tabbedPane";

/**
 * Generic tabbed-parent "view" — replicates the `SettingsView` skeleton for
 * any tabbed parent page. Caller composes:
 *
 *   export function BillingView(viewModel: BillingTabsViewModel) {
 *     return (
 *       <TabbedPaneView
 *         viewModel={viewModel}
 *         chrome={BillingPageChrome}
 *         panels={<BillingTabPanels activeTab={viewModel.activeTab} />}
 *       />
 *     );
 *   }
 *
 * The Chrome component (per-tier) handles the page shell + the title/
 * subtitle row; the panels are rendered below. The shell is wrapped via
 * the standard `ResponsiveViewSwitch` + `createLazyView` lazy tier split.
 *
 * `Chrome` may be omitted (defaults to a null chrome) when the caller just
 * wants the tab nav + panels.
 */

interface TabbedPaneViewShellProps {
  readonly children: ReactNode;
}

interface TabbedPaneViewProps<TabId extends string, Labels> {
  readonly viewModel: TabbedPaneViewModel<TabId, Labels>;
  /** Lazy tier-aware page shell (mobile/desktop). May be omitted; uses simple stack. */
  readonly lazyShell?: ReturnType<typeof createLazyView<TabbedPaneViewShellProps>>;
  /** Chrome rendered ABOVE the tab nav (title/subtitle). Default = null. */
  readonly chrome?: ReactNode;
  /** Panels rendered BELOW the tab nav. Required. */
  readonly panels: ReactNode;
  /** Optional ariaLabel passed to `<GenericTabNav>` (mobile tablist hint). */
  readonly ariaLabel?: string;
}

const noopShell = createLazyView<TabbedPaneViewShellProps>(
  () =>
    import("@/frontend/mobile/views/dashboard/lib/tabbedPaneShell.mobile").then(m => ({
      default: m.TabbedPaneMobileShell,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/lib/tabbedPaneShell.desktop").then(m => ({
      default: m.TabbedPaneDesktopShell,
    }))
);

function MaybeChrome({ chrome }: Readonly<{ readonly chrome?: ReactNode }>) {
  if (!chrome) {
    return null;
  }
  return <>{chrome}</>;
}

export function TabbedPaneView<TabId extends string, Labels>({
  viewModel,
  lazyShell,
  chrome,
  panels,
  ariaLabel,
}: Readonly<TabbedPaneViewProps<TabId, Labels>>) {
  const shell = lazyShell ?? noopShell;

  return (
    <ResponsiveViewSwitch
      mobile={shell.mobile as ComponentType<TabbedPaneViewShellProps>}
      desktop={shell.desktop as ComponentType<TabbedPaneViewShellProps>}
      props={{
        children: (
          <>
            <MaybeChrome chrome={chrome} />
            <Box sx={{ mt: { xs: 2, md: 3 } }}>
              <GenericTabNav activeTab={viewModel.activeTab} tabs={viewModel.tabNavItems} ariaLabel={ariaLabel} />
            </Box>
            <Box
              sx={{
                mt: { xs: 2, md: 3 },
                display: "flex",
                flexDirection: "column",
                gap: { xs: 2, md: 3 },
              }}
            >
              {panels}
            </Box>
          </>
        ),
      }}
    />
  );
}
