"use client";

import { CancelOutlined, CheckCircleOutlined, RateReviewOutlined } from "@mui/icons-material";
import { Box, Grid, IconButton, Tooltip } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { useMemo } from "react";
import { getServerPaginationOptions } from "@/frontend/common/components/ui/filter/serverPaginationProps";
import { classHref, profileHrefForTeacher, studentHref } from "@/frontend/common/utils/profileHref";
import type {
  PendingReviewRow,
  PendingReviewsViewModel,
} from "@/frontend/common/views/dashboard/supervisor/lesson-reviews/types/pendingReviewsTypes";
import { DesktopAppDataGrid, DesktopSectionPanel } from "@/frontend/desktop/components/ui";
import { DesktopStatusBadge } from "@/frontend/desktop/components/ui/badge";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui/container/page";
import { DesktopClassProfileLinkCell } from "@/frontend/desktop/components/ui/display/classProfileLink/ClassProfileLinkCell.desktop";
import { DesktopPersonProfileLinkCell } from "@/frontend/desktop/components/ui/display/personProfileLink/PersonProfileLinkCell.desktop";
import {
  StudentAutocompleteDesktop,
  TeacherAutocompleteDesktop,
} from "@/frontend/desktop/components/ui/input/userSelect";
import { LessonReportDetailPanelDesktop } from "@/frontend/desktop/views/dashboard/supervisor/lesson-reviews/components/lessonReportDetailPanel.desktop";
import { RejectReportDialogDesktop } from "@/frontend/desktop/views/dashboard/supervisor/lesson-reviews/components/rejectReportDialog.desktop";

function statusLabel(status: PendingReviewRow["status"], labels: PendingReviewsViewModel["labels"]): string {
  if (!status) return labels.statusLabels.PENDING_REVIEW;
  return labels.statusLabels[status] ?? labels.statusLabels.PENDING_REVIEW;
}

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
        field: "subjectName",
        headerName: labels.classColumn,
        flex: 1.2,
        minWidth: 180,
        renderCell: params => (
          <DesktopClassProfileLinkCell
            href={params.row.classInstanceId ? classHref(params.row.classInstanceId) : undefined}
            name={params.row.subjectName?.trim() || "—"}
            avatarUrl={params.row.classAvatarUrl}
          />
        ),
      },
      {
        field: "studentName",
        headerName: labels.studentColumn,
        flex: 1,
        minWidth: 150,
        renderCell: params => (
          <DesktopPersonProfileLinkCell
            href={params.row.studentId ? studentHref(params.row.studentId) : undefined}
            name={params.row.studentName || params.row.studentId}
            avatarUrl={params.row.studentAvatarUrl}
          />
        ),
      },
      {
        field: "teacherName",
        headerName: labels.teacherColumn,
        flex: 1,
        minWidth: 150,
        renderCell: params => (
          <DesktopPersonProfileLinkCell
            href={profileHrefForTeacher({ teacherId: params.row.teacherId })}
            name={params.row.teacherName || params.row.teacherId}
            avatarUrl={params.row.teacherAvatarUrl}
          />
        ),
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
        width: 120,
        renderCell: params => (
          <DesktopStatusBadge
            category="classStatus"
            status={params.row.status ? params.row.status.toLowerCase() : "pending"}
            label={statusLabel(params.row.status, labels)}
          />
        ),
      },
      {
        field: "actions",
        headerName: labels.actionsColumn,
        width: 140,
        align: "center",
        headerAlign: "center",
        sortable: false,
        renderCell: params => (
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5, height: "100%" }}>
            <Tooltip title={labels.reviewButton}>
              <IconButton size="small" aria-label={labels.reviewButton} onClick={() => onSelectReport(params.row)}>
                <RateReviewOutlined fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title={labels.approveButton}>
              <IconButton
                size="small"
                aria-label={labels.approveButton}
                onClick={() => onApprove(params.row.id)}
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
                onClick={() => onOpenRejectDialog(params.row)}
                sx={theme => ({ color: theme.palette.error.main })}
              >
                <CancelOutlined fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
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
