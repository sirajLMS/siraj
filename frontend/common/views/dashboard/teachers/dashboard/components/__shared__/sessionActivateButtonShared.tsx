"use client";

import { Button, CircularProgress, Tooltip } from "@mui/material";
import type { SessionActivateButtonProps } from "@/frontend/common/views/dashboard/teachers/dashboard/types/teacherDashboardComponentProps";

export function SessionActivateButtonShared({
  disabled,
  isConnecting,
  activateLabel,
  connectingLabel,
  tooltip,
  onActivate,
  fullWidth = false,
}: Readonly<SessionActivateButtonProps>) {
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
