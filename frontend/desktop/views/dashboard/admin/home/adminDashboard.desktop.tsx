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

        <ScheduleOverviewListShell
          rows={rows}
          getKey={row => row.id ?? ""}
          loading={loading}
          emptyMessage={t.noClasses}
          renderItem={row => (
            <ScheduleOverviewDesktopCard
              row={row}
              headers={headers}
              statusLabels={statusLabels}
              detailsLabel={t.details}
              showTimezones={showTimezones}
              locale={locale}
            />
          )}
          renderEmptyState={() => (
            <Box sx={{ py: 2 }}>
              <ScheduleOverviewEmptyState message={t.noClasses} />
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
      </DesktopSectionPanel>
    </DesktopPageContainer>
  );
}
