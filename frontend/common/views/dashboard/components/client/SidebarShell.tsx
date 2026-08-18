"use client";

import {
  ChevronLeft,
  ChevronRight,
  KeyboardArrowDownOutlined,
  KeyboardArrowUpOutlined,
  LogoutOutlined,
} from "@mui/icons-material";
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
import { UserAvatar } from "@/frontend/common/components/ui/avatar/UserAvatar";
import { useLayoutStore } from "@/frontend/common/stores/layoutStore";
import { mergeSx } from "@/frontend/common/utils/sx/mergeSx";
import { NavIcon } from "@/frontend/common/views/dashboard/config/navIconRegistry";
import { SIDEBAR_END_NAV_ITEM_KEYS } from "@/frontend/common/views/dashboard/config/navigationConfig";
import { PROFILE_NAV_KEY } from "@/frontend/common/views/dashboard/lib/getDashboardLayoutData";
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
  readonly userName: string;
  readonly avatarUrl: string;
  readonly logoutLabel: string;
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
    py: isCollapsed ? 1 : 1.25,
    px: isCollapsed ? 0 : 2,
    justifyContent: isCollapsed ? "center" : "flex-start",
    backgroundColor: isActive ? "var(--mui-palette-primaryContainer)" : "transparent",
    color: isActive ? "var(--mui-palette-primary-main)" : "var(--mui-palette-onSurfaceVariant)",
    touchAction: "pan-y",
    "&:hover": {
      backgroundColor: "color-mix(in srgb, var(--mui-palette-primary-main) 8%, transparent)",
      color: "var(--mui-palette-primary-main)",
    },
    transition: theme.transitions.create("all", { duration: 200, easing: "ease" }),
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
  });
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

function getGroupTitleStyles(): SxProps<Theme> {
  return {
    typography: "labelSm",
    fontWeight: 600,
    color: "var(--mui-palette-onSurfaceVariant)",
    opacity: 0.85,
    letterSpacing: "0.04em",
    px: 2,
    py: 0.5,
    display: "block",
  };
}

/** Full-width divider in collapsed icon mode. */
function getCollapsedSidebarDividerSx(extra?: SxProps<Theme>): SxProps<Theme> {
  return mergeSx(
    {
      borderColor: "var(--mui-palette-outlineVariant)",
      width: "100%",
    },
    extra
  );
}

interface SidebarGroupHeaderProps {
  readonly group: TranslatedNavGroup;
  readonly isCollapsed: boolean;
  readonly collapsed: boolean;
  readonly onToggle: () => void;
}

function SidebarGroupStaticTitle({
  group,
  isCollapsed,
}: {
  readonly group: TranslatedNavGroup;
  readonly isCollapsed: boolean;
}) {
  if (isCollapsed) {
    return <Divider sx={getCollapsedSidebarDividerSx({ my: 1 })} />;
  }

  return (
    <Box component="span" sx={getGroupTitleStyles()}>
      {group.label}
    </Box>
  );
}

