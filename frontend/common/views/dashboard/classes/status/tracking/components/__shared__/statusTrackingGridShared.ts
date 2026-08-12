import type { SxProps, Theme } from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
  computeSessionStatus,
  SessionStatus,
  type StatusTrackingRow,
} from "@/frontend/common/views/dashboard/classes/status/tracking/types";

export const STATUS_ROW_SX: SxProps<Theme> = {
  "& .status-row-suspended": {
    backgroundColor: (theme: Theme) => alpha(theme.palette.status.blocked, 0.08),
    "&:hover": {
      backgroundColor: (theme: Theme) => alpha(theme.palette.status.blocked, 0.12),
    },
  },
};

export function statusRowClassName(row: StatusTrackingRow): string {
  return computeSessionStatus(row.studentStatus, row.isFrozen, row.executionState) === SessionStatus.SUSPENDED_PENDING
    ? "status-row-suspended"
    : "";
}
