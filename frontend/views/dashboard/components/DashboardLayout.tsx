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
  readonly sidebarWidth: string;
  readonly navbarHeight: string;
  readonly sidebarOpen: boolean;
  readonly mobileDrawerOpen: boolean;
  readonly onToggleSidebar: () => void;
  readonly onToggleMobileDrawer: () => void;
  readonly onCloseMobileDrawer: () => void;
  readonly onNavigate: (href: string) => void;
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
  sidebarWidth,
  navbarHeight,
  sidebarOpen,
  mobileDrawerOpen,
  onToggleSidebar,
  onToggleMobileDrawer,
  onCloseMobileDrawer,
  onNavigate,
}: DashboardLayoutProps) {
  const collapsedWidth = "80px";
  const currentSidebarWidth = sidebarOpen ? sidebarWidth : collapsedWidth;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh", height: "100vh" }}>
      {/* Top Navbar - Full Width */}
      <TopNavbar
        userName={userName}
        userEmail={userEmail}
        userRole={userRole}
        roleLabel={roleLabel}
        avatarUrl={avatarUrl}
        notificationCount={notificationCount}
        onMenuClick={onToggleMobileDrawer}
      />

      {/* Content Area with Sidebar */}
      <Box sx={{ display: "flex", flexGrow: 1, mt: navbarHeight, height: "100%" }}>
        {/* Sidebar */}
        <Sidebar
          navItems={sidebarItems}
          activeKey={activeNavKey}
          roleLabel={roleLabel}
          sidebarWidth={sidebarWidth}
          isCollapsed={!sidebarOpen}
          mobileOpen={mobileDrawerOpen}
          onMobileClose={onCloseMobileDrawer}
          onToggleCollapse={onToggleSidebar}
          onNavigate={href => {
            onCloseMobileDrawer();
            onNavigate(href);
          }}
        />

        {/* Main Content Area */}
        <Box
          component="main"
          sx={theme => ({
            flexGrow: 1,
            width: { xs: "100%", md: `calc(100% - ${currentSidebarWidth})` },
            pb: 10,
            minHeight: `calc(100vh - ${navbarHeight})`,
            bgcolor: theme.palette.background.default,
            transition: "width 0.3s ease",
            height: "100%",
            overflowY: "auto",
          })}
        >
          <Box sx={{ p: theme => theme.layout.pageMargin }}>{children}</Box>
        </Box>
      </Box>

      {/* Mobile Bottom Navigation */}
      <BottomNavbar
        items={bottomNavItems}
        activeKey={activeNavKey}
        onNavigate={href => {
          onNavigate(href);
        }}
      />
    </Box>
  );
}
