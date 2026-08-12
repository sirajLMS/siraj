"use client";

import type { DatePickerProps } from "@mui/x-date-pickers/DatePicker";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AppPickerShared } from "@/frontend/common/components/ui/form/appPickerShared";
import { ARABIC_PICKER_LOCALE_TEXT } from "@/frontend/common/components/ui/form/date/arabicPickerLocale";

export function AppDatePicker(props: Readonly<DatePickerProps>) {
  return <AppPickerShared props={props} PickerComponent={DatePicker} arabicLocaleText={ARABIC_PICKER_LOCALE_TEXT} />;
}
