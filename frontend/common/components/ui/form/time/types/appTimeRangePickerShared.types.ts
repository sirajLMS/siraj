export interface AppTimeRangePickerProps {
  readonly fromTime: string;
  readonly toTime: string;
  readonly onChange: (fromTime: string, toTime: string) => void;
  readonly label: string;
  readonly fromLabel: string;
  readonly toLabel: string;
  readonly size?: "small" | "medium";
}
