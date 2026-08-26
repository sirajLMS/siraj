"use client";

import { Box, Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";
import { UserAvatar } from "@/frontend/common/components/ui/avatar/UserAvatar";

export type ProfileHeaderProps = {
  readonly name: string;
  readonly email: string;
  readonly roleLabel?: string;
  readonly avatarUrl?: string | null;
  readonly showAvatar?: boolean;
  readonly actions?: ReactNode;
};

export function ProfileHeader({ name, email, roleLabel, avatarUrl, showAvatar = true, actions }: ProfileHeaderProps) {
  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      spacing={3}
      sx={{
        alignItems: { xs: "stretch", sm: "center" },
        width: "100%",
        pt: { xs: 0.5, md: 0 },
        pb: 1,
      }}
    >
      <Stack
        direction="row"
        spacing={2}
        sx={{
          alignItems: "center",
          flex: 1,
          minWidth: 0,
        }}
      >
        {showAvatar ? <UserAvatar src={avatarUrl} label={name} size={64} /> : null}

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
            {roleLabel ? (
              <Box
                sx={theme => ({
                  bgcolor: theme.palette.info.main,
                  color: theme.palette.onInfo,
                  px: 1.25,
                  py: 0.5,
                  borderRadius: "9999px",
                  fontSize: theme.typography.labelSm.fontSize,
                  fontWeight: 600,
                  lineHeight: 1.2,
                  whiteSpace: "nowrap",
                })}
              >
                {roleLabel}
              </Box>
            ) : null}
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

      {actions ? (
        <Box
          sx={{
            flexShrink: 0,
            alignSelf: { xs: "stretch", sm: "center" },
            "& > *": { width: { xs: "100%", sm: "auto" } },
          }}
        >
          {actions}
        </Box>
      ) : null}
    </Stack>
  );
}
