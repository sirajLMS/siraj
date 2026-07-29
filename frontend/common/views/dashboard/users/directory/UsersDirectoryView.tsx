"use client";

import { Box } from "@mui/material";
import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import type { UsersDirectoryTabsViewModel } from "@/frontend/common/views/dashboard/users/directory/tabs/useUsersDirectoryTabsViewModel";
import { UsersDirectoryPageChrome } from "@/frontend/common/views/dashboard/users/directory/UsersDirectoryPageChrome";
import { UsersDirectoryTabPanels } from "@/frontend/common/views/dashboard/users/directory/UsersDirectoryTabPanels";

const lazyShell = createLazyView<{ readonly children: React.ReactNode }>(
  () =>
    import("@/frontend/mobile/views/dashboard/users/directory/usersDirectory.mobile").then(m => ({
      default: m.UsersDirectoryMobilePageShell,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/users/directory/usersDirectory.desktop").then(m => ({
      default: m.UsersDirectoryDesktopPageShell,
    }))
);

export function UsersDirectoryView(viewModel: Readonly<UsersDirectoryTabsViewModel>) {
  return (
    <ResponsiveViewSwitch
      mobile={lazyShell.mobile}
      desktop={lazyShell.desktop}
      props={{
        children: (
          <>
            <UsersDirectoryPageChrome {...viewModel} />
            <Box sx={{ mt: { xs: 2, md: 3 }, display: "flex", flexDirection: "column", gap: { xs: 2, md: 3 } }}>
              <UsersDirectoryTabPanels activeTab={viewModel.activeTab} />
            </Box>
          </>
        ),
      }}
    />
  );
}
