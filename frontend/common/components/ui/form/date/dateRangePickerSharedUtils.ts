import { format, isValid, parse } from "date-fns";
import { ar } from "date-fns/locale";
import { useAppLocale } from "@/frontend/common/providers/localeContext";

const DATE_STORAGE_FORMAT = "yyyy-MM-dd";
const DATE_DISPLAY_FORMAT = "MMM d, yyyy";
const DATE_DISPLAY_FORMAT_AR = "d MMM yyyy";

function parseStorageDate(value: string): Date | null {
  if (value.length === 0) {
    return null;
  }

  const parsed = parse(value, DATE_STORAGE_FORMAT, new Date());
  return isValid(parsed) ? parsed : null;
}

function formatStorageDate(value: Date | null): string {
  return value ? format(value, DATE_STORAGE_FORMAT) : "";
}

function formatDisplayRange(fromDate: string, toDate: string, locale: string): string {
  const from = parseStorageDate(fromDate);
  const to = parseStorageDate(toDate);

  if (!from || !to) {
    return "";
  }

  const displayFormat = locale === "ar" ? DATE_DISPLAY_FORMAT_AR : DATE_DISPLAY_FORMAT;
  const dateLocale = locale === "ar" ? { locale: ar } : undefined;

  return `${format(from, displayFormat, dateLocale)} – ${format(to, displayFormat, dateLocale)}`;
}

export interface UseDateRangePickerStateArgs {
  readonly fromDate: string;
  readonly toDate: string;
  readonly onChange: (fromDate: string, toDate: string) => void;
}

export interface UseDateRangePickerStateResult {
  readonly selectedFrom: Date | null;
  readonly selectedTo: Date | null;
  readonly displayValue: string;
  readonly handleFromChange: (date: Date | null) => void;
  readonly handleToChange: (date: Date | null) => void;
  readonly locale: string;
}

export function useDateRangePickerState({
  fromDate,
  toDate,
  onChange,
}: Readonly<UseDateRangePickerStateArgs>): UseDateRangePickerStateResult {
  const locale = useAppLocale();
  const selectedFrom = parseStorageDate(fromDate);
  const selectedTo = parseStorageDate(toDate);
  const displayValue = formatDisplayRange(fromDate, toDate, locale);

  const handleFromChange = (date: Date | null) => {
    const nextFrom = formatStorageDate(date);
    if (!nextFrom) {
      onChange("", toDate);
      return;
    }

    const nextTo = selectedTo && date && selectedTo < date ? nextFrom : toDate;
    onChange(nextFrom, nextTo);
  };

  const handleToChange = (date: Date | null) => {
    const nextTo = formatStorageDate(date);
    if (!nextTo) {
      onChange(fromDate, "");
      return;
    }

    const nextFrom = selectedFrom && date && selectedFrom > date ? nextTo : fromDate;
    onChange(nextFrom, nextTo);
  };

  return {
    selectedFrom,
    selectedTo,
    displayValue,
    handleFromChange,
    handleToChange,
    locale,
  };
}
