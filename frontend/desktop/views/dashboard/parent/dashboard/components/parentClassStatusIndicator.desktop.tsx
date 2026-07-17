"use client";

import { Box, Typography } from "@mui/material";
import type { Theme } from "@mui/material/styles";
import type { ParentLiveClassStatus } from "@/frontend/common/views/dashboard/parent/dashboard/types/parentDashboardTypes";

export interface ParentClassStatusIndicatorDesktopProps {
  readonly status: ParentLiveClassStatus;
  readonly label: string;
}

function resolveDotColor(status: ParentLiveClassStatus, theme: Theme): string {
  if (status === "starting_soon") {
    return theme.palette.warning.main;
  }
  return theme.palette.outlineVariant;
}

function resolveTextColor(status: ParentLiveClassStatus, theme: Theme): string {
  if (status === "starting_soon") {
    return theme.palette.warning.main;
  }
  return theme.palette.onSurfaceVariant;
}

export function ParentClassStatusIndicatorDesktop({ status, label }: Readonly<ParentClassStatusIndicatorDesktopProps>) {
  const shouldPulse = status === "starting_soon";

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <Box
        sx={theme => ({
          width: 8,
          height: 8,
          borderRadius: "50%",
          backgroundColor: resolveDotColor(status, theme),
          ...(shouldPulse && {
            animation: "pulse 1.5s ease-in-out infinite",
            "@keyframes pulse": {
              "0%, 100%": { opacity: 1 },
              "50%": { opacity: 0.4 },
            },
          }),
        })}
      />
      <Typography
        variant="labelMd"
        sx={theme => ({
          fontWeight: 700,
          textTransform: "uppercase",
          color: resolveTextColor(status, theme),
        })}
      >
        {label}
      </Typography>
    </Box>
  );
}
