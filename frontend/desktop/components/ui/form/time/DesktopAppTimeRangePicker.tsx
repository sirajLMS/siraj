"use client";

import { createRangePickerVariant } from "@/frontend/common/components/ui/form/rangePickerFactory";
import { TimeRangePickerChrome } from "@/frontend/common/components/ui/form/time/appTimeRangePickerShared";
import { useTimeRangePickerState } from "@/frontend/common/components/ui/form/time/appTimeRangePickerSharedUtils";
import type { AppTimeRangePickerProps } from "@/frontend/common/components/ui/form/time/types/appTimeRangePickerShared.types";
import { DesktopAppTimePicker } from "@/frontend/desktop/components/ui/form/time/DesktopAppTimePicker";

export type DesktopAppTimeRangePickerProps = AppTimeRangePickerProps;

const DesktopAppTimeRangePickerInner = createRangePickerVariant<
  DesktopAppTimeRangePickerProps,
  ReturnType<typeof useTimeRangePickerState>
>({
  SinglePicker: DesktopAppTimePicker,
  Chrome: TimeRangePickerChrome,
  useState: useTimeRangePickerState,
  includeMinDate: false,
});

export function DesktopAppTimeRangePicker(props: Readonly<DesktopAppTimeRangePickerProps>) {
  return <DesktopAppTimeRangePickerInner props={props} container="popover" />;
}