function SidebarGroupHeader({ group, isCollapsed, collapsed, onToggle }: SidebarGroupHeaderProps) {
  const Chevron = collapsed ? KeyboardArrowDownOutlined : KeyboardArrowUpOutlined;

  if (isCollapsed) {
    // Icon-only mode (desktop sidebar collapsed to 80px): no group headers,
    // just a thin separator so users see the grouping visually.
    return <Divider sx={getCollapsedSidebarDividerSx({ my: 1 })} />;
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
        touchAction: "pan-y",
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
            sx: getGroupTitleStyles(),
          },
        }}
      />
      <Chevron fontSize="small" sx={{ color: "inherit", opacity: 0.7 }} />
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
): {
  readonly grouped: readonly RenderedGroup[];
  readonly noGroup: readonly TranslatedNavItem[];
  readonly endItems: readonly TranslatedNavItem[];
} {
  const itemsByGroupId = new Map<string, TranslatedNavItem[]>();
  const noGroup: TranslatedNavItem[] = [];
  const endItems: TranslatedNavItem[] = [];
  for (const item of items) {
    if (SIDEBAR_END_NAV_ITEM_KEYS.has(item.key)) {
      endItems.push(item);
      continue;
    }
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
  return { grouped, noGroup, endItems };
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
  const { grouped, noGroup, endItems } = bucketItemsByGroup(groups, items);
  useCollapsedGroupState(groups);
  const toggleGroupCollapsed = useLayoutStore(state => state.toggleGroupCollapsed);
  const collapsedGroups = useLayoutStore(state => state.collapsedGroups);
  const hasLeadingNav = noGroup.length > 0 || grouped.length > 0;

  return (
    <Box
      ref={navListRef}
      sx={{
        flex: 1,
        minHeight: 0,
        flexBasis: 0,
        overflowY: "auto",
        overflowX: "hidden",
        overscrollBehavior: "contain",
        WebkitOverflowScrolling: "touch",
        touchAction: "pan-y",
        py: isCollapsed ? 1.5 : 2,
        px: isCollapsed ? 0 : 1.5,
        "&::-webkit-scrollbar": { width: 4 },
        "&::-webkit-scrollbar-thumb": {
          backgroundColor: "var(--mui-palette-outlineVariant)",
          borderRadius: 12,
        },
      }}
    >
      <List component="nav" sx={{ p: 0 }}>
        {noGroup.length > 0
          ? noGroup.map(item => (
              <SidebarNavItem key={item.key} item={item} isActive={item.key === activeKey} isCollapsed={isCollapsed} />
            ))
          : null}

        {grouped.map(({ group, items: groupItems }, index) => {
          const isSingleItemGroup = groupItems.length === 1;
          const collapsed = collapsedGroups[group.id] ?? group.defaultCollapsed ?? false;
          const showSeparator = index > 0 || noGroup.length > 0;
          return (
            <Box key={group.id}>
              {group.separator && showSeparator && !isCollapsed ? (
                <Divider sx={{ borderColor: "var(--mui-palette-outlineVariant)", my: 1, mx: 0.5 }} />
              ) : null}
              {isSingleItemGroup ? (
                <>
                  <SidebarGroupStaticTitle group={group} isCollapsed={isCollapsed} />
                  {groupItems.map(item => (
                    <SidebarNavItem
                      key={item.key}
                      item={item}
                      isActive={item.key === activeKey}
                      isCollapsed={isCollapsed}
                    />
                  ))}
                </>
              ) : (
                <>
                  <SidebarGroupHeader
                    group={group}
                    isCollapsed={isCollapsed}
                    collapsed={collapsed}
                    onToggle={() => toggleGroupCollapsed(group.id)}
                  />
                  <Collapse in={!collapsed} timeout="auto" unmountOnExit>
                    <List
                      component="div"
                      disablePadding
                      sx={{ px: 0, pb: 0.5, paddingInlineStart: isCollapsed ? 0 : 2 }}
                    >
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
                </>
              )}
            </Box>
          );
        })}

        {endItems.length > 0 && hasLeadingNav ? (
          <Divider
            sx={{
              borderColor: "var(--mui-palette-outlineVariant)",
              my: 1,
              mx: isCollapsed ? 0 : 0.5,
              width: isCollapsed ? "100%" : undefined,
            }}
          />
        ) : null}
        {endItems.map(item => (
          <SidebarNavItem key={item.key} item={item} isActive={item.key === activeKey} isCollapsed={isCollapsed} />
        ))}
      </List>
    </Box>
  );
}

function SidebarAccountFooter({
  userName,
  avatarUrl,
  logoutLabel,
  isCollapsed,
  activeKey,
}: {
  readonly userName: string;
  readonly avatarUrl: string;
  readonly logoutLabel: string;
  readonly isCollapsed: boolean;
  readonly activeKey: string | null;
}) {
  const isProfileActive = activeKey === PROFILE_NAV_KEY;
  const isExpanded = !isCollapsed;

  const profileButton = (
    <Link href="/profile" style={{ textDecoration: "none" }}>
      <ListItemButton
        selected={isProfileActive}
        sx={mergeSx(getSidebarItemStyles(isCollapsed, isProfileActive), {
          py: 1,
          flex: 1,
          minWidth: 0,
        })}
      >
        <ListItemIcon sx={{ minWidth: isCollapsed ? "unset" : 40, color: "inherit" }}>
          <UserAvatar src={avatarUrl} sx={{ width: 32, height: 32 }} />
        </ListItemIcon>
        {isExpanded && (
          <ListItemText
            primary={userName}
            slotProps={{
              primary: {
                sx: {
                  typography: "labelMd",
                  fontWeight: isProfileActive ? 700 : 600,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                },
              },
            }}
          />
        )}
      </ListItemButton>
    </Link>
  );

  const logoutButton = (
    <IconButton
      aria-label={logoutLabel}
      onClick={() => {
        window.location.replace("/logout");
      }}
      sx={{
        color: "var(--mui-palette-onSurfaceVariant)",
        "&:hover": {
          backgroundColor: "color-mix(in srgb, var(--mui-palette-primary-main) 8%, transparent)",
          color: "var(--mui-palette-primary-main)",
        },
      }}
    >
      <LogoutOutlined fontSize="small" />
    </IconButton>
  );

  return (
    <Box sx={{ px: isCollapsed ? 0 : 1.5, py: isCollapsed ? 1 : 1.5, flexShrink: 0 }}>
      <Divider
        sx={
          isCollapsed
            ? getCollapsedSidebarDividerSx({ mb: 1 })
            : { borderColor: "var(--mui-palette-outlineVariant)", mb: 1 }
        }
      />
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 0.5,
        }}
      >
        {isCollapsed ? (
          <Tooltip title={userName} placement="right">
            {profileButton}
          </Tooltip>
        ) : (
          profileButton
        )}
        {isExpanded && logoutButton}
      </Box>
    </Box>
  );
}

