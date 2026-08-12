"use client";

import { useState } from "react";
import type { RangePickerSlotProps } from "@/frontend/common/components/ui/form/rangePickerShared";
import { TimeRangePickerChrome } from "@/frontend/common/components/ui/form/time/appTimeRangePickerShared";
import { useTimeRangePickerState } from "@/frontend/common/components/ui/form/time/appTimeRangePickerSharedUtils";
import type { AppTimeRangePickerProps } from "@/frontend/common/components/ui/form/time/types/appTimeRangePickerShared.types";
import { DesktopAppTimePicker } from "@/frontend/desktop/components/ui/form/time/DesktopAppTimePicker";

export type DesktopAppTimeRangePickerProps = AppTimeRangePickerProps;

export function DesktopAppTimeRangePicker(props: Readonly<DesktopAppTimeRangePickerProps>) {
  const [anchorEl, setAnchorEl] = useState<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const state = useTimeRangePickerState(props);

  const slots: RangePickerSlotProps = {
    renderFromPicker: args => (
      <DesktopAppTimePicker
        label={args.label}
        value={args.value}
        onChange={args.onChange}
        slotProps={{ textField: { size: args.size, fullWidth: true } }}
      />
    ),
    renderToPicker: args => (
      <DesktopAppTimePicker
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
