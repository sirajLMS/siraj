"use client";

import Box from "@mui/material/Box";
import ClickAwayListener from "@mui/material/ClickAwayListener";
import FormHelperText from "@mui/material/FormHelperText";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import type * as React from "react";
import type { PhoneInputState } from "@/frontend/common/components/ui/input/phoneInput/PhoneInputShared.hooks";
import type { PhoneInputSlotProps } from "@/frontend/common/components/ui/input/phoneInput/PhoneInputShared.types";
import { LtrScope } from "@/frontend/common/providers/theme/LtrScope";

const slotInputSx = {
  border: "none",
  outline: "none",
  background: "transparent",
  font: "inherit",
  color: "inherit",
  padding: 0,
  margin: 0,
  minWidth: 0,
} as const;

type CountryAdornmentProps = {
  readonly countryEmoji: string | undefined;
  readonly prefixDigits: string;
  readonly prefixInvalid: boolean;
  readonly disabled: boolean | undefined;
  readonly countryPickerOpen: boolean;
  readonly activeSlot: "prefix" | "national";
  readonly maxPrefixDisplayLength: number | undefined;
  readonly prefixInputRef: React.Ref<HTMLInputElement>;
  readonly onOpenCountryPicker: (event: React.MouseEvent<HTMLElement>) => void;
  readonly onPrefixFocus: () => void;
  readonly onPrefixKeyDown: React.KeyboardEventHandler<HTMLInputElement>;
  readonly onPrefixInput: React.ReactEventHandler<HTMLInputElement>;
  readonly selectCountryLabel: string;
  readonly countryCallingCodeLabel: string;
  readonly LocaleEmojiComponent: PhoneInputSlotProps["LocaleEmojiComponent"];
  readonly PrefixInputElement: PhoneInputSlotProps["PrefixInputElement"];
};

const CountryAdornment: React.FC<CountryAdornmentProps> = ({
  countryEmoji,
  prefixDigits,
  prefixInvalid,
  disabled,
  countryPickerOpen,
  activeSlot,
  maxPrefixDisplayLength,
  prefixInputRef,
  onOpenCountryPicker,
  onPrefixFocus,
  onPrefixKeyDown,
  onPrefixInput,
  selectCountryLabel,
  countryCallingCodeLabel,
  LocaleEmojiComponent,
  PrefixInputElement,
}): React.ReactNode => {
  const countrySelectorButton = (
    <IconButton
      aria-label={selectCountryLabel}
      aria-haspopup="listbox"
      aria-expanded={countryPickerOpen}
      onClick={onOpenCountryPicker}
      disabled={disabled}
      size="small"
      sx={{
        p: 0.25,
        flexShrink: 0,
        paddingInlineEnd: 0.5,
        marginInlineEnd: 0,
      }}
    >
      <LocaleEmojiComponent emoji={countryEmoji ?? "\u{1F310}"} />
    </IconButton>
  );

  return (
    <InputAdornment
      position="start"
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 0.25,
        marginInlineEnd: 0.5,
        maxHeight: "unset",
      }}
    >
      <Tooltip title={selectCountryLabel}>
        {disabled ? (
          <Box component="span" aria-disabled={true} sx={{ display: "inline-flex" }}>
            {countrySelectorButton}
          </Box>
        ) : (
          countrySelectorButton
        )}
      </Tooltip>
      <PrefixInputElement
        ref={prefixInputRef}
        value={`+${prefixDigits}`}
        maxLength={maxPrefixDisplayLength}
        disabled={disabled}
        onFocus={onPrefixFocus}
        onKeyDown={onPrefixKeyDown}
        onInput={onPrefixInput}
        aria-label={countryCallingCodeLabel}
        sx={theme => ({
          ...slotInputSx,
          // `ch` measures only the normal-weight "0" advance — the bold active slot and the
          // wider "+" glyph need more room, otherwise the last digit clips by a few px.
          width: `calc(${Math.max(prefixDigits.length + 1, 2)}ch + 0.5em)`,
          flexShrink: 0,
          paddingInlineEnd: 0.25,
          color: prefixInvalid ? theme.palette.error.main : "inherit",
          fontWeight: activeSlot === "prefix" ? 600 : 400,
        })}
      />
    </InputAdornment>
  );
};

type PhoneTextFieldProps = {
  readonly fullWidth: boolean;
  readonly required: boolean | undefined;
  readonly disabled: boolean | undefined;
  readonly showError: boolean;
  readonly resolvedLabel: string | undefined;
  readonly placeholder: string | undefined;
  readonly nationalDisplay: string;
  readonly phoneNumberLabel: string;
  readonly onBlurAction?: () => void;
  readonly nationalInputRef: React.Ref<HTMLInputElement>;
  readonly activeSlot: "prefix" | "national";
  readonly countryPickerOpen: boolean;
  readonly onNationalKeyDown: React.KeyboardEventHandler<HTMLInputElement>;
  readonly onNationalFocus: () => void;
  readonly onNationalInput: React.ReactEventHandler<HTMLInputElement>;
  readonly onNationalSelect: React.ReactEventHandler<HTMLInputElement>;
  readonly startAdornment: React.ReactNode;
};

