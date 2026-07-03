"use client";

import ArticleIcon from "@mui/icons-material/Article";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import DeleteIcon from "@mui/icons-material/Delete";
import PauseIcon from "@mui/icons-material/Pause";
import PowerSettingsNewIcon from "@mui/icons-material/PowerSettingsNew";
import { Box, IconButton, Stack, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";

interface AdminActionsBarProps {
  readonly onForceActivate: () => void;
  readonly onStop: () => void;
  readonly onGenerateLog: () => void;
  readonly onReschedule: () => void;
  readonly onDelete: () => void;
  readonly labels: {
    readonly administrativeActions: string;
    readonly generateLog: string;
    readonly reschedule: string;
    readonly forceActivate: string;
    readonly stopPause: string;
    readonly deleteInstance: string;
  };
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
  borderRadius: 2,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
}));

function LeftAdminActions({
  labels,
  onForceActivate,
  onStop,
}: {
  readonly labels: {
    readonly administrativeActions: string;
    readonly forceActivate: string;
    readonly stopPause: string;
  };
  readonly onForceActivate: () => void;
  readonly onStop: () => void;
}) {
  return (
    <Stack direction="row" sx={{ alignItems: "center", gap: 2 }}>
      <Typography variant="labelUppercase">{labels.administrativeActions}</Typography>
      <StyledActionsDivider sx={theme => ({ width: 1, height: 16, backgroundColor: theme.palette.outlineVariant })} />
      <Stack direction="row" sx={{ gap: 1 }}>
        <StyledForceActivateButton
          aria-label="force-activate"
          title={labels.forceActivate}
          onClick={onForceActivate}
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
          })}
        >
          <PowerSettingsNewIcon />
        </StyledForceActivateButton>
        <StyledStopPauseButton
          aria-label="stop-pause"
          title={labels.stopPause}
          onClick={onStop}
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
          })}
        >
          <PauseIcon />
        </StyledStopPauseButton>
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
  onForceActivate,
  onStop,
  onGenerateLog,
  onReschedule,
  onDelete,
  labels,
}: AdminActionsBarProps) {
  return (
    <StyledAdminActionsBar
      sx={theme => ({
        mb: 3,
        backgroundColor: theme.palette.headerContainer,
        color: theme.palette.onHeaderContainer,
        paddingInline: theme.spacing(2),
        paddingBlock: theme.spacing(1.5),
        boxShadow: theme.palette.shadow.card,
      })}
    >
      <LeftAdminActions labels={labels} onForceActivate={onForceActivate} onStop={onStop} />
      <RightAdminActions
        labels={labels}
        onReschedule={onReschedule}
        onGenerateLog={onGenerateLog}
        onDelete={onDelete}
      />
    </StyledAdminActionsBar>
  );
}
