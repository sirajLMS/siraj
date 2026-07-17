"use client";

import Box from "@mui/material/Box";
import ClickAwayListener from "@mui/material/ClickAwayListener";
import FormHelperText from "@mui/material/FormHelperText";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import type * as React from "react";
import { useCallback, useState } from "react";
import { LocaleEmoji } from "@/frontend/common/components/ui/display";
import type { PhoneInputProps } from "@/frontend/common/components/ui/input/phoneInput/PhoneInput";
import { usePhoneInput } from "@/frontend/common/components/ui/input/phoneInput/usePhoneInput";
import { LtrScope } from "@/frontend/common/providers/theme/LtrScope";
import { PhoneCountryPickerMobile } from "@/frontend/mobile/components/ui/input/phoneInput/phoneCountryPicker.mobile";
import { useAppTranslation } from "@/shared/locale";

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
  readonly onPrefixInput: React.FormEventHandler<HTMLInputElement>;
  readonly selectCountryLabel: string;
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
}): React.ReactNode => (
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
    <IconButton
      aria-label={selectCountryLabel}
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
      <LocaleEmoji emoji={countryEmoji ?? "🌐"} />
    </IconButton>
    <Box
      component="input"
      ref={prefixInputRef}
      value={`+${prefixDigits}`}
      maxLength={maxPrefixDisplayLength}
      disabled={disabled}
      onFocus={onPrefixFocus}
      onKeyDown={onPrefixKeyDown}
      onInput={onPrefixInput}
      aria-label="Country calling code"
      sx={{
        ...slotInputSx,
        width: `${Math.max(prefixDigits.length + 1, 2)}ch`,
        flexShrink: 0,
        paddingInlineEnd: 0.25,
        color: prefixInvalid ? "error.main" : "inherit",
        fontWeight: activeSlot === "prefix" ? 600 : 400,
      }}
    />
  </InputAdornment>
);

type PhoneTextFieldProps = {
  readonly fullWidth: boolean;
  readonly required: boolean | undefined;
  readonly disabled: boolean | undefined;
  readonly showError: boolean;
  readonly resolvedLabel: string | undefined;
  readonly placeholder: string | undefined;
  readonly nationalDisplay: string;
  readonly onBlurAction?: () => void;
  readonly nationalInputRef: React.Ref<HTMLInputElement>;
  readonly activeSlot: "prefix" | "national";
  readonly countryPickerOpen: boolean;
  readonly onNationalKeyDown: React.KeyboardEventHandler<HTMLInputElement>;
  readonly onNationalFocus: () => void;
  readonly onNationalInput: React.FormEventHandler<HTMLInputElement>;
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
    onKeyDown={onNationalKeyDown}
    onFocus={onNationalFocus}
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
        onInput: onNationalInput,
        onSelect: onNationalSelect,
        autoComplete: "tel",
        inputMode: "tel",
        "aria-label": "Phone number",
      },
    }}
  />
);

export const PhoneInputMobile: React.FC<PhoneInputProps> = ({
  value,
  onChangeAction,
  onBlurAction,
  defaultRegion = "EG",
  label,
  placeholder,
  required,
  disabled,
  fullWidth = true,
  error,
  helperText,
  hideLabel,
}: PhoneInputProps): React.ReactNode => {
  const t = useAppTranslation().uiTranslations.phoneInput;
  const [countryPickerOpen, setCountryPickerOpen] = useState(false);

  const {
    country,
    prefixDigits,
    nationalDigits,
    nationalDisplay,
    activeSlot,
    prefixInvalid,
    phoneInvalid,
    selectCountry,
    handlePrefixKeyDown,
    handleNationalKeyDown,
    handleNationalSelect,
    resetPrefixDisplay,
    resetNationalDisplay,
    prefixInputRef,
    nationalInputRef,
    maxPrefixDisplayLength,
    setActiveSlot,
  } = usePhoneInput({ value, onChangeAction, defaultRegion });

  const openCountryPicker = useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      event.stopPropagation();
      if (disabled) {
        return;
      }
      setCountryPickerOpen(current => !current);
    },
    [disabled]
  );

  const closeCountryPicker = useCallback(() => {
    setCountryPickerOpen(false);
  }, []);

  const handleCountrySelect = useCallback(
    (nextCountry: Parameters<typeof selectCountry>[0]) => {
      selectCountry(nextCountry);
      closeCountryPicker();
    },
    [closeCountryPicker, selectCountry]
  );

  const isEmpty = prefixDigits.length === 0 && nationalDigits.length === 0;
  const showRequiredError = Boolean(required) && isEmpty;
  const showError = Boolean(error) || prefixInvalid || showRequiredError || phoneInvalid;
  const resolvedHelperText = prefixInvalid
    ? t.invalidPrefix
    : showRequiredError
      ? t.required
      : phoneInvalid
        ? t.invalidPhone
        : helperText;
  const resolvedLabel = hideLabel ? undefined : (label ?? t.label);

  const startAdornment = (
    <CountryAdornment
      countryEmoji={country?.emoji}
      prefixDigits={prefixDigits}
      prefixInvalid={prefixInvalid}
      disabled={disabled}
      countryPickerOpen={countryPickerOpen}
      activeSlot={activeSlot}
      maxPrefixDisplayLength={maxPrefixDisplayLength}
      prefixInputRef={prefixInputRef}
      onOpenCountryPicker={openCountryPicker}
      onPrefixFocus={() => setActiveSlot("prefix")}
      onPrefixKeyDown={handlePrefixKeyDown}
      onPrefixInput={resetPrefixDisplay}
      selectCountryLabel={t.selectCountry}
    />
  );

  return (
    <ClickAwayListener onClickAway={closeCountryPicker}>
      <Box sx={{ width: fullWidth ? "100%" : undefined }}>
        <Box sx={{ position: "relative" }}>
          <LtrScope>
            <PhoneTextField
              fullWidth={fullWidth}
              required={required}
              disabled={disabled}
              showError={showError}
              resolvedLabel={resolvedLabel}
              placeholder={placeholder}
              nationalDisplay={nationalDisplay}
              onBlurAction={onBlurAction}
              nationalInputRef={nationalInputRef}
              activeSlot={activeSlot}
              countryPickerOpen={countryPickerOpen}
              onNationalKeyDown={handleNationalKeyDown}
              onNationalFocus={() => {
                closeCountryPicker();
                setActiveSlot("national");
              }}
              onNationalInput={resetNationalDisplay}
              onNationalSelect={handleNationalSelect}
              startAdornment={startAdornment}
            />
          </LtrScope>
          {countryPickerOpen ? (
            <PhoneCountryPickerMobile country={country} onSelectAction={handleCountrySelect} />
          ) : null}
        </Box>
        {!countryPickerOpen && resolvedHelperText ? (
          <FormHelperText error={showError}>{resolvedHelperText}</FormHelperText>
        ) : null}
      </Box>
    </ClickAwayListener>
  );
};
