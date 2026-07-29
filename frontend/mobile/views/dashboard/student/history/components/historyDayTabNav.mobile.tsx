"use client";

import { useMemo } from "react";
import type { DateTabNavItem } from "@/frontend/common/views/dashboard/components/genericTabNav.types";
import type { StudentHistoryViewModel } from "@/frontend/common/views/dashboard/student/history/useStudentHistoryViewModel";
import { GenericTabNavMobileView } from "@/frontend/mobile/views/dashboard/components/genericTabNav.mobile";
import type { StudentPortalHistoryCalendarWeekdayLabels } from "@/shared/locale/types/dashboard/studentPortal/studentHistory";

const WEEKDAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

function weekdayLabelForDay(
  currentMonth: Date,
  day: number,
  calendarWeekdays: StudentPortalHistoryCalendarWeekdayLabels
): string {
  const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
  const key = WEEKDAY_KEYS[date.getDay()];
  return calendarWeekdays[key];
}

function buildMonthDayTabs(
  currentMonth: Date,
  daysWithSessions: ReadonlySet<number>,
  calendarWeekdays: StudentPortalHistoryCalendarWeekdayLabels
): readonly DateTabNavItem[] {
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const tabs: DateTabNavItem[] = [];

  for (let day = 1; day <= daysInMonth; day++) {
    tabs.push({
      id: String(day),
      weekdayLabel: weekdayLabelForDay(currentMonth, day, calendarWeekdays),
      dayNumber: day,
      hasSession: daysWithSessions.has(day),
    });
  }

  return tabs;
}

export interface HistoryDayTabNavMobileProps {
  readonly currentMonth: StudentHistoryViewModel["currentMonth"];
  readonly effectiveSelectedDay: StudentHistoryViewModel["effectiveSelectedDay"];
  readonly daysWithSessions: StudentHistoryViewModel["daysWithSessions"];
  readonly labels: StudentHistoryViewModel["labels"];
  readonly onTabChange: StudentHistoryViewModel["onTabChange"];
}

export function HistoryDayTabNavMobile({
  currentMonth,
  effectiveSelectedDay,
  daysWithSessions,
  labels,
  onTabChange,
}: Readonly<HistoryDayTabNavMobileProps>) {
  const tabs = useMemo(
    () => buildMonthDayTabs(currentMonth, daysWithSessions, labels.calendarWeekdays),
    [currentMonth, daysWithSessions, labels.calendarWeekdays]
  );

  return (
    <GenericTabNavMobileView
      variant="date"
      mode="button"
      activeTab={String(effectiveSelectedDay)}
      tabs={tabs}
      onTabChange={onTabChange}
      ariaLabel={labels.lessonHistory}
    />
  );
}
