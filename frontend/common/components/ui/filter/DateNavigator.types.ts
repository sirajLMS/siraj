export interface DateNavigatorProps {
  readonly dateValue: string;
  readonly todayLabel: string;
  readonly previousDayLabel: string;
  readonly nextDayLabel: string;
  readonly dateLabel?: string;
  readonly onDateChange: (date: string) => void;
}
