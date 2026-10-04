"use client";

import { Box, Stack, Typography } from "@mui/material";
import { classHref, profileHrefForTeacher, studentHref } from "@/frontend/common/utils/profileHref";
import type { PendingReviewRow } from "@/frontend/common/views/dashboard/supervisor/lesson-reviews/types/pendingReviewsTypes";
import { MobileStatusBadge } from "@/frontend/mobile/components/ui";
import { MobileClassProfileLink } from "@/frontend/mobile/components/ui/display/classProfileLink/ClassProfileLink.mobile";
import { MobilePersonProfileLink } from "@/frontend/mobile/components/ui/display/personProfileLink/PersonProfileLink.mobile";
import {
  DetailField,
  NoteBlock,
  ProfileField,
} from "@/frontend/mobile/views/dashboard/supervisor/lesson-reviews/components/lessonReportDetailPanel.parts";
import type { PendingReviewsLabels } from "@/shared/locale";

interface LessonReportDetailPanelMobileProps {
  readonly report: PendingReviewRow | null;
  readonly labels: PendingReviewsLabels;
}

function statusLabel(status: PendingReviewRow["status"], labels: PendingReviewsLabels): string {
  if (!status) return labels.statusLabels.PENDING_REVIEW;
  return labels.statusLabels[status] ?? labels.statusLabels.PENDING_REVIEW;
}

function EmptyReportPanel({ labels }: { readonly labels: PendingReviewsLabels }) {
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

export function LessonReportDetailPanelMobile({ report, labels }: Readonly<LessonReportDetailPanelMobileProps>) {
  if (!report) {
    return <EmptyReportPanel labels={labels} />;
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
        <ProfileField label={labels.classColumn}>
          <MobileClassProfileLink
            href={report.classInstanceId ? classHref(report.classInstanceId) : undefined}
            name={report.subjectName?.trim() || "—"}
            avatarUrl={report.classAvatarUrl}
          />
        </ProfileField>
        <ProfileField label={labels.studentColumn}>
          <MobilePersonProfileLink
            href={report.studentId ? studentHref(report.studentId) : undefined}
            name={report.studentName || report.studentId}
            avatarUrl={report.studentAvatarUrl}
          />
        </ProfileField>
        <ProfileField label={labels.teacherColumn}>
          <MobilePersonProfileLink
            href={profileHrefForTeacher({ teacherId: report.teacherId })}
            name={report.teacherName || report.teacherId}
            avatarUrl={report.teacherAvatarUrl}
          />
        </ProfileField>
        <DetailField label={labels.completionColumn} value={String(report.completionPercentage)} />
        <DetailField label={labels.attendanceColumn} value={report.attendanceEvaluation ?? ""} />
        <DetailField label={labels.submittedAtColumn} value={report.submittedAt} />
      </Stack>

      {report.teacherNotes && <NoteBlock label={labels.reviewButton} value={report.teacherNotes} />}
      {report.studentNotes && <NoteBlock label={labels.studentColumn} value={report.studentNotes} />}
      {report.rejectionReason && <NoteBlock label={labels.rejectReasonLabel} value={report.rejectionReason} isError />}
    </Box>
  );
}
