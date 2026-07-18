"use client";

import { ChevronRightOutlined } from "@mui/icons-material";
import { Autocomplete, Box, Stack, TextField, Typography } from "@mui/material";
import type { ReactNode } from "react";
import type {
  DirectoryPersonOption,
  PendingReviewRow,
  PendingReviewsViewModel,
} from "@/frontend/common/views/dashboard/supervisor/lesson-reviews/types/pendingReviewsTypes";
import {
  MobileCardList,
  MobileContentStack,
  MobileFilterButton,
  MobilePageContainer,
  MobilePageHeader,
  MobilePrimaryPageAction,
  MobileSectionPanel,
  MobileStatusBadge,
} from "@/frontend/mobile/components/ui";
import { LessonReportDetailPanelMobile } from "@/frontend/mobile/views/dashboard/supervisor/lesson-reviews/components/lessonReportDetailPanel.mobile";
import { RejectReportDialogMobile } from "@/frontend/mobile/views/dashboard/supervisor/lesson-reviews/components/rejectReportDialog.mobile";

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
    <Box
      sx={theme => ({
        p: 2,
        backgroundColor: theme.palette.surfaceContainer,
        borderRadius: theme.layout.radius.section,
        display: "flex",
        flexDirection: "column",
        gap: 1.5,
      })}
    >
      <Stack
        sx={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.onSurface, fontWeight: 500 })}>
            {row.lessonDate}
          </Typography>
          <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
            {labels.studentColumn}: {row.studentName || row.studentId}
          </Typography>
          <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
            {labels.teacherColumn}: {row.teacherName || row.teacherId}
          </Typography>
        </Box>
        <MobileStatusBadge
          category="classStatus"
          status={row.status ? row.status.toLowerCase() : "pending"}
          label={row.status ?? "PENDING"}
        />
      </Stack>

      <Stack
        sx={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 1,
        }}
      >
        <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
          {labels.completionColumn}: {row.completionPercentage}%
        </Typography>
        <Typography variant="labelMd" sx={theme => ({ color: theme.palette.onSurfaceVariant })}>
          {row.attendanceEvaluation ?? ""}
        </Typography>
      </Stack>

      <Stack sx={{ flexDirection: "row", gap: 1, flexWrap: "wrap" }}>
        <MobileFilterButton size="small" onClick={() => onSelect(row)} startIcon={<ChevronRightOutlined />}>
          {labels.reviewButton}
        </MobileFilterButton>
        <MobilePrimaryPageAction size="small" onClick={() => onApprove(row.id)} disabled={approving}>
          {labels.approveButton}
        </MobilePrimaryPageAction>
        <MobileFilterButton
          size="small"
          onClick={() => onReject(row)}
          sx={theme => ({
            borderColor: theme.palette.error.main,
            color: theme.palette.error.main,
          })}
        >
          {labels.rejectButton}
        </MobileFilterButton>
      </Stack>
    </Box>
  );
}

export function PendingReviewsMobileView(props: Readonly<PendingReviewsViewModel>) {
  const {
    rows,
    selectedReport,
    teacherFilter,
    studentFilter,
    teacherOptions,
    studentOptions,
    loading,
    approving,
    rejecting,
    labels,
    onTeacherFilterChange,
    onStudentFilterChange,
    onSelectReport,
    onApprove,
    onOpenRejectDialog,
    onCloseRejectDialog,
    onRejectReasonChange,
    onConfirmReject,
    rejectDialogOpen,
    rejectReason,
  } = props;

  const selectedTeacher = teacherOptions.find(o => o.id === teacherFilter) ?? null;
  const selectedStudent = studentOptions.find(o => o.id === studentFilter) ?? null;

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

        {loading ? (
          <Typography variant="bodyMd" sx={theme => ({ color: theme.palette.text.secondary })}>
            {labels.loadingMessage}
          </Typography>
        ) : null}

        <MobileSectionPanel>
          <Stack sx={{ gap: 1.5, mb: 2 }}>
            <Autocomplete<DirectoryPersonOption>
              options={[...teacherOptions]}
              value={selectedTeacher}
              onChange={(_, option) => onTeacherFilterChange(option?.id ?? "")}
              getOptionLabel={option => option.name}
              isOptionEqualToValue={(a, b) => a.id === b.id}
              renderInput={params => (
                <TextField
                  {...params}
                  label={labels.filterByTeacher}
                  placeholder={labels.teacherSearchPlaceholder}
                  size="small"
                />
              )}
            />
            <Autocomplete<DirectoryPersonOption>
              options={[...studentOptions]}
              value={selectedStudent}
              onChange={(_, option) => onStudentFilterChange(option?.id ?? "")}
              getOptionLabel={option => option.name}
              isOptionEqualToValue={(a, b) => a.id === b.id}
              renderInput={params => (
                <TextField
                  {...params}
                  label={labels.filterByStudent}
                  placeholder={labels.studentSearchPlaceholder}
                  size="small"
                />
              )}
            />
          </Stack>

          <MobileCardList<PendingReviewRow>
            rows={rows}
            emptyMessage={labels.noPendingReviews}
            gap={2}
            layout="edge-to-edge"
            getKey={row => row.id}
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
