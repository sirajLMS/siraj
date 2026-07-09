"use client";

import { Box } from "@mui/material";
import type { ReactNode } from "react";
import {
  BOTTOM_NAV_SCROLL_THRESHOLD,
  BottomNavItemView,
} from "@/frontend/views/dashboard/components/BottomNavItemView";
import type { TranslatedNavItem } from "@/frontend/views/dashboard/components/client/SidebarShell";
import {
  LanguageSwitcher,
  NavbarChrome,
  NotificationButton,
  ThemeSwitcher,
  UserMenuButton,
} from "@/frontend/views/dashboard/components/navbar";

interface DashboardLayoutPreviewProps {
  readonly children?: ReactNode;
  readonly sidebar: ReactNode;
  readonly bottomNavItems: readonly TranslatedNavItem[];
  readonly activeNavKey: string;
  readonly userName: string;
  readonly userEmail: string;
  readonly avatarUrl: string;
  readonly roleLabel: string;
  readonly notificationCount: number;
  readonly navbarHeight?: string;
}

function MainContent({
  children,
  sidebar,
  navbarHeight,
}: {
  readonly children?: ReactNode;
  readonly sidebar: ReactNode;
  readonly navbarHeight: string;
}) {
  return (
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
      {sidebar}
      <Box
        component="main"
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
        <Box sx={{ p: theme => theme.layout.pageMargin }}>{children}</Box>
      </Box>
    </Box>
  );
}

function BottomNav({
  bottomNavItems,
  activeNavKey,
}: {
  readonly bottomNavItems: readonly TranslatedNavItem[];
  readonly activeNavKey: string;
}) {
  const isScrollable = bottomNavItems.length > BOTTOM_NAV_SCROLL_THRESHOLD;

  return (
    <Box
      component="nav"
      sx={theme => ({
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: theme.zIndex.appBar,
        display: { xs: "flex", md: "none" },
        minHeight: theme.layout.bottomNavHeight,
        boxSizing: "content-box",
        backgroundColor: theme.palette.background.paper,
        borderTop: `1px solid ${theme.palette.border.light}`,
        overflowX: isScrollable ? "auto" : "hidden",
        scrollbarWidth: "none",
        pb: "env(safe-area-inset-bottom)",
        "&::-webkit-scrollbar": {
          display: "none",
        },
      })}
    >
      {bottomNavItems.map(item => (
        <BottomNavItemView
          key={item.key}
          itemKey={item.key}
          href={item.href}
          label={item.label}
          icon={item.icon}
          isActive={item.key === activeNavKey}
          isScrollable={isScrollable}
        />
      ))}
    </Box>
  );
}

export function DashboardLayoutPreview({
  children,
  sidebar,
  bottomNavItems,
  activeNavKey,
  userName,
  userEmail,
  roleLabel,
  avatarUrl,
  notificationCount,
  navbarHeight = "64px",
}: Readonly<DashboardLayoutPreviewProps>) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh", height: "100vh", overflow: "hidden" }}>
      <NavbarChrome
        roleLabel={roleLabel}
        rightSlot={
          <>
            <ThemeSwitcher />
            <LanguageSwitcher />
            <NotificationButton notificationCount={notificationCount} />
            <UserMenuButton userName={userName} userEmail={userEmail} avatarUrl={avatarUrl} />
          </>
        }
      />
      <MainContent sidebar={sidebar} navbarHeight={navbarHeight}>
        {children}
      </MainContent>
      <BottomNav bottomNavItems={bottomNavItems} activeNavKey={activeNavKey} />
    </Box>
  );
}
