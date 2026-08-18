"use client";

import { Box } from "@mui/material";
import type { ReactNode } from "react";
import { GenericTabNav } from "@/frontend/common/views/dashboard/components/GenericTabNav";
import { resolveActiveTabLabel } from "@/frontend/common/views/dashboard/lib/tabbedPane";
import type { ScheduleTrackingTabsViewModel } from "@/frontend/common/views/dashboard/schedule/tracking/tabs/useScheduleTrackingTabsViewModel";
import { MobilePageContainer, MobilePageHeader } from "@/frontend/mobile/components/ui";

export function ScheduleTrackingMobilePageShell({ children }: Readonly<{ readonly children: ReactNode }>) {
  return <MobilePageContainer>{children}</MobilePageContainer>;
}

export function ScheduleTrackingMobileChrome({
  labels,
  activeTab,
  tabNavItems,
}: Readonly<ScheduleTrackingTabsViewModel>) {
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
