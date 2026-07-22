export interface AppDateRangePickerProps {
  readonly fromDate: string;
  readonly toDate: string;
  readonly onChange: (fromDate: string, toDate: string) => void;
  readonly label: string;
  readonly fromLabel: string;
  readonly toLabel: string;
  readonly size?: "small" | "medium";
}

/**
 * Common render-prop args passed by the shared range picker chrome to each
 * tier's inner single-date picker slot. The concrete picker is invoked by
 * the tier wrapper, so the chrome does not need to know the picker's exact
 * props type.
 */
export interface DateRangePickerSlotRenderArgs {
  readonly label: string;
  readonly value: Date | null;
  readonly onChange: (date: Date | null) => void;
  readonly minDate?: Date;
  readonly size: "small" | "medium";
}

export type DateRangePickerSlotRender = (args: Readonly<DateRangePickerSlotRenderArgs>) => React.ReactNode;

export type DateRangePickerSlotProps = {
  readonly renderFromPicker: DateRangePickerSlotRender;
  readonly renderToPicker: DateRangePickerSlotRender;
};
