"use client";

import { useAppLocale } from "@/frontend/common/providers/localeContext";
import type { AdminDashboardViewModel } from "@/frontend/common/views/dashboard/admin/home/useAdminDashboardViewModel";
import { MobileMetricCardGrid, MobilePageContainer, MobilePageHeader } from "@/frontend/mobile/components/ui";
import { TeacherAutocompleteMobile } from "@/frontend/mobile/components/ui/input/userSelect";
import { createScheduleOverviewMobileCardRenderer } from "@/frontend/mobile/views/dashboard/admin/home/__shared__/scheduleOverviewCardRenderer";
import { ScheduleOverviewMobileCardList } from "@/frontend/mobile/views/dashboard/admin/home/__shared__/scheduleOverviewMobileCardList";
import {
  ScheduleOverviewMobileSection,
  ScheduleOverviewMobileToolbar,
} from "@/frontend/mobile/views/dashboard/admin/home/__shared__/scheduleOverviewSectionShared";

export function AdminDashboardMobileView(props: Readonly<AdminDashboardViewModel>) {
  const locale = useAppLocale();
  const { shell, filters, columns, status } = props.labelsBySection;
  const hasToolbar = props.canScheduleFilterAdvanced || props.canDashboardSearch;
  const selectedMetricKey = props.selectedMetricKey;
  const onClearMetricFilter = selectedMetricKey ? () => props.onMetricClick(selectedMetricKey) : undefined;

  return (
    <MobilePageContainer>
      <MobilePageHeader title={shell.todayClasses} subtitle={props.lastUpdated} edgeToEdge={false} />
      <MobileMetricCardGrid
        metrics={props.metrics}
        onMetricClick={props.onMetricClick}
        selectedKey={props.selectedMetricKey}
      />
      <ScheduleOverviewMobileSection
        title={shell.scheduleOverview}
        selectedMetricLabel={props.selectedMetricLabel}
        onClearMetricFilter={onClearMetricFilter}
        toolbar={
          hasToolbar ? (
            <ScheduleOverviewMobileToolbar
              labels={{
                dateLabel: filters.listOfClassesOn,
                todayLabel: filters.today,
                previousDayLabel: filters.previousDay,
                nextDayLabel: filters.nextDay,
                searchPlaceholder: shell.searchPlaceholder,
              }}
              canScheduleFilterAdvanced={props.canScheduleFilterAdvanced}
              canDashboardSearch={props.canDashboardSearch}
              dateValue={props.dateValue}
              onDateChange={props.onDateChange}
              teacherSelect={
                <TeacherAutocompleteMobile
                  value={props.selectedTeacher}
                  onChange={props.onTeacherChange}
                  label={filters.selectTeacher}
                />
              }
              searchValue={props.searchValue}
              onSearchChange={props.onSearchChange}
            />
          ) : null
        }
        list={
          <ScheduleOverviewMobileCardList
            rows={props.rows}
            loading={props.loading}
            emptyMessage={shell.noClasses}
            page={props.page}
            pageSize={props.pageSize}
            totalCount={props.totalCount}
            onPageChange={props.onPageChange}
            renderItem={createScheduleOverviewMobileCardRenderer(
              { columns, status, detailsLabel: shell.details },
              props.canScheduleViewTimezones,
              locale
            )}
          />
        }
      />
    </MobilePageContainer>
  );
}
