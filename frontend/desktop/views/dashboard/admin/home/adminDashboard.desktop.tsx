"use client";

import { SearchOutlined } from "@mui/icons-material";
import { Box, InputAdornment, TextField } from "@mui/material";
import { PaginationControls, StatusBadge } from "@/frontend/common/components/ui";
import { ScheduleFilters } from "@/frontend/common/views/dashboard/admin/home/components/ScheduleFilters";
import { ScheduleOverviewEmptyState } from "@/frontend/common/views/dashboard/admin/home/components/ScheduleOverviewCardList";
import { ScheduleOverviewListShell } from "@/frontend/common/views/dashboard/admin/home/components/ScheduleOverviewListShell";
import type { AdminDashboardViewModel } from "@/frontend/common/views/dashboard/admin/home/useAdminDashboardViewModel";
import { DesktopPageContainer, DesktopPageHeader, DesktopSectionPanel } from "@/frontend/desktop/components/ui";
import { DesktopMetricCardGrid } from "@/frontend/desktop/components/ui/card/MetricCardGrid";
import { TeacherAutocompleteDesktop } from "@/frontend/desktop/components/ui/input/userSelect";
import { ScheduleOverviewDesktopCard } from "@/frontend/desktop/views/dashboard/admin/home/scheduleOverview/components/scheduleOverviewCard.desktop";
import { useAppLocale } from "@/shared/locale";

type AdminDashboardHeaderActionsProps = Pick<
  AdminDashboardViewModel,
  "metrics" | "onMetricClick" | "selectedMetricKey" | "canDashboardSearch" | "searchValue" | "onSearchChange"
> & {
  searchPlaceholder: string;
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
        <TextField
          placeholder={searchPlaceholder}
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
  );
}

type AdminDashboardScheduleFiltersProps = Pick<
  AdminDashboardViewModel,
  "dateValue" | "onDateChange" | "selectedTeacher" | "onTeacherChange"
> & {
  dateLabel: string;
  todayLabel: string;
  previousDayLabel: string;
  nextDayLabel: string;
  selectTeacherLabel: string;
};

function AdminDashboardScheduleFilters({
  dateLabel,
  dateValue,
  todayLabel,
  previousDayLabel,
  nextDayLabel,
  onDateChange,
  selectedTeacher,
  onTeacherChange,
  selectTeacherLabel,
}: Readonly<AdminDashboardScheduleFiltersProps>) {
  return (
    <Box sx={{ mb: 2.5 }}>
      <ScheduleFilters
        dateLabel={dateLabel}
        dateValue={dateValue}
        todayLabel={todayLabel}
        previousDayLabel={previousDayLabel}
        nextDayLabel={nextDayLabel}
        onDateChange={onDateChange}
        teacherSelect={
          <TeacherAutocompleteDesktop value={selectedTeacher} onChange={onTeacherChange} label={selectTeacherLabel} />
        }
      />
    </Box>
  );
}

type AdminDashboardScheduleOverviewProps = Pick<
  AdminDashboardViewModel,
  "rows" | "headers" | "statusLabels" | "loading" | "page" | "totalCount" | "pageSize" | "onPageChange"
> & {
  noClassesMessage: string;
  detailsLabel: string;
  showTimezones: boolean;
  locale: ReturnType<typeof useAppLocale>;
  pageCount: number;
};

function AdminDashboardScheduleOverview({
  rows,
  headers,
  statusLabels,
  loading,
  noClassesMessage,
  detailsLabel,
  showTimezones,
  locale,
  page,
  totalCount,
  pageSize,
  pageCount,
  onPageChange,
}: Readonly<AdminDashboardScheduleOverviewProps>) {
  return (
    <>
      <ScheduleOverviewListShell
        rows={rows}
        getKey={row => row.id ?? ""}
        loading={loading}
        emptyMessage={noClassesMessage}
        renderItem={row => (
          <ScheduleOverviewDesktopCard
            row={row}
            headers={headers}
            statusLabels={statusLabels}
            detailsLabel={detailsLabel}
            showTimezones={showTimezones}
            locale={locale}
          />
        )}
        renderEmptyState={() => (
          <Box sx={{ py: 2 }}>
            <ScheduleOverviewEmptyState message={noClassesMessage} />
          </Box>
        )}
      />

      {totalCount !== undefined ? (
        <Box sx={{ pt: 2, display: "flex", justifyContent: "flex-end" }}>
          <PaginationControls
            page={page}
            pageCount={pageCount}
            rowCount={totalCount}
            pageSize={pageSize}
            onPageChange={onPageChange}
          />
        </Box>
      ) : null}
    </>
  );
}

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
  canDashboardSearch,
  canScheduleFilterAdvanced,
  canScheduleViewTimezones,
}: Readonly<AdminDashboardViewModel>) {
  const locale = useAppLocale();
  const showTimezones = canScheduleViewTimezones;
  const pageCount = Math.max(1, Math.ceil((totalCount ?? 0) / pageSize));

  return (
    <DesktopPageContainer>
      <DesktopPageHeader
        title={t.todayClasses}
        subtitle={lastUpdated}
        actions={
          <AdminDashboardHeaderActions
            metrics={metrics}
            onMetricClick={onMetricClick}
            selectedMetricKey={selectedMetricKey}
            canDashboardSearch={canDashboardSearch}
            searchValue={searchValue}
            onSearchChange={onSearchChange}
            searchPlaceholder={t.searchPlaceholder}
          />
        }
      />

      <DesktopSectionPanel title={t.scheduleOverview}>
        {canScheduleFilterAdvanced ? (
          <AdminDashboardScheduleFilters
            dateLabel={t.listOfClassesOn}
            dateValue={dateValue}
            todayLabel={t.today}
            previousDayLabel={t.previousDay}
            nextDayLabel={t.nextDay}
            onDateChange={onDateChange}
            selectedTeacher={selectedTeacher}
            onTeacherChange={onTeacherChange}
            selectTeacherLabel={t.selectTeacher}
          />
        ) : null}
        {selectedMetricLabel ? (
          <Box sx={{ mb: 1 }}>
            <StatusBadge category="classStatus" status="confirmed" label={selectedMetricLabel} />
          </Box>
        ) : null}

        <AdminDashboardScheduleOverview
          rows={rows}
          headers={headers}
          statusLabels={statusLabels}
          loading={loading}
          noClassesMessage={t.noClasses}
          detailsLabel={t.details}
          showTimezones={showTimezones}
          locale={locale}
          page={page}
          totalCount={totalCount}
          pageSize={pageSize}
          pageCount={pageCount}
          onPageChange={onPageChange}
        />
      </DesktopSectionPanel>
    </DesktopPageContainer>
  );
}
