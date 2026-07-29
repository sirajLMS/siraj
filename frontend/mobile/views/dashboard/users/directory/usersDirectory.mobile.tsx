"use client";

import { Box } from "@mui/material";
import type { ReactNode } from "react";
import { GenericTabNav } from "@/frontend/common/views/dashboard/components/GenericTabNav";
import { resolveActiveTabLabel } from "@/frontend/common/views/dashboard/lib/tabbedPane";
import type { UsersDirectoryTabsViewModel } from "@/frontend/common/views/dashboard/users/directory/tabs/useUsersDirectoryTabsViewModel";
import { MobilePageContainer, MobilePageHeader } from "@/frontend/mobile/components/ui";

export function UsersDirectoryMobilePageShell({ children }: Readonly<{ readonly children: ReactNode }>) {
  return <MobilePageContainer>{children}</MobilePageContainer>;
}

export function UsersDirectoryMobileChrome({ labels, activeTab, tabNavItems }: Readonly<UsersDirectoryTabsViewModel>) {
  return (
    <>
      <MobilePageHeader
        title={labels.title}
        subtitle={labels.subtitle}
        breadcrumbOptions={{ currentTitle: resolveActiveTabLabel(activeTab, tabNavItems) }}
      />
      <Box sx={{ mt: 2 }}>
        <GenericTabNav activeTab={activeTab} tabs={tabNavItems} ariaLabel="Users directory sections" />
      </Box>
    </>
  );
}
