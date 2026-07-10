"use client";

import { LogoutOutlined, OndemandVideoOutlined } from "@mui/icons-material";
import { alpha, Button } from "@mui/material";
import type { ClassSessionAction } from "@/frontend/views/dashboard/schedule/alerts/types";

interface ClassSessionActionButtonProps {
  readonly action: ClassSessionAction;
  readonly classId: string;
  readonly labels: {
    readonly joinSession: string;
    readonly leaveClass: string;
    readonly viewRecording: string;
  };
  readonly onLeave: (id: string) => void;
  readonly onViewRecording: (id: string) => void;
  readonly fullWidth?: boolean;
}

export function ClassSessionActionButton({
  action,
  classId,
  labels,
  onLeave,
  onViewRecording,
  fullWidth = false,
}: ClassSessionActionButtonProps) {
  if (action === "join_session") {
    return null;
  }

  if (action === "view_recording") {
    return (
      <Button
        id={`view-recording-${classId}`}
        variant="outlined"
        fullWidth={fullWidth}
        startIcon={<OndemandVideoOutlined />}
        onClick={() => {
          onViewRecording(classId);
        }}
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
            backgroundColor: alpha(theme.palette.primary.main, 0.04),
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
        backgroundColor: alpha(theme.palette.error.main, 0.06),
        opacity: isDisabled ? 0.5 : 1,
        cursor: isDisabled ? "not-allowed" : "pointer",
        borderRadius: theme.layout.radius.button,
        "&.Mui-disabled": {
          color: theme.palette.error.main,
          borderColor: theme.palette.error.main,
          opacity: 0.5,
        },
        "&:hover": {
          backgroundColor: alpha(theme.palette.error.main, 0.1),
          borderColor: theme.palette.error.dark,
        },
      })}
    >
      {labels.leaveClass}
    </Button>
  );
}
