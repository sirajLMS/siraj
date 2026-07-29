"use client";

import { Box } from "@mui/material";
import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import { PeopleDirectoryPageChrome } from "@/frontend/common/views/dashboard/people/PeopleDirectoryPageChrome";
import { PeopleDirectoryTabPanels } from "@/frontend/common/views/dashboard/people/PeopleDirectoryTabPanels";
import type { PeopleDirectoryTabsViewModel } from "@/frontend/common/views/dashboard/people/tabs/usePeopleDirectoryTabsViewModel";

const lazyShell = createLazyView<{ readonly children: React.ReactNode }>(
  () =>
    import("@/frontend/mobile/views/dashboard/people/peopleDirectory.mobile").then(m => ({
      default: m.PeopleDirectoryMobilePageShell,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/people/peopleDirectory.desktop").then(m => ({
      default: m.PeopleDirectoryDesktopPageShell,
    }))
);

export function PeopleDirectoryView(viewModel: Readonly<PeopleDirectoryTabsViewModel>) {
  return (
    <ResponsiveViewSwitch
      mobile={lazyShell.mobile}
      desktop={lazyShell.desktop}
      props={{
        children: (
          <>
            <PeopleDirectoryPageChrome {...viewModel} />
            <Box sx={{ mt: { xs: 2, md: 3 }, display: "flex", flexDirection: "column", gap: { xs: 2, md: 3 } }}>
              <PeopleDirectoryTabPanels activeTab={viewModel.activeTab} />
            </Box>
          </>
        ),
      }}
    />
  );
}
