"use client";

import { Box } from "@mui/material";
import type { ReactNode } from "react";
import type { BillingTabsViewModel } from "@/frontend/common/views/dashboard/billing/tabs/useBillingTabsViewModel";
import { GenericTabNav } from "@/frontend/common/views/dashboard/components/GenericTabNav";
import { resolveActiveTabLabel } from "@/frontend/common/views/dashboard/lib/tabbedPane";
import { MobilePageContainer, MobilePageHeader } from "@/frontend/mobile/components/ui";

export function BillingMobilePageShell({ children }: Readonly<{ readonly children: ReactNode }>) {
  return <MobilePageContainer>{children}</MobilePageContainer>;
}

export function BillingMobileChrome({ labels, activeTab, tabNavItems }: Readonly<BillingTabsViewModel>) {
  return (
    <>
      <MobilePageHeader
        title={labels.title}
        subtitle={labels.subtitle}
        breadcrumbOptions={{ currentTitle: resolveActiveTabLabel(activeTab, tabNavItems) }}
      />
      <Box sx={{ mt: 2 }}>
        <GenericTabNav activeTab={activeTab} tabs={tabNavItems} ariaLabel="Billing sections" />
      </Box>
    </>
  );
}
