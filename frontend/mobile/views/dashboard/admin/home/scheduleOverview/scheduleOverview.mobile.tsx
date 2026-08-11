"use client";

import { Box, InputAdornment, Stack, TextField, useTheme } from "@mui/material";
import type { ReactNode } from "react";
import { buildServerPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";
import { ScheduleFilters } from "@/frontend/common/views/dashboard/admin/home/components/ScheduleFilters";
import {
  ScheduleOverviewCardSkeleton,
  ScheduleOverviewEmptyState,
} from "@/frontend/common/views/dashboard/admin/home/components/ScheduleOverviewCardList";
import {
  scheduleOverviewCardShellSx,
  scheduleOverviewListCanvasSx,
  scheduleOverviewMobileChromeSx,
} from "@/frontend/common/views/dashboard/admin/home/components/scheduleOverviewSurfaces";
import type { ScheduleOverviewViewModel } from "@/frontend/common/views/dashboard/admin/home/scheduleOverview/useScheduleOverviewViewModel";
import type { DailyScheduleRow } from "@/frontend/common/views/dashboard/admin/home/types/schedule";
import type { ScheduleOverviewLabelsBySection } from "@/frontend/common/views/dashboard/admin/home/types/scheduleOverview.types";
import { MobileCardList, MobileCardListItem, MobileStatusBadge } from "@/frontend/mobile/components/ui";
import { TeacherAutocompleteMobile } from "@/frontend/mobile/components/ui/input/userSelect";
import {
  StyledMobileSectionBody,
  StyledSearchIcon,
  StyledSectionTitle,
  StyledSectionTitleRow,
} from "@/frontend/mobile/views/dashboard/admin/home/__shared__/scheduleOverviewStyled";
import { ScheduleOverviewMobileCard } from "@/frontend/mobile/views/dashboard/admin/home/scheduleOverview/components/scheduleOverviewCard.mobile";

type ScheduleOverviewMobileViewProps = Readonly<ScheduleOverviewViewModel>;

function renderScheduleOverviewItem(
  row: DailyScheduleRow,
  labelsBySection: ScheduleOverviewLabelsBySection,
  showTimezones: ScheduleOverviewMobileViewProps["showTimezones"],
  locale: ScheduleOverviewMobileViewProps["locale"]
): ReactNode {
  const { columns, status, actions } = labelsBySection;

  return (
    <MobileCardListItem variant="edge-to-edge" sx={scheduleOverviewCardShellSx}>
      <ScheduleOverviewMobileCard
        row={row}
        headers={columns}
        statusLabels={status}
        detailsLabel={actions.detailsLabel}
        showTimezones={showTimezones}
        locale={locale}
      />
    </MobileCardListItem>
  );
}

function ScheduleOverviewMobileHeader({
  title,
  selectedMetricLabel,
}: Pick<ScheduleOverviewMobileViewProps, "selectedMetricLabel"> & { readonly title: string }) {
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
  filters,
  dateValue,
  onDateChange,
  selectedTeacher,
  onTeacherChange,
  canDashboardSearch,
  searchValue,
  onSearchChange,
}: Pick<
  ScheduleOverviewMobileViewProps,
  | "canScheduleFilterAdvanced"
  | "dateValue"
  | "onDateChange"
  | "selectedTeacher"
  | "onTeacherChange"
  | "canDashboardSearch"
  | "searchValue"
  | "onSearchChange"
> & {
  readonly filters: ScheduleOverviewLabelsBySection["filters"];
}) {
  const theme = useTheme();

  return (
    <StyledMobileSectionBody>
      {canScheduleFilterAdvanced ? (
        <ScheduleFilters
          dateLabel={filters.dateLabel}
          dateValue={dateValue}
          todayLabel={filters.todayLabel}
          previousDayLabel={filters.previousDayLabel}
          nextDayLabel={filters.nextDayLabel}
          onDateChange={onDateChange}
          teacherSelect={
            <TeacherAutocompleteMobile
              value={selectedTeacher}
              onChange={onTeacherChange}
              label={filters.teacherPlaceholder}
            />
          }
        />
      ) : null}

      {canDashboardSearch ? (
        <TextField
          placeholder={filters.searchPlaceholder}
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

function ScheduleOverviewMobileList({
  rows,
  loading,
  labelsBySection,
  showTimezones,
  locale,
  page,
  pageSize,
  totalCount,
  onPageChange,
}: Pick<
  ScheduleOverviewMobileViewProps,
  "rows" | "loading" | "showTimezones" | "locale" | "page" | "pageSize" | "totalCount" | "onPageChange"
> & {
  readonly labelsBySection: ScheduleOverviewLabelsBySection;
}) {
  const { shell } = labelsBySection;

  return (
    <MobileCardList<DailyScheduleRow>
      rows={rows}
      loading={loading}
      emptyMessage={shell.emptyMessage}
      renderSkeleton={() => (
        <MobileCardListItem variant="edge-to-edge" sx={scheduleOverviewCardShellSx}>
          <ScheduleOverviewCardSkeleton />
        </MobileCardListItem>
      )}
      renderEmptyState={msg => (
        <MobileCardListItem variant="edge-to-edge" sx={scheduleOverviewCardShellSx}>
          <ScheduleOverviewEmptyState message={msg} />
        </MobileCardListItem>
      )}
      gap={0}
      layout="edge-to-edge"
      sx={scheduleOverviewListCanvasSx}
      getKey={row => row.id ?? ""}
      renderItem={row => renderScheduleOverviewItem(row, labelsBySection, showTimezones, locale)}
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
  const { shell, filters } = props.labelsBySection;

  return (
    <Stack direction="column" sx={{ gap: { xs: 0, md: 2 } }}>
      <Box sx={{ display: "flex", flexDirection: "column" }}>
        <Box sx={scheduleOverviewMobileChromeSx}>
          <ScheduleOverviewMobileHeader title={shell.title} selectedMetricLabel={props.selectedMetricLabel} />
          <ScheduleOverviewMobileToolbar
            canScheduleFilterAdvanced={props.canScheduleFilterAdvanced}
            filters={filters}
            dateValue={props.dateValue}
            onDateChange={props.onDateChange}
            selectedTeacher={props.selectedTeacher}
            onTeacherChange={props.onTeacherChange}
            canDashboardSearch={props.canDashboardSearch}
            searchValue={props.searchValue}
            onSearchChange={props.onSearchChange}
          />
        </Box>
        <ScheduleOverviewMobileList
          rows={props.rows}
          loading={props.loading}
          labelsBySection={props.labelsBySection}
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
