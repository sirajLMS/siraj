"use client";

import { useState } from "react";
import { TimeRangePickerChrome } from "@/frontend/common/components/ui/form/time/appTimeRangePickerShared";
import { useTimeRangePickerState } from "@/frontend/common/components/ui/form/time/appTimeRangePickerSharedUtils";
import type {
  AppTimeRangePickerProps,
  TimeRangePickerSlotProps,
} from "@/frontend/common/components/ui/form/time/types/appTimeRangePickerShared.types";
import { MobileAppTimePicker } from "@/frontend/mobile/components/ui/form/time/MobileAppTimePicker";

export type MobileAppTimeRangePickerProps = AppTimeRangePickerProps;

export function MobileAppTimeRangePicker(props: Readonly<MobileAppTimeRangePickerProps>) {
  const [open, setOpen] = useState(false);
  const state = useTimeRangePickerState(props);

  const slots: TimeRangePickerSlotProps = {
    renderFromPicker: args => (
      <MobileAppTimePicker
        label={args.label}
        value={args.value}
        onChange={args.onChange}
        slotProps={{ textField: { size: args.size, fullWidth: true } }}
      />
    ),
    renderToPicker: args => (
      <MobileAppTimePicker
        label={args.label}
        value={args.value}
        onChange={args.onChange}
        slotProps={{ textField: { size: args.size, fullWidth: true } }}
      />
    ),
  };

  return (
    <TimeRangePickerChrome
      props={props}
      state={state}
      slots={slots}
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      container="drawer"
    />
  );
}
