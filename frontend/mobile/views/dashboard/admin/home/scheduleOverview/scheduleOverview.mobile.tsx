"use client";

import { SearchOutlined } from "@mui/icons-material";
import { Box, InputAdornment, Stack, TextField, Typography, useTheme } from "@mui/material";
import { styled } from "@mui/material/styles";
import type { ReactNode } from "react";
import { buildServerPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";
import { ScheduleFilters } from "@/frontend/common/views/dashboard/admin/home/components/ScheduleFilters";
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
  selectedTeacher,
  onDateChange,
  onTeacherChange,
  loading,
  showTimezones,
  locale,
  // NEW FOR PLAN v5: lifted permission booleans consumed by the tier view
  // instead of the previous `RequirePermission` wrappers.
  canDashboardSearch,
  canScheduleFilterAdvanced,
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
            <MobileStatusBadge category="classStatus" status="confirmed" label={selectedMetricLabel} />
          ) : null}
        </StyledSectionTitleRow>

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
                <TeacherAutocompleteMobile
                  value={selectedTeacher}
                  onChange={onTeacherChange}
                  label={teacherPlaceholder}
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

        <MobileCardList<DailyScheduleRow>
          rows={rows}
          loading={loading}
          emptyMessage={emptyMessage}
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
      </Box>
    </Stack>
  );
}
