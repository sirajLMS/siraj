"use client";

import { SearchOutlined } from "@mui/icons-material";
import { Box, InputAdornment, TextField } from "@mui/material";
import { StatusBadge } from "@/frontend/common/components/ui";
import { ScheduleFilters } from "@/frontend/common/views/dashboard/admin/home/components/ScheduleFilters";
import { ScheduleOverviewDataGrid } from "@/frontend/common/views/dashboard/admin/home/components/ScheduleOverviewDataGrid";
import type { AdminDashboardViewModel } from "@/frontend/common/views/dashboard/admin/home/useAdminDashboardViewModel";
import { DesktopPageContainer, DesktopPageHeader, DesktopSectionPanel } from "@/frontend/desktop/components/ui";
import { DesktopMetricCardGrid } from "@/frontend/desktop/components/ui/card/MetricCardGrid";
import { TeacherAutocompleteDesktop } from "@/frontend/desktop/components/ui/input/userSelect";

export function AdminDashboardDesktopView({
  t,
  loading,
  lastUpdated,
  metrics,
  onMetricClick,
  selectedMetricKey,
  selectedMetricLabel,
  searchValue,
  dateValue,
  selectedTeacher,
  rows,
  headers,
  statusLabels,
  page,
  totalCount,
  onPageChange,
  onSearchChange,
  onDateChange,
  onTeacherChange,
  pageSize,
  // NEW FOR PLAN v5: lifted permission booleans consumed by the tier view
  // instead of the previous `RequirePermission` wrappers.
  canDashboardSearch,
  canScheduleFilterAdvanced,
}: Readonly<AdminDashboardViewModel>) {
  return (
    <DesktopPageContainer>
      <DesktopPageHeader
        title={t.todayClasses}
        subtitle={lastUpdated}
        actions={
          <>
            <DesktopMetricCardGrid metrics={metrics} onMetricClick={onMetricClick} selectedKey={selectedMetricKey} />
            {canDashboardSearch ? (
              <TextField
                placeholder={t.searchPlaceholder}
                value={searchValue}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                  onSearchChange(event.target.value);
                }}
                size="small"
                sx={{ maxWidth: 280 }}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchOutlined fontSize="small" />
                      </InputAdornment>
                    ),
                  },
                }}
              />
            ) : null}
          </>
        }
      />

      <DesktopSectionPanel title={t.scheduleOverview}>
        {canScheduleFilterAdvanced ? (
          <Box sx={{ mb: 2.5 }}>
            <ScheduleFilters
              dateLabel={t.listOfClassesOn}
              dateValue={dateValue}
              todayLabel={t.today}
              previousDayLabel={t.previousDay}
              nextDayLabel={t.nextDay}
              onDateChange={onDateChange}
              teacherSelect={
                <TeacherAutocompleteDesktop
                  value={selectedTeacher}
                  onChange={onTeacherChange}
                  label={t.selectTeacher}
                />
              }
            />
          </Box>
        ) : null}
        {selectedMetricLabel ? (
          <Box sx={{ mb: 1 }}>
            <StatusBadge category="classStatus" status="confirmed" label={selectedMetricLabel} />
          </Box>
        ) : null}
        <ScheduleOverviewDataGrid
          rows={rows}
          page={page}
          pageSize={pageSize}
          totalCount={totalCount}
          onPageChange={onPageChange}
          headers={headers}
          statusLabels={statusLabels}
          detailsLabel={t.details}
          emptyMessage={t.noClasses}
          loading={loading}
        />
      </DesktopSectionPanel>
    </DesktopPageContainer>
  );
}
