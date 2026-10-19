"use client";

import { Grid, Typography } from "@mui/material";
import type { ComponentType } from "react";
import { getDateTimeFormatter } from "@/frontend/common/components/intl/dateFormat";
import {
  MiniCalendarDayCell,
  MiniCalendarHeader,
} from "@/frontend/common/views/dashboard/teachers/futureSchedule/components/miniCalendarShared.parts";
import {
  getCalendarGrid,
  useViewingMonth,
} from "@/frontend/common/views/dashboard/teachers/futureSchedule/hooks/useMiniCalendar.hooks";
import type { MiniCalendarProps } from "@/frontend/common/views/dashboard/teachers/futureSchedule/types";
import { getLatnLocaleTag } from "@/shared/lib/locale-tag";
import { useAppLocale } from "@/shared/locale";
import type { TeacherFutureScheduleLabels } from "@/shared/locale/types/dashboard/teachers/futureSchedule";

const MONTH_LONG_OPTIONS: Intl.DateTimeFormatOptions = { month: "long" };

export type MiniCalendarCardComponent = ComponentType<{
  readonly sx?: object;
  readonly children: React.ReactNode;
}>;

/** Distinct slot keys: abbreviated weekday labels repeat (S/S, T/T), so the label alone is not a valid React key. */
function buildWeekdayLabels(labels: TeacherFutureScheduleLabels) {
  return [
    { key: "sun", label: labels.weekdays.sun },
    { key: "mon", label: labels.weekdays.mon },
    { key: "tue", label: labels.weekdays.tue },
    { key: "wed", label: labels.weekdays.wed },
    { key: "thu", label: labels.weekdays.thu },
    { key: "fri", label: labels.weekdays.fri },
    { key: "sat", label: labels.weekdays.sat },
  ];
}

export function MiniCalendarShared({
  selectedDate,
  onSelectDate,
  classDates,
  labels,
  CardComponent,
}: Readonly<MiniCalendarProps> & {
  readonly CardComponent: MiniCalendarCardComponent;
}) {
  const locale = useAppLocale();
  const [{ year, month }, shiftMonth] = useViewingMonth(selectedDate);
  const dates = getCalendarGrid(year, month, classDates, selectedDate);
  const monthName = getDateTimeFormatter(getLatnLocaleTag(locale), MONTH_LONG_OPTIONS).format(new Date(year, month));
  const weekdayLabels = buildWeekdayLabels(labels);

  const handleDateClick = (num: number, muted?: boolean) => {
    if (muted) return;
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(num).padStart(2, "0")}`;
    onSelectDate(dateStr);
  };

  return (
    <CardComponent sx={{ p: 2 }}>
      <MiniCalendarHeader
        monthName={monthName}
        year={year}
        onPrev={() => shiftMonth(-1)}
        onNext={() => shiftMonth(1)}
        labels={labels}
      />
      <Grid container columns={7} sx={{ textAlign: "center" }}>
        {weekdayLabels.map(({ key, label }) => (
          <Grid size={{ xs: 1 }} key={key}>
            <Typography
              variant="labelSm"
              sx={theme => ({
                fontWeight: 700,
                color: theme.palette.onSurfaceVariant,
              })}
            >
              {label}
            </Typography>
          </Grid>
        ))}
        {dates.map(date => (
          <MiniCalendarDayCell
            key={`date-${date.num}-${date.muted}`}
            date={date}
            onClick={handleDateClick}
            labels={labels}
          />
        ))}
      </Grid>
    </CardComponent>
  );
}
