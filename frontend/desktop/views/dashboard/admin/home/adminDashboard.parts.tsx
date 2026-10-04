import { SearchBarField } from "@/frontend/common/components/ui/input/searchBarField";
import { ScheduleFilters } from "@/frontend/common/views/dashboard/admin/home/components/ScheduleFilters";
import { ScheduleOverviewDataGrid } from "@/frontend/common/views/dashboard/admin/home/components/ScheduleOverviewDataGrid";
import type { AdminDashboardLabelsBySection } from "@/frontend/common/views/dashboard/admin/home/types/adminDashboard.types";
import type { AdminDashboardViewModel } from "@/frontend/common/views/dashboard/admin/home/useAdminDashboardViewModel";
import { DesktopMetricCardGrid } from "@/frontend/desktop/components/ui/card/MetricCardGrid";
import { TeacherAutocompleteDesktop } from "@/frontend/desktop/components/ui/input/userSelect";

type AdminDashboardHeaderActionsProps = Pick<
  AdminDashboardViewModel,
  "metrics" | "onMetricClick" | "selectedMetricKey" | "canDashboardSearch" | "searchValue" | "onSearchChange"
> & {
  readonly searchPlaceholder: string;
};

export function AdminDashboardHeaderActions({
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

export function AdminDashboardScheduleFilters({
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

export function AdminDashboardScheduleOverview({
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
