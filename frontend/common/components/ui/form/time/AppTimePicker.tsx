"use client";

import type { TimePickerProps } from "@mui/x-date-pickers/TimePicker";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import { AppPickerShared } from "@/frontend/common/components/ui/form/appPickerShared";
import { ARABIC_TIME_PICKER_LOCALE_TEXT } from "@/frontend/common/components/ui/form/time/arabicTimePickerLocale";

export function AppTimePicker(props: Readonly<TimePickerProps>) {
  return (
    <AppPickerShared props={props} PickerComponent={TimePicker} arabicLocaleText={ARABIC_TIME_PICKER_LOCALE_TEXT} />
  );
}
