"use client";

import { Box } from "@mui/material";
import { pickSearchScheduleFormProps } from "@/frontend/common/views/dashboard/search-schedule/components/searchScheduleFormPropsPicker";
import { SearchScheduleFormSectionShared } from "@/frontend/common/views/dashboard/search-schedule/components/searchScheduleFormSectionShared";
import type { SearchScheduleViewModel } from "@/frontend/common/views/dashboard/search-schedule/useSearchScheduleViewModel";
import { getColumnCount } from "@/frontend/common/views/dashboard/search-schedule/utils";
import { MobilePageContainer, MobilePageHeader } from "@/frontend/mobile/components/ui";
import { SearchScheduleFormMobile } from "@/frontend/mobile/views/dashboard/search-schedule/components/searchScheduleForm.mobile";
import { TeacherAvailabilityMonthDrawerMobile } from "@/frontend/mobile/views/dashboard/search-schedule/components/teacherAvailabilityMonthDrawer.mobile";
import { MOBILE_ERROR_SX } from "@/frontend/mobile/views/dashboard/search-schedule/searchSchedule.constants";
import { SearchScheduleMobileBody } from "@/frontend/mobile/views/dashboard/search-schedule/searchSchedule.parts";

export function SearchScheduleMobileView({
  labels,
  searchResult,
  fromDate,
  toDate,
  isInitialLoading,
  error,
  pageInfo,
  teacherCount,
  showPaginationFooter,
  ...rest
}: Readonly<SearchScheduleViewModel>) {
  const columnCount = getColumnCount(fromDate, toDate);

  return (
    <MobilePageContainer
      sx={theme => ({
        display: "flex",
        flexDirection: "column",
        gap: 1,
        minHeight: `calc(100dvh - ${theme.layout.navbarHeight} - ${theme.layout.bottomNavHeight} - ${theme.spacing(4)})`,
      })}
    >
      <MobilePageHeader title={labels.pageTitle} titleVariant="headlineLg" edgeToEdge={false} />

      <Box
        sx={{
          mt: 0,
          display: "flex",
          flexDirection: "column",
          flex: 1,
          gap: 1,
          minHeight: 0,
        }}
      >
        <SearchScheduleFormSectionShared
          FormComponent={SearchScheduleFormMobile}
          error={error ? labels.errorLoading : null}
          errorSx={MOBILE_ERROR_SX}
          {...pickSearchScheduleFormProps({ labels, isInitialLoading, ...rest })}
        />

        <SearchScheduleMobileBody
          isInitialLoading={isInitialLoading}
          searchResult={searchResult}
          columnCount={columnCount}
          fromDate={fromDate}
          toDate={toDate}
          labels={labels}
          onOpenMonthDrawer={rest.onOpenMonthDrawer}
          pageInfo={pageInfo}
          teacherCount={teacherCount}
          onPageChange={rest.onPageChange}
          showPaginationFooter={showPaginationFooter}
        />
      </Box>

      <TeacherAvailabilityMonthDrawerMobile
        labels={labels}
        open={rest.monthDrawerOpen}
        teacher={rest.monthDrawerTeacher}
        currentMonth={rest.monthDrawerCurrentMonth}
        monthDrawerLoading={rest.monthDrawerLoading}
        monthDrawerError={rest.monthDrawerError}
        daysByDate={rest.monthDrawerDaysByDate}
        onClose={rest.onCloseMonthDrawer}
        onMonthChange={rest.onMonthDrawerChangeMonth}
      />
    </MobilePageContainer>
  );
}
