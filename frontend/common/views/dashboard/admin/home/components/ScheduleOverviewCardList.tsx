"use client";

import { AccessTimeOutlined, CalendarTodayOutlined, HistoryOutlined, VisibilityOutlined } from "@mui/icons-material";
import { Box, Skeleton, Tooltip, Typography } from "@mui/material";
import type * as React from "react";
import { ActionIconLink } from "@/frontend/common/components/ui";
import { ClassProfileLink } from "@/frontend/common/components/ui/display/classProfileLink/ClassProfileLink";
import { MeetingJoinAction } from "@/frontend/common/components/ui/display/meetingConfig/MeetingJoinAction";
import { ClassOutcome } from "@/frontend/common/graphql/generated/gql/graphql-types";
import {
  classHref,
  profileHrefForTeacher,
  studentHref,
  studentProfileTabHref,
} from "@/frontend/common/utils/profileHref";
import { ScheduleInstanceStatusBadge } from "@/frontend/common/views/dashboard/admin/home/components/ScheduleInstanceStatusBadge";
import { ScheduleTimezoneOffsetCell } from "@/frontend/common/views/dashboard/admin/home/components/ScheduleTimezoneOffsetCell";
import type { DailyScheduleRow } from "@/frontend/common/views/dashboard/admin/home/types/schedule";
import {
  formatDurationMinutes,
  formatScheduleYourTime,
} from "@/frontend/common/views/dashboard/admin/home/utils/formatScheduleTime";
import {
  ScheduleSessionCardMetaBar,
  ScheduleSessionCardPersonCell,
  type ScheduleSessionMetaStatItem,
  StyledScheduleSessionCardActions,
  StyledScheduleSessionCardHeader,
  StyledScheduleSessionCardHeaderMain,
  StyledScheduleSessionPeopleRow,
  StyledScheduleSessionTimeHighlight,
  StyledScheduleSessionTimeHighlightContent,
  StyledScheduleSessionTimeHighlightLabel,
  StyledScheduleSessionTimeHighlightText,
  scheduleSessionCardContentSx,
} from "@/frontend/common/views/dashboard/components/scheduleSessionCardLayout";
import type {
  ScheduleOverviewDataHeaders,
  ScheduleOverviewDataStatusLabels,
} from "@/frontend/common/views/dashboard/types/dashboard";
import { isJoinableClassInstance } from "@/shared/lib/meeting/isJoinableByExecutionState";

export interface ScheduleOverviewCardProps {
  readonly row: DailyScheduleRow;
  readonly headers: ScheduleOverviewDataHeaders;
  readonly statusLabels: ScheduleOverviewDataStatusLabels;
  readonly detailsLabel: string;
  readonly showTimezones: boolean;
  readonly locale: string;
}

type MetaStatItem = ScheduleSessionMetaStatItem;

function ScheduleMetaStatBar({ items }: { readonly items: readonly MetaStatItem[] }) {
  return <ScheduleSessionCardMetaBar items={items} />;
}

function PersonCell(props: React.ComponentProps<typeof ScheduleSessionCardPersonCell>) {
  return <ScheduleSessionCardPersonCell {...props} />;
}

interface ScheduleCardActionsProps {
  readonly row: DailyScheduleRow;
  readonly headers: ScheduleOverviewDataHeaders;
  readonly detailsLabel: string;
  readonly studentId: string | undefined;
  readonly classId: string;
}

