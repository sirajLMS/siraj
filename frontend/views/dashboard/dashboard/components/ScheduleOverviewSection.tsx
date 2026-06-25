"use client";

import { SearchOutlined } from "@mui/icons-material";
import { Box, Chip, InputAdornment, Paper, Stack, TextField, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import { SectionPanel } from "@/frontend/components/ui";
import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import type { ScheduleOverviewData } from "@/frontend/views/dashboard/types/dashboard";
import { ScheduleFilters } from "./ScheduleFilters";
import { ScheduleOverviewCardList } from "./ScheduleOverviewCardList";
import { ScheduleOverviewDataGrid } from "./ScheduleOverviewDataGrid";
import { ScheduleOverviewPaginationControls } from "./ScheduleOverviewPagination";

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

const StyledMobileSectionHeader = styled(Box)(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
  flexWrap: "wrap",
}));

const StyledMobileSectionTitle = styled(Typography)(({ theme }) => ({
  color: theme.palette.primary.main,
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
      {selectedMetricLabel ? <Chip size="small" color="primary" variant="outlined" label={selectedMetricLabel} /> : null}
    </>
  );
}

function ScheduleOverviewFilters({
  dateLabel,
  dateValue,
  todayLabel,
  previousDayLabel,
  nextDayLabel,
  teacherPlaceholder,
  teacherValue,
  submitLabel,
  teachers,
  onDateChange,
  onTeacherChange,
  onSubmit,
}: Pick<
  ScheduleOverviewSectionProps,
  | "dateLabel"
  | "dateValue"
  | "todayLabel"
  | "previousDayLabel"
  | "nextDayLabel"
  | "teacherPlaceholder"
  | "teacherValue"
  | "submitLabel"
  | "teachers"
  | "onDateChange"
  | "onTeacherChange"
  | "onSubmit"
>) {
  return (
    <RequirePermission permissions={[AppPermission.ScheduleFilterAdvanced]}>
      <ScheduleFilters
        dateLabel={dateLabel}
        dateValue={dateValue}
        todayLabel={todayLabel}
        previousDayLabel={previousDayLabel}
        nextDayLabel={nextDayLabel}
        teacherPlaceholder={teacherPlaceholder}
        teacherValue={teacherValue}
        submitLabel={submitLabel}
        teachers={teachers}
        onDateChange={onDateChange}
        onTeacherChange={onTeacherChange}
        onSubmit={onSubmit}
      />
    </RequirePermission>
  );
}

export interface ScheduleOverviewSectionProps extends ScheduleOverviewData {
  readonly title: string;
}

const DesktopLayout = ({
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
  teacherValue,
  submitLabel,
  teachers,
  onDateChange,
  onTeacherChange,
  onSubmit,
}: ScheduleOverviewSectionProps) => (
  <Box sx={{ display: { xs: "none", md: "block" } }}>
    <StyledDesktopPanel elevation={0}>
      <SectionPanel
        title={<ScheduleOverviewTitle title={title} selectedMetricLabel={selectedMetricLabel} />}
        actions={
          <RequirePermission permissions={[AppPermission.DashboardSearch]}>
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
          </RequirePermission>
        }
      >
        <StyledFilterContainer>
          <ScheduleOverviewFilters
            dateLabel={dateLabel}
            dateValue={dateValue}
            todayLabel={todayLabel}
            previousDayLabel={previousDayLabel}
            nextDayLabel={nextDayLabel}
            teacherPlaceholder={teacherPlaceholder}
            teacherValue={teacherValue}
            submitLabel={submitLabel}
            teachers={teachers}
            onDateChange={onDateChange}
            onTeacherChange={onTeacherChange}
            onSubmit={onSubmit}
          />
        </StyledFilterContainer>

        <ScheduleOverviewDataGrid
          rows={rows}
          page={page}
          pageSize={pageSize}
          totalCount={totalCount}
          onPageChange={onPageChange}
          headers={headers}
          statusLabels={statusLabels}
          detailsLabel={detailsLabel}
          emptyMessage={emptyMessage}
        />
      </SectionPanel>
    </StyledDesktopPanel>
  </Box>
);

const MobileLayout = ({
  title,
  selectedMetricLabel,
  searchPlaceholder,
  searchValue,
  rows,
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
  teacherValue,
  submitLabel,
  teachers,
  onDateChange,
  onTeacherChange,
  onSubmit,
}: ScheduleOverviewSectionProps) => {
  const pageCount = totalCount > 0 ? Math.ceil(totalCount / pageSize) : 0;

  return (
    <Stack
      direction="column"
      sx={{
        display: { xs: "flex", md: "none" },
        gap: 2,
      }}
    >
      <StyledMobileSectionHeader>
        <StyledMobileSectionTitle variant="titleLg">{title}</StyledMobileSectionTitle>
        {selectedMetricLabel ? (
          <Chip size="small" color="primary" variant="outlined" label={selectedMetricLabel} />
        ) : null}
      </StyledMobileSectionHeader>

      <ScheduleOverviewFilters
        dateLabel={dateLabel}
        dateValue={dateValue}
        todayLabel={todayLabel}
        previousDayLabel={previousDayLabel}
        nextDayLabel={nextDayLabel}
        teacherPlaceholder={teacherPlaceholder}
        teacherValue={teacherValue}
        submitLabel={submitLabel}
        teachers={teachers}
        onDateChange={onDateChange}
        onTeacherChange={onTeacherChange}
        onSubmit={onSubmit}
      />

      <Box sx={{ display: "flex", gap: 1.5 }}>
        <RequirePermission permissions={[AppPermission.DashboardSearch]}>
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
                bgcolor: theme => theme.palette.surfaceContainerLowest,
              },
            }}
          />
        </RequirePermission>
      </Box>

      <ScheduleOverviewCardList
        rows={rows}
        statusLabels={statusLabels}
        detailsLabel={detailsLabel}
        emptyMessage={emptyMessage}
      />

      <ScheduleOverviewPaginationControls
        page={page}
        pageCount={pageCount}
        rowCount={totalCount}
        pageSize={pageSize}
        onPageChange={onPageChange}
      />
    </Stack>
  );
};

export function ScheduleOverviewSection(props: ScheduleOverviewSectionProps) {
  return (
    <>
      <DesktopLayout {...props} />
      <MobileLayout {...props} />
    </>
  );
}
