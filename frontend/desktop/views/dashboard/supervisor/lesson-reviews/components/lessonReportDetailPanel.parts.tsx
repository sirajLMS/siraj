"use client";

import { Box, Grid, Stack, Typography } from "@mui/material";
import { StatusBadge } from "@/frontend/common/components/ui/badge/StatusBadge";
import { LabeledField } from "@/frontend/common/components/ui/display/labeledField/LabeledField";
import { classHref, profileHrefForTeacher, studentHref } from "@/frontend/common/utils/profileHref";
import type { PendingReviewRow } from "@/frontend/common/views/dashboard/supervisor/lesson-reviews/types/pendingReviewsTypes";
import { DesktopClassProfileLink } from "@/frontend/desktop/components/ui/display/classProfileLink/ClassProfileLink.desktop";
import { DesktopPersonProfileLink } from "@/frontend/desktop/components/ui/display/personProfileLink/PersonProfileLink.desktop";
import type { PendingReviewsLabels } from "@/shared/locale";

interface NotesBlockProps {
  readonly label: string;
  readonly value: string;
  readonly isError?: boolean;
}

function statusLabel(status: PendingReviewRow["status"], labels: PendingReviewsLabels): string {
  if (!status) return labels.statusLabels.PENDING_REVIEW;
  return labels.statusLabels[status] ?? labels.statusLabels.PENDING_REVIEW;
}

export function EmptyReportPanel({ labels }: { readonly labels: PendingReviewsLabels }) {
  return (
    <Box
      sx={theme => ({
        p: 3,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: theme.palette.surfaceContainer,
        borderRadius: theme.layout.radius.section,
        minHeight: 200,
      })}
    >
      <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
        {labels.noPendingReviews}
      </Typography>
    </Box>
  );
}

export function LessonReportHeaderRow({
  report,
  labels,
}: Readonly<{ report: PendingReviewRow; labels: PendingReviewsLabels }>) {
  return (
    <Stack sx={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
      <Typography variant="titleLg" sx={theme => ({ color: theme.palette.onSurface })}>
        {report.lessonDate}
      </Typography>
      <StatusBadge
        category="classStatus"
        status={report.status ? report.status.toLowerCase() : "pending"}
        label={statusLabel(report.status, labels)}
      />
    </Stack>
  );
}

function ProfileFieldStack({ label, children }: Readonly<{ label: string; children: React.ReactNode }>) {
  return (
    <Stack sx={{ gap: 0.25 }}>
      <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
        {label}
      </Typography>
      {children}
    </Stack>
  );
}

export function LessonReportDetailGrid({
  report,
  labels,
}: Readonly<{ report: PendingReviewRow; labels: PendingReviewsLabels }>) {
  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12 }}>
        <ProfileFieldStack label={labels.classColumn}>
          <DesktopClassProfileLink
            href={report.classInstanceId ? classHref(report.classInstanceId) : undefined}
            name={report.subjectName?.trim() || "—"}
            avatarUrl={report.classAvatarUrl}
          />
        </ProfileFieldStack>
      </Grid>
      <Grid size={{ xs: 6, md: 12, lg: 6 }}>
        <ProfileFieldStack label={labels.studentColumn}>
          <DesktopPersonProfileLink
            href={report.studentId ? studentHref(report.studentId) : undefined}
            name={report.studentName || report.studentId}
            avatarUrl={report.studentAvatarUrl}
          />
        </ProfileFieldStack>
      </Grid>
      <Grid size={{ xs: 6, md: 12, lg: 6 }}>
        <ProfileFieldStack label={labels.teacherColumn}>
          <DesktopPersonProfileLink
            href={profileHrefForTeacher({ teacherId: report.teacherId })}
            name={report.teacherName || report.teacherId}
            avatarUrl={report.teacherAvatarUrl}
          />
        </ProfileFieldStack>
      </Grid>
      <Grid size={{ xs: 6, md: 12, lg: 6 }}>
        <LabeledField label={labels.completionColumn} value={String(report.completionPercentage)} />
      </Grid>
      <Grid size={{ xs: 6, md: 12, lg: 6 }}>
        <LabeledField label={labels.attendanceColumn} value={report.attendanceEvaluation ?? ""} />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <LabeledField label={labels.submittedAtColumn} value={report.submittedAt} />
      </Grid>
    </Grid>
  );
}

export function LessonReportNotesSection({
  report,
  labels,
}: Readonly<{ report: PendingReviewRow; labels: PendingReviewsLabels }>) {
  return (
    <>
      {report.teacherNotes ? <NotesBlock label={labels.reviewButton} value={report.teacherNotes} /> : null}
      {report.studentNotes ? <NotesBlock label={labels.studentColumn} value={report.studentNotes} /> : null}
      {report.rejectionReason ? (
        <NotesBlock label={labels.rejectReasonLabel} value={report.rejectionReason} isError />
      ) : null}
    </>
  );
}

function NotesBlock({ label, value, isError }: Readonly<NotesBlockProps>) {
  return (
    <Box>
      <Typography
        variant="labelUppercase"
        sx={theme => ({ color: isError ? theme.palette.error.main : theme.palette.onSurfaceVariant, mb: 0.5 })}
      >
        {label}
      </Typography>
      <Typography
        variant="bodyMd"
        sx={theme => ({ color: isError ? theme.palette.error.main : theme.palette.onSurface })}
      >
        {value}
      </Typography>
    </Box>
  );
}
