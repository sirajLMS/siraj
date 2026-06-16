"use client";

import { InfoOutlined, SchoolOutlined } from "@mui/icons-material";
import { alpha, Box, Typography } from "@mui/material";

interface ParentWelcomeHeroProps {
  readonly userName: string;
  readonly welcomeBackLabel: string;
  readonly pendingMessagesLabel: string;
}

export function ParentWelcomeHero({
  userName,
  welcomeBackLabel,
  pendingMessagesLabel,
}: Readonly<ParentWelcomeHeroProps>) {
  return (
    <Box
      sx={theme => ({
        mb: 3,
        p: 3,
        borderRadius: 3,
        bgcolor: theme.palette.primaryContainer,
        color: theme.palette.onPrimary,
        position: "relative",
        overflow: "hidden",
      })}
    >
      <SchoolOutlined
        sx={{
          position: "absolute",
          right: -32,
          bottom: -32,
          fontSize: 160,
          opacity: 0.1,
        }}
      />
      <Box sx={{ position: "relative", zIndex: 1 }}>
        <Typography variant="bodyMd" sx={{ opacity: 0.8, mb: 0.5 }}>
          {welcomeBackLabel}
        </Typography>
        <Typography variant="headlineMd" sx={{ fontWeight: 600, mb: 1.5 }}>
          {userName}
        </Typography>
        <Box
          sx={theme => ({
            display: "inline-flex",
            alignItems: "center",
            gap: 1,
            py: 0.5,
            px: 1.5,
            borderRadius: 999,
            bgcolor: alpha(theme.palette.header, 0.4),
          })}
        >
          <InfoOutlined sx={{ fontSize: 16 }} />
          <Typography variant="labelMd">{pendingMessagesLabel}</Typography>
        </Box>
      </Box>
    </Box>
  );
}
