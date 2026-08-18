"use client";

import { Box } from "@mui/material";
import type { ReactNode } from "react";
import { resolveActiveTabLabel } from "@/frontend/common/views/dashboard/lib/tabbedPane";
import { SettingsTabNav } from "@/frontend/common/views/dashboard/settings/SettingsTabNav";
import type { SettingsViewModel } from "@/frontend/common/views/dashboard/settings/useSettingsViewModel";
import { MobilePageContainer, MobilePageHeader } from "@/frontend/mobile/components/ui";

export function SettingsMobilePageShell({ children }: Readonly<{ readonly children: ReactNode }>) {
  return <MobilePageContainer>{children}</MobilePageContainer>;
}

export function SettingsMobileChrome({ labels, activeTab, tabNavItems }: Readonly<SettingsViewModel>) {
  return (
    <>
      <MobilePageHeader
        title={labels.title}
        subtitle={labels.subtitle}
        breadcrumbOptions={{ currentTitle: resolveActiveTabLabel(activeTab, tabNavItems) }}
      />
      <Box sx={{ mt: 2 }}>
        <SettingsTabNav activeTab={activeTab} tabs={tabNavItems} ariaLabel={labels.tabNavAriaLabel} />
      </Box>
    </>
  );
}
