"use client";

import type { SvgIconComponent } from "@mui/icons-material";
import { Box, Drawer, InputAdornment, Popover, TextField } from "@mui/material";
import { useId } from "react";

export interface RangePickerSharedState {
  readonly selectedFrom: Date | null;
  readonly selectedTo: Date | null;
  readonly displayValue: string;
  readonly handleFromChange: (date: Date | null) => void;
  readonly handleToChange: (date: Date | null) => void;
}

export interface RangePickerSharedProps {
  readonly label: string;
  readonly fromLabel: string;
  readonly toLabel: string;
  readonly size?: "small" | "medium";
}

export interface RangePickerSlotRenderArgs {
  readonly label: string;
  readonly value: Date | null;
  readonly onChange: (date: Date | null) => void;
  readonly minDate?: Date;
  readonly size: "small" | "medium";
}

export type RangePickerSlotRender = (args: Readonly<RangePickerSlotRenderArgs>) => React.ReactNode;

export interface RangePickerSlotProps {
  readonly renderFromPicker: RangePickerSlotRender;
  readonly renderToPicker: RangePickerSlotRender;
}

export interface RangePickerChromeProps {
  readonly props: Readonly<RangePickerSharedProps>;
  readonly state: RangePickerSharedState;
  readonly slots: RangePickerSlotProps;
  readonly open: boolean;
  readonly onOpen: () => void;
  readonly onClose: () => void;
  readonly container: "popover" | "drawer";
  readonly anchorEl?: HTMLDivElement | null;
  readonly setAnchorEl?: (el: HTMLDivElement | null) => void;
  readonly endAdornmentIcon: SvgIconComponent;
  readonly popoverMinWidth: number;
  readonly includeMinDate?: boolean;
}

export function RangePickerChrome({
  props,
  state,
  slots,
  open,
  onOpen,
  onClose,
  container,
  anchorEl,
  setAnchorEl,
  endAdornmentIcon: Icon,
  popoverMinWidth,
  includeMinDate = false,
}: Readonly<RangePickerChromeProps>) {
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
              <Icon fontSize="small" />
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

  const toPickerArgs: RangePickerSlotRenderArgs = includeMinDate
    ? { label: toLabel, value: selectedTo, onChange: handleToChange, minDate: selectedFrom ?? undefined, size }
    : { label: toLabel, value: selectedTo, onChange: handleToChange, size };

  const toPicker = slots.renderToPicker(toPickerArgs);

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
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, p: 2, minWidth: popoverMinWidth }}>
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
