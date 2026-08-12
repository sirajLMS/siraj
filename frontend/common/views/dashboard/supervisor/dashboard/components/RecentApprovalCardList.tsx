"use client";

import {
  AccessTimeOutlined,
  CheckCircleOutlined,
  HistoryOutlined,
  SchoolOutlined,
  VisibilityOutlined,
} from "@mui/icons-material";
import { Avatar, Box, Tooltip, Typography } from "@mui/material";
import { alpha, styled } from "@mui/material/styles";
import type * as React from "react";
import { ActionIconLink, StatusBadge } from "@/frontend/common/components/ui";
import { ClassProfileLink } from "@/frontend/common/components/ui/display/classProfileLink/ClassProfileLink";
import { LessonReportStatus } from "@/frontend/common/graphql/generated/gql/graphql-types";
import {
  classHref,
  profileHrefForTeacher,
  studentHref,
  studentProfileTabHref,
} from "@/frontend/common/utils/profileHref";
import { formatDurationMinutes } from "@/frontend/common/views/dashboard/admin/home/utils/formatScheduleTime";
import {
  getNameInitials,
  getPersonAccentColor,
  type PersonAccentTone,
} from "@/frontend/common/views/dashboard/admin/home/utils/scheduleCardHelpers";
import {
  ScheduleSessionCardSkeleton,
  ScheduleSessionEmptyState,
} from "@/frontend/common/views/dashboard/components/ScheduleSessionCardStates";
import type { RecentApproval } from "@/frontend/common/views/dashboard/supervisor/dashboard/types/supervisorDashboardTypes";
import { Link } from "@/shared/i18n";

export interface RecentApprovalCardLabels {
  readonly approvedTime: string;
  readonly lessonDate: string;
  readonly duration: string;
  readonly completion: string;
  readonly teacher: string;
  readonly student: string;
  readonly viewReport: string;
  readonly viewClass: string;
  readonly history: string;
  readonly approvedStatus: string;
}

export interface RecentApprovalCardProps {
  readonly item: RecentApproval;
  readonly labels: RecentApprovalCardLabels;
}

function resolveApprovalStatusKey(status: LessonReportStatus | null): string {
  if (status === LessonReportStatus.Approved) {
    return "completed";
  }
  return "pending";
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
}

function ApprovalMetaStatBar({ items }: { readonly items: readonly MetaStatItem[] }) {
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

interface RecentApprovalCardActionsProps {
  readonly item: RecentApproval;
  readonly labels: RecentApprovalCardLabels;
}

function RecentApprovalCardActions({ item, labels }: RecentApprovalCardActionsProps) {
  const reportId = item.id;
  const studentId = item.studentId || undefined;
  const classInstanceId = item.classInstanceId || undefined;

  return (
    <StyledCardActions>
      {reportId ? (
        <Tooltip title={labels.viewReport}>
          <ActionIconLink href={`/lesson-reports/${reportId}`} aria-label={labels.viewReport}>
            <VisibilityOutlined fontSize="small" />
          </ActionIconLink>
        </Tooltip>
      ) : null}
      {studentId ? (
        <Tooltip title={labels.history}>
          <ActionIconLink href={studentProfileTabHref(studentId, "history")} aria-label={labels.history}>
            <HistoryOutlined fontSize="small" />
          </ActionIconLink>
        </Tooltip>
      ) : null}
      {classInstanceId ? (
        <Tooltip title={labels.viewClass}>
          <ActionIconLink href={classHref(classInstanceId)} aria-label={labels.viewClass}>
            <SchoolOutlined fontSize="small" />
          </ActionIconLink>
        </Tooltip>
      ) : null}
    </StyledCardActions>
  );
}

function buildApprovalMetaItems(item: RecentApproval, labels: RecentApprovalCardLabels): MetaStatItem[] {
  const duration = formatDurationMinutes(item.durationMinutes);
  const completion = item.completionPercentage != null ? `${item.completionPercentage}%` : "—";

  return [
    { label: labels.lessonDate, value: item.lessonDate || "—", tone: "default" },
    { label: labels.duration, value: duration || "—", tone: "default" },
    { label: labels.completion, value: completion, tone: "default" },
  ];
}

export function RecentApprovalCard({ item, labels }: RecentApprovalCardProps) {
  const subjectName = item.subjectName?.trim() || "—";
  const teacherName = item.teacherName || item.teacherId || "—";
  const studentName = item.studentName || item.studentId || "—";
  const classInstanceId = item.classInstanceId || "";

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
      <StyledCardHeader>
        <StyledCardHeaderMain>
          <ClassProfileLink
            href={classInstanceId ? classHref(classInstanceId) : undefined}
            name={subjectName}
            avatarUrl={item.classAvatarUrl}
            avatarSize={40}
            typographyVariant="titleLg"
            fontWeight={700}
          />

          <StatusBadge
            category="classStatus"
            status={resolveApprovalStatusKey(item.status)}
            label={labels.approvedStatus}
            size="small"
          />
        </StyledCardHeaderMain>

        <RecentApprovalCardActions item={item} labels={labels} />
      </StyledCardHeader>

      <StyledTimeHighlight>
        <AccessTimeOutlined sx={theme => ({ fontSize: 18, color: theme.palette.primary.main, flexShrink: 0 })} />
        <StyledTimeHighlightContent>
          <StyledTimeHighlightLabel variant="labelMd">{labels.approvedTime}</StyledTimeHighlightLabel>
          <StyledTimeHighlightText variant="bodyLg" title={item.reviewedAt}>
            {item.reviewedAt || "—"}
          </StyledTimeHighlightText>
        </StyledTimeHighlightContent>
      </StyledTimeHighlight>

      <ApprovalMetaStatBar items={buildApprovalMetaItems(item, labels)} />

      <StyledPeopleRow>
        <PersonCell
          label={labels.teacher}
          name={teacherName}
          tone="teacher"
          href={item.teacherId ? profileHrefForTeacher({ teacherId: item.teacherId }) : undefined}
          avatarUrl={item.teacherAvatarUrl}
        />
        <PersonCell
          label={labels.student}
          name={studentName}
          tone="student"
          href={item.studentId ? studentHref(item.studentId) : undefined}
          avatarUrl={item.studentAvatarUrl}
        />
      </StyledPeopleRow>
    </Box>
  );
}

export function RecentApprovalCardSkeleton() {
  return <ScheduleSessionCardSkeleton actionCount={3} />;
}

export function RecentApprovalEmptyState({ message }: { readonly message: string }) {
  return <ScheduleSessionEmptyState message={message} icon={CheckCircleOutlined} iconColorKey="primary" />;
}
