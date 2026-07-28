"use client";

import { SearchOutlined } from "@mui/icons-material";
import { Box, InputAdornment, Stack, TextField, Typography, useTheme } from "@mui/material";
import { styled } from "@mui/material/styles";
import type { ReactNode } from "react";
import { buildServerPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";
import { ScheduleFilters } from "@/frontend/common/views/dashboard/admin/home/components/ScheduleFilters";
import {
  ScheduleOverviewCardSkeleton,
  ScheduleOverviewEmptyState,
} from "@/frontend/common/views/dashboard/admin/home/components/ScheduleOverviewCardList";
import type { ScheduleOverviewViewModel } from "@/frontend/common/views/dashboard/admin/home/scheduleOverview/useScheduleOverviewViewModel";
import type { DailyScheduleRow } from "@/frontend/common/views/dashboard/admin/home/types/schedule";
import { MobileCardList, MobileCardListItem, MobileStatusBadge } from "@/frontend/mobile/components/ui";
import { TeacherAutocompleteMobile } from "@/frontend/mobile/components/ui/input/userSelect";
import { ScheduleOverviewMobileCard } from "@/frontend/mobile/views/dashboard/admin/home/scheduleOverview/components/scheduleOverviewCard.mobile";

const StyledSearchIcon = styled(SearchOutlined)(({ theme }) => ({
  fontSize: 18,
  color: theme.palette.onSurfaceVariant,
}));

const StyledMobileSectionBody = styled(Stack)(({ theme }) => ({
  gap: theme.spacing(2),
  paddingInline: theme.spacing(2),
  paddingTop: theme.spacing(2.5),
  paddingBottom: theme.spacing(2),
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

type ScheduleOverviewMobileViewProps = Readonly<ScheduleOverviewViewModel>;

function renderScheduleOverviewItem(
  row: DailyScheduleRow,
  headers: ScheduleOverviewMobileViewProps["headers"],
  statusLabels: ScheduleOverviewMobileViewProps["statusLabels"],
  detailsLabel: ScheduleOverviewMobileViewProps["detailsLabel"],
  showTimezones: ScheduleOverviewMobileViewProps["showTimezones"],
  locale: ScheduleOverviewMobileViewProps["locale"]
): ReactNode {
  return (
    <MobileCardListItem variant="edge-to-edge">
      <ScheduleOverviewMobileCard
        row={row}
        headers={headers}
        statusLabels={statusLabels}
        detailsLabel={detailsLabel}
        showTimezones={showTimezones}
        locale={locale}
      />
    </MobileCardListItem>
  );
}

function ScheduleOverviewMobileHeader({
  title,
  selectedMetricLabel,
}: Pick<ScheduleOverviewMobileViewProps, "title" | "selectedMetricLabel">) {
  return (
    <StyledSectionTitleRow>
      <StyledSectionTitle variant="titleLg">{title}</StyledSectionTitle>
      {selectedMetricLabel ? (
        <MobileStatusBadge category="classStatus" status="confirmed" label={selectedMetricLabel} />
      ) : null}
    </StyledSectionTitleRow>
  );
}

function ScheduleOverviewMobileToolbar({
  canScheduleFilterAdvanced,
  dateLabel,
  dateValue,
  todayLabel,
  previousDayLabel,
  nextDayLabel,
  onDateChange,
  selectedTeacher,
  onTeacherChange,
  teacherPlaceholder,
  canDashboardSearch,
  searchPlaceholder,
  searchValue,
  onSearchChange,
}: Pick<
  ScheduleOverviewMobileViewProps,
  | "canScheduleFilterAdvanced"
  | "dateLabel"
  | "dateValue"
  | "todayLabel"
  | "previousDayLabel"
  | "nextDayLabel"
  | "onDateChange"
  | "selectedTeacher"
  | "onTeacherChange"
  | "teacherPlaceholder"
  | "canDashboardSearch"
  | "searchPlaceholder"
  | "searchValue"
  | "onSearchChange"
>) {
  const theme = useTheme();

  return (
    <StyledMobileSectionBody>
      {canScheduleFilterAdvanced ? (
        <ScheduleFilters
          dateLabel={dateLabel}
          dateValue={dateValue}
          todayLabel={todayLabel}
          previousDayLabel={previousDayLabel}
          nextDayLabel={nextDayLabel}
          onDateChange={onDateChange}
          teacherSelect={
            <TeacherAutocompleteMobile value={selectedTeacher} onChange={onTeacherChange} label={teacherPlaceholder} />
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

function ScheduleOverviewMobileList({
  rows,
  loading,
  emptyMessage,
  headers,
  statusLabels,
  detailsLabel,
  showTimezones,
  locale,
  page,
  pageSize,
  totalCount,
  onPageChange,
}: Pick<
  ScheduleOverviewMobileViewProps,
  | "rows"
  | "loading"
  | "emptyMessage"
  | "headers"
  | "statusLabels"
  | "detailsLabel"
  | "showTimezones"
  | "locale"
  | "page"
  | "pageSize"
  | "totalCount"
  | "onPageChange"
>) {
  return (
    <MobileCardList<DailyScheduleRow>
      rows={rows}
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
      renderItem={row => renderScheduleOverviewItem(row, headers, statusLabels, detailsLabel, showTimezones, locale)}
      paginationOptions={buildServerPaginationOptions({
        page,
        pageSize,
        totalCount: totalCount ?? 0,
        onPageChange,
      })}
    />
  );
}

export function ScheduleOverviewMobileView(props: ScheduleOverviewMobileViewProps) {
  return (
    <Stack direction="column" sx={{ gap: { xs: 0, md: 2 } }}>
      <Box sx={{ display: "flex", flexDirection: "column" }}>
        <ScheduleOverviewMobileHeader title={props.title} selectedMetricLabel={props.selectedMetricLabel} />
        <ScheduleOverviewMobileToolbar
          canScheduleFilterAdvanced={props.canScheduleFilterAdvanced}
          dateLabel={props.dateLabel}
          dateValue={props.dateValue}
          todayLabel={props.todayLabel}
          previousDayLabel={props.previousDayLabel}
          nextDayLabel={props.nextDayLabel}
          onDateChange={props.onDateChange}
          selectedTeacher={props.selectedTeacher}
          onTeacherChange={props.onTeacherChange}
          teacherPlaceholder={props.teacherPlaceholder}
          canDashboardSearch={props.canDashboardSearch}
          searchPlaceholder={props.searchPlaceholder}
          searchValue={props.searchValue}
          onSearchChange={props.onSearchChange}
        />
        <ScheduleOverviewMobileList
          rows={props.rows}
          loading={props.loading}
          emptyMessage={props.emptyMessage}
          headers={props.headers}
          statusLabels={props.statusLabels}
          detailsLabel={props.detailsLabel}
          showTimezones={props.showTimezones}
          locale={props.locale}
          page={props.page}
          pageSize={props.pageSize}
          totalCount={props.totalCount}
          onPageChange={props.onPageChange}
        />
      </Box>
    </Stack>
  );
}
