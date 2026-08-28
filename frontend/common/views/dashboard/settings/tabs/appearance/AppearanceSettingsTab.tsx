"use client";

import { Box, Typography } from "@mui/material";
import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { createLazyView } from "@/frontend/common/components/ui/container/createLazyView";
import { ResponsiveViewSwitch } from "@/frontend/common/components/ui/container/ResponsiveViewSwitch";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql";
import { useAppearanceSettingsViewModel } from "@/frontend/common/views/dashboard/settings/tabs/appearance/useAppearanceSettingsViewModel";
import type { AppearanceSettingsViewModel } from "@/frontend/common/views/dashboard/settings/types/appearanceSettings.types";

const lazyViews = createLazyView<AppearanceSettingsViewModel>(
  () =>
    import("@/frontend/mobile/views/dashboard/settings/tabs/appearance/appearanceSettingsTab.mobile").then(m => ({
      default: m.AppearanceSettingsTabMobileView,
    })),
  () =>
    import("@/frontend/desktop/views/dashboard/settings/tabs/appearance/appearanceSettingsTab.desktop").then(m => ({
      default: m.AppearanceSettingsTabDesktopView,
    }))
);

/**
 * AppearanceSettingsTab — switcher for the site-appearance settings tab.
 *
 * Builds the ViewModel (draft state, save/publish/reset/export actions) and
 * renders the tier-appropriate view through `ResponsiveViewSwitch`. The
 * `SettingsAppearanceManage` gate is preserved at the tab root: users
 * without the permission see a translated notice instead of the panel.
 */
export function AppearanceSettingsTab() {
  const viewModel = useAppearanceSettingsViewModel();

  return (
    <RequirePermission
      permissions={AppPermission.SettingsAppearanceManage}
      fallback={
        <Box sx={{ py: 4 }}>
          <Typography sx={theme => ({ typography: "bodyMd", color: theme.palette.text.secondary })}>
            {viewModel.labels.noPermission}
          </Typography>
        </Box>
      }
    >
      <ResponsiveViewSwitch mobile={lazyViews.mobile} desktop={lazyViews.desktop} props={viewModel} />
    </RequirePermission>
  );
}
