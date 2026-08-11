// NEW FOR PLAN v5 (newly created for the migration wave): Hooks + pure-data
// helpers for the futureSchedule mini-calendar, lifted out of the previously
// inline declarations in BOTH tier files
// `frontend/{mobile,desktop}/views/dashboard/teachers/futureSchedule/components/miniCalendar.*.tsx`
// per specs.md §3 N7 (state), N9 (pure-data helpers), N25 (custom `function useX`
// declarations in tier), and §5 (custom hooks live in
// `frontend/common/views/dashboard/<domain>/hooks/`).
//
// Both tier files now import `useViewingMonth`, `getCalendarGrid`, and the
// `MINI_CALENDAR_WEEKDAYS` constant from here — no state, no `useX` decls,
// and no lowercase pure-data helpers remain in either tier file.

import { useEffect, useState } from "react";
import type { MiniCalendarDate } from "@/frontend/common/views/dashboard/teachers/futureSchedule/types";

export type ViewingMonth = { year: number; month: number };

export function useViewingMonth(selectedDate: string): [ViewingMonth, (delta: number) => void] {
  const [viewingMonth, setViewingMonth] = useState<ViewingMonth>(() => {
    const d = new Date(selectedDate + "T00:00:00");
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  useEffect(() => {
    const d = new Date(selectedDate + "T00:00:00");
    const newYear = d.getFullYear();
    const newMonth = d.getMonth();
    setViewingMonth(prev => {
      if (prev.year === newYear && prev.month === newMonth) return prev;
      return { year: newYear, month: newMonth };
    });
  }, [selectedDate]);

  const shiftMonth = (delta: number) => {
    setViewingMonth(prev => {
      const d = new Date(prev.year, prev.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  };

  return [viewingMonth, shiftMonth];
}

// NEW FOR PLAN v5: getCalendarGrid — pure-data calendar-grid builder lifted
// from both tier files (per specs.md §3 N9 + §5).
export function getCalendarGrid(
  year: number,
  month: number,
  classDates: readonly string[],
  selectedDate: string
): MiniCalendarDate[] {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const classDateSet = new Set(classDates);
  const dates: MiniCalendarDate[] = [];

  for (let i = firstDay - 1; i >= 0; i--) {
    dates.push({ num: daysInPrevMonth - i, muted: true });
  }

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    dates.push({
      num: d,
      active: dateStr === todayStr,
      selected: dateStr === selectedDate,
      dot: classDateSet.has(dateStr),
    });
  }

  const remaining = 7 - (dates.length % 7);
  if (remaining < 7) {
    for (let i = 1; i <= remaining; i++) {
      dates.push({ num: i, muted: true });
    }
  }

  return dates;
}

// NEW FOR PLAN v5: MINI_CALENDAR_WEEKDAYS — the previously inline `DAYS`
// constant (7-entry weekday header helper) lifted to a common constant file
// per specs.md §3 N5 (Record/E,K label-maps live in common).
export const MINI_CALENDAR_WEEKDAYS = [
  { id: "sun", label: "S" },
  { id: "mon", label: "M" },
  { id: "tue", label: "T" },
  { id: "wed", label: "W" },
  { id: "thu", label: "T" },
  { id: "fri", label: "F" },
  { id: "sat", label: "S" },
] as const;
