"use client";

import {
  AssignmentTurnedInOutlined,
  EventRepeatOutlined,
  PowerSettingsNewOutlined,
  ScheduleOutlined,
  VideocamOffOutlined,
  VisibilityOutlined,
} from "@mui/icons-material";
import { Box, IconButton, Tooltip } from "@mui/material";
import { ActionIconLink } from "@/frontend/common/components/ui";
import { classHref, profileHrefForTeacher, studentHref } from "@/frontend/common/utils/profileHref";
import { formatDurationMinutes } from "@/frontend/common/views/dashboard/admin/home/utils/formatScheduleTime";
import { STATUS_LABEL_KEYS } from "@/frontend/common/views/dashboard/classes/status/tracking/constants/statusLabelKeys.constants";
import {
  type CardListLabels,
  computeSessionStatus,
  formatScheduleRange,
  SessionStatus,
  type StatusTrackingRow,
} from "@/frontend/common/views/dashboard/classes/status/tracking/types";
import { getStatusIcon } from "@/frontend/common/views/dashboard/classes/status/tracking/utils/statusTrackingIcons.utils";
import {
  ScheduleSessionCardMetaBar,
  ScheduleSessionCardPersonCell,
} from "@/frontend/common/views/dashboard/components/scheduleSessionCardLayout";
import {
  StyledScheduleSessionCardActions,
  StyledScheduleSessionCardHeader,
  StyledScheduleSessionCardHeaderMain,
  StyledScheduleSessionPeopleRow,
  StyledScheduleSessionTimeHighlight,
  StyledScheduleSessionTimeHighlightContent,
  StyledScheduleSessionTimeHighlightLabel,
  StyledScheduleSessionTimeHighlightText,
  scheduleSessionCardContentSx,
} from "@/frontend/common/views/dashboard/components/scheduleSessionCardLayout.styles";
import { MobileStatusBadge } from "@/frontend/mobile/components/ui/badge";
import { MobileClassProfileLink } from "@/frontend/mobile/components/ui/display/classProfileLink/ClassProfileLink.mobile";
import { MobileMeetingJoinAction } from "@/frontend/mobile/components/ui/display/meetingConfig";
import { isJoinableClassInstance } from "@/shared/lib/meeting/isJoinableByExecutionState";
import { useAppLocale } from "@/shared/locale";

export interface StatusTrackingMobileCardProps {
  readonly row: StatusTrackingRow;
  readonly labels: CardListLabels;
  readonly onActivate: (id: string) => void;
  readonly onReschedule: (id: string) => void;
  readonly onVerify: (id: string) => void;
}

function StatusTrackingCardActions({
  row,
  labels,
  sessionStatus,
  onActivate,
  onReschedule,
  onVerify,
}: {
  readonly row: StatusTrackingRow;
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

export function StatusTrackingMobileCard({
  row,
  labels,
  onActivate,
  onReschedule,
  onVerify,
}: StatusTrackingMobileCardProps) {
  const locale = useAppLocale();
  const sessionStatus = computeSessionStatus(row.studentStatus, row.isFrozen, row.executionState);
  const scheduleRange = formatScheduleRange(row.scheduledStartAt, row.scheduledEndAt, locale);
  const duration = formatDurationMinutes(row.durationMinutes);
  const metaItems = duration ? [{ label: labels.duration, value: duration, tone: "default" as const }] : [];

  return (
    <Box sx={scheduleSessionCardContentSx}>
      <StyledScheduleSessionCardHeader>
        <StyledScheduleSessionCardHeaderMain>
          <MobileClassProfileLink
            href={row.id ? classHref(row.id) : undefined}
            name={row.courseName?.trim() || "—"}
            avatarUrl={row.avatarUrl}
            avatarSize={40}
            typographyVariant="titleLg"
            fontWeight={700}
          />
          <MobileStatusBadge
            category="sessionTracking"
            status={sessionStatus}
            label={labels[STATUS_LABEL_KEYS[sessionStatus]]}
            icon={getStatusIcon(sessionStatus)}
            size="small"
          />
        </StyledScheduleSessionCardHeaderMain>

        <StatusTrackingCardActions
          row={row}
          labels={labels}
          sessionStatus={sessionStatus}
          onActivate={onActivate}
          onReschedule={onReschedule}
          onVerify={onVerify}
        />
      </StyledScheduleSessionCardHeader>

      <StyledScheduleSessionTimeHighlight>
        <ScheduleOutlined sx={theme => ({ fontSize: 18, color: theme.palette.onPrimaryContainer, flexShrink: 0 })} />
        <StyledScheduleSessionTimeHighlightContent>
          <StyledScheduleSessionTimeHighlightLabel variant="labelMd">
            {labels.schedule}
          </StyledScheduleSessionTimeHighlightLabel>
          <StyledScheduleSessionTimeHighlightText variant="bodyLg" title={scheduleRange}>
            {scheduleRange}
          </StyledScheduleSessionTimeHighlightText>
        </StyledScheduleSessionTimeHighlightContent>
      </StyledScheduleSessionTimeHighlight>

      <ScheduleSessionCardMetaBar items={metaItems} />

      <StyledScheduleSessionPeopleRow>
        <ScheduleSessionCardPersonCell
          label={labels.teacher}
          name={row.teacherName ?? ""}
          tone="teacher"
          href={profileHrefForTeacher({ teacherId: row.teacherId })}
          avatarUrl={row.teacherAvatarUrl}
        />
        <ScheduleSessionCardPersonCell
          label={labels.student}
          name={row.studentName ?? ""}
          tone="student"
          href={row.studentId ? studentHref(row.studentId) : undefined}
          avatarUrl={row.studentAvatarUrl}
        />
      </StyledScheduleSessionPeopleRow>
    </Box>
  );
}
