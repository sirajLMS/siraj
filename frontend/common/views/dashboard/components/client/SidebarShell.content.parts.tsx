"use client";

import { Box, Drawer } from "@mui/material";
import { useEffect, useRef } from "react";
import { useLayoutStore } from "@/frontend/common/stores/layoutStore";
import { SidebarAccountFooter } from "@/frontend/common/views/dashboard/components/client/SidebarShell.footer.parts";
import { GroupedNavList } from "@/frontend/common/views/dashboard/components/client/SidebarShell.navList.parts";
import type {
  SidebarContentProps,
  SidebarMobileDrawerProps,
} from "@/frontend/common/views/dashboard/components/client/SidebarShell.types";

export function SidebarContent({
  navGroups,
  navItems,
  activeKey,
  isCollapsed,
  navListRef,
  userName,
  avatarUrl,
  logoutLabel,
  toggleGroupAriaLabel,
}: SidebarContentProps) {
  const mainItems = navItems.filter(item => item.section === "main");
  const mainGroups = navGroups.filter(group => group.section === "main");

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minHeight: 0,
        height: "100%",
        overflow: "hidden",
      }}
    >
      <GroupedNavList
        groups={mainGroups}
        items={mainItems}
        activeKey={activeKey}
        isCollapsed={isCollapsed}
        navListRef={navListRef}
        toggleGroupAriaLabel={toggleGroupAriaLabel}
      />

      <SidebarAccountFooter
        userName={userName}
        avatarUrl={avatarUrl}
        logoutLabel={logoutLabel}
        isCollapsed={isCollapsed}
        activeKey={activeKey}
      />
    </Box>
  );
}

export function SidebarMobileDrawer({
  sidebarWidth,
  navGroups,
  navItems,
  activeKey,
  userName,
  avatarUrl,
  logoutLabel,
  toggleGroupAriaLabel,
}: SidebarMobileDrawerProps) {
  const mobileDrawerOpen = useLayoutStore(state => state.mobileDrawerOpen);
  const closeMobileDrawer = useLayoutStore(state => state.closeMobileDrawer);
  const navListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    closeMobileDrawer();
  }, [closeMobileDrawer]);

  useEffect(() => {
    if (mobileDrawerOpen) {
      navListRef.current?.scrollTo(0, 0);
    }
  }, [mobileDrawerOpen]);

  return (
    <Drawer
      variant="temporary"
      open={mobileDrawerOpen}
      onClose={closeMobileDrawer}
      ModalProps={{ keepMounted: true }}
      sx={theme => ({
        display: { xs: "block", md: "none" },
        "& .MuiDrawer-paper": {
          width: sidebarWidth,
          height: "100dvh",
          maxHeight: "100dvh",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          backgroundColor: "var(--mui-palette-background-paper)",
          color: "var(--mui-palette-onSurface)",
          borderRight: "1px solid var(--mui-palette-border-light)",
          pt: theme.layout.navbarHeight,
          touchAction: "pan-y",
          WebkitOverflowScrolling: "touch",
        },
      })}
    >
      <SidebarContent
        navGroups={navGroups}
        navItems={navItems}
        activeKey={activeKey}
        isCollapsed={false}
        navListRef={navListRef}
        userName={userName}
        avatarUrl={avatarUrl}
        logoutLabel={logoutLabel}
        toggleGroupAriaLabel={toggleGroupAriaLabel}
      />
    </Drawer>
  );
}
