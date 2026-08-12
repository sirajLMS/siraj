"use client";

import { DesktopTimePicker, type DesktopTimePickerProps } from "@mui/x-date-pickers/DesktopTimePicker";
import { AppPickerShared } from "@/frontend/common/components/ui/form/appPickerShared";
import { ARABIC_TIME_PICKER_LOCALE_TEXT } from "@/frontend/common/components/ui/form/time/arabicTimePickerLocale";

export type DesktopAppTimePickerProps = DesktopTimePickerProps;

export function DesktopAppTimePicker(props: Readonly<DesktopAppTimePickerProps>) {
  return (
    <AppPickerShared
      props={props}
      PickerComponent={DesktopTimePicker}
      arabicLocaleText={ARABIC_TIME_PICKER_LOCALE_TEXT}
    />
  );
}
