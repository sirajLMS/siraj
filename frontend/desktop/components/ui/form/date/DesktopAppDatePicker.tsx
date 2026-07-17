"use client";

import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DesktopDatePicker, type DesktopDatePickerProps } from "@mui/x-date-pickers/DesktopDatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import type { PickersInputLocaleText } from "@mui/x-date-pickers/locales";
import { ar } from "date-fns/locale/ar";
import { useAppLocale } from "@/frontend/common/providers/localeContext";

export type DesktopAppDatePickerProps = DesktopDatePickerProps;

const ARABIC_PICKER_LOCALE_TEXT = {
  previousMonth: "الشهر السابق",
  nextMonth: "الشهر التالي",
  openPreviousView: "افتح العرض السابق",
  openNextView: "افتح العرض التالي",
  calendarViewSwitchingButtonAriaLabel: view =>
    view === "year" ? "عرض السنة مفتوح، انتقل إلى عرض التقويم" : "عرض التقويم مفتوح، انتقل إلى عرض السنة",
  cancelButtonLabel: "إلغاء",
  clearButtonLabel: "مسح",
  okButtonLabel: "موافق",
  todayButtonLabel: "اليوم",
  datePickerToolbarTitle: "اختر التاريخ",
  openDatePickerDialogue: formattedDate =>
    formattedDate ? `اختر التاريخ، التاريخ المحدد هو ${formattedDate}` : "اختر التاريخ",
  fieldClearLabel: "مسح",
  dateTableLabel: "اختر التاريخ",
  fieldYearPlaceholder: params => "س".repeat(params.digitAmount),
  fieldMonthPlaceholder: params => (params.contentType === "letter" ? "شهر" : "شش"),
  fieldDayPlaceholder: () => "يي",
  year: "السنة",
  month: "الشهر",
  day: "اليوم",
  weekDay: "يوم الأسبوع",
} satisfies PickersInputLocaleText;

export function DesktopAppDatePicker(props: Readonly<DesktopAppDatePickerProps>) {
  const locale = useAppLocale();
  const isArabicLocale = locale === "ar";

  return (
    <LocalizationProvider
      dateAdapter={AdapterDateFns}
      adapterLocale={isArabicLocale ? ar : undefined}
      localeText={isArabicLocale ? ARABIC_PICKER_LOCALE_TEXT : undefined}
    >
      <DesktopDatePicker {...props} />
    </LocalizationProvider>
  );
}
