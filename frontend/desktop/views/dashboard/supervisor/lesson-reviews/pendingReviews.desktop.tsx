"use client";

import { Grid } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { useMemo } from "react";
import {
  AppDataGrid,
  FilterButton,
  PageContainer,
  PageHeader,
  PrimaryPageAction,
  SectionPanel,
} from "@/frontend/common/components/ui";
import { StatusBadge } from "@/frontend/common/components/ui/badge/StatusBadge";
import type { PendingReviewRow } from "@/frontend/common/views/dashboard/supervisor/lesson-reviews/types/pendingReviewsTypes";
import type { PendingReviewsViewModel } from "@/frontend/common/views/dashboard/supervisor/lesson-reviews/usePendingReviewsViewModel";
import { LessonReportDetailPanelDesktop } from "@/frontend/desktop/views/dashboard/supervisor/lesson-reviews/components/lessonReportDetailPanel.desktop";

interface PendingReviewsDesktopViewProps extends PendingReviewsViewModel {
  readonly rows: readonly PendingReviewRow[];
}

export function PendingReviewsDesktopView({
  rows,
  selectedReport,
  teacherFilter,
  studentFilter,
  loading,
  approving,
  labels,
  onTeacherFilterChange,
  onStudentFilterChange,
  onSelectReport,
  onApprove,
  onOpenRejectDialog,
}: Readonly<PendingReviewsDesktopViewProps>) {
  const columns = useMemo<GridColDef<PendingReviewRow>[]>(
    () => [
      {
        field: "lessonDate",
        headerName: labels.lessonDateColumn,
        flex: 1,
        minWidth: 150,
      },
      {
        field: "studentId",
        headerName: labels.studentColumn,
        flex: 1,
        minWidth: 150,
      },
      {
        field: "teacherId",
        headerName: labels.teacherColumn,
        flex: 1,
        minWidth: 150,
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
          <StatusBadge
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
        renderCell: params => (
          <Grid container spacing={1} sx={{ flexWrap: "nowrap" }}>
            <Grid>
              <FilterButton size="small" onClick={() => onSelectReport(params.row)}>
                {labels.reviewButton}
              </FilterButton>
            </Grid>
            <Grid>
              <PrimaryPageAction size="small" onClick={() => onApprove(params.row.id)} disabled={approving}>
                {labels.approveButton}
              </PrimaryPageAction>
            </Grid>
            <Grid>
              <FilterButton
                size="small"
                onClick={() => onOpenRejectDialog(params.row)}
                sx={theme => ({
                  borderColor: theme.palette.error.main,
                  color: theme.palette.error.main,
                })}
              >
                {labels.rejectButton}
              </FilterButton>
            </Grid>
          </Grid>
        ),
      },
    ],
    [labels, approving, onSelectReport, onApprove, onOpenRejectDialog]
  );

  return (
    <PageContainer>
      <PageHeader
        title={labels.pageTitle}
        actions={
          <Grid container spacing={1}>
            <Grid>
              <FilterButton onClick={() => onTeacherFilterChange(teacherFilter ? "" : "active")}>
                {labels.filterByTeacher}
              </FilterButton>
            </Grid>
            <Grid>
              <FilterButton onClick={() => onStudentFilterChange(studentFilter ? "" : "active")}>
                {labels.filterByStudent}
              </FilterButton>
            </Grid>
          </Grid>
        }
      />

      <SectionPanel sx={{ flex: 1 }}>
        <AppDataGrid<PendingReviewRow>
          rows={rows}
          columns={columns}
          getRowId={row => row.id}
          emptyMessage={labels.noPendingReviews}
          loading={loading}
          autoHeight
          rowHeight={64}
        />
      </SectionPanel>

      <Grid size={{ xs: 12, lg: 4 }}>
        <LessonReportDetailPanelDesktop report={selectedReport} labels={labels} />
      </Grid>
    </PageContainer>
  );
}
