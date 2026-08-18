"use client";

import { AddOutlined } from "@mui/icons-material";
import { Box } from "@mui/material";
import type { ReactNode } from "react";
import { GenericTabNav } from "@/frontend/common/views/dashboard/components/GenericTabNav";
import { resolveActiveTabLabel } from "@/frontend/common/views/dashboard/lib/tabbedPane";
import type { UsersDirectoryTabsViewModel } from "@/frontend/common/views/dashboard/users/directory/tabs/useUsersDirectoryTabsViewModel";
import { MobilePageContainer, MobilePageHeader, MobilePrimaryPageAction } from "@/frontend/mobile/components/ui";

export function UsersDirectoryMobilePageShell({ children }: Readonly<{ readonly children: ReactNode }>) {
  return <MobilePageContainer>{children}</MobilePageContainer>;
}

export function UsersDirectoryMobileChrome({
  labels,
  activeTab,
  tabNavItems,
  canCreateUser,
  onCreateUser,
}: Readonly<UsersDirectoryTabsViewModel>) {
  return (
    <>
      <MobilePageHeader
        title={labels.title}
        subtitle={labels.subtitle}
        breadcrumbOptions={{ currentTitle: resolveActiveTabLabel(activeTab, tabNavItems) }}
        actions={
          canCreateUser ? (
            <MobilePrimaryPageAction startIcon={<AddOutlined />} onClick={onCreateUser}>
              {labels.createUserLabel}
            </MobilePrimaryPageAction>
          ) : null
        }
      />
      <Box sx={{ mt: 2 }}>
        <GenericTabNav activeTab={activeTab} tabs={tabNavItems} ariaLabel={labels.tabNavAriaLabel} />
      </Box>
    </>
  );
}
