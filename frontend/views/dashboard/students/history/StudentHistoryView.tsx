"use client";

import { RequirePermission } from "@/frontend/components/auth/RequirePermission";
import { PageContainer } from "@/frontend/components/ui/PageContainer";
import { AppPermission } from "@/frontend/graphql/generated/gql/graphql-types";
import { StudentHistoryDesktop } from "./components/StudentHistoryDesktop";
import { StudentHistoryMobile } from "./components/StudentHistoryMobile";
import type { ClassSession, StudentHistoryMetrics } from "./types";

interface StudentHistoryViewProps {
  studentName: string;
  currentMonth: Date;
  metrics: StudentHistoryMetrics;
  classes: Readonly<Partial<Record<number, ClassSession>>>;
  selectedWeek: number;
  onSelectWeek: (week: number) => void;
  onMonthChange?: (date: Date) => void;
}

export function StudentHistoryView({
  studentName,
  currentMonth,
  metrics,
  classes,
  selectedWeek,
  onSelectWeek,
  onMonthChange,
}: Readonly<StudentHistoryViewProps>) {
  const handleMonthChange = () => {
    if (!onMonthChange) return;
    const nextMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
    onMonthChange(nextMonth);
  };

  return (
    <PageContainer>
      <RequirePermission permissions={[AppPermission.HistoryViewCalendar]}>
        <StudentHistoryDesktop
          studentName={studentName}
          currentMonth={currentMonth}
          metrics={metrics}
          classes={classes}
          onChangeMonth={handleMonthChange}
        />
        <StudentHistoryMobile
          studentName={studentName}
          currentMonth={currentMonth}
          metrics={metrics}
          classes={classes}
          selectedWeek={selectedWeek}
          onSelectWeek={onSelectWeek}
          onChangeMonth={handleMonthChange}
        />
      </RequirePermission>
    </PageContainer>
  );
}
