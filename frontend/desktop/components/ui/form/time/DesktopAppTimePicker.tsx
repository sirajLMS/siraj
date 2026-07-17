"use client";

import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DesktopTimePicker, type DesktopTimePickerProps } from "@mui/x-date-pickers/DesktopTimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import type { PickersInputLocaleText } from "@mui/x-date-pickers/locales";
import { ar } from "date-fns/locale/ar";
import { useAppLocale } from "@/frontend/common/providers/localeContext";

export type DesktopAppTimePickerProps = DesktopTimePickerProps;

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

export function DesktopAppTimePicker(props: Readonly<DesktopAppTimePickerProps>) {
  const locale = useAppLocale();
  const isArabicLocale = locale === "ar";

  return (
    <LocalizationProvider
      dateAdapter={AdapterDateFns}
      adapterLocale={isArabicLocale ? ar : undefined}
      localeText={isArabicLocale ? ARABIC_PICKER_LOCALE_TEXT : undefined}
    >
      <DesktopTimePicker {...props} />
    </LocalizationProvider>
  );
}
