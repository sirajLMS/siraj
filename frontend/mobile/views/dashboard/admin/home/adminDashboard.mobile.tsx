"use client";

import { SearchOutlined } from "@mui/icons-material";
import { Box, InputAdornment, Stack, TextField, Typography, useTheme } from "@mui/material";
import { styled } from "@mui/material/styles";
import type { ReactNode } from "react";
import { buildServerPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";
import { useAppLocale } from "@/frontend/common/providers/localeContext";
import { ScheduleFilters } from "@/frontend/common/views/dashboard/admin/home/components/ScheduleFilters";
import {
  ScheduleOverviewCardSkeleton,
  ScheduleOverviewEmptyState,
} from "@/frontend/common/views/dashboard/admin/home/components/ScheduleOverviewCardList";
import type { AdminDashboardLabelsBySection } from "@/frontend/common/views/dashboard/admin/home/types/adminDashboard.types";
import type { DailyScheduleRow } from "@/frontend/common/views/dashboard/admin/home/types/schedule";
import type { AdminDashboardViewModel } from "@/frontend/common/views/dashboard/admin/home/useAdminDashboardViewModel";
import {
  MobileCardList,
  MobileCardListItem,
  MobileMetricCardGrid,
  MobileStatusBadge,
} from "@/frontend/mobile/components/ui";
import { TeacherAutocompleteMobile } from "@/frontend/mobile/components/ui/input/userSelect";
import { ScheduleOverviewMobileCard } from "@/frontend/mobile/views/dashboard/admin/home/scheduleOverview/components/scheduleOverviewCard.mobile";

const StyledSearchIcon = styled(SearchOutlined)(({ theme }) => ({
  fontSize: 18,
  color: theme.palette.onSurfaceVariant,
}));

const StyledSectionTitleRow = styled(Stack)(({ theme }) => ({
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  paddingInline: theme.spacing(2),
  paddingBlock: theme.spacing(1.5),
}));

const StyledSectionTitle = styled(Typography)(({ theme }) => ({
  color: theme.palette.onSurface,
}));

const StyledMobileSectionBody = styled(Stack)(({ theme }) => ({
  gap: theme.spacing(2),
  paddingInline: theme.spacing(2),
  paddingTop: theme.spacing(2.5),
  paddingBottom: theme.spacing(2),
}));

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
      {selectedMetricLabel ? (
        <MobileStatusBadge category="classStatus" status="confirmed" label={selectedMetricLabel} />
      ) : null}
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
              backgroundColor: theme.palette.surfaceContainerLowest,
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
    <MobileCardListItem variant="edge-to-edge">
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
    <MobileCardList<DailyScheduleRow>
      rows={rows as readonly DailyScheduleRow[]}
      loading={loading}
      emptyMessage={emptyMessage}
      renderSkeleton={() => (
        <MobileCardListItem variant="edge-to-edge">
          <ScheduleOverviewCardSkeleton />
        </MobileCardListItem>
      )}
      renderEmptyState={msg => (
        <MobileCardListItem variant="edge-to-edge">
          <ScheduleOverviewEmptyState message={msg} />
        </MobileCardListItem>
      )}
      gap={2}
      layout="edge-to-edge"
      getKey={row => row.id ?? ""}
      renderItem={renderItem}
      paginationOptions={buildServerPaginationOptions({
        page,
        pageSize,
        totalCount: totalCount ?? 0,
        onPageChange,
      })}
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
