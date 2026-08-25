"use client";

import { Box, Typography } from "@mui/material";

export interface LeaveRequestReasonBoxProps {
  readonly reason: string | null;
  readonly label: string;
  readonly compact?: boolean;
}

export function LeaveRequestReasonBox({ reason, label, compact = false }: Readonly<LeaveRequestReasonBoxProps>) {
  if (!reason) return null;
  return (
    <Box
      sx={theme => ({
        mt: compact ? 0.5 : 1,
        p: compact ? 1 : 1.5,
        borderRadius: compact ? 1 : 1.5,
        bgcolor: theme.palette.action.hover,
      })}
    >
      <Typography variant="caption" sx={{ fontWeight: 600 }}>
        {label}
      </Typography>
      <Typography variant="body2">{reason}</Typography>
    </Box>
  );
}
