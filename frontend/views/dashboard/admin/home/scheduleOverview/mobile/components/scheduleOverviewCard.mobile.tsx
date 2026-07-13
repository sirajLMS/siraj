"use client";

import { AccessTimeOutlined, HistoryOutlined, VisibilityOutlined } from "@mui/icons-material";
import type { Theme } from "@mui/material";
import { Avatar, Box, Tooltip, Typography } from "@mui/material";
import { alpha, styled } from "@mui/material/styles";
import type * as React from "react";
import { ActionIconLink, TimezoneDisplay } from "@/frontend/common/components/ui";
import { MeetingJoinAction } from "@/frontend/common/components/ui/display/meetingConfig/MeetingJoinAction";
import { type ClassExecutionState, ClassOutcome } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { profileHrefForTeacher, studentHref, studentProfileTabHref } from "@/frontend/common/utils/profileHref";
import { ScheduleInstanceStatusBadge } from "@/frontend/views/dashboard/admin/home/components/ScheduleInstanceStatusBadge";
import { StyledScheduleNameLink } from "@/frontend/views/dashboard/admin/home/components/ScheduleOverviewDataGrid.styles";
import type { ScheduleOverviewViewModel } from "@/frontend/views/dashboard/admin/home/scheduleOverview/useScheduleOverviewViewModel";
import type { DailyScheduleRow } from "@/frontend/views/dashboard/admin/home/types/schedule";
import {
  formatDurationMinutes,
  formatScheduleTimeOnly,
  formatScheduleYourTime,
} from "@/frontend/views/dashboard/admin/home/utils/formatScheduleTime";
import { Link } from "@/shared/i18n/routing";
import { isJoinableClassInstance } from "@/shared/lib/meeting/isJoinableByExecutionState";

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

const StyledStudentTitle = styled(Typography)({
  minWidth: 0,
  maxWidth: "100%",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
});

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
  fontFamily: "monospace",
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
  readonly timezone?: string | null;
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
          {item.timezone ? <TimezoneDisplay timezone={item.timezone} typographyVariant="labelMd" /> : null}
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
}

function PersonCell({ name, label, tone, href }: PersonCellProps) {
  return (
    <StyledPersonCell>
      <StyledPersonLabel variant="labelMd" title={label}>
        {label}
      </StyledPersonLabel>
      <StyledPersonContentRow>
        <StyledPersonAvatar aria-hidden>{getNameInitials(name)}</StyledPersonAvatar>
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

function buildScheduleMetaItems(
  headers: ScheduleOverviewViewModel["headers"],
  row: DailyScheduleRow,
  teacherTime: string,
  studentTime: string,
  duration: string,
  showTimezones: boolean
): MetaStatItem[] {
  const items: MetaStatItem[] = [];
  if (showTimezones) {
    items.push({
      label: headers.teacherTime,
      value: teacherTime,
      tone: "teacher",
      timezone: row.teacherTimezone,
    });
    items.push({
      label: headers.studentTime,
      value: studentTime,
      tone: "student",
      timezone: row.studentTimezone,
    });
  }
  items.push({ label: headers.duration, value: duration, tone: "default" });
  return items;
}

interface ScheduleCardActionsProps {
  readonly row: DailyScheduleRow;
  readonly headers: ScheduleOverviewViewModel["headers"];
  readonly detailsLabel: string;
  readonly studentId: string | undefined;
  readonly classId: string;
}

function ScheduleCardActions({ row, headers, detailsLabel, studentId, classId }: ScheduleCardActionsProps) {
  return (
    <StyledCardActions>
      {isJoinableClassInstance(row.executionState, row.outcome, { isFrozen: row.isFrozen ?? false }) ? (
        <MeetingJoinAction
          variant="icon"
          joinUrl={row.meetingJoinUrl}
          meeting={row.effectiveMeeting}
          label={headers.joinVideo}
          emptyRole="class"
        />
      ) : null}
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

export interface ScheduleOverviewMobileCardProps {
  readonly row: DailyScheduleRow;
  readonly headers: ScheduleOverviewViewModel["headers"];
  readonly statusLabels: Record<ClassOutcome | ClassExecutionState, string>;
  readonly detailsLabel: string;
  readonly showTimezones: boolean;
  readonly locale: string;
}

export function ScheduleOverviewMobileCard({
  row,
  headers,
  statusLabels,
  detailsLabel,
  showTimezones,
  locale,
}: ScheduleOverviewMobileCardProps) {
  const isAbsent = row.outcome === ClassOutcome.Absent;
  const studentId = row.student?.id;
  const studentName = row.student?.name ?? "Unknown Student";
  const teacherName = row.teacher?.name ?? "Unknown Teacher";
  const teacherId = row.teacher?.id;
  const classId = row.id ?? "";
  const yourTime = formatScheduleYourTime(row.yourTime, row.studentTime ?? row.teacherTime, locale);
  const teacherTime = formatScheduleTimeOnly(row.teacherTime, locale);
  const studentTime = formatScheduleTimeOnly(row.studentTime, locale);
  const duration = formatDurationMinutes(row.duration);

  return (
    <Box
      sx={{
        paddingBlock: 2,
        paddingInline: 2,
        opacity: isAbsent ? 0.85 : 1,
        width: "100%",
        overflow: "hidden",
      }}
    >
      <StyledCardHeader>
        <StyledCardHeaderMain>
          {studentId ? (
            <StyledScheduleNameLink
              href={studentHref(studentId)}
              title={studentName}
              sx={{ minWidth: 0, maxWidth: "100%", display: "block", overflow: "hidden", alignSelf: "stretch" }}
            >
              <StyledStudentTitle variant="titleLg">{studentName}</StyledStudentTitle>
            </StyledScheduleNameLink>
          ) : (
            <StyledStudentTitle variant="titleLg" title={studentName}>
              {studentName}
            </StyledStudentTitle>
          )}

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

      <ScheduleMetaStatBar
        items={buildScheduleMetaItems(headers, row, teacherTime, studentTime, duration, showTimezones)}
      />

      <StyledPeopleRow>
        <PersonCell
          label={headers.teacher}
          name={teacherName}
          tone="teacher"
          href={teacherId ? profileHrefForTeacher({ teacherId }) : undefined}
        />
        <PersonCell
          label={headers.student}
          name={studentName}
          tone="student"
          href={studentId ? studentHref(studentId) : undefined}
        />
      </StyledPeopleRow>
    </Box>
  );
}
