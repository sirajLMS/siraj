import { Box } from "@mui/material";
import type { DashboardLayoutProps } from "@/frontend/common/views/dashboard/components/dashboardLayoutTypes";
import { NavbarStaticShell } from "@/frontend/common/views/dashboard/components/navbar/NavbarStaticShell";
import { DashboardLayoutIsland } from "@/frontend/desktop/views/dashboard/components/dashboardLayoutIsland.desktop";
import { TopNavbarDesktop } from "@/frontend/desktop/views/dashboard/components/topNavbar.desktop";

export function DashboardLayoutDesktop({
  children,
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
  navbarHeight = "64px",
}: Readonly<DashboardLayoutProps>) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh", height: "100vh", overflow: "hidden" }}>
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
        sx={{
          display: "flex",
          flex: 1,
          minHeight: 0,
          minWidth: 0,
          pt: navbarHeight,
          boxSizing: "border-box",
        }}
      >
        <DashboardLayoutIsland sidebarItems={sidebarItems} sidebarWidth={sidebarWidth}>
          {children}
        </DashboardLayoutIsland>
      </Box>
    </Box>
  );
}
