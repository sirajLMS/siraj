"use client";

import { SearchOutlined } from "@mui/icons-material";
import { Box, InputAdornment, Stack, TextField, Typography, useTheme } from "@mui/material";
import { styled } from "@mui/material/styles";
import type { ReactNode } from "react";
import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import { MobileCardList, MobileCardListItem, PaginationControls, StatusBadge } from "@/frontend/components/ui";
import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import { ScheduleFilters } from "@/frontend/views/dashboard/admin/home/components/ScheduleFilters";
import { ScheduleOverviewMobileCard } from "@/frontend/views/dashboard/admin/home/scheduleOverview/mobile/components/scheduleOverviewCard.mobile";
import type { ScheduleOverviewViewModel } from "@/frontend/views/dashboard/admin/home/scheduleOverview/useScheduleOverviewViewModel";
import type { DailyScheduleRow } from "@/frontend/views/dashboard/admin/home/types/schedule";

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

export function ScheduleOverviewMobileView({
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
  loading,
  pageCount,
  showTimezones,
  locale,
}: Readonly<ScheduleOverviewViewModel>) {
  const theme = useTheme();

  const renderItem = (row: DailyScheduleRow): ReactNode => (
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

  return (
    <Stack direction="column" sx={{ gap: { xs: 0, md: 2 } }}>
      <Box sx={{ display: "flex", flexDirection: "column" }}>
        <StyledSectionTitleRow>
          <StyledSectionTitle variant="titleLg">{title}</StyledSectionTitle>
          {selectedMetricLabel ? (
            <StatusBadge category="classStatus" status="confirmed" label={selectedMetricLabel} />
          ) : null}
        </StyledSectionTitleRow>

        <StyledMobileSectionBody>
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
                  backgroundColor: theme.palette.surfaceContainerLowest,
                },
              }}
            />
          </RequirePermission>
        </StyledMobileSectionBody>

        <MobileCardList<DailyScheduleRow>
          rows={rows as readonly DailyScheduleRow[]}
          loading={loading}
          emptyMessage={emptyMessage}
          gap={2}
          layout="edge-to-edge"
          getKey={row => row.id ?? ""}
          renderItem={renderItem}
        />
      </Box>

      <PaginationControls
        page={page}
        pageCount={pageCount}
        rowCount={totalCount ?? 0}
        pageSize={pageSize}
        onPageChange={onPageChange}
      />
    </Stack>
  );
}
