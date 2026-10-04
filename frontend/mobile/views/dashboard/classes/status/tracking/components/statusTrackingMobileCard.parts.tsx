"use client";

import {
  AssignmentTurnedInOutlined,
  EventRepeatOutlined,
  PowerSettingsNewOutlined,
  VideocamOffOutlined,
  VisibilityOutlined,
} from "@mui/icons-material";
import { Box, IconButton, Tooltip } from "@mui/material";
import { ActionIconLink } from "@/frontend/common/components/ui";
import { classHref } from "@/frontend/common/utils/profileHref";
import {
  type CardListLabels,
  SessionStatus,
  type StatusTrackingScheduleRow,
} from "@/frontend/common/views/dashboard/classes/status/tracking/types";
import { StyledScheduleSessionCardActions } from "@/frontend/common/views/dashboard/components/scheduleSessionCardLayout.styles";
import { MobileMeetingJoinAction } from "@/frontend/mobile/components/ui/display/meetingConfig";
import { isJoinableClassInstance } from "@/shared/lib/meeting/isJoinableByExecutionState";

export function StatusTrackingCardActions({
  row,
  labels,
  sessionStatus,
  onActivate,
  onReschedule,
  onVerify,
}: {
  readonly row: StatusTrackingScheduleRow;
  readonly labels: CardListLabels;
  readonly sessionStatus: SessionStatus;
  readonly onActivate: (id: string) => void;
  readonly onReschedule: (id: string) => void;
  readonly onVerify: (id: string) => void;
}) {
  const rowId = row.id ?? "";
  const classId = row.id ?? "";

  return (
    <StyledScheduleSessionCardActions>
      {sessionStatus === SessionStatus.REGULAR &&
      isJoinableClassInstance(row.executionState, row.outcome, { isFrozen: row.isFrozen ?? false }) ? (
        <MobileMeetingJoinAction
          variant="icon"
          joinUrl={row.meetingJoinUrl}
          meeting={row.effectiveMeeting}
          emptyRole="class"
          label={labels.joinSession}
          setupHref={`/classes/${rowId}#meeting-configs`}
          id={`mobile-join-${rowId}`}
        />
      ) : null}
      {sessionStatus === SessionStatus.REGULAR &&
      !isJoinableClassInstance(row.executionState, row.outcome, { isFrozen: row.isFrozen ?? false }) ? (
        <Tooltip title={labels.sessionEnded}>
          <Box sx={{ display: "flex", alignItems: "center", px: 0.5 }}>
            <VideocamOffOutlined sx={theme => ({ fontSize: 20, color: theme.palette.text.disabled })} />
          </Box>
        </Tooltip>
      ) : null}
      {sessionStatus === SessionStatus.SUSPENDED_PENDING ? (
        <Tooltip title={labels.activate}>
          <IconButton
            id={`mobile-activate-${rowId}`}
            size="small"
            aria-label={labels.activate}
            onClick={() => {
              onActivate(rowId);
            }}
          >
            <PowerSettingsNewOutlined fontSize="small" />
          </IconButton>
        </Tooltip>
      ) : null}
      {sessionStatus === SessionStatus.ON_LEAVE ? (
        <Tooltip title={labels.reschedule}>
          <IconButton
            id={`mobile-reschedule-${rowId}`}
            size="small"
            aria-label={labels.reschedule}
            onClick={() => {
              onReschedule(rowId);
            }}
          >
            <EventRepeatOutlined fontSize="small" />
          </IconButton>
        </Tooltip>
      ) : null}
      {sessionStatus === SessionStatus.PENDING_VERIFICATION ? (
        <Tooltip title={labels.verifyDocuments}>
          <IconButton
            id={`mobile-verify-${rowId}`}
            size="small"
            aria-label={labels.verifyDocuments}
            onClick={() => {
              onVerify(rowId);
            }}
          >
            <AssignmentTurnedInOutlined fontSize="small" />
          </IconButton>
        </Tooltip>
      ) : null}
      {classId ? (
        <Tooltip title={labels.class}>
          <ActionIconLink href={classHref(classId)} aria-label={labels.class}>
            <VisibilityOutlined fontSize="small" />
          </ActionIconLink>
        </Tooltip>
      ) : null}
    </StyledScheduleSessionCardActions>
  );
}
