"use client";

import { Box, Stack, Typography } from "@mui/material";
import type { PendingReviewRow } from "@/frontend/common/views/dashboard/supervisor/lesson-reviews/types/pendingReviewsTypes";
import { MobileStatusBadge } from "@/frontend/mobile/components/ui";
import type { PendingReviewsLabels } from "@/shared/locale";

interface LessonReportDetailPanelMobileProps {
  readonly report: PendingReviewRow | null;
  readonly labels: PendingReviewsLabels;
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
          label={report.status ?? "PENDING"}
        />
      </Stack>

      <Stack sx={{ gap: 1 }}>
        <DetailField label={labels.studentColumn} value={report.studentName ?? ""} />
        <DetailField label={labels.teacherColumn} value={report.teacherName ?? ""} />
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
