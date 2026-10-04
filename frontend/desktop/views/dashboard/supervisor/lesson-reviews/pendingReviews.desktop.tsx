"use client";

import { Grid } from "@mui/material";
import { useMemo } from "react";
import { getServerPaginationOptions } from "@/frontend/common/components/ui/filter/serverPaginationProps";
import { useAppLocale } from "@/frontend/common/providers/localeContext";
import type {
  PendingReviewRow,
  PendingReviewsViewModel,
} from "@/frontend/common/views/dashboard/supervisor/lesson-reviews/types/pendingReviewsTypes";
import { DesktopAppDataGrid, DesktopSectionPanel } from "@/frontend/desktop/components/ui";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui/container/page";
import {
  StudentAutocompleteDesktop,
  TeacherAutocompleteDesktop,
} from "@/frontend/desktop/components/ui/input/userSelect";
import { LessonReportDetailPanelDesktop } from "@/frontend/desktop/views/dashboard/supervisor/lesson-reviews/components/lessonReportDetailPanel.desktop";
import { RejectReportDialogDesktop } from "@/frontend/desktop/views/dashboard/supervisor/lesson-reviews/components/rejectReportDialog.desktop";
import { buildPendingReviewColumns } from "@/frontend/desktop/views/dashboard/supervisor/lesson-reviews/pendingReviewsColumns.desktop";

export function PendingReviewsDesktopView(props: Readonly<PendingReviewsViewModel>) {
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

  const locale = useAppLocale();

  const columns = useMemo(
    () =>
      buildPendingReviewColumns({
        labels,
        locale,
        approving,
        onSelectReport,
        onApprove,
        onOpenRejectDialog,
      }),
    [labels, locale, approving, onSelectReport, onApprove, onOpenRejectDialog]
  );

  const paginationOptions = getServerPaginationOptions({ page, pageSize }, totalCount, onPageChange) || {
    mode: "client",
  };

  return (
    <DesktopPageContainer>
      <DesktopPageHeader
        title={labels.pageTitle}
        actions={
          <Grid container spacing={1} sx={{ minWidth: { md: 480 } }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TeacherAutocompleteDesktop
                value={selectedTeacher}
                onChange={onSelectedTeacherChange}
                label={labels.filterByTeacher}
                placeholder={labels.teacherSearchPlaceholder}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <StudentAutocompleteDesktop
                value={studentFilter}
                onChange={onStudentFilterChange}
                label={labels.filterByStudent}
                placeholder={labels.studentSearchPlaceholder}
              />
            </Grid>
          </Grid>
        }
      />

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: selectedReport ? 8 : 12 }}>
          <DesktopSectionPanel contentPadding={false} sx={{ flex: 1 }}>
            <DesktopAppDataGrid<PendingReviewRow>
              rows={rows}
              columns={columns}
              getRowId={row => row.id}
              emptyMessage={labels.noPendingReviews}
              loading={loading}
              autoHeight
              rowHeight={64}
              paginationOptions={paginationOptions}
            />
          </DesktopSectionPanel>
        </Grid>

        {selectedReport ? (
          <Grid size={{ xs: 12, lg: 4 }}>
            <LessonReportDetailPanelDesktop report={selectedReport} labels={labels} />
          </Grid>
        ) : null}
      </Grid>

      <RejectReportDialogDesktop
        open={rejectDialogOpen}
        reason={rejectReason}
        loading={rejecting}
        labels={labels}
        onReasonChange={onRejectReasonChange}
        onClose={onCloseRejectDialog}
        onConfirm={onConfirmReject}
      />
    </DesktopPageContainer>
  );
}
