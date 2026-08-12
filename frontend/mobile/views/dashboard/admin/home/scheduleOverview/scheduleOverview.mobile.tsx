"use client";

import { Box, Stack, useTheme } from "@mui/material";
import type { ReactNode } from "react";
import {
  ScheduleOverviewFilterSection,
  ScheduleOverviewSearchField,
} from "@/frontend/common/views/dashboard/admin/home/components/__shared__/scheduleOverviewShared";
import {
  scheduleOverviewCardShellSx,
  scheduleOverviewMobileChromeSx,
} from "@/frontend/common/views/dashboard/admin/home/components/scheduleOverviewSurfaces";
import type { ScheduleOverviewViewModel } from "@/frontend/common/views/dashboard/admin/home/scheduleOverview/useScheduleOverviewViewModel";
import type { DailyScheduleRow } from "@/frontend/common/views/dashboard/admin/home/types/schedule";
import type { ScheduleOverviewLabelsBySection } from "@/frontend/common/views/dashboard/admin/home/types/scheduleOverview.types";
import { MobileCardListItem, MobileStatusBadge } from "@/frontend/mobile/components/ui";
import { TeacherAutocompleteMobile } from "@/frontend/mobile/components/ui/input/userSelect";
import { ScheduleOverviewMobileCardList } from "@/frontend/mobile/views/dashboard/admin/home/__shared__/scheduleOverviewMobileCardList";
import {
  StyledMobileSectionBody,
  StyledSectionTitle,
  StyledSectionTitleRow,
} from "@/frontend/mobile/views/dashboard/admin/home/__shared__/scheduleOverviewStyled";
import { ScheduleOverviewMobileCard } from "@/frontend/mobile/views/dashboard/admin/home/scheduleOverview/components/scheduleOverviewCard.mobile";

type ScheduleOverviewMobileViewProps = Readonly<ScheduleOverviewViewModel>;

function renderScheduleOverviewItem(
  row: DailyScheduleRow,
  columns: ScheduleOverviewLabelsBySection["columns"],
  status: ScheduleOverviewLabelsBySection["status"],
  detailsLabel: string,
  showTimezones: ScheduleOverviewMobileViewProps["showTimezones"],
  locale: ScheduleOverviewMobileViewProps["locale"]
): ReactNode {
  return (
    <MobileCardListItem variant="edge-to-edge" sx={scheduleOverviewCardShellSx}>
      <ScheduleOverviewMobileCard
        row={row}
        headers={columns}
        statusLabels={status}
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
        <ScheduleOverviewFilterSection
          filters={filters}
          dateValue={dateValue}
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
        <ScheduleOverviewSearchField
          searchPlaceholder={filters.searchPlaceholder}
          searchValue={searchValue}
          onSearchChange={onSearchChange}
          fullWidth
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
  const { columns, status, actions, shell } = labelsBySection;

  return (
    <ScheduleOverviewMobileCardList
      rows={rows}
      loading={loading ?? false}
      emptyMessage={shell.emptyMessage}
      page={page}
      pageSize={pageSize}
      totalCount={totalCount}
      onPageChange={onPageChange}
      renderItem={row => renderScheduleOverviewItem(row, columns, status, actions.detailsLabel, showTimezones, locale)}
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
