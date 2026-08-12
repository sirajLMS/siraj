"use client";

import type * as React from "react";
import { BoxPrefixInput } from "@/frontend/common/components/ui/input/phoneInput/BoxPrefixInput";
import type { PhoneInputSharedProps } from "@/frontend/common/components/ui/input/phoneInput/PhoneInputShared";
import { PhoneInputShared } from "@/frontend/common/components/ui/input/phoneInput/PhoneInputShared";
import { createResolveHelperText } from "@/frontend/common/components/ui/input/phoneInput/phoneInputSharedUtils";
import { MobileLocaleEmoji } from "@/frontend/mobile/components/ui/display/localeEmoji";
import { PhoneCountryPickerMobile } from "@/frontend/mobile/components/ui/input/phoneInput/phoneCountryPicker.mobile";

export type PhoneInputProps = PhoneInputSharedProps;

const mobileResolveHelperText = createResolveHelperText(true);

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
    LocaleEmojiComponent={MobileLocaleEmoji}
    PhoneCountryPickerComponent={PhoneCountryPickerMobile}
    PrefixInputElement={BoxPrefixInput}
    resolveHelperText={mobileResolveHelperText}
    useOnNationalInput={false}
  />
);
