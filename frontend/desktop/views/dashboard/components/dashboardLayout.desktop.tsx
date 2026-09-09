"use client";

import { Box } from "@mui/material";
import { useCustomizeMode } from "@/frontend/common/hooks/useCustomizeMode";
import type { DashboardLayoutProps } from "@/frontend/common/views/dashboard/components/dashboardLayoutTypes";
import { NavbarStaticShell } from "@/frontend/common/views/dashboard/components/navbar/NavbarStaticShell";
import {
  CUSTOMIZE_SIDEBAR_WIDTH,
  CustomizeSidebarDesktop,
} from "@/frontend/desktop/views/dashboard/components/customize";
import { DashboardLayoutIsland } from "@/frontend/desktop/views/dashboard/components/dashboardLayoutIsland.desktop";
import { TopNavbarDesktop } from "@/frontend/desktop/views/dashboard/components/topNavbar.desktop";

export function DashboardLayoutDesktop({
  children,
  sidebarGroups,
  sidebarItems,
  userName,
  userEmail,
  userRole,
  roleLabel,
  appTitle,
  appLogoUrl,
  logoAriaLabel,
  avatarUrl,
  notificationCount,
  sidebarWidth = "260px",
  navbarHeight: _navbarHeight = "64px",
  initialSidebarOpen,
  hideSidebarNavigation = false,
}: Readonly<DashboardLayoutProps>) {
  const customizeMode = useCustomizeMode();

  return (
    <Box
      sx={{
        display: "flex",
        // `CustomizeModeShell` (the customization layout above this one)
        // bounds the shell height via `--dashboard-shell-height`; the 100vh
        // fallback keeps the dashboard full-height outside customize mode.
        minHeight: "var(--dashboard-shell-height, 100vh)",
        height: "var(--dashboard-shell-height, 100vh)",
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      {customizeMode ? <CustomizeSidebarDesktop /> : null}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          minWidth: 0,
          minHeight: 0,
          // While customize mode is on, the fixed navbar must sit beside the
          // in-flow customize sidebar instead of spanning the full viewport
          // width. `CustomizeModeShell` owns the shared vertical offset (top).
          ...(customizeMode && {
            "& .MuiAppBar-root": {
              insetInlineStart: CUSTOMIZE_SIDEBAR_WIDTH,
              width: `calc(100% - ${CUSTOMIZE_SIDEBAR_WIDTH}px)`,
            },
          }),
        }}
      >
        <NavbarStaticShell appTitle={appTitle} roleLabel={roleLabel} logoAriaLabel={logoAriaLabel} logoUrl={appLogoUrl}>
          <TopNavbarDesktop
            userName={userName}
            userEmail={userEmail}
            userRole={userRole}
            avatarUrl={avatarUrl}
            notificationCount={notificationCount}
          />
        </NavbarStaticShell>

        <Box
          sx={theme => ({
            display: "flex",
            flex: 1,
            minHeight: 0,
            pt: theme.layout.navbarHeight,
            boxSizing: "border-box",
          })}
        >
          <DashboardLayoutIsland
            sidebarGroups={sidebarGroups}
            sidebarItems={sidebarItems}
            sidebarWidth={sidebarWidth}
            initialSidebarOpen={initialSidebarOpen}
            userName={userName}
            avatarUrl={avatarUrl}
            hideSidebarNavigation={hideSidebarNavigation}
          >
            {children}
          </DashboardLayoutIsland>
        </Box>
      </Box>
    </Box>
  );
}
