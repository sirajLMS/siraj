"use client";

import { SearchOutlined } from "@mui/icons-material";
import { Box, InputAdornment, Paper, Stack, TextField, Typography, useMediaQuery, useTheme } from "@mui/material";
import { styled } from "@mui/material/styles";
import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import { PaginationControls, SectionPanel, StatusBadge } from "@/frontend/components/ui";
import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import type { ScheduleOverviewData } from "@/frontend/views/dashboard/types/dashboard";
import { ScheduleFilters } from "./ScheduleFilters";
import { ScheduleOverviewCardList } from "./ScheduleOverviewCardList";
import { ScheduleOverviewDataGrid } from "./ScheduleOverviewDataGrid";

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

const StyledMobileSectionBody = styled(Stack)(({ theme }) => ({
  gap: theme.spacing(2),
  paddingInline: theme.spacing(2),
  paddingTop: theme.spacing(2.5),
  paddingBottom: theme.spacing(2),
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
        <StatusBadge category="classStatus" status="confirmed" label={selectedMetricLabel} />
      ) : null}
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
);

const MobileLayout = ({
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
}: ScheduleOverviewSectionProps) => {
  const pageCount = totalCount > 0 ? Math.ceil(totalCount / pageSize) : 0;

  return (
    <Stack direction="column" sx={{ gap: { xs: 0, md: 2 } }}>
      <SectionPanel title={title} edgeToEdge actions={
          selectedMetricLabel ? (
            <StatusBadge category="classStatus" status="confirmed" label={selectedMetricLabel} />
          ) : undefined
        }
      >
        <StyledMobileSectionBody>
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
                  backgroundColor: theme => theme.palette.surfaceContainerLowest,
                },
              }}
            />
          </RequirePermission>

        </StyledMobileSectionBody>

        <ScheduleOverviewCardList
          rows={rows}
          headers={headers}
          statusLabels={statusLabels}
          detailsLabel={detailsLabel}
          emptyMessage={emptyMessage}
        />
      </SectionPanel>

      <PaginationControls
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  return isMobile ? <MobileLayout {...props} /> : <DesktopLayout {...props} />;
}
