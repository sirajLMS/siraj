"use client";

import { SearchOutlined } from "@mui/icons-material";
import { Box, InputAdornment, TextField } from "@mui/material";
import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { MetricCardGrid } from "@/frontend/common/components/reports/MetricCardGrid";
import { StatusBadge } from "@/frontend/common/components/ui";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { ScheduleFilters } from "@/frontend/common/views/dashboard/admin/home/components/ScheduleFilters";
import { ScheduleOverviewDataGrid } from "@/frontend/common/views/dashboard/admin/home/components/ScheduleOverviewDataGrid";
import type { AdminDashboardViewModel } from "@/frontend/common/views/dashboard/admin/home/useAdminDashboardViewModel";
import { DesktopPageContainer, DesktopPageHeader, DesktopSectionPanel } from "@/frontend/desktop/components/ui";

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
  teacherValue,
  teachers,
  rows,
  headers,
  statusLabels,
  page,
  totalCount,
  onPageChange,
  onSearchChange,
  onDateChange,
  onTeacherChange,
  onSubmit,
  pageSize,
}: Readonly<AdminDashboardViewModel>) {
  return (
    <DesktopPageContainer>
      <DesktopPageHeader
        title={t.todayClasses}
        subtitle={lastUpdated}
        actions={
          <>
            <MetricCardGrid metrics={metrics} onMetricClick={onMetricClick} selectedKey={selectedMetricKey} />
            <RequirePermission permissions={[AppPermission.DashboardSearch]}>
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
            </RequirePermission>
          </>
        }
      />

      <DesktopSectionPanel
        title={t.scheduleOverview}
        actions={
          <RequirePermission permissions={[AppPermission.ScheduleFilterAdvanced]}>
            <ScheduleFilters
              dateLabel={t.listOfClassesOn}
              dateValue={dateValue}
              todayLabel={t.today}
              previousDayLabel={t.previousDay}
              nextDayLabel={t.nextDay}
              teacherPlaceholder={t.selectTeacher}
              teacherValue={teacherValue}
              submitLabel={t.submit}
              teachers={teachers}
              onDateChange={onDateChange}
              onTeacherChange={onTeacherChange}
              onSubmit={onSubmit}
            />
          </RequirePermission>
        }
      >
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
