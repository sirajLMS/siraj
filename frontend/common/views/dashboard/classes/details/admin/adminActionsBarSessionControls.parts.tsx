"use client";

import PauseIcon from "@mui/icons-material/Pause";
import PowerSettingsNewIcon from "@mui/icons-material/PowerSettingsNew";
import { Box, IconButton, Stack, Tooltip } from "@mui/material";
import type { ReactElement } from "react";
import {
  type AdminActionLabels,
  FORCE_ACTIVATE_TINT,
  STOP_PAUSE_TINT,
  tintedIconActionSx,
} from "@/frontend/common/views/dashboard/classes/details/admin/adminActionsBar.helpers";
import {
  getForceActivateDisabledTooltip,
  getStopDisabledTooltip,
} from "@/frontend/common/views/dashboard/classes/details/admin/adminActionTooltips";

interface SessionIconActionProps {
  readonly ariaLabel: string;
  readonly enabledTitle: string;
  readonly disabledTitle: string | null;
  readonly disabled: boolean;
  readonly onClick: () => void;
  readonly icon: ReactElement;
  readonly sx: ReturnType<typeof tintedIconActionSx>;
}

function SessionIconAction({
  ariaLabel,
  enabledTitle,
  disabledTitle,
  disabled,
  onClick,
  icon,
  sx,
}: SessionIconActionProps) {
  const tooltipTitle = disabled && disabledTitle ? disabledTitle : enabledTitle;

  return (
    <Tooltip title={tooltipTitle}>
      <Box data-testid={`tooltip-target-${ariaLabel}`} sx={{ display: "inline-flex" }}>
        <IconButton aria-label={ariaLabel} disabled={disabled} onClick={onClick} sx={sx}>
          {icon}
        </IconButton>
      </Box>
    </Tooltip>
  );
}

interface SessionControlButtonsProps {
  readonly labels: Pick<AdminActionLabels, "forceActivate" | "stopPause" | "disabledTooltips">;
  readonly executionState: string;
  readonly onForceActivate: () => void;
  readonly onStop: () => void;
}

export function SessionControlButtons({ labels, executionState, onForceActivate, onStop }: SessionControlButtonsProps) {
  const canForceActivate = executionState === "NOT_ACTIVATED";
  const canStop = executionState === "RUNNING";
  const forceActivateDisabledTooltip = getForceActivateDisabledTooltip(
    executionState,
    labels.disabledTooltips.forceActivate
  );
  const stopDisabledTooltip = getStopDisabledTooltip(executionState, labels.disabledTooltips.stop);

  return (
    <Stack direction="row" sx={{ gap: 1, flex: "0 0 auto" }}>
      <SessionIconAction
        ariaLabel="force-activate"
        enabledTitle={labels.forceActivate}
        disabledTitle={forceActivateDisabledTooltip}
        disabled={!canForceActivate}
        onClick={onForceActivate}
        icon={<PowerSettingsNewIcon />}
        sx={tintedIconActionSx(FORCE_ACTIVATE_TINT)}
      />
      <SessionIconAction
        ariaLabel="stop-pause"
        enabledTitle={labels.stopPause}
        disabledTitle={stopDisabledTooltip}
        disabled={!canStop}
        onClick={onStop}
        icon={<PauseIcon />}
        sx={tintedIconActionSx(STOP_PAUSE_TINT)}
      />
    </Stack>
  );
}
