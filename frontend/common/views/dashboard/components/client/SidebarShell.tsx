"use client";

import { ChevronLeft, ChevronRight } from "@mui/icons-material";
import {
  Box,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tooltip,
} from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import { alpha } from "@mui/material/styles";
import { type RefObject, useEffect, useRef } from "react";
import { useLayoutStore } from "@/frontend/common/stores/layoutStore";
import type { NavItem } from "@/frontend/common/views/dashboard/types/dashboard";
import { Link } from "@/shared/i18n/routing";

export interface TranslatedNavItem extends NavItem {
  readonly label: string;
}

interface SidebarShellProps {
  readonly navItems: readonly TranslatedNavItem[];
  readonly activeKey: string;
  readonly sidebarWidth: string;
}

interface SidebarNavItemProps {
  readonly item: TranslatedNavItem;
  readonly isActive?: boolean;
  readonly isCollapsed: boolean;
  readonly isFooter?: boolean;
}

function getSidebarItemStyles(isCollapsed: boolean, isActive = false, isFooter = false): SxProps<Theme> {
  return (theme: Theme) => ({
    borderRadius: 2,
    py: 1.25,
    px: 2,
    justifyContent: isCollapsed ? "center" : "flex-start",
    backgroundColor: isActive ? theme.palette.primaryContainer : "transparent",
    color: isActive ? theme.palette.primary.main : theme.palette.onSurfaceVariant,
    "&:hover": {
      backgroundColor: alpha(theme.palette.primary.main, 0.08),
      color: theme.palette.primary.main,
    },
    transition: "all 0.2s ease",
    ...(!isFooter && {
      fontWeight: isActive ? 700 : 400,
      "&.Mui-selected": {
        backgroundColor: theme.palette.primaryContainer,
        color: theme.palette.primary.main,
        "&:hover": {
          backgroundColor: theme.palette.primaryContainer,
        },
      },
    }),
  });
}

function SidebarNavItem({ item, isActive = false, isCollapsed, isFooter = false }: SidebarNavItemProps) {
  const IconComponent = item.icon;
  const isLogout = item.href === "/logout";

  const button = (
    <ListItemButton
      {...(isLogout
        ? {
            // We use a normal onClick for logout instead of Next.js <Link> to prevent Next.js
            // from aggressively prefetching the /logout route in production when the sidebar
            // is visible, which would prematurely destroy the user's session in the background.
            onClick: () => {
              globalThis.location.href = item.href;
            },
          }
        : { component: Link, href: item.href })}
      selected={!isFooter && isActive}
      sx={getSidebarItemStyles(isCollapsed, isActive, isFooter)}
    >
      <ListItemIcon
        sx={{
          minWidth: isCollapsed ? "unset" : 36,
          color: "inherit",
        }}
      >
        <IconComponent fontSize="small" />
      </ListItemIcon>
      {!isCollapsed && (
        <ListItemText
          primary={item.label}
          slotProps={{
            primary: {
              sx: {
                typography: "labelMd",
                fontWeight: isFooter ? 500 : "inherit",
              },
            },
          }}
        />
      )}
    </ListItemButton>
  );

  return (
    <ListItem disablePadding sx={{ mb: 0.25 }}>
      {isCollapsed ? (
        <Tooltip title={item.label} placement="right">
          {button}
        </Tooltip>
      ) : (
        button
      )}
    </ListItem>
  );
}

function SidebarContent({
  navItems,
  activeKey,
  isCollapsed,
  navListRef,
}: {
  readonly navItems: readonly TranslatedNavItem[];
  readonly activeKey: string;
  readonly isCollapsed: boolean;
  readonly navListRef?: RefObject<HTMLElement | null>;
}) {
  const mainItems = navItems.filter(item => item.section === "main");
  const footerItems = navItems.filter(item => item.section === "footer");

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minHeight: 0,
        overflow: "hidden",
      }}
    >
      <Box
        ref={navListRef}
        sx={theme => ({
          flex: 1,
          minHeight: 0,
          flexBasis: 0,
          overflow: "auto",
          overscrollBehavior: "contain",
          py: 2,
          px: 1.5,
          "&::-webkit-scrollbar": { width: 4 },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: theme.palette.outlineVariant,
            borderRadius: 10,
          },
        })}
      >
        <List component="nav" sx={{ p: 0 }}>
          {mainItems.map(item => (
            <SidebarNavItem key={item.key} item={item} isActive={item.key === activeKey} isCollapsed={isCollapsed} />
          ))}
        </List>
      </Box>

      {footerItems.length > 0 && (
        <>
          <Divider sx={theme => ({ borderColor: theme.palette.outlineVariant, mx: 1.5 })} />
          <List sx={{ px: 1.5, pt: 1, pb: 2, flexShrink: 0 }} component="nav">
            {footerItems.map(item => (
              <SidebarNavItem key={item.key} item={item} isCollapsed={isCollapsed} isFooter />
            ))}
          </List>
        </>
      )}
    </Box>
  );
}

