"use client";

import { Box } from "@mui/material";
import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import { BillingPageChrome } from "@/frontend/common/views/dashboard/billing/BillingPageChrome";
import { BillingTabPanels } from "@/frontend/common/views/dashboard/billing/BillingTabPanels";
import type { BillingTabsViewModel } from "@/frontend/common/views/dashboard/billing/tabs/useBillingTabsViewModel";

const lazyShell = createLazyView<BillingPageShellProps>(
  () =>
    import("@/frontend/mobile/views/dashboard/billing/billing.mobile").then(m => ({
      default: m.BillingMobilePageShell,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/billing/billing.desktop").then(m => ({
      default: m.BillingDesktopPageShell,
    }))
);

type BillingPageShellProps = {
  readonly children: React.ReactNode;
};

export function BillingView(viewModel: Readonly<BillingTabsViewModel>) {
  return (
    <ResponsiveViewSwitch
      mobile={lazyShell.mobile}
      desktop={lazyShell.desktop}
      props={{
        children: (
          <>
            <BillingPageChrome {...viewModel} />
            <Box
              sx={{
                mt: { xs: 2, md: 3 },
                display: "flex",
                flexDirection: "column",
                gap: { xs: 2, md: 3 },
              }}
            >
              <BillingTabPanels activeTab={viewModel.activeTab} />
            </Box>
          </>
        ),
      }}
    />
  );
}
