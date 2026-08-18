"use client";

import { Box } from "@mui/material";
import type { ReactNode } from "react";
import { GenericTabNav } from "@/frontend/common/views/dashboard/components/GenericTabNav";
import { resolveActiveTabLabel } from "@/frontend/common/views/dashboard/lib/tabbedPane";
import type { ScheduleTrackingTabsViewModel } from "@/frontend/common/views/dashboard/schedule/tracking/tabs/useScheduleTrackingTabsViewModel";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui/container/page";

export function ScheduleTrackingDesktopPageShell({ children }: Readonly<{ readonly children: ReactNode }>) {
  return <DesktopPageContainer>{children}</DesktopPageContainer>;
}

export function ScheduleTrackingDesktopChrome({
  labels,
  activeTab,
  tabNavItems,
}: Readonly<ScheduleTrackingTabsViewModel>) {
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
