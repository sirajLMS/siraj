"use client";

import { AssignmentTurnedInOutlined, EventRepeatOutlined, PowerSettingsNewOutlined } from "@mui/icons-material";
import { Box, Button, type SxProps, styled, type Theme, Tooltip, Typography } from "@mui/material";
import {
  computeSessionStatus,
  SessionStatus,
  type StatusActionProps,
} from "@/frontend/common/views/dashboard/classes/status/tracking/types";

const StyledActionButton = styled(Button, {
  shouldForwardProp: prop => prop !== "minWidthLg",
})<{ minWidthLg?: number | string }>(({ theme, minWidthLg }) => ({
  fontFamily: '"Inter", sans-serif',
  fontSize: theme.typography.labelUppercase.fontSize,
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  paddingTop: theme.spacing(0.75),
  paddingBottom: theme.spacing(0.75),
  borderRadius: theme.spacing(1.5),
  boxShadow: "none",
  "&:hover": {
    boxShadow: "none",
  },
  "& .MuiButton-startIcon": {
    marginLeft: "-4px",
    marginRight: "-4px",
    [theme.breakpoints.down("lg")]: {
      marginLeft: 0,
      marginRight: 0,
    },
  },
  minWidth: "unset",
  paddingLeft: theme.spacing(2),
  paddingRight: theme.spacing(2),
  [theme.breakpoints.down("lg")]: {
    minWidth: minWidthLg ?? "auto",
    paddingLeft: theme.spacing(1),
    paddingRight: theme.spacing(1),
  },
}));

const StyledTooltip = styled(Tooltip)({
  arrow: true,
  placement: "top",
});

interface ActionButtonWrapperProps {
  readonly id: string;
  readonly label: string;
  readonly icon: React.ReactNode;
  readonly tooltipTitle: React.ReactNode;
  readonly variant?: "contained" | "outlined";
  readonly sx?: SxProps<Theme>;
  readonly minWidthLg?: number | string;
  readonly disabled?: boolean;
  readonly onClick: () => void;
}

const ActionButtonWrapper = ({
  id,
  label,
  icon,
  tooltipTitle,
  variant = "contained",
  sx,
  minWidthLg,
  disabled,
  onClick,
}: ActionButtonWrapperProps) => (
  <StyledTooltip title={tooltipTitle}>
    <StyledActionButton
      id={id}
      variant={variant}
      size="small"
      minWidthLg={minWidthLg}
      disabled={disabled}
      onClick={onClick}
      sx={sx}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        {icon}
        <Typography variant="labelUppercase" sx={{ display: { xs: "none", md: "none", lg: "inline" } }}>
          {label}
        </Typography>
      </Box>
    </StyledActionButton>
  </StyledTooltip>
);

export function StatusAction({ row, labels, onActivate, onReschedule, onVerify }: StatusActionProps) {
  const sessionStatus = computeSessionStatus(row.studentStatus, row.isFrozen, row.executionState);
  const rowId = row.id ?? "";

  if (sessionStatus === SessionStatus.REGULAR) {
    return null;
  }

  if (sessionStatus === SessionStatus.SUSPENDED_PENDING) {
    return (
      <ActionButtonWrapper
        id={`activate-session-${rowId}`}
        label={labels.activate}
        icon={<PowerSettingsNewOutlined />}
        tooltipTitle={
          <Box>
            <Typography
              sx={theme => ({
                fontFamily: '"Inter", sans-serif',
                typography: "labelUppercase",
                fontWeight: 700,
                mb: 0.5,
                color: theme.palette.text.primary,
              })}
            >
              {labels.administrativeHold}
            </Typography>
            <Typography sx={{ typography: "labelUppercase" }}>{labels.holdDescription}</Typography>
          </Box>
        }
        variant="outlined"
        sx={theme => ({
          color: theme.palette.text.secondary,
          borderColor: theme.palette.border.light,
          letterSpacing: "0.06em",
        })}
        disabled
        onClick={() => {
          onActivate(rowId);
        }}
      />
    );
  }

  if (sessionStatus === SessionStatus.ON_LEAVE) {
    return (
      <ActionButtonWrapper
        id={`reschedule-session-${rowId}`}
        label={labels.reschedule}
        icon={<EventRepeatOutlined />}
        tooltipTitle={labels.reschedule}
        sx={theme => ({
          backgroundColor: theme.palette.secondaryContainer,
          color: theme.palette.onSecondaryContainer,
          "&:hover": {
            backgroundColor: theme.palette.secondary.main,
            color: theme.palette.onSecondary,
          },
        })}
        onClick={() => {
          onReschedule(rowId);
        }}
      />
    );
  }

  return (
    <ActionButtonWrapper
      id={`verify-session-${rowId}`}
      label={labels.verifyDocuments}
      icon={<AssignmentTurnedInOutlined />}
      tooltipTitle={labels.verifyDocuments}
      sx={theme => ({
        backgroundColor: theme.palette.status.pendingContainer,
        color: theme.palette.status.onPendingContainer,
        "&:hover": {
          backgroundColor: theme.palette.status.pending,
          color: theme.palette.status.onPending,
        },
      })}
      onClick={() => {
        onVerify(rowId);
      }}
    />
  );
}
