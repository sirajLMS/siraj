"use client";

import { SearchOutlined } from "@mui/icons-material";
import { Box, InputAdornment, Paper, TextField, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { ScheduleFilters } from "@/frontend/common/views/dashboard/admin/home/components/ScheduleFilters";
import { ScheduleOverviewDataGrid } from "@/frontend/common/views/dashboard/admin/home/components/ScheduleOverviewDataGrid";
import type { ScheduleOverviewViewModel } from "@/frontend/common/views/dashboard/admin/home/scheduleOverview/useScheduleOverviewViewModel";
import { DesktopSectionPanel, DesktopStatusBadge } from "@/frontend/desktop/components/ui";

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
  teacherValue,
  submitLabel,
  teachers,
  onDateChange,
  onTeacherChange,
  onSubmit,
  loading,
  // NEW FOR PLAN v5: lifted permission booleans consumed by the tier view
  // instead of the previous `RequirePermission` wrappers.
  canDashboardSearch,
  canScheduleFilterAdvanced,
}: Readonly<ScheduleOverviewViewModel>) {
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
              teacherPlaceholder={teacherPlaceholder}
              teacherValue={teacherValue}
              submitLabel={submitLabel}
              teachers={teachers}
              onDateChange={onDateChange}
              onTeacherChange={onTeacherChange}
              onSubmit={onSubmit}
            />
          </StyledFilterContainer>
        ) : null}

        <ScheduleOverviewDataGrid
          rows={rows}
          page={page}
          pageSize={pageSize}
          totalCount={totalCount}
          onPageChange={onPageChange}
          headers={headers}
          statusLabels={statusLabels}
          detailsLabel={detailsLabel}
          emptyMessage={emptyMessage}
          loading={loading}
        />
      </DesktopSectionPanel>
    </StyledDesktopPanel>
  );
}
