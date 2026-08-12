"use client";

import { CalendarTodayOutlined } from "@mui/icons-material";
import type { UseDateRangePickerStateResult } from "@/frontend/common/components/ui/form/date/dateRangePickerSharedUtils";
import type { AppDateRangePickerProps } from "@/frontend/common/components/ui/form/date/types/dateRangePickerShared.types";
import { RangePickerChrome, type RangePickerSlotProps } from "@/frontend/common/components/ui/form/rangePickerShared";

export interface DateRangePickerChromeProps {
  readonly props: Readonly<AppDateRangePickerProps>;
  readonly state: UseDateRangePickerStateResult;
  readonly slots: RangePickerSlotProps;
  readonly open: boolean;
  readonly onOpen: () => void;
  readonly onClose: () => void;
  readonly container: "popover" | "drawer";
  readonly anchorEl?: HTMLDivElement | null;
  readonly setAnchorEl?: (el: HTMLDivElement | null) => void;
}

export function DateRangePickerChrome({
  props,
  state,
  slots,
  open,
  onOpen,
  onClose,
  container,
  anchorEl,
  setAnchorEl,
}: Readonly<DateRangePickerChromeProps>) {
  return (
    <RangePickerChrome
      props={props}
      state={state}
      slots={slots}
      open={open}
      onOpen={onOpen}
      onClose={onClose}
      container={container}
      anchorEl={anchorEl}
      setAnchorEl={setAnchorEl}
      endAdornmentIcon={CalendarTodayOutlined}
      popoverMinWidth={280}
      includeMinDate
    />
  );
}
