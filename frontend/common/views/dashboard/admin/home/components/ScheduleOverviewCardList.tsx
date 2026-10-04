"use client";

import { AccessTimeOutlined, CalendarTodayOutlined } from "@mui/icons-material";
import { Box } from "@mui/material";
import { ClassProfileLink } from "@/frontend/common/components/ui/display/classProfileLink/ClassProfileLink";
import { ClassOutcome } from "@/frontend/common/graphql/generated/gql/graphql";
import { classHref, profileHrefForTeacher, studentHref } from "@/frontend/common/utils/profileHref";
import { ScheduleInstanceStatusBadge } from "@/frontend/common/views/dashboard/admin/home/components/ScheduleInstanceStatusBadge";
import {
  PersonCell,
  ScheduleCardActions,
  ScheduleMetaStatBar,
} from "@/frontend/common/views/dashboard/admin/home/components/ScheduleOverviewCard.parts";
import { buildScheduleMetaItems } from "@/frontend/common/views/dashboard/admin/home/components/scheduleOverviewCardMetaItems";
import type { DailyScheduleRow } from "@/frontend/common/views/dashboard/admin/home/types/schedule";
import {
  formatDurationMinutes,
  formatScheduleYourTime,
} from "@/frontend/common/views/dashboard/admin/home/utils/formatScheduleTime";
import {
  ScheduleSessionCardSkeleton,
  ScheduleSessionEmptyState,
} from "@/frontend/common/views/dashboard/components/ScheduleSessionCardStates";
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
import type {
  ScheduleOverviewDataHeaders,
  ScheduleOverviewDataStatusLabels,
} from "@/frontend/common/views/dashboard/types/dashboard";

export interface ScheduleOverviewCardProps {
  readonly row: DailyScheduleRow;
  readonly headers: ScheduleOverviewDataHeaders;
  readonly statusLabels: ScheduleOverviewDataStatusLabels;
  readonly detailsLabel: string;
  readonly showTimezones: boolean;
  readonly locale: string;
}

export function ScheduleOverviewCard({
  row,
  headers,
  statusLabels,
  detailsLabel,
  showTimezones,
  locale,
}: ScheduleOverviewCardProps) {
  const isAbsent = row.outcome === ClassOutcome.Absent;
  const studentId = row.student?.id;
  const studentName = row.student?.name ?? "Unknown Student";
  const teacherName = row.teacher?.name ?? "Unknown Teacher";
  const teacherId = row.teacher?.id;
  const classId = row.id ?? "";
  const courseName = row.courseName?.trim() ?? "—";
  const yourTime = formatScheduleYourTime(row.yourTime, row.studentTime ?? row.teacherTime, locale);
  const duration = formatDurationMinutes(row.duration);

  return (
    <Box sx={{ ...scheduleSessionCardContentSx, opacity: isAbsent ? 0.85 : 1 }}>
      <StyledScheduleSessionCardHeader>
        <StyledScheduleSessionCardHeaderMain>
          <ClassProfileLink
            href={classId ? classHref(classId) : undefined}
            name={courseName}
            avatarUrl={row.avatarUrl}
            avatarSize={40}
            typographyVariant="titleLg"
            fontWeight={700}
          />

          <ScheduleInstanceStatusBadge
            outcome={row.outcome}
            executionState={row.executionState}
            scheduledEndAt={row.scheduledEndAt}
            scheduledStartAt={row.scheduledStartAt}
            durationMinutes={row.duration}
            statusLabels={statusLabels}
            size="small"
          />
        </StyledScheduleSessionCardHeaderMain>

        <ScheduleCardActions
          row={row}
          headers={headers}
          detailsLabel={detailsLabel}
          studentId={studentId ?? undefined}
          classId={classId}
        />
      </StyledScheduleSessionCardHeader>

      <StyledScheduleSessionTimeHighlight isAbsent={isAbsent}>
        <AccessTimeOutlined
          sx={theme => ({
            fontSize: 18,
            color: isAbsent ? theme.palette.onErrorContainer : theme.palette.onPrimaryContainer,
            flexShrink: 0,
          })}
        />
        <StyledScheduleSessionTimeHighlightContent>
          <StyledScheduleSessionTimeHighlightLabel variant="labelMd" isAbsent={isAbsent}>
            {headers.yourTime}
          </StyledScheduleSessionTimeHighlightLabel>
          <StyledScheduleSessionTimeHighlightText variant="bodyLg" title={yourTime} isAbsent={isAbsent}>
            {yourTime}
          </StyledScheduleSessionTimeHighlightText>
        </StyledScheduleSessionTimeHighlightContent>
      </StyledScheduleSessionTimeHighlight>

      <ScheduleMetaStatBar items={buildScheduleMetaItems(headers, row, duration, showTimezones)} />

      <StyledScheduleSessionPeopleRow>
        <PersonCell
          label={headers.teacher}
          name={teacherName}
          tone="teacher"
          href={teacherId ? profileHrefForTeacher({ teacherId }) : undefined}
          avatarUrl={row.teacher?.avatarUrl}
        />
        <PersonCell
          label={headers.student}
          name={studentName}
          tone="student"
          href={studentId ? studentHref(studentId) : undefined}
          avatarUrl={row.student?.avatarUrl}
        />
      </StyledScheduleSessionPeopleRow>
    </Box>
  );
}

export function ScheduleOverviewCardSkeleton() {
  return <ScheduleSessionCardSkeleton actionCount={2} />;
}

export function ScheduleOverviewEmptyState({ message }: { readonly message: string }) {
  return <ScheduleSessionEmptyState message={message} icon={CalendarTodayOutlined} iconColorKey="primaryContainer" />;
}
