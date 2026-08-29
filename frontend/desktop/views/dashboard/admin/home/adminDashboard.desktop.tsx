"use client";

import { Box } from "@mui/material";
import { FilterChip } from "@/frontend/common/components/ui";
import { SearchBarField } from "@/frontend/common/components/ui/input/searchBarField";
import { ScheduleFilters } from "@/frontend/common/views/dashboard/admin/home/components/ScheduleFilters";
import { ScheduleOverviewDataGrid } from "@/frontend/common/views/dashboard/admin/home/components/ScheduleOverviewDataGrid";
import { scheduleOverviewFilterBarSx } from "@/frontend/common/views/dashboard/admin/home/components/scheduleOverviewSurfaces";
import type { AdminDashboardLabelsBySection } from "@/frontend/common/views/dashboard/admin/home/types/adminDashboard.types";
import type { AdminDashboardViewModel } from "@/frontend/common/views/dashboard/admin/home/useAdminDashboardViewModel";
import { DesktopPageContainer, DesktopPageHeader, DesktopSectionPanel } from "@/frontend/desktop/components/ui";
import { DesktopMetricCardGrid } from "@/frontend/desktop/components/ui/card/MetricCardGrid";
import { desktopSectionContentInsetSx } from "@/frontend/desktop/components/ui/container/desktopSectionContentInsetSx";
import { TeacherAutocompleteDesktop } from "@/frontend/desktop/components/ui/input/userSelect";

type AdminDashboardHeaderActionsProps = Pick<
  AdminDashboardViewModel,
  "metrics" | "onMetricClick" | "selectedMetricKey" | "canDashboardSearch" | "searchValue" | "onSearchChange"
> & {
  readonly searchPlaceholder: string;
};

function AdminDashboardHeaderActions({
  metrics,
  onMetricClick,
  selectedMetricKey,
  canDashboardSearch,
  searchValue,
  onSearchChange,
  searchPlaceholder,
}: Readonly<AdminDashboardHeaderActionsProps>) {
  return (
    <>
      <DesktopMetricCardGrid metrics={metrics} onMetricClick={onMetricClick} selectedKey={selectedMetricKey} />
      {canDashboardSearch ? (
        <SearchBarField
          value={searchValue}
          placeholder={searchPlaceholder}
          onChange={onSearchChange}
          sx={{ maxWidth: 280 }}
        />
      ) : null}
    </>
  );
}

type AdminDashboardScheduleFiltersProps = Pick<
  AdminDashboardViewModel,
  "dateValue" | "onDateChange" | "selectedTeacher" | "onTeacherChange"
> & {
  readonly filters: AdminDashboardLabelsBySection["filters"];
};

function AdminDashboardScheduleFilters({
  filters,
  dateValue,
  onDateChange,
  selectedTeacher,
  onTeacherChange,
}: Readonly<AdminDashboardScheduleFiltersProps>) {
  return (
    <ScheduleFilters
      centerOnDesktop
      dateLabel={filters.listOfClassesOn}
      dateValue={dateValue}
      todayLabel={filters.today}
      previousDayLabel={filters.previousDay}
      nextDayLabel={filters.nextDay}
      onDateChange={onDateChange}
      teacherSelect={
        <TeacherAutocompleteDesktop value={selectedTeacher} onChange={onTeacherChange} label={filters.selectTeacher} />
      }
    />
  );
}

type AdminDashboardScheduleOverviewProps = Pick<
  AdminDashboardViewModel,
  "rows" | "loading" | "page" | "totalCount" | "pageSize" | "onPageChange"
> & {
  readonly labelsBySection: AdminDashboardLabelsBySection;
  readonly showTimezones: boolean;
};

function AdminDashboardScheduleOverview({
  rows,
  labelsBySection,
  loading,
  showTimezones,
  page,
  totalCount,
  pageSize,
  onPageChange,
}: Readonly<AdminDashboardScheduleOverviewProps>) {
  const { shell, columns, status } = labelsBySection;

  return (
    <ScheduleOverviewDataGrid
      rows={rows}
      page={page}
      pageSize={pageSize}
      totalCount={totalCount}
      onPageChange={onPageChange}
      headers={columns}
      statusLabels={status}
      detailsLabel={shell.details}
      emptyMessage={shell.noClasses}
      loading={loading}
      showTimezones={showTimezones}
    />
  );
}

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