function SidebarContent({
  navGroups,
  navItems,
  activeKey,
  isCollapsed,
  navListRef,
  userName,
  avatarUrl,
  logoutLabel,
}: {
  readonly navGroups: readonly TranslatedNavGroup[];
  readonly navItems: readonly TranslatedNavItem[];
  readonly activeKey: string | null;
  readonly isCollapsed: boolean;
  readonly navListRef?: RefObject<HTMLElement | null>;
  readonly userName: string;
  readonly avatarUrl: string;
  readonly logoutLabel: string;
}) {
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

function SidebarMobileDrawer({
  sidebarWidth,
  navGroups,
  navItems,
  activeKey,
  userName,
  avatarUrl,
  logoutLabel,
}: {
  readonly sidebarWidth: string;
  readonly navGroups: readonly TranslatedNavGroup[];
  readonly navItems: readonly TranslatedNavItem[];
  readonly activeKey: string | null;
  readonly userName: string;
  readonly avatarUrl: string;
  readonly logoutLabel: string;
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
      />
    </Drawer>
  );
}

function SidebarDesktop({
  sidebarWidth,
  navGroups,
  navItems,
  activeKey,
  initialSidebarOpen = true,
  userName,
  avatarUrl,
  logoutLabel,
}: {
  readonly sidebarWidth: string;
  readonly navGroups: readonly TranslatedNavGroup[];
  readonly navItems: readonly TranslatedNavItem[];
  readonly activeKey: string | null;
  readonly initialSidebarOpen?: boolean;
  readonly userName: string;
  readonly avatarUrl: string;
  readonly logoutLabel: string;
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
      />

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
        <IconButton
          className="toggle-button"
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
      </Box>
    </Box>
  );
}

export function SidebarShell({
  navGroups,
  navItems,
  activeKey,
  sidebarWidth,
  initialSidebarOpen,
  userName,
  avatarUrl,
  logoutLabel,
}: SidebarShellProps) {
  return (
    <>
      <SidebarMobileDrawer
        sidebarWidth={sidebarWidth}
        navGroups={navGroups}
        navItems={navItems}
        activeKey={activeKey}
        userName={userName}
        avatarUrl={avatarUrl}
        logoutLabel={logoutLabel}
      />
      <SidebarDesktop
        sidebarWidth={sidebarWidth}
        navGroups={navGroups}
        navItems={navItems}
        activeKey={activeKey}
        initialSidebarOpen={initialSidebarOpen}
        userName={userName}
        avatarUrl={avatarUrl}
        logoutLabel={logoutLabel}
      />
    </>
  );
}
