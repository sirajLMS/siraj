export interface CalendarGridLayout {
  readonly daysInMonth: number;
  readonly emptyStartDays: readonly number[];
  readonly emptyEndDays: readonly number[];
}

export function computeCalendarGridLayout(currentMonth: Date): CalendarGridLayout {
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();

  const emptyStartDays = Array.from({ length: firstDayOfMonth }, (_, i) => {
    const prevMonthDays = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 0).getDate();
    return prevMonthDays - firstDayOfMonth + i + 1;
  });

  const remainingCells = 35 - (emptyStartDays.length + daysInMonth);
  const emptyEndDays = Array.from(
    { length: remainingCells > 0 ? remainingCells : remainingCells + 7 },
    (_, i) => i + 1
  );

  return { daysInMonth, emptyStartDays, emptyEndDays };
}
