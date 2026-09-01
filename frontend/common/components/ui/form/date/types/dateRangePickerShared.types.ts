export interface AppDateRangePickerProps {
  readonly fromDate: string;
  readonly toDate: string;
  readonly onChange: (fromDate: string, toDate: string) => void;
  readonly label: string;
  readonly fromLabel: string;
  readonly toLabel: string;
  readonly size?: "small" | "medium";
}
