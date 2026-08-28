"use client";

import { AssignmentTurnedInOutlined, EventRepeatOutlined, PowerSettingsNewOutlined } from "@mui/icons-material";
import { Box, type ButtonProps, type SxProps, type Theme, Tooltip, Typography } from "@mui/material";
import type { ComponentType, ReactElement, ReactNode } from "react";
import { FilterButton, PrimaryPageAction } from "@/frontend/common/components/ui";
import {
  computeSessionStatus,
  SessionStatus,
  type StatusActionProps,
} from "@/frontend/common/views/dashboard/classes/status/tracking/types";

interface StatusActionButtonProps {
  readonly id: string;
  readonly label: string;
  readonly icon: ReactElement;
  readonly tooltipTitle: ReactNode;
  readonly ActionButton: ComponentType<ButtonProps>;
  readonly sx?: SxProps<Theme>;
  readonly disabled?: boolean;
  readonly onClick: () => void;
}

function StatusActionButton({
  id,
  label,
  icon,
  tooltipTitle,
  ActionButton,
  sx,
  disabled,
  onClick,
}: Readonly<StatusActionButtonProps>) {
  return (
    <Tooltip title={tooltipTitle}>
      <Box component="span" sx={{ display: "inline-flex" }}>
        <ActionButton id={id} size="small" disabled={disabled} onClick={onClick} startIcon={icon} sx={sx}>
          <Box component="span" sx={{ display: { xs: "none", lg: "inline" } }}>
            {label}
          </Box>
        </ActionButton>
      </Box>
    </Tooltip>
  );
}

export function StatusAction({ row, labels, onActivate, onReschedule, onVerify }: StatusActionProps) {
  const sessionStatus = computeSessionStatus(row.studentStatus, row.isFrozen, row.executionState);
  const rowId = row.id ?? "";

  if (sessionStatus === SessionStatus.REGULAR) {
    return null;
  }

  if (sessionStatus === SessionStatus.SUSPENDED_PENDING) {
    return (
      <StatusActionButton
        id={`activate-session-${rowId}`}
        label={labels.activate}
        icon={<PowerSettingsNewOutlined />}
        tooltipTitle={
          <Box>
            <Typography
              sx={theme => ({
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
        ActionButton={FilterButton}
        sx={theme => ({
          color: theme.palette.text.secondary,
          borderColor: theme.palette.border.light,
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
      <StatusActionButton
        id={`reschedule-session-${rowId}`}
        label={labels.reschedule}
        icon={<EventRepeatOutlined />}
        tooltipTitle={labels.reschedule}
        ActionButton={PrimaryPageAction}
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
    <StatusActionButton
      id={`verify-session-${rowId}`}
      label={labels.verifyDocuments}
      icon={<AssignmentTurnedInOutlined />}
      tooltipTitle={labels.verifyDocuments}
      ActionButton={PrimaryPageAction}
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
