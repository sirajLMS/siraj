"use client";

import { CalendarTodayOutlined } from "@mui/icons-material";
import { Box, Drawer, InputAdornment, TextField } from "@mui/material";
import { format, isValid, parse } from "date-fns";
import { ar } from "date-fns/locale";
import { useId, useState } from "react";
import { useAppLocale } from "@/frontend/common/providers/localeContext";
import { MobileAppDatePicker } from "@/frontend/mobile/components/ui/form/date";

const DATE_STORAGE_FORMAT = "yyyy-MM-dd";
const DATE_DISPLAY_FORMAT = "MMM d, yyyy";
const DATE_DISPLAY_FORMAT_AR = "d MMM yyyy";

export interface MobileAppDateRangePickerProps {
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

export function MobileAppDateRangePicker({
  fromDate,
  toDate,
  onChange,
  label,
  fromLabel,
  toLabel,
  size = "small",
}: Readonly<MobileAppDateRangePickerProps>) {
  const locale = useAppLocale();
  const inputId = useId();
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

      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        anchor="bottom"
        slotProps={{ paper: { sx: { borderRadius: 2, p: 2 } } }}
      >
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, p: 1 }}>
          <MobileAppDatePicker
            label={fromLabel}
            value={selectedFrom}
            onChange={handleFromChange}
            slotProps={{
              textField: { size, fullWidth: true },
            }}
          />
          <MobileAppDatePicker
            label={toLabel}
            value={selectedTo}
            onChange={handleToChange}
            slotProps={{
              textField: { size, fullWidth: true },
            }}
          />
        </Box>
      </Drawer>
    </>
  );
}
