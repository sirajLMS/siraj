"use client";

import { SearchOutlined } from "@mui/icons-material";
import { Box, InputAdornment, Paper, TextField, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import { SectionPanel, StatusBadge } from "@/frontend/components/ui";
import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import { ScheduleFilters } from "@/frontend/views/dashboard/admin/home/components/ScheduleFilters";
import { ScheduleOverviewDataGrid } from "@/frontend/views/dashboard/admin/home/components/ScheduleOverviewDataGrid";
import type { ScheduleOverviewViewModel } from "@/frontend/views/dashboard/admin/home/scheduleOverview/useScheduleOverviewViewModel";

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
        <StatusBadge category="classStatus" status="confirmed" label={selectedMetricLabel} />
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
}: Readonly<ScheduleOverviewViewModel>) {
  return (
    <StyledDesktopPanel elevation={0}>
      <SectionPanel
        title={<ScheduleOverviewTitle title={title} selectedMetricLabel={selectedMetricLabel} />}
        actions={
          <RequirePermission permissions={[AppPermission.DashboardSearch]}>
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
          </RequirePermission>
        }
      >
        <StyledFilterContainer>
          <RequirePermission permissions={[AppPermission.ScheduleFilterAdvanced]}>
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
          </RequirePermission>
        </StyledFilterContainer>

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
      </SectionPanel>
    </StyledDesktopPanel>
  );
}
