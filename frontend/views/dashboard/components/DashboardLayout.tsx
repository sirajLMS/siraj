"use client";

import { Box } from "@mui/material";
import type { ReactNode } from "react";
import type { NavItem } from "@/frontend/views/dashboard/types/dashboard";
import { BottomNavbar } from "./BottomNavbar";
import { Sidebar } from "./Sidebar";
import { TopNavbar } from "./TopNavbar";

interface DashboardLayoutProps {
  readonly children: ReactNode;
  readonly sidebarItems: readonly NavItem[];
  readonly bottomNavItems: readonly NavItem[];
  readonly activeNavKey: string;
  readonly userName: string;
  readonly userEmail: string;
  readonly userRole: string;
  readonly roleLabel: string;
  readonly avatarUrl: string;
  readonly notificationCount: number;
  readonly sidebarWidth?: string;
  readonly navbarHeight?: string;
}

export function DashboardLayout({
  children,
  sidebarItems,
  bottomNavItems,
  activeNavKey,
  userName,
  userEmail,
  userRole,
  roleLabel,
  avatarUrl,
  notificationCount,
  sidebarWidth = "260px",
  navbarHeight = "64px",
}: DashboardLayoutProps) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh", height: "100vh" }}>
      <TopNavbar
        userName={userName}
        userEmail={userEmail}
        userRole={userRole}
        roleLabel={roleLabel}
        avatarUrl={avatarUrl}
        notificationCount={notificationCount}
      />

      <Box sx={{ display: "flex", flexGrow: 1, mt: navbarHeight, height: "100%", minWidth: 0 }}>
        <Sidebar navItems={sidebarItems} activeKey={activeNavKey} sidebarWidth={sidebarWidth} />

        <Box
          component="main"
          sx={theme => ({
            flexGrow: 1,
            minWidth: 0,
            pb: 10,
            minHeight: `calc(100vh - ${navbarHeight})`,
            backgroundColor: theme.palette.background.default,
            height: "100%",
            overflowY: "auto",
          })}
        >
          <Box sx={{ p: theme => theme.layout.pageMargin }}>{children}</Box>
        </Box>
      </Box>

      <BottomNavbar items={bottomNavItems} activeKey={activeNavKey} />
    </Box>
  );
}
