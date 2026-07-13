"use client";

import { Box, Stack, Typography } from "@mui/material";
import { StatusBadge } from "@/frontend/common/components/ui/badge/StatusBadge";
import type { PendingReviewRow } from "@/frontend/common/views/dashboard/supervisor/lesson-reviews/types/pendingReviewsTypes";
import type { PendingReviewsLabels } from "@/shared/messages/types/dashboard/supervisorPortal/pendingReviews";

interface LessonReportDetailPanelProps {
  readonly report: PendingReviewRow | null;
  readonly labels: PendingReviewsLabels;
}

export function LessonReportDetailPanel({ report, labels }: Readonly<LessonReportDetailPanelProps>) {
  if (!report) {
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

  return (
    <Box
      sx={theme => ({
        p: 3,
        backgroundColor: theme.palette.surfaceContainer,
        borderRadius: theme.layout.radius.section,
        display: "flex",
        flexDirection: "column",
        gap: 2,
      })}
    >
      <Typography variant="titleLg" sx={theme => ({ color: theme.palette.onSurface })}>
        {report.lessonDate}
      </Typography>

      <StatusBadge
        category="classStatus"
        status={report.status ? report.status.toLowerCase() : "pending"}
        label={report.status ?? "PENDING"}
      />

      <Stack sx={{ gap: 1.5 }}>
        <DetailField label={labels.studentColumn} value={report.studentId} />
        <DetailField label={labels.teacherColumn} value={report.teacherId} />
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
    <Stack sx={{ flexDirection: "row", justifyContent: "space-between", gap: 2 }}>
      <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
        {label}
      </Typography>
      <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.onSurface, fontWeight: 500 })}>
        {value}
      </Typography>
    </Stack>
  );
}
