"use client";

import { ScheduleOutlined } from "@mui/icons-material";
import { Box } from "@mui/material";
import { classHref, profileHrefForTeacher, studentHref } from "@/frontend/common/utils/profileHref";
import { formatDurationMinutes } from "@/frontend/common/views/dashboard/admin/home/utils/formatScheduleTime";
import { STATUS_LABEL_KEYS } from "@/frontend/common/views/dashboard/classes/status/tracking/constants/statusLabelKeys.constants";
import {
  type CardListLabels,
  computeSessionStatus,
  formatScheduleRange,
  type StatusTrackingScheduleRow,
} from "@/frontend/common/views/dashboard/classes/status/tracking/types";
import { getStatusIcon } from "@/frontend/common/views/dashboard/classes/status/tracking/utils/statusTrackingIcons.utils";
import {
  ScheduleSessionCardMetaBar,
  ScheduleSessionCardPersonCell,
} from "@/frontend/common/views/dashboard/components/scheduleSessionCardLayout";
import {
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
import { StatusTrackingCardActions } from "@/frontend/mobile/views/dashboard/classes/status/tracking/components/statusTrackingMobileCard.parts";
import { useAppLocale } from "@/shared/locale";

export interface StatusTrackingMobileCardProps {
  readonly row: StatusTrackingScheduleRow;
  readonly labels: CardListLabels;
  readonly onActivate: (id: string) => void;
  readonly onReschedule: (id: string) => void;
  readonly onVerify: (id: string) => void;
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
            name={row.courseName?.trim() ?? "—"}
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
