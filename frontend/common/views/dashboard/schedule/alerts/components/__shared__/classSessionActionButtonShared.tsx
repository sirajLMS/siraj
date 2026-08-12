"use client";

import { AcUnitOutlined, LogoutOutlined, SummarizeOutlined } from "@mui/icons-material";
import type { ButtonProps } from "@mui/material";
import { alpha, Button, Tooltip } from "@mui/material";
import type { ClassSessionAction } from "@/frontend/common/views/dashboard/schedule/alerts/types";

export interface ClassSessionActionButtonSharedOptions {
  readonly buttonSize: ButtonProps["size"] | undefined;
  readonly buttonPx: number;
  readonly buttonPy: number;
  readonly buttonFontSize: string | undefined;
}

export interface ClassSessionActionButtonSharedProps {
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
  readonly options: ClassSessionActionButtonSharedOptions;
}

export function ClassSessionActionButtonShared({
  action,
  classId,
  labels,
  onLeave,
  onViewClassAudit,
  fullWidth = false,
  options,
}: Readonly<ClassSessionActionButtonSharedProps>) {
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
          size={options.buttonSize}
          startIcon={<AcUnitOutlined />}
          sx={theme => ({
            ...theme.typography.labelUppercase,
            px: options.buttonPx,
            py: options.buttonPy,
            color: theme.palette.info.main,
            borderColor: theme.palette.info.main,
            backgroundColor: alpha(theme.palette.info.main, 0.06),
            borderRadius: theme.layout.radius.button,
            fontSize: options.buttonFontSize,
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
        size={options.buttonSize}
        startIcon={<SummarizeOutlined />}
        onClick={() => {
          onViewClassAudit(classId);
        }}
        sx={theme => ({
          ...theme.typography.labelUppercase,
          px: options.buttonPx,
          py: options.buttonPy,
          color: theme.palette.text.secondary,
          borderColor: theme.palette.border.light,
          borderRadius: theme.layout.radius.button,
          fontSize: options.buttonFontSize,
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
      size={options.buttonSize}
      startIcon={<LogoutOutlined />}
      onClick={() => {
        if (!isDisabled) onLeave(classId);
      }}
      sx={theme => ({
        ...theme.typography.labelUppercase,
        px: options.buttonPx,
        py: options.buttonPy,
        color: theme.palette.error.main,
        borderColor: theme.palette.error.main,
        backgroundColor: alpha(theme.palette.error.main, 0.06),
        opacity: isDisabled ? 0.5 : 1,
        cursor: isDisabled ? "not-allowed" : "pointer",
        borderRadius: theme.layout.radius.button,
        fontSize: options.buttonFontSize,
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
