"use client";

import { createRangePickerVariant } from "@/frontend/common/components/ui/form/rangePickerFactory";
import { AppTimePicker } from "@/frontend/common/components/ui/form/time/AppTimePicker";
import { TimeRangePickerChrome } from "@/frontend/common/components/ui/form/time/appTimeRangePickerShared";
import { useTimeRangePickerState } from "@/frontend/common/components/ui/form/time/appTimeRangePickerSharedUtils";
import type { AppTimeRangePickerProps } from "@/frontend/common/components/ui/form/time/types/appTimeRangePickerShared.types";

const AppTimeRangePickerInner = createRangePickerVariant<
  AppTimeRangePickerProps,
  ReturnType<typeof useTimeRangePickerState>
>({
  SinglePicker: AppTimePicker,
  Chrome: TimeRangePickerChrome,
  useState: useTimeRangePickerState,
  includeMinDate: false,
});

export function AppTimeRangePicker(props: Readonly<AppTimeRangePickerProps>) {
  return <AppTimeRangePickerInner props={props} container="popover" />;
}
