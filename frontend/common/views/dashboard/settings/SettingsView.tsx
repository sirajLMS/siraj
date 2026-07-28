"use client";

import { Box } from "@mui/material";
import type { ReactNode } from "react";
import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import { SettingsPageChrome } from "@/frontend/common/views/dashboard/settings/SettingsPageChrome";
import { SettingsTabPanels } from "@/frontend/common/views/dashboard/settings/SettingsTabPanels";
import type { SettingsViewModel } from "@/frontend/common/views/dashboard/settings/useSettingsViewModel";

type SettingsPageShellProps = {
  readonly children: ReactNode;
};

const lazyShell = createLazyView<SettingsPageShellProps>(
  () =>
    import("@/frontend/mobile/views/dashboard/settings/settings.mobile").then(m => ({
      default: m.SettingsMobilePageShell,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/settings/settings.desktop").then(m => ({
      default: m.SettingsDesktopPageShell,
    }))
);

export function SettingsView(viewModel: Readonly<SettingsViewModel>) {
  return (
    <ResponsiveViewSwitch
      mobile={lazyShell.mobile}
      desktop={lazyShell.desktop}
      props={{
        children: (
          <>
            <SettingsPageChrome {...viewModel} />
            <Box
              sx={{
                mt: { xs: 2, md: 3 },
                display: "flex",
                flexDirection: "column",
                gap: { xs: 2, md: 3 },
              }}
            >
              <SettingsTabPanels activeTab={viewModel.activeTab} />
            </Box>
          </>
        ),
      }}
    />
  );
}

export type { SettingsViewModel };
