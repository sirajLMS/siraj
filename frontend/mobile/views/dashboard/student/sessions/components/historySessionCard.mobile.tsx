"use client";

import { AccessTimeOutlined, VisibilityOutlined } from "@mui/icons-material";
import { Box, Tooltip, Typography } from "@mui/material";
import { DateTimeTooltipDisplay } from "@/frontend/common/components/intl/DateTimeTooltipDisplay";
import { ClassProfileLink } from "@/frontend/common/components/ui/display/classProfileLink/ClassProfileLink";
import { classHref } from "@/frontend/common/utils/profileHref";
import {
  ScheduleSessionCardMetaBar,
  ScheduleSessionCardPersonCell,
  type ScheduleSessionMetaStatItem,
} from "@/frontend/common/views/dashboard/components/scheduleSessionCardLayout";
import {
  StyledScheduleSessionCardActions,
  StyledScheduleSessionCardHeader,
  StyledScheduleSessionCardHeaderMain,
  StyledScheduleSessionTimeHighlight,
  StyledScheduleSessionTimeHighlightContent,
  StyledScheduleSessionTimeHighlightLabel,
  scheduleSessionCardContentSx,
} from "@/frontend/common/views/dashboard/components/scheduleSessionCardLayout.styles";
import type { StudentHistorySessionRow } from "@/frontend/common/views/dashboard/student/history/types/studentHistoryTypes";
import {
  formatStudentHistoryDuration,
  mapStudentHistoryStatusToBadge,
  resolveStudentHistoryStatusLabel,
} from "@/frontend/common/views/dashboard/student/history/utils/studentHistorySessionPresentation";
import type { StudentSessionsViewModel } from "@/frontend/common/views/dashboard/student/sessions/useStudentSessionsViewModel";
import { MobileActionIconLink, MobileStatusBadge } from "@/frontend/mobile/components/ui";
import { MobileMeetingJoinAction } from "@/frontend/mobile/components/ui/display/meetingConfig";
import { isJoinableClassInstance } from "@/shared/lib/meeting/isJoinableByExecutionState";

function isSessionJoinable(row: StudentHistorySessionRow): boolean {
  return Boolean(row.meetingJoinUrl) && isJoinableClassInstance(undefined, row.outcome, { isFrozen: row.isFrozen });
}

export interface HistorySessionCardMobileProps {
  readonly row: StudentHistorySessionRow;
  readonly labels: StudentSessionsViewModel["labels"];
  readonly locale: string;
  readonly onOpenMeetingUrl: StudentSessionsViewModel["onOpenMeetingUrl"];
}

export function HistorySessionCardMobile({
  row,
  labels,
  locale,
  onOpenMeetingUrl,
}: Readonly<HistorySessionCardMobileProps>) {
  const badgeStatus = mapStudentHistoryStatusToBadge(row.status, row.outcome);
  const statusLabel = resolveStudentHistoryStatusLabel(row, labels.statusLabels);
  const showJoin = isSessionJoinable(row);
  const durationLabel = formatStudentHistoryDuration(row.duration, labels);
  const instructorName = row.instructor?.trim() || "—";

  const metaItems: ScheduleSessionMetaStatItem[] = [
    {
      label: labels.duration,
      value: durationLabel,
      tone: "default",
    },
    {
      label: labels.status,
      value: statusLabel,
      tone: "default",
    },
  ];

  return (
    <Box sx={scheduleSessionCardContentSx}>
      <StyledScheduleSessionCardHeader>
        <StyledScheduleSessionCardHeaderMain>
          <ClassProfileLink
            href={classHref(row.id)}
            name={row.title?.trim() || "—"}
            avatarSize={40}
            typographyVariant="titleLg"
            fontWeight={700}
          />

          <MobileStatusBadge category="classStatus" status={badgeStatus} label={statusLabel} size="small" />
        </StyledScheduleSessionCardHeaderMain>

        <StyledScheduleSessionCardActions>
          {showJoin ? (
            <MobileMeetingJoinAction
              variant="icon"
              joinUrl={row.meetingJoinUrl}
              meeting={row.effectiveMeeting}
              onJoinAction={() => onOpenMeetingUrl(row.meetingJoinUrl)}
              label={labels.joinSession}
              emptyRole="class"
            />
          ) : null}
          <Tooltip title={labels.viewClass}>
            <MobileActionIconLink href={classHref(row.id)} aria-label={labels.viewClass}>
              <VisibilityOutlined fontSize="small" />
            </MobileActionIconLink>
          </Tooltip>
        </StyledScheduleSessionCardActions>
      </StyledScheduleSessionCardHeader>

      <StyledScheduleSessionTimeHighlight>
        <AccessTimeOutlined sx={theme => ({ fontSize: 18, color: theme.palette.onPrimaryContainer, flexShrink: 0 })} />
        <StyledScheduleSessionTimeHighlightContent>
          <StyledScheduleSessionTimeHighlightLabel variant="labelMd">
            {labels.sessionDate}
          </StyledScheduleSessionTimeHighlightLabel>
          <DateTimeTooltipDisplay value={row.time} locale={locale} tone="highlight" />
        </StyledScheduleSessionTimeHighlightContent>
      </StyledScheduleSessionTimeHighlight>

      <ScheduleSessionCardMetaBar items={metaItems} />

      <Box
        sx={theme => ({
          pt: 1.25,
          borderTop: `1px solid ${theme.palette.outlineVariant}`,
        })}
      >
        <ScheduleSessionCardPersonCell label={labels.instructor} name={instructorName} tone="teacher" />
      </Box>

      {row.notes ? (
        <Typography
          variant="labelMd"
          sx={theme => ({ color: theme.palette.onSurfaceVariant, mt: 1.25 })}
          noWrap
          title={row.notes}
        >
          {row.notes}
        </Typography>
      ) : null}
    </Box>
  );
}
