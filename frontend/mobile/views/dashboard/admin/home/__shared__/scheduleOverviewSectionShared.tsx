"use client";

import { Box, Stack } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import type { ReactNode } from "react";
import { FilterChip } from "@/frontend/common/components/ui";
import { SearchBarField } from "@/frontend/common/components/ui/input/searchBarField";
import { ScheduleFilters } from "@/frontend/common/views/dashboard/admin/home/components/ScheduleFilters";
import { scheduleOverviewCardShellSx } from "@/frontend/common/views/dashboard/admin/home/components/scheduleOverviewSurfaces";
import type { DailyScheduleRow } from "@/frontend/common/views/dashboard/admin/home/types/schedule";
import type {
  ScheduleOverviewDataHeaders,
  ScheduleOverviewDataStatusLabels,
} from "@/frontend/common/views/dashboard/types/dashboard";
import { MobileCardListItem, MobileContentInset, MobileSectionPanel } from "@/frontend/mobile/components/ui";
import { ScheduleOverviewMobileCard } from "@/frontend/mobile/views/dashboard/admin/home/scheduleOverview/components/scheduleOverviewCard.mobile";

/** Labels the schedule overview toolbar needs, tier-neutral between admin pages. */
export interface ScheduleOverviewMobileToolbarLabels {
  readonly dateLabel: string;
  readonly todayLabel: string;
  readonly previousDayLabel: string;
  readonly nextDayLabel: string;
  readonly searchPlaceholder: string;
}

export interface ScheduleOverviewMobileToolbarProps {
  readonly labels: ScheduleOverviewMobileToolbarLabels;
  readonly canScheduleFilterAdvanced: boolean;
  readonly canDashboardSearch: boolean;
  readonly dateValue: string;
  readonly onDateChange: (date: string) => void;
  readonly teacherSelect: ReactNode;
  readonly searchValue: string;
  readonly onSearchChange: (value: string) => void;
}

const toolbarSearchSx: SxProps<Theme> = theme => ({
  "& .MuiOutlinedInput-root": {
    borderRadius: 2,
    backgroundColor: theme.palette.surfaceContainerHigh,
  },
});

/**
 * Shared mobile schedule overview toolbar: date/teacher filters (permission
 * gated) and the search field. Rendered inside the section's content inset.
 */
export function ScheduleOverviewMobileToolbar({
  labels,
  canScheduleFilterAdvanced,
  canDashboardSearch,
  dateValue,
  onDateChange,
  teacherSelect,
  searchValue,
  onSearchChange,
}: Readonly<ScheduleOverviewMobileToolbarProps>) {
  return (
    <>
      {canScheduleFilterAdvanced ? (
        <ScheduleFilters
          dateLabel={labels.dateLabel}
          dateValue={dateValue}
          todayLabel={labels.todayLabel}
          previousDayLabel={labels.previousDayLabel}
          nextDayLabel={labels.nextDayLabel}
          onDateChange={onDateChange}
          teacherSelect={teacherSelect}
        />
      ) : null}
      {canDashboardSearch ? (
        <SearchBarField
          value={searchValue}
          placeholder={labels.searchPlaceholder}
          onChange={onSearchChange}
          sx={toolbarSearchSx}
        />
      ) : null}
    </>
  );
}

export interface ScheduleOverviewMobileSectionProps {
  readonly title?: string;
  readonly selectedMetricLabel?: string | null;
  readonly onClearMetricFilter?: () => void;
  /** Toolbar slot (`ScheduleOverviewMobileToolbar`); pass null to hide the strip. */
  readonly toolbar: ReactNode;
  /** Full-bleed list slot (`ScheduleOverviewMobileCardList`). */
  readonly list: ReactNode;
}

/**
 * Shared mobile schedule overview section: title bar, filter chip + toolbar
 * in the content inset, and a full-bleed card list.
 */
export function ScheduleOverviewMobileSection({
  title,
  selectedMetricLabel,
  onClearMetricFilter,
  toolbar,
  list,
}: Readonly<ScheduleOverviewMobileSectionProps>) {
  const showToolbarStrip = Boolean(selectedMetricLabel) || Boolean(toolbar);

  return (
    <MobileSectionPanel title={title} contentInset={false}>
      {showToolbarStrip ? (
        <MobileContentInset>
          <Stack sx={{ gap: 2, py: 2.5 }}>
            {selectedMetricLabel ? (
              <Box>
                <FilterChip label={selectedMetricLabel} onClear={onClearMetricFilter} />
              </Box>
            ) : null}
            {toolbar}
          </Stack>
        </MobileContentInset>
      ) : null}
      {list}
    </MobileSectionPanel>
  );
}

/** Label bundle the schedule overview card renderer needs. */
export interface ScheduleOverviewMobileCardLabels {
  readonly columns: ScheduleOverviewDataHeaders;
  readonly status: ScheduleOverviewDataStatusLabels;
  readonly detailsLabel: string;
}

/** Builds the card-list `renderItem` that wraps each row in the shared card shell. */
export function createScheduleOverviewMobileCardRenderer(
  labels: ScheduleOverviewMobileCardLabels,
  showTimezones: boolean,
  locale: string
): (row: DailyScheduleRow) => ReactNode {
  return (row: DailyScheduleRow): ReactNode => (
    <MobileCardListItem variant="edge-to-edge" sx={scheduleOverviewCardShellSx}>
      <ScheduleOverviewMobileCard
        row={row}
        headers={labels.columns}
        statusLabels={labels.status}
        detailsLabel={labels.detailsLabel}
        showTimezones={showTimezones}
        locale={locale}
      />
    </MobileCardListItem>
  );
}
