"use client";

import { Button, ButtonGroup } from "@mui/material";
import type { OverrideState } from "./OverridesTable";

interface OverrideEditControlsProps {
  readonly permissionId: string;
  readonly overrideState: OverrideState;
  readonly isDialogLoading: boolean;
  readonly handleOverrideChange: (permissionId: string, state: OverrideState) => void;
}

export function OverrideEditControls({
  permissionId,
  overrideState,
  isDialogLoading,
  handleOverrideChange,
}: Readonly<OverrideEditControlsProps>) {
  return (
    <ButtonGroup variant="outlined" size="small" fullWidth disabled={isDialogLoading}>
      <Button
        onClick={() => handleOverrideChange(permissionId, "INHERIT")}
        sx={theme => ({
          fontSize: "0.75rem",
          bgcolor: overrideState === "INHERIT" ? theme.palette.primaryContainer : "transparent",
          color: overrideState === "INHERIT" ? theme.palette.onPrimaryContainer : theme.palette.text.secondary,
          borderColor: theme.palette.divider,
          "&:hover": {
            bgcolor: overrideState === "INHERIT" ? theme.palette.primaryContainer : "transparent",
            borderColor: theme.palette.divider,
          },
        })}
      >
        Inherit
      </Button>
      <Button
        onClick={() => handleOverrideChange(permissionId, "GRANTED")}
        sx={theme => ({
          fontSize: "0.75rem",
          bgcolor: overrideState === "GRANTED" ? "rgba(46, 125, 50, 0.15)" : "transparent",
          color: overrideState === "GRANTED" ? theme.palette.success.main : theme.palette.text.secondary,
          borderColor: theme.palette.divider,
          fontWeight: overrideState === "GRANTED" ? 600 : 400,
          "&:hover": {
            bgcolor: overrideState === "GRANTED" ? "rgba(46, 125, 50, 0.15)" : "transparent",
            borderColor: theme.palette.divider,
          },
        })}
      >
        Allow
      </Button>
      <Button
        onClick={() => handleOverrideChange(permissionId, "DENIED")}
        sx={theme => ({
          fontSize: "0.75rem",
          bgcolor: overrideState === "DENIED" ? "rgba(211, 47, 47, 0.15)" : "transparent",
          color: overrideState === "DENIED" ? theme.palette.error.main : theme.palette.text.secondary,
          borderColor: theme.palette.divider,
          fontWeight: overrideState === "DENIED" ? 600 : 400,
          "&:hover": {
            bgcolor: overrideState === "DENIED" ? "rgba(211, 47, 47, 0.15)" : "transparent",
            borderColor: theme.palette.divider,
          },
        })}
      >
        Deny
      </Button>
    </ButtonGroup>
  );
}
