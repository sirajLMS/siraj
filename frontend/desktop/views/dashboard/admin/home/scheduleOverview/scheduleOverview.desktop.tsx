"use client";

import { SearchOutlined } from "@mui/icons-material";
import { Box, InputAdornment, Paper, Stack, TextField, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { PaginationControls } from "@/frontend/common/components/ui";
import { ScheduleFilters } from "@/frontend/common/views/dashboard/admin/home/components/ScheduleFilters";
import {
  ScheduleOverviewCardSkeleton,
  ScheduleOverviewEmptyState,
} from "@/frontend/common/views/dashboard/admin/home/components/ScheduleOverviewCardList";
import { ScheduleOverviewListShell } from "@/frontend/common/views/dashboard/admin/home/components/ScheduleOverviewListShell";
import type { ScheduleOverviewViewModel } from "@/frontend/common/views/dashboard/admin/home/scheduleOverview/useScheduleOverviewViewModel";
import type { ScheduleOverviewLabelsBySection } from "@/frontend/common/views/dashboard/admin/home/types/scheduleOverview.types";
import { DesktopSectionPanel, DesktopStatusBadge } from "@/frontend/desktop/components/ui";
import { TeacherAutocompleteDesktop } from "@/frontend/desktop/components/ui/input/userSelect";
import { ScheduleOverviewDesktopCard } from "@/frontend/desktop/views/dashboard/admin/home/scheduleOverview/components/scheduleOverviewCard.desktop";

const StyledDesktopPanel = styled(Paper)(({ theme }) => ({
  borderRadius: Number(theme.shape.borderRadius) * 2,
  border: `1px solid ${theme.palette.border.light}`,
  overflow: "hidden",
}));

const StyledFilterContainer = styled(Box)(({ theme }) => ({
  paddingInline: theme.spacing(3),
  paddingBlock: theme.spacing(2.5),
  backgroundColor: theme.palette.background.default,
  borderBottom: `1px solid ${theme.palette.border.light}`,
}));

const StyledSearchIcon = styled(SearchOutlined)(({ theme }) => ({
  fontSize: 18,
  color: theme.palette.onSurfaceVariant,
}));

const StyledSectionTitle = styled(Typography)(({ theme }) => ({
  color: theme.palette.onSurface,
}));

function ScheduleOverviewTitle({
  title,
  selectedMetricLabel,
}: {
  readonly title: string;
  readonly selectedMetricLabel?: string | null;
}) {
  return (
    <>
      <StyledSectionTitle variant="titleLg">{title}</StyledSectionTitle>
      {selectedMetricLabel ? (
        <DesktopStatusBadge category="classStatus" status="confirmed" label={selectedMetricLabel} />
      ) : null}
    </>
  );
}

type ScheduleOverviewSearchFieldProps = Pick<ScheduleOverviewViewModel, "searchValue" | "onSearchChange"> & {
  readonly searchPlaceholder: string;
};

function ScheduleOverviewSearchField({
  searchPlaceholder,
  searchValue,
  onSearchChange,
}: Readonly<ScheduleOverviewSearchFieldProps>) {
  return (
    <TextField
      placeholder={searchPlaceholder}
      value={searchValue}
      onChange={event => {
        onSearchChange(event.target.value);
      }}
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
        maxWidth: { md: 280 },
        "& .MuiOutlinedInput-root": {
          borderRadius: 2,
        },
      }}
    />
  );
}

type ScheduleOverviewFilterSectionProps = Pick<
  ScheduleOverviewViewModel,
  "dateValue" | "selectedTeacher" | "onDateChange" | "onTeacherChange"
> & {
  readonly filters: ScheduleOverviewLabelsBySection["filters"];
};

