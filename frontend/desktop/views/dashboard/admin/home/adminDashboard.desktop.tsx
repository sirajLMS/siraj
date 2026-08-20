"use client";

import { SearchOutlined } from "@mui/icons-material";
import { Box, Chip, InputAdornment, TextField } from "@mui/material";
import { PaginationControls } from "@/frontend/common/components/ui";
import { ScheduleFilters } from "@/frontend/common/views/dashboard/admin/home/components/ScheduleFilters";
import { ScheduleOverviewEmptyState } from "@/frontend/common/views/dashboard/admin/home/components/ScheduleOverviewCardList";
import { ScheduleOverviewListShell } from "@/frontend/common/views/dashboard/admin/home/components/ScheduleOverviewListShell";
import {
  scheduleOverviewFilterBarSx,
  scheduleOverviewListCanvasSx,
} from "@/frontend/common/views/dashboard/admin/home/components/scheduleOverviewSurfaces";
import type { AdminDashboardLabelsBySection } from "@/frontend/common/views/dashboard/admin/home/types/adminDashboard.types";
import type { AdminDashboardViewModel } from "@/frontend/common/views/dashboard/admin/home/useAdminDashboardViewModel";
import { DesktopPageContainer, DesktopPageHeader, DesktopSectionPanel } from "@/frontend/desktop/components/ui";
import { DesktopMetricCardGrid } from "@/frontend/desktop/components/ui/card/MetricCardGrid";
import { desktopSectionContentInsetSx } from "@/frontend/desktop/components/ui/container/desktopSectionContentInsetSx";
import { TeacherAutocompleteDesktop } from "@/frontend/desktop/components/ui/input/userSelect";
import { ScheduleOverviewDesktopCard } from "@/frontend/desktop/views/dashboard/admin/home/scheduleOverview/components/scheduleOverviewCard.desktop";
import { useAppLocale } from "@/shared/locale";

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
  readonly locale: ReturnType<typeof useAppLocale>;
  readonly pageCount: number;
};

function AdminDashboardScheduleOverview({
  rows,
  labelsBySection,
  loading,
  showTimezones,
  locale,
  page,
  totalCount,
  pageSize,
  pageCount,
  onPageChange,
}: Readonly<AdminDashboardScheduleOverviewProps>) {
  const { shell, columns, status, actions } = {
    shell: labelsBySection.shell,
    columns: labelsBySection.columns,
    status: labelsBySection.status,
    actions: { detailsLabel: labelsBySection.shell.details },
  };

  return (
    <Box sx={scheduleOverviewListCanvasSx}>
      <ScheduleOverviewListShell
        rows={rows}
        getKey={row => row.id ?? ""}
        loading={loading}
        emptyMessage={shell.noClasses}
        renderItem={row => (
          <ScheduleOverviewDesktopCard
            row={row}
            headers={columns}
            statusLabels={status}
            detailsLabel={actions.detailsLabel}
            showTimezones={showTimezones}
            locale={locale}
          />
        )}
        renderEmptyState={() => (
          <Box sx={{ py: 2 }}>
            <ScheduleOverviewEmptyState message={shell.noClasses} />
          </Box>
        )}
      />

      {totalCount != null ? (
        <PaginationControls
          page={page}
          pageCount={pageCount}
          rowCount={totalCount}
          pageSize={pageSize}
          onPageChange={onPageChange}
        />
      ) : null}
    </Box>
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
  pageCount,
  canDashboardSearch,
  canScheduleFilterAdvanced,
  canScheduleViewTimezones,
}: Readonly<AdminDashboardViewModel>) {
  const locale = useAppLocale();
  const showTimezones = canScheduleViewTimezones;
  const { shell, filters } = labelsBySection;

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
              py: 2.5,
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
            <Chip size="small" variant="outlined" label={selectedMetricLabel} />
          </Box>
        ) : null}

        <AdminDashboardScheduleOverview
          rows={rows}
          labelsBySection={labelsBySection}
          loading={loading}
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
