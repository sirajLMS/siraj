"use client";

import { Box } from "@mui/material";
import type { ReactNode } from "react";
import { SettingsTabNav } from "@/frontend/common/views/dashboard/settings/SettingsTabNav";
import type { SettingsViewModel } from "@/frontend/common/views/dashboard/settings/useSettingsViewModel";
import { MobilePageContainer, MobilePageHeader } from "@/frontend/mobile/components/ui";

export function SettingsMobilePageShell({ children }: Readonly<{ readonly children: ReactNode }>) {
  return <MobilePageContainer>{children}</MobilePageContainer>;
}

export function SettingsMobileChrome({ labels, activeTab, tabNavItems }: Readonly<SettingsViewModel>) {
  return (
    <>
      <MobilePageHeader title={labels.title} subtitle={labels.subtitle} />
      <Box sx={{ mt: 2 }}>
        <SettingsTabNav activeTab={activeTab} tabs={tabNavItems} />
      </Box>
    </>
  );
}
