"use client";

import { Box } from "@mui/material";
import { FilterChip } from "@/frontend/common/components/ui";
import { scheduleOverviewFilterBarSx } from "@/frontend/common/views/dashboard/admin/home/components/scheduleOverviewSurfaces";
import type { AdminDashboardViewModel } from "@/frontend/common/views/dashboard/admin/home/useAdminDashboardViewModel";
import { DesktopPageContainer, DesktopPageHeader, DesktopSectionPanel } from "@/frontend/desktop/components/ui";
import { desktopSectionContentInsetSx } from "@/frontend/desktop/components/ui/container/desktopSectionContentInsetSx";
import {
  AdminDashboardHeaderActions,
  AdminDashboardScheduleFilters,
  AdminDashboardScheduleOverview,
} from "@/frontend/desktop/views/dashboard/admin/home/adminDashboard.parts";

export function AdminDashboardDesktopView({
  labelsBySection,
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
  page,
  totalCount,
  onPageChange,
  onSearchChange,
  onDateChange,
  onTeacherChange,
  pageSize,
  canDashboardSearch,
  canScheduleFilterAdvanced,
  canScheduleViewTimezones,
}: Readonly<AdminDashboardViewModel>) {
  const { shell, filters } = labelsBySection;
  const onClearMetricFilter = selectedMetricKey ? () => onMetricClick(selectedMetricKey) : undefined;

  return (
    <DesktopPageContainer>
      <DesktopPageHeader
        title={shell.todayClasses}
        subtitle={lastUpdated}
        actions={
          <AdminDashboardHeaderActions
            metrics={metrics}
            onMetricClick={onMetricClick}
            selectedMetricKey={selectedMetricKey}
            canDashboardSearch={canDashboardSearch}
            searchValue={searchValue}
            onSearchChange={onSearchChange}
            searchPlaceholder={shell.searchPlaceholder}
          />
        }
      />

      <DesktopSectionPanel
        title={shell.scheduleOverview}
        contentPadding={false}
        sx={theme => ({
          backgroundColor: theme.palette.surfaceContainerLow,
          border: `1px solid ${theme.palette.outlineVariant}`,
        })}
      >
        {canScheduleFilterAdvanced ? (
          <Box
            sx={theme => ({
              ...scheduleOverviewFilterBarSx(theme),
              ...desktopSectionContentInsetSx,
              width: "100%",
            })}
          >
            <AdminDashboardScheduleFilters
              filters={filters}
              dateValue={dateValue}
              onDateChange={onDateChange}
              selectedTeacher={selectedTeacher}
              onTeacherChange={onTeacherChange}
            />
          </Box>
        ) : null}
        {selectedMetricLabel ? (
          <Box sx={{ ...desktopSectionContentInsetSx, py: 0, mb: 1 }}>
            <FilterChip label={selectedMetricLabel} onClear={onClearMetricFilter} />
          </Box>
        ) : null}

        <AdminDashboardScheduleOverview
          rows={rows}
          labelsBySection={labelsBySection}
          loading={loading}
          showTimezones={canScheduleViewTimezones}
          page={page}
          totalCount={totalCount}
          pageSize={pageSize}
          onPageChange={onPageChange}
        />
      </DesktopSectionPanel>
    </DesktopPageContainer>
  );
}
