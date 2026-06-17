"use client";

import { LoginOutlined, LogoutOutlined, OndemandVideoOutlined } from "@mui/icons-material";
import { alpha, Button } from "@mui/material";
import type { ClassSessionAction } from "@/frontend/stores/mockScheduleAlertsStore";

interface ClassSessionActionButtonProps {
  readonly action: ClassSessionAction;
  readonly classId: string;
  readonly labels: {
    readonly joinSession: string;
    readonly leaveClass: string;
    readonly viewRecording: string;
  };
  readonly onJoin: (id: string) => void;
  readonly onLeave: (id: string) => void;
  readonly fullWidth?: boolean;
}

export function ClassSessionActionButton({
  action,
  classId,
  labels,
  onJoin,
  onLeave,
  fullWidth = false,
}: ClassSessionActionButtonProps) {
  if (action === "join_session") {
    return (
      <Button
        id={`join-session-${classId}`}
        variant="contained"
        fullWidth={fullWidth}
        startIcon={<LoginOutlined />}
        onClick={() => {
          onJoin(classId);
        }}
        sx={theme => ({
          ...theme.typography.labelUppercase,
          px: 2,
          py: 0.75,
          bgcolor: theme.palette.primary.main,
          color: theme.palette.onPrimary,
          boxShadow: theme.palette.shadow.button,
          borderRadius: theme.layout.radius.button,
          "&:hover": {
            bgcolor: theme.palette.primary.dark,
            boxShadow: theme.palette.shadow.buttonHover,
          },
        })}
      >
        {labels.joinSession}
      </Button>
    );
  }

  if (action === "view_recording") {
    return (
      <Button
        id={`view-recording-${classId}`}
        variant="outlined"
        fullWidth={fullWidth}
        startIcon={<OndemandVideoOutlined />}
        sx={theme => ({
          ...theme.typography.labelUppercase,
          px: 2,
          py: 0.75,
          color: theme.palette.text.secondary,
          borderColor: theme.palette.border.light,
          borderRadius: theme.layout.radius.button,
          "&:hover": {
            borderColor: theme.palette.primary.main,
            color: theme.palette.primary.main,
            bgcolor: alpha(theme.palette.primary.main, 0.04),
          },
        })}
      >
        {labels.viewRecording}
      </Button>
    );
  }

  const isDisabled = action === "leave_disabled";

  return (
    <Button
      id={`leave-class-${classId}`}
      variant="outlined"
      fullWidth={fullWidth}
      disabled={isDisabled}
      startIcon={<LogoutOutlined />}
      onClick={() => {
        onLeave(classId);
      }}
      sx={theme => ({
        ...theme.typography.labelUppercase,
        px: 2,
        py: 0.75,
        color: theme.palette.error.main,
        borderColor: theme.palette.error.main,
        bgcolor: alpha(theme.palette.error.main, 0.06),
        opacity: isDisabled ? 0.5 : 1,
        cursor: isDisabled ? "not-allowed" : "pointer",
        borderRadius: theme.layout.radius.button,
        "&.Mui-disabled": {
          color: theme.palette.error.main,
          borderColor: theme.palette.error.main,
          opacity: 0.5,
        },
        "&:hover": {
          bgcolor: alpha(theme.palette.error.main, 0.1),
          borderColor: theme.palette.error.dark,
        },
      })}
    >
      {labels.leaveClass}
    </Button>
  );
}
