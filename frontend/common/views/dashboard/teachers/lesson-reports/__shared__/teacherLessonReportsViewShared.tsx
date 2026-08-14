"use client";

import { Box, CircularProgress, FormControl, InputLabel, MenuItem, Select, Stack, Typography } from "@mui/material";
import type { ComponentType, ReactNode } from "react";
import { StatusBadge } from "@/frontend/common/components/ui";
import { LessonReportStatus } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { TeacherLessonReportsViewModel } from "@/frontend/common/views/dashboard/teachers/lesson-reports/useTeacherLessonReportsViewModel";

type LessonReportRow = TeacherLessonReportsViewModel["rows"][number];
type CardLabels = TeacherLessonReportsViewModel["labelsBySection"]["cards"];
type Locale = TeacherLessonReportsViewModel["locale"];
type ResolveStatusLabel = TeacherLessonReportsViewModel["resolveStatusLabel"];

export interface TeacherLessonReportsViewSharedSlots {
  readonly PageContainer: ComponentType<{ readonly children: ReactNode }>;
  readonly PageHeader: ComponentType<{ readonly title: string }>;
  readonly ContentWrapper: ComponentType<{ readonly children: ReactNode }>;
  readonly CardWrapper: ComponentType<{ readonly children: ReactNode }>;
}

export interface TeacherLessonReportsViewSharedOptions {
  readonly cardMarginTop: number;
}

export type TeacherLessonReportsViewSharedProps = Readonly<TeacherLessonReportsViewModel> & {
  readonly slots: TeacherLessonReportsViewSharedSlots;
  readonly options: TeacherLessonReportsViewSharedOptions;
};

function LessonReportCardContent({
  row,
  labels,
  locale,
  resolveStatusLabel,
  cardMarginTop,
}: Readonly<{
  row: LessonReportRow;
  labels: CardLabels;
  locale: Locale;
  resolveStatusLabel: ResolveStatusLabel;
  cardMarginTop: number;
}>) {
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
          {row.lessonDate
            ? new Date(row.lessonDate).toLocaleDateString(locale, {
                weekday: "short",
                month: "short",
                day: "numeric",
              })
            : labels.submittedAt}
        </Typography>
        {row.status ? (
          <StatusBadge category="classInstance" status={row.status} label={resolveStatusLabel(row.status)} />
        ) : null}
      </Box>
      <Stack direction="row" spacing={2} sx={{ flexWrap: "wrap", gap: 1, mt: cardMarginTop }}>
        {row.durationMinutes != null ? (
          <Typography sx={{ typography: "bodySm", color: theme => theme.palette.text.secondary }}>
            {labels.durationMinutes}: {row.durationMinutes}
          </Typography>
        ) : null}
        {row.completionPercentage != null ? (
          <Typography sx={{ typography: "bodySm", color: theme => theme.palette.text.secondary }}>
            {labels.completionPercentage}: {row.completionPercentage}%
          </Typography>
        ) : null}
        {row.submittedAt ? (
          <Typography sx={{ typography: "bodySm", color: theme => theme.palette.text.secondary }}>
            {labels.submittedAt}: {new Date(row.submittedAt).toLocaleDateString(locale)}
          </Typography>
        ) : null}
      </Stack>
      {row.teacherNotes ? (
        <Typography sx={{ typography: "bodyMd", color: theme => theme.palette.text.secondary, mt: cardMarginTop }}>
          {labels.teacherNotes}: {row.teacherNotes}
        </Typography>
      ) : null}
      {row.status === LessonReportStatus.Rejected && row.rejectionReason ? (
        <Typography sx={{ typography: "bodySm", color: theme => theme.palette.error.main, mt: cardMarginTop }}>
          {labels.rejectionReason}: {row.rejectionReason}
        </Typography>
      ) : null}
    </>
  );
}

function LessonReportCard({
  row,
  labels,
  locale,
  resolveStatusLabel,
  slots,
  options,
}: Readonly<{
  row: LessonReportRow;
  labels: CardLabels;
  locale: Locale;
  resolveStatusLabel: ResolveStatusLabel;
  slots: TeacherLessonReportsViewSharedSlots;
  options: TeacherLessonReportsViewSharedOptions;
}>) {
  return (
    <slots.CardWrapper>
      <LessonReportCardContent
        row={row}
        labels={labels}
        locale={locale}
        resolveStatusLabel={resolveStatusLabel}
        cardMarginTop={options.cardMarginTop}
      />
    </slots.CardWrapper>
  );
}

export function TeacherLessonReportsViewShared({
  rows,
  loading,
  error,
  statusFilter,
  statusOptions,
  labelsBySection,
  locale,
  onStatusFilterChange,
  resolveStatusLabel,
  slots,
  options,
}: TeacherLessonReportsViewSharedProps) {
  const { shell, filters, cards: labels } = labelsBySection;

  return (
    <slots.PageContainer>
      <slots.PageHeader title={shell.title} />
      <slots.ContentWrapper>
        <FormControl size="small" sx={{ minWidth: 220, maxWidth: { sm: 280 } }}>
          <InputLabel id="lesson-report-status-filter-label">{filters.filterAll}</InputLabel>
          <Select
            labelId="lesson-report-status-filter-label"
            value={statusFilter}
            label={filters.filterAll}
            onChange={e => onStatusFilterChange(e.target.value)}
          >
            {statusOptions.map(option => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress />
          </Box>
        ) : null}

        {error ? <Typography sx={{ color: theme => theme.palette.error.main }}>{shell.emptyMessage}</Typography> : null}

        {!loading && !error && rows.length === 0 ? (
          <Typography sx={{ color: theme => theme.palette.text.secondary }}>{shell.emptyMessage}</Typography>
        ) : null}

        {!loading && !error && rows.length > 0 ? (
          <Stack spacing={1}>
            {rows.map((row, index) => (
              <LessonReportCard
                key={row.id ?? row.classInstanceId ?? `row-${index}`}
                row={row}
                labels={labels}
                locale={locale}
                resolveStatusLabel={resolveStatusLabel}
                slots={slots}
                options={options}
              />
            ))}
          </Stack>
        ) : null}
      </slots.ContentWrapper>
    </slots.PageContainer>
  );
}
