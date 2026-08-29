"use client";

import { Box, Typography } from "@mui/material";
import { FilterChip } from "@/frontend/common/components/ui";
import { SearchBarField } from "@/frontend/common/components/ui/input/searchBarField";
import { ScheduleOverviewFilterSection } from "@/frontend/common/views/dashboard/admin/home/components/__shared__/scheduleOverviewShared";
import { ScheduleOverviewDataGrid } from "@/frontend/common/views/dashboard/admin/home/components/ScheduleOverviewDataGrid";
import { scheduleOverviewFilterBarSx } from "@/frontend/common/views/dashboard/admin/home/components/scheduleOverviewSurfaces";
import type { ScheduleOverviewViewModel } from "@/frontend/common/views/dashboard/admin/home/scheduleOverview/useScheduleOverviewViewModel";
import { DesktopSectionPanel } from "@/frontend/desktop/components/ui";
import { desktopSectionContentInsetSx } from "@/frontend/desktop/components/ui/container/desktopSectionContentInsetSx";
import { TeacherAutocompleteDesktop } from "@/frontend/desktop/components/ui/input/userSelect";

const DESKTOP_SEARCH_SX = {
  maxWidth: { md: 280 },
  "& .MuiOutlinedInput-root": {
    borderRadius: 2,
  },
} as const;

function ScheduleOverviewTitle({
  title,
  selectedMetricLabel,
}: {
  readonly title: string;
  readonly selectedMetricLabel?: string | null;
}) {
  return (
    <>
      <Typography variant="titleLg" sx={theme => ({ color: theme.palette.onSurface })}>
        {title}
      </Typography>
      {selectedMetricLabel ? <FilterChip label={selectedMetricLabel} /> : null}
    </>
  );
}

export function ScheduleOverviewDesktopView({
  labelsBySection,
  selectedMetricLabel,
  searchValue,
  rows,
  page,
  pageSize,
  totalCount,
  onPageChange,
  onSearchChange,
  dateValue,
  selectedTeacher,
  onDateChange,
  onTeacherChange,
  loading,
  showTimezones,
  canDashboardSearch,
  canScheduleFilterAdvanced,
}: Readonly<ScheduleOverviewViewModel>) {
  const { shell, filters, columns, status, actions } = labelsBySection;

  return (
    <DesktopSectionPanel
      contentPadding={false}
      sx={theme => ({
        backgroundColor: theme.palette.surfaceContainerLow,
        border: `1px solid ${theme.palette.outlineVariant}`,
      })}
      title={<ScheduleOverviewTitle title={shell.title} selectedMetricLabel={selectedMetricLabel} />}
      actions={
        canDashboardSearch ? (
          <SearchBarField
            value={searchValue}
            placeholder={filters.searchPlaceholder}
            onChange={onSearchChange}
            sx={DESKTOP_SEARCH_SX}
          />
        ) : null
      }
    >
      {canScheduleFilterAdvanced ? (
        <Box
          sx={theme => ({
            ...scheduleOverviewFilterBarSx(theme),
            ...desktopSectionContentInsetSx,
            width: "100%",
          })}
        >
          <ScheduleOverviewFilterSection
            filters={filters}
            dateValue={dateValue}
            onDateChange={onDateChange}
            teacherSelect={
              <TeacherAutocompleteDesktop
                value={selectedTeacher}
                onChange={onTeacherChange}
                label={filters.teacherPlaceholder}
              />
            }
          />
        </Box>
      ) : null}

      <ScheduleOverviewDataGrid
        rows={rows}
        page={page}
        pageSize={pageSize}
        totalCount={totalCount}
        onPageChange={onPageChange}
        headers={columns}
        statusLabels={status}
        detailsLabel={actions.detailsLabel}
        emptyMessage={shell.emptyMessage}
        loading={loading}
        showTimezones={showTimezones}
      />
    </DesktopSectionPanel>
  );
}
