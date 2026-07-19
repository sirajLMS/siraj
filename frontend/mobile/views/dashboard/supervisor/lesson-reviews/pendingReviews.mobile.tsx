"use client";

import { CancelOutlined, CheckCircleOutlined, RateReviewOutlined } from "@mui/icons-material";
import { Box, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import type { ReactNode } from "react";
import { buildServerPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";
import { classHref, profileHrefForTeacher, studentHref } from "@/frontend/common/utils/profileHref";
import type {
  PendingReviewRow,
  PendingReviewsViewModel,
} from "@/frontend/common/views/dashboard/supervisor/lesson-reviews/types/pendingReviewsTypes";
import {
  MobileCardList,
  MobileCardListItem,
  MobileContentInset,
  MobileContentStack,
  MobilePageContainer,
  MobilePageHeader,
  MobileSectionPanel,
  MobileStatusBadge,
} from "@/frontend/mobile/components/ui";
import { MobileClassProfileLink } from "@/frontend/mobile/components/ui/display/classProfileLink/ClassProfileLink.mobile";
import { MobilePersonProfileLink } from "@/frontend/mobile/components/ui/display/personProfileLink/PersonProfileLink.mobile";
import { StudentAutocompleteMobile, TeacherAutocompleteMobile } from "@/frontend/mobile/components/ui/input/userSelect";
import { LessonReportDetailPanelMobile } from "@/frontend/mobile/views/dashboard/supervisor/lesson-reviews/components/lessonReportDetailPanel.mobile";
import { RejectReportDialogMobile } from "@/frontend/mobile/views/dashboard/supervisor/lesson-reviews/components/rejectReportDialog.mobile";

function statusLabel(status: PendingReviewRow["status"], labels: PendingReviewsViewModel["labels"]): string {
  if (!status) return labels.statusLabels.PENDING_REVIEW;
  return labels.statusLabels[status] ?? labels.statusLabels.PENDING_REVIEW;
}

function ReviewCard({
  row,
  labels,
  approving,
  onApprove,
  onReject,
  onSelect,
}: Readonly<{
  readonly row: PendingReviewRow;
  readonly labels: PendingReviewsViewModel["labels"];
  readonly approving: boolean;
  readonly onApprove: (id: string) => void;
  readonly onReject: (row: PendingReviewRow) => void;
  readonly onSelect: (row: PendingReviewRow) => void;
}>) {
  return (
    <MobileCardListItem variant="edge-to-edge">
      <Stack
        sx={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 1.5,
        }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.onSurface, fontWeight: 500 })}>
            {row.lessonDate}
          </Typography>
          <Box sx={{ mt: 0.75 }}>
            <MobileClassProfileLink
              href={row.classInstanceId ? classHref(row.classInstanceId) : undefined}
              name={row.subjectName?.trim() || "—"}
              avatarUrl={row.classAvatarUrl}
              label={labels.classColumn}
            />
          </Box>
          <Box sx={{ mt: 0.75 }}>
            <MobilePersonProfileLink
              href={row.studentId ? studentHref(row.studentId) : undefined}
              name={row.studentName || row.studentId}
              label={labels.studentColumn}
            />
          </Box>
          <Box sx={{ mt: 0.75 }}>
            <MobilePersonProfileLink
              href={profileHrefForTeacher({ teacherId: row.teacherId })}
              name={row.teacherName || row.teacherId}
              label={labels.teacherColumn}
            />
          </Box>
        </Box>
        <MobileStatusBadge
          category="classStatus"
          status={row.status ? row.status.toLowerCase() : "pending"}
          label={statusLabel(row.status, labels)}
        />
      </Stack>

      <Stack
        sx={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 1,
          mt: 1.5,
        }}
      >
        <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
          {labels.completionColumn}: {row.completionPercentage}%
        </Typography>
        <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
          {row.attendanceEvaluation ?? ""}
        </Typography>
      </Stack>

      <Stack sx={{ flexDirection: "row", gap: 0.5, justifyContent: "flex-end", mt: 1.5 }}>
        <Tooltip title={labels.reviewButton}>
          <IconButton size="small" aria-label={labels.reviewButton} onClick={() => onSelect(row)}>
            <RateReviewOutlined fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title={labels.approveButton}>
          <IconButton
            size="small"
            aria-label={labels.approveButton}
            onClick={() => onApprove(row.id)}
            disabled={approving}
            sx={theme => ({ color: theme.palette.primary.main })}
          >
            <CheckCircleOutlined fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title={labels.rejectButton}>
          <IconButton
            size="small"
            aria-label={labels.rejectButton}
            onClick={() => onReject(row)}
            sx={theme => ({ color: theme.palette.error.main })}
          >
            <CancelOutlined fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>
    </MobileCardListItem>
  );
}

export function PendingReviewsMobileView(props: Readonly<PendingReviewsViewModel>) {
  const {
    rows,
    totalCount,
    page,
    pageSize,
    selectedReport,
    selectedTeacher,
    studentFilter,
    loading,
    approving,
    rejecting,
    labels,
    onSelectedTeacherChange,
    onStudentFilterChange,
    onPageChange,
    onSelectReport,
    onApprove,
    onOpenRejectDialog,
    onCloseRejectDialog,
    onRejectReasonChange,
    onConfirmReject,
    rejectDialogOpen,
    rejectReason,
  } = props;

  const renderItem = (row: PendingReviewRow): ReactNode => (
    <ReviewCard
      row={row}
      labels={labels}
      approving={approving}
      onApprove={onApprove}
      onReject={onOpenRejectDialog}
      onSelect={onSelectReport}
    />
  );

  return (
    <MobilePageContainer>
      <MobileContentStack>
        <MobilePageHeader title={labels.pageTitle} />

        <MobileSectionPanel contentInset={false}>
          <MobileContentInset>
            <Stack sx={{ gap: 1.5, mb: 2 }}>
              <TeacherAutocompleteMobile
                value={selectedTeacher}
                onChange={onSelectedTeacherChange}
                label={labels.filterByTeacher}
                placeholder={labels.teacherSearchPlaceholder}
              />
              <StudentAutocompleteMobile
                value={studentFilter}
                onChange={onStudentFilterChange}
                label={labels.filterByStudent}
                placeholder={labels.studentSearchPlaceholder}
              />
            </Stack>
          </MobileContentInset>

          <MobileCardList<PendingReviewRow>
            rows={rows}
            loading={loading}
            emptyMessage={labels.noPendingReviews}
            gap={2}
            layout="edge-to-edge"
            getKey={row => row.id}
            paginationOptions={buildServerPaginationOptions({
              page,
              pageSize,
              totalCount,
              onPageChange,
            })}
            renderItem={renderItem}
          />
        </MobileSectionPanel>

        <LessonReportDetailPanelMobile report={selectedReport} labels={labels} />

        <RejectReportDialogMobile
          open={rejectDialogOpen}
          reason={rejectReason}
          loading={rejecting}
          labels={labels}
          onReasonChange={onRejectReasonChange}
          onClose={onCloseRejectDialog}
          onConfirm={onConfirmReject}
        />
      </MobileContentStack>
    </MobilePageContainer>
  );
}
