// NEW FOR PLAN v5 (newly created for the migration wave): Hooks + pure-data
// helpers for the futureSchedule mini-calendar, lifted out of the previously
// inline declarations in BOTH tier files
// `frontend/{mobile,desktop}/views/dashboard/teachers/futureSchedule/components/miniCalendar.*.tsx`
// per specs.md §3 N7 (state), N9 (pure-data helpers), N25 (custom `function useX`
// declarations in tier), and §5 (custom hooks live in
// `frontend/common/views/dashboard/<domain>/hooks/`).
//
// Both tier files now import `useViewingMonth` and `getCalendarGrid`
// from here — no state, no `useX` decls,
// and no lowercase pure-data helpers remain in either tier file.

import { useState } from "react";
import type { MiniCalendarDate } from "@/frontend/common/views/dashboard/teachers/futureSchedule/types";

export type ViewingMonth = { year: number; month: number };

function parseViewingMonth(selectedDate: string): ViewingMonth {
  const d = new Date(selectedDate + "T00:00:00");
  return { year: d.getFullYear(), month: d.getMonth() };
}

export function useViewingMonth(selectedDate: string): [ViewingMonth, (delta: number) => void] {
  const [state, setState] = useState<{ selectedDate: string; viewingMonth: ViewingMonth }>(() => ({
    selectedDate,
    viewingMonth: parseViewingMonth(selectedDate),
  }));

  if (state.selectedDate !== selectedDate) {
    setState({ selectedDate, viewingMonth: parseViewingMonth(selectedDate) });
  }

  const shiftMonth = (delta: number) => {
    setState(prev => {
      const d = new Date(prev.viewingMonth.year, prev.viewingMonth.month + delta, 1);
      return { ...prev, viewingMonth: { year: d.getFullYear(), month: d.getMonth() } };
    });
  };

  return [state.viewingMonth, shiftMonth];
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
