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

type ScheduleOverviewSearchFieldProps = Pick<
  ScheduleOverviewViewModel,
  "searchPlaceholder" | "searchValue" | "onSearchChange"
>;

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
  | "dateLabel"
  | "dateValue"
  | "todayLabel"
  | "previousDayLabel"
  | "nextDayLabel"
  | "teacherPlaceholder"
  | "selectedTeacher"
  | "onDateChange"
  | "onTeacherChange"
>;

function ScheduleOverviewFilterSection({
  dateLabel,
  dateValue,
  todayLabel,
  previousDayLabel,
  nextDayLabel,
  teacherPlaceholder,
  selectedTeacher,
  onDateChange,
  onTeacherChange,
}: Readonly<ScheduleOverviewFilterSectionProps>) {
  return (
    <StyledFilterContainer>
      <ScheduleFilters
        dateLabel={dateLabel}
        dateValue={dateValue}
        todayLabel={todayLabel}
        previousDayLabel={previousDayLabel}
        nextDayLabel={nextDayLabel}
        onDateChange={onDateChange}
        teacherSelect={
          <TeacherAutocompleteDesktop value={selectedTeacher} onChange={onTeacherChange} label={teacherPlaceholder} />
        }
      />
    </StyledFilterContainer>
  );
}

type ScheduleOverviewListSectionProps = Pick<
  ScheduleOverviewViewModel,
  "rows" | "headers" | "statusLabels" | "detailsLabel" | "emptyMessage" | "loading" | "showTimezones" | "locale"
>;

function ScheduleOverviewListSection({
  rows,
  headers,
  statusLabels,
  detailsLabel,
  emptyMessage,
  loading,
  showTimezones,
  locale,
}: Readonly<ScheduleOverviewListSectionProps>) {
  return (
    <ScheduleOverviewListShell
      rows={rows}
      getKey={row => row.id ?? ""}
      loading={loading}
      emptyMessage={emptyMessage}
      renderItem={row => (
        <ScheduleOverviewDesktopCard
          row={row}
          headers={headers}
          statusLabels={statusLabels}
          detailsLabel={detailsLabel}
          showTimezones={showTimezones}
          locale={locale}
        />
      )}
      renderEmptyState={() => (
        <Box sx={{ p: 2 }}>
          <ScheduleOverviewEmptyState message={emptyMessage} />
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
  title,
  selectedMetricLabel,
  searchPlaceholder,
  searchValue,
  rows,
  headers,
  statusLabels,
  detailsLabel,
  emptyMessage,
  page,
  pageSize,
  totalCount,
  onPageChange,
  onSearchChange,
  dateLabel,
  dateValue,
  todayLabel,
  previousDayLabel,
  nextDayLabel,
  teacherPlaceholder,
  selectedTeacher,
  onDateChange,
  onTeacherChange,
  loading,
  showTimezones,
  locale,
  canDashboardSearch,
  canScheduleFilterAdvanced,
}: Readonly<ScheduleOverviewViewModel>) {
  return (
    <StyledDesktopPanel elevation={0}>
      <DesktopSectionPanel
        title={<ScheduleOverviewTitle title={title} selectedMetricLabel={selectedMetricLabel} />}
        actions={
          canDashboardSearch ? (
            <ScheduleOverviewSearchField
              searchPlaceholder={searchPlaceholder}
              searchValue={searchValue}
              onSearchChange={onSearchChange}
            />
          ) : null
        }
      >
        {canScheduleFilterAdvanced ? (
          <ScheduleOverviewFilterSection
            dateLabel={dateLabel}
            dateValue={dateValue}
            todayLabel={todayLabel}
            previousDayLabel={previousDayLabel}
            nextDayLabel={nextDayLabel}
            teacherPlaceholder={teacherPlaceholder}
            selectedTeacher={selectedTeacher}
            onDateChange={onDateChange}
            onTeacherChange={onTeacherChange}
          />
        ) : null}

        <ScheduleOverviewListSection
          rows={rows}
          headers={headers}
          statusLabels={statusLabels}
          detailsLabel={detailsLabel}
          emptyMessage={emptyMessage}
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
