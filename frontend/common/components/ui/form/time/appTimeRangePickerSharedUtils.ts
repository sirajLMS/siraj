export function parseTimeString(value: string): Date | null {
  if (!value) {
    return null;
  }

  const [hours, minutes] = value.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return null;
  }

  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date;
}

export function formatTimeString(value: Date | null): string {
  if (!value) {
    return "";
  }

  const hours = String(value.getHours()).padStart(2, "0");
  const minutes = String(value.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

export function formatDisplayRange(fromTime: string, toTime: string): string {
  if (!fromTime || !toTime) {
    return "";
  }

  return `${fromTime} – ${toTime}`;
}

export interface UseTimeRangePickerStateArgs {
  readonly fromTime: string;
  readonly toTime: string;
  readonly onChange: (fromTime: string, toTime: string) => void;
}

export interface UseTimeRangePickerStateResult {
  readonly selectedFrom: Date | null;
  readonly selectedTo: Date | null;
  readonly displayValue: string;
  readonly handleFromChange: (date: Date | null) => void;
  readonly handleToChange: (date: Date | null) => void;
}

export function useTimeRangePickerState({
  fromTime,
  toTime,
  onChange,
}: Readonly<UseTimeRangePickerStateArgs>): UseTimeRangePickerStateResult {
  const selectedFrom = parseTimeString(fromTime);
  const selectedTo = parseTimeString(toTime);
  const displayValue = formatDisplayRange(fromTime, toTime);

  const handleFromChange = (date: Date | null) => {
    const nextFrom = formatTimeString(date);
    if (!nextFrom) {
      onChange("", toTime);
      return;
    }

    const fromMinutes = date ? date.getHours() * 60 + date.getMinutes() : 0;
    const toMinutes = selectedTo ? selectedTo.getHours() * 60 + selectedTo.getMinutes() : 0;
    const nextTo = selectedTo && fromMinutes >= toMinutes ? nextFrom : toTime;
    onChange(nextFrom, nextTo);
  };

  const handleToChange = (date: Date | null) => {
    const nextTo = formatTimeString(date);
    if (!nextTo) {
      onChange(fromTime, "");
      return;
    }

    const fromMinutes = selectedFrom ? selectedFrom.getHours() * 60 + selectedFrom.getMinutes() : 0;
    const toMinutes = date ? date.getHours() * 60 + date.getMinutes() : 0;
    const nextFrom = selectedFrom && fromMinutes >= toMinutes ? nextTo : fromTime;
    onChange(nextFrom, nextTo);
  };

  return {
    selectedFrom,
    selectedTo,
    displayValue,
    handleFromChange,
    handleToChange,
  };
}
