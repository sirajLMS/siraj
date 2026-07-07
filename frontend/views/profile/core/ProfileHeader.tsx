"use client";

import { Avatar, Badge, Box, Stack, Typography } from "@mui/material";
import { useTranslations } from "next-intl";

export type ProfileHeaderProps = {
  name: string;
  email: string;
  role: string;
  avatarUrl?: string | null;
};

export function ProfileHeader({ name, email, role, avatarUrl }: ProfileHeaderProps) {
  const t = useTranslations("profile");

  const getRoleBadge = () => {
    if (role === "teacher") {
      return (
        <Box
          sx={theme => ({
            bgcolor: theme.palette.primary.main,
            color: theme.palette.onPrimary,
            px: 1,
            py: 0.5,
            borderRadius: 1,
            fontSize: theme.typography.body2.fontSize,
            fontWeight: 500,
          })}
        >
          {t("role.teacher")}
        </Box>
      );
    } else if (role === "parent") {
      return (
        <Box
          sx={theme => ({
            bgcolor: theme.palette.secondary.main,
            color: theme.palette.onSecondary,
            px: 1,
            py: 0.5,
            borderRadius: 1,
            fontSize: theme.typography.body2.fontSize,
            fontWeight: 500,
          })}
        >
          {t("role.parent")}
        </Box>
      );
    } else if (role === "staff") {
      return (
        <Box
          sx={theme => ({
            bgcolor: theme.palette.info.main,
            color: theme.palette.onInfo,
            px: 1,
            py: 0.5,
            borderRadius: 1,
            fontSize: theme.typography.body2.fontSize,
            fontWeight: 500,
          })}
        >
          {t("role.staff")}
        </Box>
      );
    }
    return null;
  };

  return (
    <Stack
      direction={{ xs: "column", md: "row" }}
      spacing={2}
      sx={_theme => ({
        alignItems: { xs: "flex-start", md: "center" },
        mb: 3,
        width: "100%",
      })}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <Badge
          overlap="circular"
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          badgeContent={getRoleBadge()}
        >
          <Avatar
            src={avatarUrl ?? undefined}
            sx={theme => ({
              width: 64,
              height: 64,
              bgcolor: avatarUrl ? undefined : theme.palette.primary.main,
            })}
          >
            {name.charAt(0).toUpperCase()}
          </Avatar>
        </Badge>
      </Box>

      <Box sx={{ flex: 1 }}>
        <Typography
          sx={theme => ({
            color: theme.palette.text.primary,
            fontWeight: 600,
            fontSize: theme.typography.h5.fontSize,
          })}
        >
          {name}
        </Typography>
        <Typography
          sx={theme => ({
            color: theme.palette.text.secondary,
            fontSize: theme.typography.body1.fontSize,
          })}
        >
          {email}
        </Typography>
      </Box>
    </Stack>
  );
}
