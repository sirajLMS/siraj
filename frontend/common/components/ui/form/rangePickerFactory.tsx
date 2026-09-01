"use client";

import type * as React from "react";
import { useState } from "react";

import type { RangePickerSlotProps } from "@/frontend/common/components/ui/form/rangePickerShared";

/**
 * Props accepted by any single picker (date or time) rendered inside a range
 * picker: `AppDatePicker`, `DesktopAppDatePicker`, `MobileAppDatePicker`,
 * `AppTimePicker`, `DesktopAppTimePicker`, `MobileAppTimePicker`.
 */
interface RangePickerSinglePickerProps {
  readonly label: string;
  readonly value: Date | null;
  readonly onChange: (date: Date | null) => void;
  readonly minDate?: Date;
  readonly slotProps?: { readonly textField?: { readonly size?: "small" | "medium"; readonly fullWidth?: boolean } };
}

/**
 * A concrete single-picker component compatible with the range picker factory.
 */
type RangePickerSinglePicker = React.ComponentType<RangePickerSinglePickerProps>;

/**
 * A range-picker chrome component (e.g. `DateRangePickerChrome` or
 * `TimeRangePickerChrome`) that wraps `RangePickerChrome`.
 */
type RangePickerChromeComponent<P, S> = React.ComponentType<{
  readonly props: Readonly<P>;
  readonly state: S;
  readonly slots: RangePickerSlotProps;
  readonly open: boolean;
  readonly onOpen: () => void;
  readonly onClose: () => void;
  readonly container: "popover" | "drawer";
  readonly anchorEl?: HTMLDivElement | null;
  readonly setAnchorEl?: (el: HTMLDivElement | null) => void;
}>;

/**
 * Configuration for {@link createRangePickerVariant}.
 */
export interface CreateRangePickerVariantConfig<P, S> {
  /** The tier-specific single picker component (e.g. `AppDatePicker`). */
  readonly SinglePicker: RangePickerSinglePicker;
  /** The shared chrome component (e.g. `DateRangePickerChrome`). */
  readonly Chrome: RangePickerChromeComponent<P, S>;
  /** Hook that produces the range state from the outer props. */
  readonly useState: (props: Readonly<P>) => S;
  /** Whether the "to" picker receives `minDate` (date pickers) or not (time pickers). */
  readonly includeMinDate: boolean;
}

/**
 * Factory that assembles a full range-picker component from a tier-specific
 * single-picker component and a shared chrome.
 *
 * Each call returns a `React.FC` that:
 * 1. Manages `anchorEl`/`open` state
 * 2. Builds the `from`/`to` slot renderers
 * 3. Renders the shared chrome
 *
 * The `container` mode is inferred from the `container` prop passed at
 * render time. The factory eliminates the slot-definition + chrome-call
 * duplication detected by jscpd across Common/Desktop/Mobile variants.
 */
export function createRangePickerVariant<P extends { readonly size?: "small" | "medium" }, S>(
  config: Readonly<CreateRangePickerVariantConfig<P, S>>
): React.FC<{
  readonly props: Readonly<P>;
  readonly container: "popover" | "drawer";
}> {
  const { SinglePicker, Chrome, useState: useStateHooks, includeMinDate } = config;

  return function RangePickerVariant({ props, container }) {
    const [anchorEl, setAnchorEl] = useState<HTMLDivElement | null>(null);
    const [open, setOpen] = useState(false);
    const state = useStateHooks(props);

    const slots: RangePickerSlotProps = {
      renderFromPicker: args => (
        <SinglePicker
          label={args.label}
          value={args.value}
          onChange={args.onChange}
          slotProps={{ textField: { size: args.size, fullWidth: true } }}
        />
      ),
      renderToPicker: args => (
        <SinglePicker
          label={args.label}
          value={args.value}
          onChange={args.onChange}
          minDate={includeMinDate ? args.minDate : undefined}
          slotProps={{ textField: { size: args.size, fullWidth: true } }}
        />
      ),
    };

    const chromeProps = {
      props,
      state,
      slots,
      open,
      onOpen: () => setOpen(true),
      onClose: () => setOpen(false),
      container,
    } as const;

    if (container === "popover") {
      return <Chrome {...chromeProps} anchorEl={anchorEl} setAnchorEl={setAnchorEl} />;
    }

    return <Chrome {...chromeProps} />;
  };
}
