"use client";

import { AcUnitOutlined, LogoutOutlined, SummarizeOutlined } from "@mui/icons-material";
import { alpha, Button, Tooltip } from "@mui/material";
import type { ClassSessionAction } from "@/frontend/common/views/dashboard/schedule/alerts/types";

interface ClassSessionActionButtonMobileProps {
  readonly action: ClassSessionAction;
  readonly classId: string;
  readonly labels: {
    readonly joinSession: string;
    readonly leaveClass: string;
    readonly leaveDisabledReason: string;
    readonly viewClassAudit: string;
    readonly contactAdmin: string;
  };
  readonly onLeave: (id: string) => void;
  readonly onViewClassAudit: (id: string) => void;
  readonly fullWidth?: boolean;
}

export function ClassSessionActionButtonMobile({
  action,
  classId,
  labels,
  onLeave,
  onViewClassAudit,
  fullWidth = false,
}: Readonly<ClassSessionActionButtonMobileProps>) {
  if (action === "join_session") {
    return null;
  }

  if (action === "contact_admin") {
    return (
      <Tooltip title={labels.contactAdmin}>
        <Button
          id={`contact-admin-${classId}`}
          variant="outlined"
          fullWidth={fullWidth}
          disabled
          size="small"
          startIcon={<AcUnitOutlined />}
          sx={theme => ({
            ...theme.typography.labelUppercase,
            px: 1.5,
            py: 0.5,
            color: theme.palette.info.main,
            borderColor: theme.palette.info.main,
            backgroundColor: alpha(theme.palette.info.main, 0.06),
            borderRadius: theme.layout.radius.button,
            fontSize: "0.7rem",
            "&.Mui-disabled": {
              color: theme.palette.info.main,
              borderColor: theme.palette.info.main,
              opacity: 0.7,
            },
          })}
        >
          {labels.contactAdmin}
        </Button>
      </Tooltip>
    );
  }

  if (action === "view_class_audit") {
    return (
      <Button
        id={`view-class-audit-${classId}`}
        variant="outlined"
        fullWidth={fullWidth}
        size="small"
        startIcon={<SummarizeOutlined />}
        onClick={() => {
          onViewClassAudit(classId);
        }}
        sx={theme => ({
          ...theme.typography.labelUppercase,
          px: 1.5,
          py: 0.5,
          color: theme.palette.text.secondary,
          borderColor: theme.palette.border.light,
          borderRadius: theme.layout.radius.button,
          fontSize: "0.7rem",
          "&:hover": {
            borderColor: theme.palette.primary.main,
            color: theme.palette.primary.main,
            backgroundColor: alpha(theme.palette.primary.main, 0.04),
          },
        })}
      >
        {labels.viewClassAudit}
      </Button>
    );
  }

  const isDisabled = action === "leave_disabled";
  const baseButton = (
    <Button
      id={`leave-class-${classId}`}
      variant="outlined"
      fullWidth={fullWidth}
      disabled={isDisabled}
      size="small"
      startIcon={<LogoutOutlined />}
      onClick={() => {
        if (!isDisabled) onLeave(classId);
      }}
      sx={theme => ({
        ...theme.typography.labelUppercase,
        px: 1.5,
        py: 0.5,
        color: theme.palette.error.main,
        borderColor: theme.palette.error.main,
        backgroundColor: alpha(theme.palette.error.main, 0.06),
        opacity: isDisabled ? 0.5 : 1,
        cursor: isDisabled ? "not-allowed" : "pointer",
        borderRadius: theme.layout.radius.button,
        fontSize: "0.7rem",
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

  return isDisabled ? <Tooltip title={labels.leaveDisabledReason}>{baseButton}</Tooltip> : baseButton;
}
