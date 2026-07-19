"use client";

import { Box, FormControl, InputLabel, MenuItem, Select, Stack, Typography } from "@mui/material";
import { StatusBadge } from "@/frontend/common/components/ui";
import { LessonReportStatus } from "@/frontend/common/graphql/generated/gql/graphql-types";
import type { LessonReportCardProps } from "@/frontend/common/views/dashboard/teachers/lesson-reports/types";
import type { TeacherLessonReportsViewModel } from "@/frontend/common/views/dashboard/teachers/lesson-reports/useTeacherLessonReportsViewModel";
import {
  MobileCardList,
  MobileCardListItem,
  MobileContentStack,
  MobilePageContainer,
  MobilePageHeader,
} from "@/frontend/mobile/components/ui";

export function TeacherLessonReportsMobileView({
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
    <MobilePageContainer>
      <MobilePageHeader title={title} />

      <MobileContentStack gap={2}>
        <FormControl size="small" sx={{ minWidth: 220, maxWidth: { sm: 280 } }}>
          <InputLabel id="lesson-report-status-filter-label">{labels.filterAll}</InputLabel>
          <Select
            labelId="lesson-report-status-filter-label"
            value={statusFilter}
            label={labels.filterAll}
            onChange={e => onStatusFilterChange(e.target.value as typeof statusFilter)}
          >
            {statusOptions.map(option => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {error ? <Typography sx={{ color: theme => theme.palette.error.main }}>{noReportsMessage}</Typography> : null}

        {!error ? (
          <MobileCardList
            rows={rows}
            loading={loading}
            emptyMessage={noReportsMessage}
            getKey={(row, index) => row.id ?? row.classInstanceId ?? `row-${index}`}
            paginationOptions={{ mode: "client" }}
            layout="edge-to-edge"
            renderItem={row => (
              <LessonReportCardMobile
                row={row}
                labels={labels}
                locale={locale}
                resolveStatusLabel={resolveStatusLabel}
              />
            )}
          />
        ) : null}
      </MobileContentStack>
    </MobilePageContainer>
  );
}

function LessonReportCardMobile({ row, labels, locale, resolveStatusLabel }: Readonly<LessonReportCardProps>) {
  return (
    <MobileCardListItem variant="edge-to-edge">
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
      <Stack direction="row" spacing={2} sx={{ flexWrap: "wrap", gap: 1, mt: 1 }}>
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
        <Typography sx={{ typography: "bodyMd", color: theme => theme.palette.text.secondary, mt: 1 }}>
          {labels.teacherNotes}: {row.teacherNotes}
        </Typography>
      ) : null}
      {row.status === LessonReportStatus.Rejected && row.rejectionReason ? (
        <Typography sx={{ typography: "bodySm", color: theme => theme.palette.error.main, mt: 1 }}>
          {labels.rejectionReason}: {row.rejectionReason}
        </Typography>
      ) : null}
    </MobileCardListItem>
  );
}
