"use client";

import { Button, CircularProgress, Tooltip } from "@mui/material";
import type { SessionActivateButtonProps } from "@/frontend/common/views/dashboard/teachers/dashboard/types/teacherDashboardComponentProps";

/**
 * Desktop variant of the session activate button.
 * Slightly tighter in shape — desktop status rows don't span full width —
 * so `fullWidth` defaults to `false`.
 *
 * Plan v5: per specs.md §3 N15 + §4.1 Class B, the byte-identical inline
 * `SessionActivateButtonDesktopProps` interface was deleted; both tiers now
 * import the shared `SessionActivateButtonProps` declared once in
 * `frontend/common/views/dashboard/teachers/dashboard/types/teacherDashboardComponentProps.ts`.
 */
export function SessionActivateButtonDesktop({
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
