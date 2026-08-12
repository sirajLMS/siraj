"use client";

import { DateRangePickerChrome } from "@/frontend/common/components/ui/form/date/dateRangePickerShared";
import { useDateRangePickerState } from "@/frontend/common/components/ui/form/date/dateRangePickerSharedUtils";
import type { AppDateRangePickerProps } from "@/frontend/common/components/ui/form/date/types/dateRangePickerShared.types";
import { createRangePickerVariant } from "@/frontend/common/components/ui/form/rangePickerFactory";
import { DesktopAppDatePicker } from "@/frontend/desktop/components/ui/form/date/DesktopAppDatePicker";

export type DesktopAppDateRangePickerProps = AppDateRangePickerProps;

const DesktopAppDateRangePickerInner = createRangePickerVariant<
  DesktopAppDateRangePickerProps,
  ReturnType<typeof useDateRangePickerState>
>({
  SinglePicker: DesktopAppDatePicker,
  Chrome: DateRangePickerChrome,
  useState: useDateRangePickerState,
  includeMinDate: true,
});

export function DesktopAppDateRangePicker(props: Readonly<DesktopAppDateRangePickerProps>) {
  return <DesktopAppDateRangePickerInner props={props} container="popover" />;
}
