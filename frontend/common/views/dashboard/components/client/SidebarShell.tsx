"use client";

import { ChevronLeft, ChevronRight, KeyboardArrowDownOutlined, KeyboardArrowUpOutlined } from "@mui/icons-material";
import {
  Box,
  Collapse,
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
import { type RefObject, useEffect, useRef, useState } from "react";
import { useLayoutStore } from "@/frontend/common/stores/layoutStore";
import { NavIcon } from "@/frontend/common/views/dashboard/config/navIconRegistry";
import type { NavGroup, NavItem } from "@/frontend/common/views/dashboard/types/dashboard";
import { Link } from "@/shared/i18n";

export interface TranslatedNavItem extends NavItem {
  readonly label: string;
}

export interface TranslatedNavGroup extends NavGroup {
  readonly label: string;
}

interface SidebarShellProps {
  readonly navGroups: readonly TranslatedNavGroup[];
  readonly navItems: readonly TranslatedNavItem[];
  readonly activeKey: string | null;
  readonly sidebarWidth: string;
  readonly initialSidebarOpen?: boolean;
}

interface SidebarNavItemProps {
  readonly item: TranslatedNavItem;
  readonly isActive?: boolean;
  readonly isCollapsed: boolean;
  readonly isFooter?: boolean;
}

function getSidebarItemStyles(isCollapsed: boolean, isActive = false, isFooter = false): SxProps<Theme> {
  return {
    borderRadius: 2,
    py: 1.25,
    px: 2,
    justifyContent: isCollapsed ? "center" : "flex-start",
    backgroundColor: isActive ? "var(--mui-palette-primaryContainer)" : "transparent",
    color: isActive ? "var(--mui-palette-primary-main)" : "var(--mui-palette-onSurfaceVariant)",
    "&:hover": {
      backgroundColor: "color-mix(in srgb, var(--mui-palette-primary-main) 8%, transparent)",
      color: "var(--mui-palette-primary-main)",
    },
    transition: "all 0.2s ease",
    ...(!isFooter && {
      fontWeight: isActive ? 700 : 400,
      "&.Mui-selected": {
        backgroundColor: "var(--mui-palette-primaryContainer)",
        color: "var(--mui-palette-primary-main)",
        "&:hover": {
          backgroundColor: "var(--mui-palette-primaryContainer)",
        },
      },
    }),
  };
}

function SidebarNavItem({ item, isActive = false, isCollapsed, isFooter = false }: SidebarNavItemProps) {
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
        <NavIcon iconKey={item.iconKey} fontSize="small" />
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

interface SidebarGroupHeaderProps {
  readonly group: TranslatedNavGroup;
  readonly isCollapsed: boolean;
  readonly collapsed: boolean;
  readonly onToggle: () => void;
}

function SidebarGroupHeader({ group, isCollapsed, collapsed, onToggle }: SidebarGroupHeaderProps) {
  const Chevron = collapsed ? KeyboardArrowDownOutlined : KeyboardArrowUpOutlined;

  if (isCollapsed) {
    // Icon-only mode (desktop sidebar collapsed to 80px): no group headers,
    // just a thin separator so users see the grouping visually.
    return <Divider sx={{ borderColor: "var(--mui-palette-outlineVariant)", my: 1, mx: 1.5 }} />;
  }

  return (
    <ListItemButton
      onClick={onToggle}
      aria-expanded={!collapsed}
      aria-label={`Toggle ${group.label} group`}
      sx={{
        borderRadius: 2,
        px: 2,
        py: 0.75,
        alignItems: "center",
        gap: 1.5,
        color: "var(--mui-palette-onSurfaceVariant)",
        "&:hover": {
          backgroundColor: "color-mix(in srgb, var(--mui-palette-primary-main) 6%, transparent)",
        },
      }}
    >
      {group.iconKey ? (
        <ListItemIcon sx={{ minWidth: 36, color: "inherit" }}>
          <NavIcon iconKey={group.iconKey} fontSize="small" />
        </ListItemIcon>
      ) : null}
      <ListItemText
        primary={group.label}
        slotProps={{
          primary: {
            sx: {
              typography: "labelSm",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            },
          },
        }}
      />
      <Chevron fontSize="small" sx={{ color: "inherit" }} />
    </ListItemButton>
  );
}

interface RenderedGroup {
  readonly group: TranslatedNavGroup;
  readonly items: readonly TranslatedNavItem[];
}

/**
 * Splits the (filtered, translated) items into per-group buckets AND a
 * `noGroup` bucket for items that have no `groupId`. The `noGroup` items
 * render as a flat list before any groups — this is how portal-audience
 * items (teacher/parent/student) appear, since they intentionally carry no
 * `groupId`.
 */
function bucketItemsByGroup(
  groups: readonly TranslatedNavGroup[],
  items: readonly TranslatedNavItem[]
): { readonly grouped: readonly RenderedGroup[]; readonly noGroup: readonly TranslatedNavItem[] } {
  const itemsByGroupId = new Map<string, TranslatedNavItem[]>();
  const noGroup: TranslatedNavItem[] = [];
  for (const item of items) {
    if (item.groupId) {
      const arr = itemsByGroupId.get(item.groupId);
      if (arr) {
        arr.push(item);
      } else {
        itemsByGroupId.set(item.groupId, [item]);
      }
    } else {
      noGroup.push(item);
    }
  }
  const grouped: RenderedGroup[] = [];
  for (const group of groups) {
    const groupItems = itemsByGroupId.get(group.id);
    if (groupItems && groupItems.length > 0) {
      grouped.push({ group, items: groupItems });
    }
  }
  return { grouped, noGroup };
}

function useCollapsedGroupState(groups: readonly TranslatedNavGroup[]): void {
  // Initialize persisted collapse state for any group whose id we haven't
  // seen before. The first paint writes `group.defaultCollapsed ?? false`
  // into the Zustand persisted store; thereafter the user's choice wins.
  const initGroupCollapsed = useLayoutStore(state => state.initGroupCollapsed);
  useEffect(() => {
    for (const group of groups) {
      initGroupCollapsed(group.id, group.defaultCollapsed ?? false);
    }
  }, [groups, initGroupCollapsed]);
}

function GroupedNavList({
  groups,
  items,
  activeKey,
  isCollapsed,
  navListRef,
}: {
  readonly groups: readonly TranslatedNavGroup[];
  readonly items: readonly TranslatedNavItem[];
  readonly activeKey: string | null;
  readonly isCollapsed: boolean;
  readonly navListRef?: RefObject<HTMLElement | null>;
}) {
  const { grouped, noGroup } = bucketItemsByGroup(groups, items);
  useCollapsedGroupState(groups);
  const toggleGroupCollapsed = useLayoutStore(state => state.toggleGroupCollapsed);
  const collapsedGroups = useLayoutStore(state => state.collapsedGroups);

  return (
    <Box
      ref={navListRef}
      sx={{
        flex: 1,
        minHeight: 0,
        flexBasis: 0,
        overflow: "auto",
        overscrollBehavior: "contain",
        py: 2,
        px: 1.5,
        "&::-webkit-scrollbar": { width: 4 },
        "&::-webkit-scrollbar-thumb": {
          backgroundColor: "var(--mui-palette-outlineVariant)",
          borderRadius: 10,
        },
      }}
    >
      <List component="nav" sx={{ p: 0 }}>
        {noGroup.length > 0
          ? noGroup.map(item => (
              <SidebarNavItem key={item.key} item={item} isActive={item.key === activeKey} isCollapsed={isCollapsed} />
            ))
          : null}

        {noGroup.length > 0 && grouped.length > 0 ? (
          <Divider sx={{ borderColor: "var(--mui-palette-outlineVariant)", my: 1, mx: 0.5 }} />
        ) : null}

        {grouped.map(({ group, items: groupItems }, index) => {
          const collapsed = collapsedGroups[group.id] ?? group.defaultCollapsed ?? false;
          const showSeparator = index > 0 || noGroup.length > 0;
          return (
            <Box key={group.id}>
              {group.separator && showSeparator ? (
                <Divider sx={{ borderColor: "var(--mui-palette-outlineVariant)", my: 1, mx: 0.5 }} />
              ) : null}
              <SidebarGroupHeader
                group={group}
                isCollapsed={isCollapsed}
                collapsed={collapsed}
                onToggle={() => toggleGroupCollapsed(group.id)}
              />
              <Collapse in={!collapsed} timeout="auto" unmountOnExit>
                <List component="div" disablePadding sx={{ px: 0, pb: 0.5 }}>
                  {groupItems.map(item => (
                    <SidebarNavItem
                      key={item.key}
                      item={item}
                      isActive={item.key === activeKey}
                      isCollapsed={isCollapsed}
                    />
                  ))}
                </List>
              </Collapse>
            </Box>
          );
        })}
      </List>
    </Box>
  );
}

function SidebarContent({
  navGroups,
  navItems,
  activeKey,
  isCollapsed,
  navListRef,
}: {
  readonly navGroups: readonly TranslatedNavGroup[];
  readonly navItems: readonly TranslatedNavItem[];
  readonly activeKey: string | null;
  readonly isCollapsed: boolean;
  readonly navListRef?: RefObject<HTMLElement | null>;
}) {
  const mainItems = navItems.filter(item => item.section === "main");
  const footerItems = navItems.filter(item => item.section === "footer");
  const mainGroups = navGroups.filter(group => group.section === "main");
  const footerGroups = navGroups.filter(group => group.section === "footer");

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
      <GroupedNavList
        groups={mainGroups}
        items={mainItems}
        activeKey={activeKey}
        isCollapsed={isCollapsed}
        navListRef={navListRef}
      />

      {footerItems.length > 0 || footerGroups.length > 0 ? (
        <>
          <Divider sx={{ borderColor: "var(--mui-palette-outlineVariant)", mx: 1.5 }} />
          <Box sx={{ overflow: "auto", overscrollBehavior: "contain" }}>
            <GroupedNavList groups={footerGroups} items={footerItems} activeKey={activeKey} isCollapsed={isCollapsed} />
          </Box>
        </>
      ) : null}
    </Box>
  );
}

function SidebarMobileNav({
  navGroups,
  navItems,
  activeKey,
}: {
  readonly navGroups: readonly TranslatedNavGroup[];
  readonly navItems: readonly TranslatedNavItem[];
  readonly activeKey: string | null;
}) {
  return (
    <GroupedNavList
      groups={navGroups.filter(group => group.section === "main")}
      items={navItems.filter(item => item.section === "main")}
      activeKey={activeKey}
      isCollapsed={false}
    />
  );
}

function MobileFooterItems({
  navGroups,
  navItems,
  activeKey,
}: {
  readonly navGroups: readonly TranslatedNavGroup[];
  readonly navItems: readonly TranslatedNavItem[];
  readonly activeKey: string | null;
}) {
  const footerItems = navItems.filter(item => item.section === "footer");
  const footerGroups = navGroups.filter(group => group.section === "footer");
  if (footerItems.length === 0 && footerGroups.length === 0) {
    return null;
  }
  return (
    <>
      <Divider sx={theme => ({ borderColor: theme.palette.outlineVariant, mx: 1.5 })} />
      <GroupedNavList groups={footerGroups} items={footerItems} activeKey={activeKey} isCollapsed={false} />
    </>
  );
}

function SidebarMobileDrawer({
  sidebarWidth,
  navGroups,
  navItems,
  activeKey,
}: {
  readonly sidebarWidth: string;
  readonly navGroups: readonly TranslatedNavGroup[];
  readonly navItems: readonly TranslatedNavItem[];
  readonly activeKey: string | null;
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
          backgroundColor: "var(--mui-palette-background-paper)",
          color: "var(--mui-palette-onSurface)",
          borderRight: "1px solid var(--mui-palette-border-light)",
          pt: theme.layout.navbarHeight,
        },
      })}
    >
      <Box
        ref={navListRef}
        sx={{
          flex: 1,
          minHeight: 0,
          flexBasis: 0,
          overflow: "auto",
          overscrollBehavior: "contain",
          WebkitOverflowScrolling: "touch",
          py: 2,
          "&::-webkit-scrollbar": { width: 4 },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "var(--mui-palette-outlineVariant)",
            borderRadius: 10,
          },
        }}
      >
        <SidebarMobileNav navGroups={navGroups} navItems={navItems} activeKey={activeKey} />
        <MobileFooterItems navGroups={navGroups} navItems={navItems} activeKey={activeKey} />
      </Box>
    </Drawer>
  );
}

