"use client";

import { SearchOutlined } from "@mui/icons-material";
import { Box, InputAdornment, Stack, TextField, Typography, useTheme } from "@mui/material";
import { styled } from "@mui/material/styles";
import type { ReactNode } from "react";
import { RequirePermission } from "@/frontend/common/components/auth/RequirePermission";
import { AppPermission } from "@/frontend/common/graphql/generated/gql/graphql-types";
import { useAppLocale } from "@/frontend/common/providers/localeContext";
import { useUserStore } from "@/frontend/common/stores/userStore";
import { ScheduleFilters } from "@/frontend/common/views/dashboard/admin/home/components/ScheduleFilters";
import type { DailyScheduleRow } from "@/frontend/common/views/dashboard/admin/home/types/schedule";
import type { AdminDashboardViewModel } from "@/frontend/common/views/dashboard/admin/home/useAdminDashboardViewModel";
import {
  MobileCardList,
  MobileCardListItem,
  MobilePaginationControls,
  MobileStatusBadge,
} from "@/frontend/mobile/components/ui";
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
  pageCount,
}: Readonly<AdminDashboardViewModel>) {
  const theme = useTheme();
  const locale = useAppLocale();
  const { hasPermission } = useUserStore();
  const showTimezones = hasPermission(AppPermission.ScheduleViewTimezones);

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
          <RequirePermission permissions={[AppPermission.ScheduleFilterAdvanced]}>
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
          </RequirePermission>

          <RequirePermission permissions={[AppPermission.DashboardSearch]}>
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
          </RequirePermission>
        </StyledMobileSectionBody>

        <MobileCardList<DailyScheduleRow>
          rows={rows as readonly DailyScheduleRow[]}
          loading={loading}
          emptyMessage={t.noClasses}
          gap={2}
          layout="edge-to-edge"
          getKey={row => row.id ?? ""}
          renderItem={renderItem}
        />
      </Box>

      <MobilePaginationControls
        page={page}
        pageCount={pageCount}
        rowCount={totalCount ?? 0}
        pageSize={pageSize}
        onPageChange={onPageChange}
      />
    </Stack>
  );
}