function ScheduleOverviewFilterSection({
  filters,
  dateValue,
  selectedTeacher,
  onDateChange,
  onTeacherChange,
}: Readonly<ScheduleOverviewFilterSectionProps>) {
  return (
    <StyledFilterContainer>
      <ScheduleFilters
        dateLabel={filters.dateLabel}
        dateValue={dateValue}
        todayLabel={filters.todayLabel}
        previousDayLabel={filters.previousDayLabel}
        nextDayLabel={filters.nextDayLabel}
        onDateChange={onDateChange}
        teacherSelect={
          <TeacherAutocompleteDesktop
            value={selectedTeacher}
            onChange={onTeacherChange}
            label={filters.teacherPlaceholder}
          />
        }
      />
    </StyledFilterContainer>
  );
}

type ScheduleOverviewListSectionProps = Pick<
  ScheduleOverviewViewModel,
  "rows" | "loading" | "showTimezones" | "locale"
> & {
  readonly labelsBySection: ScheduleOverviewLabelsBySection;
};

function ScheduleOverviewListSection({
  rows,
  labelsBySection,
  loading,
  showTimezones,
  locale,
}: Readonly<ScheduleOverviewListSectionProps>) {
  const { shell, columns, status, actions } = labelsBySection;

  return (
    <ScheduleOverviewListShell
      rows={rows}
      getKey={row => row.id ?? ""}
      loading={loading}
      emptyMessage={shell.emptyMessage}
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
        <Box sx={{ p: 2 }}>
          <ScheduleOverviewEmptyState message={shell.emptyMessage} />
        </Box>
      )}
      renderSkeleton={() => (
        <Stack spacing={2} sx={{ p: 2 }}>
          <Paper
            elevation={0}
            sx={theme => ({
              borderRadius: 2,
              border: `1px solid ${theme.palette.border.light}`,
              backgroundColor: theme.palette.surfaceContainerLowest,
            })}
          >
            <ScheduleOverviewCardSkeleton />
          </Paper>
        </Stack>
      )}
      sx={{ p: 2 }}
    />
  );
}

type ScheduleOverviewPaginationSectionProps = Pick<
  ScheduleOverviewViewModel,
  "totalCount" | "page" | "pageSize" | "onPageChange"
>;

function ScheduleOverviewPaginationSection({
  totalCount,
  page,
  pageSize,
  onPageChange,
}: Readonly<ScheduleOverviewPaginationSectionProps>) {
  if (totalCount === undefined) {
    return null;
  }

  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize));

  return (
    <Box sx={{ p: 2, pt: 1, display: "flex", justifyContent: "flex-end" }}>
      <PaginationControls
        page={page}
        pageCount={pageCount}
        rowCount={totalCount}
        pageSize={pageSize}
        onPageChange={onPageChange}
      />
    </Box>
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
  locale,
  canDashboardSearch,
  canScheduleFilterAdvanced,
}: Readonly<ScheduleOverviewViewModel>) {
  const { shell, filters } = labelsBySection;

  return (
    <StyledDesktopPanel elevation={0}>
      <DesktopSectionPanel
        title={<ScheduleOverviewTitle title={shell.title} selectedMetricLabel={selectedMetricLabel} />}
        actions={
          canDashboardSearch ? (
            <ScheduleOverviewSearchField
              searchPlaceholder={filters.searchPlaceholder}
              searchValue={searchValue}
              onSearchChange={onSearchChange}
            />
          ) : null
        }
      >
        {canScheduleFilterAdvanced ? (
          <ScheduleOverviewFilterSection
            filters={filters}
            dateValue={dateValue}
            selectedTeacher={selectedTeacher}
            onDateChange={onDateChange}
            onTeacherChange={onTeacherChange}
          />
        ) : null}

        <ScheduleOverviewListSection
          rows={rows}
          labelsBySection={labelsBySection}
          loading={loading}
          showTimezones={showTimezones}
          locale={locale}
        />

        <ScheduleOverviewPaginationSection
          totalCount={totalCount}
          page={page}
          pageSize={pageSize}
          onPageChange={onPageChange}
        />
      </DesktopSectionPanel>
    </StyledDesktopPanel>
  );
}
