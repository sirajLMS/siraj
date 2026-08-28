"use client";

import { Box, FormControl, InputLabel, MenuItem, Select, Stack, Typography } from "@mui/material";
import type { ComponentType, ReactNode } from "react";
import { StatusBadge } from "@/frontend/common/components/ui";
import { LessonReportStatus } from "@/frontend/common/graphql/generated/gql/graphql";
import type { LessonReportCardProps } from "@/frontend/common/views/dashboard/teachers/lesson-reports/types";
import type { TeacherLessonReportsViewModel } from "@/frontend/common/views/dashboard/teachers/lesson-reports/useTeacherLessonReportsViewModel";
import { formatLessonReportDate } from "@/frontend/common/views/dashboard/teachers/lesson-reports/utils";

type FilterLabels = TeacherLessonReportsViewModel["labelsBySection"]["filters"];

export interface TeacherLessonReportsSectionPanelSlotProps {
  readonly actions: ReactNode;
  readonly children: ReactNode;
}

export interface TeacherLessonReportsViewSharedSlots {
  readonly PageContainer: ComponentType<{ readonly children: ReactNode }>;
  readonly PageHeader: ComponentType<{ readonly title: string }>;
  readonly SectionPanel: ComponentType<TeacherLessonReportsSectionPanelSlotProps>;
}

export type TeacherLessonReportsViewSharedProps = Readonly<TeacherLessonReportsViewModel> & {
  readonly slots: TeacherLessonReportsViewSharedSlots;
  readonly children: ReactNode;
};

function LessonReportStatusFilter({
  statusFilter,
  statusOptions,
  filterLabels,
  onStatusFilterChange,
}: Readonly<{
  statusFilter: TeacherLessonReportsViewModel["statusFilter"];
  statusOptions: TeacherLessonReportsViewModel["statusOptions"];
  filterLabels: FilterLabels;
  onStatusFilterChange: TeacherLessonReportsViewModel["onStatusFilterChange"];
}>) {
  return (
    <FormControl size="small">
      <InputLabel id="lesson-report-status-filter-label">{filterLabels.status}</InputLabel>
      <Select
        labelId="lesson-report-status-filter-label"
        value={statusFilter}
        label={filterLabels.status}
        onChange={e => onStatusFilterChange(e.target.value)}
      >
        {statusOptions.map(option => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

export function TeacherLessonReportCardContent({
  row,
  labels,
  locale,
  resolveStatusLabel,
}: Readonly<LessonReportCardProps>) {
  return (
    <>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 1,
        }}
      >
        <Typography sx={{ typography: "titleLg", fontWeight: 600 }}>
          {formatLessonReportDate(row.lessonDate, locale) ?? labels.submittedAt}
        </Typography>
        {row.status ? (
          <StatusBadge category="classInstance" status={row.status} label={resolveStatusLabel(row.status)} />
        ) : null}
      </Box>
      <Stack direction="row" spacing={2} sx={{ flexWrap: "wrap", gap: 1, mt: 1 }}>
        {row.durationMinutes != null ? (
          <Typography sx={{ typography: "bodyMd", color: theme => theme.palette.text.secondary }}>
            {labels.durationMinutes}: {row.durationMinutes}
          </Typography>
        ) : null}
        {row.completionPercentage != null ? (
          <Typography sx={{ typography: "bodyMd", color: theme => theme.palette.text.secondary }}>
            {labels.completionPercentage}: {row.completionPercentage}%
          </Typography>
        ) : null}
        {row.submittedAt ? (
          <Typography sx={{ typography: "bodyMd", color: theme => theme.palette.text.secondary }}>
            {labels.submittedAt}: {new Date(row.submittedAt).toLocaleDateString(locale)}
          </Typography>
        ) : null}
      </Stack>
      {row.teacherNotes ? (
        <Typography sx={{ typography: "bodyMd", color: theme => theme.palette.text.secondary, mt: 1 }}>
          {labels.teacherNotes}: {row.teacherNotes}
        </Typography>
      ) : null}
      {row.status === LessonReportStatus.Rejected && row.rejectionReason ? (
        <Typography sx={{ typography: "bodyMd", color: theme => theme.palette.error.main, mt: 1 }}>
          {labels.rejectionReason}: {row.rejectionReason}
        </Typography>
      ) : null}
    </>
  );
}

export function TeacherLessonReportsViewShared({
  statusFilter,
  statusOptions,
  labelsBySection,
  onStatusFilterChange,
  slots,
  children,
}: TeacherLessonReportsViewSharedProps) {
  const { shell, filters } = labelsBySection;

  return (
    <slots.PageContainer>
      <slots.PageHeader title={shell.title} />
      <slots.SectionPanel
        actions={
          <LessonReportStatusFilter
            statusFilter={statusFilter}
            statusOptions={statusOptions}
            filterLabels={filters}
            onStatusFilterChange={onStatusFilterChange}
          />
        }
      >
        {children}
      </slots.SectionPanel>
    </slots.PageContainer>
  );
}