function SidebarDesktop({
  sidebarWidth,
  navGroups,
  navItems,
  activeKey,
  initialSidebarOpen = true,
}: {
  readonly sidebarWidth: string;
  readonly navGroups: readonly TranslatedNavGroup[];
  readonly navItems: readonly TranslatedNavItem[];
  readonly activeKey: string | null;
  readonly initialSidebarOpen?: boolean;
}) {
  const collapsedWidth = "80px";
  const storeSidebarOpen = useLayoutStore(state => state.sidebarOpen);
  const toggleSidebar = useLayoutStore(state => state.toggleSidebar);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const sidebarOpen = mounted ? storeSidebarOpen : initialSidebarOpen;
  const isCollapsed = !sidebarOpen;

  return (
    <Box
      sx={{
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
        transition: "width 0.3s ease",
      }}
    >
      <SidebarContent navGroups={navGroups} navItems={navItems} activeKey={activeKey} isCollapsed={isCollapsed} />

      <Box
        onClick={toggleSidebar}
        sx={{
          position: "absolute",
          insetInlineEnd: 0,
          top: 0,
          bottom: 0,
          width: "8px",
          cursor: "pointer",
          transition: "all 0.2s ease",
          "&:hover": {
            width: "12px",
            backgroundColor: "var(--mui-palette-background-paper)",
            "& .toggle-button": {
              opacity: 1,
              transform: "scale(1)",
            },
          },
        }}
      >
        <IconButton
          className="toggle-button"
          sx={{
            position: "absolute",
            top: "50%",
            insetInlineEnd: "-16px",
            transform: "translateY(-50%) scale(0.8)",
            opacity: 0,
            transition: "all 0.2s ease",
            backgroundColor: "var(--mui-palette-background-paper)",
            border: "1px solid var(--mui-palette-border-light)",
            width: "32px",
            height: "32px",
            color: "var(--mui-palette-onSurface)",
            "&:hover": {
              backgroundColor: "var(--mui-palette-background-paper)",
              borderColor: "var(--mui-palette-border-light)",
            },
          }}
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

export function SidebarShell({ navGroups, navItems, activeKey, sidebarWidth, initialSidebarOpen }: SidebarShellProps) {
  return (
    <>
      <SidebarMobileDrawer
        sidebarWidth={sidebarWidth}
        navGroups={navGroups}
        navItems={navItems}
        activeKey={activeKey}
      />
      <SidebarDesktop
        sidebarWidth={sidebarWidth}
        navGroups={navGroups}
        navItems={navItems}
        activeKey={activeKey}
        initialSidebarOpen={initialSidebarOpen}
      />
    </>
  );
}
