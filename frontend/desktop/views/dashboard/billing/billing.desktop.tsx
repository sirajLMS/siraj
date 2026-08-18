"use client";

import { Box } from "@mui/material";
import type { ReactNode } from "react";
import type { BillingTabsViewModel } from "@/frontend/common/views/dashboard/billing/tabs/useBillingTabsViewModel";
import { GenericTabNav } from "@/frontend/common/views/dashboard/components/GenericTabNav";
import { resolveActiveTabLabel } from "@/frontend/common/views/dashboard/lib/tabbedPane";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui/container/page";

export function BillingDesktopPageShell({ children }: Readonly<{ readonly children: ReactNode }>) {
  return <DesktopPageContainer>{children}</DesktopPageContainer>;
}

export function BillingDesktopChrome({ labels, activeTab, tabNavItems }: Readonly<BillingTabsViewModel>) {
  return (
    <>
      <DesktopPageHeader
        title={labels.title}
        subtitle={labels.subtitle}
        breadcrumbOptions={{ currentTitle: resolveActiveTabLabel(activeTab, tabNavItems) }}
      />
      <Box sx={{ mt: 3 }}>
        <GenericTabNav activeTab={activeTab} tabs={tabNavItems} ariaLabel={labels.tabNavAriaLabel} />
      </Box>
    </>
  );
}
