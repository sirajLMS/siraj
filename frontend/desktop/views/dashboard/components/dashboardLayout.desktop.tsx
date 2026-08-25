"use client";

import { Box } from "@mui/material";
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
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        // `CustomizeModeShell` (the customization layout above this one)
        // bounds the shell height via `--dashboard-shell-height`; the 100vh
        // fallback keeps the dashboard full-height outside customize mode.
        minHeight: "var(--dashboard-shell-height, 100vh)",
        height: "var(--dashboard-shell-height, 100vh)",
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
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
  );
}
