"use client";

import { AccessTimeOutlined, HistoryOutlined, VisibilityOutlined } from "@mui/icons-material";
import { Avatar, Box, Paper, Stack, type Theme, Tooltip, Typography } from "@mui/material";
import { alpha, styled } from "@mui/material/styles";
import { useLocale } from "next-intl";
import { ActionIconLink } from "@/frontend/components/ui";
import { AppPermission, type ClassExecutionState, ClassOutcome } from "@/frontend/graphql/generated/gql/graphql-types";
import { useUserStore } from "@/frontend/stores/userStore";
import { profileHrefForTeacher, studentHref } from "@/frontend/utils/profileHref";
import type { DailyScheduleRow } from "@/frontend/views/dashboard/admin/dashboard/types/schedule";
import {
  formatDurationMinutes,
  formatScheduleTimeOnly,
  formatScheduleYourTime,
} from "@/frontend/views/dashboard/admin/dashboard/utils/formatScheduleTime";
import { Link } from "@/shared/i18n/routing";
import { ScheduleInstanceStatusBadge } from "./ScheduleInstanceStatusBadge";
import { StyledScheduleNameLink } from "./ScheduleOverviewDataGrid.styles";

interface ScheduleOverviewCardListProps {
  readonly rows: readonly DailyScheduleRow[];
  readonly headers: {
    readonly student: string;
    readonly teacher: string;
    readonly yourTime: string;
    readonly teacherTime: string;
    readonly studentTime: string;
    readonly duration: string;
    readonly status: string;
    readonly history: string;
  };
  readonly statusLabels: Record<ClassOutcome | ClassExecutionState, string>;
  readonly detailsLabel: string;
  readonly emptyMessage: string;
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

const StyledEmptyStateBox = styled(Box)(({ theme }) => ({
  paddingTop: theme.spacing(4),
  paddingBottom: theme.spacing(4),
  paddingInline: theme.spacing(2),
  textAlign: "center",
}));

const StyledScheduleCard = styled(Paper, {
  shouldForwardProp: prop => prop !== "isAbsent",
})<{ isAbsent: boolean }>(({ theme, isAbsent }) => ({
  paddingBlock: theme.spacing(2),
  paddingInline: theme.spacing(2),
  borderRadius: 0,
  opacity: isAbsent ? 0.85 : 1,
  backgroundColor: theme.palette.surfaceContainerLowest,
  boxShadow: "none",
  overflow: "hidden",
  width: "100%",
}));

const StyledCardList = styled(Stack)(({ theme }) => ({
  gap: theme.spacing(2),
  backgroundColor: theme.palette.surfaceContainerHighest,
}));

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
  readonly value: string;
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
          <StyledMetaValue variant="bodyMd" title={item.value} tone={item.tone}>
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

interface ScheduleOverviewMobileCardProps {
  readonly row: DailyScheduleRow;
  readonly headers: ScheduleOverviewCardListProps["headers"];
  readonly statusLabels: ScheduleOverviewCardListProps["statusLabels"];
  readonly detailsLabel: string;
  readonly showTimezones: boolean;
  readonly locale: string;
}

function ScheduleOverviewMobileCard({
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
    <StyledScheduleCard elevation={0} isAbsent={isAbsent}>
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

        <StyledCardActions>
          {studentId ? (
            <Tooltip title={headers.history}>
              <ActionIconLink href={`${studentHref(studentId)}/history`} aria-label={headers.history}>
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
        items={[
          ...(showTimezones ? [{ label: headers.teacherTime, value: teacherTime, tone: "teacher" as const }] : []),
          ...(showTimezones ? [{ label: headers.studentTime, value: studentTime, tone: "student" as const }] : []),
          { label: headers.duration, value: duration, tone: "default" as const },
        ]}
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
    </StyledScheduleCard>
  );
}

export function ScheduleOverviewCardList({
  rows,
  headers,
  statusLabels,
  detailsLabel,
  emptyMessage,
}: ScheduleOverviewCardListProps) {
  const locale = useLocale();
  const { hasPermission } = useUserStore();
  const showTimezones = hasPermission(AppPermission.ScheduleViewTimezones);

  if (rows.length === 0) {
    return (
      <StyledEmptyStateBox>
        <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
          {emptyMessage}
        </Typography>
      </StyledEmptyStateBox>
    );
  }

  return (
    <StyledCardList>
      {rows.map(row => (
        <ScheduleOverviewMobileCard
          key={row.id ?? undefined}
          row={row}
          headers={headers}
          statusLabels={statusLabels}
          detailsLabel={detailsLabel}
          showTimezones={showTimezones}
          locale={locale}
        />
      ))}
    </StyledCardList>
  );
}
