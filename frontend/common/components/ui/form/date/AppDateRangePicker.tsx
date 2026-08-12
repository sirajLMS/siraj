"use client";

import { AppDatePicker } from "@/frontend/common/components/ui/form/date/AppDatePicker";
import { DateRangePickerChrome } from "@/frontend/common/components/ui/form/date/dateRangePickerShared";
import { useDateRangePickerState } from "@/frontend/common/components/ui/form/date/dateRangePickerSharedUtils";
import type { AppDateRangePickerProps } from "@/frontend/common/components/ui/form/date/types/dateRangePickerShared.types";
import { createRangePickerVariant } from "@/frontend/common/components/ui/form/rangePickerFactory";

const AppDateRangePickerInner = createRangePickerVariant<
  AppDateRangePickerProps,
  ReturnType<typeof useDateRangePickerState>
>({
  SinglePicker: AppDatePicker,
  Chrome: DateRangePickerChrome,
  useState: useDateRangePickerState,
  includeMinDate: true,
});

export function AppDateRangePicker(props: Readonly<AppDateRangePickerProps>) {
  return <AppDateRangePickerInner props={props} container="popover" />;
}
