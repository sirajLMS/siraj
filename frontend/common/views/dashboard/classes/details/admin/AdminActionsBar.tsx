"use client";

import ArticleIcon from "@mui/icons-material/Article";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import DeleteIcon from "@mui/icons-material/Delete";
import PauseIcon from "@mui/icons-material/Pause";
import PowerSettingsNewIcon from "@mui/icons-material/PowerSettingsNew";
import { Box, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import { styled, type Theme } from "@mui/material/styles";
import type { ReactElement } from "react";
import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
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

const textActionButtonSx = (theme: Theme) => ({
  px: { xs: 1.25, sm: 2 },
  height: 40,
  minWidth: 40,
  backgroundColor: theme.palette.primaryContainer,
  color: theme.palette.onPrimaryContainer,
  border: "none",
  borderRadius: 1.5,
  cursor: "pointer",
  typography: "labelUppercase" as const,
  display: "flex",
  alignItems: "center",
  gap: 1,
  transition: "background 0.15s ease",
  "&:hover": { backgroundColor: theme.palette.primaryContainer, filter: "brightness(0.9)" },
});

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
  );
}

function SecondaryAdminActions({
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
    <>
      <RequirePermission permissions={[AppPermission.SessionReschedule]}>
        <Tooltip title={labels.reschedule}>
          <Box
            component="button"
            aria-label={labels.reschedule}
            onClick={onReschedule}
            sx={theme => textActionButtonSx(theme)}
          >
            <CalendarMonthOutlinedIcon sx={{ fontSize: 16 }} />
            <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
              {labels.reschedule}
            </Box>
          </Box>
        </Tooltip>
      </RequirePermission>
      <Tooltip title={labels.generateLog}>
        <Box
          component="button"
          aria-label={labels.generateLog}
          onClick={onGenerateLog}
          sx={theme => textActionButtonSx(theme)}
        >
          <ArticleIcon sx={{ fontSize: 16 }} />
          <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
            {labels.generateLog}
          </Box>
        </Box>
      </Tooltip>
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
        />
      </Stack>
    </StyledAdminActionsBar>
  );
}
