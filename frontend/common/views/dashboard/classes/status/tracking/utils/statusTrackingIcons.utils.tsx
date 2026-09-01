import { BlockOutlined, WarningAmberOutlined } from "@mui/icons-material";
import type { ReactElement } from "react";
import { SessionStatus } from "@/frontend/common/views/dashboard/classes/status/tracking/types";

// NEW FOR PLAN v5 (newly created for the migration wave)
// Lifted from statusTrackingDataGrid.{mobile,desktop}.tsx + statusTrackingCardList.mobile.tsx (specs.md §3 N9)
// — duplicate lowercase pure-data helpers (returned JSX icon decoration) defined in three tier files; now canonical in common.
export function getStatusIcon(sessionStatus: SessionStatus): ReactElement | undefined {
  if (sessionStatus === SessionStatus.SUSPENDED_PENDING) {
    return <BlockOutlined sx={{ fontSize: 12 }} />;
  }
  if (sessionStatus === SessionStatus.PENDING_VERIFICATION) {
    return <WarningAmberOutlined sx={{ fontSize: 12 }} />;
  }
  return undefined;
}
