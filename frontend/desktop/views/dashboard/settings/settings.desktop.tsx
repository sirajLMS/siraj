"use client";

import { Box } from "@mui/material";
import type { ReactNode } from "react";
import { SettingsTabNav } from "@/frontend/common/views/dashboard/settings/SettingsTabNav";
import type { SettingsViewModel } from "@/frontend/common/views/dashboard/settings/useSettingsViewModel";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui/container/page";

export function SettingsDesktopPageShell({ children }: Readonly<{ readonly children: ReactNode }>) {
  return <DesktopPageContainer>{children}</DesktopPageContainer>;
}

export function SettingsDesktopChrome({ labels, activeTab, tabNavItems }: Readonly<SettingsViewModel>) {
  return (
    <>
      <DesktopPageHeader title={labels.title} subtitle={labels.subtitle} />
      <Box sx={{ mt: 3 }}>
        <SettingsTabNav activeTab={activeTab} tabs={tabNavItems} />
      </Box>
    </>
  );
}
