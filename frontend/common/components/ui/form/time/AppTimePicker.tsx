"use client";

import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import type { PickersInputLocaleText } from "@mui/x-date-pickers/locales";
import { TimePicker, type TimePickerProps } from "@mui/x-date-pickers/TimePicker";
import { ar } from "date-fns/locale/ar";
import { useAppLocale } from "@/frontend/common/providers/localeContext";

const ARABIC_PICKER_LOCALE_TEXT = {
  cancelButtonLabel: "إلغاء",
  clearButtonLabel: "مسح",
  okButtonLabel: "موافق",
  todayButtonLabel: "اليوم",
  clockLabelText: (view, formattedTime) =>
    `اختر ${view === "hours" ? "الساعات" : "الدقائق"}. ${
      formattedTime === null ? "لم يتم اختيار وقت" : `الوقت المختار هو ${formattedTime}`
    }`,
  hoursClockNumberText: hours => `${hours} ساعات`,
  minutesClockNumberText: minutes => `${minutes} دقائق`,
  secondsClockNumberText: seconds => `${seconds} ثواني`,
} satisfies PickersInputLocaleText;

export function AppTimePicker(props: Readonly<TimePickerProps>) {
  const locale = useAppLocale();
  const isArabicLocale = locale === "ar";

  return (
    <LocalizationProvider
      dateAdapter={AdapterDateFns}
      adapterLocale={isArabicLocale ? ar : undefined}
      localeText={isArabicLocale ? ARABIC_PICKER_LOCALE_TEXT : undefined}
    >
      <TimePicker {...props} />
    </LocalizationProvider>
  );
}
