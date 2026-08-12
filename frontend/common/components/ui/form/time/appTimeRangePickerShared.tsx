"use client";

import { ScheduleOutlined } from "@mui/icons-material";
import { RangePickerChrome, type RangePickerSlotProps } from "@/frontend/common/components/ui/form/rangePickerShared";
import type { UseTimeRangePickerStateResult } from "@/frontend/common/components/ui/form/time/appTimeRangePickerSharedUtils";
import type { AppTimeRangePickerProps } from "@/frontend/common/components/ui/form/time/types/appTimeRangePickerShared.types";

export interface TimeRangePickerChromeProps {
  readonly props: Readonly<AppTimeRangePickerProps>;
  readonly state: UseTimeRangePickerStateResult;
  readonly slots: RangePickerSlotProps;
  readonly open: boolean;
  readonly onOpen: () => void;
  readonly onClose: () => void;
  readonly container: "popover" | "drawer";
  readonly anchorEl?: HTMLDivElement | null;
  readonly setAnchorEl?: (el: HTMLDivElement | null) => void;
}

export function TimeRangePickerChrome({
  props,
  state,
  slots,
  open,
  onOpen,
  onClose,
  container,
  anchorEl,
  setAnchorEl,
}: Readonly<TimeRangePickerChromeProps>) {
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
      endAdornmentIcon={ScheduleOutlined}
      popoverMinWidth={240}
    />
  );
}
