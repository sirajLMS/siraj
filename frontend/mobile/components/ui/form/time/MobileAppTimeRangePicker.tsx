"use client";

import { ScheduleOutlined } from "@mui/icons-material";
import { Box, Drawer, InputAdornment, TextField } from "@mui/material";
import { useId, useState } from "react";
import { MobileAppTimePicker } from "@/frontend/mobile/components/ui/form/time";

export interface MobileAppTimeRangePickerProps {
  readonly fromTime: string;
  readonly toTime: string;
  readonly onChange: (fromTime: string, toTime: string) => void;
  readonly label: string;
  readonly fromLabel: string;
  readonly toLabel: string;
  readonly size?: "small" | "medium";
}

function parseTimeString(value: string): Date | null {
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

function formatTimeString(value: Date | null): string {
  if (!value) {
    return "";
  }

  const hours = String(value.getHours()).padStart(2, "0");
  const minutes = String(value.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function formatDisplayRange(fromTime: string, toTime: string): string {
  if (!fromTime || !toTime) {
    return "";
  }

  return `${fromTime} – ${toTime}`;
}

export function MobileAppTimeRangePicker({
  fromTime,
  toTime,
  onChange,
  label,
  fromLabel,
  toLabel,
  size = "small",
}: Readonly<MobileAppTimeRangePickerProps>) {
  const inputId = useId();
  const [open, setOpen] = useState(false);

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
                <ScheduleOutlined fontSize="small" />
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
          <MobileAppTimePicker
            label={fromLabel}
            value={selectedFrom}
            onChange={handleFromChange}
            slotProps={{
              textField: { size, fullWidth: true },
            }}
          />
          <MobileAppTimePicker
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
