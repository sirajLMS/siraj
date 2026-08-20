"use client";

import { Box, Chip, InputAdornment, Stack, TextField, useTheme } from "@mui/material";
import type { ReactNode } from "react";
import { useAppLocale } from "@/frontend/common/providers/localeContext";
import { ScheduleFilters } from "@/frontend/common/views/dashboard/admin/home/components/ScheduleFilters";
import {
  scheduleOverviewCardShellSx,
  scheduleOverviewMobileChromeSx,
} from "@/frontend/common/views/dashboard/admin/home/components/scheduleOverviewSurfaces";
import type { AdminDashboardLabelsBySection } from "@/frontend/common/views/dashboard/admin/home/types/adminDashboard.types";
import type { DailyScheduleRow } from "@/frontend/common/views/dashboard/admin/home/types/schedule";
import type { AdminDashboardViewModel } from "@/frontend/common/views/dashboard/admin/home/useAdminDashboardViewModel";
import { MobileCardListItem, MobileMetricCardGrid } from "@/frontend/mobile/components/ui";
import { TeacherAutocompleteMobile } from "@/frontend/mobile/components/ui/input/userSelect";
import { ScheduleOverviewMobileCardList } from "@/frontend/mobile/views/dashboard/admin/home/__shared__/scheduleOverviewMobileCardList";
import {
  StyledMobileSectionBody,
  StyledSearchIcon,
  StyledSectionTitle,
  StyledSectionTitleRow,
} from "@/frontend/mobile/views/dashboard/admin/home/__shared__/scheduleOverviewStyled";
import { ScheduleOverviewMobileCard } from "@/frontend/mobile/views/dashboard/admin/home/scheduleOverview/components/scheduleOverviewCard.mobile";

type AdminDashboardMobileViewProps = Readonly<AdminDashboardViewModel>;

function AdminDashboardMobileHeader({
  scheduleTitle,
  selectedMetricLabel,
}: {
  readonly scheduleTitle: string;
  readonly selectedMetricLabel: string | null;
}) {
  return (
    <StyledSectionTitleRow>
      <StyledSectionTitle variant="titleLg">{scheduleTitle}</StyledSectionTitle>
      {selectedMetricLabel ? <Chip size="small" variant="outlined" label={selectedMetricLabel} /> : null}
    </StyledSectionTitleRow>
  );
}

function AdminDashboardMobileToolbar({
  canScheduleFilterAdvanced,
  filters,
  dateValue,
  onDateChange,
  selectedTeacher,
  onTeacherChange,
  canDashboardSearch,
  searchPlaceholder,
  searchValue,
  onSearchChange,
}: Pick<
  AdminDashboardMobileViewProps,
  | "canScheduleFilterAdvanced"
  | "dateValue"
  | "onDateChange"
  | "selectedTeacher"
  | "onTeacherChange"
  | "canDashboardSearch"
  | "searchValue"
  | "onSearchChange"
> & {
  readonly filters: AdminDashboardLabelsBySection["filters"];
  readonly searchPlaceholder: string;
}) {
  const theme = useTheme();

  return (
    <StyledMobileSectionBody>
      {canScheduleFilterAdvanced ? (
        <ScheduleFilters
          dateLabel={filters.listOfClassesOn}
          dateValue={dateValue}
          todayLabel={filters.today}
          previousDayLabel={filters.previousDay}
          nextDayLabel={filters.nextDay}
          onDateChange={onDateChange}
          teacherSelect={
            <TeacherAutocompleteMobile
              value={selectedTeacher}
              onChange={onTeacherChange}
              label={filters.selectTeacher}
            />
          }
        />
      ) : null}

      {canDashboardSearch ? (
        <TextField
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={event => {
            onSearchChange(event.target.value);
          }}
          fullWidth
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
            "& .MuiOutlinedInput-root": {
              borderRadius: 2,
              backgroundColor: theme.palette.surfaceContainerHigh,
            },
          }}
        />
      ) : null}
    </StyledMobileSectionBody>
  );
}

function AdminDashboardMobileScheduleList({
  rows,
  loading,
  emptyMessage,
  labelsBySection,
  showTimezones,
  locale,
  page,
  pageSize,
  totalCount,
  onPageChange,
}: Pick<
  AdminDashboardMobileViewProps,
  "rows" | "loading" | "page" | "pageSize" | "totalCount" | "onPageChange" | "canScheduleViewTimezones"
> & {
  readonly labelsBySection: AdminDashboardLabelsBySection;
  readonly showTimezones: boolean;
  readonly locale: string;
  readonly emptyMessage: string;
}) {
  const { columns, status, shell } = labelsBySection;

  const renderItem = (row: DailyScheduleRow): ReactNode => (
    <MobileCardListItem variant="edge-to-edge" sx={scheduleOverviewCardShellSx}>
      <ScheduleOverviewMobileCard
        row={row}
        headers={columns}
        statusLabels={status}
        detailsLabel={shell.details}
        showTimezones={showTimezones}
        locale={locale}
      />
    </MobileCardListItem>
  );

  return (
    <ScheduleOverviewMobileCardList
      rows={rows}
      loading={loading ?? false}
      emptyMessage={emptyMessage}
      page={page}
      pageSize={pageSize}
      totalCount={totalCount}
      onPageChange={onPageChange}
      renderItem={renderItem}
    />
  );
}

export function AdminDashboardMobileView(props: AdminDashboardMobileViewProps) {
  const locale = useAppLocale();
  const showTimezones = props.canScheduleViewTimezones;
  const { shell, filters } = props.labelsBySection;

  return (
    <Stack direction="column" sx={{ gap: { xs: 0, md: 2 } }}>
      <Box sx={{ display: "flex", flexDirection: "column" }}>
        <Box sx={scheduleOverviewMobileChromeSx}>
          <AdminDashboardMobileHeader
            scheduleTitle={shell.scheduleOverview}
            selectedMetricLabel={props.selectedMetricLabel}
          />
          <MobileMetricCardGrid
            metrics={props.metrics}
            onMetricClick={props.onMetricClick}
            selectedKey={props.selectedMetricKey}
          />
          <AdminDashboardMobileToolbar
            canScheduleFilterAdvanced={props.canScheduleFilterAdvanced}
            filters={filters}
            dateValue={props.dateValue}
            onDateChange={props.onDateChange}
            selectedTeacher={props.selectedTeacher}
            onTeacherChange={props.onTeacherChange}
            canDashboardSearch={props.canDashboardSearch}
            searchPlaceholder={shell.searchPlaceholder}
            searchValue={props.searchValue}
            onSearchChange={props.onSearchChange}
          />
        </Box>
        <AdminDashboardMobileScheduleList
          rows={props.rows}
          loading={props.loading}
          emptyMessage={shell.noClasses}
          labelsBySection={props.labelsBySection}
          showTimezones={showTimezones}
          locale={locale}
          page={props.page}
          pageSize={props.pageSize}
          totalCount={props.totalCount}
          onPageChange={props.onPageChange}
          canScheduleViewTimezones={props.canScheduleViewTimezones}
        />
      </Box>
    </Stack>
  );
}
