"use client";

import { SearchOutlined } from "@mui/icons-material";
import { Box, InputAdornment, Paper, Stack, TextField, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { PaginationControls } from "@/frontend/common/components/ui";
import { ScheduleFilters } from "@/frontend/common/views/dashboard/admin/home/components/ScheduleFilters";
import {
  ScheduleOverviewCardSkeleton,
  ScheduleOverviewEmptyState,
} from "@/frontend/common/views/dashboard/admin/home/components/ScheduleOverviewCardList";
import type { ScheduleOverviewViewModel } from "@/frontend/common/views/dashboard/admin/home/scheduleOverview/useScheduleOverviewViewModel";
import { DesktopSectionPanel, DesktopStatusBadge } from "@/frontend/desktop/components/ui";
import { TeacherAutocompleteDesktop } from "@/frontend/desktop/components/ui/input/userSelect";
import { ScheduleOverviewDesktopCard } from "@/frontend/desktop/views/dashboard/admin/home/scheduleOverview/components/scheduleOverviewCard.desktop";

const StyledDesktopPanel = styled(Paper)(({ theme }) => ({
  borderRadius: Number(theme.shape.borderRadius) * 2,
  border: `1px solid ${theme.palette.border.light}`,
  overflow: "hidden",
}));

const StyledFilterContainer = styled(Box)(({ theme }) => ({
  paddingInline: theme.spacing(3),
  paddingBlock: theme.spacing(2.5),
  backgroundColor: theme.palette.background.default,
  borderBottom: `1px solid ${theme.palette.border.light}`,
}));

const StyledSearchIcon = styled(SearchOutlined)(({ theme }) => ({
  fontSize: 18,
  color: theme.palette.onSurfaceVariant,
}));

const StyledSectionTitle = styled(Typography)(({ theme }) => ({
  color: theme.palette.onSurface,
}));

function ScheduleOverviewTitle({
  title,
  selectedMetricLabel,
}: {
  readonly title: string;
  readonly selectedMetricLabel?: string | null;
}) {
  return (
    <>
      <StyledSectionTitle variant="titleLg">{title}</StyledSectionTitle>
      {selectedMetricLabel ? (
        <DesktopStatusBadge category="classStatus" status="confirmed" label={selectedMetricLabel} />
      ) : null}
    </>
  );
}

export function ScheduleOverviewDesktopView({
  title,
  selectedMetricLabel,
  searchPlaceholder,
  searchValue,
  rows,
  headers,
  statusLabels,
  detailsLabel,
  emptyMessage,
  page,
  pageSize,
  totalCount,
  onPageChange,
  onSearchChange,
  dateLabel,
  dateValue,
  todayLabel,
  previousDayLabel,
  nextDayLabel,
  teacherPlaceholder,
  selectedTeacher,
  onDateChange,
  onTeacherChange,
  loading,
  showTimezones,
  locale,
  canDashboardSearch,
  canScheduleFilterAdvanced,
}: Readonly<ScheduleOverviewViewModel>) {
  const pageCount = Math.max(1, Math.ceil((totalCount ?? 0) / pageSize));

  return (
    <StyledDesktopPanel elevation={0}>
      <DesktopSectionPanel
        title={<ScheduleOverviewTitle title={title} selectedMetricLabel={selectedMetricLabel} />}
        actions={
          canDashboardSearch ? (
            <TextField
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={event => {
                onSearchChange(event.target.value);
              }}
              size="small"
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <StyledSearchIcon />
                    </InputAdornment>
                  ),
                },
              }}
              sx={{
                maxWidth: { md: 280 },
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                },
              }}
            />
          ) : null
        }
      >
        {canScheduleFilterAdvanced ? (
          <StyledFilterContainer>
            <ScheduleFilters
              dateLabel={dateLabel}
              dateValue={dateValue}
              todayLabel={todayLabel}
              previousDayLabel={previousDayLabel}
              nextDayLabel={nextDayLabel}
              onDateChange={onDateChange}
              teacherSelect={
                <TeacherAutocompleteDesktop
                  value={selectedTeacher}
                  onChange={onTeacherChange}
                  label={teacherPlaceholder}
                />
              }
            />
          </StyledFilterContainer>
        ) : null}

        {loading && rows.length === 0 ? (
          <Stack spacing={2} sx={{ p: 2 }}>
            <Paper
              elevation={0}
              sx={theme => ({
                borderRadius: 2,
                border: `1px solid ${theme.palette.border.light}`,
                backgroundColor: theme.palette.surfaceContainerLowest,
              })}
            >
              <ScheduleOverviewCardSkeleton />
            </Paper>
          </Stack>
        ) : rows.length === 0 ? (
          <Box sx={{ p: 2 }}>
            <ScheduleOverviewEmptyState message={emptyMessage} />
          </Box>
        ) : (
          <Stack spacing={2} sx={{ p: 2 }}>
            {rows.map(row => (
              <ScheduleOverviewDesktopCard
                key={row.id ?? ""}
                row={row}
                headers={headers}
                statusLabels={statusLabels}
                detailsLabel={detailsLabel}
                showTimezones={showTimezones}
                locale={locale}
              />
            ))}
          </Stack>
        )}

        {totalCount !== undefined ? (
          <Box sx={{ p: 2, pt: 1, display: "flex", justifyContent: "flex-end" }}>
            <PaginationControls
              page={page}
              pageCount={pageCount}
              rowCount={totalCount}
              pageSize={pageSize}
              onPageChange={onPageChange}
            />
          </Box>
        ) : null}
      </DesktopSectionPanel>
    </StyledDesktopPanel>
  );
}
