"use client";

import { DateRangePickerChrome } from "@/frontend/common/components/ui/form/date/dateRangePickerShared";
import { useDateRangePickerState } from "@/frontend/common/components/ui/form/date/dateRangePickerSharedUtils";
import type { AppDateRangePickerProps } from "@/frontend/common/components/ui/form/date/types/dateRangePickerShared.types";
import { createRangePickerVariant } from "@/frontend/common/components/ui/form/rangePickerFactory";
import { MobileAppDatePicker } from "@/frontend/mobile/components/ui/form/date/MobileAppDatePicker";

export type MobileAppDateRangePickerProps = AppDateRangePickerProps;

const MobileAppDateRangePickerInner = createRangePickerVariant<
  MobileAppDateRangePickerProps,
  ReturnType<typeof useDateRangePickerState>
>({
  SinglePicker: MobileAppDatePicker,
  Chrome: DateRangePickerChrome,
  useState: useDateRangePickerState,
  includeMinDate: true,
});

export function MobileAppDateRangePicker(props: Readonly<MobileAppDateRangePickerProps>) {
  return <MobileAppDateRangePickerInner props={props} container="drawer" />;
}
