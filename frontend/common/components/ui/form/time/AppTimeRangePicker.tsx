"use client";

import { useState } from "react";
import { AppTimePicker } from "@/frontend/common/components/ui/form/time/AppTimePicker";
import { TimeRangePickerChrome } from "@/frontend/common/components/ui/form/time/appTimeRangePickerShared";
import { useTimeRangePickerState } from "@/frontend/common/components/ui/form/time/appTimeRangePickerSharedUtils";
import type {
  AppTimeRangePickerProps,
  TimeRangePickerSlotProps,
} from "@/frontend/common/components/ui/form/time/types/appTimeRangePickerShared.types";

export function AppTimeRangePicker(props: Readonly<AppTimeRangePickerProps>) {
  const [anchorEl, setAnchorEl] = useState<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const state = useTimeRangePickerState(props);

  const slots: TimeRangePickerSlotProps = {
    renderFromPicker: args => (
      <AppTimePicker
        label={args.label}
        value={args.value}
        onChange={args.onChange}
        slotProps={{ textField: { size: args.size, fullWidth: true } }}
      />
    ),
    renderToPicker: args => (
      <AppTimePicker
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
      container="popover"
      anchorEl={anchorEl}
      setAnchorEl={setAnchorEl}
    />
  );
}