function ScheduleCardActions({ row, headers, detailsLabel, studentId, classId }: ScheduleCardActionsProps) {
  const isJoinable = isJoinableClassInstance(row.executionState, row.outcome, { isFrozen: row.isFrozen ?? false });
  const joinUrl = isJoinable ? row.meetingJoinUrl : undefined;
  const meeting = isJoinable ? row.effectiveMeeting : undefined;

  return (
    <StyledScheduleSessionCardActions>
      <MeetingJoinAction
        variant="icon"
        joinUrl={joinUrl}
        meeting={meeting}
        label={headers.joinVideo}
        emptyRole="class"
      />
      {studentId ? (
        <Tooltip title={headers.history}>
          <ActionIconLink href={studentProfileTabHref(studentId, "history")} aria-label={headers.history}>
            <HistoryOutlined fontSize="small" />
          </ActionIconLink>
        </Tooltip>
      ) : null}
      {classId ? (
        <Tooltip title={detailsLabel}>
          <ActionIconLink href={`/classes/${classId}`} aria-label={detailsLabel}>
            <VisibilityOutlined fontSize="small" />
          </ActionIconLink>
        </Tooltip>
      ) : null}
    </StyledScheduleSessionCardActions>
  );
}

function buildScheduleMetaItems(
  headers: ScheduleOverviewDataHeaders,
  row: DailyScheduleRow,
  duration: string,
  showTimezones: boolean
): MetaStatItem[] {
  return [
    ...(showTimezones
      ? ([
          {
            label: headers.teacherTime,
            value: (
              <ScheduleTimezoneOffsetCell
                timeValue={row.teacherTime}
                timezone={row.teacherTimezone}
                at={row.scheduledStartAt}
              />
            ),
            tone: "teacher",
          },
          {
            label: headers.studentTime,
            value: (
              <ScheduleTimezoneOffsetCell
                timeValue={row.studentTime}
                timezone={row.studentTimezone}
                at={row.scheduledStartAt}
              />
            ),
            tone: "student",
          },
        ] satisfies MetaStatItem[])
      : []),
    { label: headers.duration, value: duration, tone: "default" },
  ];
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
  const courseName = row.courseName?.trim() || "—";
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

      <StyledScheduleSessionTimeHighlight>
        <AccessTimeOutlined sx={theme => ({ fontSize: 18, color: theme.palette.onPrimaryContainer, flexShrink: 0 })} />
        <StyledScheduleSessionTimeHighlightContent>
          <StyledScheduleSessionTimeHighlightLabel variant="labelMd">
            {headers.yourTime}
          </StyledScheduleSessionTimeHighlightLabel>
          <StyledScheduleSessionTimeHighlightText variant="bodyLg" title={yourTime}>
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
  return (
    <Box sx={scheduleSessionCardContentSx}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flex: 1 }}>
          <Skeleton variant="circular" width={40} height={40} />
          <Box sx={{ flex: 1 }}>
            <Skeleton variant="text" width="60%" height={24} />
            <Skeleton variant="rectangular" width={80} height={20} sx={{ borderRadius: 1, mt: 0.5 }} />
          </Box>
        </Box>
        <Box sx={{ display: "flex", gap: 0.5 }}>
          <Skeleton variant="circular" width={28} height={28} />
          <Skeleton variant="circular" width={28} height={28} />
        </Box>
      </Box>
      <Skeleton variant="rectangular" height={42} sx={{ borderRadius: 1, mb: 1.5 }} />
      <Skeleton variant="rectangular" height={52} sx={{ borderRadius: 1, mb: 1.5 }} />
      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5, pt: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Skeleton variant="circular" width={32} height={32} />
          <Skeleton variant="text" width={70} />
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Skeleton variant="circular" width={32} height={32} />
          <Skeleton variant="text" width={70} />
        </Box>
      </Box>
    </Box>
  );
}

export function ScheduleOverviewEmptyState({ message }: { readonly message: string }) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        paddingBlock: 2,
        paddingInline: 2,
        minHeight: 220,
        width: "100%",
        boxSizing: "border-box",
        textAlign: "center",
        gap: 1.5,
        overflow: "hidden",
      }}
    >
      <Box
        sx={theme => ({
          width: 48,
          height: 48,
          borderRadius: "50%",
          backgroundColor: theme.palette.primaryContainer,
          color: theme.palette.onPrimaryContainer,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        })}
      >
        <CalendarTodayOutlined sx={{ fontSize: 24 }} />
      </Box>
      <Typography variant="titleLg" sx={theme => ({ color: theme.palette.onSurface })}>
        {message}
      </Typography>
    </Box>
  );
}
