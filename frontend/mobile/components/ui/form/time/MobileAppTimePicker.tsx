"use client";

import { MobileTimePicker, type MobileTimePickerProps } from "@mui/x-date-pickers/MobileTimePicker";
import { AppPickerShared } from "@/frontend/common/components/ui/form/appPickerShared";
import { ARABIC_TIME_PICKER_LOCALE_TEXT } from "@/frontend/common/components/ui/form/time/arabicTimePickerLocale";

export type MobileAppTimePickerProps = MobileTimePickerProps;

export function MobileAppTimePicker(props: Readonly<MobileAppTimePickerProps>) {
  return (
    <AppPickerShared
      props={props}
      PickerComponent={MobileTimePicker}
      arabicLocaleText={ARABIC_TIME_PICKER_LOCALE_TEXT}
    />
  );
}
