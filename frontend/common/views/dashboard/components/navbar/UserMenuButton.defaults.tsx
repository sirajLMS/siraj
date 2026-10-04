"use client";

import { LogoutOutlined } from "@mui/icons-material";
import { Box, MenuItem, Typography } from "@mui/material";
import type {
  LogoutButtonSlotProps,
  UserInfoSlotProps,
} from "@/frontend/common/views/dashboard/components/navbar/UserMenuButton.types";
import { Translation, useAppTranslation } from "@/shared/locale";

export function DefaultUserInfo({ name, mail, secondaryLine }: Readonly<UserInfoSlotProps>) {
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
      {secondaryLine ? (
        <Typography
          variant="labelSm"
          sx={theme => ({
            color: theme.palette.onSurfaceVariant,
            mt: 0.25,
          })}
        >
          {secondaryLine}
        </Typography>
      ) : null}
      <Typography
        variant="bodyMd"
        sx={theme => ({
          color: theme.palette.onSurfaceVariant,
          mt: secondaryLine ? 0.5 : 0,
        })}
      >
        {mail}
      </Typography>
    </Box>
  );
}

export function DefaultLogoutButton({ onClick }: Readonly<LogoutButtonSlotProps>) {
  const t = useAppTranslation(Translation.Dashboard.CoreNav);
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
          backgroundColor: theme.palette.errorContainer,
          color: theme.palette.onErrorContainer,
        },
      })}
    >
      <LogoutOutlined fontSize="small" />
      <Typography variant="bodyMd" sx={{ fontWeight: 500 }}>
        {t.logout}
      </Typography>
    </MenuItem>
  );
}
