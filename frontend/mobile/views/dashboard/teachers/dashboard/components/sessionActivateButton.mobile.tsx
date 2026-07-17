"use client";

import { Button, CircularProgress, Tooltip } from "@mui/material";

interface SessionActivateButtonMobileProps {
  readonly disabled: boolean;
  readonly isConnecting: boolean;
  readonly activateLabel: string;
  readonly connectingLabel: string;
  readonly tooltip: string;
  readonly onActivate: () => void;
  readonly fullWidth?: boolean;
}

/**
 * Mobile variant of the session activate button.
 * Purely presentational — full-width outlined/contained button with a
 * connecting-state spinner. Mirrors the shared implementation but lives
 * under `frontend/mobile/views/...` so mobile code never imports common.
 */
export function SessionActivateButtonMobile({
  disabled,
  isConnecting,
  activateLabel,
  connectingLabel,
  tooltip,
  onActivate,
  fullWidth = true,
}: Readonly<SessionActivateButtonMobileProps>) {
  if (isConnecting) {
    return (
      <Tooltip title={tooltip}>
        <span>
          <Button
            fullWidth={fullWidth}
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
        </span>
      </Tooltip>
    );
  }

  return (
    <Tooltip title={tooltip}>
      <span>
        <Button
          fullWidth={fullWidth}
          size="small"
          variant="contained"
          disabled={disabled}
          onClick={onActivate}
          sx={{ typography: "labelUppercase" }}
        >
          {activateLabel}
        </Button>
      </span>
    </Tooltip>
  );
}
