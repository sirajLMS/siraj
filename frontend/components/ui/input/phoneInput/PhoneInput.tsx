"use client";

import Box from "@mui/material/Box";
import ClickAwayListener from "@mui/material/ClickAwayListener";
import FormHelperText from "@mui/material/FormHelperText";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import { useTranslations } from "next-intl";
import type * as React from "react";
import { useCallback, useState } from "react";
import { LocaleEmoji } from "@/frontend/components/ui/display";
import { PhoneCountryPicker } from "@/frontend/components/ui/input/phoneInput/PhoneCountryPicker";
import { usePhoneInput } from "@/frontend/components/ui/input/phoneInput/usePhoneInput";
import { LtrScope } from "@/frontend/providers/theme/LtrScope";

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
  readonly hideLabel?: boolean;
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
  hideLabel,
}: PhoneInputProps): React.ReactNode => {
  const t = useTranslations("ui.phoneInput");
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
    ? t("invalidPrefix")
    : showRequiredError
      ? t("required")
      : phoneInvalid
        ? t("invalidPhone")
        : helperText;
  const resolvedLabel = label ?? t("label");

  return (
    <ClickAwayListener onClickAway={closeCountryPicker}>
      <Box sx={{ width: fullWidth ? "100%" : undefined }}>
        <Box sx={{ position: "relative" }}>
          <LtrScope>
            <TextField
              fullWidth={fullWidth}
              required={required}
              disabled={disabled}
              error={showError}
              label={hideLabel ? undefined : resolvedLabel}
              placeholder={placeholder}
              value={nationalDisplay}
              onChange={() => {}}
              onBlur={onBlurAction}
              onKeyDown={handleNationalKeyDown}
              onFocus={() => {
                closeCountryPicker();
                setActiveSlot("national");
              }}
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
                input: {
                  startAdornment: (
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
                        aria-label={t("selectCountry")}
                        aria-expanded={countryPickerOpen}
                        onClick={openCountryPicker}
                        disabled={disabled}
                        size="small"
                        sx={{
                          p: 0.25,
                          flexShrink: 0,
                          paddingInlineEnd: 0.5,
                          marginInlineEnd: 0,
                        }}
                      >
                        <LocaleEmoji emoji={country?.emoji ?? "🌐"} />
                      </IconButton>
                      <Box
                        component="input"
                        ref={prefixInputRef}
                        value={`+${prefixDigits}`}
                        maxLength={maxPrefixDisplayLength}
                        disabled={disabled}
                        onFocus={() => setActiveSlot("prefix")}
                        onKeyDown={handlePrefixKeyDown}
                        onInput={resetPrefixDisplay}
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
                  ),
                },
                htmlInput: {
                  onInput: resetNationalDisplay,
                  onSelect: handleNationalSelect,
                  autoComplete: "tel",
                  inputMode: "tel",
                  "aria-label": "Phone number",
                },
              }}
            />
          </LtrScope>
          {countryPickerOpen ? <PhoneCountryPicker country={country} onSelectAction={handleCountrySelect} /> : null}
        </Box>
        {!countryPickerOpen && resolvedHelperText ? (
          <FormHelperText error={showError}>{resolvedHelperText}</FormHelperText>
        ) : null}
      </Box>
    </ClickAwayListener>
  );
};
