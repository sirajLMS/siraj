"use client";

import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import { PageContainer } from "@/frontend/components/ui/PageContainer";
import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import { StudentHistoryDesktop } from "./components/StudentHistoryDesktop";
import { StudentHistoryMobile } from "./components/StudentHistoryMobile";
import type { StudentHistoryViewProps } from "./types";

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
