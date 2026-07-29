"use client";

import { Box } from "@mui/material";
import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import { PaymentCatalogsPageChrome } from "@/frontend/common/views/dashboard/admin/payment-catalogs/PaymentCatalogsPageChrome";
import { PaymentCatalogsTabPanels } from "@/frontend/common/views/dashboard/admin/payment-catalogs/PaymentCatalogsTabPanels";
import type { PaymentCatalogsTabsViewModel } from "@/frontend/common/views/dashboard/admin/payment-catalogs/tabs/usePaymentCatalogsTabsViewModel";

const lazyShell = createLazyView<{ readonly children: React.ReactNode }>(
  () =>
    import("@/frontend/mobile/views/dashboard/admin/payment-catalogs/paymentCatalogsParent.mobile").then(m => ({
      default: m.PaymentCatalogsMobilePageShell,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/admin/payment-catalogs/paymentCatalogsParent.desktop").then(m => ({
      default: m.PaymentCatalogsDesktopPageShell,
    }))
);

export function PaymentCatalogsView(viewModel: Readonly<PaymentCatalogsTabsViewModel>) {
  return (
    <ResponsiveViewSwitch
      mobile={lazyShell.mobile}
      desktop={lazyShell.desktop}
      props={{
        children: (
          <>
            <PaymentCatalogsPageChrome {...viewModel} />
            <Box sx={{ mt: { xs: 2, md: 3 }, display: "flex", flexDirection: "column", gap: { xs: 2, md: 3 } }}>
              <PaymentCatalogsTabPanels activeTab={viewModel.activeTab} />
            </Box>
          </>
        ),
      }}
    />
  );
}
