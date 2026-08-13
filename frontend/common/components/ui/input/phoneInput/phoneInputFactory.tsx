"use client";

import type * as React from "react";
import {
  PhoneInputShared,
  type PhoneInputSharedProps,
  type PhoneInputSlotProps,
} from "@/frontend/common/components/ui/input/phoneInput/PhoneInputShared";

/**
 * Factory for creating tier-specific `PhoneInput` variants.
 *
 * Common, desktop, and mobile variants share the same props-destructure
 * and forward-to-`PhoneInputShared` structure.  Each differs only in the
 * five slot props (`LocaleEmojiComponent`, `PhoneCountryPickerComponent`,
 * `PrefixInputElement`, `resolveHelperText`, `useOnNationalInput`).
 *
 * Extracting the destructure+forward block into this factory eliminates the
 * jscpd-detected duplication across the three tier variants.
 */
export function createPhoneInputVariant(slots: Readonly<PhoneInputSlotProps>): React.FC<PhoneInputSharedProps> {
  const PhoneInputVariant: React.FC<PhoneInputSharedProps> = ({
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
  }: Readonly<PhoneInputSharedProps>): React.ReactNode => (
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
      LocaleEmojiComponent={slots.LocaleEmojiComponent}
      PhoneCountryPickerComponent={slots.PhoneCountryPickerComponent}
      PrefixInputElement={slots.PrefixInputElement}
      resolveHelperText={slots.resolveHelperText}
      useOnNationalInput={slots.useOnNationalInput}
    />
  );
  return PhoneInputVariant;
}
