"use client";

import { AccessTimeOutlined, CalendarTodayOutlined, HistoryOutlined, VisibilityOutlined } from "@mui/icons-material";
import { Avatar, Box, Skeleton, type Theme, Tooltip, Typography } from "@mui/material";
import { alpha, styled } from "@mui/material/styles";
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
import type {
  ScheduleOverviewDataHeaders,
  ScheduleOverviewDataStatusLabels,
} from "@/frontend/common/views/dashboard/types/dashboard";
import { Link } from "@/shared/i18n";
import { isJoinableClassInstance } from "@/shared/lib/meeting/isJoinableByExecutionState";

export interface ScheduleOverviewCardProps {
  readonly row: DailyScheduleRow;
  readonly headers: ScheduleOverviewDataHeaders;
  readonly statusLabels: ScheduleOverviewDataStatusLabels;
  readonly detailsLabel: string;
  readonly showTimezones: boolean;
  readonly locale: string;
}

function getNameInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "?";
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

type PersonAccentTone = "teacher" | "student" | "default";

function getPersonAccentColor(tone: PersonAccentTone, theme: Theme): string {
  switch (tone) {
    case "teacher":
      return theme.palette.text.secondary;
    case "student":
      return theme.palette.onSurface;
    case "default":
      return theme.palette.onSurface;
  }
}

const StyledCardHeader = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: theme.spacing(1.5),
  marginBottom: theme.spacing(1.5),
}));

const StyledCardHeaderMain = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  gap: theme.spacing(0.75),
  minWidth: 0,
  flex: 1,
}));

const StyledCardActions = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(0.5),
  flexShrink: 0,
  padding: theme.spacing(0.25),
  borderRadius: theme.layout.radius.card,
  backgroundColor: alpha(theme.palette.onSurface, 0.04),
}));

const StyledTimeHighlight = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
  marginBottom: theme.spacing(1.5),
  padding: theme.spacing(1.25, 1.5),
  borderRadius: theme.layout.radius.card,
  backgroundColor: alpha(theme.palette.primary.main, 0.08),
  border: `1px solid ${alpha(theme.palette.primary.main, 0.16)}`,
  minWidth: 0,
  overflow: "hidden",
}));

const StyledTimeHighlightContent = styled(Box)({
  display: "flex",
  alignItems: "center",
  gap: 8,
  minWidth: 0,
  flex: 1,
  overflow: "hidden",
});

const StyledTimeHighlightLabel = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  flexShrink: 0,
  whiteSpace: "nowrap",
}));

const StyledTimeHighlightText = styled(Typography)(({ theme }) => ({
  color: theme.palette.primary.main,
  fontWeight: 700,
  minWidth: 0,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
}));

const StyledMetaPanel = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "stretch",
  marginBottom: theme.spacing(1.5),
  borderRadius: theme.layout.radius.card,
  backgroundColor: alpha(theme.palette.onSurface, 0.03),
  border: `1px solid ${theme.palette.border.light}`,
  overflow: "hidden",
}));

const StyledMetaTile = styled(Box)(({ theme }) => ({
  flex: 1,
  minWidth: 0,
  padding: theme.spacing(1.25, 1),
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  gap: theme.spacing(0.375),
  "&:not(:last-child)": {
    borderInlineEnd: `1px solid ${theme.palette.border.light}`,
  },
}));

const StyledMetaLabel = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  display: "block",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  width: "100%",
}));

const StyledMetaValue = styled(Typography, {
  shouldForwardProp: prop => prop !== "tone",
})<{ tone?: PersonAccentTone }>(({ theme, tone = "default" }) => ({
  color: getPersonAccentColor(tone, theme),
  fontFamily: "var(--font-jetbrains-mono), monospace",
  fontWeight: 700,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  width: "100%",
}));

const StyledPeopleRow = styled(Box)(({ theme }) => ({
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: theme.spacing(1.5),
  paddingTop: theme.spacing(1.25),
  borderTop: `1px solid ${theme.palette.border.light}`,
}));

const StyledPersonCell = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "stretch",
  gap: theme.spacing(0.75),
  minWidth: 0,
  overflow: "hidden",
  "&:first-of-type": {
    paddingInlineEnd: theme.spacing(0.75),
    borderInlineEnd: `1px solid ${theme.palette.border.light}`,
  },
}));