const PhoneTextField: React.FC<PhoneTextFieldProps> = ({
  fullWidth,
  required,
  disabled,
  showError,
  resolvedLabel,
  placeholder,
  nationalDisplay,
  phoneNumberLabel,
  onBlurAction,
  nationalInputRef,
  activeSlot,
  countryPickerOpen,
  onNationalKeyDown,
  onNationalFocus,
  onNationalInput,
  onNationalSelect,
  startAdornment,
}): React.ReactNode => (
  <TextField
    fullWidth={fullWidth}
    required={required}
    disabled={disabled}
    error={showError}
    label={resolvedLabel}
    placeholder={placeholder}
    value={nationalDisplay}
    onChange={() => {}}
    onBlur={onBlurAction}
    inputRef={nationalInputRef}
    sx={{
      "& .MuiInputBase-input": {
        fontWeight: activeSlot === "national" ? 600 : 400,
        paddingInlineStart: 0,
      },
      ...(countryPickerOpen && {
        "& .MuiOutlinedInput-root": {
          borderBottomStartRadius: 0,
          borderBottomEndRadius: 0,
        },
      }),
    }}
    slotProps={{
      inputLabel: { shrink: true },
      input: { startAdornment },
      htmlInput: {
        // onKeyDown/onFocus must live on the native input: attached at the TextField
        // root they also catch bubbled events from the prefix input and the flag button.
        onKeyDown: onNationalKeyDown,
        onFocus: onNationalFocus,
        onInput: onNationalInput,
        onSelect: onNationalSelect,
        autoComplete: "tel",
        inputMode: "tel",
        "aria-label": phoneNumberLabel,
      },
    }}
  />
);

type PhoneInputViewProps = {
  readonly state: PhoneInputState;
  readonly fullWidth: boolean;
  readonly required: boolean | undefined;
  readonly disabled: boolean | undefined;
  readonly placeholder: string | undefined;
  readonly onBlurAction: (() => void) | undefined;
  readonly useOnNationalInput: boolean;
  readonly LocaleEmojiComponent: PhoneInputSlotProps["LocaleEmojiComponent"];
  readonly PhoneCountryPickerComponent: PhoneInputSlotProps["PhoneCountryPickerComponent"];
  readonly PrefixInputElement: PhoneInputSlotProps["PrefixInputElement"];
};

export const PhoneInputView: React.FC<PhoneInputViewProps> = ({
  state,
  fullWidth,
  required,
  disabled,
  placeholder,
  onBlurAction,
  useOnNationalInput,
  LocaleEmojiComponent,
  PhoneCountryPickerComponent,
  PrefixInputElement,
}) => {
  const startAdornment = (
    <CountryAdornment
      countryEmoji={state.country?.emoji}
      prefixDigits={state.prefixDigits}
      prefixInvalid={state.prefixInvalid}
      disabled={disabled}
      countryPickerOpen={state.countryPickerOpen}
      activeSlot={state.activeSlot}
      maxPrefixDisplayLength={state.maxPrefixDisplayLength}
      prefixInputRef={state.prefixInputRef}
      onOpenCountryPicker={state.openCountryPicker}
      onPrefixFocus={() => state.setActiveSlot("prefix")}
      onPrefixKeyDown={state.handlePrefixKeyDown}
      onPrefixInput={state.resetPrefixDisplay}
      selectCountryLabel={state.labels.selectCountry}
      countryCallingCodeLabel={state.labels.countryCallingCode}
      LocaleEmojiComponent={LocaleEmojiComponent}
      PrefixInputElement={PrefixInputElement}
    />
  );

  return (
    <ClickAwayListener onClickAway={state.closeCountryPicker}>
      <Box sx={{ width: fullWidth ? "100%" : undefined }}>
        <Box sx={{ position: "relative" }}>
          <LtrScope>
            <PhoneTextField
              fullWidth={fullWidth}
              required={required}
              disabled={disabled}
              showError={state.showError}
              resolvedLabel={state.resolvedLabel}
              placeholder={placeholder}
              nationalDisplay={state.nationalDisplay}
              phoneNumberLabel={state.labels.phoneNumber}
              onBlurAction={onBlurAction}
              nationalInputRef={state.nationalInputRef}
              activeSlot={state.activeSlot}
              countryPickerOpen={state.countryPickerOpen}
              onNationalKeyDown={state.handleNationalKeyDown}
              onNationalFocus={() => {
                state.closeCountryPicker();
                state.setActiveSlot("national");
              }}
              onNationalInput={useOnNationalInput ? state.onNationalInput : state.resetNationalDisplay}
              onNationalSelect={state.handleNationalSelect}
              startAdornment={startAdornment}
            />
          </LtrScope>
          {state.countryPickerOpen ? (
            <PhoneCountryPickerComponent country={state.country} onSelectAction={state.handleCountrySelect} />
          ) : null}
        </Box>
        {!state.countryPickerOpen && state.resolvedHelperText ? (
          <FormHelperText error={state.showError}>{state.resolvedHelperText}</FormHelperText>
        ) : null}
      </Box>
    </ClickAwayListener>
  );
};
