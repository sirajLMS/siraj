"use client";

import { Box, Stack, Typography } from "@mui/material";
import { classHref, profileHrefForTeacher, studentHref } from "@/frontend/common/utils/profileHref";
import type { PendingReviewRow } from "@/frontend/common/views/dashboard/supervisor/lesson-reviews/types/pendingReviewsTypes";
import { MobileStatusBadge } from "@/frontend/mobile/components/ui";
import { MobileClassProfileLink } from "@/frontend/mobile/components/ui/display/classProfileLink/ClassProfileLink.mobile";
import { MobilePersonProfileLink } from "@/frontend/mobile/components/ui/display/personProfileLink/PersonProfileLink.mobile";
import type { PendingReviewsLabels } from "@/shared/locale";

interface LessonReportDetailPanelMobileProps {
  readonly report: PendingReviewRow | null;
  readonly labels: PendingReviewsLabels;
}

function statusLabel(status: PendingReviewRow["status"], labels: PendingReviewsLabels): string {
  if (!status) return labels.statusLabels.PENDING_REVIEW;
  return labels.statusLabels[status] ?? labels.statusLabels.PENDING_REVIEW;
}

export function LessonReportDetailPanelMobile({ report, labels }: Readonly<LessonReportDetailPanelMobileProps>) {
  if (!report) {
    return (
      <Box
        sx={theme => ({
          p: 2.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: theme.palette.surfaceContainer,
          borderRadius: theme.layout.radius.section,
          minHeight: 160,
        })}
      >
        <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
          {labels.noPendingReviews}
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={theme => ({
        p: 2.5,
        backgroundColor: theme.palette.surfaceContainer,
        borderRadius: theme.layout.radius.section,
        display: "flex",
        flexDirection: "column",
        gap: 1.5,
      })}
    >
      <Stack sx={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 1.5 }}>
        <Typography variant="titleLg" sx={theme => ({ color: theme.palette.onSurface })}>
          {report.lessonDate}
        </Typography>
        <MobileStatusBadge
          category="classStatus"
          status={report.status ? report.status.toLowerCase() : "pending"}
          label={statusLabel(report.status, labels)}
        />
      </Stack>

      <Stack sx={{ gap: 1 }}>
        <Stack sx={{ gap: 0.25 }}>
          <Typography variant="labelUppercase" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
            {labels.classColumn}
          </Typography>
          <MobileClassProfileLink
            href={report.classInstanceId ? classHref(report.classInstanceId) : undefined}
            name={report.subjectName?.trim() || "—"}
            avatarUrl={report.classAvatarUrl}
          />
        </Stack>
        <Stack sx={{ gap: 0.25 }}>
          <Typography variant="labelUppercase" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
            {labels.studentColumn}
          </Typography>
          <MobilePersonProfileLink
            href={report.studentId ? studentHref(report.studentId) : undefined}
            name={report.studentName || report.studentId}
            avatarUrl={report.studentAvatarUrl}
          />
        </Stack>
        <Stack sx={{ gap: 0.25 }}>
          <Typography variant="labelUppercase" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
            {labels.teacherColumn}
          </Typography>
          <MobilePersonProfileLink
            href={profileHrefForTeacher({ teacherId: report.teacherId })}
            name={report.teacherName || report.teacherId}
            avatarUrl={report.teacherAvatarUrl}
          />
        </Stack>
        <DetailField label={labels.completionColumn} value={String(report.completionPercentage)} />
        <DetailField label={labels.attendanceColumn} value={report.attendanceEvaluation ?? ""} />
        <DetailField label={labels.submittedAtColumn} value={report.submittedAt} />
      </Stack>

      {report.teacherNotes ? (
        <Box>
          <Typography variant="labelUppercase" sx={theme => ({ color: theme.palette.onSurfaceVariant, mb: 0.5 })}>
            {labels.reviewButton}
          </Typography>
          <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.onSurface })}>
            {report.teacherNotes}
          </Typography>
        </Box>
      ) : null}

      {report.studentNotes ? (
        <Box>
          <Typography variant="labelUppercase" sx={theme => ({ color: theme.palette.onSurfaceVariant, mb: 0.5 })}>
            {labels.studentColumn}
          </Typography>
          <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.onSurface })}>
            {report.studentNotes}
          </Typography>
        </Box>
      ) : null}

      {report.rejectionReason ? (
        <Box>
          <Typography variant="labelUppercase" sx={theme => ({ color: theme.palette.error.main, mb: 0.5 })}>
            {labels.rejectReasonLabel}
          </Typography>
          <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.error.main })}>
            {report.rejectionReason}
          </Typography>
        </Box>
      ) : null}
    </Box>
  );
}

function DetailField({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <Stack sx={{ flexDirection: "column", gap: 0.25 }}>
      <Typography variant="labelUppercase" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
        {label}
      </Typography>
      <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.onSurface, fontWeight: 500 })}>
        {value}
      </Typography>
    </Stack>
  );
}
