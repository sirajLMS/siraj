"use client";

import { Box, LinearProgress, Typography } from "@mui/material";
import type { Theme } from "@mui/material/styles";
import type { StudentAccountStatus } from "@/frontend/views/dashboard/admin/parents/students/types";

interface ClassesLeftProgressProps {
  readonly remaining: number;
  readonly total: number;
  readonly accountStatus: StudentAccountStatus;
  readonly compact?: boolean;
}

function resolveProgressColor(theme: Theme, accountStatus: StudentAccountStatus, ratio: number): string {
  // Map removed studentProgress to appropriate M3 theme colors
  if (accountStatus === "suspended" || ratio <= 0.15) return theme.palette.error.main;
  if (accountStatus === "on_leave" && ratio >= 1) return theme.palette.success.main;
  if (accountStatus === "deactivated") return theme.palette.outlineVariant;
  return theme.palette.primary.main;
}

export function ClassesLeftProgress({ remaining, total, accountStatus, compact = false }: ClassesLeftProgressProps) {
  const ratio = total > 0 ? remaining / total : 0;
  const progressValue = Math.min(100, Math.round(ratio * 100));

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        width: compact ? "100%" : "auto",
        height: "100%",
      }}
    >
      <Box sx={{ flex: 1, minWidth: compact ? undefined : 96 }}>
        <LinearProgress
          variant="determinate"
          value={progressValue}
          sx={theme => ({
            height: 8,
            borderRadius: 4,
            backgroundColor: theme.palette.surfaceContainer,
            "& .MuiLinearProgress-bar": {
              borderRadius: 4,
              backgroundColor: resolveProgressColor(theme, accountStatus, ratio),
            },
          })}
        />
      </Box>
      <Typography
        variant="labelMd"
        sx={theme => ({
          fontSize: compact ? "11px" : "12px",
          fontWeight: compact ? 700 : 400,
          color: compact ? theme.palette.primary.main : theme.palette.text.secondary,
          whiteSpace: "nowrap",
        })}
      >
        {remaining}/{total}
      </Typography>
    </Box>
  );
}
