"use client";

import { LogoutOutlined } from "@mui/icons-material";
import { Avatar, Box, ButtonBase, Menu, MenuItem, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import type React from "react";
import { useState } from "react";
import { useAuth } from "@/frontend/hooks/useAuth";

export interface UserInfoSlotProps {
  readonly name: string;
  readonly mail: string;
}

export interface LogoutButtonSlotProps {
  readonly onClick: () => void;
}

export interface UserMenuButtonProps {
  readonly userName: string;
  readonly userEmail: string;
  readonly avatarUrl: string;
  readonly onLogout?: () => void;
  readonly slots?: {
    readonly userInfo?: React.ComponentType<UserInfoSlotProps>;
    readonly logoutButton?: React.ComponentType<LogoutButtonSlotProps>;
  };
  readonly slotProps?: {
    readonly userInfo?: Partial<UserInfoSlotProps>;
    readonly logoutButton?: Partial<LogoutButtonSlotProps>;
  };
}

function DefaultUserInfo({ name, mail }: Readonly<UserInfoSlotProps>) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        px: 2.5,
        py: 1.5,
      }}
    >
      <Typography
        variant="bodyLg"
        sx={theme => ({
          fontWeight: 600,
          color: theme.palette.onSurface,
        })}
      >
        {name}
      </Typography>
      <Typography
        variant="bodyMd"
        sx={theme => ({
          color: theme.palette.onSurfaceVariant,
        })}
      >
        {mail}
      </Typography>
    </Box>
  );
}

function DefaultLogoutButton({ onClick }: Readonly<LogoutButtonSlotProps>) {
  const t = useTranslations("dashboard");
  return (
    <MenuItem
      onClick={onClick}
      sx={theme => ({
        gap: 1.5,
        color: theme.palette.error.main,
        borderRadius: 1,
        mx: 1.5,
        mb: 1,
        py: 1,
        "&:hover": {
          bgcolor: theme.palette.errorContainer,
          color: theme.palette.onErrorContainer,
        },
      })}
    >
      <LogoutOutlined fontSize="small" />
      <Typography variant="bodyMd" sx={{ fontWeight: 500 }}>
        {t("nav.logout")}
      </Typography>
    </MenuItem>
  );
}

export function UserMenuButton({
  userName,
  userEmail,
  avatarUrl,
  onLogout,
  slots = {},
  slotProps = {},
}: Readonly<UserMenuButtonProps>) {
  const { logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogoutClick = () => {
    handleClose();
    if (onLogout) {
      onLogout();
    } else {
      logout();
    }
  };

  const UserInfo = slots.userInfo ?? DefaultUserInfo;
  const LogoutButton = slots.logoutButton ?? DefaultLogoutButton;

  return (
    <>
      <ButtonBase
        onClick={handleClick}
        sx={theme => ({
          borderRadius: "50%",
          padding: 0.5,
          border: `2px solid ${theme.palette.onHeaderContainer}`,
          transition: "all 0.2s ease-in-out",
          "&:hover": {
            transform: "scale(1.05)",
            boxShadow: theme.palette.shadow.cardHover,
          },
        })}
        aria-label="user profile menu"
        aria-controls={open ? "user-profile-menu" : undefined}
        aria-haspopup="true"
        aria-expanded={open ? "true" : undefined}
      >
        <Avatar
          src={avatarUrl}
          alt={userName}
          sx={{
            width: { xs: 32, md: 40 },
            height: { xs: 32, md: 40 },
          }}
        />
      </ButtonBase>

      <Menu
        id="user-profile-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "right",
        }}
        slotProps={{
          paper: {
            sx: theme => ({
              mt: 1.5,
              minWidth: 200,
              boxShadow: theme.palette.shadow.card,
              border: `1px solid ${theme.palette.outlineVariant}`,
              borderRadius: 2,
              bgcolor: theme.palette.background.paper,
            }),
          },
        }}
      >
        <UserInfo name={userName} mail={userEmail} {...slotProps.userInfo} />
        <LogoutButton onClick={handleLogoutClick} {...slotProps.logoutButton} />
      </Menu>
    </>
  );
}
