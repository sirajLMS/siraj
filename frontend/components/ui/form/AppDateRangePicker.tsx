"use client";

import { CalendarTodayOutlined } from "@mui/icons-material";
import { Box, InputAdornment, Popover, TextField } from "@mui/material";
import { format, isValid, parse } from "date-fns";
import { ar } from "date-fns/locale";
import { useLocale } from "next-intl";
import { useId, useRef, useState } from "react";
import { AppDatePicker } from "./AppDatePicker";

const DATE_STORAGE_FORMAT = "yyyy-MM-dd";
const DATE_DISPLAY_FORMAT = "MMM d, yyyy";
const DATE_DISPLAY_FORMAT_AR = "d MMM yyyy";

export interface AppDateRangePickerProps {
  readonly fromDate: string;
  readonly toDate: string;
  readonly onChange: (fromDate: string, toDate: string) => void;
  readonly label: string;
  readonly fromLabel: string;
  readonly toLabel: string;
  readonly size?: "small" | "medium";
}

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

export function AppDateRangePicker({
  fromDate,
  toDate,
  onChange,
  label,
  fromLabel,
  toLabel,
  size = "small",
}: Readonly<AppDateRangePickerProps>) {
  const locale = useLocale();
  const inputId = useId();
  const anchorRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

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

  return (
    <>
      <TextField
        id={inputId}
        ref={anchorRef}
        label={label}
        value={displayValue}
        size={size}
        fullWidth
        onClick={() => setOpen(true)}
        slotProps={{
          input: {
            readOnly: true,
            endAdornment: (
              <InputAdornment position="end">
                <CalendarTodayOutlined fontSize="small" />
              </InputAdornment>
            ),
          },
          htmlInput: { autoComplete: "off" },
        }}
      />

      <Popover
        open={open}
        anchorEl={anchorRef.current}
        onClose={() => setOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, p: 2, minWidth: 280 }}>
          <AppDatePicker
            label={fromLabel}
            value={selectedFrom}
            onChange={handleFromChange}
            slotProps={{
              textField: { size, fullWidth: true },
            }}
          />
          <AppDatePicker
            label={toLabel}
            value={selectedTo}
            onChange={handleToChange}
            minDate={selectedFrom ?? undefined}
            slotProps={{
              textField: { size, fullWidth: true },
            }}
          />
        </Box>
      </Popover>
    </>
  );
}
