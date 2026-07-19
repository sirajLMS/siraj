"use client";

import { SearchOutlined } from "@mui/icons-material";
import { Box, InputAdornment, Stack, TextField, Typography, useTheme } from "@mui/material";
import { styled } from "@mui/material/styles";
import type { ReactNode } from "react";
import { useAppLocale } from "@/frontend/common/providers/localeContext";
import { ScheduleFilters } from "@/frontend/common/views/dashboard/admin/home/components/ScheduleFilters";
import type { DailyScheduleRow } from "@/frontend/common/views/dashboard/admin/home/types/schedule";
import { buildServerPaginationOptions } from "@/frontend/common/components/ui/filter/listPaginationOptions";
import type { AdminDashboardViewModel } from "@/frontend/common/views/dashboard/admin/home/useAdminDashboardViewModel";
import { MobileCardList, MobileCardListItem, MobileStatusBadge } from "@/frontend/mobile/components/ui";
import { ScheduleOverviewMobileCard } from "@/frontend/mobile/views/dashboard/admin/home/scheduleOverview/components/scheduleOverviewCard.mobile";

const StyledSearchIcon = styled(SearchOutlined)(({ theme }) => ({
  fontSize: 18,
  color: theme.palette.onSurfaceVariant,
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

const StyledMobileSectionBody = styled(Stack)(({ theme }) => ({
  gap: theme.spacing(2),
  paddingInline: theme.spacing(2),
  paddingTop: theme.spacing(2.5),
  paddingBottom: theme.spacing(2),
}));

export function AdminDashboardMobileView({
  t,
  loading,
  selectedMetricLabel,
  searchValue,
  dateValue,
  teacherValue,
  teachers,
  rows,
  headers,
  statusLabels,
  page,
  totalCount,
  onPageChange,
  onSearchChange,
  onDateChange,
  onTeacherChange,
  onSubmit,
  pageSize,
  // NEW FOR PLAN v5: lifted permission booleans consumed by the tier view
  // instead of the previous `RequirePermission` wrappers + `useUserStore()`.
  canDashboardSearch,
  canScheduleFilterAdvanced,
  canScheduleViewTimezones,
}: Readonly<AdminDashboardViewModel>) {
  const theme = useTheme();
  const locale = useAppLocale();
  const showTimezones = canScheduleViewTimezones;

  const renderItem = (row: DailyScheduleRow): ReactNode => (
    <MobileCardListItem variant="edge-to-edge">
      <ScheduleOverviewMobileCard
        row={row}
        headers={headers}
        statusLabels={statusLabels}
        detailsLabel={t.details}
        showTimezones={showTimezones}
        locale={locale}
      />
    </MobileCardListItem>
  );

  return (
    <Stack direction="column" sx={{ gap: { xs: 0, md: 2 } }}>
      <Box sx={{ display: "flex", flexDirection: "column" }}>
        <StyledSectionTitleRow>
          <StyledSectionTitle variant="titleLg">{t.scheduleOverview}</StyledSectionTitle>
          {selectedMetricLabel ? (
            <MobileStatusBadge category="classStatus" status="confirmed" label={selectedMetricLabel} />
          ) : null}
        </StyledSectionTitleRow>

        <StyledMobileSectionBody>
          {canScheduleFilterAdvanced ? (
            <ScheduleFilters
              dateLabel={t.listOfClassesOn}
              dateValue={dateValue}
              todayLabel={t.today}
              previousDayLabel={t.previousDay}
              nextDayLabel={t.nextDay}
              teacherPlaceholder={t.selectTeacher}
              teacherValue={teacherValue}
              submitLabel={t.submit}
              teachers={teachers}
              onDateChange={onDateChange}
              onTeacherChange={onTeacherChange}
              onSubmit={onSubmit}
            />
          ) : null}

          {canDashboardSearch ? (
            <TextField
              placeholder={t.searchPlaceholder}
              value={searchValue}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
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
          rows={rows as readonly DailyScheduleRow[]}
          loading={loading}
          emptyMessage={t.noClasses}
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
