"use client";

import { Box } from "@mui/material";
import { type ReactNode, useEffect, useRef } from "react";
import { useFxLiveRefresh } from "@/frontend/common/hooks/useFxLiveRefresh";
import type { DashboardLayoutProps } from "@/frontend/common/views/dashboard/components/dashboardLayoutTypes";
import { FxStaleBanner } from "@/frontend/common/views/dashboard/components/FxStaleBanner";
import { getActiveNavKey } from "@/frontend/common/views/dashboard/lib/getDashboardLayoutData";
import { SidebarDesktop } from "@/frontend/desktop/views/dashboard/components/sidebar.desktop";
import { TopNavbarDesktop } from "@/frontend/desktop/views/dashboard/components/topNavbar.desktop";
import { usePathname } from "@/shared/i18n/navigation";

function DesktopMainScrollArea({ children }: { readonly children: ReactNode }) {
  const mainRef = useRef<HTMLElement>(null);
  useFxLiveRefresh();

  useEffect(() => {
    mainRef.current?.scrollTo(0, 0);
  }, []);

  return (
    <Box
      component="main"
      ref={mainRef}
      sx={theme => ({
        flexGrow: 1,
        minWidth: 0,
        minHeight: 0,
        overflowY: "auto",
        overscrollBehavior: "contain",
        backgroundColor: theme.palette.background.default,
        pb: 0,
      })}
    >
      <Box
        sx={theme => ({
          px: theme.layout.pageMargin,
          py: theme.layout.pageMargin,
        })}
      >
        <FxStaleBanner />
        {children}
      </Box>
    </Box>
  );
}

export function DashboardLayoutDesktop({
  children,
  sidebarItems,
  userName,
  userEmail,
  userRole,
  roleLabel,
  avatarUrl,
  notificationCount,
  sidebarWidth = "260px",
  navbarHeight = "64px",
}: Readonly<DashboardLayoutProps>) {
  const pathname = usePathname();
  const activeNavKey = getActiveNavKey(pathname, sidebarItems);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh", height: "100vh", overflow: "hidden" }}>
      <TopNavbarDesktop
        userName={userName}
        userEmail={userEmail}
        userRole={userRole}
        roleLabel={roleLabel}
        avatarUrl={avatarUrl}
        notificationCount={notificationCount}
      />

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
        <SidebarDesktop navItems={sidebarItems} activeKey={activeNavKey} sidebarWidth={sidebarWidth} />

        <DesktopMainScrollArea>{children}</DesktopMainScrollArea>
      </Box>
    </Box>
  );
}
