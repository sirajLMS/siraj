"use client";

import { AddOutlined } from "@mui/icons-material";
import { Box } from "@mui/material";
import type { ReactNode } from "react";
import { GenericTabNav } from "@/frontend/common/views/dashboard/components/GenericTabNav";
import { resolveActiveTabLabel } from "@/frontend/common/views/dashboard/lib/tabbedPane";
import type { UsersDirectoryTabsViewModel } from "@/frontend/common/views/dashboard/users/directory/tabs/useUsersDirectoryTabsViewModel";
import { DesktopPageContainer, DesktopPageHeader, DesktopPrimaryPageAction } from "@/frontend/desktop/components/ui";

export function UsersDirectoryDesktopPageShell({ children }: Readonly<{ readonly children: ReactNode }>) {
  return <DesktopPageContainer>{children}</DesktopPageContainer>;
}

export function UsersDirectoryDesktopChrome({
  labels,
  activeTab,
  tabNavItems,
  canCreateUser,
  onCreateUser,
}: Readonly<UsersDirectoryTabsViewModel>) {
  return (
    <>
      <DesktopPageHeader
        title={labels.title}
        subtitle={labels.subtitle}
        breadcrumbOptions={{ currentTitle: resolveActiveTabLabel(activeTab, tabNavItems) }}
        actions={
          canCreateUser ? (
            <DesktopPrimaryPageAction startIcon={<AddOutlined />} onClick={onCreateUser}>
              {labels.createUserLabel}
            </DesktopPrimaryPageAction>
          ) : null
        }
      />
      <Box sx={{ mt: 3 }}>
        <GenericTabNav activeTab={activeTab} tabs={tabNavItems} ariaLabel={labels.tabNavAriaLabel} />
      </Box>
    </>
  );
}
