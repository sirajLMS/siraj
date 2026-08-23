"use client";

import { Box } from "@mui/material";
import { useCustomizeMode } from "@/frontend/common/hooks/useCustomizeMode";
import { CustomizeOverlay } from "@/frontend/common/views/dashboard/components/customize/CustomizeOverlay";
import type { DashboardLayoutProps } from "@/frontend/common/views/dashboard/components/dashboardLayoutTypes";
import { NavbarStaticShell } from "@/frontend/common/views/dashboard/components/navbar/NavbarStaticShell";
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
    <CustomizeOverlay>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
          height: "100vh",
          overflow: "hidden",
          boxSizing: "border-box",
          ...(customizeMode && {
            paddingTop: "48px",
            // Push the fixed AppBar (NavbarStaticShell) down below the
            // 48px CustomizeToolbar so it doesn't overlap. The AppBar's
            // default `top: 0` (from `.MuiAppBar-positionFixed`) is
            // overridden here via descendant-selector specificity.
            "& .MuiAppBar-root": {
              top: "48px",
            },
          }),
        }}
      >
        {customizeMode ? <CustomizeOverlay.Toolbar /> : null}
        <NavbarStaticShell appTitle={appTitle} roleLabel={roleLabel} logoAriaLabel={logoAriaLabel}>
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
          {customizeMode ? <CustomizeOverlay.Sidebar /> : null}
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
    </CustomizeOverlay>
  );
}
