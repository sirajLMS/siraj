"use client";

import { InfoOutlined, SchoolOutlined } from "@mui/icons-material";
import { alpha, Box, Typography } from "@mui/material";
import type { ParentWelcomeHeroProps } from "@/frontend/common/views/dashboard/parent/dashboard/types/parentDashboardComponents.types";

export function ParentWelcomeHeroMobile({
  userName,
  welcomeBackLabel,
  pendingMessagesLabel,
  pendingMessagesCount,
}: Readonly<ParentWelcomeHeroProps>) {
  return (
    <Box
      sx={theme => ({
        mb: 2,
        p: 2,
        borderRadius: 2,
        backgroundColor: theme.palette.primaryContainer,
        color: theme.palette.onPrimary,
        position: "relative",
        overflow: "hidden",
      })}
    >
      <SchoolOutlined
        sx={{
          position: "absolute",
          right: -24,
          bottom: -24,
          fontSize: 120,
          opacity: 0.1,
        }}
      />
      <Box sx={{ position: "relative", zIndex: 1 }}>
        <Typography variant="bodyMd" sx={{ opacity: 0.8, mb: 0.25 }}>
          {welcomeBackLabel}
        </Typography>
        <Typography variant="titleLg" sx={{ fontWeight: 600, mb: 1 }}>
          {userName}
        </Typography>
        <Box
          sx={theme => ({
            display: "inline-flex",
            alignItems: "center",
            gap: 0.75,
            py: 0.25,
            px: 1.25,
            borderRadius: 999,
            backgroundColor: alpha(theme.palette.header, 0.4),
          })}
        >
          <InfoOutlined sx={{ fontSize: 14 }} />
          <Typography variant="labelSm">{pendingMessagesLabel(pendingMessagesCount)}</Typography>
        </Box>
      </Box>
    </Box>
  );
}