const StyledPersonContentRow = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
  minWidth: 0,
  width: "100%",
}));

const StyledPersonAvatar = styled(Avatar)(({ theme }) => ({
  width: 32,
  height: 32,
  flexShrink: 0,
  fontSize: theme.typography.labelSm.fontSize,
  fontWeight: theme.typography.labelSm.fontWeight,
  backgroundColor: theme.palette.surfaceContainerHigh,
  color: theme.palette.onSurfaceVariant,
}));

const StyledPersonText = styled(Box)({
  minWidth: 0,
  flex: 1,
  overflow: "hidden",
});

const StyledPersonLabel = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
}));

const StyledPersonName = styled(Typography, {
  shouldForwardProp: prop => prop !== "tone",
})<{ tone: PersonAccentTone }>(({ theme, tone }) => ({
  color: getPersonAccentColor(tone, theme),
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  display: "block",
}));

interface MetaStatItem {
  readonly label: string;
  readonly value: React.ReactNode;
  readonly tone?: PersonAccentTone;
}

function ScheduleMetaStatBar({ items }: { readonly items: readonly MetaStatItem[] }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <StyledMetaPanel>
      {items.map(item => (
        <StyledMetaTile key={item.label}>
          <StyledMetaLabel variant="labelMd" title={item.label}>
            {item.label}
          </StyledMetaLabel>
          <StyledMetaValue variant="bodyMd" tone={item.tone}>
            {item.value}
          </StyledMetaValue>
        </StyledMetaTile>
      ))}
    </StyledMetaPanel>
  );
}

interface PersonCellProps {
  readonly name: string;
  readonly label: string;
  readonly tone: PersonAccentTone;
  readonly href?: string;
  readonly avatarUrl?: string | null;
}

function PersonCell({ name, label, tone, href, avatarUrl }: PersonCellProps) {
  return (
    <StyledPersonCell>
      <StyledPersonLabel variant="labelMd" title={label}>
        {label}
      </StyledPersonLabel>
      <StyledPersonContentRow>
        <StyledPersonAvatar src={avatarUrl ?? undefined} alt={name} aria-hidden={!avatarUrl}>
          {getNameInitials(name)}
        </StyledPersonAvatar>
        <StyledPersonText>
          <StyledPersonName
            variant="bodyMd"
            title={name}
            tone={tone}
            {...(href ? { component: Link, href } : {})}
            sx={
              href
                ? {
                    textDecoration: "none",
                    "&:hover": { textDecoration: "underline" },
                  }
                : undefined
            }
          >
            {name}
          </StyledPersonName>
        </StyledPersonText>
      </StyledPersonContentRow>
    </StyledPersonCell>
  );
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
    <StyledCardActions>
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
    </StyledCardActions>
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
    <Box
      sx={{
        paddingBlock: 2,
        paddingInline: 2,
        opacity: isAbsent ? 0.85 : 1,
        width: "100%",
        minHeight: 220,
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      <StyledCardHeader>
        <StyledCardHeaderMain>
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
        </StyledCardHeaderMain>

        <ScheduleCardActions
          row={row}
          headers={headers}
          detailsLabel={detailsLabel}
          studentId={studentId ?? undefined}
          classId={classId}
        />
      </StyledCardHeader>

      <StyledTimeHighlight>
        <AccessTimeOutlined sx={theme => ({ fontSize: 18, color: theme.palette.primary.main, flexShrink: 0 })} />
        <StyledTimeHighlightContent>
          <StyledTimeHighlightLabel variant="labelMd">{headers.yourTime}</StyledTimeHighlightLabel>
          <StyledTimeHighlightText variant="bodyLg" title={yourTime}>
            {yourTime}
          </StyledTimeHighlightText>
        </StyledTimeHighlightContent>
      </StyledTimeHighlight>

      <ScheduleMetaStatBar items={buildScheduleMetaItems(headers, row, duration, showTimezones)} />

      <StyledPeopleRow>
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
      </StyledPeopleRow>
    </Box>
  );
}

export function ScheduleOverviewCardSkeleton() {
  return (
    <Box
      sx={{
        paddingBlock: 2,
        paddingInline: 2,
        width: "100%",
        minHeight: 220,
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
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
          backgroundColor: alpha(theme.palette.primary.main, 0.08),
          color: theme.palette.primary.main,
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
