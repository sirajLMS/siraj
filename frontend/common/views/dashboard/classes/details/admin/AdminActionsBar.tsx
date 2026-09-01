"use client";

import ArticleIcon from "@mui/icons-material/Article";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import PauseIcon from "@mui/icons-material/Pause";
import PowerSettingsNewIcon from "@mui/icons-material/PowerSettingsNew";
import { Box, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import { styled, type Theme } from "@mui/material/styles";
import type { ReactElement } from "react";
import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { ExportButton, FilterButton } from "@/frontend/common/components/ui";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql";
import { edgeToEdgeCardShellSx } from "@/frontend/common/utils/sx/edgeToEdgeSx";
import { mergeSx } from "@/frontend/common/utils/sx/mergeSx";
import {
  getForceActivateDisabledTooltip,
  getStopDisabledTooltip,
} from "@/frontend/common/views/dashboard/classes/details/admin/adminActionTooltips";
import type { AdminViewLabels } from "@/shared/locale";

type AdminActionLabels = AdminViewLabels["adminActions"];

interface AdminActionsBarProps {
  readonly executionState: string;
  readonly onForceActivate: () => void;
  readonly onStop: () => void;
  readonly onGenerateLog: () => void;
  readonly onReschedule: () => void;
  readonly onDelete: () => void;
  readonly onOverrideRate: () => void;
  readonly labels: AdminActionLabels;
}

const StyledActionsDivider = styled(Box)(() => ({}));

const StyledAdminActionsBar = styled(Box)(({ theme }) => ({
  paddingInline: theme.spacing(2),
  paddingBlock: theme.spacing(1.5),
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  justifyContent: "space-between",
  gap: theme.spacing(1.5),
  [theme.breakpoints.down("sm")]: {
    flexDirection: "column",
    alignItems: "stretch",
  },
}));

interface StatusTintTokens {
  readonly container: (theme: Theme) => string;
  readonly onContainer: (theme: Theme) => string;
  readonly strong: (theme: Theme) => string;
}

/** Tonal icon-action styling driven by the shared `palette.status` token family. */
function tintedIconActionSx(tint: StatusTintTokens) {
  return (theme: Theme) => ({
    borderRadius: 1.5,
    backgroundColor: tint.container(theme),
    color: tint.onContainer(theme),
    transition: theme.transitions.create("background", { duration: 150, easing: "ease" }),
    "&:hover": { backgroundColor: tint.strong(theme), filter: "brightness(1.1)" },
    "&:active": { transform: "scale(0.95)" },
    "&.Mui-disabled": {
      opacity: 0.45,
      backgroundColor: tint.container(theme),
      color: tint.onContainer(theme),
    },
  });
}

const FORCE_ACTIVATE_TINT: StatusTintTokens = {
  container: theme => theme.palette.status.activeContainer,
  onContainer: theme => theme.palette.status.onActiveContainer,
  strong: theme => theme.palette.status.active,
};

const STOP_PAUSE_TINT: StatusTintTokens = {
  container: theme => theme.palette.status.cancelledContainer,
  onContainer: theme => theme.palette.status.onCancelledContainer,
  strong: theme => theme.palette.status.cancelled,
};

const DELETE_TINT: StatusTintTokens = {
  container: theme => theme.palette.status.blockedContainer,
  onContainer: theme => theme.palette.status.onBlockedContainer,
  strong: theme => theme.palette.status.blocked,
};

function SessionIconAction({
  ariaLabel,
  enabledTitle,
  disabledTitle,
  disabled,
  onClick,
  icon,
  sx,
}: {
  readonly ariaLabel: string;
  readonly enabledTitle: string;
  readonly disabledTitle: string | null;
  readonly disabled: boolean;
  readonly onClick: () => void;
  readonly icon: ReactElement;
  readonly sx: ReturnType<typeof tintedIconActionSx>;
}) {
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

function SessionControlButtons({
  labels,
  executionState,
  onForceActivate,
  onStop,
}: {
  readonly labels: Pick<AdminActionLabels, "forceActivate" | "stopPause" | "disabledTooltips">;
  readonly executionState: string;
  readonly onForceActivate: () => void;
  readonly onStop: () => void;
}) {
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

function SecondaryAdminActions({
  labels,
  onReschedule,
  onGenerateLog,
  onDelete,
  onOverrideRate,
}: {
  readonly labels: {
    readonly reschedule: string;
    readonly generateLog: string;
    readonly deleteInstance: string;
    readonly overrideRateButton: string;
  };
  readonly onReschedule: () => void;
  readonly onGenerateLog: () => void;
  readonly onDelete: () => void;
  readonly onOverrideRate: () => void;
}) {
  return (
    <>
      <RequirePermission permissions={[AppPermission.SessionReschedule]}>
        <Tooltip title={labels.reschedule}>
          <FilterButton
            aria-label={labels.reschedule}
            onClick={onReschedule}
            startIcon={<CalendarMonthOutlinedIcon sx={{ fontSize: 16 }} />}
            sx={{ textTransform: "none" }}
          >
            <Box sx={{ display: { xs: "none", sm: "inline" } }}>{labels.reschedule}</Box>
          </FilterButton>
        </Tooltip>
      </RequirePermission>
      <Tooltip title={labels.generateLog}>
        <ExportButton
          aria-label={labels.generateLog}
          onClick={onGenerateLog}
          startIcon={<ArticleIcon sx={{ fontSize: 16 }} />}
          sx={{ textTransform: "none" }}
        >
          <Box sx={{ display: { xs: "none", sm: "inline" } }}>{labels.generateLog}</Box>
        </ExportButton>
      </Tooltip>
      <Tooltip title={labels.overrideRateButton}>
        <FilterButton
          aria-label={labels.overrideRateButton}
          onClick={onOverrideRate}
          startIcon={<EditIcon sx={{ fontSize: 16 }} />}
          sx={{ textTransform: "none" }}
        >
          <Box sx={{ display: { xs: "none", sm: "inline" } }}>{labels.overrideRateButton}</Box>
        </FilterButton>
      </Tooltip>
      <Tooltip title={labels.deleteInstance}>
        <IconButton
          aria-label={labels.deleteInstance}
          onClick={onDelete}
          sx={tintedIconActionSx(DELETE_TINT)}
        >
          <DeleteIcon />
        </IconButton>
      </Tooltip>
    </>
  );
}

export function AdminActionsBar({
  executionState,
  onForceActivate,
  onStop,
  onGenerateLog,
  onReschedule,
  onDelete,
  onOverrideRate,
  labels,
}: AdminActionsBarProps) {
  return (
    <StyledAdminActionsBar
      sx={mergeSx(
        theme => ({
          mb: { xs: 0, lg: 3 },
          backgroundColor: theme.palette.headerContainer,
          color: theme.palette.onHeaderContainer,
          paddingInline: theme.spacing(2),
          paddingBlock: theme.spacing(1.5),
          boxShadow: theme.palette.shadow.card,
        }),
        edgeToEdgeCardShellSx
      )}
    >
      <Typography variant="labelUppercase" sx={{ flex: "1 1 auto", minWidth: 0 }}>
        {labels.administrativeActions}
      </Typography>

      <StyledActionsDivider
        sx={theme => ({
          width: 1,
          height: 16,
          backgroundColor: theme.palette.outlineVariant,
          display: { xs: "none", md: "block" },
        })}
      />

      <Stack
        direction="row"
        sx={{
          alignItems: "center",
          gap: 1,
          flexWrap: "wrap",
          minWidth: 0,
          flex: { xs: "1 1 auto", sm: "0 1 auto" },
          justifyContent: { xs: "flex-start", sm: "flex-end" },
        }}
      >
        <SessionControlButtons
          labels={labels}
          executionState={executionState}
          onForceActivate={onForceActivate}
          onStop={onStop}
        />
        <SecondaryAdminActions
          labels={labels}
          onReschedule={onReschedule}
          onGenerateLog={onGenerateLog}
          onDelete={onDelete}
          onOverrideRate={onOverrideRate}
        />
      </Stack>
    </StyledAdminActionsBar>
  );
}
