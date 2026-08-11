"use client";

import { styled } from "@mui/material/styles";
import type * as React from "react";
import type { PhoneInputSlotProps } from "@/frontend/common/components/ui/input/phoneInput/PhoneInputShared";
import { PhoneInputShared } from "@/frontend/common/components/ui/input/phoneInput/PhoneInputShared";
import { DesktopLocaleEmoji } from "@/frontend/desktop/components/ui/display/localeEmoji";
import { PhoneCountryPickerDesktop } from "@/frontend/desktop/components/ui/input/phoneInput/phoneCountryPicker.desktop";

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

const StyledInput = styled("input")();

const desktopResolveHelperText: PhoneInputSlotProps["resolveHelperText"] = ({
  prefixInvalid,
  showRequiredError,
  phoneInvalid,
  helperText,
  t,
}) => {
  if (prefixInvalid) {
    return t.invalidPrefix;
  }
  if (showRequiredError) {
    return t.required;
  }
  if (phoneInvalid) {
    return t.invalidPhone;
  }
  return helperText;
};

export const PhoneInputDesktop: React.FC<PhoneInputProps> = ({
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
}: PhoneInputProps): React.ReactNode => (
  <PhoneInputShared
    value={value}
    onChangeAction={onChangeAction}
    onBlurAction={onBlurAction}
    defaultRegion={defaultRegion}
    label={label}
    placeholder={placeholder}
    required={required}
    disabled={disabled}
    fullWidth={fullWidth}
    error={error}
    helperText={helperText}
    hideLabel={hideLabel}
    LocaleEmojiComponent={DesktopLocaleEmoji}
    PhoneCountryPickerComponent={PhoneCountryPickerDesktop}
    PrefixInputElement={StyledInput}
    resolveHelperText={desktopResolveHelperText}
    useOnNationalInput={false}
  />
);
