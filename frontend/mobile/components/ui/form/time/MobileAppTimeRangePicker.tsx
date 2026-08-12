"use client";

import { createRangePickerVariant } from "@/frontend/common/components/ui/form/rangePickerFactory";
import { TimeRangePickerChrome } from "@/frontend/common/components/ui/form/time/appTimeRangePickerShared";
import { useTimeRangePickerState } from "@/frontend/common/components/ui/form/time/appTimeRangePickerSharedUtils";
import type { AppTimeRangePickerProps } from "@/frontend/common/components/ui/form/time/types/appTimeRangePickerShared.types";
import { MobileAppTimePicker } from "@/frontend/mobile/components/ui/form/time/MobileAppTimePicker";

export type MobileAppTimeRangePickerProps = AppTimeRangePickerProps;

const MobileAppTimeRangePickerInner = createRangePickerVariant<
  MobileAppTimeRangePickerProps,
  ReturnType<typeof useTimeRangePickerState>
>({
  SinglePicker: MobileAppTimePicker,
  Chrome: TimeRangePickerChrome,
  useState: useTimeRangePickerState,
  includeMinDate: false,
});

export function MobileAppTimeRangePicker(props: Readonly<MobileAppTimeRangePickerProps>) {
  return <MobileAppTimeRangePickerInner props={props} container="drawer" />;
}
