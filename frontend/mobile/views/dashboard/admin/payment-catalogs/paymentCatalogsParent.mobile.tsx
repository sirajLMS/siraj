"use client";

import { Box } from "@mui/material";
import type { ReactNode } from "react";
import type { PaymentCatalogsTabsViewModel } from "@/frontend/common/views/dashboard/admin/payment-catalogs/tabs/usePaymentCatalogsTabsViewModel";
import { GenericTabNav } from "@/frontend/common/views/dashboard/components/GenericTabNav";
import { resolveActiveTabLabel } from "@/frontend/common/views/dashboard/lib/tabbedPane";
import { MobilePageContainer, MobilePageHeader } from "@/frontend/mobile/components/ui";

export function PaymentCatalogsMobilePageShell({ children }: Readonly<{ readonly children: ReactNode }>) {
  return <MobilePageContainer>{children}</MobilePageContainer>;
}

export function PaymentCatalogsMobileChrome({
  labels,
  activeTab,
  tabNavItems,
}: Readonly<PaymentCatalogsTabsViewModel>) {
  return (
    <>
      <MobilePageHeader
        title={labels.title}
        subtitle={labels.subtitle}
        breadcrumbOptions={{ currentTitle: resolveActiveTabLabel(activeTab, tabNavItems) }}
      />
      <Box sx={{ mt: 2 }}>
        <GenericTabNav activeTab={activeTab} tabs={tabNavItems} ariaLabel={labels.tabNavAriaLabel} />
      </Box>
    </>
  );
}
