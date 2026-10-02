"use client";

import { Box } from "@mui/material";
import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import { QuotaPageChrome } from "@/frontend/common/views/dashboard/billing/quota/tabs/QuotaPageChrome";
import { QuotaPagePanels } from "@/frontend/common/views/dashboard/billing/quota/tabs/QuotaPagePanels";
import type { QuotaTabsViewModel } from "@/frontend/common/views/dashboard/billing/quota/tabs/types";

const lazyShell = createLazyView<QuotaPageShellProps>(
  () =>
    import("@/frontend/mobile/views/dashboard/billing/quota/quotaPage.mobile").then(m => ({
      default: m.QuotaMobilePageShell,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/billing/quota/quotaPage.desktop").then(m => ({
      default: m.QuotaDesktopPageShell,
    }))
);

type QuotaPageShellProps = {
  readonly children: React.ReactNode;
};

export function QuotaPageView(viewModel: Readonly<QuotaTabsViewModel>) {
  return (
    <ResponsiveViewSwitch
      mobile={lazyShell.mobile}
      desktop={lazyShell.desktop}
      props={{
        children: (
          <>
            <QuotaPageChrome {...viewModel} />
            <Box
              sx={{
                mt: { xs: 2, md: 3 },
                display: "flex",
                flexDirection: "column",
                gap: { xs: 2, md: 3 },
              }}
            >
              <QuotaPagePanels activeTab={viewModel.activeTab} />
            </Box>
          </>
        ),
      }}
    />
  );
}
