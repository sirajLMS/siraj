import { LogoutOutlined } from "@mui/icons-material";
import { Box, Divider, IconButton, ListItemButton, ListItemIcon, ListItemText, Tooltip } from "@mui/material";
import { UserAvatar } from "@/frontend/common/components/ui/avatar/UserAvatar";
import { mergeSx } from "@/frontend/common/utils/sx/mergeSx";
import {
  getCollapsedSidebarDividerSx,
  getSidebarItemStyles,
} from "@/frontend/common/views/dashboard/components/client/SidebarShell.styles";
import type { SidebarAccountFooterProps } from "@/frontend/common/views/dashboard/components/client/SidebarShell.types";
import { PROFILE_NAV_KEY } from "@/frontend/common/views/dashboard/lib/getDashboardLayoutData";
import { Link } from "@/shared/i18n";

export function SidebarAccountFooter({
  userName,
  avatarUrl,
  logoutLabel,
  isCollapsed,
  activeKey,
}: SidebarAccountFooterProps) {
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
          <UserAvatar src={avatarUrl} label={userName} sx={{ width: 32, height: 32 }} />
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
