"use client";

import { Button, CircularProgress, Tooltip } from "@mui/material";
import type { SessionActivateButtonProps } from "@/frontend/common/views/dashboard/teachers/dashboard/types/teacherDashboardComponentProps";

/**
 * Mobile variant of the session activate button.
 * Purely presentational — full-width outlined/contained button with a
 * connecting-state spinner. Mirrors the shared implementation but lives
 * under `frontend/mobile/views/...` so mobile code never imports common.
 *
 * Plan v5: per specs.md §3 N15 + §4.1 Class B, the byte-identical inline
 * `SessionActivateButtonMobileProps` interface was deleted; both tiers now
 * import the shared `SessionActivateButtonProps` declared once in
 * `frontend/common/views/dashboard/teachers/dashboard/types/teacherDashboardComponentProps.ts`.
 */
export function SessionActivateButtonMobile({
  disabled,
  isConnecting,
  activateLabel,
  connectingLabel,
  tooltip,
  onActivate,
  fullWidth = true,
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
