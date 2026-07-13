"use client";

import ArticleIcon from "@mui/icons-material/Article";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import DeleteIcon from "@mui/icons-material/Delete";
import PauseIcon from "@mui/icons-material/Pause";
import PowerSettingsNewIcon from "@mui/icons-material/PowerSettingsNew";
import { Box, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import type { ReactElement } from "react";
import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { edgeToEdgeCardShellSx } from "@/frontend/common/utils/sx/edgeToEdgeSx";
import { mergeSx } from "@/frontend/common/utils/sx/mergeSx";
import {
  getForceActivateDisabledTooltip,
  getStopDisabledTooltip,
} from "@/frontend/common/views/dashboard/classes/details/admin/adminActionTooltips";
import type { AdminViewLabels } from "@/shared/messages/types/message";

type AdminActionLabels = AdminViewLabels["adminActions"];

interface AdminActionsBarProps {
  readonly executionState: string;
  readonly onForceActivate: () => void;
  readonly onStop: () => void;
  readonly onGenerateLog: () => void;
  readonly onReschedule: () => void;
  readonly onDelete: () => void;
  readonly labels: AdminActionLabels;
}

const StyledActionsDivider = styled(Box)(() => ({}));

const StyledForceActivateButton = styled(IconButton)(() => ({
  borderRadius: 1.5,
  transition: "all 0.15s ease",
}));

const StyledStopPauseButton = styled(IconButton)(() => ({
  borderRadius: 1.5,
}));

const StyledDeleteIconButton = styled(IconButton)(() => ({
  borderRadius: 1.5,
  transition: "all 0.15s ease",
}));

const StyledAdminActionsBar = styled(Box)(() => ({
  paddingInline: 2,
  paddingBlock: 1.5,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
}));

function ActionIconButtonWithTooltip({
  ariaLabel,
  enabledTitle,
  disabledTitle,
  disabled,
  onClick,
  icon,
  ButtonComponent,
  sx,
}: {
  readonly ariaLabel: string;
  readonly enabledTitle: string;
  readonly disabledTitle: string | null;
  readonly disabled: boolean;
  readonly onClick: () => void;
  readonly icon: ReactElement;
  readonly ButtonComponent: typeof StyledForceActivateButton;
  readonly sx: Parameters<typeof StyledForceActivateButton>[0]["sx"];
}) {
  const tooltipTitle = disabled && disabledTitle ? disabledTitle : enabledTitle;

  return (
    <Tooltip title={tooltipTitle}>
      <Box component="span" data-testid={`tooltip-target-${ariaLabel}`} sx={{ display: "inline-flex" }}>
        <ButtonComponent aria-label={ariaLabel} disabled={disabled} onClick={onClick} sx={sx}>
          {icon}
        </ButtonComponent>
      </Box>
    </Tooltip>
  );
}

function LeftAdminActions({
  labels,
  executionState,
  onForceActivate,
  onStop,
}: {
  readonly labels: Pick<
    AdminActionLabels,
    "administrativeActions" | "forceActivate" | "stopPause" | "disabledTooltips"
  >;
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
    <Stack direction="row" sx={{ alignItems: "center", gap: 2 }}>
      <Typography variant="labelUppercase">{labels.administrativeActions}</Typography>
      <StyledActionsDivider sx={theme => ({ width: 1, height: 16, backgroundColor: theme.palette.outlineVariant })} />
      <Stack direction="row" sx={{ gap: 1 }}>
        <ActionIconButtonWithTooltip
          ariaLabel="force-activate"
          enabledTitle={labels.forceActivate}
          disabledTitle={forceActivateDisabledTooltip}
          disabled={!canForceActivate}
          onClick={onForceActivate}
          icon={<PowerSettingsNewIcon />}
          ButtonComponent={StyledForceActivateButton}
          sx={theme => ({
            backgroundColor: theme.palette.status.activeContainer,
            color: theme.palette.status.onActiveContainer,
            "&:hover": {
              backgroundColor: theme.palette.status.active,
              filter: "brightness(1.1)",
            },
            "&:active": {
              transform: "scale(0.95)",
            },
            "&.Mui-disabled": {
              opacity: 0.45,
              color: theme.palette.status.onActiveContainer,
              backgroundColor: theme.palette.status.activeContainer,
            },
          })}
        />
        <ActionIconButtonWithTooltip
          ariaLabel="stop-pause"
          enabledTitle={labels.stopPause}
          disabledTitle={stopDisabledTooltip}
          disabled={!canStop}
          onClick={onStop}
          icon={<PauseIcon />}
          ButtonComponent={StyledStopPauseButton}
          sx={theme => ({
            backgroundColor: theme.palette.status.cancelledContainer,
            color: theme.palette.status.onCancelledContainer,
            "&:hover": {
              backgroundColor: theme.palette.status.cancelled,
              filter: "brightness(1.1)",
            },
            "&:active": {
              transform: "scale(0.95)",
            },
            "&.Mui-disabled": {
              opacity: 0.45,
              color: theme.palette.status.onCancelledContainer,
              backgroundColor: theme.palette.status.cancelledContainer,
            },
          })}
        />
      </Stack>
    </Stack>
  );
}

function RightAdminActions({
  labels,
  onReschedule,
  onGenerateLog,
  onDelete,
}: {
  readonly labels: { readonly reschedule: string; readonly generateLog: string; readonly deleteInstance: string };
  readonly onReschedule: () => void;
  readonly onGenerateLog: () => void;
  readonly onDelete: () => void;
}) {
  return (
    <Stack direction="row" sx={{ alignItems: "center", gap: 1.5 }}>
      <RequirePermission permissions={[AppPermission.SessionReschedule]}>
        <Box
          component="button"
          onClick={onReschedule}
          sx={theme => ({
            px: 2,
            height: 40,
            backgroundColor: theme.palette.primaryContainer,
            color: theme.palette.onPrimaryContainer,
            border: "none",
            borderRadius: 1.5,
            cursor: "pointer",
            typography: "labelUppercase",
            display: "flex",
            alignItems: "center",
            gap: 1,
            transition: "background 0.15s ease",
            "&:hover": { backgroundColor: theme.palette.primaryContainer, filter: "brightness(0.9)" },
          })}
        >
          <CalendarMonthOutlinedIcon sx={{ fontSize: 16 }} />
          {labels.reschedule}
        </Box>
      </RequirePermission>
      <Box
        component="button"
        onClick={onGenerateLog}
        sx={theme => ({
          px: 2,
          height: 40,
          backgroundColor: theme.palette.primaryContainer,
          color: theme.palette.onPrimaryContainer,
          border: "none",
          borderRadius: 1.5,
          cursor: "pointer",
          typography: "labelUppercase",
          display: "flex",
          alignItems: "center",
          gap: 1,
          transition: "background 0.15s ease",
          "&:hover": { backgroundColor: theme.palette.primaryContainer, filter: "brightness(0.9)" },
        })}
      >
        <ArticleIcon sx={{ fontSize: 16 }} />
        {labels.generateLog}
      </Box>
      <StyledDeleteIconButton
        aria-label="delete-instance"
        title={labels.deleteInstance}
        onClick={onDelete}
        sx={theme => ({
          backgroundColor: theme.palette.status.blockedContainer,
          color: theme.palette.status.onBlockedContainer,
          "&:hover": {
            backgroundColor: theme.palette.status.blocked,
            filter: "brightness(1.1)",
          },
          "&:active": {
            transform: "scale(0.95)",
          },
        })}
      >
        <DeleteIcon />
      </StyledDeleteIconButton>
    </Stack>
  );
}

export function AdminActionsBar({
  executionState,
  onForceActivate,
  onStop,
  onGenerateLog,
  onReschedule,
  onDelete,
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
      <LeftAdminActions
        labels={labels}
        executionState={executionState}
        onForceActivate={onForceActivate}
        onStop={onStop}
      />
      <RightAdminActions
        labels={labels}
        onReschedule={onReschedule}
        onGenerateLog={onGenerateLog}
        onDelete={onDelete}
      />
    </StyledAdminActionsBar>
  );
}
