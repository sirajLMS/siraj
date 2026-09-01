"use client";

import type { ScheduleOverviewViewModel } from "@/frontend/common/views/dashboard/admin/home/scheduleOverview/useScheduleOverviewViewModel";
import { MobilePageContainer, MobilePageHeader } from "@/frontend/mobile/components/ui";
import { TeacherAutocompleteMobile } from "@/frontend/mobile/components/ui/input/userSelect";
import { createScheduleOverviewMobileCardRenderer } from "@/frontend/mobile/views/dashboard/admin/home/__shared__/scheduleOverviewCardRenderer";
import { ScheduleOverviewMobileCardList } from "@/frontend/mobile/views/dashboard/admin/home/__shared__/scheduleOverviewMobileCardList";
import {
  ScheduleOverviewMobileSection,
  ScheduleOverviewMobileToolbar,
} from "@/frontend/mobile/views/dashboard/admin/home/__shared__/scheduleOverviewSectionShared";

export function ScheduleOverviewMobileView(props: Readonly<ScheduleOverviewViewModel>) {
  const { shell, filters, columns, status, actions } = props.labelsBySection;
  const hasToolbar = props.canScheduleFilterAdvanced || props.canDashboardSearch;

  return (
    <MobilePageContainer>
      <MobilePageHeader title={shell.title} edgeToEdge={false} />
      <ScheduleOverviewMobileSection
        selectedMetricLabel={props.selectedMetricLabel}
        toolbar={
          hasToolbar ? (
            <ScheduleOverviewMobileToolbar
              labels={{
                dateLabel: filters.dateLabel,
                todayLabel: filters.todayLabel,
                previousDayLabel: filters.previousDayLabel,
                nextDayLabel: filters.nextDayLabel,
                searchPlaceholder: filters.searchPlaceholder,
              }}
              canScheduleFilterAdvanced={props.canScheduleFilterAdvanced}
              canDashboardSearch={props.canDashboardSearch}
              dateValue={props.dateValue}
              onDateChange={props.onDateChange}
              teacherSelect={
                <TeacherAutocompleteMobile
                  value={props.selectedTeacher}
                  onChange={props.onTeacherChange}
                  label={filters.teacherPlaceholder}
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
            loading={props.loading ?? false}
            emptyMessage={shell.emptyMessage}
            page={props.page}
            pageSize={props.pageSize}
            totalCount={props.totalCount}
            onPageChange={props.onPageChange}
            renderItem={createScheduleOverviewMobileCardRenderer(
              { columns, status, detailsLabel: actions.detailsLabel },
              props.showTimezones,
              props.locale
            )}
          />
        }
      />
    </MobilePageContainer>
  );
}
