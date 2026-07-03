"use client";

import { Box } from "@mui/material";
import { type ReactNode, useEffect, useRef } from "react";
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

function MainScrollArea({ children }: { readonly children: ReactNode }) {
  const mainRef = useRef<HTMLElement>(null);

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
        pb: {
          xs: `calc(${theme.layout.bottomNavHeight} + env(safe-area-inset-bottom, 0px) + ${theme.spacing(2)})`,
          md: 0,
        },
      })}
    >
      <Box
        sx={theme => ({
          px: { xs: 0, md: theme.layout.pageMargin },
          py: { xs: theme.spacing(2), md: theme.layout.pageMargin },
        })}
      >
        {children}
      </Box>
    </Box>
  );
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
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh", height: "100vh", overflow: "hidden" }}>
      <TopNavbar
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
        <Sidebar navItems={sidebarItems} activeKey={activeNavKey} sidebarWidth={sidebarWidth} />

        <MainScrollArea>{children}</MainScrollArea>
      </Box>

      <BottomNavbar items={bottomNavItems} activeKey={activeNavKey} />
    </Box>
  );
}
