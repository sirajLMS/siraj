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
  type SxProps,
  type Theme,
  Tooltip,
} from "@mui/material";
import { useEffect } from "react";
import { useLayoutStore } from "@/frontend/stores/layoutStore";
import type { NavItem } from "@/frontend/views/dashboard/types/dashboard";
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
    backgroundColor: isActive ? theme.palette.onSidebarContainer : theme.palette.sidebarContainer,
    color: isActive ? theme.palette.sidebarContainer : theme.palette.onSidebarContainer,
    "&:hover": {
      backgroundColor: theme.palette.onSidebarContainer,
      color: theme.palette.sidebarContainer,
    },
    transition: "all 0.2s ease",
    ...(!isFooter && {
      fontWeight: isActive ? 700 : 400,
      "&.Mui-selected": {
        backgroundColor: theme.palette.onSidebarContainer,
        "&:hover": {
          backgroundColor: theme.palette.onSidebarContainer,
        },
      },
    }),
  });
}

function SidebarNavItem({ item, isActive = false, isCollapsed, isFooter = false }: SidebarNavItemProps) {
  const IconComponent = item.icon;

  const button = (
    <ListItemButton
      component={Link}
      href={item.href}
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
                fontFamily: '"Inter", sans-serif',
                fontSize: "12px",
                fontWeight: isFooter ? 500 : "inherit",
                letterSpacing: "0.05em",
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
}: {
  readonly navItems: readonly TranslatedNavItem[];
  readonly activeKey: string;
  readonly isCollapsed: boolean;
}) {
  const mainItems = navItems.filter(item => item.section === "main");
  const footerItems = navItems.filter(item => item.section === "footer");

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        py: 2,
      }}
    >
      <List
        sx={theme => ({
          flex: 1,
          overflow: "auto",
          px: 1.5,
          "&::-webkit-scrollbar": { width: 4 },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: theme.palette.onSidebarContainer,
            borderRadius: 10,
          },
        })}
        component="nav"
      >
        {mainItems.map(item => (
          <SidebarNavItem key={item.key} item={item} isActive={item.key === activeKey} isCollapsed={isCollapsed} />
        ))}
      </List>

      {footerItems.length > 0 && (
        <>
          <Divider sx={theme => ({ borderColor: theme.palette.outlineVariant, mx: 1.5 })} />
          <List sx={{ px: 1.5, pt: 1 }} component="nav">
            {footerItems.map(item => (
              <SidebarNavItem key={item.key} item={item} isCollapsed={isCollapsed} isFooter />
            ))}
          </List>
        </>
      )}
    </Box>
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

  useEffect(() => {
    closeMobileDrawer();
  }, [closeMobileDrawer]);

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
          boxSizing: "border-box",
          backgroundColor: theme.palette.sidebarContainer,
          color: theme.palette.onSidebarContainer,
          borderRight: "none",
        },
      })}
    >
      <SidebarContent navItems={navItems} activeKey={activeKey} isCollapsed={false} />
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
        display: { xs: "none", md: "block" },
        width: isCollapsed ? collapsedWidth : sidebarWidth,
        flexShrink: 0,
        backgroundColor: theme.palette.sidebarContainer,
        color: theme.palette.onSidebarContainer,
        minHeight: "100%",
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
            backgroundColor: theme.palette.sidebarContainer,
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
            backgroundColor: theme.palette.sidebarContainer,
            border: `1px solid ${theme.palette.outlineVariant}`,
            width: "32px",
            height: "32px",
            color: theme.palette.onSidebarContainer,
            "&:hover": {
              backgroundColor: theme.palette.sidebarContainer,
              borderColor: theme.palette.outlineVariant,
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
