import { KeyboardArrowDownOutlined, KeyboardArrowUpOutlined } from "@mui/icons-material";
import { Box, Divider, ListItem, ListItemButton, ListItemIcon, ListItemText, Tooltip } from "@mui/material";
import {
  getCollapsedSidebarDividerSx,
  getGroupTitleStyles,
  getSidebarItemStyles,
} from "@/frontend/common/views/dashboard/components/client/SidebarShell.styles";
import type {
  SidebarGroupHeaderProps,
  SidebarNavItemProps,
  TranslatedNavGroup,
} from "@/frontend/common/views/dashboard/components/client/SidebarShell.types";
import { NavIcon } from "@/frontend/common/views/dashboard/config/navIconRegistry";
import { Link } from "@/shared/i18n";

export function SidebarNavItem({ item, isActive = false, isCollapsed, isFooter = false }: SidebarNavItemProps) {
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

export function SidebarGroupStaticTitle({
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

export function SidebarGroupHeader({
  group,
  isCollapsed,
  collapsed,
  onToggle,
  toggleGroupAriaLabel,
}: SidebarGroupHeaderProps) {
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
      aria-label={toggleGroupAriaLabel(group.label)}
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
