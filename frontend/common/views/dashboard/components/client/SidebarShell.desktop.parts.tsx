"use client";

import { ChevronLeft, ChevronRight } from "@mui/icons-material";
import { Box, IconButton, Tooltip } from "@mui/material";
import type { Theme } from "@mui/material/styles";
import { useState, useSyncExternalStore } from "react";
import { useCustomizeMode } from "@/frontend/common/hooks/useCustomizeMode";
import { useLayoutStore } from "@/frontend/common/stores/layoutStore";
import { SidebarContent } from "@/frontend/common/views/dashboard/components/client/SidebarShell.content.parts";
import type {
  SidebarCollapseToggleButtonProps,
  SidebarDesktopProps,
} from "@/frontend/common/views/dashboard/components/client/SidebarShell.types";

function SidebarCollapseToggleButton({
  isCollapsed,
  expandSidebarLabel,
  collapseSidebarLabel,
}: SidebarCollapseToggleButtonProps) {
  const toggleLabel = isCollapsed ? expandSidebarLabel : collapseSidebarLabel;
  return (
    <Tooltip title={toggleLabel} placement="right">
      <IconButton
        className="toggle-button"
        aria-label={toggleLabel}
        sx={(theme: Theme) => ({
          position: "absolute",
          top: "50%",
          insetInlineEnd: "-16px",
          transform: "translateY(-50%) scale(0.8)",
          opacity: 0,
          transition: theme.transitions.create("all", { duration: 200, easing: "ease" }),
          backgroundColor: "var(--mui-palette-background-paper)",
          border: "1px solid var(--mui-palette-border-light)",
          width: "32px",
          height: "32px",
          color: "var(--mui-palette-onSurface)",
          "&:hover": {
            backgroundColor: "var(--mui-palette-background-paper)",
            borderColor: "var(--mui-palette-border-light)",
          },
        })}
      >
        {isCollapsed ? (
          <ChevronRight
            fontSize="small"
            sx={theme => ({
              transform: theme.direction === "rtl" ? " scaleX(-1)" : "scaleX(1)",
            })}
          />
        ) : (
          <ChevronLeft
            fontSize="small"
            sx={theme => ({
              transform: theme.direction === "rtl" ? " scaleX(-1)" : "scaleX(1)",
            })}
          />
        )}
      </IconButton>
    </Tooltip>
  );
}

export function SidebarDesktop({
  sidebarWidth,
  navGroups,
  navItems,
  activeKey,
  initialSidebarOpen = true,
  userName,
  avatarUrl,
  logoutLabel,
  toggleGroupAriaLabel,
  expandSidebarLabel,
  collapseSidebarLabel,
}: SidebarDesktopProps) {
  const customizeMode = useCustomizeMode();
  const collapsedWidth = customizeMode ? "64px" : "80px";
  const toggleSidebar = useLayoutStore(state => state.toggleSidebar);
  const sidebarOpen = useSyncExternalStore(
    useLayoutStore.subscribe,
    () => useLayoutStore.getState().sidebarOpen,
    () => initialSidebarOpen
  );
  const [isHovered, setIsHovered] = useState(false);
  // In customize mode, force-collapse to icon-only (64px) and expand on
  // hover. When not in customize mode, respect the user's sidebarOpen
  // preference (persisted via layoutStore). State is automatically restored
  // on exit because customizeMode=false falls back to !sidebarOpen without
  // mutating the store.
  const isCollapsed = customizeMode ? !isHovered : !sidebarOpen;

  return (
    <Box
      onMouseEnter={customizeMode ? () => setIsHovered(true) : undefined}
      onMouseLeave={customizeMode ? () => setIsHovered(false) : undefined}
      sx={(theme: Theme) => ({
        display: { xs: "none", md: "flex" },
        flexDirection: "column",
        width: isCollapsed ? collapsedWidth : sidebarWidth,
        flexShrink: 0,
        height: "100%",
        minHeight: 0,
        backgroundColor: "var(--mui-palette-background-paper)",
        color: "var(--mui-palette-onSurface)",
        borderRight: "1px solid var(--mui-palette-border-light)",
        overflow: "hidden",
        position: "relative",
        transition: theme.transitions.create("width", { duration: 300, easing: "ease" }),
      })}
    >
      <SidebarContent
        navGroups={navGroups}
        navItems={navItems}
        activeKey={activeKey}
        isCollapsed={isCollapsed}
        userName={userName}
        avatarUrl={avatarUrl}
        logoutLabel={logoutLabel}
        toggleGroupAriaLabel={toggleGroupAriaLabel}
      />

      {customizeMode ? null : (
        <Box
          onClick={toggleSidebar}
          sx={(theme: Theme) => ({
            position: "absolute",
            insetInlineEnd: 0,
            top: 0,
            bottom: 0,
            width: "8px",
            cursor: "pointer",
            transition: theme.transitions.create("all", { duration: 200, easing: "ease" }),
            "&:hover": {
              width: "12px",
              backgroundColor: "var(--mui-palette-background-paper)",
              "& .toggle-button": {
                opacity: 1,
                transform: "scale(1)",
              },
            },
          })}
        >
          <SidebarCollapseToggleButton
            isCollapsed={isCollapsed}
            expandSidebarLabel={expandSidebarLabel}
            collapseSidebarLabel={collapseSidebarLabel}
          />
        </Box>
      )}
    </Box>
  );
}
