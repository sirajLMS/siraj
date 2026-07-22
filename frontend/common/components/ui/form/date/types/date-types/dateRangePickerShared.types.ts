import type { DatePickerProps } from "@mui/x-date-pickers/DatePicker";
import type { DesktopDatePickerProps } from "@mui/x-date-pickers/DesktopDatePicker";
import type { MobileAppDatePickerProps } from "@/frontend/mobile/components/ui/form/date/MobileAppDatePicker";

export interface AppDateRangePickerProps {
  readonly fromDate: string;
  readonly toDate: string;
  readonly onChange: (fromDate: string, toDate: string) => void;
  readonly label: string;
  readonly fromLabel: string;
  readonly toLabel: string;
  readonly size?: "small" | "medium";
}

type AppDatePickerComponentProps = DatePickerProps;
type DesktopAppDatePickerComponentProps = DesktopDatePickerProps;
type MobileAppDatePickerComponentProps = MobileAppDatePickerProps;

type AnyDatePickerComponentProps =
  | AppDatePickerComponentProps
  | DesktopAppDatePickerComponentProps
  | MobileAppDatePickerComponentProps;

export type DateRangePickerSlotProps = {
  readonly FromPicker: React.ComponentType<AnyDatePickerComponentProps>;
  readonly ToPicker: React.ComponentType<AnyDatePickerComponentProps>;
};
