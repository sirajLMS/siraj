"use client";

import { Stack } from "@mui/material";
import type { ReactNode } from "react";
import { buildServerPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";
import { scheduleOverviewCardShellSx } from "@/frontend/common/views/dashboard/admin/home/components/scheduleOverviewSurfaces";
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
} from "@/frontend/mobile/components/ui";
import { StudentAutocompleteMobile, TeacherAutocompleteMobile } from "@/frontend/mobile/components/ui/input/userSelect";
import { PendingReviewCardMobile } from "@/frontend/mobile/views/dashboard/supervisor/lesson-reviews/components/pendingReviewCard.mobile";
import { LessonReportDetailPanelMobile } from "@/frontend/mobile/views/dashboard/supervisor/lesson-reviews/components/lessonReportDetailPanel.mobile";
import { RejectReportDialogMobile } from "@/frontend/mobile/views/dashboard/supervisor/lesson-reviews/components/rejectReportDialog.mobile";

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
    <MobileCardListItem variant="edge-to-edge" sx={scheduleOverviewCardShellSx}>
      <PendingReviewCardMobile
        row={row}
        labels={labels}
        approving={approving}
        onApprove={onApprove}
        onReject={onOpenRejectDialog}
        onSelect={onSelectReport}
      />
    </MobileCardListItem>
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
            gap={0}
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
