"use client";

import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import { PageContainer } from "@/frontend/components/ui";
import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import { StudentHistoryDesktop } from "@/frontend/views/dashboard/students/history/components/StudentHistoryDesktop";
import { StudentHistoryMobile } from "@/frontend/views/dashboard/students/history/components/StudentHistoryMobile";
import type { StudentHistoryViewProps } from "@/frontend/views/dashboard/students/history/types";

export function StudentHistoryView({
  studentName,
  currentMonth,
  metrics,
  classes,
  selectedWeek,
  selectedDay,
  onSelectWeek,
  onSelectDay,
  onPrevMonth,
  onNextMonth,
  onPrint,
}: Readonly<StudentHistoryViewProps>) {
  return (
    <PageContainer>
      <RequirePermission permissions={[AppPermission.HistoryViewCalendar]}>
        <StudentHistoryDesktop
          studentName={studentName}
          currentMonth={currentMonth}
          metrics={metrics}
          classes={classes}
          onPrevMonth={onPrevMonth}
          onNextMonth={onNextMonth}
          onPrint={onPrint}
        />
        <StudentHistoryMobile
          studentName={studentName}
          currentMonth={currentMonth}
          metrics={metrics}
          classes={classes}
          selectedWeek={selectedWeek}
          selectedDay={selectedDay}
          onSelectWeek={onSelectWeek}
          onSelectDay={onSelectDay}
          onPrevMonth={onPrevMonth}
          onNextMonth={onNextMonth}
          onPrint={onPrint}
        />
      </RequirePermission>
    </PageContainer>
  );
}
