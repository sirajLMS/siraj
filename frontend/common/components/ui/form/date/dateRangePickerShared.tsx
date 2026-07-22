"use client";

import { CalendarTodayOutlined } from "@mui/icons-material";
import { Box, Drawer, InputAdornment, Popover, TextField } from "@mui/material";
import { useId } from "react";
import type { UseDateRangePickerStateResult } from "@/frontend/common/components/ui/form/date/dateRangePickerSharedUtils";
import type {
  AppDateRangePickerProps,
  DateRangePickerSlotProps,
} from "@/frontend/common/components/ui/form/date/types/dateRangePickerShared.types";

export interface DateRangePickerChromeProps {
  readonly props: Readonly<AppDateRangePickerProps>;
  readonly state: UseDateRangePickerStateResult;
  readonly slots: DateRangePickerSlotProps;
  readonly open: boolean;
  readonly onOpen: () => void;
  readonly onClose: () => void;
  readonly container: "popover" | "drawer";
  readonly anchorEl?: HTMLDivElement | null;
  readonly setAnchorEl?: (el: HTMLDivElement | null) => void;
}

export function DateRangePickerChrome({
  props,
  state,
  slots,
  open,
  onOpen,
  onClose,
  container,
  anchorEl,
  setAnchorEl,
}: Readonly<DateRangePickerChromeProps>) {
  const { label, fromLabel, toLabel, size = "small" } = props;
  const { selectedFrom, selectedTo, displayValue, handleFromChange, handleToChange } = state;
  const inputId = useId();

  const textField = (
    <TextField
      id={inputId}
      ref={setAnchorEl}
      label={label}
      value={displayValue}
      size={size}
      fullWidth
      onClick={onOpen}
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
  );

  const fromPicker = slots.renderFromPicker({
    label: fromLabel,
    value: selectedFrom,
    onChange: handleFromChange,
    size,
  });

  const toPicker = slots.renderToPicker({
    label: toLabel,
    value: selectedTo,
    onChange: handleToChange,
    minDate: selectedFrom ?? undefined,
    size,
  });

  if (container === "popover") {
    return (
      <>
        {textField}
        <Popover
          open={open}
          anchorEl={anchorEl}
          onClose={onClose}
          anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
          transformOrigin={{ vertical: "top", horizontal: "left" }}
        >
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, p: 2, minWidth: 280 }}>
            {fromPicker}
            {toPicker}
          </Box>
        </Popover>
      </>
    );
  }

  return (
    <>
      {textField}
      <Drawer open={open} onClose={onClose} anchor="bottom" slotProps={{ paper: { sx: { borderRadius: 2, p: 2 } } }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, p: 1 }}>
          {fromPicker}
          {toPicker}
        </Box>
      </Drawer>
    </>
  );
}
