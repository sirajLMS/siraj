"use client";

import { LogoutOutlined } from "@mui/icons-material";
import { alpha, Button } from "@mui/material";
import { buildActionButtonBaseSx } from "@/frontend/common/views/dashboard/schedule/alerts/components/__shared__/classSessionActionButtonShared.helpers";
import {
  type ActionButtonPartProps,
  DisabledTooltipWrap,
} from "@/frontend/common/views/dashboard/schedule/alerts/components/__shared__/classSessionActionButtonShared.parts";

interface LeaveClassPartProps extends ActionButtonPartProps {
  readonly disabled: boolean;
  readonly disabledReason: string;
  readonly onLeave: (id: string) => void;
}

export function LeaveClassActionButtonPart({
  classId,
  label,
  fullWidth,
  options,
  disabled,
  disabledReason,
  onLeave,
}: Readonly<LeaveClassPartProps>) {
  const button = (
    <Button
      id={`leave-class-${classId}`}
      variant="outlined"
      fullWidth={fullWidth}
      disabled={disabled}
      size={options.buttonSize}
      startIcon={<LogoutOutlined />}
      onClick={() => {
        if (!disabled) onLeave(classId);
      }}
      sx={theme => ({
        ...buildActionButtonBaseSx(theme, options),
        color: theme.palette.error.main,
        borderColor: theme.palette.error.main,
        backgroundColor: alpha(theme.palette.error.main, 0.06),
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
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
      {label}
    </Button>
  );

  if (!disabled) {
    return button;
  }
  return (
    <DisabledTooltipWrap title={disabledReason} fullWidth={fullWidth}>
      {button}
    </DisabledTooltipWrap>
  );
}
