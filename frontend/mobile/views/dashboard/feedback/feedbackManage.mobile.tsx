"use client";

import { Box } from "@mui/material";
import type { ReactNode } from "react";
import { GenericTabNav } from "@/frontend/common/views/dashboard/components/GenericTabNav";
import type { FeedbackManageTabsViewModel } from "@/frontend/common/views/dashboard/feedback/tabs/useFeedbackManageTabsViewModel";
import { resolveActiveTabLabel } from "@/frontend/common/views/dashboard/lib/tabbedPane";
import { MobilePageContainer, MobilePageHeader } from "@/frontend/mobile/components/ui";

export function FeedbackManageMobilePageShell({ children }: Readonly<{ readonly children: ReactNode }>) {
  return <MobilePageContainer>{children}</MobilePageContainer>;
}

export function FeedbackManageMobileChrome({ labels, activeTab, tabNavItems }: Readonly<FeedbackManageTabsViewModel>) {
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
