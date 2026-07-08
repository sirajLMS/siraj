"use client";

import { Box, Stack, Typography } from "@mui/material";
import { useTranslations } from "next-intl";
import { UserAvatar } from "@/frontend/components/ui";

export type ProfileHeaderProps = {
  name: string;
  email: string;
  role: string;
  avatarUrl?: string | null;
};

export function ProfileHeader({ name, email, role, avatarUrl }: ProfileHeaderProps) {
  const t = useTranslations("profile");

  const roleBadge =
    role === "teacher" ? (
      <Box
        sx={theme => ({
          bgcolor: theme.palette.primary.main,
          color: theme.palette.onPrimary,
          px: 1.25,
          py: 0.5,
          borderRadius: 999,
          fontSize: theme.typography.labelSm.fontSize,
          fontWeight: 600,
          lineHeight: 1.2,
          whiteSpace: "nowrap",
        })}
      >
        {t("role.teacher")}
      </Box>
    ) : role === "parent" ? (
      <Box
        sx={theme => ({
          bgcolor: theme.palette.secondary.main,
          color: theme.palette.onSecondary,
          px: 1.25,
          py: 0.5,
          borderRadius: 999,
          fontSize: theme.typography.labelSm.fontSize,
          fontWeight: 600,
          lineHeight: 1.2,
          whiteSpace: "nowrap",
        })}
      >
        {t("role.parent")}
      </Box>
    ) : role === "staff" ? (
      <Box
        sx={theme => ({
          bgcolor: theme.palette.info.main,
          color: theme.palette.onInfo,
          px: 1.25,
          py: 0.5,
          borderRadius: 999,
          fontSize: theme.typography.labelSm.fontSize,
          fontWeight: 600,
          lineHeight: 1.2,
          whiteSpace: "nowrap",
        })}
      >
        {t("role.staff")}
      </Box>
    ) : null;

  return (
    <Stack
      direction={{ xs: "column", md: "row" }}
      spacing={2}
      sx={_theme => ({
        alignItems: { xs: "flex-start", md: "center" },
        width: "100%",
        pt: { xs: 0.5, md: 0 },
      })}
    >
      <UserAvatar
        src={avatarUrl}
        label={name}
        size={64}
        sx={theme => ({
          bgcolor: avatarUrl ? undefined : theme.palette.primary.main,
          color: avatarUrl ? undefined : theme.palette.onPrimary,
        })}
      />

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          sx={{ alignItems: { xs: "flex-start", sm: "center" }, mb: 0.5 }}
        >
          <Typography
            sx={theme => ({
              color: theme.palette.text.primary,
              fontWeight: 600,
              fontSize: theme.typography.h5.fontSize,
            })}
          >
            {name}
          </Typography>
          {roleBadge}
        </Stack>
        <Typography
          sx={theme => ({
            color: theme.palette.text.secondary,
            fontSize: theme.typography.body1.fontSize,
            wordBreak: "break-word",
          })}
        >
          {email}
        </Typography>
      </Box>
    </Stack>
  );
}
