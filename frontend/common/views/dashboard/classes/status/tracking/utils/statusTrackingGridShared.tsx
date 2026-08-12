import { VideocamOffOutlined } from "@mui/icons-material";
import { Box, Tooltip } from "@mui/material";
import type { ComponentType, ReactNode } from "react";
import {
  computeSessionStatus,
  SessionStatus,
  type StatusTrackingDataGridProps,
  type StatusTrackingRow,
} from "@/frontend/common/views/dashboard/classes/status/tracking/types";
import { isJoinableClassInstance } from "@/shared/lib/meeting/isJoinableByExecutionState";

export function createStatusActionLabels(labels: StatusTrackingDataGridProps["labels"]) {
  return {
    joinSession: labels.joinSession,
    activate: labels.activate,
    reschedule: labels.reschedule,
    verifyDocuments: labels.verifyDocuments,
    administrativeHold: labels.administrativeHold,
    holdDescription: labels.holdDescription,
  };
}

export interface JoinCellComponentProps {
  readonly variant: "icon";
  readonly joinUrl: string | null | undefined;
  readonly meeting: StatusTrackingRow["effectiveMeeting"];
  readonly emptyRole: "class";
  readonly label: string;
  readonly setupHref: string;
}

const JOIN_CELL_BOX_SX = {
  display: "flex",
  justifyContent: "center",
  width: "100%",
  height: "100%",
  alignItems: "center",
} as const;

export function renderStatusTrackingJoinCell(
  row: StatusTrackingRow,
  labels: StatusTrackingDataGridProps["labels"],
  JoinComponent: ComponentType<JoinCellComponentProps>
): ReactNode {
  const sessionStatus = computeSessionStatus(row.studentStatus, row.isFrozen, row.executionState);
  if (sessionStatus !== SessionStatus.REGULAR) return null;
  if (isJoinableClassInstance(row.executionState, row.outcome, { isFrozen: row.isFrozen ?? false })) {
    return (
      <Box sx={JOIN_CELL_BOX_SX}>
        <JoinComponent
          variant="icon"
          joinUrl={row.meetingJoinUrl}
          meeting={row.effectiveMeeting}
          emptyRole="class"
          label={labels.joinSession}
          setupHref={`/classes/${row.id}#meeting-configs`}
        />
      </Box>
    );
  }
  return (
    <Tooltip title={labels.sessionEnded}>
      <Box sx={JOIN_CELL_BOX_SX}>
        <VideocamOffOutlined sx={theme => ({ fontSize: 20, color: theme.palette.text.disabled })} />
      </Box>
    </Tooltip>
  );
}
