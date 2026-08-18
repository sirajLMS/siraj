"use client";

import { Box } from "@mui/material";
import type { ReactNode } from "react";
import { GenericTabNav } from "@/frontend/common/views/dashboard/components/GenericTabNav";
import type { FeedbackManageTabsViewModel } from "@/frontend/common/views/dashboard/feedback/tabs/useFeedbackManageTabsViewModel";
import { resolveActiveTabLabel } from "@/frontend/common/views/dashboard/lib/tabbedPane";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui/container/page";

export function FeedbackManageDesktopPageShell({ children }: Readonly<{ readonly children: ReactNode }>) {
  return <DesktopPageContainer>{children}</DesktopPageContainer>;
}

export function FeedbackManageDesktopChrome({ labels, activeTab, tabNavItems }: Readonly<FeedbackManageTabsViewModel>) {
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
