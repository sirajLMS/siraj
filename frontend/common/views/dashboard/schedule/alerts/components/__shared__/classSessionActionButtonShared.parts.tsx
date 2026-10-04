"use client";

import { AcUnitOutlined, SummarizeOutlined } from "@mui/icons-material";
import { alpha, Box, Button, Tooltip } from "@mui/material";
import {
  buildActionButtonBaseSx,
  type ClassSessionActionButtonSharedOptions,
} from "@/frontend/common/views/dashboard/schedule/alerts/components/__shared__/classSessionActionButtonShared.helpers";

export interface ActionButtonPartProps {
  readonly classId: string;
  readonly label: string;
  readonly fullWidth: boolean;
  readonly options: ClassSessionActionButtonSharedOptions;
}

interface TooltipWrapProps {
  readonly title: string;
  readonly fullWidth: boolean;
  readonly children: React.ReactNode;
}

export function DisabledTooltipWrap({ title, fullWidth, children }: Readonly<TooltipWrapProps>) {
  return (
    <Tooltip title={title}>
      <Box component="span" sx={fullWidth ? { display: "block", width: "100%" } : { display: "inline-block" }}>
        {children}
      </Box>
    </Tooltip>
  );
}

export function ContactAdminActionButtonPart({ classId, label, fullWidth, options }: Readonly<ActionButtonPartProps>) {
  return (
    <DisabledTooltipWrap title={label} fullWidth={fullWidth}>
      <Button
        id={`contact-admin-${classId}`}
        variant="outlined"
        fullWidth={fullWidth}
        disabled
        size={options.buttonSize}
        startIcon={<AcUnitOutlined />}
        sx={theme => ({
          ...buildActionButtonBaseSx(theme, options),
          color: theme.palette.info.main,
          borderColor: theme.palette.info.main,
          backgroundColor: alpha(theme.palette.info.main, 0.06),
          "&.Mui-disabled": {
            color: theme.palette.info.main,
            borderColor: theme.palette.info.main,
            opacity: 0.7,
          },
        })}
      >
        {label}
      </Button>
    </DisabledTooltipWrap>
  );
}

interface ViewClassAuditPartProps extends ActionButtonPartProps {
  readonly onViewClassAudit: (id: string) => void;
}

export function ViewClassAuditActionButtonPart({
  classId,
  label,
  fullWidth,
  options,
  onViewClassAudit,
}: Readonly<ViewClassAuditPartProps>) {
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
        ...buildActionButtonBaseSx(theme, options),
        color: theme.palette.text.secondary,
        borderColor: theme.palette.border.light,
        "&:hover": {
          borderColor: theme.palette.primary.main,
          color: theme.palette.primary.main,
          backgroundColor: alpha(theme.palette.primary.main, 0.04),
        },
      })}
    >
      {label}
    </Button>
  );
}
