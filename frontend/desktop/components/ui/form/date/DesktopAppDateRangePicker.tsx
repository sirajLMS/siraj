"use client";

import { useState } from "react";
import { DateRangePickerChrome } from "@/frontend/common/components/ui/form/date/dateRangePickerShared";
import { useDateRangePickerState } from "@/frontend/common/components/ui/form/date/dateRangePickerSharedUtils";
import type { AppDateRangePickerProps } from "@/frontend/common/components/ui/form/date/types/dateRangePickerShared.types";
import type { RangePickerSlotProps } from "@/frontend/common/components/ui/form/rangePickerShared";
import { DesktopAppDatePicker } from "@/frontend/desktop/components/ui/form/date/DesktopAppDatePicker";

export type DesktopAppDateRangePickerProps = AppDateRangePickerProps;

export function DesktopAppDateRangePicker(props: Readonly<DesktopAppDateRangePickerProps>) {
  const [anchorEl, setAnchorEl] = useState<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const state = useDateRangePickerState(props);

  const slots: RangePickerSlotProps = {
    renderFromPicker: args => (
      <DesktopAppDatePicker
        label={args.label}
        value={args.value}
        onChange={args.onChange}
        slotProps={{ textField: { size: args.size, fullWidth: true } }}
      />
    ),
    renderToPicker: args => (
      <DesktopAppDatePicker
        label={args.label}
        value={args.value}
        onChange={args.onChange}
        minDate={args.minDate}
        slotProps={{ textField: { size: args.size, fullWidth: true } }}
      />
    ),
  };

  return (
    <DateRangePickerChrome
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
