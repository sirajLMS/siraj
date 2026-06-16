// cspell:ignore: Hanken
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
import { useTranslations } from "next-intl";
import type { NavItem } from "@/frontend/views/dashboard/types/dashboard";

interface SidebarProps {
  readonly navItems: readonly NavItem[];
  readonly activeKey: string;
  readonly roleLabel: string;
  readonly sidebarWidth: string;
  readonly mobileOpen: boolean;
  readonly isCollapsed: boolean;
  readonly onMobileClose: () => void;
  readonly onToggleCollapse: () => void;
  readonly onNavigate: (href: string) => void;
}

interface SidebarNavItemProps {
  readonly item: NavItem;
  readonly isActive?: boolean;
  readonly isCollapsed: boolean;
  readonly onNavigate: (href: string) => void;
  readonly isFooter?: boolean;
}

function getSidebarItemStyles(isCollapsed: boolean, isActive = false, isFooter = false): SxProps<Theme> {
  return (theme: Theme) => ({
    borderRadius: 2,
    py: 1.25,
    px: 2,
    justifyContent: isCollapsed ? "center" : "flex-start",
    bgcolor: isActive ? theme.palette.onSidebarContainer : theme.palette.sidebarContainer,
    color: isActive ? theme.palette.sidebarContainer : theme.palette.onSidebarContainer,
    "&:hover": {
      bgcolor: theme.palette.onSidebarContainer,
      color: theme.palette.sidebarContainer,
    },
    transition: "all 0.2s ease",
    ...(!isFooter && {
      fontWeight: isActive ? 700 : 400,
      "&.Mui-selected": {
        bgcolor: theme.palette.onSidebarContainer,
        "&:hover": {
          bgcolor: theme.palette.onSidebarContainer,
        },
      },
    }),
  });
}

function SidebarNavItem({ item, isActive = false, isCollapsed, onNavigate, isFooter = false }: SidebarNavItemProps) {
  const t = useTranslations();
  const IconComponent = item.icon;

  const button = (
    <ListItemButton
      onClick={() => {
        onNavigate(item.href);
      }}
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
          primary={t(item.labelKey)}
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
        <Tooltip title={t(item.labelKey)} placement="right">
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
  onNavigate,
}: Omit<SidebarProps, "sidebarWidth" | "mobileOpen" | "onMobileClose"> & { isCollapsed: boolean }) {
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
      {/* Main Navigation */}
      <List
        sx={theme => ({
          flex: 1,
          overflow: "auto",
          px: 1.5,
          "&::-webkit-scrollbar": { width: 4 },
          "&::-webkit-scrollbar-thumb": {
            bgcolor: theme.palette.onSidebarContainer,
            borderRadius: 10,
          },
        })}
        component="nav"
      >
        {mainItems.map(item => (
          <SidebarNavItem
            key={item.key}
            item={item}
            isActive={item.key === activeKey}
            isCollapsed={isCollapsed}
            onNavigate={onNavigate}
          />
        ))}
      </List>

      {/* Footer Navigation */}
      {footerItems.length > 0 && (
        <>
          <Divider sx={theme => ({ borderColor: theme.palette.outlineVariant, mx: 1.5 })} />
          <List sx={{ px: 1.5, pt: 1 }} component="nav">
            {footerItems.map(item => (
              <SidebarNavItem key={item.key} item={item} isCollapsed={isCollapsed} onNavigate={onNavigate} isFooter />
            ))}
          </List>
        </>
      )}
    </Box>
  );
}

export function Sidebar({
  navItems,
  activeKey,
  roleLabel,
  sidebarWidth,
  mobileOpen,
  isCollapsed,
  onMobileClose,
  onToggleCollapse,
  onNavigate,
}: SidebarProps) {
  const collapsedWidth = "80px";
  const contentProps = { navItems, activeKey, roleLabel, isCollapsed, onToggleCollapse, onNavigate };

  return (
    <>
      {/* Mobile temporary drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileClose}
        ModalProps={{ keepMounted: true }}
        sx={theme => ({
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": {
            width: sidebarWidth,
            boxSizing: "border-box",
            bgcolor: theme.palette.sidebarContainer,
            color: theme.palette.onSidebarContainer,
            borderRight: "none",
          },
        })}
      >
        <SidebarContent {...contentProps} isCollapsed={false} />
      </Drawer>

      {/* Desktop fixed sidebar */}
      <Box
        sx={theme => ({
          display: { xs: "none", md: "block" },
          width: isCollapsed ? collapsedWidth : sidebarWidth,
          flexShrink: 0,
          bgcolor: theme.palette.sidebarContainer,
          color: theme.palette.onSidebarContainer,
          minHeight: "100%",
          position: "relative",
          transition: "width 0.3s ease",
        })}
      >
        <SidebarContent {...contentProps} />

        {/* Virtual Hover Toggle Button at End Border */}
        <Box
          onClick={onToggleCollapse}
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
              bgcolor: theme.palette.sidebarContainer,
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
              bgcolor: theme.palette.sidebarContainer,
              border: `1px solid ${theme.palette.outlineVariant}`,
              width: "32px",
              height: "32px",
              color: theme.palette.onSidebarContainer,
              "&:hover": {
                bgcolor: theme.palette.sidebarContainer,
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
    </>
  );
}
