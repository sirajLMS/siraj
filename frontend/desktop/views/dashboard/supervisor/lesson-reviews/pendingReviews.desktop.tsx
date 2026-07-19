"use client";

import { Grid } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { useMemo } from "react";
import { getServerPaginationOptions } from "@/frontend/common/components/ui/filter/serverPaginationProps";
import type {
  PendingReviewRow,
  PendingReviewsViewModel,
} from "@/frontend/common/views/dashboard/supervisor/lesson-reviews/types/pendingReviewsTypes";
import {
  DesktopAppDataGrid,
  DesktopFilterButton,
  DesktopPrimaryPageAction,
  DesktopSectionPanel,
} from "@/frontend/desktop/components/ui";
import { DesktopStatusBadge } from "@/frontend/desktop/components/ui/badge";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui/container/page";
import {
  StudentAutocompleteDesktop,
  TeacherAutocompleteDesktop,
} from "@/frontend/desktop/components/ui/input/userSelect";
import { LessonReportDetailPanelDesktop } from "@/frontend/desktop/views/dashboard/supervisor/lesson-reviews/components/lessonReportDetailPanel.desktop";
import { RejectReportDialogDesktop } from "@/frontend/desktop/views/dashboard/supervisor/lesson-reviews/components/rejectReportDialog.desktop";

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

  const columns = useMemo<GridColDef<PendingReviewRow>[]>(
    () => [
      {
        field: "lessonDate",
        headerName: labels.lessonDateColumn,
        flex: 1,
        minWidth: 150,
      },
      {
        field: "studentName",
        headerName: labels.studentColumn,
        flex: 1,
        minWidth: 150,
        valueGetter: (_, row) => row.studentName || row.studentId,
      },
      {
        field: "teacherName",
        headerName: labels.teacherColumn,
        flex: 1,
        minWidth: 150,
        valueGetter: (_, row) => row.teacherName || row.teacherId,
      },
      {
        field: "attendanceEvaluation",
        headerName: labels.attendanceColumn,
        width: 130,
        valueGetter: (_, row) => row.attendanceEvaluation ?? "",
      },
      {
        field: "completionPercentage",
        headerName: labels.completionColumn,
        width: 130,
        valueGetter: (_, row) => `${row.completionPercentage}%`,
      },
      {
        field: "submittedAt",
        headerName: labels.submittedAtColumn,
        flex: 1,
        minWidth: 150,
        valueGetter: (_, row) => row.submittedAt,
      },
      {
        field: "status",
        headerName: labels.statusColumn,
        width: 140,
        renderCell: params => (
          <DesktopStatusBadge
            category="classStatus"
            status={params.row.status ? params.row.status.toLowerCase() : "pending"}
            label={params.row.status ?? "PENDING"}
          />
        ),
      },
      {
        field: "actions",
        headerName: labels.actionsColumn,
        width: 280,
        align: "center",
        headerAlign: "center",
        sortable: false,
        renderCell: params => (
          <Grid container spacing={1} sx={{ flexWrap: "nowrap" }}>
            <Grid>
              <DesktopFilterButton size="small" onClick={() => onSelectReport(params.row)}>
                {labels.reviewButton}
              </DesktopFilterButton>
            </Grid>
            <Grid>
              <DesktopPrimaryPageAction size="small" onClick={() => onApprove(params.row.id)} disabled={approving}>
                {labels.approveButton}
              </DesktopPrimaryPageAction>
            </Grid>
            <Grid>
              <DesktopFilterButton
                size="small"
                onClick={() => onOpenRejectDialog(params.row)}
                sx={theme => ({
                  borderColor: theme.palette.error.main,
                  color: theme.palette.error.main,
                })}
              >
                {labels.rejectButton}
              </DesktopFilterButton>
            </Grid>
          </Grid>
        ),
      },
    ],
    [labels, approving, onSelectReport, onApprove, onOpenRejectDialog]
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
          <DesktopSectionPanel sx={{ flex: 1 }}>
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
