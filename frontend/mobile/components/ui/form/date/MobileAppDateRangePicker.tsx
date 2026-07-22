"use client";

import { useState } from "react";
import { DateRangePickerChrome } from "@/frontend/common/components/ui/form/date/dateRangePickerShared";
import { useDateRangePickerState } from "@/frontend/common/components/ui/form/date/dateRangePickerSharedUtils";
import type {
  AppDateRangePickerProps,
  DateRangePickerSlotProps,
} from "@/frontend/common/components/ui/form/date/types/dateRangePickerShared.types";
import { MobileAppDatePicker } from "@/frontend/mobile/components/ui/form/date/MobileAppDatePicker";

export type MobileAppDateRangePickerProps = AppDateRangePickerProps;

export function MobileAppDateRangePicker(props: Readonly<MobileAppDateRangePickerProps>) {
  const [open, setOpen] = useState(false);
  const state = useDateRangePickerState(props);

  const slots: DateRangePickerSlotProps = {
    renderFromPicker: args => (
      <MobileAppDatePicker
        label={args.label}
        value={args.value}
        onChange={args.onChange}
        slotProps={{ textField: { size: args.size, fullWidth: true } }}
      />
    ),
    renderToPicker: args => (
      <MobileAppDatePicker
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
      container="drawer"
    />
  );
}
