"use client";

import { Box, CircularProgress, FormControl, InputLabel, MenuItem, Select, Stack, Typography } from "@mui/material";
import { StatusBadge } from "@/frontend/common/components/ui";
import { LessonReportStatus } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { LessonReportCardProps } from "@/frontend/common/views/dashboard/teachers/lesson-reports/types";
import type { TeacherLessonReportsViewModel } from "@/frontend/common/views/dashboard/teachers/lesson-reports/useTeacherLessonReportsViewModel";
import { DesktopPageContainer, DesktopPageHeader } from "@/frontend/desktop/components/ui/container/page";

export function TeacherLessonReportsDesktopView({
  title,
  rows,
  loading,
  error,
  noReportsMessage,
  statusFilter,
  statusOptions,
  labels,
  locale,
  onStatusFilterChange,
  resolveStatusLabel,
}: Readonly<TeacherLessonReportsViewModel>) {
  return (
    <DesktopPageContainer>
      <DesktopPageHeader title={title} />
      <Stack spacing={2}>
        <FormControl size="small" sx={{ minWidth: 220, maxWidth: { sm: 280 } }}>
          <InputLabel id="lesson-report-status-filter-label">{labels.filterAll}</InputLabel>
          <Select
            labelId="lesson-report-status-filter-label"
            value={statusFilter}
            label={labels.filterAll}
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

        {error ? <Typography sx={{ color: theme => theme.palette.error.main }}>{noReportsMessage}</Typography> : null}

        {!loading && !error && rows.length === 0 ? (
          <Typography sx={{ color: theme => theme.palette.text.secondary }}>{noReportsMessage}</Typography>
        ) : null}

        {!loading && !error && rows.length > 0 ? (
          <Stack spacing={1}>
            {rows.map((row, index) => (
              <LessonReportCardDesktop
                key={row.id ?? row.classInstanceId ?? `row-${index}`}
                row={row}
                labels={labels}
                locale={locale}
                resolveStatusLabel={resolveStatusLabel}
              />
            ))}
          </Stack>
        ) : null}
      </Stack>
    </DesktopPageContainer>
  );
}

function LessonReportCardDesktop({ row, labels, locale, resolveStatusLabel }: Readonly<LessonReportCardProps>) {
  return (
    <Box
      sx={theme => ({
        p: 2,
        borderRadius: 1,
        border: `1px solid ${theme.palette.border.light}`,
        display: "flex",
        flexDirection: "column",
        gap: 1,
      })}
    >
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
      <Stack direction="row" spacing={2} sx={{ flexWrap: "wrap", gap: 1 }}>
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
        <Typography sx={{ typography: "bodyMd", color: theme => theme.palette.text.secondary }}>
          {labels.teacherNotes}: {row.teacherNotes}
        </Typography>
      ) : null}
      {row.status === LessonReportStatus.Rejected && row.rejectionReason ? (
        <Typography sx={{ typography: "bodySm", color: theme => theme.palette.error.main }}>
          {labels.rejectionReason}: {row.rejectionReason}
        </Typography>
      ) : null}
    </Box>
  );
}
