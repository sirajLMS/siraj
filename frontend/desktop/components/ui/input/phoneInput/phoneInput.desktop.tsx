"use client";

import { styled } from "@mui/material/styles";
import type * as React from "react";
import type { PhoneInputSharedProps } from "@/frontend/common/components/ui/input/phoneInput/PhoneInputShared";
import { PhoneInputShared } from "@/frontend/common/components/ui/input/phoneInput/PhoneInputShared";
import { createResolveHelperText } from "@/frontend/common/components/ui/input/phoneInput/phoneInputSharedUtils";
import { DesktopLocaleEmoji } from "@/frontend/desktop/components/ui/display/localeEmoji";
import { PhoneCountryPickerDesktop } from "@/frontend/desktop/components/ui/input/phoneInput/phoneCountryPicker.desktop";

export type PhoneInputProps = PhoneInputSharedProps;

const StyledInput = styled("input")();

const desktopResolveHelperText = createResolveHelperText(true);

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