function SidebarMobileNav({
  navItems,
  activeKey,
}: {
  readonly navItems: readonly TranslatedNavItem[];
  readonly activeKey: string;
}) {
  const mainItems = navItems.filter(item => item.section === "main");
  const footerItems = navItems.filter(item => item.section === "footer");

  return (
    <>
      <List sx={{ px: 1.5 }} component="nav">
        {mainItems.map(item => (
          <SidebarNavItem key={item.key} item={item} isActive={item.key === activeKey} isCollapsed={false} />
        ))}
      </List>

      {footerItems.length > 0 && (
        <>
          <Divider sx={theme => ({ borderColor: theme.palette.outlineVariant, mx: 1.5 })} />
          <List sx={{ px: 1.5, pt: 1 }} component="nav">
            {footerItems.map(item => (
              <SidebarNavItem key={item.key} item={item} isCollapsed={false} isFooter />
            ))}
          </List>
        </>
      )}
    </>
  );
}

function SidebarMobileDrawer({
  sidebarWidth,
  navItems,
  activeKey,
}: {
  readonly sidebarWidth: string;
  readonly navItems: readonly TranslatedNavItem[];
  readonly activeKey: string;
}) {
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
      ModalProps={{ keepMounted: true, disableScrollLock: true }}
      sx={theme => ({
        display: { xs: "block", md: "none" },
        "& .MuiDrawer-paper": {
          width: sidebarWidth,
          height: "100dvh",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.onSurface,
          borderRight: `1px solid ${theme.palette.border.light}`,
          pt: theme.layout.navbarHeight,
        },
      })}
    >
      <Box
        ref={navListRef}
        sx={theme => ({
          flex: 1,
          minHeight: 0,
          flexBasis: 0,
          overflow: "auto",
          overscrollBehavior: "contain",
          WebkitOverflowScrolling: "touch",
          py: 2,
          "&::-webkit-scrollbar": { width: 4 },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: theme.palette.outlineVariant,
            borderRadius: 10,
          },
        })}
      >
        <SidebarMobileNav navItems={navItems} activeKey={activeKey} />
      </Box>
    </Drawer>
  );
}

function SidebarDesktop({
  sidebarWidth,
  navItems,
  activeKey,
}: {
  readonly sidebarWidth: string;
  readonly navItems: readonly TranslatedNavItem[];
  readonly activeKey: string;
}) {
  const collapsedWidth = "80px";
  const sidebarOpen = useLayoutStore(state => state.sidebarOpen);
  const toggleSidebar = useLayoutStore(state => state.toggleSidebar);
  const isCollapsed = !sidebarOpen;

  return (
    <Box
      sx={theme => ({
        display: { xs: "none", md: "flex" },
        flexDirection: "column",
        width: isCollapsed ? collapsedWidth : sidebarWidth,
        flexShrink: 0,
        height: "100%",
        minHeight: 0,
        backgroundColor: theme.palette.background.paper,
        color: theme.palette.onSurface,
        borderRight: `1px solid ${theme.palette.border.light}`,
        overflow: "hidden",
        position: "relative",
        transition: "width 0.3s ease",
      })}
    >
      <SidebarContent navItems={navItems} activeKey={activeKey} isCollapsed={isCollapsed} />

      <Box
        onClick={toggleSidebar}
        sx={theme => ({
          position: "absolute",
          insetInlineEnd: 0,
          top: 0,
          bottom: 0,
          width: "8px",
          cursor: "pointer",
          transition: "all 0.2s ease",
          "&:hover": {
            width: "12px",
            backgroundColor: theme.palette.background.paper,
            "& .toggle-button": {
              opacity: 1,
              transform: "scale(1)",
            },
          },
        })}
      >
        <IconButton
          className="toggle-button"
          sx={theme => ({
            position: "absolute",
            top: "50%",
            insetInlineEnd: "-16px",
            transform: "translateY(-50%) scale(0.8)",
            opacity: 0,
            transition: "all 0.2s ease",
            backgroundColor: theme.palette.background.paper,
            border: `1px solid ${theme.palette.border.light}`,
            width: "32px",
            height: "32px",
            color: theme.palette.onSurface,
            "&:hover": {
              backgroundColor: theme.palette.background.paper,
              borderColor: theme.palette.border.light,
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
      </Box>
    </Box>
  );
}

export function SidebarShell({ navItems, activeKey, sidebarWidth }: SidebarShellProps) {
  return (
    <>
      <SidebarMobileDrawer sidebarWidth={sidebarWidth} navItems={navItems} activeKey={activeKey} />
      <SidebarDesktop sidebarWidth={sidebarWidth} navItems={navItems} activeKey={activeKey} />
    </>
  );
}
