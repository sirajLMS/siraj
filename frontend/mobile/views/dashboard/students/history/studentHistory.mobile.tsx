"use client";

import { useMemo } from "react";
import { ProfileRestrictedSection } from "@/frontend/common/views/dashboard/profile/shared/sections/ProfileRestrictedSection";
import { StudentHistoryLabelsProvider } from "@/frontend/common/views/dashboard/students/history/studentHistoryLabelsContext";
import type { ClassSession } from "@/frontend/common/views/dashboard/students/history/types";
import type { StudentHistoryViewModel } from "@/frontend/common/views/dashboard/students/history/useStudentHistoryViewModel";
import { useStudentFieldAccess } from "@/frontend/common/views/dashboard/students/profile/useStudentFieldAccess";
import { MobilePageContainer } from "@/frontend/mobile/components/ui/container/page";
import { ClassSessionListMobile } from "@/frontend/mobile/views/dashboard/students/history/components/classSessionList.mobile";
import { HistoryMobileHeader } from "@/frontend/mobile/views/dashboard/students/history/components/historyHeader.mobile";
import { HistoryMobileMetricsGrid } from "@/frontend/mobile/views/dashboard/students/history/components/historyMetricsGrid.mobile";
import { HistoryMobileActions } from "@/frontend/mobile/views/dashboard/students/history/components/historyMonthActions.mobile";
import { MobileWeeklyScroller } from "@/frontend/mobile/views/dashboard/students/history/components/mobileWeeklyScroller.mobile";
import { PerformanceStreakMobile } from "@/frontend/mobile/views/dashboard/students/history/components/performanceStreak.mobile";
import { deriveStreakDays } from "@/frontend/mobile/views/dashboard/students/history/studentHistory.helpers";
import { getLatnLocaleTag } from "@/shared/lib/locale-tag";

export function StudentHistoryMobileView({
  studentName,
  currentMonth,
  metrics,
  classes,
  selectedWeek,
  selectedDay,
  embedded = false,
  onSelectWeek,
  onSelectDay,
  onPrevMonth,
  onNextMonth,
  onPrint,
  enrollmentMonth,
  nowMonth,
  locale,
  labels,
}: Readonly<StudentHistoryViewModel>) {
  const { canView } = useStudentFieldAccess();
  const monthStr = currentMonth.toLocaleString(getLatnLocaleTag(locale), { month: "long" });

  const selectedDaySessions: ClassSession[] = useMemo(() => {
    if (selectedDay === null) return [];
    const session = classes[selectedDay];
    return session ? [session] : [];
  }, [selectedDay, classes]);

  const dateStr = selectedDay === null ? monthStr : labels.classDetails.dayOfMonth(selectedDay, monthStr);

  const streakDays = useMemo(
    () => deriveStreakDays(classes, currentMonth, selectedWeek),
    [classes, currentMonth, selectedWeek]
  );

  const canGoPrev = !enrollmentMonth || currentMonth > enrollmentMonth;
  const canGoNext = !nowMonth || currentMonth < nowMonth;

  if (!canView("student_history")) {
    const restricted = <ProfileRestrictedSection title={labels.pageTitle("{name}")} />;
    return embedded ? restricted : <MobilePageContainer>{restricted}</MobilePageContainer>;
  }

  const body = (
    <>
      <HistoryMobileHeader studentName={studentName} monthStr={monthStr} />
      <HistoryMobileMetricsGrid metrics={metrics} />
      <HistoryMobileActions
        currentMonth={currentMonth}
        onPrevMonth={onPrevMonth}
        onNextMonth={onNextMonth}
        onPrint={onPrint}
        canGoPrev={canGoPrev}
        canGoNext={canGoNext}
      />
      <MobileWeeklyScroller
        selectedWeek={selectedWeek}
        selectedDay={selectedDay}
        currentMonth={currentMonth}
        classes={classes}
        onSelectWeek={onSelectWeek}
        onSelectDay={onSelectDay}
      />
      <ClassSessionListMobile dateStr={dateStr} sessions={selectedDaySessions} />
      <PerformanceStreakMobile streakDays={streakDays} />
    </>
  );

  if (embedded) {
    return <StudentHistoryLabelsProvider labels={labels}>{body}</StudentHistoryLabelsProvider>;
  }

  return (
    <StudentHistoryLabelsProvider labels={labels}>
      <MobilePageContainer>{body}</MobilePageContainer>
    </StudentHistoryLabelsProvider>
  );
}
