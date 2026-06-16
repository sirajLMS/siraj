"use client";

import { Button, CircularProgress } from "@mui/material";

interface SessionActivateButtonProps {
  readonly disabled: boolean;
  readonly isConnecting: boolean;
  readonly activateLabel: string;
  readonly connectingLabel: string;
  readonly onActivate: () => void;
}

export function SessionActivateButton({
  disabled,
  isConnecting,
  activateLabel,
  connectingLabel,
  onActivate,
}: Readonly<SessionActivateButtonProps>) {
  if (isConnecting) {
    return (
      <Button
        fullWidth
        size="small"
        variant="outlined"
        disabled
        startIcon={<CircularProgress size={16} color="inherit" />}
        sx={theme => ({
          typography: "labelUppercase",
          color: theme.palette.error.main,
          borderColor: theme.palette.error.main,
        })}
      >
        {connectingLabel}
      </Button>
    );
  }

  return (
    <Button
      fullWidth
      size="small"
      variant="contained"
      disabled={disabled}
      onClick={onActivate}
      sx={{ typography: "labelUppercase" }}
    >
      {activateLabel}
    </Button>
  );
}
