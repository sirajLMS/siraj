"use client";

import { AccessTimeOutlined } from "@mui/icons-material";
import { Box, Typography } from "@mui/material";

interface AdminQueueEfficiencyBannerProps {
  readonly avgLabel: string;
  readonly avgValue: string;
  readonly efficiencyNote: string;
}

export function AdminQueueEfficiencyBanner({
  avgLabel,
  avgValue,
  efficiencyNote,
}: Readonly<AdminQueueEfficiencyBannerProps>) {
  return (
    <Box
      sx={theme => ({
        backgroundColor: theme.palette.primary.main,
        color: theme.palette.onPrimary,
        borderRadius: theme.layout.radius.card,
        p: theme.layout.cardPadding,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        boxShadow: theme.palette.shadow.card,
      })}
    >
      <Box>
        <Typography variant="labelMd" sx={{ opacity: 0.7, textTransform: "uppercase" }}>
          {avgLabel}
        </Typography>
        <Typography variant="headlineMd">{avgValue}</Typography>
        <Typography variant="labelMd" sx={{ mt: 1, opacity: 0.8, textTransform: "uppercase" }}>
          {efficiencyNote}
        </Typography>
      </Box>
      <AccessTimeOutlined sx={{ fontSize: 48, opacity: 0.2 }} />
    </Box>
  );
}
