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
  };
}

// Thin outlineVariant vertical divider between the label and the action buttons
const StyledActionsDivider = styled(Box)(({ theme }) => ({
  width: 1,
  height: 16,
  backgroundColor: theme.palette.outlineVariant,
}));

// Active-tinted icon button used for the force-activate action
const StyledForceActivateButton = styled(IconButton)(({ theme }) => ({
  backgroundColor: theme.palette.status.activeContainer,
  color: theme.palette.status.onActiveContainer,
  borderRadius: 1.5,
  "&:hover": {
    backgroundColor: theme.palette.status.active,
    filter: "brightness(1.1)",
  },
  "&:active": {
    transform: "scale(0.95)",
  },
  transition: "all 0.15s ease",
}));

// Canceled-tinted icon button used for the stop/pause action
const StyledStopPauseButton = styled(IconButton)(({ theme }) => ({
  backgroundColor: theme.palette.status.cancelledContainer,
  color: theme.palette.status.onCancelledContainer,
  borderRadius: 1.5,
  "&:hover": {
    backgroundColor: theme.palette.status.cancelled,
    filter: "brightness(1.1)",
  },
  "&:active": {
    transform: "scale(0.95)",
  },
}));

// Blocked-tinted icon button used for the delete action
const StyledDeleteIconButton = styled(IconButton)(({ theme }) => ({
  backgroundColor: theme.palette.status.blockedContainer,
  color: theme.palette.status.onBlockedContainer,
  borderRadius: 1.5,
  "&:hover": {
    backgroundColor: theme.palette.status.blocked,
    filter: "brightness(1.1)",
  },
  "&:active": {
    transform: "scale(0.95)",
  },
  transition: "all 0.15s ease",
}));

// Header/onHeader horizontal bar that wraps the left and right admin actions
const StyledAdminActionsBar = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.headerContainer,
  color: theme.palette.onHeaderContainer,
  paddingInline: theme.spacing(2),
  paddingBlock: theme.spacing(1.5),
  borderRadius: 2,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  boxShadow: theme.palette.shadow.card,
}));

function LeftAdminActions({
  labels,
  onForceActivate,
  onStop,
}: {
  readonly labels: { readonly administrativeActions: string };
  readonly onForceActivate: () => void;
  readonly onStop: () => void;
}) {
  return (
    <Stack direction="row" sx={{ alignItems: "center", gap: 2 }}>
      <Typography
        variant="labelUppercase"
        sx={{
          letterSpacing: "0.12em",
        }}
      >
        {labels.administrativeActions}
      </Typography>
      <StyledActionsDivider />
      <Stack direction="row" sx={{ gap: 1 }}>
        <StyledForceActivateButton aria-label="force-activate" title="Force Activate" onClick={onForceActivate}>
          <PowerSettingsNewIcon />
        </StyledForceActivateButton>
        <StyledStopPauseButton aria-label="stop-pause" title="Stop/Pause" onClick={onStop}>
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
  readonly labels: { readonly reschedule: string; readonly generateLog: string };
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
      <StyledDeleteIconButton aria-label="delete-instance" title="Delete Instance" onClick={onDelete}>
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
    <StyledAdminActionsBar sx={{ mb: 3 }}>
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
