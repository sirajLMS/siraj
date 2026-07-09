"use client";

import Box from "@mui/material/Box";
import ClickAwayListener from "@mui/material/ClickAwayListener";
import FormControl from "@mui/material/FormControl";
import FormHelperText from "@mui/material/FormHelperText";
import IconButton from "@mui/material/IconButton";
import InputLabel from "@mui/material/InputLabel";
import { useTranslations } from "next-intl";
import type * as React from "react";
import { useCallback, useId, useState } from "react";
import { LocaleEmoji } from "@/frontend/components/ui/display";
import { PhoneCountryPicker } from "@/frontend/components/ui/input/phoneInput/PhoneCountryPicker";
import { usePhoneInput } from "@/frontend/components/ui/input/phoneInput/usePhoneInput";

export type PhoneInputProps = {
  readonly value: string | null;
  readonly onChangeAction: (e164: string | null) => void;
  readonly onBlurAction?: () => void;
  readonly defaultRegion?: string;
  readonly label?: string;
  readonly placeholder?: string;
  readonly required?: boolean;
  readonly disabled?: boolean;
  readonly fullWidth?: boolean;
  readonly error?: boolean;
  readonly helperText?: string;
};

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

export const PhoneInput: React.FC<PhoneInputProps> = ({
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
}: PhoneInputProps): React.ReactNode => {
  const t = useTranslations("ui.phoneInput");
  const fieldId = useId();
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
    ? t("invalidPrefix")
    : showRequiredError
      ? t("required")
      : phoneInvalid
        ? t("invalidPhone")
        : helperText;
  const resolvedLabel = label ?? t("label");

  return (
    <FormControl fullWidth={fullWidth} required={required} disabled={disabled} error={showError} variant="outlined">
      <InputLabel htmlFor={fieldId} shrink>
        {resolvedLabel}
      </InputLabel>
      <ClickAwayListener onClickAway={closeCountryPicker}>
        <Box sx={{ position: "relative", mt: 1 }}>
          <Box
            id={fieldId}
            role="group"
            aria-label={resolvedLabel}
            onBlur={onBlurAction}
            dir="ltr"
            sx={theme => ({
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              minHeight: 56,
              px: 1.5,
              py: 1,
              borderWidth: 1,
              borderStyle: "solid",
              borderColor: showError ? theme.palette.error.main : theme.palette.outlineVariant,
              borderRadius: 1,
              opacity: disabled ? theme.palette.action.disabledOpacity : 1,
              pointerEvents: disabled ? "none" : "auto",
              transition: theme.transitions.create(["border-color"]),
              "&:focus-within": {
                borderColor: showError ? theme.palette.error.main : theme.palette.primary.main,
                borderWidth: 2,
                px: "11.5px",
                py: "7px",
              },
            })}
          >
            <IconButton
              aria-label={t("selectCountry")}
              aria-expanded={countryPickerOpen}
              onClick={openCountryPicker}
              disabled={disabled}
              edge="start"
              size="small"
              sx={{ p: 0.25, flexShrink: 0 }}
            >
              <LocaleEmoji emoji={country?.emoji ?? "🌐"} />
            </IconButton>
            <Box
              component="input"
              ref={prefixInputRef}
              value={`+${prefixDigits}`}
              disabled={disabled}
              onFocus={() => setActiveSlot("prefix")}
              onKeyDown={handlePrefixKeyDown}
              onInput={resetPrefixDisplay}
              aria-label="Country calling code"
              sx={{
                ...slotInputSx,
                width: `${Math.max(prefixDigits.length + 1, 2)}ch`,
                flexShrink: 0,
                color: prefixInvalid ? "error.main" : "inherit",
                fontWeight: activeSlot === "prefix" ? 600 : 400,
              }}
            />
            <Box
              component="input"
              ref={nationalInputRef}
              value={nationalDisplay}
              disabled={disabled}
              placeholder={placeholder}
              onFocus={() => {
                closeCountryPicker();
                setActiveSlot("national");
              }}
              onKeyDown={handleNationalKeyDown}
              onSelect={handleNationalSelect}
              onInput={resetNationalDisplay}
              aria-label="Phone number"
              autoComplete="tel"
              inputMode="tel"
              sx={{
                ...slotInputSx,
                flex: 1,
                fontWeight: activeSlot === "national" ? 600 : 400,
              }}
            />
          </Box>
          {countryPickerOpen ? <PhoneCountryPicker country={country} onSelectAction={handleCountrySelect} /> : null}
        </Box>
      </ClickAwayListener>
      {resolvedHelperText ? <FormHelperText>{resolvedHelperText}</FormHelperText> : null}
    </FormControl>
  );
};
