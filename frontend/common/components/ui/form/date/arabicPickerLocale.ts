import type { PickersInputLocaleText } from "@mui/x-date-pickers/locales";

export const ARABIC_PICKER_LOCALE_TEXT = {
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
