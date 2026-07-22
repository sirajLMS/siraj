export interface AppTimeRangePickerProps {
  readonly fromTime: string;
  readonly toTime: string;
  readonly onChange: (fromTime: string, toTime: string) => void;
  readonly label: string;
  readonly fromLabel: string;
  readonly toLabel: string;
  readonly size?: "small" | "medium";
}

/**
 * Common render-prop args passed by the shared range picker chrome to each
 * tier's inner single-time picker slot. The concrete picker is invoked by
 * the tier wrapper, so the chrome does not need to know the picker's exact
 * props type.
 */
export interface TimeRangePickerSlotRenderArgs {
  readonly label: string;
  readonly value: Date | null;
  readonly onChange: (date: Date | null) => void;
  readonly size: "small" | "medium";
}

export type TimeRangePickerSlotRender = (args: Readonly<TimeRangePickerSlotRenderArgs>) => React.ReactNode;

export type TimeRangePickerSlotProps = {
  readonly renderFromPicker: TimeRangePickerSlotRender;
  readonly renderToPicker: TimeRangePickerSlotRender;
};
