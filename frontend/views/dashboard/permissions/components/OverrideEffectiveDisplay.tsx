"use client";

import { BlockOutlined, CheckCircleOutlined } from "@mui/icons-material";
import { Box, Typography } from "@mui/material";
import type { OverrideState } from "./OverridesTable";

interface OverrideEffectiveDisplayProps {
  readonly effectiveState: "allowed" | "denied" | "not_set";
  readonly overrideState: OverrideState;
}

export function OverrideEffectiveDisplay({ effectiveState, overrideState }: Readonly<OverrideEffectiveDisplayProps>) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      {effectiveState === "allowed" && (
        <Box
          sx={theme => ({
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            color: theme.palette.success.main,
            fontSize: "0.875rem",
            fontWeight: 600,
          })}
        >
          <CheckCircleOutlined fontSize="small" />
          Allowed
        </Box>
      )}
      {effectiveState === "denied" && (
        <Box
          sx={theme => ({
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            color: theme.palette.error.main,
            fontSize: "0.875rem",
            fontWeight: 600,
          })}
        >
          <BlockOutlined fontSize="small" />
          Denied
        </Box>
      )}
      {effectiveState === "not_set" && (
        <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
          Not Set
        </Typography>
      )}
      <Typography
        variant="caption"
        sx={theme => ({
          color: theme.palette.text.disabled,
          fontSize: "0.75rem",
          ml: 1,
        })}
      >
        {overrideState === "GRANTED" && "(Explicit Grant)"}
        {overrideState === "DENIED" && "(Explicit Deny)"}
        {overrideState === "INHERIT" && "(Inherited)"}
      </Typography>
    </Box>
  );
}
