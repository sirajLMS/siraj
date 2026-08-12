import type { PickersInputLocaleText } from "@mui/x-date-pickers/locales";

export const ARABIC_TIME_PICKER_LOCALE_TEXT = {
  cancelButtonLabel: "إلغاء",
  clearButtonLabel: "مسح",
  okButtonLabel: "موافق",
  todayButtonLabel: "اليوم",
  clockLabelText: (view: string, formattedTime: string | null) =>
    `اختر ${view === "hours" ? "الساعات" : "الدقائق"}. ${
      formattedTime === null ? "لم يتم اختيار وقت" : `الوقت المختار هو ${formattedTime}`
    }`,
  hoursClockNumberText: (hours: string) => `${hours} ساعات`,
  minutesClockNumberText: (minutes: string) => `${minutes} دقائق`,
  secondsClockNumberText: (seconds: string) => `${seconds} ثواني`,
} satisfies PickersInputLocaleText;
