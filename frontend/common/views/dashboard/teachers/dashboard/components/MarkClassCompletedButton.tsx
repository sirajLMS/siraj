"use client";

import { CheckCircleOutlined } from "@mui/icons-material";
import { Button, Tooltip } from "@mui/material";
import type { TeacherScheduleRow } from "@/frontend/common/types/shared.types";

interface MarkClassCompletedButtonProps {
  readonly row: TeacherScheduleRow;
  readonly label: string;
  readonly disabledTooltip?: string;
  readonly onClick: (classInstanceId: string) => void;
  readonly fullWidth?: boolean;
}

function isEligibleForReport(row: TeacherScheduleRow): boolean {
  if (row.status === "completed") {
    return true;
  }
  const endAt = row.scheduledEndAt;
  if (endAt) {
    return new Date() >= endAt;
  }
  return false;
}

export function MarkClassCompletedButton({
  row,
  label,
  disabledTooltip,
  onClick,
  fullWidth = false,
}: Readonly<MarkClassCompletedButtonProps>) {
  const eligible = isEligibleForReport(row);

  if (!eligible) {
    return (
      <Tooltip title={disabledTooltip ?? ""}>
        <span>
          <Button
            fullWidth={fullWidth}
            size="small"
            variant="outlined"
            disabled
            startIcon={<CheckCircleOutlined />}
            sx={{ typography: "labelUppercase" }}
          >
            {label}
          </Button>
        </span>
      </Tooltip>
    );
  }

  return (
    <Button
      fullWidth={fullWidth}
      size="small"
      variant="contained"
      startIcon={<CheckCircleOutlined />}
      onClick={() => onClick(row.classId)}
      sx={{ typography: "labelUppercase" }}
    >
      {label}
    </Button>
  );
}
